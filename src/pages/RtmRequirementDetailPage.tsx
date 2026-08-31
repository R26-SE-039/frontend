import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, CheckCircle2, FileText, XCircle } from "lucide-react";
import { rtmApi } from "../api/rtmApi";
import RtmPill from "../components/rtm/RtmPill";
import { RtmErrorBanner, RtmSpinner } from "../components/rtm/RtmPageState";
import { useRtmContext } from "../components/rtm/useRtmContext";
import type { MatrixRow } from "../types/rtm";

export default function RtmRequirementDetailPage() {
  const { id } = useParams<{ id: string }>();
  const ctx = useRtmContext();
  const [row, setRow] = useState<MatrixRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!id || !ctx.projectId || !ctx.iterationId) return;
    setLoading(true);
    setError(null);
    try {
      setRow(await rtmApi.getMatrixRequirement(id, ctx.projectId, ctx.iterationId));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load the requirement.");
    } finally {
      setLoading(false);
    }
  }, [id, ctx.projectId, ctx.iterationId]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <Link
            to="/rtm"
            className="mb-2 inline-flex items-center gap-1 text-xs font-bold text-slate-400 hover:text-amber-600"
          >
            <ArrowLeft size={14} /> Back to Matrix
          </Link>
          <h2 className="text-2xl font-extrabold tracking-tight text-[var(--foreground)]">
            Requirement Trace
          </h2>
          <p className="mt-1 text-xs text-[var(--muted)]">
            Full trace for REQ-{id?.slice(0, 8).toUpperCase()} in{" "}
            <span className="font-semibold text-amber-600">{ctx.projectName ?? "…"}</span>
          </p>
        </div>
        {row && <RtmPill label={row.coverage_status} type="coverage" />}
      </div>

      {(ctx.error || error) && <RtmErrorBanner message={ctx.error ?? error ?? ""} />}

      {ctx.loading || loading ? (
        <RtmSpinner label="Loading requirement trace..." />
      ) : row ? (
        <>
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-sm">
              <p className="text-xs font-bold uppercase tracking-wider text-[var(--muted)]">
                Requirement
              </p>
              <p className="mt-2 text-sm font-medium text-[var(--foreground)]">
                {row.requirement_text}
              </p>
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <RtmPill label={row.requirement_type || "unspecified"} type="source" />
                <RtmPill label={row.requirement_status || "active"} type="test" />
                {row.meeting_title && (
                  <span className="text-[10px] text-slate-400">from “{row.meeting_title}”</span>
                )}
              </div>
            </div>
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-sm">
              <p className="text-xs font-bold uppercase tracking-wider text-[var(--muted)]">
                User Story
              </p>
              <p className="mt-2 text-sm font-bold text-[var(--foreground)]">
                {row.user_story_title || "—"}
              </p>
              <p className="mt-1 text-xs text-[var(--muted)]">{row.user_story_text}</p>
              <div className="mt-4">
                <RtmPill label={row.priority || "—"} type="priority" />
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-[var(--foreground)]">Acceptance Criteria</h3>
              <span className="text-xs font-black text-amber-600">
                {row.covered_acceptance_criteria}/{row.total_acceptance_criteria} covered
              </span>
            </div>
            <ul className="mt-4 space-y-2">
              {row.acceptance_criteria.map((criterion) => {
                const missing = row.missing_acceptance_criteria.includes(criterion);
                return (
                  <li key={criterion} className="flex items-start gap-2 text-xs text-[var(--foreground)]">
                    {missing ? (
                      <XCircle size={14} className="mt-0.5 shrink-0 text-red-500" />
                    ) : (
                      <CheckCircle2 size={14} className="mt-0.5 shrink-0 text-green-500" />
                    )}
                    <span className={missing ? "text-[var(--muted)]" : ""}>{criterion}</span>
                  </li>
                );
              })}
              {row.acceptance_criteria.length === 0 && (
                <li className="text-xs italic text-slate-400">No acceptance criteria recorded.</li>
              )}
            </ul>
          </div>

          <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card)] shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
              <h3 className="text-sm font-bold text-[var(--foreground)]">
                Linked Test Cases ({row.total_tests})
              </h3>
              <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                <span className="text-green-600">{row.passed_tests} passed</span>·
                <span className="text-red-600">{row.failed_tests} failed</span>·
                <span className="text-yellow-600">{row.pending_tests} pending</span>
              </div>
            </div>
            {row.tests.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-12 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 text-amber-600">
                  <FileText size={20} />
                </div>
                <p className="text-sm font-bold text-[var(--foreground)]">No test cases linked</p>
                <p className="max-w-md text-xs text-[var(--muted)]">
                  Generate test cases for this story in Test Case Gen, or resolve it from the
                  Coverage Gaps page.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {row.tests.map((test) => (
                  <details key={test.id} className="group px-6 py-4">
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-4">
                      <span className="text-xs font-semibold text-[var(--foreground)]">
                        {test.title}
                      </span>
                      <span className="flex shrink-0 items-center gap-2">
                        <RtmPill label={test.source === "C2" ? "C2" : "Generated"} type="source" />
                        <RtmPill label={test.status} type="test" />
                      </span>
                    </summary>
                    {test.description && (
                      <pre className="mt-3 overflow-x-auto rounded-xl bg-slate-50 p-4 text-[11px] leading-relaxed text-slate-600">
                        {test.description}
                      </pre>
                    )}
                  </details>
                ))}
              </div>
            )}
          </div>
        </>
      ) : null}
    </div>
  );
}
