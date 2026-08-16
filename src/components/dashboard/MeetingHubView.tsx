import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Globe, Shield, LogOut, Check, ArrowRight, History, Home } from 'lucide-react';
import { InviteItem } from './InviteItem';
import { IterationHistoryView } from './IterationHistoryView';

interface MeetingHubViewProps {
  onJoin: (meetingId: string, passcode: string) => Promise<void>;
  onCreate: (title: string, mode: 'instant' | 'scheduled', date?: string, time?: string) => Promise<void>;
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
  const navigate = useNavigate();
  const [currentSubView, setCurrentSubView] = useState<'join' | 'create' | 'history' | null>(
    isCreated ? 'create' : null
  );
  const [meetingId, setMeetingId] = useState('');
  const [passcode, setPasscode] = useState('');
  const [title, setTitle] = useState('');
  const [mode, setMode] = useState<'instant' | 'scheduled'>('instant');
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');

  useEffect(() => {
    if (isCreated) {
      setCurrentSubView('create');
    }
  }, [isCreated]);

  const handleJoinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onJoin(meetingId, passcode);
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onCreate(title, mode, scheduledDate, scheduledTime);
  };

  return (
    <div className="max-w-4xl mx-auto py-4">
      {/* Breadcrumb Navigation Bar */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
        <div className="flex flex-wrap items-center gap-2 text-xs font-bold text-slate-500">
          <button 
            type="button" 
            onClick={() => navigate('/dashboard')} 
            className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-slate-600 hover:bg-white hover:text-blue-600 transition"
          >
            <Home size={14} /> Main Dashboard
          </button>
          <span>/</span>
          <button
            type="button"
            onClick={() => setCurrentSubView(null)}
            className="rounded-lg px-2 py-1 text-slate-600 hover:bg-white hover:text-blue-600 transition"
          >
            Meeting Hub
          </button>
          {currentSubView && (
            <>
              <span>/</span>
              <span className="rounded-lg px-2 py-1 text-blue-600 uppercase tracking-wide">
                {currentSubView === 'join' ? 'Join Meeting' :
                 currentSubView === 'create' ? 'Host Session' :
                 'Sprint History'}
              </span>
            </>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setCurrentSubView('join')}
            className={`rounded-lg px-3 py-1.5 text-[11px] font-black transition ${
              currentSubView === 'join' 
                ? 'bg-blue-600 text-white shadow-sm' 
                : 'bg-white text-slate-500 hover:text-blue-600 border border-slate-200'
            }`}
          >
            Join Meeting
          </button>
          <button
            type="button"
            onClick={() => setCurrentSubView('create')}
            className={`rounded-lg px-3 py-1.5 text-[11px] font-black transition ${
              currentSubView === 'create' 
                ? 'bg-blue-600 text-white shadow-sm' 
                : 'bg-white text-slate-500 hover:text-blue-600 border border-slate-200'
            }`}
          >
            Host Session
          </button>
          <button
            type="button"
            onClick={() => setCurrentSubView('history')}
            className={`rounded-lg px-3 py-1.5 text-[11px] font-black transition ${
              currentSubView === 'history' 
                ? 'bg-blue-600 text-white shadow-sm' 
                : 'bg-white text-slate-500 hover:text-blue-600 border border-slate-200'
            }`}
          >
            Sprint History
          </button>
        </div>
      </div>

      {currentSubView === null ? (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-2xl font-black text-slate-900">Agile Meeting Hub</h3>
              <p className="text-sm font-medium text-slate-400">
                Synchronize your team with AI-driven real-time transcription and automatic user story extraction.
              </p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <button
              type="button"
              onClick={() => setCurrentSubView('join')}
              className="group flex h-full min-h-32 items-start justify-between gap-4 rounded-xl border border-slate-200 bg-white p-5 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md"
            >
              <div className="flex gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600 transition-colors group-hover:bg-blue-600 group-hover:text-white">
                  <Globe size={20} />
                </div>
                <div>
                  <h4 className="text-sm font-black text-slate-900">Join Meeting</h4>
                  <p className="mt-2 text-xs font-medium leading-5 text-slate-500">
                    Join an existing live meeting using an ID and passcode.
                  </p>
                </div>
              </div>
              <ArrowRight size={16} className="mt-1 shrink-0 text-slate-300 transition-transform group-hover:translate-x-1 group-hover:text-blue-500" />
            </button>

            <button
              type="button"
              onClick={() => setCurrentSubView('create')}
              className="group flex h-full min-h-32 items-start justify-between gap-4 rounded-xl border border-slate-200 bg-white p-5 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-md"
            >
              <div className="flex gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 transition-colors group-hover:bg-indigo-600 group-hover:text-white">
                  <Users size={20} />
                </div>
                <div>
                  <h4 className="text-sm font-black text-slate-900">Host Session</h4>
                  <p className="mt-2 text-xs font-medium leading-5 text-slate-500">
                    Host a new transcription workspace or schedule a future meeting.
                  </p>
                </div>
              </div>
              <ArrowRight size={16} className="mt-1 shrink-0 text-slate-300 transition-transform group-hover:translate-x-1 group-hover:text-indigo-500" />
            </button>

            <button
              type="button"
              onClick={() => setCurrentSubView('history')}
              className="group flex h-full min-h-32 items-start justify-between gap-4 rounded-xl border border-slate-200 bg-white p-5 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-md"
            >
              <div className="flex gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 transition-colors group-hover:bg-emerald-600 group-hover:text-white">
                  <History size={20} />
                </div>
                <div>
                  <h4 className="text-sm font-black text-slate-900">Sprint History</h4>
                  <p className="mt-2 text-xs font-medium leading-5 text-slate-500">
                    Explore past meetings, transcript records, and generated user stories.
                  </p>
                </div>
              </div>
              <ArrowRight size={16} className="mt-1 shrink-0 text-slate-300 transition-transform group-hover:translate-x-1 group-hover:text-emerald-500" />
            </button>
          </div>
        </div>
      ) : currentSubView === 'history' ? (
        <IterationHistoryView />
      ) : currentSubView === 'join' ? (
        <div className="max-w-md mx-auto space-y-4">
          <div className="mb-2">
            <h4 className="text-lg font-bold text-slate-950">Join Existing Meeting</h4>
            <p className="text-xs text-slate-400">Connect to a live voice transcription session.</p>
          </div>
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
        <div className="max-w-md mx-auto space-y-4">
          <div className="mb-2">
            <h4 className="text-lg font-bold text-slate-950">Host Session</h4>
            <p className="text-xs text-slate-400">Initialize a live voice transcription or schedule a session.</p>
          </div>
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
            <form onSubmit={handleCreateSubmit} className="space-y-5">
              <div className="space-y-1.5">
                <label className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Meeting Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Sprint Planning"
                  required
                  className="w-full bg-slate-50 border border-slate-100 rounded-lg py-2.5 px-3 outline-none focus:bg-white focus:border-blue-500 transition-all font-bold text-xs text-slate-900"
                />
              </div>
              
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
        </div>
      )}
    </div>
  );
};
