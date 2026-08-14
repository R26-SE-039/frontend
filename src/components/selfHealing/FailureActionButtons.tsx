import type React from 'react';
import { ClipboardList, FlaskConical } from 'lucide-react';
import type { Failure } from '../../types/selfHealing';

type FailureActionButtonsProps = {
  failure: Failure;
  onViewActionHistory?: (failure: Failure) => void;
  onRunNewDiagnosis?: () => void;
  historyHref?: string;
  submitHref?: string;
};

function ActionLink({
  href,
  onClick,
  className,
  children,
}: {
  href?: string;
  onClick?: () => void;
  className: string;
  children: React.ReactNode;
}) {
  if (href) {
    return (
      <a href={href} className={className}>
        {children}
      </a>
    );
  }

  return (
    <button type="button" onClick={onClick} className={className}>
      {children}
    </button>
  );
}

export default function FailureActionButtons({
  failure,
  onViewActionHistory,
  onRunNewDiagnosis,
  historyHref,
  submitHref,
}: FailureActionButtonsProps) {
  const fallbackHistoryHref = historyHref || `/repair-history?root_cause=${encodeURIComponent(failure.root_cause)}`;
  const fallbackSubmitHref = submitHref || '/submit';

  return (
    <div className="mt-6 flex flex-wrap gap-3">
      <ActionLink
        href={onViewActionHistory ? undefined : fallbackHistoryHref}
        onClick={() => onViewActionHistory?.(failure)}
        className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-indigo-700"
      >
        <ClipboardList size={15} />
        View Action History
      </ActionLink>
      <ActionLink
        href={onRunNewDiagnosis ? undefined : fallbackSubmitHref}
        onClick={onRunNewDiagnosis}
        className="inline-flex items-center gap-2 rounded-lg border border-[var(--border)] bg-white px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50"
      >
        <FlaskConical size={15} />
        Run New Diagnosis
      </ActionLink>
    </div>
  );
}

