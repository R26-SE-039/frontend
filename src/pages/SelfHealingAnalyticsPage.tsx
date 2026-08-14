import React, { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { failureAnalysisApi } from '../api/failureAnalysisApi';
import DeleteRecordButton from '../components/selfHealing/DeleteRecordButton';
import FailureTrendChart from '../components/selfHealing/FailureTrendChart';
import FlakyRiskChart from '../components/selfHealing/FlakyRiskChart';
import StatCard from '../components/selfHealing/StatCard';
import StatusBadge from '../components/selfHealing/StatusBadge';
import type { FlakyTest, ListResponse } from '../types/selfHealing';

function normalizeFlakyResponse(response: ListResponse<FlakyTest>, fallbackPage: number, fallbackLimit: number) {
  const flakyTests = Array.isArray(response) ? response : response.data;
  const total = Array.isArray(response) ? response.length : response.total;
  const page = Array.isArray(response) ? fallbackPage : response.page || fallbackPage;
  const limit = Array.isArray(response) ? fallbackLimit : response.limit || fallbackLimit;

  return {
    flakyTests,
    total,
    page,
    limit,
    totalPages: Math.max(1, Math.ceil(total / limit)),
  };
}

export const SelfHealingAnalyticsPage: React.FC = () => {
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [flakyTests, setFlakyTests] = useState<FlakyTest[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadFlakyTests = async (targetPage = page) => {
    setLoading(true);
    setError(null);
    try {
      const response = await failureAnalysisApi.fetchFlakyTests(targetPage, limit);
      const normalized = normalizeFlakyResponse(response, targetPage, limit);
      setFlakyTests(normalized.flakyTests);
      setTotal(normalized.total);
      setTotalPages(normalized.totalPages);
      if (normalized.page !== page) setPage(normalized.page);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch flaky tests');
      setFlakyTests([]);
      setTotal(0);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFlakyTests(page);
  }, [page]);

  const analytics = useMemo(() => {
    const numericScores = flakyTests
      .map((item) => parseInt(item.instability_score.replace('%', ''), 10))
      .filter((value) => !Number.isNaN(value));

    const averageScore = numericScores.length > 0
      ? Math.round(numericScores.reduce((sum, value) => sum + value, 0) / numericScores.length)
      : 0;

    const riskDistribution = [
      {
        name: 'High',
        value: flakyTests.filter((test) => test.risk_level.toLowerCase() === 'high').length,
        color: '#ef4444',
      },
      {
        name: 'Medium',
        value: flakyTests.filter((test) => test.risk_level.toLowerCase() === 'medium').length,
        color: '#f59e0b',
      },
      {
        name: 'Low',
        value: flakyTests.filter((test) => test.risk_level.toLowerCase() === 'low').length,
        color: '#10b981',
      },
    ];

    return {
      averageScore,
      highRiskCount: riskDistribution[0].value,
      riskDistribution,
    };
  }, [flakyTests]);

  const pageLabel = useMemo(() => {
    if (loading) return 'Loading records';
    return `Showing page ${page} of ${totalPages} (${total} total records)`;
  }, [loading, page, total, totalPages]);

  const goToPage = (nextPage: number) => {
    if (nextPage < 1 || nextPage > totalPages || nextPage === page) return;
    setPage(nextPage);
  };

  const handleDeleted = () => {
    if (flakyTests.length === 1 && page > 1) {
      setPage(page - 1);
      return;
    }
    loadFlakyTests(page);
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold tracking-tight text-[var(--foreground)]">Reliability Analytics</h2>
          <p className="text-xs font-medium text-[var(--muted)]">
            Inspect flaky-test risk and recent execution patterns.
          </p>
        </div>
        <button
          type="button"
          onClick={() => loadFlakyTests(page)}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-lg border border-[var(--border)] bg-white px-4 py-2 text-xs font-bold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-xs font-bold text-red-700">
          <AlertTriangle size={15} />
          {error}
        </div>
      )}

      <div className="grid gap-5 md:grid-cols-3">
        <StatCard title="Predicted Flaky Tests" value={loading ? '--' : String(total)} change="Live analysis" />
        <StatCard title="Avg Instability Score" value={loading ? '--' : `${analytics.averageScore}%`} change="Heuristics" />
        <StatCard title="Predicted High Risk" value={loading ? '--' : String(analytics.highRiskCount)} change="Risk model" />
      </div>
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-sm">
        <div className="border-b border-[var(--border)] pb-4 mb-4">
          <h3 className="text-lg font-bold text-[var(--foreground)] tracking-tight">Failure Trend</h3>
          <p className="text-xs font-medium text-[var(--muted)]">
            Recent failure volume over time from the analytics backend.
          </p>
        </div>
        <FailureTrendChart />
      </div>

      <div className="grid gap-8 xl:grid-cols-3">
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-sm xl:col-span-2">
          <div className="border-b border-[var(--border)] pb-4 mb-4 flex flex-wrap items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold text-[var(--foreground)] tracking-tight">Flaky Test Prediction</h3>
              <p className="text-xs font-medium text-[var(--muted)]">
                Historical pass/fail trends used for predictive analysis
              </p>
            </div>
            <span className="text-xs font-bold bg-indigo-50 border border-indigo-100/50 text-indigo-700 rounded-full px-3 py-1">
              Live Analysis
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-[var(--border)] text-left text-xs font-bold text-[var(--muted)] uppercase tracking-wider">
                  <th className="py-3 px-1">Test ID</th>
                  <th className="py-3">Test Name</th>
                  <th className="py-3">Instability</th>
                  <th className="py-3">Pattern</th>
                  <th className="py-3">Risk Level</th>
                  <th className="py-3">Action</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} className="py-6 text-center text-sm font-medium text-[var(--muted)]">
                      Loading flaky test analytics...
                    </td>
                  </tr>
                ) : flakyTests.length > 0 ? (
                  flakyTests.map((item) => (
                    <tr key={item.id} className="border-b border-[var(--border)] last:border-0 hover:bg-slate-50/50 transition duration-150">
                      <td className="py-4 text-xs font-mono font-bold text-indigo-600">{item.test_code}</td>
                      <td className="py-4 font-bold text-[var(--foreground)]">{item.test_name}</td>
                      <td className="py-4 font-bold text-slate-700">{item.instability_score}</td>
                      <td className="py-4 font-mono text-xs text-slate-500 bg-slate-50/60 p-1 rounded border border-slate-100/60 m-1">
                        {item.recent_pattern}
                      </td>
                      <td className="py-4">
                        <StatusBadge label={item.risk_level} type="risk" />
                      </td>
                      <td className="py-4">
                        <DeleteRecordButton endpoint="analytics/flaky-tests" recordId={item.test_code} onDeleted={handleDeleted} />
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="py-6 text-center text-sm font-medium text-[var(--muted)]">
                      No flaky test analytics found.
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

        <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-lg font-bold tracking-tight border-b border-[var(--border)] pb-4 text-[var(--foreground)]">
              Risk Distribution
            </h3>
            <p className="text-xs font-medium text-[var(--muted)] mb-4">
              Predicted flaky test risk levels
            </p>
            <div className="mt-4">
              {loading ? (
                <div className="h-[280px] w-full animate-pulse rounded-xl bg-[var(--card-2)]" />
              ) : (
                <FlakyRiskChart data={analytics.riskDistribution} />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SelfHealingAnalyticsPage;


