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

const designIds = [
  'standard',
  'rhythm-ledger',
  'orbit',
  'quiet-momentum',
  'sunday-club'
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
  const [, r, g, b, alpha] = value.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?/) || []
  return {
    r: Number(r),
    g: Number(g),
    b: Number(b),
    a: alpha === undefined ? 1 : Number(alpha)
  }
}

const visibleRgb = (foreground, background) => {
  if (!Number.isFinite(foreground.a) || foreground.a >= 1) return foreground

  return {
    r: foreground.r * foreground.a + background.r * (1 - foreground.a),
    g: foreground.g * foreground.a + background.g * (1 - foreground.a),
    b: foreground.b * foreground.a + background.b * (1 - foreground.a),
    a: 1
  }
}

const formatCalendarButtonName = date => {
  const label = new Intl.DateTimeFormat('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  }).format(date)

  return `Select ${label}`
}

const dateFromLocalDateKey = dateKey => {
  const [year, month, day] = dateKey.split('-').map(Number)
  return new Date(year, month - 1, day)
}

const getUnmarkedMonthDate = (completedDates, referenceDate) => {
  const lastDayOfMonth = new Date(referenceDate.getFullYear(), referenceDate.getMonth() + 1, 0).getDate()

  for (let day = 1; day <= lastDayOfMonth; day += 1) {
    const date = new Date(referenceDate.getFullYear(), referenceDate.getMonth(), day)
    if (!completedDates.has(localDateKey(date))) return date
  }

  throw new Error('Expected at least one unmarked day in the current month')
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

  test('every design dashboard renders without overflow at mobile and desktop sizes', async ({ page, request }) => {
    const smokeState = buildSmokeState()
    const assertNoConsoleErrors = installConsoleErrorGuard(page)

    for (const viewport of viewports) {
      await page.setViewportSize(viewport.size)

      for (const design of designIds) {
        await resetAppData(request, {
          ...smokeState,
          settings: {
            theme: 'light',
            design
          }
        })
        await page.goto('/')
        await waitForAppReady(page)

        await expect(page.locator('html')).toHaveAttribute('data-design', design)
        await expect(page.getByText(smokeState.primaryHabitName)).toBeVisible()
        await expect(page.getByRole('navigation', { name: 'Primary navigation' })).toBeVisible()
        await expectNoRootOverflow(page)
      }
    }

    await assertNoConsoleErrors()
  })

  test("progress percentages and today's progress card adapt across designs and responsive widths", async ({ page, request }) => {
    const smokeState = buildSmokeState()
    const progressViewports = [
      { width: 320, height: 720, wide: false },
      { width: 393, height: 852, wide: false },
      { width: 768, height: 1024, wide: true },
      { width: 1024, height: 768, wide: true },
      { width: 1280, height: 800, wide: true },
      { width: 1440, height: 900, wide: true }
    ]

    for (const design of designIds) {
      await resetAppData(request, {
        ...smokeState,
        settings: {
          theme: 'light',
          design
        }
      })
      await page.goto('/progress')
      await waitForAppReady(page)
      await expect(page.locator('html')).toHaveAttribute('data-design', design)

      const progressTitle = page.getByRole('heading', { name: "Today's Progress", exact: true })
      const progressCard = progressTitle.locator('..')
      const todayRateCard = page.getByText("Today's Rate", { exact: true }).locator('..')
      const summaryGrid = todayRateCard.locator('..')
      await expect(progressTitle).toBeVisible()
      await expect(todayRateCard).toBeVisible()

      for (const viewport of progressViewports) {
        await page.setViewportSize(viewport)
        const layout = await progressCard.evaluate(element => {
          const title = element.querySelector('h2')
          const progress = element.querySelector('svg')?.parentElement
          const percentage = progress.querySelector('span')
          const titleRect = title.getBoundingClientRect()
          const progressRect = progress.getBoundingClientRect()

          return {
            titleBottom: titleRect.bottom,
            titleRight: titleRect.right,
            titleCenterX: titleRect.left + titleRect.width / 2,
            titleCenterY: titleRect.top + titleRect.height / 2,
            progressLeft: progressRect.left,
            progressTop: progressRect.top,
            progressWidth: progressRect.width,
            progressCenterX: progressRect.left + progressRect.width / 2,
            progressCenterY: progressRect.top + progressRect.height / 2,
            percentageFontSize: Number.parseFloat(getComputedStyle(percentage).fontSize)
          }
        })
        const summaryLayout = await summaryGrid.evaluate(element =>
          Array.from(element.children).map(card => {
            const value = card.firstElementChild
            const style = getComputedStyle(value)

            return {
              cardContentWidth: card.clientWidth,
              valueColor: style.color,
              valueFontSize: Number.parseFloat(style.fontSize),
              valueFontWeight: style.fontWeight,
              valueLineHeight: style.lineHeight,
              valueScrollWidth: value.scrollWidth
            }
          })
        )
        const context = `${design} at ${viewport.width}px`
        const baselineSummaryValue = summaryLayout[0]

        expect(layout.percentageFontSize, `${context} percentage fits its ring`)
          .toBeLessThanOrEqual(layout.progressWidth * 0.27)
        expect(summaryLayout, `${context} renders all three summary values`).toHaveLength(3)

        for (const summaryValue of summaryLayout) {
          expect(summaryValue.valueFontSize, `${context} summary values stay compact`)
            .toBeLessThanOrEqual(42)
          expect(summaryValue.valueScrollWidth, `${context} summary value fits its card`)
            .toBeLessThanOrEqual(summaryValue.cardContentWidth)
          expect(
            {
              color: summaryValue.valueColor,
              fontSize: summaryValue.valueFontSize,
              fontWeight: summaryValue.valueFontWeight,
              lineHeight: summaryValue.valueLineHeight
            },
            `${context} summary values use matching typography`
          ).toEqual({
            color: baselineSummaryValue.valueColor,
            fontSize: baselineSummaryValue.valueFontSize,
            fontWeight: baselineSummaryValue.valueFontWeight,
            lineHeight: baselineSummaryValue.valueLineHeight
          })
        }

        if (viewport.wide) {
          expect(layout.titleRight, `${context} title precedes ring`).toBeLessThan(layout.progressLeft)
          expect(
            Math.abs(layout.titleCenterY - layout.progressCenterY),
            `${context} title and ring share a row`
          ).toBeLessThanOrEqual(24)
        } else {
          expect(layout.titleBottom, `${context} title precedes ring`).toBeLessThan(layout.progressTop)
          expect(
            Math.abs(layout.titleCenterX - layout.progressCenterX),
            `${context} title and ring stay centered`
          ).toBeLessThanOrEqual(2)
        }
        await expectNoRootOverflow(page)
      }
    }
  })

  test('journal week controls adapt across designs and responsive widths', async ({ page, request }) => {
    const smokeState = buildSmokeState()
    const journalViewports = [
      { width: 390, height: 844, phone: true },
      { width: 768, height: 1024, phone: false },
      { width: 1024, height: 768, phone: false },
      { width: 1280, height: 800, phone: false },
      { width: 1440, height: 900, phone: false }
    ]

    for (const design of designIds) {
      await resetAppData(request, {
        ...smokeState,
        settings: {
          theme: 'light',
          design
        }
      })
      await page.setViewportSize(journalViewports[0])
      await page.goto('/journal')
      await waitForAppReady(page)
      await expect(page.locator('html')).toHaveAttribute('data-design', design)

      const weekDate = page.getByRole('heading', { level: 2 })
      const previous = page.getByRole('button', { name: 'Previous', exact: true })
      const next = page.getByRole('button', { name: 'Next', exact: true })
      const thisWeek = page.getByRole('button', { name: 'Go to This Week', exact: true })
      await expect(weekDate).toBeVisible()

      for (const viewport of journalViewports) {
        await page.setViewportSize(viewport)
        const layout = await Promise.all([weekDate, previous, next, thisWeek].map(locator => (
          locator.evaluate(element => {
            const rect = element.getBoundingClientRect()
            return {
              top: rect.top,
              right: rect.right,
              bottom: rect.bottom,
              left: rect.left,
              centerY: rect.top + rect.height / 2
            }
          })
        )))
        const context = `${design} at ${viewport.width}px`

        if (viewport.phone) {
          expect(layout[0].bottom, `${context} date precedes navigation`)
            .toBeLessThanOrEqual(Math.min(layout[1].top, layout[2].top))
        } else {
          expect(Math.abs(layout[0].centerY - layout[1].centerY), `${context} date shares desktop row`)
            .toBeLessThanOrEqual(4)
          expect(Math.abs(layout[0].centerY - layout[2].centerY), `${context} date shares desktop row`)
            .toBeLessThanOrEqual(4)
        }
        expect(Math.abs(layout[1].centerY - layout[2].centerY), `${context} navigation alignment`)
          .toBeLessThanOrEqual(2)
        expect(layout[1].right, `${context} navigation order`).toBeLessThan(layout[2].left)
        expect(layout[3].top, `${context} this-week action remains separate`)
          .toBeGreaterThanOrEqual(Math.max(layout[1].bottom, layout[2].bottom))
        await expectNoRootOverflow(page)
      }
    }
  })

  for (const viewport of viewports) {
    test(`progress current streak timeline behaves consistently on ${viewport.name}`, async ({ page, request }) => {
      const smokeState = buildSmokeState()
      await resetAppData(request, smokeState)
      await page.setViewportSize(viewport.size)
      await page.goto('/progress')
      await waitForAppReady(page)
      await expect(page.getByText('Top Current Streak', { exact: true })).toBeVisible()
      await expect(page.getByText(/Longest streak:/)).toHaveCount(0)

      const timeline = page.getByTestId('streak-timeline').first()
      const currentDay = timeline.locator('[data-current-day="true"]')

      await expect(currentDay).toBeVisible()

      const visibility = await timeline.evaluate(element => {
        const timelineBox = element.getBoundingClientRect()
        const currentDayBox = element.querySelector('[data-current-day="true"]').getBoundingClientRect()

        return {
          currentDayLeft: currentDayBox.left,
          currentDayRight: currentDayBox.right,
          timelineLeft: timelineBox.left,
          timelineRight: timelineBox.right,
          scrollLeft: element.scrollLeft,
          maxScrollLeft: element.scrollWidth - element.clientWidth,
          scrollbarHeight: getComputedStyle(element, '::-webkit-scrollbar').height
        }
      })

      expect(visibility.currentDayLeft).toBeGreaterThanOrEqual(visibility.timelineLeft)
      expect(visibility.currentDayRight).toBeLessThanOrEqual(visibility.timelineRight)
      expect(visibility.scrollLeft).toBeGreaterThan(0)
      expect(visibility.scrollLeft).toBe(visibility.maxScrollLeft)
      expect(visibility.scrollbarHeight).toBe('8px')

      await timeline.evaluate(element => {
        element.scrollLeft = 0
      })
      const timelineBox = await timeline.boundingBox()
      if (!timelineBox) throw new Error('Streak timeline is not rendered')

      const dragY = timelineBox.y + Math.min(timelineBox.height / 2, 24)
      const dragStartX = timelineBox.x + timelineBox.width * 0.75
      await page.mouse.move(dragStartX, dragY)
      await page.mouse.down()
      await page.mouse.move(dragStartX - 80, dragY, { steps: 3 })
      await page.mouse.up()

      const dragResult = await timeline.evaluate(element => ({
        scrollLeft: element.scrollLeft,
        selectedText: window.getSelection()?.toString() || ''
      }))

      expect(dragResult.scrollLeft).toBeGreaterThan(0)
      expect(dragResult.selectedText).toBe('')
    })
  }

  test('Orbit dashboard dispatch action keeps readable contrast in dark mode', async ({ page, request }) => {
    const smokeState = buildSmokeState()
    await resetAppData(request, {
      ...smokeState,
      settings: {
        theme: 'dark',
        design: 'orbit'
      }
    })
    await page.goto('/')
    await waitForAppReady(page)

    await expect(page.locator('html')).toHaveAttribute('data-design', 'orbit')
    const dispatchAction = page.getByRole('button', { name: 'Inspect pattern', exact: true })
    await expect(dispatchAction).toBeVisible()

    const colors = await dispatchAction.evaluate(element => {
      const style = getComputedStyle(element)
      return {
        background: style.backgroundColor,
        text: style.color
      }
    })

    expect(
      contrastRatio(parseRgb(colors.text), parseRgb(colors.background)),
      'Orbit dark-mode dispatch action label remains readable'
    ).toBeGreaterThanOrEqual(4.5)
    await expectNoRootOverflow(page)
  })

  test('Rhythm Ledger inactive navigation hover stays readable in dark mode', async ({ page, request }) => {
    const smokeState = buildSmokeState()
    await resetAppData(request, {
      ...smokeState,
      settings: {
        theme: 'dark',
        design: 'rhythm-ledger'
      }
    })
    await page.setViewportSize({ width: 672, height: 1052 })
    await page.goto('/settings')
    await waitForAppReady(page)

    await expect(page.locator('html')).toHaveAttribute('data-design', 'rhythm-ledger')
    const journalNavigation = page.getByRole('button', { name: 'Journal', exact: true })
    await journalNavigation.hover()

    await expect.poll(async () => {
      const colors = await journalNavigation.evaluate(element => {
        const style = getComputedStyle(element)
        return {
          background: style.backgroundColor,
          text: style.color
        }
      })

      return contrastRatio(parseRgb(colors.text), parseRgb(colors.background))
    },
      'Rhythm Ledger dark-mode navigation hover remains readable'
    ).toBeGreaterThanOrEqual(4.5)
    await expectNoRootOverflow(page)
  })

  test('calendar heatmap cells keep readable contrast in dark mode', async ({ page, request }) => {
    const smokeState = buildSmokeState()
    await resetAppData(request, {
      ...smokeState,
      settings: {
        theme: 'dark'
      }
    })
    await page.goto('/calendar')
    await waitForAppReady(page)
    await expect(page.getByRole('heading', { name: 'Calendar', exact: true })).toBeVisible()

    const completedDates = new Set(smokeState.habits[0].completions.map(completion => completion.date))
    const markedDate = dateFromLocalDateKey(smokeState.habits[0].completions[0].date)
    const markedCell = page.getByRole('button', { name: formatCalendarButtonName(markedDate), exact: true })
    const unmarkedCell = page.getByRole('button', { name: formatCalendarButtonName(getUnmarkedMonthDate(completedDates, markedDate)), exact: true })

    await expect(markedCell).toBeVisible()
    await expect(unmarkedCell).toBeVisible()

    const readColors = async locator => locator.evaluate(element => {
      const label = element.querySelector('span')
      return {
        background: getComputedStyle(element).backgroundColor,
        pageBackground: getComputedStyle(document.body).backgroundColor,
        text: getComputedStyle(label).color
      }
    })

    const markedColors = await readColors(markedCell)
    const unmarkedColors = await readColors(unmarkedCell)
    const pageBackground = parseRgb(markedColors.pageBackground)
    const markedBackground = visibleRgb(parseRgb(markedColors.background), pageBackground)
    const unmarkedBackground = visibleRgb(parseRgb(unmarkedColors.background), pageBackground)
    const markedText = parseRgb(markedColors.text)
    const unmarkedText = parseRgb(unmarkedColors.text)

    expect(relativeLuminance(unmarkedBackground)).toBeLessThan(0.12)
    expect(relativeLuminance(markedBackground) - relativeLuminance(unmarkedBackground)).toBeGreaterThanOrEqual(0.02)
    expect(contrastRatio(markedText, markedBackground)).toBeGreaterThanOrEqual(4.5)
    expect(contrastRatio(unmarkedText, unmarkedBackground)).toBeGreaterThanOrEqual(4.5)
    await expectNoRootOverflow(page)
  })
})
