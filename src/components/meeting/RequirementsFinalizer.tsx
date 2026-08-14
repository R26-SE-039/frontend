import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AlertTriangle, Sparkles, Check, CheckCircle2, ChevronRight, ChevronLeft,
  Edit3, Trash2, HelpCircle, ArrowRight, Loader2, Play, Layers, Copy, Zap,
  RefreshCw, Link2, ShieldCheck, Cpu
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
  duplicate_of_id?: string;
}

interface Conflict {
  id: string;
  requirement_a_id: string;
  requirement_b_id: string;
  conflict_type: string;
  severity: string;
  explanation: string;
  source_meeting_id?: string;
  source_meeting_title?: string;
  suggested_resolution?: string;
  status?: string;
  requirement_a_text?: string;
  requirement_b_text?: string;
  requirement_a_type?: string;
  requirement_b_type?: string;
}

interface Resolution {
  conflict_id: string;
  resolution_type: 'apply_suggestion' | 'keep_a' | 'keep_b' | 'merge' | 'accept_duplicate' | 'dismiss';
  merged_text?: string;
}

export const RequirementsFinalizer: React.FC<RequirementsFinalizerProps> = ({
  meetingId,
  onBack,
  onFinalized
}) => {
  const [loading, setLoading] = useState(true);
  const [requirements, setRequirements] = useState<Requirement[]>([]);
  const [conflicts, setConflicts] = useState<Conflict[]>([]);
  const [currentConflictIdx, setCurrentConflictIdx] = useState(0);
  const [resolutions, setResolutions] = useState<Record<string, Resolution>>({});
  const [editedTexts, setEditedTexts] = useState<Record<string, string>>({});
  const [editingReqId, setEditingReqId] = useState<string | null>(null);
  const [mergeTextInput, setMergeTextInput] = useState('');
  const [activeTab, setActiveTab] = useState<'conflicts' | 'duplicates'>('conflicts');
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

      const loadedReqs: Requirement[] = reqRes.requirements || [];
      const rawConflicts: Conflict[] = confRes.conflicts || [];

      // Focus strictly on In-Session Conflicts for Tab 1
      const inSessionConflicts = rawConflicts.filter(
        c => !c.source_meeting_title || c.source_meeting_id === meetingId
      );

      setRequirements(loadedReqs);
      setConflicts(inSessionConflicts);

      if (inSessionConflicts.length > 0) {
        setActiveTab('conflicts');
      } else if (loadedReqs.some(r => r.status === 'duplicate')) {
        setActiveTab('duplicates');
      }

      const textMap: Record<string, string> = {};
      loadedReqs.forEach((r: Requirement) => {
        textMap[r.id] = r.requirement_text;
      });
      setEditedTexts(textMap);

    } catch (err: any) {
      setError(err.message || 'Failed to load requirements data');
    } finally {
      setLoading(false);
    }
  };

  const duplicateReqs = requirements.filter(r => r.status === 'duplicate');
  const activeReqs = requirements.filter(r => r.status === 'active');

  const currentConflict = conflicts[currentConflictIdx];
  const reqA = requirements.find(r => r.id === currentConflict?.requirement_a_id);
  const reqB = requirements.find(r => r.id === currentConflict?.requirement_b_id);

  const textA = (reqA ? editedTexts[reqA.id] : null) || currentConflict?.requirement_a_text || 'Requirement A text unavailable';
  const textB = (reqB ? editedTexts[reqB.id] : null) || currentConflict?.requirement_b_text || 'Requirement B text unavailable';

  useEffect(() => {
    if (currentConflict?.suggested_resolution) {
      setMergeTextInput(currentConflict.suggested_resolution);
    } else if (currentConflict) {
      setMergeTextInput(`${textA} AND ${textB}`);
    }
  }, [currentConflictIdx, currentConflict, textA, textB]);

  const handleResolve = async (type: 'apply_suggestion' | 'keep_a' | 'keep_b' | 'merge' | 'accept_duplicate' | 'dismiss') => {
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

    try {
      await meetingApi.resolveSingleConflict(meetingId, currentConflict.id, {
        resolution_type: type,
        edited_text_a: textA,
        edited_text_b: textB,
        merged_text: type === 'apply_suggestion' ? currentConflict.suggested_resolution : mergeTextInput,
      });

      const reqRes = await meetingApi.getRequirements(meetingId);
      const loadedReqs = reqRes.requirements || [];
      setRequirements(loadedReqs);

      const textMap: Record<string, string> = {};
      loadedReqs.forEach((r: Requirement) => {
        textMap[r.id] = r.requirement_text;
      });
      setEditedTexts(textMap);

    } catch (err: any) {
      console.warn('Single conflict resolution sync failed:', err);
    }

    if (currentConflictIdx < conflicts.length - 1) {
      setCurrentConflictIdx(prev => prev + 1);
    }
  };

  const handleSaveResolution = async () => {
    setSaving(true);
    setError(null);
    try {
      const resolutionList = Object.values(resolutions);
      const editedList = Object.entries(editedTexts).map(([id, text]) => ({
        requirement_id: id,
        text
      }));

      await meetingApi.finalizeRequirements(meetingId, resolutionList, editedList, []);
      onFinalized();
    } catch (err: any) {
      setError(err.message || 'Failed to save finalized requirements.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 z-[120] bg-white flex flex-col items-center justify-center py-32 text-center">
        <div className="w-14 h-14 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 mb-4 shadow-sm">
          <Loader2 className="w-7 h-7 animate-spin" />
        </div>
        <h3 className="text-xl font-black text-gray-900 tracking-tight mb-1">Analyzing Session Requirements...</h3>
        <p className="text-xs font-semibold text-gray-400 max-w-xs">
          Loading vector embeddings and conflict graphs for session {meetingId.substring(0, 8)}...
        </p>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[120] bg-gray-50 flex flex-col overflow-hidden text-left font-sans animate-in fade-in duration-300">
      {/* Modern Clean Header Bar */}
      <header className="bg-white border-b border-gray-200 px-8 py-4 flex items-center justify-between shadow-sm relative z-20">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shadow-sm">
            <Sparkles size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-black text-gray-900 tracking-tight">Requirement Resolution Hub</h2>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-black uppercase tracking-widest flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                Live Session
              </span>
            </div>
            <p className="text-[11px] text-gray-400 font-semibold mt-0.5">
              Session ID: <code className="text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md text-[10px] font-mono border border-indigo-100">{meetingId}</code>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchData}
            className="p-2 rounded-lg border border-gray-200 text-gray-500 hover:text-gray-900 hover:bg-gray-50 transition-all text-xs font-bold flex items-center gap-1.5"
            title="Refresh Requirements"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </button>
          <button
            onClick={onBack}
            className="px-4 py-2 text-xs font-bold text-gray-500 hover:bg-gray-100 rounded-lg transition-all border border-gray-200"
          >
            Cancel
          </button>
        </div>
      </header>

      {/* Main Content Layout */}
      <main className="flex-grow flex overflow-hidden">
        {/* Left Side: Resolution Hub (2 Modern Clean Tabs) */}
        <section className="w-full lg:w-[55%] border-r border-gray-200 bg-white p-8 overflow-y-auto custom-scrollbar flex flex-col">
          {/* Modern Clean Tab Switcher */}
          <div className="flex items-center gap-2 mb-6 p-1 bg-gray-100 rounded-xl border border-gray-200 shrink-0">
            <button
              onClick={() => setActiveTab('conflicts')}
              className={`flex-1 py-2.5 px-4 rounded-lg text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all ${
                activeTab === 'conflicts'
                  ? 'bg-white text-gray-900 shadow-sm border border-gray-200 font-black'
                  : 'text-gray-500 hover:text-gray-900 font-bold'
              }`}
            >
              <Zap size={14} className={conflicts.length > 0 ? 'text-amber-500' : 'text-gray-400'} />
              Live Session Conflicts ({conflicts.length})
            </button>
            <button
              onClick={() => setActiveTab('duplicates')}
              className={`flex-1 py-2.5 px-4 rounded-lg text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all ${
                activeTab === 'duplicates'
                  ? 'bg-white text-gray-900 shadow-sm border border-gray-200 font-black'
                  : 'text-gray-500 hover:text-gray-900 font-bold'
              }`}
            >
              <Copy size={14} className={duplicateReqs.length > 0 ? 'text-purple-500' : 'text-gray-400'} />
              Duplicates Hub ({duplicateReqs.length})
            </button>
          </div>

          {/* TAB 1: Live Session Conflicts */}
          {activeTab === 'conflicts' && (
            <div className="flex-grow flex flex-col justify-between">
              {conflicts.length > 0 ? (
                <div>
                  {/* Conflict Stepper Banner */}
                  <div className="flex items-center justify-between mb-6 bg-amber-50 p-4 rounded-xl border border-amber-200">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center text-amber-700">
                        <AlertTriangle size={18} />
                      </div>
                      <div>
                        <span className="text-xs font-black text-amber-950 uppercase tracking-wider block">
                          In-Session Contradiction {currentConflictIdx + 1} of {conflicts.length}
                        </span>
                        <span className="text-[10px] text-amber-700 font-semibold">
                          Must resolve before generating user stories
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        disabled={currentConflictIdx === 0}
                        onClick={() => setCurrentConflictIdx(prev => prev - 1)}
                        className="p-1.5 rounded-lg border border-amber-200 text-amber-800 hover:bg-amber-100 disabled:opacity-30 transition-all"
                      >
                        <ChevronLeft size={16} />
                      </button>
                      <button
                        disabled={currentConflictIdx === conflicts.length - 1}
                        onClick={() => setCurrentConflictIdx(prev => prev + 1)}
                        className="p-1.5 rounded-lg border border-amber-200 text-amber-800 hover:bg-amber-100 disabled:opacity-30 transition-all"
                      >
                        <ChevronRight size={16} />
                      </button>
                    </div>
                  </div>

                  {/* AI Rationale Box */}
                  <div className="mb-6 p-4 bg-gray-50 rounded-xl border border-gray-200">
                    <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-1">
                      Reason for Conflict
                    </span>
                    <p className="text-xs text-gray-700 font-medium leading-relaxed">
                      {currentConflict.explanation}
                    </p>
                  </div>

                  {/* 3 Modern Choice Cards */}
                  <div className="space-y-4 mb-6">
                    <h4 className="text-xs font-black text-gray-900 uppercase tracking-widest">
                      Select how you want to resolve this conflict:
                    </h4>

                    {/* Option A */}
                    <div
                      onClick={() => handleResolve('keep_a')}
                      className={`p-4 rounded-xl border cursor-pointer transition-all ${
                        resolutions[currentConflict.id]?.resolution_type === 'keep_a'
                          ? 'border-emerald-500 bg-emerald-50/40 ring-2 ring-emerald-500/20 shadow-sm'
                          : 'border-gray-200 hover:border-indigo-200 bg-white'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">
                          Option A: Retain Requirement A
                        </span>
                        {resolutions[currentConflict.id]?.resolution_type === 'keep_a' && (
                          <span className="text-[9px] font-extrabold px-2.5 py-0.5 bg-emerald-600 text-white rounded-full flex items-center gap-1 shadow-sm">
                            <Check size={10} /> Selected
                          </span>
                        )}
                      </div>
                      <p className="text-xs font-semibold text-gray-800 leading-relaxed">
                        "{textA}"
                      </p>
                    </div>

                    {/* Option B */}
                    <div
                      onClick={() => handleResolve('keep_b')}
                      className={`p-4 rounded-xl border cursor-pointer transition-all ${
                        resolutions[currentConflict.id]?.resolution_type === 'keep_b'
                          ? 'border-emerald-500 bg-emerald-50/40 ring-2 ring-emerald-500/20 shadow-sm'
                          : 'border-gray-200 hover:border-indigo-200 bg-white'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">
                          Option B: Retain Requirement B
                        </span>
                        {resolutions[currentConflict.id]?.resolution_type === 'keep_b' && (
                          <span className="text-[9px] font-extrabold px-2.5 py-0.5 bg-emerald-600 text-white rounded-full flex items-center gap-1 shadow-sm">
                            <Check size={10} /> Selected
                          </span>
                        )}
                      </div>
                      <p className="text-xs font-semibold text-gray-800 leading-relaxed">
                        "{textB}"
                      </p>
                    </div>

                    {/* Option C: AI Smart Merge */}
                    <div
                      className={`p-4 rounded-xl border transition-all ${
                        resolutions[currentConflict.id]?.resolution_type === 'merge' || resolutions[currentConflict.id]?.resolution_type === 'apply_suggestion'
                          ? 'border-indigo-500 bg-indigo-50/50 ring-2 ring-indigo-500/20'
                          : 'border-indigo-100 bg-indigo-50/20 hover:border-indigo-200'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-black text-indigo-700 uppercase tracking-widest flex items-center gap-1.5">
                          <Sparkles size={14} className="text-indigo-500" /> Option C: Combine / Merge Both (Recommended)
                        </span>
                      </div>
                      <textarea
                        value={mergeTextInput}
                        onChange={(e) => setMergeTextInput(e.target.value)}
                        className="w-full text-xs font-medium p-3 bg-white border border-indigo-200 rounded-lg focus:outline-none focus:border-indigo-400 mb-3 leading-relaxed"
                        rows={2}
                      />
                      <button
                        onClick={() => handleResolve('merge')}
                        className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-all shadow-md shadow-indigo-100"
                      >
                        Merge & Save Combined Requirement
                      </button>
                    </div>
                  </div>

                  <button
                    onClick={() => handleResolve('dismiss')}
                    className="w-full py-2 text-center text-xs font-bold text-gray-400 hover:text-gray-700 transition-colors"
                  >
                    Dismiss Conflict (Keep both as separate features)
                  </button>
                </div>
              ) : (
                <div className="flex-grow flex flex-col items-center justify-center text-center py-20 opacity-75">
                  <div className="w-14 h-14 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-500 mb-4 shadow-sm">
                    <CheckCircle2 size={32} />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-1">Zero Live Conflicts</h3>
                  <p className="text-xs text-gray-500 max-w-xs leading-relaxed">
                    No internal contradictions were flagged in this meeting session.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: Duplicates Hub */}
          {activeTab === 'duplicates' && (
            <div className="flex-grow flex flex-col justify-between">
              {duplicateReqs.length > 0 ? (
                <div>
                  <div className="mb-6 p-4 bg-purple-50 rounded-xl border border-purple-200 flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-black text-purple-950 uppercase tracking-wider flex items-center gap-2">
                        <Copy size={16} className="text-purple-600" /> Auto-Detected Duplicates ({duplicateReqs.length})
                      </h4>
                      <p className="text-[11px] text-purple-800 font-medium mt-0.5">
                        Matched against previous meeting discussions or same-session statements.
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3 mb-6">
                    {duplicateReqs.map(dup => {
                      const originalReq = dup.duplicate_of_id ? requirements.find(r => r.id === dup.duplicate_of_id) : null;
                      return (
                        <div key={dup.id} className="p-4 bg-white border border-purple-100 rounded-xl shadow-sm space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-[9px] font-black uppercase tracking-widest px-2.5 py-0.5 bg-purple-100 text-purple-800 rounded-full border border-purple-200">
                              Duplicate Requirement
                            </span>
                            <span className="text-[10px] font-bold text-purple-600 flex items-center gap-1">
                              <Link2 size={12} /> Auto-Linked
                            </span>
                          </div>
                          <p className="text-xs font-semibold text-gray-800 line-through opacity-70 leading-relaxed">
                            "{dup.requirement_text}"
                          </p>
                          {originalReq && (
                            <div className="text-[10px] text-purple-900 font-medium bg-purple-50 p-2.5 rounded-lg border border-purple-100">
                              🔗 <strong>Matches original:</strong> "{originalReq.requirement_text}"
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="flex-grow flex flex-col items-center justify-center text-center py-20 opacity-75">
                  <div className="w-14 h-14 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-500 mb-4 shadow-sm">
                    <CheckCircle2 size={32} />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-1">No Duplicates Detected</h3>
                  <p className="text-xs text-gray-500 max-w-xs leading-relaxed">
                    All requirements extracted in this session express unique functionality.
                  </p>
                </div>
              )}
            </div>
          )}
        </section>

        {/* Right Side: Solid Clean Active Requirements Panel (No Transparency) */}
        <section className="hidden lg:block w-[45%] bg-gray-50 p-8 overflow-y-auto custom-scrollbar border-l border-gray-200">
          <div className="mb-6 flex items-center justify-between border-b border-gray-200 pb-4">
            <div>
              <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest flex items-center gap-2">
                Session Active Requirements ({activeReqs.length})
              </h3>
              <p className="text-xs text-gray-500 font-medium mt-0.5">
                Exact verified active requirements to be sent to RAG User Story Generator.
              </p>
            </div>
            <span className="px-3 py-1 bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-black uppercase tracking-widest rounded-full flex items-center gap-1">
              <ShieldCheck size={12} /> Ready
            </span>
          </div>

          <div className="space-y-3">
            {requirements.map((req) => {
              const isEdited = editedTexts[req.id] !== req.requirement_text;
              const isConflicted = req.status === 'conflicted';
              const isSuperseded = req.status === 'superseded';
              const isDuplicate = req.status === 'duplicate';
              const isActive = req.status === 'active';
              const originalReq = req.duplicate_of_id ? requirements.find(r => r.id === req.duplicate_of_id) : null;

              return (
                <div
                  key={req.id}
                  className={`p-4 rounded-xl border transition-all shadow-sm relative group bg-white ${
                    isSuperseded || isDuplicate
                      ? 'border-gray-200 bg-gray-100/70 opacity-60'
                      : isConflicted
                        ? 'border-amber-300 bg-amber-50/30'
                        : 'border-gray-200 hover:border-indigo-200'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className={`text-[8px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full ${
                      req.requirement_type?.toLowerCase().includes('non')
                        ? 'bg-orange-50 text-orange-600 border border-orange-100'
                        : 'bg-indigo-50 text-indigo-600 border border-indigo-100'
                    }`}>
                      {req.requirement_type || 'functional'}
                    </span>

                    {/* Real-time Status Badges */}
                    <div className="flex items-center gap-1.5">
                      {isActive && (
                        <span className="text-[9px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                          <CheckCircle2 size={10} /> Active
                        </span>
                      )}
                      {isConflicted && (
                        <span className="text-[9px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1">
                          <AlertTriangle size={10} /> Conflicted
                        </span>
                      )}
                      {isSuperseded && (
                        <span className="text-[9px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-500 border border-gray-200">
                          Superseded
                        </span>
                      )}
                      {isDuplicate && (
                        <span className="text-[9px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-700 border border-purple-200">
                          Duplicate
                        </span>
                      )}
                      {isEdited && (
                        <span className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 border border-blue-100">
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
                      className="w-full text-xs font-medium p-3 border border-indigo-200 bg-white rounded-lg focus:outline-none focus:border-indigo-400 leading-relaxed"
                      rows={2}
                      autoFocus
                    />
                  ) : (
                    <p className={`text-xs leading-relaxed font-semibold pr-6 ${
                      isSuperseded || isDuplicate
                        ? 'line-through text-gray-400 font-medium'
                        : 'text-gray-800'
                    }`}>
                      {editedTexts[req.id]}
                    </p>
                  )}

                  {/* Duplicate Citation Box */}
                  {isDuplicate && (
                    <div className="mt-2.5 p-2.5 bg-purple-50 border border-purple-100 rounded-lg text-[10px] text-purple-900 font-medium truncate flex items-center justify-between">
                      <span className="truncate">
                        🔗 <strong>Matches original:</strong> {originalReq ? `"${originalReq.requirement_text}"` : `ID: ${req.duplicate_of_id}`}
                      </span>
                    </div>
                  )}

                  {!isSuperseded && !isDuplicate && (
                    <button
                      onClick={() => setEditingReqId(req.id)}
                      className="absolute right-3 bottom-3 opacity-0 group-hover:opacity-100 transition-opacity p-1 text-gray-400 hover:text-indigo-600"
                    >
                      <Edit3 size={14} />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      </main>

      {/* Modern Clean Footer Bar */}
      <footer className="bg-white border-t border-gray-200 px-8 py-4 flex items-center justify-between shadow-xl relative z-20">
        <div className="text-xs font-bold text-red-500">
          {error && <span>Error: {error}</span>}
        </div>
        <button
          disabled={saving || activeReqs.length === 0}
          onClick={handleSaveResolution}
          className="flex items-center gap-2.5 px-8 py-3.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-xl shadow-indigo-100 transition-all hover:translate-x-0.5 active:scale-95 shrink-0"
        >
          {saving ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Finalizing Requirements...
            </>
          ) : (
            <>
              Finalize & Generate Stories ({activeReqs.length} Active)
              <Play size={14} fill="white" />
            </>
          )}
        </button>
      </footer>
    </div>
  );
};
export default RequirementsFinalizer;
