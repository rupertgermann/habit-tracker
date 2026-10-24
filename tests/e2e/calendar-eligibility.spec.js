import { expect, test } from './fixtures.js'
import { makeHabit, makeCompletion, resetAppData, waitForAppReady } from './helpers.js'

test.use({ timezoneId: 'Europe/Berlin' })

for (const type of ['binary', 'count']) {
  test(`Calendar blocks ineligible ${type} additions and still removes existing logs`, async ({ page, request }) => {
    await page.clock.install({ time: new Date('2026-10-23T12:00:00Z') })
    const habit = makeHabit({
      type,
      createdAt: '2026-10-23T08:00:00Z',
      completions: [makeCompletion('2026-10-21'), makeCompletion('2026-10-25')]
    })
    await resetAppData(request, { habits: [habit] })
    await page.goto('/calendar')
    await waitForAppReady(page)
    const add = () => page.getByRole('button', { name: type === 'count' ? 'Add log' : 'Mark Complete', exact: true })
    for (const day of [22, 24]) {
      await page.getByRole('button', { name: `Select October ${day}, 2026`, exact: true }).click()
      await expect(add()).toBeDisabled()
    }
    for (const day of [21, 25]) {
      await page.getByRole('button', { name: `Select October ${day}, 2026`, exact: true }).click()
      if (type === 'count') await expect(add()).toBeDisabled()
      await page.getByRole('button', { name: type === 'count' ? 'Remove one' : 'Mark Incomplete', exact: true }).click()
      await expect.poll(async () => {
        const state = await (await request.get('/api/state')).json()
        return state.habits[0].completions.filter(c => c.date === `2026-10-${day}`).length
      }).toBe(0)
      await expect(add()).toBeDisabled()
    }
    await page.getByRole('button', { name: 'Select October 23, 2026', exact: true }).click()
    await expect(add()).toBeEnabled()
    await add().click()
    await expect.poll(async () => {
      const state = await (await request.get('/api/state')).json()
      return state.habits[0].completions.length
    }).toBe(1)
    await expect(page.getByText('Total Count', { exact: true }).locator('..')).toContainText('1')
  })
}
