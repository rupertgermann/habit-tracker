import { expect, test } from '@playwright/test'
import {
  addDays,
  localDateKey,
  makeCompletion,
  makeHabit,
  resetAppData,
  waitForAppReady
} from './helpers.js'

const designs = [
  {
    id: 'standard',
    success: habitName => `Great job! "${habitName}" completed!`,
    failure: habitName => `Could not update "${habitName}". Please try again.`,
    allComplete: 'Perfect day! All habits completed!'
  },
  {
    id: 'rhythm-ledger',
    success: habitName => `"${habitName}" is in the record.`,
    failure: habitName => `Could not update "${habitName}". Please try again.`,
    allComplete: 'The page is complete. Every habit is logged.'
  },
  {
    id: 'orbit',
    success: habitName => `Signal confirmed: "${habitName}".`,
    failure: habitName => `Mission update failed: "${habitName}". Try again.`,
    allComplete: 'Orbit stable. Every habit is complete.'
  },
  {
    id: 'quiet-momentum',
    success: habitName => `"${habitName}" is complete.`,
    failure: habitName => `Could not update "${habitName}". Please try again.`,
    allComplete: 'Every ritual is complete. Let the day settle.'
  },
  {
    id: 'sunday-club',
    success: habitName => `Ticket punched: "${habitName}".`,
    failure: habitName => `Ticket failed: "${habitName}". Give it another go.`,
    allComplete: 'Full house! Every habit is complete.'
  }
]

const completionCount = async (request, habitId, date) => {
  const response = await request.get('/api/state')
  expect(response.ok()).toBe(true)
  const state = await response.json()
  const habit = state.habits.find(candidate => candidate.id === habitId)

  return habit?.completions.filter(completion => completion.date === date).length ?? 0
}

const hasConfettiPixels = page => page.locator('canvas').first().evaluate(canvas => {
  const context = canvas.getContext('2d')
  if (!context || canvas.width === 0 || canvas.height === 0) return false

  const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data
  for (let index = 3; index < pixels.length; index += 4) {
    if (pixels[index] > 0) return true
  }
  return false
})

const expectSharedFacts = async ({
  page,
  design,
  expectedHabitIds,
  completed,
  completionRate,
  topCurrentStreak,
  todayLabel
}) => {
  const habitIds = await page.locator('[data-habit-id]').evaluateAll(elements => (
    elements.map(element => element.dataset.habitId).sort()
  ))
  expect(habitIds).toEqual([...expectedHabitIds].sort())

  const weeklyTitle = design.id === 'rhythm-ledger'
    ? `${todayLabel}: ${completed} of ${expectedHabitIds.length} habits`
    : `${todayLabel}: ${completed} completions`

  switch (design.id) {
    case 'standard':
      await expect(page.getByText(`${completed}/${expectedHabitIds.length} habits`, { exact: true })).toBeVisible()
      await expect(page.getByText(`${completionRate}%`, { exact: true }).first()).toBeVisible()
      await expect(page.getByText(`${topCurrentStreak} days`, { exact: true })).toBeVisible()
      await expect(page.getByRole('img', {
        name: `${todayLabel}: ${completed} completed, ${expectedHabitIds.length - completed} missed`
      })).toBeVisible()
      break
    case 'rhythm-ledger':
      await expect(page.getByRole('img', {
        name: `${completionRate}% complete, ${completed} of ${expectedHabitIds.length} habits`
      })).toBeVisible()
      await expect(page.getByText(`${topCurrentStreak} day streak`, { exact: true })).toBeVisible()
      await expect(page.locator(`[title="${weeklyTitle}"]`)).toBeVisible()
      break
    case 'orbit':
      await expect(page.getByRole('img', {
        name: `${completed} of ${expectedHabitIds.length} habit signals active`
      })).toBeVisible()
      await expect(page.getByText(`${completionRate}%`, { exact: true })).toBeVisible()
      await expect(page.getByText(new RegExp(`${topCurrentStreak}d streak`))).toBeVisible()
      await expect(page.locator(`[title="${weeklyTitle}"]`)).toBeVisible()
      break
    case 'quiet-momentum':
      await expect(page.getByLabel(
        `${completed} of ${expectedHabitIds.length} habits complete`
      )).toBeVisible()
      await expect(page.getByText(`${completionRate}% complete`, { exact: true })).toBeVisible()
      await expect(page.locator('[data-habit-id="cross-design-streak"]')).toContainText(
        `${topCurrentStreak} day streak`
      )
      await expect(page.locator(`[title="${weeklyTitle}"]`)).toBeVisible()
      break
    case 'sunday-club':
      await expect(page.getByText(`${completed} / ${expectedHabitIds.length}`, { exact: true })).toBeVisible()
      await expect(page.getByText(`${completionRate}% of tickets punched`, { exact: true })).toBeVisible()
      await expect(page.getByText(`${topCurrentStreak} day streak`, { exact: true })).toBeVisible()
      await expect(page.locator(`[title="${weeklyTitle}"]`)).toBeVisible()
      break
  }
}

test('all App Designs expose identical dashboard facts and semantic complete/incomplete milestones', async ({ page, request }) => {
  const todayDate = new Date()
  const today = localDateKey(todayDate)
  const yesterday = localDateKey(addDays(todayDate, -1))
  const twoDaysAgo = localDateKey(addDays(todayDate, -2))
  const todayLabel = new Intl.DateTimeFormat('en-US', { weekday: 'short' }).format(todayDate)
  const targetId = 'cross-design-target'
  const targetName = 'Cross Design Target'
  const baseHabits = [
    makeHabit({
      id: 'cross-design-streak',
      name: 'Cross Design Streak',
      createdAt: `${twoDaysAgo}T06:00:00.000Z`,
      completions: [
        makeCompletion(twoDaysAgo, 7),
        makeCompletion(yesterday, 7),
        makeCompletion(today, 7)
      ]
    }),
    makeHabit({
      id: 'cross-design-second',
      name: 'Cross Design Second',
      completions: [makeCompletion(today, 8)]
    }),
    makeHabit({ id: targetId, name: targetName }),
    makeHabit({ id: 'cross-design-remaining', name: 'Cross Design Remaining' })
  ]
  const expectedHabitIds = baseHabits.map(habit => habit.id)

  for (const design of designs) {
    await resetAppData(request, {
      habits: baseHabits,
      settings: {
        theme: 'light',
        design: design.id
      }
    })
    await page.goto('/')
    await waitForAppReady(page)

    await expectSharedFacts({
      page,
      design,
      expectedHabitIds,
      completed: 2,
      completionRate: 50,
      topCurrentStreak: 3,
      todayLabel
    })

    const complete = page.getByRole('button', {
      name: `Mark as complete: ${targetName}`
    }).last()
    await expect(complete).toBeVisible()
    await complete.click()

    await expect(page.getByText(design.success(targetName))).toBeVisible()
    await expect(page.getByText(design.allComplete)).toHaveCount(0)
    await expect.poll(() => completionCount(request, targetId, today)).toBe(1)
    await expectSharedFacts({
      page,
      design,
      expectedHabitIds,
      completed: 3,
      completionRate: 75,
      topCurrentStreak: 3,
      todayLabel
    })
    await expect.poll(() => hasConfettiPixels(page)).toBe(true)

    if (design.id === 'standard') {
      await page.reload()
      await waitForAppReady(page)
      await expect(page.getByRole('button', {
        name: `Mark as incomplete: ${targetName}`
      }).last()).toBeVisible()
      await expect.poll(() => completionCount(request, targetId, today)).toBe(1)
    }

    const habitsWithTargetComplete = baseHabits.map(habit => (
      habit.id === targetId
        ? { ...habit, completions: [makeCompletion(today, 9)] }
        : habit
    ))
    await resetAppData(request, {
      habits: habitsWithTargetComplete,
      settings: {
        theme: 'light',
        design: design.id
      }
    })
    await page.goto('/')
    await waitForAppReady(page)
    await expect.poll(() => hasConfettiPixels(page)).toBe(false)

    const incomplete = page.getByRole('button', {
      name: `Mark as incomplete: ${targetName}`
    }).last()
    await expect(incomplete).toBeVisible()
    await incomplete.click()

    await expect.poll(() => completionCount(request, targetId, today)).toBe(0)
    await expect(page.getByText(design.success(targetName))).toHaveCount(0)
    await expect(page.getByText(design.allComplete)).toHaveCount(0)
    await page.waitForTimeout(250)
    expect(await hasConfettiPixels(page)).toBe(false)
    await expectSharedFacts({
      page,
      design,
      expectedHabitIds,
      completed: 2,
      completionRate: 50,
      topCurrentStreak: 3,
      todayLabel
    })
    await expect(page.getByRole('button', {
      name: `Mark as complete: ${targetName}`
    }).last()).toBeVisible()
  }
})

test('all App Designs roll dashboard Completion failure back without success feedback', async ({ page, request }) => {
  const habitId = 'cross-design-failure'
  const habitName = 'Cross Design Failure'
  const today = localDateKey()

  await page.route(`**/api/habits/${habitId}`, async route => {
    if (route.request().method() === 'PUT') {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: '{}'
      })
      return
    }
    await route.continue()
  })

  for (const design of designs) {
    await resetAppData(request, {
      habits: [makeHabit({ id: habitId, name: habitName })],
      settings: {
        theme: 'light',
        design: design.id
      }
    })
    await page.goto('/')
    await waitForAppReady(page)
    await expect.poll(() => hasConfettiPixels(page)).toBe(false)

    await page.getByRole('button', {
      name: `Mark as complete: ${habitName}`
    }).last().click()

    await expect(page.getByText(design.failure(habitName))).toBeVisible()
    await expect(page.getByText(design.success(habitName))).toHaveCount(0)
    await expect(page.getByRole('button', {
      name: `Mark as complete: ${habitName}`
    }).last()).toBeVisible()
    await expect.poll(() => completionCount(request, habitId, today)).toBe(0)
    await page.waitForTimeout(250)
    expect(await hasConfettiPixels(page)).toBe(false)
  }
})
