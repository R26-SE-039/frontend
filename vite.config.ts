import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  // All dev traffic is routed through the API Gateway.
  // Individual proxy targets default to the gateway; override via .env if needed.
  const gatewayUrl = env.VITE_API_GATEWAY_URL || 'http://localhost:8080'
  const failureAnalysisTarget = env.FAILURE_ANALYSIS_PROXY_TARGET || gatewayUrl
  const repairAgentTarget = env.REPAIR_AGENT_PROXY_TARGET || gatewayUrl
  const testCaseGenTarget = env.TEST_CASE_PROXY_TARGET || gatewayUrl

  return {
    plugins: [
      react(),
      tailwindcss()
    ],
    server: {
      proxy: {
        // /failure-api/... → gateway → /api/failure/...
        '/failure-api': {
          target: failureAnalysisTarget,
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/failure-api/, '/api/failure'),
        },
        // /repair-agent-api/... → gateway → /api/repair-agent/...
        '/repair-agent-api': {
          target: repairAgentTarget,
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/repair-agent-api/, '/api/repair-agent'),
        },
        // /test-case-api/... → gateway → /api/test-case/...
        '/test-case-api': {
          target: testCaseGenTarget,
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/test-case-api/, '/api/test-case'),
        },
      },
    },
  }
})
