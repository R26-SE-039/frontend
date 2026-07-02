import React, { useState } from 'react';
import { Clipboard, CheckCircle2, ChevronDown, ChevronUp, Star, AlertCircle } from 'lucide-react';

interface StoryCardProps {
  title: string;
  story: string;
  priority: string;
  confidence?: number;
  acceptanceCriteria: string[];
}

export const StoryCard: React.FC<StoryCardProps> = ({
  title,
  story,
  priority,
  confidence = 100,
  acceptanceCriteria
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    const text = `**${title}**\n\n${story}\n\n*Acceptance Criteria:*\n${acceptanceCriteria.map(c => `- ${c}`).join('\n')}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getPriorityColor = (p: string) => {
    const pLow = p.toLowerCase();
    if (pLow.includes('high') || pLow.includes('must')) return 'bg-rose-50 text-rose-700 border-rose-200';
    if (pLow.includes('medium') || pLow.includes('should')) return 'bg-amber-50 text-amber-700 border-amber-200';
    return 'bg-emerald-50 text-emerald-700 border-emerald-200';
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow group">
      <div className="p-5">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-grow pr-4">
            <h3 className="text-lg font-bold text-slate-900 leading-tight mb-2">{title}</h3>
            <div className="flex flex-wrap gap-2">
              <span className={`px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-widest border ${getPriorityColor(priority)}`}>
                {priority}
              </span>
              {confidence < 100 && (
                <span className="flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-widest border bg-indigo-50 text-indigo-700 border-indigo-200">
                  <Star size={12} className="text-indigo-500" />
                  {confidence}% Match
                </span>
              )}
            </div>
          </div>
          <button 
            onClick={handleCopy}
            className="flex-shrink-0 p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-colors"
            title="Copy to clipboard"
          >
            {copied ? <CheckCircle2 size={18} className="text-emerald-500" /> : <Clipboard size={18} />}
          </button>
        </div>

        <div className="bg-slate-50 rounded-xl p-4 mb-4 border border-slate-100">
          <p className="text-sm font-medium text-slate-700 leading-relaxed italic">
            "{story}"
          </p>
        </div>

        <div className="space-y-2">
          <div 
            className="flex items-center justify-between cursor-pointer group/ac select-none"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
              Acceptance Criteria
              <span className="bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-md text-[9px]">{acceptanceCriteria.length}</span>
            </h4>
            <div className="text-slate-300 group-hover/ac:text-slate-600 transition-colors">
              {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </div>
          </div>

          {(isExpanded || acceptanceCriteria.length <= 2) && (
            <ul className="space-y-2 mt-2">
              {acceptanceCriteria.map((criteria, idx) => (
                <li key={idx} className="flex items-start gap-3 text-sm text-slate-600">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center text-[10px] font-bold mt-0.5 border border-blue-100">
                    {idx + 1}
                  </span>
                  <span className="font-medium leading-snug">{criteria}</span>
                </li>
              ))}
            </ul>
          )}
          {!isExpanded && acceptanceCriteria.length > 2 && (
            <p className="text-xs font-medium text-slate-400 pl-8">
              + {acceptanceCriteria.length - 2} more criteria...
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
