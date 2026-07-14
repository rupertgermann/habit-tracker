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
  test('journal controls and empty state reflow cleanly on narrow mobile screens', async ({ page, request }) => {
    await page.setViewportSize({ width: 320, height: 720 })
    await resetAppData(request)

    await page.goto('/journal')
    await waitForAppReady(page)

    const title = page.getByRole('heading', { name: 'Journal', exact: true })
    const backButton = page.getByRole('button', { name: 'Back to Dashboard', exact: true })
    const previousButton = page.getByRole('button', { name: 'Previous', exact: true })
    const nextButton = page.getByRole('button', { name: 'Next', exact: true })
    const weekRange = page.locator('h2').filter({ hasText: ' - ' })
    const emptyPanel = page
      .getByText('No journal entries this week', { exact: true })
      .locator('..')

    const [titleBox, backBox, previousBox, nextBox, rangeBox, emptyBox] = await Promise.all([
      title.boundingBox(),
      backButton.boundingBox(),
      previousButton.boundingBox(),
      nextButton.boundingBox(),
      weekRange.boundingBox(),
      emptyPanel.boundingBox()
    ])

    for (const box of [titleBox, backBox, previousBox, nextBox, rangeBox, emptyBox]) {
      expect(box).not.toBeNull()
    }

    expect(backBox.y).toBeGreaterThanOrEqual(titleBox.y + titleBox.height + 8)
    expect(rangeBox.y + rangeBox.height).toBeLessThanOrEqual(previousBox.y)
    expect(Math.abs(previousBox.y - nextBox.y)).toBeLessThanOrEqual(1)
    expect(rangeBox.height).toBeLessThanOrEqual(40)
    expect(emptyBox.width).toBeGreaterThanOrEqual(256)
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

    await page.goto('/journal')
    await waitForAppReady(page)

    await expect(page.getByText(updatedContent, { exact: true })).toHaveCount(0)
    await expect(page.getByText('No journal entries this week', { exact: true })).toBeVisible()
  })
})
