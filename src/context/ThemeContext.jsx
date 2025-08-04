import React, { createContext, useContext, useState, useEffect } from 'react'
import { lightTheme, darkTheme } from '../styles/theme'

const ThemeContext = createContext()

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(lightTheme)
  const [isDarkMode, setIsDarkMode] = useState(false)

  // Load theme preference from localStorage on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme')
    if (savedTheme) {
      if (savedTheme === 'dark') {
        setTheme(darkTheme)
        setIsDarkMode(true)
      } else {
        setTheme(lightTheme)
        setIsDarkMode(false)
      }
    } else {
      // Check system preference
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      if (prefersDark) {
        setTheme(darkTheme)
        setIsDarkMode(true)
      }
    }
  }, [])

  // Save theme preference to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('theme', isDarkMode ? 'dark' : 'light')
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
    setIsDarkMode(!isDarkMode)
    setTheme(isDarkMode ? lightTheme : darkTheme)
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