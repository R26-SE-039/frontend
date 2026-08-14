import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AlertTriangle, Sparkles, Check, CheckCircle2, ChevronRight, ChevronLeft,
  Edit3, Trash2, HelpCircle, ArrowRight, Loader2, Play
} from 'lucide-react';
import { meetingApi } from '../../api/meetingApi';

interface RequirementsFinalizerProps {
  meetingId: string;
  onBack: () => void;
  onFinalized: () => void;
}

interface Requirement {
  id: string;
  requirement_text: string;
  requirement_type: string;
  status: string;
}

interface Conflict {
  id: string;
  requirement_a_id: string;
  requirement_b_id: string;
  conflict_type: string;
  severity: string;
  explanation: string;
}

interface Resolution {
  conflict_id: string;
  resolution_type: 'keep_a' | 'keep_b' | 'merge' | 'dismiss';
  merged_text?: string;
}

interface RequirementThread {
  topic_label: string | undefined;
  id?: string;
  thread_id?: string;
  meeting_id?: string;
  requirement_title?: string;
  summary?: string;
  thread_label?: string;
  summary_text?: string;
  state?: string;
  created_at?: string;
}

export const RequirementsFinalizer: React.FC<RequirementsFinalizerProps> = ({
  meetingId,
  onBack,
  onFinalized
}) => {
  const [loading, setLoading] = useState(true);
  const [requirements, setRequirements] = useState<Requirement[]>([]);
  const [threads, setThreads] = useState<RequirementThread[]>([]);
  const [conflicts, setConflicts] = useState<Conflict[]>([]);
  const [currentConflictIdx, setCurrentConflictIdx] = useState(0);
  const [resolutions, setResolutions] = useState<Record<string, Resolution>>({});
  const [editedTexts, setEditedTexts] = useState<Record<string, string>>({});
  const [editedThreads, setEditedThreads] = useState<Record<string, { summary: string; action: 'VALIDATED' | 'DISCARDED' }>>({});
  const [editingReqId, setEditingReqId] = useState<string | null>(null);
  const [editingThreadId, setEditingThreadId] = useState<string | null>(null);
  const [mergeTextInput, setMergeTextInput] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, [meetingId]);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const reqRes = await meetingApi.getRequirements(meetingId);
      const confRes = await meetingApi.getConflicts(meetingId);

      const loadedReqs = reqRes.requirements || [];
      const loadedThreads: RequirementThread[] = reqRes.threads || [];

      setRequirements(loadedReqs);
      setThreads(loadedThreads);
      setConflicts(confRes.conflicts || []);

      // Initialize raw requirement edited text cache
      const textMap: Record<string, string> = {};
      loadedReqs.forEach((r: Requirement) => {
        textMap[r.id] = r.requirement_text;
      });
      setEditedTexts(textMap);

      // Initialize thread edits map
      const threadEditMap: Record<string, { summary: string; action: 'VALIDATED' | 'DISCARDED' }> = {};
      loadedThreads.forEach(t => {
        const tid = t.thread_id || t.id || '';
        if (tid) {
          threadEditMap[tid] = {
            summary: t.summary || t.summary_text || t.requirement_title || 'Consolidated Requirement',
            action: t.state === 'DISCARDED' ? 'DISCARDED' : 'VALIDATED'
          };
        }
      });
      setEditedThreads(threadEditMap);
    } catch (err: any) {
      setError(err.message || 'Failed to load requirements data');
    } finally {
      setLoading(false);
    }
  };

  const currentConflict = conflicts[currentConflictIdx];
  const reqA = requirements.find(r => r.id === currentConflict?.requirement_a_id);
  const reqB = requirements.find(r => r.id === currentConflict?.requirement_b_id);

  // Initialize merge text with combined requirement text
  useEffect(() => {
    if (reqA && reqB) {
      setMergeTextInput(`${editedTexts[reqA.id]} AND ${editedTexts[reqB.id]}`);
    }
  }, [currentConflictIdx, reqA, reqB]);

  const handleResolve = (type: 'keep_a' | 'keep_b' | 'merge' | 'dismiss') => {
    if (!currentConflict) return;

    const newResolution: Resolution = {
      conflict_id: currentConflict.id,
      resolution_type: type,
      ...(type === 'merge' ? { merged_text: mergeTextInput } : {})
    };

    setResolutions(prev => ({
      ...prev,
      [currentConflict.id]: newResolution
    }));

    // Auto-advance to next conflict if available
    if (currentConflictIdx < conflicts.length - 1) {
      setCurrentConflictIdx(prev => prev + 1);
    }
  };

  const handleSaveResolution = async () => {
    setSaving(true);
    setError(null);
    try {
      const resolutionList = Object.values(resolutions);

      // Compile edited requirements list (only for requirements still active/not discarded)
      const editedList = Object.entries(editedTexts).map(([id, text]) => ({
        requirement_id: id,
        text
      }));

      const editedThreadList = Object.entries(editedThreads).map(([tid, data]) => ({
        thread_id: tid,
        summary: data.summary,
        action: data.action
      }));

      await meetingApi.finalizeRequirements(meetingId, resolutionList, editedList, editedThreadList);
      onFinalized();
    } catch (err: any) {
      setError(err.message || 'Failed to save finalized requirements.');
    } finally {
      setSaving(false);
    }
  };

  const getConflictResolutionStatus = (conflictId: string) => {
    const res = resolutions[conflictId];
    if (!res) return 'Unresolved';
    if (res.resolution_type === 'keep_a') return 'Kept Req A';
    if (res.resolution_type === 'keep_b') return 'Kept Req B';
    if (res.resolution_type === 'merge') return 'Merged';
    return 'Dismissed';
  };

  if (loading) {
    return (
      <div className="fixed inset-0 z-[120] bg-white flex flex-col items-center justify-center py-32 text-center">
        <Loader2 className="w-16 h-16 text-indigo-600 animate-spin mb-4" />
        <h3 className="text-xl font-bold text-gray-900">Loading requirements & conflicts...</h3>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[120] bg-gray-50 flex flex-col overflow-hidden animate-in fade-in duration-300 text-left">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-8 py-5 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
            <Sparkles size={20} />
          </div>
          <div>
            <h2 className="text-lg font-black text-gray-900 tracking-tight">Review & Finalize Requirements</h2>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">Session: {meetingId}</p>
          </div>
        </div>
        <button
          onClick={onBack}
          className="px-4 py-2 text-xs font-bold text-gray-500 hover:bg-gray-100 rounded-xl transition-all"
        >
          Cancel
        </button>
      </header>

      {/* Main layout */}
      <main className="flex-grow flex overflow-hidden">
        {/* Left Side: Conflicts Resolution Wizard */}
        <section className="w-full lg:w-[55%] border-r border-gray-200 bg-white p-8 overflow-y-auto custom-scrollbar flex flex-col">
          {conflicts.length > 0 ? (
            <div className="flex-grow flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-6">
                  <span className="px-3 py-1 bg-red-50 border border-red-100 text-red-600 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 animate-pulse">
                    <AlertTriangle size={12} /> Real-Time Conflicts ({conflicts.length})
                  </span>
                  <div className="flex gap-2">
                    <button
                      disabled={currentConflictIdx === 0}
                      onClick={() => setCurrentConflictIdx(prev => prev - 1)}
                      className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:hover:bg-transparent"
                    >
                      <ChevronLeft size={16} />
                    </button>
                    <span className="text-xs font-bold text-gray-500 self-center">
                      {currentConflictIdx + 1} of {conflicts.length}
                    </span>
                    <button
                      disabled={currentConflictIdx === conflicts.length - 1}
                      onClick={() => setCurrentConflictIdx(prev => prev + 1)}
                      className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:hover:bg-transparent"
                    >
                      <ChevronRight size={16} />
                    </button>
                  </div>
                </div>

                <div className="bg-amber-50/50 border border-amber-200/60 rounded-3xl p-6 mb-8">
                  <h4 className="text-xs font-black text-amber-800 uppercase tracking-widest mb-2">AI Conflict Explanation</h4>
                  <p className="text-sm text-amber-900 leading-relaxed font-semibold">
                    {currentConflict.explanation}
                  </p>
                </div>

                {/* Requirement A & B Comparison */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                  {/* Req A Card */}
                  {reqA && (
                    <div className={`p-5 rounded-2xl border transition-all ${resolutions[currentConflict.id]?.resolution_type === 'keep_a'
                        ? 'border-emerald-500 bg-emerald-50/20'
                        : 'border-gray-200 bg-gray-50/50'
                      }`}>
                      <span className="text-[9px] font-black text-indigo-500 uppercase tracking-widest block mb-2">Requirement A</span>
                      {editingReqId === reqA.id ? (
                        <textarea
                          value={editedTexts[reqA.id]}
                          onChange={(e) => setEditedTexts(prev => ({ ...prev, [reqA.id]: e.target.value }))}
                          onBlur={() => setEditingReqId(null)}
                          className="w-full text-sm font-semibold p-3 border border-indigo-200 bg-white rounded-xl focus:outline-none focus:border-indigo-400 leading-relaxed"
                          rows={3}
                          autoFocus
                        />
                      ) : (
                        <p className="text-sm font-semibold text-gray-800 leading-relaxed min-h-[60px]">
                          {editedTexts[reqA.id]}
                        </p>
                      )}
                      <div className="mt-4 flex justify-between items-center">
                        <button
                          onClick={() => setEditingReqId(reqA.id)}
                          className="text-xs text-gray-400 hover:text-indigo-600 font-bold flex items-center gap-1"
                        >
                          <Edit3 size={12} /> Edit
                        </button>
                        <button
                          onClick={() => handleResolve('keep_a')}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${resolutions[currentConflict.id]?.resolution_type === 'keep_a'
                              ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-100'
                              : 'border border-gray-200 text-gray-600 hover:bg-gray-100'
                            }`}
                        >
                          Keep Req A
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Req B Card */}
                  {reqB && (
                    <div className={`p-5 rounded-2xl border transition-all ${resolutions[currentConflict.id]?.resolution_type === 'keep_b'
                        ? 'border-emerald-500 bg-emerald-50/20'
                        : 'border-gray-200 bg-gray-50/50'
                      }`}>
                      <span className="text-[9px] font-black text-indigo-500 uppercase tracking-widest block mb-2">Requirement B</span>
                      {editingReqId === reqB.id ? (
                        <textarea
                          value={editedTexts[reqB.id]}
                          onChange={(e) => setEditedTexts(prev => ({ ...prev, [reqB.id]: e.target.value }))}
                          onBlur={() => setEditingReqId(null)}
                          className="w-full text-sm font-semibold p-3 border border-indigo-200 bg-white rounded-xl focus:outline-none focus:border-indigo-400 leading-relaxed"
                          rows={3}
                          autoFocus
                        />
                      ) : (
                        <p className="text-sm font-semibold text-gray-800 leading-relaxed min-h-[60px]">
                          {editedTexts[reqB.id]}
                        </p>
                      )}
                      <div className="mt-4 flex justify-between items-center">
                        <button
                          onClick={() => setEditingReqId(reqB.id)}
                          className="text-xs text-gray-400 hover:text-indigo-600 font-bold flex items-center gap-1"
                        >
                          <Edit3 size={12} /> Edit
                        </button>
                        <button
                          onClick={() => handleResolve('keep_b')}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${resolutions[currentConflict.id]?.resolution_type === 'keep_b'
                              ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-100'
                              : 'border border-gray-200 text-gray-600 hover:bg-gray-100'
                            }`}
                        >
                          Keep Req B
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Merge and Dismiss Controls */}
                <div className="space-y-4">
                  <div className="p-5 border border-indigo-100 rounded-2xl bg-indigo-50/30">
                    <h5 className="text-xs font-black text-indigo-950 uppercase tracking-widest mb-3 flex items-center gap-2">
                      <Sparkles size={14} className="text-indigo-500" /> Resolution: Merge Requirements
                    </h5>
                    <textarea
                      value={mergeTextInput}
                      onChange={(e) => setMergeTextInput(e.target.value)}
                      placeholder="Write the merged requirement..."
                      className="w-full text-sm font-medium p-3 bg-white border border-indigo-200 rounded-xl focus:outline-none focus:border-indigo-400 mb-3"
                      rows={2}
                    />
                    <button
                      onClick={() => handleResolve('merge')}
                      className={`w-full py-2.5 rounded-xl text-xs font-bold transition-all ${resolutions[currentConflict.id]?.resolution_type === 'merge'
                          ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100'
                          : 'bg-white border border-indigo-200 text-indigo-600 hover:bg-indigo-50'
                        }`}
                    >
                      Merge & Resolve
                    </button>
                  </div>

                  <button
                    onClick={() => handleResolve('dismiss')}
                    className={`w-full py-3 rounded-xl border border-dashed text-xs font-bold transition-all ${resolutions[currentConflict.id]?.resolution_type === 'dismiss'
                        ? 'border-gray-400 bg-gray-100 text-gray-800'
                        : 'border-gray-200 text-gray-500 hover:border-gray-400 hover:bg-white'
                      }`}
                  >
                    Dismiss Conflict (Keep both requirements as separate features)
                  </button>
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-gray-100 flex justify-between items-center text-xs text-gray-400 font-bold">
                <span>All conflicts resolved?</span>
                <span className="text-gray-900">
                  {Object.keys(resolutions).length} of {conflicts.length} completed
                </span>
              </div>
            </div>
          ) : requirements.length === 0 && threads.length === 0 ? (
            <div className="flex-grow flex flex-col items-center justify-center text-center opacity-70">
              <AlertTriangle size={56} className="text-amber-500 mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-1">No Requirements Extracted</h3>
              <p className="text-sm text-gray-500 max-w-xs mb-4">
                We couldn't extract any requirements. This can happen if there was an API credit issue or if the meeting conversation didn't mention specific system features.
              </p>
              <button
                onClick={onBack}
                className="px-6 py-2 bg-gray-900 hover:bg-black text-white font-bold rounded-xl text-xs"
              >
                Go Back to Meeting
              </button>
            </div>
          ) : (
            <div className="flex-grow flex flex-col items-center justify-center text-center opacity-70">
              <CheckCircle2 size={56} className="text-emerald-500 mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-1">No Active Conflicts</h3>
              <p className="text-sm text-gray-500 max-w-xs">
                Excellent! No logic contradictions were flagged in this meeting's requirements list. You can proceed directly to story generation.
              </p>
            </div>
          )}
        </section>

        {/* Right Side: Consolidated Requirement Threads Checklist */}
        <section className="hidden lg:block w-[45%] bg-gray-50 p-8 overflow-y-auto custom-scrollbar">
          <div className="mb-6">
            <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest mb-1">
              Consolidated Requirement Threads ({threads.length > 0 ? threads.length : requirements.length})
            </h3>
            <p className="text-xs text-gray-500 font-semibold">
              Review, edit summary, or mark requirement threads as Approved (Validated) or Discarded.
            </p>
          </div>

          <div className="space-y-4">
            {threads.length > 0 ? (
              threads.map((t) => {
                const tid = t.thread_id || t.id || '';
                const currentEdit = editedThreads[tid] || {
                  summary: t.summary || t.summary_text || t.requirement_title || '',
                  action: 'VALIDATED'
                };
                const isDiscarded = currentEdit.action === 'DISCARDED';

                return (
                  <div
                    key={tid}
                    className={`bg-white p-5 rounded-2xl border transition-all shadow-sm space-y-3 relative group ${isDiscarded
                        ? 'border-gray-200 opacity-60 bg-gray-100/60'
                        : 'border-purple-100 hover:border-purple-300'
                      }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <span className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-100">
                          Requirement Thread
                        </span>
                        <h4 className={`text-sm font-bold text-gray-900 mt-1 ${isDiscarded ? 'line-through text-gray-400' : ''}`}>
                          {t.requirement_title || t.topic_label || t.thread_label || 'Consolidated Requirement'}
                        </h4>
                      </div>

                      {/* Action buttons: Approved vs Discarded */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          onClick={() => setEditedThreads(prev => ({
                            ...prev,
                            [tid]: { ...currentEdit, action: 'VALIDATED' }
                          }))}
                          className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase transition-all flex items-center gap-1 ${!isDiscarded
                              ? 'bg-emerald-600 text-white shadow-sm'
                              : 'border border-gray-200 text-gray-500 hover:bg-gray-50'
                            }`}
                        >
                          <Check size={10} /> Approved
                        </button>
                        <button
                          onClick={() => setEditedThreads(prev => ({
                            ...prev,
                            [tid]: { ...currentEdit, action: 'DISCARDED' }
                          }))}
                          className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase transition-all flex items-center gap-1 ${isDiscarded
                              ? 'bg-red-600 text-white shadow-sm'
                              : 'border border-gray-200 text-gray-400 hover:bg-gray-50'
                            }`}
                        >
                          <Trash2 size={10} /> Discard
                        </button>
                      </div>
                    </div>

                    {/* Summary Edit Area */}
                    {editingThreadId === tid ? (
                      <textarea
                        value={currentEdit.summary}
                        onChange={(e) => setEditedThreads(prev => ({
                          ...prev,
                          [tid]: { ...currentEdit, summary: e.target.value }
                        }))}
                        onBlur={() => setEditingThreadId(null)}
                        className="w-full text-xs font-medium p-3 border border-purple-200 bg-white rounded-xl focus:outline-none focus:border-purple-400 leading-relaxed"
                        rows={3}
                        autoFocus
                      />
                    ) : (
                      <p className={`text-xs text-gray-700 leading-relaxed font-medium bg-gray-50/50 p-3 rounded-xl border border-gray-100 ${isDiscarded ? 'line-through text-gray-400' : ''}`}>
                        {currentEdit.summary}
                      </p>
                    )}

                    <div className="flex justify-between items-center text-[10px] text-gray-400 pt-1">
                      <span>Status: <strong className={isDiscarded ? 'text-red-500' : 'text-emerald-600'}>{currentEdit.action}</strong></span>
                      {!isDiscarded && (
                        <button
                          onClick={() => setEditingThreadId(tid)}
                          className="text-purple-600 font-bold hover:underline flex items-center gap-1"
                        >
                          <Edit3 size={12} /> Edit Summary
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              requirements.map((req) => {
                const isEdited = editedTexts[req.id] !== req.requirement_text;
                const isConflicted = req.status === 'conflicted';
                return (
                  <div
                    key={req.id}
                    className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm relative group hover:border-gray-300 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${req.requirement_type.toLowerCase().includes('non')
                          ? 'bg-orange-50 text-orange-600 border border-orange-100'
                          : 'bg-green-50 text-green-600 border border-green-100'
                        }`}>
                        {req.requirement_type}
                      </span>
                      <div className="flex items-center gap-1.5">
                        {isConflicted && (
                          <span className="text-[8px] font-bold uppercase px-2 py-0.5 rounded-full bg-red-50 text-red-500 border border-red-100 flex items-center gap-1">
                            <AlertTriangle size={8} /> Conflict
                          </span>
                        )}
                        {isEdited && (
                          <span className="text-[8px] font-bold uppercase px-2 py-0.5 rounded-full bg-blue-50 text-blue-500 border border-blue-100">
                            Edited
                          </span>
                        )}
                      </div>
                    </div>

                    {editingReqId === req.id ? (
                      <textarea
                        value={editedTexts[req.id]}
                        onChange={(e) => setEditedTexts(prev => ({ ...prev, [req.id]: e.target.value }))}
                        onBlur={() => setEditingReqId(null)}
                        className="w-full text-xs font-semibold p-2 border border-indigo-200 bg-white rounded-lg focus:outline-none"
                        rows={2}
                        autoFocus
                      />
                    ) : (
                      <p className="text-xs font-semibold text-gray-800 leading-relaxed pr-6">
                        {editedTexts[req.id]}
                      </p>
                    )}

                    <button
                      onClick={() => setEditingReqId(req.id)}
                      className="absolute right-3 bottom-3 opacity-0 group-hover:opacity-100 transition-opacity p-1 text-gray-400 hover:text-indigo-600"
                    >
                      <Edit3 size={14} />
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </section>
      </main>

      {/* Footer / Process Bar */}
      <footer className="bg-white border-t border-gray-200 px-8 py-5 flex items-center justify-between shadow-2xl relative z-10">
        <div className="text-xs font-bold text-red-500">
          {error && <span>Error: {error}</span>}
        </div>
        <button
          disabled={saving || requirements.length === 0 || (conflicts.length > 0 && Object.keys(resolutions).length < conflicts.length)}
          onClick={handleSaveResolution}
          className="flex items-center gap-2 px-8 py-3.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 disabled:hover:bg-indigo-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl shadow-indigo-100 transition-all hover:translate-x-0.5 active:scale-95 shrink-0"
        >
          {saving ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Finalizing...
            </>
          ) : (
            <>
              Finalize & Generate Stories
              <Play size={14} fill="white" />
            </>
          )}
        </button>
      </footer>
    </div>
  );
};
export default RequirementsFinalizer;
