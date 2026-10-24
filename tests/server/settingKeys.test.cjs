const assert = require('node:assert/strict')
const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')
const test = require('node:test')

const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'setting-keys-'))
process.env.HABIT_TRACKER_DB_PATH = path.join(directory, 'test.db')
const store = require('../../server/db')
const app = require('../../server/index')
let server, base
const settings = JSON.parse('{"__proto__":{"profile":{"name":17}},"constructor":{"keep":"constructor"},"toString":["saved"],"future":{"keep":true}}')
const call = async (route, method = 'GET', body) => fetch(base + route, {
  method, headers: { 'Content-Type': 'application/json' }, body: body === undefined ? undefined : JSON.stringify(body)
})
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

test('accepted settings keys remain own data properties and agree with individual API reads', async () => {
  for (const [key, value] of Object.entries(settings)) {
    const response = await call(`/settings/${encodeURIComponent(key)}`, 'PUT', { value })
    assert.equal(response.status, 200)
    assert.deepEqual((await response.json()).value, value)
  }
  const state = await (await call('/state')).json()
  assert.deepEqual(state.settings, settings)
  assert.equal(Object.getPrototypeOf(store.getState().settings), Object.prototype)
  for (const [key, value] of Object.entries(settings)) {
    assert.equal(Object.hasOwn(store.getState().settings, key), true)
    assert.deepEqual((await (await call(`/settings/${key}`)).json()).value, value)
  }
})

test('complete-state round trips preserve prototype-named keys and reject invalid known settings without mutation', async () => {
  const state = { ...store.getState(), settings: { ...settings, profile: { name: 'Saved User' } } }
  assert.equal((await call('/restore', 'POST', state)).status, 200)
  const restored = await (await call('/state')).json()
  assert.deepEqual(restored, state)
  assert.equal((await call('/restore', 'POST', JSON.parse(JSON.stringify(restored)))).status, 200)
  assert.deepEqual(await (await call('/state')).json(), state)
  for (const invalidProfile of [[], { name: 17 }]) {
    assert.equal((await call('/settings/profile', 'PUT', { value: invalidProfile })).status, 400)
    assert.equal((await call('/restore', 'POST', { ...state, settings: { ...settings, profile: invalidProfile } })).status, 400)
    assert.deepEqual(await (await call('/state')).json(), state)
  }
})
