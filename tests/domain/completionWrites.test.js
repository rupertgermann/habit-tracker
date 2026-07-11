import assert from 'node:assert/strict'
import {
  createCountCompletionWriter,
  createInMemoryCompletionPersistence,
  createYesNoCompletionWriter
} from '/src/domain/completionWrites.js'

const date = new Date('2026-07-11T08:30:00.000Z')

const makeHabit = () => ({
  id: 'morning-walk',
  name: 'Morning walk',
  type: 'yesno',
  completions: [{ date: '2026-07-10', completedAt: '2026-07-10T08:00:00.000Z' }]
})

export const tests = [
  {
    name: 'Yes/No Completion writes optimistically and persists through the injected adapter',
    async run() {
      const habit = makeHabit()
      const persistence = createInMemoryCompletionPersistence({ habits: [habit] })
      const replacements = []
      const writer = createYesNoCompletionWriter({
        persistence,
        replaceHabit: replacement => replacements.push(replacement)
      })

      const result = await writer.toggle({ habit, date })

      assert.equal(result.ok, true)
      assert.equal(replacements.length, 1)
      assert.equal(replacements[0], result.habit)
      assert.deepEqual(result.habit.completions, [
        ...habit.completions,
        { date: '2026-07-11', completedAt: date.toISOString() }
      ])
      assert.equal(persistence.getHabit(habit.id), result.habit)
    }
  },
  {
    name: 'failed Yes/No Completion persistence restores the exact previous Habit',
    async run() {
      const habit = makeHabit()
      const error = new Error('database unavailable')
      const persistence = createInMemoryCompletionPersistence({ habits: [habit] })
      persistence.failNextUpdate(error)
      const replacements = []
      const failures = []
      const writer = createYesNoCompletionWriter({
        persistence,
        replaceHabit: replacement => replacements.push(replacement),
        onFailure: (...failure) => failures.push(failure)
      })

      const result = await writer.toggle({ habit, date })

      assert.equal(result.ok, false)
      assert.equal(result.error, error)
      assert.equal(result.habit, habit)
      assert.equal(replacements.length, 2)
      assert.notEqual(replacements[0], habit)
      assert.equal(replacements[1], habit)
      assert.deepEqual(failures, [[error, habit]])
      assert.equal(persistence.getHabit(habit.id), habit)
    }
  },
  {
    name: 'repeated Yes/No Completion writes persist complete and incomplete states',
    async run() {
      const habit = makeHabit()
      const persistence = createInMemoryCompletionPersistence({ habits: [habit] })
      let currentHabit = habit
      const writer = createYesNoCompletionWriter({
        persistence,
        replaceHabit: replacement => { currentHabit = replacement }
      })

      const completed = await writer.toggle({ habit: currentHabit, date })
      const incomplete = await writer.toggle({ habit: currentHabit, date })

      assert.equal(completed.ok, true)
      assert.equal(incomplete.ok, true)
      assert.deepEqual(currentHabit.completions, habit.completions)
      assert.equal(persistence.getHabit(habit.id), currentHabit)
      assert.equal(persistence.getUpdateCount(), 2)
    }
  },
  {
    name: 'missing Habits return failure without replacing or persisting state',
    async run() {
      const persistence = createInMemoryCompletionPersistence()
      const replacements = []
      const writer = createYesNoCompletionWriter({
        persistence,
        replaceHabit: replacement => replacements.push(replacement)
      })

      const result = await writer.toggle({ habit: null, date })

      assert.equal(result.ok, false)
      assert.match(result.error.message, /missing Habit/)
      assert.deepEqual(replacements, [])
    }
  },
  {
    name: 'Count Completion writes preserve multiple daily occurrences',
    async run() {
      const habit = { ...makeHabit(), type: 'count', completions: [] }
      const persistence = createInMemoryCompletionPersistence({ habits: [habit] })
      let currentHabit = habit
      const writer = createCountCompletionWriter({
        persistence,
        replaceHabit: replacement => { currentHabit = replacement }
      })

      const first = await writer.increment({ habit: currentHabit, date })
      const secondDate = new Date('2026-07-11T09:15:00.000Z')
      const second = await writer.increment({ habit: currentHabit, date: secondDate })

      assert.equal(first.ok, true)
      assert.equal(second.ok, true)
      assert.deepEqual(currentHabit.completions, [
        { date: '2026-07-11', completedAt: date.toISOString() },
        { date: '2026-07-11', completedAt: secondDate.toISOString() }
      ])
      assert.equal(persistence.getHabit(habit.id), currentHabit)
      assert.equal(persistence.getUpdateCount(), 2)
    }
  },
  {
    name: 'overlapping Count Completion writes serialize against the latest Habit state',
    async run() {
      const habit = { ...makeHabit(), type: 'count', completions: [] }
      let currentHabit = habit
      let persistedHabit = habit
      let releaseFirstWrite
      let updateCount = 0
      const persistence = {
        async updateHabit(updatedHabit) {
          updateCount += 1
          if (updateCount === 1) {
            await new Promise(resolve => { releaseFirstWrite = resolve })
          }
          persistedHabit = updatedHabit
          return updatedHabit
        }
      }
      const writer = createCountCompletionWriter({
        persistence,
        getHabit: () => currentHabit,
        replaceHabit: replacement => { currentHabit = replacement }
      })

      const first = writer.increment({ habitId: habit.id, date })
      const secondDate = new Date('2026-07-11T09:15:00.000Z')
      const second = writer.increment({ habitId: habit.id, date: secondDate })
      await Promise.resolve()

      assert.equal(updateCount, 1)
      assert.equal(currentHabit.completions.length, 1)

      releaseFirstWrite()
      const results = await Promise.all([first, second])

      assert.deepEqual(results.map(result => result.ok), [true, true])
      assert.equal(updateCount, 2)
      assert.deepEqual(currentHabit.completions, [
        { date: '2026-07-11', completedAt: date.toISOString() },
        { date: '2026-07-11', completedAt: secondDate.toISOString() }
      ])
      assert.equal(persistedHabit, currentHabit)
    }
  },
  {
    name: 'a failed queued Count write rolls back before the next write begins',
    async run() {
      const habit = { ...makeHabit(), type: 'count', completions: [] }
      let currentHabit = habit
      let persistedHabit = habit
      let rejectFirstWrite
      let updateCount = 0
      const persistence = {
        async updateHabit(updatedHabit) {
          updateCount += 1
          if (updateCount === 1) {
            await new Promise((resolve, reject) => { rejectFirstWrite = reject })
          }
          persistedHabit = updatedHabit
          return updatedHabit
        }
      }
      const writer = createCountCompletionWriter({
        persistence,
        getHabit: () => currentHabit,
        replaceHabit: replacement => { currentHabit = replacement }
      })

      const first = writer.increment({ habitId: habit.id, date })
      const secondDate = new Date('2026-07-11T09:15:00.000Z')
      const second = writer.increment({ habitId: habit.id, date: secondDate })
      await Promise.resolve()

      rejectFirstWrite(new Error('first write failed'))
      const results = await Promise.all([first, second])

      assert.deepEqual(results.map(result => result.ok), [false, true])
      assert.equal(updateCount, 2)
      assert.deepEqual(currentHabit.completions, [
        { date: '2026-07-11', completedAt: secondDate.toISOString() }
      ])
      assert.equal(persistedHabit, currentHabit)
    }
  },
  {
    name: 'Count Completion decrement removes the last matching occurrence only',
    async run() {
      const firstToday = { date: '2026-07-11', completedAt: '2026-07-11T07:00:00.000Z' }
      const yesterday = { date: '2026-07-10', completedAt: '2026-07-10T12:00:00.000Z' }
      const lastToday = { date: '2026-07-11', completedAt: '2026-07-11T09:00:00.000Z' }
      const habit = {
        ...makeHabit(),
        type: 'count',
        completions: [firstToday, yesterday, lastToday]
      }
      const persistence = createInMemoryCompletionPersistence({ habits: [habit] })
      let currentHabit = habit
      const writer = createCountCompletionWriter({
        persistence,
        replaceHabit: replacement => { currentHabit = replacement }
      })

      const result = await writer.decrement({ habit, date })

      assert.equal(result.ok, true)
      assert.equal(result.changed, true)
      assert.deepEqual(currentHabit.completions, [firstToday, yesterday])
      assert.equal(persistence.getHabit(habit.id), currentHabit)
    }
  },
  {
    name: 'Count Completion decrement at zero is a no-op without persistence',
    async run() {
      const habit = { ...makeHabit(), type: 'count' }
      const persistence = createInMemoryCompletionPersistence({ habits: [habit] })
      const replacements = []
      const writer = createCountCompletionWriter({
        persistence,
        replaceHabit: replacement => replacements.push(replacement)
      })

      const result = await writer.decrement({ habit, date })

      assert.deepEqual(result, { ok: true, habit, changed: false })
      assert.deepEqual(replacements, [])
      assert.equal(persistence.getUpdateCount(), 0)
    }
  },
  {
    name: 'failed Count Completion increment restores the exact previous Habit',
    async run() {
      const habit = { ...makeHabit(), type: 'count' }
      const error = new Error('database unavailable')
      const persistence = createInMemoryCompletionPersistence({ habits: [habit] })
      persistence.failNextUpdate(error)
      const replacements = []
      const writer = createCountCompletionWriter({
        persistence,
        replaceHabit: replacement => replacements.push(replacement)
      })

      const result = await writer.increment({ habit, date })

      assert.equal(result.ok, false)
      assert.equal(result.error, error)
      assert.equal(result.habit, habit)
      assert.equal(result.changed, false)
      assert.equal(replacements.length, 2)
      assert.notEqual(replacements[0], habit)
      assert.equal(replacements[1], habit)
      assert.equal(persistence.getHabit(habit.id), habit)
    }
  },
  {
    name: 'failed Count Completion decrement restores the exact previous Habit',
    async run() {
      const todayCompletion = { date: '2026-07-11', completedAt: '2026-07-11T07:00:00.000Z' }
      const habit = { ...makeHabit(), type: 'count', completions: [todayCompletion] }
      const error = new Error('database unavailable')
      const persistence = createInMemoryCompletionPersistence({ habits: [habit] })
      persistence.failNextUpdate(error)
      const replacements = []
      const writer = createCountCompletionWriter({
        persistence,
        replaceHabit: replacement => replacements.push(replacement)
      })

      const result = await writer.decrement({ habit, date })

      assert.equal(result.ok, false)
      assert.equal(result.error, error)
      assert.equal(result.habit, habit)
      assert.equal(replacements.length, 2)
      assert.notEqual(replacements[0], habit)
      assert.equal(replacements[1], habit)
      assert.equal(persistence.getHabit(habit.id), habit)
    }
  }
]
