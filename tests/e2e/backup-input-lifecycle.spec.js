import { expect, test } from './fixtures.js'
import { resetAppData } from './helpers.js'

test.use({ launchOptions: { args: ['--js-flags=--expose-gc'] } })

test('restore remains usable when garbage collection runs while the chooser opens', async ({ page, request }) => {
  const profile = { name: 'Existing person', email: 'existing@example.com', avatarImage: null }
  await resetAppData(request, { settings: { profile } })
  await page.goto('/settings')
  // Make collection of an unrooted file input deterministic during chooser resolution.
  const collectionTimer = await page.evaluate(() => window.setInterval(() => window.gc(), 1))
  try {
    for (const file of [[], { name: 'bad.json', mimeType: 'application/json', buffer: Buffer.from('{}') }, []]) {
      await expect(page.getByRole('button', { name: 'Edit', exact: true })).toBeEnabled()
      const chooser = page.waitForEvent('filechooser')
      await page.getByText('Restore Data', { exact: true }).click()
      await (await chooser).setFiles(file)
      await expect(page.getByRole('button', { name: 'Edit', exact: true })).toBeEnabled()
    }
    const response = await request.get('/api/state')
    expect(response.ok()).toBe(true)
    expect((await response.json()).settings.profile).toEqual(profile)
  } finally {
    await page.evaluate(timer => window.clearInterval(timer), collectionTimer)
  }
})
