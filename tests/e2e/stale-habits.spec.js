import { expect, test } from '@playwright/test'
import { makeHabit, resetAppData, waitForAppReady } from './helpers.js'

const habit = makeHabit({ id: 'stale-tab-habit', name: 'Shared Habit' })
const getState = async request => (await request.get('/api/state')).json()

test.beforeEach(async ({ request }) => {
  await resetAppData(request, { habits: [habit] })
})

test('a stale rename reports conflict, keeps its draft, and preserves the other tab completion', async ({ page, context, request }) => {
  const stale = await context.newPage()
  await page.goto(`/habit/${habit.id}`)
  await stale.goto(`/edit-habit/${habit.id}`)
  await waitForAppReady(page)
  await waitForAppReady(stale)
  const name = stale.getByPlaceholder('e.g., Drink 8 glasses of water')
  await name.fill('Unsaved rename')
  await page.getByRole('button', { name: 'Mark as Complete', exact: true }).click()
  await expect.poll(async () => (await getState(request)).habits[0].completions.length).toBe(1)

  const conflict = stale.waitForResponse(response => response.url().endsWith(`/api/habits/${habit.id}`) && response.request().method() === 'PUT')
  await stale.getByRole('button', { name: 'Update Habit' }).click()
  expect((await conflict).status()).toBe(409)
  await expect(stale.getByRole('alert')).toContainText('Habit changed in another tab')
  await expect(name).toHaveValue('Unsaved rename')
  expect((await getState(request)).habits[0]).toMatchObject({ name: habit.name, completions: [expect.any(Object)] })

  // Navigate within the mounted provider to prove conflict reconciliation without reloading.
  await stale.getByRole('button', { name: 'Habits', exact: true }).click()
  await expect(stale.getByRole('button', { name: `Mark as incomplete: ${habit.name}` })).toBeVisible()
  await stale.close()
})

test('a completion from a stale tab cannot recreate a habit deleted in another tab', async ({ page, context, request }) => {
  const stale = await context.newPage()
  await page.goto(`/habit/${habit.id}`)
  await stale.goto('/habits')
  await waitForAppReady(page)
  await waitForAppReady(stale)
  page.once('dialog', dialog => dialog.accept())
  await page.getByRole('button', { name: 'Delete Habit', exact: true }).click()
  await expect.poll(async () => (await getState(request)).habits.length).toBe(0)

  const rejected = stale.waitForResponse(response => response.url().endsWith(`/api/habits/${habit.id}`) && response.request().method() === 'PUT')
  await stale.getByRole('button', { name: `Mark as complete: ${habit.name}` }).click()
  expect((await rejected).status()).toBe(404)
  await expect(stale.getByRole('button', { name: `Mark as complete: ${habit.name}` })).toHaveCount(0)
  await expect(stale.getByText(/Could not update/)).toBeVisible()
  await expect(stale.getByText(`Great job! "${habit.name}" completed!`)).toHaveCount(0)
  expect((await getState(request)).habits).toEqual([])
  await stale.reload()
  await waitForAppReady(stale)
  await expect(stale.getByText(habit.name, { exact: true })).toHaveCount(0)
  await stale.close()
})
