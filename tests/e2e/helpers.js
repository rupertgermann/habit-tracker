import { expect } from '@playwright/test'

export const localDateKey = (date = new Date()) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

export const addDays = (date, amount) => {
  const next = new Date(date)
  next.setDate(next.getDate() + amount)
  return next
}

export const makeHabit = (overrides = {}) => ({
  id: `habit-${Math.random().toString(36).slice(2)}`,
  name: 'E2E Habit',
  description: '',
  type: 'binary',
  dailyTarget: null,
  frequency: 'daily',
  daysPerWeek: 3,
  selectedDays: [false, false, false, false, false, false, false],
  color: '#6CC47C',
  icon: 'H',
  category: 'other',
  reminders: [],
  createdAt: new Date().toISOString(),
  completions: [],
  streak: 0,
  longestStreak: 0,
  ...overrides
})

export const makeCompletion = (date, hour = 9) => ({
  date,
  completedAt: `${date}T${String(hour).padStart(2, '0')}:00:00.000Z`
})

export const makeJournalEntry = (overrides = {}) => ({
  id: `journal-${Math.random().toString(36).slice(2)}`,
  habitId: '',
  date: localDateKey(),
  content: 'E2E journal entry',
  moodId: 'neutral',
  createdAt: new Date().toISOString(),
  ...overrides
})

let e2eRuntimeVerified = false

export const expectE2ERuntime = async (request) => {
  if (e2eRuntimeVerified) return

  const response = await request.get('/api/runtime')
  expect(response.ok(), 'E2E tests require an API runtime marker before resetting data').toBe(true)

  const runtime = await response.json()
  expect(
    runtime.e2e,
    'Refusing to reset app data because the API is not using the e2e temp database'
  ).toBe(true)
  e2eRuntimeVerified = true
}

export const resetAppData = async (request, state = {}) => {
  await expectE2ERuntime(request)
  const clearResponse = await request.delete('/api/data')
  expect(clearResponse.ok()).toBe(true)
  const clearedState = await clearResponse.json()

  await request.post('/api/restore', {
    data: {
      habits: state.habits || [],
      categories: state.categories ?? clearedState.categories,
      journalEntries: state.journalEntries || [],
      settings: state.settings || {}
    }
  })
}

export const waitForAppReady = async (page) => {
  await expect(page.locator('body')).toBeVisible()
  await page.waitForLoadState('networkidle')
}

export const expectNoRootOverflow = async (page) => {
  const overflow = await page.evaluate(() => {
    const root = document.documentElement
    const body = document.body
    return Math.max(root.scrollWidth, body.scrollWidth) - root.clientWidth
  })

  expect(overflow).toBeLessThanOrEqual(1)
}

export const installConsoleErrorGuard = (page) => {
  const errors = []

  page.on('console', message => {
    if (message.type() === 'error') {
      errors.push(message.text())
    }
  })

  page.on('pageerror', error => {
    errors.push(error.message)
  })

  return async () => {
    expect(errors).toEqual([])
  }
}
