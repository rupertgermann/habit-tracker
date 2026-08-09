import {
  decrementCompletionForDate,
  incrementCompletionForDate,
  toggleBinaryCompletionForDate
} from './habitTracking'

const defaultCreateId = () => globalThis.crypto?.randomUUID?.() || (
  `${Date.now()}-${Math.random().toString(36).slice(2)}`
)

const editableHabitData = habitData => {
  const {
    id: _id,
    createdAt: _createdAt,
    updatedAt: _updatedAt,
    completions: _completions,
    ...editable
  } = habitData

  return editable
}

export const createHabitPersistence = ({
  createHabit,
  updateHabit,
  deleteHabit
}) => ({
  createHabit,
  updateHabit,
  async deleteHabit(habitId) {
    const result = await deleteHabit(habitId)
    return result.state
  }
})

export const createInMemoryHabitPersistence = ({
  habits = [],
  journalEntries = []
} = {}) => {
  const committedHabits = new Map(habits.map(habit => [habit.id, habit]))
  const committedJournalEntries = new Map(
    journalEntries.map(entry => [entry.id, entry])
  )
  let nextFailure = null

  const throwNextFailure = () => {
    if (!nextFailure) return

    const error = nextFailure
    nextFailure = null
    throw error
  }

  const getState = () => ({
    habits: Array.from(committedHabits.values()),
    journalEntries: Array.from(committedJournalEntries.values())
  })

  return {
    async createHabit(habit) {
      throwNextFailure()
      committedHabits.set(habit.id, habit)
      return habit
    },
    async updateHabit(habit) {
      throwNextFailure()
      committedHabits.set(habit.id, habit)
      return habit
    },
    async deleteHabit(habitId) {
      throwNextFailure()
      committedHabits.delete(habitId)
      for (const [entryId, entry] of committedJournalEntries) {
        if (entry.habitId === habitId) {
          committedJournalEntries.delete(entryId)
        }
      }
      return getState()
    },
    getState,
    getHabit(habitId) {
      return committedHabits.get(habitId)
    },
    failNextWrite(error = new Error('Habit persistence failed')) {
      nextFailure = error
    }
  }
}

export const createHabitLifecycle = ({
  persistence,
  getHabits,
  replaceHabits,
  replaceDeletedState,
  pendingWrites = new Map(),
  createId = defaultCreateId,
  now = () => new Date()
}) => {
  const enqueue = (habitId, performWrite) => {
    const previousWrite = pendingWrites.get(habitId) || Promise.resolve()
    const operation = previousWrite.then(performWrite)
    let trackedOperation
    trackedOperation = operation
      .catch(() => {})
      .finally(() => {
        if (pendingWrites.get(habitId) === trackedOperation) {
          pendingWrites.delete(habitId)
        }
      })

    pendingWrites.set(habitId, trackedOperation)
    return operation
  }

  const performCreate = async habit => {
    const previousHabits = getHabits()

    try {
      const committedHabit = await persistence.createHabit(habit)
      const currentHabits = getHabits()
      const habits = currentHabits.some(currentHabit => currentHabit.id === committedHabit.id)
        ? currentHabits.map(currentHabit => (
            currentHabit.id === committedHabit.id ? committedHabit : currentHabit
          ))
        : [...currentHabits, committedHabit]
      replaceHabits(habits)

      return {
        ok: true,
        changed: true,
        habit: committedHabit,
        habits
      }
    } catch (error) {
      return {
        ok: false,
        changed: false,
        error,
        habits: previousHabits
      }
    }
  }

  const replaceHabitInCurrentCollection = replacement => {
    const habits = getHabits().map(habit => (
      habit.id === replacement.id ? replacement : habit
    ))
    replaceHabits(habits)
    return habits
  }

  const missingHabitResult = action => ({
    ok: false,
    changed: false,
    error: new Error(`Cannot ${action} a missing Habit`),
    habits: getHabits()
  })

  const performUpdate = async (habitId, habitData, updatedAt) => {
    const previousHabit = getHabits().find(habit => habit.id === habitId)
    if (!previousHabit) return missingHabitResult('update')

    const habit = {
      ...previousHabit,
      ...editableHabitData(habitData),
      id: previousHabit.id,
      createdAt: previousHabit.createdAt,
      completions: previousHabit.completions || [],
      updatedAt
    }

    try {
      const committedHabit = await persistence.updateHabit(habit)
      const habits = replaceHabitInCurrentCollection(committedHabit)
      return {
        ok: true,
        changed: true,
        habit: committedHabit,
        habits
      }
    } catch (error) {
      return {
        ok: false,
        changed: false,
        habit: previousHabit,
        error,
        habits: getHabits()
      }
    }
  }

  const performCompletion = async (habitId, date, updateCompletion) => {
    const previousHabit = getHabits().find(habit => habit.id === habitId)
    if (!previousHabit) return missingHabitResult('update')

    const optimisticHabit = updateCompletion(previousHabit, date)
    if (optimisticHabit === previousHabit) {
      return {
        ok: true,
        changed: false,
        habit: previousHabit,
        habits: getHabits()
      }
    }

    replaceHabitInCurrentCollection(optimisticHabit)

    try {
      const committedHabit = await persistence.updateHabit(optimisticHabit)
      const habits = replaceHabitInCurrentCollection(committedHabit)
      return {
        ok: true,
        changed: true,
        habit: committedHabit,
        habits
      }
    } catch (error) {
      const habits = replaceHabitInCurrentCollection(previousHabit)
      return {
        ok: false,
        changed: false,
        habit: previousHabit,
        error,
        habits
      }
    }
  }

  const performDelete = async habitId => {
    const previousHabit = getHabits().find(habit => habit.id === habitId)
    if (!previousHabit) {
      return {
        ok: true,
        changed: false,
        habit: null,
        habits: getHabits()
      }
    }

    try {
      const committedState = await persistence.deleteHabit(habitId)
      replaceDeletedState(committedState)
      return {
        ok: true,
        changed: true,
        habit: previousHabit,
        habits: committedState.habits,
        journalEntries: committedState.journalEntries
      }
    } catch (error) {
      return {
        ok: false,
        changed: false,
        habit: previousHabit,
        error,
        habits: getHabits()
      }
    }
  }

  return {
    create(habitData) {
      const habit = {
        id: createId(),
        ...editableHabitData(habitData),
        category: habitData.category || 'other',
        createdAt: now().toISOString(),
        completions: []
      }

      return enqueue(habit.id, () => performCreate(habit))
    },
    update(habitId, habitData) {
      const updatedAt = now().toISOString()
      return enqueue(habitId, () => performUpdate(habitId, habitData, updatedAt))
    },
    toggleYesNo({ habitId, date = new Date() }) {
      return enqueue(habitId, () => performCompletion(
        habitId,
        date,
        toggleBinaryCompletionForDate
      ))
    },
    incrementCount({ habitId, date = new Date() }) {
      return enqueue(habitId, () => performCompletion(
        habitId,
        date,
        incrementCompletionForDate
      ))
    },
    decrementCount({ habitId, date = new Date() }) {
      return enqueue(habitId, () => performCompletion(
        habitId,
        date,
        decrementCompletionForDate
      ))
    },
    delete(habitId) {
      return enqueue(habitId, () => performDelete(habitId))
    },
    async settle() {
      while (pendingWrites.size > 0) {
        await Promise.all(pendingWrites.values())
      }
    }
  }
}
