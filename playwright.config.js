import { defineConfig } from '@playwright/test'

const e2eClientPort = process.env.E2E_CLIENT_PORT || '3340'
const e2eBaseURL = `http://127.0.0.1:${e2eClientPort}`

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 45_000,
  expect: {
    timeout: 7_500
  },
  fullyParallel: false,
  workers: 1,
  reporter: 'list',
  use: {
    baseURL: e2eBaseURL,
    trace: 'retain-on-failure'
  },
  webServer: {
    command: 'npm run dev:e2e',
    url: e2eBaseURL,
    timeout: 120_000,
    reuseExistingServer: false
  }
})
