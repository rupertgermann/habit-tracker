import { expect, test } from '@playwright/test'
import { makeHabit, makeJournalEntry, resetAppData, waitForAppReady } from './helpers.js'

const getState = async request => {
  const response = await request.get('/api/state')
  expect(response.ok()).toBe(true)
  return response.json()
}
const chooseBackup = async (page, state) => {
  const chooserPromise = page.waitForEvent('filechooser')
  await page.getByText('Restore Data', { exact: true }).click()
  const chooser = await chooserPromise
  await chooser.setFiles({
    name: 'record-ids.json',
    mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify({ formatVersion: 2, metadata: { createdAt: '2026-10-23T12:00:00Z' }, state }))
  })
}
const cardFor = (page, content) => page.getByText(content, { exact: true })
  .locator('xpath=ancestor::*[.//button[normalize-space()="Edit"] and .//button[normalize-space()="Delete"]][1]')

test('restored Journal IDs keep edit and delete on the selected reflection across reload', async ({ page, request }) => {
  const habit = makeHabit({ id: 'safe-habit', name: 'Read' })
  const otherHabit = makeHabit({ id: 'other-habit', name: 'Walk' })
  const target = makeJournalEntry({ id: 'entry?imported/#%2F\\tail', habitId: habit.id, content: 'Imported reflection' })
  const unrelated = makeJournalEntry({ id: 'entry', habitId: otherHabit.id, content: 'Unrelated reflection' })
  const restored = {
    habits: [habit, otherHabit],
    categories: [{ id: 'other', name: 'Other' }],
    journalEntries: [unrelated, target],
    settings: { unknownSetting: { preserved: true } }
  }
  await resetAppData(request)
  await page.goto('/settings')
  await waitForAppReady(page)
  page.on('dialog', dialog => dialog.accept())
  const restoreResponse = page.waitForResponse(response => response.url().endsWith('/api/restore') && response.request().method() === 'POST')
  const reload = page.waitForEvent('load')
  await chooseBackup(page, restored)
  expect((await restoreResponse).ok()).toBe(true)
  await reload
  await waitForAppReady(page)
  const prior = await getState(request)
  expect(prior.journalEntries).toEqual(restored.journalEntries)

  await page.goto(`/habit/${habit.id}`)
  await waitForAppReady(page)
  await cardFor(page, target.content).getByRole('button', { name: 'Edit', exact: true }).click()
  await page.getByPlaceholder('Reflect on your experience, challenges, or achievements...').fill('Revised imported reflection')
  await page.getByRole('button', { name: 'Save Entry', exact: true }).click()
  await expect(page.getByText('Journal entry updated successfully!')).toBeVisible()
  const edited = await getState(request)
  const editedTarget = edited.journalEntries.find(entry => entry.id === target.id)
  expect(editedTarget).toMatchObject({ ...target, content: 'Revised imported reflection' })
  expect(edited).toEqual({ ...prior, journalEntries: [unrelated, editedTarget] })

  await page.reload()
  await waitForAppReady(page)
  await cardFor(page, editedTarget.content).getByRole('button', { name: 'Delete', exact: true }).click()
  await expect(page.getByText('Journal entry deleted successfully!')).toBeVisible()
  expect(await getState(request)).toEqual({ ...prior, journalEntries: [unrelated] })
  await page.reload()
  await waitForAppReady(page)
  await expect(page.getByText(editedTarget.content, { exact: true })).toHaveCount(0)
  expect(await getState(request)).toEqual({ ...prior, journalEntries: [unrelated] })
  await page.goto(`/habit/${otherHabit.id}`)
  await waitForAppReady(page)
  await expect(page.getByText(unrelated.content, { exact: true })).toBeVisible()
})

test('standalone dot IDs in every imported collection are rejected before confirmation or transport', async ({ page, request }) => {
  const habit = makeHabit({ id: 'keeper', name: 'Keep this Habit' })
  await resetAppData(request, {
    habits: [habit],
    journalEntries: [makeJournalEntry({ habitId: habit.id, content: 'Keep this reflection' })],
    settings: { profile: { name: 'Preserved User' }, unknownSetting: { preserved: true } }
  })
  await page.goto('/settings')
  await waitForAppReady(page)
  const prior = await getState(request)
  let restoreCalls = 0
  let dialogCalls = 0
  page.on('request', request => {
    if (request.url().endsWith('/api/restore')) restoreCalls += 1
  })
  page.on('dialog', dialog => { dialogCalls += 1; dialog.dismiss() })
  for (const collection of ['habits', 'categories', 'journalEntries']) {
    for (const id of ['.', '..']) {
      const invalid = structuredClone(prior)
      invalid[collection][0].id = id
      await chooseBackup(page, invalid)
      await expect(page.getByText(`${collection} record id cannot be "." or ".."`, { exact: true }).last()).toBeVisible()
      expect(await getState(request)).toEqual(prior)
    }
  }
  expect(restoreCalls).toBe(0)
  expect(dialogCalls).toBe(0)
  await expect(page.getByText('Preserved User', { exact: true })).toBeVisible()
})
