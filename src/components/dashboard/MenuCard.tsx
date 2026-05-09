import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';

interface MenuCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  onClick: () => void;
  color: string;
  delay?: number;
}

export const MenuCard: React.FC<MenuCardProps> = ({ title, description, icon, onClick, color, delay }) => {
  const colorMap: Record<string, string> = {
    blue: 'text-blue-600 bg-blue-50 border-blue-100 hover:border-blue-200',
    purple: 'text-purple-600 bg-purple-50 border-purple-100 hover:border-purple-200',
    indigo: 'text-indigo-600 bg-indigo-50 border-indigo-100 hover:border-indigo-200',
    emerald: 'text-emerald-600 bg-emerald-50 border-emerald-100 hover:border-emerald-200',
    rose: 'text-rose-600 bg-rose-50 border-rose-100 hover:border-rose-200',
    amber: 'text-amber-600 bg-amber-50 border-amber-100 hover:border-amber-200',
  };

  return (
    <motion.button
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      onClick={onClick}
      className="p-6 rounded-[2rem] border border-slate-100 bg-white text-left transition-all duration-300 group shadow-sm hover:shadow-xl hover:shadow-slate-200/50 hover:-translate-y-1"
    >
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300 ${colorMap[color] || colorMap.blue}`}>
        {icon}
      </div>
      <h3 className="text-base font-black text-slate-900 mb-2 flex items-center justify-between">
        {title}
        <ArrowRight size={16} className="opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-slate-400" />
      </h3>
      <p className="text-[11px] text-slate-400 font-bold leading-relaxed">{description}</p>
    </motion.button>
  );
};
