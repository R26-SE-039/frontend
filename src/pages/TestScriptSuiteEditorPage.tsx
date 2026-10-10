import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AlertTriangle, ArrowLeft, Download, History, Rocket, Save, SaveAll, ShieldCheck } from 'lucide-react';
import { testCaseApi } from '../api/testCaseApi';
import type { SuiteFixProposal, TestSuite, ValidationReport } from '../types/testCase';
import TestCaseCodeEditor from '../components/testCase/TestCaseCodeEditor';
import TestCasePill from '../components/testCase/TestCasePill';
import ValidationPanel from '../components/testCase/ValidationPanel';
import ValidationFixDialog from '../components/testCase/ValidationFixDialog';
import { verdictTone } from '../components/testCase/ValidationScoreRing';

const monacoLanguage = (language: string): string => {
  const value = language.toLowerCase();
  if (value.includes('python')) return 'python';
  if (value.includes('typescript')) return 'typescript';
  return 'javascript';
};

export default function TestScriptSuiteEditorPage() {
  const navigate = useNavigate();
  const { suiteId } = useParams<{ suiteId: string }>();
  const [suite, setSuite] = useState<TestSuite | null>(null);
  const [history, setHistory] = useState<TestSuite[]>([]);
  const [viewedId, setViewedId] = useState<string | null>(null);
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(null);

  // Independent validation state
  const [report, setReport] = useState<ValidationReport | null>(null);
  const [validating, setValidating] = useState(false);
  const [fixing, setFixing] = useState(false);
  const [proposal, setProposal] = useState<SuiteFixProposal | null>(null);
  const [applyingFix, setApplyingFix] = useState(false);
  const [previousScore, setPreviousScore] = useState<number | null>(null);
  const editorRef = useRef<any>(null);

  const loadReport = useCallback(async (id: string) => {
    try {
      setReport(await testCaseApi.getSuiteValidation(id));
    } catch {
      setReport(null);
    }
  }, []);

  const load = useCallback(async () => {
    if (!suiteId) return;
    setLoading(true);
    setError(null);
    try {
      const [current, versions] = await Promise.all([
        testCaseApi.getTestSuite(suiteId),
        testCaseApi.getTestSuiteHistory(suiteId),
      ]);
      setSuite(current);
      setHistory(versions);
      setViewedId(current.id);
      setCode(current.code);
      await loadReport(current.id);
    } catch (err: any) {
      setError(err.message || 'Failed to load the test suite');
    } finally {
      setLoading(false);
    }
  }, [suiteId, loadReport]);

  useEffect(() => {
    load();
  }, [load]);

  const viewed = history.find((version) => version.id === viewedId) ?? suite;
  const isHistorical = Boolean(viewed && !viewed.is_active);
  const isDirty = Boolean(viewed && !isHistorical && code !== viewed.code);
  const reportStale = Boolean(report && (report.is_current === false || isDirty));

  const selectVersion = (versionId: string) => {
    const version = history.find((item) => item.id === versionId);
    if (!version) return;
    setViewedId(versionId);
    setCode(version.code);
    setPreviousScore(null);
    loadReport(versionId);
  };

  const applyHead = (head: TestSuite) => {
    setSuite(head);
    setViewedId(head.id);
    setCode(head.code);
    setSavedAt(new Date().toLocaleTimeString());
  };

  const handleSave = async () => {
    if (!viewed || isHistorical) return;
    setSaving(true);
    setError(null);
    try {
      const updated = await testCaseApi.updateTestSuiteCode(viewed.id, code);
      setHistory((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
      applyHead(updated);
      if (report) setReport({ ...report, is_current: false });
    } catch (err: any) {
      setError(err.message || 'Failed to save code');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveAsNewVersion = async () => {
    if (!viewed || isHistorical) return;
    setSaving(true);
    setError(null);
    try {
      const created = await testCaseApi.saveTestSuiteAsNewVersion(viewed.id, code);
      applyHead(created);
      setHistory(await testCaseApi.getTestSuiteHistory(created.id));
      setReport(null);
      setPreviousScore(null);
      navigate(`/test-script/code-review/${created.id}`, { replace: true });
    } catch (err: any) {
      setError(err.message || 'Failed to save a new version');
    } finally {
      setSaving(false);
    }
  };

  const handleRestore = async () => {
    if (!viewed || !isHistorical) return;
    setSaving(true);
    setError(null);
    try {
      const restored = await testCaseApi.restoreTestSuiteVersion(viewed.id);
      applyHead(restored);
      setHistory(await testCaseApi.getTestSuiteHistory(restored.id));
      setReport(null);
      navigate(`/test-script/code-review/${restored.id}`, { replace: true });
    } catch (err: any) {
      setError(err.message || 'Failed to restore this version');
    } finally {
      setSaving(false);
    }
  };

  const handleSelectForRun = async () => {
    if (!viewed) return;
    setError(null);
    try {
      const updated = await testCaseApi.selectTestSuiteForRun(viewed.id);
      setSuite(updated);
      setHistory((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
    } catch (err: any) {
      setError(err.message || 'Failed to select suite for run');
    }
  };

  const handleDownload = () => {
    if (!viewed) return;
    const blob = new Blob([code], { type: 'text/plain;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = viewed.filename || `suite-${viewed.framework}.txt`;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  // ── Validation handlers ──

  const handleValidate = async () => {
    if (!viewed) return;
    setValidating(true);
    setError(null);
    try {
      // Validation runs against the stored text, so persist unsaved edits first.
      if (isDirty && !isHistorical) {
        const updated = await testCaseApi.updateTestSuiteCode(viewed.id, code);
        setHistory((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
        applyHead(updated);
      }
      const next = await testCaseApi.validateSuite(viewed.id);
      setReport({ ...next, is_current: true });
      setPreviousScore(null);
    } catch (err: any) {
      setError(err.message || 'Validation failed');
    } finally {
      setValidating(false);
    }
  };

  const handleProposeFix = async (findingIds?: string[]) => {
    if (!viewed) return;
    setFixing(true);
    setError(null);
    try {
      setProposal(await testCaseApi.proposeSuiteFix(viewed.id, { findingIds, code }));
    } catch (err: any) {
      setError(err.message || 'Auto-fix failed');
    } finally {
      setFixing(false);
    }
  };

  const handleApplyFix = async () => {
    if (!viewed || !proposal) return;
    setApplyingFix(true);
    setError(null);
    try {
      const before = report?.score ?? null;
      const parentId = report?.id ?? null;
      const created = await testCaseApi.saveTestSuiteAsNewVersion(viewed.id, proposal.fixed_code);
      applyHead(created);
      setHistory(await testCaseApi.getTestSuiteHistory(created.id));
      setProposal(null);
      navigate(`/test-script/code-review/${created.id}`, { replace: true });
      setValidating(true);
      const next = await testCaseApi.validateSuite(created.id, parentId);
      setReport({ ...next, is_current: true });
      setPreviousScore(before);
    } catch (err: any) {
      setError(err.message || 'Failed to apply the fix');
    } finally {
      setApplyingFix(false);
      setValidating(false);
    }
  };

  const jumpToLine = (line: number) => {
    const editor = editorRef.current;
    if (!editor) return;
    editor.revealLineInCenter(line);
    editor.setPosition({ lineNumber: line, column: 1 });
    editor.focus();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-100 border-t-indigo-600" />
      </div>
    );
  }

  if (!viewed) {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
        <AlertTriangle size={18} className="shrink-0" />
        {error || 'Test suite not found.'}
      </div>
    );
  }

  const tone = verdictTone(report?.verdict);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/test-script/code-review')}
            className="rounded-lg border border-slate-200 bg-white p-2 text-slate-400 transition hover:text-indigo-600"
          >
            <ArrowLeft size={16} />
          </button>
          <div>
            <h2 className="text-2xl font-extrabold tracking-tight text-[var(--foreground)] capitalize">
              {viewed.framework} Suite
            </h2>
            <p className="text-xs text-[var(--muted)] mt-1 font-mono">{viewed.filename}</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2">
            <History size={14} className="text-slate-400" />
            <select
              className="bg-transparent text-xs font-bold text-slate-600 outline-none"
              value={viewedId ?? ''}
              onChange={(e) => selectVersion(e.target.value)}
            >
              {history.map((version) => (
                <option key={version.id} value={version.id}>
                  v{version.version}
                  {version.is_active ? ' (active)' : ''}
                </option>
              ))}
            </select>
          </div>
          <button
            type="button"
            onClick={handleDownload}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-500 transition hover:text-indigo-600"
          >
            <Download size={14} /> Download
          </button>
          <button
            type="button"
            onClick={handleValidate}
            disabled={validating || fixing || applyingFix}
            className="inline-flex items-center gap-2 rounded-lg border border-indigo-200 bg-white px-3 py-2 text-xs font-bold text-indigo-600 transition hover:bg-indigo-50 disabled:opacity-50"
          >
            <ShieldCheck size={14} className={validating ? 'animate-pulse' : ''} />
            {validating ? 'Validating…' : 'Validate'}
          </button>
          {isHistorical ? (
            <button
              type="button"
              onClick={handleRestore}
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 px-4 py-2 text-xs font-bold text-white shadow-md shadow-indigo-200 transition hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50"
            >
              <History size={14} /> {saving ? 'Restoring...' : 'Restore This Version'}
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={handleSave}
                disabled={!isDirty || saving}
                className="inline-flex items-center gap-2 rounded-lg border border-indigo-100 bg-indigo-50 px-4 py-2 text-xs font-bold text-indigo-600 transition hover:bg-indigo-100 disabled:opacity-50"
              >
                <Save size={14} /> {saving ? 'Saving...' : 'Save'}
              </button>
              <button
                type="button"
                onClick={handleSaveAsNewVersion}
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-500 transition hover:text-indigo-600 disabled:opacity-50"
              >
                <SaveAll size={14} /> Save as New Version
              </button>
              <button
                type="button"
                onClick={handleSelectForRun}
                disabled={viewed.selected_for_run}
                title={
                  report && report.verdict === 'likely_failing'
                    ? 'The validator predicts this suite is likely to fail — review the findings first'
                    : undefined
                }
                className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 px-4 py-2 text-xs font-bold text-white shadow-md shadow-indigo-200 transition hover:from-indigo-700 hover:to-purple-700 disabled:opacity-60"
              >
                <Rocket size={14} /> {viewed.selected_for_run ? 'Selected for Run' : 'Select for Run'}
              </button>
            </>
          )}
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          <AlertTriangle size={18} className="shrink-0" />
          {error}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <TestCasePill label={viewed.mode === 'dom' ? 'DOM-aware' : 'Abstract'} type="source" />
        <TestCasePill label={viewed.is_active ? 'active head' : 'historical'} type={viewed.is_active ? 'approval' : 'status'} />
        {viewed.is_stale && <TestCasePill label="stale" type="run" />}
        {report && (
          <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold ${tone.bg} ${tone.text}`}>
            <ShieldCheck size={12} /> {report.score}% · {tone.label}
            {reportStale && <span className="text-[10px] font-black uppercase text-amber-500">(outdated)</span>}
          </span>
        )}
        {isHistorical && (
          <span className="text-[10px] font-black uppercase tracking-widest text-amber-500">
            Read-only — restore to edit this version
          </span>
        )}
        {isDirty && <span className="text-[10px] font-black uppercase tracking-widest text-amber-500">Unsaved edits</span>}
        {savedAt && !isDirty && (
          <span className="text-[10px] font-black uppercase tracking-widest text-green-600">Saved {savedAt}</span>
        )}
      </div>

      <div className="grid gap-6 xl:grid-cols-12">
        <div className="xl:col-span-8">
          <TestCaseCodeEditor
            value={code}
            language={monacoLanguage(viewed.language)}
            onChange={setCode}
            onMount={(editor) => {
              editorRef.current = editor;
            }}
            height="680px"
            readOnly={isHistorical}
          />
        </div>
        <div className="xl:col-span-4">
          <ValidationPanel
            className="xl:h-[680px]"
            report={report}
            validating={validating}
            fixing={fixing || applyingFix}
            stale={reportStale}
            targetLabel="suite"
            onValidate={handleValidate}
            onFix={handleProposeFix}
            onJumpToLine={jumpToLine}
            previousScore={previousScore}
          />
        </div>
      </div>

      {proposal && (
        <ValidationFixDialog
          open
          title={`AI auto-fix · ${viewed.framework} suite v${viewed.version}`}
          language={monacoLanguage(viewed.language)}
          original={proposal.original_code}
          fixed={proposal.fixed_code}
          changes={proposal.changes}
          addressed={proposal.addressed_findings}
          staticBefore={proposal.static_before}
          staticAfter={proposal.static_after}
          fixerModel={proposal.fixer_model}
          applying={applyingFix}
          applyLabel="Apply as new version & re-validate"
          onApply={handleApplyFix}
          onClose={() => setProposal(null)}
        />
      )}
    </div>
  );
}
