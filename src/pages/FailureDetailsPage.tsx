import React, { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { AlertCircle, ArrowLeft, ClipboardList, LockKeyhole, RefreshCw, ShieldCheck } from 'lucide-react';
import { failureAnalysisApi } from '../api/failureAnalysisApi';
import FailureActionButtons from '../components/selfHealing/FailureActionButtons';
import StatusBadge from '../components/selfHealing/StatusBadge';
import type { Failure } from '../types/selfHealing';

type FailureDetailsPageProps = {
  failureId?: string;
  onBack?: () => void;
  onViewActionHistory?: (failure: Failure) => void;
  onRunNewDiagnosis?: () => void;
};

function metadataRow(label: string, value: React.ReactNode) {
  return (
    <p className="flex items-center justify-between gap-4 border-b border-slate-50 pb-2">
      <span className="text-xs font-bold text-[var(--muted)] uppercase tracking-wide">{label}</span>
      <span className="text-right text-xs font-bold text-slate-800">{value}</span>
    </p>
  );
}

function BackButton({ onBack }: { onBack?: () => void }) {
  const className = 'inline-flex items-center gap-1.5 rounded-xl border border-[var(--border)] bg-[var(--card-2)] px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 hover:shadow-sm transition';

  if (onBack) {
    return (
      <button type="button" onClick={onBack} className={className}>
        <ArrowLeft size={13} />
        Back to List
      </button>
    );
  }

  return (
    <a href="/failures" className={className}>
      <ArrowLeft size={13} />
      Back to List
    </a>
  );
}

export const FailureDetailsPage: React.FC<FailureDetailsPageProps> = ({
  failureId,
  onBack,
  onViewActionHistory,
  onRunNewDiagnosis,
}) => {
  const params = useParams();
  const routeId = params.id || params['*'];
  const resolvedFailureId = useMemo(() => failureId || routeId || '', [failureId, routeId]);

  const [failure, setFailure] = useState<Failure | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadFailure = async () => {
    if (!resolvedFailureId) {
      setFailure(null);
      setError('Failure ID was not provided.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const data = await failureAnalysisApi.fetchFailureById(resolvedFailureId);
      setFailure(data);
    } catch (err) {
      setFailure(null);
      setError(err instanceof Error ? err.message : 'Failed to fetch failure details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFailure();
  }, [resolvedFailureId]);

  if (loading) {
    return (
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-8 shadow-sm text-center max-w-xl mx-auto my-12">
        <RefreshCw className="mx-auto mb-4 animate-spin text-indigo-500" size={36} />
        <h2 className="text-2xl font-extrabold tracking-tight text-[var(--foreground)]">Loading failure details</h2>
        <p className="text-xs font-medium text-[var(--muted)] mt-1">Retrieving sanitized failure metadata.</p>
      </div>
    );
  }

  if (!failure) {
    return (
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-8 shadow-sm text-center max-w-xl mx-auto my-12">
        <AlertCircle className="mx-auto mb-4 text-slate-400" size={36} />
        <h2 className="text-2xl font-extrabold tracking-tight text-[var(--foreground)]">Failure not found</h2>
        <p className="text-xs font-medium text-[var(--muted)] mt-1 mb-3">
          We could not retrieve the failure record for ID: {resolvedFailureId || 'Unknown'}
        </p>
        {error && <p className="mb-6 text-xs font-bold text-red-600">{error}</p>}
        <div className="flex justify-center gap-3">
          <BackButton onBack={onBack} />
          <button
            type="button"
            onClick={loadFailure}
            className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white hover:bg-indigo-700"
          >
            <RefreshCw size={13} />
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[var(--border)] pb-4 mb-4">
        <div>
          <h2 className="text-2xl font-extrabold tracking-tight text-[var(--foreground)]">{failure.test_name}</h2>
          <p className="text-xs font-medium text-[var(--muted)]">
            Failure ID: <span className="font-mono font-bold text-indigo-600">{failure.test_id}</span>
          </p>
        </div>
        <BackButton onBack={onBack} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 border-b border-[var(--border)] pb-3 mb-4">
              <ShieldCheck size={16} className="text-indigo-600" />
              <h3 className="text-base font-bold text-[var(--foreground)] tracking-tight">Test Metadata</h3>
            </div>
            <div className="space-y-3 text-sm">
              {metadataRow('Pipeline', failure.pipeline)}
              {metadataRow('Status', <StatusBadge label={failure.status} type="status" />)}
              {metadataRow('Root Cause', <StatusBadge label={failure.root_cause} type="rootCause" />)}
              {metadataRow('Healing', <StatusBadge label={failure.healing || 'None'} type="healing" />)}
              {metadataRow('ML Confidence', failure.confidence || 'N/A')}
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-sm lg:col-span-2 relative overflow-hidden flex flex-col justify-between">
          <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-indigo-500 to-indigo-600" />
          <div>
            <div className="flex items-center gap-2 border-b border-[var(--border)] pb-3 mb-4">
              <AlertCircle size={16} className="text-indigo-600" />
              <h3 className="text-base font-bold text-[var(--foreground)] tracking-tight">Policy Recommendation</h3>
            </div>
            <p className="text-sm font-medium leading-relaxed bg-slate-50 p-4 rounded-2xl border border-slate-100 text-[var(--foreground)]">
              {failure.recommendation || 'No recommendation available.'}
            </p>
          </div>

          <div className="pt-4 mt-auto">
            <FailureActionButtons
              failure={failure}
              onViewActionHistory={onViewActionHistory}
              onRunNewDiagnosis={onRunNewDiagnosis}
            />
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-indigo-100 bg-indigo-50/60 p-5">
        <div className="flex items-start gap-3">
          <LockKeyhole size={18} className="mt-0.5 shrink-0 text-indigo-600" />
          <div>
            <h3 className="text-sm font-bold text-slate-900">Failure evidence protected</h3>
            <p className="mt-1 text-xs font-medium leading-5 text-slate-600">
              Full execution logs and stack traces are not displayed in historical views. Use the sanitized classification evidence and action audit for review.
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 left-0 w-1 h-full bg-amber-500" />
        <h3 className="text-base font-bold text-[var(--foreground)] tracking-tight border-b border-[var(--border)] pb-3 mb-4 flex items-center gap-2">
          <ClipboardList size={16} className="text-amber-600" />
          Review Guidance
        </h3>
        <p className="text-xs font-medium text-slate-700 leading-relaxed bg-slate-50/50 border border-slate-100 p-3 rounded-xl max-w-fit">
          {failure.developer_alert
            ? 'Developer or owner review is required. Check the recorded policy action before making any repository change.'
            : 'Review the recorded policy action. Only eligible application defects can enter the controlled repair workflow.'}
        </p>
      </div>
    </div>
  );
};

export default FailureDetailsPage;
