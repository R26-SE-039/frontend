import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, UploadCloud, Code, Loader2, FileText, AlertCircle, Sparkles 
} from 'lucide-react';
import { ragApi, GeneratedStory, StoryIssue } from '../api/ragApi';
import { StoryCard } from '../components/rag/StoryCard';

export const BacklogPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<'upload' | 'json'>('upload');
  
  // Upload State
  const [file, setFile] = useState<File | null>(null);
  const [uploadQuery, setUploadQuery] = useState('Generate user stories based on this transcript.');
  
  // JSON State
  const [jsonText, setJsonText] = useState('{\n  "transcript": {\n    "transcript_id": "manual-1",\n    "source": "manual",\n    "utterances": [\n      {"speaker": "User", "text": "We need a dashboard for metrics.", "timestamp_start": 0}\n    ]\n  },\n  "query": "Extract stories"\n}');

  // Shared State
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stories, setStories] = useState<GeneratedStory[]>([]);
  const [issues, setIssues] = useState<StoryIssue[]>([]);

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !id) return;

    setLoading(true);
    setError(null);
    setStories([]);
    setIssues([]);

    try {
      // Append project ID to the query for backend tracking if necessary, or just send it as part of query
      const fullQuery = `${uploadQuery} (Project ID: ${id})`;
      const result = await ragApi.uploadTranscript(file, fullQuery);
      setStories(result.stories || []);
      setIssues(result.issues || []);
    } catch (err: any) {
      setError(err.message || 'Failed to generate stories from file.');
    } finally {
      setLoading(false);
    }
  };

  const handleJsonSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;

    setLoading(true);
    setError(null);
    setStories([]);
    setIssues([]);

    try {
      const parsedRequest = JSON.parse(jsonText);
      // Ensure project_id is embedded in the transcript object if backend expects it
      if (!parsedRequest.transcript.project_id) {
        parsedRequest.transcript.project_id = id;
      }
      const result = await ragApi.runPipeline(parsedRequest);
      setStories(result.stories || []);
      setIssues(result.issues || []);
    } catch (err: any) {
      if (err instanceof SyntaxError) {
        setError('Invalid JSON format.');
      } else {
        setError(err.message || 'Failed to generate stories from JSON.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F1F5F9] font-sans p-4 sm:p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate(`/projects/${id}`)}
            className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center text-slate-500 hover:text-slate-900 transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Project Backlog</h1>
            <p className="text-sm font-medium text-slate-500">Generate and manage user stories using AI</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Input Panel */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="flex border-b border-slate-200 bg-slate-50">
                <button 
                  onClick={() => setActiveTab('upload')}
                  className={`flex-1 py-4 text-sm font-bold transition-colors ${activeTab === 'upload' ? 'bg-white text-blue-600 border-t-2 border-blue-600' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'}`}
                >
                  <div className="flex items-center justify-center gap-2"><UploadCloud size={16} /> File Upload</div>
                </button>
                <button 
                  onClick={() => setActiveTab('json')}
                  className={`flex-1 py-4 text-sm font-bold transition-colors ${activeTab === 'json' ? 'bg-white text-blue-600 border-t-2 border-blue-600' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'}`}
                >
                  <div className="flex items-center justify-center gap-2"><Code size={16} /> JSON Input</div>
                </button>
              </div>

              <div className="p-6">
                {activeTab === 'upload' && (
                  <form onSubmit={handleUploadSubmit} className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Transcript File (.txt)</label>
                      <div className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center hover:bg-slate-50 transition-colors">
                        <input 
                          type="file" 
                          accept=".txt"
                          onChange={e => setFile(e.target.files?.[0] || null)}
                          className="hidden" 
                          id="file-upload"
                        />
                        <label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center">
                          <FileText size={32} className={file ? "text-blue-500 mb-3" : "text-slate-300 mb-3"} />
                          <span className="text-sm font-bold text-slate-700">
                            {file ? file.name : 'Click to upload transcript'}
                          </span>
                          {!file && <span className="text-xs text-slate-500 mt-1">Plain text format only</span>}
                        </label>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Generation Query</label>
                      <input 
                        type="text" 
                        value={uploadQuery}
                        onChange={e => setUploadQuery(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 font-medium text-sm"
                      />
                    </div>
                    <button 
                      type="submit" 
                      disabled={!file || loading}
                      className="w-full py-4 bg-indigo-600 text-white rounded-xl font-bold text-sm shadow-lg shadow-indigo-200 hover:bg-indigo-700 disabled:opacity-50 flex justify-center items-center gap-2"
                    >
                      {loading ? <Loader2 size={18} className="animate-spin" /> : <Sparkles size={18} />}
                      {loading ? 'Generating Stories...' : 'Generate Stories'}
                    </button>
                  </form>
                )}

                {activeTab === 'json' && (
                  <form onSubmit={handleJsonSubmit} className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Raw JSON Request</label>
                      <textarea 
                        value={jsonText}
                        onChange={e => setJsonText(e.target.value)}
                        rows={12}
                        className="w-full bg-slate-800 text-green-400 border border-slate-700 rounded-xl py-3 px-4 font-mono text-xs custom-scrollbar"
                      />
                    </div>
                    <button 
                      type="submit" 
                      disabled={loading}
                      className="w-full py-4 bg-indigo-600 text-white rounded-xl font-bold text-sm shadow-lg shadow-indigo-200 hover:bg-indigo-700 disabled:opacity-50 flex justify-center items-center gap-2"
                    >
                      {loading ? <Loader2 size={18} className="animate-spin" /> : <Code size={18} />}
                      {loading ? 'Executing Pipeline...' : 'Run JSON Pipeline'}
                    </button>
                  </form>
                )}

                {error && (
                  <div className="mt-6 p-4 rounded-xl bg-red-50 border border-red-100 flex items-start gap-3">
                    <AlertCircle size={18} className="text-red-500 flex-shrink-0 mt-0.5" />
                    <p className="text-sm font-bold text-red-900">{error}</p>
                  </div>
                )}
              </div>
            </div>
            
            {/* Context Card */}
            <div className="bg-emerald-50 rounded-2xl border border-emerald-100 p-6">
              <h3 className="text-xs font-black text-emerald-800 uppercase tracking-widest mb-2">RAG Engine Info</h3>
              <p className="text-sm font-medium text-emerald-700 leading-relaxed mb-4">
                The RAG pipeline automatically chunks your transcript, runs semantic embeddings against the project context, and generates highly targeted user stories.
              </p>
              <ul className="text-xs text-emerald-600 font-bold space-y-2">
                <li>• Embeddings: BAAI/bge-m3</li>
                <li>• LLM: GPT-4o / Claude 3.5 Sonnet</li>
                <li>• DB: pgvector</li>
              </ul>
            </div>
          </div>

          {/* Results Panel */}
          <div className="lg:col-span-7">
            {stories.length === 0 && !loading && (
              <div className="h-full min-h-[400px] border-2 border-dashed border-slate-300 rounded-2xl flex flex-col items-center justify-center text-center p-8 bg-slate-50/50">
                <Sparkles size={48} className="text-slate-300 mb-4" />
                <h3 className="text-lg font-bold text-slate-700 mb-2">No Stories Generated Yet</h3>
                <p className="text-sm text-slate-500 max-w-sm">
                  Upload a transcript or paste JSON payload to the left to let the AI analyze your meeting and extract agile user stories.
                </p>
              </div>
            )}

            {loading && (
              <div className="h-full min-h-[400px] rounded-2xl flex flex-col items-center justify-center text-center p-8">
                <Loader2 size={48} className="text-indigo-500 animate-spin mb-4" />
                <h3 className="text-lg font-bold text-slate-900 mb-2">Processing Pipeline</h3>
                <p className="text-sm text-slate-500 max-w-sm animate-pulse">
                  Analyzing speech utterances, running vector retrieval, and prompting the LLM...
                </p>
              </div>
            )}

            {!loading && (stories.length > 0 || issues.length > 0) && (
              <div className="space-y-6">
                
                {issues.length > 0 && (
                  <div className="space-y-4">
                    <h2 className="text-sm font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                      <AlertCircle size={16} /> Detected Issues
                    </h2>
                    <div className="grid gap-4">
                      {issues.map((issue, idx) => (
                        <div key={idx} className={`p-4 rounded-xl border ${
                          issue.severity === 'high' ? 'bg-rose-50 border-rose-200 text-rose-900' :
                          issue.severity === 'medium' ? 'bg-amber-50 border-amber-200 text-amber-900' :
                          'bg-blue-50 border-blue-200 text-blue-900'
                        }`}>
                          <div className="flex justify-between items-start mb-1">
                            <h4 className="font-bold text-sm">{issue.issue}</h4>
                            <span className="text-[10px] uppercase font-black tracking-widest bg-white/50 px-2 py-0.5 rounded-md">{issue.severity}</span>
                          </div>
                          <p className="text-xs opacity-80 mb-2">Context: {issue.context}</p>
                          <p className="text-xs font-bold bg-white/50 p-2 rounded-lg inline-block">Recommendation: {issue.recommendation}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {stories.length > 0 && (
                  <div className="space-y-4">
                    <h2 className="text-sm font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                      <Sparkles size={16} /> Generated Stories
                      <span className="bg-slate-200 text-slate-600 px-2 py-0.5 rounded-lg text-[10px] ml-2">{stories.length} Total</span>
                    </h2>
                    <div className="grid gap-4">
                      {stories.map((story) => (
                        <StoryCard 
                          key={story.story_id}
                          title={story.title}
                          story={story.story}
                          priority={story.priority}
                          confidence={story.confidence}
                          acceptanceCriteria={story.acceptance_criteria}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
          
        </div>
      </div>
    </div>
  );
};
