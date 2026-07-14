import React, { useEffect, useState } from 'react';
import { AlertTriangle, Filter, RotateCcw } from 'lucide-react';
import RepairHistoryTable from '../components/selfHealing/RepairHistoryTable';
import { failureAnalysisApi } from '../api/failureAnalysisApi';
import type { RepairHistoryItem } from '../types/selfHealing';

const ROOT_CAUSES = [
  'application_defect',
  'test_script_issue',
  'network_issue',
  'dependency_issue',
  'workflow_environment_issue',
  'infrastructure_resource_issue',
  'deployment_issue',
  'security_policy_issue',
  'other_or_unknown',
];

const PUBLISH_STATUSES = [
  'in_progress',
  'branch_created',
  'commit_created',
  'draft_pr_created',
  'partial_manual_review',
  'manual_review',
  'notification_sent',
  'dependency_review_required',
  'workflow_environment_review_required',
  'retry_recommended',
  'infrastructure_review_required',
  'deployment_review_required',
  'security_review_required',
  'manual_triage_required',
  'failed',
];

function optionLabel(value: string) {
  return value.replaceAll('_', ' ');
}

export const RepairHistoryPage: React.FC = () => {
  const [rootCause, setRootCause] = useState('');
  const [publishStatus, setPublishStatus] = useState('');
  const [repository, setRepository] = useState('');
  const [appliedFilters, setAppliedFilters] = useState({
    rootCause: '',
    publishStatus: '',
    repository: '',
  });
  const [items, setItems] = useState<RepairHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const loadHistory = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await failureAnalysisApi.getRepairHistory({
          rootCause: appliedFilters.rootCause || undefined,
          publishStatus: appliedFilters.publishStatus || undefined,
          repository: appliedFilters.repository || undefined,
        });
        if (isMounted) setItems(data);
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Failed to fetch repair history');
          setItems([]);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadHistory();

    return () => {
      isMounted = false;
    };
  }, [appliedFilters]);

  const applyFilters = (event: React.FormEvent) => {
    event.preventDefault();
    setAppliedFilters({
      rootCause,
      publishStatus,
      repository: repository.trim(),
    });
  };

  const clearFilters = () => {
    setRootCause('');
    setPublishStatus('');
    setRepository('');
    setAppliedFilters({ rootCause: '', publishStatus: '', repository: '' });
  };

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-[var(--foreground)]">Repair History</h2>
          <p className="mt-1 text-sm font-medium text-[var(--muted)]">
            Controlled repair plans, publishing outcomes, and developer review links.
          </p>
        </div>
        <span className="border-l-4 border-indigo-500 pl-3 text-sm font-bold text-slate-700">
          {loading ? 'Loading attempts' : `${items.length} matching attempts`}
        </span>
      </header>

      <section className="border-y border-[var(--border)] bg-[var(--card)] py-4">
        <form onSubmit={applyFilters} className="grid gap-3 px-1 md:grid-cols-[1fr_1fr_1.2fr_auto_auto] md:items-end">
          <label className="text-xs font-bold text-[var(--muted)]">
            Root cause
            <select
              value={rootCause}
              onChange={(event) => setRootCause(event.target.value)}
              className="mt-1.5 h-10 w-full rounded-lg border border-[var(--border)] bg-white px-3 text-sm font-medium text-slate-800"
            >
              <option value="">All root causes</option>
              {ROOT_CAUSES.map((value) => (
                <option key={value} value={value}>{optionLabel(value)}</option>
              ))}
            </select>
          </label>
          <label className="text-xs font-bold text-[var(--muted)]">
            Action / publish status
            <select
              value={publishStatus}
              onChange={(event) => setPublishStatus(event.target.value)}
              className="mt-1.5 h-10 w-full rounded-lg border border-[var(--border)] bg-white px-3 text-sm font-medium text-slate-800"
            >
              <option value="">All statuses</option>
              {PUBLISH_STATUSES.map((value) => (
                <option key={value} value={value}>{optionLabel(value)}</option>
              ))}
            </select>
          </label>
          <label className="text-xs font-bold text-[var(--muted)]">
            Repository
            <input
              value={repository}
              onChange={(event) => setRepository(event.target.value)}
              placeholder="owner/repository"
              className="mt-1.5 h-10 w-full rounded-lg border border-[var(--border)] bg-white px-3 text-sm font-medium text-slate-800"
            />
          </label>
          <button
            type="submit"
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 text-xs font-bold text-white hover:bg-indigo-700"
          >
            <Filter size={15} /> Apply
          </button>
          <button
            type="button"
            onClick={clearFilters}
            aria-label="Clear repair history filters"
            title="Clear filters"
            className="inline-flex h-10 items-center justify-center rounded-lg border border-[var(--border)] px-3 text-slate-600 hover:bg-slate-50"
          >
            <RotateCcw size={15} />
          </button>
        </form>
      </section>

      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-xs font-bold text-red-700">
          <AlertTriangle size={15} />
          {error}
        </div>
      )}

      <section className="border border-[var(--border)] bg-[var(--card)] shadow-sm">
        {loading ? (
          <div className="py-12 text-center text-sm font-medium text-[var(--muted)]">Loading repair history...</div>
        ) : (
          <RepairHistoryTable items={items} />
        )}
      </section>
    </div>
  );
};

export default RepairHistoryPage;
