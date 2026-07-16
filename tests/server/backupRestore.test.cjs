const assert = require('node:assert/strict')
const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')
const test = require('node:test')

const testDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'backup-restore-'))
process.env.HABIT_TRACKER_DB_PATH = path.join(testDirectory, 'habit-tracker.db')

const store = require('../../server/db')
const { createStateRestorer } = require('../../server/backupRestore')
const restoreState = createStateRestorer({
  replaceAll: store.replaceAll
})

const replacementState = {
  habits: [{
    id: 'replacement-habit',
    name: 'Read',
    completions: []
  }],
  categories: [],
  journalEntries: [{
    id: 'replacement-entry',
    habitId: 'replacement-habit',
    content: 'Chapter one'
  }],
  settings: {
    profile: {
      name: 'Restored User',
      avatarImage: 'data:image/png;base64,avatar'
    },
    unknownSetting: {
      preserved: true
    }
  }
}

test.after(() => {
  store.db.close()
  fs.rmSync(testDirectory, { recursive: true, force: true })
})

test.beforeEach(() => {
  store.clearAll()
})

test('complete restore commits exact state and returns the authoritative result', () => {
  const result = restoreState(replacementState)

  assert.deepEqual(result, {
    ok: true,
    state: replacementState
  })
  assert.deepEqual(store.getState(), replacementState)
})

test('forced complete restore failure preserves exact previous state', () => {
  const priorState = {
    habits: [{ id: 'prior-habit', name: 'Walk', completions: [] }],
    categories: [{ id: 'prior-category', name: 'Prior' }],
    journalEntries: [{
      id: 'prior-entry',
      habitId: 'prior-habit',
      content: 'Prior entry'
    }],
    settings: {
      prior: {
        exact: true
      }
    }
  }
  store.replaceAll(priorState)
  store.db.exec(`
    CREATE TRIGGER force_complete_restore_failure
    BEFORE INSERT ON settings
    BEGIN
      SELECT RAISE(ABORT, 'forced complete restore failure');
    END;
  `)

  assert.throws(
    () => restoreState(replacementState),
    /forced complete restore failure/
  )
  assert.deepEqual(store.getState(), priorState)

  store.db.exec('DROP TRIGGER force_complete_restore_failure')
})
