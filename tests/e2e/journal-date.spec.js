import { expect, test } from '@playwright/test'
import { makeHabit, makeJournalEntry, resetAppData, waitForAppReady } from './helpers.js'

for (const timezoneId of ['America/Los_Angeles', 'Europe/Berlin']) {
  test.describe(timezoneId, () => {
    test.use({ timezoneId })
    test('Journal date headings preserve calendar dates and local timestamp times', async ({ page, request }) => {
      await page.clock.install({ time: new Date('2026-10-23T12:00:00Z') })
      const habit = makeHabit({ createdAt: '2026-10-01T12:00:00Z' })
      const entry = makeJournalEntry({ habitId: habit.id, date: '2026-10-23', createdAt: '2026-10-23T12:00:00Z', content: 'Timezone reflection' })
      await resetAppData(request, { habits: [habit], journalEntries: [entry] })
      await page.goto('/journal')
      await waitForAppReady(page)
      await expect(page.getByText('Friday, October 23, 2026', { exact: true })).toBeVisible()
      const localTime = timezoneId === 'America/Los_Angeles' ? '5:00 AM' : '2:00 PM'
      await expect(page.getByText(`Added ${localTime}`, { exact: true })).toBeVisible()
      await page.goto(`/habit/${habit.id}`)
      await waitForAppReady(page)
      await expect(page.getByText('Oct 23, 2026', { exact: true })).toBeVisible()
      await expect(page.getByText('Timezone reflection', { exact: true })).toBeVisible()
      await expect(page.getByText(localTime, { exact: true })).toBeVisible()
    })
  })
}
