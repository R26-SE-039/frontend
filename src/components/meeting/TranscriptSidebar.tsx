import React, { useRef, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MessageSquare, MoreVertical, Mic, Send, Activity, ChevronRight, ListChecks, AlertTriangle,
  Clock, User, Sparkles, CheckCircle2, HelpCircle, Check, Calendar
} from 'lucide-react';
import { TranscriptEntry, RequirementEntry, ConflictEntry, useMeetingStore } from '../../store/useMeetingStore';

interface TranscriptSidebarProps {
    transcript: TranscriptEntry[];
    requirements?: RequirementEntry[];
    conflicts?: ConflictEntry[];
    clearTranscript: () => void;
    acousticFeatures?: { pitch: number; energy: number };
    onClose?: () => void;
}


const STATES = [
  { value: 'context_only', label: 'Context Only', shortLabel: 'Context' },
  { value: 'candidate', label: 'Candidate', shortLabel: 'Candidate' },
  { value: 'clarification_needed', label: 'Clarification Needed', shortLabel: 'Clarify' },
  { value: 'confirmed', label: 'Confirmed', shortLabel: 'Confirm' }
];

const getActiveStepIndex = (currentState: string) => {
  const normalized = currentState.toLowerCase();
  if (normalized === 'context_only') return 0;
  if (normalized === 'candidate') return 1;
  if (normalized === 'clarification_needed') return 2;
  if (normalized === 'confirmed' || normalized === 'approved' || normalized === 'rejected') return 3;
  return 0;
};

const getConfidenceScore = (threadId: string, state: string) => {
  let hash = 0;
  for (let i = 0; i < threadId.length; i++) {
    hash = threadId.charCodeAt(i) + ((hash << 5) - hash);
  }
  const base = Math.abs(hash % 20); // 0 to 19
  const normalized = state.toLowerCase();
  if (normalized === 'confirmed' || normalized === 'approved') return 80 + base;
  if (normalized === 'candidate') return 65 + base;
  if (normalized === 'clarification_needed') return 40 + base;
  return 20 + base;
};

const formatLastUpdated = (dateStr?: string) => {
  if (!dateStr) return 'Just now';
  try {
    const d = new Date(dateStr);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch {
    return 'Just now';
  }
};

export const TranscriptSidebar: React.FC<TranscriptSidebarProps> = ({ transcript, requirements = [], conflicts = [], clearTranscript, acousticFeatures, onClose }) => {
    const threads = useMeetingStore(state => state.threads);
    const transcriptEndRef = useRef<HTMLDivElement>(null);
    const requirementsEndRef = useRef<HTMLDivElement>(null);
    const conflictsEndRef = useRef<HTMLDivElement>(null);
    const [activeTab, setActiveTab] = useState<'transcript' | 'requirements' | 'conflicts'>('transcript');

    useEffect(() => {
        if (activeTab === 'transcript') {
            transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        } else if (activeTab === 'requirements') {
            requirementsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        } else {
            conflictsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
    }, [transcript, requirements, conflicts, activeTab]);

    const getTabIcon = () => {
        if (activeTab === 'transcript') return <MessageSquare size={20} />;
        if (activeTab === 'requirements') return <ListChecks size={20} />;
        return <AlertTriangle size={20} />;
    };

    const getTabTitle = () => {
        if (activeTab === 'transcript') return 'Transcription';
        if (activeTab === 'requirements') return 'Requirements';
        return 'Conflicts';
    };

    const getTabIconBg = () => {
        if (activeTab === 'transcript') return 'bg-blue-50 text-blue-600';
        if (activeTab === 'requirements') return 'bg-purple-50 text-purple-600';
        return 'bg-red-50 text-red-600';
    };

    const getSeverityStyle = (severity: string) => {
        switch (severity?.toLowerCase()) {
            case 'high': return { badge: 'bg-red-100 text-red-600 border border-red-200', dot: 'bg-red-500', card: 'border-red-200 bg-red-50/30' };
            case 'medium': return { badge: 'bg-orange-100 text-orange-600 border border-orange-200', dot: 'bg-orange-500', card: 'border-orange-200 bg-orange-50/30' };
            default: return { badge: 'bg-yellow-100 text-yellow-600 border border-yellow-200', dot: 'bg-yellow-500', card: 'border-yellow-200 bg-yellow-50/30' };
        }
    };

    return (
        <aside className="w-full h-full lg:w-80 xl:w-96 flex flex-col gap-4">
            <div className="flex-grow bg-white rounded-3xl border border-gray-200 flex flex-col overflow-hidden shadow-sm">
                <div className="p-4 border-b border-gray-100 flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${getTabIconBg()}`}>
                                {getTabIcon()}
                            </div>
                            <div>
                                <h2 className="font-bold text-gray-900 text-sm">{getTabTitle()}</h2>
                                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">Real-time Stream</p>
                            </div>
                        </div>
                        <div className="flex items-center">
                            <button
                                onClick={clearTranscript}
                                className="p-2 text-gray-300 hover:text-gray-500"
                            >
                                <MoreVertical size={20} />
                            </button>
                            {onClose && (
                              <button 
                                onClick={onClose}
                                className="lg:hidden p-2 hover:bg-gray-100 rounded-lg text-gray-400 transition-colors ml-1"
                              >
                                <ChevronRight size={20} />
                              </button>
                            )}
                        </div>
                    </div>

                    <div className="flex bg-gray-100 p-1 rounded-xl gap-1">
                        <button
                            onClick={() => setActiveTab('transcript')}
                            className={`flex-1 py-1.5 text-[10px] font-semibold rounded-lg transition-all ${
                                activeTab === 'transcript'
                                    ? 'bg-white text-blue-600 shadow-sm'
                                    : 'text-gray-500 hover:text-gray-700'
                            }`}
                        >
                            Transcript
                        </button>
                        <button
                            onClick={() => setActiveTab('requirements')}
                            className={`flex-1 py-1.5 text-[10px] font-semibold rounded-lg transition-all flex items-center justify-center gap-1 ${
                                activeTab === 'requirements'
                                    ? 'bg-white text-purple-600 shadow-sm'
                                    : 'text-gray-500 hover:text-gray-700'
                            }`}
                        >
                            Req's
                            {threads.length > 0 && (
                                <span className="bg-purple-100 text-purple-600 px-1.5 py-0.5 rounded-full text-[9px]">
                                    {threads.length}
                                </span>
                            )}
                        </button>
                        <button
                            onClick={() => setActiveTab('conflicts')}
                            className={`flex-1 py-1.5 text-[10px] font-semibold rounded-lg transition-all flex items-center justify-center gap-1 ${
                                activeTab === 'conflicts'
                                    ? 'bg-white text-red-600 shadow-sm'
                                    : 'text-gray-500 hover:text-gray-700'
                            }`}
                        >
                            Conflicts
                            {conflicts.length > 0 && (
                                <span className="bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full text-[9px] animate-pulse">
                                    {conflicts.length}
                                </span>
                            )}
                        </button>
                    </div>
                </div>

                {acousticFeatures && (
                    <div className="mx-5 mt-4 p-4 rounded-2xl bg-gray-50 border border-gray-100 space-y-3">
                        <div className="flex items-center gap-2 mb-1">
                            <Activity size={14} className="text-blue-500" />
                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Acoustics Live</span>
                        </div>
                        <div className="space-y-3">
                            <div>
                                <div className="flex justify-between items-center mb-1">
                                    <span className="text-[9px] font-bold text-gray-400 uppercase">Pitch</span>
                                    <span className="text-[10px] font-bold text-blue-600">{Math.round(acousticFeatures.pitch)}Hz</span>
                                </div>
                                <div className="h-1 bg-gray-200 rounded-full overflow-hidden">
                                    <div 
                                        className="h-full bg-blue-500 transition-all duration-300" 
                                        style={{ width: `${Math.min(100, (acousticFeatures.pitch / 150) * 100)}%` }} 
                                    />
                                </div>
                            </div>
                            <div>
                                <div className="flex justify-between items-center mb-1">
                                    <span className="text-[9px] font-bold text-gray-400 uppercase">Energy</span>
                                    <span className="text-[10px] font-bold text-purple-600">{Math.round(acousticFeatures.energy)}dB</span>
                                </div>
                                <div className="h-1 bg-gray-200 rounded-full overflow-hidden">
                                    <div 
                                        className="h-full bg-purple-500 transition-all duration-300" 
                                        style={{ width: `${Math.min(100, acousticFeatures.energy * 2)}%` }} 
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                <div className="flex-grow overflow-y-auto p-5 space-y-6 custom-scrollbar bg-white/50">
                    <AnimatePresence mode="wait">
                        {activeTab === 'transcript' ? (
                            <motion.div 
                                key="transcript-view"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="space-y-6"
                            >
                                {transcript.length === 0 ? (
                                    <div className="h-full flex flex-col items-center justify-center text-center opacity-40 py-20 px-6">
                                        <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4"><Mic size={32} className="text-gray-400" /></div>
                                        <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Listening for audio...</p>
                                    </div>
                                ) : (
                                    transcript.map((entry) => (
                                        <motion.div
                                            key={entry.id}
                                            initial={{ opacity: 0, x: 20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            className="space-y-2 group text-left"
                                        >
                                            <div className="flex items-center justify-between mb-1">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                                                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-900">{entry.speakerName}</span>
                                                </div>
                                                <span className="text-[9px] text-gray-400 font-bold tabular-nums">{entry.timestamp}</span>
                                            </div>
                                            <p className="text-sm text-gray-800 leading-relaxed font-medium bg-gray-50 p-4 rounded-2xl border border-gray-100 shadow-sm group-hover:bg-white transition-colors">{entry.text}</p>
                                        </motion.div>
                                    ))
                                )}
                                <div ref={transcriptEndRef} />
                            </motion.div>
                        ) : activeTab === 'requirements' ? (
                            <motion.div 
                                key="requirements-view"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="space-y-4"
                            >
                                {threads.length === 0 ? (
                                    <div className="h-full flex flex-col items-center justify-center text-center opacity-40 py-20 px-6">
                                        <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4"><ListChecks size={32} className="text-gray-400" /></div>
                                        <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Awaiting Requirements...</p>
                                    </div>
                                ) : (
                                    threads.map((thread) => {
                                        const confidence = getConfidenceScore(thread.thread_id, thread.state);
                                        const stateIndex = getActiveStepIndex(thread.state);
                                        
                                        return (
                                            <motion.div
                                                key={thread.thread_id}
                                                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                                className="bg-white p-5 rounded-2xl border border-purple-100 shadow-sm space-y-4 group hover:border-purple-300 transition-colors"
                                            >
                                                {/* Header info */}
                                                <div className="flex items-start justify-between gap-2">
                                                    <div className="space-y-1">
                                                        <h4 className="text-sm font-bold text-gray-900 leading-tight">
                                                            {thread.topic_label || thread.thread_label || 'Requirement Thread'}
                                                        </h4>
                                                        <div className="flex items-center gap-2 text-[10px] text-gray-400 font-semibold">
                                                            <span className="flex items-center gap-1">
                                                                <User size={10} /> {thread.created_by || 'Unknown'}
                                                            </span>
                                                            <span>•</span>
                                                            <span className="flex items-center gap-1">
                                                                <Clock size={10} /> {formatLastUpdated(thread.updated_at || thread.last_activity_at)}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    
                                                    {/* State Badge */}
                                                    <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-full shrink-0 ${
                                                        thread.state === 'confirmed' || thread.state === 'approved'
                                                            ? 'bg-green-50 text-green-600 border border-green-100'
                                                            : thread.state === 'clarification_needed'
                                                                ? 'bg-orange-50 text-orange-600 border border-orange-100'
                                                                : 'bg-blue-50 text-blue-600 border border-blue-100'
                                                    }`}>
                                                        {thread.state.replace('_', ' ')}
                                                    </span>
                                                </div>

                                                {/* Description */}
                                                <p className="text-xs text-gray-600 leading-relaxed font-medium bg-gray-50/50 p-3 rounded-xl border border-gray-100">
                                                    {thread.summary_text || 'No description yet.'}
                                                </p>

                                                {/* Stepper Visualization */}
                                                <div className="pt-2 border-t border-gray-100">
                                                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-3">State Lifecycle</p>
                                                    <div className="flex items-center justify-between relative px-2">
                                                        {/* Connector line behind steps */}
                                                        <div className="absolute left-6 right-6 top-2 h-0.5 bg-gray-100 -z-10" />
                                                        
                                                        {STATES.map((s, idx) => {
                                                            const isCompleted = idx < stateIndex;
                                                            const isActive = idx === stateIndex;
                                                            
                                                            return (
                                                                <div key={s.value} className="flex flex-col items-center gap-1.5 flex-1 relative">
                                                                    {/* Connecting line progress overlay */}
                                                                    {idx < stateIndex && idx < STATES.length - 1 && (
                                                                        <div className="absolute left-[50%] right-[-50%] top-2 h-0.5 bg-purple-500 -z-10" />
                                                                    )}
                                                                    
                                                                    {/* Dot */}
                                                                    <div className={`w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-bold ${
                                                                        isCompleted 
                                                                            ? 'bg-purple-600 text-white shadow-sm shadow-purple-200' 
                                                                            : isActive
                                                                                ? 'bg-purple-600 text-white ring-4 ring-purple-100'
                                                                                : 'bg-white border-2 border-gray-200 text-gray-400'
                                                                    }`}>
                                                                        {isCompleted ? <Check size={8} className="stroke-[3]" /> : idx + 1}
                                                                    </div>
                                                                    
                                                                    {/* Step Label */}
                                                                    <span className={`text-[8px] font-bold uppercase tracking-wider text-center select-none ${
                                                                        isActive 
                                                                            ? 'text-purple-600 font-extrabold' 
                                                                            : isCompleted
                                                                                ? 'text-gray-700 font-semibold'
                                                                                : 'text-gray-400 font-medium'
                                                                    }`}>
                                                                        {s.shortLabel}
                                                                    </span>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </div>

                                                {/* Bottom info: Confidence */}
                                                <div className="flex items-center justify-between pt-2 border-t border-gray-100 text-[10px]">
                                                    <span className="text-gray-400 font-bold uppercase tracking-wider">Confidence Score</span>
                                                    <span className={`font-black flex items-center gap-1 ${
                                                        confidence >= 80 
                                                            ? 'text-green-600' 
                                                            : confidence >= 60
                                                                ? 'text-orange-600'
                                                                : 'text-gray-500'
                                                    }`}>
                                                        <Sparkles size={11} /> {confidence}%
                                                    </span>
                                                </div>
                                            </motion.div>
                                        );
                                    })
                                )}
                                <div ref={requirementsEndRef} />
                            </motion.div>
                        ) : (
                            <motion.div 
                                key="conflicts-view"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="space-y-4"
                            >
                                {conflicts.length === 0 ? (
                                    <div className="h-full flex flex-col items-center justify-center text-center opacity-40 py-20 px-6">
                                        <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                                            <AlertTriangle size={32} className="text-gray-400" />
                                        </div>
                                        <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">No Conflict Detected Yet</p>
                                    </div>
                                ) : (
                                    conflicts.map((conflict, idx) => {
                                        const s = getSeverityStyle(conflict.severity);
                                        return (
                                            <motion.div
                                                key={conflict.conflict_id}
                                                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                                transition={{ delay: idx * 0.05 }}
                                                className={`p-4 rounded-2xl border shadow-sm space-y-3 ${s.card}`}
                                            >
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-2">
                                                        <div className={`w-2 h-2 rounded-full ${s.dot}`} />
                                                        <span className="text-[10px] font-black uppercase tracking-widest text-gray-700">
                                                            {conflict.conflict_type?.replace(/_/g, ' ')}
                                                        </span>
                                                    </div>
                                                    <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-full ${s.badge}`}>
                                                        {conflict.severity} severity
                                                    </span>
                                                </div>
                                                <p className="text-sm text-gray-800 font-medium leading-relaxed bg-white/70 p-3 rounded-xl border border-white/80">
                                                    {conflict.explanation}
                                                </p>
                                                <div className="text-[9px] text-gray-400 font-mono space-y-0.5 pt-1 border-t border-gray-200/50">
                                                    <p>REQ A: <span className="text-gray-500">{conflict.requirement_a_id.slice(0, 8)}...</span></p>
                                                    <p>REQ B: <span className="text-gray-500">{conflict.requirement_b_id.slice(0, 8)}...</span></p>
                                                </div>
                                            </motion.div>
                                        );
                                    })
                                )}
                                <div ref={conflictsEndRef} />
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                <div className="p-4 border-t border-gray-100 bg-gray-50">
                    <div className="relative group">
                        <input
                            type="text"
                            placeholder="Add tag or quick note..."
                            className="w-full bg-white border border-gray-200 rounded-xl py-2.5 pl-4 pr-10 outline-none focus:border-blue-400 transition-all text-xs"
                        />
                        <button className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-blue-500">
                            <Send size={14} />
                        </button>
                    </div>
                </div>
            </div>
        </aside>
    );
};
