import assert from 'node:assert/strict'
import { getJournalTimeline } from '/src/domain/journalTimeline.js'

const weekStart = new Date('2026-06-28T12:00:00.000Z')

const habits = [
  { id: 'love-you', name: 'Say love you' },
  { id: 'water', name: 'Drink water' }
]

const moodOptions = [
  { id: 'happy', name: 'Happy', emoji: ':)' },
  { id: 'calm', name: 'Calm', emoji: ':|' }
]

const entries = [
  {
    id: 'current-love',
    habitId: 'love-you',
    moodId: 'happy',
    date: '2026-06-28',
    content: 'Said love you after breakfast',
    createdAt: '2026-06-28T09:00:00.000Z'
  },
  {
    id: 'current-water',
    habitId: 'water',
    moodId: 'calm',
    date: '2026-06-29',
    content: 'Logged water',
    createdAt: '2026-06-29T09:00:00.000Z'
  },
  {
    id: 'monday-love',
    habitId: 'love-you',
    moodId: 'happy',
    date: '2026-06-22',
    content: 'Monday love entry',
    createdAt: '2026-06-22T09:00:00.000Z'
  },
  {
    id: 'older-love',
    habitId: 'love-you',
    moodId: 'happy',
    date: '2026-06-21',
    content: 'Previous week love entry',
    createdAt: '2026-06-21T09:00:00.000Z'
  }
]

export const tests = [
  {
    name: 'timeline only includes entries from the selected week',
    run() {
      const timeline = getJournalTimeline({
        journalEntries: entries,
        habits,
        moodOptions,
        searchTerm: '',
        weekStart
      })

      assert.deepEqual(timeline.entries.map(item => item.entry.id), ['current-water', 'current-love'])
      assert.equal(timeline.stats.entryCount, 2)
      assert.equal(timeline.stats.entryCountLabel, 'Entries This Week')
      assert.equal(timeline.stats.avgEntriesPerDay, 0.3)
    }
  },
  {
    name: 'timeline can use Monday as the start of the selected week',
    run() {
      const timeline = getJournalTimeline({
        journalEntries: entries,
        habits,
        moodOptions,
        searchTerm: '',
        weekStart,
        weekStartsOn: 1
      })

      assert.deepEqual(timeline.entries.map(item => item.entry.id), ['current-love', 'monday-love'])
      assert.equal(timeline.stats.entryCount, 2)
      assert.equal(timeline.stats.avgEntriesPerDay, 0.3)
    }
  },
  {
    name: 'timeline search matches entry content and stays week-scoped',
    run() {
      const timeline = getJournalTimeline({
        journalEntries: entries,
        habits,
        moodOptions,
        searchTerm: 'love',
        weekStart
      })

      assert.deepEqual(timeline.entries.map(item => item.entry.id), ['current-love'])
      assert.equal(timeline.stats.entryCountLabel, 'Matching Entries')
      assert.equal(timeline.entries[0].habit.name, 'Say love you')
      assert.equal(timeline.entries[0].mood.name, 'Happy')
    }
  },
  {
    name: 'timeline search can match the habit name',
    run() {
      const timeline = getJournalTimeline({
        journalEntries: entries,
        habits,
        moodOptions,
        searchTerm: 'drink',
        weekStart
      })

      assert.deepEqual(timeline.entries.map(item => item.entry.id), ['current-water'])
      assert.equal(timeline.stats.mostCommonMood.id, 'calm')
    }
  }
]
