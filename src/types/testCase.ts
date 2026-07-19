export interface TestCaseProject {
  id: string;
  name: string;
  description?: string;
  created_at?: string;
}

export interface UserStoryPayload {
  id: string;
  actor: string;
  action: string;
  goal: string;
  priority: string;
  status: string;
  source: string;
  acceptance_criteria: string[];
}

export interface UserStoryResponse extends UserStoryPayload {
  project_id: string;
}

export interface GherkinResult {
  id: string;
  story_id: string;
  project_id: string;
  feature_name: string;
  gherkin_text: string;
  generator: string;
  edited_by_qa: boolean;
  approved: boolean;
}

export interface TestSuite {
  id: string;
  project_id: string;
  framework: string;
  language: string;
  filename: string;
  code: string;
  mode: string;
  url: string;
  llm_model?: string | null;
  source_scenarios_hash: string;
  source_scenario_count: number;
  is_stale: boolean;
  version: number;
  is_active: boolean;
  selected_for_run: boolean;
  updated_at?: string | null;
}

export interface DomElement {
  id: string;
  project_id: string;
  url: string;
  selector: string;
  tag: string;
  text?: string | null;
  attributes: Record<string, string>;
  role: string;
  source_step?: string | null;
  confidence?: number | null;
  edited_by_qa: boolean;
  approved: boolean;
  updated_at?: string | null;
}

export interface ProbeResponse {
  ok: boolean;
  status: number;
  title?: string | null;
  error?: string | null;
}

export interface DomCrawlResponse {
  project_id: string;
  url: string;
  elements: DomElement[];
  logs: string[];
  extracted_count: number;
  auth_strategy_used: string;
  auth_steps_replayed: number;
  unmatched_background_steps: string[];
}

export type AuthStrategy = 'background' | 'none' | 'manual' | 'storage_state';

export interface ManualAuthConfig {
  login_url?: string;
  username_selector?: string;
  username_value?: string;
  password_selector?: string;
  password_value?: string;
  submit_selector?: string;
}

export interface CrawlOptions {
  authStrategy?: AuthStrategy;
  manualAuth?: ManualAuthConfig;
  storageState?: unknown;
}

export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH';

export interface RiskPrediction {
  flow: string;
  label: string;
  risk: RiskLevel;
  confidence: number;
  probabilities: Record<RiskLevel, number>;
  features: Record<string, number>;
}

export interface RiskResponse {
  project_id: string;
  source: 'model' | 'heuristic';
  model_classes: string[];
  feature_columns: string[];
  predictions: RiskPrediction[];
}

export interface GitHubRepo {
  full_name: string;
  name: string;
  owner: string;
  default_branch: string;
  private: boolean;
  html_url: string;
}

export interface GitHubValidateResponse {
  login: string;
  name?: string | null;
  avatar_url?: string | null;
  repos: GitHubRepo[];
  repo_count: number;
}

export interface GitHubConnection {
  project_id: string;
  owner: string;
  repo: string;
  repo_full: string;
  default_branch: string;
  token_preview: string;
  github_user_login?: string | null;
  github_user_avatar_url?: string | null;
  workflow_installed: boolean;
  workflow_installed_at?: string | null;
  last_validated_at?: string | null;
  updated_at?: string | null;
}

export interface GitHubConnectResponse {
  connection: GitHubConnection;
  workflow_status: 'installed' | 'already_present' | 'conflict';
  workflow_message: string;
}

export interface GitHubPingResponse {
  ok: boolean;
  login?: string | null;
  rate_limit_remaining?: number | null;
  workflow_present: boolean;
  detail?: string | null;
}

export interface ExecuteResponse {
  run_id: string;
  mode: string;
}

export interface RunSummary {
  id: string;
  project_id: string;
  suite_id?: string | null;
  framework: string;
  mode: string;
  status: string;
  github_run_id?: string | null;
  github_run_url?: string | null;
  github_branch?: string | null;
  started_at?: string | null;
  finished_at?: string | null;
  duration_ms?: number | null;
  total_count: number;
  passed_count: number;
  failed_count: number;
  pdf_url?: string | null;
  log_url: string;
  error_message?: string | null;
}

export interface RunScenario {
  scenario_name: string;
  flow_name: string;
  status: string;
  duration_ms?: number | null;
  error_message?: string | null;
}

export interface RunScreenshot {
  scenario: string;
  label: string;
  status: string;
  image_url: string;
}

export interface RunDetail extends RunSummary {
  scenarios: RunScenario[];
  screenshots: RunScreenshot[];
  raw_log_preview: string;
}

export type ExecutionEvent =
  | { type: 'step'; step: string; status: string }
  | { type: 'log'; line: string }
  | { type: 'github'; run_url: string; branch: string }
  | { type: 'pdf_ready'; url: string }
  | { type: 'done'; status: string; passed: number; failed: number; total: number; duration_ms: number }
  | { type: 'error'; message: string }
  | { type: 'end' };

export interface AgentSomElement {
  id: number;
  tag: string;
  selector: string;
  text: string;
  role: string;
  bbox: { x: number; y: number; w: number; h: number };
  attrs: Record<string, string>;
}

export type AgentRole = 'planner' | 'actor' | 'observer' | 'critic';

export type AgentEvent =
  | { type: 'status'; ts: number; message: string }
  | {
      type: 'screenshot';
      ts: number;
      step: number;
      b64: string;
      elements: AgentSomElement[];
      url: string;
      title: string;
      state_hash: string;
      novel_state: boolean;
      total_novel_states: number;
    }
  | { type: 'thought'; ts: number; role: AgentRole; text: string; step: number }
  | {
      type: 'action';
      ts: number;
      step: number;
      action_type: string;
      element_id?: number;
      value?: string;
      url?: string;
      reason?: string;
      success: boolean;
      message: string;
    }
  | { type: 'lesson'; ts: number; step: number; text: string }
  | { type: 'coverage'; ts: number; step: number; goals_done: string[]; goals_pending: string[] }
  | { type: 'scenario_discovered'; ts: number; step: number; title: string; steps: string[] }
  | {
      type: 'done';
      ts: number;
      reason: string;
      total_steps: number;
      total_novel_states: number;
      scenarios: { title: string; steps: string[] }[];
    }
  | { type: 'error'; ts: number; message: string }
  | { type: 'end' };

export interface StartExplorationResponse {
  run_id: string;
  message: string;
}
