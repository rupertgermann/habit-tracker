import { expect, test } from '@playwright/test'
import { makeHabit, resetAppData, waitForAppReady } from './helpers.js'

test.use({ viewport: { width: 390, height: 844 } })

test('Custom Habit summaries follow selected weekdays through editing and reload', async ({ page, request }) => {
  await resetAppData(request)
  await page.goto('/habits')
  await waitForAppReady(page)
  await page.getByRole('button', { name: 'Add New', exact: true }).click()
  await page.getByPlaceholder('e.g., Drink 8 glasses of water').fill('Scheduled reading')
  const frequency = page.getByRole('heading', { name: 'Frequency', exact: true }).locator('..')
  await frequency.getByText('Custom', { exact: true }).click()
  await frequency.getByRole('button', { name: 'M', exact: true }).click()
  await page.getByRole('button', { name: 'Create Habit', exact: true }).click()

  await expect(page.getByText('1 day/week', { exact: true })).toBeVisible()
  await page.getByRole('heading', { name: 'Scheduled reading', exact: true }).click()
  await expect(page.getByText('1 day per week', { exact: true })).toBeVisible()
  const readHabit = async () => {
    const response = await request.get('/api/state')
    expect(response.ok()).toBe(true)
    return (await response.json()).habits.find(habit => habit.name === 'Scheduled reading')
  }
  expect(await readHabit()).toMatchObject({
    daysPerWeek: 3,
    selectedDays: [false, true, false, false, false, false, false]
  })

  await page.getByRole('button', { name: 'Edit Habit', exact: true }).click()
  await frequency.getByRole('button', { name: 'T', exact: true }).first().click()
  await page.getByRole('button', { name: 'Update Habit', exact: true }).click()
  await expect(page.getByText('2 days/week', { exact: true })).toBeVisible()
  await page.getByRole('heading', { name: 'Scheduled reading', exact: true }).click()
  await expect(page.getByText('2 days per week', { exact: true })).toBeVisible()
  await page.reload()
  await waitForAppReady(page)
  await expect(page.getByText('2 days per week', { exact: true })).toBeVisible()
  expect(await readHabit()).toMatchObject({
    daysPerWeek: 3,
    selectedDays: [false, true, true, false, false, false, false]
  })
  await page.goto('/habits')
  await waitForAppReady(page)
  await expect(page.getByText('2 days/week', { exact: true })).toBeVisible()
})

test('frequency summaries preserve legacy fallback, zero selected days, Daily and Weekly', async ({ page, request }) => {
  const cases = [
    { habit: makeHabit({ id: 'legacy', name: 'Legacy schedule', frequency: 'custom', daysPerWeek: 4 }), list: '4 days/week', detail: '4 days per week' },
    { habit: makeHabit({ id: 'zero', name: 'No scheduled weekdays', frequency: 'custom', selectedDays: [false, false, false, false, false, false, false] }), list: '0 days/week', detail: '0 days per week' },
    { habit: makeHabit({ id: 'daily', name: 'Daily schedule' }), list: 'Daily', detail: 'Every day' },
    { habit: makeHabit({ id: 'weekly', name: 'Weekly schedule', frequency: 'weekly' }), list: 'Weekly', detail: 'Every week' }
  ]
  delete cases[0].habit.selectedDays
  await resetAppData(request, { habits: cases.map(({ habit }) => habit) })
  await page.goto('/habits')
  await waitForAppReady(page)
  for (const { list } of cases) {
    await expect(page.getByText(list, { exact: true })).toBeVisible()
  }
  for (const { habit, detail } of cases) {
    await page.goto(`/habit/${habit.id}`)
    await waitForAppReady(page)
    await expect(page.getByText(detail, { exact: true })).toBeVisible()
  }
})
