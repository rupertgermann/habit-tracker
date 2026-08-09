import { expect, test } from '@playwright/test'
import {
  expectNoRootOverflow,
  installConsoleErrorGuard,
  localDateKey,
  makeCompletion,
  makeHabit,
  resetAppData,
  waitForAppReady
} from './helpers.js'

const elapsedDaysInCurrentMonth = () => {
  const today = new Date()
  return today.getDate()
}

const firstDayOfCurrentMonth = () => {
  const today = new Date()
  return new Date(today.getFullYear(), today.getMonth(), 1, 8).toISOString()
}

const expectMonthlyTrend = async page => {
  const chart = page.getByRole('group', { name: 'Monthly completion trend' })
  const viewport = page.getByTestId('line-chart-scroller')

  await expect(chart).toBeVisible()
  await expect(viewport).toBeVisible()
  await expect(chart.locator('circle')).toHaveCount(elapsedDaysInCurrentMonth())

  const bounds = await viewport.boundingBox()
  expect(bounds?.width).toBeGreaterThan(0)
  expect(bounds?.height).toBeGreaterThan(0)

  for (const day of new Set([1, elapsedDaysInCurrentMonth()])) {
    const pointBounds = await chart.getByRole('img', { name: new RegExp(`^Day ${day}:`) }).boundingBox()
    const labelBounds = await viewport.getByText(day.toString(), { exact: true }).boundingBox()
    const pointCenter = pointBounds.x + pointBounds.width / 2
    const labelCenter = labelBounds.x + labelBounds.width / 2
    expect(Math.abs(pointCenter - labelCenter)).toBeLessThanOrEqual(1)
  }

  return bounds
}

test.beforeEach(async ({ request }) => {
  await resetAppData(request)
})

test('Monthly Trend renders after load, resize, and reload', async ({ page, request }) => {
  const today = localDateKey()
  await resetAppData(request, {
    habits: [
      makeHabit({
        id: 'monthly-completed-habit',
        name: 'Completed today',
        createdAt: firstDayOfCurrentMonth(),
        completions: [makeCompletion(today)]
      }),
      makeHabit({
        id: 'monthly-incomplete-habit',
        name: 'Incomplete today',
        createdAt: firstDayOfCurrentMonth()
      })
    ]
  })

  await page.setViewportSize({ width: 390, height: 844 })
  const assertNoConsoleErrors = installConsoleErrorGuard(page)

  await page.goto('/progress')
  await waitForAppReady(page)
  const mobileBounds = await expectMonthlyTrend(page)
  await expectNoRootOverflow(page)

  await page.setViewportSize({ width: 1024, height: 768 })
  await expect
    .poll(async () => (await page.getByTestId('line-chart-scroller').boundingBox())?.width)
    .toBeGreaterThan(mobileBounds.width)
  await expectMonthlyTrend(page)
  await expectNoRootOverflow(page)

  await page.reload()
  await waitForAppReady(page)
  await expectMonthlyTrend(page)
  await assertNoConsoleErrors()
})
