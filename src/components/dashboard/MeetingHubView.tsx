import React, { useState } from 'react';
import { Users, Globe, Shield, LogOut, Check, ArrowRight } from 'lucide-react';
import { InviteItem } from './InviteItem';

interface MeetingHubViewProps {
  onJoin: (meetingId: string, passcode: string) => Promise<void>;
  onCreate: (mode: 'instant' | 'scheduled', date?: string, time?: string) => Promise<void>;
  isLoading: boolean;
  error: string | null;
  isCreated: boolean;
  inviteDetails: { id: string, passcode: string, link: string } | null;
  onLaunch: () => void;
  onCopy: () => void;
}

export const MeetingHubView: React.FC<MeetingHubViewProps> = ({
  onJoin,
  onCreate,
  isLoading,
  error,
  isCreated,
  inviteDetails,
  onLaunch,
  onCopy
}) => {
  const [activeTab, setActiveTab] = useState<'join' | 'create'>('join');
  const [meetingId, setMeetingId] = useState('');
  const [passcode, setPasscode] = useState('');
  const [mode, setMode] = useState<'instant' | 'scheduled'>('instant');
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');

  const handleJoinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onJoin(meetingId, passcode);
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onCreate(mode, scheduledDate, scheduledTime);
  };

  return (
    <div className="max-w-md mx-auto py-4">
      <div className="mb-5 text-center">

        <h3 className="text-xl font-black text-slate-900 mb-1 tracking-tight">Agile Meeting Hub</h3>
        <p className="text-slate-400 font-bold text-[8px] uppercase tracking-[0.2em]">Synchronize your team with AI-driven transcription</p>
      </div>

      {!isCreated && (
        <div className="flex bg-slate-100/80 p-1 rounded-lg w-fit mx-auto mb-5 border border-slate-200/50">
          <button
            onClick={() => setActiveTab('join')}
            className={`px-8 py-2 rounded text-[8px] font-black uppercase tracking-widest transition-all duration-300 ${activeTab === 'join' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
          >
            Join Meeting
          </button>
          <button
            onClick={() => setActiveTab('create')}
            className={`px-8 py-2 rounded text-[8px] font-black uppercase tracking-widest transition-all duration-300 ${activeTab === 'create' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
          >
            Host Session
          </button>
        </div>
      )}

      {activeTab === 'join' ? (
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
          <form onSubmit={handleJoinSubmit} className="space-y-5">
            <div className="space-y-3">
              <div className="space-y-1.5">
                <label className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Meeting ID / Identity</label>
                <div className="relative group">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-500 transition-colors">
                    <Globe size={14} />
                  </div>
                  <input
                    type="text"
                    value={meetingId}
                    onChange={(e) => setMeetingId(e.target.value.toUpperCase())}
                    placeholder="E.G. GAMAGE@GMAIL.COM"
                    className="w-full bg-slate-50 border border-slate-100 rounded-lg py-2.5 pl-9 pr-3 outline-none focus:bg-white focus:border-blue-500 transition-all font-mono text-xs font-bold tracking-widest text-slate-900"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Secure Passcode</label>
                <div className="relative group">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-500 transition-colors">
                    <Shield size={14} />
                  </div>
                  <input
                    type="password"
                    value={passcode}
                    onChange={(e) => setPasscode(e.target.value)}
                    placeholder="•••••••••"
                    className="w-full bg-slate-50 border border-slate-100 rounded-lg py-2.5 pl-9 pr-3 outline-none focus:bg-white focus:border-blue-500 transition-all font-mono text-xs font-bold tracking-widest text-slate-900"
                  />
                </div>
              </div>
            </div>

            {error && (
              <div className="p-2.5 rounded-md bg-rose-50 border border-rose-100 text-rose-600 text-[8px] font-black uppercase tracking-widest flex items-center gap-2">
                <LogOut className="rotate-180" size={12} /> {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading || !meetingId || !passcode}
              className="w-full py-3 rounded-lg font-black text-[9px] uppercase tracking-[0.25em] bg-blue-600 text-white flex items-center justify-center gap-2 transition-all active:scale-[0.97] hover:bg-blue-700 shadow-lg shadow-blue-600/20 disabled:opacity-40"
            >
              {isLoading ? (
                <><div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Authorizing...</>
              ) : (
                <><ArrowRight size={14} /> Enter Workspace</>
              )}
            </button>

            <div className="relative pt-2">
              <div className="absolute inset-0 flex items-center pt-2">
                <div className="w-full border-t border-slate-100"></div>
              </div>
              <div className="relative flex justify-center text-[8px] uppercase tracking-widest font-black pt-2">
                <span className="bg-white px-2 text-slate-300">or integrate</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => alert("Slack Meeting integration coming soon.")}
              className="w-full py-2.5 rounded-lg border border-slate-200 font-black text-[8px] uppercase tracking-[0.2em] text-slate-600 flex items-center justify-center gap-2 hover:bg-slate-50 hover:border-slate-300 transition-all active:scale-[0.98]"
            >
              <img src="https://upload.wikimedia.org/wikipedia/commons/d/d5/Slack_icon_2019.svg" alt="Slack" className="w-3.5 h-3.5" />
              Plug with Slack Meeting
            </button>
          </form>
        </div>
      ) : isCreated && inviteDetails ? (
        <div className="space-y-4 animate-in zoom-in-95 duration-500 max-w-sm mx-auto">
          <div className="p-6 bg-blue-50 rounded-3xl border border-blue-100 space-y-4">
            <div className="text-center mb-2">
              <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-blue-600 mx-auto mb-3 shadow-sm">
                <Check size={20} />
              </div>
              <h3 className="text-base font-black text-slate-900">Provisioned Successfully</h3>
            </div>
            <div className="space-y-2">
              <InviteItem label="Meeting ID" value={inviteDetails.id} onCopy={onCopy} />
              <InviteItem label="Passcode" value={inviteDetails.passcode} onCopy={onCopy} />
            </div>
          </div>
          <button
            onClick={onLaunch}
            className="w-full py-3 rounded-xl font-black text-[10px] uppercase tracking-[0.2em] bg-blue-600 text-white flex items-center justify-center gap-2 transition-all active:scale-[0.98] shadow-lg shadow-blue-500/20"
          >
            Launch Now
          </button>
        </div>
      ) : (
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
          <form onSubmit={handleCreateSubmit} className="space-y-5">
            <div className="flex bg-slate-100 p-1 rounded-lg w-fit mx-auto">
              <button type="button" onClick={() => setMode('instant')} className={`px-5 py-1.5 rounded-md text-[8px] font-black uppercase tracking-widest transition-all ${mode === 'instant' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400'}`}>Instant</button>
              <button type="button" onClick={() => setMode('scheduled')} className={`px-5 py-1.5 rounded-md text-[8px] font-black uppercase tracking-widest transition-all ${mode === 'scheduled' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400'}`}>Scheduled</button>
            </div>

            {mode === 'scheduled' && (
              <div className="grid grid-cols-2 gap-3 animate-in slide-in-from-top-2 duration-300">
                <div className="space-y-1.5">
                  <label className="text-[8px] font-black text-slate-400 uppercase ml-1 tracking-widest">Date</label>
                  <input type="date" value={scheduledDate} onChange={(e) => setScheduledDate(e.target.value)} className="w-full bg-slate-50 border border-transparent rounded-lg py-2.5 px-3 outline-none focus:bg-white focus:border-blue-500 text-xs font-bold" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[8px] font-black text-slate-400 uppercase ml-1 tracking-widest">Time</label>
                  <input type="time" value={scheduledTime} onChange={(e) => setScheduledTime(e.target.value)} className="w-full bg-slate-50 border border-transparent rounded-lg py-2.5 px-3 outline-none focus:bg-white focus:border-blue-500 text-xs font-bold" />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 rounded-lg font-black text-[9px] uppercase tracking-[0.2em] bg-blue-600 text-white flex items-center justify-center gap-2 transition-all active:scale-[0.98] shadow-lg shadow-blue-600/20 disabled:opacity-40"
            >
              {isLoading ? 'Allocating Resources...' : 'Initialize Workspace'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
