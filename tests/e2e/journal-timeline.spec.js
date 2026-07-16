import { expect, test } from '@playwright/test'
import {
  addDays,
  localDateKey,
  makeHabit,
  makeJournalEntry,
  resetAppData,
  waitForAppReady
} from './helpers.js'

const reflectionInput = 'Reflect on your experience, challenges, or achievements...'

const getState = async (request) => {
  const response = await request.get('/api/state')
  expect(response.ok()).toBeTruthy()
  return response.json()
}

const getEntriesForHabitDate = async (request, habitId, date) => {
  const state = await getState(request)
  return state.journalEntries.filter(entry => entry.habitId === habitId && entry.date === date)
}

const journalEntryCardFor = (page, content) =>
  page
    .getByText(content, { exact: true })
    .locator('xpath=ancestor::*[.//button[normalize-space()="Edit"] and .//button[normalize-space()="Delete"]][1]')

const moodButton = (page, moodName) =>
  page.locator('button').filter({
    has: page.locator('span', { hasText: new RegExp(`^${moodName}$`) })
  })

test.describe('journal timeline regression coverage', () => {
  test('failed Journal Entry create keeps the draft and reports failure without success', async ({ page, request }) => {
    const habit = makeHabit({
      id: 'journal-create-failure-habit',
      name: 'Journal Create Failure'
    })
    const draft = 'Keep this exact reflection available for retry'
    await resetAppData(request, { habits: [habit] })

    await page.route('**/api/journal', async route => {
      if (route.request().method() === 'POST') {
        await route.fulfill({ status: 500, contentType: 'application/json', body: '{}' })
        return
      }
      await route.continue()
    })

    await page.goto(`/habit/${habit.id}`)
    await waitForAppReady(page)
    await moodButton(page, 'Very Good').click()
    const editor = page.getByPlaceholder(reflectionInput)
    await editor.fill(draft)
    await page.getByRole('button', { name: 'Save Entry' }).click()

    await expect(page.getByText('Failed to add journal entry. Please try again.')).toBeVisible()
    await expect(page.getByText('Journal entry added successfully!')).toHaveCount(0)
    await expect(editor).toHaveValue(draft)
    await expect(page.getByRole('button', { name: 'Save Entry' })).toBeEnabled()
    expect(await getEntriesForHabitDate(request, habit.id, localDateKey())).toEqual([])
  })

  test('failed Journal Entry update restores committed state and keeps the revision available for retry', async ({ page, request }) => {
    const today = localDateKey()
    const habit = makeHabit({
      id: 'journal-update-failure-habit',
      name: 'Journal Update Failure'
    })
    const committedContent = 'Previously committed reflection'
    const draft = 'Keep this revised reflection available for retry'
    await resetAppData(request, {
      habits: [habit],
      journalEntries: [makeJournalEntry({
        id: 'journal-update-failure-entry',
        habitId: habit.id,
        date: today,
        content: committedContent,
        moodId: 'good'
      })]
    })

    await page.route('**/api/journal/*', async route => {
      if (route.request().method() === 'PUT') {
        await route.fulfill({ status: 500, contentType: 'application/json', body: '{}' })
        return
      }
      await route.continue()
    })

    await page.goto(`/habit/${habit.id}`)
    await waitForAppReady(page)
    await journalEntryCardFor(page, committedContent)
      .getByRole('button', { name: /^Edit$/ })
      .click()
    await moodButton(page, 'Very Good').click()
    const editor = page.getByPlaceholder(reflectionInput)
    await editor.fill(draft)
    await page.getByRole('button', { name: 'Save Entry' }).click()

    await expect(page.getByText('Failed to update journal entry. Please try again.')).toBeVisible()
    await expect(page.getByText('Journal entry updated successfully!')).toHaveCount(0)
    await expect(editor).toHaveValue(draft)
    await page.getByRole('button', { name: 'Cancel' }).click()
    await expect(page.getByText(committedContent, { exact: true })).toBeVisible()
    await journalEntryCardFor(page, committedContent)
      .getByRole('button', { name: /^Edit$/ })
      .click()
    await expect(editor).toHaveValue(draft)

    const entries = await getEntriesForHabitDate(request, habit.id, today)
    expect(entries).toHaveLength(1)
    expect(entries[0]).toMatchObject({
      content: committedContent,
      moodId: 'good'
    })
  })

  test('failed Journal Entry deletion keeps visible and persisted state without success feedback', async ({ page, request }) => {
    const today = localDateKey()
    const habit = makeHabit({
      id: 'journal-delete-failure-habit',
      name: 'Journal Delete Failure'
    })
    const content = 'This reflection must survive a failed deletion'
    await resetAppData(request, {
      habits: [habit],
      journalEntries: [makeJournalEntry({
        id: 'journal-delete-failure-entry',
        habitId: habit.id,
        date: today,
        content
      })]
    })

    await page.route('**/api/journal/*', async route => {
      if (route.request().method() === 'DELETE') {
        await route.fulfill({ status: 500, contentType: 'application/json', body: '{}' })
        return
      }
      await route.continue()
    })

    await page.goto(`/habit/${habit.id}`)
    await waitForAppReady(page)
    await page.getByRole('button', { name: /^Delete$/ }).click()

    await expect(page.getByText('Failed to delete journal entry. Please try again.')).toBeVisible()
    await expect(page.getByText('Journal entry deleted successfully!')).toHaveCount(0)
    await expect(page.getByText(content, { exact: true })).toBeVisible()
    expect(await getEntriesForHabitDate(request, habit.id, today)).toHaveLength(1)
  })

  test('creates, searches, edits, and deletes habit journal entries through the app surface', async ({ page, request }) => {
    await page.setViewportSize({ width: 390, height: 900 })

    const today = new Date()
    const todayKey = localDateKey(today)
    const outsideWeekKey = localDateKey(addDays(today, -8))
    const habit = makeHabit({
      id: 'journal-e2e-habit',
      name: 'Morning Mobility',
      icon: 'M',
      color: '#0EA5E9'
    })
    const outsideWeekContent = 'Needle reflection from the previous week'
    const createdContent = 'Needle reflection created from habit detail'
    const updatedContent = 'Edited journal timeline reflection'

    await resetAppData(request, {
      habits: [habit],
      journalEntries: [
        makeJournalEntry({
          id: 'outside-selected-week',
          habitId: habit.id,
          date: outsideWeekKey,
          content: outsideWeekContent,
          moodId: 'bad',
          createdAt: `${outsideWeekKey}T09:00:00.000Z`
        })
      ]
    })

    await page.goto(`/habit/${habit.id}`)
    await waitForAppReady(page)

    await expect(page.getByRole('heading', { name: habit.name })).toBeVisible()
    await moodButton(page, 'Good').click()
    await page.getByPlaceholder(reflectionInput).fill(createdContent)
    await page.getByRole('button', { name: 'Save Entry' }).click()

    await expect(page.getByText(createdContent, { exact: true })).toBeVisible()
    await expect(page.getByText(/Good/)).toBeVisible()
    await expect.poll(async () => {
      const entries = await getEntriesForHabitDate(request, habit.id, todayKey)
      return entries.map(entry => `${entry.content}|${entry.moodId}`).join(',')
    }).toBe(`${createdContent}|good`)

    await page.reload()
    await waitForAppReady(page)
    await expect(page.getByText(createdContent, { exact: true })).toBeVisible()
    await expect(page.getByText(/Good/)).toBeVisible()

    await page.goto('/journal')
    await waitForAppReady(page)

    await expect(page.getByText(createdContent, { exact: true })).toBeVisible()
    await expect(page.getByText(habit.name)).toBeVisible()
    await expect(page.getByText(outsideWeekContent, { exact: true })).toHaveCount(0)

    const search = page.getByPlaceholder('Search journal entries...')
    await search.fill('needle')
    await expect(page.getByText(createdContent, { exact: true })).toBeVisible()
    await expect(page.getByText(outsideWeekContent, { exact: true })).toHaveCount(0)
    await expect(page.getByText('Matching Entries', { exact: true })).toBeVisible()

    await search.fill(habit.name)
    await expect(page.getByText(createdContent, { exact: true })).toBeVisible()
    await expect(page.getByText(outsideWeekContent, { exact: true })).toHaveCount(0)

    await page.goto(`/habit/${habit.id}`)
    await waitForAppReady(page)

    const createdCard = journalEntryCardFor(page, createdContent)
    await createdCard.getByRole('button', { name: /^Edit$/ }).click()
    await moodButton(page, 'Very Good').click()
    await page.getByPlaceholder(reflectionInput).fill(updatedContent)
    await page.getByRole('button', { name: 'Save Entry' }).click()

    await expect(page.getByText(updatedContent, { exact: true })).toBeVisible()
    await expect(page.getByText(createdContent, { exact: true })).toHaveCount(0)
    await expect(page.getByText(/Very Good/)).toBeVisible()
    await expect.poll(async () => {
      const entries = await getEntriesForHabitDate(request, habit.id, todayKey)
      return entries.map(entry => `${entry.content}|${entry.moodId}`).join(',')
    }).toBe(`${updatedContent}|very-good`)

    await page.reload()
    await waitForAppReady(page)
    await expect(page.getByText(updatedContent, { exact: true })).toBeVisible()
    await expect(page.getByText(createdContent, { exact: true })).toHaveCount(0)
    await expect(page.getByText(/Very Good/)).toBeVisible()

    await page.goto('/journal')
    await waitForAppReady(page)

    await expect(page.getByText(updatedContent, { exact: true })).toHaveCount(1)
    await expect(page.getByText(createdContent, { exact: true })).toHaveCount(0)
    await expect(page.getByText(/Very Good/)).toBeVisible()

    await page.goto(`/habit/${habit.id}`)
    await waitForAppReady(page)

    const updatedCard = journalEntryCardFor(page, updatedContent)
    await updatedCard.getByRole('button', { name: /^Delete$/ }).click()

    await expect(page.getByPlaceholder(reflectionInput)).toBeVisible()
    await expect(page.getByRole('button', { name: 'Save Entry' })).toBeDisabled()
    await expect(page.getByText(updatedContent, { exact: true })).toHaveCount(0)
    await expect.poll(async () => {
      const entries = await getEntriesForHabitDate(request, habit.id, todayKey)
      return entries.length
    }).toBe(0)

    await page.reload()
    await waitForAppReady(page)
    await expect(page.getByPlaceholder(reflectionInput)).toBeVisible()
    await expect(page.getByText(updatedContent, { exact: true })).toHaveCount(0)

    await page.goto('/journal')
    await waitForAppReady(page)

    await expect(page.getByText(updatedContent, { exact: true })).toHaveCount(0)
    await expect(page.getByText('No journal entries this week', { exact: true })).toBeVisible()
  })
})
