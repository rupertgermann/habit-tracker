import { test, expect } from '@playwright/test'
import { resetAppData, waitForAppReady } from './helpers'

for (const key of ['theme', 'design', 'preferences']) {
  test(`${key} read failure never saves a fallback and recovers on reload`, async ({ page, request }) => {
    const settings = { theme: 'dark', design: 'orbit', preferences: { weekStartsOn: 1 } }
    await resetAppData(request, { settings })
    await page.emulateMedia({ colorScheme: 'light' })
    const writes = []
    page.on('request', req => {
      if (req.method() === 'PUT' && req.url().includes('/api/settings/')) writes.push(req.url())
    })
    const settingUrl = `**/api/settings/${key}`
    await page.route(settingUrl, route => route.request().method() === 'GET'
      ? route.fulfill({ status: 503, body: 'Unavailable' })
      : route.continue())
    await page.goto('/settings')
    await waitForAppReady(page)
    expect(writes).toEqual([])
    const stored = await (await request.get('/api/state')).json()
    expect(stored.settings).toMatchObject(settings)

    await page.unroute(settingUrl)
    await page.reload()
    await waitForAppReady(page)
    const darkMode = page.getByRole('checkbox', { name: 'Dark Mode' })
    await expect(darkMode).toBeChecked()
    await expect(page.locator('html')).toHaveAttribute('data-design', 'orbit')
    await expect(page.getByRole('button', { name: 'Week Starts On' })).toHaveText('Monday')
    expect(writes).toEqual([])

    if (key === 'theme') {
      await page.locator('label').filter({ has: darkMode }).click()
    } else if (key === 'design') {
      await page.getByRole('radiogroup', { name: 'App design' }).getByText('Standard', { exact: true }).click()
    } else {
      await page.getByRole('button', { name: 'Week Starts On' }).click()
      await page.getByRole('option', { name: 'Sunday' }).click()
    }
    const expected = { theme: 'light', design: 'standard', preferences: { weekStartsOn: 0 } }[key]
    await expect.poll(async () => (await (await request.get('/api/state')).json()).settings[key]).toEqual(expected)
    await page.reload()
    await waitForAppReady(page)
    expect((await (await request.get('/api/state')).json()).settings[key]).toEqual(expected)
  })
}
