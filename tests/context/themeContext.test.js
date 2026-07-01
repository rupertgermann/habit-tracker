import assert from 'node:assert/strict'
import {
  DARK_THEME_VALUE,
  LEGACY_THEME_STORAGE_KEY,
  LIGHT_THEME_VALUE,
  normalizeThemePreference,
  removeLegacyThemePreference,
  resolveInitialIsDarkMode
} from '/src/context/ThemeContext.jsx'

const createStorage = (initialValue = null) => {
  const values = new Map()

  if (initialValue !== null) {
    values.set(LEGACY_THEME_STORAGE_KEY, initialValue)
  }

  return {
    removeItem: (key) => values.delete(key),
    valueFor: (key) => values.get(key)
  }
}

const createWindow = (prefersDark) => ({
  matchMedia: (query) => ({
    matches: query === '(prefers-color-scheme: dark)' && prefersDark
  })
})

export const tests = [
  {
    name: 'theme context initializes dark mode from database preference',
    run() {
      assert.equal(
        resolveInitialIsDarkMode({
          themePreference: DARK_THEME_VALUE,
          windowObject: createWindow(false)
        }),
        true
      )
    }
  },
  {
    name: 'theme context keeps database light preference over system dark mode',
    run() {
      assert.equal(
        resolveInitialIsDarkMode({
          themePreference: LIGHT_THEME_VALUE,
          windowObject: createWindow(true)
        }),
        false
      )
    }
  },
  {
    name: 'theme context falls back to system preference when database has no theme',
    run() {
      assert.equal(
        resolveInitialIsDarkMode({
          themePreference: null,
          windowObject: createWindow(true)
        }),
        true
      )
    }
  },
  {
    name: 'theme context ignores unsupported database theme values',
    run() {
      assert.equal(normalizeThemePreference(DARK_THEME_VALUE), DARK_THEME_VALUE)
      assert.equal(normalizeThemePreference(LIGHT_THEME_VALUE), LIGHT_THEME_VALUE)
      assert.equal(normalizeThemePreference('system'), null)
    }
  },
  {
    name: 'theme context removes the legacy localStorage value',
    run() {
      const storage = createStorage(DARK_THEME_VALUE)

      removeLegacyThemePreference(storage)
      assert.equal(storage.valueFor(LEGACY_THEME_STORAGE_KEY), undefined)
    }
  }
]
