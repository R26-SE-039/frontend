import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  ClipboardList,
  Eye,
  Layers,
  Search,
  Shield,
  Wand2,
  X,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  addGeneratedGapTestCase,
  generateAllGapTestCases,
  generateGapTestCase,
  getC2CoverageGaps,
  getComponent2Status,
  getProjectSettings,
} from '../api/rtmApi';
import type {
  C2CoverageGapOut,
  C2StatusOut,
  GenerateGapTestCaseRequest,
  GeneratedGapTestCasePredictionOut,
} from '../types/rtm';

const RISK_STYLES: Record<string, { badge: string; dot: string; card: string }> = {
  Critical: { badge: 'bg-red-100 text-red-700', dot: '🔴', card: 'border-l-red-400' },
  Medium: { badge: 'bg-amber-100 text-amber-700', dot: '🟠', card: 'border-l-amber-400' },
  Low: { badge: 'bg-green-100 text-green-700', dot: '🟢', card: 'border-l-green-400' },
};

const RISK_ACTION_LABEL: Record<string, string> = {
  Critical: 'Immediate Action Required',
  Medium: 'Recommended',
  Low: 'Monitor',
};

function RiskBadge({ level }: { level: string }) {
  const style = RISK_STYLES[level] || RISK_STYLES.Low;
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${style.badge}`}>
      {style.dot} {level} — {RISK_ACTION_LABEL[level] || ''}
    </span>
  );
}

const QUALITY_LABEL_BADGE: Record<string, string> = {
  High: 'bg-green-100 text-green-700',
  Medium: 'bg-amber-100 text-amber-700',
  Low: 'bg-red-100 text-red-700',
};

function QualityLabelBadge({ label }: { label: string }) {
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${QUALITY_LABEL_BADGE[label] || 'bg-slate-100 text-slate-500'}`}>
      {label}
    </span>
  );
}

function RiskFactorBar({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="flex items-center justify-between text-xs text-slate-500">
        <span>{label}</span>
        <span className="font-semibold text-slate-700">{value.toFixed(0)}</span>
      </div>
      <div className="mt-0.5 h-1.5 rounded-full bg-slate-100">
        <div className="h-1.5 rounded-full bg-indigo-500" style={{ width: `${Math.min(100, value)}%` }} />
      </div>
    </div>
  );
}

interface GeneratedByAc {
  [acceptanceCriterion: string]: GeneratedGapTestCasePredictionOut;
}

function ResolveGapModal({ gap, onClose }: { gap: C2CoverageGapOut; onClose: () => void }) {
  const [generated, setGenerated] = useState<GeneratedByAc>({});
  const [generating, setGenerating] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = (ac: string) => {
    setGenerating(ac);
    setError(null);
    generateGapTestCase({
      requirement_id: gap.requirement_id,
      requirement_text: gap.requirement_text,
      user_story_id: gap.user_story_id,
      user_story_title: gap.user_story_title,
      user_story_text: gap.user_story_text,
      acceptance_criterion: ac,
    })
      .then((res) => setGenerated((prev) => ({ ...prev, [ac]: res })))
      .catch((e) => setError(e?.response?.data?.detail || 'Failed to generate a test case.'))
      .finally(() => setGenerating(null));
  };

  const handleAdd = (ac: string, target: 'inventory' | 'rtm') => {
    const current = generated[ac];
    if (!current) return;
    addGeneratedGapTestCase(current.test_case.id, { target })
      .then((res) => setGenerated((prev) => ({ ...prev, [ac]: res })))
      .catch((e) => setError(e?.response?.data?.detail || 'Failed to add the test case.'));
  };

  const total = gap.total_acceptance_criteria || 0;
  const covered = gap.covered_acceptance_criteria;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <h2 className="text-lg font-bold text-[#1e1b4b]">Coverage Gap Details</h2>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X size={20} />
          </button>
        </div>

        <div className="space-y-5 px-6 py-5">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="rounded-xl bg-slate-50 px-3.5 py-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Requirement</p>
              <p className="mt-1 text-sm font-medium text-slate-700">{gap.requirement_text}</p>
            </div>
            <div className="rounded-xl bg-slate-50 px-3.5 py-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">User Story</p>
              <p className="mt-1 text-sm font-medium text-slate-700">{gap.user_story_title || '—'}</p>
            </div>
            <div className="rounded-xl bg-slate-50 px-3.5 py-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Risk Score</p>
              <p className="mt-1 text-xl font-extrabold text-[#1e1b4b]">{gap.risk_score.toFixed(1)}/100</p>
            </div>
            <div className="rounded-xl bg-slate-50 px-3.5 py-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Risk Level</p>
              <div className="mt-1.5">
                <RiskBadge level={gap.risk_level} />
              </div>
            </div>
            <div className="rounded-xl bg-slate-50 px-3.5 py-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Current Coverage</p>
              <p className="mt-1 text-sm font-semibold text-slate-700">
                {gap.current_coverage_pct.toFixed(0)}% ({covered}/{total} acceptance criteria)
              </p>
            </div>
            <div className="rounded-xl bg-slate-50 px-3.5 py-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Recommended Action</p>
              <p className="mt-1 text-sm font-semibold text-indigo-700">{gap.recommended_action}</p>
            </div>
          </div>

          <div>
            <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-400">
              Risk Score Breakdown
            </p>
            <div className="grid grid-cols-1 gap-2 rounded-xl bg-slate-50 p-3.5 sm:grid-cols-2">
              <RiskFactorBar label="Business Priority" value={gap.risk_factors.business_priority} />
              <RiskFactorBar label="Coverage Gap" value={gap.risk_factors.coverage_gap} />
              <RiskFactorBar label="Acceptance Criteria Gap" value={gap.risk_factors.acceptance_criteria_gap} />
              <RiskFactorBar label="Test Failure Rate" value={gap.risk_factors.test_failure_rate} />
              <RiskFactorBar label="Code Coverage Gap" value={gap.risk_factors.code_coverage_gap} />
            </div>
          </div>

          <div>
            <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-400">
              Missing Acceptance Criteria
            </p>
            {gap.missing_acceptance_criteria.length === 0 ? (
              <div className="rounded-xl bg-amber-50 p-3.5 text-sm text-amber-800">
                {gap.linked_test_case_count === 0 ? (
                  <p>No test cases are linked to this requirement yet.</p>
                ) : (
                  <>
                    <p>
                      Every acceptance criterion is textually covered by a linked test case, but this is
                      still flagged as a gap — {gap.recommended_action}
                    </p>
                    <Link
                      to="/rtm/test-improvement"
                      className="mt-2 inline-flex items-center gap-1 font-semibold text-indigo-700 hover:underline"
                    >
                      Review this test case's quality →
                    </Link>
                  </>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {gap.missing_acceptance_criteria.map((ac) => {
                  const result = generated[ac];
                  const potentialCoverage = total ? Math.round(((covered + 1) / total) * 100) : 0;
                  return (
                    <div key={ac} className="rounded-xl border border-slate-200 p-3.5">
                      <div className="flex items-start justify-between gap-3">
                        <p className="text-sm text-slate-700">{ac}</p>
                        {!result && (
                          <button
                            type="button"
                            onClick={() => handleGenerate(ac)}
                            disabled={generating === ac}
                            className="flex shrink-0 items-center gap-1 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
                          >
                            <Wand2 size={13} /> {generating === ac ? 'Generating…' : 'Generate Test Case'}
                          </button>
                        )}
                      </div>

                      {result && (
                        <div className="mt-3 space-y-3 border-t border-slate-100 pt-3">
                          <div className="flex items-center justify-between">
                            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                              Generated Given / When / Then
                            </p>
                            <QualityLabelBadge label={result.prediction.predicted_label} />
                          </div>
                          <pre className="max-h-48 overflow-y-auto whitespace-pre-wrap rounded-lg bg-slate-50 p-3 font-mono text-xs text-slate-700">
                            {result.test_case.description}
                          </pre>

                          <div className="flex flex-wrap gap-2">
                            <button
                              type="button"
                              onClick={() => handleAdd(ac, 'inventory')}
                              disabled={result.test_case.added_to_inventory}
                              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold ${
                                result.test_case.added_to_inventory
                                  ? 'bg-green-100 text-green-700'
                                  : 'bg-[#1e1b4b] text-white hover:bg-[#151235]'
                              }`}
                            >
                              {result.test_case.added_to_inventory ? <CheckCircle2 size={13} /> : <ClipboardList size={13} />}
                              {result.test_case.added_to_inventory ? 'Added to Test Inventory' : 'Add to Test Inventory'}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleAdd(ac, 'rtm')}
                              disabled={result.test_case.added_to_rtm}
                              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold ${
                                result.test_case.added_to_rtm
                                  ? 'bg-green-100 text-green-700'
                                  : 'bg-indigo-600 text-white hover:bg-indigo-700'
                              }`}
                            >
                              {result.test_case.added_to_rtm ? <CheckCircle2 size={13} /> : <Shield size={13} />}
                              {result.test_case.added_to_rtm ? 'Added to RTM' : 'Add to RTM'}
                            </button>
                          </div>

                          {(result.test_case.added_to_inventory || result.test_case.added_to_rtm) && (
                            <div className="rounded-xl bg-indigo-50 p-3.5">
                              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-indigo-400">
                                Coverage Improvement
                              </p>
                              <div className="flex items-center justify-center gap-4 text-center">
                                <div>
                                  <p className="text-2xl font-extrabold text-slate-500">
                                    {gap.current_coverage_pct.toFixed(0)}%
                                  </p>
                                  <p className="text-[11px] text-slate-400">Current Coverage</p>
                                </div>
                                <ArrowRight size={20} className="text-indigo-400" />
                                <div>
                                  <p className="text-2xl font-extrabold text-indigo-600">{potentialCoverage}%</p>
                                  <p className="text-[11px] text-slate-400">Potential Coverage</p>
                                </div>
                              </div>
                              <div className="mt-2 h-2 rounded-full bg-white">
                                <div
                                  className="h-2 rounded-full bg-indigo-500 transition-all"
                                  style={{ width: `${potentialCoverage}%` }}
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}
        </div>
      </div>
    </div>
  );
}

function CoverageGapCard({ gap, onResolve }: { gap: C2CoverageGapOut; onResolve: () => void }) {
  const style = RISK_STYLES[gap.risk_level] || RISK_STYLES.Low;
  return (
    <div className={`rounded-2xl border-l-4 bg-white p-5 shadow-sm ${style.card}`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-bold text-[#1e1b4b]">{gap.requirement_text}</p>
          <p className="mt-0.5 text-xs text-slate-400">
            {gap.user_story_title || 'No linked user story'} · Priority: {gap.priority || '—'}
          </p>
        </div>
        <RiskBadge level={gap.risk_level} />
      </div>

      <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div>
          <p className="text-[11px] uppercase tracking-wide text-slate-400">Risk Score</p>
          <p className="text-sm font-bold text-slate-700">{gap.risk_score.toFixed(1)}/100</p>
        </div>
        <div>
          <p className="text-[11px] uppercase tracking-wide text-slate-400">Coverage</p>
          <p className="text-sm font-bold text-slate-700">{gap.current_coverage_pct.toFixed(0)}%</p>
        </div>
        <div>
          <p className="text-[11px] uppercase tracking-wide text-slate-400">Missing ACs</p>
          <p className="text-sm font-bold text-slate-700">
            {gap.missing_acceptance_criteria.length}/{gap.total_acceptance_criteria}
          </p>
        </div>
        <div>
          <p className="text-[11px] uppercase tracking-wide text-slate-400">Linked Tests</p>
          <p className="text-sm font-bold text-slate-700">{gap.linked_test_case_count}</p>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-3">
        <p className="text-xs font-semibold text-indigo-700">{gap.recommended_action}</p>
        <button
          type="button"
          onClick={onResolve}
          className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700"
        >
          <Eye size={14} /> Resolve Coverage Gap
        </button>
      </div>
    </div>
  );
}

function BulkResultRow({ result }: { result: GeneratedGapTestCasePredictionOut }) {
  const [current, setCurrent] = useState(result);
  const [error, setError] = useState<string | null>(null);

  const handleAdd = (target: 'inventory' | 'rtm') => {
    addGeneratedGapTestCase(current.test_case.id, { target })
      .then(setCurrent)
      .catch((e) => setError(e?.response?.data?.detail || 'Failed to add the test case.'));
  };

  return (
    <div className="rounded-xl border border-slate-200 p-3.5">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-slate-700">{current.test_case.user_story_title}</p>
          <p className="text-xs text-slate-400">{current.test_case.acceptance_criterion}</p>
        </div>
        <QualityLabelBadge label={current.prediction.predicted_label} />
      </div>
      <div className="mt-2.5 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => handleAdd('inventory')}
          disabled={current.test_case.added_to_inventory}
          className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold ${
            current.test_case.added_to_inventory ? 'bg-green-100 text-green-700' : 'bg-[#1e1b4b] text-white hover:bg-[#151235]'
          }`}
        >
          {current.test_case.added_to_inventory ? <CheckCircle2 size={13} /> : <ClipboardList size={13} />}
          {current.test_case.added_to_inventory ? 'Added to Test Inventory' : 'Add to Test Inventory'}
        </button>
        <button
          type="button"
          onClick={() => handleAdd('rtm')}
          disabled={current.test_case.added_to_rtm}
          className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold ${
            current.test_case.added_to_rtm ? 'bg-green-100 text-green-700' : 'bg-indigo-600 text-white hover:bg-indigo-700'
          }`}
        >
          {current.test_case.added_to_rtm ? <CheckCircle2 size={13} /> : <Shield size={13} />}
          {current.test_case.added_to_rtm ? 'Added to RTM' : 'Add to RTM'}
        </button>
      </div>
      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
    </div>
  );
}

function BulkGenerationPanel({
  criticalGaps,
  onClose,
}: {
  criticalGaps: C2CoverageGapOut[];
  onClose: () => void;
}) {
  const [results, setResults] = useState<GeneratedGapTestCasePredictionOut[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const items: GenerateGapTestCaseRequest[] = criticalGaps.flatMap((gap) =>
      gap.missing_acceptance_criteria.map((ac) => ({
        requirement_id: gap.requirement_id,
        requirement_text: gap.requirement_text,
        user_story_id: gap.user_story_id,
        user_story_title: gap.user_story_title,
        user_story_text: gap.user_story_text,
        acceptance_criterion: ac,
      }))
    );
    if (items.length === 0) {
      setResults([]);
      return;
    }
    setLoading(true);
    generateAllGapTestCases({ items })
      .then((res) => setResults(res.generated))
      .catch((e) => setError(e?.response?.data?.detail || 'Failed to generate test cases.'))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="rounded-2xl border-2 border-indigo-100 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Layers size={18} className="text-indigo-600" />
          <h2 className="text-base font-bold text-[#1e1b4b]">
            Bulk Resolution — {criticalGaps.length} Critical Gap{criticalGaps.length === 1 ? '' : 's'}
          </h2>
        </div>
        <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-600">
          <X size={18} />
        </button>
      </div>

      {loading && <p className="mt-3 text-sm text-slate-400">Generating test cases for every uncovered acceptance criterion…</p>}
      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

      {results && (
        <>
          <p className="mt-3 text-sm text-slate-500">
            Generated {results.length} test case{results.length === 1 ? '' : 's'} across {criticalGaps.length} critical
            requirement{criticalGaps.length === 1 ? '' : 's'}. Review and add each below.
          </p>
          {results.length === 0 ? (
            <p className="mt-3 text-sm text-slate-400">No missing acceptance criteria to generate for.</p>
          ) : (
            <div className="mt-4 space-y-3">
              {results.map((r) => (
                <BulkResultRow key={r.test_case.id} result={r} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default function RtmGapsPage() {
  const [c2Status, setC2Status] = useState<C2StatusOut | null>(null);
  const [projectId, setProjectId] = useState('');
  const [iterationId, setIterationId] = useState('');
  const [settingsLoaded, setSettingsLoaded] = useState(false);

  const [gaps, setGaps] = useState<C2CoverageGapOut[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [modalGap, setModalGap] = useState<C2CoverageGapOut | null>(null);
  const [showBulkPanel, setShowBulkPanel] = useState(false);

  useEffect(() => {
    getProjectSettings()
      .then((s) => {
        setProjectId(s.component2_project_id || '');
        setIterationId(s.component1_iteration_id || '');
      })
      .catch(() => {})
      .finally(() => setSettingsLoaded(true));
    getComponent2Status()
      .then(setC2Status)
      .catch(() => setC2Status({ connected: false, base_url: '' }));
  }, []);

  useEffect(() => {
    if (!c2Status?.connected || !projectId || !iterationId) {
      setGaps([]);
      return;
    }
    setLoading(true);
    getC2CoverageGaps(projectId, iterationId)
      .then((data) => {
        setGaps(data);
        setError(null);
      })
      .catch((e) => {
        setGaps([]);
        setError(e?.response?.data?.detail || 'Failed to load coverage gaps.');
      })
      .finally(() => setLoading(false));
  }, [c2Status?.connected, projectId, iterationId]);

  const criticalCount = gaps.filter((g) => g.risk_level === 'Critical').length;
  const mediumCount = gaps.filter((g) => g.risk_level === 'Medium').length;
  const lowCount = gaps.filter((g) => g.risk_level === 'Low').length;

  return (
    <div>
      <div className="flex items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600">
          <Search size={20} />
        </span>
        <div>
          <h1 className="text-3xl font-extrabold text-[#1e1b4b]">Coverage Gaps</h1>
          <p className="mt-1 text-slate-500">
            Risk-based prioritization of uncovered requirements, with automatic test-case generation to close each gap.
          </p>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-3">
        <div className="rounded-2xl border-l-4 border-l-red-400 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">🔴 Critical</p>
          <p className="text-2xl font-bold text-[#1e1b4b]">{criticalCount}</p>
        </div>
        <div className="rounded-2xl border-l-4 border-l-amber-400 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">🟠 Medium</p>
          <p className="text-2xl font-bold text-[#1e1b4b]">{mediumCount}</p>
        </div>
        <div className="rounded-2xl border-l-4 border-l-green-400 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">🟢 Low</p>
          <p className="text-2xl font-bold text-[#1e1b4b]">{lowCount}</p>
        </div>
      </div>

      {criticalCount > 0 && !showBulkPanel && (
        <div className="mt-5 flex items-center justify-between rounded-2xl border border-red-100 bg-red-50 px-5 py-3.5">
          <p className="text-sm text-red-800">
            <span className="font-semibold">{criticalCount}</span> critical gap{criticalCount === 1 ? '' : 's'} need
            immediate action.
          </p>
          <button
            type="button"
            onClick={() => setShowBulkPanel(true)}
            className="flex items-center gap-1.5 rounded-lg bg-red-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-red-700"
          >
            <Layers size={14} /> Generate All for Critical Gaps
          </button>
        </div>
      )}

      {showBulkPanel && (
        <div className="mt-5">
          <BulkGenerationPanel
            criticalGaps={gaps.filter((g) => g.risk_level === 'Critical')}
            onClose={() => setShowBulkPanel(false)}
          />
        </div>
      )}

      <div className="mt-6 space-y-4">
        {!settingsLoaded || loading ? (
          <p className="text-slate-500">Loading…</p>
        ) : !c2Status?.connected ? (
          <p className="text-slate-400">
            Component 2 isn't reachable right now — coverage gaps can't be computed.
          </p>
        ) : !projectId || !iterationId ? (
          <p className="text-slate-400">
            Link a Component 2 project and a Component 1 iteration ID from the RTM Matrix page to compute
            coverage gaps.
          </p>
        ) : error ? (
          <p className="text-red-600">{error}</p>
        ) : gaps.length === 0 ? (
          <p className="flex items-center gap-2 text-slate-500">
            <CheckCircle2 size={16} className="text-green-500" /> No coverage gaps — every requirement has
            adequate test coverage.
          </p>
        ) : (
          gaps.map((gap) => (
            <CoverageGapCard
              key={`${gap.requirement_id}-${gap.user_story_id}`}
              gap={gap}
              onResolve={() => setModalGap(gap)}
            />
          ))
        )}
      </div>

      {modalGap && <ResolveGapModal gap={modalGap} onClose={() => setModalGap(null)} />}
    </div>
  );
}
