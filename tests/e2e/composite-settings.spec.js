import { expect, test } from './fixtures.js'
import { resetAppData, waitForAppReady } from './helpers.js'

const avatarImage = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAYAAABytg0kAAAAFElEQVR42mP8z8AARLJgwiBqBgAe9gICN3XFoAAAAABJRU5ErkJggg=='
const readSetting = async (request, key) => (await (await request.get(`/api/settings/${key}`)).json()).value
const changeText = async (page, label, value) => {
  await page.getByRole('button', { name: 'Edit', exact: true }).click()
  await page.getByRole('textbox', { name: label, exact: true }).fill(value)
  await page.getByRole('button', { name: 'Save', exact: true }).click()
  await expect(page.getByRole('button', { name: 'Edit', exact: true })).toBeVisible()
}

for (const avatarFirst of [false, true]) {
  test(`stale Profile tabs preserve text and avatar changes with avatar first=${avatarFirst}`, async ({ page, context, request }) => {
    const profile = { name: 'Rupert', email: 'rupert@example.com', avatarImage }
    await resetAppData(request, { settings: { profile, unknownSetting: { preserved: true } } })
    const other = await context.newPage()
    try {
      await Promise.all([page.goto('/settings'), other.goto('/settings')])
      await Promise.all([waitForAppReady(page), waitForAppReady(other)])
      const rename = async () => {
        await changeText(page, 'Username', 'New name')
        await expect.poll(() => readSetting(request, 'profile')).toMatchObject({ name: 'New name' })
      }
      const remove = async () => {
        await other.getByRole('button', { name: 'Remove Photo', exact: true }).click()
        await expect(other.getByRole('button', { name: 'Remove Photo', exact: true })).toHaveCount(0)
        await expect.poll(() => readSetting(request, 'profile')).toMatchObject({ avatarImage: null })
      }
      if (avatarFirst) { await remove(); await rename() }
      else { await rename(); await remove() }
      const expected = { ...profile, name: 'New name', avatarImage: null }
      expect(await readSetting(request, 'profile')).toEqual(expected)
      await changeText(other, 'Email', 'new@example.com')
      expected.email = 'new@example.com'
      expect(await readSetting(request, 'profile')).toEqual(expected)
      for (const tab of [page, other]) {
        await tab.reload()
        await waitForAppReady(tab)
        await expect(tab.getByRole('heading', { name: 'New name', exact: true })).toBeVisible()
        await expect(tab.getByText('new@example.com', { exact: true })).toBeVisible()
        await expect(tab.getByRole('button', { name: 'Remove Photo', exact: true })).toHaveCount(0)
      }
      expect(await readSetting(request, 'unknownSetting')).toEqual({ preserved: true })
    } finally { await other.close() }
  })
}

for (const timeFirst of [false, true]) {
  test(`stale Daily Reminder tabs preserve time and disablement with time first=${timeFirst}`, async ({ page, context, request }) => {
    await context.addInitScript(() => {
      class FakeNotification {
        static permission = 'granted'
        static async requestPermission() { return 'granted' }
      }
      Object.defineProperty(window, 'Notification', { configurable: true, value: FakeNotification })
    })
    await resetAppData(request, { settings: { dailyReminder: { enabled: true, time: '09:00' } } })
    const other = await context.newPage()
    try {
      await Promise.all([page.goto('/settings'), other.goto('/settings')])
      await Promise.all([waitForAppReady(page), waitForAppReady(other)])
      const disable = async () => {
        const toggle = page.getByRole('checkbox', { name: 'Daily Reminder', exact: true })
        await expect(toggle).toBeChecked()
        await page.locator('label').filter({ has: toggle }).click()
        await expect.poll(() => readSetting(request, 'dailyReminder')).toMatchObject({ enabled: false })
      }
      const changeTime = async () => {
        await other.getByLabel('Reminder Time', { exact: true }).fill('10:00')
        await expect.poll(() => readSetting(request, 'dailyReminder')).toMatchObject({ time: '10:00' })
      }
      if (timeFirst) { await changeTime(); await disable() }
      else { await disable(); await changeTime() }
      expect(await readSetting(request, 'dailyReminder')).toEqual({ enabled: false, time: '10:00' })
      const lastWriter = timeFirst ? page : other
      await expect(lastWriter.getByRole('checkbox', { name: 'Daily Reminder', exact: true })).not.toBeChecked()
      await expect(lastWriter.getByLabel('Reminder Time', { exact: true })).toHaveValue('10:00')
      for (const tab of [page, other]) {
        await tab.reload()
        await waitForAppReady(tab)
        await expect(tab.getByRole('checkbox', { name: 'Daily Reminder', exact: true })).not.toBeChecked()
        await expect(tab.getByLabel('Reminder Time', { exact: true })).toHaveValue('10:00')
      }
    } finally { await other.close() }
  })
}
