import React, { useState } from 'react';
import { Users, X, Search, Mic, MicOff, UserPlus, Check, Copy, Shield, Crown } from 'lucide-react';
import { Participant } from '../../store/useMeetingStore';

interface ParticipantsPanelProps {
  participants: Participant[];
  onClose: () => void;
  meetingId?: string;
}

const BG_COLORS = [
  'bg-blue-600 text-white',
  'bg-purple-600 text-white',
  'bg-emerald-600 text-white',
  'bg-amber-600 text-white',
  'bg-indigo-600 text-white',
];

const getAvatarBg = (name: string, idx: number) => {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash += name.charCodeAt(i);
  return BG_COLORS[Math.abs(hash + idx) % BG_COLORS.length];
};

export const ParticipantsPanel: React.FC<ParticipantsPanelProps> = ({
  participants,
  onClose,
  meetingId
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [copied, setCopied] = useState(false);

  const filtered = participants.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCopyLink = () => {
    const link = `${window.location.origin}/join/${meetingId || ''}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-y-0 right-0 w-full sm:w-96 bg-white shadow-2xl z-50 flex flex-col border-l border-gray-200 animate-in slide-in-from-right duration-300">
      {/* Header */}
      <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-white">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
            <Users size={16} />
          </div>
          <div>
            <h2 className="font-bold text-gray-900 text-sm">Participants</h2>
            <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">{participants.length} Active in session</p>
          </div>
        </div>
        
        <button
          onClick={onClose}
          className="p-1.5 hover:bg-gray-100 text-gray-400 hover:text-gray-700 rounded-lg transition-colors"
        >
          <X size={18} />
        </button>
      </div>

      {/* Search Input Bar */}
      <div className="p-3 bg-gray-50/50 border-b border-gray-100">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search participants..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white border border-gray-200 rounded-xl py-2 pl-9 pr-4 text-xs outline-none focus:border-blue-500 transition-all font-medium"
          />
        </div>
      </div>

      {/* Participant Roster List */}
      <div className="flex-grow overflow-y-auto p-4 space-y-2 custom-scrollbar">
        <div className="flex items-center justify-between text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2 px-1">
          <span>In this meeting ({filtered.length})</span>
        </div>

        {filtered.length === 0 ? (
          <div className="py-12 text-center text-gray-400">
            <p className="text-xs font-medium">No matching participants</p>
          </div>
        ) : (
          filtered.map((p, idx) => {
            const isMe = p.id === 'me' || idx === 0;
            const isHost = idx === 0;

            return (
              <div 
                key={p.id || idx}
                className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 border border-transparent hover:border-gray-100 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold ${getAvatarBg(p.name, idx)} shadow-xs`}>
                      {(p.name || 'P').charAt(0).toUpperCase()}
                    </div>
                    <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white" />
                  </div>
                  <div className="text-left">
                    <div className="flex items-center gap-1.5">
                      <p className="text-xs font-bold text-gray-900">{p.name}</p>
                      {isMe && (
                        <span className="text-[10px] text-gray-400 font-normal">(You)</span>
                      )}
                    </div>
                    <div className="flex items-center gap-1 mt-0.5">
                      {isHost ? (
                        <span className="text-[9px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.2 rounded border border-blue-100 uppercase tracking-wider flex items-center gap-1">
                          <Crown size={9} /> Host
                        </span>
                      ) : (
                        <span className="text-[9px] font-semibold text-gray-400 uppercase tracking-wider">Attendee</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 text-gray-400">
                  {p.isSpeaking ? (
                    <div className="w-6 h-6 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center animate-pulse">
                      <Mic size={14} />
                    </div>
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-gray-100 text-gray-400 flex items-center justify-center">
                      <MicOff size={13} />
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* MS Teams Style Invite Footer */}
      <div className="p-4 border-t border-gray-100 bg-white">
        <button
          onClick={handleCopyLink}
          className={`w-full py-3 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 active:scale-95 shadow-xs ${
            copied
              ? 'bg-emerald-600 text-white shadow-emerald-500/20'
              : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/20'
          }`}
        >
          {copied ? (
            <>
              <Check size={16} /> Link Copied to Clipboard!
            </>
          ) : (
            <>
              <UserPlus size={16} /> Invite People to Meeting
            </>
          )}
        </button>
      </div>
    </div>
  );
};
