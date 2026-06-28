import assert from 'node:assert/strict'
import {
  resolveInitialIsDarkMode,
  writeStoredThemePreference
} from '/src/context/ThemeContext.jsx'

const createStorage = (initialValue = null) => {
  const values = new Map()

  if (initialValue !== null) {
    values.set('theme', initialValue)
  }

  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
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
    name: 'theme context initializes dark mode from saved preference',
    run() {
      assert.equal(
        resolveInitialIsDarkMode({
          storage: createStorage('dark'),
          windowObject: createWindow(false)
        }),
        true
      )
    }
  },
  {
    name: 'theme context keeps saved light preference over system dark mode',
    run() {
      assert.equal(
        resolveInitialIsDarkMode({
          storage: createStorage('light'),
          windowObject: createWindow(true)
        }),
        false
      )
    }
  },
  {
    name: 'theme context falls back to system preference when storage is unavailable',
    run() {
      assert.equal(
        resolveInitialIsDarkMode({
          storage: {
            getItem: () => {
              throw new Error('storage unavailable')
            }
          },
          windowObject: createWindow(true)
        }),
        true
      )
    }
  },
  {
    name: 'theme context persists the selected theme value',
    run() {
      const storage = createStorage()

      writeStoredThemePreference(true, storage)
      assert.equal(storage.valueFor('theme'), 'dark')

      writeStoredThemePreference(false, storage)
      assert.equal(storage.valueFor('theme'), 'light')
    }
  }
]
