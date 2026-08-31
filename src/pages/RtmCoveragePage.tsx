import { useCallback, useEffect, useRef, useState } from "react";
import { GitBranch, Play, RefreshCw } from "lucide-react";
import { rtmApi } from "../api/rtmApi";
import { RtmEmptyState, RtmErrorBanner, RtmSpinner } from "../components/rtm/RtmPageState";
import { useRtmContext } from "../components/rtm/useRtmContext";
import type { CoverageReport, GithubConnectionStatus } from "../types/rtm";

const LOG_COLORS: Record<string, string> = {
  error: "text-red-400",
  success: "text-green-400",
  tip: "text-amber-300",
  info: "text-slate-300",
};

export default function RtmCoveragePage() {
  const ctx = useRtmContext();
  const [github, setGithub] = useState<GithubConnectionStatus | null>(null);
  const [report, setReport] = useState<CoverageReport | null>(null);
  const [manualUrl, setManualUrl] = useState("");
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pollRef = useRef<number | null>(null);
  const logEndRef = useRef<HTMLDivElement | null>(null);

  const stopPolling = useCallback(() => {
    if (pollRef.current !== null) {
      window.clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  const refreshReport = useCallback(async () => {
    if (!ctx.projectId) return;
    const data = await rtmApi.getCoverageReport(ctx.projectId);
    setReport(data);
    if (data.status !== "RUNNING") stopPolling();
  }, [ctx.projectId, stopPolling]);

  const startPolling = useCallback(() => {
    stopPolling();
    pollRef.current = window.setInterval(() => {
      void refreshReport().catch(() => stopPolling());
    }, 2500);
  }, [refreshReport, stopPolling]);

  const load = useCallback(async () => {
    if (!ctx.projectId) return;
    setLoading(true);
    setError(null);
    try {
      const [status, reportData] = await Promise.all([
        rtmApi.getGithubStatus(ctx.projectId),
        rtmApi.getCoverageReport(ctx.projectId),
      ]);
      setGithub(status);
      setReport(reportData);
      if (reportData.status === "RUNNING") startPolling();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load coverage state.");
    } finally {
      setLoading(false);
    }
  }, [ctx.projectId, startPolling]);

  useEffect(() => {
    void load();
    return stopPolling;
  }, [load, stopPolling]);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [report?.logs.length]);

  const analyze = async () => {
    if (!ctx.projectId) return;
    setStarting(true);
    setError(null);
    try {
      await rtmApi.analyzeCoverage(ctx.projectId, github?.source === "project" ? "" : manualUrl);
      await refreshReport();
      startPolling();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to start the analysis.");
    } finally {
      setStarting(false);
    }
  };

  const running = report?.status === "RUNNING";
  const done = report?.status === "DONE";

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold tracking-tight text-[var(--foreground)]">
            Code Coverage
          </h2>
          <p className="mt-1 text-xs text-[var(--muted)]">
            Statement & branch coverage of the repository connected to{" "}
            <span className="font-semibold text-amber-600">{ctx.projectName ?? "…"}</span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => void load()}
            disabled={loading || !!ctx.error}
            className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-500 hover:text-amber-600 disabled:opacity-50"
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} /> Refresh
          </button>
          <button
            onClick={() => void analyze()}
            disabled={starting || running || !!ctx.error || (github?.source !== "project" && !manualUrl.trim())}
            className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-amber-600 to-orange-600 px-4 py-2 text-xs font-bold text-white shadow-md shadow-amber-200 hover:from-amber-700 hover:to-orange-700 disabled:opacity-50"
          >
            <Play size={14} /> {running ? "Running..." : starting ? "Starting..." : "Analyze Coverage"}
          </button>
        </div>
      </div>

      {(ctx.error || error) && <RtmErrorBanner message={ctx.error ?? error ?? ""} />}

      <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-sm">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
            <GitBranch size={18} />
          </div>
          {github?.source === "project" ? (
            <div>
              <p className="text-sm font-bold text-[var(--foreground)]">{github.repo_full}</p>
              <p className="text-xs text-[var(--muted)]">
                Connected in Test Script Gen
                {github.username ? ` by ${github.username}` : ""} · branch{" "}
                {github.default_branch ?? "main"} — analyzed with the project’s own credentials.
              </p>
            </div>
          ) : (
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-[var(--muted)]">
                {github?.reason ??
                  "No GitHub connection for this project — connect one in Test Script Gen, or paste a repository URL:"}
              </p>
              <input
                value={manualUrl}
                onChange={(e) => setManualUrl(e.target.value)}
                placeholder="https://github.com/owner/repo"
                className="mt-2 w-full max-w-xl rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 outline-none focus:border-amber-300 focus:ring-2 focus:ring-amber-100"
              />
            </div>
          )}
        </div>
      </div>

      {ctx.loading || loading ? (
        <RtmSpinner label="Loading coverage state..." />
      ) : (
        <>
          {(running || (report?.logs.length ?? 0) > 0) && (
            <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-800 px-4 py-2">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                  Analysis Log
                </p>
                {running && (
                  <span className="flex items-center gap-1.5 text-[10px] font-bold text-amber-400">
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-amber-400" /> RUNNING
                  </span>
                )}
              </div>
              <div className="max-h-64 overflow-y-auto p-4 font-mono text-[11px] leading-relaxed">
                {report?.logs.map((log, i) => (
                  <p key={i} className={LOG_COLORS[log.level] ?? "text-slate-300"}>
                    <span className="text-slate-500">[{log.timestamp}]</span> {log.message}
                  </p>
                ))}
                <div ref={logEndRef} />
              </div>
            </div>
          )}

          <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card)] shadow-sm">
            <div className="border-b border-slate-100 px-6 py-4">
              <h3 className="text-sm font-bold text-[var(--foreground)]">Per-File Coverage</h3>
            </div>
            {!done || report!.files.length === 0 ? (
              <RtmEmptyState
                icon={<GitBranch size={20} />}
                title="No coverage report yet"
                subtitle="Run an analysis — the clone, test run, and per-file coverage breakdown appear here."
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 text-[10px] font-black uppercase tracking-widest text-slate-400">
                      <th className="px-6 py-3">File</th>
                      <th className="px-4 py-3 text-center">Statements</th>
                      <th className="px-4 py-3 text-center">Stmt %</th>
                      <th className="px-4 py-3 text-center">Branches</th>
                      <th className="px-4 py-3 text-center">Branch %</th>
                      <th className="px-4 py-3">Overall</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report!.files.map((file) => (
                      <tr key={file.file_name} className="border-b border-slate-50 hover:bg-slate-50/60">
                        <td className="max-w-md truncate px-6 py-3 font-mono text-xs text-[var(--foreground)]">
                          {file.file_name}
                        </td>
                        <td className="px-4 py-3 text-center text-xs text-[var(--muted)]">{file.statements}</td>
                        <td className="px-4 py-3 text-center text-xs font-bold text-[var(--foreground)]">
                          {file.statement_coverage.toFixed(1)}%
                        </td>
                        <td className="px-4 py-3 text-center text-xs text-[var(--muted)]">{file.branches}</td>
                        <td className="px-4 py-3 text-center text-xs font-bold text-[var(--foreground)]">
                          {file.branch_coverage.toFixed(1)}%
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="h-1.5 w-24 overflow-hidden rounded-full bg-slate-100">
                              <div
                                className={`h-full rounded-full ${
                                  file.overall_coverage >= 80
                                    ? "bg-green-500"
                                    : file.overall_coverage >= 50
                                      ? "bg-amber-500"
                                      : "bg-red-500"
                                }`}
                                style={{ width: `${Math.min(file.overall_coverage, 100)}%` }}
                              />
                            </div>
                            <span className="text-xs font-black text-[var(--muted)]">
                              {file.overall_coverage.toFixed(1)}%
                            </span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
