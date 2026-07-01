import React, { createContext, useContext, useEffect, useState } from 'react'
import { habitsApi } from '../api/habitsApi'

const PreferencesContext = createContext()

export const LEGACY_WEEK_START_STORAGE_KEY = 'habitTracker.weekStartsOn'
export const PREFERENCES_SETTINGS_KEY = 'preferences'
export const DEFAULT_WEEK_START = 0
export const WEEK_START_OPTIONS = [
  { value: 0, label: 'Sunday' },
  { value: 1, label: 'Monday' }
]

export const normalizeWeekStartsOn = (value) => {
  const numericValue = Number(value)
  return numericValue === 1 ? 1 : DEFAULT_WEEK_START
}

export const normalizePreferencesSettings = (value) => ({
  weekStartsOn: normalizeWeekStartsOn(
    value && typeof value === 'object' && !Array.isArray(value)
      ? value.weekStartsOn
      : undefined
  )
})

const getBrowserStorage = () => {
  try {
    if (typeof window === 'undefined') return null
    return window.localStorage
  } catch {
    return null
  }
}

export const removeLegacyWeekStartPreference = (storage = getBrowserStorage()) => {
  try {
    storage?.removeItem?.(LEGACY_WEEK_START_STORAGE_KEY)
  } catch {
    // The database remains the source of truth when browser storage is unavailable.
  }
}

export const PreferencesProvider = ({ children }) => {
  const [weekStartsOn, setWeekStartsOnState] = useState(DEFAULT_WEEK_START)
  const [settingsLoaded, setSettingsLoaded] = useState(false)

  useEffect(() => {
    let cancelled = false

    removeLegacyWeekStartPreference()

    habitsApi.getSetting(PREFERENCES_SETTINGS_KEY)
      .then(({ value }) => {
        if (cancelled) return
        setWeekStartsOnState(normalizePreferencesSettings(value).weekStartsOn)
      })
      .catch(error => {
        if (!cancelled) console.error('Failed to load preferences:', error)
      })
      .finally(() => {
        if (!cancelled) setSettingsLoaded(true)
      })

    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!settingsLoaded) return

    habitsApi.saveSetting(PREFERENCES_SETTINGS_KEY, { weekStartsOn })
      .catch(error => console.error('Failed to save preferences:', error))
  }, [settingsLoaded, weekStartsOn])

  const setWeekStartsOn = (value) => {
    setWeekStartsOnState(normalizeWeekStartsOn(value))
  }

  return (
    <PreferencesContext.Provider value={{ weekStartsOn, setWeekStartsOn }}>
      {children}
    </PreferencesContext.Provider>
  )
}

export const usePreferences = () => {
  const context = useContext(PreferencesContext)
  if (!context) {
    throw new Error('usePreferences must be used within a PreferencesProvider')
  }
  return context
}
