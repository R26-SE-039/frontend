import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, ArrowRight, Code, FileCode2, RefreshCw, Rocket, Sparkles } from 'lucide-react';
import { testCaseApi } from '../api/testCaseApi';
import type { TestSuite } from '../types/testCase';
import TestCasePill from '../components/testCase/TestCasePill';
import { loadTestCaseSetup, type TestCaseSetup } from '../utils/testCaseSetup';

const frameworkLabels: Record<string, string> = {
  selenium: 'Selenium',
  playwright: 'Playwright',
  cypress: 'Cypress',
};

export default function TestCaseCodeReviewPage() {
  const navigate = useNavigate();
  const [projectId, setProjectId] = useState<string | null>(null);
  const [setup, setSetup] = useState<TestCaseSetup | null>(null);
  const [suites, setSuites] = useState<TestSuite[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadSuites = useCallback(async (id: string) => {
    setSuites(await testCaseApi.getTestSuites(id));
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const id = await testCaseApi.ensureProject();
        setProjectId(id);
        setSetup(loadTestCaseSetup(id));
        await loadSuites(id);
      } catch (err: any) {
        setError(err.message || 'Failed to load test suites');
      } finally {
        setLoading(false);
      }
    })();
  }, [loadSuites]);

  const handleGenerate = async () => {
    if (!projectId || !setup) return;
    setGenerating(true);
    setError(null);
    try {
      await testCaseApi.generateTestCode(projectId, setup.url, setup.mode, setup.frameworks);
      await loadSuites(projectId);
    } catch (err: any) {
      setError(err.message || 'Code generation failed');
    } finally {
      setGenerating(false);
    }
  };

  const handleSelectForRun = async (suite: TestSuite) => {
    setError(null);
    try {
      await testCaseApi.selectTestSuiteForRun(suite.id);
      if (projectId) await loadSuites(projectId);
    } catch (err: any) {
      setError(err.message || 'Failed to select suite for run');
    }
  };

  const staleCount = suites.filter((suite) => suite.is_stale).length;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold tracking-tight text-[var(--foreground)]">Code Review</h2>
          <p className="text-xs text-[var(--muted)] mt-1">
            Stage 5 — AI generates one executable suite per framework. Review, edit, and pick the suite CI/CD should run.
            {setup && (
              <span className="ml-2 font-bold text-indigo-600">
                Mode {setup.mode === 'dom' ? 'B · DOM-Aware' : 'A · Abstract'}
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => projectId && loadSuites(projectId)}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-500 transition hover:text-indigo-600"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh
          </button>
          <button
            type="button"
            onClick={handleGenerate}
            disabled={generating || !setup}
            className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 px-4 py-2 text-xs font-bold text-white shadow-md shadow-indigo-200 transition hover:from-indigo-700 hover:to-purple-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Sparkles size={14} className={generating ? 'animate-pulse' : ''} />
            {generating ? 'Generating with AI...' : suites.length ? 'Regenerate Suites' : 'Generate Suites'}
          </button>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          <AlertTriangle size={18} className="shrink-0" />
          {error}
        </div>
      )}

      {generating && (
        <div className="flex items-center gap-3 rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-3 text-sm font-medium text-indigo-700">
          <div className="h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-indigo-200 border-t-indigo-600" />
          Generating {setup?.frameworks.length ?? 3} suites in parallel — this can take a couple of minutes.
        </div>
      )}

      {staleCount > 0 && !generating && (
        <div className="flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-700">
          <AlertTriangle size={18} className="shrink-0" />
          {staleCount} suite{staleCount > 1 ? 's are' : ' is'} stale — the Gherkin or DOM inputs changed since generation.
          Regenerate to stay in sync.
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-100 border-t-indigo-600" />
        </div>
      ) : suites.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-slate-200 bg-white px-6 py-16 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
            <FileCode2 size={22} />
          </div>
          <p className="text-sm font-bold text-slate-900">No suites generated yet</p>
          <p className="max-w-sm text-xs font-medium text-slate-400">
            Approve Gherkin scenarios, finish the mode setup, and generate executable code for your frameworks.
          </p>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-3">
          {suites.map((suite) => (
            <div key={suite.id} className="flex flex-col rounded-2xl border border-[var(--border)] bg-[var(--card)] shadow-sm overflow-hidden transition-all hover:-translate-y-0.5 hover:shadow-md">
              <div className="border-b border-slate-100 p-5 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                      <Code size={18} />
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-slate-900">{frameworkLabels[suite.framework] ?? suite.framework}</h3>
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                        {suite.language} · v{suite.version}
                      </p>
                    </div>
                  </div>
                  {suite.is_stale && <TestCasePill label="stale" type="run" />}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <TestCasePill label={suite.mode === 'dom' ? 'DOM-aware' : 'Abstract'} type="source" />
                  <span className="text-[10px] font-bold text-slate-400">{suite.source_scenario_count} scenarios</span>
                  {suite.llm_model && <span className="text-[10px] font-bold text-slate-400">· {suite.llm_model}</span>}
                </div>
              </div>

              <pre className="custom-scrollbar h-44 flex-1 overflow-auto bg-slate-950 p-4 font-mono text-[11px] leading-4 text-slate-300">
                {suite.code.split('\n').slice(0, 16).join('\n')}
              </pre>

              <div className="flex items-center justify-between gap-2 border-t border-slate-100 p-4">
                <label className="flex cursor-pointer items-center gap-2 text-xs font-bold text-slate-500">
                  <input
                    type="radio"
                    name="selected-for-run"
                    checked={suite.selected_for_run}
                    onChange={() => handleSelectForRun(suite)}
                    className="h-4 w-4 accent-indigo-600"
                  />
                  <Rocket size={13} className={suite.selected_for_run ? 'text-indigo-600' : 'text-slate-300'} />
                  Run this suite
                </label>
                <button
                  type="button"
                  onClick={() => navigate(`/test-case/code-review/${suite.id}`)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-indigo-100 bg-indigo-50 px-3 py-1.5 text-[11px] font-black text-indigo-600 transition hover:bg-indigo-100"
                >
                  Open Editor <ArrowRight size={12} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {suites.some((suite) => suite.selected_for_run) && (
        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => navigate('/test-case/execution')}
            className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-indigo-200 transition hover:from-indigo-700 hover:to-purple-700"
          >
            Continue to Execution <ArrowRight size={14} />
          </button>
        </div>
      )}
    </div>
  );
}
