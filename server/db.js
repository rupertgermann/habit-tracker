const { randomUUID } = require('node:crypto')
const path = require('path')
const fs = require('fs')
const Database = require('better-sqlite3')
const { validateState } = require('../shared/stateValidation.mjs')
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

// Older databases receive tokens once; reads never mutate stored records.
db.transaction(() => {
  for (const table of ['habits', 'journal_entries']) {
    for (const record of listRows(table)) {
      if (!record.revision) upsertRow(table, record)
    }
  }
})()

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
  if (table === 'habits' || table === 'journal_entries') item = { ...item, revision: randomUUID() }
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

function restoreState(value) {
  const { habits, categories, journalEntries, settings } = validateState(value)
  const tx = db.transaction(() => {
    db.prepare('DELETE FROM habits').run()
    db.prepare('DELETE FROM categories').run()
    db.prepare('DELETE FROM journal_entries').run()
    db.prepare('DELETE FROM settings').run()

    const insertHabit = db.prepare('INSERT INTO habits (id, data) VALUES (?, ?)')
    for (const h of habits) insertHabit.run(h.id, JSON.stringify({ ...h, revision: randomUUID() }))

    const insertCategory = db.prepare('INSERT INTO categories (id, data) VALUES (?, ?)')
    for (const c of categories) insertCategory.run(c.id, JSON.stringify(c))

    const insertEntry = db.prepare('INSERT INTO journal_entries (id, data) VALUES (?, ?)')
    for (const e of journalEntries) insertEntry.run(e.id, JSON.stringify({ ...e, revision: randomUUID() }))

    const insertSetting = db.prepare('INSERT INTO settings (key, value) VALUES (?, ?)')
    const settingEntries = settings && typeof settings === 'object' && !Array.isArray(settings)
      ? Object.entries(settings)
      : []
    for (const [key, value] of settingEntries) {
      insertSetting.run(key, JSON.stringify(value))
    }

    return {
      ok: true,
      state: getState()
    }
  })
  return tx()
}

function writeRecord(table, item, create = false) {
  return db.transaction(() => {
    const state = getState()
    const collection = table === 'journal_entries' ? 'journalEntries' : table
    const existing = state[collection].find(record => record.id === item?.id)
    const exists = Boolean(existing)
    if (create && exists) throw Object.assign(new Error('Record already exists'), { status: 409, state })
    if (!create && !exists) throw Object.assign(new Error('Record does not exist'), { status: 404, state })
    if ((table === 'habits' || table === 'journal_entries') && !create && (!item.revision || item.revision !== existing.revision)) {
      const label = table === 'habits' ? 'Habit' : 'Journal Entry'
      throw Object.assign(new Error(`${label} changed in another tab. Reloaded the latest saved data; review your changes before trying again.`), { status: 409, state })
    }
    state[collection] = [...state[collection].filter(record => record.id !== item?.id), item]
    validateState(state)
    return upsertRow(table, item)
  })()
}

function writeSetting(key, value) {
  const state = getState()
  state.settings[key] = value
  validateState(state)
  return upsertSetting(key, value)
}

function patchSetting(key, patch) {
  if (!['profile', 'dailyReminder'].includes(key) || !patch || typeof patch !== 'object' || Array.isArray(patch)) {
    throw Object.assign(new Error('Profile or Daily Reminder field changes must be an object'), { status: 400 })
  }
  return db.transaction(() => {
    const value = { ...getSetting(key), ...patch }
    return writeSetting(key, value)
  })()
}

function deleteCategory(id) {
  return db.transaction(() => {
    if (id === 'other') throw Object.assign(new Error('The Other Category cannot be deleted'), { status: 400 })
    if (!listRows('categories').some(category => category.id === 'other')) {
      upsertRow('categories', DEFAULT_CATEGORIES.find(category => category.id === 'other'))
    }
    for (const habit of listRows('habits')) {
      if (habit.category === id) upsertRow('habits', { ...habit, category: 'other' })
    }
    deleteRow('categories', id)
    return { ok: true, state: getState() }
  })()
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
  writeRecord,
  writeSetting,
  patchSetting,
  deleteCategory,
  DB_PATH,
  db,
  getState,
  listRows,
  listSettings,
  getSetting,
  upsertRow,
  upsertSetting,
  deleteRow,
  restoreState,
  clearAll
}
