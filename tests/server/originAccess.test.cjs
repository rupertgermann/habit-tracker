const assert = require('node:assert/strict')
const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')
const { test, before, after } = require('node:test')
const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'habit-origin-'))
process.env.HABIT_TRACKER_DB_PATH = path.join(directory, 'test.db')
process.env.HABIT_TRACKER_ORIGIN = 'http://127.0.0.1:3340'
const store = require('../../server/db')
const app = require('../../server/index')
let server, base
before(async () => {
  server = app.listen(0, '127.0.0.1')
  await new Promise(resolve => server.once('listening', resolve))
  base = `http://127.0.0.1:${server.address().port}/api`
  store.writeRecord('habits', { id: 'private', name: 'Read', completions: [] }, true)
})
after(async () => {
  await new Promise(resolve => server.close(resolve))
  store.db.close()
  fs.rmSync(directory, { recursive: true, force: true })
})
test('untrusted browser origins cannot read, preflight, or mutate any app data', async () => {
  const prior = store.getState()
  for (const origin of ['https://untrusted.example', 'null', 'http://localhost:9999', 'http://127.0.0.1:3340.evil.example']) {
    for (const [route, method, body, extra] of [
      ['/state', 'GET'], ['/data', 'DELETE'],
      ['/restore', 'POST', '{}', { 'Content-Type': 'text/plain' }],
      ['/restore', 'POST', '{', { 'Content-Type': 'application/json' }],
      ['/data', 'OPTIONS', undefined, { 'Access-Control-Request-Method': 'DELETE' }]
    ]) {
      const response = await fetch(base + route, { method, body, headers: { Origin: origin, ...extra } })
      assert.equal(response.status, 403, `${origin} ${method} ${route}`)
      assert.equal(response.headers.get('access-control-allow-origin'), null)
      assert.deepEqual(store.getState(), prior)
    }
  }
})
test('trusted frontend and no-Origin local clients retain read and write access', async () => {
  assert.equal((await fetch(base + '/state')).status, 200)
  const headers = { Origin: 'http://127.0.0.1:3340', 'Content-Type': 'application/json' }
  assert.equal((await fetch(base + '/state', { headers })).status, 200)
  assert.equal((await fetch(base + '/settings/test', { method: 'PUT', headers, body: JSON.stringify({ value: 'saved' }) })).status, 200)
  assert.equal(store.getSetting('test'), 'saved')
})
test('cross-site requests without Origin do not bypass the guard', async () => {
  const prior = store.getState()
  const response = await fetch(base + '/data', { method: 'DELETE', headers: { 'Sec-Fetch-Site': 'cross-site' } })
  assert.equal(response.status, 403)
  assert.deepEqual(store.getState(), prior)
})
