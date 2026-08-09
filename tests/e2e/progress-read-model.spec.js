import { expect, test } from '@playwright/test'
import {
  makeCompletion,
  makeHabit,
  resetAppData,
  waitForAppReady
} from './helpers.js'

test.beforeEach(async ({ request }) => {
  await resetAppData(request)
})

test('Progress uses one coherent reference date and rolls over at local midnight', async ({ page, request }) => {
  await resetAppData(request, {
    habits: [
      makeHabit({
        id: 'midmonth-reader',
        name: 'Read a chapter',
        createdAt: '2026-07-15T08:00:00.000Z',
        completions: [makeCompletion('2026-07-15')]
      }),
      makeHabit({
        id: 'future-habit',
        name: 'Starts tomorrow',
        createdAt: '2026-07-16T08:00:00.000Z'
      })
    ]
  })
  await page.clock.install({ time: new Date(2026, 6, 15, 23, 59, 50) })

  await page.goto('/progress')
  await waitForAppReady(page)

  await expect(page.getByRole('img', { name: 'Sun missed: None' })).toBeVisible()
  await expect(page.getByRole('img', { name: 'Wed completed: Read a chapter' })).toBeVisible()
  await expect(page.getByText("Today's Rate", { exact: true }).locator('..').getByText('100%')).toBeVisible()
  await expect(page.getByText('1/1 habits', { exact: true })).toBeVisible()

  const readerStreak = page.getByRole('heading', { name: 'Read a chapter' }).locator('../../..')
  const neutralDay = readerStreak.getByRole('img', { name: 'Tue 14: not tracked' })
  await expect(neutralDay).toHaveCSS('border-style', 'dashed')
  await expect(neutralDay.locator('..')).toHaveAttribute('data-day-status', 'neutral')

  await page.clock.fastForward(12_000)

  await expect(page.getByText("Today's Rate", { exact: true }).locator('..').getByText('0%')).toBeVisible()
  await expect(page.getByText('0/2 habits', { exact: true })).toBeVisible()
  await expect(page.getByRole('img', {
    name: 'Thu missed: Read a chapter, Starts tomorrow'
  })).toBeVisible()
})
