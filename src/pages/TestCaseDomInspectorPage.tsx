import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowRight,
  CheckCheck,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Terminal,
  Trash2,
  X,
} from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { openCrawlLogStream, testCaseApi } from '../api/testCaseApi';
import type { AuthStrategy, DomElement } from '../types/testCase';
import TestCasePill from '../components/testCase/TestCasePill';
import { loadTestCaseSetup } from '../utils/testCaseSetup';

const inputCls =
  'w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 outline-none transition-all focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100';

type ElementDraft = { role: string; selector: string; tag: string };

export default function TestCaseDomInspectorPage() {
  const navigate = useNavigate();
  const [projectId, setProjectId] = useState<string | null>(null);
  const [url, setUrl] = useState('');
  const [authStrategy, setAuthStrategy] = useState<AuthStrategy>('background');
  const [manualAuth, setManualAuth] = useState({
    login_url: '',
    username_selector: '',
    username_value: '',
    password_selector: '',
    password_value: '',
    submit_selector: '',
  });
  const [storageStateText, setStorageStateText] = useState('');
  const [elements, setElements] = useState<DomElement[]>([]);
  const [logs, setLogs] = useState<string[]>([]);
  const [crawling, setCrawling] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<ElementDraft>({ role: '', selector: '', tag: '' });
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [addDraft, setAddDraft] = useState<ElementDraft>({ role: '', selector: '', tag: '' });
  const logsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    logsRef.current?.scrollTo({ top: logsRef.current.scrollHeight });
  }, [logs]);

  const loadElements = useCallback(async (id: string, targetUrl: string) => {
    const data = await testCaseApi.listDomElements(id, targetUrl || undefined);
    setElements(data);
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const id = await testCaseApi.ensureProject();
        setProjectId(id);
        const setup = loadTestCaseSetup(id);
        setUrl(setup.url);
        await loadElements(id, setup.url);
      } catch (err: any) {
        setError(err.message || 'Failed to load DOM elements');
      } finally {
        setLoading(false);
      }
    })();
  }, [loadElements]);

  const handleCrawl = async () => {
    if (!projectId || !url.trim()) return;
    setCrawling(true);
    setError(null);
    setLogs([]);

    let storageState: unknown;
    if (authStrategy === 'storage_state') {
      try {
        storageState = JSON.parse(storageStateText);
      } catch {
        setError('Storage state must be valid Playwright storageState JSON.');
        setCrawling(false);
        return;
      }
    }

    const runId = crypto.randomUUID();
    const socket = openCrawlLogStream(runId, (line) => setLogs((prev) => [...prev, line]));

    try {
      const result = await testCaseApi.crawlDom(projectId, url.trim(), {
        authStrategy,
        manualAuth: authStrategy === 'manual' ? manualAuth : undefined,
        storageState,
        runId,
      });
      setElements(result.elements);
      setLogs((prev) => [
        ...prev,
        `Crawl finished — ${result.extracted_count} elements via "${result.auth_strategy_used}" auth.`,
        ...result.unmatched_background_steps.map((step) => `Unmatched background step: ${step}`),
      ]);
    } catch (err: any) {
      setError(err.message || 'DOM crawl failed');
    } finally {
      socket.close();
      setCrawling(false);
    }
  };

  const startEdit = (element: DomElement) => {
    setEditingId(element.id);
    setEditDraft({ role: element.role, selector: element.selector, tag: element.tag });
  };

  const saveEdit = async () => {
    if (!editingId) return;
    setError(null);
    try {
      const updated = await testCaseApi.updateDomElement(editingId, editDraft);
      setElements((prev) => prev.map((element) => (element.id === updated.id ? updated : element)));
      setEditingId(null);
    } catch (err: any) {
      setError(err.message || 'Failed to update element');
    }
  };

  const toggleApproved = async (element: DomElement) => {
    setError(null);
    try {
      const updated = await testCaseApi.updateDomElement(element.id, { approved: !element.approved });
      setElements((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
    } catch (err: any) {
      setError(err.message || 'Failed to update approval');
    }
  };

  const handleDelete = async (elementId: string) => {
    setError(null);
    try {
      await testCaseApi.deleteDomElement(elementId);
      setElements((prev) => prev.filter((element) => element.id !== elementId));
    } catch (err: any) {
      setError(err.message || 'Failed to delete element');
    }
  };

  const handleAdd = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!projectId) return;
    setError(null);
    try {
      const created = await testCaseApi.addDomElement({
        project_id: projectId,
        url: url.trim(),
        selector: addDraft.selector.trim(),
        tag: addDraft.tag.trim() || 'div',
        text: null,
        attributes: {},
        role: addDraft.role.trim(),
        source_step: null,
        confidence: null,
      });
      setElements((prev) => {
        const withoutRole = prev.filter((element) => element.id !== created.id);
        return [...withoutRole, created];
      });
      setAddDraft({ role: '', selector: '', tag: '' });
      setIsAddOpen(false);
    } catch (err: any) {
      setError(err.message || 'Failed to add element');
    }
  };

  const handleBulkApprove = async () => {
    if (!projectId) return;
    setError(null);
    try {
      const updated = await testCaseApi.bulkApproveDomElements(projectId, true, url.trim() || undefined);
      setElements(updated);
    } catch (err: any) {
      setError(err.message || 'Bulk approve failed');
    }
  };

  const approvedCount = elements.filter((element) => element.approved).length;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold tracking-tight text-[var(--foreground)]">DOM Inspector</h2>
          <p className="text-xs text-[var(--muted)] mt-1">
            Stage 4 — crawl the staging URL with Playwright and curate the selectors before code generation.
          </p>
        </div>
        <button
          type="button"
          onClick={() => navigate('/test-case/code-review')}
          disabled={elements.length === 0}
          className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 px-4 py-2 text-xs font-bold text-white shadow-md shadow-indigo-200 transition hover:from-indigo-700 hover:to-purple-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Continue to Code Review <ArrowRight size={14} />
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          <AlertTriangle size={18} className="shrink-0" />
          {error}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-12">
        <div className="lg:col-span-5 space-y-6">
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-sm space-y-4">
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Crawl Target</h3>
            <div>
              <label className="mb-1 block text-[10px] font-black uppercase tracking-widest text-slate-400">Staging URL</label>
              <input className={inputCls} value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://staging.yourapp.com" />
            </div>
            <div>
              <label className="mb-1 block text-[10px] font-black uppercase tracking-widest text-slate-400">Auth Strategy</label>
              <select className={inputCls} value={authStrategy} onChange={(e) => setAuthStrategy(e.target.value as AuthStrategy)}>
                <option value="background">Background — replay Gherkin login steps</option>
                <option value="none">None — public page</option>
                <option value="manual">Manual — fixed credentials</option>
                <option value="storage_state">Storage state — SSO / 2FA session</option>
              </select>
            </div>

            {authStrategy === 'manual' && (
              <div className="grid gap-3 md:grid-cols-2">
                {(
                  [
                    ['login_url', 'Login URL'],
                    ['username_selector', 'Username selector'],
                    ['username_value', 'Username value'],
                    ['password_selector', 'Password selector'],
                    ['password_value', 'Password value'],
                    ['submit_selector', 'Submit selector'],
                  ] as const
                ).map(([key, label]) => (
                  <div key={key}>
                    <label className="mb-1 block text-[10px] font-black uppercase tracking-widest text-slate-400">{label}</label>
                    <input
                      className={inputCls}
                      type={key === 'password_value' ? 'password' : 'text'}
                      value={manualAuth[key]}
                      onChange={(e) => setManualAuth({ ...manualAuth, [key]: e.target.value })}
                    />
                  </div>
                ))}
              </div>
            )}

            {authStrategy === 'storage_state' && (
              <div>
                <label className="mb-1 block text-[10px] font-black uppercase tracking-widest text-slate-400">Playwright storageState JSON</label>
                <textarea
                  className={`${inputCls} min-h-28 font-mono text-xs`}
                  value={storageStateText}
                  onChange={(e) => setStorageStateText(e.target.value)}
                  placeholder='{"cookies": [...], "origins": [...]}'
                />
              </div>
            )}

            <button
              type="button"
              onClick={handleCrawl}
              disabled={crawling || !url.trim()}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-indigo-200 transition hover:bg-indigo-700 disabled:opacity-50"
            >
              <Search size={14} className={crawling ? 'animate-pulse' : ''} />
              {crawling ? 'Crawling with Playwright...' : 'Crawl Staging URL'}
            </button>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-950 shadow-sm overflow-hidden">
            <div className="flex items-center gap-2 border-b border-slate-800 px-4 py-3">
              <Terminal size={14} className="text-indigo-400" />
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Live Crawler Log</p>
            </div>
            <div ref={logsRef} className="custom-scrollbar h-56 space-y-1 overflow-y-auto p-4 font-mono text-[11px] leading-4 text-slate-300">
              {logs.length === 0 ? (
                <p className="text-slate-600">Logs stream here while the crawler runs.</p>
              ) : (
                logs.map((line, index) => <p key={index}>{line}</p>)
              )}
            </div>
          </div>
        </div>

        <div className="lg:col-span-7">
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] shadow-sm overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-6 py-4">
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">
                Extracted Elements ({approvedCount}/{elements.length} approved)
              </h3>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddOpen((prev) => !prev)}
                  className="inline-flex items-center gap-2 rounded-lg border border-indigo-100 bg-indigo-50 px-3 py-1.5 text-[11px] font-black text-indigo-600 transition hover:bg-indigo-100"
                >
                  <Plus size={13} /> Add
                </button>
                <button
                  type="button"
                  onClick={handleBulkApprove}
                  disabled={elements.length === 0}
                  className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-3 py-1.5 text-[11px] font-black text-white shadow-sm transition hover:bg-indigo-700 disabled:opacity-50"
                >
                  <CheckCheck size={13} /> Approve All
                </button>
              </div>
            </div>

            <AnimatePresence>
              {isAddOpen && (
                <motion.form
                  key="add-element"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  onSubmit={handleAdd}
                  className="border-b border-slate-100 bg-slate-50/60 px-6 py-4"
                >
                  <div className="grid gap-3 md:grid-cols-3">
                    <input className={inputCls} required placeholder="role (e.g. login_button)" value={addDraft.role} onChange={(e) => setAddDraft({ ...addDraft, role: e.target.value })} />
                    <input className={inputCls} required placeholder="selector (e.g. #login-button)" value={addDraft.selector} onChange={(e) => setAddDraft({ ...addDraft, selector: e.target.value })} />
                    <input className={inputCls} placeholder="tag (e.g. button)" value={addDraft.tag} onChange={(e) => setAddDraft({ ...addDraft, tag: e.target.value })} />
                  </div>
                  <div className="mt-3 flex justify-end gap-2">
                    <button type="button" onClick={() => setIsAddOpen(false)} className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-black text-slate-500">
                      Cancel
                    </button>
                    <button type="submit" className="rounded-lg bg-indigo-600 px-3 py-1.5 text-[11px] font-black text-white hover:bg-indigo-700">
                      Save Element
                    </button>
                  </div>
                </motion.form>
              )}
            </AnimatePresence>

            {loading ? (
              <div className="flex items-center justify-center py-16">
                <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-100 border-t-indigo-600" />
              </div>
            ) : elements.length === 0 ? (
              <div className="flex flex-col items-center gap-3 px-6 py-16 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
                  <Search size={22} />
                </div>
                <p className="text-sm font-bold text-slate-900">No elements yet</p>
                <p className="max-w-sm text-xs font-medium text-slate-400">
                  Run a crawl against the staging URL to extract interactive elements and their selectors.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 text-[10px] font-black uppercase tracking-widest text-slate-400">
                      <th className="px-6 py-3">Role</th>
                      <th className="px-4 py-3">Selector</th>
                      <th className="px-4 py-3">Tag</th>
                      <th className="px-4 py-3">Confidence</th>
                      <th className="px-4 py-3">Approved</th>
                      <th className="px-4 py-3" />
                    </tr>
                  </thead>
                  <tbody>
                    {elements.map((element) => (
                      <tr key={element.id} className="border-b border-slate-50 hover:bg-slate-50/60">
                        {editingId === element.id ? (
                          <>
                            <td className="px-6 py-3"><input className={`${inputCls} text-xs`} value={editDraft.role} onChange={(e) => setEditDraft({ ...editDraft, role: e.target.value })} /></td>
                            <td className="px-4 py-3"><input className={`${inputCls} font-mono text-xs`} value={editDraft.selector} onChange={(e) => setEditDraft({ ...editDraft, selector: e.target.value })} /></td>
                            <td className="px-4 py-3"><input className={`${inputCls} w-20 text-xs`} value={editDraft.tag} onChange={(e) => setEditDraft({ ...editDraft, tag: e.target.value })} /></td>
                            <td className="px-4 py-3" colSpan={2}>
                              <div className="flex gap-2">
                                <button type="button" onClick={saveEdit} className="rounded-lg bg-indigo-600 px-3 py-1.5 text-[11px] font-black text-white hover:bg-indigo-700">Save</button>
                                <button type="button" onClick={() => setEditingId(null)} className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-black text-slate-500"><X size={12} /></button>
                              </div>
                            </td>
                            <td className="px-4 py-3" />
                          </>
                        ) : (
                          <>
                            <td className="px-6 py-3">
                              <span className="font-mono text-xs font-bold text-indigo-600">{element.role}</span>
                              {element.edited_by_qa && <p className="mt-1 text-[9px] font-black uppercase tracking-widest text-amber-500">QA edited</p>}
                            </td>
                            <td className="max-w-56 truncate px-4 py-3 font-mono text-xs text-slate-600" title={element.selector}>{element.selector}</td>
                            <td className="px-4 py-3 text-xs font-bold text-slate-500">{element.tag}</td>
                            <td className="px-4 py-3">
                              {element.confidence != null ? (
                                <TestCasePill label={`${Math.round(element.confidence * 100)}%`} type={element.confidence >= 0.8 ? 'approval' : 'status'} />
                              ) : (
                                <span className="text-xs font-bold text-slate-300">—</span>
                              )}
                            </td>
                            <td className="px-4 py-3">
                              <input type="checkbox" checked={element.approved} onChange={() => toggleApproved(element)} className="h-4 w-4 accent-indigo-600" />
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex gap-1">
                                <button type="button" onClick={() => startEdit(element)} className="rounded-lg p-2 text-slate-300 transition hover:bg-indigo-50 hover:text-indigo-600" title="Edit element">
                                  <Pencil size={14} />
                                </button>
                                <button type="button" onClick={() => handleDelete(element.id)} className="rounded-lg p-2 text-slate-300 transition hover:bg-red-50 hover:text-red-600" title="Delete element">
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </td>
                          </>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => projectId && loadElements(projectId, url)}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-500 transition hover:text-indigo-600"
        >
          <RefreshCw size={14} /> Reload elements
        </button>
      </div>
    </div>
  );
}
