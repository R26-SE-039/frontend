import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, ClipboardList, Plus, RefreshCw, Sparkles, Trash2, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { testCaseApi } from '../api/testCaseApi';
import type { UserStoryResponse } from '../types/testCase';
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
