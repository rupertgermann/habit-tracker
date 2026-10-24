import { expect, test } from './fixtures.js'
import { makeCompletion, makeHabit, makeJournalEntry, resetAppData, waitForAppReady } from './helpers.js'

test.use({ timezoneId: 'Europe/Berlin' })
const beforeMidnight = new Date('2026-07-15T21:59:50Z')
const getHabit = async request => (await (await request.get('/api/state')).json()).habits[0]
const binary = () => makeHabit({
  id: 'rollover', name: 'Daily walk', createdAt: '2026-07-01T08:00:00Z',
  completions: [makeCompletion('2026-07-15')]
})

test('Habit detail refreshes its action at midnight and records the actual click time', async ({ page, request }) => {
  await resetAppData(request, { habits: [binary()] })
  await page.clock.install({ time: beforeMidnight })
  await page.setViewportSize({ width: 390, height: 900 })
  await page.goto('/habit/rollover')
  await waitForAppReady(page)
  await expect(page.getByRole('button', { name: 'Mark as Incomplete', exact: true })).toBeVisible()
  await page.clock.fastForward(12_000)
  await expect(page.getByRole('button', { name: 'Mark as Complete', exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Mark as Complete', exact: true }).click()
  await expect.poll(async () => (await getHabit(request)).completions.map(entry => entry.date))
    .toEqual(['2026-07-15', '2026-07-16'])
  const last = (await getHabit(request)).completions.at(-1)
  const clickTime = await page.evaluate(() => Date.now())
  expect(Math.abs(Date.parse(last.completedAt) - clickTime)).toBeLessThan(2_000)
})

test('a click before the midnight timer fires refreshes the day without writing stale intent', async ({ page, request }) => {
  await resetAppData(request, { habits: [binary()] })
  await page.clock.install({ time: beforeMidnight })
  await page.setViewportSize({ width: 390, height: 900 })
  await page.goto('/habit/rollover')
  await waitForAppReady(page)
  const prior = await getHabit(request)
  let writes = 0
  page.on('request', request => { if (request.method() === 'PUT') writes++ })
  await page.clock.setSystemTime(new Date('2026-07-15T22:00:02Z'))
  await page.getByRole('button', { name: 'Mark as Incomplete', exact: true }).click()
  await expect(page.getByRole('button', { name: 'Mark as Complete', exact: true })).toBeVisible()
  expect(writes).toBe(0)
  expect(await getHabit(request)).toEqual(prior)
  await page.getByRole('button', { name: 'Mark as Complete', exact: true }).click()
  await expect.poll(async () => (await getHabit(request)).completions.map(entry => entry.date))
    .toEqual(['2026-07-15', '2026-07-16'])
})

for (const event of ['focus', 'visibilitychange']) {
  test(`resuming with ${event} refreshes a suspended tracking screen`, async ({ page, request }) => {
    await resetAppData(request, { habits: [binary()] })
    await page.clock.install({ time: beforeMidnight })
    await page.setViewportSize({ width: 390, height: 900 })
    await page.goto('/habit/rollover')
    await waitForAppReady(page)
    await page.clock.setSystemTime(new Date('2026-07-15T22:00:02Z'))
    await page.evaluate(event => {
      const target = event === 'focus' ? window : document
      target.dispatchEvent(new Event(event))
    }, event)
    await expect(page.getByRole('button', { name: 'Mark as Complete', exact: true })).toBeVisible()
    expect((await getHabit(request)).completions.map(entry => entry.date)).toEqual(['2026-07-15'])
  })
}

test('the completed Habits filter follows the shared local day', async ({ page, request }) => {
  await resetAppData(request, { habits: [binary()] })
  await page.clock.install({ time: beforeMidnight })
  await page.goto('/habits')
  await waitForAppReady(page)
  await page.getByRole('button', { name: 'Completed (1)', exact: true }).click()
  await expect(page.getByText('Daily walk', { exact: true })).toBeVisible()
  await page.clock.fastForward(12_000)
  await expect(page.getByRole('button', { name: 'Completed (0)', exact: true })).toBeVisible()
  await expect(page.getByText('Daily walk', { exact: true })).toHaveCount(0)
})

for (const design of ['standard', 'quiet-momentum', 'rhythm-ledger', 'orbit', 'sunday-club']) {
  test(`${design} dashboard refreshes daily actions and preserves yesterday`, async ({ page, request }) => {
    await resetAppData(request, { habits: [binary()], settings: { design } })
    await page.clock.install({ time: beforeMidnight })
    await page.goto('/')
    await waitForAppReady(page)
    await expect(page.getByRole('button', { name: 'Mark as incomplete: Daily walk', exact: true }).first()).toBeVisible()
    if (design === 'quiet-momentum') await expect(page.getByText('Wednesday’s rituals', { exact: true })).toBeVisible()
    await page.clock.fastForward(12_000)
    if (design === 'quiet-momentum') await expect(page.getByText('Thursday’s rituals', { exact: true })).toBeVisible()
    const action = page.getByRole('button', { name: 'Mark as complete: Daily walk', exact: true }).first()
    await expect(action).toBeVisible()
    await action.click()
    await expect.poll(async () => (await getHabit(request)).completions.map(entry => entry.date))
      .toEqual(['2026-07-15', '2026-07-16'])
  })
}

for (const path of ['/habit/rollover', '/habits', '/']) {
  test(`Count Habit controls reset at midnight on ${path}`, async ({ page, request }) => {
    await resetAppData(request, { habits: [{ ...binary(), type: 'count', dailyTarget: 3 }] })
    await page.clock.install({ time: beforeMidnight })
    await page.setViewportSize({ width: 390, height: 900 })
    await page.goto(path)
    await waitForAppReady(page)
    const remove = page.getByRole('button', { name: 'Remove one from Daily walk', exact: true })
    await expect(remove).toBeEnabled()
    await page.clock.fastForward(12_000)
    await expect(remove).toBeDisabled()
    await page.getByRole('button', { name: 'Add one to Daily walk', exact: true }).click()
    await expect.poll(async () => (await getHabit(request)).completions.map(entry => entry.date))
      .toEqual(['2026-07-15', '2026-07-16'])
    await expect(remove).toBeEnabled()
    await remove.click()
    await expect.poll(async () => (await getHabit(request)).completions.map(entry => entry.date))
      .toEqual(['2026-07-15'])
  })
}

test('Completion writes queued before midnight retain their submitted day after release', async ({ page, request }) => {
  await resetAppData(request, { habits: [binary()] })
  await page.clock.install({ time: beforeMidnight })
  await page.setViewportSize({ width: 390, height: 900 })
  let release
  let first = true
  await page.route('**/api/habits/rollover', async route => {
    if (route.request().method() !== 'PUT' || !first) return route.continue()
    first = false
    const response = await route.fetch()
    await new Promise(resolve => { release = resolve })
    await route.fulfill({ response })
  })
  await page.goto('/habit/rollover')
  await waitForAppReady(page)
  await page.getByRole('button', { name: 'Mark as Incomplete', exact: true }).click()
  await expect.poll(() => Boolean(release)).toBe(true)
  await page.getByRole('button', { name: 'Mark as Complete', exact: true }).click()
  await page.clock.fastForward(12_000)
  release()
  await expect.poll(async () => (await getHabit(request)).completions.map(entry => entry.date))
    .toEqual(['2026-07-15'])
  await expect(page.getByRole('button', { name: 'Mark as Complete', exact: true })).toBeVisible()
})

for (const mode of ['create', 'edit', 'pending']) {
  test(`Journal ${mode} drafts retain their original date across midnight`, async ({ page, request }) => {
    const nextDay = makeJournalEntry({ id: 'next-day', habitId: 'rollover', date: '2026-07-16', content: 'Keep tomorrow' })
    await resetAppData(request, {
      habits: [binary()],
      journalEntries: mode === 'edit'
        ? [makeJournalEntry({ id: 'yesterday', habitId: 'rollover', date: '2026-07-15', content: 'Old reflection' }), nextDay]
        : [nextDay]
    })
    await page.clock.install({ time: beforeMidnight })
    await page.setViewportSize({ width: 390, height: 900 })
    let release
    if (mode === 'pending') {
      await page.route('**/api/journal', async route => {
        const response = await route.fetch()
        await new Promise(resolve => { release = resolve })
        await route.fulfill({ response })
      })
    }
    await page.goto('/habit/rollover')
    await waitForAppReady(page)
    if (mode === 'edit') await page.getByText('Old reflection', { exact: true }).locator('..')
      .getByRole('button', { name: 'Edit', exact: true }).click()
    const content = page.getByPlaceholder('Reflect on your experience, challenges, or achievements...')
    await content.fill('Keep my midnight draft')
    await page.getByRole('button', { name: '😊 Good', exact: true }).click()
    if (mode === 'pending') {
      await page.getByRole('button', { name: 'Save Entry', exact: true }).click()
      await expect.poll(() => Boolean(release)).toBe(true)
    }
    await page.clock.fastForward(12_000)
    await expect(content).toHaveValue('Keep my midnight draft')
    await expect(page.getByRole('button', { name: '😊 Good', exact: true })).toHaveAttribute('aria-pressed', 'true')
    await expect(page.getByText('Jul 15, 2026', { exact: true })).toBeVisible()
    if (mode === 'pending') release()
    else await page.getByRole('button', { name: 'Save Entry', exact: true }).click()
    await expect.poll(async () => {
      const state = await (await request.get('/api/state')).json()
      return state.journalEntries.find(entry => entry.date === '2026-07-15')?.content
    }).toBe('Keep my midnight draft')
    await expect(page.getByText('Keep tomorrow', { exact: true })).toBeVisible()
    const state = await (await request.get('/api/state')).json()
    expect(state.journalEntries.find(entry => entry.date === '2026-07-15').moodId).toBe('good')
    expect(state.journalEntries.find(entry => entry.id === nextDay.id).content).toBe('Keep tomorrow')
  })
}
