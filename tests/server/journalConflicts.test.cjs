const assert = require('node:assert/strict')
const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')
const { test, before, after, beforeEach } = require('node:test')
const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'journal-conflicts-'))
process.env.HABIT_TRACKER_DB_PATH = path.join(directory, 'test.db')
const app = require('../../server/index')
const store = require('../../server/db')
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
beforeEach(() => store.clearAll())
const request = (url, method, body) => fetch(`${base}${url}`, {
  method, headers: { 'Content-Type': 'application/json' },
  body: body === undefined ? undefined : JSON.stringify(body)
})
const create = async () => {
  await request('/habits', 'POST', { id: 'read', name: 'Read', category: 'other', completions: [] })
  const response = await request('/journal', 'POST', { id: 'reflection', habitId: 'read', date: '2026-10-23', content: 'Original reflection', moodId: 'good', createdAt: '2026-10-23T08:00:00.000Z' })
  assert.equal(response.status, 201)
  return response.json()
}
test('stale and unversioned updates preserve the exact committed state', async () => {
  const original = await create()
  const accepted = await request('/journal/reflection', 'PUT', {
    ...original, content: 'Newer reflection'
  })
  assert.equal(accepted.status, 200)
  const committed = await accepted.json()
  const prior = store.getState()
  const stale = await request('/journal/reflection', 'PUT', { ...original, moodId: 'very-good' })
  assert.equal(stale.status, 409)
  assert.deepEqual((await stale.json()).state, prior)
  assert.deepEqual(store.getState(), prior)
  const { revision, ...unversioned } = committed
  assert.equal((await request('/journal/reflection', 'PUT', unversioned)).status, 409)
  assert.deepEqual(store.getState(), prior)
})
test('a stale update cannot recreate a deleted Journal Entry', async () => {
  const original = await create()
  assert.equal((await request('/journal/reflection', 'DELETE')).status, 204)
  const prior = store.getState()
  const response = await request('/journal/reflection', 'PUT', original)
  assert.equal(response.status, 404)
  assert.deepEqual((await response.json()).state, prior)
  assert.deepEqual(store.getState(), prior)
})
test('restore invalidates previous revisions even for identical Journal Entry data', async () => {
  const original = await create()
  const response = await request('/restore', 'POST', store.getState())
  assert.equal(response.status, 200)
  const restored = (await response.json()).state
  assert.notEqual(restored.journalEntries[0].revision, original.revision)
  assert.equal((await request('/journal/reflection', 'PUT', original)).status, 409)
  assert.deepEqual(store.getState(), restored)
})
