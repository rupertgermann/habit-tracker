const assert = require('node:assert/strict')
const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')
const test = require('node:test')

const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'composite-settings-'))
process.env.HABIT_TRACKER_DB_PATH = path.join(directory, 'test.db')
const store = require('../../server/db')
const app = require('../../server/index')
let server, base
const call = async (key, value, method = 'PATCH') => {
  const response = await fetch(`${base}/api/settings/${key}`, {
    method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ value })
  })
  return { status: response.status, value: response.ok ? (await response.json()).value : null }
}
test.before(async () => {
  server = app.listen(0, '127.0.0.1')
  await new Promise(resolve => server.once('listening', resolve))
  base = `http://127.0.0.1:${server.address().port}`
})
test.after(async () => {
  await new Promise(resolve => server.close(resolve))
  store.db.close()
  fs.rmSync(directory, { recursive: true })
})
test.beforeEach(() => store.clearAll())

test('independent Profile field updates preserve newer unrelated values in either order', async () => {
  const profile = { name: 'Rupert', email: 'rupert@example.com', avatarImage: 'old-avatar' }
  for (const patches of [[{ name: 'New name' }, { avatarImage: null }], [{ avatarImage: null }, { name: 'New name' }]]) {
    await call('profile', profile, 'PUT')
    for (const patch of patches) {
      const response = await call('profile', patch)
      assert.equal(response.status, 200)
      assert.deepEqual(response.value, store.getSetting('profile'))
    }
    assert.deepEqual(store.getSetting('profile'), { ...profile, name: 'New name', avatarImage: null })
  }
})

test('independent Daily Reminder field updates preserve disablement and time in either order', async () => {
  for (const patches of [[{ enabled: false }, { time: '10:00' }], [{ time: '10:00' }, { enabled: false }]]) {
    await call('dailyReminder', { enabled: true, time: '09:00' }, 'PUT')
    for (const patch of patches) {
      const response = await call('dailyReminder', patch)
      assert.equal(response.status, 200)
      assert.deepEqual(response.value, store.getSetting('dailyReminder'))
    }
    assert.deepEqual(store.getSetting('dailyReminder'), { enabled: false, time: '10:00' })
  }
})

test('invalid composite patches and unsupported keys fail without changing any stored state', async () => {
  await call('profile', { name: 'Keep me', email: 'keep@example.com', avatarImage: 'keep-avatar' }, 'PUT')
  await call('dailyReminder', { enabled: true, time: '18:45' }, 'PUT')
  const before = store.getState()
  for (const [key, patch] of [
    ['profile', null], ['profile', []], ['profile', 'invalid'], ['profile', { name: {} }],
    ['profile', { avatarImage: 4 }], ['dailyReminder', { enabled: 'false' }],
    ['dailyReminder', { time: '25:00' }], ['theme', { value: 'dark' }], ['future', { keep: true }]
  ]) {
    assert.equal((await call(key, patch)).status, 400)
    assert.deepEqual(store.getState(), before)
  }
})
