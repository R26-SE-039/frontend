// ── API Gateway base ────────────────────────────────────────────────────
// All frontend → backend traffic flows through the API Gateway.
// Set VITE_GATEWAY_URL in the deployment env (e.g. Vercel) to the public
// gateway URL, e.g. https://nextgenqasliit.duckdns.org. Falls back to
// localhost for local dev. The WS URL is derived (http→ws, https→wss).
export const GATEWAY_BASE_URL =
  import.meta.env.VITE_GATEWAY_URL || "http://localhost:8080";
export const GATEWAY_WS_URL = GATEWAY_BASE_URL.replace(/^http/, "ws");

// ── Microservices URLs (via API Gateway) ────────────────────────────────
export const AUTH_API_URL = `${GATEWAY_BASE_URL}/api/auth-service`;
export const RAG_API_URL = `${GATEWAY_BASE_URL}/api/story`;
export const WS_BASE_URL = `${GATEWAY_WS_URL}/api/story`;
export const FAILURE_ANALYSIS_API_URL = `${GATEWAY_BASE_URL}/api/failure`;
export const RTM_API_URL = `${GATEWAY_BASE_URL}/api/rtm`;

export const REPAIR_AGENT_API_URL = `${GATEWAY_BASE_URL}/api/repair-agent`;
export const TEST_CASE_API_URL = `${GATEWAY_BASE_URL}/api/test-case`;
export const TEST_CASE_WS_URL = `${GATEWAY_WS_URL}/api/test-case`;
