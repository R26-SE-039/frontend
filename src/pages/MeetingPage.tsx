import React, { useEffect } from 'react';
import { 
  Settings, Users, MessageSquare, Shield, Activity, LayoutGrid, Radio, Sparkles, Download
} from 'lucide-react';

import { useMeetingStore } from '../store/useMeetingStore';
import { useSpeechSocket } from '../hooks/useSpeechSocket';

// Internal Components
import { MeetingHeader } from '../components/meeting/MeetingHeader';
import { ParticipantGrid } from '../components/meeting/ParticipantGrid';
import { TranscriptSidebar } from '../components/meeting/TranscriptSidebar';
import { ControlBar } from '../components/meeting/ControlBar';
import { ChatPanel } from '../components/meeting/ChatPanel';
import { IntelligencePanel } from '../components/meeting/IntelligencePanel';
import { ProfileForm } from '../components/auth/ProfileForm';
import { EndOfMeetingSummary } from '../components/meeting/EndOfMeetingSummary';

export const MeetingPage: React.FC = () => {
   const [activePanel, setActivePanel] = React.useState<'transcript' | 'participants' | 'chat' | 'security' | 'settings' | 'intelligence' | null>('transcript');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
  const [isMeetingEnded, setIsMeetingEnded] = React.useState(false);
  
  const { 
    isMuted, toggleMic,
    isVideoOff, toggleVideo,
    gridDensity, setGridDensity,
    micVolume, setMicVolume,
    speakerVolume, setSpeakerVolume,
    theme, setTheme,
    participants,
    transcript, clearTranscript,
    chatMessages, clearChat,
    user, logout
  } = useMeetingStore();

  const { isConnected, isMicActive, toggleMic: toggleHardwareMic, acousticFeatures, sendChat } = useSpeechSocket();

  // Sync Global State with Hardware State
  useEffect(() => {
    const shouldBeActive = !isMuted;
    if (shouldBeActive !== isMicActive) {
      toggleHardwareMic();
    }
  }, [isMuted, isMicActive, toggleHardwareMic]);

  // Meeting Timer Logic
  const [sessionTime, setSessionTime] = React.useState(0);
  useEffect(() => {
    const timer = setInterval(() => setSessionTime(prev => prev + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs > 0 ? hrs.toString().padStart(2, '0') + ':' : ''}${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex h-screen bg-[#F4F7FB] text-gray-800 font-sans selection:bg-blue-100 overflow-hidden relative">
      
      {/* ─── Sidebar Navigation (Desktop) ─── */}
      <div className="hidden sm:flex w-16 sm:w-20 bg-white border-r border-gray-200 flex-col items-center py-6 gap-8 z-20 shadow-sm">
        <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/20 mb-2">
            <Radio size={24} className="text-white" />
        </div>
        
        <div className="flex flex-col gap-5 flex-grow">
          <button 
            onClick={() => setActivePanel(activePanel === 'transcript' ? null : 'transcript')}
            className={`p-3 rounded-xl transition-all ${activePanel === 'transcript' ? 'bg-blue-50 text-blue-600' : 'text-gray-400 hover:bg-gray-50'}`}
          >
            <LayoutGrid size={22} />
          </button>
          <button 
            onClick={() => setActivePanel(activePanel === 'participants' ? null : 'participants')}
            className={`p-3 rounded-xl transition-all ${activePanel === 'participants' ? 'bg-blue-50 text-blue-600' : 'text-gray-400 hover:bg-gray-50'}`}
          >
            <Users size={22} />
          </button>
          <button 
            onClick={() => setActivePanel(activePanel === 'chat' ? null : 'chat')}
            className={`p-3 rounded-xl transition-all ${activePanel === 'chat' ? 'bg-blue-50 text-blue-600' : 'text-gray-400 hover:bg-gray-50'}`}
          >
            <MessageSquare size={22} />
          </button>
          <button 
            onClick={() => setActivePanel(activePanel === 'intelligence' ? null : 'intelligence')}
            className={`p-3 rounded-xl transition-all ${activePanel === 'intelligence' ? 'bg-indigo-50 text-indigo-600' : 'text-gray-400 hover:bg-gray-50'}`}
          >
            <Sparkles size={22} />
          </button>
          <button 
            onClick={() => setActivePanel(activePanel === 'security' ? null : 'security')}
            className={`p-3 rounded-xl transition-all ${activePanel === 'security' ? 'bg-blue-50 text-blue-600' : 'text-gray-400 hover:bg-gray-50'}`}
          >
            <Shield size={22} />
          </button>
        </div>

        <button 
          onClick={() => setActivePanel(activePanel === 'settings' ? null : 'settings')}
          className={`p-3 rounded-xl transition-all ${activePanel === 'settings' ? 'bg-blue-50 text-blue-600' : 'text-gray-400 hover:bg-gray-100'}`}
        >
          <Settings size={22} />
        </button>
      </div>

      {/* ─── Main Content ─── */}
      <div className="flex-grow flex flex-col min-w-0 relative h-full">
        <MeetingHeader 
            userName={user?.name}
            meetingId={user?.meetingId}
            isConnected={isConnected}
            duration={formatTime(sessionTime)}
        />

        <main className="flex-grow flex flex-col lg:flex-row p-4 sm:p-6 gap-6 overflow-hidden relative">
          
          {/* Central Stage: Participants & Topic */}
          <div className="flex-grow flex flex-col gap-4 min-w-0 overflow-hidden">
            <ParticipantGrid 
                user={user}
                participants={participants}
                isMuted={isMuted}
                gridDensity={gridDensity}
            />
            
            {/* Conflict Detection (Context Bar) */}
            <div className="h-14 sm:h-16 bg-white border border-gray-100 rounded-2xl px-4 flex items-center justify-between shadow-sm flex-shrink-0 overflow-x-auto no-scrollbar">
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100 text-[10px] sm:text-xs font-bold whitespace-nowrap">
                        <Shield size={14} /> Conflict Detection: <span className="text-gray-900 ml-1 italic font-medium">No conflict detect yet</span>
                    </div>
                </div>
                <div className="hidden xs:flex items-center gap-4 text-gray-400">
                    <button className="flex items-center gap-2 text-xs font-semibold hover:text-blue-600 transition-colors whitespace-nowrap"><Download size={16} /> Save Brief</button>
                    <div className="w-px h-6 bg-gray-100" />
                    <button className="flex items-center gap-2 text-xs font-semibold hover:text-blue-600 transition-colors whitespace-nowrap"><Download size={16} /> Export Logs</button>
                </div>
            </div>
          </div>

          {/* Right Panel: Conditional Rendering */}
          <div className={`fixed inset-y-0 right-0 z-40 w-full sm:w-96 lg:relative lg:inset-auto lg:z-0 lg:w-80 xl:w-96 transition-transform duration-300 transform ${activePanel === 'transcript' ? 'translate-x-0' : 'translate-x-full lg:hidden hidden lg:block'}`}>
             <div className="h-full bg-white lg:bg-transparent lg:border-none shadow-2xl lg:shadow-none">
                {activePanel === 'transcript' && (
                   <TranscriptSidebar 
                       transcript={transcript}
                       clearTranscript={clearTranscript}
                       acousticFeatures={acousticFeatures}
                       onClose={() => setActivePanel(null)}
                   />
                )}
             </div>
          </div>

          {/* New Interactive Panels (Dummy Implementations) */}
          {activePanel === 'participants' && (
            <div className="fixed inset-y-0 right-0 w-full sm:w-96 bg-white shadow-2xl z-50 p-4 sm:p-6 flex flex-col border-l border-gray-100 animate-in slide-in-from-right duration-300">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-lg font-bold text-gray-900">Participants <span className="ml-2 px-2 py-0.5 bg-blue-50 text-blue-600 rounded-lg text-xs">{participants.length}</span></h2>
                <button onClick={() => setActivePanel('transcript')} className="p-2 hover:bg-gray-100 rounded-lg text-gray-400 transition-colors"><LayoutGrid size={20} /></button>
              </div>
              <div className="space-y-2 overflow-y-auto pr-2 custom-scrollbar">
                {participants.map(p => (
                  <div key={p.id} className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 transition-all group">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-blue-100 overflow-hidden border-2 border-white">
                        <img src={p.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${p.name}`} alt={p.name} />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-gray-900">{p.name}{p.id === 'me' && ' (You)'}</p>
                        <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">{p.id === '1' ? 'AI Coordinator' : 'Member'}</p>
                      </div>
                    </div>
                    <button className="opacity-0 group-hover:opacity-100 p-2 text-gray-400 hover:text-red-500 transition-all"><Settings size={16} /></button>
                  </div>
                ))}
              </div>
              <button className="mt-auto w-full py-4 bg-gray-50 text-gray-600 text-xs font-bold rounded-2xl hover:bg-gray-100 transition-all uppercase tracking-widest">+ Invite People</button>
            </div>
          )}

          {activePanel === 'chat' && (
            <ChatPanel
              chatMessages={chatMessages}
              sendChat={sendChat}
              clearChat={clearChat}
              onClose={() => setActivePanel('transcript')}
              participantCount={participants.length}
            />
          )}
          
          {activePanel === 'intelligence' && (
            <IntelligencePanel
              meetingId={user?.meetingId || ''}
              onClose={() => setActivePanel('transcript')}
            />
          )}

          {activePanel === 'security' && (
             <div className="fixed inset-y-0 right-0 w-full sm:w-96 bg-white shadow-2xl z-50 p-6 flex flex-col border-l border-gray-100">
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-lg font-bold text-gray-900">Security</h2>
                  <button onClick={() => setActivePanel('transcript')} className="p-2 hover:bg-gray-100 rounded-lg text-gray-400 transition-colors"><LayoutGrid size={20} /></button>
                </div>
                <div className="space-y-4">
                  <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-100">
                    <div className="flex items-center gap-3 mb-2">
                      <Shield size={18} className="text-emerald-500" />
                      <span className="text-xs font-bold text-emerald-700 uppercase tracking-widest">End-to-End Encrypted</span>
                    </div>
                    <p className="text-xs text-emerald-600">This session is secured with advanced AES-256 encryption.</p>
                  </div>
                  <div className="grid grid-cols-1 gap-3">
                    <button className="flex items-center justify-between p-4 rounded-xl border border-gray-100 bg-gray-50 hover:bg-red-50 hover:border-red-100 group transition-all">
                      <span className="text-sm font-bold text-gray-700 group-hover:text-red-600">Lock Meeting</span>
                      <Shield size={16} className="text-gray-400 group-hover:text-red-500" />
                    </button>
                    <button className="flex items-center justify-between p-4 rounded-xl border border-gray-100 bg-gray-50 hover:bg-blue-50 hover:border-blue-100 group transition-all">
                        <span className="text-sm font-bold text-gray-700 group-hover:text-blue-600">Waiting Room</span>
                        <div className="w-10 h-5 bg-blue-600 rounded-full relative"><div className="absolute right-1 top-1 w-3 h-3 bg-white rounded-full" /></div>
                    </button>
                  </div>
                </div>
             </div>
          )}

          {activePanel === 'settings' && (
             <div className="fixed inset-y-0 right-0 w-full sm:w-96 bg-white shadow-2xl z-50 p-6 flex flex-col border-l border-gray-100">
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-lg font-bold text-gray-900">Settings</h2>
                  <button onClick={() => setActivePanel('transcript')} className="p-2 hover:bg-gray-100 rounded-lg text-gray-400 transition-colors"><LayoutGrid size={20} /></button>
                </div>
                
                <div className="space-y-8 overflow-y-auto pr-2 custom-scrollbar">
                  <section>
                    <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4">Grid Layout</h3>
                    <div className="grid grid-cols-3 gap-2 bg-gray-50 p-1.5 rounded-2xl border border-gray-100">
                      {(['compact', 'standard', 'relaxed'] as const).map((d) => (
                        <button 
                          key={d}
                          onClick={() => setGridDensity(d)}
                          className={`py-2 text-[10px] font-bold uppercase rounded-xl transition-all ${gridDensity === d ? 'bg-white text-blue-600 shadow-sm border border-blue-50' : 'text-gray-400 hover:text-gray-600'}`}
                        >
                          {d}
                        </button>
                      ))}
                    </div>
                  </section>

                  <section className="pt-4 border-t border-gray-100">
                    <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4">User Profile</h3>
                    <ProfileForm />
                  </section>

                  <section className="space-y-6">
                    <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4">Audio Levels</h3>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <div className="flex justify-between text-[10px] font-bold text-gray-500 uppercase">
                          <span>Microphone Input</span>
                          <span className="text-blue-600">{micVolume}%</span>
                        </div>
                        <input 
                          type="range" value={micVolume} onChange={(e) => setMicVolume(parseInt(e.target.value))}
                          className="w-full h-1.5 bg-gray-100 rounded-full appearance-none cursor-pointer accent-blue-600"
                        />
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-[10px] font-bold text-gray-500 uppercase">
                          <span>Speaker Volume</span>
                          <span className="text-blue-600">{speakerVolume}%</span>
                        </div>
                        <input 
                          type="range" value={speakerVolume} onChange={(e) => setSpeakerVolume(parseInt(e.target.value))}
                          className="w-full h-1.5 bg-gray-100 rounded-full appearance-none cursor-pointer accent-blue-600"
                        />
                      </div>
                    </div>
                  </section>

                  <section>
                    <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4">Theme Style</h3>
                    <div className="grid grid-cols-2 gap-3">
                      {(['light', 'obsidian'] as const).map((t) => (
                        <button 
                          key={t}
                          onClick={() => setTheme(t)}
                          className={`flex items-center gap-3 p-3 rounded-2xl border transition-all ${theme === t ? 'bg-blue-50 border-blue-200 text-blue-900' : 'bg-gray-50 border-gray-100 text-gray-500 hover:bg-gray-100'}`}
                        >
                          <div className={`w-4 h-4 rounded-full ${t === 'light' ? 'bg-white border' : 'bg-gray-900 border-gray-700'}`} />
                          <span className="text-xs font-bold capitalize">{t}</span>
                        </button>
                      ))}
                    </div>
                  </section>
                </div>

                <div className="mt-auto pt-6 border-t border-gray-100">
                  <div className="bg-orange-50 border border-orange-100 p-4 rounded-2xl">
                    <p className="text-[10px] font-black text-orange-600 uppercase mb-1 tracking-widest">Experimental</p>
                    <p className="text-xs text-orange-800 leading-relaxed font-medium">Whisper Model: <span className="font-black">Turbo-v3 (Optimized)</span></p>
                  </div>
                </div>
             </div>
          )}
        </main>

        <ControlBar 
            isMuted={isMuted}
            toggleMic={toggleMic}
            isVideoOff={isVideoOff}
            toggleVideo={toggleVideo}
            logout={() => setIsMeetingEnded(true)}
        />

        {isMeetingEnded && (
          <EndOfMeetingSummary 
            meetingId={user?.meetingId || ''}
            duration={formatTime(sessionTime)}
            participantCount={participants.length}
            onExit={logout}
          />
        )}
        
        {/* Mobile Navbar Overlay (Conditional for Mobile) */}
        <div className="sm:hidden fixed bottom-24 left-4 right-4 bg-white/90 backdrop-blur-md rounded-2xl border border-white/20 p-2 shadow-2xl z-50 flex items-center justify-around">
            <button onClick={() => setActivePanel(activePanel === 'transcript' ? null : 'transcript')} className={`p-4 rounded-xl ${activePanel === 'transcript' ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-400'}`}><LayoutGrid size={20} /></button>
            <button onClick={() => setActivePanel(activePanel === 'participants' ? null : 'participants')} className={`p-4 rounded-xl ${activePanel === 'participants' ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-400'}`}><Users size={20} /></button>
            <button onClick={() => setActivePanel(activePanel === 'chat' ? null : 'chat')} className={`p-4 rounded-xl ${activePanel === 'chat' ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-400'}`}><MessageSquare size={20} /></button>
            <button onClick={() => setActivePanel(activePanel === 'intelligence' ? null : 'intelligence')} className={`p-4 rounded-xl ${activePanel === 'intelligence' ? 'bg-indigo-600 text-white shadow-lg' : 'text-gray-400'}`}><Sparkles size={20} /></button>
            <button onClick={() => setActivePanel(activePanel === 'security' ? null : 'security')} className={`p-4 rounded-xl ${activePanel === 'security' ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-400'}`}><Shield size={20} /></button>
            <button onClick={() => setActivePanel(activePanel === 'settings' ? null : 'settings')} className={`p-4 rounded-xl ${activePanel === 'settings' ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-400'}`}><Settings size={20} /></button>
        </div>
      </div>
    </div>
  );
};

export default MeetingPage;
