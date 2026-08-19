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
