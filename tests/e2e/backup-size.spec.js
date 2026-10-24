import fs from 'node:fs/promises'
import { expect, test } from './fixtures.js'
import { MAX_BACKUP_BYTES, BACKUP_SIZE_ERROR_MESSAGE } from '../../shared/backupLimits.mjs'
import { makeHabit, makeJournalEntry, resetAppData, waitForAppReady } from './helpers.js'

const getState = async request => {
  const response = await request.get('/api/state')
  expect(response.ok()).toBe(true)
  return response.json()
}

test('a downloaded canonical backup above 5 MiB restores its committed contents', async ({ page, request }) => {
  const habit = makeHabit({ id: 'large-backup', name: 'Large backup' })
  await resetAppData(request, {
    habits: [habit],
    journalEntries: Array.from({ length: 6 }, (_, index) => makeJournalEntry({
      id: `large-entry-${index}`, habitId: habit.id, content: 'a'.repeat(900_000)
    })),
    settings: { profile: { name: 'Large backup user' } }
  })
  await page.goto('/settings')
  await waitForAppReady(page)
  const persisted = await getState(request)

  const downloading = page.waitForEvent('download')
  await page.getByText('Backup Data', { exact: true }).click()
  const download = await downloading
  const filePath = await download.path()
  const serialized = await fs.readFile(filePath, 'utf8')
  expect(Buffer.byteLength(serialized)).toBeGreaterThan(5 * 1024 * 1024)
  expect(Buffer.byteLength(serialized)).toBeLessThanOrEqual(MAX_BACKUP_BYTES)
  expect(JSON.parse(serialized).state).toEqual(persisted)
  await expect(page.getByText('Backup created successfully').last()).toBeVisible()

  await resetAppData(request)
  await page.reload()
  await waitForAppReady(page)
  page.on('dialog', dialog => dialog.accept())
  const restoring = page.waitForResponse(response =>
    response.url().endsWith('/api/restore') && response.request().method() === 'POST')
  const reloading = page.waitForEvent('load')
  const choosing = page.waitForEvent('filechooser')
  await page.getByText('Restore Data', { exact: true }).click()
  await (await choosing).setFiles(filePath)
  const response = await restoring
  expect(response.ok()).toBe(true)
  const committed = await response.json()
  expect(committed.ok).toBe(true)
  expect(committed.state.habits[0].revision).not.toBe(persisted.habits[0].revision)
  for (const [index, entry] of committed.state.journalEntries.entries()) {
    expect(entry.revision).not.toBe(persisted.journalEntries[index].revision)
  }
  const withoutRevisions = state => ({
    ...state,
    habits: state.habits.map(({ revision, ...record }) => record),
    journalEntries: state.journalEntries.map(({ revision, ...record }) => record)
  })
  expect(withoutRevisions(committed.state)).toEqual(withoutRevisions(persisted))
  expect(await getState(request)).toEqual(committed.state)
  await expect(page.getByText('Data restored successfully').last()).toBeVisible()
  await reloading
  await waitForAppReady(page)
  await expect(page.getByText('Large backup user', { exact: true })).toBeVisible()
  expect(await getState(request)).toEqual(committed.state)
})

test('oversized backup selection explains the limit without a restore request or mutation', async ({ page, request }) => {
  await resetAppData(request, { habits: [makeHabit({ id: 'preserved', name: 'Preserved Habit' })] })
  await page.goto('/settings')
  await waitForAppReady(page)
  const prior = await getState(request)
  let restoreRequests = 0
  let confirmations = 0
  page.on('request', request => {
    if (request.url().endsWith('/api/restore') && request.method() === 'POST') restoreRequests += 1
  })
  page.on('dialog', dialog => { confirmations += 1; dialog.dismiss() })
  const choosing = page.waitForEvent('filechooser')
  await page.getByText('Restore Data', { exact: true }).click()
  await (await choosing).setFiles({
    name: 'oversized.json', mimeType: 'application/json', buffer: Buffer.alloc(MAX_BACKUP_BYTES + 1, ' ')
  })
  await expect(page.getByText(BACKUP_SIZE_ERROR_MESSAGE).last()).toBeVisible()
  await expect(page.getByText('Data restored successfully')).toHaveCount(0)
  expect(confirmations).toBe(0)
  expect(restoreRequests).toBe(0)
  expect(await getState(request)).toEqual(prior)
})
