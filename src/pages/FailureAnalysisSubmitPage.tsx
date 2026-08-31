import { useState, useRef, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import type React from "react";
import { Upload, PlusCircle, Layout, Code2, AlertTriangle, Activity, ShieldCheck, Award, ExternalLink, GitBranch, Wrench, FileCode2, CheckCircle2, Send, Play, RefreshCw, Clock } from "lucide-react";
import { failureAnalysisApi } from "../api/failureAnalysisApi";
import { useMeetingStore } from "../store/useMeetingStore";
import type { GitHubAnalyzeFailureResponse, GitHubWorkflowJob, GitHubWorkflowRun, GitHubRunDetailsResponse } from "../types/selfHealing";
import { actionTargetLabel, canShowControlledRepair, shouldShowActionGuidance } from "../utils/repairUiPolicy";


type PipelineResult = {
  source?: "github_actions" | "manual" | string;
  github?: {
    repository?: string | null;
    run_id?: number | null;
    job_id?: number | null;
    run_url?: string | null;
    head_sha?: string | null;
    head_branch?: string | null;
  } | null;
  evidence?: {
    error_type?: string | null;
    error_message?: string | null;
    candidate_file?: string | null;
    candidate_line?: number | null;
    sanitized_log_excerpt?: string | null;
  } | null;
  saved_to_db?: boolean;
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
  repair?: PipelineResult["pipeline"]["repair"] | null;
  test_id: string;
  status: string;
  pipeline: {
    classification: {
      root_cause: string;
      confidence: number;
      ml_prediction?: string;
      ml_confidence?: number;
      final_confidence?: number;
      all_probabilities: Record<string, number>;
      model_used: string;
      decision_source?: string;
      decision_reason?: string;
      recommended_action?: string;
      automatic_healing_allowed?: boolean;
      detected_error?: {
        error_type?: string;
        error_message?: string;
        failed_file?: string;
        failed_line?: string;
        missing_fixture?: string | null;
        missing_module?: string | null;
      };
      model_input_sha256?: string;
    };
    source_run?: {
      owner: string;
      repository: string;
      repository_full_name: string;
      run_id: number;
      run_url: string;
      head_sha: string;
      head_branch: string;
      default_branch?: string;
      workflow_name?: string;
      status?: string;
      conclusion?: string;
      run_attempt?: number;
    } | null;
    healing: {
      healing_id: string;
      repair_type: string;
      old_value: string;
      new_value: string;
      recommendation: string;
      status: string;
      developer_alert: boolean;
      selected_action?: string;
      automatic_execution_allowed?: boolean;
      requires_validation?: boolean;
      confidence_gate_applied?: boolean;
    };
    healing_plan: {
      root_cause: string;
      confidence: number;
      decision_source: string;
      decision_reason?: string;
      action: string;
      automatic_healing_allowed?: boolean;
      automatic_execution_allowed: boolean;
      requires_validation: boolean;
      confidence_gate_applied: boolean;
      automation_level: string;
      allowed_to_plan: boolean;
      allowed_to_publish: boolean;
      recommended_action: string;
      notification_required: boolean;
      target_team_or_module: string;
      history_status: string;
      validation_guidance: string[];
      github_changes_made: boolean;
    };
    flaky_analysis: {
      is_flaky: boolean;
      flaky_probability: number;
      risk_level: string;
      instability_score: string;
      recent_pattern: string;
    };
    notification: {
      status: string;
      notification_id?: string;
      target_module?: string;
      message?: string;
      github_changes_made?: boolean;
      automation_level?: string;
      notification_required?: boolean;
      validation_guidance?: string[];
    } | null;
    repair?: {
      attempt_id: string;
      eligible: boolean;
      reason: string;
      status: string;
      mode: "read_only";
      github_changes_made: false;
      automation_level: string;
      allowed_to_plan: boolean;
      allowed_to_publish: boolean;
      target_module?: string;
      recommended_action: string;
      validation_guidance: string[];
      history_status: string;
    } | null;
  };
};

type RepairPlan = {
  attempt_id: string;
  status: "planned" | "manual_review";
  mode: "read_only";
  model: string;
  root_cause_confirmed: boolean;
  repairable: boolean;
  confirmed_failed_file: string;
  confirmed_failed_line: number | null;
  base_sha: string;
  inspected_files: string[];
  proposed_changes: Array<{
    file_path: string;
    start_line: number;
    end_line: number;
    before_excerpt: string;
    after_excerpt: string;
    reason: string;
  }>;
  risks: string[];
  suggested_validation_commands: string[];
  manual_review_reason?: string | null;
  github_changes_made: false;
};

type RepairPublishResult = {
  correlation_id: string;
  attempt_id: string;
  publish_status: "draft_pr_created";
  validation_status: string;
  repair_branch: string;
  commit_sha: string;
  draft_pr_number: number;
  draft_pr_url: string;
  changed_files: string[];
  github_changes_made: true;
  automatic_merge_performed: false;
  message: "Draft PR created - awaiting developer review";
  merge_message: "No automatic merge performed";
};

const ROOT_CAUSE_COLORS: Record<string, string> = {
  locator_issue:       "text-blue-600 bg-blue-50 border-blue-100",
  synchronization_issue: "text-amber-600 bg-amber-50 border-amber-100",
  test_data_issue:     "text-orange-600 bg-orange-50 border-orange-100",
  environment_failure: "text-purple-600 bg-purple-50 border-purple-100",
  network_api_error:   "text-red-600 bg-red-50 border-red-100",
  application_defect:  "text-pink-600 bg-pink-50 border-pink-100",
  dependency_issue: "text-orange-600 bg-orange-50 border-orange-100",
  deployment_issue: "text-violet-600 bg-violet-50 border-violet-100",
  infrastructure_resource_issue: "text-slate-600 bg-slate-50 border-slate-100",
  manual_review: "text-slate-600 bg-slate-50 border-slate-100",
  network_issue: "text-red-600 bg-red-50 border-red-100",
  other_or_unknown: "text-gray-600 bg-gray-50 border-gray-100",
  security_policy_issue: "text-rose-600 bg-rose-50 border-rose-100",
  test_script_issue: "text-blue-600 bg-blue-50 border-blue-100",
  workflow_environment_issue: "text-cyan-700 bg-cyan-50 border-cyan-100",
};

export default function SubmitPage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<"github" | "manual" | "upload">("github");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<PipelineResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [failedRuns, setFailedRuns] = useState<GitHubWorkflowRun[]>([]);
  const [runsLoading, setRunsLoading] = useState(false);
  const [runsError, setRunsError] = useState<string | null>(null);
  const [selectedRunId, setSelectedRunId] = useState<number | null>(null);
  const [runDetails, setRunDetails] = useState<GitHubRunDetailsResponse | null>(null);
  const [runDetailsLoading, setRunDetailsLoading] = useState(false);
  const [runDetailsError, setRunDetailsError] = useState<string | null>(null);
  const [analyzingJobId, setAnalyzingJobId] = useState<number | null>(null);
  const [notificationPromptRootCause, setNotificationPromptRootCause] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const organizationId = useMeetingStore((state) => state.user?.organizationId);
  const projectId = useMeetingStore((state) => state.currentProject?.id);

  // Form state
  const [form, setForm] = useState({
    test_name: "",
    pipeline: "GitHub Actions",
    error_message: "",
    stack_trace: "",
    logs: "",
    failure_stage: "test",
    failure_type: "Test Failure",
    severity: "MEDIUM",
    retry_count: 0,
    test_duration_sec: 30,
    cpu_usage_pct: 50,
    memory_usage_mb: 1024,
    old_locator: "",
    github_actions_run_url: "",
  });

  const update = (k: string, v: string | number) =>
    setForm((p) => ({ ...p, [k]: v }));

  const submitForm = async () => {
    if (!form.test_name || !form.error_message) {
      setError("Test Name and Error Message are required.");
      return;
    }
    setLoading(true);
    setError(null);
    setResult(null);
    setNotificationPromptRootCause(null);
    try {
      const data = await failureAnalysisApi.submitAnalysis<PipelineResult>(form);
      setResult(data);
      maybeShowNotificationPrompt(data, setNotificationPromptRootCause);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  const processFile = useCallback(async (file: File) => {
    const text = await file.text();
    let parsed: Partial<typeof form> = {};
    try {
      // Try JSON first
      const json = JSON.parse(text);
      parsed = {
        test_name:       json.test_name || json.testName || file.name,
        error_message:   json.error_message || json.errorMessage || json.message || "",
        stack_trace:     json.stack_trace || json.stackTrace || "",
        logs:            json.logs || "",
        failure_stage:   json.failure_stage || "test",
        failure_type:    json.failure_type || "Test Failure",
        severity:        json.severity || "MEDIUM",
        retry_count:     Number(json.retry_count ?? 0),
        pipeline:        json.pipeline || "GitHub Actions",
        old_locator:     json.old_locator || json.old_value || "",
        github_actions_run_url: json.github_actions_run_url || json.run_url || "",
      };
    } catch {
      // Plain text — treat as error message + logs
      parsed = {
        test_name:     file.name.replace(/\.(log|json|txt)$/, ""),
        error_message: text.split("\n")[0]?.substring(0, 500) || text.substring(0, 500),
        logs:          text,
        stack_trace:   text.includes("Exception") || text.includes("Error")
          ? text.split("\n").filter((l) => l.trim().match(/at\s|Exception|Error/)).join("\n")
          : "",
      };
    }
    setForm((p) => ({ ...p, ...parsed }));
    setTab("manual");
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file) processFile(file);
    },
    [processFile]
  );
  const loadFailedRuns = useCallback(async () => {
    if (!organizationId || !projectId) {
      setFailedRuns([]);
      setRunsError("Select a project before loading failed CI runs.");
      return;
    }

    setRunsLoading(true);
    setRunsError(null);
    setSelectedRunId(null);
    setRunDetails(null);
    setRunDetailsError(null);
    setResult(null);
    setNotificationPromptRootCause(null);
    setError(null);

    try {
      const data = await failureAnalysisApi.fetchGithubFailedRuns();
      setFailedRuns(data.runs ?? []);
    } catch (e: unknown) {
      setFailedRuns([]);
      setRunsError(formatGithubFlowError(e));
    } finally {
      setRunsLoading(false);
    }
  }, [organizationId, projectId]);

  const loadRunDetails = async (run: GitHubWorkflowRun) => {
    setSelectedRunId(run.run_id);
    setRunDetails(null);
    setRunDetailsError(null);
    setError(null);
    setResult(null);
    setNotificationPromptRootCause(null);
    setRunDetailsLoading(true);

    try {
      const data = await failureAnalysisApi.fetchGithubRunDetails(run.run_id);
      setRunDetails(data);
    } catch (e: unknown) {
      setRunDetailsError(formatGithubFlowError(e));
    } finally {
      setRunDetailsLoading(false);
    }
  };

  const analyzeFailedJob = async (runId: number, job: GitHubWorkflowJob) => {
    if (job.conclusion !== "failure") {
      setRunDetailsError("Only failed jobs can be analyzed as failures.");
      return;
    }

    setAnalyzingJobId(job.job_id);
    setError(null);
    setRunDetailsError(null);
    setResult(null);
    setNotificationPromptRootCause(null);

    try {
      const data = await failureAnalysisApi.analyzeGithubFailedJob<GitHubAnalyzeFailureResponse>(runId, job.job_id);
      const normalized = normalizeGithubAnalyzeResult(data);
      setResult(normalized);
      maybeShowNotificationPrompt(normalized, setNotificationPromptRootCause);
    } catch (e: unknown) {
      setRunDetailsError(formatGithubFlowError(e));
    } finally {
      setAnalyzingJobId(null);
    }
  };

  useEffect(() => {
    setFailedRuns([]);
    setRunsError(null);
    setSelectedRunId(null);
    setRunDetails(null);
    setRunDetailsError(null);
    setResult(null);
    setNotificationPromptRootCause(null);
    setError(null);
    if (tab === "github") {
      void loadFailedRuns();
    }
  }, [organizationId, projectId, tab, loadFailedRuns]);

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-extrabold tracking-tight text-[var(--foreground)]">Analyze Pipeline Failure</h2>
        <p className="text-xs font-medium text-[var(--muted)]">
          Classify a CI failure, resolve its action policy, and review the safe next step.
        </p>
      </div>

      {/* ── Tab bar ──────────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap gap-2 rounded-2xl bg-[var(--card-2)] p-1 w-fit border border-[var(--border)]/60 shadow-sm">
        {([
          { id: "github", label: "Failed CI Runs", icon: <GitBranch size={15} /> },
          { id: "manual", label: "Advanced Manual", icon: <PlusCircle size={15} /> },
          { id: "upload", label: "Artifact File Drop", icon: <Upload size={15} /> },
        ] as const).map((item) => (
          <button
            key={item.id}
            onClick={() => setTab(item.id)}
            className={`rounded-xl px-6 py-2.5 text-xs font-bold transition flex items-center gap-2 ${
              tab === item.id
                ? "bg-indigo-600 text-white shadow-sm"
                : "text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-white/40"
            }`}
          >
            {item.icon}
            {item.label}
          </button>
        ))}
      </div>

      {tab === "github" && (
        <GithubFailedRunsPanel
          runs={failedRuns}
          loading={runsLoading}
          error={runsError}
          selectedRunId={selectedRunId}
          runDetails={runDetails}
          runDetailsLoading={runDetailsLoading}
          runDetailsError={runDetailsError}
          analyzingJobId={analyzingJobId}
          onRefresh={loadFailedRuns}
          onSelectRun={loadRunDetails}
          onAnalyzeJob={analyzeFailedJob}
        />
      )}
      {/* ── File Upload Tab ───────────────────────────────────────────────────── */}
      {tab === "upload" && (
        <div
          onDrop={handleDrop}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onClick={() => fileRef.current?.click()}
          className={`flex cursor-pointer flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed p-16 transition-all duration-300 relative overflow-hidden bg-[var(--card)] hover:border-indigo-500 group ${
            dragOver
              ? "border-indigo-600 bg-indigo-50/20"
              : "border-[var(--border)] hover:bg-slate-50/50"
          }`}
        >
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 to-purple-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <div className="w-16 h-16 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 border border-indigo-100/60 shadow-sm group-hover:scale-105 transition-all">
            <Upload size={24} />
          </div>
          <div className="text-center">
            <p className="font-bold text-slate-800 tracking-tight">Drop your artifact here or click to browse</p>
            <p className="mt-1 text-xs text-[var(--muted)] font-medium">
              Supports <strong>.json</strong>, <strong>.log</strong>, <strong>.txt</strong>
            </p>
            <p className="mt-2 text-[11px] bg-slate-50 border border-slate-100/60 px-3 py-1.5 rounded-xl font-mono text-[var(--muted)] max-w-lg mx-auto leading-normal">
              JSON format maps: test_name, error_message, stack_trace, logs, severity, retry_count
            </p>
          </div>
          <input
            ref={fileRef}
            type="file"
            accept=".json,.log,.txt"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && processFile(e.target.files[0])}
          />
        </div>
      )}

      {/* ── Manual Input Form ─────────────────────────────────────────────────── */}
      {tab === "manual" && (
        <div className="grid gap-6 xl:grid-cols-2">
          {/* Left column */}
          <div className="space-y-4 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-sm">
            <div className="flex items-center gap-2 border-b border-[var(--border)] pb-3 mb-1">
              <div className="w-7 h-7 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 border border-indigo-100/60">
                <Layout size={14} />
              </div>
              <h3 className="text-base font-bold text-[var(--foreground)] tracking-tight">Pipeline & Runtime Metadata</h3>
            </div>

            <Field label="Test Case Name *">
              <input
                value={form.test_name}
                onChange={(e) => update("test_name", e.target.value)}
                placeholder="e.g. Login Verification"
                className={inputCls}
              />
            </Field>

            <Field label="Active CI/CD Pipeline">
              <select
                value={form.pipeline}
                onChange={(e) => update("pipeline", e.target.value)}
                className={inputCls}
              >
                {["GitHub Actions", "Jenkins", "GitLab CI", "CircleCI", "Azure DevOps"].map((p) => (
                  <option key={p}>{p}</option>
                ))}
              </select>
            </Field>

            {form.pipeline === "GitHub Actions" && (
              <Field label="GitHub Actions Run URL">
                <div className="relative">
                  <GitBranch
                    size={14}
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]"
                  />
                  <input
                    type="url"
                    value={form.github_actions_run_url}
                    onChange={(e) => update("github_actions_run_url", e.target.value)}
                    placeholder="https://github.com/owner/repository/actions/runs/123456"
                    className={inputCls + " pl-9"}
                  />
                </div>
              </Field>
            )}

            <div className="grid grid-cols-2 gap-4">
              <Field label="Target Stage">
                <select value={form.failure_stage} onChange={(e) => update("failure_stage", e.target.value)} className={inputCls}>
                  <option>test</option><option>build</option><option>deploy</option>
                </select>
              </Field>
              <Field label="Severity Rating">
                <select value={form.severity} onChange={(e) => update("severity", e.target.value)} className={inputCls}>
                  <option>LOW</option><option>MEDIUM</option><option>HIGH</option><option>CRITICAL</option>
                </select>
              </Field>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Field label="Retries Count">
                <input type="number" min={0} max={10} value={form.retry_count}
                  onChange={(e) => update("retry_count", Number(e.target.value))} className={inputCls} />
              </Field>
              <Field label="Test Duration (sec)">
                <input type="number" min={0} value={form.test_duration_sec}
                  onChange={(e) => update("test_duration_sec", Number(e.target.value))} className={inputCls} />
              </Field>
            </div>

            <Field label="Old Locator (optional)">
              <input value={form.old_locator} onChange={(e) => update("old_locator", e.target.value)}
                placeholder="e.g. #submit-btn or //button[@id='pay']" className={inputCls} />
            </Field>
          </div>

          {/* Right column */}
          <div className="space-y-4 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-sm">
            <div className="flex items-center gap-2 border-b border-[var(--border)] pb-3 mb-1">
              <div className="w-7 h-7 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 border border-indigo-100/60">
                <Code2 size={14} />
              </div>
              <h3 className="text-base font-bold text-[var(--foreground)] tracking-tight">Failure Artifacts</h3>
            </div>

            <Field label="Error Summary/Message *">
              <textarea rows={3} value={form.error_message}
                onChange={(e) => update("error_message", e.target.value)}
                placeholder="e.g. NoSuchElementException: Unable to locate login button element"
                className={inputCls + " resize-none h-[105px]"} />
            </Field>

            <Field label="Detailed Stack Trace">
              <textarea rows={4} value={form.stack_trace}
                onChange={(e) => update("stack_trace", e.target.value)}
                placeholder="at LoginPage.findElement() at TestSuite.validateLogin()"
                className={inputCls + " resize-none font-mono text-xs h-[105px]"} />
            </Field>

            <Field label="Full Execution Logs">
              <textarea rows={3} value={form.logs}
                onChange={(e) => update("logs", e.target.value)}
                placeholder="Test runner standard console logs..."
                className={inputCls + " resize-none font-mono text-xs h-[85px]"} />
            </Field>
          </div>
        </div>
      )}

      {/* ── Error ────────────────────────────────────────────────────────────── */}
      {error && (
        <div className="rounded-2xl border border-red-500/20 bg-red-50/50 p-4 text-xs font-bold text-red-700 flex items-center gap-2 shadow-sm">
          <AlertTriangle size={16} />
          {error}
        </div>
      )}

      {/* ── Submit button ─────────────────────────────────────────────────────── */}
      {tab !== "github" && (
      <button
        onClick={submitForm}
        disabled={loading}
        className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 px-8 py-3.5 font-extrabold text-xs text-white hover:opacity-95 disabled:opacity-50 hover:shadow-lg hover:shadow-indigo-500/15 transition-all"
      >
        {loading ? (
          <>
            <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
            Analyzing Failure…
          </>
        ) : (
          <><Play size={15} /> Run Failure Analysis</>
        )}
      </button>
      )}

      {/* ── Result ───────────────────────────────────────────────────────────── */}
      {result && <AnalysisResult result={result} />}
      {notificationPromptRootCause && (
        <NotificationCreatedModal
          rootCause={notificationPromptRootCause}
          onViewNotification={() => {
            setNotificationPromptRootCause(null);
            navigate("/self-healing/notifications");
          }}
        />
      )}
    </div>
  );
}

/* ── Sub-components ──────────────────────────────────────────────────────────── */

const ROOT_CAUSE_LABELS: Record<string, string> = {
  application_defect: "Application Defect",
  test_script_issue: "Test Script Issue",
  dependency_issue: "Dependency Issue",
  network_issue: "Network Issue",
  workflow_environment_issue: "Workflow / Environment Issue",
  infrastructure_resource_issue: "Infrastructure / Resource Issue",
  deployment_issue: "Deployment Issue",
  security_policy_issue: "Security Policy Issue",
  other_or_unknown: "Other or Unknown",
};

function formatRootCauseLabel(rootCause?: string | null): string {
  if (!rootCause) return "Other or Unknown";
  return ROOT_CAUSE_LABELS[rootCause] || rootCause.replace(/_/g, " ");
}

function getResultRootCause(result: PipelineResult): string | null {
  return (
    result.classification?.root_cause ||
    result.pipeline?.classification?.root_cause ||
    result.pipeline?.healing_plan?.root_cause ||
    null
  );
}

function shouldPromptForNotification(result: PipelineResult): string | null {
  const rootCause = getResultRootCause(result);
  if (!rootCause || rootCause === "application_defect") return null;
  return rootCause;
}

function maybeShowNotificationPrompt(
  result: PipelineResult,
  setPrompt: (rootCause: string | null) => void,
) {
  setPrompt(shouldPromptForNotification(result));
}

function NotificationCreatedModal({
  rootCause,
  onViewNotification,
}: {
  rootCause: string;
  onViewNotification: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 px-4">
      <div className="w-full max-w-md rounded-2xl border border-[var(--border)] bg-white p-6 shadow-2xl">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-cyan-100 bg-cyan-50 text-cyan-700">
            <Send size={18} />
          </div>
          <div>
            <h3 className="text-lg font-extrabold text-slate-900">Notification Created</h3>
            <p className="mt-2 text-sm font-medium leading-6 text-slate-600">
              This failure was classified as {formatRootCauseLabel(rootCause)}. A notification has been created for the recommended follow-up action.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onViewNotification}
          className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-indigo-700"
        >
          View Notification
        </button>
      </div>
    </div>
  );
}

function normalizeGithubAnalyzeResult(response: GitHubAnalyzeFailureResponse): PipelineResult {
  const analysis = response.analysis as Partial<PipelineResult> | null | undefined;
  if (!analysis?.pipeline) {
    throw new Error("GitHub analysis response did not include analysis pipeline data.");
  }

  return {
    ...analysis,
    source: response.source,
    github: response.github,
    evidence: response.evidence,
    failure: response.failure,
    classification: response.classification,
    healing: response.healing,
    repair: (response.repair as PipelineResult["pipeline"]["repair"] | null | undefined) ?? analysis.pipeline.repair ?? null,
    saved_to_db: Boolean((analysis as { saved_to_db?: boolean }).saved_to_db),
    test_id: analysis.test_id || response.failure?.test_id || "Unknown failure",
    status: analysis.status || response.failure?.status || "FAIL",
    pipeline: {
      ...analysis.pipeline,
      classification: {
        ...analysis.pipeline.classification,
        ...response.classification,
        all_probabilities:
          response.classification?.all_probabilities ||
          analysis.pipeline.classification?.all_probabilities ||
          {},
      },
      healing: {
        ...analysis.pipeline.healing,
        ...response.healing,
      },
      repair: (response.repair as PipelineResult["pipeline"]["repair"] | null | undefined) ?? analysis.pipeline.repair ?? null,
    },
  } as PipelineResult;
}
function GithubFailedRunsPanel({
  runs,
  loading,
  error,
  selectedRunId,
  runDetails,
  runDetailsLoading,
  runDetailsError,
  analyzingJobId,
  onRefresh,
  onSelectRun,
  onAnalyzeJob,
}: {
  runs: GitHubWorkflowRun[];
  loading: boolean;
  error: string | null;
  selectedRunId: number | null;
  runDetails: GitHubRunDetailsResponse | null;
  runDetailsLoading: boolean;
  runDetailsError: string | null;
  analyzingJobId: number | null;
  onRefresh: () => void;
  onSelectRun: (run: GitHubWorkflowRun) => void;
  onAnalyzeJob: (runId: number, job: GitHubWorkflowJob) => void;
}) {
  const failedJobs = runDetails?.failed_jobs ?? [];
  const currentRun = runDetails?.run;

  return (
    <section className="grid gap-6 xl:grid-cols-[minmax(0,1.05fr)_minmax(360px,0.95fr)]">
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[var(--border)] pb-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-[var(--muted)] flex items-center gap-2">
              <GitBranch size={14} className="text-indigo-600" />
              Failed CI Runs
            </p>
            <h3 className="mt-1 text-lg font-extrabold tracking-tight text-[var(--foreground)]">
              Project GitHub Actions failures
            </h3>
            <p className="mt-1 max-w-2xl text-xs font-medium text-[var(--muted)]">
              Uses the selected project's GitHub configuration. Repository credentials and job logs stay server-side.
            </p>
          </div>
          <button
            type="button"
            onClick={onRefresh}
            disabled={loading}
            className="inline-flex h-10 items-center gap-2 rounded-lg border border-indigo-100 bg-indigo-50 px-4 text-xs font-bold text-indigo-700 transition hover:bg-indigo-100 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>

        {error && <InlineAlert message={error} />}

        {loading && (
          <div className="mt-5 flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50 p-4 text-xs font-bold text-slate-600">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
            Loading failed workflow runs...
          </div>
        )}

        {!loading && !error && runs.length === 0 && (
          <div className="mt-5 rounded-xl border border-emerald-100 bg-emerald-50 p-5 text-sm font-bold text-emerald-800">
            No failed GitHub Actions runs were found for this project.
          </div>
        )}

        <div className="mt-5 space-y-3">
          {runs.map((run) => {
            const selected = selectedRunId === run.run_id;
            return (
              <button
                key={run.run_id}
                type="button"
                onClick={() => onSelectRun(run)}
                className={`w-full rounded-xl border p-4 text-left transition ${
                  selected
                    ? "border-indigo-300 bg-indigo-50 shadow-sm"
                    : "border-[var(--border)] bg-white hover:border-indigo-200 hover:bg-slate-50"
                }`}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-extrabold text-slate-900">
                      {run.display_title || run.name || "GitHub Actions workflow"}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2 text-[11px] font-bold text-slate-500">
                      <span className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-2 py-1">
                        <GitBranch size={12} /> {run.head_branch || "unknown branch"}
                      </span>
                      <span className="rounded-lg border border-red-100 bg-red-50 px-2 py-1 text-red-700">
                        {run.conclusion || run.status || "failure"}
                      </span>
                      {run.run_number && <span className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-1">Run #{run.run_number}</span>}
                      {run.run_attempt && <span className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-1">Attempt {run.run_attempt}</span>}
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <span className="font-mono text-[11px] font-bold text-slate-500">{shortSha(run.head_sha)}</span>
                    {run.html_url && (
                      <a
                        href={run.html_url}
                        target="_blank"
                        rel="noreferrer"
                        onClick={(event) => event.stopPropagation()}
                        className="rounded-lg border border-slate-200 bg-white p-2 text-indigo-600 hover:bg-indigo-50"
                        aria-label="Open GitHub Actions run"
                        title="Open GitHub Actions run"
                      >
                        <ExternalLink size={14} />
                      </a>
                    )}
                  </div>
                </div>
                <p className="mt-3 flex items-center gap-1.5 text-[11px] font-medium text-[var(--muted)]">
                  <Clock size={12} /> Updated {formatDateTime(run.updated_at || run.created_at)}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-sm">
        <div className="border-b border-[var(--border)] pb-4">
          <p className="text-xs font-bold uppercase tracking-widest text-[var(--muted)] flex items-center gap-2">
            <Activity size={14} className="text-indigo-600" />
            Failed Jobs
          </p>
          <h3 className="mt-1 text-lg font-extrabold tracking-tight text-[var(--foreground)]">
            Select one job to analyze
          </h3>
          <p className="mt-1 text-xs font-medium text-[var(--muted)]">
            Analysis downloads sanitized evidence on the backend and persists the normal Component 3 result.
          </p>
        </div>

        {!selectedRunId && (
          <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-5 text-sm font-bold text-slate-600">
            Select a failed workflow run to view failed jobs.
          </div>
        )}

        {runDetailsLoading && (
          <div className="mt-5 flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50 p-4 text-xs font-bold text-slate-600">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
            Loading failed jobs...
          </div>
        )}

        {runDetailsError && <InlineAlert message={runDetailsError} />}

        {currentRun && (
          <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs text-slate-600">
            <p className="font-extrabold text-slate-900">{currentRun.name || currentRun.display_title || "Workflow run"}</p>
            <div className="mt-2 grid gap-2 font-bold sm:grid-cols-2">
              <span>Repository: {runDetails?.repository}</span>
              <span>Branch: {currentRun.head_branch || "unknown"}</span>
              <span>Run ID: {currentRun.run_id}</span>
              <span>SHA: {shortSha(currentRun.head_sha)}</span>
            </div>
          </div>
        )}

        {!runDetailsLoading && currentRun && failedJobs.length === 0 && (
          <div className="mt-5 rounded-xl border border-amber-100 bg-amber-50 p-5 text-sm font-bold text-amber-800">
            No failed jobs were found for this workflow run.
          </div>
        )}

        <div className="mt-5 space-y-3">
          {failedJobs.map((job) => {
            const failedSteps = (job.steps ?? []).filter((step) => step.conclusion === "failure");
            const analyzing = analyzingJobId === job.job_id;
            return (
              <article key={job.job_id} className="rounded-xl border border-[var(--border)] bg-white p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-extrabold text-slate-900">{job.name || `Job ${job.job_id}`}</p>
                    <div className="mt-2 flex flex-wrap gap-2 text-[11px] font-bold">
                      <span className="rounded-lg border border-red-100 bg-red-50 px-2 py-1 text-red-700">{job.conclusion || job.status || "failure"}</span>
                      <span className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-slate-500">Job {job.job_id}</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => currentRun && onAnalyzeJob(currentRun.run_id, job)}
                    disabled={analyzing || job.conclusion !== "failure"}
                    className="inline-flex h-10 items-center gap-2 rounded-lg bg-indigo-600 px-4 text-xs font-bold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {analyzing ? (
                      <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    ) : (
                      <Play size={15} />
                    )}
                    {analyzing ? "Analyzing failure..." : "Analyze Failure"}
                  </button>
                </div>
                {failedSteps.length > 0 && (
                  <div className="mt-3 space-y-1 rounded-lg border border-slate-100 bg-slate-50 p-3">
                    <p className="text-[10px] font-extrabold uppercase tracking-wider text-[var(--muted)]">Failed steps</p>
                    {failedSteps.map((step) => (
                      <p key={`${job.job_id}-${step.number}-${step.name}`} className="text-xs font-bold text-slate-700">
                        {step.number ? `${step.number}. ` : ""}{step.name || "Unnamed step"}
                      </p>
                    ))}
                  </div>
                )}
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function InlineAlert({ message }: { message: string }) {
  return (
    <div className="mt-5 rounded-xl border border-red-500/20 bg-red-50 p-4 text-xs font-bold text-red-700 flex items-start gap-2">
      <AlertTriangle size={15} className="mt-0.5 shrink-0" />
      <span>{message}</span>
    </div>
  );
}

function formatGithubFlowError(error: unknown): string {
  const message = error instanceof Error ? error.message : "Unknown error";
  if (/Authorization is required|401|unauthorized|session/i.test(message)) {
    return "Your session could not be authorized. Please sign in again and retry.";
  }
  if (/403|forbidden|access denied/i.test(message)) {
    return "GitHub or project access was denied for this project.";
  }
  if (/404|not found/i.test(message)) {
    return "The GitHub run, job, or project configuration could not be found.";
  }
  if (/repair branch|recursive controlled-repair|auto-heal/i.test(message)) {
    return "This run belongs to a Component 3 repair branch and is excluded from recursive repair analysis.";
  }
  if (/configuration|repository URL|PAT|token/i.test(message)) {
    return "GitHub configuration must be added to the selected project before failed CI runs can be analyzed.";
  }
  return message;
}

function formatDateTime(value?: string | null): string {
  if (!value) return "unknown";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
}

function shortSha(value?: string | null): string {
  return value ? value.slice(0, 7) : "unknown";
}
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-[11px] font-extrabold uppercase tracking-wider text-[var(--muted)]">{label}</label>
      {children}
    </div>
  );
}

const inputCls =
  "w-full rounded-xl border border-[var(--border)] bg-[var(--card-2)] px-3 py-2.5 text-xs font-medium text-[var(--foreground)] outline-none focus:border-indigo-400 focus:bg-white transition duration-150";

function AnalysisResult({ result }: { result: PipelineResult }) {
  const pipeline = result.pipeline;
  if (!pipeline) {
    return <InlineAlert message="Analysis completed, but the response did not include renderable pipeline data." />;
  }

  const cls = pipeline.classification ?? result.classification ?? {
    root_cause: "other_or_unknown",
    confidence: 0,
    all_probabilities: {},
    model_used: "classifier",
  };
  const sourceRun = pipeline.source_run ?? null;
  const healing = pipeline.healing ?? {
    healing_id: "",
    repair_type: result.healing?.selected_action || "Manual Review",
    old_value: "",
    new_value: "",
    recommendation: result.healing?.recommendation || "No recovery recommendation was returned.",
    status: "Suggested",
    developer_alert: false,
    selected_action: result.healing?.selected_action || "manual_review",
    automatic_execution_allowed: false,
  };
  const plan = pipeline.healing_plan ?? {
    root_cause: cls.root_cause || "other_or_unknown",
    confidence: (cls.confidence || 0) * 100,
    decision_source: cls.decision_source || "machine_learning",
    action: result.healing?.selected_action || healing.selected_action || "manual_review",
    automatic_healing_allowed: false,
    automatic_execution_allowed: false,
    requires_validation: false,
    confidence_gate_applied: false,
    automation_level: "manual_review",
    allowed_to_plan: Boolean(result.repair?.eligible),
    allowed_to_publish: false,
    recommended_action: result.healing?.recommendation || "Review the failure analysis result.",
    notification_required: false,
    target_team_or_module: "Manual Review",
    history_status: "suggested",
    validation_guidance: [],
    github_changes_made: false,
  };
  const flaky = pipeline.flaky_analysis ?? {
    is_flaky: false,
    flaky_probability: 0,
    risk_level: "Low",
    instability_score: "0%",
    recent_pattern: "PASS",
  };
  const notification = pipeline.notification ?? null;
  const repair = result.repair ?? pipeline.repair ?? null;
  const probabilities = cls.all_probabilities ?? {};
  const validationGuidance = plan.validation_guidance ?? [];
  const rcColor = ROOT_CAUSE_COLORS[cls.root_cause || "other_or_unknown"] ?? "text-gray-600 bg-gray-50 border-gray-100";
  const mlConfidence = cls.ml_confidence ?? cls.confidence;
  const decisionSource = cls.decision_source || plan?.decision_source || "machine_learning";
  const decisionReason = cls.decision_reason || plan?.decision_reason;
  const detected = cls.detected_error;
  const githubSource = result.github;
  const evidence = result.evidence;
  const sourceRepository = githubSource?.repository || sourceRun?.repository_full_name;
  const sourceBranch = githubSource?.head_branch || sourceRun?.head_branch;
  const sourceSha = githubSource?.head_sha || sourceRun?.head_sha;
  const sourceRunId = githubSource?.run_id || sourceRun?.run_id;
  const sourceRunUrl = githubSource?.run_url || sourceRun?.run_url;
  const sourceJobId = githubSource?.job_id;
  const candidateFile = evidence?.candidate_file || detected?.failed_file;
  const candidateLine = evidence?.candidate_line ?? detected?.failed_line;
  const evidenceErrorType = evidence?.error_type || detected?.error_type;
  const evidenceErrorMessage = evidence?.error_message || detected?.error_message;
  const detectedEvidence = detected?.failed_file && detected.failed_file !== "unknown"
    ? `${detected.error_type || "Error"} in ${detected.failed_file}${detected.failed_line && detected.failed_line !== "unknown" ? `:${detected.failed_line}` : ""}`
    : detected?.error_type;
  const nonApplicationAction = shouldShowActionGuidance(cls.root_cause);
  const repairMode = nonApplicationAction
    ? (plan.automation_level || "manual_review").replace(/_/g, " ")
    : plan?.automatic_execution_allowed
    ? "Controlled Draft PR"
    : plan?.automatic_healing_allowed || plan?.requires_validation
      ? "Controlled Repair"
      : "Manual Gate";
  const repairModeClass = nonApplicationAction
    ? "bg-cyan-50 text-cyan-700 border-cyan-100"
    : plan?.automatic_execution_allowed
    ? "bg-emerald-50 text-emerald-700 border-emerald-100"
    : plan?.automatic_healing_allowed || plan?.requires_validation
      ? "bg-blue-50 text-blue-700 border-blue-100"
      : "bg-slate-50 text-slate-600 border-slate-200";

  return (
    <div className="space-y-6 pt-2">
      <div className="flex flex-wrap items-center gap-3 border-b border-[var(--border)] pb-4">
        <h3 className="text-lg font-extrabold tracking-tight text-[var(--foreground)]">Analysis Completed</h3>
        <span className="rounded-full bg-emerald-50 border border-emerald-100/50 px-3 py-1 text-xs font-bold text-emerald-700 font-mono shadow-sm">
          Saved {result.test_id}
        </span>
        {repair?.eligible && (
          <span className="rounded-full bg-indigo-50 border border-indigo-100 px-3 py-1 text-xs font-extrabold text-indigo-700 shadow-sm">
            Controlled Repair Available
          </span>
        )}
      </div>

      {(sourceRepository || candidateFile || evidenceErrorMessage) && (
        <section className="rounded-2xl border border-indigo-100 bg-indigo-50/50 p-5 shadow-sm">
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(280px,0.8fr)]">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-indigo-700 flex items-center gap-2">
                <GitBranch size={14} /> GitHub Source
              </p>
              <div className="mt-3 grid gap-2 text-xs font-bold text-slate-700 sm:grid-cols-2">
                <span className="break-all">Repository: {sourceRepository || "unknown"}</span>
                <span>Branch: {sourceBranch || "unknown"}</span>
                <span>Run ID: {sourceRunId || "unknown"}</span>
                <span>Job ID: {sourceJobId || "unknown"}</span>
                <span>SHA: {shortSha(sourceSha)}</span>
                <span>Status: {result.status}</span>
              </div>
              {sourceRunUrl && (
                <a
                  href={sourceRunUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-3 inline-flex items-center gap-2 rounded-lg border border-indigo-200 bg-white px-3 py-2 text-xs font-bold text-indigo-700 hover:bg-indigo-50"
                >
                  Open GitHub Run <ExternalLink size={13} />
                </a>
              )}
            </div>
            <div className="rounded-xl border border-white bg-white/80 p-4">
              <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Evidence Preview</p>
              <div className="mt-3 space-y-2 text-xs text-slate-700">
                {evidenceErrorType && <p><span className="font-extrabold">Error type:</span> {evidenceErrorType}</p>}
                {evidenceErrorMessage && <p><span className="font-extrabold">Message:</span> {evidenceErrorMessage}</p>}
                {candidateFile && (
                  <p className="break-all font-mono">
                    {candidateFile}{candidateLine ? `:${candidateLine}` : ""}
                  </p>
                )}
                {!evidenceErrorType && !evidenceErrorMessage && !candidateFile && (
                  <p className="font-medium text-[var(--muted)]">No specific source location was extracted.</p>
                )}
              </div>
            </div>
          </div>
        </section>
      )}
      <div className="grid gap-6 xl:grid-cols-3">
        {/* Classification */}
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 space-y-4 shadow-sm relative overflow-hidden flex flex-col justify-between">
          <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500" />
          <div className="space-y-3 flex-1">
            <p className="text-xs font-bold uppercase tracking-widest text-[var(--muted)] flex items-center gap-2">
              <ShieldCheck size={14} className="text-indigo-600" />
              Root Cause Classification
            </p>
            <div className="pt-1">
              <span className={`inline-flex rounded-xl border px-3 py-1.5 text-xs font-bold uppercase tracking-wide ${rcColor}`}>
                {(cls.root_cause || "other_or_unknown").replace(/_/g, " ")}
              </span>
            </div>
            <p className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">{(mlConfidence * 100).toFixed(1)}%</p>
            <p className="text-[11px] font-bold text-[var(--muted)]">ML confidence - {cls.model_used}</p>
            <div className="space-y-1.5 rounded-xl border border-[var(--border)]/40 bg-slate-50/60 p-3 text-[11px] font-bold text-slate-700">
              <p>ML prediction: {(cls.ml_prediction || cls.root_cause).replace(/_/g, " ")}</p>
              <p>Decision source: {decisionSource.replace(/_/g, " ")}</p>
              {detectedEvidence && <p>Rule evidence: {detectedEvidence}</p>}
              {decisionReason && <p className="font-medium text-[var(--muted)]">{decisionReason}</p>}
            </div>
          </div>
          <div className="space-y-2 pt-3 border-t border-[var(--border)]">
            {Object.entries(probabilities)
              .sort(([, a], [, b]) => b - a)
              .map(([label, prob]) => (
                <div key={label} className="flex items-center gap-2">
                  <div className="w-24 shrink-0 text-xs font-bold text-[var(--muted)] tracking-tight truncate">{label.replace(/_/g, " ")}</div>
                  <div className="flex-1 rounded-full bg-[var(--card-2)] h-2 overflow-hidden border border-[var(--border)]/20 p-0.5">
                    <div className="h-full rounded-full bg-indigo-600" style={{ width: `${prob * 100}%` }} />
                  </div>
                  <span className="text-xs font-bold font-mono w-10 text-right">{(prob * 100).toFixed(0)}%</span>
                </div>
              ))}
          </div>
        </div>

        {/* Healing */}
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 space-y-4 shadow-sm relative overflow-hidden flex flex-col justify-between">
          <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500" />
          <div className="space-y-3 flex-1">
            <p className="text-xs font-bold uppercase tracking-widest text-[var(--muted)] flex items-center gap-2">
              <Activity size={14} className="text-emerald-600" />
              Action Policy
            </p>
            <p className="text-sm font-bold text-slate-800 leading-snug">{healing.repair_type}</p>
            <div className="rounded-xl border border-[var(--border)]/40 bg-slate-50/60 p-3">
              <p className="text-[10px] font-extrabold uppercase tracking-wider text-[var(--muted)]">Recommended Action</p>
              <p className="mt-1 text-xs font-mono font-bold text-slate-800 break-all">
                {nonApplicationAction
                  ? plan.recommended_action
                  : (plan?.action || healing.selected_action || "manual_review").replace(/_/g, " ")}
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                <span className={`rounded-xl border px-2.5 py-1 text-[10px] font-bold ${repairModeClass}`}>
                  {repairMode}
                </span>
                {plan?.requires_validation && (
                  <span className="rounded-xl border border-amber-100 bg-amber-50 px-2.5 py-1 text-[10px] font-bold text-amber-700">
                    Validation Required
                  </span>
                )}
              </div>
            </div>
            {sourceRun && (
              <div className="rounded-xl border border-[var(--border)]/40 bg-white p-3 text-[11px] text-slate-700">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 space-y-1">
                    <p className="font-bold truncate">{sourceRun.repository_full_name}</p>
                    <p className="font-mono text-[var(--muted)]">
                      {sourceRun.head_branch} at {shortSha(sourceRun.head_sha)}
                    </p>
                    <p className="font-medium text-[var(--muted)]">
                      Run {sourceRun.run_id} - {sourceRun.conclusion || sourceRun.status || "unknown"}
                    </p>
                  </div>
                  <a
                    href={sourceRun.run_url}
                    target="_blank"
                    rel="noreferrer"
                    aria-label="Open GitHub Actions run"
                    title="Open GitHub Actions run"
                    className="shrink-0 rounded-lg border border-[var(--border)] p-2 text-indigo-600 hover:bg-indigo-50"
                  >
                    <ExternalLink size={14} />
                  </a>
                </div>
              </div>
            )}
            <div>
              <span className={`inline-flex rounded-xl border px-3 py-1 text-xs font-bold ${
                healing.status === "Suggested" ? "bg-blue-50 text-blue-700 border-blue-100" :
                healing.status === "Applied"   ? "bg-green-50 text-green-700 border-green-100" :
                healing.status === "Rejected"  ? "bg-red-50 text-red-700 border-red-100" :
                "bg-amber-50 text-amber-700 border-amber-100"
              }`}>
                {healing.status}
              </span>
            </div>
            {healing.old_value && (
              <div className="space-y-2 text-xs font-mono bg-slate-50/60 p-3 rounded-xl border border-[var(--border)]/30 mt-2">
                <p className="text-red-700 line-through opacity-80 break-all">{healing.old_value}</p>
                <p className="text-emerald-700 font-bold break-all">{healing.new_value}</p>
              </div>
            )}
            <p className="text-xs font-medium text-[var(--muted)] leading-relaxed mt-2">{healing.recommendation}</p>
          </div>
          {healing.developer_alert && (
            <div className="pt-3 border-t border-[var(--border)]">
              <span className="inline-flex rounded-xl bg-orange-50 border border-orange-100 px-3 py-1 text-xs font-bold text-orange-700">
                Alert record created
              </span>
            </div>
          )}
        </div>

        {/* Flaky */}
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 space-y-4 shadow-sm relative overflow-hidden flex flex-col justify-between">
          <div className="absolute top-0 left-0 w-1 h-full bg-amber-500" />
          <div className="space-y-3 flex-1">
            <p className="text-xs font-bold uppercase tracking-widest text-[var(--muted)] flex items-center gap-2">
              <Award size={14} className="text-amber-600" />
              Predictive Heuristics
            </p>
            <div className="flex items-baseline gap-3">
              <p className="text-4xl font-extrabold tracking-tight text-slate-800">{flaky.instability_score}</p>
              <span className={`rounded-xl border px-3 py-1 text-xs font-bold ${
                flaky.risk_level === "High"   ? "bg-red-50 text-red-700 border-red-100" :
                flaky.risk_level === "Medium" ? "bg-amber-50 text-amber-700 border-amber-100" :
                "bg-emerald-50 text-emerald-700 border-emerald-100"
              }`}>
                {flaky.risk_level} Risk
              </span>
            </div>
            <p className="text-xs font-bold text-[var(--muted)]">Calculated Instability</p>
            <div className="w-full rounded-full bg-[var(--card-2)] h-2 overflow-hidden border border-[var(--border)]/20 p-0.5">
              <div
                className={`h-full rounded-full ${
                  flaky.risk_level === "High" ? "bg-red-600" :
                  flaky.risk_level === "Medium" ? "bg-amber-600" : "bg-emerald-600"
                } transition-all`}
                style={{ width: flaky.instability_score }}
              />
            </div>
            <p className="text-xs font-bold text-[var(--muted)] pt-1">Recent Pass Pattern</p>
            <div className="flex gap-1.5 flex-wrap">
              {flaky.recent_pattern.split(", ").map((r, i) => (
                <span key={i} className={`rounded-xl px-2.5 py-1 text-xs font-mono font-bold ${
                  r === "FAIL" ? "bg-red-50 text-red-700 border border-red-100" : "bg-green-50 text-green-700 border border-green-100"
                }`}>{r}</span>
              ))}
            </div>
          </div>
          {notification && (
            <div className="pt-3 border-t border-[var(--border)]">
              <span className="inline-flex rounded-xl bg-blue-50 border border-blue-100 px-3 py-1 text-xs font-bold text-blue-700">
                Internal alert status: {notification.status}
              </span>
            </div>
          )}
        </div>
      </div>
      {nonApplicationAction && (
        <section className="border-y border-cyan-200 bg-cyan-50 px-5 py-5">
          <div className="flex items-start gap-3">
            <Send size={18} className="mt-0.5 shrink-0 text-cyan-700" />
            <div>
              <p className="text-sm font-extrabold capitalize text-cyan-950">
                {(plan.automation_level || "manual_review").replace(/_/g, " ")}
              </p>
              <p className="mt-1 text-sm font-bold text-cyan-800">
                {actionTargetLabel(
                  cls.root_cause,
                  plan.target_team_or_module,
                )}
              </p>
              <p className="mt-2 text-xs font-medium text-slate-700">
                {notification?.message || plan.recommended_action}
              </p>
              <p className="mt-2 text-xs font-bold capitalize text-slate-700">
                Status: {(plan.history_status || "suggested").replace(/_/g, " ")}
              </p>
              {validationGuidance.length > 0 && (
                <div className="mt-3">
                  <p className="text-[10px] font-extrabold uppercase text-slate-600">
                    Validation guidance
                  </p>
                  <ul className="mt-1 space-y-1 text-xs text-slate-700">
                    {validationGuidance.map((guidance) => (
                      <li key={guidance} className="font-mono">{guidance}</li>
                    ))}
                  </ul>
                </div>
              )}
              <p className="mt-3 flex items-center gap-1.5 text-xs font-bold text-emerald-700">
                <CheckCircle2 size={14} /> No GitHub changes made
              </p>
            </div>
          </div>
        </section>
      )}
      {repair && canShowControlledRepair(cls.root_cause, plan.allowed_to_plan) && (
        <ControlledRepairPanel
          key={repair.attempt_id}
          repair={repair}
          allowedToPublish={plan.allowed_to_publish}
        />
      )}
    </div>
  );
}

function ControlledRepairPanel({
  repair,
  allowedToPublish,
}: {
  repair: NonNullable<PipelineResult["pipeline"]["repair"]>;
  allowedToPublish: boolean;
}) {
  const [repairPlan, setRepairPlan] = useState<RepairPlan | null>(null);
  const [planning, setPlanning] = useState(false);
  const [planningError, setPlanningError] = useState<string | null>(null);
  const [publishing, setPublishing] = useState(false);
  const [publishError, setPublishError] = useState<string | null>(null);
  const [publishResult, setPublishResult] = useState<RepairPublishResult | null>(null);

  const startControlledRepair = async () => {
    setPlanning(true);
    setPlanningError(null);
    try {
      const body = await failureAnalysisApi.planRepair<RepairPlan>(repair.attempt_id);
      setRepairPlan(body);
    } catch (error: unknown) {
      setPlanningError(
        error instanceof Error
          ? error.message
          : "Read-only repair planning failed.",
      );
    } finally {
      setPlanning(false);
    }
  };

  const publishApprovedRepair = async () => {
    setPublishing(true);
    setPublishError(null);
    try {
      const body = await failureAnalysisApi.publishRepair<RepairPublishResult>(repair.attempt_id);
      setPublishResult(body);
    } catch (error: unknown) {
      setPublishError(
        error instanceof Error
          ? error.message
          : "Controlled repair publishing failed.",
      );
    } finally {
      setPublishing(false);
    }
  };

  return (
    <section className="border-t border-[var(--border)] pt-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="flex items-center gap-2 text-sm font-extrabold text-[var(--foreground)]">
            <Wrench size={16} className="text-indigo-600" />
            Controlled Application Repair
          </p>
          <p className="mt-1 text-xs font-medium text-[var(--muted)]">
            {repair.eligible
              ? "Eligible for a read-only repair proposal."
              : repair.reason}
          </p>
        </div>
        {repair.eligible && !repairPlan && (
          <button
            type="button"
            onClick={startControlledRepair}
            disabled={planning}
            className="inline-flex h-10 items-center gap-2 rounded-lg bg-indigo-600 px-4 text-xs font-bold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {planning ? (
              <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
            ) : (
              <Wrench size={15} />
            )}
            {planning ? "Preparing Proposal" : "Start Controlled Repair"}
          </button>
        )}
      </div>

      {planningError && (
        <div className="mt-4 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-xs font-bold text-red-700">
          <AlertTriangle size={15} />
          {planningError}
        </div>
      )}

      {repairPlan && (
        <div className="mt-5 space-y-5">
          <div className="grid gap-3 border-y border-[var(--border)] py-4 text-xs md:grid-cols-3">
            <div>
              <p className="font-bold text-[var(--muted)]">Confirmed Failure</p>
              <p className="mt-1 break-all font-mono text-slate-800">
                {repairPlan.confirmed_failed_file}
                {repairPlan.confirmed_failed_line
                  ? `:${repairPlan.confirmed_failed_line}`
                  : ""}
              </p>
            </div>
            <div>
              <p className="font-bold text-[var(--muted)]">Exact Revision</p>
              <p className="mt-1 font-mono text-slate-800">
                {repairPlan.base_sha.slice(0, 12)}
              </p>
            </div>
            <div>
              <p className="font-bold text-[var(--muted)]">Repository State</p>
              <p className="mt-1 flex items-center gap-1.5 font-bold text-emerald-700">
                <CheckCircle2 size={14} />
                No GitHub changes made
              </p>
            </div>
          </div>

          <div>
            <p className="mb-2 text-xs font-extrabold uppercase text-[var(--muted)]">
              Inspected Files
            </p>
            <div className="flex flex-wrap gap-2">
              {repairPlan.inspected_files.map((path) => (
                <span
                  key={path}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border)] bg-slate-50 px-2.5 py-1.5 font-mono text-[11px] text-slate-700"
                >
                  <FileCode2 size={13} />
                  {path}
                </span>
              ))}
            </div>
          </div>

          {repairPlan.proposed_changes.map((change, index) => (
            <article
              key={`${change.file_path}:${change.start_line}:${index}`}
              className="border-t border-[var(--border)] pt-5"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="break-all font-mono text-xs font-bold text-slate-800">
                  {change.file_path}:{change.start_line}-{change.end_line}
                </p>
                <span className="rounded-lg border border-blue-100 bg-blue-50 px-2 py-1 text-[10px] font-bold text-blue-700">
                  Proposed only
                </span>
              </div>
              <p className="mt-2 text-xs text-[var(--muted)]">{change.reason}</p>
              <div className="mt-3 grid gap-3 lg:grid-cols-2">
                <div>
                  <p className="mb-1.5 text-[10px] font-extrabold uppercase text-red-700">Before</p>
                  <pre className="max-h-64 overflow-auto rounded-lg border border-red-100 bg-red-50 p-3 text-[11px] leading-5 text-red-900">
                    Code excerpt redacted for security.
                  </pre>
                </div>
                <div>
                  <p className="mb-1.5 text-[10px] font-extrabold uppercase text-emerald-700">After</p>
                  <pre className="max-h-64 overflow-auto rounded-lg border border-emerald-100 bg-emerald-50 p-3 text-[11px] leading-5 text-emerald-900">
                    Code excerpt redacted for security.
                  </pre>
                </div>
              </div>
            </article>
          ))}

          {repairPlan.manual_review_reason && (
            <p className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs font-bold text-amber-800">
              {repairPlan.manual_review_reason}
            </p>
          )}

          <div className="grid gap-5 border-t border-[var(--border)] pt-5 md:grid-cols-2">
            <div>
              <p className="text-xs font-extrabold uppercase text-[var(--muted)]">Risks</p>
              <ul className="mt-2 space-y-1 text-xs text-slate-700">
                {repairPlan.risks.map((risk) => (
                  <li key={risk}>{risk}</li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-xs font-extrabold uppercase text-[var(--muted)]">
                Suggested Validation Commands
              </p>
              <div className="mt-2 space-y-1">
                {repairPlan.suggested_validation_commands.map((command) => (
                  <code
                    key={command}
                    className="block rounded-lg bg-slate-900 px-3 py-2 text-[11px] text-slate-100"
                  >
                    {command}
                  </code>
                ))}
              </div>
            </div>
          </div>

          {!publishResult && repair.eligible && allowedToPublish && repairPlan.repairable && (
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--border)] pt-5">
              <p className="max-w-xl text-xs font-medium leading-5 text-slate-600">
                After approval, the system creates an <code>auto-heal/...</code> branch, one commit, and a draft pull request. It never writes directly to the base branch or merges automatically.
              </p>
              <button
                type="button"
                onClick={publishApprovedRepair}
                disabled={publishing}
                className="inline-flex h-10 items-center gap-2 rounded-lg bg-emerald-700 px-4 text-xs font-bold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {publishing ? (
                  <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                ) : (
                  <GitBranch size={15} />
                )}
                {publishing ? "Publishing Draft Repair" : "Create Repair Branch"}
              </button>
            </div>
          )}

          {publishError && (
            <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-xs font-bold text-red-700">
              <AlertTriangle size={15} className="mt-0.5 shrink-0" />
              <span>{publishError}</span>
            </div>
          )}

          {publishResult && (
            <div className="border-t border-emerald-200 bg-emerald-50 px-4 py-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="flex items-center gap-2 text-sm font-extrabold text-emerald-900">
                    <CheckCircle2 size={17} />
                    {publishResult.message}
                  </p>
                  <p className="mt-2 font-mono text-xs text-emerald-900">
                    {publishResult.repair_branch}
                  </p>
                  <p className="mt-1 font-mono text-xs text-emerald-800">
                    Commit {publishResult.commit_sha.slice(0, 12)}
                  </p>
                  <p className="mt-3 text-xs font-bold text-slate-700">
                    {publishResult.merge_message}
                  </p>
                </div>
                <a
                  href={publishResult.draft_pr_url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex h-10 items-center gap-2 rounded-lg border border-emerald-300 bg-white px-4 text-xs font-bold text-emerald-800 transition hover:bg-emerald-100"
                >
                  Draft PR #{publishResult.draft_pr_number}
                  <ExternalLink size={14} />
                </a>
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
}


