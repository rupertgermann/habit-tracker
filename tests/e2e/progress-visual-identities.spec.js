import { expect, test } from '@playwright/test'
import {
  expectNoRootOverflow,
  makeCompletion,
  makeHabit,
  resetAppData,
  waitForAppReady
} from './helpers.js'

const referenceDate = new Date(2026, 6, 15, 12)

test.use({ hasTouch: true })

const makeProgressHabits = () => [
  makeHabit({
    id: 'love-habit',
    name: 'Love',
    createdAt: '2026-07-01T08:00:00.000Z',
    completions: [makeCompletion('2026-07-14'), makeCompletion('2026-07-15')]
  }),
  makeHabit({
    id: 'walk-habit',
    name: 'Walk in the Park',
    createdAt: '2026-07-01T08:00:00.000Z',
    completions: [makeCompletion('2026-07-14'), makeCompletion('2026-07-15')]
  }),
  makeHabit({
    id: 'rowing-habit',
    name: 'Rowing',
    createdAt: '2026-07-01T08:00:00.000Z',
    completions: [makeCompletion('2026-07-14')]
  })
]

test.beforeEach(async ({ request }) => {
  await resetAppData(request, { habits: makeProgressHabits() })
})

test('Weekly bars identify their completed and missed Habits on focus and hover', async ({ page }) => {
  await page.setViewportSize({ width: 833, height: 1171 })
  await page.clock.install({ time: referenceDate })
  await page.goto('/progress')
  await waitForAppReady(page)

  const completedBar = page.getByRole('img', {
    name: 'Wed completed: Love, Walk in the Park'
  })
  const missedBar = page.getByRole('img', {
    name: 'Wed missed: Rowing'
  })

  const completedBounds = await completedBar.boundingBox()
  const missedBounds = await missedBar.boundingBox()
  expect(completedBounds?.height).toBeGreaterThanOrEqual(44)
  expect(missedBounds.x - (completedBounds.x + completedBounds.width)).toBeGreaterThanOrEqual(8)

  const weeklyPlot = page.getByTestId('weekly-bars-plot')
  const expectCompactWeek = async () => {
    const dimensions = await weeklyPlot.evaluate(element => ({
      clientWidth: element.clientWidth,
      scrollWidth: element.scrollWidth
    }))
    expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.clientWidth + 1)
    for (const day of ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']) {
      await expect(weeklyPlot.getByText(day, { exact: true })).toBeVisible()
    }
  }
  await expectCompactWeek()
  await completedBar.focus()
  await expect(page.getByRole('tooltip')).toContainText('Completed · Wed')
  await expect(page.getByRole('tooltip')).toContainText('Love, Walk in the Park')

  await missedBar.hover()
  await expect(page.getByRole('tooltip')).toContainText('Missed · Wed')
  await expect(page.getByRole('tooltip')).toContainText('Rowing')

  await page.getByRole('img', { name: 'Mon completed: None' }).focus()
  await expect(page.getByRole('tooltip')).toContainText('No completed Habits')

  await page.getByRole('img', { name: 'Tue missed: None' }).focus()
  await expect(page.getByRole('tooltip')).toContainText('No missed Habits')

  await page.setViewportSize({ width: 390, height: 844 })
  await expectCompactWeek()
  await expectNoRootOverflow(page)
})

test('Monthly points identify involved Habits and leave ineligible dates neutral', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.clock.install({ time: referenceDate })
  await page.goto('/progress')
  await waitForAppReady(page)

  const chart = page.getByRole('group', { name: 'Monthly completion trend' })
  const julyFifteenth = chart.getByRole('img', {
    name: 'Day 15: 67% complete. Completed: Love, Walk in the Park. Missed: Rowing'
  })
  const julyFourteenth = chart.getByRole('img', {
    name: 'Day 14: 100% complete. Completed: Love, Walk in the Park, Rowing. Missed: None'
  })

  await expect(chart.locator('circle')).toHaveCount(15)
  await expect(julyFifteenth).toBeVisible()
  const julyFourteenthBounds = await julyFourteenth.boundingBox()
  const julyFifteenthBounds = await julyFifteenth.boundingBox()
  expect(julyFifteenthBounds?.height).toBeGreaterThanOrEqual(44)
  expect(julyFifteenthBounds?.width).toBeGreaterThanOrEqual(44)
  expect(
    julyFifteenthBounds.x - (julyFourteenthBounds.x + julyFourteenthBounds.width)
  ).toBeGreaterThanOrEqual(8)
  await julyFifteenth.tap()
  await expect(page.getByRole('tooltip')).toContainText('Day 15 · 67% complete')
  await expect(page.getByRole('tooltip')).toContainText('Completed: Love, Walk in the Park')
  await expect(page.getByRole('tooltip')).toContainText('Missed: Rowing')
  await expect(chart.getByRole('img', { name: /Day 16:/ })).toHaveCount(0)
  await expectNoRootOverflow(page)
})
