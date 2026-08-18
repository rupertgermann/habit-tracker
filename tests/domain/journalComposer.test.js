import assert from 'node:assert/strict'
import { getJournalComposerState } from '/src/domain/journalComposer.js'

const today = new Date('2026-06-30T12:00:00.000Z')

const habits = [
  { id: 'water', name: 'Drink water' },
  { id: 'love-you', name: 'Say love you' }
]

const journalEntries = [
  {
    id: 'water-today',
    habitId: 'water',
    moodId: 'good',
    date: '2026-06-30',
    content: 'Logged water',
    createdAt: '2026-06-30T09:00:00.000Z'
  }
]

const composerState = (draft, overrides = {}) => getJournalComposerState({
  habits,
  journalEntries,
  draft,
  today,
  ...overrides
})

export const tests = [
  {
    name: 'composer offers every habit sorted by name and defaults the draft date to today',
    run() {
      const state = composerState({ habitId: '', date: '', content: '', moodId: null })

      assert.deepEqual(state.habitOptions, [
        { value: 'water', label: 'Drink water' },
        { value: 'love-you', label: 'Say love you' }
      ])
      assert.equal(state.defaultDate, '2026-06-30')
      assert.equal(state.maxDate, '2026-06-30')
    }
  },
  {
    name: 'composer cannot save without a habit, a date, and content',
    run() {
      assert.equal(composerState({ habitId: '', date: '2026-06-29', content: 'Nice' }).canSave, false)
      assert.equal(composerState({ habitId: 'love-you', date: '', content: 'Nice' }).canSave, false)
      assert.equal(composerState({ habitId: 'love-you', date: '2026-06-29', content: '   ' }).canSave, false)
      assert.equal(composerState({ habitId: 'love-you', date: '2026-06-29', content: 'Nice' }).canSave, true)
    }
  },
  {
    name: 'composer rejects a future date',
    run() {
      const state = composerState({ habitId: 'love-you', date: '2026-07-01', content: 'Nice' })

      assert.equal(state.canSave, false)
      assert.equal(state.dateError, 'Journal entries cannot be dated in the future.')
    }
  },
  {
    name: 'composer creates a new entry when the habit has no entry on that date',
    run() {
      const state = composerState({ habitId: 'love-you', date: '2026-06-30', content: '  Said it  ', moodId: 'good' })

      assert.equal(state.mode, 'create')
      assert.equal(state.existingEntry, null)
      assert.equal(state.notice, null)
      assert.deepEqual(state.entryData, {
        habitId: 'love-you',
        date: '2026-06-30',
        content: 'Said it',
        moodId: 'good'
      })
    }
  },
  {
    name: 'composer updates the existing entry instead of duplicating a habit and date',
    run() {
      const state = composerState({ habitId: 'water', date: '2026-06-30', content: 'Logged more water', moodId: 'bad' })

      assert.equal(state.mode, 'update')
      assert.equal(state.existingEntry.id, 'water-today')
      assert.equal(state.notice, 'Drink water already has an entry for this date. Saving will update it.')
      assert.deepEqual(state.entryData, {
        habitId: 'water',
        date: '2026-06-30',
        content: 'Logged more water',
        moodId: 'bad'
      })
    }
  },
  {
    name: 'composer is unavailable until at least one habit exists',
    run() {
      const state = composerState({ habitId: '', date: '2026-06-30', content: 'Nice' }, { habits: [] })

      assert.equal(state.canSave, false)
      assert.equal(state.notice, 'Add a habit before writing a journal entry.')
      assert.deepEqual(state.habitOptions, [])
    }
  }
]
