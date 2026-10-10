import { useMemo, useState } from 'react';
import {
  AlertOctagon,
  AlertTriangle,
  Bot,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Cpu,
  HelpCircle,
  Info,
  ShieldCheck,
  Sparkles,
  Wand2,
  XCircle,
} from 'lucide-react';
import type {
  ValidationFinding,
  ValidationReport,
  ValidationSeverity,
} from '../../types/testCase';
import ValidationScoreRing, { verdictTone } from './ValidationScoreRing';

type Props = {
  report: ValidationReport | null;
  validating: boolean;
  fixing: boolean;
  /** Report describes an older version of the text (server hash mismatch or unsaved edits). */
  stale?: boolean;
  targetLabel: 'suite' | 'scenario';
  onValidate: () => void;
  onFix: (findingIds?: string[]) => void;
  onJumpToLine?: (line: number) => void;
  /** Score before the last auto-fix, if the current report followed one. */
  previousScore?: number | null;
  disabled?: boolean;
  /** Extra classes for the root, e.g. a fixed height so the body scrolls. Without one the panel sizes to its content. */
  className?: string;
};

const SEVERITY_ORDER: ValidationSeverity[] = ['critical', 'major', 'minor', 'info'];

const severityStyle: Record<ValidationSeverity, { pill: string; icon: typeof AlertOctagon }> = {
  critical: { pill: 'bg-red-500/10 text-red-600 border-red-500/20', icon: AlertOctagon },
  major: { pill: 'bg-orange-500/10 text-orange-600 border-orange-500/20', icon: AlertTriangle },
  minor: { pill: 'bg-amber-500/10 text-amber-600 border-amber-500/20', icon: Info },
  info: { pill: 'bg-slate-500/10 text-slate-500 border-slate-500/20', icon: Info },
};

const predictionIcon = (predicted: string) => {
  if (predicted === 'pass') return <CheckCircle2 size={14} className="text-green-600" />;
  if (predicted === 'fail') return <XCircle size={14} className="text-red-600" />;
  return <HelpCircle size={14} className="text-amber-500" />;
};

function FindingRow({ finding, onJumpToLine }: { finding: ValidationFinding; onJumpToLine?: (line: number) => void }) {
  const [open, setOpen] = useState(finding.severity === 'critical' || finding.severity === 'major');
  const style = severityStyle[finding.severity] ?? severityStyle.minor;
  return (
    <div className="rounded-xl border border-slate-200 bg-white">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-start gap-2 p-3 text-left"
      >
        {open ? <ChevronDown size={14} className="mt-0.5 shrink-0 text-slate-400" /> : <ChevronRight size={14} className="mt-0.5 shrink-0 text-slate-400" />}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-black uppercase tracking-wider ${style.pill}`}>
              {finding.severity}
            </span>
            <span
              className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold ${
                finding.source === 'llm'
                  ? 'border-indigo-200 bg-indigo-50 text-indigo-600'
                  : 'border-slate-200 bg-slate-50 text-slate-500'
              }`}
              title={finding.source === 'llm' ? 'Found by the independent LLM judge' : 'Found by deterministic static analysis'}
            >
              {finding.source === 'llm' ? <Bot size={10} /> : <Cpu size={10} />}
              {finding.source === 'llm' ? 'AI judge' : 'Static check'}
            </span>
            {finding.line ? (
              <span
                role={onJumpToLine ? 'link' : undefined}
                onClick={(e) => {
                  if (!onJumpToLine) return;
                  e.stopPropagation();
                  onJumpToLine(finding.line!);
                }}
                className={`font-mono text-[10px] font-bold ${onJumpToLine ? 'cursor-pointer text-indigo-600 hover:underline' : 'text-slate-400'}`}
              >
                line {finding.line}
              </span>
            ) : null}
            {!finding.fixable && (
              <span className="text-[10px] font-bold text-slate-400">manual fix</span>
            )}
          </div>
          <p className="mt-1 text-xs font-bold text-slate-800">{finding.title}</p>
          {finding.scenario && (
            <p className="mt-0.5 truncate text-[10px] font-semibold text-slate-400">{finding.scenario}</p>
          )}
        </div>
      </button>
      {open && (
        <div className="space-y-2 border-t border-slate-100 px-3 pb-3 pt-2">
          <p className="text-xs leading-5 text-slate-600">{finding.detail}</p>
          {finding.snippet && (
            <pre className="overflow-x-auto rounded-lg bg-slate-950 p-2 font-mono text-[11px] text-slate-200">{finding.snippet}</pre>
          )}
          {finding.suggestion && (
            <p className="flex gap-1.5 text-xs leading-5 text-indigo-700">
              <Wand2 size={13} className="mt-1 shrink-0" />
              <span>{finding.suggestion}</span>
            </p>
          )}
        </div>
      )}
    </div>
  );
}

export default function ValidationPanel({
  report,
  validating,
  fixing,
  stale = false,
  targetLabel,
  onValidate,
  onFix,
  onJumpToLine,
  previousScore,
  disabled = false,
  className = '',
}: Props) {
  const [showBreakdown, setShowBreakdown] = useState(false);
  const [showScenarios, setShowScenarios] = useState(true);

  const fixable = useMemo(
    () => (report?.findings ?? []).filter((f) => f.fixable && f.severity !== 'info'),
    [report],
  );
  const grouped = useMemo(() => {
    const map: Record<ValidationSeverity, ValidationFinding[]> = { critical: [], major: [], minor: [], info: [] };
    for (const f of report?.findings ?? []) (map[f.severity] ?? map.minor).push(f);
    return map;
  }, [report]);

  const tone = verdictTone(report?.verdict);
  const busy = validating || fixing;

  return (
    <div className={`flex flex-col overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card)] shadow-sm ${className}`}>
      <div className="flex shrink-0 items-center justify-between gap-2 border-b border-slate-100 px-5 py-4">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
            <ShieldCheck size={16} />
          </div>
          <div>
            <h3 className="text-sm font-black text-slate-900">Independent Validation</h3>
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
              static checks + AI judge
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onValidate}
          disabled={busy || disabled}
          className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 px-3 py-2 text-[11px] font-black text-white shadow-md shadow-indigo-200 transition hover:from-indigo-700 hover:to-purple-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <ShieldCheck size={13} className={validating ? 'animate-pulse' : ''} />
          {validating ? 'Validating…' : report ? 'Re-validate' : 'Validate'}
        </button>
      </div>

      {validating && (
        <div className="flex shrink-0 items-center gap-3 border-b border-indigo-100 bg-indigo-50 px-5 py-3 text-xs font-medium text-indigo-700">
          <div className="h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-indigo-200 border-t-indigo-600" />
          Running deterministic checks and asking an independent model to predict the outcome of every scenario…
        </div>
      )}

      {!report && !validating ? (
        <div className="flex flex-col items-center justify-center gap-3 px-6 py-12 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
            <ShieldCheck size={22} />
          </div>
          <p className="text-sm font-bold text-slate-900">Not validated yet</p>
          <p className="max-w-xs text-xs font-medium leading-5 text-slate-400">
            Validation runs syntax, coverage and selector-grounding checks that need no AI, then an
            independent model predicts which {targetLabel === 'suite' ? 'tests' : 'scenarios'} will
            pass and explains why.
          </p>
        </div>
      ) : report ? (
        <div className="custom-scrollbar min-h-0 flex-1 space-y-5 overflow-y-auto p-5">
          {stale && (
            <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-700">
              <AlertTriangle size={14} className="mt-0.5 shrink-0" />
              This report describes a previous version of the {targetLabel}. Re-validate to refresh it.
            </div>
          )}

          <div className="flex items-center gap-4">
            <ValidationScoreRing score={report.score} verdict={report.verdict} />
            <div className="min-w-0 flex-1 space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-black ${tone.bg} ${tone.text}`}>
                  {tone.label}
                </span>
                {typeof previousScore === 'number' && previousScore !== report.score && (
                  <span className="text-[11px] font-bold text-slate-500">
                    {previousScore}% →{' '}
                    <span className={report.score > previousScore ? 'text-green-600' : 'text-red-600'}>{report.score}%</span>{' '}
                    after auto-fix
                  </span>
                )}
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-lg bg-slate-50 px-2.5 py-2">
                  <p className="text-[9px] font-black uppercase tracking-wider text-slate-400">Scenarios</p>
                  <p className="text-xs font-bold text-slate-800">
                    {report.scenario_pass_predicted}/{report.scenario_total} <span className="font-semibold text-slate-500">predicted pass</span>
                  </p>
                </div>
                <div className="rounded-lg bg-slate-50 px-2.5 py-2">
                  <p className="text-[9px] font-black uppercase tracking-wider text-slate-400">Static score</p>
                  <p className="text-xs font-bold text-slate-800">
                    {report.static_score}<span className="font-semibold text-slate-500">/100</span>
                  </p>
                </div>
              </div>
              <p className="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-[10px] font-semibold text-slate-400">
                {report.validator_model ? (
                  <>
                    <span>
                      Judge <span className="font-mono text-slate-600">{report.validator_model}</span>
                    </span>
                    {report.breakdown?.independent_model && (
                      <span className="rounded bg-green-500/10 px-1.5 py-0.5 font-black text-green-600">independent model</span>
                    )}
                  </>
                ) : (
                  <span>AI judge unavailable — deterministic checks only</span>
                )}
                {report.duration_ms ? <span>· {(report.duration_ms / 1000).toFixed(1)}s</span> : null}
              </p>
            </div>
          </div>

          {report.summary && (
            <p className="rounded-xl border border-slate-100 bg-slate-50/70 px-3.5 py-3 text-xs leading-5 text-slate-600">
              {report.summary}
            </p>
          )}

          {fixable.length > 0 && (
            <button
              type="button"
              onClick={() => onFix()}
              disabled={busy || disabled}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-2.5 text-xs font-black text-indigo-700 transition hover:bg-indigo-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Sparkles size={14} className={fixing ? 'animate-pulse' : ''} />
              {fixing ? 'Preparing fix…' : `Auto-fix ${fixable.length} issue${fixable.length > 1 ? 's' : ''} with AI`}
            </button>
          )}

          {report.scenarios.length > 0 && (
            <section>
              <button
                type="button"
                onClick={() => setShowScenarios((v) => !v)}
                className="flex w-full items-center justify-between py-1 text-[10px] font-black uppercase tracking-widest text-slate-400"
              >
                Per-scenario prediction
                {showScenarios ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              </button>
              {showScenarios && (
                <div className="mt-2 space-y-1.5">
                  {report.scenarios.map((s, i) => (
                    <div key={`${s.title}-${i}`} className="flex items-start gap-2 rounded-lg border border-slate-100 bg-white px-3 py-2">
                      <span className="mt-0.5">{predictionIcon(s.predicted)}</span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <p className="truncate text-xs font-bold text-slate-800">{s.title}</p>
                          <span className="shrink-0 text-[10px] font-black text-slate-400">{s.confidence}%</span>
                        </div>
                        {s.test_name && <p className="truncate font-mono text-[10px] text-indigo-500">{s.test_name}</p>}
                        {!s.implemented && <p className="text-[10px] font-bold text-red-500">not implemented</p>}
                        {s.reason && <p className="mt-0.5 text-[11px] leading-4 text-slate-500">{s.reason}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}

          <section>
            <p className="py-1 text-[10px] font-black uppercase tracking-widest text-slate-400">
              Findings ({report.findings.length})
            </p>
            {report.findings.length === 0 ? (
              <div className="flex items-center gap-2 rounded-xl border border-green-200 bg-green-50 px-3 py-2 text-xs font-bold text-green-700">
                <CheckCircle2 size={14} /> No issues found.
              </div>
            ) : (
              <div className="mt-2 space-y-2">
                {SEVERITY_ORDER.flatMap((sev) =>
                  grouped[sev].map((f) => <FindingRow key={f.id} finding={f} onJumpToLine={onJumpToLine} />),
                )}
              </div>
            )}
          </section>

          {report.breakdown?.coverage && report.breakdown.coverage.length > 0 && (
            <section>
              <p className="py-1 text-[10px] font-black uppercase tracking-widest text-slate-400">Acceptance criteria coverage</p>
              <div className="mt-2 space-y-1">
                {report.breakdown.coverage.map((c, i) => (
                  <div key={i} className="flex items-start gap-2 text-[11px]">
                    {c.covered ? <CheckCircle2 size={13} className="mt-0.5 shrink-0 text-green-600" /> : <XCircle size={13} className="mt-0.5 shrink-0 text-red-500" />}
                    <span className="text-slate-600">{c.criterion}</span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {report.breakdown?.strengths && report.breakdown.strengths.length > 0 && (
            <section>
              <p className="py-1 text-[10px] font-black uppercase tracking-widest text-slate-400">What is done right</p>
              <ul className="mt-1 space-y-1">
                {report.breakdown.strengths.map((s, i) => (
                  <li key={i} className="flex gap-2 text-[11px] text-slate-600">
                    <CheckCircle2 size={13} className="mt-0.5 shrink-0 text-green-600" />
                    {s}
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section>
            <button
              type="button"
              onClick={() => setShowBreakdown((v) => !v)}
              className="flex w-full items-center justify-between py-1 text-[10px] font-black uppercase tracking-widest text-slate-400"
            >
              How the score is computed
              {showBreakdown ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            </button>
            {showBreakdown && (
              <div className="mt-2 space-y-1 rounded-xl bg-slate-50 p-3 font-mono text-[10px] leading-5 text-slate-600">
                {report.breakdown.judge_available ? (
                  <>
                    <p>
                      base = 0.5 × judge {report.breakdown.llm_score ?? '–'} + 0.3 × scenario rate{' '}
                      {report.breakdown.scenario_rate ?? '–'} + 0.2 × static {report.breakdown.static_score} ={' '}
                      <b>{report.breakdown.base}</b>
                    </p>
                  </>
                ) : (
                  <p>base = static score {report.breakdown.static_score} (AI judge unavailable)</p>
                )}
                {(report.breakdown.caps_applied ?? []).map((c, i) => (
                  <p key={i}>cap: {c}</p>
                ))}
                <p>
                  final = <b>{report.score}</b> → {tone.label}
                </p>
                <p className="text-slate-400">
                  static penalties: critical −25 · major −10 · minor −3. Verdict: critical or &lt;50 ⇒ likely failing;
                  ≥80 with no major ⇒ ready.
                </p>
              </div>
            )}
          </section>
        </div>
      ) : null}
    </div>
  );
}
