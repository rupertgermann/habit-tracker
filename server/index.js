const path = require('path')
const express = require('express')
const store = require('./db')
const { createHabitDeletion } = require('./habitDeletion')
const { MAX_BACKUP_BYTES, BACKUP_SIZE_ERROR_MESSAGE } = require('../shared/backupLimits.mjs')

const app = express()
const deleteHabit = createHabitDeletion({ db: store.db, getState: store.getState })
const HOST = process.env.HOST || '127.0.0.1'
const PORT = process.env.PORT || 3301
const E2E_DB_DIR = path.join(process.cwd(), '.tmp', 'e2e')
const isE2ERuntime = process.env.HABIT_TRACKER_E2E === 'true' &&
  path.resolve(store.DB_PATH).startsWith(`${path.resolve(E2E_DB_DIR)}${path.sep}`)

const trustedOrigins = new Set(process.env.HABIT_TRACKER_ORIGIN
  ? [process.env.HABIT_TRACKER_ORIGIN]
  : ['http://localhost:3300', 'http://127.0.0.1:3300', 'http://localhost:4173', 'http://127.0.0.1:4173'])

app.use((req, res, next) => {
  const origin = req.headers.origin
  if ((origin !== undefined && !trustedOrigins.has(origin)) ||
      (origin === undefined && req.headers['sec-fetch-site'] === 'cross-site')) {
    return res.status(403).json({ error: 'Browser origin is not allowed' })
  }
  next()
})
app.post('/api/restore', express.json({ limit: MAX_BACKUP_BYTES }), (err, req, res, next) => {
  if (err.status === 413) {
    return res.status(413).json({ error: BACKUP_SIZE_ERROR_MESSAGE, code: 'backup-too-large' })
  }
  next(err)
})
app.use(express.json({ limit: '5mb' }))
app.use((err, req, res, next) => {
  res.status(err.status || 400).json({ error: err.message })
})

const asyncWrap = handler => (req, res) => {
  try {
    handler(req, res)
  } catch (err) {
    if (!err.status) console.error(err)
    res.status(err.status || 500).json({ error: err.message, ...(err.state ? { state: err.state } : {}) })
  }
}

// Full app state (habits, categories, journal entries)
app.get('/api/state', asyncWrap((req, res) => {
  res.json(store.getState())
}))

app.get('/api/runtime', asyncWrap((req, res) => {
  res.json({ e2e: isE2ERuntime })
}))

// Settings
app.get('/api/settings/:key', asyncWrap((req, res) => {
  res.json({
    key: req.params.key,
    value: store.getSetting(req.params.key, null)
  })
}))

app.put('/api/settings/:key', asyncWrap((req, res) => {
  if (!req.body || !Object.hasOwn(req.body, 'value')) {
    return res.status(400).json({ error: 'Setting value is required' })
  }
  const value = req.body.value

  res.json({
    key: req.params.key,
    value: store.writeSetting(req.params.key, value)
  })
}))

app.patch('/api/settings/:key', asyncWrap((req, res) => {
  res.json({
    key: req.params.key,
    value: store.patchSetting(req.params.key, req.body?.value)
  })
}))

// Habits
app.post('/api/habits', asyncWrap((req, res) => {
  res.status(201).json(store.writeRecord('habits', req.body, true))
}))

app.put('/api/habits/:id', asyncWrap((req, res) => {
  res.json(store.writeRecord('habits', { ...req.body, id: req.params.id }))
}))

app.delete('/api/habits/:id', asyncWrap((req, res) => {
  res.json(deleteHabit(req.params.id))
}))

// Categories
app.post('/api/categories', asyncWrap((req, res) => {
  res.status(201).json(store.writeRecord('categories', req.body, true))
}))

app.put('/api/categories/:id', asyncWrap((req, res) => {
  res.json(store.writeRecord('categories', { ...req.body, id: req.params.id }))
}))

app.delete('/api/categories/:id', asyncWrap((req, res) => {
  res.json(store.deleteCategory(req.params.id))
}))

// Journal entries
app.post('/api/journal', asyncWrap((req, res) => {
  res.status(201).json(store.writeRecord('journal_entries', req.body, true))
}))

app.put('/api/journal/:id', asyncWrap((req, res) => {
  res.json(store.writeRecord('journal_entries', { ...req.body, id: req.params.id }))
}))

app.delete('/api/journal/:id', asyncWrap((req, res) => {
  store.deleteRow('journal_entries', req.params.id)
  res.status(204).end()
}))

// Restore from a backup file and wipe-all
app.post('/api/restore', asyncWrap((req, res) => {
  res.json(store.restoreState(req.body || {}))
}))

app.delete('/api/data', asyncWrap((req, res) => {
  store.clearAll()
  res.json(store.getState())
}))

module.exports = app

if (require.main === module) app.listen(PORT, HOST, () => {
  console.log(`Habit Tracker API listening on http://${HOST}:${PORT}`)
})
