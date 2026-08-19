import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, ClipboardList, Download, Plus, RefreshCw, Sparkles, Trash2, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { testCaseApi } from '../api/testCaseApi';
import { meetingApi } from '../api/meetingApi';
import type { C1IterationStoriesResponse, C1IterationStory, UserStoryPayload, UserStoryResponse } from '../types/testCase';
import TestCaseStatCard from '../components/testCase/TestCaseStatCard';
import TestCasePill from '../components/testCase/TestCasePill';

const inputCls =
  'w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 outline-none transition-all focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100';

type StoryDraft = {
  id: string;
  actor: string;
  action: string;
  goal: string;
  priority: string;
  acceptanceCriteria: string;
};

const emptyDraft: StoryDraft = {
  id: '',
  actor: '',
  action: '',
  goal: '',
  priority: 'medium',
  acceptanceCriteria: '',
};

// C1 stories use MoSCoW priorities; C2 uses high/medium/low.
const PRIORITY_FROM_C1: Record<string, string> = {
  must: 'high',
  should: 'medium',
  could: 'low',
  high: 'high',
  medium: 'medium',
  low: 'low',
};

/** Split a "As a X, I want Y, so that Z" sentence into C2's actor/action/goal fields. */
function parseStoryText(story: C1IterationStory): { actor: string; action: string; goal: string } {
  const match = /as\s+(?:an?\s+)?(.+?),\s*i\s+(?:want|need|would like)\s+(?:to\s+)?(.+?),?\s+so\s+that\s+(.+?)\.?\s*$/i.exec(
    (story.story || '').trim(),
  );
  if (match) return { actor: match[1].trim(), action: match[2].trim(), goal: match[3].trim() };
  return {
    actor: 'user',
    action: story.title || story.story || 'complete the described flow',
    goal: 'the described outcome is achieved',
  };
}

function toC2Payload(story: C1IterationStory, iterationId?: string | null): UserStoryPayload {
  return {
    // Keep the C1 UUID so re-importing updates the story instead of duplicating it.
    id: story.id,
    ...parseStoryText(story),
    priority: PRIORITY_FROM_C1[(story.priority || '').toLowerCase()] ?? 'medium',
    status: 'pending',
    source: 'C1',
    acceptance_criteria: story.acceptance_criteria ?? [],
    // Auth-service iteration reference — lets C2 (and later RTM) trace the
    // story back to the sprint it came from.
    iteration_id: iterationId ?? null,
  };
}

export default function TestCaseStoriesPage() {
  const navigate = useNavigate();
  const [projectId, setProjectId] = useState<string | null>(null);
  const [stories, setStories] = useState<UserStoryResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [draft, setDraft] = useState<StoryDraft>(emptyDraft);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [importLoading, setImportLoading] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [c1Stories, setC1Stories] = useState<C1IterationStory[]>([]);
  const [iterationName, setIterationName] = useState<string | null>(null);
  const [iterationId, setIterationId] = useState<string | null>(null);
  const [importSelected, setImportSelected] = useState<Set<string>>(new Set());
  const [importing, setImporting] = useState(false);

  const loadStories = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const id = projectId ?? (await testCaseApi.ensureProject());
      if (!projectId) setProjectId(id);
      const data = await testCaseApi.listStories(id);
      setStories(data);
      setSelectedIds((prev) => new Set([...prev].filter((sid) => data.some((story) => story.id === sid))));
    } catch (err: any) {
      setError(err.message || 'Failed to load user stories');
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    loadStories();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const nextStoryId = useMemo(() => {
    const numbers = stories
      .map((story) => /^US-(\d+)$/.exec(story.id))
      .filter(Boolean)
      .map((match) => parseInt(match![1], 10));
    const next = numbers.length ? Math.max(...numbers) + 1 : 1;
    return `US-${String(next).padStart(3, '0')}`;
  }, [stories]);

  const visibleStories = useMemo(
    () => (priorityFilter === 'all' ? stories : stories.filter((story) => story.priority === priorityFilter)),
    [stories, priorityFilter],
  );

  const toggleSelected = (storyId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(storyId)) next.delete(storyId);
      else next.add(storyId);
      return next;
    });
  };

  const toggleSelectAll = () => {
    setSelectedIds((prev) =>
      prev.size === visibleStories.length ? new Set() : new Set(visibleStories.map((story) => story.id)),
    );
  };

  const openForm = () => {
    setDraft({ ...emptyDraft, id: nextStoryId });
    setIsFormOpen(true);
  };

  const handleAddStory = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!projectId) return;
    setSaving(true);
    setError(null);
    try {
      await testCaseApi.addStory(projectId, {
        id: draft.id.trim() || nextStoryId,
        actor: draft.actor.trim(),
        action: draft.action.trim(),
        goal: draft.goal.trim(),
        priority: draft.priority,
        status: 'pending',
        source: 'manual',
        acceptance_criteria: draft.acceptanceCriteria
          .split('\n')
          .map((line) => line.trim())
          .filter(Boolean),
      });
      setIsFormOpen(false);
      setDraft(emptyDraft);
      await loadStories();
    } catch (err: any) {
      setError(err.message || 'Failed to save the user story');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (storyId: string) => {
    if (!projectId) return;
    setError(null);
    try {
      await testCaseApi.deleteStory(projectId, storyId);
      await loadStories();
    } catch (err: any) {
      setError(err.message || 'Failed to delete the user story');
    }
  };

  const openImport = async () => {
    setImportOpen(true);
    setImportLoading(true);
    setImportError(null);
    try {
      const id = projectId ?? (await testCaseApi.ensureProject());
      if (!projectId) setProjectId(id);
      const data: C1IterationStoriesResponse = await meetingApi.getIterationStories(id);
      const fetched = data.stories ?? [];
      setC1Stories(fetched);
      setIterationName((data.iteration?.name as string) ?? null);
      setIterationId(data.iteration?.id ?? null);
      // Preselect BA-approved stories; fall back to everything when none are approved yet.
      const approved = fetched.filter((story) => (story.status || '').toLowerCase() === 'approved');
      setImportSelected(new Set((approved.length ? approved : fetched).map((story) => story.id)));
    } catch (err: any) {
      setImportError(err.message || 'Failed to load stories from the User Story service');
      setC1Stories([]);
      setImportSelected(new Set());
    } finally {
      setImportLoading(false);
    }
  };

  const toggleImportSelected = (storyId: string) => {
    setImportSelected((prev) => {
      const next = new Set(prev);
      if (next.has(storyId)) next.delete(storyId);
      else next.add(storyId);
      return next;
    });
  };

  const handleImport = async () => {
    if (!projectId || importSelected.size === 0) return;
    setImporting(true);
    setImportError(null);
    try {
      const payloads = c1Stories
        .filter((story) => importSelected.has(story.id))
        .map((story) => toC2Payload(story, iterationId));
      await testCaseApi.saveStories(projectId, payloads);
      setImportOpen(false);
      await loadStories();
    } catch (err: any) {
      setImportError(err.message || 'Failed to import the selected stories');
    } finally {
      setImporting(false);
    }
  };

  const handleGenerate = async () => {
    if (!projectId || selectedIds.size === 0) return;
    setGenerating(true);
    setError(null);
    try {
      await testCaseApi.generateGherkin(projectId, [...selectedIds]);
      navigate('/test-case/gherkin');
    } catch (err: any) {
      setError(err.message || 'Gherkin generation failed');
    } finally {
      setGenerating(false);
    }
  };

  const highPriorityCount = stories.filter((story) => story.priority === 'high').length;
  const fromMeetingsCount = stories.filter((story) => story.source === 'C1').length;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold tracking-tight text-[var(--foreground)]">User Story Intake</h2>
          <p className="text-xs text-[var(--muted)] mt-1">
            Stage 1 — curate the stories that feed Gherkin generation. Stories arrive from Agile meetings or manual entry.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={loadStories}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-500 transition hover:text-indigo-600"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh
          </button>
          <button
            type="button"
            onClick={openImport}
            className="inline-flex items-center gap-2 rounded-lg border border-purple-100 bg-purple-50 px-3 py-2 text-xs font-bold text-purple-600 transition hover:bg-purple-100"
          >
            <Download size={14} /> Import from Meetings
          </button>
          <button
            type="button"
            onClick={openForm}
            className="inline-flex items-center gap-2 rounded-lg border border-indigo-100 bg-indigo-50 px-3 py-2 text-xs font-bold text-indigo-600 transition hover:bg-indigo-100"
          >
            <Plus size={14} /> Add Story
          </button>
          <button
            type="button"
            onClick={handleGenerate}
            disabled={selectedIds.size === 0 || generating}
            className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 px-4 py-2 text-xs font-bold text-white shadow-md shadow-indigo-200 transition hover:from-indigo-700 hover:to-purple-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Sparkles size={14} className={generating ? 'animate-pulse' : ''} />
            {generating ? 'Generating Gherkin...' : `Generate Gherkin (${selectedIds.size})`}
          </button>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          <AlertTriangle size={18} className="shrink-0" />
          {error}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <TestCaseStatCard title="Total Stories" value={loading ? '--' : String(stories.length)} change="Project backlog" />
        <TestCaseStatCard title="High Priority" value={loading ? '--' : String(highPriorityCount)} change="Needs coverage first" />
        <TestCaseStatCard title="From Meetings" value={loading ? '--' : String(fromMeetingsCount)} change="Captured by Agile Meeting Hub" />
        <TestCaseStatCard title="Selected" value={String(selectedIds.size)} change="Queued for Gherkin generation" />
      </div>

      <AnimatePresence>
        {isFormOpen && (
          <motion.form
            key="story-form"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            onSubmit={handleAddStory}
            className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-sm space-y-4"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">New User Story</h3>
              <button type="button" onClick={() => setIsFormOpen(false)} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-50 hover:text-slate-900">
                <X size={16} />
              </button>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-[10px] font-black uppercase tracking-widest text-slate-400">Story ID</label>
                <input className={inputCls} value={draft.id} onChange={(e) => setDraft({ ...draft, id: e.target.value })} placeholder={nextStoryId} />
              </div>
              <div>
                <label className="mb-1 block text-[10px] font-black uppercase tracking-widest text-slate-400">Priority</label>
                <select className={inputCls} value={draft.priority} onChange={(e) => setDraft({ ...draft, priority: e.target.value })}>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-[10px] font-black uppercase tracking-widest text-slate-400">Actor (As a...)</label>
                <input className={inputCls} required value={draft.actor} onChange={(e) => setDraft({ ...draft, actor: e.target.value })} placeholder="registered user" />
              </div>
              <div>
                <label className="mb-1 block text-[10px] font-black uppercase tracking-widest text-slate-400">Action (I want to...)</label>
                <input className={inputCls} required value={draft.action} onChange={(e) => setDraft({ ...draft, action: e.target.value })} placeholder="log in with my credentials" />
              </div>
              <div className="md:col-span-2">
                <label className="mb-1 block text-[10px] font-black uppercase tracking-widest text-slate-400">Goal (So that...)</label>
                <input className={inputCls} required value={draft.goal} onChange={(e) => setDraft({ ...draft, goal: e.target.value })} placeholder="I can access my dashboard" />
              </div>
              <div className="md:col-span-2">
                <label className="mb-1 block text-[10px] font-black uppercase tracking-widest text-slate-400">Acceptance Criteria (one per line)</label>
                <textarea
                  className={`${inputCls} min-h-24 font-mono text-xs`}
                  value={draft.acceptanceCriteria}
                  onChange={(e) => setDraft({ ...draft, acceptanceCriteria: e.target.value })}
                  placeholder={'Valid credentials open the dashboard\nInvalid credentials show an error message'}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setIsFormOpen(false)} className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-900">
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="rounded-lg bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-md shadow-indigo-200 transition hover:bg-indigo-700 disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save Story'}
              </button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {importOpen && (
          <motion.div
            key="import-modal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4"
          >
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 14 }}
              className="flex max-h-[85vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
            >
              <div className="flex items-start justify-between border-b border-slate-100 px-6 py-4">
                <div>
                  <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Import from Agile Meetings</h3>
                  <p className="mt-1 text-xs font-medium text-slate-400">
                    Stories generated by the User Story service for{' '}
                    {iterationName ? <span className="font-bold text-slate-600">{iterationName}</span> : 'the active iteration'} — via the
                    API Gateway.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setImportOpen(false)}
                  className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-50 hover:text-slate-900"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto px-6 py-4">
                {importError && (
                  <div className="mb-4 flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                    <AlertTriangle size={18} className="shrink-0" />
                    {importError}
                  </div>
                )}

                {importLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="h-10 w-10 animate-spin rounded-full border-4 border-purple-100 border-t-purple-600" />
                  </div>
                ) : c1Stories.length === 0 ? (
                  !importError && (
                    <div className="flex flex-col items-center gap-3 py-12 text-center">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-50 text-purple-600">
                        <ClipboardList size={22} />
                      </div>
                      <p className="text-sm font-bold text-slate-900">No stories in the active iteration</p>
                      <p className="max-w-sm text-xs font-medium text-slate-400">
                        Run a sprint meeting or upload a transcript in the Agile Meeting Hub first, then import the generated stories
                        here.
                      </p>
                    </div>
                  )
                ) : (
                  <ul className="space-y-3">
                    {c1Stories.map((story) => {
                      const mapped = toC2Payload(story);
                      const checked = importSelected.has(story.id);
                      return (
                        <li key={story.id}>
                          <label
                            className={`flex cursor-pointer items-start gap-3 rounded-xl border px-4 py-3 transition ${
                              checked ? 'border-purple-200 bg-purple-50/50' : 'border-slate-200 hover:bg-slate-50/60'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => toggleImportSelected(story.id)}
                              className="mt-1 h-4 w-4 accent-purple-600"
                            />
                            <div className="min-w-0 flex-1">
                              <p className="text-xs font-black text-slate-900">{story.title}</p>
                              <p className="mt-1 text-xs font-medium leading-5 text-slate-500">{story.story}</p>
                              <div className="mt-2 flex flex-wrap items-center gap-2">
                                <TestCasePill label={mapped.priority} type="priority" />
                                {story.status && (
                                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-black uppercase tracking-widest text-slate-500">
                                    {story.status}
                                  </span>
                                )}
                                <span className="text-[10px] font-bold text-slate-400">
                                  {(story.acceptance_criteria ?? []).length} criteria
                                </span>
                              </div>
                            </div>
                          </label>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>

              <div className="flex items-center justify-between border-t border-slate-100 px-6 py-4">
                <p className="text-xs font-bold text-slate-400">
                  {importSelected.size} of {c1Stories.length} selected
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setImportOpen(false)}
                    className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-900"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleImport}
                    disabled={importSelected.size === 0 || importing}
                    className="inline-flex items-center gap-2 rounded-lg bg-purple-600 px-4 py-2 text-xs font-bold text-white shadow-md shadow-purple-200 transition hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <Download size={14} className={importing ? 'animate-pulse' : ''} />
                    {importing ? 'Importing...' : `Import ${importSelected.size} ${importSelected.size === 1 ? 'story' : 'stories'}`}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] shadow-sm overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-6 py-4">
          <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Backlog Stories</h3>
          <select className={`${inputCls} w-auto`} value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)}>
            <option value="all">All priorities</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-100 border-t-indigo-600" />
          </div>
        ) : visibleStories.length === 0 ? (
          <div className="flex flex-col items-center gap-3 px-6 py-16 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
              <ClipboardList size={22} />
            </div>
            <p className="text-sm font-bold text-slate-900">No user stories yet</p>
            <p className="max-w-sm text-xs font-medium text-slate-400">
              Add a story manually or generate stories from a sprint meeting in the Agile Meeting Hub.
            </p>
            <button type="button" onClick={openForm} className="mt-2 inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-md shadow-indigo-200 hover:bg-indigo-700">
              <Plus size={14} /> Add your first story
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-[10px] font-black uppercase tracking-widest text-slate-400">
                  <th className="px-6 py-3">
                    <input
                      type="checkbox"
                      checked={visibleStories.length > 0 && selectedIds.size === visibleStories.length}
                      onChange={toggleSelectAll}
                      className="h-4 w-4 accent-indigo-600"
                    />
                  </th>
                  <th className="px-4 py-3">ID</th>
                  <th className="px-4 py-3">Story</th>
                  <th className="px-4 py-3">Priority</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Source</th>
                  <th className="px-4 py-3">Criteria</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {visibleStories.map((story) => (
                  <tr key={story.id} className={`border-b border-slate-50 transition-colors ${selectedIds.has(story.id) ? 'bg-indigo-50/40' : 'hover:bg-slate-50/60'}`}>
                    <td className="px-6 py-4">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(story.id)}
                        onChange={() => toggleSelected(story.id)}
                        className="h-4 w-4 accent-indigo-600"
                      />
                    </td>
                    <td className="px-4 py-4 font-mono text-xs font-bold text-indigo-600">{story.id}</td>
                    <td className="px-4 py-4 max-w-md">
                      <p className="text-xs font-semibold leading-5 text-slate-700">
                        As a <span className="text-slate-900">{story.actor}</span>, I want to{' '}
                        <span className="text-slate-900">{story.action}</span>, so that{' '}
                        <span className="text-slate-900">{story.goal}</span>.
                      </p>
                    </td>
                    <td className="px-4 py-4"><TestCasePill label={story.priority} type="priority" /></td>
                    <td className="px-4 py-4"><TestCasePill label={story.status} type="status" /></td>
                    <td className="px-4 py-4"><TestCasePill label={story.source === 'C1' ? 'C1' : 'Manual'} type="source" /></td>
                    <td className="px-4 py-4 text-xs font-bold text-slate-500">{story.acceptance_criteria.length}</td>
                    <td className="px-4 py-4">
                      <button
                        type="button"
                        onClick={() => handleDelete(story.id)}
                        className="rounded-lg p-2 text-slate-300 transition hover:bg-red-50 hover:text-red-600"
                        title="Delete story"
                      >
                        <Trash2 size={15} />
                      </button>
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
