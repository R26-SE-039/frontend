import React, { useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Settings,
  LogOut,
  Users,
  Code,
  Sparkles,
  FileText,
  ClipboardCheck,
  ChevronLeft,
  ArrowRight,
  Layout,
  Search,
  Bell,
  Shield,
  User,
  FlaskConical,
  ClipboardList,
  Home,
  SlidersHorizontal,
  Rocket,
  Bot,
  GitBranch,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useMeetingStore } from '../../store/useMeetingStore';
import { ProfileForm } from '../auth/ProfileForm';

export type DashboardViewType = 'menu' | 'meeting' | 'file-rag' | 'test-case' | 'test-script' | 'self-healing' | 'rtm';

export const dashboardNavItems = [
  { id: 'meeting', label: 'Agile Meeting Hub', icon: <Users size={18} />, color: 'blue' },
  { id: 'file-rag', label: 'File to User Story', icon: <FileText size={18} />, color: 'purple' },
  { id: 'test-case', label: 'Test Case Gen', icon: <ClipboardCheck size={18} />, color: 'indigo' },
  { id: 'test-script', label: 'Test Script Gen', icon: <Code size={18} />, color: 'emerald' },
  { id: 'self-healing', label: 'Self Healing', icon: <Sparkles size={18} />, color: 'rose' },
  { id: 'rtm', label: 'Generate RTM', icon: <Shield size={18} />, color: 'amber' },
] as const;

export const selfHealingLinks = [
  {
    label: 'Self Healing Dashboard',
    description: 'View CI/CD recovery summary, trends, and repair readiness.',
    path: '/self-healing',
    icon: <Layout size={18} />,
  },
  {
    label: 'Submit Failure',
    description: 'Analyze a GitHub Actions failure log and prepare repair flow.',
    path: '/self-healing/submit',
    icon: <FlaskConical size={18} />,
  },
  {
    label: 'Failures',
    description: 'Review stored failure records and inspect individual incidents.',
    path: '/self-healing/failures',
    icon: <FileText size={18} />,
  },
  {
    label: 'Healing',
    description: 'Track generated healing actions and controlled remediation work.',
    path: '/self-healing/healing',
    icon: <Sparkles size={18} />,
  },
  {
    label: 'Repair History',
    description: 'Audit repair plans, published branches, and repair outcomes.',
    path: '/self-healing/repair-history',
    icon: <ClipboardList size={18} />,
  },
  {
    label: 'Analytics',
    description: 'Explore flaky-test risk and self-healing quality signals.',
    path: '/self-healing/analytics',
    icon: <Search size={18} />,
  },
] as const;

export const testCaseLinks = [
  {
    label: 'User Stories',
    description: 'Curate user stories and choose which flow into Gherkin generation.',
    path: '/test-case',
    icon: <ClipboardList size={18} />,
  },
  {
    label: 'Gherkin Editor',
    description: 'Review, edit, and approve AI-generated Gherkin scenarios.',
    path: '/test-case/gherkin',
    icon: <FileText size={18} />,
  },
  {
    label: 'Agent Explorer',
    description: 'Let the autonomous agent explore the app and discover scenarios.',
    path: '/test-case/agent-explorer',
    icon: <Bot size={18} />,
  },
] as const;

export const testScriptLinks = [
  {
    label: 'Mode & URL Setup',
    description: 'Pick Abstract or DOM-aware generation and validate the staging URL.',
    path: '/test-script',
    icon: <SlidersHorizontal size={18} />,
  },
  {
    label: 'DOM Inspector',
    description: 'Crawl the staging URL and curate the extracted selectors.',
    path: '/test-script/dom-inspector',
    icon: <Search size={18} />,
  },
  {
    label: 'Code Review',
    description: 'Generate and review executable suites for Selenium, Playwright, and Cypress.',
    path: '/test-script/code-review',
    icon: <Code size={18} />,
  },
  {
    label: 'Execution & Report',
    description: 'Run suites locally or on GitHub Actions and inspect live reports.',
    path: '/test-script/execution',
    icon: <Rocket size={18} />,
  },
  {
    label: 'GitHub Connection',
    description: 'Link a repository so generated suites can run in CI/CD.',
    path: '/test-script/settings/github',
    icon: <GitBranch size={18} />,
  },
] as const;

type DashboardLayoutProps = {
  activeView?: DashboardViewType;
  title?: string;
  children: React.ReactNode;
  onModuleSelect?: (view: DashboardViewType) => void;
  showSelfHealingCrumbs?: boolean;
  showTestCaseCrumbs?: boolean;
  showTestScriptCrumbs?: boolean;
};

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  activeView = 'menu',
  title,
  children,
  onModuleSelect,
  showSelfHealingCrumbs = false,
  showTestCaseCrumbs = false,
  showTestScriptCrumbs = false,
}) => {
  const { user, logout, currentProject } = useMeetingStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);

  if (!user || !currentProject) {
    navigate(!user ? '/login' : '/projects');
    return null;
  }

  const currentTitle = title ?? (activeView === 'menu' ? 'Dashboard Overview' : dashboardNavItems.find((item) => item.id === activeView)?.label ?? 'Dashboard');

  const activeSelfHealingPath = useMemo(() => {
    const exact = selfHealingLinks.find((item) => item.path === location.pathname);
    if (exact) return exact.path;
    if (location.pathname.startsWith('/self-healing/failures/')) return '/self-healing/failures';
    return '';
  }, [location.pathname]);

  const activeTestCasePath = useMemo(() => {
    const exact = testCaseLinks.find((item) => item.path === location.pathname);
    return exact ? exact.path : '';
  }, [location.pathname]);

  const activeTestScriptPath = useMemo(() => {
    const exact = testScriptLinks.find((item) => item.path === location.pathname);
    if (exact) return exact.path;
    if (location.pathname.startsWith('/test-script/code-review/')) return '/test-script/code-review';
    return '';
  }, [location.pathname]);

  const activeTestCaseLabel = testCaseLinks.find((item) => item.path === activeTestCasePath)?.label ?? '';
  const activeTestScriptLabel = testScriptLinks.find((item) => item.path === activeTestScriptPath)?.label ?? '';

  const selectModule = (view: DashboardViewType) => {
    setIsEditingProfile(false);
    if (onModuleSelect) {
      onModuleSelect(view);
      return;
    }

    if (view === 'self-healing') {
      navigate('/self-healing');
      return;
    }

    if (view === 'test-case') {
      navigate('/test-case');
      return;
    }

    if (view === 'test-script') {
      navigate('/test-script');
      return;
    }

    navigate('/dashboard');
  };

  const selectOverview = () => {
    setIsEditingProfile(false);
    if (onModuleSelect) {
      onModuleSelect('menu');
      return;
    }
    navigate('/dashboard');
  };

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
              type="button"
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              className="p-2 rounded-lg hover:bg-slate-50 text-slate-400 hover:text-slate-900 transition-colors"
            >
              <ChevronLeft className={`transition-transform duration-300 ${isSidebarCollapsed ? 'rotate-180' : ''}`} size={18} />
            </button>
          </div>

          <button
            type="button"
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
            type="button"
            onClick={selectOverview}
            className={`w-full flex items-center gap-3 rounded-xl text-sm font-bold transition-all ${isSidebarCollapsed ? 'p-3 justify-center' : 'px-4 py-3'} ${activeView === 'menu' ? 'bg-blue-600 text-white shadow-md shadow-blue-200' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'}`}
          >
            <Layout size={18} /> {!isSidebarCollapsed && 'Overview'}
          </button>

          <div className="pt-4 space-y-1">
            {dashboardNavItems.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => selectModule(item.id)}
                className={`w-full flex items-center gap-3 rounded-xl text-sm font-bold transition-all group ${isSidebarCollapsed ? 'p-3 justify-center' : 'px-4 py-3'} ${
                  activeView === item.id
                    ? `bg-${item.color}-50 text-${item.color}-600 border border-${item.color}-100`
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <div className={`p-1.5 rounded-lg transition-colors shrink-0 ${
                  activeView === item.id ? `bg-${item.color}-100` : 'bg-slate-100 group-hover:bg-white'
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
              type="button"
              onClick={() => setIsEditingProfile(true)}
              className="p-2 rounded-lg border border-slate-200 bg-white text-slate-400 hover:text-blue-600 hover:border-blue-100 flex items-center justify-center transition-all"
            >
              <Settings size={16} />
            </button>
            <button
              type="button"
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
            <h2 className="text-lg font-black text-slate-900 tracking-tight">{isEditingProfile ? 'Workspace Identity' : currentTitle}</h2>
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
            <button type="button" className="p-2.5 text-slate-400 hover:text-slate-900 transition-colors relative">
              <Bell size={20} />
              <div className="absolute top-2 right-2 w-2 h-2 bg-blue-500 border-2 border-white rounded-full" />
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
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
          ) : (
            <>
              {showSelfHealingCrumbs && (
                <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <div className="flex flex-wrap items-center gap-2 text-xs font-bold text-slate-500">
                    <button type="button" onClick={() => navigate('/dashboard')} className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-slate-600 hover:bg-white hover:text-blue-600">
                      <Home size={14} /> Main Dashboard
                    </button>
                    <span>/</span>
                    <button type="button" onClick={() => navigate('/self-healing')} className="rounded-lg px-2 py-1 text-slate-600 hover:bg-white hover:text-rose-600">
                      Self Healing Dashboard
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {selfHealingLinks.map((item) => (
                      <button
                        key={item.path}
                        type="button"
                        onClick={() => navigate(item.path)}
                        className={`rounded-lg px-3 py-1.5 text-[11px] font-black transition ${activeSelfHealingPath === item.path ? 'bg-rose-600 text-white shadow-sm' : 'bg-white text-slate-500 hover:text-rose-600 border border-slate-200'}`}
                      >
                        {item.label.replace('Self Healing ', '')}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {showTestCaseCrumbs && (
                <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <div className="flex flex-wrap items-center gap-2 text-xs font-bold text-slate-500">
                    <button type="button" onClick={() => navigate('/dashboard')} className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-slate-600 hover:bg-white hover:text-blue-600">
                      <Home size={14} /> Main Dashboard
                    </button>
                    <span>/</span>
                    <button
                      type="button"
                      onClick={() => navigate('/dashboard', { state: { view: 'test-case' } })}
                      className="rounded-lg px-2 py-1 text-slate-600 hover:bg-white hover:text-indigo-600"
                    >
                      Test Case Gen
                    </button>
                    {activeTestCaseLabel && (
                      <>
                        <span>/</span>
                        <span className="rounded-lg px-2 py-1 text-indigo-600">{activeTestCaseLabel}</span>
                      </>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {testCaseLinks.map((item) => (
                      <button
                        key={item.path}
                        type="button"
                        onClick={() => navigate(item.path)}
                        className={`rounded-lg px-3 py-1.5 text-[11px] font-black transition ${activeTestCasePath === item.path ? 'bg-indigo-600 text-white shadow-sm' : 'bg-white text-slate-500 hover:text-indigo-600 border border-slate-200'}`}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {showTestScriptCrumbs && (
                <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <div className="flex flex-wrap items-center gap-2 text-xs font-bold text-slate-500">
                    <button type="button" onClick={() => navigate('/dashboard')} className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-slate-600 hover:bg-white hover:text-blue-600">
                      <Home size={14} /> Main Dashboard
                    </button>
                    <span>/</span>
                    <button
                      type="button"
                      onClick={() => navigate('/dashboard', { state: { view: 'test-script' } })}
                      className="rounded-lg px-2 py-1 text-slate-600 hover:bg-white hover:text-emerald-600"
                    >
                      Test Script Gen
                    </button>
                    {activeTestScriptLabel && (
                      <>
                        <span>/</span>
                        <span className="rounded-lg px-2 py-1 text-emerald-600">{activeTestScriptLabel}</span>
                      </>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {testScriptLinks.map((item) => (
                      <button
                        key={item.path}
                        type="button"
                        onClick={() => navigate(item.path)}
                        className={`rounded-lg px-3 py-1.5 text-[11px] font-black transition ${activeTestScriptPath === item.path ? 'bg-emerald-600 text-white shadow-sm' : 'bg-white text-slate-500 hover:text-emerald-600 border border-slate-200'}`}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {children}
            </>
          )}
        </div>
      </main>
    </div>
  );
};

export default DashboardLayout;
