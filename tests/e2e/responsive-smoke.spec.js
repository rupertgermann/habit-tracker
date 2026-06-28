import { test, expect } from '@playwright/test'
import {
  addDays,
  expectNoRootOverflow,
  installConsoleErrorGuard,
  localDateKey,
  makeCompletion,
  makeHabit,
  makeJournalEntry,
  resetAppData,
  waitForAppReady
} from './helpers.js'

const viewports = [
  { name: 'mobile', size: { width: 320, height: 720 } },
  { name: 'desktop', size: { width: 1280, height: 900 } }
]

const escapeRegExp = value => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

const buildSmokeState = () => {
  const today = new Date()
  const todayKey = localDateKey(today)
  const yesterdayKey = localDateKey(addDays(today, -1))
  const sixDaysAgoKey = localDateKey(addDays(today, -6))

  const stretchHabit = makeHabit({
    id: 'responsive-smoke-stretch',
    name: 'Responsive Smoke Stretch',
    icon: 'S',
    category: 'health',
    completions: [
      makeCompletion(todayKey, 7),
      makeCompletion(yesterdayKey, 8),
      makeCompletion(sixDaysAgoKey, 9)
    ]
  })

  const readingHabit = makeHabit({
    id: 'responsive-smoke-reading',
    name: 'Responsive Smoke Reading',
    type: 'count',
    dailyTarget: 3,
    icon: 'R',
    category: 'learning',
    completions: [
      makeCompletion(todayKey, 10),
      makeCompletion(todayKey, 11),
      makeCompletion(yesterdayKey, 12)
    ]
  })

  return {
    primaryHabitId: stretchHabit.id,
    primaryHabitName: stretchHabit.name,
    habits: [stretchHabit, readingHabit],
    journalEntries: [
      makeJournalEntry({
        id: 'responsive-smoke-journal-today',
        habitId: stretchHabit.id,
        date: todayKey,
        content: 'Responsive smoke journal entry for today.',
        moodId: 'happy'
      }),
      makeJournalEntry({
        id: 'responsive-smoke-journal-yesterday',
        habitId: readingHabit.id,
        date: yesterdayKey,
        content: 'Responsive smoke journal entry for yesterday.',
        moodId: 'neutral'
      })
    ]
  }
}

const expectSurfaceReady = async (page, path, headingName) => {
  const headingOptions = typeof headingName === 'string'
    ? { level: 1, name: headingName, exact: true }
    : { level: 1, name: headingName }

  await page.goto(path)
  await waitForAppReady(page)
  await expect(page.getByRole('heading', headingOptions)).toBeVisible()
  await expectNoRootOverflow(page)
}

const expectCalendarMode = async (page, modeName, periodLabel) => {
  await page.getByRole('button', { name: modeName, exact: true }).click()
  await expect(page.getByText(periodLabel, { exact: false })).toBeVisible()
  await expectNoRootOverflow(page)
}

const relativeLuminance = ({ r, g, b }) => {
  const toLinear = channel => {
    const value = channel / 255
    return value <= 0.03928
      ? value / 12.92
      : ((value + 0.055) / 1.055) ** 2.4
  }

  return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b)
}

const contrastRatio = (foreground, background) => {
  const lighter = Math.max(relativeLuminance(foreground), relativeLuminance(background))
  const darker = Math.min(relativeLuminance(foreground), relativeLuminance(background))
  return (lighter + 0.05) / (darker + 0.05)
}

const parseRgb = value => {
  const [, r, g, b] = value.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/) || []
  return {
    r: Number(r),
    g: Number(g),
    b: Number(b)
  }
}

test.describe('responsive smoke coverage', () => {
  test.afterEach(async ({ request }) => {
    await resetAppData(request)
  })

  for (const viewport of viewports) {
    test(`${viewport.name} covers primary app surfaces without overflow or console errors`, async ({ page, request }) => {
      const smokeState = buildSmokeState()
      await resetAppData(request, smokeState)
      await page.setViewportSize(viewport.size)
      const assertNoConsoleErrors = installConsoleErrorGuard(page)

      await expectSurfaceReady(page, '/', 'Dashboard')
      await expect(page.getByText(smokeState.primaryHabitName)).toBeVisible()

      await expectSurfaceReady(page, '/habits', 'Habits')
      await expect(page.getByText(smokeState.primaryHabitName)).toBeVisible()

      await expectSurfaceReady(page, '/calendar', 'Calendar')
      await expect(page.getByLabel('Select habit to view')).toBeVisible()
      await expectCalendarMode(page, 'Month', 'This Month: Days Said')
      await expectCalendarMode(page, 'Week', 'This Week: Days Said')
      await expectCalendarMode(page, 'Year', 'This Year: Days Said')

      await expectSurfaceReady(page, '/journal', 'Journal')
      await expect(page.getByText('Responsive smoke journal entry for today.')).toBeVisible()

      await expectSurfaceReady(page, '/progress', 'Progress')
      await expect(page.getByText('Total Habits')).toBeVisible()

      await expectSurfaceReady(
        page,
        `/habit/${smokeState.primaryHabitId}`,
        new RegExp(escapeRegExp(smokeState.primaryHabitName))
      )
      await expect(page.getByText('Journal Reflection')).toBeVisible()

      await assertNoConsoleErrors()
    })
  }

  test('calendar heatmap cells keep readable contrast in dark mode', async ({ page, request }) => {
    const smokeState = buildSmokeState()
    await resetAppData(request, smokeState)
    await page.addInitScript(() => window.localStorage.setItem('theme', 'dark'))
    await page.goto('/calendar')
    await waitForAppReady(page)
    await expect(page.getByRole('heading', { name: 'Calendar', exact: true })).toBeVisible()

    const dayCell = page.locator('[role="button"][aria-label^="Select "]').first()
    await expect(dayCell).toBeVisible()

    const colors = await dayCell.evaluate(element => {
      const label = element.querySelector('span')
      return {
        background: getComputedStyle(element).backgroundColor,
        text: getComputedStyle(label).color
      }
    })

    const background = parseRgb(colors.background)
    const text = parseRgb(colors.text)

    expect(relativeLuminance(background)).toBeLessThan(0.12)
    expect(contrastRatio(text, background)).toBeGreaterThanOrEqual(4.5)
    await expectNoRootOverflow(page)
  })
})
