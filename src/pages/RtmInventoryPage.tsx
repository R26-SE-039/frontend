import { useCallback, useEffect, useMemo, useState } from "react";
import { FileText, RefreshCw } from "lucide-react";
import { rtmApi } from "../api/rtmApi";
import RtmPill from "../components/rtm/RtmPill";
import RtmStatCard from "../components/rtm/RtmStatCard";
import { RtmEmptyState, RtmErrorBanner, RtmSpinner } from "../components/rtm/RtmPageState";
import { useRtmContext } from "../components/rtm/useRtmContext";
import type { InventoryItem } from "../types/rtm";

export default function RtmInventoryPage() {
  const ctx = useRtmContext();
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState("all");

  const load = useCallback(async () => {
    if (!ctx.projectId || !ctx.iterationId) return;
    setLoading(true);
    setError(null);
    try {
      setItems(await rtmApi.getInventory(ctx.projectId, ctx.iterationId));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load the test inventory.");
    } finally {
      setLoading(false);
    }
  }, [ctx.projectId, ctx.iterationId]);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = useMemo(
    () => (statusFilter === "all" ? items : items.filter((i) => i.status === statusFilter)),
    [items, statusFilter],
  );

  const passed = items.filter((i) => i.status === "approved").length;
  const failed = items.filter((i) => i.status === "rejected").length;
  const avgQuality = items.length
    ? Math.round(
        items.reduce((sum, i) => sum + (i.quality_score ?? 0), 0) / items.length,
      )
    : 0;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold tracking-tight text-[var(--foreground)]">
            Test Inventory
          </h2>
          <p className="mt-1 text-xs text-[var(--muted)]">
            Every test case in play for{" "}
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

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <RtmStatCard title="Total Tests" value={loading ? "--" : String(items.length)} change="C2 + generated" />
        <RtmStatCard title="Passing" value={loading ? "--" : String(passed)} change="latest execution result" />
        <RtmStatCard title="Failing" value={loading ? "--" : String(failed)} change="need attention" />
        <RtmStatCard title="Avg Quality" value={loading ? "--" : `${avgQuality}`} change="Random Forest score /100" />
      </div>

      <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card)] shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <h3 className="text-sm font-bold text-[var(--foreground)]">Test Cases</h3>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs font-semibold text-slate-600 outline-none focus:border-amber-300"
          >
            <option value="all">All statuses</option>
            <option value="approved">Passing</option>
            <option value="rejected">Failing</option>
            <option value="pending">Pending</option>
          </select>
        </div>

        {ctx.loading || loading ? (
          <RtmSpinner label="Scoring test cases..." />
        ) : filtered.length === 0 ? (
          <RtmEmptyState
            icon={<FileText size={20} />}
            title="No test cases found"
            subtitle="Generate gherkin scenarios in Test Case Gen, or resolve coverage gaps — everything lands here automatically."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-[10px] font-black uppercase tracking-widest text-slate-400">
                  <th className="px-6 py-3">Test Case</th>
                  <th className="px-4 py-3">User Story</th>
                  <th className="px-4 py-3">Priority</th>
                  <th className="px-4 py-3">Source</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-center">Quality</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((item) => (
                  <tr key={item.id} className="border-b border-slate-50 hover:bg-slate-50/60">
                    <td className="max-w-md px-6 py-3">
                      <p className="truncate text-xs font-semibold text-[var(--foreground)]" title={item.title}>
                        {item.title}
                      </p>
                      <p className="mt-0.5 truncate text-[10px] text-slate-400" title={item.requirement_text}>
                        REQ-{item.requirement_id.slice(0, 8).toUpperCase()} · {item.requirement_text}
                      </p>
                    </td>
                    <td className="max-w-xs px-4 py-3">
                      <p className="truncate text-xs text-[var(--muted)]" title={item.user_story_title}>
                        {item.user_story_title || "—"}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <RtmPill label={item.priority || "—"} type="priority" />
                    </td>
                    <td className="px-4 py-3">
                      <RtmPill label={item.source === "C2" ? "C2" : "Generated"} type="source" />
                    </td>
                    <td className="px-4 py-3">
                      <RtmPill label={item.status} type="test" />
                    </td>
                    <td className="px-4 py-3 text-center">
                      {item.predicted_label ? (
                        <span className="inline-flex items-center gap-2">
                          <RtmPill label={item.predicted_label} type="quality" />
                          <span className="text-xs font-black text-[var(--muted)]">
                            {Math.round(item.quality_score ?? 0)}
                          </span>
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
