import assert from 'node:assert/strict'
import {
  createHabitLifecycle,
  createHabitPersistence,
  createInMemoryHabitPersistence
} from '/src/domain/habitLifecycle.js'

const createdAt = new Date('2026-08-09T18:30:00.000Z')

const makeHabit = (overrides = {}) => ({
  id: 'habit-1',
  name: 'Morning walk',
  category: 'health',
  createdAt: '2026-08-01T07:00:00.000Z',
  completions: [],
  ...overrides
})

const createHarness = ({
  habits: initialHabits = [],
  journalEntries: initialJournalEntries = [],
  persistence = createInMemoryHabitPersistence({
    habits: initialHabits,
    journalEntries: initialJournalEntries
  }),
  now = () => createdAt
} = {}) => {
  let habits = initialHabits
  let journalEntries = initialJournalEntries
  const lifecycle = createHabitLifecycle({
    persistence,
    getHabits: () => habits,
    replaceHabits: replacement => { habits = replacement },
    replaceDeletedState: state => {
      habits = state.habits
      journalEntries = state.journalEntries
    },
    createId: () => 'created-habit',
    now
  })

  return {
    lifecycle,
    persistence,
    getHabits: () => habits,
    getJournalEntries: () => journalEntries
  }
}

export const tests = [
  {
    name: 'Habit creation becomes visible only after persistence commits lifecycle-owned metadata',
    async run() {
      let releaseCreate
      const persistence = {
        async createHabit(habit) {
          await new Promise(resolve => { releaseCreate = resolve })
          return habit
        }
      }
      let habits = []
      const lifecycle = createHabitLifecycle({
        persistence,
        getHabits: () => habits,
        replaceHabits: replacement => { habits = replacement },
        replaceDeletedState: () => {},
        createId: () => 'habit-1',
        now: () => createdAt
      })

      const creation = lifecycle.create({
        id: 'caller-id',
        name: 'Morning walk',
        category: '',
        createdAt: 'caller-time',
        completions: [{ date: '2026-08-08' }]
      })
      await Promise.resolve()

      assert.deepEqual(habits, [])

      releaseCreate()
      const result = await creation
      const expectedHabit = {
        id: 'habit-1',
        name: 'Morning walk',
        category: 'other',
        createdAt: createdAt.toISOString(),
        completions: []
      }

      assert.deepEqual(result, {
        ok: true,
        changed: true,
        habit: expectedHabit,
        habits: [expectedHabit]
      })
      assert.deepEqual(habits, [expectedHabit])
    }
  },
  {
    name: 'Habit persistence adapts the existing create, update, and authoritative delete transport',
    async run() {
      const habit = makeHabit()
      const calls = []
      const committedState = { habits: [], journalEntries: [] }
      const persistence = createHabitPersistence({
        createHabit: async input => {
          calls.push(['create', input])
          return input
        },
        updateHabit: async input => {
          calls.push(['update', input])
          return input
        },
        deleteHabit: async id => {
          calls.push(['delete', id])
          return { ok: true, state: committedState }
        }
      })

      assert.equal(await persistence.createHabit(habit), habit)
      assert.equal(await persistence.updateHabit(habit), habit)
      assert.equal(await persistence.deleteHabit(habit.id), committedState)
      assert.deepEqual(calls, [
        ['create', habit],
        ['update', habit],
        ['delete', habit.id]
      ])
    }
  },
  {
    name: 'failed Habit creation preserves the exact committed collection',
    async run() {
      const previousHabit = makeHabit({ id: 'existing-habit' })
      const previousHabits = [previousHabit]
      const error = new Error('create failed')
      const persistence = createInMemoryHabitPersistence({ habits: previousHabits })
      persistence.failNextWrite(error)
      const harness = createHarness({ habits: previousHabits, persistence })

      const result = await harness.lifecycle.create({ name: 'Uncommitted Habit' })

      assert.equal(result.ok, false)
      assert.equal(result.changed, false)
      assert.equal(result.error, error)
      assert.equal(result.habits, previousHabits)
      assert.equal(harness.getHabits(), previousHabits)
      assert.deepEqual(persistence.getState().habits, previousHabits)
    }
  },
  {
    name: 'Habit edits commit against the latest Habit while preserving lifecycle-owned fields',
    async run() {
      const previousHabit = makeHabit({
        completions: [{ date: '2026-08-08', completedAt: '2026-08-08T07:00:00.000Z' }]
      })
      let releaseUpdate
      const persistence = {
        async updateHabit(habit) {
          await new Promise(resolve => { releaseUpdate = resolve })
          return { ...habit, committedBy: 'server' }
        }
      }
      const updatedAt = new Date('2026-08-09T19:00:00.000Z')
      const harness = createHarness({
        habits: [previousHabit],
        persistence,
        now: () => updatedAt
      })

      const update = harness.lifecycle.update(previousHabit.id, {
        id: 'caller-id',
        name: 'Evening walk',
        createdAt: 'caller-time',
        completions: [],
        updatedAt: 'caller-update-time'
      })
      await Promise.resolve()

      assert.equal(harness.getHabits()[0], previousHabit)

      releaseUpdate()
      const result = await update

      assert.equal(result.ok, true)
      assert.deepEqual(result.habit, {
        ...previousHabit,
        name: 'Evening walk',
        updatedAt: updatedAt.toISOString(),
        committedBy: 'server'
      })
      assert.equal(harness.getHabits()[0], result.habit)
    }
  },
  {
    name: 'Completion then edit for one Habit commits in caller order without losing either change',
    async run() {
      const habit = makeHabit()
      let releaseCompletion
      let updateCount = 0
      const persisted = new Map([[habit.id, habit]])
      const persistence = {
        async updateHabit(updatedHabit) {
          updateCount += 1
          if (updateCount === 1) {
            await new Promise(resolve => { releaseCompletion = resolve })
          }
          persisted.set(updatedHabit.id, updatedHabit)
          return updatedHabit
        }
      }
      const harness = createHarness({ habits: [habit], persistence })
      const completionDate = new Date('2026-08-09T19:15:00.000Z')

      const completion = harness.lifecycle.toggleYesNo({
        habitId: habit.id,
        date: completionDate
      })
      await Promise.resolve()
      const edit = harness.lifecycle.update(habit.id, { name: 'Walk outside' })
      await Promise.resolve()

      assert.equal(updateCount, 1)
      assert.deepEqual(harness.getHabits()[0].completions, [{
        date: '2026-08-09',
        completedAt: completionDate.toISOString()
      }])

      releaseCompletion()
      const [completionResult, editResult] = await Promise.all([completion, edit])

      assert.equal(completionResult.ok, true)
      assert.equal(editResult.ok, true)
      assert.equal(updateCount, 2)
      assert.equal(harness.getHabits()[0].name, 'Walk outside')
      assert.deepEqual(harness.getHabits()[0].completions, [{
        date: '2026-08-09',
        completedAt: completionDate.toISOString()
      }])
      assert.deepEqual(persisted.get(habit.id), harness.getHabits()[0])
    }
  },
  {
    name: 'failed Completion persistence restores the exact previous Habit',
    async run() {
      const habit = makeHabit()
      const error = new Error('completion failed')
      const persistence = createInMemoryHabitPersistence({ habits: [habit] })
      persistence.failNextWrite(error)
      const harness = createHarness({ habits: [habit], persistence })

      const result = await harness.lifecycle.incrementCount({
        habitId: habit.id,
        date: new Date('2026-08-09T19:30:00.000Z')
      })

      assert.equal(result.ok, false)
      assert.equal(result.error, error)
      assert.equal(result.habit, habit)
      assert.equal(harness.getHabits()[0], habit)
      assert.equal(persistence.getState().habits[0], habit)
    }
  },
  {
    name: 'an in-flight Completion settles before deletion so it cannot recreate the Habit',
    async run() {
      const habit = makeHabit()
      const committed = createInMemoryHabitPersistence({ habits: [habit] })
      let releaseCompletion
      let deleteStarted = false
      const persistence = {
        async updateHabit(updatedHabit) {
          await new Promise(resolve => { releaseCompletion = resolve })
          return committed.updateHabit(updatedHabit)
        },
        async deleteHabit(habitId) {
          deleteStarted = true
          return committed.deleteHabit(habitId)
        }
      }
      const harness = createHarness({ habits: [habit], persistence })

      const completion = harness.lifecycle.toggleYesNo({
        habitId: habit.id,
        date: new Date('2026-08-09T19:45:00.000Z')
      })
      await Promise.resolve()
      const deletion = harness.lifecycle.delete(habit.id)
      await Promise.resolve()

      assert.equal(deleteStarted, false)
      assert.equal(harness.getHabits()[0].completions.length, 1)

      releaseCompletion()
      const [completionResult, deletionResult] = await Promise.all([completion, deletion])

      assert.equal(completionResult.ok, true)
      assert.equal(deletionResult.ok, true)
      assert.equal(deleteStarted, true)
      assert.deepEqual(harness.getHabits(), [])
      assert.deepEqual(committed.getState().habits, [])
    }
  },
  {
    name: 'deletion is terminal for later queued writes and returns authoritative related state',
    async run() {
      const habit = makeHabit()
      const relatedEntry = { id: 'related', habitId: habit.id }
      const unrelatedEntry = { id: 'unrelated', habitId: 'another-habit' }
      let releaseDelete
      let updateCount = 0
      const persistence = createInMemoryHabitPersistence({
        habits: [habit],
        journalEntries: [relatedEntry, unrelatedEntry]
      })
      const delayedPersistence = {
        createHabit: input => persistence.createHabit(input),
        updateHabit: input => {
          updateCount += 1
          return persistence.updateHabit(input)
        },
        async deleteHabit(id) {
          await new Promise(resolve => { releaseDelete = resolve })
          return persistence.deleteHabit(id)
        }
      }
      const harness = createHarness({
        habits: [habit],
        journalEntries: [relatedEntry, unrelatedEntry],
        persistence: delayedPersistence
      })

      const deletion = harness.lifecycle.delete(habit.id)
      const staleEdit = harness.lifecycle.update(habit.id, { name: 'Must not return' })
      await Promise.resolve()

      assert.equal(updateCount, 0)

      releaseDelete()
      const [deleteResult, updateResult] = await Promise.all([deletion, staleEdit])

      assert.equal(deleteResult.ok, true)
      assert.deepEqual(harness.getHabits(), [])
      assert.deepEqual(harness.getJournalEntries(), [unrelatedEntry])
      assert.equal(updateResult.ok, false)
      assert.match(updateResult.error.message, /missing Habit/)
      assert.equal(updateCount, 0)
      assert.deepEqual(persistence.getState(), {
        habits: [],
        journalEntries: [unrelatedEntry]
      })
    }
  }
]
