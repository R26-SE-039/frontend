// Types for the RTM & Quality Prediction module — mirrors the RTM backend's
// pydantic response models (RTM-and-Quality-Prediction-backend/app/schemas.py).
// Everything is scoped to the open project + its active iteration.

// ── RTM Matrix ──────────────────────────────────────────────────────────────

export interface MatrixTest {
  id: string;
  title: string;
  description: string;
  status: string; // approved | rejected | pending
  source: string; // "C2" | "generated"
}

export interface MatrixRow {
  requirement_id: string;
  requirement_text: string;
  requirement_type: string;
  requirement_status: string;
  meeting_title: string | null;
  user_story_id: string;
  user_story_title: string;
  user_story_text: string;
  priority: string;
  user_story_status: string | null;
  acceptance_criteria: string[];
  total_acceptance_criteria: number;
  covered_acceptance_criteria: number;
  missing_acceptance_criteria: string[];
  coverage_pct: number;
  tests: MatrixTest[];
  total_tests: number;
  passed_tests: number;
  failed_tests: number;
  pending_tests: number;
  coverage_status: string; // FULLY COVERED | PARTIAL | NOT COVERED
}

export interface MatrixSummary {
  total_requirements: number;
  fully_covered: number;
  partially_covered: number;
  not_covered: number;
  total_tests: number;
  passed_tests: number;
  failed_tests: number;
  pending_tests: number;
  pass_rate: number;
  defects: number;
  avg_coverage_pct: number;
}

export interface Matrix {
  project_id: string;
  iteration_id: string;
  summary: MatrixSummary;
  rows: MatrixRow[];
}

// ── Dashboard ───────────────────────────────────────────────────────────────

export interface RecentRun {
  id: string;
  status: string;
  framework: string;
  mode: string;
  started_at: string | null;
  finished_at: string | null;
  total_count: number;
  passed_count: number;
  failed_count: number;
}

export interface QualityBucket {
  label: string;
  tests: number;
}

export interface CodeCoverageSnapshot {
  status: string;
  repo_url: string;
  statement_coverage: number;
  branch_coverage: number;
  overall_coverage: number;
  updated_at: string | null;
}

export interface DashboardSummary {
  matrix: MatrixSummary;
  avg_quality_score: number;
  quality_distribution: QualityBucket[];
  code_coverage: CodeCoverageSnapshot | null;
  recent_runs: RecentRun[];
}

// ── Test Inventory ──────────────────────────────────────────────────────────

export interface InventoryItem {
  id: string;
  title: string;
  description: string;
  status: string;
  source: string;
  story_id: string;
  user_story_title: string;
  requirement_id: string;
  requirement_text: string;
  priority: string;
  quality_score: number | null;
  predicted_label: string | null;
}

// ── Portfolio ───────────────────────────────────────────────────────────────

export interface PortfolioItem {
  test_id: string;
  test_title: string;
  user_story_title: string;
  reason: string;
}

export interface PortfolioAnalysis {
  redundant: PortfolioItem[];
  critical: PortfolioItem[];
  weak: PortfolioItem[];
}

// ── GitHub code coverage ────────────────────────────────────────────────────

export interface CoverageLogEntry {
  timestamp: string;
  level: string;
  message: string;
}

export interface CoverageFileEntry {
  file_name: string;
  statements: number;
  statement_coverage: number;
  branches: number;
  branch_coverage: number;
  overall_coverage: number;
}

export interface CoverageStatus {
  status: string; // IDLE | RUNNING | DONE | ERROR
  repo_url: string;
  error_message: string | null;
  github_connected: boolean;
  logs: CoverageLogEntry[];
}

export interface CoverageReport {
  status: string;
  repo_url: string;
  error_message: string | null;
  statement_coverage: number;
  branch_coverage: number;
  overall_coverage: number;
  files: CoverageFileEntry[];
  logs: CoverageLogEntry[];
  updated_at: string | null;
}

export interface GithubConnectionStatus {
  connected: boolean;
  source: string | null; // "project" | "env"
  reason: string | null;
  username: string | null;
  repo_full: string | null;
  default_branch: string | null;
}

// ── Quality prediction (Component 2 research pipeline) ──────────────────────

export interface C2QualityFeatures {
  test_case: string;
  description_length: number;
  has_expected_result: number;
  has_preconditions: number;
  has_test_steps: number;
  requirement_linked: number;
  requirement_coverage: number;
  ambiguity_score: number;
  completeness_score: number;
  specificity_score: number;
  test_result: number;
}

export interface C2QualityPrediction {
  test_case_id: string;
  title: string;
  story_id: string;
  status: string;
  description: string;
  features: C2QualityFeatures;
  quality_score: number;
  formula_label: string;
  predicted_label: string;
  probabilities: Record<string, number>;
  method: string;
}

export interface QualityGap {
  area: string;
  label: string;
  status: string;
  severity: string;
  recommendation: string;
}

export interface ImproveResponse {
  gaps: QualityGap[];
  improved_description: string;
  improved_features: C2QualityFeatures;
  improved_quality_score: number;
  improved_formula_label: string;
  improved_predicted_label: string;
  improved_probabilities: Record<string, number>;
  improved_method: string;
}

// ── Coverage gaps ───────────────────────────────────────────────────────────

export interface GapRiskFactors {
  business_priority: number;
  coverage_gap: number;
  acceptance_criteria_gap: number;
  test_failure_rate: number;
  code_coverage_gap: number;
}

export interface CoverageGap {
  requirement_id: string;
  requirement_text: string;
  requirement_type: string;
  user_story_id: string;
  user_story_title: string;
  user_story_text: string;
  priority: string;
  total_acceptance_criteria: number;
  covered_acceptance_criteria: number;
  missing_acceptance_criteria: string[];
  linked_test_case_count: number;
  current_coverage_pct: number;
  risk_score: number;
  risk_level: string;
  risk_factors: GapRiskFactors;
  recommended_action: string;
}

export interface GeneratedGapTestCase {
  id: number;
  project_id: string;
  requirement_id: string;
  requirement_text: string;
  user_story_id: string;
  user_story_title: string;
  acceptance_criterion: string;
  title: string;
  description: string;
  added_to_inventory: boolean;
  added_to_rtm: boolean;
}

export interface GeneratedGapTestCasePrediction {
  test_case: GeneratedGapTestCase;
  prediction: C2QualityPrediction;
}

export interface GenerateGapTestCasePayload {
  project_id: string;
  requirement_id: string;
  requirement_text: string;
  user_story_id: string;
  user_story_title: string;
  user_story_text: string;
  acceptance_criterion: string;
}
