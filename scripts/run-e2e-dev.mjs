import { spawn } from 'node:child_process'
import { mkdirSync } from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const tmpDir = path.join(root, '.tmp', 'e2e')
const clientPort = process.env.E2E_CLIENT_PORT || '3340'
const apiPort = process.env.E2E_API_PORT || '3341'
mkdirSync(tmpDir, { recursive: true })

const concurrentlyBin = path.join(
  root,
  'node_modules',
  '.bin',
  process.platform === 'win32' ? 'concurrently.cmd' : 'concurrently'
)

const env = {
  ...process.env,
  HABIT_TRACKER_DB_PATH: path.join(tmpDir, 'habit-tracker.db'),
  HABIT_TRACKER_E2E: 'true',
  HOST: '127.0.0.1',
  PORT: apiPort,
  VITE_API_TARGET: `http://127.0.0.1:${apiPort}`,
  VITE_OPEN: 'false'
}

const child = spawn(concurrentlyBin, [
  '-n',
  'server,client',
  '-c',
  'blue,green',
  'node server/index.js',
  `vite --host 127.0.0.1 --port ${clientPort} --strictPort`
], {
  cwd: root,
  env,
  stdio: 'inherit'
})

const stop = (signal) => {
  if (!child.killed) child.kill(signal)
}

process.on('SIGINT', () => stop('SIGINT'))
process.on('SIGTERM', () => stop('SIGTERM'))

child.on('exit', (code, signal) => {
  if (signal) process.kill(process.pid, signal)
  process.exit(code ?? 0)
})
