const assert = require('node:assert/strict')
const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')
const test = require('node:test')
const { habitsApi } = require('../../src/api/habitsApi.js')

const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'safe-record-ids-'))
process.env.HABIT_TRACKER_DB_PATH = path.join(directory, 'test.db')
const store = require('../../server/db')
const app = require('../../server/index')
const fetchHttp = global.fetch
let server, base
const ids = [
  ['record?imported', 'record%3Fimported'],
  ['record#fragment', 'record%23fragment'],
  ['record/child', 'record%2Fchild'],
  ['record%2Fchild', 'record%252Fchild'],
  ['record\\child', 'record%5Cchild'],
  ['../data', '..%2Fdata'],
  ['..\\data', '..%5Cdata'],
  ['%2e', '%252e'],
  ['%2e%2e', '%252e%252e']
]
const collections = [
  ['habits', 'habits', 'Habit', { name: 'Read', completions: [] }],
  ['categories', 'categories', 'Category', { name: 'Reading' }],
  ['journalEntries', 'journal', 'JournalEntry', { habitId: 'keeper', date: '2026-10-23', createdAt: '2026-10-23T08:00:00Z', content: 'Reflection' }]
]
const initialState = () => ({
  habits: [{ id: 'keeper', name: 'Keep this Habit', completions: [] }],
  categories: [{ id: 'other', name: 'Other' }],
  journalEntries: [{ id: 'keeper-entry', habitId: 'keeper', date: '2026-10-23', createdAt: '2026-10-23T08:00:00Z', content: 'Keep this reflection' }],
  settings: { unknownSetting: { keep: true } }
})

test.before(async () => {
  server = app.listen(0, '127.0.0.1')
  await new Promise(resolve => server.once('listening', resolve))
  base = `http://127.0.0.1:${server.address().port}`
})
test.after(async () => {
  global.fetch = fetchHttp
  await new Promise(resolve => server.close(resolve))
  store.db.close()
  fs.rmSync(directory, { recursive: true })
})
test.afterEach(() => { global.fetch = fetchHttp })

for (const [collection, route, method, fields] of collections) {
  for (const operation of ['update', 'delete']) {
    test(`${operation}${method} encodes each raw ID once and rejects standalone dot segments without a request`, async () => {
      const requests = []
      global.fetch = async (url, options) => {
        requests.push({ url, options })
        return new Response(null, { status: 204 })
      }
      for (const [id, encoded] of ids) {
        await habitsApi[`${operation}${method}`](operation === 'update' ? { ...fields, id } : id)
        const request = requests.at(-1)
        assert.equal(request.url, `/api/${route}/${encoded}`)
        assert.equal(request.options.method, operation === 'update' ? 'PUT' : 'DELETE')
        if (operation === 'update') assert.equal(JSON.parse(request.options.body).id, id)
      }
      requests.length = 0
      for (const id of ['.', '..']) {
        await assert.rejects(async () => habitsApi[`${operation}${method}`](operation === 'update' ? { ...fields, id } : id), /id/i)
      }
      assert.deepEqual(requests, [])
    })
  }

  test(`${method} updates and deletes reserved IDs through the real API without changing unrelated state`, async () => {
    global.fetch = (url, options) => fetchHttp(new URL(url, base), options)
    for (const [id] of ids) {
      const state = initialState()
      state[collection].push({ ...fields, id: 'record' }, { ...fields, id })
      const prior = (await habitsApi.restore(state)).state
      const target = prior[collection].find(record => record.id === id)
      const changes = collection === 'journalEntries' ? { content: 'Updated reflection' } : { name: 'Updated name' }
      const updated = await habitsApi[`update${method}`]({ ...target, ...changes })
      assert.equal(updated.id, id)
      assert.deepEqual(await habitsApi.getState(), {
        ...prior,
        [collection]: prior[collection].map(record => record.id === id ? updated : record)
      })
      await habitsApi[`delete${method}`](id)
      assert.deepEqual(await habitsApi.getState(), {
        ...prior,
        [collection]: prior[collection].filter(record => record.id !== id)
      })
    }
  })

  test(`${method} standalone dot IDs are rejected by restore and create without changing any persisted state`, async () => {
    global.fetch = (url, options) => fetchHttp(new URL(url, base), options)
    const prior = (await habitsApi.restore(initialState())).state
    for (const id of ['.', '..']) {
      const record = { ...fields, id }
      const invalid = { ...prior, [collection]: [...prior[collection], record] }
      await assert.rejects(habitsApi.restore(invalid), { status: 400 })
      assert.deepEqual(await habitsApi.getState(), prior)
      await assert.rejects(habitsApi[`create${method}`](record), { status: 400 })
      assert.deepEqual(await habitsApi.getState(), prior)
    }
  })
}
