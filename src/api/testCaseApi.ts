import { TEST_CASE_API_URL, TEST_CASE_WS_URL } from './config';
import { useMeetingStore } from '../store/useMeetingStore';
import type {
  AgentEvent,
  CrawlOptions,
  DomCrawlResponse,
  DomElement,
  ExecuteResponse,
  ExecutionEvent,
  GherkinResult,
  GitHubConnectResponse,
  GitHubConnection,
  GitHubPingResponse,
  GitHubValidateResponse,
  ProbeResponse,
  RiskResponse,
  RunDetail,
  RunSummary,
  StartExplorationResponse,
  TestCaseProject,
  TestSuite,
  UserStoryPayload,
  UserStoryResponse,
} from '../types/testCase';

const REQUEST_TIMEOUT_MS = 30_000;
const LLM_REQUEST_TIMEOUT_MS = 180_000;
const CRAWL_REQUEST_TIMEOUT_MS = 90_000;

// The dashboard's active project lives in the auth service, while the test case
// generation backend keeps its own project rows. This maps auth project id ->
// generation project id so every page stays scoped to the workspace project.
const PROJECT_MAP_STORAGE_KEY = 'test-case-gen-project-map';

async function request<T>(path: string, options?: RequestInit & { timeoutMs?: number }): Promise<T> {
  const timeoutMs = options?.timeoutMs ?? REQUEST_TIMEOUT_MS;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  let response: Response;
  try {
    response = await fetch(`${TEST_CASE_API_URL}${path}`, {
      headers: { 'Content-Type': 'application/json' },
      ...options,
      signal: controller.signal,
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new Error(`Test case service timed out after ${timeoutMs / 1000}s. Is the backend running on port 8002?`);
    }
    throw new Error('Test case service unreachable. Is the backend running on port 8002?');
  } finally {
    clearTimeout(timer);
  }

  if (!response.ok) {
    const body = await response.json().catch(() => null);
    const detail = body && typeof body.detail === 'string' ? body.detail : null;
    throw new Error(detail || `Test case service error (${response.status})`);
  }

  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

function readProjectMap(): Record<string, string> {
  try {
    return JSON.parse(localStorage.getItem(PROJECT_MAP_STORAGE_KEY) || '{}');
  } catch {
    return {};
  }
}

export const testCaseApi = {
  // ── Projects ──────────────────────────────────────────────────────────────
  listProjects: async (): Promise<TestCaseProject[]> => request<TestCaseProject[]>('/api/v1/projects'),

  createProject: async (name: string, description?: string): Promise<TestCaseProject> =>
    request<TestCaseProject>('/api/v1/projects', {
      method: 'POST',
      body: JSON.stringify({ name, description }),
    }),

  /**
   * Resolve the generation-backend project for the workspace's current project,
   * creating it on first use. Every page calls this before loading data.
   */
  ensureProject: async (): Promise<string> => {
    const current = useMeetingStore.getState().currentProject;
    if (!current) throw new Error('Select a project before opening Test Case Gen.');

    const map = readProjectMap();
    const projects = await testCaseApi.listProjects();

    const mapped = map[current.id];
    if (mapped && projects.some((project) => project.id === mapped)) return mapped;

    const byName = projects.find((project) => project.name === current.name);
    const resolved = byName ?? (await testCaseApi.createProject(current.name, `NextGenQA workspace project ${current.id}`));

    map[current.id] = resolved.id;
    localStorage.setItem(PROJECT_MAP_STORAGE_KEY, JSON.stringify(map));
    return resolved.id;
  },

  // ── User stories (S1) ─────────────────────────────────────────────────────
  listStories: async (projectId: string): Promise<UserStoryResponse[]> =>
    request<UserStoryResponse[]>(`/api/v1/projects/${projectId}/stories`),

  addStory: async (projectId: string, story: UserStoryPayload): Promise<UserStoryResponse> =>
    request<UserStoryResponse>(`/api/v1/projects/${projectId}/stories`, {
      method: 'POST',
      body: JSON.stringify(story),
    }),

  saveStories: async (projectId: string, stories: UserStoryPayload[]): Promise<UserStoryResponse[]> =>
    request<UserStoryResponse[]>(`/api/v1/projects/${projectId}/stories/bulk`, {
      method: 'POST',
      body: JSON.stringify(stories),
    }),

  deleteStory: async (projectId: string, storyId: string): Promise<void> =>
    request<void>(`/api/v1/projects/${projectId}/stories/${storyId}`, { method: 'DELETE' }),

  // ── Gherkin (S2) ──────────────────────────────────────────────────────────
  generateGherkin: async (projectId: string, storyIds: string[]): Promise<GherkinResult[]> =>
    request<GherkinResult[]>('/api/v1/gherkin/generate', {
      method: 'POST',
      body: JSON.stringify({ project_id: projectId, story_ids: storyIds }),
      timeoutMs: LLM_REQUEST_TIMEOUT_MS,
    }),

  getGherkinForStory: async (projectId: string, storyId: string): Promise<GherkinResult | null> =>
    request<GherkinResult | null>(`/api/v1/gherkin/${projectId}/${storyId}`),

  updateGherkin: async (gherkinId: string, gherkinText: string): Promise<GherkinResult> =>
    request<GherkinResult>(`/api/v1/gherkin/${gherkinId}`, {
      method: 'PUT',
      body: JSON.stringify({ gherkin_text: gherkinText }),
    }),

  approveGherkin: async (gherkinId: string): Promise<GherkinResult> =>
    request<GherkinResult>(`/api/v1/gherkin/${gherkinId}/approve`, { method: 'PUT' }),

  regenerateGherkin: async (projectId: string, storyId: string): Promise<GherkinResult> =>
    request<GherkinResult>(`/api/v1/gherkin/${projectId}/${storyId}/regenerate`, {
      method: 'POST',
      timeoutMs: LLM_REQUEST_TIMEOUT_MS,
    }),

  // ── DOM crawler (S4) ──────────────────────────────────────────────────────
  probeUrl: async (url: string): Promise<ProbeResponse> =>
    request<ProbeResponse>('/api/v1/dom/probe', {
      method: 'POST',
      body: JSON.stringify({ url }),
    }),

  crawlDom: async (
    projectId: string,
    url: string,
    options: CrawlOptions & { runId?: string } = {},
  ): Promise<DomCrawlResponse> =>
    request<DomCrawlResponse>('/api/v1/dom/crawl', {
      method: 'POST',
      body: JSON.stringify({
        project_id: projectId,
        url,
        auth_strategy: options.authStrategy ?? 'background',
        manual_auth: options.manualAuth,
        storage_state: options.storageState,
        run_id: options.runId,
      }),
      timeoutMs: CRAWL_REQUEST_TIMEOUT_MS,
    }),

  listDomElements: async (projectId: string, url?: string): Promise<DomElement[]> => {
    const params = new URLSearchParams({ project_id: projectId });
    if (url) params.set('url', url);
    return request<DomElement[]>(`/api/v1/dom/elements?${params.toString()}`);
  },

  addDomElement: async (
    payload: Omit<DomElement, 'id' | 'edited_by_qa' | 'approved' | 'updated_at'>,
  ): Promise<DomElement> =>
    request<DomElement>('/api/v1/dom/elements', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  updateDomElement: async (
    elementId: string,
    patch: Partial<Pick<DomElement, 'selector' | 'tag' | 'text' | 'attributes' | 'role' | 'approved'>>,
  ): Promise<DomElement> =>
    request<DomElement>(`/api/v1/dom/elements/${elementId}`, {
      method: 'PUT',
      body: JSON.stringify(patch),
    }),

  deleteDomElement: async (elementId: string): Promise<void> =>
    request<void>(`/api/v1/dom/elements/${elementId}`, { method: 'DELETE' }),

  bulkApproveDomElements: async (projectId: string, approved: boolean, url?: string): Promise<DomElement[]> =>
    request<DomElement[]>('/api/v1/dom/elements/bulk-approve', {
      method: 'POST',
      body: JSON.stringify({ project_id: projectId, url, approved }),
    }),

  // ── Code generation (S5) ──────────────────────────────────────────────────
  generateTestCode: async (
    projectId: string,
    url: string,
    mode: string,
    frameworks: string[],
  ): Promise<TestSuite[]> =>
    request<TestSuite[]>('/api/v1/code/generate', {
      method: 'POST',
      body: JSON.stringify({ project_id: projectId, url, mode, frameworks }),
      timeoutMs: LLM_REQUEST_TIMEOUT_MS,
    }),

  getTestSuites: async (projectId: string): Promise<TestSuite[]> =>
    request<TestSuite[]>(`/api/v1/code/suites?project_id=${encodeURIComponent(projectId)}`),

  getTestSuite: async (suiteId: string): Promise<TestSuite> =>
    request<TestSuite>(`/api/v1/code/suites/${suiteId}`),

  getTestSuiteHistory: async (suiteId: string): Promise<TestSuite[]> =>
    request<TestSuite[]>(`/api/v1/code/suites/${suiteId}/history`),

  updateTestSuiteCode: async (suiteId: string, code: string): Promise<TestSuite> =>
    request<TestSuite>(`/api/v1/code/suites/${suiteId}`, {
      method: 'PUT',
      body: JSON.stringify({ code }),
    }),

  saveTestSuiteAsNewVersion: async (suiteId: string, code: string): Promise<TestSuite> =>
    request<TestSuite>(`/api/v1/code/suites/${suiteId}/save-as-new-version`, {
      method: 'POST',
      body: JSON.stringify({ code }),
    }),

  restoreTestSuiteVersion: async (suiteId: string): Promise<TestSuite> =>
    request<TestSuite>(`/api/v1/code/suites/${suiteId}/restore`, { method: 'POST' }),

  selectTestSuiteForRun: async (suiteId: string): Promise<TestSuite> =>
    request<TestSuite>(`/api/v1/code/suites/${suiteId}/select-for-run`, { method: 'POST' }),

  // ── ML risk ───────────────────────────────────────────────────────────────
  getRiskPredictions: async (projectId: string): Promise<RiskResponse> =>
    request<RiskResponse>(`/api/v1/projects/${projectId}/risk`),

  // ── GitHub connection ─────────────────────────────────────────────────────
  validateGitHubToken: async (token: string): Promise<GitHubValidateResponse> =>
    request<GitHubValidateResponse>('/api/v1/github/validate', {
      method: 'POST',
      body: JSON.stringify({ token }),
      timeoutMs: 60_000,
    }),

  getGitHubConnection: async (projectId: string): Promise<GitHubConnection | null> =>
    request<GitHubConnection | null>(`/api/v1/projects/${encodeURIComponent(projectId)}/github/connection`),

  connectGitHub: async (
    projectId: string,
    body: {
      token: string;
      owner: string;
      repo: string;
      default_branch?: string;
      force_workflow_overwrite?: boolean;
    },
  ): Promise<GitHubConnectResponse> =>
    request<GitHubConnectResponse>(`/api/v1/projects/${encodeURIComponent(projectId)}/github/connect`, {
      method: 'POST',
      body: JSON.stringify(body),
      timeoutMs: 60_000,
    }),

  reinstallGitHubWorkflow: async (projectId: string): Promise<GitHubConnectResponse> =>
    request<GitHubConnectResponse>(
      `/api/v1/projects/${encodeURIComponent(projectId)}/github/reinstall-workflow`,
      { method: 'POST', timeoutMs: 60_000 },
    ),

  pingGitHubConnection: async (projectId: string): Promise<GitHubPingResponse> =>
    request<GitHubPingResponse>(`/api/v1/projects/${encodeURIComponent(projectId)}/github/test-ping`, {
      method: 'POST',
      timeoutMs: 60_000,
    }),

  disconnectGitHub: async (projectId: string): Promise<void> =>
    request<void>(`/api/v1/projects/${encodeURIComponent(projectId)}/github/connection`, {
      method: 'DELETE',
    }),

  // ── Execution & reports (S6) ──────────────────────────────────────────────
  executeSuite: async (params: {
    suiteId: string;
    projectId: string;
    mode?: 'github' | 'local';
  }): Promise<ExecuteResponse> =>
    request<ExecuteResponse>('/api/v1/execute', {
      method: 'POST',
      body: JSON.stringify({
        suite_id: params.suiteId,
        project_id: params.projectId,
        mode: params.mode,
      }),
      timeoutMs: 60_000,
    }),

  rerunRun: async (prevRunId: string): Promise<ExecuteResponse> =>
    request<ExecuteResponse>(`/api/v1/runs/${encodeURIComponent(prevRunId)}/rerun`, {
      method: 'POST',
      timeoutMs: 60_000,
    }),

  listRuns: async (projectId: string, limit = 20): Promise<RunSummary[]> =>
    request<RunSummary[]>(`/api/v1/runs?project_id=${encodeURIComponent(projectId)}&limit=${limit}`),

  getRun: async (runId: string): Promise<RunDetail> => request<RunDetail>(`/api/v1/runs/${runId}`),

  // ── Agent explorer ────────────────────────────────────────────────────────
  startExploration: async (params: {
    intent: string;
    url: string;
    projectId?: string;
    maxSteps?: number;
    headless?: boolean;
  }): Promise<StartExplorationResponse> =>
    request<StartExplorationResponse>('/api/v1/agent/explore', {
      method: 'POST',
      body: JSON.stringify({
        intent: params.intent,
        url: params.url,
        project_id: params.projectId,
        max_steps: params.maxSteps ?? 12,
        headless: params.headless ?? true,
      }),
      timeoutMs: 60_000,
    }),
};

// ── WebSocket streams (bypass the dev proxy, connect straight to the backend) ─

export function openCrawlLogStream(runId: string, onLog: (line: string) => void, onEnd?: () => void): WebSocket {
  const ws = new WebSocket(`${TEST_CASE_WS_URL}/ws/dom/crawl/${encodeURIComponent(runId)}`);
  ws.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      if (data.type === 'log' && typeof data.line === 'string') onLog(data.line);
      else if (data.type === 'end') {
        onEnd?.();
        ws.close();
      }
    } catch {
      // ignore malformed frames
    }
  };
  return ws;
}

export function openExecutionStream(runId: string, onEvent: (event: ExecutionEvent) => void): WebSocket {
  const ws = new WebSocket(`${TEST_CASE_WS_URL}/ws/execution/${encodeURIComponent(runId)}`);
  ws.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data) as ExecutionEvent;
      onEvent(data);
      if (data.type === 'end') ws.close();
    } catch {
      // ignore malformed frames
    }
  };
  return ws;
}

export function openAgentEventStream(runId: string, onEvent: (event: AgentEvent) => void): WebSocket {
  const ws = new WebSocket(`${TEST_CASE_WS_URL}/ws/agent/${encodeURIComponent(runId)}`);
  ws.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data) as AgentEvent;
      onEvent(data);
      if (data.type === 'end') ws.close();
    } catch {
      // ignore malformed frames
    }
  };
  return ws;
}

// ── Artifact URL helpers ──────────────────────────────────────────────────────

export const runLogUrl = (runId: string): string => `${TEST_CASE_API_URL}/api/v1/runs/${runId}/log`;

export const runPdfUrl = (runId: string): string => `${TEST_CASE_API_URL}/api/v1/runs/${runId}/report.pdf`;

export const runScreenshotUrl = (runId: string, filename: string): string =>
  `${TEST_CASE_API_URL}/api/v1/runs/${runId}/screenshots/${encodeURIComponent(filename)}`;

export const runLatestFrameUrl = (runId: string): string =>
  `${TEST_CASE_API_URL}/api/v1/runs/${runId}/screenshots/latest`;
