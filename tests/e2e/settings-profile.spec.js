import { expect, test } from '@playwright/test'
import {
  expectNoRootOverflow,
  installConsoleErrorGuard,
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

const parseRgb = value => {
  const [, r, g, b] = value.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/) || []
  return {
    r: Number(r),
    g: Number(g),
    b: Number(b)
  }
}

const relativeLuminance = ({ r, g, b }) => {
  const toLinear = channel => {
    const value = channel / 255
    return value <= 0.03928
      ? value / 12.92
      : ((value + 0.055) / 1.055) ** 2.4
  }

  return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b)
}

const contrastRatio = (foreground, background) => {
  const lighter = Math.max(relativeLuminance(foreground), relativeLuminance(background))
  const darker = Math.min(relativeLuminance(foreground), relativeLuminance(background))
  return (lighter + 0.05) / (darker + 0.05)
}

const appDesigns = [
  { id: 'standard', name: 'Standard' },
  { id: 'rhythm-ledger', name: 'Rhythm Ledger' },
  { id: 'orbit', name: 'Orbit' },
  { id: 'quiet-momentum', name: 'Quiet Momentum' },
  { id: 'sunday-club', name: 'Sunday Club' }
]

test.beforeEach(async ({ request }) => {
  await resetAppData(request)
})

test('every App Design appearance persists and resolves after reload', async ({ page, request }) => {
  test.slow()
  await resetAppData(request, {
    settings: {
      theme: 'light',
      design: 'standard'
    }
  })
  await page.setViewportSize({ width: 390, height: 900 })
  const assertNoConsoleErrors = installConsoleErrorGuard(page)
  await page.goto('/settings')
  await waitForAppReady(page)

  const designGroup = page.getByRole('radiogroup', { name: 'App design' })
  const darkMode = page.getByRole('checkbox', { name: 'Dark Mode' })
  const darkModeToggle = page.locator('label').filter({ has: darkMode })
  await expect(designGroup.getByRole('radio')).toHaveCount(5)

  for (const appDesign of appDesigns) {
    await designGroup.getByText(appDesign.name, { exact: true }).click()

    for (const appearance of [
      { value: 'light', isDark: false },
      { value: 'dark', isDark: true }
    ]) {
      if (await darkMode.isChecked() !== appearance.isDark) {
        await darkModeToggle.click()
      }
      await expect(designGroup.getByRole('radio', { name: appDesign.name })).toBeChecked()
      await expect(darkMode).toBeChecked({ checked: appearance.isDark })
      await expect(page.locator('html')).toHaveAttribute('data-design', appDesign.id)
      if (appearance.isDark) {
        await expect(page.locator('body')).toHaveClass(/dark-mode/)
      } else {
        await expect(page.locator('body')).not.toHaveClass(/dark-mode/)
      }
      await expect.poll(async () => {
        const state = await getState(request)
        return {
          design: state.settings?.design,
          theme: state.settings?.theme
        }
      }).toEqual({
        design: appDesign.id,
        theme: appearance.value
      })
      await expectNoRootOverflow(page)

      await page.reload()
      await waitForAppReady(page)
      await expect(designGroup.getByRole('radio', { name: appDesign.name })).toBeChecked()
      await expect(darkMode).toBeChecked({ checked: appearance.isDark })
      await expect(page.locator('html')).toHaveAttribute('data-design', appDesign.id)
      await expectNoRootOverflow(page)
    }
  }

  await assertNoConsoleErrors()
})

test('profile and calendar preferences use the database instead of legacy localStorage', async ({ page, request }) => {
  await resetAppData(request, {
    settings: {
      profile: {
        name: 'Database User',
        email: 'database@example.com',
        avatarImage: null
      },
      preferences: {
        weekStartsOn: 0
      }
    }
  })
  await page.addInitScript(() => {
    window.localStorage.setItem('habitTracker.profileName', 'Browser User')
    window.localStorage.setItem('habitTracker.weekStartsOn', '1')
  })

  await page.setViewportSize({ width: 390, height: 900 })
  await page.goto('/settings')
  await waitForAppReady(page)

  await expect(page.getByText('Database User')).toBeVisible()
  await expect(page.getByText('database@example.com')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Week Starts On' })).toHaveText('Sunday')
  await expect.poll(() => page.evaluate(() => ({
    profileName: window.localStorage.getItem('habitTracker.profileName'),
    weekStartsOn: window.localStorage.getItem('habitTracker.weekStartsOn')
  }))).toEqual({
    profileName: null,
    weekStartsOn: null
  })

  await page.getByRole('button', { name: 'Edit' }).click()
  await page.getByLabel('Username').fill('Rupert')
  await page.getByLabel('Email').fill('rupert@example.com')
  await page.getByRole('button', { name: 'Save' }).click()

  await expect(page.getByRole('heading', { name: 'Rupert' })).toBeVisible()
  await expect(page.getByText('rupert@example.com')).toBeVisible()
  await expect.poll(async () => {
    const state = await getState(request)
    return state.settings?.profile
  }).toMatchObject({
    name: 'Rupert',
    email: 'rupert@example.com',
    avatarImage: null
  })
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

test('settings footer links navigate to app information pages', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 900 })
  await page.goto('/settings')
  await waitForAppReady(page)
  await expect(page.getByRole('heading', { name: 'Settings', exact: true })).toBeVisible()

  const footerLinks = [
    { label: 'Privacy Policy', path: '/privacy' },
    { label: 'Terms of Service', path: '/terms' },
    { label: 'Support', path: '/support' }
  ]

  for (const footerLink of footerLinks) {
    const link = page.getByRole('link', { name: footerLink.label })
    await expect(link).toHaveAttribute('href', new RegExp(`${footerLink.path}$`))

    await link.click()
    await expect(page).toHaveURL(new RegExp(`${footerLink.path}$`))
    await expect(page.getByRole('heading', { level: 1, name: footerLink.label })).toBeVisible()
    await expectNoRootOverflow(page)

    await page.getByRole('link', { name: 'Back to Settings' }).click()
    await expect(page).toHaveURL(/\/settings$/)
  }
})

test('reminder time input remains fully visible in dark mode', async ({ page, request }) => {
  await resetAppData(request, {
    settings: {
      theme: 'dark'
    }
  })
  await page.setViewportSize({ width: 390, height: 900 })
  await page.goto('/settings')
  await waitForAppReady(page)

  const reminderTimeInput = page.getByLabel('Reminder Time')
  await expect(reminderTimeInput).toBeVisible()
  await expect(reminderTimeInput).toHaveValue('09:00')

  const inputWidth = await reminderTimeInput.evaluate(element => element.getBoundingClientRect().width)
  expect(inputWidth).toBeGreaterThanOrEqual(128)
  await expectNoRootOverflow(page)
})

test('week start selector opens in place with readable options', async ({ page, request }) => {
  await resetAppData(request, {
    settings: {
      theme: 'dark',
      preferences: {
        weekStartsOn: 1
      }
    }
  })
  await page.setViewportSize({ width: 390, height: 900 })
  await page.goto('/settings')
  await waitForAppReady(page)

  const reminderTimeInput = page.getByLabel('Reminder Time')
  const weekStartButton = page.getByRole('button', { name: 'Week Starts On' })
  await expect(weekStartButton).toBeVisible()
  await expect(weekStartButton).toHaveText('Monday')

  const sizes = await Promise.all([
    reminderTimeInput.evaluate(element => {
      const rect = element.getBoundingClientRect()
      return { width: rect.width, height: rect.height }
    }),
    weekStartButton.evaluate(element => {
      const rect = element.getBoundingClientRect()
      return { width: rect.width, height: rect.height }
    })
  ])
  expect(Math.abs(sizes[0].width - sizes[1].width)).toBeLessThanOrEqual(1)
  expect(Math.abs(sizes[0].height - sizes[1].height)).toBeLessThanOrEqual(1)

  await weekStartButton.click()
  const optionList = page.getByRole('listbox', { name: 'Week Starts On' })
  await expect(optionList).toBeVisible()

  const positions = await Promise.all([
    weekStartButton.evaluate(element => {
      const rect = element.getBoundingClientRect()
      return { bottom: rect.bottom, left: rect.left }
    }),
    optionList.evaluate(element => {
      const rect = element.getBoundingClientRect()
      return { top: rect.top, left: rect.left }
    })
  ])
  expect(positions[1].top).toBeGreaterThanOrEqual(positions[0].bottom - 1)
  expect(Math.abs(positions[1].left - positions[0].left)).toBeLessThanOrEqual(1)

  for (const optionName of ['Sunday', 'Monday']) {
    const option = page.getByRole('option', { name: optionName })
    await expect(option).toBeVisible()
    const colors = await option.evaluate(element => {
      const style = getComputedStyle(element)
      return {
        background: style.backgroundColor,
        text: style.color
      }
    })
    expect(contrastRatio(parseRgb(colors.text), parseRgb(colors.background))).toBeGreaterThanOrEqual(4.5)
  }

  await page.getByRole('option', { name: 'Sunday' }).click()
  await expect(weekStartButton).toHaveText('Sunday')
  await expect(optionList).toHaveCount(0)
  await expect.poll(async () => {
    const state = await getState(request)
    return state.settings?.preferences?.weekStartsOn
  }).toBe(0)
  await expect(page.evaluate(() => window.localStorage.getItem('habitTracker.weekStartsOn'))).resolves.toBe(null)
  await expectNoRootOverflow(page)
})
