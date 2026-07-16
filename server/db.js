const path = require('path')
const fs = require('fs')
const Database = require('better-sqlite3')
const DEFAULT_CATEGORIES = require('../shared/defaultCategories.json')

const DB_PATH = process.env.HABIT_TRACKER_DB_PATH || path.join(__dirname, 'data', 'habit-tracker.db')
const DATA_DIR = path.dirname(DB_PATH)
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true })
}

const db = new Database(DB_PATH)
db.pragma('journal_mode = WAL')
db.pragma('foreign_keys = ON')

// Each collection is stored as one row per item with the full item JSON in `data`.
// This keeps the schema flexible while still giving a real, queryable .db file.
db.exec(`
  CREATE TABLE IF NOT EXISTS habits (
    id TEXT PRIMARY KEY,
    data TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS categories (
    id TEXT PRIMARY KEY,
    data TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS journal_entries (
    id TEXT PRIMARY KEY,
    data TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT
  );
`)

const DEFAULT_CATEGORY_LEGACY_ICONS = {
  health: '💪',
  productivity: '📝',
  mindfulness: '🧘',
  learning: '📚',
  social: '👥',
  creativity: '🎨',
  other: '📌'
}

// Seed default categories on first run so the UI has its baseline set.
function seedCategories() {
  const count = db.prepare('SELECT COUNT(*) AS n FROM categories').get().n
  if (count === 0) {
    const insert = db.prepare('INSERT INTO categories (id, data) VALUES (?, ?)')
    const tx = db.transaction(items => {
      for (const item of items) insert.run(item.id, JSON.stringify(item))
    })
    tx(DEFAULT_CATEGORIES)
    return
  }

  const select = db.prepare('SELECT data FROM categories WHERE id = ?')
  const update = db.prepare('UPDATE categories SET data = ? WHERE id = ?')
  const tx = db.transaction(items => {
    for (const item of items) {
      const row = select.get(item.id)
      if (!row) continue

      const current = JSON.parse(row.data)
      if (current.icon !== DEFAULT_CATEGORY_LEGACY_ICONS[item.id]) continue

      update.run(JSON.stringify({ ...current, icon: item.icon }), item.id)
    }
  })
  tx(DEFAULT_CATEGORIES)
}
seedCategories()

function listRows(table) {
  return db.prepare(`SELECT data FROM ${table}`).all().map(row => JSON.parse(row.data))
}

function parseSettingValue(value) {
  if (value == null) return null

  try {
    return JSON.parse(value)
  } catch {
    return value
  }
}

function listSettings() {
  return db.prepare('SELECT key, value FROM settings').all().reduce((settings, row) => {
    settings[row.key] = parseSettingValue(row.value)
    return settings
  }, {})
}

function getSetting(key, fallback = null) {
  const row = db.prepare('SELECT value FROM settings WHERE key = ?').get(key)
  return row ? parseSettingValue(row.value) : fallback
}

function upsertSetting(key, value) {
  db.prepare(`INSERT INTO settings (key, value) VALUES (@key, @value)
              ON CONFLICT(key) DO UPDATE SET value = @value`)
    .run({ key, value: JSON.stringify(value) })
  return value
}

function upsertRow(table, item) {
  db.prepare(`INSERT INTO ${table} (id, data) VALUES (@id, @data)
              ON CONFLICT(id) DO UPDATE SET data = @data`)
    .run({ id: item.id, data: JSON.stringify(item) })
  return item
}

function deleteRow(table, id) {
  return db.prepare(`DELETE FROM ${table} WHERE id = ?`).run(id).changes > 0
}

function getState() {
  return {
    habits: listRows('habits'),
    categories: listRows('categories'),
    journalEntries: listRows('journal_entries'),
    settings: listSettings()
  }
}

function replaceAll({ habits = [], categories = [], journalEntries = [], settings = {} }) {
  const tx = db.transaction(() => {
    db.prepare('DELETE FROM habits').run()
    db.prepare('DELETE FROM categories').run()
    db.prepare('DELETE FROM journal_entries').run()
    db.prepare('DELETE FROM settings').run()

    const insertHabit = db.prepare('INSERT INTO habits (id, data) VALUES (?, ?)')
    for (const h of habits) insertHabit.run(h.id, JSON.stringify(h))

    const insertCategory = db.prepare('INSERT INTO categories (id, data) VALUES (?, ?)')
    for (const c of categories) insertCategory.run(c.id, JSON.stringify(c))

    const insertEntry = db.prepare('INSERT INTO journal_entries (id, data) VALUES (?, ?)')
    for (const e of journalEntries) insertEntry.run(e.id, JSON.stringify(e))

    const insertSetting = db.prepare('INSERT INTO settings (key, value) VALUES (?, ?)')
    const settingEntries = settings && typeof settings === 'object' && !Array.isArray(settings)
      ? Object.entries(settings)
      : []
    for (const [key, value] of settingEntries) {
      insertSetting.run(key, JSON.stringify(value))
    }

    return getState()
  })
  return tx()
}

function clearAll() {
  const tx = db.transaction(() => {
    db.prepare('DELETE FROM habits').run()
    db.prepare('DELETE FROM categories').run()
    db.prepare('DELETE FROM journal_entries').run()
    db.prepare('DELETE FROM settings').run()
  })
  tx()
  seedCategories()
}

module.exports = {
  DB_PATH,
  db,
  getState,
  listRows,
  listSettings,
  getSetting,
  upsertRow,
  upsertSetting,
  deleteRow,
  replaceAll,
  clearAll
}
