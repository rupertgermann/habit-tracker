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
    replaceDeletedState: habitId => {
      habits = habits.filter(habit => habit.id !== habitId)
      journalEntries = journalEntries.filter(entry => entry.habitId !== habitId)
      return { habits, journalEntries }
    },
    reconcileDeletedHabit: habitId => {
      journalEntries = journalEntries.filter(entry => entry.habitId !== habitId)
    },
    createId: () => 'created-habit',
    now
  })

  return {
    lifecycle,
    persistence,
    getHabits: () => habits,
    getJournalEntries: () => journalEntries,
    replaceJournalEntries: replacement => { journalEntries = replacement }
  }
}

export const tests = [
  {
    name: 'conflicts reconcile only the rejected Habit and never forward a draft revision',
    async run() {
      const first = makeHabit({ revision: 'old' })
      const unrelated = makeHabit({ id: 'another', revision: 'current' })
      const authoritative = { ...first, revision: 'new', completions: [{ date: '2026-08-09' }] }
      let submitted
      const persistence = {
        async updateHabit(habit) {
          submitted = habit
          throw Object.assign(new Error('conflict'), {
            status: 409,
            state: { habits: [authoritative, { ...unrelated, name: 'Old snapshot' }] }
          })
        }
      }
      const harness = createHarness({ habits: [first, unrelated], persistence })
      const result = await harness.lifecycle.update(first.id, { name: 'draft', revision: 'forged' })
      assert.equal(submitted.revision, 'old')
      assert.equal(result.ok, false)
      assert.deepEqual(harness.getHabits(), [authoritative, unrelated])
    }
  },
  {
    name: 'missing-record conflicts remove optimistic completions without replacing other Habits',
    async run() {
      const habit = makeHabit({ revision: 'old' })
      const unrelated = makeHabit({ id: 'another' })
      const persistence = {
        async updateHabit() {
          throw Object.assign(new Error('deleted'), { status: 404, state: { habits: [] } })
        }
      }
      const relatedEntry = { id: 'related', habitId: habit.id }
      const keptEntry = { id: 'kept', habitId: unrelated.id }
      const harness = createHarness({
        habits: [habit, unrelated],
        journalEntries: [relatedEntry, keptEntry],
        persistence
      })
      const result = await harness.lifecycle.toggleYesNo({ habitId: habit.id, date: createdAt })
      assert.equal(result.ok, false)
      assert.deepEqual(harness.getHabits(), [unrelated])
      assert.deepEqual(harness.getJournalEntries(), [keptEntry])
    }
  },
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
    name: 'deletion is terminal for later queued writes and removes related state',
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
  },
  {
    name: 'delayed deletion preserves newer unrelated Habit and Journal Entry writes',
    async run() {
      const deletedHabit = makeHabit()
      const keptHabit = makeHabit({ id: 'kept-habit' })
      const relatedEntry = { id: 'related', habitId: deletedHabit.id }
      const keptEntry = { id: 'kept-entry', habitId: keptHabit.id, content: 'Before deletion' }
      const persistence = createInMemoryHabitPersistence({
        habits: [deletedHabit, keptHabit],
        journalEntries: [relatedEntry, keptEntry]
      })
      let releaseDelete
      const harness = createHarness({
        habits: [deletedHabit, keptHabit],
        journalEntries: [relatedEntry, keptEntry],
        persistence: {
          ...persistence,
          async deleteHabit(habitId) {
            const snapshot = await persistence.deleteHabit(habitId)
            await new Promise(resolve => { releaseDelete = resolve })
            return snapshot
          }
        }
      })

      const deletion = harness.lifecycle.delete(deletedHabit.id)
      await Promise.resolve()
      await Promise.resolve()
      const updated = await harness.lifecycle.update(keptHabit.id, { name: 'Newer name' })
      const created = await harness.lifecycle.create({ name: 'Newer Habit' })
      const savedEntry = { ...keptEntry, content: 'Newer reflection' }
      harness.replaceJournalEntries([relatedEntry, savedEntry])

      releaseDelete()
      const result = await deletion

      assert.equal(result.ok, true)
      assert.deepEqual(harness.getHabits(), [updated.habit, created.habit])
      assert.deepEqual(harness.getJournalEntries(), [savedEntry])
      assert.equal(result.habits, harness.getHabits())
      assert.equal(result.journalEntries, harness.getJournalEntries())
      assert.deepEqual(persistence.getState().habits, harness.getHabits())
    }
  },
  {
    name: 'failed deletion preserves current collections including newer unrelated writes',
    async run() {
      const deletedHabit = makeHabit()
      const keptHabit = makeHabit({ id: 'kept-habit' })
      const relatedEntry = { id: 'related', habitId: deletedHabit.id }
      const error = new Error('Deletion failed')
      let rejectDelete
      const persistence = createInMemoryHabitPersistence({ habits: [deletedHabit, keptHabit] })
      const harness = createHarness({
        habits: [deletedHabit, keptHabit],
        journalEntries: [relatedEntry],
        persistence: {
          ...persistence,
          deleteHabit: () => new Promise((resolve, reject) => { rejectDelete = reject })
        }
      })

      const deletion = harness.lifecycle.delete(deletedHabit.id)
      await Promise.resolve()
      await harness.lifecycle.update(keptHabit.id, { name: 'Newer name' })
      const currentHabits = harness.getHabits()
      const currentEntries = [relatedEntry, { id: 'new-entry', habitId: keptHabit.id }]
      harness.replaceJournalEntries(currentEntries)
      rejectDelete(error)
      const result = await deletion

      assert.equal(result.ok, false)
      assert.equal(result.error, error)
      assert.equal(result.habits, currentHabits)
      assert.equal(harness.getHabits(), currentHabits)
      assert.equal(harness.getJournalEntries(), currentEntries)
    }
  },
  {
    name: 'completion writes reject pre-creation and future additions but allow removing old invalid logs',
    async run() {
      for (const date of [new Date('2026-07-31T12:00:00Z'), new Date('2026-08-10T12:00:00Z')]) {
        const dateKey = date.toISOString().slice(0, 10)
        for (const action of ['incrementCount', 'toggleYesNo']) {
          const habit = makeHabit()
          const harness = createHarness({ habits: [habit] })
          const result = await harness.lifecycle[action]({ habitId: habit.id, date })
          assert.equal(result.ok, false)
          assert.deepEqual(harness.persistence.getHabit(habit.id), habit)
        }
        for (const action of ['decrementCount', 'toggleYesNo']) {
          const habit = makeHabit({ completions: [{ date: dateKey }] })
          const harness = createHarness({ habits: [habit] })
          const result = await harness.lifecycle[action]({ habitId: habit.id, date })
          assert.equal(result.ok, true)
          assert.deepEqual(harness.persistence.getHabit(habit.id).completions, [])
        }
      }
      for (const date of [new Date('2026-08-01T12:00:00Z'), createdAt]) {
        const habit = makeHabit()
        const harness = createHarness({ habits: [habit] })
        const result = await harness.lifecycle.incrementCount({ habitId: habit.id, date })
        assert.equal(result.ok, true)
        assert.equal(harness.persistence.getHabit(habit.id).completions.length, 1)
      }
    }
  }
]
