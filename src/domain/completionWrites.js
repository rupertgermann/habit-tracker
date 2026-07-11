import {
  decrementCompletionForDate,
  incrementCompletionForDate,
  toggleBinaryCompletionForDate
} from './habitTracking'

export const createCompletionPersistence = ({ updateHabit }) => ({
  updateHabit
})

export const createInMemoryCompletionPersistence = ({ habits = [] } = {}) => {
  const persistedHabits = new Map(habits.map(habit => [habit.id, habit]))
  let nextFailure = null
  let updateCount = 0

  return {
    async updateHabit(habit) {
      updateCount += 1
      if (nextFailure) {
        const error = nextFailure
        nextFailure = null
        throw error
      }

      persistedHabits.set(habit.id, habit)
      return habit
    },
    getHabit(id) {
      return persistedHabits.get(id)
    },
    getUpdateCount() {
      return updateCount
    },
    failNextUpdate(error = new Error('Completion persistence failed')) {
      nextFailure = error
    }
  }
}

const createCompletionWriter = ({
  persistence,
  replaceHabit,
  getHabit,
  pendingWrites = new Map(),
  onFailure = () => {},
  update
}) => {
  const performWrite = async ({ habit: providedHabit, habitId, date = new Date() }) => {
    const resolvedHabitId = habitId || providedHabit?.id
    const habit = getHabit && resolvedHabitId
      ? getHabit(resolvedHabitId)
      : providedHabit

    if (!habit) {
      return {
        ok: false,
        error: new Error('Cannot update a missing Habit')
      }
    }

    const previousHabit = habit
    const updatedHabit = update(previousHabit, date)

    if (updatedHabit === previousHabit) {
      return { ok: true, habit: previousHabit, changed: false }
    }

    replaceHabit(updatedHabit)

    try {
      await persistence.updateHabit(updatedHabit)
      return { ok: true, habit: updatedHabit, changed: true }
    } catch (error) {
      replaceHabit(previousHabit)
      onFailure(error, previousHabit)
      return { ok: false, habit: previousHabit, changed: false, error }
    }
  }

  return {
    write(input) {
      const habitId = input.habitId || input.habit?.id
      if (!habitId) return performWrite(input)

      const previousWrite = pendingWrites.get(habitId) || Promise.resolve()
      const operation = previousWrite.then(() => performWrite(input))
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
  }
}

export const createYesNoCompletionWriter = (dependencies) => {
  const writer = createCompletionWriter({
    ...dependencies,
    update: toggleBinaryCompletionForDate
  })

  return {
    toggle: input => writer.write(input)
  }
}

export const createCountCompletionWriter = (dependencies) => {
  const pendingWrites = dependencies.pendingWrites || new Map()
  const incrementWriter = createCompletionWriter({
    ...dependencies,
    pendingWrites,
    update: incrementCompletionForDate
  })
  const decrementWriter = createCompletionWriter({
    ...dependencies,
    pendingWrites,
    update: decrementCompletionForDate
  })

  return {
    increment: input => incrementWriter.write(input),
    decrement: input => decrementWriter.write(input)
  }
}
