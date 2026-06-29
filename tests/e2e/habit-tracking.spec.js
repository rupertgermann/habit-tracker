import { expect, test } from '@playwright/test'
import {
  addDays,
  localDateKey,
  makeCompletion,
  makeHabit,
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
  const statsCard = page.getByText('Total Count', { exact: true }).locator('xpath=../..')
  await expect(statsCard.getByText(label, { exact: true })).toBeVisible()
  await expect(statsCard.getByText(value, { exact: true })).toBeVisible()
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

  await page.getByRole('button', { name: 'Mark as Complete' }).click()
  await waitForCompletionCount(request, habitName, today, 1)

  let persistedHabit = await waitForHabitByName(request, habitName)
  expect(persistedHabit.completions.map(completion => completion.date)).toEqual([today])

  await page.reload()
  await waitForAppReady(page)
  await expect(page.getByRole('button', { name: 'Mark as Incomplete' })).toBeVisible()

  await page.getByRole('button', { name: 'Mark as Incomplete' }).click()
  await waitForCompletionCount(request, habitName, today, 0)

  persistedHabit = await waitForHabitByName(request, habitName)
  expect(persistedHabit.completions.some(completion => completion.date === today)).toBe(false)

  await page.reload()
  await waitForAppReady(page)
  await expect(page.getByRole('button', { name: 'Mark as Complete' })).toBeVisible()
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
  const daysWithoutEntry = daysElapsed - daysWithEntry
  const expectedDaysSaid = `${Math.round((daysWithEntry / daysElapsed) * 100)}%`
  const expectedDaysNotSaid = `${Math.round((daysWithoutEntry / daysElapsed) * 100)}%`
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
  await expect(page.getByRole('combobox', { name: 'Select habit to view' })).toHaveValue(habit.id)

  await expectCalendarStat(page, 'This Month: Days Said', expectedDaysSaid)
  await expectCalendarStat(page, 'This Month: Days Not Said', expectedDaysNotSaid)
  await expectCalendarStat(page, 'Total Count', String(completions.length))
  await expectCalendarStat(page, 'Best Day', '3')
})
