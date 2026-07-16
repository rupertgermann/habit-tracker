export const createJournalEntryPersistence = ({
  createJournalEntry,
  updateJournalEntry,
  deleteJournalEntry
}) => ({
  createJournalEntry,
  updateJournalEntry,
  deleteJournalEntry
})

export const createInMemoryJournalEntryPersistence = ({ journalEntries = [] } = {}) => {
  const committedEntries = new Map(journalEntries.map(entry => [entry.id, entry]))
  let nextFailure = null

  return {
    async createJournalEntry(entry) {
      if (nextFailure) {
        const error = nextFailure
        nextFailure = null
        throw error
      }

      committedEntries.set(entry.id, entry)
      return entry
    },
    async updateJournalEntry(entry) {
      if (nextFailure) {
        const error = nextFailure
        nextFailure = null
        throw error
      }

      committedEntries.set(entry.id, entry)
      return entry
    },
    async deleteJournalEntry(id) {
      if (nextFailure) {
        const error = nextFailure
        nextFailure = null
        throw error
      }

      committedEntries.delete(id)
    },
    getJournalEntries() {
      return Array.from(committedEntries.values())
    },
    failNextWrite(error = new Error('Journal Entry persistence failed')) {
      nextFailure = error
    }
  }
}

export const createJournalEntryWriter = ({
  persistence,
  getJournalEntries,
  replaceJournalEntries,
  pendingWrites = new Map(),
  createId = () => Date.now().toString(),
  now = () => new Date()
}) => {
  const enqueue = (id, performWrite) => {
    const previousWrite = pendingWrites.get(id) || Promise.resolve()
    const operation = previousWrite.then(performWrite)
    let trackedOperation
    trackedOperation = operation
      .catch(() => {})
      .finally(() => {
        if (pendingWrites.get(id) === trackedOperation) {
          pendingWrites.delete(id)
        }
      })

    pendingWrites.set(id, trackedOperation)
    return operation
  }

  const performCreate = async (entry) => {
    const previousJournalEntries = getJournalEntries()

    try {
      const committedEntry = await persistence.createJournalEntry(entry)
      const journalEntries = [...previousJournalEntries, committedEntry]
      replaceJournalEntries(journalEntries)

      return {
        ok: true,
        changed: true,
        entry: committedEntry,
        journalEntries
      }
    } catch (error) {
      replaceJournalEntries(previousJournalEntries)
      return {
        ok: false,
        changed: false,
        error,
        journalEntries: previousJournalEntries
      }
    }
  }

  const performUpdate = async (id, entryData, updatedAt) => {
    const previousJournalEntries = getJournalEntries()
    const previousEntry = previousJournalEntries.find(entry => entry.id === id)
    if (!previousEntry) {
      return {
        ok: false,
        changed: false,
        error: new Error('Cannot update a missing Journal Entry'),
        journalEntries: previousJournalEntries
      }
    }

    const entry = {
      ...previousEntry,
      ...entryData,
      updatedAt
    }

    try {
      const committedEntry = await persistence.updateJournalEntry(entry)
      const journalEntries = previousJournalEntries.map(currentEntry => (
        currentEntry.id === id ? committedEntry : currentEntry
      ))
      replaceJournalEntries(journalEntries)

      return {
        ok: true,
        changed: true,
        entry: committedEntry,
        journalEntries
      }
    } catch (error) {
      replaceJournalEntries(previousJournalEntries)
      return {
        ok: false,
        changed: false,
        entry: previousEntry,
        error,
        journalEntries: previousJournalEntries
      }
    }
  }

  const performDelete = async (id) => {
    const previousJournalEntries = getJournalEntries()
    const previousEntry = previousJournalEntries.find(entry => entry.id === id)
    if (!previousEntry) {
      return {
        ok: true,
        changed: false,
        entry: null,
        journalEntries: previousJournalEntries
      }
    }

    try {
      await persistence.deleteJournalEntry(id)
      const journalEntries = previousJournalEntries.filter(entry => entry.id !== id)
      replaceJournalEntries(journalEntries)

      return {
        ok: true,
        changed: true,
        entry: previousEntry,
        journalEntries
      }
    } catch (error) {
      replaceJournalEntries(previousJournalEntries)
      return {
        ok: false,
        changed: false,
        entry: previousEntry,
        error,
        journalEntries: previousJournalEntries
      }
    }
  }

  return {
    create(entryData) {
      const entry = {
        id: createId(),
        ...entryData,
        createdAt: now().toISOString()
      }
      return enqueue(entry.id, () => performCreate(entry))
    },
    update(id, entryData) {
      const updatedAt = now().toISOString()
      return enqueue(id, () => performUpdate(id, entryData, updatedAt))
    },
    delete(id) {
      return enqueue(id, () => performDelete(id))
    }
  }
}
