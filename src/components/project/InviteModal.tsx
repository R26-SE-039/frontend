import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Mail, Link, Copy, Check, Send, Users, ShieldCheck, Globe } from 'lucide-react';

interface InviteModalProps {
  projectName: string;
  onClose: () => void;
}

export const InviteModal: React.FC<InviteModalProps> = ({ projectName, onClose }) => {
  const [activeTab, setActiveTab] = useState<'email' | 'link'>('email');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'Editor' | 'Viewer' | 'Admin'>('Editor');
  const [isCopied, setIsCopied] = useState(false);
  const [isSent, setIsSent] = useState(false);

  const inviteLink = `https://nextgenqa.ai/join/${Math.random().toString(36).substring(7)}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(inviteLink);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSent(true);
    setTimeout(() => {
      setIsSent(false);
      setEmail('');
    }, 3000);
  };

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" 
      />
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.98, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.98, y: 10 }}
        className="relative w-full max-w-lg bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden"
      >
        <div className="p-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <div className="w-11 h-11 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600">
                <Users size={22} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900 tracking-tight">Invite to Team</h2>
                <p className="text-slate-400 text-[9px] font-bold uppercase tracking-widest">Project: {projectName}</p>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="p-2 hover:bg-slate-50 rounded-lg text-slate-400 hover:text-slate-600 transition-all"
            >
              <X size={18} />
            </button>
          </div>

          {/* Tab Switcher */}
          <div className="flex bg-slate-100 p-1 rounded-lg mb-8">
            <button 
              onClick={() => setActiveTab('email')}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-md text-[10px] font-bold uppercase tracking-widest transition-all ${activeTab === 'email' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              <Mail size={12} />
              Via Email
            </button>
            <button 
              onClick={() => setActiveTab('link')}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-md text-[10px] font-bold uppercase tracking-widest transition-all ${activeTab === 'link' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              <Link size={12} />
              Invite Link
            </button>
          </div>

          <AnimatePresence mode="wait">
            {activeTab === 'email' ? (
              <motion.form 
                key="email"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                onSubmit={handleSend}
                className="space-y-6"
              >
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Email Address</label>
                  <div className="relative">
                    <input 
                      type="email" 
                      required
                      placeholder="teammate@company.com"
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg py-3 pl-11 pr-4 outline-none focus:bg-white focus:ring-2 focus:ring-slate-200 transition-all font-medium text-slate-700 text-sm"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                    <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Assigned Role</label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['Viewer', 'Editor', 'Admin'] as const).map((r) => (
                      <button
                        key={r}
                        type="button"
                        onClick={() => setRole(r)}
                        className={`py-2 rounded-lg text-[9px] font-bold uppercase tracking-widest border transition-all ${role === r ? 'bg-slate-900 border-slate-900 text-white shadow-md shadow-slate-200' : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'}`}
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                </div>

                <button 
                  type="submit"
                  disabled={isSent}
                  className={`w-full py-3.5 rounded-lg font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-3 transition-all active:scale-95 shadow-md ${isSent ? 'bg-emerald-600 text-white shadow-emerald-100' : 'bg-slate-900 text-white shadow-slate-200 hover:bg-blue-600'}`}
                >
                  {isSent ? (
                    <>
                      <Check size={18} />
                      Invitation Sent
                    </>
                  ) : (
                    <>
                      <Send size={18} />
                      Send Invitation
                    </>
                  )}
                </button>
              </motion.form>
            ) : (
              <motion.div 
                key="link"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="space-y-6"
              >
                <div className="p-6 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-500 shadow-sm">
                      <Globe size={14} />
                    </div>
                    <span className="text-[10px] font-bold text-slate-900 uppercase tracking-widest">Shareable Workspace Link</span>
                  </div>
                  <p className="text-xs text-slate-500 font-medium leading-relaxed mb-6">
                    Anyone with this link will be able to join the project as an <span className="text-slate-900 font-bold underline decoration-blue-200">Editor</span>.
                  </p>
                  
                  <div className="flex items-center gap-2 p-1.5 bg-white rounded-lg border border-slate-200 shadow-sm group focus-within:ring-2 focus-within:ring-slate-100 transition-all">
                    <input 
                      readOnly
                      value={inviteLink}
                      className="bg-transparent border-none outline-none text-xs font-mono text-slate-400 px-3 w-full overflow-hidden text-ellipsis"
                    />
                    <button 
                      onClick={handleCopy}
                      className={`flex items-center gap-2 px-4 py-2 rounded-md text-[9px] font-bold uppercase tracking-widest transition-all ${isCopied ? 'bg-emerald-600 text-white' : 'bg-slate-900 text-white hover:bg-blue-600'}`}
                    >
                      {isCopied ? (
                        <>
                          <Check size={12} />
                          Copied
                        </>
                      ) : (
                        <>
                          <Copy size={12} />
                          Copy
                        </>
                      )}
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-4 p-4 rounded-lg bg-slate-50 border border-slate-200">
                  <ShieldCheck size={16} className="text-slate-400" />
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest leading-normal">
                    The link will expire in 7 days or after 10 uses.
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
};
