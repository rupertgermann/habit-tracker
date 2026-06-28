import React, { createContext, useContext, useState, useEffect } from 'react'
import { lightTheme, darkTheme } from '../styles/theme'

const ThemeContext = createContext()
const THEME_STORAGE_KEY = 'theme'
const DARK_THEME_VALUE = 'dark'
const LIGHT_THEME_VALUE = 'light'

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

export const readStoredThemePreference = (storage = getBrowserStorage()) => {
  try {
    const savedTheme = storage?.getItem(THEME_STORAGE_KEY)

    if (savedTheme === DARK_THEME_VALUE || savedTheme === LIGHT_THEME_VALUE) {
      return savedTheme
    }
  } catch {
    return null
  }

  return null
}

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
  storage,
  windowObject
} = {}) => {
  const savedTheme = readStoredThemePreference(storage ?? getBrowserStorage())

  if (savedTheme) {
    return savedTheme === DARK_THEME_VALUE
  }

  return getSystemPrefersDark(windowObject ?? (typeof window !== 'undefined' ? window : undefined))
}

export const writeStoredThemePreference = (isDarkMode, storage = getBrowserStorage()) => {
  try {
    storage?.setItem(THEME_STORAGE_KEY, isDarkMode ? DARK_THEME_VALUE : LIGHT_THEME_VALUE)
  } catch {
    // Ignore storage failures so theme toggling still works in restricted browsers.
  }
}

export const ThemeProvider = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState(() => resolveInitialIsDarkMode())
  const theme = isDarkMode ? darkTheme : lightTheme

  // Save theme preference to localStorage whenever it changes
  useEffect(() => {
    writeStoredThemePreference(isDarkMode)
  }, [isDarkMode])

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
