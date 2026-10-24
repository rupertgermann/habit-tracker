import React, { createContext, useContext, useEffect, useRef, useState } from 'react'
import { habitsApi } from '../api/habitsApi'
import {
  createBrowserClockAdapter,
  createBrowserNotificationAdapter
} from '../adapters/browserDailyReminder'
import {
  createDailyReminderModule,
  DEFAULT_DAILY_REMINDER_SETTINGS
} from '../domain/dailyReminder'
import { useHabits } from './HabitsContext'

const DailyReminderContext = createContext()

export const DAILY_REMINDER_SETTINGS_KEY = 'dailyReminder'

const dailyReminderPersistence = {
  async load() {
    const { value } = await habitsApi.getSetting(DAILY_REMINDER_SETTINGS_KEY)
    return value
  },
  async save(changes) {
    const { value } = await habitsApi.patchSetting(DAILY_REMINDER_SETTINGS_KEY, changes)
    return value
  }
}

export const DailyReminderProvider = ({ children }) => {
  const { habits, hasLoaded: habitsHaveLoaded, error: habitsError } = useHabits()
  const habitsStateRef = useRef({ habits, habitsHaveLoaded, habitsError })
  const reminderRef = useRef(null)
  const isReadyRef = useRef(false)
  const pendingConfigurationsRef = useRef(0)
  const [settings, setSettings] = useState({ ...DEFAULT_DAILY_REMINDER_SETTINGS })
  const [isLoaded, setIsLoaded] = useState(false)
  const [loadError, setLoadError] = useState(null)
  const [isConfiguring, setIsConfiguring] = useState(false)
  habitsStateRef.current = { habits, habitsHaveLoaded, habitsError }

  const loadSettings = async () => {
    const reminder = reminderRef.current
    if (!reminder) return
    isReadyRef.current = false
    setIsLoaded(false)
    setLoadError(null)
    const result = await reminder.load()
    if (reminderRef.current !== reminder) return
    setSettings(result.settings)
    isReadyRef.current = result.ok
    setIsLoaded(result.ok)
    setLoadError(result.ok ? null : result.error)
  }

  useEffect(() => {
    const reminder = createDailyReminderModule({
      persistence: dailyReminderPersistence,
      clock: createBrowserClockAdapter(),
      notifications: createBrowserNotificationAdapter(),
      getHabits: () => {
        const current = habitsStateRef.current
        if (!current.habitsHaveLoaded) return null
        if (current.habitsError) throw new Error(current.habitsError)
        return current.habits
      },
      onError: error => console.error('Daily Reminder failed:', error)
    })

    reminderRef.current = reminder
    loadSettings()

    return () => {
      isReadyRef.current = false
      reminder.dispose()
      if (reminderRef.current === reminder) reminderRef.current = null
    }
  }, [])

  const configure = async changes => {
    if (!isReadyRef.current || !reminderRef.current) {
      return {
        ok: false,
        reason: 'loading',
        settings: { ...settings }
      }
    }

    pendingConfigurationsRef.current += 1
    setIsConfiguring(true)

    try {
      const result = await reminderRef.current.configure(changes)
      setSettings(result.settings)
      return result
    } finally {
      pendingConfigurationsRef.current -= 1
      if (pendingConfigurationsRef.current === 0) setIsConfiguring(false)
    }
  }

  return (
    <DailyReminderContext.Provider value={{
      ...settings,
      isLoaded,
      loadError,
      retryLoad: loadSettings,
      isConfiguring,
      setEnabled: enabled => configure({ enabled }),
      setTime: time => configure({ time })
    }}>
      {children}
    </DailyReminderContext.Provider>
  )
}

export const useDailyReminder = () => {
  const context = useContext(DailyReminderContext)
  if (!context) {
    throw new Error('useDailyReminder must be used within a DailyReminderProvider')
  }
  return context
}
