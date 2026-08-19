// ── Enums (mirrors backend/app/models.py) ─────────────────────────────────

export type TestStatus = 'pending' | 'approved' | 'rejected';
export type CoverageStatus = 'FULLY COVERED' | 'PARTIAL' | 'NOT COVERED';
export type RiskLevel = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
export type ActionType = 'redundant' | 'critical' | 'weak';
export type CoverageJobStatus = 'IDLE' | 'RUNNING' | 'DONE' | 'ERROR';

// ── Requirements ───────────────────────────────────────────────────────

export interface RequirementOut {
  id: number;
  title: string;
  description: string;
  source: string;
  req_type: string;
  wbs_deliverables: string;
  created_at: string;
}

export interface AcceptanceCriteriaOut {
  id: number;
  requirement_id: number;
  description: string;
  created_at: string;
}

// ── Test cases ─────────────────────────────────────────────────────────

export interface TestCaseOut {
  id: number;
  title: string;
  steps: string;
  acceptance_criteria_id: number;
  assertion_strength: number;
  coverage_percent: number;
  boundary_coverage: number;
  error_handling: number;
  mutation_resistance: number;
  quality_score: number | null;
  status: TestStatus;
  created_at: string;
}

export interface QualityPredictionOut {
  test_case_id: number;
  quality_score: number;
  status: TestStatus;
  method: string;
}

// ── Code coverage ──────────────────────────────────────────────────────

export interface CodeCoverageOut {
  id: number;
  test_case_id: number;
  module_name: string;
  coverage_percent: number;
  created_at: string;
}

// ── RTM ────────────────────────────────────────────────────────────────

export interface RTMTestEntry {
  test_case_id: number;
  title: string;
  status: TestStatus;
  quality_score: number | null;
  coverage_percent: number;
}

export interface RTMAcceptanceCriteriaEntry {
  acceptance_criteria_id: number;
  description: string;
  tests: RTMTestEntry[];
  covered: boolean;
}

export interface RTMRequirementEntry {
  requirement_id: number;
  title: string;
  description: string;
  source: string;
  req_type: string;
  wbs_deliverables: string;
  acceptance_criteria: RTMAcceptanceCriteriaEntry[];
  total_acceptance_criteria: number;
  covered_acceptance_criteria: number;
  total_tests: number;
  avg_coverage_percent: number;
  status: CoverageStatus;
}

// ── Coverage gaps ──────────────────────────────────────────────────────

export interface CoverageGapOut {
  requirement_id: number;
  requirement_title: string;
  status: CoverageStatus;
  risk_level: RiskLevel;
  recommendation: string;
}

// ── Portfolio ──────────────────────────────────────────────────────────

export interface PortfolioActionOut {
  test_case_id: number;
  test_title: string;
  action_type: ActionType;
  reason: string;
}

export interface PortfolioAnalysisOut {
  redundant: PortfolioActionOut[];
  critical: PortfolioActionOut[];
  weak: PortfolioActionOut[];
}

// ── Project settings ───────────────────────────────────────────────────

export interface ProjectSettingsOut {
  project_name: string;
  project_manager: string;
  project_description: string;
}

// ── Dashboard ──────────────────────────────────────────────────────────

export interface TrendPoint {
  date: string;
  avg_quality: number;
  avg_coverage: number;
}

export interface DashboardSummaryOut {
  tests_analyzed: number;
  avg_quality_score: number;
  coverage_rate: number;
  success_rate: number;
  quality_trend_pct: number;
  trend: TrendPoint[];
  requirements_covered: number;
  requirements_total: number;
}

// ── GitHub code & branch coverage ─────────────────────────────────────

export interface CoverageFileEntry {
  file_name: string;
  statements: number;
  statement_coverage: number;
  branches: number;
  branch_coverage: number;
  overall_coverage: number;
}

export interface CoverageLogEntry {
  timestamp: string;
  level: string;
  message: string;
}

export interface CoverageStatusOut {
  status: CoverageJobStatus;
  repo_url: string;
  error_message: string | null;
  github_connected: boolean;
  logs: CoverageLogEntry[];
}

export interface CoverageReportOut {
  status: CoverageJobStatus;
  repo_url: string;
  error_message: string | null;
  statement_coverage: number;
  branch_coverage: number;
  overall_coverage: number;
  files: CoverageFileEntry[];
  logs: CoverageLogEntry[];
  updated_at: string | null;
}

export interface GithubConnectionStatusOut {
  connected: boolean;
  reason: string | null;
  username: string | null;
}
