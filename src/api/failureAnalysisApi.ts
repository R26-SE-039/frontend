import { FAILURE_ANALYSIS_API_URL } from './config';
import type { RepairHistoryItem } from '../types/selfHealing';

export type FailureAnalysisRequest = {
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

export type RepairHistoryFilters = {
  rootCause?: string;
  publishStatus?: string;
  repository?: string;
};

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
    const response = await fetch(`${FAILURE_ANALYSIS_API_URL}/analyze/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    return parseJsonResponse<T>(response, 'Analysis failed');
  },

  planRepair: async <T>(attemptId: string): Promise<T> => {
    const response = await fetch(`${FAILURE_ANALYSIS_API_URL}/api/repairs/${attemptId}/plan`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ confirm_read_only: true }),
    });

    return parseJsonResponse<T>(response, 'Read-only repair planning failed.');
  },

  publishRepair: async <T>(attemptId: string): Promise<T> => {
    const response = await fetch(`${FAILURE_ANALYSIS_API_URL}/api/repairs/${attemptId}/publish`, {
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
    const response = await fetch(`${FAILURE_ANALYSIS_API_URL}/api/repairs/history${suffix}`);

    return parseJsonResponse<RepairHistoryItem[]>(response, 'Failed to fetch repair history');
  },
};
