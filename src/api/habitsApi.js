const BASE = '/api'

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options
  })
  if (!res.ok) {
    throw new Error(`API ${options.method || 'GET'} ${path} failed: ${res.status}`)
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

  createHabit: habit => request('/habits', { method: 'POST', body: JSON.stringify(habit) }),
  updateHabit: habit => request(`/habits/${habit.id}`, { method: 'PUT', body: JSON.stringify(habit) }),
  deleteHabit: id => request(`/habits/${id}`, { method: 'DELETE' }),

  createCategory: category => request('/categories', { method: 'POST', body: JSON.stringify(category) }),
  updateCategory: category => request(`/categories/${category.id}`, { method: 'PUT', body: JSON.stringify(category) }),
  deleteCategory: id => request(`/categories/${id}`, { method: 'DELETE' }),

  createJournalEntry: entry => request('/journal', { method: 'POST', body: JSON.stringify(entry) }),
  updateJournalEntry: entry => request(`/journal/${entry.id}`, { method: 'PUT', body: JSON.stringify(entry) }),
  deleteJournalEntry: id => request(`/journal/${id}`, { method: 'DELETE' }),

  restore: data => request('/restore', { method: 'POST', body: JSON.stringify(data) }),
  clearAll: () => request('/data', { method: 'DELETE' })
}
