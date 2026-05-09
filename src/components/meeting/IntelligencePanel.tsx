import React, { useState } from 'react';
import { Sparkles, Clipboard, Loader2, Target, CheckCircle2, AlertCircle } from 'lucide-react';
import { meetingApi } from '../../api/meetingApi';

interface IntelligencePanelProps {
  meetingId: string;
  onClose: () => void;
}

export const IntelligencePanel: React.FC<IntelligencePanelProps> = ({ meetingId, onClose }) => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleAnalyze = async (type: 'action_items' | 'summary') => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const data = await meetingApi.analyzeMeeting(meetingId, type);
      if (data.status === 'success') {
        setResult(data.analysis);
      } else {
        setError(data.message || 'Analysis failed');
      }
    } catch (err: any) {
      setError(err.message || 'Connection error');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateStories = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      // 1. Fetch the actual transcript from the meeting
      const response = await meetingApi.getTranscript(meetingId);
      
      // 2. Transform into structured RAG payload
      const formattedTranscript = {
        transcript_id: meetingId,
        source: 'meeting_record',
        utterances: response.transcript.map((u: any) => ({
          speaker: u.speaker || 'Unknown',
          text: u.text,
          timestamp_start: u.timestamp_start || 0,
          timestamp_end: u.timestamp_end || 0
        }))
      };

      // 3. Pass it to the RAG service
      const ragData = await meetingApi.generateUserStories(formattedTranscript);
      
      if (ragData.stories && ragData.stories.length > 0) {
        // Format stories for display
        const formatted = ragData.stories.map((s: any) => 
          `**${s.title}**\n${s.story}\n\n*Acceptance Criteria:*\n${s.acceptance_criteria.map((c: string) => `- ${c}`).join('\n')}`
        ).join('\n\n---\n\n');
        setResult(formatted);
      } else {
        setError('No user stories were generated from this meeting.');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to generate stories');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (result) {
      navigator.clipboard.writeText(result);
      // Optional: add a toast here
    }
  };

  return (
    <div className="fixed inset-y-0 right-0 w-full sm:w-96 bg-white shadow-2xl z-50 p-4 sm:p-6 flex flex-col border-l border-gray-100 animate-in slide-in-from-right duration-300">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-200">
            <Sparkles size={20} className="text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900 tracking-tight">AI Intelligence</h2>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">RAG Engine Active</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-2 hover:bg-gray-100 rounded-lg text-gray-400 transition-colors"
        >
          <div className="w-5 h-5 flex items-center justify-center">✕</div>
        </button>
      </div>

      <div className="space-y-6 overflow-y-auto pr-2 custom-scrollbar flex-grow">
        {/* Actions Section */}
        <section className="space-y-3">
          <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1">Available Actions</h3>
          <button
            disabled={loading}
            onClick={() => handleAnalyze('action_items')}
            className="w-full group flex items-center justify-between p-4 rounded-2xl border border-indigo-100 bg-indigo-50/30 hover:bg-indigo-50 transition-all text-left disabled:opacity-50"
          >
            <div className="flex items-center gap-3">
              <Target size={18} className="text-indigo-600" />
              <span className="text-sm font-bold text-indigo-900">Extract Action Items</span>
            </div>
            {loading ? <Loader2 size={16} className="text-indigo-600 animate-spin" /> : <div className="w-2 h-2 rounded-full bg-indigo-400" />}
          </button>

          <button
            disabled={loading}
            onClick={handleGenerateStories}
            className="w-full group flex items-center justify-between p-4 rounded-2xl border border-purple-100 bg-purple-50/30 hover:bg-purple-50 transition-all text-left disabled:opacity-50"
          >
            <div className="flex items-center gap-3">
              <Sparkles size={18} className="text-purple-600" />
              <span className="text-sm font-bold text-purple-900">Generate User Stories</span>
            </div>
            {loading ? <Loader2 size={16} className="text-purple-600 animate-spin" /> : <div className="w-2 h-2 rounded-full bg-purple-400" />}
          </button>
        </section>

        {/* Results Area */}
        <div className="flex-grow flex flex-col min-h-0">
          {loading && (
            <div className="flex-grow flex flex-col items-center justify-center py-12 text-center">
              <div className="relative mb-4">
                <div className="w-12 h-12 rounded-full border-4 border-indigo-100 border-t-indigo-600 animate-spin" />
                <Sparkles size={16} className="absolute inset-0 m-auto text-indigo-600 animate-pulse" />
              </div>
              <p className="text-sm font-bold text-gray-900">Consulting RAG Engine...</p>
              <p className="text-xs text-gray-400 mt-1 max-w-[200px]">Semantically analyzing transcript for task patterns.</p>
            </div>
          )}

          {error && (
            <div className="p-4 rounded-2xl bg-red-50 border border-red-100 text-center animate-in fade-in zoom-in">
              <AlertCircle size={24} className="text-red-500 mx-auto mb-2" />
              <p className="text-sm font-bold text-red-900">{error}</p>
              <button
                onClick={() => setError(null)}
                className="mt-3 text-xs font-bold text-red-600 hover:text-red-700 underline"
              >
                Dismiss
              </button>
            </div>
          )}

          {result && !loading && (
            <div className="flex flex-col h-full animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex items-center justify-between mb-3 px-1">
                <div className="flex items-center gap-2 text-emerald-600">
                  <CheckCircle2 size={16} />
                  <span className="text-xs font-bold uppercase tracking-widest">Extracted Results</span>
                </div>
                <button
                  onClick={copyToClipboard}
                  className="flex items-center gap-1.5 text-[10px] font-bold text-gray-400 hover:text-indigo-600 transition-colors"
                >
                  <Clipboard size={14} /> Copy
                </button>
              </div>
              <div className="flex-grow bg-gray-50 rounded-2xl border border-gray-100 p-4 text-gray-700 text-sm leading-relaxed overflow-y-auto whitespace-pre-wrap font-medium">
                {result}
              </div>
            </div>
          )}

          {!loading && !result && !error && (
            <div className="flex-grow flex flex-col items-center justify-center py-12 text-center opacity-40">
              <Target size={40} className="text-gray-300 mb-4" />
              <p className="text-sm font-bold text-gray-400">Ready for Analysis</p>
              <p className="text-xs text-gray-300 mt-1">Select an action above to begin.</p>
            </div>
          )}
        </div>
      </div>

      <div className="mt-auto pt-6 border-t border-gray-100">
        <div className="p-4 rounded-2xl bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-100">
          <p className="text-[10px] font-black text-gray-400 uppercase mb-2 tracking-widest">How it works</p>
          <p className="text-[11px] text-gray-500 leading-relaxed">
            The system uses <span className="text-indigo-600 font-bold">Semantic Search</span> to find task-related segments and an LLM to extract structured items.
          </p>
        </div>
      </div>
    </div>
  );
};
