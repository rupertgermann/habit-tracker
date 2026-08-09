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
        icon: 'book',
        completions: [makeCompletion(today)]
      }),
      makeHabit({
        id: 'walking-streak-habit',
        name: 'Take an evening walk',
        icon: 'walk'
      })
    ]
  })

  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/progress')
  await waitForAppReady(page)

  const streakSection = page.getByRole('heading', { name: 'Current Streaks' }).locator('..')
  const readingTitle = streakSection.getByRole('heading', { name: 'Read a chapter' })
  const walkingTitle = streakSection.getByRole('heading', { name: 'Take an evening walk' })
  await expect(readingTitle).toBeVisible()
  await expect(walkingTitle).toBeVisible()
  await expect(readingTitle.locator('..').locator('svg[aria-hidden="true"]')).toBeVisible()
  await expect(walkingTitle.locator('..').locator('svg[aria-hidden="true"]')).toBeVisible()
  await expectNoRootOverflow(page)
})
