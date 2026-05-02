import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Check, Copy, PlusCircle, Users, AlertCircle, ArrowRight, Calendar, Clock, ShieldCheck } from 'lucide-react';

interface HostFormProps {
    handleCreate: (e: React.FormEvent) => void;
    isLoading: boolean;
    error: string | null;
    name: string;
    setName: (val: string) => void;
    email: string;
    setEmail: (val: string) => void;
    isCreated: boolean;
    inviteDetails: { id: string, code: string, link: string } | null;
    isCopied: boolean;
    copyToClipboard: () => void;
    onReset: () => void;
    mode: 'instant' | 'scheduled';
    setMode: (val: 'instant' | 'scheduled') => void;
    scheduledDate: string;
    setScheduledDate: (val: string) => void;
    scheduledTime: string;
    setScheduledTime: (val: string) => void;
}

export const HostForm: React.FC<HostFormProps> = ({ 
    handleCreate, isLoading, error, 
    name, setName, email, setEmail,
    isCreated, inviteDetails, isCopied, copyToClipboard, onReset,
    mode, setMode, scheduledDate, setScheduledDate, scheduledTime, setScheduledTime
}) => {

    return (
        <AnimatePresence mode="wait">
            {!isCreated ? (
                <motion.div 
                    key="create-form"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="space-y-6"
                >
                    <div className="space-y-3">
                        <h2 className="text-3xl font-bold text-gray-900 tracking-tight text-left">Host a Secure Room.</h2>
                        <p className="text-gray-500 text-sm leading-relaxed max-w-[380px]">
                            Initialize an encrypted workspace with automated speaker identification.
                        </p>
                    </div>

                    <div className="flex bg-gray-100 p-1 rounded-xl w-full">
                        <button
                            onClick={() => setMode('instant')}
                            className={`flex-1 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all gap-2 flex items-center justify-center ${mode === 'instant' ? 'bg-white text-gray-900 shadow-sm border border-gray-100' : 'text-gray-400'}`}
                        >
                            <ShieldCheck size={14} /> Instant
                        </button>
                        <button
                            onClick={() => setMode('scheduled')}
                            className={`flex-1 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all gap-2 flex items-center justify-center ${mode === 'scheduled' ? 'bg-white text-gray-900 shadow-sm border border-gray-100' : 'text-gray-400'}`}
                        >
                            <Calendar size={14} /> Scheduled
                        </button>
                    </div>

                    <form onSubmit={handleCreate} className="space-y-4">
                        {error && (
                            <div className="p-4 rounded-xl bg-red-50 border border-red-100 text-red-600 text-[10px] font-bold uppercase tracking-wider flex items-center gap-2.5">
                                <AlertCircle size={14} /> {error}
                            </div>
                        )}

                        <div className="space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-1.5 text-left">
                                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Full Name</label>
                                    <div className="relative">
                                        <Users className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={16} />
                                        <input 
                                            type="text" 
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            placeholder="John Doe" 
                                            className="w-full bg-gray-50 border border-transparent rounded-xl py-3.5 pl-12 pr-4 outline-none focus:bg-white focus:border-[#0E71EB] transition-all text-sm font-medium"
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="space-y-1.5 text-left">
                                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Email</label>
                                    <div className="relative">
                                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={16} />
                                        <input 
                                            type="email" 
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            placeholder="john@company.com" 
                                            className="w-full bg-gray-50 border border-transparent rounded-xl py-3.5 pl-12 pr-4 outline-none focus:bg-white focus:border-[#0E71EB] transition-all text-sm font-medium"
                                            required
                                        />
                                    </div>
                                </div>
                            </div>

                            {mode === 'scheduled' && (
                                <motion.div 
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    className="grid grid-cols-2 gap-4 pt-2"
                                >
                                    <div className="space-y-1.5 text-left">
                                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Date</label>
                                        <div className="relative">
                                            <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={16} />
                                            <input 
                                                type="date" 
                                                value={scheduledDate}
                                                onChange={(e) => setScheduledDate(e.target.value)}
                                                className="w-full bg-gray-50 border border-transparent rounded-xl py-3.5 pl-12 pr-4 outline-none focus:bg-white focus:border-[#0E71EB] transition-all text-sm font-medium"
                                                required
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-1.5 text-left">
                                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Time</label>
                                        <div className="relative">
                                            <Clock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={16} />
                                            <input 
                                                type="time" 
                                                value={scheduledTime}
                                                onChange={(e) => setScheduledTime(e.target.value)}
                                                className="w-full bg-gray-50 border border-transparent rounded-xl py-3.5 pl-12 pr-4 outline-none focus:bg-white focus:border-[#0E71EB] transition-all text-sm font-medium"
                                                required
                                            />
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </div>

                        <div className="pt-4 p-4 rounded-2xl bg-blue-50/50 border border-blue-100/50 flex items-start gap-4 text-left">
                            <div className="p-2 rounded-lg bg-white border border-blue-100 text-[#0E71EB]">
                                <ShieldCheck size={18} />
                            </div>
                            <div>
                                <h4 className="text-[10px] font-black uppercase tracking-widest text-[#0E71EB] mb-1">Security Enforcement</h4>
                                <p className="text-[11px] text-blue-800/70 leading-relaxed">
                                    {mode === 'instant' 
                                        ? "Room ID and a unique 4-digit numeric passcode will be generated instantly for your session."
                                        : "A unique invitation link with an embedded security token will be generated for your scheduled time."}
                                </p>
                            </div>
                        </div>

                        <button 
                            type="submit"
                            disabled={isLoading || !name || !email || (mode === 'scheduled' && (!scheduledDate || !scheduledTime))}
                            className="w-full py-4 rounded-xl font-bold text-sm bg-[#0E71EB] text-white flex items-center justify-center gap-3 transition-all active:scale-[0.98] shadow-lg shadow-blue-500/10 disabled:opacity-40 disabled:shadow-none mt-6 group"
                        >
                            {isLoading ? (
                                <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                            ) : (
                                <>{mode === 'instant' ? 'Start Session Now' : 'Schedule Session'} <PlusCircle size={18} /></>
                            )}
                        </button>
                    </form>
                </motion.div>
            ) : (
                <motion.div 
                    key="created-success"
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="space-y-8"
                >
                    <div className="p-6 bg-emerald-50 rounded-2xl border border-emerald-100 flex items-center gap-5">
                        <div className="w-12 h-12 bg-emerald-500 rounded-xl flex items-center justify-center text-white shadow-lg shadow-emerald-500/10">
                            <Check size={24} />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-gray-900 tracking-tight">Meeting Secure</h2>
                            <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest mt-0.5">Access Generated</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-left">
                        <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                            <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest block mb-1">ID</span>
                            <span className="text-lg font-bold text-gray-900 tracking-widest uppercase">{inviteDetails?.id}</span>
                        </div>
                        <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                            <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Passcode</span>
                            <span className="text-lg font-bold text-[#0E71EB] tracking-widest">{inviteDetails?.code}</span>
                        </div>
                    </div>

                    <div className="space-y-2.5 text-left">
                        <div className="flex items-center justify-between ml-1">
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Invitation Link</span>
                            {isCopied && <span className="text-[8px] font-black text-emerald-600 uppercase">Copied!</span>}
                        </div>
                        <div className="flex items-center gap-2 bg-gray-50 p-2 rounded-xl border border-gray-100">
                            <span className="text-xs text-gray-500 truncate flex-grow pl-2 font-medium">{inviteDetails?.link}</span>
                            <button 
                                onClick={copyToClipboard}
                                className={`p-2.5 rounded-lg transition-all active:scale-90 ${isCopied ? 'bg-emerald-500 text-white' : 'bg-gray-800 text-white hover:bg-black'}`}
                            >
                                {isCopied ? <Check size={16} /> : <Copy size={16} />}
                            </button>
                        </div>
                    </div>

                    <button 
                        onClick={onReset}
                        className="w-full py-4 rounded-xl font-bold text-sm bg-[#0E71EB] text-white shadow-lg shadow-blue-500/10 active:scale-95 transition-all text-center flex items-center justify-center gap-2"
                    >
                        Proceed To Room <ArrowRight size={18} />
                    </button>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
