import React, { useState, useRef } from 'react';
import { Upload, FileText, Sparkles, Loader2, CheckCircle2, AlertCircle, Clipboard, ChevronRight, ArrowRight, Trash2, Info, Download, FileJson, Table, Printer } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ragApi, GeneratedStory } from '../../api/ragApi';

export const FileStoryGenerator: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [stories, setStories] = useState<GeneratedStory[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.name.endsWith('.txt')) {
        setFile(selectedFile);
        setError(null);
      } else {
        setError('Please upload a valid .txt transcript file.');
        setFile(null);
      }
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setLoading(true);
    setError(null);
    setStories(null);

    try {
      const query = "Generate comprehensive user stories based on this transcript.";
      const data = await ragApi.uploadTranscript(file, query);

      if (data.stories && data.stories.length > 0) {
        setStories(data.stories);
      } else {
        setError("The RAG engine couldn't identify any clear user stories from the uploaded file.");
      }
    } catch (err: any) {
      setError(err.message || 'Failed to process transcript');
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
    if (!stories || !file) return;
    const blob = new Blob([JSON.stringify(stories, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${file.name.replace('.txt', '')}_stories.json`;
    a.click();
  };

  const exportToCSV = () => {
    if (!stories || !file) return;
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
    a.download = `${file.name.replace('.txt', '')}_stories.csv`;
    a.click();
  };

  const downloadAsTxt = () => {
    if (!stories || !file) return;
    const text = stories.map(s =>
      `Title: ${s.title}\nStory: ${s.story}\nCriteria:\n${s.acceptance_criteria.map(ac => `- ${ac}`).join('\n')}`
    ).join('\n\n---\n\n');
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${file.name.replace('.txt', '')}_stories.txt`;
    a.click();
  };

  const reset = () => {
    setFile(null);
    setStories(null);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="w-full max-w-7xl mx-auto h-full flex flex-col space-y-8 animate-in fade-in duration-500">
      <div className="space-y-2">
        <h2 className="text-3xl font-black text-gray-900 tracking-tight">Transcript to Story Hub</h2>
        <p className="text-gray-400 text-sm font-medium">Transform raw meeting transcripts into structured, ready-to-code user stories.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 flex-grow">
        {/* Left Column: Control Panel */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white rounded-xl  border border-gray-100 p-8 shadow-sm space-y-6 sticky top-8">
            <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest">Control Panel</h3>

            <div
              onClick={() => fileInputRef.current?.click()}
              className={`relative border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center transition-all cursor-pointer group
                ${file ? 'border-emerald-200 bg-emerald-50/30' : 'border-gray-100 hover:border-indigo-200 hover:bg-indigo-50/20'}`}
            >
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept=".txt"
                className="hidden"
              />

              <div className={`w-14 h-14 rounded-lg flex items-center justify-center mb-4 transition-all group-hover:scale-110 shadow-sm
                ${file ? 'bg-emerald-100 text-emerald-600' : 'bg-gray-50 text-gray-400 group-hover:bg-indigo-100 group-hover:text-indigo-600'}`}>
                {file ? <FileText size={28} /> : <Upload size={28} />}
              </div>

              <div className="text-center">
                <p className="text-sm font-bold text-gray-900 truncate max-w-[180px]">
                  {file ? file.name : 'Upload .txt'}
                </p>
                <p className="text-[10px] text-gray-400 mt-1 uppercase font-black tracking-tighter">
                  {file ? 'Click to change' : 'Drag or click'}
                </p>
              </div>
            </div>

            {error && (
              <div className="p-4 rounded-xl bg-red-50 border border-red-100 text-red-600 text-[10px] font-black uppercase tracking-wider flex items-center gap-3">
                <AlertCircle size={14} className="shrink-0" /> {error}
              </div>
            )}

            <div className="space-y-3">
              <button
                disabled={!file || loading}
                onClick={handleUpload}
                className="w-full py-4 rounded-lg bg-gray-900 text-white text-sm font-bold flex items-center justify-center gap-3 hover:bg-black transition-all active:scale-[0.98] shadow-xl shadow-gray-200 disabled:opacity-30"
              >
                {loading ? <Loader2 size={18} className="animate-spin" /> : <Sparkles size={18} />}
                {loading ? 'Processing...' : 'Generate Stories'}
              </button>

              <button
                onClick={reset}
                className="w-full py-3 rounded-lg border border-gray-100 text-gray-400 text-xs font-bold hover:text-red-500 hover:bg-red-50 transition-all flex items-center justify-center gap-2"
              >
                <Trash2 size={14} /> Reset View
              </button>
            </div>

            <div className="pt-6 border-t border-gray-50">
              <div className="flex items-center gap-2 mb-2 text-indigo-600">
                <Info size={14} />
                <span className="text-[10px] font-black uppercase tracking-widest">Smart Analysis</span>
              </div>
              <p className="text-[10px] text-gray-400 leading-relaxed font-medium">
                Our AI automatically scans your meeting notes to identify key requirements and organizes them into clear, ready-to-use user stories.
              </p>
            </div>
          </div>
        </div>

        {/* Right Column: Results Display */}
        <div className="lg:col-span-8 min-h-[600px] flex flex-col">
          <div className="bg-gray-50/50 rounded-xl border border-gray-100 flex-grow relative overflow-hidden flex flex-col">
            <AnimatePresence mode="wait">
              {loading ? (
                <motion.div
                  key="loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 flex flex-col items-center justify-center text-center p-12"
                >
                  <div className="relative mb-8">
                    <div className="w-24 h-24 rounded-full border-8 border-indigo-100 border-t-indigo-600 animate-spin" />
                    <Sparkles size={32} className="absolute inset-0 m-auto text-indigo-600 animate-pulse" />
                  </div>
                  <h3 className="text-2xl font-black text-gray-900 mb-2">Analyzing Context...</h3>
                  <p className="text-gray-400 max-w-sm font-medium">Mapping transcript utterances to product features and agile requirement patterns.</p>
                </motion.div>
              ) : stories ? (
                <motion.div
                  key="results"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex flex-col h-full"
                >
                  <div className="flex items-center justify-between p-2 border-b border-gray-100 bg-white/50 backdrop-blur-md sticky top-0 z-10">
                    <div className="flex items-center gap-3">
                    </div>
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
                  </div>

                  <div className="flex-grow overflow-y-auto p-8 space-y-6 custom-scrollbar">
                    {stories.map((story) => (
                      <div key={story.story_id} className="p-8 bg-white rounded-[32px] border border-gray-100 shadow-[0_4px_24px_rgba(0,0,0,0.02)] hover:border-indigo-200 transition-all group relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-8">
                          <span className={`text-[9px] px-3 py-1 rounded-full font-black uppercase tracking-widest ${story.priority === 'Must' ? 'bg-red-50 text-red-600' :
                            story.priority === 'Should' ? 'bg-amber-50 text-amber-600' : 'bg-blue-50 text-blue-600'
                            }`}>
                            {story.priority} Priority
                          </span>
                        </div>
                        <h4 className="text-lg font-black text-gray-900 mb-3 max-w-[75%]">{story.title}</h4>
                        <p className="text-sm text-gray-500 mb-8 leading-relaxed font-medium">{story.story}</p>

                        <div className="bg-gray-50/50 rounded-lg p-6 border border-gray-50">
                          <h5 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Acceptance Criteria</h5>
                          <div className="space-y-3">
                            {story.acceptance_criteria.map((ac, idx) => (
                              <div key={idx} className="flex items-start gap-3 text-[11px] text-gray-600 font-semibold">
                                <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-indigo-400 shrink-0" />
                                <span>{ac}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="absolute inset-0 flex flex-col items-center justify-center text-center p-12 opacity-30"
                >
                  <div className="w-32 h-32 rounded-[40px] bg-gray-100 flex items-center justify-center mb-8 border border-gray-200 shadow-inner">
                    <FileText size={64} className="text-gray-300" />
                  </div>
                  <h3 className="text-2xl font-black text-gray-900 mb-2">No Results Yet</h3>
                  <p className="text-gray-500 max-w-sm font-medium italic">Upload a transcript in the control panel and click "Generate Stories" to view insights here.</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
};
