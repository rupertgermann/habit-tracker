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

const createCompletionWriter = ({ persistence, replaceHabit, onFailure = () => {}, update }) => ({
  async write({ habit, date = new Date() }) {
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
})

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
  const incrementWriter = createCompletionWriter({
    ...dependencies,
    update: incrementCompletionForDate
  })
  const decrementWriter = createCompletionWriter({
    ...dependencies,
    update: decrementCompletionForDate
  })

  return {
    increment: input => incrementWriter.write(input),
    decrement: input => decrementWriter.write(input)
  }
}
