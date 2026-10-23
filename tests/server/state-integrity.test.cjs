const assert = require('node:assert/strict')
const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')
const test = require('node:test')
const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'state-integrity-'))
process.env.HABIT_TRACKER_DB_PATH = path.join(directory, 'test.db')
const store = require('../../server/db')
const app = require('../../server/index')
let server, base
const habit = { id: 'h', name: 'Read', category: 'learning', completions: [] }
const entry = { id: 'e', habitId: 'h', date: '2026-10-23', createdAt: '2026-10-23T08:00:00.000Z', content: 'A chapter' }
const call = async (route, body, method = 'POST') => {
  const response = await fetch(base + route, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
  return { status: response.status, body: await response.json() }
}
test.before(async () => {
  server = app.listen(0, '127.0.0.1')
  await new Promise(resolve => server.once('listening', resolve))
  base = `http://127.0.0.1:${server.address().port}/api`
})
test.after(async () => {
  await new Promise(resolve => server.close(resolve))
  store.db.close()
  fs.rmSync(directory, { recursive: true })
})
test.beforeEach(() => store.clearAll())
test('HTTP writes reject malformed records and broken relationships without changing state', async () => {
  assert.equal((await call('/habits', habit)).status, 201)
  assert.equal((await call('/journal', entry)).status, 201)
  const prior = store.getState()
  for (const [route, body] of [
    ['/habits', { ...habit, id: 'x', name: {} }],
    ['/habits', { ...habit, id: 'x', category: 'missing' }],
    ['/habits', { ...habit, id: '', completions: [] }],
    ['/habits', { ...habit, id: 'x', completions: [{ date: '2026-02-30' }] }],
    ['/journal', { ...entry, id: 'x', content: {} }],
    ['/journal', { ...entry, id: 'x', createdAt: undefined }],
    ['/journal', { ...entry, id: 'x', habitId: 'missing' }],
    ['/journal', { ...entry, id: 'x', date: '2026-02-30' }],
    ['/categories', { id: 'x', name: 7 }]
  ]) {
    const response = await call(route, body)
    assert.equal(response.status, 400, JSON.stringify(body))
    assert.equal(typeof response.body.error, 'string')
    assert.deepEqual(store.getState(), prior)
  }
  assert.equal((await call('/habits', habit)).status, 409)
  assert.equal((await call('/habits/missing', habit, 'PUT')).status, 404)
  assert.deepEqual(store.getState(), prior)
})
test('restore rejects incomplete and malformed states before deleting anything', async () => {
  await call('/habits', habit)
  const prior = store.getState()
  for (const state of [{}, null, { ...prior, settings: [] }, { ...prior, habits: [{ ...habit, name: null }] }, { ...prior, journalEntries: [{ ...entry, content: {} }] }]) {
    assert.equal((await call('/restore', state)).status, 400)
    assert.deepEqual(store.getState(), prior)
  }
  const valid = { ...prior, journalEntries: [entry] }
  const restored = (await call('/restore', valid)).body
  assert.equal(restored.ok, true)
  assert.deepEqual(restored.state, store.getState())
  assert.notEqual(restored.state.habits[0].revision, valid.habits[0].revision)
  const { revision, ...habitData } = restored.state.habits[0]
  const { revision: priorRevision, ...priorHabitData } = valid.habits[0]
  assert.deepEqual({ ...restored.state, habits: [habitData] }, { ...valid, habits: [priorHabitData] })
})
test('category deletion reassigns Habits atomically and rolls back on storage failure', async () => {
  await call('/habits', habit)
  const prior = store.getState()
  store.db.exec("CREATE TRIGGER fail_category_delete BEFORE DELETE ON categories BEGIN SELECT RAISE(ABORT, 'forced delete failure'); END")
  assert.equal((await call('/categories/learning', undefined, 'DELETE')).status, 500)
  assert.deepEqual(store.getState(), prior)
  store.db.exec('DROP TRIGGER fail_category_delete')
  const response = await call('/categories/learning', undefined, 'DELETE')
  assert.equal(response.status, 200)
  assert.equal(response.body.state.habits[0].category, 'other')
  assert.equal(response.body.state.categories.some(category => category.id === 'learning'), false)
  assert.deepEqual(response.body.state, store.getState())
  assert.equal((await call('/categories/other', undefined, 'DELETE')).status, 400)
})
test('invalid known settings are rejected and unknown settings survive', async () => {
  const prior = store.getState()
  for (const [key, value] of [['profile', []], ['preferences', { weekStartsOn: 9 }], ['theme', {}]]) {
    assert.equal((await call(`/settings/${key}`, { value }, 'PUT')).status, 400)
    assert.deepEqual(store.getState(), prior)
  }
  assert.equal((await call('/settings/future', { value: { feature: true } }, 'PUT')).status, 200)
})
test('a settings request without value cannot erase an existing setting', async () => {
  await call('/settings/future', { value: { preserved: true } }, 'PUT')
  const prior = store.getState()
  assert.equal((await call('/settings/future', {}, 'PUT')).status, 400)
  assert.deepEqual(store.getState(), prior)
  assert.equal((await call('/settings/future', { value: null }, 'PUT')).status, 200)
  assert.equal(store.getState().settings.future, null)
})
