import { useCallback, useEffect, useMemo, useState } from "react";
import { BrainCircuit, RefreshCw, Sparkles } from "lucide-react";
import { rtmApi } from "../api/rtmApi";
import RtmPill from "../components/rtm/RtmPill";
import RtmStatCard from "../components/rtm/RtmStatCard";
import { RtmEmptyState, RtmErrorBanner, RtmSpinner } from "../components/rtm/RtmPageState";
import { useRtmContext } from "../components/rtm/useRtmContext";
import type { C2QualityPrediction, ImproveResponse, Matrix } from "../types/rtm";

const FEATURE_LABELS: [keyof C2QualityPrediction["features"], string][] = [
  ["completeness_score", "Completeness"],
  ["specificity_score", "Specificity"],
  ["requirement_coverage", "Requirement coverage"],
  ["ambiguity_score", "Ambiguity (lower is better)"],
];

export default function RtmQualityPredictionPage() {
  const ctx = useRtmContext();
  const [predictions, setPredictions] = useState<C2QualityPrediction[]>([]);
  const [matrix, setMatrix] = useState<Matrix | null>(null);
  const [selectedId, setSelectedId] = useState<string>("");
  const [improvement, setImprovement] = useState<ImproveResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [improving, setImproving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!ctx.projectId || !ctx.iterationId) return;
    setLoading(true);
    setError(null);
    try {
      const [preds, matrixData] = await Promise.all([
        rtmApi.getQualityPredictions(ctx.projectId, ctx.iterationId),
        rtmApi.getMatrix(ctx.projectId, ctx.iterationId),
      ]);
      setPredictions(preds);
      setMatrix(matrixData);
      setSelectedId((current) => current || preds[0]?.test_case_id || "");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load quality predictions.");
    } finally {
      setLoading(false);
    }
  }, [ctx.projectId, ctx.iterationId]);

  useEffect(() => {
    void load();
  }, [load]);

  const selected = useMemo(
    () => predictions.find((p) => p.test_case_id === selectedId) ?? null,
    [predictions, selectedId],
  );
  const linkedRow = useMemo(
    () => matrix?.rows.find((r) => r.user_story_id === selected?.story_id) ?? null,
    [matrix, selected],
  );

  useEffect(() => {
    setImprovement(null);
  }, [selectedId]);

  const improve = async () => {
    if (!selected) return;
    setImproving(true);
    setError(null);
    try {
      setImprovement(
        await rtmApi.improveTestCase({
          title: selected.title,
          description: selected.description,
          features: selected.features,
          quality_score: selected.quality_score,
          predicted_label: selected.predicted_label,
          probabilities: selected.probabilities,
          requirement_text: linkedRow?.requirement_text ?? "",
          user_story_title: linkedRow?.user_story_title ?? "",
          acceptance_criteria: linkedRow?.acceptance_criteria ?? [],
        }),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate improvements.");
    } finally {
      setImproving(false);
    }
  };

  const avg = predictions.length
    ? Math.round(predictions.reduce((s, p) => s + p.quality_score, 0) / predictions.length)
    : 0;
  const high = predictions.filter((p) => p.predicted_label === "High").length;
  const low = predictions.filter((p) => p.predicted_label === "Low").length;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold tracking-tight text-[var(--foreground)]">
            Quality Prediction
          </h2>
          <p className="mt-1 text-xs text-[var(--muted)]">
            Random Forest quality scoring of every generated test case in{" "}
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
        <RtmStatCard title="Tests Scored" value={loading ? "--" : String(predictions.length)} change="live from Component 2" />
        <RtmStatCard title="Avg Score" value={loading ? "--" : `${avg}`} change="out of 100" />
        <RtmStatCard title="High Quality" value={loading ? "--" : String(high)} change="model-classified High" />
        <RtmStatCard title="Low Quality" value={loading ? "--" : String(low)} change="candidates to improve" />
      </div>

      {ctx.loading || loading ? (
        <RtmSpinner label="Running the quality pipeline..." />
      ) : predictions.length === 0 ? (
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] shadow-sm">
          <RtmEmptyState
            icon={<BrainCircuit size={20} />}
            title="No test cases to score"
            subtitle="Generate gherkin scenarios in Test Case Gen first — every scenario is scored here automatically."
          />
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-5">
          <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card)] shadow-sm lg:col-span-2">
            <div className="border-b border-slate-100 px-5 py-4">
              <h3 className="text-sm font-bold text-[var(--foreground)]">Test Cases</h3>
            </div>
            <div className="max-h-[540px] divide-y divide-slate-50 overflow-y-auto">
              {predictions.map((prediction) => (
                <button
                  key={prediction.test_case_id}
                  onClick={() => setSelectedId(prediction.test_case_id)}
                  className={`flex w-full items-center justify-between gap-3 px-5 py-3 text-left hover:bg-slate-50/60 ${
                    prediction.test_case_id === selectedId ? "bg-amber-50/50" : ""
                  }`}
                >
                  <span className="min-w-0">
                    <span className="block truncate text-xs font-semibold text-[var(--foreground)]">
                      {prediction.title}
                    </span>
                    <span className="mt-0.5 block truncate text-[10px] text-slate-400">
                      {prediction.status}
                    </span>
                  </span>
                  <span className="flex shrink-0 items-center gap-2">
                    <span className="text-xs font-black text-[var(--muted)]">
                      {Math.round(prediction.quality_score)}
                    </span>
                    <RtmPill label={prediction.predicted_label} type="quality" />
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-4 lg:col-span-3">
            {selected && (
              <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="text-sm font-bold text-[var(--foreground)]">{selected.title}</h3>
                    {linkedRow && (
                      <p className="mt-1 text-xs text-[var(--muted)]">
                        {linkedRow.user_story_title} · REQ-
                        {linkedRow.requirement_id.slice(0, 8).toUpperCase()}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-extrabold text-amber-600">
                      {Math.round(selected.quality_score)}
                    </span>
                    <RtmPill label={selected.predicted_label} type="quality" />
                  </div>
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {FEATURE_LABELS.map(([key, label]) => {
                    const raw = selected.features[key];
                    const pct = typeof raw === "number" ? Math.min(Math.round(raw * 100), 100) : 0;
                    return (
                      <div key={key}>
                        <div className="mb-1 flex items-center justify-between text-[10px] font-bold uppercase tracking-widest text-slate-400">
                          <span>{label}</span>
                          <span>{pct}%</span>
                        </div>
                        <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
                          <div className="h-full rounded-full bg-amber-500" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>

                <pre className="mt-4 max-h-48 overflow-auto rounded-xl bg-slate-50 p-4 text-[11px] leading-relaxed text-slate-600">
                  {selected.description || "No gherkin text available."}
                </pre>

                <button
                  onClick={() => void improve()}
                  disabled={improving}
                  className="mt-4 flex items-center gap-2 rounded-lg bg-gradient-to-r from-amber-600 to-orange-600 px-4 py-2 text-xs font-bold text-white shadow-md shadow-amber-200 hover:from-amber-700 hover:to-orange-700 disabled:opacity-50"
                >
                  <Sparkles size={14} /> {improving ? "Analyzing..." : "Improve This Test Case"}
                </button>
              </div>
            )}

            {improvement && (
              <div className="rounded-2xl border border-amber-200 bg-amber-50/50 p-6 shadow-sm">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-amber-800">Recommended Improvement</h3>
                  <span className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-500">
                      {Math.round(selected?.quality_score ?? 0)} →
                    </span>
                    <span className="text-xl font-extrabold text-amber-600">
                      {Math.round(improvement.improved_quality_score)}
                    </span>
                    <RtmPill label={improvement.improved_predicted_label} type="quality" />
                  </span>
                </div>
                <ul className="mt-3 space-y-1.5">
                  {improvement.gaps.map((gap) => (
                    <li key={gap.area} className="text-xs text-amber-900">
                      <span className="font-bold capitalize">{gap.label}:</span> {gap.recommendation}
                    </li>
                  ))}
                </ul>
                <pre className="mt-4 max-h-64 overflow-auto rounded-xl bg-white p-4 text-[11px] leading-relaxed text-slate-600">
                  {improvement.improved_description}
                </pre>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
