import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Users, Mail, Shield, Check, Info } from 'lucide-react';

interface CreateProjectModalProps {
  onClose: () => void;
  onCreate: (name: string, description: string, invitedEmails: string[]) => void;
}

export const CreateProjectModal: React.FC<CreateProjectModalProps> = ({ onClose, onCreate }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [invitedEmails, setInvitedEmails] = useState<string[]>(['']);

  const addEmailField = () => setInvitedEmails([...invitedEmails, '']);
  const updateEmailField = (index: number, value: string) => {
    const newEmails = [...invitedEmails];
    newEmails[index] = value;
    setInvitedEmails(newEmails);
  };
  const removeEmailField = (index: number) => {
    setInvitedEmails(invitedEmails.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onCreate(name, description, invitedEmails.filter(email => email.trim() !== ''));
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
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
        className="relative w-full max-w-xl bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden"
      >
        <div className="p-8">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <div className="w-11 h-11 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 border border-blue-100">
                <Plus size={22} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900 tracking-tight">New Project</h2>
                <p className="text-slate-400 text-[9px] font-bold uppercase tracking-widest">Initialize Workspace</p>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="p-2 hover:bg-slate-50 rounded-lg text-slate-400 hover:text-slate-600 transition-all"
            >
              <X size={18} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Core Info */}
            <div className="grid grid-cols-1 gap-6">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Project Name</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g., Enterprise RAG Engine"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg py-3 px-4 outline-none focus:bg-white focus:ring-2 focus:ring-blue-100 transition-all font-medium text-slate-700 text-sm"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Description</label>
                <textarea 
                  rows={2}
                  required
                  placeholder="What is this project about?"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg py-3 px-4 outline-none focus:bg-white focus:ring-2 focus:ring-blue-100 transition-all font-medium text-slate-700 text-sm resize-none"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
            </div>

            {/* Invite Members Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users size={16} className="text-slate-400" />
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Invite Team Members</label>
                </div>
                <button 
                  type="button"
                  onClick={addEmailField}
                  className="text-[10px] font-bold text-blue-600 hover:text-blue-700 uppercase tracking-widest"
                >
                  + Add Another
                </button>
              </div>

              <div className="space-y-3 max-h-40 overflow-y-auto pr-2 custom-scrollbar">
                {invitedEmails.map((email, idx) => (
                  <div key={idx} className="flex gap-2">
                    <div className="relative flex-grow">
                      <input 
                        type="email"
                        placeholder="colleague@company.com"
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2.5 pl-10 pr-4 outline-none focus:bg-white focus:ring-2 focus:ring-blue-100 transition-all font-medium text-slate-600 text-xs"
                        value={email}
                        onChange={(e) => updateEmailField(idx, e.target.value)}
                      />
                      <Mail size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-300" />
                    </div>
                    {invitedEmails.length > 1 && (
                      <button 
                        type="button"
                        onClick={() => removeEmailField(idx)}
                        className="p-2.5 text-slate-300 hover:text-rose-500 transition-colors"
                      >
                        <X size={16} />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 flex items-start gap-3">
                <Info size={14} className="text-blue-500 mt-0.5 shrink-0" />
                <p className="text-[9px] text-slate-500 font-medium leading-relaxed">
                  Invited members will receive an email with access to this workspace as <span className="font-bold text-slate-700">Editors</span>. You can change permissions later in settings.
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 justify-end pt-4 border-t border-slate-100">
              <button 
                type="button"
                onClick={onClose}
                className="px-6 py-2.5 rounded-lg font-bold text-xs text-slate-500 hover:bg-slate-50 transition-all"
              >
                Cancel
              </button>
              <button 
                type="submit"
                className="px-8 py-2.5 bg-slate-900 text-white rounded-lg font-bold text-xs uppercase tracking-widest hover:bg-blue-600 transition-all shadow-md shadow-slate-200 flex items-center gap-2"
              >
                Initialize Project
                <Check size={14} />
              </button>
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  );
};
