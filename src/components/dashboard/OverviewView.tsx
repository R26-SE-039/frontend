import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import { MenuCard } from './MenuCard';

interface OverviewViewProps {
  userName: string;
  projectName: string;
  agileRole: string;
  navItems: any[];
  onModuleSelect: (id: any) => void;
}

export const OverviewView: React.FC<OverviewViewProps> = ({ 
  userName, 
  projectName, 
  agileRole, 
  navItems, 
  onModuleSelect 
}) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="space-y-10"
    >
      <div className="p-6 rounded-3xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white relative overflow-hidden shadow-xl shadow-blue-500/20">
        <div className="relative z-10 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-black mb-1 tracking-tight">Empowering Agile Intelligence.</h2>
            <p className="text-blue-200/80 text-[11px] font-bold uppercase tracking-widest">
              Welcome back, <span className="text-white">{userName.split(' ')[0]}</span> • Workspace: <span className="text-white">"{projectName}"</span> • Role: <span className="text-white">{agileRole}</span>
            </p>
          </div>
          <div className="hidden md:flex gap-4">
            <div className="px-4 py-2 bg-white/10 rounded-xl border border-white/20 backdrop-blur-md">
              <p className="text-[10px] font-black text-blue-200/60 uppercase mb-1">Active Modules</p>
              <p className="text-sm font-black text-white">{navItems.length.toString().padStart(2, '0')} Units</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {navItems.map((item, idx) => (
          <MenuCard
            key={item.id}
            title={item.label}
            description={
              item.id === 'meeting' ? 'Real-time AI story generation for meetings.' :
              item.id === 'file-rag' ? 'Extract stories from existing transcripts.' :
              item.id === 'test-case' ? 'Auto-generate validation steps.' :
              item.id === 'test-script' ? 'Create executable test code.' :
              item.id === 'self-healing' ? 'Fix broken automation scripts.' : 'Complete traceability matrix.'
            }
            icon={item.icon}
            onClick={() => onModuleSelect(item.id)}
            color={item.color}
            delay={idx * 0.1}
          />
        ))}
      </div>
    </motion.div>
  );
};
