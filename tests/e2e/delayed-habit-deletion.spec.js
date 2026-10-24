import { expect, test } from './fixtures.js'
import { makeHabit, makeJournalEntry, resetAppData, waitForAppReady } from './helpers.js'

test('a delayed DELETE response preserves unrelated Habit edits, creation, and Journal saves', async ({ page, request }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  const deletedHabit = makeHabit({ id: 'delayed-delete', name: 'Delete this Habit' })
  const keptHabit = makeHabit({ id: 'delayed-delete-kept', name: 'Original Habit name' })
  const relatedEntry = makeJournalEntry({ id: 'deleted-reflection', habitId: deletedHabit.id, content: 'Delete this reflection' })
  const keptEntry = makeJournalEntry({ id: 'kept-reflection', habitId: keptHabit.id, content: 'Original reflection' })
  await resetAppData(request, {
    habits: [deletedHabit, keptHabit],
    journalEntries: [relatedEntry, keptEntry]
  })

  let releaseDelete
  const responseGate = new Promise(resolve => { releaseDelete = resolve })
  let deletionSnapshot
  await page.route(`**/api/habits/${deletedHabit.id}`, async route => {
    if (route.request().method() !== 'DELETE') return route.continue()
    const response = await route.fetch()
    expect(response.ok()).toBe(true)
    deletionSnapshot = (await response.json()).state
    await responseGate
    await route.fulfill({ response })
  })

  await page.goto(`/habit/${deletedHabit.id}`)
  await waitForAppReady(page)
  page.once('dialog', dialog => dialog.accept())
  await page.getByRole('button', { name: 'Delete Habit', exact: true }).click()

  try {
    await expect.poll(() => deletionSnapshot?.habits.map(habit => habit.id)).toEqual([keptHabit.id])
    expect(deletionSnapshot.journalEntries).toEqual([
      expect.objectContaining({ id: keptEntry.id, content: keptEntry.content })
    ])

    const navigation = page.getByRole('navigation', { name: 'Primary navigation' })
    await navigation.getByRole('button', { name: 'Habits', exact: true }).click()
    await page.getByText(keptHabit.name, { exact: true }).click()
    await page.getByRole('button', { name: 'Edit Habit', exact: true }).click()
    await page.getByPlaceholder('e.g., Drink 8 glasses of water').fill('Newer Habit name')
    await page.getByRole('button', { name: 'Update Habit', exact: true }).click()
    await expect(page.getByText('Newer Habit name', { exact: true })).toBeVisible()

    await page.getByRole('button', { name: 'Add New', exact: true }).click()
    await page.getByPlaceholder('e.g., Drink 8 glasses of water').fill('Newly created Habit')
    await page.getByRole('button', { name: 'Create Habit', exact: true }).click()
    await expect(page.getByText('Newly created Habit', { exact: true })).toBeVisible()

    await page.getByText('Newer Habit name', { exact: true }).click()
    const entryCard = page.getByText(keptEntry.content, { exact: true })
      .locator('xpath=ancestor::*[.//button[normalize-space()="Delete"]][1]')
    await entryCard.getByRole('button', { name: 'Edit', exact: true }).click()
    await page.getByPlaceholder('Reflect on your experience, challenges, or achievements...').fill('Newer reflection')
    await page.getByRole('button', { name: 'Save Entry', exact: true }).click()
    await expect(page.getByText('Newer reflection', { exact: true })).toBeVisible()

    const committedState = await (await request.get('/api/state')).json()
    expect(committedState.habits).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: keptHabit.id, name: 'Newer Habit name' }),
      expect.objectContaining({ name: 'Newly created Habit' })
    ]))
    expect(committedState.habits).toHaveLength(2)
    expect(committedState.journalEntries).toEqual([
      expect.objectContaining({ id: keptEntry.id, content: 'Newer reflection' })
    ])

    const delivered = page.waitForResponse(response => response.url().endsWith(`/api/habits/${deletedHabit.id}`)
      && response.request().method() === 'DELETE')
    releaseDelete()
    expect((await delivered).ok()).toBe(true)
    await expect(page).toHaveURL(/\/habits$/)

    const expectCurrentCollections = async () => {
      await navigation.getByRole('button', { name: 'Habits', exact: true }).click()
      for (const habit of committedState.habits) {
        await expect(page.getByText(habit.name, { exact: true })).toBeVisible()
      }
      await expect(page.getByText(deletedHabit.name, { exact: true })).toHaveCount(0)
      await expect(page.getByRole('button', { name: 'All (2)', exact: true })).toBeVisible()
      await navigation.getByRole('button', { name: 'Journal', exact: true }).click()
      await expect(page.getByText(committedState.journalEntries[0].content, { exact: true })).toBeVisible()
      await expect(page.getByText(relatedEntry.content, { exact: true })).toHaveCount(0)
      await expect(page.getByText(keptEntry.content, { exact: true })).toHaveCount(0)
    }

    await expectCurrentCollections()
    await page.reload()
    await waitForAppReady(page)
    await expectCurrentCollections()
    expect(await (await request.get('/api/state')).json()).toEqual(committedState)
  } finally {
    releaseDelete()
  }
})
