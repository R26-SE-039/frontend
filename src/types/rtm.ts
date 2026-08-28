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
  component2_project_id: string | null;
  component1_iteration_id: string | null;
}

// ── Dashboard ──────────────────────────────────────────────────────────

export interface TrendPoint {
  date: string;
  avg_quality: number;
  avg_coverage: number;
}

export interface QualityBucket {
  label: string;
  tests: number;
}

export interface ActivityOut {
  activity_type: string;
  title: string;
  detail: string;
  created_at: string;
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
  quality_distribution: QualityBucket[];
  recent_activities: ActivityOut[];
}

// ── ML model info (research / viva-facing panel) ───────────────────────

export interface FeatureImportanceOut {
  feature: string;
  label: string;
  importance: number;
  formula_weight: number;
  coefficient: number | null;
}

export interface ModelComparisonEntry {
  model: string;
  cv_mae_mean: number;
  cv_mae_std: number;
}

export interface ClassificationMetricsOut {
  task: string;
  accuracy: number;
  precision: number;
  recall: number;
  f1: number;
  confusion_matrix: number[][];
  confusion_matrix_labels: string[];
}

export interface ModelInfoOut {
  trained: boolean;
  algorithm: string;
  hyperparameters: Record<string, unknown>;
  model_comparison: ModelComparisonEntry[];
  dataset_path: string;
  training_samples: number;
  test_samples: number;
  mae: number;
  rmse: number;
  r2: number;
  cv_mae_mean: number;
  cv_mae_std: number;
  feature_importances: FeatureImportanceOut[];
  quality_reject_threshold: number;
  classification_metrics: ClassificationMetricsOut | null;
  trained_at: string | null;
  notes: string;
}

// ── Dataset info (EDA panel) ────────────────────────────────────────────

export interface FeatureStatOut {
  feature: string;
  label: string;
  mean: number;
  std: number;
  min: number;
  max: number;
  correlation_with_target: number;
}

export interface CategoryCountOut {
  label: string;
  count: number;
}

export interface ExcludedFeatureOut {
  feature: string;
  correlation_with_target: number;
  note: string;
}

export interface DatasetInfoOut {
  available: boolean;
  source: string;
  n_rows: number;
  n_features_used: number;
  missing_values: number;
  target_mean: number;
  target_std: number;
  target_min: number;
  target_max: number;
  reject_rate: number;
  feature_stats: FeatureStatOut[];
  excluded_feature_correlation: ExcludedFeatureOut | null;
  quality_label_distribution: CategoryCountOut[];
  test_type_distribution: CategoryCountOut[];
  module_criticality_distribution: CategoryCountOut[];
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

// ── Component 2 test-case quality (Random Forest research pipeline) ────

export interface C2QualityFeaturesOut {
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

export interface C2QualityPredictionOut {
  test_case_id: string;
  title: string;
  story_id: string;
  status: string;
  description: string;
  features: C2QualityFeaturesOut;
  quality_score: number;
  formula_label: string;
  predicted_label: string;
  probabilities: Record<string, number>;
  method: string;
}

export interface C2QualityFeatureImportanceOut {
  feature: string;
  label: string;
  importance: number;
}

export interface C2QualityPerClassMetricOut {
  label: string;
  precision: number;
  recall: number;
  f1: number;
  support: number;
}

export interface C2QualityModelInfoOut {
  trained: boolean;
  algorithm: string;
  hyperparameters: Record<string, unknown>;
  dataset_path: string;
  label_order: string[];
  training_samples: number;
  test_samples: number;
  cv_accuracy_mean: number;
  cv_accuracy_std: number;
  accuracy: number;
  precision_macro: number;
  recall_macro: number;
  f1_macro: number;
  per_class_metrics: C2QualityPerClassMetricOut[];
  confusion_matrix: number[][];
  confusion_matrix_labels: string[];
  feature_importances: C2QualityFeatureImportanceOut[];
  trained_at: string | null;
  notes: string;
}

export interface C2QualityDatasetInfoOut {
  available: boolean;
  n_rows: number;
  label_distribution: CategoryCountOut[];
  feature_stats: FeatureStatOut[];
}

// ── Component 2 (Intelligent-Test-Case-Generation) integration ─────────

export interface C2StatusOut {
  connected: boolean;
  base_url: string;
}

export interface C2ProjectOut {
  id: string;
  name: string;
  description: string | null;
  created_at: string | null;
}

export interface C2TestSuiteOut {
  id: string;
  project_id: string;
  framework: string;
  language: string;
  filename: string;
  code: string;
  mode: string;
  url: string;
  version: number;
  is_active: boolean;
  is_stale: boolean;
  selected_for_run: boolean;
  updated_at: string | null;
}

export interface C2RunOut {
  id: string;
  project_id: string;
  suite_id: string | null;
  framework: string;
  mode: string;
  status: string;
  github_run_url: string | null;
  started_at: string | null;
  finished_at: string | null;
  duration_ms: number | null;
  total_count: number;
  passed_count: number;
  failed_count: number;
  log_url: string;
  error_message: string | null;
}

export interface C2RiskPredictionOut {
  flow: string;
  label: string;
  risk: string;
  confidence: number;
  probabilities: Record<string, number>;
}

export interface C2RiskResponseOut {
  project_id: string;
  source: string;
  predictions: C2RiskPredictionOut[];
}

export interface C2FailedTestOut {
  test_name: string;
  pipeline: string;
  error_message: string;
  failure_type: string;
  framework: string | null;
  executed_at: string | null;
}

export interface C2FailedTestsResponseOut {
  project_id: string;
  total: number;
  failures: C2FailedTestOut[];
}

export interface C1RequirementWithStoryOut {
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
}

/** One test case sourced from Component 2's traceability endpoint, carrying
 * its owning user story's id so it can be joined to Component 1's
 * requirements-with-stories by user_story_id. */
export interface C2GherkinTestCaseOut {
  story_id: string;
  id: string;
  title: string;
  description: string;
  status: string;
}

/** One flattened scenario result assembled from recent C2 execution runs. */
export interface C2TestCaseOut {
  id: string;
  title: string;
  status: string;
  framework: string;
  duration_ms: number | null;
  error_message: string | null;
  executed_at: string | null;
  fail_rate: number;
}

// ── Intelligent Test Improvement & Recommendations ─────────────────────

export interface QualityGapOut {
  area: string;
  label: string;
  status: string;
  severity: string;
  recommendation: string;
}

export interface C2ImproveRequest {
  title: string;
  description: string;
  features: C2QualityFeaturesOut;
  quality_score: number;
  predicted_label: string;
  probabilities: Record<string, number>;
  requirement_text: string;
  user_story_title: string;
  acceptance_criteria: string[];
}

export interface C2ImproveResponse {
  gaps: QualityGapOut[];
  improved_description: string;
  improved_features: C2QualityFeaturesOut;
  improved_quality_score: number;
  improved_formula_label: string;
  improved_predicted_label: string;
  improved_probabilities: Record<string, number>;
  improved_method: string;
}

// ── Risk-Based Coverage Gap Prioritization & Resolution ─────────────────

export interface GapRiskFactorsOut {
  coverage_gap: number;
  business_priority: number;
  test_failure_rate: number;
  code_coverage_gap: number;
}

export interface AcceptanceCriterionCoverageOut {
  acceptance_criterion: string;
  covered: boolean;
  test_case_id: string | null;
  test_case_title: string | null;
  test_result: string | null;
}

export interface C2CoverageGapOut {
  requirement_id: string;
  requirement_text: string;
  requirement_type: string;
  requirement_status: string;
  user_story_id: string;
  user_story_title: string;
  user_story_text: string;
  priority: string;

  coverage_status: 'Fully Covered' | 'Partially Covered' | 'Not Covered';
  ac_coverage_pct: number;
  total_acceptance_criteria: number;
  covered_acceptance_criteria: number;
  uncovered_acceptance_criteria: string[];
  ac_details: AcceptanceCriterionCoverageOut[];

  linked_test_case_count: number;
  linked_test_case_ids: string[];
  passed_tests: number;
  failed_tests: number;

  code_coverage_pct: number | null;

  risk_score: number;
  risk_level: string;
  risk_factors: GapRiskFactorsOut;
  recommended_action: string;
}

export interface GenerateGapTestCaseRequest {
  requirement_id: string;
  requirement_text: string;
  user_story_id: string;
  user_story_title: string;
  user_story_text: string;
  acceptance_criterion: string;
}

export interface GeneratedGapTestCaseOut {
  id: number;
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

export interface GeneratedGapTestCasePredictionOut {
  test_case: GeneratedGapTestCaseOut;
  prediction: C2QualityPredictionOut;
}

export interface AddGapTestCaseRequest {
  target: 'inventory' | 'rtm';
}

export interface GenerateAllGapTestCasesRequest {
  items: GenerateGapTestCaseRequest[];
}

export interface GenerateAllGapTestCasesResponse {
  generated: GeneratedGapTestCasePredictionOut[];
}
