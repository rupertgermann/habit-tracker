const assert = require('node:assert/strict')
const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')
const test = require('node:test')

const testDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'habit-deletion-'))
process.env.HABIT_TRACKER_DB_PATH = path.join(testDirectory, 'habit-tracker.db')

const store = require('../../server/db')
const { createHabitDeletion } = require('../../server/habitDeletion')
const deleteHabit = createHabitDeletion({ db: store.db, getState: store.getState })

test.after(() => {
  store.db.close()
  fs.rmSync(testDirectory, { recursive: true, force: true })
})

test.beforeEach(() => {
  store.clearAll()
})

test('deleting a Habit returns committed state without its related Journal Entry', () => {
  const habit = { id: 'habit-to-delete', name: 'Read' }
  const journalEntry = {
    id: 'related-entry',
    habitId: habit.id,
    date: '2026-07-11',
    content: 'Finished a chapter'
  }
  store.upsertRow('habits', habit)
  store.upsertRow('journal_entries', journalEntry)

  const result = deleteHabit(habit.id)

  assert.deepEqual(result, {
    ok: true,
    deletedHabitId: habit.id,
    state: {
      habits: [],
      categories: store.listRows('categories'),
      journalEntries: [],
      settings: {}
    }
  })
  assert.deepEqual(store.getState(), result.state)
})

test('deleting a Habit preserves unrelated Journal Entries', () => {
  const deletedHabit = { id: 'habit-to-delete', name: 'Read' }
  const keptHabit = { id: 'habit-to-keep', name: 'Walk' }
  const relatedEntry = { id: 'related-entry', habitId: deletedHabit.id, content: 'Read' }
  const unrelatedEntry = { id: 'unrelated-entry', habitId: keptHabit.id, content: 'Walked' }
  store.upsertRow('habits', deletedHabit)
  store.upsertRow('habits', keptHabit)
  store.upsertRow('journal_entries', relatedEntry)
  store.upsertRow('journal_entries', unrelatedEntry)

  const result = deleteHabit(deletedHabit.id)

  assert.deepEqual(result.state.habits, [keptHabit])
  assert.deepEqual(result.state.journalEntries, [unrelatedEntry])
  assert.deepEqual(store.getState(), result.state)
})

test('a failed Habit deletion rolls back its related Journal Entry deletion', () => {
  const habit = { id: 'habit-to-delete', name: 'Read' }
  const journalEntry = { id: 'related-entry', habitId: habit.id, content: 'Read' }
  store.upsertRow('habits', habit)
  store.upsertRow('journal_entries', journalEntry)
  store.db.exec(`
    CREATE TRIGGER force_habit_delete_failure
    BEFORE DELETE ON habits
    BEGIN
      SELECT RAISE(ABORT, 'forced Habit deletion failure');
    END;
  `)

  assert.throws(
    () => deleteHabit(habit.id),
    /forced Habit deletion failure/
  )
  assert.deepEqual(store.getState().habits, [habit])
  assert.deepEqual(store.getState().journalEntries, [journalEntry])

  store.db.exec('DROP TRIGGER force_habit_delete_failure')
})
