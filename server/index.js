const express = require('express')
const cors = require('cors')
const store = require('./db')

const app = express()
const HOST = process.env.HOST || '127.0.0.1'
const PORT = process.env.PORT || 3001

app.use(cors())
app.use(express.json({ limit: '5mb' }))

const asyncWrap = handler => (req, res) => {
  try {
    handler(req, res)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: err.message })
  }
}

// Full app state (habits, categories, journal entries)
app.get('/api/state', asyncWrap((req, res) => {
  res.json(store.getState())
}))

// Habits
app.post('/api/habits', asyncWrap((req, res) => {
  res.status(201).json(store.upsertRow('habits', req.body))
}))

app.put('/api/habits/:id', asyncWrap((req, res) => {
  res.json(store.upsertRow('habits', { ...req.body, id: req.params.id }))
}))

app.delete('/api/habits/:id', asyncWrap((req, res) => {
  store.deleteJournalEntriesForHabit(req.params.id)
  store.deleteRow('habits', req.params.id)
  res.status(204).end()
}))

// Categories
app.post('/api/categories', asyncWrap((req, res) => {
  res.status(201).json(store.upsertRow('categories', req.body))
}))

app.put('/api/categories/:id', asyncWrap((req, res) => {
  res.json(store.upsertRow('categories', { ...req.body, id: req.params.id }))
}))

app.delete('/api/categories/:id', asyncWrap((req, res) => {
  store.deleteRow('categories', req.params.id)
  res.status(204).end()
}))

// Journal entries
app.post('/api/journal', asyncWrap((req, res) => {
  res.status(201).json(store.upsertRow('journal_entries', req.body))
}))

app.put('/api/journal/:id', asyncWrap((req, res) => {
  res.json(store.upsertRow('journal_entries', { ...req.body, id: req.params.id }))
}))

app.delete('/api/journal/:id', asyncWrap((req, res) => {
  store.deleteRow('journal_entries', req.params.id)
  res.status(204).end()
}))

// Restore from a backup file and wipe-all
app.post('/api/restore', asyncWrap((req, res) => {
  store.replaceAll(req.body || {})
  res.json(store.getState())
}))

app.delete('/api/data', asyncWrap((req, res) => {
  store.clearAll()
  res.json(store.getState())
}))

app.listen(PORT, HOST, () => {
  console.log(`Habit Tracker API listening on http://${HOST}:${PORT}`)
})
