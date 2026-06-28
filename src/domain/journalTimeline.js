import { endOfWeek, format, startOfWeek } from 'date-fns'

const DATE_KEY_FORMAT = 'yyyy-MM-dd'

const toDateKey = (date) => format(date, DATE_KEY_FORMAT)

const createLookup = (items) =>
  new Map(items.map(item => [item.id, item]))

const sortNewestFirst = (entries) =>
  [...entries].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))

const matchesSearch = (entry, habit, normalizedTerm) => {
  if (!normalizedTerm) return true

  return (
    entry.content.toLowerCase().includes(normalizedTerm) ||
    Boolean(habit?.name.toLowerCase().includes(normalizedTerm))
  )
}

const getMoodCounts = (entries, moodOptions) => {
  const counts = moodOptions.reduce((acc, mood) => {
    acc[mood.id] = 0
    return acc
  }, {})

  entries.forEach(entry => {
    if (entry.moodId && counts[entry.moodId] !== undefined) {
      counts[entry.moodId] += 1
    }
  })

  return counts
}

const getMostCommonMood = (moodCounts) =>
  Object.entries(moodCounts).reduce((max, [moodId, count]) => {
    return count > max.count ? { moodId, count } : max
  }, { moodId: null, count: 0 })

export const getJournalTimeline = ({
  journalEntries,
  habits,
  moodOptions,
  searchTerm,
  weekStart,
  weekStartsOn = 0
}) => {
  const weekOptions = { weekStartsOn: weekStartsOn === 1 ? 1 : 0 }
  const normalizedWeekStart = startOfWeek(weekStart, weekOptions)
  const weekEnd = endOfWeek(normalizedWeekStart, weekOptions)
  const startDate = toDateKey(normalizedWeekStart)
  const endDate = toDateKey(weekEnd)
  const normalizedTerm = searchTerm.trim().toLowerCase()
  const habitById = createLookup(habits)
  const moodById = createLookup(moodOptions)

  const weekEntries = journalEntries.filter(entry =>
    entry.date >= startDate && entry.date <= endDate
  )

  const entries = sortNewestFirst(
    weekEntries.filter(entry => matchesSearch(entry, habitById.get(entry.habitId), normalizedTerm))
  )

  const moodCounts = getMoodCounts(entries, moodOptions)
  const mostCommonMood = getMostCommonMood(moodCounts)

  return {
    entries: entries.map(entry => ({
      entry,
      habit: habitById.get(entry.habitId) || null,
      mood: moodById.get(entry.moodId) || null
    })),
    weekStart: normalizedWeekStart,
    weekEnd,
    stats: {
      entryCount: entries.length,
      entryCountLabel: normalizedTerm ? 'Matching Entries' : 'Entries This Week',
      avgEntriesPerDay: Math.round((entries.length / 7) * 10) / 10,
      mostCommonMood: mostCommonMood.moodId
        ? moodById.get(mostCommonMood.moodId) || null
        : null
    }
  }
}
