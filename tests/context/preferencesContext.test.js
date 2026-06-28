import assert from 'node:assert/strict'
import {
  normalizeWeekStartsOn,
  readStoredWeekStartsOn,
  writeStoredWeekStartsOn
} from '/src/context/PreferencesContext.jsx'

const createStorage = (initialValue = null) => {
  const values = new Map()

  if (initialValue !== null) {
    values.set('habitTracker.weekStartsOn', initialValue)
  }

  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
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
    name: 'week-start preference reads Monday from storage',
    run() {
      assert.equal(readStoredWeekStartsOn(createStorage('1')), 1)
    }
  },
  {
    name: 'week-start preference persists the selected value',
    run() {
      const storage = createStorage()

      writeStoredWeekStartsOn(1, storage)
      assert.equal(storage.valueFor('habitTracker.weekStartsOn'), '1')

      writeStoredWeekStartsOn(0, storage)
      assert.equal(storage.valueFor('habitTracker.weekStartsOn'), '0')
    }
  }
]
