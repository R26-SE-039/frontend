import React from 'react';
import { Mic, MicOff, Users } from 'lucide-react';
import { User, Participant } from '../../store/useMeetingStore';

interface ParticipantGridProps {
    user: User | null;
    participants: Participant[];
    isMuted: boolean;
    gridDensity: 'compact' | 'standard' | 'relaxed';
}

export const ParticipantGrid: React.FC<ParticipantGridProps> = ({ user, participants, isMuted, gridDensity }) => {
    return (
        <div className={`grid gap-4 flex-grow ${
            gridDensity === 'compact' 
                ? 'grid-cols-3 sm:grid-cols-4' 
                : gridDensity === 'relaxed'
                    ? 'grid-cols-1'
                    : 'grid-cols-1 sm:grid-cols-2'
        }`}>
            
            {/* Local Participant Card */}
            <div className="relative group bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col transition-all hover:shadow-md hover:border-blue-200">
                <div className="flex-grow bg-gray-50 relative flex items-center justify-center min-h-[140px]">
                    <div className="w-20 h-20 sm:w-28 sm:h-28 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                        <Users size={48} className="opacity-40" />
                    </div>
                    <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-lg text-white text-xs font-bold flex items-center gap-2">
                        {isMuted ? <MicOff size={12} className="text-red-400" /> : <Mic size={12} className="text-emerald-400" />}
                        {user?.name} (You)
                    </div>
                </div>
            </div>

            {/* Other Participants */}
            {participants.filter(p => p.id !== 'me').map(p => (
                <div key={p.id} className="relative group bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col transition-all hover:shadow-md hover:border-emerald-200">
                    <div className="flex-grow bg-gray-50 relative flex items-center justify-center min-h-[140px]">
                        <div className="w-20 h-20 sm:w-28 sm:h-28 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                            {p.avatar ? <img src={p.avatar} alt="" className="w-full h-full rounded-full" /> : <Users size={48} className="opacity-40" />}
                        </div>
                        <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-lg text-white text-xs font-bold flex items-center gap-2">
                            {p.muted ? <MicOff size={12} className="text-red-400" /> : <Mic size={12} className="text-emerald-400" />}
                            {p.name}
                        </div>
                        {p.isSpeaking && (
                            <div className="absolute inset-0 border-4 border-emerald-500 rounded-2xl pointer-events-none" />
                        )}
                    </div>
                </div>
            ))}
        </div>
    );
};
