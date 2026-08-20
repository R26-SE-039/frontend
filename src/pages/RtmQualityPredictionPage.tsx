import { BrainCircuit, CheckCircle2, Database, FlaskConical, Sparkles, TestTube2, XCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import {
  getC2QualityDatasetInfo,
  getC2QualityDatasetSamples,
  getC2QualityModelInfo,
  getC2QualityPredictions,
  getComponent2Status,
  getProjectSettings,
} from '../api/rtmApi';
import type {
  C2QualityDatasetInfoOut,
  C2QualityModelInfoOut,
  C2QualityPredictionOut,
  C2StatusOut,
} from '../types/rtm';

const IMPORTANCE_COLORS = ['#6366f1', '#818cf8', '#a5b4fc', '#c7d2fe', '#e0e7ff'];
const QUALITY_LABEL_COLORS: Record<string, string> = { High: '#22c55e', Medium: '#f59e0b', Low: '#ef4444' };
const QUALITY_LABEL_BADGE: Record<string, string> = {
  High: 'bg-green-100 text-green-700',
  Medium: 'bg-amber-100 text-amber-700',
  Low: 'bg-red-100 text-red-700',
};

// Execution outcome (PASS/FAIL from Component 2) is shown as a distinct,
// clearly-separate signal from the model's own High/Medium/Low quality
// prediction — conflating the two would defeat the point of this research
// pipeline (see the pipeline card's note).
const EXECUTION_RESULT: Record<
  string,
  { label: string; hint: string; cls: string; icon: React.ComponentType<{ size?: number }> | null }
> = {
  approved: { label: 'Good', hint: 'Passed', cls: 'bg-green-100 text-green-700', icon: CheckCircle2 },
  rejected: { label: 'Poor', hint: 'Failed', cls: 'bg-red-100 text-red-700', icon: XCircle },
  pending: { label: 'Not Run Yet', hint: 'Pending', cls: 'bg-slate-100 text-slate-500', icon: null },
};

type FeatureKey = keyof C2QualityPredictionOut['features'];

const FEATURE_META: [FeatureKey, string, (v: number) => string][] = [
  ['completeness_score', 'Completeness', (v) => `${v.toFixed(0)}/100`],
  ['requirement_coverage', 'Requirement Coverage', (v) => `${v.toFixed(0)}/100`],
  ['specificity_score', 'Specificity', (v) => `${v.toFixed(0)}/100`],
  ['ambiguity_score', 'Ambiguity', (v) => `${v.toFixed(0)}/100 (lower is better)`],
  ['has_expected_result', 'Has Expected Result', (v) => (v ? 'Yes' : 'No')],
  ['has_preconditions', 'Has Preconditions', (v) => (v ? 'Yes' : 'No')],
  ['has_test_steps', 'Has Test Steps', (v) => (v ? 'Yes' : 'No')],
  ['requirement_linked', 'Linked To A Requirement', (v) => (v ? 'Yes' : 'No')],
  ['description_length', 'Description Length', (v) => `${v} chars`],
  ['test_result', 'Execution Signal (feature only)', (v) => (v === 1 ? 'Passed' : v === 0 ? 'Failed' : 'Pending')],
];

function PipelineFlow({ steps }: { steps: string[] }) {
  return (
    <div className="flex flex-wrap items-center justify-center gap-1.5">
      {steps.map((step, i) => (
        <div key={step} className="flex items-center gap-1.5">
          <span className="rounded-lg border border-indigo-100 bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-700">
            {step}
          </span>
          {i < steps.length - 1 && <span className="text-slate-300">→</span>}
        </div>
      ))}
    </div>
  );
}

function MetricTile({ label, value, hint }: { label: string; value: string | number; hint?: string }) {
  return (
    <div className="rounded-xl bg-slate-50 px-3.5 py-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</p>
      <p className="mt-1 text-xl font-bold text-[#1e1b4b]">{value}</p>
      {hint ? <p className="mt-0.5 text-[11px] text-slate-400">{hint}</p> : null}
    </div>
  );
}

interface CardProps {
  title?: string;
  icon?: React.ComponentType<{ size?: number; className?: string }>;
  children: React.ReactNode;
}

function Card({ title, icon: Icon, children }: CardProps) {
  return (
    <div className="rounded-2xl bg-white p-6 shadow-sm">
      {title ? (
        <div className="mb-3 flex items-center gap-2">
          {Icon ? <Icon size={18} className="text-indigo-600" /> : null}
          <h2 className="text-base font-bold text-[#1e1b4b]">{title}</h2>
        </div>
      ) : null}
      {children}
    </div>
  );
}

function QualityLabelBadge({ label }: { label: string | null | undefined }) {
  return (
    <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${QUALITY_LABEL_BADGE[label || ''] || 'bg-slate-100 text-slate-500'}`}>
      {label || '—'}
    </span>
  );
}

function ExecutionResultBadge({ status }: { status: string }) {
  const info = EXECUTION_RESULT[status] || EXECUTION_RESULT.pending;
  const Icon = info.icon;
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${info.cls}`}>
      {Icon ? <Icon size={13} /> : null} {info.label}
    </span>
  );
}

function ProbabilityBranches({ probabilities }: { probabilities: Record<string, number> | undefined }) {
  const labels = ['High', 'Medium', 'Low'];
  return (
    <div>
      <div className="flex items-center justify-center gap-2 text-xs font-semibold text-indigo-700">
        <span className="rounded-lg border border-indigo-100 bg-indigo-50 px-3 py-1.5">Quality Probability</span>
      </div>
      <div className="mt-1 flex justify-center text-slate-300">↓</div>
      <div className="mt-1 grid grid-cols-3 gap-3">
        {labels.map((label) => {
          const pct = (probabilities?.[label] || 0) * 100;
          return (
            <div key={label} className="text-center">
              <div className="mx-auto h-24 w-full max-w-[64px] overflow-hidden rounded-lg bg-slate-100">
                <div
                  className="w-full rounded-t-lg transition-all"
                  style={{
                    height: `${pct}%`,
                    marginTop: `${100 - pct}%`,
                    backgroundColor: QUALITY_LABEL_COLORS[label],
                  }}
                />
              </div>
              <p className="mt-1.5 text-xs font-semibold" style={{ color: QUALITY_LABEL_COLORS[label] }}>
                {label}
              </p>
              <p className="text-[11px] text-slate-400">{pct.toFixed(1)}%</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function PredictSelector({
  predictions,
  c2ModelInfo,
}: {
  predictions: C2QualityPredictionOut[];
  c2ModelInfo: C2QualityModelInfoOut | null;
}) {
  const [selectedId, setSelectedId] = useState('');
  const selected = predictions.find((p) => p.test_case_id === selectedId) || null;

  const importanceByFeature = Object.fromEntries(
    (c2ModelInfo?.feature_importances || []).map((f) => [f.feature, f.importance])
  );
  const topFactors = selected
    ? FEATURE_META.map(([key, label, format]) => ({
        key,
        label,
        value: selected.features[key],
        display: format(selected.features[key] as number),
        importance: importanceByFeature[key] ?? 0,
      }))
        .sort((a, b) => b.importance - a.importance)
        .slice(0, 5)
    : [];

  return (
    <Card title="Predict a test case's quality" icon={Sparkles}>
      <label className="mb-1 block text-sm font-semibold text-slate-600">Select a test case</label>
      <select
        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
        value={selectedId}
        onChange={(e) => setSelectedId(e.target.value)}
      >
        <option value="">Choose a test case…</option>
        {predictions.map((p) => (
          <option key={p.test_case_id} value={p.test_case_id}>
            {p.title}
          </option>
        ))}
      </select>

      {selected && (
        <div className="mt-5 space-y-5">
          <div className="flex flex-wrap items-start justify-between gap-4 rounded-xl bg-slate-50 p-4">
            <div>
              <p className="text-sm font-semibold text-slate-700">{selected.title}</p>
              <div className="mt-1.5 flex items-center gap-2">
                <span className="text-xs text-slate-400">Execution result:</span>
                <ExecutionResultBadge status={selected.status} />
              </div>
            </div>
            <div className="text-right">
              <p className="text-3xl font-extrabold text-indigo-600">
                {selected.quality_score.toFixed(1)}
                <span className="text-base font-medium text-slate-400">/100</span>
              </p>
              <p className="text-xs text-slate-400">Quality Score</p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="rounded-xl bg-slate-50 px-3.5 py-3 text-center">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Predicted Quality</p>
              <div className="mt-1.5 flex justify-center">
                <QualityLabelBadge label={selected.predicted_label} />
              </div>
            </div>
            <div className="rounded-xl bg-slate-50 px-3.5 py-3 text-center">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Confidence</p>
              <p className="mt-1 text-xl font-bold text-[#1e1b4b]">
                {(Math.max(0, ...Object.values(selected.probabilities || {})) * 100).toFixed(0)}%
              </p>
            </div>
            <div className="rounded-xl bg-slate-50 px-3.5 py-3 text-center">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Method</p>
              <p className="mt-1 text-sm font-semibold text-slate-700">
                {selected.method === 'random_forest' ? 'Random Forest' : 'Weighted formula'}
              </p>
            </div>
          </div>

          <ProbabilityBranches probabilities={selected.probabilities} />

          <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                Key quality factors
              </p>
              <div className="space-y-1.5">
                {FEATURE_META.map(([key, label, format]) => (
                  <div key={key} className="flex items-center justify-between text-sm">
                    <span className="text-slate-500">{label}</span>
                    <span className="font-semibold text-slate-700">{format(selected.features[key] as number)}</span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                Main factors influencing this prediction
              </p>
              <div className="space-y-2">
                {topFactors.map((f) => (
                  <div key={f.key}>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-600">{f.label}</span>
                      <span className="font-semibold text-slate-700">{f.display}</span>
                    </div>
                    <div className="mt-0.5 h-1.5 rounded-full bg-slate-100">
                      <div
                        className="h-1.5 rounded-full bg-indigo-500"
                        style={{ width: `${Math.round(f.importance * 100 * 4)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
              <p className="mt-2 text-[11px] text-slate-400">
                Ranked by the model's learned feature importance — higher bars mattered more across all
                training examples, not just this one.
              </p>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}

interface C2QualityTabProps {
  c2Status: C2StatusOut | null;
  linkedProjectId: string;
  c2ModelInfo: C2QualityModelInfoOut | null;
  c2DatasetInfo: C2QualityDatasetInfoOut | null;
  dropdownOptions: C2QualityPredictionOut[];
  loading: boolean;
  error: string | null;
}

function C2QualityTab({
  c2Status,
  linkedProjectId,
  c2ModelInfo,
  c2DatasetInfo,
  dropdownOptions,
  loading,
  error,
}: C2QualityTabProps) {
  return (
    <div className="space-y-6">
      <Card title="Prediction pipeline" icon={TestTube2}>
        <PipelineFlow
          steps={[
            'Test Case (Component 2)',
            'Feature Extraction',
            'Feature Preprocessing',
            'Random Forest',
            'Quality Probability',
            'High / Medium / Low',
          ]}
        />
        <p className="mt-3 text-xs text-slate-400">
          Trained to predict test-case <span className="font-semibold text-slate-600">design quality</span> —
          completeness, requirement coverage, specificity, clarity — never PASS/FAIL execution outcome.
          PASS/FAIL is included only as one of ten input features (see feature importances below, where it
          ranks lowest).
        </p>
      </Card>

      {dropdownOptions.length === 0 ? (
        <Card>
          <p className="text-sm text-slate-400">
            No test cases available yet — link a Component 2 project from the RTM Matrix page, or train
            the quality model (<code className="rounded bg-slate-100 px-1">python -m app.ml.c2_train</code>)
            to populate this list.
          </p>
        </Card>
      ) : (
        <>
          {!c2Status?.connected && (
            <p className="mb-2 text-xs text-slate-400">
              Component 2 isn't reachable right now — showing dataset-derived test cases only.
            </p>
          )}
          {c2Status?.connected && !linkedProjectId && (
            <p className="mb-2 text-xs text-slate-400">
              No Component 2 project linked yet — showing dataset-derived test cases only.
            </p>
          )}
          {c2Status?.connected && linkedProjectId && loading && (
            <p className="mb-2 text-xs text-slate-400">Loading live test cases…</p>
          )}
          {error && <p className="mb-2 text-xs text-red-500">{error}</p>}
          <PredictSelector predictions={dropdownOptions} c2ModelInfo={c2ModelInfo} />
        </>
      )}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <Card title="Dataset" icon={Database}>
          {!c2DatasetInfo ? (
            <p className="text-sm text-slate-400">Loading…</p>
          ) : !c2DatasetInfo.available ? (
            <p className="text-sm text-amber-600">
              No dataset yet — run <code className="rounded bg-slate-100 px-1">python -m app.ml.c2_dataset</code>.
            </p>
          ) : (
            <>
              <MetricTile label="Total rows" value={c2DatasetInfo.n_rows} />
              <div className="mt-4 h-40">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={c2DatasetInfo.label_distribution} layout="vertical" margin={{ left: 10, right: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                    <XAxis type="number" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                    <YAxis type="category" dataKey="label" width={60} tick={{ fontSize: 12, fill: '#334155' }} />
                    <Tooltip cursor={{ fill: '#f8fafc' }} />
                    <Bar dataKey="count" radius={[0, 6, 6, 0]} barSize={22}>
                      {c2DatasetInfo.label_distribution.map((entry) => (
                        <Cell key={entry.label} fill={QUALITY_LABEL_COLORS[entry.label]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </>
          )}
        </Card>

        <Card title="Model" icon={BrainCircuit}>
          {!c2ModelInfo ? (
            <p className="text-sm text-slate-400">Loading…</p>
          ) : !c2ModelInfo.trained ? (
            <p className="text-sm text-amber-600">{c2ModelInfo.notes}</p>
          ) : (
            <>
              <p className="text-sm text-slate-500">{c2ModelInfo.algorithm}</p>
              <div className="mt-3 flex flex-wrap gap-1.5 text-xs">
                {Object.entries(c2ModelInfo.hyperparameters).map(([k, v]) => (
                  <span key={k} className="rounded-full bg-indigo-50 px-2.5 py-1 font-mono text-indigo-600">
                    {k}={String(v)}
                  </span>
                ))}
              </div>
              <div className="mt-4 grid grid-cols-3 gap-2">
                <MetricTile label="Accuracy" value={`${(c2ModelInfo.accuracy * 100).toFixed(1)}%`} hint="held-out test" />
                <MetricTile label="Macro F1" value={c2ModelInfo.f1_macro.toFixed(3)} />
                <MetricTile
                  label="5-fold CV acc."
                  value={`${(c2ModelInfo.cv_accuracy_mean * 100).toFixed(1)}%`}
                  hint={`± ${(c2ModelInfo.cv_accuracy_std * 100).toFixed(1)}%`}
                />
              </div>
              <MetricTile
                label="Train / test split"
                value={`${c2ModelInfo.training_samples} / ${c2ModelInfo.test_samples}`}
              />
            </>
          )}
        </Card>
      </div>

      {c2ModelInfo?.trained && (
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          <Card title="Feature importances">
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={[...c2ModelInfo.feature_importances]
                    .sort((a, b) => b.importance - a.importance)
                    .map((f) => ({ ...f, importancePct: Math.round(f.importance * 1000) / 10 }))}
                  layout="vertical"
                  margin={{ left: 10, right: 20 }}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                  <XAxis type="number" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                  <YAxis type="category" dataKey="label" width={130} tick={{ fontSize: 11, fill: '#334155' }} />
                  <Tooltip formatter={(v) => `${v}%`} cursor={{ fill: '#f8fafc' }} />
                  <Bar dataKey="importancePct" name="importance %" radius={[0, 6, 6, 0]} barSize={14}>
                    {c2ModelInfo.feature_importances.map((entry, i) => (
                      <Cell key={entry.feature} fill={IMPORTANCE_COLORS[i % IMPORTANCE_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <p className="mt-2 text-xs text-slate-400">
              "Test Result (Pass/Fail)" ranking lowest is the key research check: quality is being learned from
              test-design characteristics, not execution outcome.
            </p>
          </Card>

          <Card title="Confusion matrix (held-out test set)">
            <table className="w-full text-center text-sm">
              <thead>
                <tr className="text-xs text-slate-400">
                  <th></th>
                  {c2ModelInfo.confusion_matrix_labels.map((l) => (
                    <th key={l} className="pb-1">Predicted {l}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {c2ModelInfo.confusion_matrix.map((row, i) => (
                  <tr key={i}>
                    <td className="pr-2 text-right text-xs text-slate-400">
                      Actual {c2ModelInfo.confusion_matrix_labels[i]}
                    </td>
                    {row.map((v, j) => (
                      <td
                        key={j}
                        className={`rounded py-2 font-semibold ${i === j ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'}`}
                      >
                        {v}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="mt-3 space-y-1">
              {c2ModelInfo.per_class_metrics.map((m) => (
                <div key={m.label} className="flex items-center justify-between text-xs text-slate-500">
                  <span className="font-semibold text-slate-700">{m.label}</span>
                  <span>
                    precision {m.precision.toFixed(2)} · recall {m.recall.toFixed(2)} · f1 {m.f1.toFixed(2)} ·
                    n={m.support}
                  </span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

export default function RtmQualityPredictionPage() {
  const [c2Status, setC2Status] = useState<C2StatusOut | null>(null);
  const [c2ProjectId, setC2ProjectId] = useState('');
  const [c2IterationId, setC2IterationId] = useState('');

  const [c2ModelInfo, setC2ModelInfo] = useState<C2QualityModelInfoOut | null>(null);
  const [c2DatasetInfo, setC2DatasetInfo] = useState<C2QualityDatasetInfoOut | null>(null);
  const [c2Predictions, setC2Predictions] = useState<C2QualityPredictionOut[]>([]);
  const [c2PredictionsLoading, setC2PredictionsLoading] = useState(false);
  const [c2PredictionsError, setC2PredictionsError] = useState<string | null>(null);
  const [c2DatasetSamples, setC2DatasetSamples] = useState<C2QualityPredictionOut[]>([]);

  useEffect(() => {
    getC2QualityModelInfo()
      .then(setC2ModelInfo)
      .catch(() => setC2ModelInfo({ trained: false, notes: '' } as C2QualityModelInfoOut));
    getC2QualityDatasetInfo()
      .then(setC2DatasetInfo)
      .catch(() => setC2DatasetInfo({ available: false } as C2QualityDatasetInfoOut));
    getC2QualityDatasetSamples(15)
      .then(setC2DatasetSamples)
      .catch(() => setC2DatasetSamples([]));
    getProjectSettings()
      .then((s) => {
        setC2ProjectId(s.component2_project_id || '');
        setC2IterationId(s.component1_iteration_id || '');
      })
      .catch(() => {});
    getComponent2Status()
      .then(setC2Status)
      .catch(() => setC2Status({ connected: false, base_url: '' }));
  }, []);

  useEffect(() => {
    if (!c2Status?.connected || !c2ProjectId) {
      setC2Predictions([]);
      return;
    }
    setC2PredictionsLoading(true);
    getC2QualityPredictions(c2ProjectId, c2IterationId || undefined)
      .then((data) => {
        setC2Predictions(data);
        setC2PredictionsError(null);
      })
      .catch((e) => {
        setC2Predictions([]);
        setC2PredictionsError(e?.response?.data?.detail || 'Failed to load Component 2 test cases.');
      })
      .finally(() => setC2PredictionsLoading(false));
  }, [c2Status?.connected, c2ProjectId, c2IterationId]);

  return (
    <div>
      <div className="flex items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600">
          <FlaskConical size={20} />
        </span>
        <div>
          <h1 className="text-3xl font-extrabold text-[#1e1b4b]">Quality Prediction</h1>
          <p className="text-slate-500">
            Component 2 test-case quality, predicted by a Random Forest classifier
          </p>
        </div>
      </div>

      <div className="mt-6">
        <C2QualityTab
          c2Status={c2Status}
          linkedProjectId={c2ProjectId}
          c2ModelInfo={c2ModelInfo}
          c2DatasetInfo={c2DatasetInfo}
          dropdownOptions={[...c2Predictions, ...c2DatasetSamples]}
          loading={c2PredictionsLoading}
          error={c2PredictionsError}
        />
      </div>
    </div>
  );
}
