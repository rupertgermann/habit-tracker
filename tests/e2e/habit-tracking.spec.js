import { expect, test } from '@playwright/test'
import {
  addDays,
  installConsoleErrorGuard,
  localDateKey,
  makeCompletion,
  makeHabit,
  makeJournalEntry,
  resetAppData,
  waitForAppReady
} from './helpers.js'

const getState = async (request) => {
  const response = await request.get('/api/state')
  expect(response.ok()).toBe(true)
  return response.json()
}

const findHabitByName = async (request, name) => {
  const state = await getState(request)
  return state.habits.find(habit => habit.name === name) || null
}

const countCompletionsOnDate = (habit, date) =>
  (habit?.completions || []).filter(completion => completion.date === date).length

const waitForHabitByName = async (request, name) => {
  await expect.poll(async () => Boolean(await findHabitByName(request, name))).toBe(true)
  return findHabitByName(request, name)
}

const waitForCompletionCount = async (request, name, date, expectedCount) => {
  await expect.poll(async () => {
    const habit = await findHabitByName(request, name)
    return countCompletionsOnDate(habit, date)
  }).toBe(expectedCount)
}

const expectStepperCount = async (page, habitName, expectedCount) => {
  const addButton = page.getByRole('button', { name: `Add one to ${habitName}` })
  await expect(addButton).toBeVisible()

  const stepper = addButton.locator('xpath=..')
  await expect(stepper.getByText(String(expectedCount), { exact: true })).toBeVisible()
}

const createCountHabitThroughUi = async (page, name, dailyGoal) => {
  await page.goto('/habits')
  await waitForAppReady(page)
  await expect(page.getByRole('heading', { name: 'Habits', exact: true })).toBeVisible()

  await page.getByRole('button', { name: 'Add New', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'New Habit' })).toBeVisible()

  await page.getByPlaceholder('e.g., Drink 8 glasses of water').fill(name)
  await page.getByText(/Log how many times per day/).click()
  await page.getByPlaceholder('e.g., 3 times per day').fill(String(dailyGoal))
  await page.getByRole('button', { name: 'Create Habit' }).click()

  await expect(page.getByText(name)).toBeVisible()
}

const expectCalendarStat = async (page, label, value) => {
  const statLabel = page.getByText(label, { exact: true })
  const statItem = statLabel.locator('xpath=..')

  await expect(statLabel).toBeVisible()
  await expect(statItem.getByText(value, { exact: true })).toBeVisible()
}

test.beforeEach(async ({ request }) => {
  await resetAppData(request)
})

test('count habit persists daily logs through reloads and decrementing', async ({ page, request }) => {
  const habitName = 'E2E Count Persistence'
  const today = localDateKey()

  await createCountHabitThroughUi(page, habitName, 5)

  const createdHabit = await waitForHabitByName(request, habitName)
  expect(createdHabit).toMatchObject({
    name: habitName,
    type: 'count',
    dailyTarget: 5,
    completions: []
  })
  expect(createdHabit).not.toHaveProperty('streak')
  expect(createdHabit).not.toHaveProperty('longestStreak')

  await page.reload()
  await waitForAppReady(page)
  await expect(page.getByText(habitName)).toBeVisible()
  await expectStepperCount(page, habitName, 0)

  await page.getByRole('button', { name: `Add one to ${habitName}` }).click()
  await expectStepperCount(page, habitName, 1)
  await page.getByRole('button', { name: `Add one to ${habitName}` }).click()
  await expectStepperCount(page, habitName, 2)
  await page.getByRole('button', { name: `Add one to ${habitName}` }).click()
  await expectStepperCount(page, habitName, 3)

  await page.getByRole('button', { name: `Remove one from ${habitName}` }).click()
  await expectStepperCount(page, habitName, 2)
  await waitForCompletionCount(request, habitName, today, 2)

  await page.reload()
  await waitForAppReady(page)
  await expectStepperCount(page, habitName, 2)

  const persistedHabit = await waitForHabitByName(request, habitName)
  expect(countCompletionsOnDate(persistedHabit, today)).toBe(2)
})

test('appearance picker stores expanded icon and distinct color choices', async ({ page, request }) => {
  const habitName = 'E2E Appearance Choice'

  await page.goto('/add-habit')
  await waitForAppReady(page)
  await expect(page.getByRole('heading', { name: 'New Habit' })).toBeVisible()

  await page.getByPlaceholder('e.g., Drink 8 glasses of water').fill(habitName)
  await page.getByRole('button', { name: 'Select color Teal' }).click()
  await page.getByRole('tab', { name: 'Food' }).click()
  await page.getByRole('button', { name: 'Select icon Coffee' }).click()
  await page.getByRole('button', { name: 'Create Habit' }).click()

  const createdHabit = await waitForHabitByName(request, habitName)
  expect(createdHabit).toMatchObject({
    color: '#14B8A6',
    icon: 'coffee'
  })

  const state = await getState(request)
  expect(state.categories).toEqual(expect.arrayContaining([
    expect.objectContaining({ id: 'health', icon: 'dumbbell' }),
    expect.objectContaining({ id: 'productivity', icon: 'notes' }),
    expect.objectContaining({ id: 'mindfulness', icon: 'yoga' }),
    expect.objectContaining({ id: 'learning', icon: 'books' }),
    expect.objectContaining({ id: 'social', icon: 'users' }),
    expect.objectContaining({ id: 'creativity', icon: 'palette' }),
    expect.objectContaining({ id: 'other', icon: 'pin' })
  ]))

  await page.goto(`/edit-habit/${createdHabit.id}`)
  await waitForAppReady(page)
  await page.getByRole('searchbox', { name: 'Search icons' }).fill('water')
  await page.getByRole('button', { name: 'Select icon Water' }).click()
  await page.getByRole('button', { name: 'Update Habit' }).click()

  await expect.poll(async () => {
    const updatedHabit = await findHabitByName(request, habitName)
    return updatedHabit?.icon
  }).toBe('droplet')

  await page.reload()
  await waitForAppReady(page)
  await expect(page.getByText(habitName)).toBeVisible()
})

test('legacy string icons continue to render safely', async ({ page, request }) => {
  await resetAppData(request, {
    habits: [
      makeHabit({
        id: 'e2e-legacy-icon',
        name: 'E2E Legacy Icon',
        icon: 'Y',
        completions: []
      })
    ],
    categories: [
      { id: 'legacy', name: 'Legacy Category', color: '#6B7280', icon: 'L' }
    ]
  })

  await page.goto('/habits')
  await waitForAppReady(page)

  await expect(page.getByText('E2E Legacy Icon')).toBeVisible()
  await expect(page.getByText('Legacy Category')).toBeVisible()
  await expect(page.getByText('Y', { exact: true })).toBeVisible()
  await expect(page.getByText('L', { exact: true })).toBeVisible()
})

test('mobile editing preserves created date and keeps detail route usable', async ({ page, request }) => {
  const assertNoConsoleErrors = installConsoleErrorGuard(page)
  const createdAt = '2026-06-01T09:00:00.000Z'
  const habitName = 'E2E Mobile Edit Date'
  const updatedName = 'E2E Mobile Edit Date Updated'

  await page.setViewportSize({ width: 390, height: 844 })
  await resetAppData(request, {
    habits: [
      makeHabit({
        id: 'e2e-mobile-edit-created-date',
        name: habitName,
        icon: 'check',
        createdAt
      })
    ]
  })

  await page.goto('/edit-habit/e2e-mobile-edit-created-date')
  await waitForAppReady(page)
  await expect(page.getByRole('heading', { name: 'Edit Habit' })).toBeVisible()
  await expect(page.getByPlaceholder('e.g., Drink 8 glasses of water')).toHaveValue(habitName)

  await page.getByPlaceholder('e.g., Drink 8 glasses of water').fill(updatedName)
  await page.getByRole('button', { name: 'Update Habit' }).click()

  const updatedHabit = await waitForHabitByName(request, updatedName)
  expect(updatedHabit.createdAt).toBe(createdAt)

  await page.goto('/habit/e2e-mobile-edit-created-date')
  await waitForAppReady(page)

  await expect(page.getByRole('heading', { level: 1, name: /E2E Mobile Edit Date Updated/ })).toBeVisible()
  await expect(page.getByText('June 1, 2026')).toBeVisible()
  await assertNoConsoleErrors()
})

test('mobile habit detail renders records without a created date', async ({ page, request }) => {
  const assertNoConsoleErrors = installConsoleErrorGuard(page)
  const legacyHabit = makeHabit({
    id: 'e2e-missing-created-date',
    name: 'E2E Missing Created Date',
    icon: 'check'
  })
  delete legacyHabit.createdAt

  await page.setViewportSize({ width: 390, height: 844 })
  await resetAppData(request, { habits: [legacyHabit] })

  await page.goto('/habit/e2e-missing-created-date')
  await waitForAppReady(page)
  await assertNoConsoleErrors()

  await expect(page.getByRole('heading', { level: 1, name: /E2E Missing Created Date/ })).toBeVisible()
  await expect(page.getByText('Not recorded')).toBeVisible()
  await assertNoConsoleErrors()
})

test('yes/no habit toggle persists one dated completion and toggles it off', async ({ page, request }) => {
  const habitName = 'E2E Yes No Persistence'
  const today = localDateKey()

  await resetAppData(request, {
    habits: [
      makeHabit({
        id: 'e2e-yes-no-persistence',
        name: habitName,
        type: 'binary',
        icon: 'Y',
        completions: []
      })
    ]
  })

  await page.goto('/habit/e2e-yes-no-persistence')
  await waitForAppReady(page)
  await expect(page.getByRole('heading', { level: 1, name: /E2E Yes No Persistence/ })).toBeVisible()

  await page.getByRole('button', { name: 'Mark as Complete', exact: true }).click()
  await waitForCompletionCount(request, habitName, today, 1)

  let persistedHabit = await waitForHabitByName(request, habitName)
  expect(persistedHabit.completions.map(completion => completion.date)).toEqual([today])

  await page.reload()
  await waitForAppReady(page)
  await expect(page.getByRole('button', { name: 'Mark as Incomplete', exact: true })).toBeVisible()

  await page.getByRole('button', { name: 'Mark as Incomplete', exact: true }).click()
  await waitForCompletionCount(request, habitName, today, 0)

  persistedHabit = await waitForHabitByName(request, habitName)
  expect(persistedHabit.completions.some(completion => completion.date === today)).toBe(false)

  await page.reload()
  await waitForAppReady(page)
  await expect(page.getByRole('button', { name: 'Mark as Complete', exact: true })).toBeVisible()
})

test('yes/no habit list and calendar actions share persisted completion state', async ({ page, request }) => {
  const habitName = 'E2E Shared Yes No Write'
  const habitId = 'e2e-shared-yes-no-write'
  const today = localDateKey()

  await resetAppData(request, {
    habits: [
      makeHabit({
        id: habitId,
        name: habitName,
        type: 'binary',
        completions: []
      })
    ]
  })

  await page.goto('/habits')
  await waitForAppReady(page)
  await page.getByRole('button', { name: `Mark as complete: ${habitName}` }).click()
  await waitForCompletionCount(request, habitName, today, 1)

  await page.reload()
  await waitForAppReady(page)
  await expect(page.getByRole('button', { name: `Mark as incomplete: ${habitName}` })).toBeVisible()

  await page.goto('/calendar')
  await waitForAppReady(page)
  await expect(page.getByRole('button', { name: 'Mark Incomplete' })).toBeVisible()
  await page.getByRole('button', { name: 'Mark Incomplete' }).click()
  await waitForCompletionCount(request, habitName, today, 0)

  await page.reload()
  await waitForAppReady(page)
  await expect(page.getByRole('button', { name: 'Mark Complete' })).toBeVisible()
})

test('failed yes/no write rolls Habit detail back and reports only failure', async ({ page, request }) => {
  const habitName = 'E2E Failed Yes No Write'
  const habitId = 'e2e-failed-yes-no-write'
  const today = localDateKey()
  let didInterceptFailedWrite = false
  const pageErrors = []
  page.on('pageerror', error => pageErrors.push(error.stack || error.message))

  await resetAppData(request, {
    habits: [
      makeHabit({
        id: habitId,
        name: habitName,
        type: 'binary',
        completions: []
      })
    ]
  })
  await page.setViewportSize({ width: 390, height: 844 })

  await page.route(`**/api/habits/${habitId}`, async route => {
    if (route.request().method() === 'PUT') {
      didInterceptFailedWrite = true
      await route.fulfill({ status: 500, contentType: 'application/json', body: '{}' })
      return
    }
    await route.continue()
  })

  await page.goto(`/habit/${habitId}`)
  await waitForAppReady(page)
  await page.getByRole('button', { name: 'Mark as Complete', exact: true }).click()
  await expect.poll(() => didInterceptFailedWrite).toBe(true)
  await expect.poll(() => pageErrors).toEqual([])
  await expect(page.getByRole('button', { name: 'Mark as Complete', exact: true })).toBeVisible()

  const persistedHabit = await waitForHabitByName(request, habitName)
  expect(countCompletionsOnDate(persistedHabit, today)).toBe(0)
  await expect(page.getByText(`Could not update "${habitName}". Please try again.`)).toBeVisible()
  await expect(page.getByText(`Great job! "${habitName}" completed!`)).toHaveCount(0)
})

test('deleting a Habit removes only its Journal Entries and stays deleted after reload', async ({ page, request }) => {
  const deletedHabit = makeHabit({ id: 'e2e-delete-habit', name: 'E2E Delete Habit' })
  const keptHabit = makeHabit({ id: 'e2e-keep-habit', name: 'E2E Keep Habit' })
  const relatedEntry = makeJournalEntry({
    id: 'e2e-delete-related-entry',
    habitId: deletedHabit.id,
    content: 'Delete this reflection'
  })
  const unrelatedEntry = makeJournalEntry({
    id: 'e2e-keep-unrelated-entry',
    habitId: keptHabit.id,
    content: 'Keep this reflection'
  })
  await resetAppData(request, {
    habits: [deletedHabit, keptHabit],
    journalEntries: [relatedEntry, unrelatedEntry]
  })

  page.once('dialog', dialog => dialog.accept())
  await page.goto(`/habit/${deletedHabit.id}`)
  await waitForAppReady(page)
  await page.getByRole('button', { name: 'Delete Habit', exact: true }).click()

  await expect(page).toHaveURL(/\/habits$/)
  await expect(page.getByText(`"${deletedHabit.name}" deleted.`)).toBeVisible()
  await expect(page.getByText(keptHabit.name)).toBeVisible()

  const committedState = await getState(request)
  expect(committedState.habits.map(habit => habit.id)).toEqual([keptHabit.id])
  expect(committedState.journalEntries).toEqual([unrelatedEntry])

  await page.reload()
  await waitForAppReady(page)
  await expect(page.getByText(deletedHabit.name)).toHaveCount(0)
  await expect(page.getByText(keptHabit.name)).toBeVisible()
})

test('failed Habit deletion preserves visible and persisted Habit data', async ({ page, request }) => {
  const habit = makeHabit({ id: 'e2e-failed-delete-habit', name: 'E2E Failed Delete Habit' })
  const journalEntry = makeJournalEntry({
    id: 'e2e-failed-delete-entry',
    habitId: habit.id,
    content: 'Preserve this reflection'
  })
  await resetAppData(request, { habits: [habit], journalEntries: [journalEntry] })

  await page.route(`**/api/habits/${habit.id}`, async route => {
    if (route.request().method() === 'DELETE') {
      await route.fulfill({ status: 500, contentType: 'application/json', body: '{}' })
      return
    }
    await route.continue()
  })
  page.once('dialog', dialog => dialog.accept())

  await page.goto(`/habit/${habit.id}`)
  await waitForAppReady(page)
  await page.getByRole('button', { name: 'Delete Habit', exact: true }).click()

  await expect(page).toHaveURL(new RegExp(`/habit/${habit.id}$`))
  await expect(page.getByRole('heading', { level: 1, name: new RegExp(habit.name) })).toBeVisible()
  await expect(page.getByText(`Could not delete "${habit.name}". Please try again.`)).toBeVisible()
  const persistedState = await getState(request)
  expect(persistedState.habits).toEqual([habit])
  expect(persistedState.journalEntries).toEqual([journalEntry])

  await page.reload()
  await waitForAppReady(page)
  await expect(page.getByRole('heading', { level: 1, name: new RegExp(habit.name) })).toBeVisible()
})

test('calendar stats for a count habit survive reload', async ({ page, request }) => {
  const today = new Date()
  const todayKey = localDateKey(today)
  const yesterdayKey = localDateKey(addDays(today, -1))
  const firstOfMonthKey = localDateKey(new Date(today.getFullYear(), today.getMonth(), 1))
  const currentMonthPrefix = firstOfMonthKey.slice(0, 7)
  const includesYesterday = yesterdayKey.startsWith(currentMonthPrefix)
  const completionDates = includesYesterday ? [yesterdayKey, todayKey] : [todayKey]
  const daysWithEntry = new Set(completionDates).size
  const daysElapsed = today.getDate()
  const daysSaidPercent = Math.round((daysWithEntry / daysElapsed) * 100)
  const expectedDaysSaid = `${daysSaidPercent}%`
  const expectedDaysNotSaid = `${100 - daysSaidPercent}%`
  const completions = [
    ...(includesYesterday ? [makeCompletion(yesterdayKey, 8)] : []),
    makeCompletion(todayKey, 9),
    makeCompletion(todayKey, 10),
    makeCompletion(todayKey, 11)
  ]

  const habit = makeHabit({
    id: 'e2e-calendar-count',
    name: 'E2E Calendar Count',
    type: 'count',
    dailyTarget: 4,
    icon: 'C',
    createdAt: `${firstOfMonthKey}T08:00:00.000Z`,
    completions
  })

  await resetAppData(request, { habits: [habit] })

  await page.goto('/calendar')
  await waitForAppReady(page)
  await page.reload()
  await waitForAppReady(page)

  await expect(page.getByRole('heading', { name: 'Calendar' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Select habit to view' })).toContainText(habit.name)

  await expectCalendarStat(page, 'This Month: Days Said', expectedDaysSaid)
  await expectCalendarStat(page, 'This Month: Days Not Said', expectedDaysNotSaid)
  await expectCalendarStat(page, 'Total Count', String(completions.length))
  await expectCalendarStat(page, 'Best Day', '3')
})

test('calendar habit dropdown uses the shared dropdown surface', async ({ page, request }) => {
  const firstHabit = makeHabit({
    id: 'e2e-calendar-dropdown-first',
    name: 'E2E Calendar Dropdown First',
    icon: 'book'
  })
  const secondHabit = makeHabit({
    id: 'e2e-calendar-dropdown-second',
    name: 'E2E Calendar Dropdown Second',
    icon: 'coffee'
  })

  await resetAppData(request, {
    habits: [firstHabit, secondHabit],
    settings: {
      theme: 'dark'
    }
  })
  await page.goto('/calendar')
  await waitForAppReady(page)

  const habitDropdown = page.getByRole('button', { name: 'Select habit to view' })
  await expect(habitDropdown).toBeVisible()
  await expect(habitDropdown).toContainText(firstHabit.name)

  const buttonBox = await habitDropdown.evaluate(element => {
    const rect = element.getBoundingClientRect()
    return { bottom: rect.bottom, left: rect.left, width: rect.width, height: rect.height }
  })
  expect(Math.abs(buttonBox.height - 48)).toBeLessThanOrEqual(1)

  await habitDropdown.click()
  const optionList = page.getByRole('listbox', { name: 'Select habit to view' })
  await expect(optionList).toBeVisible()
  await expect(page.getByRole('option', { name: firstHabit.name })).toBeVisible()
  await expect(page.getByRole('option', { name: secondHabit.name })).toBeVisible()

  const listBox = await optionList.evaluate(element => {
    const rect = element.getBoundingClientRect()
    return { top: rect.top, left: rect.left, width: rect.width }
  })
  expect(listBox.top).toBeGreaterThanOrEqual(buttonBox.bottom - 1)
  expect(Math.abs(listBox.left - buttonBox.left)).toBeLessThanOrEqual(1)
  expect(Math.abs(listBox.width - buttonBox.width)).toBeLessThanOrEqual(1)

  await page.getByRole('option', { name: secondHabit.name }).click()
  await expect(habitDropdown).toContainText(secondHabit.name)
})
