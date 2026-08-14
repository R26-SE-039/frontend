import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const failureAnalysisTarget = env.FAILURE_ANALYSIS_PROXY_TARGET || 'http://127.0.0.1:8000'
  const repairAgentTarget = env.REPAIR_AGENT_PROXY_TARGET || 'http://127.0.0.1:8010'
  const testCaseGenTarget = env.TEST_CASE_PROXY_TARGET || 'http://127.0.0.1:8002'

  return {
    plugins: [
      react(),
      tailwindcss()
    ],
    server: {
      proxy: {
        '/failure-api': {
          target: failureAnalysisTarget,
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/failure-api/, ''),
        },
        '/repair-agent-api': {
          target: repairAgentTarget,
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/repair-agent-api/, ''),
        },
        '/test-case-api': {
          target: testCaseGenTarget,
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/test-case-api/, ''),
        },
      },
    },
  }
})
