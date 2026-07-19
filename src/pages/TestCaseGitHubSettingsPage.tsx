import { useEffect, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  GitBranch,
  KeyRound,
  Link2,
  RefreshCw,
  ShieldCheck,
  Trash2,
  Unplug,
} from 'lucide-react';
import { testCaseApi } from '../api/testCaseApi';
import type { GitHubConnection, GitHubPingResponse, GitHubValidateResponse } from '../types/testCase';
import TestCasePill from '../components/testCase/TestCasePill';

const inputCls =
  'w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 outline-none transition-all focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100';

export default function TestCaseGitHubSettingsPage() {
  const [projectId, setProjectId] = useState<string | null>(null);
  const [connection, setConnection] = useState<GitHubConnection | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [token, setToken] = useState('');
  const [validating, setValidating] = useState(false);
  const [validation, setValidation] = useState<GitHubValidateResponse | null>(null);
  const [selectedRepoFull, setSelectedRepoFull] = useState('');
  const [connecting, setConnecting] = useState(false);
  const [workflowConflict, setWorkflowConflict] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const [pinging, setPinging] = useState(false);
  const [pingResult, setPingResult] = useState<GitHubPingResponse | null>(null);
  const [confirmDisconnect, setConfirmDisconnect] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const id = await testCaseApi.ensureProject();
        setProjectId(id);
        setConnection(await testCaseApi.getGitHubConnection(id));
      } catch (err: any) {
        setError(err.message || 'Failed to load the GitHub connection');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleValidate = async () => {
    setValidating(true);
    setError(null);
    setValidation(null);
    try {
      const result = await testCaseApi.validateGitHubToken(token.trim());
      setValidation(result);
      setSelectedRepoFull(result.repos[0]?.full_name ?? '');
    } catch (err: any) {
      setError(err.message || 'Token validation failed');
    } finally {
      setValidating(false);
    }
  };

  const handleConnect = async (force = false) => {
    if (!projectId || !validation) return;
    const repo = validation.repos.find((item) => item.full_name === selectedRepoFull);
    if (!repo) return;
    setConnecting(true);
    setError(null);
    setWorkflowConflict(null);
    try {
      const response = await testCaseApi.connectGitHub(projectId, {
        token: token.trim(),
        owner: repo.owner,
        repo: repo.name,
        default_branch: repo.default_branch,
        force_workflow_overwrite: force,
      });
      setConnection(response.connection);
      if (response.workflow_status === 'conflict') {
        setWorkflowConflict(response.workflow_message);
      } else {
        setNotice(response.workflow_message);
        setToken('');
        setValidation(null);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to connect the repository');
    } finally {
      setConnecting(false);
    }
  };

  const handleReinstall = async () => {
    if (!projectId) return;
    setConnecting(true);
    setError(null);
    try {
      const response = await testCaseApi.reinstallGitHubWorkflow(projectId);
      setConnection(response.connection);
      setNotice(response.workflow_message);
      setWorkflowConflict(null);
    } catch (err: any) {
      setError(err.message || 'Failed to reinstall the workflow');
    } finally {
      setConnecting(false);
    }
  };

  const handlePing = async () => {
    if (!projectId) return;
    setPinging(true);
    setError(null);
    setPingResult(null);
    try {
      setPingResult(await testCaseApi.pingGitHubConnection(projectId));
    } catch (err: any) {
      setError(err.message || 'Connection test failed');
    } finally {
      setPinging(false);
    }
  };

  const handleDisconnect = async () => {
    if (!projectId) return;
    setError(null);
    try {
      await testCaseApi.disconnectGitHub(projectId);
      setConnection(null);
      setPingResult(null);
      setConfirmDisconnect(false);
      setNotice('Repository disconnected. The workflow file on the repo was left intact.');
    } catch (err: any) {
      setError(err.message || 'Failed to disconnect');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-100 border-t-indigo-600" />
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-3xl">
      <div>
        <h2 className="text-2xl font-extrabold tracking-tight text-[var(--foreground)]">GitHub Connection</h2>
        <p className="text-xs text-[var(--muted)] mt-1">
          Link a repository so generated suites run on GitHub Actions. The token is encrypted at rest and the CI workflow
          is installed automatically.
        </p>
      </div>

      {error && (
        <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          <AlertTriangle size={18} className="shrink-0" />
          {error}
        </div>
      )}
      {notice && (
        <div className="flex items-center gap-3 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-700">
          <CheckCircle2 size={18} className="shrink-0" />
          {notice}
        </div>
      )}
      {workflowConflict && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-700">
          <div className="flex items-center gap-3">
            <AlertTriangle size={18} className="shrink-0" />
            {workflowConflict}
          </div>
          <button
            type="button"
            onClick={() => handleConnect(true)}
            disabled={connecting}
            className="rounded-lg bg-amber-600 px-4 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-amber-700 disabled:opacity-50"
          >
            Overwrite anyway
          </button>
        </div>
      )}

      {connection ? (
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] shadow-sm overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 p-6">
            <div className="flex items-center gap-4">
              {connection.github_user_avatar_url ? (
                <img src={connection.github_user_avatar_url} alt="GitHub avatar" className="h-12 w-12 rounded-xl border border-slate-200" />
              ) : (
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                  <GitBranch size={20} />
                </div>
              )}
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-mono text-sm font-black text-slate-900">{connection.repo_full}</h3>
                  <a
                    href={`https://github.com/${connection.repo_full}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-slate-300 transition hover:text-indigo-600"
                  >
                    <ExternalLink size={14} />
                  </a>
                </div>
                <p className="mt-1 text-[10px] font-black uppercase tracking-widest text-slate-400">
                  {connection.github_user_login ? `@${connection.github_user_login} · ` : ''}branch {connection.default_branch} · token {connection.token_preview}
                </p>
              </div>
            </div>
            <TestCasePill label={connection.workflow_installed ? 'workflow installed' : 'workflow missing'} type={connection.workflow_installed ? 'approval' : 'run'} />
          </div>

          <div className="space-y-4 p-6">
            {pingResult && (
              <div
                className={`flex flex-wrap items-center gap-3 rounded-xl border px-4 py-3 text-sm font-medium ${
                  pingResult.ok ? 'border-green-200 bg-green-50 text-green-700' : 'border-red-200 bg-red-50 text-red-700'
                }`}
              >
                {pingResult.ok ? <ShieldCheck size={18} className="shrink-0" /> : <AlertTriangle size={18} className="shrink-0" />}
                {pingResult.ok
                  ? `Token valid as @${pingResult.login} · workflow ${pingResult.workflow_present ? 'present' : 'missing'} · ${pingResult.rate_limit_remaining ?? '—'} API calls remaining`
                  : pingResult.detail || 'Connection test failed'}
              </div>
            )}

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={handlePing}
                disabled={pinging}
                className="inline-flex items-center gap-2 rounded-lg border border-indigo-100 bg-indigo-50 px-4 py-2 text-xs font-bold text-indigo-600 transition hover:bg-indigo-100 disabled:opacity-50"
              >
                <RefreshCw size={14} className={pinging ? 'animate-spin' : ''} /> {pinging ? 'Testing...' : 'Test Connection'}
              </button>
              <button
                type="button"
                onClick={handleReinstall}
                disabled={connecting}
                className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-500 transition hover:text-indigo-600 disabled:opacity-50"
              >
                <Link2 size={14} /> Reinstall Workflow
              </button>
              {confirmDisconnect ? (
                <span className="inline-flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleDisconnect}
                    className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-red-700"
                  >
                    <Trash2 size={14} /> Confirm Disconnect
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmDisconnect(false)}
                    className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-500"
                  >
                    Cancel
                  </button>
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmDisconnect(true)}
                  className="inline-flex items-center gap-2 rounded-lg border border-red-100 bg-red-50 px-4 py-2 text-xs font-bold text-red-600 transition hover:bg-red-100"
                >
                  <Unplug size={14} /> Disconnect
                </button>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-sm space-y-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
              <KeyRound size={18} />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900">Step 1 · Personal Access Token</h3>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                Needs the “repo” and “workflow” scopes
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <input
              type="password"
              className={`${inputCls} flex-1 min-w-64 font-mono`}
              value={token}
              onChange={(e) => {
                setToken(e.target.value);
                setValidation(null);
              }}
              placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
            />
            <button
              type="button"
              onClick={handleValidate}
              disabled={!token.trim() || validating}
              className="rounded-xl bg-indigo-600 px-5 py-2 text-xs font-bold text-white shadow-md shadow-indigo-200 transition hover:bg-indigo-700 disabled:opacity-50"
            >
              {validating ? 'Validating...' : 'Validate Token'}
            </button>
          </div>

          {validation && (
            <div className="space-y-4 rounded-xl border border-slate-100 bg-slate-50/60 p-5">
              <div className="flex items-center gap-3">
                {validation.avatar_url && <img src={validation.avatar_url} alt="GitHub avatar" className="h-10 w-10 rounded-xl border border-slate-200" />}
                <div>
                  <p className="text-sm font-black text-slate-900">@{validation.login}</p>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                    {validation.repo_count} repositories accessible
                  </p>
                </div>
              </div>

              <div>
                <label className="mb-1 block text-[10px] font-black uppercase tracking-widest text-slate-400">
                  Step 2 · Choose the repository
                </label>
                <select className={inputCls} value={selectedRepoFull} onChange={(e) => setSelectedRepoFull(e.target.value)}>
                  {validation.repos.map((repo) => (
                    <option key={repo.full_name} value={repo.full_name}>
                      {repo.full_name}
                      {repo.private ? ' (private)' : ''}
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="button"
                onClick={() => handleConnect(false)}
                disabled={!selectedRepoFull || connecting}
                className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-indigo-200 transition hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50"
              >
                <GitBranch size={14} /> {connecting ? 'Connecting...' : 'Connect & Install Workflow'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
