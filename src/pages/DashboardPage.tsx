import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowRight, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMeetingStore } from '../store/useMeetingStore';
import { meetingApi } from '../api/meetingApi';
import { FileStoryGenerator } from '../components/rag/FileStoryGenerator';
import { PlaceholderView } from '../components/dashboard/PlaceholderView';
import { OverviewView } from '../components/dashboard/OverviewView';
import { MeetingHubView } from '../components/dashboard/MeetingHubView';
import {
  DashboardLayout,
  type DashboardViewType,
  dashboardNavItems,
  selfHealingLinks,
  testCaseLinks,
  testScriptLinks,
} from '../components/dashboard/DashboardLayout';

export const DashboardPage: React.FC = () => {
  const { user, setUser, currentProject } = useMeetingStore();
  const navigate = useNavigate();
  const location = useLocation();

  const requestedView = (location.state as { view?: DashboardViewType } | null)?.view;
  const [currentView, setCurrentView] = useState<DashboardViewType>(requestedView ?? 'menu');

  useEffect(() => {
    if (requestedView) setCurrentView(requestedView);
  }, [requestedView]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCreated, setIsCreated] = useState(false);
  const [inviteDetails, setInviteDetails] = useState<{ id: string; passcode: string; link: string } | null>(null);
  const [isCopied, setIsCopied] = useState(false);

  const activeModule = dashboardNavItems.find((item) => item.id === currentView);
  const pageTitle = currentView === 'menu' ? 'Dashboard Overview' : activeModule?.label;

  if (!user || !currentProject) {
    return (
      <DashboardLayout activeView="menu" title="Dashboard Overview">
        <div />
      </DashboardLayout>
    );
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
      const data = await meetingApi.createMeeting(title || `${user.name}'s Meeting`, mode, scheduledAt);
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

  return (
    <DashboardLayout activeView={currentView} title={pageTitle} onModuleSelect={setCurrentView}>
      <AnimatePresence mode="wait">
        {currentView === 'menu' ? (
          <OverviewView
            userName={user.name}
            projectName={currentProject.name}
            agileRole={user.agileRole}
            navItems={dashboardNavItems}
            onModuleSelect={setCurrentView}
          />
        ) : (
          <motion.div
            key={currentView}
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

            {currentView === 'file-rag' && <FileStoryGenerator />}

            {currentView === 'self-healing' && (
              <div className="space-y-6 self-healing-surface">
                <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
                  <div>
                    <h3 className="text-2xl font-black text-slate-900">Self Healing</h3>
                    <p className="text-sm font-medium text-slate-400">
                      Analyze CI/CD failures, inspect healing actions, and review repair history for this workspace.
                    </p>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {selfHealingLinks.map((item) => (
                    <button
                      key={item.path}
                      type="button"
                      onClick={() => navigate(item.path)}
                      className="group flex h-full min-h-32 items-start justify-between gap-4 rounded-xl border border-slate-200 bg-white p-5 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:border-rose-200 hover:shadow-md"
                    >
                      <div className="flex gap-4">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-rose-50 text-rose-600 transition-colors group-hover:bg-rose-600 group-hover:text-white">
                          {item.icon}
                        </div>
                        <div>
                          <h4 className="text-sm font-black text-slate-900">{item.label}</h4>
                          <p className="mt-2 text-xs font-medium leading-5 text-slate-500">{item.description}</p>
                        </div>
                      </div>
                      <ArrowRight size={16} className="mt-1 shrink-0 text-slate-300 transition-transform group-hover:translate-x-1 group-hover:text-rose-500" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {currentView === 'test-case' && (
              <div className="space-y-6">
                <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
                  <div>
                    <h3 className="text-2xl font-black text-slate-900">Test Case Generation</h3>
                    <p className="text-sm font-medium text-slate-400">
                      Turn user stories into reviewed, approved Gherkin scenarios — the input for Test Script Gen.
                    </p>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {testCaseLinks.map((item) => (
                    <button
                      key={item.path}
                      type="button"
                      onClick={() => navigate(item.path)}
                      className="group flex h-full min-h-32 items-start justify-between gap-4 rounded-xl border border-slate-200 bg-white p-5 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-md"
                    >
                      <div className="flex gap-4">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 transition-colors group-hover:bg-indigo-600 group-hover:text-white">
                          {item.icon}
                        </div>
                        <div>
                          <h4 className="text-sm font-black text-slate-900">{item.label}</h4>
                          <p className="mt-2 text-xs font-medium leading-5 text-slate-500">{item.description}</p>
                        </div>
                      </div>
                      <ArrowRight size={16} className="mt-1 shrink-0 text-slate-300 transition-transform group-hover:translate-x-1 group-hover:text-indigo-500" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {currentView === 'test-script' && (
              <div className="space-y-6">
                <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
                  <div>
                    <h3 className="text-2xl font-black text-slate-900">Test Script Generation</h3>
                    <p className="text-sm font-medium text-slate-400">
                      Generate executable Selenium, Playwright, and Cypress suites from approved Gherkin, then run them
                      locally or in CI/CD.
                    </p>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {testScriptLinks.map((item) => (
                    <button
                      key={item.path}
                      type="button"
                      onClick={() => navigate(item.path)}
                      className="group flex h-full min-h-32 items-start justify-between gap-4 rounded-xl border border-slate-200 bg-white p-5 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-md"
                    >
                      <div className="flex gap-4">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 transition-colors group-hover:bg-emerald-600 group-hover:text-white">
                          {item.icon}
                        </div>
                        <div>
                          <h4 className="text-sm font-black text-slate-900">{item.label}</h4>
                          <p className="mt-2 text-xs font-medium leading-5 text-slate-500">{item.description}</p>
                        </div>
                      </div>
                      <ArrowRight size={16} className="mt-1 shrink-0 text-slate-300 transition-transform group-hover:translate-x-1 group-hover:text-emerald-500" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {currentView === 'rtm' && (
              <PlaceholderView
                title={activeModule?.label ?? 'Module'}
                description={`Advanced AI module for ${activeModule?.label.toLowerCase() ?? 'this feature'}. Seamlessly integrated into the ${currentProject.name} context.`}
                icon={activeModule?.icon ?? <Sparkles />}
                color={activeModule?.color ?? 'blue'}
              />
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </DashboardLayout>
  );
};
