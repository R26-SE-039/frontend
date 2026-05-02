import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles } from 'lucide-react';

interface AuthPromoProps {
    activeTab: 'join' | 'create';
    joinImage: string;
    createImage: string;
}

export const AuthPromo: React.FC<AuthPromoProps> = ({ activeTab, joinImage, createImage }) => {
    return (
        <div className={`flex-1 relative hidden md:block overflow-hidden transition-all duration-700 bg-gray-50 order-2 h-screen ${activeTab === 'create' ? 'md:order-1' : 'md:order-2'}`}>
            <AnimatePresence mode="wait">
                <motion.div 
                    key={activeTab}
                    initial={{ opacity: 0, scale: 1.02 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 1.01 }}
                    transition={{ duration: 0.8 }}
                    className="absolute inset-0"
                >
                    <img 
                        src={activeTab === 'join' ? joinImage : createImage} 
                        alt="Meeting Promo" 
                        className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/20" />
                    <div className="absolute inset-0 bg-gradient-to-t from-gray-900/60 via-transparent to-transparent" />
                </motion.div>
            </AnimatePresence>
            
            <div className="absolute bottom-16 left-16 right-16 z-10 text-white pointer-events-none">
                <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3, duration: 0.6 }}
                >
                    <div className="flex items-center gap-2 mb-4 px-3 py-1 bg-white/10 backdrop-blur-md rounded-full w-fit border border-white/10">
                        <Sparkles size={14} className="text-blue-400" />
                        <span className="text-[10px] font-bold uppercase tracking-widest">Next-Gen Intelligence</span>
                    </div>
                    <h3 className="text-4xl font-bold leading-tight mb-4 max-w-[440px]">
                        {activeTab === 'join' ? 'Real-time intelligence for your team meetings.' : 'Host high-performance AI workspaces instantly.'}
                    </h3>
                    <p className="text-lg text-white/80 font-medium max-w-[400px]">
                        Leading speaker diarization and transcription tools integrated into one seamless portal.
                    </p>
                </motion.div>
            </div>
        </div>
    );
};
