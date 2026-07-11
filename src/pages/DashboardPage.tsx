import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Settings, LogOut, Users,
  Code, Sparkles, FileText, ClipboardCheck, ChevronLeft, ArrowRight,
  Layout, Search, Bell, Shield, User, FlaskConical, ClipboardList
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMeetingStore } from '../store/useMeetingStore';
import { meetingApi } from '../api/meetingApi';
import { ProfileForm } from '../components/auth/ProfileForm';
import { FileStoryGenerator } from '../components/rag/FileStoryGenerator';
import { PlaceholderView } from '../components/dashboard/PlaceholderView';
import { OverviewView } from '../components/dashboard/OverviewView';
import { MeetingHubView } from '../components/dashboard/MeetingHubView';
import FailureAnalysisSubmitPage from './FailureAnalysisSubmitPage';
import RepairHistoryPage from './RepairHistoryPage';

type ViewType = 'menu' | 'meeting' | 'file-rag' | 'test-case' | 'test-script' | 'self-healing' | 'rtm';
type SelfHealingView = 'submit' | 'history';

export const DashboardPage: React.FC = () => {
  const { user, setUser, logout, currentProject } = useMeetingStore();
  const navigate = useNavigate();
  
  const [currentView, setCurrentView] = useState<ViewType>('menu');
  const [selfHealingView, setSelfHealingView] = useState<SelfHealingView>('submit');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [isCreated, setIsCreated] = useState(false);
  const [inviteDetails, setInviteDetails] = useState<{ id: string, passcode: string, link: string } | null>(null);
  const [isCopied, setIsCopied] = useState(false);

  if (!user || !currentProject) {
    navigate(!user ? '/login' : '/projects');
    return null;
  }

  const handleJoin = async (meetingId: string, passcode: string) => {
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

  const handleCreate = async (title: string, mode: 'instant' | 'scheduled', date?: string, time?: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const scheduledAt = mode === 'scheduled' ? `${date}T${time}` : undefined;
      const data = await meetingApi.createMeeting(title || (user.name + "'s Meeting"), mode, scheduledAt);
      setInviteDetails({ id: data.meeting_id, passcode: data.passcode, link: data.invite_link });
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

  const navItems = [
    { id: 'meeting', label: 'Agile Meeting Hub', icon: <Users size={18} />, color: 'blue' },
    { id: 'file-rag', label: 'File to User Story', icon: <FileText size={18} />, color: 'purple' },
    { id: 'test-case', label: 'Test Case Gen', icon: <ClipboardCheck size={18} />, color: 'indigo' },
    { id: 'test-script', label: 'Test Script Gen', icon: <Code size={18} />, color: 'emerald' },
    { id: 'self-healing', label: 'Self Healing', icon: <Sparkles size={18} />, color: 'rose' },
    { id: 'rtm', label: 'Generate RTM', icon: <Shield size={18} />, color: 'amber' },
  ];

  return (
    <div className="flex h-screen bg-[#F8FAFC] overflow-hidden font-sans selection:bg-blue-100">
      
      <aside className={`bg-white border-r border-slate-200 flex flex-col z-30 shadow-sm transition-all duration-300 ease-in-out ${isSidebarCollapsed ? 'w-20' : 'w-72'}`}>
        <div className="p-6 border-b border-slate-100 flex flex-col gap-6">
          <div className="flex items-center justify-between">
            {!isSidebarCollapsed && (
              <motion.div 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center gap-3"
              >
                <div className="w-10 h-10 flex items-center justify-center shrink-0">
                  <img src="/images/logo.png" alt="NextGenQA Logo" className="w-full h-full object-contain" />
                </div>
                <div className="overflow-hidden">
                  <h1 className="text-sm font-black text-slate-900 uppercase tracking-tighter">NextGenQA</h1>
                  <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Enterprise Hub</p>
                </div>
              </motion.div>
            )}
            {isSidebarCollapsed && (
              <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-200 shrink-0">
                <Layout size={20} />
              </div>
            )}
            <button 
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              className="p-2 rounded-lg hover:bg-slate-50 text-slate-400 hover:text-slate-900 transition-colors"
            >
              <ChevronLeft className={`transition-transform duration-300 ${isSidebarCollapsed ? 'rotate-180' : ''}`} size={18} />
            </button>
          </div>
          
          <button 
            onClick={() => navigate('/projects')}
            className={`rounded-xl bg-slate-50 border border-slate-100 flex items-center transition-all group overflow-hidden ${isSidebarCollapsed ? 'p-3 justify-center' : 'p-3 justify-between'}`}
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse shrink-0" />
              {!isSidebarCollapsed && <span className="text-xs font-bold text-slate-700 truncate">Change Project</span>}
            </div>
            {!isSidebarCollapsed && <ArrowRight size={14} className="text-slate-400 group-hover:translate-x-1 transition-transform" />}
          </button>
        </div>

        <div className="flex-1 overflow-y-auto py-6 px-4 space-y-1 custom-scrollbar">
          {!isSidebarCollapsed && <p className="px-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Core Modules</p>}
          
          <button
            onClick={() => { setCurrentView('menu'); setIsEditingProfile(false); }}
            className={`w-full flex items-center gap-3 rounded-xl text-sm font-bold transition-all ${isSidebarCollapsed ? 'p-3 justify-center' : 'px-4 py-3'} ${currentView === 'menu' ? 'bg-blue-600 text-white shadow-md shadow-blue-200' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'}`}
          >
            <Layout size={18} /> {!isSidebarCollapsed && 'Overview'}
          </button>

          <div className="pt-4 space-y-1">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => { setCurrentView(item.id as ViewType); setIsEditingProfile(false); }}
                className={`w-full flex items-center gap-3 rounded-xl text-sm font-bold transition-all group ${isSidebarCollapsed ? 'p-3 justify-center' : 'px-4 py-3'} ${
                  currentView === item.id 
                    ? `bg-${item.color}-50 text-${item.color}-600 border border-${item.color}-100` 
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <div className={`p-1.5 rounded-lg transition-colors shrink-0 ${
                  currentView === item.id ? `bg-${item.color}-100` : 'bg-slate-100 group-hover:bg-white'
                }`}>
                  {item.icon}
                </div>
                {!isSidebarCollapsed && item.label}
              </button>
            ))}
          </div>
        </div>

        <div className={`border-t border-slate-100 bg-slate-50/50 transition-all ${isSidebarCollapsed ? 'p-4' : 'p-6'}`}>
          {!isSidebarCollapsed && (
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-400">
                <User size={20} />
              </div>
              <div className="overflow-hidden">
                <p className="text-xs font-black text-slate-900 truncate">{user.name}</p>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter truncate">{user.agileRole}</p>
              </div>
            </div>
          )}
          <div className={`grid gap-2 ${isSidebarCollapsed ? 'grid-cols-1' : 'grid-cols-2'}`}>
            <button 
              onClick={() => setIsEditingProfile(true)}
              className="p-2 rounded-lg border border-slate-200 bg-white text-slate-400 hover:text-blue-600 hover:border-blue-100 flex items-center justify-center transition-all"
            >
              <Settings size={16} />
            </button>
            <button 
              onClick={logout}
              className="p-2 rounded-lg border border-slate-200 bg-white text-slate-400 hover:text-rose-600 hover:border-rose-100 flex items-center justify-center transition-all"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-w-0 bg-white">
        <header className="h-20 border-b border-slate-100 flex items-center justify-between px-8 shrink-0">
          <div className="flex items-center gap-4">
            <h2 className="text-lg font-black text-slate-900 tracking-tight">
              {currentView === 'menu' ? 'Dashboard Overview' : navItems.find(n => n.id === currentView)?.label}
            </h2>
            <div className="h-4 w-px bg-slate-200" />
            <div className="flex items-center gap-2 px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-black uppercase tracking-widest">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Live Cluster
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="relative hidden lg:block">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                type="text" 
                placeholder="Search workspace..."
                className="bg-slate-50 border border-slate-100 rounded-xl py-2 pl-10 pr-4 text-xs font-medium outline-none focus:bg-white focus:border-blue-200 transition-all w-64"
              />
            </div>
            <button className="p-2.5 text-slate-400 hover:text-slate-900 transition-colors relative">
              <Bell size={20} />
              <div className="absolute top-2 right-2 w-2 h-2 bg-blue-500 border-2 border-white rounded-full" />
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          <AnimatePresence mode="wait">
            {isEditingProfile ? (
              <motion.div
                key="profile"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="max-w-2xl"
              >
                <div className="mb-8">
                  <h3 className="text-2xl font-black text-slate-900 mb-2">Workspace Identity</h3>
                  <p className="text-sm text-slate-400 font-medium">Manage your professional persona across NextGenQA projects.</p>
                </div>
                <ProfileForm />
              </motion.div>
            ) : currentView === 'menu' ? (
              <OverviewView 
                userName={user.name}
                projectName={currentProject.name}
                agileRole={user.agileRole}
                navItems={navItems}
                onModuleSelect={setCurrentView}
              />
            ) : (
              <motion.div
                key="view"
                initial={{ opacity: 0, scale: 0.99 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.99 }}
                className="h-full"
              >
                {currentView === 'meeting' && (
                  <MeetingHubView 
                    onJoin={handleJoin}
                    onCreate={handleCreate}
                    isLoading={isLoading}
                    error={error}
                    isCreated={isCreated}
                    inviteDetails={inviteDetails}
                    onLaunch={() => { 
                      if (inviteDetails) {
                        setUser({ ...user, meetingId: inviteDetails.id }); 
                        navigate(`/meeting/${inviteDetails.id}`); 
                      }
                    }}
                    onCopy={copyToClipboard}
                  />
                )}

                  {currentView === 'file-rag' && (
                    <FileStoryGenerator />
                  )}
                  {currentView === 'self-healing' && (
                    <div className="space-y-6 self-healing-surface">
                      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
                        <div>
                          <h3 className="text-2xl font-black text-slate-900">Self Healing</h3>
                          <p className="text-sm font-medium text-slate-400">
                            Analyze CI/CD failures and review controlled repair actions for this workspace.
                          </p>
                        </div>
                        <div className="flex rounded-xl border border-slate-200 bg-slate-50 p-1">
                          <button
                            type="button"
                            onClick={() => setSelfHealingView('submit')}
                            className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-bold transition-all ${selfHealingView === 'submit' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
                          >
                            <FlaskConical size={15} />
                            Failure Analysis Submit
                          </button>
                          <button
                            type="button"
                            onClick={() => setSelfHealingView('history')}
                            className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-bold transition-all ${selfHealingView === 'history' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
                          >
                            <ClipboardList size={15} />
                            Repair History
                          </button>
                        </div>
                      </div>

                      {selfHealingView === 'submit' ? <FailureAnalysisSubmitPage /> : <RepairHistoryPage />}
                    </div>
                  )}
                  {(currentView === 'test-case' || currentView === 'test-script' || currentView === 'rtm') && (
                    <PlaceholderView 
                      title={navItems.find(n => n.id === currentView)?.label ?? 'Module'} 
                      description={`Advanced AI module for ${navItems.find(n => n.id === currentView)?.label.toLowerCase() ?? 'this feature'}. Seamlessly integrated into the ${currentProject?.name ?? 'workspace'} context.`}
                      icon={navItems.find(n => n.id === currentView)?.icon ?? <Sparkles />}
                      color={navItems.find(n => n.id === currentView)?.color ?? 'blue'}
                    />
                  )}
                </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
};


