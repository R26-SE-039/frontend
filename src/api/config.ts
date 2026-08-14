export const AUTH_API_URL = 'http://localhost:3001';
export const RAG_API_URL = 'http://localhost:8001';
export const WS_BASE_URL = 'ws://localhost:8001';

const defaultFailureAnalysisUrl = import.meta.env.DEV ? '/failure-api' : 'http://127.0.0.1:8000';
const defaultRepairAgentUrl = import.meta.env.DEV ? '/repair-agent-api' : 'http://127.0.0.1:8010';
const defaultTestCaseGenUrl = import.meta.env.DEV ? '/test-case-api' : 'http://127.0.0.1:8002';

export const FAILURE_ANALYSIS_API_URL =
  import.meta.env.VITE_FAILURE_ANALYSIS_API_BASE_URL || defaultFailureAnalysisUrl;

export const REPAIR_AGENT_API_URL =
  import.meta.env.VITE_REPAIR_AGENT_API_BASE_URL || defaultRepairAgentUrl;

export const TEST_CASE_API_URL =
  import.meta.env.VITE_TEST_CASE_API_BASE_URL || defaultTestCaseGenUrl;

// WebSockets bypass the Vite dev proxy, so they always target the backend directly.
export const TEST_CASE_WS_URL =
  import.meta.env.VITE_TEST_CASE_WS_BASE_URL || 'ws://127.0.0.1:8002';
