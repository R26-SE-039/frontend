import { useCallback, useEffect, useState } from "react";
import { Copy, RefreshCw, ShieldCheck, TrendingDown } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { rtmApi } from "../api/rtmApi";
import RtmStatCard from "../components/rtm/RtmStatCard";
import { RtmEmptyState, RtmErrorBanner, RtmSpinner } from "../components/rtm/RtmPageState";
import { useRtmContext } from "../components/rtm/useRtmContext";
import type { PortfolioAnalysis, PortfolioItem } from "../types/rtm";

export default function RtmPortfolioPage() {
  const ctx = useRtmContext();
  const [analysis, setAnalysis] = useState<PortfolioAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!ctx.projectId || !ctx.iterationId) return;
    setLoading(true);
    setError(null);
    try {
      setAnalysis(await rtmApi.getPortfolio(ctx.projectId, ctx.iterationId));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to analyze the portfolio.");
    } finally {
      setLoading(false);
    }
  }, [ctx.projectId, ctx.iterationId]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold tracking-tight text-[var(--foreground)]">
            Test Portfolio
          </h2>
          <p className="mt-1 text-xs text-[var(--muted)]">
            Optimization actions for the live test set of{" "}
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

      <div className="grid gap-4 md:grid-cols-3">
        <RtmStatCard
          title="Redundant"
          value={loading ? "--" : String(analysis?.redundant.length ?? 0)}
          change="near-duplicates to merge"
        />
        <RtmStatCard
          title="Critical"
          value={loading ? "--" : String(analysis?.critical.length ?? 0)}
          change="protect these tests"
        />
        <RtmStatCard
          title="Weak"
          value={loading ? "--" : String(analysis?.weak.length ?? 0)}
          change="strengthen assertions"
        />
      </div>

      {ctx.loading || loading ? (
        <RtmSpinner label="Analyzing the test portfolio..." />
      ) : analysis ? (
        <div className="grid gap-4 xl:grid-cols-3">
          <PortfolioColumn
            title="Redundant"
            icon={Copy}
            accent="text-purple-600 bg-purple-50"
            items={analysis.redundant}
            empty="No near-duplicate tests detected."
          />
          <PortfolioColumn
            title="Critical"
            icon={ShieldCheck}
            accent="text-red-600 bg-red-50"
            items={analysis.critical}
            empty="No sole-coverage or failing tests on Must/Should requirements."
          />
          <PortfolioColumn
            title="Weak"
            icon={TrendingDown}
            accent="text-amber-600 bg-amber-50"
            items={analysis.weak}
            empty="No tests classified Low by the quality model."
          />
        </div>
      ) : null}
    </div>
  );
}

function PortfolioColumn({
  title,
  icon: Icon,
  accent,
  items,
  empty,
}: {
  title: string;
  icon: LucideIcon;
  accent: string;
  items: PortfolioItem[];
  empty: string;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card)] shadow-sm">
      <div className="flex items-center gap-2 border-b border-slate-100 px-5 py-4">
        <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${accent}`}>
          <Icon size={16} />
        </span>
        <h3 className="text-sm font-bold text-[var(--foreground)]">{title}</h3>
        <span className="ml-auto text-xs font-black text-[var(--muted)]">{items.length}</span>
      </div>
      {items.length === 0 ? (
        <RtmEmptyState icon={<Icon size={18} />} title="Nothing here" subtitle={empty} />
      ) : (
        <div className="max-h-[480px] divide-y divide-slate-50 overflow-y-auto">
          {items.map((item, i) => (
            <div key={`${item.test_id}-${i}`} className="px-5 py-3">
              <p className="text-xs font-semibold text-[var(--foreground)]">{item.test_title}</p>
              {item.user_story_title && (
                <p className="mt-0.5 text-[10px] text-slate-400">{item.user_story_title}</p>
              )}
              <p className="mt-1 text-xs text-[var(--muted)]">{item.reason}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
