import { expect, test } from '@playwright/test'
import { makeHabit, resetAppData, waitForAppReady } from './helpers.js'

test('browser proxy permits app requests and rejects requests carrying an untrusted Origin', async ({ page, request }) => {
  await resetAppData(request, { habits: [makeHabit({ id: 'private', name: 'Private Habit' })] })
  await page.goto('/habits')
  await waitForAppReady(page)
  await expect(page.getByText('Private Habit', { exact: true })).toBeVisible()
  const prior = await (await request.get('/api/state')).json()
  await page.route('**/api/**', async route => {
    const response = await route.fetch({
      headers: { ...route.request().headers(), origin: 'https://untrusted.example' }
    })
    await route.fulfill({ response })
  })
  const statuses = await page.evaluate(async () => {
    const read = await fetch('/api/state')
    const write = await fetch('/api/data', { method: 'DELETE' })
    return [read.status, write.status]
  })
  expect(statuses).toEqual([403, 403])
  expect(await (await request.get('/api/state')).json()).toEqual(prior)
})
