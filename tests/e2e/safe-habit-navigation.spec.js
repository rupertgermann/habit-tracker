import { expect, test } from '@playwright/test'
import { makeHabit, makeJournalEntry, resetAppData, waitForAppReady } from './helpers.js'

const getState = async request => {
  const response = await request.get('/api/state')
  expect(response.ok()).toBe(true)
  return response.json()
}
const ids = ['record?imported', 'record#fragment', 'record%2Fchild', 'record%25', 'record/child', 'record\\child', 'record with spaces', 'record-歩く']

for (const width of [390, 1280]) {
  test(`Habit navigation edits and deletes exact imported IDs at ${width}px`, async ({ page, request }) => {
    test.setTimeout(120_000)
    await page.setViewportSize({ width, height: 900 })
    page.on('dialog', dialog => dialog.accept())
    for (const id of ids) {
      const target = makeHabit({ id, name: 'Imported Habit' })
      const sibling = makeHabit({ id: id === 'record%2Fchild' ? 'record/child' : 'record', name: 'Sibling Habit' })
      await resetAppData(request, {
        habits: [sibling, target],
        journalEntries: [
          makeJournalEntry({ id: 'sibling-entry', habitId: sibling.id, content: 'Keep this reflection' }),
          makeJournalEntry({ id: 'target-entry', habitId: id, content: 'Imported reflection' })
        ],
        settings: { unknownSetting: { preserved: true } }
      })
      const prior = await getState(request)
      await page.goto('/habits')
      await waitForAppReady(page)
      await page.getByText('Imported Habit', { exact: true }).click()
      await expect(page).toHaveURL(url => url.pathname === `/habit/${encodeURIComponent(id)}`)
      await expect(page.getByRole('heading', { level: 1, name: 'Imported Habit', exact: true })).toBeVisible()
      await page.reload()
      await waitForAppReady(page)
      await expect(page.getByRole('heading', { level: 1, name: 'Imported Habit', exact: true })).toBeVisible()
      await page.getByRole('button', { name: 'Edit Habit', exact: true }).click()
      const name = page.getByPlaceholder('e.g., Drink 8 glasses of water')
      await expect(name).toHaveValue('Imported Habit')
      await page.reload()
      await waitForAppReady(page)
      await expect(name).toHaveValue('Imported Habit')
      await name.fill('Edited imported Habit')
      await page.getByRole('button', { name: 'Update Habit', exact: true }).click()
      await expect(page).toHaveURL(/\/habits$/)
      const edited = await getState(request)
      const saved = edited.habits.find(habit => habit.id === id)
      expect(saved).toMatchObject({ id, name: 'Edited imported Habit' })
      expect(edited).toEqual({ ...prior, habits: prior.habits.map(habit => habit.id === id ? saved : habit) })
      await page.getByText('Edited imported Habit', { exact: true }).click()
      await page.getByRole('button', { name: 'Delete Habit', exact: true }).click()
      await expect(page).toHaveURL(/\/habits$/)
      const remaining = {
        ...prior,
        habits: prior.habits.filter(habit => habit.id !== id),
        journalEntries: prior.journalEntries.filter(entry => entry.habitId !== id)
      }
      expect(await getState(request)).toEqual(remaining)
      await page.reload()
      await waitForAppReady(page)
      await expect(page.getByText('Sibling Habit', { exact: true })).toBeVisible()
      expect(await getState(request)).toEqual(remaining)
    }
  })
}

for (const design of ['standard', 'quiet-momentum', 'rhythm-ledger', 'orbit', 'sunday-club']) {
  test(`${design} dashboard opens the selected reserved-ID Habit`, async ({ page, request }) => {
    const id = 'record?imported/#%2F\\tail 歩く'
    await page.setViewportSize({ width: 390, height: 900 })
    await resetAppData(request, {
      habits: [makeHabit({ id: 'record', name: 'Sibling Habit' }), makeHabit({ id, name: 'Imported Habit' })],
      settings: { design }
    })
    await page.goto('/')
    await waitForAppReady(page)
    await page.getByText('Imported Habit', { exact: true }).click()
    await expect(page.getByRole('heading', { level: 1, name: 'Imported Habit', exact: true })).toBeVisible()
    expect(new URL(page.url()).pathname).toBe(`/habit/${encodeURIComponent(id)}`)
  })
}
