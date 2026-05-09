import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Settings, LogOut, Plus, Users, Copy, Check, Calendar, Globe, Sparkles, FileText, ClipboardCheck, Code, ChevronLeft, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMeetingStore } from '../store/useMeetingStore';
import { meetingApi } from '../api/meetingApi';
import { ProfileForm } from '../components/auth/ProfileForm';
import { AuthPromo } from '../components/auth/AuthPromo';
import { FileStoryGenerator } from '../components/rag/FileStoryGenerator';

const PROMO_IMAGE_JOIN = "/images/meeting_promo_light_1775519945157.png";
const PROMO_IMAGE_CREATE = "/images/ai_transcription_promo_1775519960749.png";

type ViewType = 'menu' | 'meeting' | 'file-rag' | 'test-case' | 'test-script';

export const DashboardPage: React.FC = () => {
  const { user, setUser, logout, currentProject } = useMeetingStore();
  const navigate = useNavigate();
  
  const [currentView, setCurrentView] = useState<ViewType>('menu');
  const [activeTab, setActiveTab] = useState<'join' | 'create'>('join');
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Meeting Join/Host state
  const [meetingId, setMeetingId] = useState('');
  const [passcode, setPasscode] = useState('');
  const [mode, setMode] = useState<'instant' | 'scheduled'>('instant');
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');

  const [isCreated, setIsCreated] = useState(false);
  const [inviteDetails, setInviteDetails] = useState<{ id: string, passcode: string, link: string } | null>(null);
  const [isCopied, setIsCopied] = useState(false);

  if (!user) {
    navigate('/login');
    return null;
  }

  if (!currentProject) {
    navigate('/projects');
    return null;
  }

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      const data = await meetingApi.joinMeeting(meetingId, passcode);
      setUser({ ...user, meetingId: data.meeting_id });
      navigate(`/meeting/${data.meeting_id}`);
    } catch (err: any) {
      setError(err.message || 'Failed to join meeting');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      const scheduledAt = mode === 'scheduled' ? `${scheduledDate}T${scheduledTime}` : undefined;
      const data = await meetingApi.createMeeting(user.name + "'s Meeting", mode, scheduledAt);

      setInviteDetails({
        id: data.meeting_id,
        passcode: data.passcode,
        link: data.invite_link
      });
      setIsCreated(true);
    } catch (err: any) {
      setError(err.message || 'Failed to create meeting');
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (!inviteDetails) return;
    navigator.clipboard.writeText(`Meeting ID: ${inviteDetails.id}\nPasscode: ${inviteDetails.passcode}\nLink: ${inviteDetails.link}`);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div className="w-full min-h-screen flex flex-col md:flex-row bg-white selection:bg-blue-100 font-sans overflow-x-hidden">

      {/* Visual Column (Left) */}
      {currentView !== 'file-rag' && (
        <AuthPromo
          activeTab={activeTab}
          joinImage={PROMO_IMAGE_JOIN}
          createImage={PROMO_IMAGE_CREATE}
          className="order-1"
        />
      )}

      {/* Interactive Column (Right) */}
      <div className="flex-1 flex flex-col justify-center bg-white order-2 relative">
        <div className={`${currentView === 'file-rag' ? 'max-w-5xl' : 'max-w-xl lg:max-w-[600px]'} w-full mx-auto px-4 py-8 sm:px-12 sm:py-16 flex flex-col min-h-full transition-all duration-500`}>

          <div className="space-y-10">
            {/* Header Branding */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-black text-gray-900 uppercase tracking-[0.2em]">Workspace Dashboard</h2>
                <p className="text-xs text-gray-400 mt-1">Project: <span className="text-blue-600 font-black">{currentProject?.name}</span> • Authenticated as <span className="text-blue-600 font-bold">{user.name}</span></p>
              </div>
              <div className="flex items-center gap-6">
                <div className="flex gap-4">
                  <button
                    onClick={() => navigate('/projects')}
                    className="text-[10px] font-black text-gray-400 hover:text-blue-500 uppercase tracking-widest transition-colors"
                  >
                    Change Project
                  </button>
                  <button
                    onClick={() => setIsEditingProfile(!isEditingProfile)}
                    className="text-[10px] font-black text-gray-400 hover:text-blue-500 uppercase tracking-widest transition-colors"
                  >
                    {isEditingProfile ? 'Back' : 'Settings'}
                  </button>
                  <button
                    onClick={() => logout()}
                    className="text-[10px] font-black text-gray-400 hover:text-red-500 uppercase tracking-widest transition-colors"
                  >
                    Logout
                  </button>
                </div>
              </div>
            </div>

            <AnimatePresence mode="wait">
              {isEditingProfile ? (
                <motion.div
                  key="profile"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-6"
                >
                  <div className="space-y-2">
                    <h2 className="text-3xl font-bold text-gray-900 tracking-tight">Professional Identity</h2>
                    <p className="text-gray-400 text-sm">Update your workspace persona and visibility settings.</p>
                  </div>
                  <ProfileForm />
                </motion.div>
              ) : currentView === 'menu' ? (
                <motion.div
                  key="menu"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="space-y-8"
                >
                  <div className="space-y-2">
                    <h2 className="text-3xl font-bold text-gray-900 tracking-tight">Welcome back, {user.name.split(' ')[0]}</h2>
                    <p className="text-gray-400 text-sm">Select an AI-powered module to begin your agile workflow.</p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <MenuCard
                      title="Agile Meeting Hub"
                      description="Host or join meetings with real-time story generation."
                      icon={<Users size={24} className="text-blue-600" />}
                      onClick={() => setCurrentView('meeting')}
                      color="blue"
                    />
                    <MenuCard
                      title="File to User Story"
                      description="Upload transcripts and extract structured agile stories."
                      icon={<FileText size={24} className="text-purple-600" />}
                      onClick={() => setCurrentView('file-rag')}
                      color="purple"
                    />
                    <MenuCard
                      title="Test Case Generator"
                      description="Generate comprehensive test cases from requirements."
                      icon={<ClipboardCheck size={24} className="text-blue-600" />}
                      onClick={() => setCurrentView('test-case')}
                      color="blue"
                    />
                    <MenuCard
                      title="Test Script Generator"
                      description="Convert stories into executable automation scripts."
                      icon={<Code size={24} className="text-emerald-600" />}
                      onClick={() => setCurrentView('test-script')}
                      color="emerald"
                    />
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="view"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-8"
                >
                  <button
                    onClick={() => { setCurrentView('menu'); setError(null); setIsCreated(false); }}
                    className="flex items-center gap-2 text-[10px] font-black text-gray-400 hover:text-gray-900 uppercase tracking-widest transition-colors mb-4"
                  >
                    <ChevronLeft size={14} /> Back to Menu
                  </button>

                  {currentView === 'meeting' && (
                    <div className="space-y-8">
                      {!isCreated && (
                        <div className="space-y-2">
                          <h2 className="text-3xl font-bold text-gray-900 tracking-tight">
                            {activeTab === 'join' ? 'Ready to Sync?' : 'Host a Session.'}
                          </h2>
                          <p className="text-gray-400 text-sm">
                            {activeTab === 'join'
                              ? 'Join an existing meeting using your unique ID and passcode.'
                              : 'Create a new AI-powered workspace for your agile team.'}
                          </p>
                        </div>
                      )}

                      {!isCreated && (
                        <div className="flex bg-gray-100 p-1 rounded-xl w-fit">
                          <button
                            onClick={() => { setActiveTab('join'); setError(null); }}
                            className={`px-8 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'join' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-400'}`}
                          >
                            Join
                          </button>
                          <button
                            onClick={() => { setActiveTab('create'); setError(null); }}
                            className={`px-8 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'create' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-400'}`}
                          >
                            Host
                          </button>
                        </div>
                      )}

                      {error && (
                        <div className="p-4 rounded-xl bg-red-50 border border-red-100 text-red-600 text-xs font-bold uppercase tracking-wider flex items-center gap-3">
                          <LogOut className="rotate-180" size={16} /> {error}
                        </div>
                      )}

                      {activeTab === 'join' ? (
                        <form onSubmit={handleJoin} className="space-y-4">
                          <div className="space-y-4">
                            <div className="space-y-1.5">
                              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Meeting ID</label>
                              <input
                                type="text"
                                value={meetingId}
                                onChange={(e) => setMeetingId(e.target.value.toUpperCase())}
                                placeholder="ABC-DEF-GHI"
                                className="w-full bg-gray-50 border border-transparent rounded-xl py-3.5 px-4 outline-none focus:bg-white focus:border-blue-500 transition-all font-mono text-sm tracking-widest"
                              />
                            </div>
                            <div className="space-y-1.5">
                              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Passcode</label>
                              <input
                                type="password"
                                value={passcode}
                                onChange={(e) => setPasscode(e.target.value)}
                                placeholder="••••••"
                                className="w-full bg-gray-50 border border-transparent rounded-xl py-3.5 px-4 outline-none focus:bg-white focus:border-blue-500 transition-all font-mono text-sm tracking-widest"
                              />
                            </div>
                          </div>
                          <button
                            type="submit"
                            disabled={isLoading || !meetingId || !passcode}
                            className="w-full py-4 rounded-xl font-bold text-sm bg-blue-600 text-white flex items-center justify-center gap-3 transition-all active:scale-[0.98] shadow-lg shadow-blue-500/10 disabled:opacity-40 mt-4"
                          >
                            {isLoading ? 'Connecting...' : <><Users size={18} /> Enter Session</>}
                          </button>
                        </form>
                      ) : isCreated && inviteDetails ? (
                        <div className="space-y-6 animate-in zoom-in-95 duration-500">
                          <div className="p-8 bg-blue-50 rounded-3xl border border-blue-100 space-y-4">
                            <h3 className="text-xl font-bold text-gray-900">Meeting Ready!</h3>
                            <div className="space-y-3">
                              <div className="bg-white p-4 rounded-xl border border-blue-100 flex justify-between items-center group cursor-pointer" onClick={copyToClipboard}>
                                <div>
                                  <p className="text-[10px] font-bold text-gray-400 uppercase">Meeting ID</p>
                                  <p className="text-lg font-black text-gray-900 tracking-widest font-mono">{inviteDetails.id}</p>
                                </div>
                                <div className="text-blue-500">
                                  {isCopied ? <Check size={18} /> : <Copy size={18} />}
                                </div>
                              </div>
                              <div className="bg-white p-4 rounded-xl border border-blue-100 flex justify-between items-center group cursor-pointer" onClick={copyToClipboard}>
                                <div>
                                  <p className="text-[10px] font-bold text-gray-400 uppercase">Passcode</p>
                                  <p className="text-lg font-black text-gray-900 tracking-widest font-mono">{inviteDetails.passcode}</p>
                                </div>
                                <div className="text-blue-500">
                                  {isCopied ? <Check size={18} /> : <Copy size={18} />}
                                </div>
                              </div>
                            </div>
                          </div>
                          <button
                            onClick={() => { setUser({ ...user, meetingId: inviteDetails.id }); navigate(`/meeting/${inviteDetails.id}`); }}
                            className="w-full py-4 rounded-xl font-bold text-sm bg-gray-900 text-white flex items-center justify-center gap-3 transition-all active:scale-[0.98]"
                          >
                            Start Workspace
                          </button>
                        </div>
                      ) : (
                        <form onSubmit={handleCreate} className="space-y-6">
                          <div className="flex bg-gray-100 p-1 rounded-xl w-fit">
                            <button type="button" onClick={() => setMode('instant')} className={`px-4 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all ${mode === 'instant' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`}>Instant</button>
                            <button type="button" onClick={() => setMode('scheduled')} className={`px-4 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all ${mode === 'scheduled' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`}>Scheduled</button>
                          </div>

                          {mode === 'scheduled' && (
                            <div className="grid grid-cols-2 gap-4 animate-in slide-in-from-top-2 duration-300">
                              <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-gray-400 uppercase ml-1 tracking-widest">Date</label>
                                <input type="date" value={scheduledDate} onChange={(e) => setScheduledDate(e.target.value)} className="w-full bg-gray-50 border border-transparent rounded-xl py-3 px-4 outline-none focus:bg-white focus:border-blue-500 text-sm font-medium" />
                              </div>
                              <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-gray-400 uppercase ml-1 tracking-widest">Time</label>
                                <input type="time" value={scheduledTime} onChange={(e) => setScheduledTime(e.target.value)} className="w-full bg-gray-50 border border-transparent rounded-xl py-3 px-4 outline-none focus:bg-white focus:border-blue-500 text-sm font-medium" />
                              </div>
                            </div>
                          )}

                          <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full py-4 rounded-xl font-bold text-sm bg-blue-600 text-white flex items-center justify-center gap-3 transition-all active:scale-[0.98] shadow-lg shadow-blue-500/10 disabled:opacity-40"
                          >
                            {isLoading ? 'Allocating...' : <><Calendar size={18} /> Provision Workspace</>}
                          </button>
                        </form>
                      )}
                    </div>
                  )}

                  {currentView === 'file-rag' && (
                    <FileStoryGenerator />
                  )}

                  {currentView === 'test-case' && (
                    <PlaceholderView 
                      title="Test Case Generator" 
                      description="Analyze requirements or generated stories to automatically produce detailed test cases, edge cases, and validation steps."
                      icon={<ClipboardCheck size={48} className="text-blue-500" />}
                    />
                  )}

                  {currentView === 'test-script' && (
                    <PlaceholderView 
                      title="Test Script Generator" 
                      description="Convert your user stories and test cases into executable automation scripts instantly."
                      icon={<Code size={48} className="text-emerald-500" />}
                    />
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Footer Credits */}
          <div className="mt-auto pt-10 flex items-center justify-between text-[10px] font-bold text-gray-300 uppercase tracking-widest">
            <div className="flex gap-4">
              <span className="text-blue-500 flex items-center gap-1.5"><Globe size={12} /> Live Cluster</span>
              <a href="#" className="hover:text-gray-600 transition-colors">Documentation</a>
            </div>
            <span className="opacity-40">System Secure</span>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- Helper Components ---

const MenuCard = ({ title, description, icon, onClick, color }: any) => {
  const colors: any = {
    blue: 'hover:border-blue-200 hover:bg-blue-50/30',
    purple: 'hover:border-purple-200 hover:bg-purple-50/30',
    blue: 'hover:border-blue-200 hover:bg-blue-50/30',
    emerald: 'hover:border-emerald-200 hover:bg-emerald-50/30'
  };

  return (
    <button
      onClick={onClick}
      className={`p-6 rounded-2xl border border-gray-100 bg-white text-left transition-all duration-300 group shadow-sm ${colors[color]}`}
    >
      <div className="w-12 h-12 rounded-xl bg-gray-50 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
        {icon}
      </div>
      <h3 className="text-sm font-black text-gray-900 mb-1 flex items-center justify-between">
        {title}
        <ArrowRight size={14} className="opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
      </h3>
      <p className="text-[11px] text-gray-400 font-medium leading-relaxed">{description}</p>
    </button>
  );
};

const PlaceholderView = ({ title, description, icon }: any) => (
  <div className="flex flex-col items-center justify-center py-12 text-center space-y-6 animate-in fade-in zoom-in-95 duration-500">
    <div className="w-24 h-24 rounded-3xl bg-gray-50 flex items-center justify-center shadow-inner">
      {icon}
    </div>
    <div className="space-y-2">
      <h3 className="text-2xl font-bold text-gray-900">{title}</h3>
      <p className="text-gray-400 text-sm max-w-sm mx-auto font-medium">{description}</p>
    </div>
    <div className="p-4 rounded-xl bg-amber-50 border border-amber-100 text-amber-700 text-[10px] font-black uppercase tracking-widest">
      Feature Coming Soon in Next Phase
    </div>
  </div>
);
