import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import MeetingPage from './pages/MeetingPage';
import { useMeetingStore } from './store/useMeetingStore';

function App() {
  const { user } = useMeetingStore();
  const isAuthenticated = !!user;

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-[#F4F7FB] text-gray-800">
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/" element={
            isAuthenticated ? <MeetingPage /> : <Navigate to="/login" />
          } />
          <Route path="*" element={<Navigate to="/login" />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
