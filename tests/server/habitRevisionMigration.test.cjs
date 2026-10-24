const assert = require('node:assert/strict')
const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')
const { execFileSync } = require('node:child_process')
const { test } = require('node:test')
const Database = require('better-sqlite3')

for (const table of ['habits', 'journal_entries']) {
  test(`an existing database gains stable revisions without losing ${table} fields`, () => {
    const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'habit-migration-'))
    const databasePath = path.join(directory, 'legacy.db')
    try {
      const original = table === 'habits'
        ? { id: 'legacy', name: 'Read', completions: [{ date: '2026-10-23' }] }
        : { id: 'legacy-entry', habitId: 'legacy', date: '2026-10-23', content: 'Legacy reflection', moodId: 'good', createdAt: '2026-10-23T08:00:00.000Z' }
      const db = new Database(databasePath)
      db.exec(`CREATE TABLE ${table} (id TEXT PRIMARY KEY, data TEXT NOT NULL)`)
      db.prepare(`INSERT INTO ${table} VALUES (?, ?)`).run(original.id, JSON.stringify(original))
      db.close()
      const readAfterStartup = () => JSON.parse(execFileSync(process.execPath, ['-e', `
        const store = require('./server/db')
        process.stdout.write(JSON.stringify(store.listRows('${table}')))
        store.db.close()
      `], { env: { ...process.env, HABIT_TRACKER_DB_PATH: databasePath }, encoding: 'utf8' }))
      const [migrated] = readAfterStartup()
      const { revision, ...fields } = migrated
      assert.equal(typeof revision, 'string')
      assert.ok(revision.length > 0)
      assert.deepEqual(fields, original)
      assert.deepEqual(readAfterStartup(), [migrated])
    } finally {
      fs.rmSync(directory, { recursive: true, force: true })
    }
  })
}
