export type Failure = {
  id: number;
  organization_id?: string | null;
  project_id?: string | null;
  iteration_id?: string | null;
  user_story_id?: string | null;
  suite_id?: string | null;
  execution_id?: string | null;
  test_run_id?: string | null;
  test_id: string;
  test_name: string;
  pipeline: string;
  status: string;
  root_cause: string;
  confidence?: string | null;
  healing?: string | null;
  logs?: string | null;
  stack_trace?: string | null;
  recommendation?: string | null;
  developer_alert: boolean;
  created_at?: string | null;
};

export type HealingAction = {
  id: number;
  failure_id?: number | null;
  healing_id: string;
  failure_test_id: string;
  test_name: string;
  repair_type: string;
  old_value: string;
  new_value: string;
  status: string;
};

export type FlakyTest = {
  id: number;
  organization_id?: string | null;
  project_id?: string | null;
  suite_id?: string | null;
  latest_test_run_id?: string | null;
  test_code: string;
  test_name: string;
  instability_score: string;
  recent_pattern: string;
  risk_level: string;
};

export type Notification = {
  id: number;
  failure_id?: number | null;
  failure_test_id: string;
  test_name: string;
  root_cause: string;
  message: string;
  target: string;
};

export type DashboardSummary = {
  total_failures: number;
  total_healing_actions: number;
  total_flaky_tests: number;
  total_notifications: number;
  recent_failures: Array<{
    id: number;
    test_id: string;
    test_name: string;
    pipeline: string;
    status: string;
    root_cause: string;
    healing?: string | null;
  }>;
};


export type GitHubWorkflowRun = {
  run_id: number;
  run_number?: number | null;
  run_attempt?: number | null;
  name?: string | null;
  display_title?: string | null;
  status?: string | null;
  conclusion?: string | null;
  head_branch?: string | null;
  head_sha?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  html_url?: string | null;
  repository_full_name?: string | null;
  check_suite_id?: number | null;
};

export type GitHubJobStep = {
  number?: number | null;
  name?: string | null;
  status?: string | null;
  conclusion?: string | null;
};

export type GitHubWorkflowJob = {
  job_id: number;
  name?: string | null;
  status?: string | null;
  conclusion?: string | null;
  started_at?: string | null;
  completed_at?: string | null;
  html_url?: string | null;
  steps?: GitHubJobStep[];
};

export type GitHubFailedRunsResponse = {
  repository: string;
  runs: GitHubWorkflowRun[];
};

export type GitHubRunDetailsResponse = {
  repository: string;
  run: GitHubWorkflowRun;
  failed_jobs: GitHubWorkflowJob[];
  jobs?: GitHubWorkflowJob[];
};

export type GitHubAnalyzeFailureResponse = {
  source: "github_actions";
  github: {
    repository?: string | null;
    run_id?: number | null;
    job_id?: number | null;
    run_url?: string | null;
    head_sha?: string | null;
    head_branch?: string | null;
  } | null;
  evidence: {
    candidate_file?: string | null;
    candidate_line?: number | null;
    error_type?: string | null;
    error_message?: string | null;
    evidence_hash?: string | null;
  } | null;
  analysis: unknown;
  failure?: {
    test_id?: string | null;
    status?: string | null;
  } | null;
  classification?: {
    root_cause?: string | null;
    confidence?: number | null;
    decision_source?: string | null;
    all_probabilities?: Record<string, number> | null;
  } | null;
  healing?: {
    selected_action?: string | null;
    recommendation?: string | null;
    automatic_execution_allowed?: boolean | null;
  } | null;
  repair?: {
    attempt_id?: string | null;
    eligible?: boolean | null;
    reason?: string | null;
    github_changes_made?: boolean | null;
  } | null;
};
export type RepairHistoryItem = {
  attempt_id: string;
  root_cause: string;
  confidence: number;
  repository: string | null;
  failed_branch: string | null;
  failed_sha: string | null;
  github_run_url: string | null;
  candidate_file: string;
  candidate_line: number | null;
  healing_action: string;
  plan_status: string;
  publish_status: string | null;
  action_status: string | null;
  target_module: string | null;
  automation_level: string;
  recommended_action: string;
  validation_guidance: string[];
  history_status: string;
  repair_branch: string | null;
  commit_sha: string | null;
  draft_pr_url: string | null;
  github_changes_made: boolean;
  created_at: string;
  updated_at: string;
};

export type PaginatedResponse<T> = {
  data: T[];
  total: number;
  page?: number;
  limit?: number;
};

export type ListResponse<T> = T[] | PaginatedResponse<T>;

export type RepairHistoryFilters = {
  rootCause?: string;
  publishStatus?: string;
  repository?: string;
};
