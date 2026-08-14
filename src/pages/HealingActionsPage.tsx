import React, { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { failureAnalysisApi } from '../api/failureAnalysisApi';
import DeleteRecordButton from '../components/selfHealing/DeleteRecordButton';
import StatusBadge from '../components/selfHealing/StatusBadge';
import type { HealingAction, ListResponse } from '../types/selfHealing';

function normalizeHealingResponse(response: ListResponse<HealingAction>, fallbackPage: number, fallbackLimit: number) {
  const healingActions = Array.isArray(response) ? response : response.data;
  const total = Array.isArray(response) ? response.length : response.total;
  const page = Array.isArray(response) ? fallbackPage : response.page || fallbackPage;
  const limit = Array.isArray(response) ? fallbackLimit : response.limit || fallbackLimit;

  return {
    healingActions,
    total,
    page,
    limit,
    totalPages: Math.max(1, Math.ceil(total / limit)),
  };
}

export const HealingActionsPage: React.FC = () => {
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [healingActions, setHealingActions] = useState<HealingAction[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadHealingActions = async (targetPage = page) => {
    setLoading(true);
    setError(null);
    try {
      const response = await failureAnalysisApi.fetchHealingActions(targetPage, limit);
      const normalized = normalizeHealingResponse(response, targetPage, limit);
      setHealingActions(normalized.healingActions);
      setTotal(normalized.total);
      setTotalPages(normalized.totalPages);
      if (normalized.page !== page) setPage(normalized.page);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch healing actions');
      setHealingActions([]);
      setTotal(0);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHealingActions(page);
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
    if (healingActions.length === 1 && page > 1) {
      setPage(page - 1);
      return;
    }
    loadHealingActions(page);
  };

  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-sm">
      <div className="border-b border-[var(--border)] pb-4 mb-4 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold text-[var(--foreground)] tracking-tight">Action Recommendations</h3>
          <p className="text-xs font-medium text-[var(--muted)]">
            Policy-routed diagnostics, notifications, and controlled actions
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold bg-emerald-50 border border-emerald-100/50 text-emerald-700 rounded-full px-3 py-1">
            Policy routed
          </span>
          <button
            type="button"
            onClick={() => loadHealingActions(page)}
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
              <th className="py-3 px-1">Healing ID</th>
              <th className="py-3">Failure ID</th>
              <th className="py-3">Test Name</th>
              <th className="py-3">Repair Type</th>
              <th className="py-3">Status</th>
              <th className="py-3">Action</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="py-6 text-center text-sm font-medium text-[var(--muted)]">
                  Loading action recommendations...
                </td>
              </tr>
            ) : healingActions.length > 0 ? (
              healingActions.map((item) => (
                <tr key={item.id} className="border-b border-[var(--border)] last:border-0 hover:bg-slate-50/50 transition duration-150">
                  <td className="py-4 text-xs font-mono font-bold text-indigo-600">{item.healing_id}</td>
                  <td className="py-4 text-xs font-mono text-[var(--muted)]">{item.failure_test_id}</td>
                  <td className="py-4 font-bold text-[var(--foreground)]">{item.test_name}</td>
                  <td className="py-4 text-xs font-medium text-slate-700">{item.repair_type}</td>
                  <td className="py-4">
                    <StatusBadge label={item.status} type="healing" />
                  </td>
                  <td className="py-4">
                    <DeleteRecordButton endpoint="healing" recordId={item.healing_id} onDeleted={handleDeleted} />
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="py-6 text-center text-sm font-medium text-[var(--muted)]">
                  No action recommendations have been recorded yet.
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

export default HealingActionsPage;
