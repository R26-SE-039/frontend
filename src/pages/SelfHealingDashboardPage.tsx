import React, { useEffect, useState } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { failureAnalysisApi } from '../api/failureAnalysisApi';
import StatCard from '../components/selfHealing/StatCard';
import StatusBadge from '../components/selfHealing/StatusBadge';
import type { DashboardSummary } from '../types/selfHealing';

const EMPTY_SUMMARY: DashboardSummary = {
  total_failures: 0,
  total_healing_actions: 0,
  total_flaky_tests: 0,
  total_notifications: 0,
  recent_failures: [],
};

function MetricRow({ label, value, badgeClass, code }: { label: string; value: number; badgeClass: string; code: string }) {
  return (
    <div className="rounded-2xl bg-[var(--card-2)] p-4 border border-[var(--border)]/50 transition hover:border-indigo-100 flex items-center justify-between">
      <div>
        <p className="text-xs font-bold uppercase tracking-wider text-[var(--muted)]">{label}</p>
        <p className="mt-1 text-2xl font-extrabold text-[var(--foreground)]">{value}</p>
      </div>
      <div className={`w-10 h-10 rounded-xl border flex items-center justify-center font-extrabold text-xs ${badgeClass}`}>
        {code}
      </div>
    </div>
  );
}

export const SelfHealingDashboardPage: React.FC = () => {
  const [summary, setSummary] = useState<DashboardSummary>(EMPTY_SUMMARY);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadSummary = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await failureAnalysisApi.fetchDashboardSummary();
      setSummary(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch dashboard summary');
      setSummary(EMPTY_SUMMARY);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSummary();
  }, []);

  const dashboardStats = [
    {
      title: 'Total Failures',
      value: loading ? '--' : String(summary.total_failures),
      change: 'Live updates',
    },
    {
      title: 'Healing Actions',
      value: loading ? '--' : String(summary.total_healing_actions),
      change: 'Policy routed',
    },
    {
      title: 'Flaky Tests',
      value: loading ? '--' : String(summary.total_flaky_tests),
      change: 'Heuristics',
    },
    {
      title: 'Notifications',
      value: loading ? '--' : String(summary.total_notifications),
      change: 'Internal records',
    },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold tracking-tight text-[var(--foreground)]">Failure Analysis Dashboard</h2>
          <p className="text-xs font-medium text-[var(--muted)]">
            Monitor failures, policy actions, and reliability signals.
          </p>
        </div>
        <button
          type="button"
          onClick={loadSummary}
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

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        {dashboardStats.map((stat) => (
          <StatCard key={stat.title} title={stat.title} value={stat.value} change={stat.change} />
        ))}
      </div>

      <div className="grid gap-8 xl:grid-cols-3">
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-sm xl:col-span-2">
          <div className="flex items-center justify-between border-b border-[var(--border)] pb-4 mb-4">
            <div>
              <h3 className="text-lg font-bold text-[var(--foreground)] tracking-tight">Recent Failures</h3>
              <p className="text-xs font-medium text-[var(--muted)]">Latest pipeline failure records</p>
            </div>
            <span className="text-xs font-bold bg-indigo-50 border border-indigo-100/50 text-indigo-700 rounded-full px-3 py-1">
              Live
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-[var(--border)] text-left text-xs font-bold text-[var(--muted)] uppercase tracking-wider">
                  <th className="py-3 px-1">Test Name</th>
                  <th className="py-3">Pipeline</th>
                  <th className="py-3">Root Cause</th>
                  <th className="py-3">Status</th>
                  <th className="py-3">Healing</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={5} className="py-6 text-center text-sm font-medium text-[var(--muted)]">
                      Loading recent failures...
                    </td>
                  </tr>
                ) : summary.recent_failures.length > 0 ? (
                  summary.recent_failures.map((item) => (
                    <tr key={item.id} className="border-b border-[var(--border)] last:border-0 hover:bg-slate-50/50 transition duration-150">
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
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="py-6 text-center text-sm font-medium text-[var(--muted)]">
                      No recent failures recorded yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-lg font-bold tracking-tight border-b border-[var(--border)] pb-4 text-[var(--foreground)]">
              System Metrics
            </h3>
            <div className="mt-5 space-y-4 text-sm flex-1">
              <MetricRow label="Failures" value={summary.total_failures} code="FL" badgeClass="bg-red-100/60 border-red-100 text-red-600" />
              <MetricRow label="Healing" value={summary.total_healing_actions} code="HL" badgeClass="bg-emerald-100/60 border-emerald-100 text-emerald-600" />
              <MetricRow label="Flaky Tests" value={summary.total_flaky_tests} code="FK" badgeClass="bg-amber-100/60 border-amber-100 text-amber-600" />
              <MetricRow label="Alert Records" value={summary.total_notifications} code="AL" badgeClass="bg-indigo-100/60 border-indigo-100 text-indigo-600" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SelfHealingDashboardPage;
