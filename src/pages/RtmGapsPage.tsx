import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, RefreshCw, ShieldAlert, Sparkles, X } from "lucide-react";
import { rtmApi } from "../api/rtmApi";
import RtmPill from "../components/rtm/RtmPill";
import RtmStatCard from "../components/rtm/RtmStatCard";
import { RtmEmptyState, RtmErrorBanner, RtmSpinner } from "../components/rtm/RtmPageState";
import { useRtmContext } from "../components/rtm/useRtmContext";
import type { CoverageGap, GeneratedGapTestCasePrediction } from "../types/rtm";

export default function RtmGapsPage() {
  const ctx = useRtmContext();
  const [gaps, setGaps] = useState<CoverageGap[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [generatingAll, setGeneratingAll] = useState(false);
  const [modalGap, setModalGap] = useState<CoverageGap | null>(null);
  const [generated, setGenerated] = useState<Record<string, GeneratedGapTestCasePrediction>>({});
  const [busyCriterion, setBusyCriterion] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!ctx.projectId || !ctx.iterationId) return;
    setLoading(true);
    setError(null);
    try {
      setGaps(await rtmApi.getCoverageGaps(ctx.projectId, ctx.iterationId));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load coverage gaps.");
    } finally {
      setLoading(false);
    }
  }, [ctx.projectId, ctx.iterationId]);

  useEffect(() => {
    void load();
  }, [load]);

  const gapKey = (requirementId: string, criterion: string) => `${requirementId}::${criterion}`;

  const generateOne = async (gap: CoverageGap, criterion: string) => {
    if (!ctx.projectId) return;
    setBusyCriterion(gapKey(gap.requirement_id, criterion));
    setError(null);
    try {
      const result = await rtmApi.generateGapTestCase({
        project_id: ctx.projectId,
        requirement_id: gap.requirement_id,
        requirement_text: gap.requirement_text,
        user_story_id: gap.user_story_id,
        user_story_title: gap.user_story_title,
        user_story_text: gap.user_story_text,
        acceptance_criterion: criterion,
      });
      setGenerated((g) => ({ ...g, [gapKey(gap.requirement_id, criterion)]: result }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate the test case.");
    } finally {
      setBusyCriterion(null);
    }
  };

  const generateAllCritical = async () => {
    if (!ctx.projectId) return;
    const items = gaps
      .filter((g) => g.risk_level === "CRITICAL" || g.risk_level === "HIGH")
      .flatMap((gap) =>
        gap.missing_acceptance_criteria.map((criterion) => ({
          project_id: ctx.projectId as string,
          requirement_id: gap.requirement_id,
          requirement_text: gap.requirement_text,
          user_story_id: gap.user_story_id,
          user_story_title: gap.user_story_title,
          user_story_text: gap.user_story_text,
          acceptance_criterion: criterion,
        })),
      );
    if (items.length === 0) return;
    setGeneratingAll(true);
    setError(null);
    try {
      const { generated: results } = await rtmApi.generateAllGapTestCases(items);
      setGenerated((g) => {
        const next = { ...g };
        for (const result of results) {
          next[gapKey(result.test_case.requirement_id, result.test_case.acceptance_criterion)] = result;
        }
        return next;
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Bulk generation failed.");
    } finally {
      setGeneratingAll(false);
    }
  };

  const addTo = async (key: string, target: "inventory" | "rtm") => {
    const item = generated[key];
    if (!item) return;
    try {
      const updated = await rtmApi.addGapTestCase(item.test_case.id, target);
      setGenerated((g) => ({ ...g, [key]: updated }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add the test case.");
    }
  };

  const critical = gaps.filter((g) => g.risk_level === "CRITICAL").length;
  const high = gaps.filter((g) => g.risk_level === "HIGH").length;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold tracking-tight text-[var(--foreground)]">
            Coverage Gaps
          </h2>
          <p className="mt-1 text-xs text-[var(--muted)]">
            Risk-prioritized uncovered requirements for{" "}
            <span className="font-semibold text-amber-600">{ctx.projectName ?? "…"}</span>
            {ctx.iterationName && (
              <>
                {" · iteration "}
                <span className="font-semibold text-amber-600">{ctx.iterationName}</span>
              </>
            )}
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
            onClick={() => void generateAllCritical()}
            disabled={generatingAll || loading || gaps.length === 0}
            className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-amber-600 to-orange-600 px-4 py-2 text-xs font-bold text-white shadow-md shadow-amber-200 hover:from-amber-700 hover:to-orange-700 disabled:opacity-50"
          >
            <Sparkles size={14} />
            {generatingAll ? "Generating..." : "Generate All for Critical Gaps"}
          </button>
        </div>
      </div>

      {(ctx.error || error) && <RtmErrorBanner message={ctx.error ?? error ?? ""} />}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <RtmStatCard title="Open Gaps" value={loading ? "--" : String(gaps.length)} change="requirements at risk" />
        <RtmStatCard title="Critical" value={loading ? "--" : String(critical)} change="highest business impact" />
        <RtmStatCard title="High Risk" value={loading ? "--" : String(high)} change="prioritize next" />
        <RtmStatCard
          title="Generated"
          value={String(Object.keys(generated).length)}
          change="gap test cases this session"
        />
      </div>

      <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card)] shadow-sm">
        <div className="border-b border-slate-100 px-6 py-4">
          <h3 className="text-sm font-bold text-[var(--foreground)]">Prioritized Gaps</h3>
        </div>
        {ctx.loading || loading ? (
          <RtmSpinner label="Scoring coverage risk..." />
        ) : gaps.length === 0 ? (
          <RtmEmptyState
            icon={<CheckCircle2 size={20} />}
            title="No coverage gaps"
            subtitle="Every requirement in this iteration has adequate, passing test coverage. Nice."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-[10px] font-black uppercase tracking-widest text-slate-400">
                  <th className="px-6 py-3">Requirement</th>
                  <th className="px-4 py-3">Priority</th>
                  <th className="px-4 py-3 text-center">Risk Score</th>
                  <th className="px-4 py-3">Risk</th>
                  <th className="px-4 py-3 text-center">AC Covered</th>
                  <th className="px-4 py-3 text-center">Tests</th>
                  <th className="px-4 py-3">Recommended Action</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {gaps.map((gap) => (
                  <tr key={gap.requirement_id} className="border-b border-slate-50 hover:bg-slate-50/60">
                    <td className="max-w-sm px-6 py-3">
                      <p className="text-xs font-semibold text-[var(--foreground)]">{gap.requirement_text}</p>
                      <p className="mt-0.5 truncate text-[10px] text-slate-400">{gap.user_story_title}</p>
                    </td>
                    <td className="px-4 py-3">
                      <RtmPill label={gap.priority || "—"} type="priority" />
                    </td>
                    <td className="px-4 py-3 text-center text-xs font-black text-[var(--foreground)]">
                      {gap.risk_score.toFixed(1)}
                    </td>
                    <td className="px-4 py-3">
                      <RtmPill label={gap.risk_level} type="risk" />
                    </td>
                    <td className="px-4 py-3 text-center text-xs font-bold text-[var(--muted)]">
                      {gap.covered_acceptance_criteria}/{gap.total_acceptance_criteria}
                    </td>
                    <td className="px-4 py-3 text-center text-xs font-bold text-[var(--muted)]">
                      {gap.linked_test_case_count}
                    </td>
                    <td className="max-w-xs px-4 py-3 text-xs text-[var(--muted)]">{gap.recommended_action}</td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => setModalGap(gap)}
                        className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-bold text-amber-700 hover:bg-amber-100"
                      >
                        Resolve
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <AnimatePresence>
        {modalGap && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4"
            onClick={() => setModalGap(null)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 10 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 10 }}
              onClick={(e) => e.stopPropagation()}
              className="flex max-h-[85vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
            >
              <div className="flex items-start justify-between border-b border-slate-100 px-6 py-4">
                <div>
                  <h3 className="flex items-center gap-2 text-sm font-bold text-slate-800">
                    <ShieldAlert size={16} className="text-amber-600" /> Resolve Coverage Gap
                  </h3>
                  <p className="mt-1 text-xs text-slate-500">{modalGap.requirement_text}</p>
                </div>
                <button onClick={() => setModalGap(null)} className="text-slate-400 hover:text-slate-600">
                  <X size={18} />
                </button>
              </div>
              <div className="flex-1 space-y-4 overflow-y-auto px-6 py-4">
                {modalGap.missing_acceptance_criteria.length === 0 && (
                  <p className="text-xs text-slate-500">
                    All acceptance criteria are textually covered — the risk comes from failing or
                    unexecuted tests. Review them in the Test Inventory.
                  </p>
                )}
                {modalGap.missing_acceptance_criteria.map((criterion) => {
                  const key = gapKey(modalGap.requirement_id, criterion);
                  const item = generated[key];
                  return (
                    <div key={criterion} className="rounded-xl border border-slate-200 p-4">
                      <div className="flex items-start justify-between gap-4">
                        <p className="text-xs font-medium text-slate-700">{criterion}</p>
                        {!item && (
                          <button
                            onClick={() => void generateOne(modalGap, criterion)}
                            disabled={busyCriterion === key}
                            className="shrink-0 rounded-lg bg-gradient-to-r from-amber-600 to-orange-600 px-3 py-1.5 text-xs font-bold text-white shadow-sm hover:from-amber-700 hover:to-orange-700 disabled:opacity-50"
                          >
                            {busyCriterion === key ? "Generating..." : "Generate Test Case"}
                          </button>
                        )}
                      </div>
                      {item && (
                        <div className="mt-3 space-y-3">
                          <pre className="overflow-x-auto rounded-lg bg-slate-50 p-3 text-[11px] leading-relaxed text-slate-600">
                            {item.test_case.description}
                          </pre>
                          <div className="flex items-center gap-2">
                            <RtmPill label={item.prediction.predicted_label} type="quality" />
                            <span className="text-xs font-black text-slate-500">
                              {Math.round(item.prediction.quality_score)}/100
                            </span>
                            <span className="flex-1" />
                            <button
                              onClick={() => void addTo(key, "inventory")}
                              disabled={item.test_case.added_to_inventory}
                              className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-600 hover:text-amber-600 disabled:opacity-50"
                            >
                              {item.test_case.added_to_inventory ? "✓ In Inventory" : "Add to Inventory"}
                            </button>
                            <button
                              onClick={() => void addTo(key, "rtm")}
                              disabled={item.test_case.added_to_rtm}
                              className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-bold text-amber-700 hover:bg-amber-100 disabled:opacity-50"
                            >
                              {item.test_case.added_to_rtm ? "✓ In RTM" : "Add to RTM"}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
