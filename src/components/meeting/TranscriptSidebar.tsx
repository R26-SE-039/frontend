import React, { useRef, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MessageSquare, ChevronRight, ListChecks, AlertTriangle,
  Clock, User, Check, Trash2, Mic
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
  { value: 'DISCOVERED', label: 'Discovered Requirement', shortLabel: 'Discovered' },
  { value: 'DISCUSSION', label: 'In Discussion', shortLabel: 'Discussion' },
  { value: 'REFINED', label: 'Refined Details', shortLabel: 'Refined' },
  { value: 'VALIDATED', label: 'Validated Requirement', shortLabel: 'Validated' }
];

const getActiveStepIndex = (currentState: string) => {
  const normalized = (currentState || '').toUpperCase();
  if (normalized === 'DISCOVERED' || normalized === 'CANDIDATE') return 0;
  if (normalized === 'DISCUSSION' || normalized === 'CLARIFICATION_NEEDED') return 1;
  if (normalized === 'REFINED' || normalized === 'CONFIRMED') return 2;
  if (normalized === 'VALIDATED' || normalized === 'APPROVED') return 3;
  return 0;
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

export const TranscriptSidebar: React.FC<TranscriptSidebarProps> = ({ 
    transcript, 
    requirements = [], 
    conflicts = [], 
    clearTranscript, 
    onClose 
}) => {
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

    const getSeverityStyle = (severity: string) => {
        switch (severity?.toLowerCase()) {
            case 'high': return { badge: 'bg-red-50 text-red-700 border border-red-200', dot: 'bg-red-500', card: 'border-red-200 bg-red-50/20' };
            case 'medium': return { badge: 'bg-amber-50 text-amber-700 border border-amber-200', dot: 'bg-amber-500', card: 'border-amber-200 bg-amber-50/20' };
            default: return { badge: 'bg-yellow-50 text-yellow-700 border border-yellow-200', dot: 'bg-yellow-500', card: 'border-yellow-200 bg-yellow-50/20' };
        }
    };

    return (
        <aside className="w-full h-full lg:w-80 xl:w-96 flex flex-col gap-4">
            <div className="flex-grow bg-white rounded-2xl border border-gray-200 flex flex-col overflow-hidden shadow-sm">
                {/* Clean Enterprise Header */}
                <div className="p-4 border-b border-gray-100 bg-white flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
                                {activeTab === 'transcript' && <MessageSquare size={16} />}
                                {activeTab === 'requirements' && <ListChecks size={16} />}
                                {activeTab === 'conflicts' && <AlertTriangle size={16} />}
                            </div>
                            <div className="text-left">
                                <h2 className="font-bold text-gray-900 text-sm">
                                    {activeTab === 'transcript' ? 'Meeting Transcript' : activeTab === 'requirements' ? 'Requirements' : 'Conflicts'}
                                </h2>
                                <div className="flex items-center gap-1.5 mt-0.5">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                    <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Live Sync</span>
                                </div>
                            </div>
                        </div>
                        
                        <div className="flex items-center gap-1">
                            <button
                                onClick={clearTranscript}
                                title="Clear Stream"
                                className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-gray-50 rounded-lg transition-colors"
                            >
                                <Trash2 size={15} />
                            </button>
                            {onClose && (
                              <button 
                                onClick={onClose}
                                className="lg:hidden p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 transition-colors"
                              >
                                <ChevronRight size={18} />
                              </button>
                            )}
                        </div>
                    </div>

                    {/* Enterprise Tabs (MS Teams Style) */}
                    <div className="flex bg-gray-100/80 p-1 rounded-xl gap-1 border border-gray-200/60">
                        <button
                            onClick={() => setActiveTab('transcript')}
                            className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                                activeTab === 'transcript'
                                    ? 'bg-white text-blue-600 shadow-xs border border-gray-200/60'
                                    : 'text-gray-600 hover:text-gray-900'
                            }`}
                        >
                            Transcript
                        </button>
                        <button
                            onClick={() => setActiveTab('requirements')}
                            className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-1.5 ${
                                activeTab === 'requirements'
                                    ? 'bg-white text-blue-600 shadow-xs border border-gray-200/60'
                                    : 'text-gray-600 hover:text-gray-900'
                            }`}
                        >
                            Req's
                            {threads.length > 0 && (
                                <span className="bg-blue-50 text-blue-600 px-1.5 py-0.2 rounded-full text-[10px] font-bold border border-blue-100">
                                    {threads.length}
                                </span>
                            )}
                        </button>
                        <button
                            onClick={() => setActiveTab('conflicts')}
                            className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-1.5 ${
                                activeTab === 'conflicts'
                                    ? 'bg-white text-red-600 shadow-xs border border-gray-200/60'
                                    : 'text-gray-600 hover:text-gray-900'
                            }`}
                        >
                            Conflicts
                            {conflicts.length > 0 && (
                                <span className="bg-red-50 text-red-600 px-1.5 py-0.2 rounded-full text-[10px] font-bold border border-red-100">
                                    {conflicts.length}
                                </span>
                            )}
                        </button>
                    </div>
                </div>

                {/* Content Stream Area */}
                <div className="flex-grow overflow-y-auto p-4 space-y-3 custom-scrollbar bg-gray-50/50">
                    <AnimatePresence mode="wait">
                        {activeTab === 'transcript' ? (
                            <motion.div 
                                key="transcript-view"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="space-y-3"
                            >
                                {transcript.length === 0 ? (
                                    <div className="h-full flex flex-col items-center justify-center text-center py-20 px-4">
                                        <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mb-3 border border-blue-100">
                                            <Mic size={22} />
                                        </div>
                                        <h3 className="text-xs font-bold text-gray-800 mb-1">Listening for Audio</h3>
                                        <p className="text-xs font-normal text-gray-500 max-w-[200px] leading-relaxed">
                                            Transcripts will appear here automatically when speech is detected.
                                        </p>
                                    </div>
                                ) : (
                                    transcript.map((entry) => (
                                        <motion.div
                                            key={entry.id}
                                            initial={{ opacity: 0, y: 4 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="text-left p-3.5 rounded-xl bg-white border border-gray-200/70 shadow-xs space-y-1.5"
                                        >
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] font-bold">
                                                        {(entry.speakerName || 'S').charAt(0).toUpperCase()}
                                                    </div>
                                                    <span className="text-xs font-bold text-gray-900">{entry.speakerName}</span>
                                                </div>
                                                <span className="text-[10px] font-medium text-gray-400 tabular-nums">
                                                    {entry.timestamp}
                                                </span>
                                            </div>
                                            <p className="text-xs text-gray-700 leading-relaxed font-normal">
                                                {entry.text}
                                            </p>
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
                                className="space-y-3"
                            >
                                {threads.length === 0 ? (
                                    <div className="h-full flex flex-col items-center justify-center text-center py-20 px-4">
                                        <div className="w-12 h-12 rounded-full bg-gray-100 text-gray-500 flex items-center justify-center mb-3">
                                            <ListChecks size={22} />
                                        </div>
                                        <h3 className="text-xs font-bold text-gray-800 mb-1">No Requirements Yet</h3>
                                        <p className="text-xs font-normal text-gray-500 max-w-[200px] leading-relaxed">
                                            Requirements gathered from the meeting will be displayed here.
                                        </p>
                                    </div>
                                ) : (
                                    threads.map((thread) => {
                                        const tid = thread.thread_id || thread.id || '';
                                        const stateName = (thread.state || 'DISCOVERED').toUpperCase();
                                        const stateIndex = getActiveStepIndex(stateName);
                                        
                                        return (
                                            <motion.div
                                                key={tid}
                                                initial={{ opacity: 0, y: 4 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                className="bg-white p-4 rounded-xl border border-gray-200/70 shadow-xs space-y-3 text-left"
                                            >
                                                {/* Header info */}
                                                <div className="flex items-start justify-between gap-2">
                                                    <div className="space-y-0.5">
                                                        <h4 className="text-xs font-bold text-gray-900 leading-snug">
                                                            {thread.requirement_title || thread.topic_label || thread.thread_label || 'Requirement Thread'}
                                                        </h4>
                                                        <div className="flex items-center gap-2 text-[10px] text-gray-400 font-medium">
                                                            <span className="flex items-center gap-1">
                                                                <User size={10} /> {thread.created_by || 'Meeting Host'}
                                                            </span>
                                                            <span>•</span>
                                                            <span className="flex items-center gap-1">
                                                                <Clock size={10} /> {formatLastUpdated(thread.updated_at || thread.created_at)}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    
                                                    {/* State Badge */}
                                                    <span className={`text-[9px] font-semibold uppercase px-2 py-0.5 rounded-md shrink-0 border ${
                                                        stateName === 'VALIDATED' || stateName === 'APPROVED'
                                                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                                            : stateName === 'REFINED'
                                                                ? 'bg-blue-50 text-blue-700 border-blue-200'
                                                                : stateName === 'DISCUSSION'
                                                                    ? 'bg-amber-50 text-amber-700 border-amber-200'
                                                                    : 'bg-gray-100 text-gray-700 border-gray-200'
                                                    }`}>
                                                        {stateName.replace('_', ' ')}
                                                    </span>
                                                </div>

                                                {/* Description */}
                                                <p className="text-xs text-gray-600 leading-relaxed font-normal bg-gray-50 p-2.5 rounded-lg border border-gray-100">
                                                    {thread.summary || thread.summary_text || 'No detailed summary recorded.'}
                                                </p>

                                                {/* Stepper Visualization */}
                                                <div className="pt-2 border-t border-gray-100">
                                                    <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-2.5">Lifecycle Progress</p>
                                                    <div className="flex items-center justify-between relative px-1">
                                                        <div className="absolute left-4 right-4 top-2 h-0.5 bg-gray-200 -z-10" />
                                                        
                                                        {STATES.map((s, idx) => {
                                                            const isCompleted = idx < stateIndex;
                                                            const isActive = idx === stateIndex;
                                                            
                                                            return (
                                                                <div key={s.value} className="flex flex-col items-center gap-1 flex-1 relative">
                                                                    {idx < stateIndex && idx < STATES.length - 1 && (
                                                                        <div className="absolute left-[50%] right-[-50%] top-2 h-0.5 bg-blue-600 -z-10" />
                                                                    )}
                                                                    
                                                                    <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[8px] font-bold transition-all ${
                                                                        isCompleted 
                                                                            ? 'bg-blue-600 text-white' 
                                                                            : isActive
                                                                                ? 'bg-blue-600 text-white ring-2 ring-blue-100'
                                                                                : 'bg-white border border-gray-300 text-gray-400'
                                                                    }`}>
                                                                        {isCompleted ? <Check size={8} className="stroke-[3]" /> : idx + 1}
                                                                    </div>
                                                                    
                                                                    <span className={`text-[8px] font-medium uppercase tracking-wider text-center select-none ${
                                                                        isActive 
                                                                            ? 'text-blue-600 font-bold' 
                                                                            : isCompleted
                                                                                ? 'text-gray-700 font-semibold'
                                                                                : 'text-gray-400'
                                                                    }`}>
                                                                        {s.shortLabel}
                                                                    </span>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
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
                                className="space-y-3"
                            >
                                {conflicts.length === 0 ? (
                                    <div className="h-full flex flex-col items-center justify-center text-center py-20 px-4">
                                        <div className="w-12 h-12 rounded-full bg-red-50 text-red-500 flex items-center justify-center mb-3 border border-red-100">
                                            <AlertTriangle size={22} />
                                        </div>
                                        <h3 className="text-xs font-bold text-gray-800 mb-1">No Conflicts Detected</h3>
                                        <p className="text-xs font-normal text-gray-500 max-w-[200px] leading-relaxed">
                                            Contradictory requirements will be flagged here in real-time.
                                        </p>
                                    </div>
                                ) : (
                                    conflicts.map((conflict, idx) => {
                                        const s = getSeverityStyle(conflict.severity);
                                        const reqA = requirements.find(r => r.requirement_id === conflict.requirement_a_id || r.id === conflict.requirement_a_id);
                                        const reqB = requirements.find(r => r.requirement_id === conflict.requirement_b_id || r.id === conflict.requirement_b_id);

                                        const textA = reqA?.requirement_text || conflict.requirement_a_text || `ID: ${conflict.requirement_a_id?.slice(0, 8)}...`;
                                        const textB = reqB?.requirement_text || conflict.requirement_b_text || `ID: ${conflict.requirement_b_id?.slice(0, 8)}...`;
                                        const isCrossMeeting = !!conflict.source_meeting_title;
                                        const isDuplicate = conflict.conflict_type === 'duplicate';

                                        return (
                                            <motion.div
                                                key={conflict.conflict_id || conflict.id || idx}
                                                initial={{ opacity: 0, y: 4 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: idx * 0.05 }}
                                                className={`p-4 rounded-xl border shadow-xs space-y-2.5 text-left ${
                                                    isDuplicate ? 'border-purple-200 bg-purple-50/30' : s.card
                                                }`}
                                            >
                                                {/* Header Category Badges */}
                                                <div className="flex items-center justify-between gap-1 flex-wrap">
                                                    <div className="flex items-center gap-1.5 flex-wrap">
                                                        {isDuplicate ? (
                                                            <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-purple-100 text-purple-700 border border-purple-200">
                                                                🔄 Duplicate Feature
                                                            </span>
                                                        ) : isCrossMeeting ? (
                                                            <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-blue-100 text-blue-800 border border-blue-200">
                                                                🌐 Cross-Meeting ({conflict.source_meeting_title})
                                                            </span>
                                                        ) : (
                                                            <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-red-100 text-red-700 border border-red-200">
                                                                ⚡ In-Meeting Conflict
                                                            </span>
                                                        )}

                                                        <span className="text-[10px] font-bold uppercase tracking-wider text-gray-700">
                                                            {conflict.conflict_type?.replace(/_/g, ' ')}
                                                        </span>
                                                    </div>

                                                    <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-md ${s.badge}`}>
                                                        {conflict.severity}
                                                    </span>
                                                </div>

                                                <p className="text-xs text-gray-800 font-normal leading-relaxed bg-white p-2.5 rounded-lg border border-gray-100">
                                                    <span className="font-bold text-red-600 block mb-0.5">Analysis:</span>
                                                    {conflict.explanation}
                                                </p>
                                                
                                                <div className="space-y-1.5 pt-1 border-t border-gray-200/50 text-[10px]">
                                                    <div className="p-2 rounded-lg bg-gray-50 border border-gray-200">
                                                        <span className="font-bold text-gray-600 block text-[9px] uppercase tracking-wider mb-0.5">Requirement A (Current Session)</span>
                                                        <p className="text-gray-800 font-medium">{textA}</p>
                                                    </div>
                                                    <div className="p-2 rounded-lg bg-gray-50 border border-gray-200">
                                                        <div className="flex items-center justify-between mb-0.5">
                                                            <span className="font-bold text-gray-600 text-[9px] uppercase tracking-wider">Requirement B</span>
                                                            {conflict.source_meeting_title && (
                                                                <span className="text-[8px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.2 rounded border border-blue-100">
                                                                    Meeting: {conflict.source_meeting_title}
                                                                </span>
                                                            )}
                                                        </div>
                                                        <p className="text-gray-800 font-medium">{textB}</p>
                                                    </div>
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
            </div>
        </aside>
    );
};
