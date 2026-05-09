import React from 'react';

interface PlaceholderViewProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
}

export const PlaceholderView: React.FC<PlaceholderViewProps> = ({ title, description, icon, color }) => {
  const colorMap: Record<string, string> = {
    blue: 'text-blue-500 bg-blue-50',
    purple: 'text-purple-500 bg-purple-50',
    indigo: 'text-indigo-500 bg-indigo-50',
    emerald: 'text-emerald-500 bg-emerald-50',
    rose: 'text-rose-500 bg-rose-50',
    amber: 'text-amber-500 bg-amber-50',
  };

  return (
    <div className="flex flex-col items-center justify-center py-24 text-center space-y-8 animate-in fade-in zoom-in-95 duration-500 max-w-3xl mx-auto">
      <div className={`w-32 h-32 rounded-[2.5rem] flex items-center justify-center shadow-inner ${colorMap[color] || colorMap.blue}`}>
        {React.cloneElement(icon as React.ReactElement, { size: 64 } as any)}
      </div>
      <div className="space-y-3">
        <h3 className="text-4xl font-black text-slate-900 tracking-tight">{title}</h3>
        <p className="text-slate-400 text-lg font-medium leading-relaxed">{description}</p>
      </div>
      <div className="px-8 py-3 rounded-2xl bg-slate-900 text-white text-[10px] font-black uppercase tracking-[0.3em] shadow-2xl shadow-slate-900/20">
        Module Under Deployment
      </div>
    </div>
  );
};
