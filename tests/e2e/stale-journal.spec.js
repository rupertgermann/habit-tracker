import { expect, test } from './fixtures.js'
import { makeHabit, makeJournalEntry, resetAppData, waitForAppReady } from './helpers.js'

const habit = makeHabit({ id: 'shared-journal-habit', name: 'Shared Journal Habit' })
const original = makeJournalEntry({ id: 'shared-entry', habitId: habit.id, content: 'Original reflection', moodId: 'good' })
const getState = async request => (await request.get('/api/state')).json()
const editor = page => page.getByPlaceholder('Reflect on your experience, challenges, or achievements...')
const journalResponse = page => page.waitForResponse(response =>
  response.url().endsWith(`/api/journal/${original.id}`) && response.request().method() === 'PUT'
)
const entryCard = (page, content) => page.getByText(content, { exact: true })
  .locator('xpath=ancestor::*[.//button[normalize-space()="Delete"]][1]')
const openEditor = async (page, surface) => {
  await page.goto(surface === 'habit detail' ? `/habit/${habit.id}` : '/journal')
  await waitForAppReady(page)
  if (surface === 'habit detail') {
    await entryCard(page, original.content).getByRole('button', { name: 'Edit', exact: true }).click()
  } else {
    await page.getByRole('button', { name: 'Add Entry', exact: true }).click()
    await page.getByRole('button', { name: 'Journal entry habit', exact: true }).click()
    await page.getByRole('option', { name: habit.name, exact: true }).click()
  }
  await expect(editor(page)).toHaveValue(original.content)
}

for (const surface of ['habit detail', 'timeline']) {
  test(`${surface} keeps a stale mood-only draft, reconciles the saved entry, and waits for an explicit retry`, async ({ page, context, request }) => {
    await resetAppData(request, { habits: [habit], journalEntries: [original] })
    const stale = await context.newPage()
    await openEditor(page, 'habit detail')
    await openEditor(stale, surface)
    const save = stale.getByRole('button', { name: surface === 'habit detail' ? 'Save Entry' : 'Update Entry', exact: true })
    const mood = stale.getByRole('button', { name: '😄 Very Good', exact: true })
    await mood.click()
    await expect(mood).toHaveAttribute('aria-pressed', 'true')
    const staleWrites = []
    stale.on('request', request => {
      if (request.url().endsWith(`/api/journal/${original.id}`) && request.method() === 'PUT') {
        staleWrites.push(request.postDataJSON())
      }
    })

    await editor(page).fill('Newer reflection from the other tab')
    const accepted = journalResponse(page)
    await page.getByRole('button', { name: 'Save Entry', exact: true }).click()
    expect((await accepted).status()).toBe(200)
    const committed = (await getState(request)).journalEntries[0]
    const rejected = journalResponse(stale)
    await save.click()
    expect((await rejected).status()).toBe(409)
    await expect(stale.getByRole('alert')).toContainText('Your draft is kept')
    await expect(editor(stale)).toHaveValue(original.content)
    await expect(mood).toHaveAttribute('aria-pressed', 'true')
    expect((await getState(request)).journalEntries).toEqual([committed])
    expect(staleWrites).toHaveLength(1)
    expect(staleWrites[0]).toMatchObject({ content: original.content, moodId: 'very-good' })

    if (surface === 'habit detail') {
      await stale.getByRole('button', { name: 'Cancel', exact: true }).click()
      await expect(stale.getByText(committed.content, { exact: true })).toBeVisible()
      await entryCard(stale, committed.content).getByRole('button', { name: 'Edit', exact: true }).click()
      await expect(editor(stale)).toHaveValue(original.content)
      await expect(mood).toHaveAttribute('aria-pressed', 'true')
    } else {
      await expect(stale.getByText(committed.content, { exact: true })).toBeVisible()
    }

    await editor(stale).fill('Reviewed newer reflection with my mood')
    const retry = journalResponse(stale)
    await save.click()
    expect((await retry).status()).toBe(200)
    await expect(editor(stale)).toHaveCount(0)
    expect(staleWrites).toHaveLength(2)
    expect(staleWrites[1].revision).toBe(committed.revision)
    expect((await getState(request)).journalEntries[0]).toMatchObject({
      content: 'Reviewed newer reflection with my mood', moodId: 'very-good'
    })
    await stale.close()
  })

  test(`${surface} keeps a draft when the entry was deleted in another tab`, async ({ page, context, request }) => {
    await resetAppData(request, { habits: [habit], journalEntries: [original] })
    const stale = await context.newPage()
    await openEditor(stale, surface)
    await editor(stale).fill('Keep my draft after deletion')
    await page.goto(`/habit/${habit.id}`)
    await waitForAppReady(page)
    await page.getByRole('button', { name: 'Delete', exact: true }).click()
    await expect.poll(async () => (await getState(request)).journalEntries.length).toBe(0)
    const rejected = journalResponse(stale)
    await stale.getByRole('button', { name: surface === 'habit detail' ? 'Save Entry' : 'Update Entry', exact: true }).click()
    expect((await rejected).status()).toBe(404)
    await expect(stale.getByRole('alert')).toContainText('deleted in another tab. Your draft is kept')
    await expect(editor(stale)).toHaveValue('Keep my draft after deletion')
    expect((await getState(request)).journalEntries).toEqual([])
    await expect(stale.getByRole('button', { name: 'Save Entry', exact: true })).toBeEnabled()
    await stale.close()
  })
}
