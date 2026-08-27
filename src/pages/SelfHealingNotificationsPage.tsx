import React, { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, Bell, ExternalLink, Filter, RefreshCw } from 'lucide-react';
import { Link } from 'react-router-dom';
import { failureAnalysisApi } from '../api/failureAnalysisApi';
import { useMeetingStore } from '../store/useMeetingStore';
import type { ListResponse, Notification } from '../types/selfHealing';

type NotificationFilter = 'all' | 'application_defects' | 'test_script' | 'infrastructure' | 'manual_review';

const ROOT_CAUSE_LABELS: Record<string, string> = {
  application_defect: 'Application Defect',
  test_script_issue: 'Test Script Issue',
  dependency_issue: 'Dependency Issue',
  network_issue: 'Network Issue',
  workflow_environment_issue: 'Workflow / Environment Issue',
  infrastructure_resource_issue: 'Infrastructure / Resource Issue',
  deployment_issue: 'Deployment Issue',
  security_policy_issue: 'Security Policy Issue',
  other_or_unknown: 'Manual Investigation Required',
};

const ACTION_LABELS: Record<string, string> = {
  application_defect: 'Controlled Repair Available',
  test_script_issue: 'Test Script Review Required',
  dependency_issue: 'Dependency Remediation Recommended',
  network_issue: 'Pipeline Retry Recommended',
  workflow_environment_issue: 'Workflow / Environment Review',
  infrastructure_resource_issue: 'Resource Review Recommended',
  deployment_issue: 'Rollback / Manual Review',
  security_policy_issue: 'Security Review Required',
  other_or_unknown: 'Manual Investigation Required',
};

const FILTERS: Array<{ id: NotificationFilter; label: string }> = [
  { id: 'all', label: 'All' },
  { id: 'application_defects', label: 'Application Defects' },
  { id: 'test_script', label: 'Test Script' },
  { id: 'infrastructure', label: 'Infrastructure / Environment' },
  { id: 'manual_review', label: 'Manual Review' },
];

function normalizeNotificationResponse(response: ListResponse<Notification>, fallbackPage: number, fallbackLimit: number) {
  const notifications = Array.isArray(response) ? response : response.data;
  const total = Array.isArray(response) ? response.length : response.total;
  const page = Array.isArray(response) ? fallbackPage : response.page || fallbackPage;
  const limit = Array.isArray(response) ? fallbackLimit : response.limit || fallbackLimit;

  return {
    notifications,
    total,
    page,
    limit,
    totalPages: Math.max(1, Math.ceil(total / limit)),
  };
}

function rootCauseLabel(rootCause: string) {
  return ROOT_CAUSE_LABELS[rootCause] || titleCase(rootCause);
}

function rootCauseBadgeClass(rootCause: string) {
  switch (rootCause) {
    case 'application_defect':
      return 'border-pink-500/20 bg-pink-500/10 text-pink-700';
    case 'test_script_issue':
      return 'border-blue-500/20 bg-blue-500/10 text-blue-700';
    case 'network_issue':
      return 'border-red-500/20 bg-red-500/10 text-red-700';
    case 'dependency_issue':
      return 'border-orange-500/20 bg-orange-500/10 text-orange-700';
    case 'workflow_environment_issue':
      return 'border-cyan-500/20 bg-cyan-500/10 text-cyan-700';
    case 'infrastructure_resource_issue':
      return 'border-slate-500/20 bg-slate-500/10 text-slate-700';
    case 'deployment_issue':
      return 'border-violet-500/20 bg-violet-500/10 text-violet-700';
    case 'security_policy_issue':
      return 'border-rose-500/20 bg-rose-500/10 text-rose-700';
    default:
      return 'border-gray-500/20 bg-gray-500/10 text-gray-600';
  }
}

function RootCauseBadge({ rootCause }: { rootCause: string }) {
  return (
    <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-medium ${rootCauseBadgeClass(rootCause)}`}>
      {rootCauseLabel(rootCause)}
    </span>
  );
}

function actionLabel(notification: Notification) {
  const rootCause = notification.root_cause;
  if (rootCause === 'other_or_unknown' || /manual review|low confidence/i.test(notification.message)) {
    return 'Manual Review Required';
  }
  return ACTION_LABELS[rootCause] || 'Manual Investigation Required';
}

function matchesFilter(notification: Notification, filter: NotificationFilter) {
  switch (filter) {
    case 'application_defects':
      return notification.root_cause === 'application_defect';
    case 'test_script':
      return notification.root_cause === 'test_script_issue';
    case 'infrastructure':
      return [
        'dependency_issue',
        'network_issue',
        'workflow_environment_issue',
        'infrastructure_resource_issue',
        'deployment_issue',
        'security_policy_issue',
      ].includes(notification.root_cause);
    case 'manual_review':
      return notification.root_cause === 'other_or_unknown' || /manual review|low confidence/i.test(notification.message);
    default:
      return true;
  }
}

function formatNotificationError(error: unknown) {
  const message = error instanceof Error ? error.message : 'Failed to fetch notifications';
  if (/401|unauthorized|session/i.test(message)) return 'Your session could not be authorized. Please sign in again and retry.';
  if (/403|forbidden|access denied/i.test(message)) return 'You do not have access to these project notifications.';
  if (/404|not found/i.test(message)) return 'Project notifications could not be found.';
  return message;
}

function titleCase(value: string) {
  return value
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (match) => match.toUpperCase());
}

export const SelfHealingNotificationsPage: React.FC = () => {
  const projectId = useMeetingStore((state) => state.currentProject?.id);
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [filter, setFilter] = useState<NotificationFilter>('all');
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadNotifications = async (targetPage = page) => {
    setLoading(true);
    setError(null);
    try {
      const response = await failureAnalysisApi.fetchNotifications(targetPage, limit);
      const normalized = normalizeNotificationResponse(response, targetPage, limit);
      setNotifications(normalized.notifications);
      setTotal(normalized.total);
      setTotalPages(normalized.totalPages);
      if (normalized.page !== page) setPage(normalized.page);
    } catch (err) {
      setError(formatNotificationError(err));
      setNotifications([]);
      setTotal(0);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setNotifications([]);
    setTotal(0);
    setTotalPages(1);
    setError(null);
    setFilter('all');
    if (!projectId) {
      setLoading(false);
      return;
    }
    void loadNotifications(1);
  }, [projectId]);

  const filteredNotifications = useMemo(
    () => notifications.filter((notification) => matchesFilter(notification, filter)),
    [notifications, filter],
  );

  const pageLabel = useMemo(() => {
    if (loading) return 'Loading notifications';
    return `Showing page ${page} of ${totalPages} (${total} total notifications)`;
  }, [loading, page, total, totalPages]);

  const goToPage = (nextPage: number) => {
    if (nextPage < 1 || nextPage > totalPages || nextPage === page) return;
    setPage(nextPage);
    void loadNotifications(nextPage);
  };

  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-sm">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-4 border-b border-[var(--border)] pb-4">
        <div>
          <h3 className="flex items-center gap-2 text-lg font-bold tracking-tight text-[var(--foreground)]">
            <Bell size={18} className="text-rose-600" />
            Self Healing Notifications
          </h3>
          <p className="mt-1 max-w-2xl text-xs font-medium text-[var(--muted)]">
            Project-scoped recovery alerts, ownership targets, and next actions from Component 3 analysis.
          </p>
        </div>
        <button
          type="button"
          onClick={() => loadNotifications(page)}
          disabled={loading || !projectId}
          className="inline-flex items-center gap-2 rounded-lg border border-[var(--border)] bg-white px-3 py-2 text-xs font-bold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      <div className="mb-5 flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-wider text-[var(--muted)]">
          <Filter size={13} /> Filter
        </span>
        {FILTERS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setFilter(item.id)}
            className={`rounded-lg border px-3 py-1.5 text-[11px] font-black transition ${
              filter === item.id
                ? 'border-rose-600 bg-rose-600 text-white shadow-sm'
                : 'border-slate-200 bg-white text-slate-500 hover:text-rose-600'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {error && (
        <div className="mb-4 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-xs font-bold text-red-700">
          <AlertTriangle size={15} className="mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-[var(--border)] text-left text-xs font-bold uppercase tracking-wider text-[var(--muted)]">
              <th className="px-1 py-3">Failure</th>
              <th className="py-3">Root Cause</th>
              <th className="py-3">Next Action</th>
              <th className="py-3">Target</th>
              <th className="py-3">Message</th>
              <th className="py-3">Links</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="py-6 text-center text-sm font-medium text-[var(--muted)]">
                  Loading notifications...
                </td>
              </tr>
            ) : filteredNotifications.length > 0 ? (
              filteredNotifications.map((notification) => (
                <tr key={notification.id} className="border-b border-[var(--border)] transition last:border-0 hover:bg-slate-50/50">
                  <td className="py-4 pr-4">
                    <p className="font-bold text-[var(--foreground)]">{notification.test_name}</p>
                    <p className="mt-1 font-mono text-xs font-bold text-indigo-600">{notification.failure_test_id}</p>
                    {notification.failure_id && (
                      <p className="mt-1 text-[11px] font-bold text-[var(--muted)]">Failure row #{notification.failure_id}</p>
                    )}
                  </td>
                  <td className="py-4 pr-4">
                    <RootCauseBadge rootCause={notification.root_cause} />
                  </td>
                  <td className="py-4 pr-4">
                    <span className="inline-flex rounded-xl border border-rose-100 bg-rose-50 px-3 py-1 text-xs font-bold text-rose-700">
                      {actionLabel(notification)}
                    </span>
                  </td>
                  <td className="py-4 pr-4 text-xs font-bold text-slate-700">{notification.target || 'Developer'}</td>
                  <td className="max-w-md py-4 pr-4 text-xs font-medium leading-5 text-slate-600">{notification.message}</td>
                  <td className="py-4">
                    <div className="flex flex-wrap gap-2">
                      {notification.failure_test_id ? (
                        <Link
                          to={`/self-healing/failures/${encodeURIComponent(notification.failure_test_id)}`}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-2 text-xs font-bold text-white transition hover:bg-indigo-700"
                        >
                          View Failure <ExternalLink size={12} />
                        </Link>
                      ) : (
                        <span className="text-xs font-bold text-[var(--muted)]">No linked failure</span>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="py-6 text-center text-sm font-medium text-[var(--muted)]">
                  {notifications.length === 0
                    ? 'No notifications have been recorded for this project yet.'
                    : 'No notifications match the selected filter.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between border-t border-[var(--border)] pt-4">
          <span className="text-xs font-bold text-[var(--muted)]">{pageLabel}</span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => goToPage(page - 1)}
              disabled={page <= 1 || loading}
              className="rounded-xl border border-[var(--border)] px-4 py-2 text-xs font-bold text-[var(--foreground)] transition hover:bg-[var(--card-2)] disabled:pointer-events-none disabled:bg-slate-50 disabled:text-[var(--muted)] disabled:opacity-50"
            >
              Previous
            </button>
            <button
              type="button"
              onClick={() => goToPage(page + 1)}
              disabled={page >= totalPages || loading}
              className="rounded-xl border border-[var(--border)] px-4 py-2 text-xs font-bold text-[var(--foreground)] transition hover:bg-[var(--card-2)] disabled:pointer-events-none disabled:bg-slate-50 disabled:text-[var(--muted)] disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      )}

      <p className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs font-medium text-slate-600">
        Read/unread persistence is not supported by the current notification model.
      </p>
    </div>
  );
};

export default SelfHealingNotificationsPage;