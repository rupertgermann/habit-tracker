import defaultCategories from '../../shared/defaultCategories.json'

export const BACKUP_FORMAT_VERSION = 2
export const LEGACY_BACKUP_VERSION = '1.0.0'

export const LEGACY_DEFAULT_CATEGORIES = defaultCategories

const emptyState = () => ({
  habits: [],
  categories: [],
  journalEntries: [],
  settings: {}
})

const cloneJson = value => JSON.parse(JSON.stringify(value))
const isObject = value => value !== null && typeof value === 'object' && !Array.isArray(value)
const hasOwn = (value, key) => Object.prototype.hasOwnProperty.call(value, key)

const backupError = (code, message, cause) => {
  const error = new Error(message, cause ? { cause } : undefined)
  error.code = code
  return error
}

const requireRecordCollection = (collection, name) => {
  if (!Array.isArray(collection)) {
    throw backupError('invalid-backup', `${name} must be an array`)
  }

  const identities = new Set()
  for (const record of collection) {
    if (!isObject(record) || typeof record.id !== 'string' || !record.id.trim()) {
      throw backupError('invalid-backup', `Every ${name} record must have a non-empty string id`)
    }
    if (identities.has(record.id)) {
      throw backupError('invalid-backup', `${name} contains duplicate id "${record.id}"`)
    }
    identities.add(record.id)
  }
}

const validateState = value => {
  if (!isObject(value)) {
    throw backupError('invalid-backup', 'Backup state must be an object')
  }

  requireRecordCollection(value.habits, 'Habits')
  requireRecordCollection(value.categories, 'Categories')
  requireRecordCollection(value.journalEntries, 'Journal Entries')

  for (const habit of value.habits) {
    if (!Array.isArray(habit.completions)) {
      throw backupError('invalid-backup', `Habit "${habit.id}" Completions must be an array`)
    }

    for (const completion of habit.completions) {
      if (!isObject(completion) || typeof completion.date !== 'string' || !completion.date.trim()) {
        throw backupError('invalid-backup', `Habit "${habit.id}" contains an invalid Completion`)
      }
      if (hasOwn(completion, 'completedAt') && typeof completion.completedAt !== 'string') {
        throw backupError('invalid-backup', `Habit "${habit.id}" contains an invalid Completion timestamp`)
      }
    }
  }

  const habitIds = new Set(value.habits.map(habit => habit.id))
  for (const entry of value.journalEntries) {
    if (typeof entry.habitId !== 'string' || !habitIds.has(entry.habitId)) {
      throw backupError(
        'invalid-backup',
        `Journal Entry "${entry.id}" must be associated with an included Habit`
      )
    }
  }

  if (!isObject(value.settings)) {
    throw backupError('invalid-backup', 'Settings must be an object')
  }

  return cloneJson(value)
}

const validateCanonicalDocument = document => {
  if (document.formatVersion !== BACKUP_FORMAT_VERSION) {
    if (Number.isInteger(document.formatVersion) && document.formatVersion > BACKUP_FORMAT_VERSION) {
      throw backupError(
        'unsupported-version',
        `Backup format version ${document.formatVersion} is not supported`
      )
    }
    throw backupError('unsupported-version', `Backup format version ${String(document.formatVersion)} is not supported`)
  }

  if (!isObject(document.metadata) ||
      typeof document.metadata.createdAt !== 'string' ||
      Number.isNaN(Date.parse(document.metadata.createdAt))) {
    throw backupError('invalid-backup', 'Backup creation metadata is invalid')
  }

  return {
    ok: true,
    sourceVersion: BACKUP_FORMAT_VERSION,
    state: validateState(document.state)
  }
}

const migrateLegacyDocument = document => {
  if (document.version !== LEGACY_BACKUP_VERSION) {
    throw backupError(
      'unsupported-version',
      `Backup version ${String(document.version)} is not supported`
    )
  }

  const state = {
    habits: document.habits,
    categories: hasOwn(document, 'categories')
      ? document.categories
      : LEGACY_DEFAULT_CATEGORIES,
    journalEntries: hasOwn(document, 'journalEntries')
      ? document.journalEntries
      : [],
    settings: hasOwn(document, 'settings')
      ? document.settings
      : {}
  }

  return {
    ok: true,
    sourceVersion: LEGACY_BACKUP_VERSION,
    state: validateState(state)
  }
}

const prepareRestore = serialized => {
  let document
  try {
    document = JSON.parse(serialized)
  } catch (cause) {
    return {
      ok: false,
      error: backupError('malformed-json', 'Backup file is not valid JSON', cause)
    }
  }

  if (!isObject(document)) {
    return {
      ok: false,
      error: backupError('invalid-backup', 'Backup document must be an object')
    }
  }

  try {
    if (hasOwn(document, 'formatVersion')) {
      return validateCanonicalDocument(document)
    }
    if (hasOwn(document, 'version')) {
      return migrateLegacyDocument(document)
    }
    throw backupError('invalid-backup', 'Backup document does not declare a supported version')
  } catch (error) {
    return { ok: false, error }
  }
}

export const createBackupPersistence = ({ readState, restoreState }) => ({
  readState,
  restoreState
})

export const createInMemoryBackupPersistence = ({ state } = {}) => {
  let persistedState = cloneJson(state || emptyState())
  let nextReadError = null
  let nextRestoreError = null

  return {
    async readState() {
      if (nextReadError) {
        const error = nextReadError
        nextReadError = null
        throw error
      }
      return cloneJson(persistedState)
    },
    async restoreState(nextState) {
      if (nextRestoreError) {
        const error = nextRestoreError
        nextRestoreError = null
        throw error
      }
      persistedState = cloneJson(nextState)
      return cloneJson(persistedState)
    },
    failNextRead(error = new Error('forced state read failure')) {
      nextReadError = error
    },
    failNextRestore(error = new Error('forced restore failure')) {
      nextRestoreError = error
    },
    getState() {
      return cloneJson(persistedState)
    }
  }
}

export const createBackupModule = ({
  persistence,
  clock = () => new Date()
}) => ({
  async createSnapshot() {
    try {
      const createdAt = clock().toISOString()
      const state = validateState(await persistence.readState())
      const document = {
        formatVersion: BACKUP_FORMAT_VERSION,
        metadata: {
          createdAt
        },
        state
      }

      return {
        ok: true,
        document,
        serialized: `${JSON.stringify(document, null, 2)}\n`,
        filename: `habit-tracker-backup-${createdAt.slice(0, 10)}.json`
      }
    } catch (error) {
      return { ok: false, error }
    }
  },

  prepareRestore,

  async restore(prepared) {
    if (!prepared?.ok) {
      return prepared
    }

    try {
      const state = validateState(await persistence.restoreState(prepared.state))
      return {
        ok: true,
        sourceVersion: prepared.sourceVersion,
        state
      }
    } catch (error) {
      return {
        ok: false,
        sourceVersion: prepared.sourceVersion,
        error
      }
    }
  }
})
