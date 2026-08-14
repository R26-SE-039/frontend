import React, { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { failureAnalysisApi } from '../api/failureAnalysisApi';
import DeleteFailureButton from '../components/selfHealing/DeleteFailureButton';
import StatusBadge from '../components/selfHealing/StatusBadge';
import type { Failure, ListResponse } from '../types/selfHealing';

type FailureRecordsPageProps = {
  onViewDetails?: (failure: Failure) => void;
};

function normalizeFailureResponse(response: ListResponse<Failure>, fallbackPage: number, fallbackLimit: number) {
  const failures = Array.isArray(response) ? response : response.data;
  const total = Array.isArray(response) ? response.length : response.total;
  const page = Array.isArray(response) ? fallbackPage : response.page || fallbackPage;
  const limit = Array.isArray(response) ? fallbackLimit : response.limit || fallbackLimit;

  return {
    failures,
    total,
    page,
    limit,
    totalPages: Math.max(1, Math.ceil(total / limit)),
  };
}

export const FailureRecordsPage: React.FC<FailureRecordsPageProps> = ({ onViewDetails }) => {
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [failures, setFailures] = useState<Failure[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadFailures = async (targetPage = page) => {
    setLoading(true);
    setError(null);
    try {
      const response = await failureAnalysisApi.fetchFailures(targetPage, limit);
      const normalized = normalizeFailureResponse(response, targetPage, limit);
      setFailures(normalized.failures);
      setTotal(normalized.total);
      setTotalPages(normalized.totalPages);
      if (normalized.page !== page) setPage(normalized.page);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch failures');
      setFailures([]);
      setTotal(0);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFailures(page);
  }, [page]);

  const pageLabel = useMemo(() => {
    if (loading) return 'Loading records';
    return `Showing page ${page} of ${totalPages} (${total} total records)`;
  }, [loading, page, total, totalPages]);

  const goToPage = (nextPage: number) => {
    if (nextPage < 1 || nextPage > totalPages || nextPage === page) return;
    setPage(nextPage);
  };

  const handleDeleted = () => {
    if (failures.length === 1 && page > 1) {
      setPage(page - 1);
      return;
    }
    loadFailures(page);
  };

  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-sm">
      <div className="border-b border-[var(--border)] pb-4 mb-4 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold text-[var(--foreground)] tracking-tight">Failed Test Cases</h3>
          <p className="text-xs font-medium text-[var(--muted)]">
            View recent failed tests and inspect root cause analysis
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold bg-indigo-50 border border-indigo-100/50 text-indigo-700 rounded-full px-3 py-1">
            Real-time
          </span>
          <button
            type="button"
            onClick={() => loadFailures(page)}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-lg border border-[var(--border)] bg-white px-3 py-2 text-xs font-bold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-xs font-bold text-red-700">
          <AlertTriangle size={15} />
          {error}
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-[var(--border)] text-left text-xs font-bold text-[var(--muted)] uppercase tracking-wider">
              <th className="py-3 px-1">Test ID</th>
              <th className="py-3">Test Name</th>
              <th className="py-3">Pipeline</th>
              <th className="py-3">Root Cause</th>
              <th className="py-3">Status</th>
              <th className="py-3">Healing</th>
              <th className="py-3">Action</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className="py-6 text-center text-sm font-medium text-[var(--muted)]">
                  Loading failure records...
                </td>
              </tr>
            ) : failures.length > 0 ? (
              failures.map((item) => (
                <tr key={item.id} className="border-b border-[var(--border)] last:border-0 hover:bg-slate-50/50 transition duration-150">
                  <td className="py-4 text-xs font-mono font-bold text-indigo-600">{item.test_id}</td>
                  <td className="py-4 font-bold text-[var(--foreground)]">{item.test_name}</td>
                  <td className="py-4 text-xs font-medium text-[var(--muted)]">{item.pipeline}</td>
                  <td className="py-4">
                    <StatusBadge label={item.root_cause} type="rootCause" />
                  </td>
                  <td className="py-4">
                    <StatusBadge label={item.status} type="status" />
                  </td>
                  <td className="py-4">
                    <StatusBadge label={item.healing || 'None'} type="healing" />
                  </td>
                  <td className="py-4">
                    <div className="flex items-center gap-2">
                      {onViewDetails ? (
                        <button
                          type="button"
                          onClick={() => onViewDetails(item)}
                          className="rounded-xl bg-indigo-600 px-3.5 py-2 text-xs font-bold text-white hover:bg-indigo-700 hover:shadow-sm transition-all shadow-indigo-500/10"
                        >
                          View Details
                        </button>
                      ) : (
                        <a
                          href={`/failures/${encodeURIComponent(item.test_id)}`}
                          className="rounded-xl bg-indigo-600 px-3.5 py-2 text-xs font-bold text-white hover:bg-indigo-700 hover:shadow-sm transition-all shadow-indigo-500/10"
                        >
                          View Details
                        </a>
                      )}
                      <DeleteFailureButton testId={item.test_id} onDeleted={handleDeleted} />
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={7} className="py-6 text-center text-sm font-medium text-[var(--muted)]">
                  No failure records found.
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-[var(--border)] pt-4 mt-4">
            <span className="text-xs font-bold text-[var(--muted)]">{pageLabel}</span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => goToPage(page - 1)}
                disabled={page <= 1 || loading}
                className="rounded-xl border border-[var(--border)] px-4 py-2 text-xs font-bold transition disabled:pointer-events-none disabled:opacity-50 disabled:bg-slate-50 disabled:text-[var(--muted)] hover:bg-[var(--card-2)] text-[var(--foreground)]"
              >
                Previous
              </button>
              <button
                type="button"
                onClick={() => goToPage(page + 1)}
                disabled={page >= totalPages || loading}
                className="rounded-xl border border-[var(--border)] px-4 py-2 text-xs font-bold transition disabled:pointer-events-none disabled:opacity-50 disabled:bg-slate-50 disabled:text-[var(--muted)] hover:bg-[var(--card-2)] text-[var(--foreground)]"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FailureRecordsPage;
