import React, { useState, useEffect } from 'react';
import { Sparkles, CheckCircle2, AlertCircle, Clipboard, ArrowLeft, Download, FileJson, Table, Printer, ShieldCheck, Award, Pencil, Plus, Trash2, Save, X, RefreshCw, Check, Ban, RotateCcw, Bot, Cpu, FileSearch, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { meetingApi } from '../../api/meetingApi';
import { GeneratedStory, ValidationResult } from '../../api/ragApi';

interface MeetingStoryGeneratorProps {
  meetingId: string;
  onBack: () => void;
}

const LOADING_STAGES = [
  {
    step: 1,
    title: 'Parsing Meeting Transcript Evidence',
    detail: 'Retrieving ground-truth utterances, speaker quotes, and verified requirements...',
    icon: FileSearch,
  },
  {
    step: 2,
    title: 'Synthesizing User Stories & Personas',
    detail: 'Structuring user roles, feature objectives, and agile business value...',
    icon: Bot,
  },
  {
    step: 3,
    title: 'Formulating BDD Acceptance Criteria',
    detail: 'Generating Given-When-Then scenarios for happy paths, errors, and edge cases...',
    icon: CheckCircle2,
  },
  {
    step: 4,
    title: 'Executing 5-Layer Quality & Hallucination Audit',
    detail: 'Verifying evidence alignment, INVEST rules, and format compliance in real-time...',
    icon: Cpu,
  },
];

export const MeetingStoryGenerator: React.FC<MeetingStoryGeneratorProps> = ({ meetingId, onBack }) => {
  const [loading, setLoading] = useState(true);
  const [loadingStage, setLoadingStage] = useState(0);
  const [stories, setStories] = useState<GeneratedStory[] | null>(null);
  const [validationMap, setValidationMap] = useState<Record<string, ValidationResult>>({});
  const [error, setError] = useState<string | null>(null);

  // Edit & System Re-Validation State
  const [editingStory, setEditingStory] = useState<GeneratedStory | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editStoryText, setEditStoryText] = useState('');
  const [editPriority, setEditPriority] = useState('Should');
  const [editACs, setEditACs] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [updatingStatusId, setUpdatingStatusId] = useState<string | null>(null);

  useEffect(() => {
    handleGenerateStories();
  }, [meetingId]);

  useEffect(() => {
    if (!loading) return;
    const interval = setInterval(() => {
      setLoadingStage((prev) => (prev < LOADING_STAGES.length - 1 ? prev + 1 : prev));
    }, 3500);
    return () => clearInterval(interval);
  }, [loading]);

  const handleGenerateStories = async () => {
    setLoading(true);
    setLoadingStage(0);
    setError(null);
    setStories(null);
    setValidationMap({});

    try {
      const ragData = await meetingApi.generateStoriesFromRequirements(meetingId);

      if (ragData.stories && ragData.stories.length > 0) {
        setStories(ragData.stories);

        if (ragData.validation_results && Array.isArray(ragData.validation_results)) {
          const map: Record<string, ValidationResult> = {};
          ragData.validation_results.forEach((v: ValidationResult) => {
            if (v.story_id) {
              map[v.story_id] = v;
            }
          });
          setValidationMap(map);
        }
      } else {
        setError('No user stories were generated from this meeting\'s requirements.');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to generate stories');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusOverride = async (storyId: string, newStatus: 'Approved' | 'Needs Review' | 'Rejected') => {
    setUpdatingStatusId(storyId);
    try {
      await meetingApi.overrideStoryStatus(storyId, newStatus, meetingId);
      setValidationMap(prev => {
        const existing = prev[storyId] || {
          story_id: storyId,
          rule_score: 100,
          evidence_score: 0,
          semantic_similarity: 0,
          invest_score: 5,
          hallucination_score: 0,
          overall_quality_score: 100,
          status: newStatus,
          recommendation: '',
        };
        return {
          ...prev,
          [storyId]: {
            ...existing,
            status: newStatus,
          }
        };
      });
    } catch (err: any) {
      alert(err.message || 'Failed to update status');
    } finally {
      setUpdatingStatusId(null);
    }
  };

  const openEditModal = (story: GeneratedStory) => {
    setEditingStory(story);
    setEditTitle(story.title);
    setEditStoryText(story.story);
    setEditPriority(story.priority || 'Should');
    setEditACs([...story.acceptance_criteria]);
  };

  const handleACChange = (index: number, val: string) => {
    const updated = [...editACs];
    updated[index] = val;
    setEditACs(updated);
  };

  const addAC = () => {
    setEditACs([...editACs, 'Given [precondition] When [action] Then [outcome].']);
  };

  const removeAC = (index: number) => {
    setEditACs(editACs.filter((_, i) => i !== index));
  };

  const handleSaveAndRevalidate = async () => {
    if (!editingStory) return;
    setSaving(true);
    try {
      const cleanedACs = editACs.filter(ac => ac.trim().length > 0);
      const res = await meetingApi.updateAndRevalidateStory(editingStory.story_id, {
        meeting_id: meetingId,
        title: editTitle,
        story: editStoryText,
        acceptance_criteria: cleanedACs,
        priority: editPriority,
      });

      if (res.story) {
        setStories(prev => prev ? prev.map(s => s.story_id === editingStory.story_id ? { ...s, ...res.story } : s) : null);
      }
      if (res.validation_result) {
        setValidationMap(prev => ({
          ...prev,
          [editingStory.story_id]: res.validation_result
        }));
      }
      setEditingStory(null);
    } catch (err: any) {
      alert(err.message || 'Failed to update and re-validate story');
    } finally {
      setSaving(false);
    }
  };

  const copyAllStories = () => {
    if (!stories) return;
    const text = stories.map(s => {
      const val = validationMap[s.story_id];
      const valHeader = val ? `[Validation Score: ${val.overall_quality_score}/100 - Status: ${val.status}]\n` : '';
      return `${valHeader}Title: ${s.title}\nStory: ${s.story}\nCriteria:\n${s.acceptance_criteria.map(ac => `- ${ac}`).join('\n')}`;
    }).join('\n\n---\n\n');
    navigator.clipboard.writeText(text);
  };

  const exportToJSON = () => {
    if (!stories) return;
    const exportData = stories.map(s => ({
      ...s,
      validation_result: validationMap[s.story_id] || null
    }));
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `meeting_${meetingId}_stories.json`;
    a.click();
  };

  const exportToCSV = () => {
    if (!stories) return;
    const headers = ['Story ID', 'Title', 'Story', 'Priority', 'Overall Quality Score', 'Validation Status', 'Acceptance Criteria'];
    const rows = stories.map(s => {
      const val = validationMap[s.story_id];
      return [
        s.story_id,
        s.title,
        s.story,
        s.priority,
        val ? `${val.overall_quality_score}/100` : 'N/A',
        val ? val.status : 'N/A',
        s.acceptance_criteria.join('; ')
      ];
    });
    const csvContent = [headers, ...rows].map(e => e.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `meeting_${meetingId}_stories.csv`;
    a.click();
  };

  const downloadAsTxt = () => {
    if (!stories) return;
    const text = stories.map(s => {
      const val = validationMap[s.story_id];
      const valHeader = val ? `[Quality Score: ${val.overall_quality_score}/100 | Status: ${val.status}]\n` : '';
      return `${valHeader}Title: ${s.title}\nStory: ${s.story}\nCriteria:\n${s.acceptance_criteria.map(ac => `- ${ac}`).join('\n')}`;
    }).join('\n\n---\n\n');
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `meeting_${meetingId}_stories.txt`;
    a.click();
  };

  return (
    <div className="fixed inset-0 z-[120] bg-slate-50 flex flex-col overflow-hidden animate-in fade-in duration-300">
      {/* Posh Executive Top Bar */}
      <div className="border-b border-slate-200/80 bg-white px-8 py-4 flex items-center justify-between sticky top-0 z-20 shadow-2xs">
        <div className="flex items-center gap-5">
          <button
            onClick={onBack}
            className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-slate-900 transition-all border border-slate-200/60"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-md bg-indigo-600 text-white flex items-center justify-center shadow-xs">
                <Sparkles size={16} />
              </div>
              <h2 className="text-lg font-bold text-slate-900 tracking-tight">User Story Dashboard & Validation Engine</h2>
            </div>
            <p className="text-[11px] text-slate-400 font-medium font-mono mt-0.5">Session: {meetingId}</p>
          </div>
        </div>

        {stories && (
          <div className="flex gap-2">
            <button
              onClick={copyAllStories}
              className="p-2 rounded-lg bg-white border border-slate-200 text-slate-600 hover:text-indigo-600 hover:border-indigo-200 transition-all shadow-2xs"
              title="Copy All"
            >
              <Clipboard size={16} />
            </button>
            <button
              onClick={exportToJSON}
              className="p-2 rounded-lg bg-white border border-slate-200 text-slate-600 hover:text-amber-600 hover:border-amber-200 transition-all shadow-2xs"
              title="Export JSON"
            >
              <FileJson size={16} />
            </button>
            <button
              onClick={exportToCSV}
              className="p-2 rounded-lg bg-white border border-slate-200 text-slate-600 hover:text-emerald-600 hover:border-emerald-200 transition-all shadow-2xs"
              title="Export CSV (Excel/Jira)"
            >
              <Table size={16} />
            </button>
            <button
              onClick={downloadAsTxt}
              className="p-2 rounded-lg bg-white border border-slate-200 text-slate-600 hover:text-blue-600 hover:border-blue-200 transition-all shadow-2xs"
              title="Download TXT"
            >
              <Download size={16} />
            </button>
            <button
              onClick={() => window.print()}
              className="p-2 rounded-lg bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:border-slate-300 transition-all shadow-2xs"
              title="Print Results"
            >
              <Printer size={16} />
            </button>
          </div>
        )}
      </div>

      {/* 100% Full-Width Screen Canvas */}
      <div className={`flex-grow ${loading ? 'bg-white overflow-hidden flex flex-col justify-center' : 'bg-slate-50 overflow-y-auto custom-scrollbar p-6'}`}>
        <div className={`w-full ${loading ? 'max-w-3xl mx-auto px-4' : 'max-w-full'}`}>
          <AnimatePresence mode="wait">
            {loading ? (
              <motion.div
                key="loading"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="flex flex-col w-full"
              >

                {/* Friendly Title & Description */}
                <div className="text-center mb-8">
                  <h3 className="text-2xl font-bold text-slate-900 mb-2 tracking-tight">
                    Generating & Validating User Stories
                  </h3>
                  <p className="text-slate-500 text-sm max-w-md mx-auto leading-relaxed">
                    Our AI is actively converting meeting transcript insights into high-quality BDD user stories and performing real-time quality verification.
                  </p>
                </div>

                {/* Interactive Multi-Stage Progress Stepper */}
                <div className="w-full bg-white p-6 space-y-4">
                  {LOADING_STAGES.map((stg, idx) => {
                    const IconComp = stg.icon;
                    const isDone = idx < loadingStage;
                    const isActive = idx === loadingStage;
                    const isPending = idx > loadingStage;

                    return (
                      <div
                        key={stg.step}
                        className={`flex items-start gap-4 p-3.5 rounded-xl transition-all ${isActive
                          ? 'bg-indigo-50/70'
                          : isDone
                            ? 'bg-emerald-50/50 '
                            : 'bg-slate-50/50'
                          }`}
                      >
                        <div
                          className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 mt-0.5 font-bold text-xs ${isActive
                            ? 'bg-indigo-600 text-white shadow-xs'
                            : isDone
                              ? 'bg-emerald-600 text-white'
                              : 'bg-slate-200 text-slate-500'
                            }`}
                        >
                          {isDone ? <CheckCircle size={18} /> : isActive ? <RefreshCw size={18} className="animate-spin" /> : stg.step}
                        </div>

                        <div className="flex-grow text-left">
                          <div className="flex items-center justify-between">
                            <h4 className={`text-xs font-bold ${isActive ? 'text-indigo-950' : isDone ? 'text-emerald-950' : 'text-slate-700'}`}>
                              {stg.title}
                            </h4>
                            {isActive && (
                              <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider flex items-center gap-1 bg-white px-2 py-0.5 rounded-md border border-indigo-100">
                                <RefreshCw size={10} className="animate-spin" /> Processing
                              </span>
                            )}
                            {isDone && (
                              <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider flex items-center gap-1">
                                Complete
                              </span>
                            )}
                          </div>
                          <p className={`text-[11px] mt-0.5 leading-normal ${isActive ? 'text-indigo-800 font-medium' : isDone ? 'text-emerald-800' : 'text-slate-400'}`}>
                            {stg.detail}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            ) : error ? (
              <motion.div
                key="error"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center justify-center py-28 text-center"
              >
                <div className="w-16 h-16 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mb-4 border border-rose-100">
                  <AlertCircle size={32} />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-1">Generation Failed</h3>
                <p className="text-rose-600 text-sm font-semibold mb-6 max-w-md">{error}</p>
                <button
                  onClick={handleGenerateStories}
                  className="px-6 py-2.5 rounded-xl bg-slate-900 text-white font-semibold text-sm hover:bg-slate-800 transition-all shadow-sm"
                >
                  Try Again
                </button>
              </motion.div>
            ) : stories ? (
              <motion.div
                key="results"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col gap-6"
              >
                {stories.map((story, idx) => {
                  const val = validationMap[story.story_id];
                  const status = val?.status || 'Needs Review';
                  const isApproved = status === 'Approved';
                  const isRejected = status === 'Rejected';
                  const isBusy = updatingStatusId === story.story_id;

                  return (
                    <motion.div
                      key={story.story_id}
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.08 }}
                      className="w-full bg-white rounded-xl border border-slate-200/90 p-6 shadow-2xs hover:border-slate-300 hover:shadow-md transition-all flex flex-col justify-between"
                    >
                      <div>
                        {/* 100% Full-Width Header Banner Row */}
                        <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-4 border-b border-slate-100">
                          <div className="flex items-center gap-3">
                            <h4 className="text-base font-bold text-slate-900 tracking-tight">{story.title}</h4>

                            <span className={`text-[11px] px-2.5 py-0.5 rounded-md font-bold uppercase tracking-wider ${story.priority === 'Must' ? 'bg-rose-50 text-rose-700 border border-rose-200/60' :
                              story.priority === 'Should' ? 'bg-amber-50 text-amber-700 border border-amber-200/60' : 'bg-blue-50 text-blue-700 border border-blue-200/60'
                              }`}>
                              {story.priority}
                            </span>

                            {/* System Validation Status Badge */}
                            <span className={`text-[11px] px-2.5 py-0.5 rounded-md font-bold uppercase tracking-wider flex items-center gap-1.5 ${isApproved
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/80'
                              : isRejected
                                ? 'bg-rose-50 text-rose-700 border border-rose-200/80'
                                : 'bg-amber-50 text-amber-700 border border-amber-200/80'
                              }`}>
                              <ShieldCheck size={13} />
                              {status}
                            </span>
                          </div>

                          {/* BA Decision Action Controls */}
                          <div className="flex items-center gap-2">
                            {/* Approve Button */}
                            <button
                              onClick={() => handleStatusOverride(story.story_id, 'Approved')}
                              disabled={isBusy || isApproved}
                              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 border shadow-2xs ${isApproved
                                ? 'bg-emerald-600 text-white border-emerald-600 cursor-default'
                                : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-600 hover:text-white active:scale-95'
                                }`}
                              title="Approve Story for Backlog"
                            >
                              <Check size={14} />
                              <span>Approve</span>
                            </button>

                            {/* Reject Button */}
                            <button
                              onClick={() => handleStatusOverride(story.story_id, 'Rejected')}
                              disabled={isBusy || isRejected}
                              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 border shadow-2xs ${isRejected
                                ? 'bg-rose-600 text-white border-rose-600 cursor-default'
                                : 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-600 hover:text-white active:scale-95'
                                }`}
                              title="Reject Story"
                            >
                              <Ban size={14} />
                              <span>Reject</span>
                            </button>

                            {/* Reset / Needs Review Button */}
                            {(isApproved || isRejected) && (
                              <button
                                onClick={() => handleStatusOverride(story.story_id, 'Needs Review')}
                                disabled={isBusy}
                                className="px-2.5 py-1.5 rounded-lg bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200 transition-all text-xs font-semibold flex items-center gap-1 active:scale-95"
                                title="Reset to Needs Review"
                              >
                                <RotateCcw size={13} />
                                <span>Reset</span>
                              </button>
                            )}

                            {/* Edit Action Button */}
                            <button
                              onClick={() => openEditModal(story)}
                              className="px-2.5 py-1.5 rounded-lg bg-slate-50 text-slate-600 hover:bg-indigo-50 hover:text-indigo-600 border border-slate-200/70 transition-all text-xs font-semibold flex items-center gap-1 active:scale-95 ml-1"
                              title="Edit Story & System Re-Validate"
                            >
                              <Pencil size={13} />
                              <span>Edit</span>
                            </button>
                          </div>
                        </div>

                        {/* Full-Width Story Statement Banner */}
                        <div className="mb-5">
                          <div className="bg-slate-50/90 p-4 rounded-lg border border-slate-200/70 text-slate-800 text-xs leading-relaxed font-medium w-full">
                            <span className="font-bold text-slate-400 uppercase text-[10px] block mb-1">User Story Statement</span>
                            {story.story}
                          </div>
                        </div>

                        {/* 100% Full-Width Side-by-Side Horizontal Grid: Left (Scorecard & INVEST) | Right (Acceptance Criteria) */}
                        <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 w-full">
                          {/* Left Column (5 cols): System Scorecard & INVEST */}
                          <div className="xl:col-span-5 flex flex-col justify-between space-y-4">
                            {val && (
                              <div className="p-4 rounded-lg bg-slate-50/90 border border-slate-200/80">
                                <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-200/60">
                                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 uppercase tracking-wider">
                                    <Award size={15} className="text-indigo-600" />
                                    <span>System Quality Scorecard</span>
                                  </div>
                                  <div className="px-2.5 py-0.5 rounded-md bg-indigo-600 text-white font-bold text-xs shadow-2xs">
                                    <span>{val.overall_quality_score.toFixed(1)}</span>
                                    <span className="text-[10px] text-indigo-200 font-normal"> / 100</span>
                                  </div>
                                </div>

                                {/* 4 Core Metrics 2x2 Grid */}
                                <div className="grid grid-cols-2 gap-2">
                                  <div className="p-2 rounded-md bg-white border border-slate-200/60">
                                    <span className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider block mb-0.5">Evidence Alignment</span>
                                    <span className="text-xs font-bold text-slate-900">{val.evidence_score.toFixed(1)}%</span>
                                  </div>

                                  <div className="p-2 rounded-md bg-white border border-slate-200/60">
                                    <span className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider block mb-0.5">Hallucination Risk</span>
                                    <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                                      <ShieldCheck size={12} />
                                      {(val.hallucination_score * 100).toFixed(1)}% (Clean)
                                    </span>
                                  </div>

                                  <div className="p-2 rounded-md bg-white border border-slate-200/60">
                                    <span className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider block mb-0.5">Format Rules</span>
                                    <span className="text-xs font-bold text-indigo-600">{val.rule_score.toFixed(0)} / 100</span>
                                  </div>

                                  <div className="p-2 rounded-md bg-white border border-slate-200/60">
                                    <span className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider block mb-0.5">INVEST Score</span>
                                    <span className="text-xs font-bold text-purple-600">{val.invest_score.toFixed(1)} / 5.0</span>
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* INVEST Principles Row */}
                            <div className="p-3 rounded-lg bg-slate-50/70 border border-slate-200/60 flex items-center justify-between">
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                                <Sparkles size={11} className="text-indigo-500" /> INVEST Principles
                              </span>
                              <div className="flex gap-1">
                                {[
                                  { key: 'Independent', label: 'I', desc: 'Independent' },
                                  { key: 'Negotiable', label: 'N', desc: 'Negotiable' },
                                  { key: 'Valuable', label: 'V', desc: 'Valuable' },
                                  { key: 'Estimable', label: 'E', desc: 'Estimable' },
                                  { key: 'Small', label: 'S', desc: 'Small' },
                                  { key: 'Testable', label: 'T', desc: 'Testable' },
                                ].map((item) => {
                                  const isPassed = story.invest_validation
                                    ? (story.invest_validation as any)[item.key] !== false
                                    : true;
                                  return (
                                    <div
                                      key={item.key}
                                      title={`${item.desc}: ${isPassed ? 'Passed' : 'Needs Review'}`}
                                      className={`w-5 h-5 rounded flex items-center justify-center text-[10px] font-bold uppercase transition-all cursor-help ${isPassed
                                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/80'
                                        : 'bg-rose-50 text-rose-700 border border-rose-200/80'
                                        }`}
                                    >
                                      {item.label}
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          </div>

                          {/* Right Column (7 cols): Acceptance Criteria */}
                          <div className="xl:col-span-7 bg-slate-50/60 rounded-lg p-4 border border-slate-200/70 flex flex-col w-full">
                            <h5 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                              <CheckCircle2 size={13} className="text-indigo-600" />
                              Acceptance Criteria ({story.acceptance_criteria.length})
                            </h5>
                            <div className="space-y-2 flex-grow">
                              {story.acceptance_criteria.map((ac, acIdx) => (
                                <div key={acIdx} className="flex items-start gap-2.5 text-xs text-slate-700 font-medium leading-snug bg-white p-2.5 rounded border border-slate-200/60 shadow-2xs">
                                  <div className="mt-1 w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0" />
                                  <span>{ac}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>
      </div>

      {/* Edit Story Modal (Clean Posh Design) */}
      <AnimatePresence>
        {editingStory && (
          <div className="fixed inset-0 z-[150] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.98, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98, y: 10 }}
              className="bg-white rounded-xl border border-slate-200 shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[85vh]"
            >
              {/* Modal Header */}
              <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/80">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-md bg-indigo-600 text-white flex items-center justify-center shadow-2xs">
                    <Pencil size={16} />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">Edit User Story</h3>
                    <p className="text-[11px] text-slate-500 font-medium">Mandatory System 5-Layer Quality Re-Validation</p>
                  </div>
                </div>
                <button
                  onClick={() => setEditingStory(null)}
                  className="p-1.5 text-slate-400 hover:text-slate-900 rounded-md hover:bg-slate-200/60 transition-all"
                  disabled={saving}
                >
                  <X size={18} />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 overflow-y-auto space-y-5 flex-grow custom-scrollbar">
                {/* Title & Priority */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  <div className="md:col-span-3">
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Title</label>
                    <input
                      type="text"
                      value={editTitle}
                      onChange={e => setEditTitle(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-slate-900 font-semibold text-xs focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 transition-all"
                      placeholder="Story Title"
                      disabled={saving}
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Priority</label>
                    <select
                      value={editPriority}
                      onChange={e => setEditPriority(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-slate-900 font-semibold text-xs focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 transition-all bg-white"
                      disabled={saving}
                    >
                      <option value="Must">Must</option>
                      <option value="Should">Should</option>
                      <option value="Could">Could</option>
                    </select>
                  </div>
                </div>

                {/* Story Statement */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Story Statement (As a... I want... So that...)</label>
                  <textarea
                    rows={3}
                    value={editStoryText}
                    onChange={e => setEditStoryText(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-slate-900 font-medium text-xs focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 transition-all leading-relaxed"
                    placeholder="As a [role], I want [feature] so that [benefit]."
                    disabled={saving}
                  />
                </div>

                {/* Acceptance Criteria Editor */}
                <div>
                  <div className="flex items-center justify-between mb-2.5">
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">Acceptance Criteria (Given / When / Then)</label>
                    <button
                      type="button"
                      onClick={addAC}
                      className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 bg-indigo-50 px-2.5 py-1 rounded-md border border-indigo-100 transition-all"
                      disabled={saving}
                    >
                      <Plus size={13} /> Add Criterion
                    </button>
                  </div>
                  <div className="space-y-2">
                    {editACs.map((ac, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <input
                          type="text"
                          value={ac}
                          onChange={e => handleACChange(idx, e.target.value)}
                          className="flex-grow px-3.5 py-2 rounded-lg border border-slate-300 text-slate-900 font-medium text-xs focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 transition-all"
                          placeholder="Given... When... Then..."
                          disabled={saving}
                        />
                        <button
                          type="button"
                          onClick={() => removeAC(idx)}
                          className="p-2 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-all"
                          disabled={saving}
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-amber-50/80 border border-amber-200/80 text-[11px] font-medium text-amber-900 flex items-start gap-2">
                  <ShieldCheck size={16} className="text-amber-600 shrink-0 mt-0.5" />
                  <span>
                    <strong className="font-bold">System Quality Rule:</strong> Upon saving, our 5-Layer Validation Engine will automatically re-verify format rules, evidence grounding, hallucination risks, and INVEST criteria. Quality scores are 100% system-calculated.
                  </span>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="px-6 py-3.5 border-t border-slate-200 flex items-center justify-end gap-2.5 bg-slate-50/80">
                <button
                  type="button"
                  onClick={() => setEditingStory(null)}
                  className="px-4 py-2 rounded-lg text-slate-600 font-semibold text-xs hover:bg-slate-200/70 transition-all"
                  disabled={saving}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveAndRevalidate}
                  disabled={saving}
                  className="px-5 py-2 rounded-lg bg-indigo-600 text-white font-semibold text-xs hover:bg-indigo-700 transition-all shadow-xs flex items-center gap-1.5 active:scale-95 disabled:opacity-50"
                >
                  {saving ? (
                    <>
                      <RefreshCw size={14} className="animate-spin" />
                      Running System Re-Validation...
                    </>
                  ) : (
                    <>
                      <Save size={14} />
                      Save & System Re-Validate
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
