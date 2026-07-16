import React, { createContext, useContext, useState, useEffect } from 'react'
import { habitsApi } from '../api/habitsApi'
import {
  DEFAULT_DESIGN_ID,
  DESIGN_OPTIONS,
  getDesignTheme,
  normalizeDesignPreference
} from '../styles/designs'

const ThemeContext = createContext()
export const LEGACY_THEME_STORAGE_KEY = 'theme'
export const THEME_SETTINGS_KEY = 'theme'
export const DESIGN_SETTINGS_KEY = 'design'
export const DARK_THEME_VALUE = 'dark'
export const LIGHT_THEME_VALUE = 'light'
export { DEFAULT_DESIGN_ID, normalizeDesignPreference }

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
  const [design, setDesignState] = useState(DEFAULT_DESIGN_ID)
  const [settingsLoaded, setSettingsLoaded] = useState(false)
  const theme = getDesignTheme(design, isDarkMode)

  useEffect(() => {
    let cancelled = false

    removeLegacyThemePreference()

    const loadAppearanceSettings = async () => {
      const [themeResult, designResult] = await Promise.allSettled([
        habitsApi.getSetting(THEME_SETTINGS_KEY),
        habitsApi.getSetting(DESIGN_SETTINGS_KEY)
      ])

      if (cancelled) return

      if (themeResult.status === 'fulfilled') {
        const savedTheme = normalizeThemePreference(themeResult.value.value)
        if (savedTheme) setIsDarkMode(savedTheme === DARK_THEME_VALUE)
      } else {
        console.error('Failed to load theme preference:', themeResult.reason)
      }

      if (designResult.status === 'fulfilled') {
        setDesignState(normalizeDesignPreference(designResult.value.value))
      } else {
        console.error('Failed to load design preference:', designResult.reason)
      }

      setSettingsLoaded(true)
    }

    loadAppearanceSettings()

    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!settingsLoaded) return

    habitsApi.saveSetting(THEME_SETTINGS_KEY, isDarkMode ? DARK_THEME_VALUE : LIGHT_THEME_VALUE)
      .catch(error => console.error('Failed to save theme preference:', error))
  }, [isDarkMode, settingsLoaded])

  useEffect(() => {
    if (!settingsLoaded) return

    habitsApi.saveSetting(DESIGN_SETTINGS_KEY, design)
      .catch(error => console.error('Failed to save design preference:', error))
  }, [design, settingsLoaded])

  // Apply theme class to body
  useEffect(() => {
    if (isDarkMode) {
      document.body.classList.add('dark-mode')
    } else {
      document.body.classList.remove('dark-mode')
    }
  }, [isDarkMode])

  useEffect(() => {
    document.documentElement.dataset.design = design
    document.body.dataset.design = design
  }, [design])

  const toggleTheme = () => {
    setIsDarkMode(currentIsDarkMode => !currentIsDarkMode)
  }

  const setDesign = value => {
    setDesignState(normalizeDesignPreference(value))
  }

  const value = {
    theme,
    isDarkMode,
    toggleTheme,
    design,
    setDesign,
    designOptions: DESIGN_OPTIONS
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
