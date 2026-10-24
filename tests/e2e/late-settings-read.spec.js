import { expect, test } from '@playwright/test'
import { resetAppData, waitForAppReady } from './helpers.js'

for (const key of ['preferences', 'theme', 'design']) {
  test(`a late initial ${key} response cannot replace a newer explicit selection`, async ({ page, request }) => {
    const settings = { preferences: { weekStartsOn: 0 }, theme: 'light', design: 'standard' }
    if (key === 'theme') settings.design = 'orbit'
    if (key === 'design') settings.theme = 'dark'
    await resetAppData(request, { settings })
    await page.emulateMedia({ colorScheme: 'light' })
    let release
    const gate = new Promise(resolve => { release = resolve })
    let held = 0
    await page.route(`**/api/settings/${key}`, async route => {
      if (route.request().method() !== 'GET') return route.continue()
      const response = await route.fetch()
      held++
      await gate
      await route.fulfill({ response })
    })
    await page.goto('/settings')
    await expect.poll(() => held).toBeGreaterThan(0)
    const selected = key === 'preferences' ? { weekStartsOn: 1 } : key === 'theme' ? 'dark' : 'rhythm-ledger'
    if (key === 'preferences') {
      await page.getByRole('button', { name: 'Week Starts On', exact: true }).click()
      await page.getByRole('option', { name: 'Monday', exact: true }).click()
    } else if (key === 'theme') {
      await page.locator('label').filter({ has: page.getByRole('checkbox', { name: 'Dark Mode', exact: true }) }).click()
    } else {
      await page.getByRole('radiogroup', { name: 'App design' }).getByText('Rhythm Ledger', { exact: true }).click()
    }
    const read = async () => (await (await request.get(`/api/settings/${key}`)).json()).value
    await expect.poll(read).toEqual(selected)
    const assertSelection = async () => {
      if (key === 'preferences') await expect(page.getByRole('button', { name: 'Week Starts On', exact: true })).toHaveText('Monday')
      else if (key === 'theme') await expect(page.getByRole('checkbox', { name: 'Dark Mode', exact: true })).toBeChecked()
      else await expect(page.getByRole('radio', { name: 'Rhythm Ledger', exact: true })).toBeChecked()
    }
    await assertSelection()
    release()
    await waitForAppReady(page)
    await assertSelection()
    if (key === 'theme') await expect(page.locator('html')).toHaveAttribute('data-design', 'orbit')
    if (key === 'design') await expect(page.getByRole('checkbox', { name: 'Dark Mode', exact: true })).toBeChecked()
    expect(await read()).toEqual(selected)
    await page.unroute(`**/api/settings/${key}`)
    await page.reload()
    await waitForAppReady(page)
    await assertSelection()
    expect(await read()).toEqual(selected)
  })
}
