import { format } from 'date-fns'

const DATE_KEY_FORMAT = 'yyyy-MM-dd'

const toDateKey = (date) => format(date, DATE_KEY_FORMAT)

export const getJournalComposerState = ({
  habits,
  journalEntries,
  draft,
  today = new Date()
}) => {
  const todayKey = toDateKey(today)
  const habitOptions = [...habits]
    .sort((a, b) => a.name.localeCompare(b.name))
    .map(habit => ({ value: habit.id, label: habit.name }))

  const habit = habits.find(candidate => candidate.id === draft.habitId) || null
  const content = (draft.content || '').trim()
  const date = draft.date || ''
  const isFutureDate = Boolean(date) && date > todayKey
  const existingEntry = habit && date
    ? journalEntries.find(entry => entry.habitId === habit.id && entry.date === date) || null
    : null

  const notice = habitOptions.length === 0
    ? 'Add a habit before writing a journal entry.'
    : existingEntry
      ? `${habit.name} already has an entry for this date. Saving will update it.`
      : null

  return {
    habitOptions,
    defaultDate: todayKey,
    maxDate: todayKey,
    existingEntry,
    mode: existingEntry ? 'update' : 'create',
    notice,
    dateError: isFutureDate ? 'Journal entries cannot be dated in the future.' : null,
    canSave: Boolean(habit) && Boolean(date) && !isFutureDate && content.length > 0,
    entryData: {
      habitId: draft.habitId,
      date,
      content,
      moodId: draft.moodId || null
    }
  }
}
