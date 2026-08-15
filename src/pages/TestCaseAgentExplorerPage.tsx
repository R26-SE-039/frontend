import { useEffect, useRef, useState } from 'react';
import {
  AlertTriangle,
  Bot,
  CheckCircle2,
  Compass,
  Lightbulb,
  ListChecks,
  MousePointerClick,
  Square,
  XCircle,
} from 'lucide-react';
import { openAgentEventStream, testCaseApi } from '../api/testCaseApi';
import type { AgentEvent, AgentRole } from '../types/testCase';
import { loadTestCaseSetup } from '../utils/testCaseSetup';

const inputCls =
  'w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 outline-none transition-all focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100';

const roleColors: Record<AgentRole, string> = {
  planner: 'bg-indigo-500/10 text-indigo-600 border-indigo-500/20',
  actor: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
  observer: 'bg-green-500/10 text-green-600 border-green-500/20',
  critic: 'bg-rose-500/10 text-rose-600 border-rose-500/20',
};

type FeedItem =
  | { kind: 'status'; text: string }
  | { kind: 'thought'; role: AgentRole; step: number; text: string }
  | { kind: 'action'; step: number; text: string; success: boolean }
  | { kind: 'lesson'; step: number; text: string };

type Scenario = { title: string; steps: string[] };

export default function TestCaseAgentExplorerPage() {
  const [projectId, setProjectId] = useState<string | null>(null);
  const [intent, setIntent] = useState('Explore the app and discover core user journeys worth testing.');
  const [url, setUrl] = useState('');
  const [maxSteps, setMaxSteps] = useState(12);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [feed, setFeed] = useState<FeedItem[]>([]);
  const [screenshot, setScreenshot] = useState<string | null>(null);
  const [screenshotInfo, setScreenshotInfo] = useState<{ step: number; title: string; novelStates: number } | null>(null);
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [coverage, setCoverage] = useState<{ done: string[]; pending: string[] }>({ done: [], pending: [] });
  const [summary, setSummary] = useState<string | null>(null);
  const socketRef = useRef<WebSocket | null>(null);
  const feedRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    (async () => {
      try {
        const id = await testCaseApi.ensureProject();
        setProjectId(id);
        setUrl(loadTestCaseSetup(id).url);
      } catch (err: any) {
        setError(err.message || 'Failed to prepare the explorer');
      }
    })();
    return () => socketRef.current?.close();
  }, []);

  useEffect(() => {
    feedRef.current?.scrollTo({ top: feedRef.current.scrollHeight });
  }, [feed]);

  const pushFeed = (item: FeedItem) => setFeed((prev) => [...prev.slice(-300), item]);

  const handleEvent = (event: AgentEvent) => {
    if (event.type === 'status') {
      pushFeed({ kind: 'status', text: event.message });
    } else if (event.type === 'screenshot') {
      setScreenshot(event.b64);
      setScreenshotInfo({ step: event.step, title: event.title, novelStates: event.total_novel_states });
    } else if (event.type === 'thought') {
      pushFeed({ kind: 'thought', role: event.role, step: event.step, text: event.text });
    } else if (event.type === 'action') {
      pushFeed({ kind: 'action', step: event.step, text: `${event.action_type}${event.value ? ` "${event.value}"` : ''} — ${event.message}`, success: event.success });
    } else if (event.type === 'lesson') {
      pushFeed({ kind: 'lesson', step: event.step, text: event.text });
    } else if (event.type === 'coverage') {
      setCoverage({ done: event.goals_done, pending: event.goals_pending });
    } else if (event.type === 'scenario_discovered') {
      setScenarios((prev) => [...prev, { title: event.title, steps: event.steps }]);
    } else if (event.type === 'done') {
      setScenarios(event.scenarios);
      setSummary(`${event.reason} — ${event.total_steps} steps, ${event.total_novel_states} novel states, ${event.scenarios.length} scenarios discovered.`);
      setRunning(false);
    } else if (event.type === 'error') {
      setError(event.message);
      setRunning(false);
    } else if (event.type === 'end') {
      setRunning(false);
    }
  };

  const handleStart = async () => {
    if (!url.trim() || !intent.trim()) return;
    setRunning(true);
    setError(null);
    setFeed([]);
    setScenarios([]);
    setScreenshot(null);
    setScreenshotInfo(null);
    setSummary(null);
    setCoverage({ done: [], pending: [] });
    try {
      const response = await testCaseApi.startExploration({
        intent: intent.trim(),
        url: url.trim(),
        projectId: projectId ?? undefined,
        maxSteps,
        headless: true,
      });
      socketRef.current?.close();
      socketRef.current = openAgentEventStream(response.run_id, handleEvent);
    } catch (err: any) {
      setError(err.message || 'Failed to start the exploration');
      setRunning(false);
    }
  };

  const handleStop = () => {
    socketRef.current?.close();
    setRunning(false);
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-extrabold tracking-tight text-[var(--foreground)]">Agent Explorer</h2>
        <p className="text-xs text-[var(--muted)] mt-1">
          An autonomous planner / actor / observer / critic agent explores the app, marks interactive elements, and
          proposes new test scenarios.
        </p>
      </div>

      {error && (
        <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          <AlertTriangle size={18} className="shrink-0" />
          {error}
        </div>
      )}

      <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-sm space-y-4">
        <div className="grid gap-4 md:grid-cols-12">
          <div className="md:col-span-6">
            <label className="mb-1 block text-[10px] font-black uppercase tracking-widest text-slate-400">Exploration Goal</label>
            <input className={inputCls} value={intent} onChange={(e) => setIntent(e.target.value)} />
          </div>
          <div className="md:col-span-4">
            <label className="mb-1 block text-[10px] font-black uppercase tracking-widest text-slate-400">Target URL</label>
            <input className={inputCls} value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://staging.yourapp.com" />
          </div>
          <div className="md:col-span-2">
            <label className="mb-1 block text-[10px] font-black uppercase tracking-widest text-slate-400">Max Steps</label>
            <input
              type="number"
              min={3}
              max={40}
              className={inputCls}
              value={maxSteps}
              onChange={(e) => setMaxSteps(Math.max(3, Math.min(40, Number(e.target.value) || 12)))}
            />
          </div>
        </div>
        <div className="flex justify-end gap-2">
          {running && (
            <button
              type="button"
              onClick={handleStop}
              className="inline-flex items-center gap-2 rounded-lg border border-red-100 bg-red-50 px-4 py-2 text-xs font-bold text-red-600 transition hover:bg-red-100"
            >
              <Square size={13} /> Stop Watching
            </button>
          )}
          <button
            type="button"
            onClick={handleStart}
            disabled={running || !url.trim()}
            className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-indigo-200 transition hover:from-indigo-700 hover:to-purple-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Bot size={14} className={running ? 'animate-pulse' : ''} /> {running ? 'Exploring...' : 'Start Exploration'}
          </button>
        </div>
      </div>

      {summary && (
        <div className="flex items-center gap-3 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-700">
          <CheckCircle2 size={18} className="shrink-0" />
          {summary}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-12">
        <div className="lg:col-span-7 space-y-6">
          <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-950 shadow-sm">
            <div className="flex items-center justify-between gap-2 border-b border-slate-800 px-4 py-3">
              <div className="flex items-center gap-2">
                <Compass size={14} className="text-indigo-400" />
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Agent Viewport</p>
              </div>
              {screenshotInfo && (
                <p className="truncate text-[10px] font-bold text-slate-500">
                  Step {screenshotInfo.step} · {screenshotInfo.title} · {screenshotInfo.novelStates} novel states
                </p>
              )}
            </div>
            {screenshot ? (
              <img src={`data:image/png;base64,${screenshot}`} alt="Agent viewport" className="max-h-[420px] w-full object-contain" />
            ) : (
              <div className="flex h-64 items-center justify-center text-xs font-medium text-slate-600">
                The live annotated screenshot appears here during exploration.
              </div>
            )}
          </div>

          {(coverage.done.length > 0 || coverage.pending.length > 0) && (
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 shadow-sm">
              <div className="mb-3 flex items-center gap-2">
                <ListChecks size={14} className="text-indigo-600" />
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Coverage Goals</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {coverage.done.map((goal) => (
                  <span key={goal} className="inline-flex items-center gap-1.5 rounded-full border border-green-500/20 bg-green-500/10 px-3 py-1 text-xs font-medium text-green-600">
                    <CheckCircle2 size={12} /> {goal}
                  </span>
                ))}
                {coverage.pending.map((goal) => (
                  <span key={goal} className="inline-flex items-center gap-1.5 rounded-full border border-gray-500/20 bg-gray-500/10 px-3 py-1 text-xs font-medium text-gray-600">
                    {goal}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="lg:col-span-5">
          <div className="flex h-full flex-col rounded-2xl border border-[var(--border)] bg-[var(--card)] shadow-sm overflow-hidden">
            <div className="border-b border-slate-100 px-5 py-3">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Agent Reasoning</p>
            </div>
            <div ref={feedRef} className="custom-scrollbar h-[480px] space-y-3 overflow-y-auto p-5">
              {feed.length === 0 ? (
                <p className="text-xs font-medium text-slate-400">Planner, actor, observer, and critic thoughts stream here.</p>
              ) : (
                feed.map((item, index) => (
                  <div key={index} className="text-xs leading-5">
                    {item.kind === 'status' && <p className="font-bold text-slate-400">{item.text}</p>}
                    {item.kind === 'thought' && (
                      <div>
                        <span className={`mr-2 inline-flex rounded-full border px-2 py-0.5 text-[10px] font-black uppercase ${roleColors[item.role]}`}>
                          {item.role} · {item.step}
                        </span>
                        <span className="font-medium text-slate-600">{item.text}</span>
                      </div>
                    )}
                    {item.kind === 'action' && (
                      <p className="flex items-start gap-1.5 font-semibold text-slate-700">
                        {item.success ? (
                          <MousePointerClick size={13} className="mt-0.5 shrink-0 text-indigo-500" />
                        ) : (
                          <XCircle size={13} className="mt-0.5 shrink-0 text-red-500" />
                        )}
                        {item.text}
                      </p>
                    )}
                    {item.kind === 'lesson' && (
                      <p className="flex items-start gap-1.5 font-medium text-amber-600">
                        <Lightbulb size={13} className="mt-0.5 shrink-0" /> {item.text}
                      </p>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {scenarios.length > 0 && (
        <div className="space-y-3">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
            Discovered Scenarios ({scenarios.length})
          </p>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {scenarios.map((scenario, index) => (
              <div key={`${scenario.title}-${index}`} className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-md">
                <h4 className="text-sm font-black text-slate-900">{scenario.title}</h4>
                <ol className="mt-3 list-decimal space-y-1 pl-4 text-xs font-medium leading-5 text-slate-500">
                  {scenario.steps.map((step, stepIndex) => (
                    <li key={stepIndex}>{step}</li>
                  ))}
                </ol>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
