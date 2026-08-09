import { expect, test } from '@playwright/test'
import {
  expectNoRootOverflow,
  localDateKey,
  makeCompletion,
  makeHabit,
  resetAppData,
  waitForAppReady
} from './helpers.js'

test.beforeEach(async ({ request }) => {
  await resetAppData(request)
})

test('Current Streak cards identify their Habits', async ({ page, request }) => {
  const today = localDateKey()
  await resetAppData(request, {
    habits: [
      makeHabit({
        id: 'reading-streak-habit',
        name: 'Read a chapter',
        completions: [makeCompletion(today)]
      }),
      makeHabit({
        id: 'walking-streak-habit',
        name: 'Take an evening walk'
      })
    ]
  })

  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/progress')
  await waitForAppReady(page)

  const streakSection = page.getByRole('heading', { name: 'Current Streaks' }).locator('..')
  await expect(streakSection.getByRole('heading', { name: 'Read a chapter' })).toBeVisible()
  await expect(streakSection.getByRole('heading', { name: 'Take an evening walk' })).toBeVisible()
  await expectNoRootOverflow(page)
})
