const isObject = value => value !== null && typeof value === 'object' && !Array.isArray(value)
const nonempty = value => typeof value === 'string' && value.trim().length > 0
const dateKey = value => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(value)) && new Date(value).toISOString().slice(0, 10) === value
const timestamp = value => typeof value === 'string' && !Number.isNaN(Date.parse(value))
const requireValue = (valid, message) => {
  if (valid) return
  const error = new Error(message)
  error.code = 'invalid-backup'
  error.status = 400
  throw error
}
const optional = (record, key, predicate) => {
  if (Object.hasOwn(record, key)) requireValue(predicate(record[key]), `${key} is invalid`)
}

export const validateState = value => {
  requireValue(isObject(value), 'Backup state must be an object')
  for (const collection of ['habits', 'categories', 'journalEntries']) {
    requireValue(Array.isArray(value[collection]), `${collection} must be an array`)
    const ids = new Set()
    for (const record of value[collection]) {
      requireValue(isObject(record) && nonempty(record.id), `${collection} records require a non-empty string id`)
      requireValue(!ids.has(record.id), `${collection} contains duplicate id "${record.id}"`)
      ids.add(record.id)
      for (const key of ['createdAt', 'updatedAt']) optional(record, key, timestamp)
    }
  }
  const categoryIds = new Set(value.categories.map(category => category.id))
  for (const category of value.categories) {
    requireValue(nonempty(category.name), 'Category name is required')
    for (const key of ['icon', 'color']) optional(category, key, nonempty)
  }
  for (const habit of value.habits) {
    requireValue(nonempty(habit.name), 'Habit name is required')
    optional(habit, 'category', category => nonempty(category) && categoryIds.has(category))
    for (const key of ['description', 'icon', 'color', 'frequency']) optional(habit, key, value => typeof value === 'string')
    optional(habit, 'type', value => value === 'binary' || value === 'count')
    optional(habit, 'dailyTarget', value => value === null || (Number.isFinite(value) && value > 0))
    optional(habit, 'daysPerWeek', value => Number.isInteger(value) && value >= 1 && value <= 7)
    optional(habit, 'selectedDays', value => Array.isArray(value) && value.length === 7 && value.every(day => typeof day === 'boolean'))
    optional(habit, 'reminders', value => Array.isArray(value) && value.every(time => typeof time === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(time)))
    requireValue(Array.isArray(habit.completions), 'Habit Completions must be an array')
    for (const completion of habit.completions) {
      requireValue(isObject(completion) && dateKey(completion.date), 'Completion date is invalid')
      optional(completion, 'completedAt', timestamp)
    }
  }
  const habitIds = new Set(value.habits.map(habit => habit.id))
  for (const entry of value.journalEntries) {
    requireValue(nonempty(entry.habitId) && habitIds.has(entry.habitId), 'Journal Entry must reference an included Habit')
    requireValue(dateKey(entry.date), 'Journal Entry date is invalid')
    requireValue(timestamp(entry.createdAt), 'Journal Entry creation timestamp is required')
    requireValue(typeof entry.content === 'string', 'Journal Entry content must be text')
    optional(entry, 'moodId', value => value === null || typeof value === 'string')
  }
  requireValue(isObject(value.settings), 'Settings must be an object')
  for (const key of ['theme', 'design']) optional(value.settings, key, nonempty)
  for (const key of ['profile', 'preferences', 'dailyReminder']) optional(value.settings, key, isObject)
  if (value.settings.profile) {
    for (const key of ['name', 'email', 'avatarImage']) optional(value.settings.profile, key, value => value === null || typeof value === 'string')
  }
  if (value.settings.preferences) optional(value.settings.preferences, 'weekStartsOn', value => value === 0 || value === 1)
  if (value.settings.dailyReminder) {
    optional(value.settings.dailyReminder, 'enabled', value => typeof value === 'boolean')
    optional(value.settings.dailyReminder, 'time', value => typeof value === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(value))
  }
  return JSON.parse(JSON.stringify(value))
}
