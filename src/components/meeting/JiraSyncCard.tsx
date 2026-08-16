import React, { useState, useEffect } from 'react';
import { ShieldCheck, RefreshCw, CheckCircle, ExternalLink, AlertTriangle, Send } from 'lucide-react';
import { projectConfigApi, ProjectConfiguration } from '../../api/projectConfigApi';
import { iterationApi } from '../../api/iterationApi';
import { meetingApi } from '../../api/meetingApi';
import { Iteration } from '../../store/useMeetingStore';

interface JiraSyncCardProps {
  projectId: string;
  stories: any[];
  validationMap: Record<string, any>;
}

export const JiraSyncCard: React.FC<JiraSyncCardProps> = ({ projectId, stories, validationMap }) => {
  const [config, setConfig] = useState<ProjectConfiguration | null>(null);
  const [iterations, setIterations] = useState<Iteration[]>([]);
  const [selectedIteration, setSelectedIteration] = useState<string>('');
  const [customIterationName, setCustomIterationName] = useState<string>('');
  const [selectedStoryIds, setSelectedStoryIds] = useState<string[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [syncResults, setSyncResults] = useState<Record<string, { jira_key?: string; jira_url?: string; error?: string }>>({});
  const [syncSuccess, setSyncSuccess] = useState<boolean | null>(null);

  useEffect(() => {
    fetchInitialData();
  }, [projectId]);

  // Set default selected stories to Approved ones when stories change
  useEffect(() => {
    if (stories) {
      const approvedIds = stories
        .filter(s => {
          const val = validationMap[s.story_id];
          return val?.status === 'Approved';
        })
        .map(s => s.story_id);
      setSelectedStoryIds(approvedIds);
    }
  }, [stories, validationMap]);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const conf = await projectConfigApi.getConfiguration(projectId);
      setConfig(conf);

      if (conf?.jira_url && conf?.jira_project_key) {
        const iters = await iterationApi.listIterations(projectId);
        setIterations(iters);
        
        // Auto select active sprint if any
        const activeIter = iters.find(i => i.status === 'ACTIVE');
        if (activeIter) {
          setSelectedIteration(activeIter.name);
        } else if (iters.length > 0) {
          setSelectedIteration(iters[0].name);
        } else {
          setSelectedIteration('CUSTOM');
        }
      }
    } catch (err) {
      console.error('Failed to load Jira sync data', err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStory = (storyId: string) => {
    setSelectedStoryIds(prev => 
      prev.includes(storyId) ? prev.filter(id => id !== storyId) : [...prev, storyId]
    );
  };

  const handleSync = async () => {
    const iterationName = selectedIteration === 'CUSTOM' ? customIterationName.trim() : selectedIteration;
    if (!iterationName) {
      alert('Please specify an Iteration/Sprint Name');
      return;
    }

    const storiesToSync = stories
      .filter(s => selectedStoryIds.includes(s.story_id))
      .map(s => {
        const val = validationMap[s.story_id];
        return {
          story_id: s.story_id,
          title: s.title,
          story: s.story,
          acceptance_criteria: s.acceptance_criteria,
          quality_score: val ? val.overall_quality_score : 100,
          status: val ? val.status : 'Needs Review'
        };
      });

    if (storiesToSync.length === 0) {
      alert('Please select at least one story to sync.');
      return;
    }

    setSyncing(true);
    setSyncResults({});
    setSyncSuccess(null);

    try {
      const res = await meetingApi.syncStoriesToJira(projectId, iterationName, storiesToSync);
      
      if (res.success && res.results) {
        const resultsMap: any = {};
        res.results.forEach((r: any) => {
          resultsMap[r.story_id] = r;
        });
        setSyncResults(resultsMap);
        setSyncSuccess(true);
      } else {
        setSyncSuccess(false);
      }
    } catch (err: any) {
      console.error('Jira sync error', err);
      alert(err.message || 'Synchronization to Jira failed.');
      setSyncSuccess(false);
    } finally {
      setSyncing(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-6 flex justify-center items-center">
        <RefreshCw className="animate-spin text-indigo-600 mr-2" size={18} />
        <span className="text-sm font-semibold text-slate-500">Checking Jira Connection...</span>
      </div>
    );
  }

  const isConnected = !!(config?.jira_url && config?.jira_project_key);

  if (!isConnected) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-6 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <AlertTriangle className="text-amber-500 shrink-0 mt-0.5" size={20} />
          <div>
            <h4 className="text-sm font-bold text-slate-900">Jira Integration Config Required</h4>
            <p className="text-xs text-slate-500 mt-0.5">Configure Jira credentials in Project Settings to enable backlog export.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-2xs hover:shadow-xs transition-all">
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-100 mb-5">
        <div className="flex items-center gap-2.5">
          <span className="flex h-2.5 w-2.5 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
          </span>
          <span className="text-xs font-bold text-slate-700">Jira Connected ({config?.jira_project_key})</span>
          <span className="text-[10px] text-slate-400 font-medium">({config?.jira_url})</span>
        </div>

        {/* Iteration Selection */}
        <div className="flex items-center gap-2">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Target Epic/Sprint:</label>
          <select 
            value={selectedIteration} 
            onChange={e => setSelectedIteration(e.target.value)}
            className="text-xs py-1.5 px-3 rounded-lg border border-slate-200 font-semibold bg-white text-slate-800"
            disabled={syncing}
          >
            {iterations.map(iter => (
              <option key={iter.id} value={iter.name}>{iter.name} ({iter.status})</option>
            ))}
            <option value="CUSTOM">Custom Epic Name...</option>
          </select>
          
          {selectedIteration === 'CUSTOM' && (
            <input 
              type="text" 
              placeholder="Epic Summary" 
              value={customIterationName} 
              onChange={e => setCustomIterationName(e.target.value)}
              className="text-xs py-1.5 px-3 rounded-lg border border-slate-200 font-medium text-slate-800 w-36"
              disabled={syncing}
            />
          )}
        </div>
      </div>

      <div className="space-y-4">
        {/* Checklist */}
        <div>
          <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Select Stories to Synchronize</h4>
          <div className="max-h-48 overflow-y-auto border border-slate-100 rounded-lg p-2.5 space-y-2 bg-slate-50/40">
            {stories.map(s => {
              const val = validationMap[s.story_id];
              const isApproved = val?.status === 'Approved';
              const result = syncResults[s.story_id];

              return (
                <div key={s.story_id} className="flex items-center justify-between gap-3 p-2 bg-white rounded border border-slate-200/80">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <input 
                      type="checkbox"
                      checked={selectedStoryIds.includes(s.story_id)}
                      onChange={() => handleToggleStory(s.story_id)}
                      disabled={syncing || !!result?.jira_key}
                      className="rounded text-indigo-600 focus:ring-indigo-500 h-3.5 w-3.5 shrink-0"
                    />
                    <span className="text-xs font-semibold text-slate-800 truncate">{s.title}</span>
                    <span className={`text-[9px] px-1.5 py-0.5 rounded font-black uppercase tracking-wider shrink-0 ${
                      isApproved ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                    }`}>{val?.status || 'Needs Review'}</span>
                  </div>

                  {/* Sync status/link */}
                  <div className="shrink-0 font-medium text-xs">
                    {result?.jira_key ? (
                      <a 
                        href={result.jira_url} 
                        target="_blank" 
                        rel="noreferrer"
                        className="text-indigo-600 hover:text-indigo-800 font-bold flex items-center gap-1.5"
                      >
                        <span>{result.jira_key}</span>
                        <ExternalLink size={12} />
                      </a>
                    ) : result?.error ? (
                      <span className="text-rose-600" title={result.error}>Failed</span>
                    ) : (
                      <span className="text-slate-400 text-[10px]">Pending</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Export Button */}
        <div className="flex justify-end pt-2">
          <button
            onClick={handleSync}
            disabled={syncing || selectedStoryIds.length === 0}
            className="px-5 py-2.5 bg-blue-600 text-white rounded-lg font-bold text-xs uppercase tracking-widest shadow-md shadow-blue-500/20 hover:bg-blue-700 active:scale-95 disabled:opacity-50 flex items-center gap-2 transition-all"
          >
            {syncing ? (
              <>
                <RefreshCw size={14} className="animate-spin" />
                <span>Exporting to Jira...</span>
              </>
            ) : syncSuccess ? (
              <>
                <CheckCircle size={14} className="text-white" />
                <span>Exported Successfully</span>
              </>
            ) : (
              <>
                <Send size={14} />
                <span>Sync Stories to Jira Backlog</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
