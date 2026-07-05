import React, { useState } from 'react';
import { Sparkles, CheckCircle2, PhoneOff, ArrowRight, FileText, Share2 } from 'lucide-react';
import { MeetingStoryGenerator } from './MeetingStoryGenerator';
import { RequirementsFinalizer } from './RequirementsFinalizer';

interface EndOfMeetingSummaryProps {
  meetingId: string;
  duration: string;
  participantCount: number;
  onExit: () => void;
}

export const EndOfMeetingSummary: React.FC<EndOfMeetingSummaryProps> = ({ 
  meetingId, 
  duration, 
  participantCount, 
  onExit 
}) => {
  const [showStories, setShowStories] = useState(false);
  const [showFinalizer, setShowFinalizer] = useState(false);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300" />
      
      <div className="relative w-full max-w-md bg-white rounded-[2rem] shadow-2xl border border-gray-100 overflow-hidden animate-in zoom-in-95 duration-300">
        <div className="p-6 sm:p-8">
          <div className="flex flex-col items-center text-center mb-6">
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 flex items-center justify-center mb-4">
              <CheckCircle2 size={28} className="text-emerald-500" />
            </div>
            <h1 className="text-xl font-black text-gray-900 tracking-tight mb-1">Meeting Concluded</h1>
            <p className="text-[11px] text-gray-400 font-bold uppercase tracking-wider">Session {meetingId}</p>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-6">
            <div className="bg-gray-50/50 rounded-2xl p-4 border border-gray-100 flex flex-col items-center">
              <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Duration</p>
              <p className="text-lg font-black text-gray-900">{duration}</p>
            </div>
            <div className="bg-gray-50/50 rounded-2xl p-4 border border-gray-100 flex flex-col items-center">
              <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Participants</p>
              <p className="text-lg font-black text-gray-900">{participantCount}</p>
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Recommended Next Steps</h3>
            
            <button 
              onClick={() => setShowFinalizer(true)}
              className="w-full group flex items-center justify-between p-4 rounded-2xl bg-indigo-600 text-white shadow-lg shadow-indigo-200 transition-all hover:bg-indigo-700 active:scale-95"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-sm">
                  <Sparkles size={20} />
                </div>
                <div className="text-left">
                  <p className="font-bold text-sm">Review & Finalize Req's</p>
                  <p className="text-white/60 text-[10px] font-medium">Resolve conflicts & generate stories</p>
                </div>
              </div>
              <ArrowRight size={16} className="opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all" />
            </button>

            <div className="grid grid-cols-2 gap-3">
              <button className="flex items-center justify-center gap-2 py-3 rounded-xl border border-gray-100 bg-white text-gray-600 font-bold text-xs hover:bg-gray-50 transition-all">
                <FileText size={14} className="text-blue-500" />
                Summary
              </button>
              <button className="flex items-center justify-center gap-2 py-3 rounded-xl border border-gray-100 bg-white text-gray-600 font-bold text-xs hover:bg-gray-50 transition-all">
                <Share2 size={14} className="text-purple-500" />
                Brief
              </button>
            </div>
          </div>

          <button 
            onClick={onExit}
            className="mt-8 w-full flex items-center justify-center gap-2 text-[11px] font-black text-gray-400 hover:text-rose-500 transition-colors uppercase tracking-widest"
          >
            <PhoneOff size={14} />
            Return to Home
          </button>
        </div>
      </div>

      {showFinalizer && (
        <RequirementsFinalizer
          meetingId={meetingId}
          onBack={() => setShowFinalizer(false)}
          onFinalized={() => {
            setShowFinalizer(false);
            setShowStories(true);
          }}
        />
      )}

      {showStories && (
        <MeetingStoryGenerator 
          meetingId={meetingId} 
          onBack={() => setShowStories(false)} 
        />
      )}
    </div>
  );
};
