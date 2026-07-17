import fs from 'node:fs/promises'
import { expect, test } from '@playwright/test'
import {
  makeCompletion,
  makeHabit,
  makeJournalEntry,
  resetAppData,
  waitForAppReady
} from './helpers.js'

const getState = async request => {
  const response = await request.get('/api/state')
  expect(response.ok()).toBe(true)
  return response.json()
}

const makeState = (suffix = 'restored') => {
  const habit = makeHabit({
    id: `${suffix}-habit`,
    name: `${suffix} Habit`,
    completions: [makeCompletion('2026-07-15')]
  })

  return {
    habits: [habit],
    categories: [{
      id: `${suffix}-category`,
      name: `${suffix} Category`,
      color: '#123456',
      icon: 'books'
    }],
    journalEntries: [makeJournalEntry({
      id: `${suffix}-entry`,
      habitId: habit.id,
      date: '2026-07-15',
      content: `${suffix} reflection`
    })],
    settings: {
      profile: {
        name: `${suffix} User`,
        email: `${suffix}@example.com`,
        avatarImage: 'data:image/png;base64,avatar'
      },
      theme: 'dark',
      design: 'orbit',
      preferences: {
        weekStartsOn: 1
      },
      unknownSetting: {
        suffix
      }
    }
  }
}

const canonicalDocument = state => ({
  formatVersion: 2,
  metadata: {
    createdAt: '2026-07-16T09:10:11.000Z'
  },
  state
})

const chooseRestoreFile = async (page, document, name = 'backup.json') => {
  const chooserPromise = page.waitForEvent('filechooser')
  await page.getByText('Restore Data', { exact: true }).click()
  const chooser = await chooserPromise
  await chooser.setFiles({
    name,
    mimeType: 'application/json',
    buffer: Buffer.from(typeof document === 'string' ? document : JSON.stringify(document))
  })
}

test.beforeEach(async ({ request }) => {
  await resetAppData(request)
})

test('downloaded canonical backup contains the complete persisted state', async ({ page, request }) => {
  const seededState = makeState('backup')
  await resetAppData(request, seededState)
  await page.goto('/settings')
  await waitForAppReady(page)
  const persistedState = await getState(request)

  const downloadPromise = page.waitForEvent('download')
  await page.getByText('Backup Data', { exact: true }).click()
  const download = await downloadPromise
  const path = await download.path()
  const document = JSON.parse(await fs.readFile(path, 'utf8'))

  expect(download.suggestedFilename()).toMatch(/^habit-tracker-backup-\d{4}-\d{2}-\d{2}\.json$/)
  expect(document.formatVersion).toBe(2)
  expect(document.metadata.createdAt).toMatch(/^\d{4}-\d{2}-\d{2}T/)
  expect(document.state).toEqual(persistedState)
  await expect(page.getByText('Backup created successfully')).toBeVisible()
})

test('valid canonical restore commits complete state before reloading', async ({ page, request }) => {
  const restoredState = makeState('canonical')
  await page.goto('/settings')
  await waitForAppReady(page)
  page.on('dialog', dialog => dialog.accept())

  const responsePromise = page.waitForResponse(response =>
    response.url().endsWith('/api/restore') && response.request().method() === 'POST'
  )
  await chooseRestoreFile(page, canonicalDocument(restoredState), 'canonical.json')
  const response = await responsePromise
  expect(response.ok()).toBe(true)
  expect(await response.json()).toEqual({
    ok: true,
    state: restoredState
  })
  expect(await getState(request)).toEqual(restoredState)

  await page.waitForEvent('load')
  await waitForAppReady(page)
  expect(await getState(request)).toEqual(restoredState)
  await expect(page.getByText('canonical User')).toBeVisible()
})

test('valid legacy version 1.0.0 restore supplies safe defaults', async ({ page, request }) => {
  const legacyState = makeState('legacy')
  const { categories, ...legacyCollections } = legacyState
  await page.goto('/settings')
  await waitForAppReady(page)
  page.on('dialog', dialog => dialog.accept())

  await chooseRestoreFile(page, {
    version: '1.0.0',
    backupDate: '2025-01-02T03:04:05.000Z',
    ...legacyCollections
  }, 'legacy.json')

  await expect.poll(async () => {
    const state = await getState(request)
    return {
      habitIds: state.habits.map(habit => habit.id),
      categoryIds: state.categories.map(category => category.id),
      settings: state.settings
    }
  }).toEqual({
    habitIds: ['legacy-habit'],
    categoryIds: [
      'health',
      'productivity',
      'mindfulness',
      'learning',
      'social',
      'creativity',
      'other'
    ],
    settings: legacyState.settings
  })
})

test('invalid backup is rejected before confirmation or restore transport', async ({ page }) => {
  let restoreCalls = 0
  let dialogCalls = 0
  await page.route('**/api/restore', async route => {
    restoreCalls += 1
    await route.continue()
  })
  page.on('dialog', dialog => {
    dialogCalls += 1
    dialog.dismiss()
  })
  await page.goto('/settings')
  await waitForAppReady(page)

  await chooseRestoreFile(page, '{', 'invalid.json')

  await expect(page.getByText('Backup file is not valid JSON')).toBeVisible()
  expect(restoreCalls).toBe(0)
  expect(dialogCalls).toBe(0)
})

test('restore transport failure preserves state and does not reload', async ({ page, request }) => {
  const priorState = makeState('prior')
  await resetAppData(request, priorState)
  await page.goto('/settings')
  await waitForAppReady(page)
  await expect(page.getByText('prior User', { exact: true })).toBeVisible()
  await expect(page.getByText('prior@example.com', { exact: true })).toBeVisible()
  await expect(page.getByRole('radio', { name: 'Orbit' })).toBeChecked()
  await expect(page.getByRole('checkbox', { name: 'Dark Mode' })).toBeChecked()
  await expect(page.getByRole('button', { name: 'Week Starts On' })).toHaveText('Monday')
  page.on('dialog', dialog => dialog.accept())
  let navigationCount = 0
  page.on('framenavigated', () => {
    navigationCount += 1
  })
  await page.route('**/api/restore', route => route.fulfill({
    status: 500,
    contentType: 'application/json',
    body: JSON.stringify({ error: 'forced restore failure' })
  }))

  await chooseRestoreFile(page, canonicalDocument(makeState('failed')), 'failed.json')

  await expect(page.getByText('Failed to restore data')).toBeVisible()
  await page.waitForTimeout(1700)
  expect(navigationCount).toBe(0)
  expect(await getState(request)).toEqual(priorState)
  await expect(page.getByText('prior User', { exact: true })).toBeVisible()
  await expect(page.getByText('prior@example.com', { exact: true })).toBeVisible()
  await expect(page.getByText('failed User', { exact: true })).toHaveCount(0)
  await expect(page.getByRole('radio', { name: 'Orbit' })).toBeChecked()
  await expect(page.getByRole('checkbox', { name: 'Dark Mode' })).toBeChecked()
  await expect(page.getByRole('button', { name: 'Week Starts On' })).toHaveText('Monday')
})
