function createHabitDeletion({ db, getState }) {
  const deleteHabitTransaction = db.transaction((habitId) => {
    const journalRows = db.prepare('SELECT id, data FROM journal_entries').all()
    const deleteJournalEntry = db.prepare('DELETE FROM journal_entries WHERE id = ?')

    for (const row of journalRows) {
      const entry = JSON.parse(row.data)
      if (entry.habitId === habitId) deleteJournalEntry.run(row.id)
    }

    db.prepare('DELETE FROM habits WHERE id = ?').run(habitId)

    return {
      ok: true,
      deletedHabitId: habitId,
      state: getState()
    }
  })

  return habitId => deleteHabitTransaction(habitId)
}

module.exports = { createHabitDeletion }
