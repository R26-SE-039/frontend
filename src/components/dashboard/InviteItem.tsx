import React from 'react';
import { Copy } from 'lucide-react';

interface InviteItemProps {
  label: string;
  value: string;
  onCopy: () => void;
}

export const InviteItem: React.FC<InviteItemProps> = ({ label, value, onCopy }) => (
  <div className="bg-white p-5 rounded-2xl border border-blue-100 flex justify-between items-center group cursor-pointer hover:shadow-md transition-all" onClick={onCopy}>
    <div>
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</p>
      <p className="text-xl font-black text-slate-900 tracking-widest font-mono">{value}</p>
    </div>
    <div className="text-blue-500 opacity-40 group-hover:opacity-100 transition-opacity">
      <Copy size={20} />
    </div>
  </div>
);
