import axios from 'axios';
import { RTM_API_URL } from './config';
import type {
  RTMRequirementEntry,
  CoverageGapOut,
  PortfolioAnalysisOut,
  DashboardSummaryOut,
  ProjectSettingsOut,
  RequirementOut,
  AcceptanceCriteriaOut,
  TestCaseOut,
  QualityPredictionOut,
  CodeCoverageOut,
  CoverageStatusOut,
  CoverageReportOut,
  GithubConnectionStatusOut,
  ModelInfoOut,
  DatasetInfoOut,
  C2StatusOut,
  C2ProjectOut,
  C2TestSuiteOut,
  C2RunOut,
  C2RiskResponseOut,
  C2FailedTestsResponseOut,
  C2TestCaseOut,
  C2GherkinTestCaseOut,
  C1RequirementWithStoryOut,
  C2QualityModelInfoOut,
  C2QualityDatasetInfoOut,
  C2QualityPredictionOut,
} from '../types/rtm';

const api = axios.create({
  baseURL: RTM_API_URL,
  headers: { 'Content-Type': 'application/json' },
});

export const getRTM = () => api.get<RTMRequirementEntry[]>('/api/rtm').then((r) => r.data);
export const getRTMForRequirement = (id: number | string) =>
  api.get<RTMRequirementEntry>(`/api/rtm/${id}`).then((r) => r.data);
export const regenerateRTM = () =>
  api.post<RTMRequirementEntry[]>('/api/rtm/regenerate').then((r) => r.data);
export const getGaps = () => api.get<CoverageGapOut[]>('/api/rtm/gaps').then((r) => r.data);
export const getPortfolio = () =>
  api.get<PortfolioAnalysisOut>('/api/portfolio/analysis').then((r) => r.data);

export const getDashboardSummary = () =>
  api.get<DashboardSummaryOut>('/api/dashboard/summary').then((r) => r.data);

export const getProjectSettings = () =>
  api.get<ProjectSettingsOut>('/api/project-settings').then((r) => r.data);
export const updateProjectSettings = (payload: ProjectSettingsOut) =>
  api.put<ProjectSettingsOut>('/api/project-settings', payload).then((r) => r.data);

export const getRequirements = () => api.get<RequirementOut[]>('/api/requirements').then((r) => r.data);
export const createRequirement = (payload: {
  title: string;
  description?: string;
  source?: string;
  req_type?: string;
  wbs_deliverables?: string;
}) => api.post<RequirementOut>('/api/requirements', payload).then((r) => r.data);

export const createAcceptanceCriteria = (requirementId: number, payload: { description: string }) =>
  api
    .post<AcceptanceCriteriaOut>(`/api/requirements/${requirementId}/acceptance-criteria`, payload)
    .then((r) => r.data);

export const getTests = () => api.get<TestCaseOut[]>('/api/tests').then((r) => r.data);
export const createTestCase = (payload: {
  title: string;
  steps?: string;
  acceptance_criteria_id: number;
  assertion_strength?: number;
  coverage_percent?: number;
  boundary_coverage?: number;
  error_handling?: number;
  mutation_resistance?: number;
}) => api.post<TestCaseOut>('/api/tests', payload).then((r) => r.data);
export const predictQuality = (testId: number) =>
  api.post<QualityPredictionOut>(`/api/tests/${testId}/predict-quality`).then((r) => r.data);
export const getModelInfo = () => api.get<ModelInfoOut>('/api/ml/model-info').then((r) => r.data);
export const getDatasetInfo = () => api.get<DatasetInfoOut>('/api/ml/dataset-info').then((r) => r.data);
export const addCoverage = (testId: number, payload: { module_name: string; coverage_percent: number }) =>
  api.post<CodeCoverageOut>(`/api/tests/${testId}/coverage`, payload).then((r) => r.data);

export const analyzeGithubCoverage = (repoUrl: string) =>
  api.post<CoverageStatusOut>('/api/coverage/analyze', { repo_url: repoUrl }).then((r) => r.data);
export const getGithubCoverageStatus = () =>
  api.get<CoverageStatusOut>('/api/coverage/status').then((r) => r.data);
export const getGithubCoverageReport = () =>
  api.get<CoverageReportOut>('/api/coverage/report').then((r) => r.data);
export const getGithubConnectionStatus = () =>
  api.get<GithubConnectionStatusOut>('/api/github/status').then((r) => r.data);

// ── Component 2 (Intelligent-Test-Case-Generation) integration ─────────

export const getComponent2Status = () =>
  api.get<C2StatusOut>('/api/external/component2/status').then((r) => r.data);
export const getComponent2Projects = () =>
  api.get<C2ProjectOut[]>('/api/external/component2/projects').then((r) => r.data);
export const getComponent2TestSuites = (projectId: string) =>
  api.get<C2TestSuiteOut[]>(`/api/external/component2/projects/${projectId}/test-suites`).then((r) => r.data);
export const getComponent2TestRuns = (projectId: string) =>
  api.get<C2RunOut[]>(`/api/external/component2/projects/${projectId}/test-runs`).then((r) => r.data);
export const getComponent2Risk = (projectId: string) =>
  api.get<C2RiskResponseOut>(`/api/external/component2/projects/${projectId}/risk`).then((r) => r.data);
export const getComponent2FailedTests = (projectId: string) =>
  api
    .get<C2FailedTestsResponseOut>(`/api/external/component2/projects/${projectId}/failed-tests`)
    .then((r) => r.data);
export const getComponent2TestCases = (projectId: string) =>
  api.get<C2TestCaseOut[]>(`/api/external/component2/projects/${projectId}/test-cases`).then((r) => r.data);
export const getComponent2TraceabilityTestCases = (projectId: string, iterationId?: string) =>
  api
    .get<C2GherkinTestCaseOut[]>(`/api/external/component2/projects/${projectId}/traceability-test-cases`, {
      params: iterationId ? { iteration_id: iterationId } : undefined,
    })
    .then((r) => r.data);

// ── Component 1 (meeting transcripts -> requirements/user-stories) ─────

export const getComponent1RequirementsWithStories = (iterationId: string) =>
  api
    .get<C1RequirementWithStoryOut[]>(`/api/external/component1/iterations/${iterationId}/requirements-with-stories`)
    .then((r) => r.data);

// ── Component 2 test-case quality (Random Forest research pipeline) ────

export const getC2QualityModelInfo = () =>
  api.get<C2QualityModelInfoOut>('/api/ml/c2-quality/model-info').then((r) => r.data);
export const getC2QualityDatasetInfo = () =>
  api.get<C2QualityDatasetInfoOut>('/api/ml/c2-quality/dataset-info').then((r) => r.data);
export const getC2QualityPredictions = (projectId: string, iterationId?: string) =>
  api
    .get<C2QualityPredictionOut[]>(`/api/ml/c2-quality/predictions/${projectId}`, {
      params: iterationId ? { iteration_id: iterationId } : undefined,
    })
    .then((r) => r.data);
export const getC2QualityDatasetSamples = (n = 15) =>
  api.get<C2QualityPredictionOut[]>('/api/ml/c2-quality/dataset-samples', { params: { n } }).then((r) => r.data);
