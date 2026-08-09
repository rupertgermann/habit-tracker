import { isCompletedOnDate, toDateKey } from './habitTracking'

export const DEFAULT_DAILY_REMINDER_SETTINGS = Object.freeze({
  enabled: false,
  time: '09:00'
})

const HABITS_LOADING_RETRY_DELAY = 1000

const normalizeTime = (value) => {
  if (typeof value !== 'string' || !/^\d{2}:\d{2}$/.test(value)) {
    return DEFAULT_DAILY_REMINDER_SETTINGS.time
  }

  const [hours, minutes] = value.split(':').map(Number)
  if (hours > 23 || minutes > 59) return DEFAULT_DAILY_REMINDER_SETTINGS.time
  return value
}

export const normalizeDailyReminderSettings = (value) => ({
  enabled: Boolean(value && typeof value === 'object' && !Array.isArray(value) && value.enabled === true),
  time: normalizeTime(value?.time)
})

const getDelayUntilNextReminder = (now, time) => {
  const [hours, minutes] = time.split(':').map(Number)
  const nextReminder = new Date(now)
  nextReminder.setHours(hours, minutes, 0, 0)

  if (nextReminder <= now) {
    nextReminder.setDate(nextReminder.getDate() + 1)
  }

  return nextReminder.getTime() - now.getTime()
}

export const createDailyReminderModule = ({
  persistence,
  clock,
  notifications,
  getHabits,
  onError = () => {}
}) => {
  let settings = { ...DEFAULT_DAILY_REMINDER_SETTINGS }
  let timeoutId = null
  let disposed = false
  let pendingConfiguration = Promise.resolve()

  const cancelSchedule = () => {
    if (timeoutId === null) return
    clock.clearTimeout(timeoutId)
    timeoutId = null
  }

  const canNotify = () => notifications.isSupported() && notifications.getPermission() === 'granted'

  const runDueReminder = () => {
    timeoutId = null
    if (disposed || !settings.enabled || !canNotify()) return

    try {
      const habits = getHabits()
      if (habits === null) {
        timeoutId = clock.setTimeout(runDueReminder, HABITS_LOADING_RETRY_DELAY)
        return
      }

      const today = toDateKey(clock.now())
      const incompleteCount = habits.filter(habit => !isCompletedOnDate(habit, today)).length

      if (incompleteCount > 0) {
        notifications.show('Habit Tracker Reminder', {
          body: `You have ${incompleteCount} habit${incompleteCount === 1 ? '' : 's'} to complete today!`,
          icon: '/favicon.ico'
        })
      }
    } catch (error) {
      onError(error)
    }

    scheduleNext()
  }

  const scheduleNext = () => {
    cancelSchedule()
    if (disposed || !settings.enabled || !canNotify()) return

    const delay = getDelayUntilNextReminder(clock.now(), settings.time)
    timeoutId = clock.setTimeout(runDueReminder, delay)
  }

  const commitConfiguration = async (changes) => {
    const nextSettings = normalizeDailyReminderSettings({ ...settings, ...changes })

    if (nextSettings.enabled) {
      if (!notifications.isSupported()) {
        return { ok: false, reason: 'unsupported', settings: { ...settings } }
      }

      let permission = notifications.getPermission()
      if (permission === 'denied') {
        return { ok: false, reason: 'permission-denied', settings: { ...settings } }
      }

      if (permission !== 'granted') {
        try {
          permission = await notifications.requestPermission()
        } catch (error) {
          return {
            ok: false,
            reason: 'permission-failed',
            error,
            settings: { ...settings }
          }
        }
      }

      if (permission !== 'granted') {
        return { ok: false, reason: 'permission-denied', settings: { ...settings } }
      }
    }

    const changed = nextSettings.enabled !== settings.enabled || nextSettings.time !== settings.time
    if (!changed) {
      scheduleNext()
      return { ok: true, changed: false, settings: { ...settings } }
    }

    try {
      await persistence.save(nextSettings)
    } catch (error) {
      return {
        ok: false,
        reason: 'persistence-failed',
        error,
        settings: { ...settings }
      }
    }

    settings = nextSettings
    scheduleNext()
    return { ok: true, changed: true, settings: { ...settings } }
  }

  const configure = (changes) => {
    const operation = pendingConfiguration.then(() => commitConfiguration(changes))
    pendingConfiguration = operation.then(() => undefined, () => undefined)
    return operation
  }

  return {
    async load() {
      try {
        settings = normalizeDailyReminderSettings(await persistence.load())

        if (settings.enabled && !canNotify()) {
          settings = { ...settings, enabled: false }
          await persistence.save(settings)
        }

        scheduleNext()
        return { ok: true, settings: { ...settings } }
      } catch (error) {
        settings = { ...DEFAULT_DAILY_REMINDER_SETTINGS }
        cancelSchedule()
        return { ok: false, reason: 'load-failed', error, settings: { ...settings } }
      }
    },

    configure,

    dispose() {
      disposed = true
      cancelSchedule()
    }
  }
}
