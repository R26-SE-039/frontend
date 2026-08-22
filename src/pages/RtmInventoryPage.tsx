import { CheckCircle2, ClipboardList, Clock, TestTube2, TrendingUp, XCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import {
  getC2QualityDatasetSamples,
  getC2QualityModelInfo,
  getC2QualityPredictions,
  getComponent2Status,
  getGeneratedGapTestCases,
  getProjectSettings,
} from '../api/rtmApi';
import type { C2QualityModelInfoOut, C2QualityPredictionOut, C2StatusOut } from '../types/rtm';
import { extractGwtSteps } from '../utils/gherkin';

const QUALITY_LABEL_BADGE: Record<string, string> = {
  High: 'bg-green-100 text-green-700',
  Medium: 'bg-amber-100 text-amber-700',
  Low: 'bg-red-100 text-red-700',
};

function QualityLabelBadge({ label }: { label: string | null | undefined }) {
  if (!label) return <span className="text-slate-400">—</span>;
  return (
    <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${QUALITY_LABEL_BADGE[label] || 'bg-slate-100 text-slate-500'}`}>
      {label}
    </span>
  );
}

const TEST_RESULT_BADGE: Record<string, { label: string; cls: string; icon: React.ComponentType<{ size?: number }> }> = {
  approved: { label: 'Pass', cls: 'bg-green-100 text-green-700', icon: CheckCircle2 },
  rejected: { label: 'Fail', cls: 'bg-red-100 text-red-700', icon: XCircle },
  pending: { label: 'Pending', cls: 'bg-slate-100 text-slate-500', icon: Clock },
};

function TestResultBadge({ status }: { status: string }) {
  const info = TEST_RESULT_BADGE[status] || TEST_RESULT_BADGE.pending;
  const Icon = info.icon;
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${info.cls}`}>
      <Icon size={13} /> {info.label}
    </span>
  );
}

function PredictionStatusBadge({ method }: { method: string }) {
  const isMl = method === 'random_forest';
  return (
    <span
      className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
        isMl ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-500'
      }`}
    >
      {isMl ? 'ML Predicted' : 'Formula-based'}
    </span>
  );
}

const FACTOR_LABELS: Record<string, string> = {
  completeness_score: 'Completeness',
  requirement_coverage: 'Req. Coverage',
  specificity_score: 'Specificity',
  ambiguity_score: 'Ambiguity',
  has_expected_result: 'Expected Result',
  has_preconditions: 'Preconditions',
  has_test_steps: 'Test Steps',
  requirement_linked: 'Req. Linked',
  description_length: 'Description Length',
  test_result: 'Execution Signal',
};

function formatFactorValue(key: string, value: number) {
  if (['has_expected_result', 'has_preconditions', 'has_test_steps', 'requirement_linked'].includes(key)) {
    return value ? 'Yes' : 'No';
  }
  if (key === 'description_length') return `${value} chars`;
  return `${Math.round(value)}`;
}

interface StatCardProps {
  label: string;
  value: string | number;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  accent: { border: string; bg: string; text: string };
}

function StatCard({ label, value, icon: Icon, accent }: StatCardProps) {
  return (
    <div className={`flex items-center gap-4 rounded-2xl border-l-4 bg-white p-5 shadow-sm ${accent.border}`}>
      <span className={`flex h-10 w-10 items-center justify-center rounded-full ${accent.bg}`}>
        <Icon size={18} className={accent.text} />
      </span>
      <div>
        <p className="text-sm text-slate-500">{label}</p>
        <p className="text-xl font-bold text-[#1e1b4b]">{value}</p>
      </div>
    </div>
  );
}

export default function RtmInventoryPage() {
  const [c2Status, setC2Status] = useState<C2StatusOut | null>(null);
  const [c2ProjectId, setC2ProjectId] = useState('');
  const [c2IterationId, setC2IterationId] = useState('');

  const [predictions, setPredictions] = useState<C2QualityPredictionOut[]>([]);
  const [datasetSamples, setDatasetSamples] = useState<C2QualityPredictionOut[]>([]);
  const [generatedRows, setGeneratedRows] = useState<C2QualityPredictionOut[]>([]);
  const [modelInfo, setModelInfo] = useState<C2QualityModelInfoOut | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [settingsLoaded, setSettingsLoaded] = useState(false);

  useEffect(() => {
    getC2QualityModelInfo().then(setModelInfo).catch(() => setModelInfo(null));
    getC2QualityDatasetSamples(15)
      .then(setDatasetSamples)
      .catch(() => setDatasetSamples([]));
    getGeneratedGapTestCases()
      .then((rows) => setGeneratedRows(rows.filter((r) => r.test_case.added_to_inventory).map((r) => r.prediction)))
      .catch(() => setGeneratedRows([]));
    getProjectSettings()
      .then((s) => {
        setC2ProjectId(s.component2_project_id || '');
        setC2IterationId(s.component1_iteration_id || '');
      })
      .catch(() => {})
      .finally(() => setSettingsLoaded(true));
    getComponent2Status()
      .then(setC2Status)
      .catch(() => setC2Status({ connected: false, base_url: '' }));
  }, []);

  useEffect(() => {
    if (!c2Status?.connected || !c2ProjectId) {
      setPredictions([]);
      return;
    }
    setLoading(true);
    getC2QualityPredictions(c2ProjectId, c2IterationId || undefined)
      .then((data) => {
        setPredictions(data);
        setError(null);
      })
      .catch((e) => {
        setPredictions([]);
        setError(e?.response?.data?.detail || 'Failed to load quality predictions.');
      })
      .finally(() => setLoading(false));
  }, [c2Status?.connected, c2ProjectId, c2IterationId]);

  const rows = [...generatedRows, ...predictions, ...datasetSamples];

  // Top 3 factors by the model's global learned importance, so every row
  // highlights the same (most influential) features rather than an
  // arbitrary/inconsistent subset per row.
  const topFactorKeys = [...(modelInfo?.feature_importances || [])]
    .sort((a, b) => b.importance - a.importance)
    .slice(0, 3)
    .map((f) => f.feature as keyof C2QualityPredictionOut['features']);

  const highCount = rows.filter((p) => p.predicted_label === 'High').length;
  const avgConfidence = rows.length
    ? rows.reduce((sum, p) => sum + Math.max(0, ...Object.values(p.probabilities || {})), 0) / rows.length
    : 0;

  return (
    <div>
      <div className="flex items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600">
          <TestTube2 size={20} />
        </span>
        <div>
          <h1 className="text-3xl font-extrabold text-[#1e1b4b]">Test Inventory</h1>
          <p className="mt-1 text-slate-500">
            Every test case's ML-predicted quality, generated by the Quality Prediction page's Random
            Forest model.
          </p>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-3">
        <StatCard
          label="Total Test Cases"
          value={rows.length}
          icon={ClipboardList}
          accent={{ border: 'border-blue-400', bg: 'bg-blue-50', text: 'text-blue-500' }}
        />
        <StatCard
          label="Predicted High Quality"
          value={rows.length ? `${highCount} (${Math.round((highCount / rows.length) * 100)}%)` : '—'}
          icon={TrendingUp}
          accent={{ border: 'border-green-400', bg: 'bg-green-50', text: 'text-green-500' }}
        />
        <StatCard
          label="Avg. Prediction Confidence"
          value={rows.length ? `${(avgConfidence * 100).toFixed(0)}%` : '—'}
          icon={CheckCircle2}
          accent={{ border: 'border-orange-400', bg: 'bg-orange-50', text: 'text-orange-500' }}
        />
      </div>

      <div className="mt-6 overflow-x-auto rounded-2xl bg-white shadow-sm">
        <table className="w-full min-w-[1350px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-slate-100 text-xs uppercase text-slate-500">
              <th className="px-4 py-3 text-left">Test Case</th>
              <th className="px-4 py-3 text-right">Quality Score</th>
              <th className="px-4 py-3 text-left">Quality Level</th>
              <th className="px-4 py-3 text-right">Confidence</th>
              <th className="px-4 py-3 text-left">Test Result</th>
              <th className="px-4 py-3 text-left">Key Quality Factors</th>
              <th className="px-4 py-3 text-left">Prediction Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((p) => {
              const confidence = Math.max(0, ...Object.values(p.probabilities || {}));
              return (
                <tr key={p.test_case_id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50">
                  <td className="max-w-[260px] px-4 py-2.5">
                    {p.description && extractGwtSteps(p.description) ? (
                      <pre className="max-h-20 overflow-y-auto whitespace-pre-wrap font-mono text-[11px] text-slate-600">
                        {extractGwtSteps(p.description)}
                      </pre>
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                  </td>
                  <td className="px-4 py-2.5 text-right font-semibold text-indigo-600">
                    {p.quality_score.toFixed(1)}
                  </td>
                  <td className="px-4 py-2.5">
                    <QualityLabelBadge label={p.predicted_label} />
                  </td>
                  <td className="px-4 py-2.5 text-right text-slate-600">
                    {p.probabilities && Object.keys(p.probabilities).length > 0
                      ? `${(confidence * 100).toFixed(0)}%`
                      : '—'}
                  </td>
                  <td className="px-4 py-2.5">
                    <TestResultBadge status={p.status} />
                  </td>
                  <td className="px-4 py-2.5">
                    <div className="flex flex-wrap gap-1">
                      {topFactorKeys.length === 0 ? (
                        <span className="text-slate-400">—</span>
                      ) : (
                        topFactorKeys.map((key) => (
                          <span
                            key={key}
                            className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600"
                          >
                            {FACTOR_LABELS[key]}: {formatFactorValue(key, p.features[key] as number)}
                          </span>
                        ))
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-2.5">
                    <PredictionStatusBadge method={p.method} />
                  </td>
                </tr>
              );
            })}
            {settingsLoaded && rows.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-slate-400">
                  {!c2Status?.connected
                    ? "Component 2 isn't reachable and no trained dataset is available yet."
                    : !c2ProjectId
                      ? 'Link a Component 2 project from the RTM Matrix page, or train the quality model, to populate this list.'
                      : loading
                        ? 'Loading…'
                        : error || 'No test cases found.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
