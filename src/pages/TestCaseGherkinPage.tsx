import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, ArrowRight, Check, FileText, RefreshCw, Save, Sparkles } from 'lucide-react';
import { testCaseApi } from '../api/testCaseApi';
import type { GherkinResult, UserStoryResponse } from '../types/testCase';
import TestCaseCodeEditor from '../components/testCase/TestCaseCodeEditor';
import TestCasePill from '../components/testCase/TestCasePill';

export default function TestCaseGherkinPage() {
  const navigate = useNavigate();
  const [projectId, setProjectId] = useState<string | null>(null);
  const [stories, setStories] = useState<UserStoryResponse[]>([]);
  const [gherkins, setGherkins] = useState<Record<string, GherkinResult | null>>({});
  const [activeStoryId, setActiveStoryId] = useState<string | null>(null);
  const [editorText, setEditorText] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [regenerating, setRegenerating] = useState(false);

  const loadAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const id = projectId ?? (await testCaseApi.ensureProject());
      if (!projectId) setProjectId(id);
      const storyList = await testCaseApi.listStories(id);
      setStories(storyList);

      const results = await Promise.all(
        storyList.map(async (story) => {
          try {
            return [story.id, await testCaseApi.getGherkinForStory(id, story.id)] as const;
          } catch {
            return [story.id, null] as const;
          }
        }),
      );
      const map = Object.fromEntries(results);
      setGherkins(map);

      const firstWithGherkin = storyList.find((story) => map[story.id]);
      const initial = firstWithGherkin?.id ?? storyList[0]?.id ?? null;
      setActiveStoryId((prev) => prev ?? initial);
      if (initial && !activeStoryId) setEditorText(map[initial]?.gherkin_text ?? '');
    } catch (err: any) {
      setError(err.message || 'Failed to load Gherkin scenarios');
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const activeGherkin = activeStoryId ? gherkins[activeStoryId] : null;
  const activeStory = stories.find((story) => story.id === activeStoryId);
  const isDirty = Boolean(activeGherkin && editorText !== activeGherkin.gherkin_text);

  const selectStory = (storyId: string) => {
    setActiveStoryId(storyId);
    setEditorText(gherkins[storyId]?.gherkin_text ?? '');
  };

  const patchGherkin = (storyId: string, result: GherkinResult) => {
    setGherkins((prev) => ({ ...prev, [storyId]: result }));
    setEditorText(result.gherkin_text);
  };

  const handleSave = async () => {
    if (!activeGherkin || !activeStoryId) return;
    setSaving(true);
    setError(null);
    try {
      patchGherkin(activeStoryId, await testCaseApi.updateGherkin(activeGherkin.id, editorText));
    } catch (err: any) {
      setError(err.message || 'Failed to save Gherkin edits');
    } finally {
      setSaving(false);
    }
  };

  const handleApprove = async () => {
    if (!activeGherkin || !activeStoryId) return;
    setError(null);
    try {
      patchGherkin(activeStoryId, await testCaseApi.approveGherkin(activeGherkin.id));
    } catch (err: any) {
      setError(err.message || 'Failed to toggle approval');
    }
  };

  const handleRegenerate = async () => {
    if (!projectId || !activeStoryId) return;
    setRegenerating(true);
    setError(null);
    try {
      if (activeGherkin) {
        patchGherkin(activeStoryId, await testCaseApi.regenerateGherkin(projectId, activeStoryId));
      } else {
        const results = await testCaseApi.generateGherkin(projectId, [activeStoryId]);
        if (results[0]) patchGherkin(activeStoryId, results[0]);
      }
    } catch (err: any) {
      setError(err.message || 'Gherkin generation failed');
    } finally {
      setRegenerating(false);
    }
  };

  const approvedCount = Object.values(gherkins).filter((gherkin) => gherkin?.approved).length;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold tracking-tight text-[var(--foreground)]">Gherkin Editor</h2>
          <p className="text-xs text-[var(--muted)] mt-1">
            Stage 2 — review the AI-generated scenarios, apply QA edits, and approve them for code generation.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={loadAll}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-500 transition hover:text-indigo-600"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh
          </button>
          <button
            type="button"
            onClick={() => navigate('/test-script')}
            disabled={approvedCount === 0}
            className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 px-4 py-2 text-xs font-bold text-white shadow-md shadow-indigo-200 transition hover:from-indigo-700 hover:to-purple-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Continue to Test Script Gen <ArrowRight size={14} />
          </button>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          <AlertTriangle size={18} className="shrink-0" />
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-100 border-t-indigo-600" />
        </div>
      ) : stories.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-slate-200 bg-white px-6 py-16 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
            <FileText size={22} />
          </div>
          <p className="text-sm font-bold text-slate-900">No stories to review</p>
          <p className="max-w-sm text-xs font-medium text-slate-400">
            Add user stories and generate Gherkin from the User Stories stage first.
          </p>
          <button type="button" onClick={() => navigate('/test-case')} className="mt-2 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-md shadow-indigo-200 hover:bg-indigo-700">
            Go to User Stories
          </button>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-12">
          <div className="lg:col-span-3 space-y-2">
            <p className="px-1 text-[10px] font-black uppercase tracking-widest text-slate-400">
              Stories ({approvedCount}/{stories.length} approved)
            </p>
            {stories.map((story) => {
              const gherkin = gherkins[story.id];
              const isActive = story.id === activeStoryId;
              return (
                <button
                  key={story.id}
                  type="button"
                  onClick={() => selectStory(story.id)}
                  className={`w-full rounded-xl border p-4 text-left transition-all ${
                    isActive ? 'border-indigo-200 bg-indigo-50/60 shadow-sm' : 'border-slate-200 bg-white hover:border-indigo-100 hover:shadow-sm'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-xs font-bold text-indigo-600">{story.id}</span>
                    {gherkin?.approved && (
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-green-500/10 text-green-600">
                        <Check size={12} />
                      </span>
                    )}
                  </div>
                  <p className="mt-2 line-clamp-2 text-xs font-semibold leading-4 text-slate-700">{story.action}</p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {gherkin ? (
                      <TestCasePill label={gherkin.edited_by_qa ? 'QA edited' : gherkin.generator} type="source" />
                    ) : (
                      <TestCasePill label="No Gherkin" type="status" />
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          <div className="lg:col-span-9">
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-sm space-y-4">
              {activeGherkin ? (
                <>
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h3 className="text-sm font-black text-slate-900">{activeGherkin.feature_name}</h3>
                      <p className="mt-1 text-[10px] font-black uppercase tracking-widest text-slate-400">
                        {activeStory ? `As a ${activeStory.actor} — ${activeStory.goal}` : activeGherkin.story_id}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <TestCasePill label={activeGherkin.approved ? 'approved' : 'not approved'} type="approval" />
                      {isDirty && <span className="text-[10px] font-black uppercase tracking-widest text-amber-500">Unsaved edits</span>}
                    </div>
                  </div>

                  <TestCaseCodeEditor value={editorText} language="gherkin" onChange={setEditorText} />

                  <div className="flex flex-wrap justify-end gap-2">
                    <button
                      type="button"
                      onClick={handleRegenerate}
                      disabled={regenerating}
                      className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-500 transition hover:text-indigo-600 disabled:opacity-50"
                    >
                      <Sparkles size={14} className={regenerating ? 'animate-pulse' : ''} />
                      {regenerating ? 'Regenerating...' : 'Regenerate with AI'}
                    </button>
                    <button
                      type="button"
                      onClick={handleSave}
                      disabled={!isDirty || saving}
                      className="inline-flex items-center gap-2 rounded-lg border border-indigo-100 bg-indigo-50 px-4 py-2 text-xs font-bold text-indigo-600 transition hover:bg-indigo-100 disabled:opacity-50"
                    >
                      <Save size={14} /> {saving ? 'Saving...' : 'Save Edits'}
                    </button>
                    <button
                      type="button"
                      onClick={handleApprove}
                      className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-bold shadow-md transition ${
                        activeGherkin.approved
                          ? 'border border-slate-200 bg-white text-slate-500 shadow-none hover:text-slate-900'
                          : 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-indigo-200 hover:from-indigo-700 hover:to-purple-700'
                      }`}
                    >
                      <Check size={14} /> {activeGherkin.approved ? 'Revoke Approval' : 'Approve Scenario'}
                    </button>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center gap-3 py-16 text-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
                    <Sparkles size={22} />
                  </div>
                  <p className="text-sm font-bold text-slate-900">No Gherkin for {activeStoryId ?? 'this story'} yet</p>
                  <p className="max-w-sm text-xs font-medium text-slate-400">
                    Generate a scenario with AI — you can edit and approve it afterwards.
                  </p>
                  <button
                    type="button"
                    onClick={handleRegenerate}
                    disabled={regenerating}
                    className="mt-2 inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 px-4 py-2 text-xs font-bold text-white shadow-md shadow-indigo-200 hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50"
                  >
                    <Sparkles size={14} className={regenerating ? 'animate-pulse' : ''} />
                    {regenerating ? 'Generating...' : 'Generate Gherkin'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
