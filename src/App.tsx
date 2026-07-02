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

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user } = useMeetingStore();
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
};

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
