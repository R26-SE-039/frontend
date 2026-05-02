import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import MeetingPage from './pages/MeetingPage';
import { useMeetingStore } from './store/useMeetingStore';

import { DashboardPage } from './pages/DashboardPage';

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
            path="/dashboard" 
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/meeting/:id" 
            element={
              <ProtectedRoute>
                <MeetingPage />
              </ProtectedRoute>
            } 
          />
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
