import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  CheckCircle2,
  Download,
  ExternalLink,
  FileText,
  GitBranch,
  Monitor,
  Play,
  RefreshCw,
  Rocket,
  RotateCcw,
  XCircle,
} from 'lucide-react';
import { TEST_CASE_API_URL } from '../api/config';
import {
  openExecutionStream,
  runLatestFrameUrl,
  runLogUrl,
  runPdfUrl,
  testCaseApi,
} from '../api/testCaseApi';
import type { ExecutionEvent, GitHubConnection, RunDetail, RunSummary, TestSuite } from '../types/testCase';
import TestCasePill from '../components/testCase/TestCasePill';
import TestCaseRunDonut from '../components/testCase/TestCaseRunDonut';

type RunMode = 'local' | 'github';

type RunnerState = {
  runId: string | null;
  status: 'idle' | 'running' | 'done' | 'error';
  steps: { step: string; status: string }[];
  logs: string[];
  githubUrl: string | null;
  error: string | null;
};

const idleRunner: RunnerState = {
  runId: null,
  status: 'idle',
  steps: [],
  logs: [],
  githubUrl: null,
  error: null,
};

const runnerMeta: Record<RunMode, { title: string; description: string }> = {
  local: { title: 'Local Runner', description: 'Playwright subprocess on the backend host with live browser preview.' },
  github: { title: 'GitHub Actions', description: 'Real CI/CD run on the connected repository with artifact upload.' },
};

const formatDuration = (ms?: number | null): string => {
  if (!ms || ms <= 0) return '—';
  const seconds = ms / 1000;
  if (seconds < 60) return `${seconds.toFixed(1)}s`;
  return `${Math.floor(seconds / 60)}m ${String(Math.round(seconds % 60)).padStart(2, '0')}s`;
};

const screenshotSrc = (imageUrl: string): string =>
  imageUrl.startsWith('http') ? imageUrl : `${TEST_CASE_API_URL}${imageUrl}`;

export default function TestScriptExecutionPage() {
  const navigate = useNavigate();
  const [projectId, setProjectId] = useState<string | null>(null);
  const [selectedSuite, setSelectedSuite] = useState<TestSuite | null>(null);
  const [connection, setConnection] = useState<GitHubConnection | null>(null);
  const [runs, setRuns] = useState<RunSummary[]>([]);
  const [runners, setRunners] = useState<Record<RunMode, RunnerState>>({
    local: { ...idleRunner },
    github: { ...idleRunner },
  });
  const [activeDetail, setActiveDetail] = useState<RunDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [previewTick, setPreviewTick] = useState(0);
  const [previewFailed, setPreviewFailed] = useState(false);
  const socketsRef = useRef<Partial<Record<RunMode, WebSocket>>>({});

  const refreshRuns = useCallback(async (id: string) => {
    setRuns(await testCaseApi.listRuns(id));
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const id = await testCaseApi.ensureProject();
        setProjectId(id);
        const [suites, gitHubConnection] = await Promise.all([
          testCaseApi.getTestSuites(id),
          testCaseApi.getGitHubConnection(id).catch(() => null),
        ]);
        setSelectedSuite(suites.find((suite) => suite.selected_for_run) ?? null);
        setConnection(gitHubConnection);
        await refreshRuns(id);
      } catch (err: any) {
        setError(err.message || 'Failed to load execution data');
      } finally {
        setLoading(false);
      }
    })();

    const sockets = socketsRef.current;
    return () => {
      Object.values(sockets).forEach((socket) => socket?.close());
    };
  }, [refreshRuns]);

  const localRunning = runners.local.status === 'running';
  useEffect(() => {
    if (!localRunning) return;
    const interval = setInterval(() => setPreviewTick((tick) => tick + 1), 1200);
    return () => clearInterval(interval);
  }, [localRunning]);

  const patchRunner = (mode: RunMode, patch: Partial<RunnerState> | ((prev: RunnerState) => RunnerState)) => {
    setRunners((prev) => ({
      ...prev,
      [mode]: typeof patch === 'function' ? patch(prev[mode]) : { ...prev[mode], ...patch },
    }));
  };

  const finishRun = useCallback(
    async (runId: string) => {
      try {
        setActiveDetail(await testCaseApi.getRun(runId));
      } catch {
        // detail may not be persisted yet — history refresh still shows the row
      }
      if (projectId) refreshRuns(projectId).catch(() => undefined);
    },
    [projectId, refreshRuns],
  );

  const attachStream = useCallback(
    (mode: RunMode, runId: string) => {
      patchRunner(mode, { ...idleRunner, runId, status: 'running' });
      setPreviewFailed(false);
      const socket = openExecutionStream(runId, (event: ExecutionEvent) => {
        if (event.type === 'step') {
          patchRunner(mode, (prev) => {
            const steps = prev.steps.some((item) => item.step === event.step)
              ? prev.steps.map((item) => (item.step === event.step ? { ...item, status: event.status } : item))
              : [...prev.steps, { step: event.step, status: event.status }];
            return { ...prev, steps };
          });
        } else if (event.type === 'log') {
          patchRunner(mode, (prev) => ({ ...prev, logs: [...prev.logs.slice(-400), event.line] }));
        } else if (event.type === 'github') {
          patchRunner(mode, { githubUrl: event.run_url });
        } else if (event.type === 'done') {
          patchRunner(mode, { status: 'done' });
          finishRun(runId);
        } else if (event.type === 'error') {
          patchRunner(mode, { status: 'error', error: event.message });
          finishRun(runId);
        }
      });
      socket.onclose = () => {
        patchRunner(mode, (prev) => (prev.status === 'running' ? { ...prev, status: 'done' } : prev));
      };
      socketsRef.current[mode]?.close();
      socketsRef.current[mode] = socket;
    },
    [finishRun],
  );

  const startRun = async (mode: RunMode) => {
    if (!projectId || !selectedSuite) return;
    setError(null);
    try {
      const response = await testCaseApi.executeSuite({ suiteId: selectedSuite.id, projectId, mode });
      attachStream(mode, response.run_id);
    } catch (err: any) {
      patchRunner(mode, { status: 'error', error: err.message || 'Failed to start the run' });
    }
  };

  const handleRerun = async (run: RunSummary) => {
    setError(null);
    try {
      const response = await testCaseApi.rerunRun(run.id);
      attachStream('github', response.run_id);
    } catch (err: any) {
      setError(err.message || 'Failed to re-run');
    }
  };

  const viewRun = async (run: RunSummary) => {
    setError(null);
    try {
      setActiveDetail(await testCaseApi.getRun(run.id));
    } catch (err: any) {
      setError(err.message || 'Failed to load run details');
    }
  };

  const anyRunning = localRunning || runners.github.status === 'running';

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-100 border-t-indigo-600" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold tracking-tight text-[var(--foreground)]">Execution & Report</h2>
          <p className="text-xs text-[var(--muted)] mt-1">
            Stage 6 — run the selected suite locally or in CI/CD, watch it live, and collect the report.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {selectedSuite && (
            <span className="rounded-lg border border-indigo-100 bg-indigo-50 px-3 py-2 text-[11px] font-black text-indigo-600 capitalize">
              {selectedSuite.framework} · v{selectedSuite.version}
            </span>
          )}
          <button
            type="button"
            onClick={() => {
              startRun('local');
              startRun('github');
            }}
            disabled={!selectedSuite || !connection || anyRunning}
            className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 px-4 py-2 text-xs font-bold text-white shadow-md shadow-indigo-200 transition hover:from-indigo-700 hover:to-purple-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Rocket size={14} /> Run Both
          </button>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          <AlertTriangle size={18} className="shrink-0" />
          {error}
        </div>
      )}

      {!selectedSuite && (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-slate-200 bg-white px-6 py-16 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
            <Rocket size={22} />
          </div>
          <p className="text-sm font-bold text-slate-900">No suite selected for run</p>
          <p className="max-w-sm text-xs font-medium text-slate-400">
            Generate suites in Code Review and mark one as “Run this suite” first.
          </p>
          <button type="button" onClick={() => navigate('/test-script/code-review')} className="mt-2 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-md shadow-indigo-200 hover:bg-indigo-700">
            Go to Code Review
          </button>
        </div>
      )}

      {selectedSuite && (
        <div className="grid gap-6 lg:grid-cols-2">
          {(['local', 'github'] as RunMode[]).map((mode) => {
            const runner = runners[mode];
            const githubBlocked = mode === 'github' && !connection;
            return (
              <div key={mode} className="flex flex-col rounded-2xl border border-[var(--border)] bg-[var(--card)] shadow-sm overflow-hidden">
                <div className="flex items-center justify-between gap-3 border-b border-slate-100 p-5">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                      {mode === 'local' ? <Monitor size={18} /> : <GitBranch size={18} />}
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-slate-900">{runnerMeta[mode].title}</h3>
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                        {runnerMeta[mode].description}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {runner.status !== 'idle' && (
                      <TestCasePill
                        label={runner.status === 'running' ? 'running' : runner.status === 'error' ? 'failed' : 'done'}
                        type="run"
                      />
                    )}
                    <button
                      type="button"
                      onClick={() => startRun(mode)}
                      disabled={githubBlocked || runner.status === 'running'}
                      className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-md shadow-indigo-200 transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <Play size={13} /> {runner.status === 'running' ? 'Running...' : 'Run'}
                    </button>
                  </div>
                </div>

                {githubBlocked ? (
                  <div className="flex flex-col items-center gap-3 px-6 py-12 text-center">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-slate-400">
                      <GitBranch size={20} />
                    </div>
                    <p className="text-sm font-bold text-slate-900">No repository connected</p>
                    <p className="max-w-xs text-xs font-medium text-slate-400">
                      Connect a GitHub repository to run generated suites in CI/CD.
                    </p>
                    <button
                      type="button"
                      onClick={() => navigate('/test-script/settings/github')}
                      className="mt-1 rounded-lg border border-indigo-100 bg-indigo-50 px-4 py-2 text-xs font-bold text-indigo-600 hover:bg-indigo-100"
                    >
                      Open GitHub Connection
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-1 flex-col gap-4 p-5">
                    {mode === 'github' && connection && (
                      <div className="flex flex-wrap items-center gap-2 text-xs font-bold text-slate-500">
                        <span className="font-mono text-indigo-600">{connection.repo_full}</span>
                        {runner.githubUrl && (
                          <a
                            href={runner.githubUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-indigo-600 hover:underline"
                          >
                            View workflow run <ExternalLink size={12} />
                          </a>
                        )}
                      </div>
                    )}

                    {mode === 'local' && runner.status === 'running' && runner.runId && !previewFailed && (
                      <div className="overflow-hidden rounded-xl border border-slate-200 bg-slate-950">
                        <p className="border-b border-slate-800 px-3 py-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
                          Live Browser Preview
                        </p>
                        <img
                          src={`${runLatestFrameUrl(runner.runId)}?t=${previewTick}`}
                          alt="Live browser frame"
                          className="max-h-56 w-full object-contain"
                          onError={() => setPreviewFailed(true)}
                        />
                      </div>
                    )}

                    {runner.steps.length > 0 && (
                      <div className="space-y-1.5">
                        {runner.steps.map((step) => (
                          <div key={step.step} className="flex items-center gap-2 text-xs font-semibold text-slate-600">
                            {step.status === 'done' || step.status === 'success' ? (
                              <CheckCircle2 size={14} className="shrink-0 text-green-500" />
                            ) : step.status === 'failed' || step.status === 'error' ? (
                              <XCircle size={14} className="shrink-0 text-red-500" />
                            ) : (
                              <div className="h-3.5 w-3.5 shrink-0 animate-spin rounded-full border-2 border-indigo-100 border-t-indigo-600" />
                            )}
                            {step.step}
                          </div>
                        ))}
                      </div>
                    )}

                    {runner.error && (
                      <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-700">
                        <AlertTriangle size={14} className="shrink-0" /> {runner.error}
                      </div>
                    )}

                    <div className="custom-scrollbar min-h-32 flex-1 overflow-y-auto rounded-xl bg-slate-950 p-3 font-mono text-[11px] leading-4 text-slate-300">
                      {runner.logs.length === 0 ? (
                        <p className="text-slate-600">Execution log streams here.</p>
                      ) : (
                        runner.logs.map((line, index) => <p key={index}>{line}</p>)
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {activeDetail && (
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-sm space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Run Report</h3>
              <p className="mt-1 text-[10px] font-black uppercase tracking-widest text-slate-400">
                {activeDetail.framework} · {activeDetail.mode} · {activeDetail.started_at ? new Date(activeDetail.started_at).toLocaleString() : ''}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <TestCasePill label={activeDetail.status} type="run" />
              <a
                href={runLogUrl(activeDetail.id)}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-black text-slate-500 transition hover:text-indigo-600"
              >
                <FileText size={12} /> Raw Log
              </a>
              <a
                href={runPdfUrl(activeDetail.id)}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 rounded-lg border border-indigo-100 bg-indigo-50 px-3 py-1.5 text-[11px] font-black text-indigo-600 transition hover:bg-indigo-100"
              >
                <Download size={12} /> PDF Report
              </a>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-12">
            <div className="lg:col-span-4">
              <TestCaseRunDonut passed={activeDetail.passed_count} failed={activeDetail.failed_count} />
            </div>
            <div className="lg:col-span-8 space-y-4">
              <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                {[
                  ['Total', String(activeDetail.total_count)],
                  ['Passed', String(activeDetail.passed_count)],
                  ['Failed', String(activeDetail.failed_count)],
                  ['Duration', formatDuration(activeDetail.duration_ms)],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-xl border border-slate-100 bg-slate-50/60 px-4 py-3 text-center">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{label}</p>
                    <p className="mt-1 text-lg font-extrabold text-slate-900">{value}</p>
                  </div>
                ))}
              </div>

              {activeDetail.scenarios.length > 0 && (
                <div className="overflow-x-auto rounded-xl border border-slate-100">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b border-slate-100 text-[10px] font-black uppercase tracking-widest text-slate-400">
                        <th className="px-4 py-2.5">Scenario</th>
                        <th className="px-4 py-2.5">Flow</th>
                        <th className="px-4 py-2.5">Status</th>
                        <th className="px-4 py-2.5">Duration</th>
                      </tr>
                    </thead>
                    <tbody>
                      {activeDetail.scenarios.map((scenario, index) => (
                        <tr key={`${scenario.scenario_name}-${index}`} className="border-b border-slate-50">
                          <td className="px-4 py-2.5 text-xs font-semibold text-slate-700">{scenario.scenario_name}</td>
                          <td className="px-4 py-2.5 text-xs font-bold text-slate-400">{scenario.flow_name.replace(/_/g, ' ')}</td>
                          <td className="px-4 py-2.5"><TestCasePill label={scenario.status} type="run" /></td>
                          <td className="px-4 py-2.5 text-xs font-bold text-slate-500">{formatDuration(scenario.duration_ms)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          {activeDetail.screenshots.length > 0 && (
            <div>
              <p className="mb-3 text-[10px] font-black uppercase tracking-widest text-slate-400">Screenshots</p>
              <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-4">
                {activeDetail.screenshots.map((screenshot, index) => (
                  <a
                    key={`${screenshot.label}-${index}`}
                    href={screenshotSrc(screenshot.image_url)}
                    target="_blank"
                    rel="noreferrer"
                    className="group overflow-hidden rounded-xl border border-slate-200 bg-white transition hover:border-indigo-200 hover:shadow-md"
                  >
                    <img src={screenshotSrc(screenshot.image_url)} alt={screenshot.label} className="h-32 w-full object-cover" />
                    <div className="flex items-center justify-between gap-2 px-3 py-2">
                      <p className="truncate text-[11px] font-bold text-slate-600">{screenshot.label}</p>
                      <TestCasePill label={screenshot.status} type="run" />
                    </div>
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] shadow-sm overflow-hidden">
        <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-6 py-4">
          <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Run History</h3>
          <button
            type="button"
            onClick={() => projectId && refreshRuns(projectId)}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-black text-slate-500 transition hover:text-indigo-600"
          >
            <RefreshCw size={13} /> Refresh
          </button>
        </div>
        {runs.length === 0 ? (
          <p className="px-6 py-10 text-center text-xs font-medium text-slate-400">No runs recorded yet for this project.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-[10px] font-black uppercase tracking-widest text-slate-400">
                  <th className="px-6 py-3">Started</th>
                  <th className="px-4 py-3">Framework</th>
                  <th className="px-4 py-3">Mode</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Passed / Failed</th>
                  <th className="px-4 py-3">Duration</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {runs.map((run) => (
                  <tr key={run.id} className="border-b border-slate-50 hover:bg-slate-50/60">
                    <td className="px-6 py-3 text-xs font-semibold text-slate-600">
                      {run.started_at ? new Date(run.started_at).toLocaleString() : '—'}
                    </td>
                    <td className="px-4 py-3 text-xs font-bold capitalize text-slate-700">{run.framework}</td>
                    <td className="px-4 py-3 text-xs font-bold text-slate-500">{run.mode}</td>
                    <td className="px-4 py-3"><TestCasePill label={run.status} type="run" /></td>
                    <td className="px-4 py-3 text-xs font-bold">
                      <span className="text-green-600">{run.passed_count}</span>
                      <span className="text-slate-300"> / </span>
                      <span className="text-red-600">{run.failed_count}</span>
                    </td>
                    <td className="px-4 py-3 text-xs font-bold text-slate-500">{formatDuration(run.duration_ms)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => viewRun(run)}
                          className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[10px] font-black text-slate-500 transition hover:text-indigo-600"
                        >
                          View
                        </button>
                        {run.mode === 'github' && (
                          <button
                            type="button"
                            onClick={() => handleRerun(run)}
                            className="rounded-lg p-1.5 text-slate-300 transition hover:bg-indigo-50 hover:text-indigo-600"
                            title="Re-run on GitHub Actions"
                          >
                            <RotateCcw size={13} />
                          </button>
                        )}
                        {run.github_run_url && (
                          <a
                            href={run.github_run_url}
                            target="_blank"
                            rel="noreferrer"
                            className="rounded-lg p-1.5 text-slate-300 transition hover:bg-indigo-50 hover:text-indigo-600"
                            title="Open in GitHub"
                          >
                            <ExternalLink size={13} />
                          </a>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
