import React from 'react';
import { Mic, MicOff, Video, VideoOff, Monitor, Users, PhoneOff, LogOut } from 'lucide-react';

interface ControlBarProps {
    isMuted: boolean;
    toggleMic: () => void;
    isVideoOff: boolean;
    toggleVideo: () => void;
    onLeave: () => void;
    onEnd: () => void;
}

export const ControlBar: React.FC<ControlBarProps> = ({ 
    isMuted, 
    toggleMic, 
    isVideoOff, 
    toggleVideo, 
    onLeave, 
    onEnd 
}) => {
    return (
        <div className="py-3 flex items-center justify-center relative z-30 px-4">
            {/* Premium Floating White Glassmorphic Control Dock */}
            <div className="flex items-center gap-2 sm:gap-3 bg-white/95 backdrop-blur-xl border border-gray-200/80 p-2 sm:p-2.5 rounded-full shadow-[0_10px_30px_rgba(0,0,0,0.08)]">
                {/* Audio & Video Controls */}
                <div className="flex items-center gap-1.5 sm:gap-2">
                    <button 
                        onClick={toggleMic}
                        className={`flex flex-col items-center justify-center w-14 sm:w-16 h-12 sm:h-14 rounded-full transition-all duration-200 active:scale-95 group ${
                            isMuted 
                                ? 'bg-red-50 text-red-600 border border-red-200 hover:bg-red-100' 
                                : 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/25 ring-2 ring-blue-400/30'
                        }`}
                    >
                        {isMuted ? <MicOff size={20} /> : <Mic size={20} className="animate-pulse" />}
                        <span className="text-[9px] font-black uppercase tracking-wider mt-0.5 opacity-90">
                            {isMuted ? 'Unmute' : 'Mute'}
                        </span>
                    </button>

                    <button 
                        onClick={toggleVideo}
                        className={`flex flex-col items-center justify-center w-14 sm:w-16 h-12 sm:h-14 rounded-full transition-all duration-200 active:scale-95 group ${
                            isVideoOff 
                                ? 'bg-red-50 text-red-600 border border-red-200 hover:bg-red-100' 
                                : 'bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-200/60'
                        }`}
                    >
                        {isVideoOff ? <VideoOff size={20} /> : <Video size={20} />}
                        <span className="text-[9px] font-black uppercase tracking-wider mt-0.5 opacity-90">
                            {isVideoOff ? 'Start' : 'Stop'}
                        </span>
                    </button>
                </div>

                <div className="h-7 w-px bg-gray-200 mx-0.5 sm:mx-1" />

                {/* Collaboration Controls */}
                <div className="flex items-center gap-1.5 sm:gap-2">
                    <button 
                        className="flex flex-col items-center justify-center w-14 sm:w-16 h-12 sm:h-14 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-200/60 transition-all duration-200 active:scale-95 group"
                    >
                        <Monitor size={20} />
                        <span className="text-[9px] font-black uppercase tracking-wider mt-0.5 opacity-80">Screen</span>
                    </button>

                    <button 
                        className="flex flex-col items-center justify-center w-14 sm:w-16 h-12 sm:h-14 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-200/60 transition-all duration-200 active:scale-95 group"
                    >
                        <Users size={20} />
                        <span className="text-[9px] font-black uppercase tracking-wider mt-0.5 opacity-80">People</span>
                    </button>
                </div>

                <div className="h-7 w-px bg-gray-200 mx-0.5 sm:mx-1" />

                {/* Exit Controls */}
                <div className="flex items-center gap-2">
                    <button 
                        onClick={onLeave}
                        className="flex items-center justify-center gap-1.5 px-4 sm:px-5 h-12 sm:h-14 rounded-full bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-700 transition-all duration-200 active:scale-95 font-black"
                    >
                        <LogOut size={16} />
                        <span className="text-[10px] uppercase tracking-widest hidden xs:inline">Leave</span>
                    </button>

                    <button 
                        onClick={onEnd}
                        className="flex items-center justify-center gap-1.5 px-5 sm:px-6 h-12 sm:h-14 rounded-full bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white font-black shadow-lg shadow-red-500/25 transition-all duration-200 active:scale-95"
                    >
                        <PhoneOff size={16} />
                        <span className="text-[10px] uppercase tracking-widest">End</span>
                    </button>
                </div>
            </div>
        </div>
    );
};
