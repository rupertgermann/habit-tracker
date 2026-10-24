import { expect, test } from '@playwright/test'
import { resetAppData, waitForAppReady } from './helpers.js'

test('failed Daily Reminder reads block writes until retry recovers saved settings', async ({ page, request }) => {
  const saved = { enabled: true, time: '18:45' }
  await resetAppData(request, { settings: { dailyReminder: saved } })
  await page.addInitScript(() => {
    class FakeNotification {
      static permission = 'granted'
      static async requestPermission() { return 'granted' }
    }
    Object.defineProperty(window, 'Notification', { configurable: true, value: FakeNotification })
  })
  const writes = []
  page.on('request', req => {
    if (req.url().endsWith('/api/settings/dailyReminder') && req.method() === 'PUT') writes.push(req.postDataJSON())
  })
  const unavailable = route => route.request().method() === 'GET'
    ? route.fulfill({ status: 503, contentType: 'application/json', body: '{}' }) : route.continue()
  await page.route('**/api/settings/dailyReminder', unavailable)
  await page.goto('/settings')
  await waitForAppReady(page)
  const enabled = page.getByRole('checkbox', { name: 'Daily Reminder', exact: true })
  const time = page.getByLabel('Reminder Time', { exact: true })
  await expect(page.getByRole('alert')).toContainText('Could not load Daily Reminder settings')
  await expect(enabled).toBeDisabled()
  await expect(time).toBeDisabled()
  const read = async () => (await (await request.get('/api/state')).json()).settings.dailyReminder
  expect(await read()).toEqual(saved)
  expect(writes).toEqual([])

  await page.unroute('**/api/settings/dailyReminder', unavailable)
  await page.getByRole('button', { name: 'Retry Daily Reminder', exact: true }).click()
  await expect(enabled).toBeEnabled()
  await expect(enabled).toBeChecked()
  await expect(time).toHaveValue(saved.time)
  await expect(page.getByRole('alert')).toHaveCount(0)
  expect(writes).toEqual([])
  await time.fill('19:00')
  await expect.poll(read).toEqual({ enabled: true, time: '19:00' })
  expect(writes).toEqual([{ value: { enabled: true, time: '19:00' } }])
  await page.reload()
  await waitForAppReady(page)
  await expect(enabled).toBeChecked()
  await expect(time).toHaveValue('19:00')
})
