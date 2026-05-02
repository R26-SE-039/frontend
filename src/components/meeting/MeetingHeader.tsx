import React from 'react';
import { Clock } from 'lucide-react';

interface MeetingHeaderProps {
    userName: string | undefined;
    meetingId: string | undefined;
    isConnected: boolean;
    duration: string;
}

export const MeetingHeader: React.FC<MeetingHeaderProps> = ({ userName, meetingId, isConnected, duration }) => {
    return (
        <header className="h-16 sm:h-20 bg-white border-b border-gray-200 flex items-center justify-between px-4 sm:px-8 z-10 shadow-sm">
            <div className="flex items-center gap-4">
                <div className="flex flex-col">
                    <h1 className="font-bold text-gray-900 truncate max-w-[150px] sm:max-w-[200px] leading-tight flex items-center gap-2">
                        {userName || 'Meeting Assistant'}
                        <span className="hidden xs:inline px-1.5 py-0.5 rounded bg-blue-50 text-blue-600 text-[10px] uppercase font-black">AI Host</span>
                    </h1>
                    <div className="flex items-center gap-2 text-[10px] sm:text-xs text-gray-400 font-medium">
                        <span className="flex items-center gap-1 font-mono tracking-wider text-blue-500/80"><Clock size={12} /> {duration}</span>
                        <span>•</span>
                        <span className="text-blue-500 font-bold uppercase text-[10px] tracking-widest">{meetingId || 'DEMO'}</span>
                    </div>
                </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-4">
                <div className={`hidden xs:flex items-center gap-2 px-3 py-1.5 rounded-full border text-[10px] font-bold uppercase tracking-wider ${isConnected ? 'bg-emerald-50 border-emerald-100 text-emerald-600' : 'bg-amber-50 border-amber-100 text-amber-600'}`}>
                    <div className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
                    {isConnected ? 'Live Transcription' : 'Reconnecting...'}
                </div>
                
                <div className="h-8 w-px bg-gray-200 mx-2 hidden sm:block" />
                
                <div className="flex -space-x-2">
                    {[1, 2, 3].map(i => (
                        <div key={i} className={`w-8 h-8 rounded-full border-2 border-white bg-gray-100 flex items-center justify-center text-[10px] font-bold text-gray-500`}>
                            {String.fromCharCode(64 + i)}
                        </div>
                    ))}
                    <div className="w-8 h-8 rounded-full border-2 border-white bg-blue-600 flex items-center justify-center text-[10px] font-bold text-white">+5</div>
                </div>
            </div>
        </header>
    );
};
