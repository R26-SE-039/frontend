import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Clock,
  Sparkles,
  Wand2,
  XCircle,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import {
  getC2QualityDatasetSamples,
  getC2QualityPredictions,
  getComponent1RequirementsWithStories,
  getComponent2Status,
  getProjectSettings,
  improveC2TestCase,
} from '../api/rtmApi';
import type {
  C1RequirementWithStoryOut,
  C2ImproveResponse,
  C2QualityPredictionOut,
  C2StatusOut,
  QualityGapOut,
} from '../types/rtm';
import { extractGwtSteps } from '../utils/gherkin';

const QUALITY_LABEL_COLORS: Record<string, string> = { High: '#22c55e', Medium: '#f59e0b', Low: '#ef4444' };
const QUALITY_LABEL_BADGE: Record<string, string> = {
  High: 'bg-green-100 text-green-700',
  Medium: 'bg-amber-100 text-amber-700',
  Low: 'bg-red-100 text-red-700',
};

function QualityLabelBadge({ label }: { label: string | null | undefined }) {
  return (
    <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${QUALITY_LABEL_BADGE[label || ''] || 'bg-slate-100 text-slate-500'}`}>
      {label || '—'}
    </span>
  );
}

const TEST_RESULT: Record<string, { label: string; cls: string; icon: React.ComponentType<{ size?: number }> }> = {
  approved: { label: 'PASS', cls: 'bg-green-100 text-green-700', icon: CheckCircle2 },
  rejected: { label: 'FAIL', cls: 'bg-red-100 text-red-700', icon: XCircle },
  pending: { label: 'PENDING', cls: 'bg-slate-100 text-slate-500', icon: Clock },
};

function TestResultBadge({ status }: { status: string }) {
  const info = TEST_RESULT[status] || TEST_RESULT.pending;
  const Icon = info.icon;
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${info.cls}`}>
      <Icon size={13} /> {info.label}
    </span>
  );
}

function ShortId({ id }: { id: string | null | undefined }) {
  if (!id) return <span className="text-slate-400">—</span>;
  return (
    <span title={id} className="font-mono text-xs text-slate-600">
      {id.length > 8 ? `${id.slice(0, 8)}…` : id}
    </span>
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

function InfoTile({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-xl bg-slate-50 px-3.5 py-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</p>
      <div className="mt-1 text-sm font-semibold text-[#1e1b4b]">{value}</div>
    </div>
  );
}

function ScoreCard({ label, score, qualityLabel, accent }: { label: string; score: number; qualityLabel: string; accent: string }) {
  return (
    <div className="flex-1 rounded-2xl bg-slate-50 p-5 text-center">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</p>
      <p className="mt-2 text-4xl font-extrabold" style={{ color: accent }}>
        {score.toFixed(1)}
        <span className="text-base font-medium text-slate-400">/100</span>
      </p>
      <div className="mt-2 flex justify-center">
        <QualityLabelBadge label={qualityLabel} />
      </div>
      <div className="mt-3 h-2 rounded-full bg-slate-200">
        <div
          className="h-2 rounded-full transition-all"
          style={{ width: `${Math.max(2, Math.min(100, score))}%`, backgroundColor: accent }}
        />
      </div>
    </div>
  );
}

interface MergedTestCase {
  prediction: C2QualityPredictionOut;
  requirement: C1RequirementWithStoryOut | null;
}

export default function RtmTestImprovementPage() {
  const [c2Status, setC2Status] = useState<C2StatusOut | null>(null);
  const [c2ProjectId, setC2ProjectId] = useState('');
  const [c2IterationId, setC2IterationId] = useState('');

  const [livePredictions, setLivePredictions] = useState<C2QualityPredictionOut[]>([]);
  const [datasetSamples, setDatasetSamples] = useState<C2QualityPredictionOut[]>([]);
  const [requirements, setRequirements] = useState<C1RequirementWithStoryOut[]>([]);

  const [selectedId, setSelectedId] = useState('');
  const [improveResult, setImproveResult] = useState<C2ImproveResponse | null>(null);
  const [improveLoading, setImproveLoading] = useState(false);
  const [improveError, setImproveError] = useState<string | null>(null);
  const [showImproved, setShowImproved] = useState(false);

  useEffect(() => {
    getC2QualityDatasetSamples(15)
      .then(setDatasetSamples)
      .catch(() => setDatasetSamples([]));
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
      setLivePredictions([]);
      return;
    }
    getC2QualityPredictions(c2ProjectId, c2IterationId || undefined)
      .then(setLivePredictions)
      .catch(() => setLivePredictions([]));
  }, [c2Status?.connected, c2ProjectId, c2IterationId]);

  useEffect(() => {
    if (!c2IterationId) {
      setRequirements([]);
      return;
    }
    getComponent1RequirementsWithStories(c2IterationId)
      .then(setRequirements)
      .catch(() => setRequirements([]));
  }, [c2IterationId]);

  const requirementByStoryId = new Map(requirements.map((r) => [r.user_story_id, r]));
  const testCases: MergedTestCase[] = [...livePredictions, ...datasetSamples].map((prediction) => ({
    prediction,
    requirement: requirementByStoryId.get(prediction.story_id) || null,
  }));

  const selected = testCases.find((tc) => tc.prediction.test_case_id === selectedId) || null;

  const handleSelect = (id: string) => {
    setSelectedId(id);
    setImproveResult(null);
    setImproveError(null);
    setShowImproved(false);

    const tc = testCases.find((t) => t.prediction.test_case_id === id);
    if (!tc) return;

    setImproveLoading(true);
    improveC2TestCase({
      title: tc.prediction.title,
      description: tc.prediction.description,
      features: tc.prediction.features,
      quality_score: tc.prediction.quality_score,
      predicted_label: tc.prediction.predicted_label,
      probabilities: tc.prediction.probabilities,
      requirement_text: tc.requirement?.requirement_text || '',
      user_story_title: tc.requirement?.user_story_title || '',
      acceptance_criteria: tc.requirement?.acceptance_criteria || [],
    })
      .then((res) => setImproveResult(res))
      .catch((e) => setImproveError(e?.response?.data?.detail || 'Failed to analyze this test case.'))
      .finally(() => setImproveLoading(false));
  };

  const confidence = selected
    ? Math.max(0, ...Object.values(selected.prediction.probabilities || {}))
    : 0;

  return (
    <div>
      <div className="flex items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600">
          <Wand2 size={20} />
        </span>
        <div>
          <h1 className="text-3xl font-extrabold text-[#1e1b4b]">Intelligent Test Improvement &amp; Recommendations</h1>
          <p className="text-slate-500">
            Goes beyond predicting quality — identifies weaknesses and generates an improved Given/When/Then test case.
          </p>
        </div>
      </div>

      <div className="mt-6 space-y-6">
        <Card icon={Sparkles}>
          <PipelineFlow
            steps={[
              'Test Case',
              'Quality Prediction',
              'Quality Analysis',
              'Identify Weak Areas',
              'Improvement Recommendations',
              'Improved Given/When/Then',
              'Recalculate Quality Score',
            ]}
          />
        </Card>

        <Card title="Select a Test Case" icon={Wand2}>
          <label className="mb-1 block text-sm font-semibold text-slate-600">
            Choose a test case to analyze
          </label>
          <select
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
            value={selectedId}
            onChange={(e) => handleSelect(e.target.value)}
          >
            <option value="">Choose a test case…</option>
            {testCases.map((tc) => {
              const steps = extractGwtSteps(tc.prediction.description);
              const label = steps ? steps.split('\n').join(' | ') : tc.prediction.title;
              const truncated = label.length > 110 ? `${label.slice(0, 110)}…` : label;
              return (
                <option key={tc.prediction.test_case_id} value={tc.prediction.test_case_id}>
                  {truncated}
                </option>
              );
            })}
          </select>
          {testCases.length === 0 && (
            <p className="mt-2 text-xs text-slate-400">
              No test cases available yet — link a Component 2 project from the RTM Matrix page, or train
              the quality model, to populate this list.
            </p>
          )}
        </Card>

        {selected && (
          <>
            <Card title="Test Case Details">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <InfoTile label="Test Case" value={selected.prediction.title} />
                <InfoTile label="User Story ID" value={<ShortId id={selected.requirement?.user_story_id} />} />
                <InfoTile label="User Story Title" value={selected.requirement?.user_story_title || '—'} />
                <InfoTile label="Requirement ID" value={<ShortId id={selected.requirement?.requirement_id} />} />
                <InfoTile
                  label="Requirement Text"
                  value={<span className="line-clamp-3">{selected.requirement?.requirement_text || '—'}</span>}
                />
                <InfoTile label="Current Quality Score" value={`${selected.prediction.quality_score.toFixed(1)}/100`} />
                <InfoTile
                  label="Current Quality Level"
                  value={<QualityLabelBadge label={selected.prediction.predicted_label} />}
                />
                <InfoTile
                  label="Quality Probability / Confidence"
                  value={`${(confidence * 100).toFixed(0)}%`}
                />
                <InfoTile label="Test Result" value={<TestResultBadge status={selected.prediction.status} />} />
              </div>

              <div className="mt-4">
                <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Test Description (Given / When / Then)
                </p>
                <pre className="max-h-40 overflow-y-auto whitespace-pre-wrap rounded-xl bg-slate-50 p-4 font-mono text-xs text-slate-700">
                  {selected.prediction.description}
                </pre>
              </div>
            </Card>

            {improveLoading && (
              <Card>
                <p className="text-sm text-slate-400">Analyzing quality gaps…</p>
              </Card>
            )}
            {improveError && (
              <Card>
                <p className="text-sm text-red-600">{improveError}</p>
              </Card>
            )}

            {improveResult && (
              <>
                <Card title="Quality Gap Analysis" icon={AlertTriangle}>
                  {improveResult.gaps.length === 0 ? (
                    <p className="flex items-center gap-2 text-sm text-green-700">
                      <CheckCircle2 size={16} /> No quality gaps detected — this test case already meets the
                      model's quality bar.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {improveResult.gaps.map((gap) => (
                        <div
                          key={gap.area}
                          className="flex items-start gap-2 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800"
                        >
                          <AlertTriangle size={15} className="mt-0.5 shrink-0" />
                          <span>
                            <span className="font-semibold">{gap.label}</span> — {statusPhrase(gap)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </Card>

                {improveResult.gaps.length > 0 && (
                  <Card title="Intelligent Recommendations">
                    <div className="overflow-x-auto">
                      <table className="w-full min-w-[600px] border-collapse text-left text-sm">
                        <thead>
                          <tr className="border-b border-slate-100 text-xs uppercase text-slate-500">
                            <th className="px-3 py-2">Quality Area</th>
                            <th className="px-3 py-2">Current Status</th>
                            <th className="px-3 py-2">Recommendation</th>
                          </tr>
                        </thead>
                        <tbody>
                          {improveResult.gaps.map((gap) => (
                            <tr key={gap.area} className="border-b border-slate-50 last:border-0">
                              <td className="px-3 py-2.5 font-medium text-slate-700">{gap.label}</td>
                              <td className="px-3 py-2.5 text-slate-600">{gap.status}</td>
                              <td className="px-3 py-2.5 text-slate-600">{gap.recommendation}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </Card>
                )}

                <Card>
                  <div className="flex justify-center">
                    <button
                      type="button"
                      onClick={() => setShowImproved(true)}
                      className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700"
                    >
                      <Wand2 size={15} /> Improve Test Case
                    </button>
                  </div>
                </Card>

                {showImproved && (
                  <Card title="Before vs After Comparison" icon={Sparkles}>
                    <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
                      <div>
                        <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-400">
                          Original
                        </p>
                        <pre className="h-64 overflow-y-auto whitespace-pre-wrap rounded-xl bg-slate-50 p-4 font-mono text-xs text-slate-700">
                          {selected.prediction.description}
                        </pre>
                      </div>
                      <div>
                        <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-400">
                          Improved (Given / When / Then)
                        </p>
                        <pre className="h-64 overflow-y-auto whitespace-pre-wrap rounded-xl bg-indigo-50 p-4 font-mono text-xs text-indigo-900">
                          {improveResult.improved_description}
                        </pre>
                      </div>
                    </div>

                    <div className="mt-6 flex flex-col items-center gap-4 lg:flex-row">
                      <ScoreCard
                        label="Current Quality"
                        score={selected.prediction.quality_score}
                        qualityLabel={selected.prediction.predicted_label}
                        accent={QUALITY_LABEL_COLORS[selected.prediction.predicted_label] || '#94a3b8'}
                      />
                      <ArrowRight size={28} className="shrink-0 text-indigo-400" />
                      <ScoreCard
                        label="Improved Quality"
                        score={improveResult.improved_quality_score}
                        qualityLabel={improveResult.improved_predicted_label}
                        accent={QUALITY_LABEL_COLORS[improveResult.improved_predicted_label] || '#94a3b8'}
                      />
                    </div>
                    <p className="mt-4 text-center text-sm text-slate-500">
                      {improveResult.improved_quality_score >= selected.prediction.quality_score ? (
                        <>
                          <span className="font-semibold text-green-600">
                            +{(improveResult.improved_quality_score - selected.prediction.quality_score).toFixed(1)} points
                          </span>{' '}
                          improvement, scored by the same trained Random Forest model — not a fabricated
                          demo number.
                        </>
                      ) : (
                        'Score recalculated by the same trained Random Forest model.'
                      )}
                    </p>
                  </Card>
                )}
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function statusPhrase(gap: QualityGapOut): string {
  switch (gap.area) {
    case 'has_preconditions':
      return 'Missing Preconditions';
    case 'has_test_steps':
      return 'Test Steps are missing';
    case 'has_expected_result':
      return 'Expected Result is missing';
    case 'specificity_score':
      return gap.status === 'Generic' ? 'Expected Result / Steps are too generic' : `Specificity is low (${gap.status})`;
    case 'ambiguity_score':
      return `Language is ambiguous (${gap.status})`;
    case 'requirement_coverage':
      return `Requirement Coverage is low (${gap.status})`;
    case 'completeness_score':
      return `Test case is incomplete (${gap.status})`;
    case 'requirement_linked':
      return 'Not linked to a requirement';
    default:
      return gap.status;
  }
}
