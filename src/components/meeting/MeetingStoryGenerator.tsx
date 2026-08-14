import React, { useState, useEffect } from 'react';
import { FileText, Sparkles, Loader2, CheckCircle2, AlertCircle, Clipboard, ArrowLeft, Download, FileJson, Table, Printer } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { meetingApi } from '../../api/meetingApi';
import { GeneratedStory } from '../../api/ragApi';
import { useMeetingStore } from '../../store/useMeetingStore';

interface MeetingStoryGeneratorProps {
  meetingId: string;
  onBack: () => void;
}

export const MeetingStoryGenerator: React.FC<MeetingStoryGeneratorProps> = ({ meetingId, onBack }) => {
  const [loading, setLoading] = useState(true);
  const [stories, setStories] = useState<GeneratedStory[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    handleGenerateStories();
  }, [meetingId]);

  const handleGenerateStories = async () => {
    setLoading(true);
    setError(null);
    setStories(null);

    try {
      // Pass it to the finalized requirements story generator endpoint
      const ragData = await meetingApi.generateStoriesFromRequirements(meetingId);
      
      if (ragData.stories && ragData.stories.length > 0) {
        setStories(ragData.stories);
      } else {
        setError('No user stories were generated from this meeting\'s requirements.');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to generate stories');
    } finally {
      setLoading(false);
    }
  };

  const copyAllStories = () => {
    if (!stories) return;
    const text = stories.map(s =>
      `Title: ${s.title}\nStory: ${s.story}\nCriteria:\n${s.acceptance_criteria.map(ac => `- ${ac}`).join('\n')}`
    ).join('\n\n---\n\n');
    navigator.clipboard.writeText(text);
  };

  const exportToJSON = () => {
    if (!stories) return;
    const blob = new Blob([JSON.stringify(stories, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `meeting_${meetingId}_stories.json`;
    a.click();
  };

  const exportToCSV = () => {
    if (!stories) return;
    const headers = ['Story ID', 'Title', 'Story', 'Priority', 'Acceptance Criteria'];
    const rows = stories.map(s => [
      s.story_id,
      s.title,
      s.story,
      s.priority,
      s.acceptance_criteria.join('; ')
    ]);
    const csvContent = [headers, ...rows].map(e => e.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `meeting_${meetingId}_stories.csv`;
    a.click();
  };

  const downloadAsTxt = () => {
    if (!stories) return;
    const text = stories.map(s =>
      `Title: ${s.title}\nStory: ${s.story}\nCriteria:\n${s.acceptance_criteria.map(ac => `- ${ac}`).join('\n')}`
    ).join('\n\n---\n\n');
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `meeting_${meetingId}_stories.txt`;
    a.click();
  };

  return (
    <div className="fixed inset-0 z-[120] bg-white flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom duration-500">
      {/* Premium Header */}
      <div className="border-b border-gray-100 bg-white/80 backdrop-blur-md px-8 py-6 flex items-center justify-between sticky top-0 z-20">
        <div className="flex items-center gap-6">
          <button 
            onClick={onBack}
            className="p-2 hover:bg-gray-50 rounded-xl text-gray-400 hover:text-gray-900 transition-all active:scale-95 border border-transparent hover:border-gray-100"
          >
            <ArrowLeft size={24} />
          </button>
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
                <Sparkles size={18} />
              </div>
              <h2 className="text-xl font-black text-gray-900 tracking-tight">Meeting Intelligence Hub</h2>
            </div>
            <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Session: {meetingId}</p>
          </div>
        </div>

        {stories && (
          <div className="flex gap-2">
            <button
              onClick={copyAllStories}
              className="p-2.5 rounded-xl bg-white border border-gray-100 text-gray-400 hover:text-indigo-600 hover:border-indigo-100 transition-all shadow-sm"
              title="Copy All"
            >
              <Clipboard size={18} />
            </button>
            <button
              onClick={exportToJSON}
              className="p-2.5 rounded-xl bg-white border border-gray-100 text-gray-400 hover:text-orange-500 hover:border-orange-100 transition-all shadow-sm"
              title="Export JSON"
            >
              <FileJson size={18} />
            </button>
            <button
              onClick={exportToCSV}
              className="p-2.5 rounded-xl bg-white border border-gray-100 text-gray-400 hover:text-emerald-500 hover:border-emerald-100 transition-all shadow-sm"
              title="Export CSV (Excel/Jira)"
            >
              <Table size={18} />
            </button>
            <button
              onClick={downloadAsTxt}
              className="p-2.5 rounded-xl bg-white border border-gray-100 text-gray-400 hover:text-blue-500 hover:border-blue-100 transition-all shadow-sm"
              title="Download TXT"
            >
              <Download size={18} />
            </button>
            <button
              onClick={() => window.print()}
              className="p-2.5 rounded-xl bg-white border border-gray-100 text-gray-400 hover:text-gray-900 hover:border-gray-200 transition-all shadow-sm"
              title="Print Results"
            >
              <Printer size={18} />
            </button>
          </div>
        )}
      </div>

      {/* Main Content Area */}
      <div className="flex-grow overflow-y-auto bg-gradient-to-br from-gray-50 via-white to-indigo-50/20 custom-scrollbar p-8">
        <div className="max-w-5xl mx-auto">
          <AnimatePresence mode="wait">
            {loading ? (
              <motion.div
                key="loading"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="flex flex-col items-center justify-center py-32 text-center"
              >
                <div className="relative mb-8">
                  <div className="w-24 h-24 rounded-3xl border-8 border-indigo-100 border-t-indigo-600 animate-spin" />
                  <Sparkles size={32} className="absolute inset-0 m-auto text-indigo-600 animate-pulse" />
                </div>
                <h3 className="text-3xl font-black text-gray-900 mb-4 tracking-tight">Synthesizing User Stories</h3>
                <p className="text-gray-400 max-w-sm font-medium leading-relaxed">
                  Our RAG engine is analyzing the transcript to map meeting discussions into structured agile requirements.
                </p>
              </motion.div>
            ) : error ? (
              <motion.div
                key="error"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center justify-center py-32 text-center"
              >
                <div className="w-20 h-20 rounded-3xl bg-red-50 flex items-center justify-center text-red-500 mb-6 border border-red-100">
                  <AlertCircle size={40} />
                </div>
                <h3 className="text-2xl font-black text-gray-900 mb-2">Generation Failed</h3>
                <p className="text-red-500 font-bold mb-8">{error}</p>
                <button 
                  onClick={handleGenerateStories}
                  className="px-8 py-3 rounded-2xl bg-gray-900 text-white font-bold hover:bg-black transition-all active:scale-95 shadow-xl shadow-gray-200"
                >
                  Try Again
                </button>
              </motion.div>
            ) : stories ? (
              <motion.div
                key="results"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4 sm:gap-6"
              >
                {stories.map((story, idx) => (
                  <motion.div 
                    key={story.story_id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className="group bg-white rounded-[2.5rem] border border-gray-100 p-8 shadow-sm hover:shadow-xl hover:shadow-indigo-500/5 hover:-translate-y-1 transition-all relative overflow-hidden"
                  >
                    <div className={`absolute top-0 right-0 p-8`}>
                      <span className={`text-[10px] px-4 py-1.5 rounded-full font-black uppercase tracking-widest ${
                        story.priority === 'Must' ? 'bg-red-50 text-red-600' :
                        story.priority === 'Should' ? 'bg-amber-50 text-amber-600' : 'bg-blue-50 text-blue-600'
                      }`}>
                        {story.priority}
                      </span>
                    </div>

                    <div className="mb-8">
                      <div className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center text-gray-400 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors mb-6">
                        <FileText size={24} />
                      </div>
                      <h4 className="text-xl font-black text-gray-900 mb-3 tracking-tight">{story.title}</h4>
                      <p className="text-gray-500 text-sm leading-relaxed font-medium">{story.story}</p>
                    </div>

                    {/* INVEST Quality Assessment Grid */}
                    <div className="mb-6 p-3 rounded-2xl bg-gray-50/70 border border-gray-100 flex items-center justify-between">
                      <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1">
                        <Sparkles size={11} className="text-indigo-500" /> INVEST Quality
                      </span>
                      <div className="flex gap-1">
                        {[
                          { key: 'Independent', label: 'I', desc: 'Independent' },
                          { key: 'Negotiable', label: 'N', desc: 'Negotiable' },
                          { key: 'Valuable', label: 'V', desc: 'Valuable' },
                          { key: 'Estimable', label: 'E', desc: 'Estimable' },
                          { key: 'Small', label: 'S', desc: 'Small' },
                          { key: 'Testable', label: 'T', desc: 'Testable' },
                        ].map((item) => {
                          const isPassed = story.invest_validation 
                            ? (story.invest_validation as any)[item.key] !== false 
                            : true;
                          return (
                            <div
                              key={item.key}
                              title={`${item.desc}: ${isPassed ? 'Passed' : 'Needs Review'}`}
                              className={`w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-black uppercase transition-all cursor-help ${
                                isPassed
                                  ? 'bg-emerald-50 text-emerald-600 border border-emerald-200/60'
                                  : 'bg-red-50 text-red-600 border border-red-200/60'
                              }`}
                            >
                              {item.label}
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <div className="bg-gray-50/50 rounded-3xl p-6 border border-gray-50 group-hover:border-indigo-50 transition-colors">
                      <h5 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                        <CheckCircle2 size={12} className="text-indigo-400" />
                        Acceptance Criteria
                      </h5>
                      <div className="space-y-4">
                        {story.acceptance_criteria.map((ac, acIdx) => (
                          <div key={acIdx} className="flex items-start gap-4 text-[13px] text-gray-600 font-semibold leading-snug">
                            <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-indigo-300 shrink-0 group-hover:bg-indigo-500 transition-colors" />
                            <span>{ac}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};
