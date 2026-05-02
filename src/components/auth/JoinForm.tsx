import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, ArrowRight, Hash, Lock, AlertCircle, Users, Check, Copy } from 'lucide-react';

interface JoinFormProps {
    handleJoin: (e: React.FormEvent) => void;
    isLoading: boolean;
    error: string | null;
    meetingId: string;
    setMeetingId: (val: string) => void;
    passcode: string;
    setPasscode: (val: string) => void;
    name: string;
    setName: (val: string) => void;
    email: string;
    setEmail: (val: string) => void;
}

export const JoinForm: React.FC<JoinFormProps> = ({ 
    handleJoin, isLoading, error, 
    meetingId, setMeetingId, passcode, setPasscode,
    name, setName, email, setEmail
}) => {
    return (
        <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
        >
            <div className="space-y-3">
                <h2 className="text-3xl font-bold text-gray-900 tracking-tight">Connect to your session.</h2>
                <p className="text-gray-500 text-sm leading-relaxed max-w-[380px]">
                    Enter your meeting credentials to access your real-time dashboard.
                </p>
            </div>

            <form onSubmit={handleJoin} className="space-y-4">
                {error && (
                    <div className="p-4 rounded-xl bg-red-50 border border-red-100 text-red-600 text-[10px] font-bold uppercase tracking-wider flex items-center gap-2.5">
                        <AlertCircle size={14} /> {error}
                    </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Meeting ID</label>
                        <div className="relative">
                            <Hash className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={14} />
                            <input 
                                type="text" 
                                value={meetingId}
                                onChange={(e) => setMeetingId(e.target.value.toUpperCase())}
                                placeholder="ID" 
                                className="w-full bg-gray-50 border border-transparent rounded-xl py-3 pl-11 pr-4 outline-none focus:bg-white focus:border-[#0E71EB] transition-all font-bold text-sm tracking-widest"
                                required
                            />
                        </div>
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Passcode</label>
                        <div className="relative">
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={14} />
                            <input 
                                type="password" 
                                value={passcode}
                                onChange={(e) => setPasscode(e.target.value)}
                                placeholder="Code" 
                                className="w-full bg-gray-50 border border-transparent rounded-xl py-3 pl-11 pr-4 outline-none focus:bg-white focus:border-[#0E71EB] transition-all font-medium text-sm"
                                required
                            />
                        </div>
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Full Name</label>
                        <div className="relative">
                            <Users className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={16} />
                            <input 
                                type="text" 
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="Operator Name" 
                                className="w-full bg-gray-50 border border-transparent rounded-xl py-3.5 pl-12 pr-4 outline-none focus:bg-white focus:border-[#0E71EB] transition-all text-sm font-medium"
                                required
                            />
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Email Address</label>
                        <div className="relative">
                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={16} />
                            <input 
                                type="email" 
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="name@company.com" 
                                className="w-full bg-gray-50 border border-transparent rounded-xl py-3.5 pl-12 pr-4 outline-none focus:bg-white focus:border-[#0E71EB] transition-all text-sm font-medium"
                                required
                            />
                        </div>
                    </div>
                </div>

                <button 
                  type="submit"
                  disabled={isLoading || !name || !email || !meetingId || !passcode}
                  className="w-full py-4 rounded-xl font-bold text-sm bg-[#0E71EB] text-white flex items-center justify-center gap-3 transition-all active:scale-[0.98] shadow-lg shadow-blue-500/10 disabled:opacity-40 disabled:shadow-none mt-6 group"
                >
                    {isLoading ? (
                        <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                    ) : (
                        <>Join Session <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" /></>
                    )}
                </button>
            </form>
        </motion.div>
    );
};
