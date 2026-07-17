import { spawn } from 'node:child_process'
import { mkdirSync, rmSync } from 'node:fs'
import path from 'node:path'
import { chromium, expect } from '@playwright/test'

const root = process.cwd()
const outputDir = path.join(root, 'docs', 'images')
const tmpDir = path.join(root, '.tmp', 'screenshots')
const dbPath = path.join(tmpDir, 'habit-tracker.db')
const clientPort = process.env.SCREENSHOT_CLIENT_PORT || '3330'
const apiPort = process.env.SCREENSHOT_API_PORT || '3331'
const baseURL = `http://127.0.0.1:${clientPort}`
const apiURL = `http://127.0.0.1:${apiPort}`
const generatedAt = new Date()

mkdirSync(outputDir, { recursive: true })
mkdirSync(tmpDir, { recursive: true })
for (const suffix of ['', '-shm', '-wal']) {
  rmSync(`${dbPath}${suffix}`, { force: true })
}

const bin = command => path.join(
  root,
  'node_modules',
  '.bin',
  process.platform === 'win32' ? `${command}.cmd` : command
)

const env = {
  ...process.env,
  HABIT_TRACKER_DB_PATH: dbPath,
  HABIT_TRACKER_E2E: 'true',
  HOST: '127.0.0.1',
  PORT: apiPort,
  VITE_API_TARGET: apiURL,
  VITE_OPEN: 'false'
}

const processes = []
const logs = []

const start = (label, command, args) => {
  const child = spawn(command, args, {
    cwd: root,
    env,
    stdio: ['ignore', 'pipe', 'pipe']
  })

  processes.push(child)
  child.stdout.on('data', chunk => logs.push(`[${label}] ${chunk}`))
  child.stderr.on('data', chunk => logs.push(`[${label}] ${chunk}`))
  return child
}

const stopProcesses = () => {
  for (const child of processes) {
    if (!child.killed) child.kill('SIGTERM')
  }
}

const waitFor = async (url, timeoutMs = 60_000) => {
  const deadline = Date.now() + timeoutMs
  let lastError

  while (Date.now() < deadline) {
    try {
      const response = await fetch(url)
      if (response.ok) return
      lastError = new Error(`${url} returned ${response.status}`)
    } catch (error) {
      lastError = error
    }

    await new Promise(resolve => setTimeout(resolve, 500))
  }

  throw lastError || new Error(`Timed out waiting for ${url}`)
}

const dateKey = offset => {
  const date = new Date(generatedAt)
  date.setDate(date.getDate() + offset)
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0')
  ].join('-')
}

const completion = (offset, hour) => {
  const date = dateKey(offset)
  return {
    date,
    completedAt: `${date}T${String(hour).padStart(2, '0')}:00:00.000Z`
  }
}

const habit = overrides => ({
  description: '',
  frequency: 'daily',
  daysPerWeek: 3,
  selectedDays: [false, false, false, false, false, false, false],
  reminders: [],
  createdAt: new Date(generatedAt.getTime() - 20 * 24 * 60 * 60 * 1000).toISOString(),
  completions: [],
  streak: 0,
  longestStreak: 0,
  ...overrides
})

const screenshotState = {
  habits: [
    habit({
      id: 'example-deep-work',
      name: 'Deep Work Block',
      description: 'Protect one focused build session before Slack.',
      type: 'binary',
      dailyTarget: null,
      color: '#0EA5E9',
      icon: 'laptop',
      category: 'productivity',
      reminders: [{ id: 'deep-work-morning', time: '09:00' }],
      completions: [completion(0, 8), completion(-1, 8), completion(-2, 9), completion(-4, 8), completion(-5, 9), completion(-6, 8)],
      streak: 3,
      longestStreak: 12
    }),
    habit({
      id: 'example-hydration',
      name: 'Hydration',
      description: 'Log glasses of water during the day.',
      type: 'count',
      dailyTarget: 8,
      color: '#4CAF50',
      icon: 'droplet',
      category: 'health',
      completions: [
        completion(0, 7),
        completion(0, 10),
        completion(0, 13),
        completion(0, 16),
        completion(-1, 8),
        completion(-1, 12),
        completion(-1, 17),
        completion(-2, 9),
        completion(-2, 11),
        completion(-3, 9),
        completion(-4, 10),
        completion(-4, 14)
      ],
      streak: 5,
      longestStreak: 18
    }),
    habit({
      id: 'example-reading',
      name: 'Read Systems Notes',
      description: 'Read or annotate product engineering notes.',
      type: 'binary',
      dailyTarget: null,
      color: '#8B5CF6',
      icon: 'books',
      category: 'learning',
      completions: [completion(-1, 21), completion(-3, 20), completion(-6, 19), completion(-7, 21)],
      streak: 0,
      longestStreak: 9
    }),
    habit({
      id: 'example-journal',
      name: 'Ship Reflection',
      description: 'Write one sentence about what moved today.',
      type: 'binary',
      dailyTarget: null,
      color: '#EC4899',
      icon: 'notebook',
      category: 'creativity',
      completions: [completion(0, 21), completion(-1, 21), completion(-2, 22), completion(-3, 20)],
      streak: 4,
      longestStreak: 7
    })
  ],
  categories: [],
  journalEntries: [
    {
      id: 'example-journal-today',
      habitId: 'example-journal',
      date: dateKey(0),
      content: 'Captured the tradeoff while the implementation was still fresh.',
      moodId: 'good',
      createdAt: new Date(generatedAt).toISOString()
    },
    {
      id: 'example-journal-yesterday',
      habitId: 'example-deep-work',
      date: dateKey(-1),
      content: 'Kept the first hour quiet and finished the regression pass.',
      moodId: 'very-good',
      createdAt: new Date(generatedAt).toISOString()
    }
  ],
  settings: {
    profile: {
      name: 'Rupert',
      email: 'rupert@example.com',
      avatarImage: null
    },
    design: 'standard',
    theme: 'light',
    preferences: {
      weekStartsOn: 1
    }
  }
}

const designScreenshots = [
  { design: 'standard', file: 'readme-dashboard-light.png' },
  { design: 'rhythm-ledger', file: 'readme-dashboard-rhythm-ledger.png' },
  { design: 'orbit', file: 'readme-dashboard-orbit.png' },
  { design: 'quiet-momentum', file: 'readme-dashboard-quiet-momentum.png' },
  { design: 'sunday-club', file: 'readme-dashboard-sunday-club.png' }
]

const restoreState = async settings => {
  const response = await fetch(`${baseURL}/api/restore`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ...screenshotState,
      settings: {
        ...screenshotState.settings,
        ...settings
      }
    })
  })

  if (!response.ok) {
    throw new Error(`Failed to seed screenshot state: ${response.status}`)
  }
}

const waitForSettledFrame = async page => {
  await page.waitForLoadState('networkidle')
  await page.waitForTimeout(600)
}

try {
  start('server', process.execPath, ['server/index.js'])
  start('client', bin('vite'), ['--host', '127.0.0.1', '--port', clientPort, '--strictPort'])

  await waitFor(`${apiURL}/api/runtime`)
  await waitFor(`${baseURL}/api/runtime`)

  const browser = await chromium.launch()
  const desktopContext = await browser.newContext({
    baseURL,
    viewport: { width: 1280, height: 900 },
    deviceScaleFactor: 1
  })
  const desktopPage = await desktopContext.newPage()

  for (const screenshot of designScreenshots) {
    await restoreState({ design: screenshot.design, theme: 'light' })
    await desktopPage.goto('/')
    await expect(desktopPage.locator('html')).toHaveAttribute('data-design', screenshot.design)
    await expect(desktopPage.getByText('Deep Work Block')).toBeVisible()
    await waitForSettledFrame(desktopPage)
    await desktopPage.evaluate(() => window.scrollTo(0, 0))
    await desktopPage.screenshot({
      path: path.join(outputDir, screenshot.file)
    })
  }

  await restoreState({ design: 'standard', theme: 'light' })
  await desktopPage.goto('/settings')
  const designPicker = desktopPage.getByRole('radiogroup', { name: 'App design' })
  await expect(designPicker.getByRole('radio')).toHaveCount(5)
  await waitForSettledFrame(desktopPage)
  const appearanceSection = desktopPage.getByRole('heading', { name: 'Appearance' }).locator('..')
  await appearanceSection.screenshot({
    path: path.join(outputDir, 'readme-settings-appearance.png')
  })

  await desktopContext.close()

  const mobileContext = await browser.newContext({
    baseURL,
    viewport: { width: 390, height: 900 },
    deviceScaleFactor: 2
  })
  const mobilePage = await mobileContext.newPage()

  await restoreState({ design: 'standard', theme: 'dark' })
  await mobilePage.goto('/')
  await expect(mobilePage.getByRole('heading', { name: 'Dashboard', exact: true })).toBeVisible()
  await expect(mobilePage.getByText('Deep Work Block')).toBeVisible()
  await waitForSettledFrame(mobilePage)
  await mobilePage.screenshot({
    path: path.join(outputDir, 'readme-dashboard-dark.png')
  })

  await mobilePage.goto('/calendar')
  await expect(mobilePage.getByRole('heading', { name: 'Calendar', exact: true })).toBeVisible()
  await expect(mobilePage.getByText('This Month: Days Said')).toBeVisible()
  await waitForSettledFrame(mobilePage)
  await mobilePage.screenshot({
    path: path.join(outputDir, 'readme-calendar-dark.png')
  })

  await mobileContext.close()
  await browser.close()
  for (const screenshot of designScreenshots) {
    console.log(`Captured docs/images/${screenshot.file}`)
  }
  console.log('Captured docs/images/readme-settings-appearance.png')
  console.log('Captured docs/images/readme-dashboard-dark.png')
  console.log('Captured docs/images/readme-calendar-dark.png')
} catch (error) {
  console.error(error)
  console.error(logs.join(''))
  process.exitCode = 1
} finally {
  stopProcesses()
}
