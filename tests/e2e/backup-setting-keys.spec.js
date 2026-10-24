import fs from 'node:fs'
import { expect, test } from './fixtures.js'
import { makeHabit, makeJournalEntry, resetAppData, waitForAppReady } from './helpers.js'

const readState = async request => (await (await request.get('/api/state')).json())
const withoutRevisions = state => ({
  ...state,
  habits: state.habits.map(({ revision, ...habit }) => habit),
  journalEntries: state.journalEntries.map(({ revision, ...entry }) => entry)
})

test('a downloaded backup preserves prototype-named settings through clear and restore', async ({ page, request }) => {
  const settings = JSON.parse('{"__proto__":{"profile":{"name":17}},"constructor":{"keep":"constructor"},"toString":["saved"],"future":{"keep":true},"profile":{"name":"Backup User","email":"backup@example.com","avatarImage":null}}')
  const habit = makeHabit({ id: 'keeper', name: 'Keep this Habit' })
  await resetAppData(request, {
    habits: [habit], journalEntries: [makeJournalEntry({ habitId: habit.id, content: 'Keep this reflection' })], settings
  })
  await page.goto('/settings')
  await waitForAppReady(page)
  const prior = await readState(request)
  expect(prior.settings).toEqual(settings)
  const downloading = page.waitForEvent('download')
  await page.getByText('Backup Data', { exact: true }).click()
  const download = await downloading
  const file = await download.path()
  const document = JSON.parse(fs.readFileSync(file, 'utf8'))
  expect(document.state).toEqual(prior)
  for (const key of ['__proto__', 'constructor', 'toString']) {
    expect(Object.hasOwn(document.state.settings, key)).toBe(true)
  }
  await resetAppData(request)
  await page.reload()
  await waitForAppReady(page)
  page.on('dialog', dialog => dialog.accept())
  const choosing = page.waitForEvent('filechooser')
  await page.getByText('Restore Data', { exact: true }).click()
  const chooser = await choosing
  const reloaded = page.waitForEvent('load')
  await chooser.setFiles(file)
  await reloaded
  await waitForAppReady(page)
  expect(withoutRevisions(await readState(request))).toEqual(withoutRevisions(prior))
  await expect(page.getByRole('heading', { name: 'Backup User', exact: true })).toBeVisible()
})
