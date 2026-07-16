import assert from 'node:assert/strict'
import {
  BACKUP_FORMAT_VERSION,
  createBackupModule,
  createInMemoryBackupPersistence,
  LEGACY_BACKUP_VERSION
} from '/src/domain/backup.js'

const completeState = {
  habits: [{
    id: 'read',
    name: 'Read',
    completions: [{
      date: '2026-07-15',
      completedAt: '2026-07-15T08:00:00.000Z'
    }]
  }],
  categories: [{
    id: 'learning',
    name: 'Learning'
  }],
  journalEntries: [{
    id: 'entry-1',
    habitId: 'read',
    date: '2026-07-15',
    content: 'Finished a chapter'
  }],
  settings: {
    profile: {
      name: 'Database User',
      email: 'database@example.com',
      avatarImage: 'data:image/png;base64,avatar'
    },
    theme: 'dark',
    design: 'orbit',
    preferences: {
      weekStartsOn: 1
    },
    futureSetting: {
      enabled: true
    }
  }
}

export const tests = [
  {
    name: 'canonical snapshots preserve complete persisted state with deterministic version 2 metadata',
    async run() {
      const persistence = createInMemoryBackupPersistence({
        state: completeState
      })
      const backup = createBackupModule({
        persistence,
        clock: () => new Date('2026-07-16T09:10:11.000Z')
      })

      const result = await backup.createSnapshot()

      assert.equal(result.ok, true)
      assert.deepEqual(result.document, {
        formatVersion: BACKUP_FORMAT_VERSION,
        metadata: {
          createdAt: '2026-07-16T09:10:11.000Z'
        },
        state: completeState
      })
      assert.notEqual(result.document.state, completeState)
      assert.equal(
        result.serialized,
        `${JSON.stringify(result.document, null, 2)}\n`
      )
      assert.equal(result.filename, 'habit-tracker-backup-2026-07-16.json')
    }
  },
  {
    name: 'snapshot creation reports canonical-state read failures',
    async run() {
      const error = new Error('state unavailable')
      const persistence = createInMemoryBackupPersistence()
      persistence.failNextRead(error)
      const backup = createBackupModule({ persistence })

      const result = await backup.createSnapshot()

      assert.deepEqual(result, { ok: false, error })
    }
  },
  {
    name: 'canonical version 2 documents validate before restore',
    async run() {
      const persistence = createInMemoryBackupPersistence()
      const backup = createBackupModule({ persistence })
      const prepared = backup.prepareRestore(JSON.stringify({
        formatVersion: BACKUP_FORMAT_VERSION,
        metadata: {
          createdAt: '2026-07-16T09:10:11.000Z'
        },
        state: completeState
      }))

      assert.deepEqual(prepared, {
        ok: true,
        sourceVersion: BACKUP_FORMAT_VERSION,
        state: completeState
      })
      assert.deepEqual(persistence.getState(), {
        habits: [],
        categories: [],
        journalEntries: [],
        settings: {}
      })
    }
  },
  {
    name: 'supported legacy version 1.0.0 files migrate with safe defaults',
    async run() {
      const persistence = createInMemoryBackupPersistence()
      const backup = createBackupModule({ persistence })
      const prepared = backup.prepareRestore(JSON.stringify({
        version: LEGACY_BACKUP_VERSION,
        backupDate: '2025-01-02T03:04:05.000Z',
        habits: [{
          id: 'legacy-habit',
          name: 'Legacy Habit',
          completions: []
        }]
      }))

      assert.equal(prepared.ok, true)
      assert.equal(prepared.sourceVersion, LEGACY_BACKUP_VERSION)
      assert.deepEqual(prepared.state.habits, [{
        id: 'legacy-habit',
        name: 'Legacy Habit',
        completions: []
      }])
      assert.equal(prepared.state.categories.length, 7)
      assert.equal(prepared.state.categories[0].id, 'health')
      assert.deepEqual(prepared.state.journalEntries, [])
      assert.deepEqual(prepared.state.settings, {})
    }
  },
  {
    name: 'backup validation rejects malformed JSON and unsupported future versions',
    run() {
      const backup = createBackupModule({
        persistence: createInMemoryBackupPersistence()
      })

      const malformed = backup.prepareRestore('{')
      const future = backup.prepareRestore(JSON.stringify({
        formatVersion: 3,
        metadata: { createdAt: '2026-07-16T09:10:11.000Z' },
        state: completeState
      }))

      assert.equal(malformed.ok, false)
      assert.equal(malformed.error.code, 'malformed-json')
      assert.equal(future.ok, false)
      assert.equal(future.error.code, 'unsupported-version')
      assert.match(future.error.message, /version 3/)
    }
  },
  {
    name: 'backup validation rejects invalid collections, identities, Completions, Journal Entry associations, and settings',
    run() {
      const backup = createBackupModule({
        persistence: createInMemoryBackupPersistence()
      })
      const makeDocument = state => JSON.stringify({
        formatVersion: BACKUP_FORMAT_VERSION,
        metadata: { createdAt: '2026-07-16T09:10:11.000Z' },
        state
      })
      const invalidStates = [
        null,
        { ...completeState, habits: {} },
        { ...completeState, categories: 'invalid' },
        { ...completeState, journalEntries: {} },
        { ...completeState, settings: [] },
        {
          ...completeState,
          habits: [{ ...completeState.habits[0], id: '' }]
        },
        {
          ...completeState,
          habits: [{ ...completeState.habits[0], completions: {} }]
        },
        {
          ...completeState,
          journalEntries: [{
            ...completeState.journalEntries[0],
            habitId: 'missing-habit'
          }]
        }
      ]

      for (const state of invalidStates) {
        const result = backup.prepareRestore(makeDocument(state))
        assert.equal(result.ok, false)
        assert.equal(result.error.code, 'invalid-backup')
      }
    }
  },
  {
    name: 'restore returns authoritative committed state and preserves exact prior state on failure',
    async run() {
      const priorState = {
        habits: [{ id: 'prior', name: 'Prior', completions: [] }],
        categories: [],
        journalEntries: [],
        settings: { unknown: 'prior' }
      }
      const persistence = createInMemoryBackupPersistence({ state: priorState })
      const backup = createBackupModule({ persistence })
      const prepared = backup.prepareRestore(JSON.stringify({
        formatVersion: BACKUP_FORMAT_VERSION,
        metadata: { createdAt: '2026-07-16T09:10:11.000Z' },
        state: completeState
      }))

      const committed = await backup.restore(prepared)

      assert.deepEqual(committed, {
        ok: true,
        sourceVersion: BACKUP_FORMAT_VERSION,
        state: completeState
      })
      assert.deepEqual(persistence.getState(), completeState)

      const error = new Error('forced restore failure')
      persistence.failNextRestore(error)
      const failed = await backup.restore({
        ...prepared,
        state: priorState
      })

      assert.deepEqual(failed, {
        ok: false,
        sourceVersion: BACKUP_FORMAT_VERSION,
        error
      })
      assert.deepEqual(persistence.getState(), completeState)
    }
  }
]
