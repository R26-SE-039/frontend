import React from 'react';
import { Mic, MicOff, Video, VideoOff, Share, Users, PhoneOff, Maximize2 } from 'lucide-react';

interface ControlBarProps {
    isMuted: boolean;
    toggleMic: () => void;
    isVideoOff: boolean;
    toggleVideo: () => void;
    onLeave: () => void;
    onEnd: () => void;
}

export const ControlBar: React.FC<ControlBarProps> = ({ isMuted, toggleMic, isVideoOff, toggleVideo, onLeave, onEnd }) => {
    return (
        <footer className="h-20 sm:h-24 bg-white border-t border-gray-200 flex items-center justify-center relative z-20 px-4 sm:px-10 shadow-[0_-5px_20px_rgb(0,0,0,0.02)]">
            <div className="flex items-center gap-1 sm:gap-3">
                <div className="flex items-center bg-gray-100/80 p-1.5 rounded-[1.5rem] border border-gray-200 shadow-inner">
                    <button 
                        onClick={toggleMic}
                        className={`flex flex-col items-center justify-center w-12 sm:w-16 h-12 sm:h-16 rounded-2xl transition-all active:scale-95 ${isMuted ? 'bg-white text-rose-600 shadow-sm border border-rose-100' : 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'}`}
                    >
                        {isMuted ? <MicOff size={22} /> : <Mic size={22} />}
                        <span className="text-[8px] font-bold uppercase tracking-tighter mt-1">{isMuted ? 'Unmute' : 'Mute'}</span>
                    </button>
                    <button 
                        onClick={toggleVideo}
                        className={`flex flex-col items-center justify-center w-12 sm:w-16 h-12 sm:h-16 rounded-2xl transition-all active:scale-95 ${isVideoOff ? 'text-rose-600 hover:bg-white' : 'text-gray-600 hover:bg-white'}`}
                    >
                        {isVideoOff ? <VideoOff size={22} /> : <Video size={22} />}
                        <span className="text-[8px] font-bold uppercase tracking-tighter mt-1">{isVideoOff ? 'Start' : 'Stop'}</span>
                    </button>
                </div>

                <div className="flex items-center bg-gray-100/80 p-1.5 rounded-[1.5rem] border border-gray-200 shadow-inner">
                    <button className="flex flex-col items-center justify-center w-12 sm:w-16 h-12 sm:h-16 rounded-2xl text-gray-600 hover:bg-white transition-all active:scale-95">
                        <Share size={22} />
                        <span className="text-[8px] font-bold uppercase tracking-tighter mt-1">Screen</span>
                    </button>
                    <button className="flex flex-col items-center justify-center w-12 sm:w-16 h-12 sm:h-16 rounded-2xl text-gray-600 hover:bg-white transition-all active:scale-95">
                        <Users size={22} />
                        <span className="text-[8px] font-bold uppercase tracking-tighter mt-1">People</span>
                    </button>
                </div>

                <div className="w-px h-10 bg-gray-200 mx-1 xs:mx-2 hidden sm:block" />
                
                <div className="flex items-center gap-2">
                    <button 
                        onClick={onLeave}
                        className="flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 px-3 sm:px-6 h-12 sm:h-16 rounded-2xl bg-orange-500 hover:bg-orange-600 text-white transition-all active:scale-95 shadow-lg shadow-orange-500/20"
                    >
                        <PhoneOff size={16} />
                        <span className="text-[8px] sm:text-[10px] font-black uppercase tracking-widest whitespace-nowrap">Leave</span>
                    </button>
                    <button 
                        onClick={onEnd}
                        className="flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 px-3 sm:px-6 h-12 sm:h-16 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white transition-all active:scale-95 shadow-lg shadow-rose-600/20"
                    >
                        <PhoneOff size={16} />
                        <span className="text-[8px] sm:text-[10px] font-black uppercase tracking-widest whitespace-nowrap">End</span>
                    </button>
                </div>
            </div>

            <div className="absolute right-6 sm:right-10 items-center gap-3 hidden md:flex">
                <button className="p-3 rounded-full bg-gray-50 text-gray-400 hover:text-gray-600 transition-colors border border-gray-100"><Maximize2 size={18} /></button>
            </div>
        </footer>
    );
};
