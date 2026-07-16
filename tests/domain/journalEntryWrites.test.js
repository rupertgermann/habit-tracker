import assert from 'node:assert/strict'
import {
  createInMemoryJournalEntryPersistence,
  createJournalEntryPersistence,
  createJournalEntryWriter
} from '/src/domain/journalEntryWrites.js'

const createdAt = new Date('2026-07-16T08:30:00.000Z')

const makeEntry = (overrides = {}) => ({
  id: 'journal-entry-1',
  habitId: 'morning-walk',
  date: '2026-07-16',
  content: 'A steady start',
  moodId: 'good',
  createdAt: createdAt.toISOString(),
  ...overrides
})

export const tests = [
  {
    name: 'Journal Entry HTTP persistence uses the existing create, update, and delete transport',
    async run() {
      const createdEntry = makeEntry()
      const updatedEntry = makeEntry({ content: 'Updated through HTTP' })
      const calls = []
      const persistence = createJournalEntryPersistence({
        createJournalEntry: async entry => {
          calls.push(['create', entry])
          return entry
        },
        updateJournalEntry: async entry => {
          calls.push(['update', entry])
          return entry
        },
        deleteJournalEntry: async id => {
          calls.push(['delete', id])
        }
      })

      assert.equal(await persistence.createJournalEntry(createdEntry), createdEntry)
      assert.equal(await persistence.updateJournalEntry(updatedEntry), updatedEntry)
      assert.equal(await persistence.deleteJournalEntry(createdEntry.id), undefined)
      assert.deepEqual(calls, [
        ['create', createdEntry],
        ['update', updatedEntry],
        ['delete', createdEntry.id]
      ])
    }
  },
  {
    name: 'creating a Journal Entry returns committed success and replaces the visible collection',
    async run() {
      const persistence = createInMemoryJournalEntryPersistence()
      let journalEntries = []
      const writer = createJournalEntryWriter({
        persistence,
        getJournalEntries: () => journalEntries,
        replaceJournalEntries: replacement => { journalEntries = replacement },
        createId: () => 'journal-entry-1',
        now: () => createdAt
      })

      const result = await writer.create({
        habitId: 'morning-walk',
        date: '2026-07-16',
        content: 'A steady start',
        moodId: 'good'
      })

      const expectedEntry = makeEntry()
      assert.deepEqual(result, {
        ok: true,
        changed: true,
        entry: expectedEntry,
        journalEntries: [expectedEntry]
      })
      assert.deepEqual(journalEntries, [expectedEntry])
      assert.deepEqual(persistence.getJournalEntries(), [expectedEntry])
    }
  },
  {
    name: 'failed Journal Entry creation restores the exact previous collection and returns failure',
    async run() {
      const previousEntry = makeEntry({ id: 'existing-entry', content: 'Already committed' })
      const previousJournalEntries = [previousEntry]
      const error = new Error('database unavailable')
      const persistence = createInMemoryJournalEntryPersistence({
        journalEntries: previousJournalEntries
      })
      persistence.failNextWrite(error)
      let journalEntries = previousJournalEntries
      const replacements = []
      const writer = createJournalEntryWriter({
        persistence,
        getJournalEntries: () => journalEntries,
        replaceJournalEntries: replacement => {
          replacements.push(replacement)
          journalEntries = replacement
        },
        createId: () => 'failed-entry',
        now: () => createdAt
      })

      const result = await writer.create({
        habitId: 'morning-walk',
        date: '2026-07-16',
        content: 'Keep this draft in the caller',
        moodId: 'very-good'
      })

      assert.equal(result.ok, false)
      assert.equal(result.changed, false)
      assert.equal(result.error, error)
      assert.equal(result.journalEntries, previousJournalEntries)
      assert.deepEqual(replacements, [previousJournalEntries])
      assert.equal(journalEntries, previousJournalEntries)
      assert.deepEqual(persistence.getJournalEntries(), previousJournalEntries)
    }
  },
  {
    name: 'updating a Journal Entry commits content, date, Habit association, and Mood',
    async run() {
      const previousEntry = makeEntry()
      const persistence = createInMemoryJournalEntryPersistence({
        journalEntries: [previousEntry]
      })
      let journalEntries = [previousEntry]
      const updatedAt = new Date('2026-07-16T09:15:00.000Z')
      const writer = createJournalEntryWriter({
        persistence,
        getJournalEntries: () => journalEntries,
        replaceJournalEntries: replacement => { journalEntries = replacement },
        now: () => updatedAt
      })

      const result = await writer.update(previousEntry.id, {
        habitId: 'evening-read',
        date: '2026-07-15',
        content: 'A more reflective revision',
        moodId: 'very-good'
      })

      const expectedEntry = makeEntry({
        habitId: 'evening-read',
        date: '2026-07-15',
        content: 'A more reflective revision',
        moodId: 'very-good',
        updatedAt: updatedAt.toISOString()
      })
      assert.deepEqual(result, {
        ok: true,
        changed: true,
        entry: expectedEntry,
        journalEntries: [expectedEntry]
      })
      assert.deepEqual(journalEntries, [expectedEntry])
      assert.deepEqual(persistence.getJournalEntries(), [expectedEntry])
    }
  },
  {
    name: 'failed Journal Entry update restores the exact previously committed collection',
    async run() {
      const previousEntry = makeEntry()
      const previousJournalEntries = [previousEntry]
      const error = new Error('update failed')
      const persistence = createInMemoryJournalEntryPersistence({
        journalEntries: previousJournalEntries
      })
      persistence.failNextWrite(error)
      let journalEntries = previousJournalEntries
      const replacements = []
      const writer = createJournalEntryWriter({
        persistence,
        getJournalEntries: () => journalEntries,
        replaceJournalEntries: replacement => {
          replacements.push(replacement)
          journalEntries = replacement
        },
        now: () => new Date('2026-07-16T09:30:00.000Z')
      })

      const result = await writer.update(previousEntry.id, {
        content: 'Retry this revision',
        moodId: 'very-good'
      })

      assert.equal(result.ok, false)
      assert.equal(result.changed, false)
      assert.equal(result.error, error)
      assert.equal(result.entry, previousEntry)
      assert.equal(result.journalEntries, previousJournalEntries)
      assert.deepEqual(replacements, [previousJournalEntries])
      assert.equal(journalEntries, previousJournalEntries)
      assert.deepEqual(persistence.getJournalEntries(), previousJournalEntries)
    }
  },
  {
    name: 'deleting a Journal Entry returns committed success and removes it from visible state',
    async run() {
      const deletedEntry = makeEntry()
      const keptEntry = makeEntry({ id: 'journal-entry-2', content: 'Keep this one' })
      const persistence = createInMemoryJournalEntryPersistence({
        journalEntries: [deletedEntry, keptEntry]
      })
      let journalEntries = [deletedEntry, keptEntry]
      const writer = createJournalEntryWriter({
        persistence,
        getJournalEntries: () => journalEntries,
        replaceJournalEntries: replacement => { journalEntries = replacement }
      })

      const result = await writer.delete(deletedEntry.id)

      assert.deepEqual(result, {
        ok: true,
        changed: true,
        entry: deletedEntry,
        journalEntries: [keptEntry]
      })
      assert.deepEqual(journalEntries, [keptEntry])
      assert.deepEqual(persistence.getJournalEntries(), [keptEntry])
    }
  },
  {
    name: 'failed Journal Entry deletion restores the exact previous collection',
    async run() {
      const previousEntry = makeEntry()
      const previousJournalEntries = [previousEntry]
      const error = new Error('delete failed')
      const persistence = createInMemoryJournalEntryPersistence({
        journalEntries: previousJournalEntries
      })
      persistence.failNextWrite(error)
      let journalEntries = previousJournalEntries
      const replacements = []
      const writer = createJournalEntryWriter({
        persistence,
        getJournalEntries: () => journalEntries,
        replaceJournalEntries: replacement => {
          replacements.push(replacement)
          journalEntries = replacement
        }
      })

      const result = await writer.delete(previousEntry.id)

      assert.equal(result.ok, false)
      assert.equal(result.changed, false)
      assert.equal(result.entry, previousEntry)
      assert.equal(result.error, error)
      assert.equal(result.journalEntries, previousJournalEntries)
      assert.deepEqual(replacements, [previousJournalEntries])
      assert.equal(journalEntries, previousJournalEntries)
      assert.deepEqual(persistence.getJournalEntries(), previousJournalEntries)
    }
  },
  {
    name: 'repeated Journal Entry delete input becomes a committed no-op',
    async run() {
      const entry = makeEntry()
      const persistence = createInMemoryJournalEntryPersistence({ journalEntries: [entry] })
      let journalEntries = [entry]
      const writer = createJournalEntryWriter({
        persistence,
        getJournalEntries: () => journalEntries,
        replaceJournalEntries: replacement => { journalEntries = replacement }
      })

      const first = await writer.delete(entry.id)
      const second = await writer.delete(entry.id)

      assert.equal(first.ok, true)
      assert.equal(first.changed, true)
      assert.deepEqual(second, {
        ok: true,
        changed: false,
        entry: null,
        journalEntries: []
      })
      assert.deepEqual(journalEntries, [])
      assert.deepEqual(persistence.getJournalEntries(), [])
    }
  },
  {
    name: 'overlapping writes to different Journal Entries preserve both committed results',
    async run() {
      const firstEntry = makeEntry({ id: 'first-entry', content: 'First original' })
      const secondEntry = makeEntry({ id: 'second-entry', content: 'Second original' })
      const persistedEntries = new Map([
        [firstEntry.id, firstEntry],
        [secondEntry.id, secondEntry]
      ])
      let releaseFirstWrite
      const persistence = {
        async updateJournalEntry(entry) {
          if (entry.id === firstEntry.id) {
            await new Promise(resolve => { releaseFirstWrite = resolve })
          }
          persistedEntries.set(entry.id, entry)
          return entry
        }
      }
      let journalEntries = [firstEntry, secondEntry]
      const writer = createJournalEntryWriter({
        persistence,
        getJournalEntries: () => journalEntries,
        replaceJournalEntries: replacement => { journalEntries = replacement },
        now: () => new Date('2026-07-16T09:45:00.000Z')
      })

      const firstWrite = writer.update(firstEntry.id, { content: 'First committed' })
      const secondWrite = writer.update(secondEntry.id, { content: 'Second committed' })
      await secondWrite

      assert.deepEqual(
        journalEntries.map(entry => entry.content),
        ['First original', 'Second committed']
      )

      releaseFirstWrite()
      await firstWrite

      assert.deepEqual(
        journalEntries.map(entry => entry.content),
        ['First committed', 'Second committed']
      )
      assert.equal(persistedEntries.get(firstEntry.id).content, 'First committed')
      assert.equal(persistedEntries.get(secondEntry.id).content, 'Second committed')
    }
  },
  {
    name: 'update then delete for one Journal Entry commits in caller order',
    async run() {
      const entry = makeEntry()
      let persistedEntries = [entry]
      let releaseUpdate
      let deleteStarted = false
      const persistence = {
        async updateJournalEntry(updatedEntry) {
          await new Promise(resolve => { releaseUpdate = resolve })
          persistedEntries = [updatedEntry]
          return updatedEntry
        },
        async deleteJournalEntry(id) {
          deleteStarted = true
          persistedEntries = persistedEntries.filter(currentEntry => currentEntry.id !== id)
        }
      }
      let journalEntries = [entry]
      const writer = createJournalEntryWriter({
        persistence,
        getJournalEntries: () => journalEntries,
        replaceJournalEntries: replacement => { journalEntries = replacement },
        now: () => new Date('2026-07-16T10:00:00.000Z')
      })

      const update = writer.update(entry.id, { content: 'Newest intent before delete' })
      const deletion = writer.delete(entry.id)
      await Promise.resolve()

      assert.equal(deleteStarted, false)
      assert.deepEqual(journalEntries, [entry])

      releaseUpdate()
      const results = await Promise.all([update, deletion])

      assert.deepEqual(results.map(result => result.ok), [true, true])
      assert.equal(deleteStarted, true)
      assert.deepEqual(journalEntries, [])
      assert.deepEqual(persistedEntries, [])
    }
  }
]
