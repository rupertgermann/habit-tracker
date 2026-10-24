const assert = require('node:assert/strict')
const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')
const { test, before, after } = require('node:test')

const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'habit-backup-size-'))
process.env.HABIT_TRACKER_DB_PATH = path.join(directory, 'test.db')
const store = require('../../server/db')
const app = require('../../server/index')
const { MAX_BACKUP_BYTES, BACKUP_SIZE_ERROR_MESSAGE } = require('../../shared/backupLimits.mjs')
let server, base

before(async () => {
  server = app.listen(0, '127.0.0.1')
  await new Promise(resolve => server.once('listening', resolve))
  base = `http://127.0.0.1:${server.address().port}/api`
})

after(async () => {
  await new Promise(resolve => server.close(resolve))
  store.db.close()
  fs.rmSync(directory, { recursive: true, force: true })
})

test('valid accumulated state above 5 MiB restores with authoritative committed state', async () => {
  const state = {
    habits: [{ id: 'read', name: 'Read', completions: [] }],
    categories: [],
    journalEntries: Array.from({ length: 6 }, (_, index) => ({
      id: `entry-${index}`, habitId: 'read', date: '2026-10-23',
      createdAt: '2026-10-23T09:00:00.000Z', content: 'a'.repeat(900_000)
    })),
    settings: { profile: { name: 'Large backup' } }
  }
  const body = JSON.stringify(state)
  assert.ok(Buffer.byteLength(body) > 5 * 1024 * 1024)
  const response = await fetch(base + '/restore', {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body
  })
  assert.equal(response.status, 200)
  const committed = await response.json()
  assert.equal(committed.ok, true)
  assert.deepEqual(committed.state, store.getState())
  assert.equal(typeof committed.state.habits[0].revision, 'string')
  assert.deepEqual({
    ...committed.state,
    habits: committed.state.habits.map(({ revision, ...habit }) => habit),
    journalEntries: committed.state.journalEntries.map(({ revision, ...entry }) => entry)
  }, state)
})

test('oversized restore returns the size contract and preserves exact prior state', async () => {
  const prior = store.getState()
  const response = await fetch(base + '/restore', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ padding: 'a'.repeat(MAX_BACKUP_BYTES) })
  })
  assert.equal(response.status, 413)
  assert.deepEqual(await response.json(), { error: BACKUP_SIZE_ERROR_MESSAGE, code: 'backup-too-large' })
  assert.deepEqual(store.getState(), prior)
})

test('ordinary record writes retain the 5 MiB request limit', async () => {
  const prior = store.getState()
  const response = await fetch(base + '/journal', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      id: 'too-large', habitId: 'read', date: '2026-10-23',
      createdAt: '2026-10-23T09:00:00.000Z', content: 'a'.repeat(5 * 1024 * 1024)
    })
  })
  assert.equal(response.status, 413)
  assert.deepEqual(store.getState(), prior)
})
