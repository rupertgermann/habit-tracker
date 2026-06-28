import React, { createContext, useContext, useEffect, useState } from 'react'

const PreferencesContext = createContext()

export const WEEK_START_STORAGE_KEY = 'habitTracker.weekStartsOn'
export const DEFAULT_WEEK_START = 0
export const WEEK_START_OPTIONS = [
  { value: 0, label: 'Sunday' },
  { value: 1, label: 'Monday' }
]

export const normalizeWeekStartsOn = (value) => {
  const numericValue = Number(value)
  return numericValue === 1 ? 1 : DEFAULT_WEEK_START
}

const getBrowserStorage = () => {
  try {
    if (typeof window === 'undefined') return null
    return window.localStorage
  } catch {
    return null
  }
}

export const readStoredWeekStartsOn = (storage = getBrowserStorage()) => {
  try {
    return normalizeWeekStartsOn(storage?.getItem(WEEK_START_STORAGE_KEY))
  } catch {
    return DEFAULT_WEEK_START
  }
}

export const writeStoredWeekStartsOn = (weekStartsOn, storage = getBrowserStorage()) => {
  try {
    storage?.setItem(WEEK_START_STORAGE_KEY, String(normalizeWeekStartsOn(weekStartsOn)))
  } catch {
    // Ignore storage failures so the in-memory preference still works.
  }
}

export const PreferencesProvider = ({ children }) => {
  const [weekStartsOn, setWeekStartsOnState] = useState(() => readStoredWeekStartsOn())

  useEffect(() => {
    writeStoredWeekStartsOn(weekStartsOn)
  }, [weekStartsOn])

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
