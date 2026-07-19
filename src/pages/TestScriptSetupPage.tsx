import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, ArrowRight, CheckCircle2, Globe, Search, Zap } from 'lucide-react';
import { testCaseApi } from '../api/testCaseApi';
import type { ProbeResponse } from '../types/testCase';
import {
  TEST_CASE_FRAMEWORKS,
  loadTestCaseSetup,
  saveTestCaseSetup,
  type TestCaseMode,
} from '../utils/testCaseSetup';

const inputCls =
  'w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 outline-none transition-all focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100';

const frameworkMeta: Record<string, { label: string; language: string }> = {
  selenium: { label: 'Selenium', language: 'Python · pytest' },
  playwright: { label: 'Playwright', language: 'TypeScript' },
  cypress: { label: 'Cypress', language: 'JavaScript' },
};

export default function TestScriptSetupPage() {
  const navigate = useNavigate();
  const [projectId, setProjectId] = useState<string | null>(null);
  const [mode, setMode] = useState<TestCaseMode>('dom');
  const [url, setUrl] = useState('');
  const [frameworks, setFrameworks] = useState<string[]>([...TEST_CASE_FRAMEWORKS]);
  const [probeStatus, setProbeStatus] = useState<'idle' | 'checking' | 'ok' | 'fail'>('idle');
  const [probeResult, setProbeResult] = useState<ProbeResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const id = await testCaseApi.ensureProject();
        setProjectId(id);
        const setup = loadTestCaseSetup(id);
        setMode(setup.mode);
        setUrl(setup.url);
        setFrameworks(setup.frameworks);
      } catch (err: any) {
        setError(err.message || 'Failed to load setup');
      }
    })();
  }, []);

  const toggleFramework = (framework: string) => {
    setFrameworks((prev) =>
      prev.includes(framework) ? prev.filter((item) => item !== framework) : [...prev, framework],
    );
  };

  const handleProbe = async () => {
    setProbeStatus('checking');
    setProbeResult(null);
    setError(null);
    try {
      const result = await testCaseApi.probeUrl(url.trim());
      setProbeResult(result);
      setProbeStatus(result.ok ? 'ok' : 'fail');
    } catch (err: any) {
      setProbeStatus('fail');
      setError(err.message || 'URL validation failed');
    }
  };

  const continueDisabled =
    frameworks.length === 0 || (mode === 'dom' && (probeStatus !== 'ok' || !url.trim()));

  const handleContinue = () => {
    if (!projectId) return;
    saveTestCaseSetup(projectId, { mode, url: url.trim(), frameworks });
    navigate(mode === 'dom' ? '/test-script/dom-inspector' : '/test-script/code-review');
  };

  return (
    <div className="space-y-8 max-w-4xl">
      <div>
        <h2 className="text-2xl font-extrabold tracking-tight text-[var(--foreground)]">Mode & URL Setup</h2>
        <p className="text-xs text-[var(--muted)] mt-1">
          Stage 3 — choose how test code is generated and where it should point.
        </p>
      </div>

      {error && (
        <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          <AlertTriangle size={18} className="shrink-0" />
          {error}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <button
          type="button"
          onClick={() => setMode('abstract')}
          className={`rounded-2xl border p-6 text-left transition-all ${
            mode === 'abstract' ? 'border-indigo-300 bg-indigo-50/50 shadow-md shadow-indigo-100' : 'border-slate-200 bg-white hover:border-indigo-100 hover:shadow-sm'
          }`}
        >
          <div className={`mb-4 flex h-11 w-11 items-center justify-center rounded-xl ${mode === 'abstract' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-500'}`}>
            <Zap size={20} />
          </div>
          <h3 className="text-sm font-black text-slate-900">Mode A · Abstract</h3>
          <p className="mt-2 text-xs font-medium leading-5 text-slate-500">
            Generates portable code with <span className="font-mono">&lt;&lt;PLACEHOLDER&gt;&gt;</span> locators. No staging URL
            needed — ideal before the UI exists.
          </p>
        </button>
        <button
          type="button"
          onClick={() => setMode('dom')}
          className={`rounded-2xl border p-6 text-left transition-all ${
            mode === 'dom' ? 'border-indigo-300 bg-indigo-50/50 shadow-md shadow-indigo-100' : 'border-slate-200 bg-white hover:border-indigo-100 hover:shadow-sm'
          }`}
        >
          <div className={`mb-4 flex h-11 w-11 items-center justify-center rounded-xl ${mode === 'dom' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-500'}`}>
            <Search size={20} />
          </div>
          <h3 className="text-sm font-black text-slate-900">Mode B · DOM-Aware</h3>
          <p className="mt-2 text-xs font-medium leading-5 text-slate-500">
            Crawls the staging URL with Playwright, extracts real selectors, and generates immediately runnable code.
          </p>
        </button>
      </div>

      {mode === 'dom' && (
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-sm space-y-4">
          <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Staging URL</h3>
          <div className="flex flex-wrap gap-2">
            <div className="relative flex-1 min-w-64">
              <Globe size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                className={`${inputCls} pl-10`}
                value={url}
                onChange={(e) => {
                  setUrl(e.target.value);
                  setProbeStatus('idle');
                }}
                placeholder="https://staging.yourapp.com"
              />
            </div>
            <button
              type="button"
              onClick={handleProbe}
              disabled={!url.trim() || probeStatus === 'checking'}
              className="rounded-xl bg-indigo-600 px-5 py-2 text-xs font-bold text-white shadow-md shadow-indigo-200 transition hover:bg-indigo-700 disabled:opacity-50"
            >
              {probeStatus === 'checking' ? 'Checking...' : 'Validate URL'}
            </button>
          </div>
          {probeStatus === 'ok' && probeResult && (
            <div className="flex items-center gap-3 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-700">
              <CheckCircle2 size={18} className="shrink-0" />
              Reachable (HTTP {probeResult.status}){probeResult.title ? ` — “${probeResult.title}”` : ''}
            </div>
          )}
          {probeStatus === 'fail' && (
            <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
              <AlertTriangle size={18} className="shrink-0" />
              {probeResult?.error || `URL not reachable${probeResult ? ` (HTTP ${probeResult.status})` : ''}`}
            </div>
          )}
        </div>
      )}

      <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-sm space-y-4">
        <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Test Frameworks</h3>
        <div className="grid gap-3 md:grid-cols-3">
          {TEST_CASE_FRAMEWORKS.map((framework) => {
            const selected = frameworks.includes(framework);
            return (
              <button
                key={framework}
                type="button"
                onClick={() => toggleFramework(framework)}
                className={`flex items-center justify-between rounded-xl border p-4 text-left transition-all ${
                  selected ? 'border-indigo-200 bg-indigo-50/60' : 'border-slate-200 bg-white hover:border-indigo-100'
                }`}
              >
                <div>
                  <p className="text-sm font-black text-slate-900">{frameworkMeta[framework].label}</p>
                  <p className="mt-1 text-[10px] font-black uppercase tracking-widest text-slate-400">
                    {frameworkMeta[framework].language}
                  </p>
                </div>
                <div className={`flex h-5 w-5 items-center justify-center rounded-md border transition ${selected ? 'border-indigo-600 bg-indigo-600 text-white' : 'border-slate-300 bg-white text-transparent'}`}>
                  <CheckCircle2 size={13} />
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-6 py-4">
        <p className="text-xs font-bold text-slate-500">
          Next: {mode === 'dom' ? 'DOM Inspector — extract & curate selectors' : 'Code Review — generate the abstract suites'}
        </p>
        <button
          type="button"
          onClick={handleContinue}
          disabled={continueDisabled}
          className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-indigo-200 transition hover:from-indigo-700 hover:to-purple-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {mode === 'dom' ? <Search size={14} /> : <Zap size={14} />}
          {mode === 'dom' ? 'Inspect DOM' : 'Continue to Code Review'}
          <ArrowRight size={14} />
        </button>
      </div>
    </div>
  );
}
