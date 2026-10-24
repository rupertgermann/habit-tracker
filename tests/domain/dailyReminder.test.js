import assert from 'node:assert/strict'
import { createDailyReminderModule } from '/src/domain/dailyReminder.js'

const waitFor = async (predicate) => {
  for (let attempt = 0; attempt < 10; attempt += 1) {
    if (predicate()) return
    await Promise.resolve()
  }
  throw new Error('Timed out waiting for Daily Reminder test state')
}

const createFakeClock = (start) => {
  let currentTime = new Date(start)
  let nextId = 1
  const timers = new Map()

  return {
    now: () => new Date(currentTime),
    setTimeout(callback, delay) {
      const id = nextId
      nextId += 1
      timers.set(id, { callback, delay, dueAt: currentTime.getTime() + delay })
      return id
    },
    clearTimeout(id) {
      timers.delete(id)
    },
    pendingCount: () => timers.size,
    nextDelay: () => [...timers.values()].sort((a, b) => a.dueAt - b.dueAt)[0]?.delay,
    fireNext() {
      const [id, timer] = [...timers.entries()].sort((a, b) => a[1].dueAt - b[1].dueAt)[0] || []
      if (!timer) return false
      timers.delete(id)
      currentTime = new Date(timer.dueAt)
      timer.callback()
      return true
    }
  }
}

const createNotificationAdapter = (permission = 'granted', requestedPermission = permission) => {
  const notifications = []
  let currentPermission = permission
  let permissionRequestCount = 0

  return {
    isSupported: () => true,
    getPermission: () => currentPermission,
    async requestPermission() {
      permissionRequestCount += 1
      currentPermission = requestedPermission
      return currentPermission
    },
    show: (title, options) => notifications.push({ title, options }),
    notifications,
    permissionRequestCount: () => permissionRequestCount
  }
}

export const tests = [
  {
    name: 'independent reminder instances preserve changed fields and adopt the authoritative response',
    async run() {
      let saved = { enabled: true, time: '09:00' }
      const persistence = {
        async load() { return { ...saved } },
        async save(patch) { saved = { ...saved, ...patch }; return { ...saved } }
      }
      const makeReminder = () => createDailyReminderModule({
        persistence, clock: createFakeClock(new Date(2026, 7, 9, 8, 30)),
        notifications: createNotificationAdapter(), getHabits: () => []
      })
      const first = makeReminder(), second = makeReminder()
      await Promise.all([first.load(), second.load()])
      await first.configure({ enabled: false })
      const result = await second.configure({ time: '10:00' })
      assert.deepEqual(saved, { enabled: false, time: '10:00' })
      assert.deepEqual(result.settings, saved)
      await second.configure({ enabled: true })
      await first.configure({ enabled: false })
      assert.deepEqual(saved, { enabled: false, time: '10:00' })
      first.dispose()
      second.dispose()
    }
  },
  {
    name: 'permission recovery disables reminders without replacing a newer stored time',
    async run() {
      let saved = { enabled: true, time: '20:00' }
      const reminder = createDailyReminderModule({
        persistence: {
          async load() { return { enabled: true, time: '09:00' } },
          async save(patch) { saved = { ...saved, ...patch }; return saved }
        },
        clock: createFakeClock(new Date(2026, 7, 9, 8, 30)),
        notifications: createNotificationAdapter('denied'), getHabits: () => []
      })
      assert.deepEqual((await reminder.load()).settings, { enabled: false, time: '20:00' })
      assert.deepEqual(saved, { enabled: false, time: '20:00' })
      reminder.dispose()
    }
  },
  {
    name: 'Daily Reminder blocks writes after a failed read and retries without losing saved enablement',
    async run() {
      let saved = { enabled: true, time: '18:45' }
      let failRead = true
      const writes = []
      const reminder = createDailyReminderModule({
        persistence: {
          async load() {
            if (failRead) throw new Error('Database unavailable')
            return saved
          },
          async save(patch) { writes.push(patch); saved = { ...saved, ...patch }; return saved }
        },
        clock: createFakeClock(new Date(2026, 7, 9, 8, 30)),
        notifications: createNotificationAdapter(),
        getHabits: () => []
      })
      assert.equal((await reminder.load()).ok, false)
      assert.equal((await reminder.configure({ time: '19:00' })).ok, false)
      assert.deepEqual(writes, [])
      assert.deepEqual(saved, { enabled: true, time: '18:45' })
      failRead = false
      assert.deepEqual((await reminder.load()).settings, saved)
      assert.equal((await reminder.configure({ time: '19:00' })).ok, true)
      assert.deepEqual(saved, { enabled: true, time: '19:00' })
      reminder.dispose()
    }
  },
  {
    name: 'Daily Reminder loads committed settings, schedules once, and reads current Habits when it fires',
    async run() {
      const clock = createFakeClock(new Date(2026, 7, 9, 8, 30))
      const notificationAdapter = createNotificationAdapter()
      let habits = []
      const reminder = createDailyReminderModule({
        persistence: {
          load: async () => ({ enabled: true, time: '09:00' }),
          save: async settings => settings
        },
        clock,
        notifications: notificationAdapter,
        getHabits: () => habits
      })

      const result = await reminder.load()

      assert.deepEqual(result, {
        ok: true,
        settings: { enabled: true, time: '09:00' }
      })
      assert.equal(clock.pendingCount(), 1)
      assert.equal(clock.nextDelay(), 30 * 60 * 1000)

      habits = [
        {
          id: 'complete',
          name: 'Complete Habit',
          completions: [{ date: '2026-08-09', completedAt: '2026-08-09T07:00:00.000Z' }]
        },
        { id: 'incomplete', name: 'Incomplete Habit', completions: [] }
      ]

      assert.equal(clock.fireNext(), true)
      assert.deepEqual(notificationAdapter.notifications, [{
        title: 'Habit Tracker Reminder',
        options: {
          body: 'You have 1 habit to complete today!',
          icon: '/favicon.ico'
        }
      }])
      assert.equal(clock.pendingCount(), 1)
      assert.equal(clock.nextDelay(), 24 * 60 * 60 * 1000)
    }
  },
  {
    name: 'Daily Reminder enables only after permission and persistence commit',
    async run() {
      const clock = createFakeClock(new Date(2026, 7, 9, 8, 30))
      const notificationAdapter = createNotificationAdapter('default', 'granted')
      const savedSettings = []
      let commitSave
      const reminder = createDailyReminderModule({
        persistence: {
          load: async () => ({ enabled: false, time: '09:00' }),
          save: settings => {
            savedSettings.push(settings)
            return new Promise(resolve => { commitSave = resolve })
          }
        },
        clock,
        notifications: notificationAdapter,
        getHabits: () => []
      })
      await reminder.load()

      const enabling = reminder.configure({ enabled: true })
      await waitFor(() => savedSettings.length === 1)

      assert.equal(notificationAdapter.permissionRequestCount(), 1)
      assert.deepEqual(savedSettings, [{ enabled: true }])
      assert.equal(clock.pendingCount(), 0)

      commitSave({ enabled: true, time: '09:00' })
      assert.deepEqual(await enabling, {
        ok: true,
        changed: true,
        settings: { enabled: true, time: '09:00' }
      })
      assert.equal(clock.pendingCount(), 1)
    }
  },
  {
    name: 'Daily Reminder fails closed when persisted enablement no longer has browser permission',
    async run() {
      const clock = createFakeClock(new Date(2026, 7, 9, 8, 30))
      const notificationAdapter = createNotificationAdapter('denied')
      const savedSettings = []
      const reminder = createDailyReminderModule({
        persistence: {
          load: async () => ({ enabled: true, time: '09:00' }),
          save: async settings => {
            savedSettings.push(settings)
            return { enabled: true, time: '09:00', ...settings }
          }
        },
        clock,
        notifications: notificationAdapter,
        getHabits: () => []
      })

      const result = await reminder.load()

      assert.deepEqual(result, {
        ok: true,
        settings: { enabled: false, time: '09:00' }
      })
      assert.deepEqual(savedSettings, [{ enabled: false }])
      assert.equal(notificationAdapter.permissionRequestCount(), 0)
      assert.equal(clock.pendingCount(), 0)
    }
  },
  {
    name: 'Daily Reminder serializes overlapping configuration commits in caller order',
    async run() {
      const clock = createFakeClock(new Date(2026, 7, 9, 8, 30))
      const pendingSaves = []
      const reminder = createDailyReminderModule({
        persistence: {
          load: async () => ({ enabled: true, time: '09:00' }),
          save: settings => new Promise(resolve => {
            pendingSaves.push({ settings, resolve })
          })
        },
        clock,
        notifications: createNotificationAdapter(),
        getHabits: () => []
      })
      await reminder.load()

      const firstChange = reminder.configure({ time: '10:00' })
      const secondChange = reminder.configure({ time: '11:00' })
      await waitFor(() => pendingSaves.length === 1)

      assert.equal(pendingSaves.length, 1)
      assert.deepEqual(pendingSaves[0].settings, { time: '10:00' })

      pendingSaves[0].resolve({ enabled: true, time: '10:00' })
      assert.deepEqual(await firstChange, {
        ok: true,
        changed: true,
        settings: { enabled: true, time: '10:00' }
      })
      await waitFor(() => pendingSaves.length === 2)

      assert.equal(pendingSaves.length, 2)
      assert.deepEqual(pendingSaves[1].settings, { time: '11:00' })
      pendingSaves[1].resolve({ enabled: true, time: '11:00' })
      assert.deepEqual(await secondChange, {
        ok: true,
        changed: true,
        settings: { enabled: true, time: '11:00' }
      })
      assert.equal(clock.pendingCount(), 1)
    }
  },
  {
    name: 'Daily Reminder keeps committed settings when browser permission requests fail',
    async run() {
      const clock = createFakeClock(new Date(2026, 7, 9, 8, 30))
      let saveCount = 0
      const reminder = createDailyReminderModule({
        persistence: {
          load: async () => ({ enabled: false, time: '09:00' }),
          save: async settings => {
            saveCount += 1
            return settings
          }
        },
        clock,
        notifications: {
          isSupported: () => true,
          getPermission: () => 'default',
          requestPermission: async () => { throw new Error('Browser permission failed') },
          show: () => {}
        },
        getHabits: () => []
      })
      await reminder.load()

      const result = await reminder.configure({ enabled: true })

      assert.equal(result.ok, false)
      assert.equal(result.reason, 'permission-failed')
      assert.deepEqual(result.settings, { enabled: false, time: '09:00' })
      assert.equal(saveCount, 0)
      assert.equal(clock.pendingCount(), 0)
    }
  },
  {
    name: 'Daily Reminder fails closed without re-requesting an already denied permission',
    async run() {
      const clock = createFakeClock(new Date(2026, 7, 9, 8, 30))
      const notificationAdapter = createNotificationAdapter('denied')
      let saveCount = 0
      const reminder = createDailyReminderModule({
        persistence: {
          load: async () => ({ enabled: false, time: '09:00' }),
          save: async settings => {
            saveCount += 1
            return settings
          }
        },
        clock,
        notifications: notificationAdapter,
        getHabits: () => []
      })
      await reminder.load()

      const result = await reminder.configure({ enabled: true })

      assert.equal(result.ok, false)
      assert.equal(result.reason, 'permission-denied')
      assert.deepEqual(result.settings, { enabled: false, time: '09:00' })
      assert.equal(notificationAdapter.permissionRequestCount(), 0)
      assert.equal(saveCount, 0)
      assert.equal(clock.pendingCount(), 0)
    }
  },
  {
    name: 'Daily Reminder keeps its committed schedule when a configuration save fails',
    async run() {
      const clock = createFakeClock(new Date(2026, 7, 9, 8, 30))
      const reminder = createDailyReminderModule({
        persistence: {
          load: async () => ({ enabled: true, time: '09:00' }),
          save: async () => { throw new Error('Database unavailable') }
        },
        clock,
        notifications: createNotificationAdapter(),
        getHabits: () => []
      })
      await reminder.load()

      const originalDelay = clock.nextDelay()
      const result = await reminder.configure({ time: '10:00' })

      assert.equal(result.ok, false)
      assert.equal(result.reason, 'persistence-failed')
      assert.deepEqual(result.settings, { enabled: true, time: '09:00' })
      assert.equal(clock.pendingCount(), 1)
      assert.equal(clock.nextDelay(), originalDelay)
    }
  },
  {
    name: 'Daily Reminder suppresses an all-complete prompt and schedules the next day',
    async run() {
      const clock = createFakeClock(new Date(2026, 7, 9, 8, 30))
      const notificationAdapter = createNotificationAdapter()
      const reminder = createDailyReminderModule({
        persistence: {
          load: async () => ({ enabled: true, time: '09:00' }),
          save: async settings => settings
        },
        clock,
        notifications: notificationAdapter,
        getHabits: () => [{
          id: 'complete',
          name: 'Complete Habit',
          completions: [{ date: '2026-08-09', completedAt: '2026-08-09T07:00:00.000Z' }]
        }]
      })
      await reminder.load()

      assert.equal(clock.fireNext(), true)
      assert.deepEqual(notificationAdapter.notifications, [])
      assert.equal(clock.pendingCount(), 1)
      assert.equal(clock.nextDelay(), 24 * 60 * 60 * 1000)
    }
  },
  {
    name: 'Daily Reminder retries a due prompt until current Habits finish loading',
    async run() {
      const clock = createFakeClock(new Date(2026, 7, 9, 8, 59, 59))
      const notificationAdapter = createNotificationAdapter()
      let habits = null
      const reminder = createDailyReminderModule({
        persistence: {
          load: async () => ({ enabled: true, time: '09:00' }),
          save: async settings => settings
        },
        clock,
        notifications: notificationAdapter,
        getHabits: () => habits
      })
      await reminder.load()

      assert.equal(clock.fireNext(), true)
      assert.deepEqual(notificationAdapter.notifications, [])
      assert.equal(clock.pendingCount(), 1)
      assert.equal(clock.nextDelay(), 1000)

      habits = [{ id: 'incomplete', name: 'Incomplete Habit', completions: [] }]
      assert.equal(clock.fireNext(), true)
      assert.equal(notificationAdapter.notifications.length, 1)
      assert.equal(notificationAdapter.notifications[0].options.body, 'You have 1 habit to complete today!')
      assert.equal(clock.pendingCount(), 1)
    }
  },
  {
    name: 'Daily Reminder reports delivery failures and still schedules the next day',
    async run() {
      const clock = createFakeClock(new Date(2026, 7, 9, 8, 30))
      const notificationAdapter = createNotificationAdapter()
      const deliveryError = new Error('Notification delivery failed')
      const reportedErrors = []
      notificationAdapter.show = () => { throw deliveryError }
      const reminder = createDailyReminderModule({
        persistence: {
          load: async () => ({ enabled: true, time: '09:00' }),
          save: async settings => settings
        },
        clock,
        notifications: notificationAdapter,
        getHabits: () => [{ id: 'incomplete', name: 'Incomplete Habit', completions: [] }],
        onError: error => reportedErrors.push(error)
      })
      await reminder.load()

      assert.doesNotThrow(() => clock.fireNext())
      assert.deepEqual(reportedErrors, [deliveryError])
      assert.equal(clock.pendingCount(), 1)
      assert.equal(clock.nextDelay(), 24 * 60 * 60 * 1000)
    }
  },
  {
    name: 'Daily Reminder load failure falls back to disabled 09:00 settings',
    async run() {
      const clock = createFakeClock(new Date(2026, 7, 9, 8, 30))
      const reminder = createDailyReminderModule({
        persistence: {
          load: async () => { throw new Error('Database unavailable') },
          save: async settings => settings
        },
        clock,
        notifications: createNotificationAdapter(),
        getHabits: () => []
      })

      const result = await reminder.load()

      assert.equal(result.ok, false)
      assert.equal(result.reason, 'load-failed')
      assert.deepEqual(result.settings, { enabled: false, time: '09:00' })
      assert.equal(clock.pendingCount(), 0)
    }
  }
]
