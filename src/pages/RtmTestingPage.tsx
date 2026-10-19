import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Ban,
  Bot,
  ChevronDown,
  ChevronRight,
  CircleCheck,
  CircleX,
  Download,
  Hand,
  ListChecks,
  PlayCircle,
  RefreshCw,
} from "lucide-react";
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { rtmApi } from "../api/rtmApi";
import { RtmEmptyState, RtmErrorBanner, RtmSpinner } from "../components/rtm/RtmPageState";
import type {
  AutomatedTestCase,
  ManualCheck,
  ManualStatus,
  TestingReportResponse,
  TestStatus,
} from "../types/rtm";

const STATUS_STYLE: Record<TestStatus | ManualStatus, string> = {
  Passed: "bg-green-500/10 text-green-700 border-green-500/30",
  Failed: "bg-red-500/10 text-red-700 border-red-500/30",
  Blocked: "bg-amber-500/10 text-amber-700 border-amber-500/30",
  "Not executed": "bg-slate-500/10 text-slate-600 border-slate-400/30",
  "Not verified": "bg-slate-500/10 text-slate-600 border-slate-400/30",
};
const STATUS_COLOR: Record<TestStatus, string> = {
  Passed: "#1a7f37",
  Failed: "#d1242f",
  Blocked: "#d4a017",
  "Not executed": "#8c959f",
};
const LEVEL_LABEL: Record<string, string> = { unit: "Unit", api: "API", live: "Live E2E" };
const STATUSES: TestStatus[] = ["Passed", "Failed", "Blocked", "Not executed"];

function StatusPill({ status }: { status: TestStatus | ManualStatus }) {
  return (
    <span className={`inline-flex whitespace-nowrap rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${STATUS_STYLE[status]}`}>
      {status}
    </span>
  );
}

function Kpi({ label, value, sub, tone }: { label: string; value: string | number; sub?: string; tone: string }) {
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 shadow-sm">
      <p className="text-[11px] font-bold uppercase tracking-wider text-[var(--muted)]">{label}</p>
      <p className={`mt-1 text-3xl font-extrabold ${tone}`}>{value}</p>
      {sub && <p className="mt-1 text-xs text-[var(--muted)]">{sub}</p>}
    </div>
  );
}

function Pre({ children }: { children: string }) {
  return (
    <pre className="max-h-72 overflow-auto whitespace-pre-wrap break-words rounded-lg bg-slate-50 p-3 font-mono text-[11px] leading-relaxed text-slate-700">
      {children}
    </pre>
  );
}

function CaseDetail({ c }: { c: AutomatedTestCase }) {
  return (
    <div className="grid gap-4 bg-amber-50/40 px-6 py-5 md:grid-cols-2">
      <div className="space-y-3">
        <div>
          <p className="text-[11px] font-bold uppercase text-[var(--muted)]">Test objective</p>
          <p className="text-sm text-[var(--foreground)]">{c.objective}</p>
        </div>
        <div>
          <p className="text-[11px] font-bold uppercase text-[var(--muted)]">Expected result</p>
          <p className="text-sm text-[var(--foreground)]">{c.expected}</p>
        </div>
        <div>
          <p className="text-[11px] font-bold uppercase text-[var(--muted)]">Actual result (captured at run time)</p>
          {c.actual ? <Pre>{c.actual}</Pre> : <p className="text-sm text-[var(--muted)]">—</p>}
        </div>
        <p className="font-mono text-[10px] text-[var(--muted)]">
          {c.nodeid} · {c.duration_ms.toFixed(1)} ms
        </p>
      </div>
      <div className="space-y-3">
        {c.failure && (
          <div>
            <p className="text-[11px] font-bold uppercase text-red-600">
              {c.status === "Failed" ? "Failure detail" : "Reason not executed"}
            </p>
            <Pre>{c.failure}</Pre>
          </div>
        )}
        {c.evidence.map((e) => (
          <div key={e.label}>
            <p className="text-[11px] font-bold uppercase text-[var(--muted)]">Evidence · {e.label}</p>
            <Pre>{e.value}</Pre>
          </div>
        ))}
        {!c.failure && c.evidence.length === 0 && (
          <p className="text-xs text-[var(--muted)]">No additional evidence recorded for this case.</p>
        )}
      </div>
    </div>
  );
}

function ManualCard({ check, onSaved }: { check: ManualCheck; onSaved: (c: ManualCheck) => void }) {
  const [status, setStatus] = useState<ManualStatus>(check.status);
  const [notes, setNotes] = useState(check.notes);
  const [by, setBy] = useState(check.verified_by);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const dirty = status !== check.status || notes !== check.notes || by !== check.verified_by;

  const save = async () => {
    setSaving(true);
    setErr(null);
    try {
      onSaved(await rtmApi.recordManualCheck(check.id, { status, notes, verified_by: by }));
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed to save.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-mono text-xs font-bold text-amber-700">
            {check.id} <span className="ml-1 rounded bg-violet-500/10 px-1.5 py-0.5 text-[10px] text-violet-700">Manual</span>
          </p>
          <p className="mt-1 text-sm font-bold text-[var(--foreground)]">{check.title}</p>
          <p className="text-[11px] text-[var(--muted)]">{check.module}</p>
        </div>
        <StatusPill status={check.status} />
      </div>
      <p className="mt-3 text-xs text-[var(--foreground)]">
        <span className="font-bold">Steps: </span>
        {check.steps}
      </p>
      <p className="mt-1 text-xs text-[var(--foreground)]">
        <span className="font-bold">Expected: </span>
        {check.expected}
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        {(["Passed", "Failed", "Not verified"] as ManualStatus[]).map((s) => (
          <button
            key={s}
            onClick={() => setStatus(s)}
            className={`rounded-lg border px-3 py-1 text-xs font-bold ${status === s ? STATUS_STYLE[s] : "border-slate-200 text-slate-500"}`}
          >
            {s}
          </button>
        ))}
      </div>
      <div className="mt-3 grid gap-2 sm:grid-cols-[1fr_160px]">
        <input
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Observation / evidence (e.g. screenshot name)"
          className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs"
        />
        <input
          value={by}
          onChange={(e) => setBy(e.target.value)}
          placeholder="Verified by"
          className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs"
        />
      </div>
      <div className="mt-3 flex items-center justify-between">
        <p className="text-[10px] text-[var(--muted)]">
          {check.verified_at ? `Recorded ${new Date(check.verified_at).toLocaleString()}` : "No outcome recorded yet"}
        </p>
        <button
          onClick={() => void save()}
          disabled={!dirty || saving}
          className="rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-bold text-white disabled:opacity-40"
        >
          {saving ? "Saving…" : "Save result"}
        </button>
      </div>
      {err && <p className="mt-2 text-xs text-red-600">{err}</p>}
    </div>
  );
}

export default function RtmTestingPage() {
  const [data, setData] = useState<TestingReportResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [moduleFilter, setModuleFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState<TestStatus | "All">("All");
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState<Set<string>>(new Set());
  const poll = useRef<number | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      setData(await rtmApi.getTestingReport());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load the test report.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
    return () => {
      if (poll.current) window.clearInterval(poll.current);
    };
  }, [load]);

  const startPolling = useCallback(() => {
    if (poll.current) window.clearInterval(poll.current);
    poll.current = window.setInterval(async () => {
      try {
        const run = await rtmApi.getTestRunStatus();
        setData((d) => (d ? { ...d, run } : d));
        if (run.status !== "running") {
          if (poll.current) window.clearInterval(poll.current);
          poll.current = null;
          await load();
        }
      } catch {
        /* keep polling; transient gateway errors are expected while tests hit the services */
      }
    }, 2000);
  }, [load]);

  useEffect(() => {
    if (data?.run.status === "running" && !poll.current) startPolling();
  }, [data?.run.status, startPolling]);

  const run = async (suite: "offline" | "full") => {
    setError(null);
    try {
      const state = await rtmApi.runTests(suite);
      setData((d) => (d ? { ...d, run: state } : d));
      startPolling();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to start the test run.");
    }
  };

  const report = data?.report ?? null;
  const modules = useMemo(() => report?.modules.map((m) => m.module) ?? [], [report]);
  const cases = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (report?.cases ?? []).filter(
      (c) =>
        (moduleFilter === "All" || c.module === moduleFilter) &&
        (statusFilter === "All" || c.status === statusFilter) &&
        (!q || `${c.id} ${c.title} ${c.objective}`.toLowerCase().includes(q)),
    );
  }, [report, moduleFilter, statusFilter, query]);
  const failed = useMemo(() => (report?.cases ?? []).filter((c) => c.status === "Failed"), [report]);
  const manual = data?.manual_checks ?? [];
  const manualDone = manual.filter((m) => m.status !== "Not verified").length;
  const running = data?.run.status === "running";

  const toggle = (id: string) =>
    setOpen((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });

  const downloadJson = () => {
    if (!data) return;
    const blob = new Blob([JSON.stringify({ automated: report, manual_checks: manual }, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `rtm-test-report-${report?.generated_at.slice(0, 19).replace(/[:T]/g, "-") ?? "latest"}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  if (loading) return <RtmSpinner label="Loading test report..." />;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold tracking-tight text-[var(--foreground)]">Research Test Dashboard</h2>
          <p className="mt-1 max-w-2xl text-xs text-[var(--muted)]">
            Executable pytest evidence for ML quality prediction, RTM generation, coverage-gap detection and intelligent test
            improvement. Every status below comes from the last real test run; manual checks stay "Not verified" until recorded.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => void run("offline")}
            disabled={running || !data?.suite_available}
            className="flex items-center gap-2 rounded-lg border border-amber-300 bg-white px-3 py-2 text-xs font-bold text-amber-700 hover:bg-amber-50 disabled:opacity-50"
          >
            <PlayCircle size={14} /> Run offline suite
          </button>
          <button
            onClick={() => void run("full")}
            disabled={running || !data?.suite_available}
            className="flex items-center gap-2 rounded-lg bg-amber-600 px-3 py-2 text-xs font-bold text-white hover:bg-amber-700 disabled:opacity-50"
          >
            <PlayCircle size={14} /> Run full suite (incl. live)
          </button>
          <button
            onClick={() => void load()}
            className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-500 hover:text-amber-600"
          >
            <RefreshCw size={14} /> Refresh
          </button>
          <button
            onClick={downloadJson}
            disabled={!report}
            className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-500 hover:text-amber-600 disabled:opacity-50"
          >
            <Download size={14} /> Export JSON
          </button>
        </div>
      </div>

      {error && <RtmErrorBanner message={error} />}
      {data && !data.suite_available && (
        <RtmErrorBanner message="The test suite is not available in this deployment (tests/ is not shipped in the Docker image). Run it from the RTM-and-Quality-Prediction-backend folder." />
      )}

      {data && data.run.status !== "idle" && (
        <div
          className={`rounded-xl border px-4 py-3 text-xs ${
            running ? "border-blue-200 bg-blue-50 text-blue-800" : data.run.status === "error" ? "border-red-200 bg-red-50 text-red-800" : "border-slate-200 bg-white text-slate-700"
          }`}
        >
          <div className="flex items-center gap-2 font-bold">
            {running && <RefreshCw size={13} className="animate-spin" />}
            {running
              ? `Running ${data.run.suite} suite… (live tests can take 1–2 minutes)`
              : `Last run (${data.run.suite}) finished ${data.run.finished_at ? new Date(data.run.finished_at).toLocaleTimeString() : ""} · pytest exit code ${data.run.exit_code ?? "—"}`}
          </div>
          {!running && data.run.output_tail && (
            <details className="mt-2">
              <summary className="cursor-pointer text-[11px] text-[var(--muted)]">pytest console output</summary>
              <Pre>{data.run.output_tail}</Pre>
            </details>
          )}
        </div>
      )}

      {!report ? (
        <RtmEmptyState
          icon={<ListChecks size={22} />}
          title="No test report yet"
          subtitle="Click 'Run full suite' (or run pytest in RTM-and-Quality-Prediction-backend) to execute the tests and generate evidence."
        />
      ) : (
        <>
          <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] px-4 py-3 text-[11px] text-[var(--muted)]">
            <span className="font-bold text-[var(--foreground)]">Run:</span> {new Date(report.generated_at).toLocaleString()} ·{" "}
            {report.suite} · {report.duration_s}s · <span className="font-mono">{report.command}</span>
            <br />
            <span className="font-bold text-[var(--foreground)]">Environment:</span> Python {String(report.environment.python)} · pytest{" "}
            {String(report.environment.pytest)} · {String(report.environment.model ?? "")}
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <Kpi label="Automated tests" value={report.summary.total} sub={`${report.modules.length} modules`} tone="text-[var(--foreground)]" />
            <Kpi
              label="Passed"
              value={report.summary.Passed}
              sub={`${((report.summary.Passed / Math.max(1, report.summary.total)) * 100).toFixed(1)}% of executed suite`}
              tone="text-green-700"
            />
            <Kpi label="Failed" value={report.summary.Failed} sub="Assertion did not hold" tone="text-red-700" />
            <Kpi
              label="Blocked / not executed"
              value={report.summary.Blocked + report.summary["Not executed"]}
              sub="Dependency unavailable — not counted as passed"
              tone="text-amber-600"
            />
            <Kpi label="Manual checks" value={`${manualDone}/${manual.length}`} sub="Verified by a person" tone="text-violet-700" />
          </div>

          <div className="grid gap-6 lg:grid-cols-[3fr_2fr]">
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 shadow-sm">
              <p className="text-sm font-bold text-[var(--foreground)]">Results by module</p>
              <div className="mt-3 h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={report.modules} layout="vertical" margin={{ left: 20, right: 16 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e5e7eb" />
                    <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
                    <YAxis type="category" dataKey="module" width={170} tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    {STATUSES.map((s) => (
                      <Bar key={s} dataKey={s} stackId="a" fill={STATUS_COLOR[s]} barSize={18} />
                    ))}
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 shadow-sm">
              <p className="text-sm font-bold text-[var(--foreground)]">Module summary</p>
              <table className="mt-3 w-full text-xs">
                <thead>
                  <tr className="text-left text-[var(--muted)]">
                    <th className="py-1.5">Module</th>
                    <th className="text-right">Total</th>
                    <th className="text-right text-green-700">Pass</th>
                    <th className="text-right text-red-700">Fail</th>
                    <th className="text-right text-amber-700">Blocked</th>
                  </tr>
                </thead>
                <tbody>
                  {report.modules.map((m) => (
                    <tr key={m.module} className="border-t border-slate-100">
                      <td className="py-1.5 font-semibold text-[var(--foreground)]">{m.module}</td>
                      <td className="text-right">{m.total}</td>
                      <td className="text-right">{m.Passed}</td>
                      <td className="text-right">{m.Failed}</td>
                      <td className="text-right">{m.Blocked + m["Not executed"]}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {failed.length > 0 && (
                <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3">
                  <p className="text-xs font-bold text-red-700">Findings from failed tests</p>
                  <ul className="mt-1 space-y-1 text-[11px] text-red-800">
                    {failed.map((c) => (
                      <li key={c.id}>
                        <span className="font-mono font-bold">{c.id}</span> {c.title}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] shadow-sm">
            <div className="flex flex-wrap items-center gap-3 border-b border-[var(--border)] p-4">
              <p className="mr-auto flex items-center gap-2 text-sm font-bold text-[var(--foreground)]">
                <Bot size={16} className="text-amber-600" /> Automated test cases ({cases.length})
              </p>
              <select
                value={moduleFilter}
                onChange={(e) => setModuleFilter(e.target.value)}
                className="rounded-lg border border-slate-200 px-2 py-1.5 text-xs"
              >
                <option>All</option>
                {modules.map((m) => (
                  <option key={m}>{m}</option>
                ))}
              </select>
              <div className="flex gap-1">
                {(["All", ...STATUSES] as const).map((s) => (
                  <button
                    key={s}
                    onClick={() => setStatusFilter(s)}
                    className={`rounded-lg border px-2.5 py-1 text-[11px] font-bold ${
                      statusFilter === s ? "border-amber-400 bg-amber-50 text-amber-700" : "border-slate-200 text-slate-500"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search ID / title"
                className="w-44 rounded-lg border border-slate-200 px-3 py-1.5 text-xs"
              />
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-[11px] uppercase text-[var(--muted)]">
                  <tr>
                    <th className="w-8 px-3 py-2" />
                    <th className="px-3 py-2">ID</th>
                    <th className="px-3 py-2">Test case</th>
                    <th className="px-3 py-2">Module</th>
                    <th className="px-3 py-2">Level</th>
                    <th className="px-3 py-2">Type</th>
                    <th className="px-3 py-2">Status</th>
                    <th className="px-3 py-2 text-right">Time</th>
                  </tr>
                </thead>
                <tbody>
                  {cases.map((c) => (
                    <Fragment key={c.id}>
                      <tr
                        onClick={() => toggle(c.id)}
                        className="cursor-pointer border-t border-slate-100 hover:bg-amber-50/40"
                      >
                        <td className="px-3 py-2.5 text-slate-400">
                          {open.has(c.id) ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                        </td>
                        <td className="px-3 py-2.5 font-mono font-bold text-amber-700">{c.id}</td>
                        <td className="px-3 py-2.5 font-semibold text-[var(--foreground)]">{c.title}</td>
                        <td className="px-3 py-2.5 text-[var(--muted)]">{c.module}</td>
                        <td className="px-3 py-2.5">{LEVEL_LABEL[c.level] ?? c.level}</td>
                        <td className="px-3 py-2.5">
                          <span className="rounded bg-sky-500/10 px-1.5 py-0.5 text-[10px] font-bold text-sky-700">Automated</span>
                        </td>
                        <td className="px-3 py-2.5">
                          <StatusPill status={c.status} />
                        </td>
                        <td className="px-3 py-2.5 text-right text-[var(--muted)]">{Math.round(c.duration_ms)} ms</td>
                      </tr>
                      {open.has(c.id) && (
                        <tr>
                          <td colSpan={8}>
                            <CaseDetail c={c} />
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {manual.length > 0 && (
        <div className="space-y-4">
          <div>
            <p className="flex items-center gap-2 text-sm font-bold text-[var(--foreground)]">
              <Hand size={16} className="text-violet-600" /> Manually verified checks ({manualDone}/{manual.length} recorded)
            </p>
            <p className="text-xs text-[var(--muted)]">
              UI behaviour that is verified by a person during the demonstration. These are kept separate from automated results.
            </p>
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            {manual.map((m) => (
              <ManualCard
                key={m.id}
                check={m}
                onSaved={(updated) =>
                  setData((d) => (d ? { ...d, manual_checks: d.manual_checks.map((x) => (x.id === updated.id ? updated : x)) } : d))
                }
              />
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-4 text-[11px] text-[var(--muted)]">
        <span className="flex items-center gap-1">
          <CircleCheck size={12} className="text-green-600" /> Passed: assertion held
        </span>
        <span className="flex items-center gap-1">
          <CircleX size={12} className="text-red-600" /> Failed: assertion did not hold (finding)
        </span>
        <span className="flex items-center gap-1">
          <Ban size={12} className="text-amber-600" /> Blocked: a required service or file was unavailable
        </span>
      </div>
    </div>
  );
}
