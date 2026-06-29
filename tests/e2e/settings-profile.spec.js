import { expect, test } from '@playwright/test'
import {
  expectNoRootOverflow,
  resetAppData,
  waitForAppReady
} from './helpers.js'

const avatarPng = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAYAAABytg0kAAAAFElEQVR42mP8z8AARLJgwiBqBgAe9gICN3XFoAAAAABJRU5ErkJggg==',
  'base64'
)

const getState = async (request) => {
  const response = await request.get('/api/state')
  expect(response.ok()).toBe(true)
  return response.json()
}

test.beforeEach(async ({ request }) => {
  await resetAppData(request)
})

test('profile avatar image is stored in the database and survives reloads', async ({ page, request }) => {
  await page.setViewportSize({ width: 390, height: 900 })
  await page.goto('/settings')
  await waitForAppReady(page)
  await expect(page.getByRole('heading', { name: 'Settings', exact: true })).toBeVisible()
  await expectNoRootOverflow(page)

  await page.getByLabel('Avatar image').setInputFiles({
    name: 'avatar.png',
    mimeType: 'image/png',
    buffer: avatarPng
  })

  await expect(page.getByAltText('User Name avatar')).toBeVisible()
  await expectNoRootOverflow(page)
  await expect.poll(async () => {
    const state = await getState(request)
    return state.settings?.profile?.avatarImage?.startsWith('data:image/')
  }).toBe(true)

  await page.reload()
  await waitForAppReady(page)
  const avatar = page.getByAltText('User Name avatar')
  await expect(avatar).toBeVisible()
  await expect(avatar).toHaveAttribute('src', /^data:image\//)

  await page.getByRole('button', { name: 'Remove Photo' }).click()
  await expect(page.getByAltText('User Name avatar')).toHaveCount(0)
  await expect.poll(async () => {
    const state = await getState(request)
    return state.settings?.profile?.avatarImage ?? null
  }).toBe(null)
})
