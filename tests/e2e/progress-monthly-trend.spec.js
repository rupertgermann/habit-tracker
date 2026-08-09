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
    const pointBounds = await chart.locator('circle').nth(day - 1).boundingBox()
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
    ],
    settings: {
      design: 'quiet-momentum',
      theme: 'dark'
    }
  })

  await page.setViewportSize({ width: 390, height: 844 })
  const assertNoConsoleErrors = installConsoleErrorGuard(page)

  await page.goto('/progress')
  await waitForAppReady(page)
  // Headless Chromium uses overlay scrollbars. Match browsers where the
  // horizontal scrollbar consumes 15px of the chart's content height.
  await page.addStyleTag({
    content: '[data-testid="line-chart-scroller"] { flex: 0 0 185px; }'
  })
  const mobileBounds = await expectMonthlyTrend(page)
  await expectNoRootOverflow(page)

  await page.setViewportSize({ width: 833, height: 1171 })
  await expectMonthlyTrend(page)
  await page.getByRole('group', { name: 'Monthly completion trend' })
    .getByRole('img', { name: /^Day 1:/ })
    .hover()
  await expect(page.getByRole('tooltip')).toContainText('Day 1')
  await expectMonthlyTrend(page)
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
