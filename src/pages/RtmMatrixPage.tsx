import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Download, GitBranch, Layers, RefreshCw } from "lucide-react";
import { rtmApi } from "../api/rtmApi";
import RtmPill from "../components/rtm/RtmPill";
import RtmStatCard from "../components/rtm/RtmStatCard";
import { RtmEmptyState, RtmErrorBanner, RtmSpinner } from "../components/rtm/RtmPageState";
import { useRtmContext } from "../components/rtm/useRtmContext";
import type { Matrix, MatrixRow } from "../types/rtm";

const shortId = (id: string) => id.slice(0, 8).toUpperCase();

export default function RtmMatrixPage() {
  const ctx = useRtmContext();
  const [matrix, setMatrix] = useState<Matrix | null>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!ctx.projectId || !ctx.iterationId) return;
    setLoading(true);
    setError(null);
    try {
      setMatrix(await rtmApi.getMatrix(ctx.projectId, ctx.iterationId));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load the RTM matrix.");
    } finally {
      setLoading(false);
    }
  }, [ctx.projectId, ctx.iterationId]);

  useEffect(() => {
    void load();
  }, [load]);

  const exportPdf = async () => {
    if (!matrix) return;
    setExporting(true);
    try {
      const { default: JsPDF } = await import("jspdf");
      const { default: autoTable } = await import("jspdf-autotable");
      const doc = new JsPDF({ orientation: "landscape" });
      doc.setFontSize(14);
      doc.text(`Requirements Traceability Matrix — ${ctx.projectName ?? ""}`, 14, 14);
      doc.setFontSize(9);
      doc.text(
        `Iteration: ${ctx.iterationName ?? matrix.iteration_id} · Requirements: ${matrix.summary.total_requirements} · Tests: ${matrix.summary.total_tests} · Pass rate: ${matrix.summary.pass_rate}%`,
        14,
        20,
      );
      autoTable(doc, {
        startY: 24,
        head: [["Req ID", "Requirement", "Type", "User Story", "Priority", "AC", "Test Case", "Result", "Coverage"]],
        body: matrix.rows.flatMap((row) => {
          const base = [
            shortId(row.requirement_id),
            row.requirement_text,
            row.requirement_type,
            row.user_story_title,
            row.priority,
            `${row.covered_acceptance_criteria}/${row.total_acceptance_criteria}`,
          ];
          if (row.tests.length === 0) {
            return [[...base, "—", "—", row.coverage_status]];
          }
          return row.tests.map((test, i) => [
            ...(i === 0 ? base : ["", "", "", "", "", ""]),
            test.title,
            test.status,
            i === 0 ? row.coverage_status : "",
          ]);
        }),
        styles: { fontSize: 7, cellPadding: 1.5 },
        headStyles: { fillColor: [217, 119, 6] },
      });
      doc.save("rtm-matrix.pdf");
    } finally {
      setExporting(false);
    }
  };

  const summary = matrix?.summary;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold tracking-tight text-[var(--foreground)]">
            RTM Matrix
          </h2>
          <p className="mt-1 text-xs text-[var(--muted)]">
            Live requirement → user story → test case traceability for{" "}
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
            onClick={() => void exportPdf()}
            disabled={!matrix || exporting}
            className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-amber-600 to-orange-600 px-4 py-2 text-xs font-bold text-white shadow-md shadow-amber-200 hover:from-amber-700 hover:to-orange-700 disabled:opacity-50"
          >
            <Download size={14} /> {exporting ? "Exporting..." : "Export PDF"}
          </button>
        </div>
      </div>

      {(ctx.error || error) && <RtmErrorBanner message={ctx.error ?? error ?? ""} />}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <RtmStatCard
          title="Requirements"
          value={summary ? String(summary.total_requirements) : "--"}
          change={summary ? `${summary.fully_covered} fully covered` : "…"}
        />
        <RtmStatCard
          title="Test Cases"
          value={summary ? String(summary.total_tests) : "--"}
          change={summary ? `${summary.pending_tests} not yet executed` : "…"}
        />
        <RtmStatCard
          title="Pass Rate"
          value={summary ? `${summary.pass_rate}%` : "--"}
          change={summary ? `${summary.passed_tests} of ${summary.passed_tests + summary.failed_tests} executed` : "…"}
        />
        <RtmStatCard
          title="Defects"
          value={summary ? String(summary.defects) : "--"}
          change={summary ? `${summary.not_covered} requirements uncovered` : "…"}
        />
      </div>

      <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card)] shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <h3 className="text-sm font-bold text-[var(--foreground)]">Traceability Matrix</h3>
          {summary && (
            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">
              <span className="text-green-600">{summary.fully_covered} full</span>·
              <span className="text-amber-600">{summary.partially_covered} partial</span>·
              <span className="text-red-600">{summary.not_covered} uncovered</span>
            </div>
          )}
        </div>

        {ctx.loading || loading ? (
          <RtmSpinner label="Assembling matrix from Component 1 & 2..." />
        ) : !matrix || matrix.rows.length === 0 ? (
          <RtmEmptyState
            icon={<Layers size={20} />}
            title="No requirements in this iteration"
            subtitle="Process a meeting in the Meeting module to extract requirements and user stories, then generate test cases in Test Case Gen — the matrix builds itself from that data."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-[10px] font-black uppercase tracking-widest text-slate-400">
                  <th className="px-4 py-3">Requirement</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">User Story</th>
                  <th className="px-4 py-3">Priority</th>
                  <th className="px-4 py-3 text-center">AC Covered</th>
                  <th className="px-4 py-3">Test Case</th>
                  <th className="px-4 py-3">Result</th>
                  <th className="px-4 py-3">Coverage</th>
                </tr>
              </thead>
              <tbody>
                {matrix.rows.map((row) => (
                  <MatrixRowGroup key={row.requirement_id} row={row} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function MatrixRowGroup({ row }: { row: MatrixRow }) {
  const span = Math.max(row.tests.length, 1);
  const requirementCells = (
    <>
      <td rowSpan={span} className="max-w-xs border-b border-slate-100 px-4 py-3 align-top">
        <Link
          to={`/rtm/requirements/${row.requirement_id}`}
          className="text-xs font-black text-amber-600 hover:underline"
        >
          REQ-{shortId(row.requirement_id)}
        </Link>
        <p className="mt-1 text-xs font-medium text-[var(--foreground)]">{row.requirement_text}</p>
        {row.meeting_title && (
          <p className="mt-1 text-[10px] text-slate-400">from “{row.meeting_title}”</p>
        )}
      </td>
      <td rowSpan={span} className="border-b border-slate-100 px-4 py-3 align-top text-xs capitalize text-[var(--muted)]">
        {row.requirement_type || "—"}
      </td>
      <td rowSpan={span} className="max-w-xs border-b border-slate-100 px-4 py-3 align-top">
        <p className="text-xs font-semibold text-[var(--foreground)]">{row.user_story_title || "—"}</p>
        <p className="mt-1 line-clamp-2 text-[10px] text-slate-400">{row.user_story_text}</p>
      </td>
      <td rowSpan={span} className="border-b border-slate-100 px-4 py-3 align-top">
        <RtmPill label={row.priority || "—"} type="priority" />
      </td>
      <td rowSpan={span} className="border-b border-slate-100 px-4 py-3 text-center align-top">
        <span
          className={`text-xs font-black ${
            row.covered_acceptance_criteria === row.total_acceptance_criteria
              ? "text-green-600"
              : row.covered_acceptance_criteria > 0
                ? "text-amber-600"
                : "text-red-600"
          }`}
        >
          {row.covered_acceptance_criteria}/{row.total_acceptance_criteria}
        </span>
      </td>
    </>
  );

  if (row.tests.length === 0) {
    return (
      <tr className="hover:bg-slate-50/60">
        {requirementCells}
        <td className="border-b border-slate-100 px-4 py-3 text-xs italic text-slate-400" colSpan={2}>
          <span className="flex items-center gap-1.5">
            <GitBranch size={12} /> No test case yet — generate one in Test Case Gen or from Coverage Gaps.
          </span>
        </td>
        <td className="border-b border-slate-100 px-4 py-3">
          <RtmPill label={row.coverage_status} type="coverage" />
        </td>
      </tr>
    );
  }

  return (
    <>
      {row.tests.map((test, i) => (
        <tr key={test.id} className="hover:bg-slate-50/60">
          {i === 0 && requirementCells}
          <td className="max-w-xs border-b border-slate-100 px-4 py-3">
            <p className="truncate text-xs font-medium text-[var(--foreground)]" title={test.title}>
              {test.title}
            </p>
            <RtmPill label={test.source === "C2" ? "C2" : "Generated"} type="source" />
          </td>
          <td className="border-b border-slate-100 px-4 py-3">
            <RtmPill label={test.status} type="test" />
          </td>
          {i === 0 && (
            <td rowSpan={span} className="border-b border-slate-100 px-4 py-3 align-top">
              <RtmPill label={row.coverage_status} type="coverage" />
            </td>
          )}
        </tr>
      ))}
    </>
  );
}
