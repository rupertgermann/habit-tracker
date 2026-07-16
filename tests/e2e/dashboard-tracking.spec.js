import { expect, test } from '@playwright/test'
import {
  localDateKey,
  makeHabit,
  resetAppData,
  waitForAppReady
} from './helpers.js'

const designs = [
  {
    id: 'standard',
    success: habitName => `Great job! "${habitName}" completed!`,
    failure: habitName => `Could not update "${habitName}". Please try again.`
  },
  {
    id: 'rhythm-ledger',
    success: habitName => `"${habitName}" is in the record.`,
    failure: habitName => `Could not update "${habitName}". Please try again.`
  },
  {
    id: 'orbit',
    success: habitName => `Signal confirmed: "${habitName}".`,
    failure: habitName => `Mission update failed: "${habitName}". Try again.`
  },
  {
    id: 'quiet-momentum',
    success: habitName => `"${habitName}" is complete.`,
    failure: habitName => `Could not update "${habitName}". Please try again.`
  },
  {
    id: 'sunday-club',
    success: habitName => `Ticket punched: "${habitName}".`,
    failure: habitName => `Ticket failed: "${habitName}". Give it another go.`
  }
]

const completionCount = async (request, habitId, date) => {
  const response = await request.get('/api/state')
  expect(response.ok()).toBe(true)
  const state = await response.json()
  const habit = state.habits.find(candidate => candidate.id === habitId)

  return habit?.completions.filter(completion => completion.date === date).length ?? 0
}

test('all App Designs persist the same accessible complete and incomplete dashboard actions', async ({ page, request }) => {
  const habitId = 'cross-design-success'
  const habitName = 'Cross Design Success'
  const today = localDateKey()

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

    const complete = page.getByRole('button', {
      name: `Mark as complete: ${habitName}`
    }).last()
    await expect(complete).toBeVisible()
    await complete.click()

    await expect(page.getByText(design.success(habitName))).toBeVisible()
    await expect.poll(() => completionCount(request, habitId, today)).toBe(1)
    const incomplete = page.getByRole('button', {
      name: `Mark as incomplete: ${habitName}`
    }).last()
    await expect(incomplete).toBeVisible()
    await incomplete.click()

    await expect.poll(() => completionCount(request, habitId, today)).toBe(0)
    await expect(page.getByRole('button', {
      name: `Mark as complete: ${habitName}`
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

    await page.getByRole('button', {
      name: `Mark as complete: ${habitName}`
    }).last().click()

    await expect(page.getByText(design.failure(habitName))).toBeVisible()
    await expect(page.getByText(design.success(habitName))).toHaveCount(0)
    await expect(page.getByRole('button', {
      name: `Mark as complete: ${habitName}`
    }).last()).toBeVisible()
    await expect.poll(() => completionCount(request, habitId, today)).toBe(0)
  }
})
