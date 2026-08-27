import { FAILURE_ANALYSIS_API_URL } from './config';
import { authenticatedFetch } from './authenticatedFetch';
import { useMeetingStore } from '../store/useMeetingStore';
import type {
  DashboardSummary,
  Failure,
  FlakyTest,
  HealingAction,
  GitHubFailedRunsResponse,
  GitHubRunDetailsResponse,
  ListResponse,
  Notification,
  RepairHistoryFilters,
  RepairHistoryItem,
} from '../types/selfHealing';

export type FailureAnalysisRequest = {
  organization_id?: string;
  project_id?: string;
  iteration_id?: string;
  user_story_id?: string;
  suite_id?: string;
  execution_id?: string;
  test_run_id?: string;
  test_name: string;
  pipeline: string;
  error_message: string;
  stack_trace: string;
  logs: string;
  failure_stage: string;
  failure_type: string;
  severity: string;
  retry_count: number;
  test_duration_sec: number;
  cpu_usage_pct: number;
  memory_usage_mb: number;
  old_locator: string;
  github_actions_run_url: string;
};

export type SelfHealingProjectContext = {
  organization_id: string;
  project_id: string;
};

function getSelfHealingProjectContext(): SelfHealingProjectContext {
  const { user, currentProject } = useMeetingStore.getState();
  if (!user?.organizationId || !currentProject?.id) {
    throw new Error('Select a project before using Self Healing.');
  }
  return {
    organization_id: user.organizationId,
    project_id: currentProject.id,
  };
}

function withProjectScope(path: string): string {
  const context = getSelfHealingProjectContext();
  const separator = path.includes('?') ? '&' : '?';
  const params = new URLSearchParams(context);
  return `${path}${separator}${params.toString()}`;
}

async function parseJsonResponse<T>(response: Response, fallbackMessage: string): Promise<T> {
  const body = await response.json().catch(() => null);

  if (!response.ok) {
    const detail = body && typeof body.detail === 'string' ? body.detail : null;
    throw new Error(detail || fallbackMessage);
  }

  return body as T;
}

export const failureAnalysisApi = {
  submitAnalysis: async <T>(payload: FailureAnalysisRequest): Promise<T> => {
    const context = getSelfHealingProjectContext();
    const response = await authenticatedFetch(`${FAILURE_ANALYSIS_API_URL}/analyze/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...payload, ...context }),
    });

    return parseJsonResponse<T>(response, 'Analysis failed');
  },

  fetchFailures: async (page = 1, limit = 10): Promise<ListResponse<Failure>> => {
    const response = await authenticatedFetch(`${FAILURE_ANALYSIS_API_URL}${withProjectScope(`/failures/?page=${page}&limit=${limit}`)}`);

    return parseJsonResponse<ListResponse<Failure>>(response, 'Failed to fetch failures');
  },

  deleteFailure: async (testId: string): Promise<unknown> => {
    const response = await authenticatedFetch(`${FAILURE_ANALYSIS_API_URL}${withProjectScope(`/failures/${testId}`)}`, {
      method: 'DELETE',
    });

    return parseJsonResponse<unknown>(response, 'Failed to delete failure');
  },

  deleteRecord: async (endpoint: string, id: string | number): Promise<unknown> => {
    const response = await authenticatedFetch(`${FAILURE_ANALYSIS_API_URL}${withProjectScope(`/${endpoint}/${id}`)}`, {
      method: 'DELETE',
    });

    return parseJsonResponse<unknown>(response, `Failed to delete record at ${endpoint}`);
  },

  fetchFailureById: async (testId: string): Promise<Failure> => {
    const response = await authenticatedFetch(`${FAILURE_ANALYSIS_API_URL}${withProjectScope(`/failures/${testId}`)}`);

    return parseJsonResponse<Failure>(response, 'Failed to fetch failure details');
  },

  fetchHealingActions: async (page = 1, limit = 10): Promise<ListResponse<HealingAction>> => {
    const response = await authenticatedFetch(`${FAILURE_ANALYSIS_API_URL}${withProjectScope(`/healing/?page=${page}&limit=${limit}`)}`);

    return parseJsonResponse<ListResponse<HealingAction>>(response, 'Failed to fetch healing actions');
  },

  fetchFlakyTests: async (page = 1, limit = 10): Promise<ListResponse<FlakyTest>> => {
    const response = await authenticatedFetch(`${FAILURE_ANALYSIS_API_URL}${withProjectScope(`/analytics/flaky-tests?page=${page}&limit=${limit}`)}`);

    return parseJsonResponse<ListResponse<FlakyTest>>(response, 'Failed to fetch flaky tests');
  },

  fetchNotifications: async (page = 1, limit = 10): Promise<ListResponse<Notification>> => {
    const response = await authenticatedFetch(`${FAILURE_ANALYSIS_API_URL}${withProjectScope(`/notifications/?page=${page}&limit=${limit}`)}`);

    return parseJsonResponse<ListResponse<Notification>>(response, 'Failed to fetch notifications');
  },

  fetchGithubFailedRuns: async (): Promise<GitHubFailedRunsResponse> => {
    const response = await authenticatedFetch(`${FAILURE_ANALYSIS_API_URL}${withProjectScope('/api/github/actions/failed-runs')}`);

    return parseJsonResponse<GitHubFailedRunsResponse>(response, 'Failed to fetch failed CI runs');
  },

  fetchGithubRunDetails: async (runId: number | string): Promise<GitHubRunDetailsResponse> => {
    const response = await authenticatedFetch(`${FAILURE_ANALYSIS_API_URL}${withProjectScope(`/api/github/actions/runs/${runId}`)}`);

    return parseJsonResponse<GitHubRunDetailsResponse>(response, 'Failed to fetch failed CI run details');
  },

  analyzeGithubFailedJob: async <T>(runId: number | string, jobId: number | string): Promise<T> => {
    const response = await authenticatedFetch(`${FAILURE_ANALYSIS_API_URL}${withProjectScope(`/api/github/actions/runs/${runId}/jobs/${jobId}/analyze`)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });

    return parseJsonResponse<T>(response, 'GitHub failure analysis failed');
  },

  fetchDashboardSummary: async (): Promise<DashboardSummary> => {
    const response = await authenticatedFetch(`${FAILURE_ANALYSIS_API_URL}${withProjectScope('/dashboard/summary')}`);

    return parseJsonResponse<DashboardSummary>(response, 'Failed to fetch dashboard summary');
  },

  fetchFailureTrend: async (): Promise<Array<{ name: string; failures: number }>> => {
    const response = await authenticatedFetch(`${FAILURE_ANALYSIS_API_URL}${withProjectScope('/dashboard/trend')}`);

    return parseJsonResponse<Array<{ name: string; failures: number }>>(response, 'Failed to fetch failure trend');
  },

  planRepair: async <T>(attemptId: string): Promise<T> => {
    const response = await authenticatedFetch(`${FAILURE_ANALYSIS_API_URL}${withProjectScope(`/api/repairs/${attemptId}/plan`)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ confirm_read_only: true }),
    });

    return parseJsonResponse<T>(response, 'Read-only repair planning failed.');
  },

  publishRepair: async <T>(attemptId: string): Promise<T> => {
    const response = await authenticatedFetch(`${FAILURE_ANALYSIS_API_URL}${withProjectScope(`/api/repairs/${attemptId}/publish`)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ confirm_publish: true }),
    });

    return parseJsonResponse<T>(response, 'Controlled repair publishing failed.');
  },

  getRepairHistory: async (filters: RepairHistoryFilters = {}): Promise<RepairHistoryItem[]> => {
    const query = new URLSearchParams();
    if (filters.rootCause) query.set('root_cause', filters.rootCause);
    if (filters.publishStatus) query.set('publish_status', filters.publishStatus);
    if (filters.repository) query.set('repository', filters.repository);

    const suffix = query.size ? `?${query.toString()}` : '';
    const response = await authenticatedFetch(`${FAILURE_ANALYSIS_API_URL}${withProjectScope(`/api/repairs/history${suffix}`)}`);

    return parseJsonResponse<RepairHistoryItem[]>(response, 'Failed to fetch repair history');
  },
};
