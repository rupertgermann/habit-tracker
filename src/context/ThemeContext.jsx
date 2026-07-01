import React, { createContext, useContext, useState, useEffect } from 'react'
import { habitsApi } from '../api/habitsApi'
import { lightTheme, darkTheme } from '../styles/theme'

const ThemeContext = createContext()
export const LEGACY_THEME_STORAGE_KEY = 'theme'
export const THEME_SETTINGS_KEY = 'theme'
export const DARK_THEME_VALUE = 'dark'
export const LIGHT_THEME_VALUE = 'light'

const getBrowserStorage = () => {
  try {
    if (typeof window === 'undefined') {
      return null
    }

    return window.localStorage
  } catch {
    return null
  }
}

export const normalizeThemePreference = value =>
  value === DARK_THEME_VALUE || value === LIGHT_THEME_VALUE ? value : null

const getSystemPrefersDark = (windowObject = typeof window !== 'undefined' ? window : undefined) => {
  try {
    if (typeof windowObject?.matchMedia !== 'function') {
      return false
    }

    return windowObject.matchMedia('(prefers-color-scheme: dark)').matches
  } catch {
    return false
  }
}

export const resolveInitialIsDarkMode = ({
  themePreference,
  windowObject
} = {}) => {
  const savedTheme = normalizeThemePreference(themePreference)

  if (savedTheme) {
    return savedTheme === DARK_THEME_VALUE
  }

  return getSystemPrefersDark(windowObject ?? (typeof window !== 'undefined' ? window : undefined))
}

export const removeLegacyThemePreference = (storage = getBrowserStorage()) => {
  try {
    storage?.removeItem?.(LEGACY_THEME_STORAGE_KEY)
  } catch {
    // The database remains the source of truth when browser storage is unavailable.
  }
}

export const ThemeProvider = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState(() => resolveInitialIsDarkMode())
  const [settingsLoaded, setSettingsLoaded] = useState(false)
  const theme = isDarkMode ? darkTheme : lightTheme

  useEffect(() => {
    let cancelled = false

    removeLegacyThemePreference()

    habitsApi.getSetting(THEME_SETTINGS_KEY)
      .then(({ value }) => {
        if (cancelled) return

        const savedTheme = normalizeThemePreference(value)
        if (savedTheme) {
          setIsDarkMode(savedTheme === DARK_THEME_VALUE)
        }
      })
      .catch(error => {
        if (!cancelled) console.error('Failed to load theme preference:', error)
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

    habitsApi.saveSetting(THEME_SETTINGS_KEY, isDarkMode ? DARK_THEME_VALUE : LIGHT_THEME_VALUE)
      .catch(error => console.error('Failed to save theme preference:', error))
  }, [isDarkMode, settingsLoaded])

  // Apply theme class to body
  useEffect(() => {
    if (isDarkMode) {
      document.body.classList.add('dark-mode')
    } else {
      document.body.classList.remove('dark-mode')
    }
  }, [isDarkMode])

  const toggleTheme = () => {
    setIsDarkMode(currentIsDarkMode => !currentIsDarkMode)
  }

  const value = {
    theme,
    isDarkMode,
    toggleTheme
  }

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  )
}

export const useTheme = () => {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}
