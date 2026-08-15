import React, { useState } from 'react';
import { Shield, ShieldCheck, Lock, Users, X, Monitor, MessageSquare, Mic } from 'lucide-react';

interface SecurityPanelProps {
  onClose: () => void;
}

export const SecurityPanel: React.FC<SecurityPanelProps> = ({ onClose }) => {
  const [isLocked, setIsLocked] = useState(false);
  const [waitingRoom, setWaitingRoom] = useState(true);
  const [allowScreenShare, setAllowScreenShare] = useState(true);
  const [allowChat, setAllowChat] = useState(true);
  const [allowUnmute, setAllowUnmute] = useState(true);

  return (
    <div className="fixed inset-y-0 right-0 w-full sm:w-96 bg-white shadow-2xl z-50 flex flex-col border-l border-gray-200 animate-in slide-in-from-right duration-300">
      {/* Header */}
      <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-white">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
            <ShieldCheck size={16} />
          </div>
          <div className="text-left">
            <h2 className="font-bold text-gray-900 text-sm">Meeting Security</h2>
            <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">Session Protection & Controls</p>
          </div>
        </div>
        
        <button
          onClick={onClose}
          className="p-1.5 hover:bg-gray-100 text-gray-400 hover:text-gray-700 rounded-lg transition-colors"
        >
          <X size={18} />
        </button>
      </div>

      {/* Security Content */}
      <div className="flex-grow overflow-y-auto p-4 space-y-4 custom-scrollbar bg-gray-50/50">
        {/* Encryption Banner */}
        <div className="p-4 rounded-xl bg-emerald-50/80 border border-emerald-200/60 text-left space-y-1.5">
          <div className="flex items-center gap-2">
            <Shield size={16} className="text-emerald-600 shrink-0" />
            <span className="text-xs font-bold text-emerald-900">End-to-End Encrypted</span>
          </div>
          <p className="text-xs text-emerald-700 font-normal leading-relaxed">
            This session is secured with enterprise AES-256 encryption. Audio streams and transcript data are protected.
          </p>
        </div>

        {/* Meeting Access Controls */}
        <div className="space-y-2 text-left">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider px-1">Access Controls</p>
          
          <div className="bg-white rounded-xl border border-gray-200/70 p-3.5 space-y-3 shadow-xs">
            {/* Lock Meeting Option */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-gray-100 text-gray-600">
                  <Lock size={15} />
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-900">Lock Meeting</p>
                  <p className="text-[10px] text-gray-400 font-medium">Prevent new participants from joining</p>
                </div>
              </div>

              <button
                onClick={() => setIsLocked(!isLocked)}
                className={`w-10 h-5 rounded-full transition-colors relative p-0.5 ${
                  isLocked ? 'bg-blue-600' : 'bg-gray-200'
                }`}
              >
                <div className={`w-4 h-4 rounded-full bg-white shadow-md transition-transform ${
                  isLocked ? 'translate-x-5' : 'translate-x-0'
                }`} />
              </button>
            </div>

            <div className="h-px bg-gray-100" />

            {/* Waiting Room Option */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-gray-100 text-gray-600">
                  <Users size={15} />
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-900">Enable Waiting Room</p>
                  <p className="text-[10px] text-gray-400 font-medium">Host approval required before entry</p>
                </div>
              </div>

              <button
                onClick={() => setWaitingRoom(!waitingRoom)}
                className={`w-10 h-5 rounded-full transition-colors relative p-0.5 ${
                  waitingRoom ? 'bg-blue-600' : 'bg-gray-200'
                }`}
              >
                <div className={`w-4 h-4 rounded-full bg-white shadow-md transition-transform ${
                  waitingRoom ? 'translate-x-5' : 'translate-x-0'
                }`} />
              </button>
            </div>
          </div>
        </div>

        {/* Participant Permissions */}
        <div className="space-y-2 text-left">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider px-1">Participant Permissions</p>
          
          <div className="bg-white rounded-xl border border-gray-200/70 p-3.5 space-y-3 shadow-xs">
            {/* Screen Share */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-gray-100 text-gray-600">
                  <Monitor size={15} />
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-900">Share Screen</p>
                  <p className="text-[10px] text-gray-400 font-medium">Allow attendees to present</p>
                </div>
              </div>

              <button
                onClick={() => setAllowScreenShare(!allowScreenShare)}
                className={`w-10 h-5 rounded-full transition-colors relative p-0.5 ${
                  allowScreenShare ? 'bg-blue-600' : 'bg-gray-200'
                }`}
              >
                <div className={`w-4 h-4 rounded-full bg-white shadow-md transition-transform ${
                  allowScreenShare ? 'translate-x-5' : 'translate-x-0'
                }`} />
              </button>
            </div>

            <div className="h-px bg-gray-100" />

            {/* Chat */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-gray-100 text-gray-600">
                  <MessageSquare size={15} />
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-900">In-Meeting Chat</p>
                  <p className="text-[10px] text-gray-400 font-medium">Allow attendees to send messages</p>
                </div>
              </div>

              <button
                onClick={() => setAllowChat(!allowChat)}
                className={`w-10 h-5 rounded-full transition-colors relative p-0.5 ${
                  allowChat ? 'bg-blue-600' : 'bg-gray-200'
                }`}
              >
                <div className={`w-4 h-4 rounded-full bg-white shadow-md transition-transform ${
                  allowChat ? 'translate-x-5' : 'translate-x-0'
                }`} />
              </button>
            </div>

            <div className="h-px bg-gray-100" />

            {/* Unmute Self */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-gray-100 text-gray-600">
                  <Mic size={15} />
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-900">Unmute Themselves</p>
                  <p className="text-[10px] text-gray-400 font-medium">Allow attendees to turn on mic</p>
                </div>
              </div>

              <button
                onClick={() => setAllowUnmute(!allowUnmute)}
                className={`w-10 h-5 rounded-full transition-colors relative p-0.5 ${
                  allowUnmute ? 'bg-blue-600' : 'bg-gray-200'
                }`}
              >
                <div className={`w-4 h-4 rounded-full bg-white shadow-md transition-transform ${
                  allowUnmute ? 'translate-x-5' : 'translate-x-0'
                }`} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
