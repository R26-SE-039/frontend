import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import MeetingPage from './pages/MeetingPage';
import { useMeetingStore } from './store/useMeetingStore';

import { DashboardPage } from './pages/DashboardPage';
import { ProjectDashboard } from './pages/ProjectDashboard';
import { AcceptInvitePage } from './pages/AcceptInvitePage';
import { OrganizationSettingsPage } from './pages/OrganizationSettingsPage';
import { ProjectDetailPage } from './pages/ProjectDetailPage';
import { BacklogPage } from './pages/BacklogPage';
import SelfHealingDashboardPage from './pages/SelfHealingDashboardPage';
import FailureAnalysisSubmitPage from './pages/FailureAnalysisSubmitPage';
import FailureRecordsPage from './pages/FailureRecordsPage';
import FailureDetailsPage from './pages/FailureDetailsPage';
import HealingActionsPage from './pages/HealingActionsPage';
import RepairHistoryPage from './pages/RepairHistoryPage';
import SelfHealingAnalyticsPage from './pages/SelfHealingAnalyticsPage';
import TestCaseStoriesPage from './pages/TestCaseStoriesPage';
import TestCaseGherkinPage from './pages/TestCaseGherkinPage';
import TestCaseAgentExplorerPage from './pages/TestCaseAgentExplorerPage';
import TestScriptSetupPage from './pages/TestScriptSetupPage';
import TestScriptDomInspectorPage from './pages/TestScriptDomInspectorPage';
import TestScriptCodeReviewPage from './pages/TestScriptCodeReviewPage';
import TestScriptSuiteEditorPage from './pages/TestScriptSuiteEditorPage';
import TestScriptExecutionPage from './pages/TestScriptExecutionPage';
import TestScriptGitHubSettingsPage from './pages/TestScriptGitHubSettingsPage';
import { DashboardLayout } from './components/dashboard/DashboardLayout';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user } = useMeetingStore();
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
};
const SelfHealingRoute = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <ProtectedRoute>
    <DashboardLayout activeView="self-healing" title={title} showSelfHealingCrumbs>
      {children}
    </DashboardLayout>
  </ProtectedRoute>
);
const TestCaseRoute = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <ProtectedRoute>
    <DashboardLayout activeView="test-case" title={title} showTestCaseCrumbs>
      {children}
    </DashboardLayout>
  </ProtectedRoute>
);
const TestScriptRoute = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <ProtectedRoute>
    <DashboardLayout activeView="test-script" title={title} showTestScriptCrumbs>
      {children}
    </DashboardLayout>
  </ProtectedRoute>
);

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-[#F4F7FB] text-gray-800 font-sans">
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/projects"
            element={
              <ProtectedRoute>
                <ProjectDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/projects/:id"
            element={
              <ProtectedRoute>
                <ProjectDetailPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/projects/:id/backlog"
            element={
              <ProtectedRoute>
                <BacklogPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings/organization"
            element={
              <ProtectedRoute>
                <OrganizationSettingsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/self-healing"
            element={
              <SelfHealingRoute title="Self Healing Dashboard">
                <SelfHealingDashboardPage />
              </SelfHealingRoute>
            }
          />
          <Route
            path="/self-healing/submit"
            element={
              <SelfHealingRoute title="Submit Failure">
                <FailureAnalysisSubmitPage />
              </SelfHealingRoute>
            }
          />
          <Route
            path="/self-healing/failures"
            element={
              <SelfHealingRoute title="Failures">
                <FailureRecordsPage />
              </SelfHealingRoute>
            }
          />
          <Route
            path="/self-healing/failures/:id"
            element={
              <SelfHealingRoute title="Failure Details">
                <FailureDetailsPage />
              </SelfHealingRoute>
            }
          />
          <Route
            path="/self-healing/healing"
            element={
              <SelfHealingRoute title="Healing">
                <HealingActionsPage />
              </SelfHealingRoute>
            }
          />
          <Route
            path="/self-healing/repair-history"
            element={
              <SelfHealingRoute title="Repair History">
                <RepairHistoryPage />
              </SelfHealingRoute>
            }
          />
          <Route
            path="/self-healing/analytics"
            element={
              <SelfHealingRoute title="Analytics">
                <SelfHealingAnalyticsPage />
              </SelfHealingRoute>
            }
          />
          <Route
            path="/test-case"
            element={
              <TestCaseRoute title="User Stories">
                <TestCaseStoriesPage />
              </TestCaseRoute>
            }
          />
          <Route
            path="/test-case/gherkin"
            element={
              <TestCaseRoute title="Gherkin Editor">
                <TestCaseGherkinPage />
              </TestCaseRoute>
            }
          />
          <Route
            path="/test-case/agent-explorer"
            element={
              <TestCaseRoute title="Agent Explorer">
                <TestCaseAgentExplorerPage />
              </TestCaseRoute>
            }
          />
          <Route
            path="/test-script"
            element={
              <TestScriptRoute title="Mode & URL Setup">
                <TestScriptSetupPage />
              </TestScriptRoute>
            }
          />
          <Route
            path="/test-script/dom-inspector"
            element={
              <TestScriptRoute title="DOM Inspector">
                <TestScriptDomInspectorPage />
              </TestScriptRoute>
            }
          />
          <Route
            path="/test-script/code-review"
            element={
              <TestScriptRoute title="Code Review">
                <TestScriptCodeReviewPage />
              </TestScriptRoute>
            }
          />
          <Route
            path="/test-script/code-review/:suiteId"
            element={
              <TestScriptRoute title="Suite Editor">
                <TestScriptSuiteEditorPage />
              </TestScriptRoute>
            }
          />
          <Route
            path="/test-script/execution"
            element={
              <TestScriptRoute title="Execution & Report">
                <TestScriptExecutionPage />
              </TestScriptRoute>
            }
          />
          <Route
            path="/test-script/settings/github"
            element={
              <TestScriptRoute title="GitHub Connection">
                <TestScriptGitHubSettingsPage />
              </TestScriptRoute>
            }
          />
          <Route path="/accept-invite" element={<AcceptInvitePage />} />
          <Route
            path="/meeting/:id"
            element={
              <ProtectedRoute>
                <MeetingPage />
              </ProtectedRoute>
            }
          />
          <Route path="/" element={<Navigate to="/projects" replace />} />
          <Route path="*" element={<Navigate to="/projects" replace />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;


