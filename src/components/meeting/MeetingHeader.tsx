import React from 'react';
import { Clock, Video, ShieldCheck } from 'lucide-react';
import { Participant } from '../../store/useMeetingStore';

interface MeetingHeaderProps {
    meetingTitle?: string;
    userName?: string;
    meetingId?: string;
    isConnected: boolean;
    duration: string;
    participants?: Participant[];
}

const BG_COLORS = [
    'bg-blue-600 text-white',
    'bg-purple-600 text-white',
    'bg-emerald-600 text-white',
    'bg-amber-600 text-white',
    'bg-rose-600 text-white',
    'bg-indigo-600 text-white',
];

const getAvatarBg = (name: string, idx: number) => {
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash += name.charCodeAt(i);
    return BG_COLORS[Math.abs(hash + idx) % BG_COLORS.length];
};

export const MeetingHeader: React.FC<MeetingHeaderProps> = ({ 
    meetingTitle,
    userName, 
    meetingId, 
    isConnected, 
    duration, 
    participants = [] 
}) => {
    const displayed = participants.slice(0, 4);
    const remainingCount = participants.length > 4 ? participants.length - 4 : 0;
    
    // Shorten long UUIDs if necessary
    const shortMeetingId = meetingId && meetingId.length > 12 
        ? `${meetingId.slice(0, 8)}...` 
        : (meetingId || 'SECURE');

    return (
        <header className="h-16 sm:h-20 bg-white border-b border-gray-200 flex items-center justify-between px-4 sm:px-8 z-10 shadow-xs">
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100/80 shrink-0">
                    <Video size={20} />
                </div>
                
                <div className="flex flex-col text-left">
                    <div className="flex items-center gap-2">
                        <h1 className="font-bold text-gray-900 text-sm sm:text-base truncate max-w-[220px] sm:max-w-[340px]">
                            {meetingTitle || 'Requirements Elicitation Session'}
                        </h1>
                        <span className="hidden xs:flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-200/60 shrink-0">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            Live
                        </span>
                    </div>
                    
                    <div className="flex items-center gap-2 text-[11px] text-gray-400 font-medium mt-0.5">
                        <span className="text-gray-700 font-semibold">{userName || 'Host'}</span>
                        <span>•</span>
                        <span className="flex items-center gap-1 font-mono text-gray-500">
                            <Clock size={11} className="text-blue-600" /> {duration}
                        </span>
                        <span>•</span>
                        <span className="font-mono text-gray-400 text-[10px] bg-gray-100 px-1.5 py-0.5 rounded" title={meetingId}>
                            ID: {shortMeetingId}
                        </span>
                    </div>
                </div>
            </div>

            <div className="flex items-center gap-3 sm:gap-5">
                <div className={`hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-lg border text-[11px] font-bold ${
                    isConnected ? 'bg-emerald-50 border-emerald-200/80 text-emerald-700' : 'bg-amber-50 border-amber-200/80 text-amber-700'
                }`}>
                    <ShieldCheck size={14} className={isConnected ? 'text-emerald-600' : 'text-amber-600'} />
                    {isConnected ? 'Encrypted Live Sync' : 'Reconnecting...'}
                </div>
                
                <div className="h-7 w-px bg-gray-200 hidden sm:block" />
                
                <div className="flex items-center -space-x-2">
                    {displayed.length > 0 ? (
                        displayed.map((p, idx) => (
                            <div
                                key={p.id || idx}
                                title={p.name}
                                className={`w-8 h-8 rounded-full border-2 border-white flex items-center justify-center text-[10px] font-bold ${getAvatarBg(p.name, idx)} shadow-xs transition-transform hover:scale-110 relative`}
                            >
                                {(p.name || 'P').charAt(0).toUpperCase()}
                            </div>
                        ))
                    ) : (
                        <div
                            title={userName || 'Me'}
                            className="w-8 h-8 rounded-full border-2 border-white bg-blue-600 text-white flex items-center justify-center text-[10px] font-bold shadow-xs"
                        >
                            {(userName || 'M').charAt(0).toUpperCase()}
                        </div>
                    )}

                    {remainingCount > 0 && (
                        <div className="w-8 h-8 rounded-full border-2 border-white bg-gray-800 flex items-center justify-center text-[10px] font-bold text-white shadow-xs">
                            +{remainingCount}
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
};
