import React, { useRef, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, MoreVertical, Mic, Send, Activity, ChevronRight, ListChecks } from 'lucide-react';
import { TranscriptEntry, RequirementEntry } from '../../store/useMeetingStore';

interface TranscriptSidebarProps {
    transcript: TranscriptEntry[];
    requirements?: RequirementEntry[];
    clearTranscript: () => void;
    acousticFeatures?: { pitch: number; energy: number };
    onClose?: () => void;
}

export const TranscriptSidebar: React.FC<TranscriptSidebarProps> = ({ transcript, requirements = [], clearTranscript, acousticFeatures, onClose }) => {
    const transcriptEndRef = useRef<HTMLDivElement>(null);
    const requirementsEndRef = useRef<HTMLDivElement>(null);
    const [activeTab, setActiveTab] = useState<'transcript' | 'requirements'>('transcript');

    useEffect(() => {
        if (activeTab === 'transcript') {
            transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        } else {
            requirementsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
    }, [transcript, requirements, activeTab]);

    return (
        <aside className="w-full h-full lg:w-80 xl:w-96 flex flex-col gap-4">
            <div className="flex-grow bg-white rounded-3xl border border-gray-200 flex flex-col overflow-hidden shadow-sm">
                <div className="p-4 border-b border-gray-100 flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${activeTab === 'transcript' ? 'bg-blue-50 text-blue-600' : 'bg-purple-50 text-purple-600'}`}>
                                {activeTab === 'transcript' ? <MessageSquare size={20} /> : <ListChecks size={20} />}
                            </div>
                            <div>
                                <h2 className="font-bold text-gray-900 text-sm">{activeTab === 'transcript' ? 'Transcription' : 'Requirements'}</h2>
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

                    <div className="flex bg-gray-100 p-1 rounded-xl">
                        <button
                            onClick={() => setActiveTab('transcript')}
                            className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                                activeTab === 'transcript'
                                    ? 'bg-white text-blue-600 shadow-sm'
                                    : 'text-gray-500 hover:text-gray-700'
                            }`}
                        >
                            Transcript
                        </button>
                        <button
                            onClick={() => setActiveTab('requirements')}
                            className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-2 ${
                                activeTab === 'requirements'
                                    ? 'bg-white text-purple-600 shadow-sm'
                                    : 'text-gray-500 hover:text-gray-700'
                            }`}
                        >
                            Requirements
                            {requirements.length > 0 && (
                                <span className="bg-purple-100 text-purple-600 px-1.5 py-0.5 rounded-full text-[10px]">
                                    {requirements.length}
                                </span>
                            )}
                        </button>
                    </div>
                </div>

                {/* Integrated Acoustics Analysis */}
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
                                        <p className="text-[10px] text-gray-400 mt-2">Unmute your microphone to start the live transcription stream.</p>
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
                        ) : (
                            <motion.div 
                                key="requirements-view"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="space-y-4"
                            >
                                {requirements.length === 0 ? (
                                    <div className="h-full flex flex-col items-center justify-center text-center opacity-40 py-20 px-6">
                                        <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4"><ListChecks size={32} className="text-gray-400" /></div>
                                        <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Awaiting Requirements...</p>
                                        <p className="text-[10px] text-gray-400 mt-2">Speak clearly about system features, and the AI will extract them here.</p>
                                    </div>
                                ) : (
                                    requirements.map((req) => (
                                        <motion.div
                                            key={req.requirement_id}
                                            initial={{ opacity: 0, scale: 0.95, y: 10 }}
                                            animate={{ opacity: 1, scale: 1, y: 0 }}
                                            className="bg-white p-4 rounded-2xl border border-purple-100 shadow-sm space-y-2 group hover:border-purple-300 transition-colors"
                                        >
                                            <div className="flex items-center justify-between">
                                                <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-full ${
                                                    req.requirement_type.toLowerCase().includes('non') 
                                                        ? 'bg-orange-100 text-orange-600' 
                                                        : 'bg-green-100 text-green-600'
                                                }`}>
                                                    {req.requirement_type}
                                                </span>
                                            </div>
                                            <p className="text-sm text-gray-800 font-medium leading-relaxed">
                                                {req.requirement_text}
                                            </p>
                                        </motion.div>
                                    ))
                                )}
                                <div ref={requirementsEndRef} />
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
