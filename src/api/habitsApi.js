const BASE = '/api'

function encodeRecordId(id) {
  // URL parsing normalizes standalone dot segments even when percent-encoded.
  if (id === '.' || id === '..') throw new Error('Record id cannot be "." or ".."')
  return encodeURIComponent(id)
}

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    const error = new Error(body.error || `API ${options.method || 'GET'} ${path} failed: ${res.status}`)
    error.status = res.status
    error.state = body.state
    throw error
  }
  if (res.status === 204) return null
  return res.json()
}

export const habitsApi = {
  getState: () => request('/state'),
  getSetting: key => request(`/settings/${encodeURIComponent(key)}`),
  saveSetting: (key, value) => request(`/settings/${encodeURIComponent(key)}`, {
    method: 'PUT',
    body: JSON.stringify({ value })
  }),
  patchSetting: (key, value) => request(`/settings/${encodeURIComponent(key)}`, {
    method: 'PATCH',
    body: JSON.stringify({ value })
  }),

  createHabit: habit => request('/habits', { method: 'POST', body: JSON.stringify(habit) }),
  updateHabit: habit => request(`/habits/${encodeRecordId(habit.id)}`, { method: 'PUT', body: JSON.stringify(habit) }),
  deleteHabit: id => request(`/habits/${encodeRecordId(id)}`, { method: 'DELETE' }),

  createCategory: category => request('/categories', { method: 'POST', body: JSON.stringify(category) }),
  updateCategory: category => request(`/categories/${encodeRecordId(category.id)}`, { method: 'PUT', body: JSON.stringify(category) }),
  deleteCategory: id => request(`/categories/${encodeRecordId(id)}`, { method: 'DELETE' }),

  createJournalEntry: entry => request('/journal', { method: 'POST', body: JSON.stringify(entry) }),
  updateJournalEntry: entry => request(`/journal/${encodeRecordId(entry.id)}`, { method: 'PUT', body: JSON.stringify(entry) }),
  deleteJournalEntry: id => request(`/journal/${encodeRecordId(id)}`, { method: 'DELETE' }),

  restore: data => request('/restore', { method: 'POST', body: JSON.stringify(data) }),
  clearAll: () => request('/data', { method: 'DELETE' })
}
