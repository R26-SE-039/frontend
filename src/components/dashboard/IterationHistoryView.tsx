import React, { useState, useEffect } from 'react';
import { 
  Calendar, Clock, CheckCircle2, ChevronDown, ChevronUp, AlertCircle, 
  BookOpen, Layers, BarChart2, CheckSquare, ShieldAlert
} from 'lucide-react';
import { iterationApi } from '../../api/iterationApi';
import { meetingApi } from '../../api/meetingApi';
import { useMeetingStore, Iteration } from '../../store/useMeetingStore';

interface IterationHistoryViewProps {}

interface MeetingWithStories {
  id: string;
  title: string;
  start_time: string;
  end_time: string;
  status: string;
  story_count: number;
}

interface UserStory {
  id: string;
  title: string;
  story: string;
  priority: string;
  status: string;
  acceptance_criteria: string[];
}

export const IterationHistoryView: React.FC<IterationHistoryViewProps> = () => {
  const { currentProject } = useMeetingStore();
  const projectId = currentProject?.id || '';
  const [iterations, setIterations] = useState<Iteration[]>([]);
  const [selectedIterationId, setSelectedIterationId] = useState<string>('');
  const [meetings, setMeetings] = useState<MeetingWithStories[]>([]);
  const [summary, setSummary] = useState({ total_meetings: 0, total_stories: 0 });
  const [loading, setLoading] = useState(true);
  const [meetingsLoading, setMeetingsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Expanded meeting states (stores meeting_id -> true/false)
  const [expandedMeetings, setExpandedMeetings] = useState<Record<string, boolean>>({});
  // Cached stories for expanded meetings (stores meeting_id -> list of UserStory)
  const [cachedStories, setCachedStories] = useState<Record<string, UserStory[]>>({});
  const [storiesLoading, setStoriesLoading] = useState<Record<string, boolean>>({});

  useEffect(() => {
    loadIterations();
  }, [projectId]);

  useEffect(() => {
    if (selectedIterationId) {
      loadIterationData(selectedIterationId);
    } else {
      setMeetings([]);
      setSummary({ total_meetings: 0, total_stories: 0 });
    }
  }, [selectedIterationId]);

  const loadIterations = async () => {
    try {
      setLoading(true);
      setError(null);
      const list = await iterationApi.listIterations(projectId);
      setIterations(list);
      
      // Auto-select active iteration, else fallback to first one, else none
      const active = list.find(it => it.status === 'ACTIVE');
      if (active) {
        setSelectedIterationId(active.id);
      } else if (list.length > 0) {
        setSelectedIterationId(list[0].id);
      }
    } catch (err: any) {
      console.error(err);
      setError('Failed to load sprints/iterations.');
    } finally {
      setLoading(false);
    }
  };

  const loadIterationData = async (iterationId: string) => {
    try {
      setMeetingsLoading(true);
      setError(null);
      const res = await meetingApi.getMeetingsByIteration(iterationId);
      setMeetings(res.meetings || []);
      setSummary(res.summary || { total_meetings: 0, total_stories: 0 });
      // Reset expanded states
      setExpandedMeetings({});
      setCachedStories({});
    } catch (err: any) {
      console.error(err);
      setError('Failed to fetch iteration meeting history.');
    } finally {
      setMeetingsLoading(false);
    }
  };

  const toggleMeetingExpanded = async (meetingId: string) => {
    const isNowExpanded = !expandedMeetings[meetingId];
    setExpandedMeetings(prev => ({ ...prev, [meetingId]: isNowExpanded }));

    // Fetch stories if expanding and not already cached
    if (isNowExpanded && !cachedStories[meetingId]) {
      try {
        setStoriesLoading(prev => ({ ...prev, [meetingId]: true }));
        const res = await meetingApi.getMeetingStories(meetingId);
        setCachedStories(prev => ({ ...prev, [meetingId]: res.stories || [] }));
      } catch (err) {
        console.error('Failed to load meeting stories', err);
      } finally {
        setStoriesLoading(prev => ({ ...prev, [meetingId]: false }));
      }
    }
  };

  const getDurationString = (start: string, end: string) => {
    if (!start || !end) return 'N/A';
    const s = new Date(start);
    const e = new Date(end);
    const diffMs = e.getTime() - s.getTime();
    if (diffMs <= 0) return '0m';
    const mins = Math.round(diffMs / 60000);
    if (mins < 60) return `${mins}m`;
    const hrs = Math.floor(mins / 60);
    const remMins = mins % 60;
    return remMins > 0 ? `${hrs}h ${remMins}m` : `${hrs}h`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="text-slate-500 font-medium text-sm flex items-center gap-2">
          <div className="w-5 h-5 rounded-full border-2 border-blue-600 border-t-transparent animate-spin"></div>
          Loading Sprints...
        </div>
      </div>
    );
  }

  const selectedIteration = iterations.find(it => it.id === selectedIterationId);

  return (
    <div className="space-y-6">
      {/* Header with Picker */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <div>
          <h3 className="font-bold text-slate-900 text-lg">Sprint Meeting Registry</h3>
          <p className="text-xs text-slate-400 font-medium mt-0.5">Select a sprint to view past meeting transcripts and generated user stories.</p>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Sprint:</label>
          <select 
            value={selectedIterationId} 
            onChange={(e) => setSelectedIterationId(e.target.value)}
            className="bg-slate-50 border border-slate-200 text-slate-700 text-sm font-bold rounded-xl py-2 px-4 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none min-w-[200px]"
          >
            <option value="">-- Select Sprint --</option>
            {iterations.map(it => (
              <option key={it.id} value={it.id}>
                {it.name} {it.status === 'ACTIVE' ? '(Active)' : ''}
              </option>
            ))}
          </select>
        </div>
      </div>

      {error && (
        <div className="bg-rose-50 border border-rose-100 rounded-2xl p-4 flex items-start gap-3">
          <AlertCircle className="text-rose-500 mt-0.5 shrink-0" size={18} />
          <div>
            <h4 className="font-bold text-rose-800 text-sm">Error</h4>
            <p className="text-xs text-rose-600 font-medium mt-0.5">{error}</p>
          </div>
        </div>
      )}

      {selectedIterationId ? (
        <>
          {/* Summary Dashboard Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex items-center gap-4">
              <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                <Layers size={22} />
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Selected Sprint</span>
                <h4 className="font-bold text-slate-950 mt-0.5">{selectedIteration?.name}</h4>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex items-center gap-4">
              <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
                <BarChart2 size={22} />
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Meetings</span>
                <h4 className="font-bold text-slate-950 mt-0.5">{summary.total_meetings}</h4>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex items-center gap-4">
              <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
                <CheckSquare size={22} />
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">User Stories Generated</span>
                <h4 className="font-bold text-slate-950 mt-0.5">{summary.total_stories}</h4>
              </div>
            </div>
          </div>

          {/* Sprints Details */}
          {selectedIteration?.goal && (
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Sprint Goal</span>
              <p className="text-sm text-slate-700 font-medium mt-1 leading-relaxed">{selectedIteration.goal}</p>
            </div>
          )}

          {/* Meetings List */}
          <div className="space-y-4">
            <h4 className="font-bold text-slate-900 text-sm tracking-wide uppercase">Meeting Registry Logs</h4>

            {meetingsLoading ? (
              <div className="text-center py-12 text-slate-500 font-medium text-sm flex items-center justify-center gap-2">
                <div className="w-5 h-5 rounded-full border-2 border-blue-600 border-t-transparent animate-spin"></div>
                Loading meetings...
              </div>
            ) : meetings.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-sm">
                <Calendar className="mx-auto text-slate-300 mb-3" size={36} />
                <h4 className="font-bold text-slate-900 text-sm">No Meetings Registered</h4>
                <p className="text-xs text-slate-400 mt-1">No voice or transcript meetings were finalzed in this sprint yet.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {meetings.map((meeting) => {
                  const isExpanded = expandedMeetings[meeting.id];
                  const stories = cachedStories[meeting.id] || [];
                  const isStoriesLoading = storiesLoading[meeting.id];

                  return (
                    <div 
                      key={meeting.id}
                      className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden hover:border-slate-300 transition-colors"
                    >
                      {/* Meeting summary row */}
                      <div className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <h5 className="font-bold text-slate-900">{meeting.title}</h5>
                            <span className={`text-[10px] font-extrabold uppercase tracking-widest px-2 py-0.5 rounded-full ${
                              meeting.status === 'completed' ? 'bg-slate-100 text-slate-600' : 'bg-emerald-100 text-emerald-700'
                            }`}>
                              {meeting.status}
                            </span>
                          </div>
                          
                          <div className="flex items-center gap-4 text-xs font-medium text-slate-400">
                            <span className="flex items-center gap-1">
                              <Calendar size={13} />
                              {new Date(meeting.start_time).toLocaleDateString()}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock size={13} />
                              {getDurationString(meeting.start_time, meeting.end_time)}
                            </span>
                            <span className="flex items-center gap-1">
                              <BookOpen size={13} />
                              {meeting.story_count} user stories
                            </span>
                          </div>
                        </div>

                        <div>
                          <button
                            onClick={() => toggleMeetingExpanded(meeting.id)}
                            className="flex items-center gap-2 text-xs font-bold text-slate-700 hover:text-blue-600 border border-slate-200 hover:border-blue-100 rounded-xl px-4 py-2 hover:bg-blue-50/30 transition-all ml-auto sm:ml-0"
                          >
                            {meeting.story_count > 0 ? (
                              <>
                                {isExpanded ? 'Hide Stories' : 'View Stories'}
                                {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                              </>
                            ) : (
                              <span className="text-slate-400 cursor-not-allowed">No Stories</span>
                            )}
                          </button>
                        </div>
                      </div>

                      {/* Expanded stories section */}
                      {isExpanded && (
                        <div className="bg-slate-50/50 border-t border-slate-100 p-6 space-y-6">
                          {isStoriesLoading ? (
                            <div className="text-center py-6 text-slate-500 font-medium text-xs flex items-center justify-center gap-2">
                              <div className="w-4 h-4 rounded-full border-2 border-blue-600 border-t-transparent animate-spin"></div>
                              Loading generated user stories...
                            </div>
                          ) : stories.length === 0 ? (
                            <div className="text-center py-4 flex items-center gap-2 justify-center text-xs text-slate-400 font-medium">
                              <ShieldAlert size={16} className="text-slate-300" />
                              No user stories generated for this meeting.
                            </div>
                          ) : (
                            <div className="space-y-4">
                              <h6 className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2">User Stories List</h6>
                              {stories.map((story) => (
                                <div 
                                  key={story.id} 
                                  className="bg-white border border-slate-100 rounded-xl p-5 shadow-sm space-y-3"
                                >
                                  <div className="flex items-start justify-between gap-4">
                                    <h6 className="font-bold text-slate-900 text-sm">{story.title}</h6>
                                    <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded ${
                                      story.priority === 'Must' ? 'bg-rose-50 text-rose-600 border border-rose-100' :
                                      story.priority === 'Should' ? 'bg-amber-50 text-amber-600 border border-amber-100' :
                                      'bg-slate-50 text-slate-500 border border-slate-100'
                                    }`}>
                                      {story.priority}
                                    </span>
                                  </div>
                                  
                                  <div className="bg-slate-50/50 border border-slate-100 rounded-lg p-3 text-xs text-slate-700 font-medium leading-relaxed font-mono">
                                    {story.story}
                                  </div>

                                  {story.acceptance_criteria && story.acceptance_criteria.length > 0 && (
                                    <div className="space-y-1.5 pt-2">
                                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                                        <CheckCircle2 size={12} className="text-emerald-500" />
                                        Acceptance Criteria
                                      </span>
                                      <ul className="list-disc pl-4 space-y-1 text-xs text-slate-600 leading-relaxed font-medium">
                                        {story.acceptance_criteria.map((criteria, index) => (
                                          <li key={index}>{criteria}</li>
                                        ))}
                                      </ul>
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-sm">
          <Calendar className="mx-auto text-slate-300 mb-3" size={36} />
          <h4 className="font-bold text-slate-900 text-sm">No Sprints Configured</h4>
          <p className="text-xs text-slate-400 mt-1">Please configure a sprint in project settings to view history.</p>
        </div>
      )}
    </div>
  );
};
