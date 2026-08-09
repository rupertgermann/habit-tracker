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
  async save(settings) {
    const { value } = await habitsApi.saveSetting(DAILY_REMINDER_SETTINGS_KEY, settings)
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
  const [isConfiguring, setIsConfiguring] = useState(false)
  habitsStateRef.current = { habits, habitsHaveLoaded, habitsError }

  useEffect(() => {
    let active = true
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
    isReadyRef.current = false
    setIsLoaded(false)

    reminder.load().then(result => {
      if (!active) return
      setSettings(result.settings)
      isReadyRef.current = true
      setIsLoaded(true)
    })

    return () => {
      active = false
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
