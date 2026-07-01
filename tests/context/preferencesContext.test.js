import assert from 'node:assert/strict'
import {
  LEGACY_WEEK_START_STORAGE_KEY,
  normalizePreferencesSettings,
  normalizeWeekStartsOn,
  removeLegacyWeekStartPreference
} from '/src/context/PreferencesContext.jsx'

const createStorage = (initialValue = null) => {
  const values = new Map()

  if (initialValue !== null) {
    values.set(LEGACY_WEEK_START_STORAGE_KEY, initialValue)
  }

  return {
    removeItem: (key) => values.delete(key),
    valueFor: (key) => values.get(key)
  }
}

export const tests = [
  {
    name: 'week-start preference normalizes unsupported values to Sunday',
    run() {
      assert.equal(normalizeWeekStartsOn(undefined), 0)
      assert.equal(normalizeWeekStartsOn(0), 0)
      assert.equal(normalizeWeekStartsOn(1), 1)
      assert.equal(normalizeWeekStartsOn(6), 0)
    }
  },
  {
    name: 'week-start preference reads Monday from database settings',
    run() {
      assert.deepEqual(normalizePreferencesSettings({ weekStartsOn: 1 }), {
        weekStartsOn: 1
      })
    }
  },
  {
    name: 'week-start preference ignores unsupported database settings',
    run() {
      assert.deepEqual(normalizePreferencesSettings({ weekStartsOn: 6 }), {
        weekStartsOn: 0
      })
      assert.deepEqual(normalizePreferencesSettings(null), {
        weekStartsOn: 0
      })
    }
  },
  {
    name: 'week-start preference removes the legacy localStorage value',
    run() {
      const storage = createStorage('1')

      removeLegacyWeekStartPreference(storage)
      assert.equal(storage.valueFor(LEGACY_WEEK_START_STORAGE_KEY), undefined)
    }
  }
]
