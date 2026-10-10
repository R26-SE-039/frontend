import { DiffEditor } from '@monaco-editor/react';
import { ArrowRight, Check, Sparkles, X } from 'lucide-react';
import type { FixChange, StaticSnapshot, ValidationFinding } from '../../types/testCase';

type Props = {
  open: boolean;
  title: string;
  language: string;
  original: string;
  fixed: string;
  changes: FixChange[];
  addressed: ValidationFinding[];
  staticBefore: StaticSnapshot;
  staticAfter: StaticSnapshot;
  fixerModel?: string;
  applying: boolean;
  applyLabel?: string;
  onApply: () => void;
  onClose: () => void;
};

const countLabel = (s: StaticSnapshot) =>
  `${s.counts.critical} critical · ${s.counts.major} major · ${s.counts.minor} minor`;

export default function ValidationFixDialog({
  open,
  title,
  language,
  original,
  fixed,
  changes,
  addressed,
  staticBefore,
  staticAfter,
  fixerModel,
  applying,
  applyLabel = 'Apply as new version',
  onApply,
  onClose,
}: Props) {
  if (!open) return null;
  const byId = new Map(addressed.map((f) => [f.id, f]));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4" onClick={onClose}>
      <div
        className="flex h-[90vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-4 border-b border-slate-100 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
              <Sparkles size={18} />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900">{title}</h3>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                review the proposed changes before applying
                {fixerModel ? ` · fixer: ${fixerModel}` : ''}
              </p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700">
            <X size={16} />
          </button>
        </div>

        <div className="grid flex-1 min-h-0 grid-cols-12">
          <div className="col-span-8 flex min-h-0 flex-col border-r border-slate-100">
            <div className="flex items-center justify-between px-4 py-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
              <span>Original</span>
              <span>Proposed</span>
            </div>
            <div className="min-h-0 flex-1">
              <DiffEditor
                height="100%"
                language={language}
                original={original}
                modified={fixed}
                theme="vs"
                options={{
                  readOnly: true,
                  renderSideBySide: true,
                  minimap: { enabled: false },
                  fontSize: 12,
                  fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
                  scrollBeyondLastLine: false,
                  automaticLayout: true,
                }}
              />
            </div>
          </div>

          <div className="custom-scrollbar col-span-4 min-h-0 space-y-4 overflow-y-auto p-5">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Deterministic checks</p>
              <div className="mt-2 flex items-center gap-2 text-xs font-bold">
                <span className="text-slate-700">{staticBefore.score}</span>
                <ArrowRight size={12} className="text-slate-400" />
                <span className={staticAfter.score >= staticBefore.score ? 'text-green-600' : 'text-red-600'}>
                  {staticAfter.score}
                </span>
                <span className="text-slate-400">/100</span>
              </div>
              <p className="mt-1 text-[10px] font-semibold text-slate-500">before: {countLabel(staticBefore)}</p>
              <p className="text-[10px] font-semibold text-slate-500">after: {countLabel(staticAfter)}</p>
              <p className="mt-2 text-[10px] text-slate-400">
                The AI judge re-runs after you apply, so the overall score updates then.
              </p>
            </div>

            <section>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                Changes ({changes.length})
              </p>
              <ul className="mt-2 space-y-2">
                {changes.map((c, i) => {
                  const f = c.finding_id ? byId.get(c.finding_id) : undefined;
                  return (
                    <li key={i} className="rounded-xl border border-slate-200 bg-white p-3">
                      <div className="flex items-center gap-2">
                        <Check size={13} className="shrink-0 text-green-600" />
                        <p className="text-xs leading-5 text-slate-700">{c.description}</p>
                      </div>
                      {(f || c.line) && (
                        <p className="mt-1 pl-5 text-[10px] font-bold text-slate-400">
                          {f ? `fixes: ${f.title}` : ''}
                          {f && c.line ? ' · ' : ''}
                          {c.line ? `line ${c.line}` : ''}
                        </p>
                      )}
                    </li>
                  );
                })}
                {changes.length === 0 && (
                  <li className="text-xs text-slate-400">The model did not describe its edits; review the diff.</li>
                )}
              </ul>
            </section>

            {staticAfter.findings && staticAfter.findings.length > 0 && (
              <section>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Still flagged after fix</p>
                <ul className="mt-2 space-y-1">
                  {staticAfter.findings.map((f) => (
                    <li key={f.id} className="text-[11px] text-slate-500">
                      <span className="font-black uppercase text-slate-400">{f.severity}</span> · {f.title}
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-slate-100 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            disabled={applying}
            className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-500 transition hover:text-slate-900 disabled:opacity-50"
          >
            Discard
          </button>
          <button
            type="button"
            onClick={onApply}
            disabled={applying || fixed === original}
            className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 px-4 py-2 text-xs font-bold text-white shadow-md shadow-indigo-200 transition hover:from-indigo-700 hover:to-purple-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Check size={14} /> {applying ? 'Applying…' : applyLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
