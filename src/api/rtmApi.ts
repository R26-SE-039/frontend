import { RTM_API_URL } from "./config";
import { useMeetingStore } from "../store/useMeetingStore";
import type {
  CoverageGap,
  CoverageReport,
  CoverageStatus,
  DashboardSummary,
  GeneratedGapTestCasePrediction,
  GenerateGapTestCasePayload,
  GithubConnectionStatus,
  ImproveResponse,
  InventoryItem,
  Matrix,
  MatrixRow,
  PortfolioAnalysis,
  C2QualityPrediction,
} from "../types/rtm";

const REQUEST_TIMEOUT_MS = 30_000;
// The matrix (and everything built on it) fans out to Component 1 + 2 and
// scores test cases with the quality model — give it more headroom.
const AGGREGATE_TIMEOUT_MS = 90_000;

async function request<T>(
  path: string,
  options?: RequestInit & { timeoutMs?: number },
): Promise<T> {
  const timeoutMs = options?.timeoutMs ?? REQUEST_TIMEOUT_MS;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  const token = useMeetingStore.getState().user?.accessToken;
  const headers = new Headers(options?.headers);
  if (!headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  if (token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  let response: Response;
  try {
    response = await fetch(`${RTM_API_URL}${path}`, {
      ...options,
      headers,
      signal: controller.signal,
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new Error(
        `RTM service timed out after ${timeoutMs / 1000}s. Is the backend running on port 8003?`,
      );
    }
    throw new Error("RTM service unreachable. Is the backend running on port 8003?");
  } finally {
    clearTimeout(timer);
  }

  if (!response.ok) {
    const body = await response.json().catch(() => null);
    const detail = body && typeof body.detail === "string" ? body.detail : null;
    throw new Error(detail || `RTM service error (${response.status})`);
  }

  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

const scope = (projectId: string, iterationId: string) =>
  `project_id=${encodeURIComponent(projectId)}&iteration_id=${encodeURIComponent(iterationId)}`;

export const rtmApi = {
  // ── RTM Matrix ────────────────────────────────────────────────────────────
  getMatrix: (projectId: string, iterationId: string): Promise<Matrix> =>
    request<Matrix>(`/api/rtm/matrix?${scope(projectId, iterationId)}`, {
      timeoutMs: AGGREGATE_TIMEOUT_MS,
    }),

  getMatrixRequirement: (
    requirementId: string,
    projectId: string,
    iterationId: string,
  ): Promise<MatrixRow> =>
    request<MatrixRow>(
      `/api/rtm/matrix/requirements/${encodeURIComponent(requirementId)}?${scope(projectId, iterationId)}`,
      { timeoutMs: AGGREGATE_TIMEOUT_MS },
    ),

  // ── Dashboard ─────────────────────────────────────────────────────────────
  getDashboardSummary: (projectId: string, iterationId: string): Promise<DashboardSummary> =>
    request<DashboardSummary>(`/api/dashboard/summary?${scope(projectId, iterationId)}`, {
      timeoutMs: AGGREGATE_TIMEOUT_MS,
    }),

  // ── Test Inventory ────────────────────────────────────────────────────────
  getInventory: (projectId: string, iterationId: string): Promise<InventoryItem[]> =>
    request<InventoryItem[]>(`/api/inventory?${scope(projectId, iterationId)}`, {
      timeoutMs: AGGREGATE_TIMEOUT_MS,
    }),

  // ── Portfolio ─────────────────────────────────────────────────────────────
  getPortfolio: (projectId: string, iterationId: string): Promise<PortfolioAnalysis> =>
    request<PortfolioAnalysis>(`/api/portfolio/analysis?${scope(projectId, iterationId)}`, {
      timeoutMs: AGGREGATE_TIMEOUT_MS,
    }),

  // ── Coverage gaps ─────────────────────────────────────────────────────────
  getCoverageGaps: (projectId: string, iterationId: string): Promise<CoverageGap[]> =>
    request<CoverageGap[]>(`/api/rtm/c2-gaps?${scope(projectId, iterationId)}`, {
      timeoutMs: AGGREGATE_TIMEOUT_MS,
    }),

  generateGapTestCase: (
    payload: GenerateGapTestCasePayload,
  ): Promise<GeneratedGapTestCasePrediction> =>
    request<GeneratedGapTestCasePrediction>(`/api/rtm/c2-gaps/generate-test-case`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  generateAllGapTestCases: (
    items: GenerateGapTestCasePayload[],
  ): Promise<{ generated: GeneratedGapTestCasePrediction[] }> =>
    request<{ generated: GeneratedGapTestCasePrediction[] }>(`/api/rtm/c2-gaps/generate-all`, {
      method: "POST",
      body: JSON.stringify({ items }),
      timeoutMs: AGGREGATE_TIMEOUT_MS,
    }),

  addGapTestCase: (
    gapTestCaseId: number,
    target: "inventory" | "rtm",
  ): Promise<GeneratedGapTestCasePrediction> =>
    request<GeneratedGapTestCasePrediction>(`/api/rtm/c2-gaps/${gapTestCaseId}/add`, {
      method: "POST",
      body: JSON.stringify({ target }),
    }),

  getGeneratedGapTestCases: (projectId: string): Promise<GeneratedGapTestCasePrediction[]> =>
    request<GeneratedGapTestCasePrediction[]>(
      `/api/rtm/c2-gaps/generated?project_id=${encodeURIComponent(projectId)}`,
    ),

  // ── Quality prediction ────────────────────────────────────────────────────
  getQualityPredictions: (
    projectId: string,
    iterationId?: string,
  ): Promise<C2QualityPrediction[]> =>
    request<C2QualityPrediction[]>(
      `/api/ml/c2-quality/predictions/${encodeURIComponent(projectId)}` +
        (iterationId ? `?iteration_id=${encodeURIComponent(iterationId)}` : ""),
      { timeoutMs: AGGREGATE_TIMEOUT_MS },
    ),

  improveTestCase: (payload: {
    title: string;
    description: string;
    features: C2QualityPrediction["features"];
    quality_score: number;
    predicted_label: string;
    probabilities: Record<string, number>;
    requirement_text: string;
    user_story_title: string;
    acceptance_criteria: string[];
  }): Promise<ImproveResponse> =>
    request<ImproveResponse>(`/api/ml/c2-quality/improve`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  // ── GitHub code coverage ──────────────────────────────────────────────────
  analyzeCoverage: (projectId: string, repoUrl = ""): Promise<CoverageStatus> =>
    request<CoverageStatus>(`/api/coverage/analyze?project_id=${encodeURIComponent(projectId)}`, {
      method: "POST",
      body: JSON.stringify({ repo_url: repoUrl }),
    }),

  getCoverageStatus: (projectId: string): Promise<CoverageStatus> =>
    request<CoverageStatus>(`/api/coverage/status?project_id=${encodeURIComponent(projectId)}`),

  getCoverageReport: (projectId: string): Promise<CoverageReport> =>
    request<CoverageReport>(`/api/coverage/report?project_id=${encodeURIComponent(projectId)}`),

  getGithubStatus: (projectId: string): Promise<GithubConnectionStatus> =>
    request<GithubConnectionStatus>(`/api/github/status?project_id=${encodeURIComponent(projectId)}`),
};
