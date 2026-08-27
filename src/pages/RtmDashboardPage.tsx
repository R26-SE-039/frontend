import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Activity, GitBranch, RefreshCw } from "lucide-react";
import { rtmApi } from "../api/rtmApi";
import RtmPill from "../components/rtm/RtmPill";
import RtmStatCard from "../components/rtm/RtmStatCard";
import { RtmEmptyState, RtmErrorBanner, RtmSpinner } from "../components/rtm/RtmPageState";
import { useRtmContext } from "../components/rtm/useRtmContext";
import type { DashboardSummary } from "../types/rtm";

const BUCKET_COLORS: Record<string, string> = {
  High: "bg-green-500",
  Medium: "bg-yellow-500",
  Low: "bg-red-500",
};

export default function RtmDashboardPage() {
  const ctx = useRtmContext();
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!ctx.projectId || !ctx.iterationId) return;
    setLoading(true);
    setError(null);
    try {
      setSummary(await rtmApi.getDashboardSummary(ctx.projectId, ctx.iterationId));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load the dashboard.");
    } finally {
      setLoading(false);
    }
  }, [ctx.projectId, ctx.iterationId]);

  useEffect(() => {
    void load();
  }, [load]);

  const matrix = summary?.matrix;
  const coveragePct = matrix
    ? matrix.total_requirements
      ? Math.round((matrix.fully_covered / matrix.total_requirements) * 100)
      : 0
    : null;
  const totalBucketTests = summary?.quality_distribution.reduce((sum, b) => sum + b.tests, 0) ?? 0;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold tracking-tight text-[var(--foreground)]">
            RTM Dashboard
          </h2>
          <p className="mt-1 text-xs text-[var(--muted)]">
            Coverage & quality overview for{" "}
            <span className="font-semibold text-amber-600">{ctx.projectName ?? "…"}</span>
            {ctx.iterationName && (
              <>
                {" · iteration "}
                <span className="font-semibold text-amber-600">{ctx.iterationName}</span>
              </>
            )}
          </p>
        </div>
        <button
          onClick={() => void load()}
          disabled={loading || !!ctx.error}
          className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-500 hover:text-amber-600 disabled:opacity-50"
        >
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} /> Refresh
        </button>
      </div>

      {(ctx.error || error) && <RtmErrorBanner message={ctx.error ?? error ?? ""} />}

      {ctx.loading || loading ? (
        <RtmSpinner label="Computing live summary..." />
      ) : summary && matrix ? (
        <>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <RtmStatCard
              title="Requirement Coverage"
              value={`${coveragePct}%`}
              change={`${matrix.fully_covered}/${matrix.total_requirements} fully covered`}
            />
            <RtmStatCard
              title="Test Cases"
              value={String(matrix.total_tests)}
              change={`${matrix.pending_tests} awaiting execution`}
            />
            <RtmStatCard
              title="Pass Rate"
              value={`${matrix.pass_rate}%`}
              change={`${matrix.defects} failing test${matrix.defects === 1 ? "" : "s"}`}
            />
            <RtmStatCard
              title="Avg Quality Score"
              value={summary.avg_quality_score ? `${summary.avg_quality_score}` : "--"}
              change="Random Forest quality model"
            />
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-sm">
              <h3 className="text-sm font-bold text-[var(--foreground)]">Quality Distribution</h3>
              <p className="mt-1 text-xs text-[var(--muted)]">
                Model-predicted quality of every test case in this iteration
              </p>
              <div className="mt-6 space-y-4">
                {summary.quality_distribution.map((bucket) => (
                  <div key={bucket.label}>
                    <div className="mb-1 flex items-center justify-between text-xs">
                      <span className="font-semibold text-[var(--foreground)]">{bucket.label}</span>
                      <span className="font-black text-[var(--muted)]">{bucket.tests}</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className={`h-full rounded-full ${BUCKET_COLORS[bucket.label] ?? "bg-amber-500"}`}
                        style={{
                          width: totalBucketTests ? `${(bucket.tests / totalBucketTests) * 100}%` : "0%",
                        }}
                      />
                    </div>
                  </div>
                ))}
                {totalBucketTests === 0 && (
                  <p className="text-xs italic text-slate-400">No test cases scored yet.</p>
                )}
              </div>
            </div>

            <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-[var(--foreground)]">Code Coverage</h3>
                <Link to="/rtm/coverage" className="text-xs font-bold text-amber-600 hover:underline">
                  Open analysis →
                </Link>
              </div>
              {summary.code_coverage && summary.code_coverage.status === "DONE" ? (
                <div className="mt-6 grid grid-cols-3 gap-4 text-center">
                  {(
                    [
                      ["Overall", summary.code_coverage.overall_coverage],
                      ["Statements", summary.code_coverage.statement_coverage],
                      ["Branches", summary.code_coverage.branch_coverage],
                    ] as const
                  ).map(([label, value]) => (
                    <div key={label} className="rounded-xl bg-slate-50 p-4">
                      <p className="text-2xl font-extrabold text-amber-600">{value.toFixed(1)}%</p>
                      <p className="mt-1 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                        {label}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="mt-6 flex flex-col items-center gap-2 py-6 text-center">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                    <GitBranch size={18} />
                  </div>
                  <p className="text-xs text-[var(--muted)]">
                    No completed coverage run for this project yet.
                  </p>
                </div>
              )}
              {summary.code_coverage?.repo_url && (
                <p className="mt-4 truncate text-[10px] text-slate-400">
                  {summary.code_coverage.repo_url}
                </p>
              )}
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card)] shadow-sm">
            <div className="border-b border-slate-100 px-6 py-4">
              <h3 className="text-sm font-bold text-[var(--foreground)]">Recent Executions</h3>
            </div>
            {summary.recent_runs.length === 0 ? (
              <RtmEmptyState
                icon={<Activity size={20} />}
                title="No test runs yet"
                subtitle="Run a generated suite from Test Script Gen — executions land here automatically."
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 text-[10px] font-black uppercase tracking-widest text-slate-400">
                      <th className="px-6 py-3">Run</th>
                      <th className="px-4 py-3">Framework</th>
                      <th className="px-4 py-3">Mode</th>
                      <th className="px-4 py-3">Started</th>
                      <th className="px-4 py-3 text-center">Passed</th>
                      <th className="px-4 py-3 text-center">Failed</th>
                      <th className="px-4 py-3">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {summary.recent_runs.map((run) => (
                      <tr key={run.id} className="border-b border-slate-50 hover:bg-slate-50/60">
                        <td className="px-6 py-3 text-xs font-mono text-[var(--muted)]">
                          {run.id.slice(0, 8)}
                        </td>
                        <td className="px-4 py-3 text-xs capitalize text-[var(--foreground)]">
                          {run.framework}
                        </td>
                        <td className="px-4 py-3 text-xs capitalize text-[var(--muted)]">{run.mode}</td>
                        <td className="px-4 py-3 text-xs text-[var(--muted)]">
                          {run.started_at ? new Date(run.started_at).toLocaleString() : "—"}
                        </td>
                        <td className="px-4 py-3 text-center text-xs font-bold text-green-600">
                          {run.passed_count}
                        </td>
                        <td className="px-4 py-3 text-center text-xs font-bold text-red-600">
                          {run.failed_count}
                        </td>
                        <td className="px-4 py-3">
                          <RtmPill label={run.status} type="run" />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      ) : null}
    </div>
  );
}
