import assert from 'node:assert/strict'
import { createDashboardHabitTracking } from '/src/domain/dashboardHabitTracking.js'
import {
  createHabitLifecycle,
  createInMemoryHabitPersistence
} from '/src/domain/habitLifecycle.js'

const referenceDate = new Date('2026-07-12T12:00:00.000Z')

const makeHabit = ({
  id,
  completions = []
}) => ({
  id,
  name: id,
  type: 'binary',
  completions
})

const completion = date => ({
  date,
  completedAt: `${date}T08:00:00.000Z`
})

const createHarness = (habits, {
  persistence = createInMemoryHabitPersistence({ habits })
} = {}) => {
  let currentHabits = habits
  const lifecycle = createHabitLifecycle({
    persistence,
    getHabits: () => currentHabits,
    replaceHabits: replacement => { currentHabits = replacement },
    replaceDeletedState: state => { currentHabits = state.habits }
  })
  const dashboard = createDashboardHabitTracking({
    getHabits: () => currentHabits,
    toggleYesNoCompletion: (habitId, date) => lifecycle.toggleYesNo({ habitId, date }),
    settleCompletionWrites: () => lifecycle.settle()
  })

  return {
    dashboard,
    getHabits: () => currentHabits,
    persistence
  }
}

export const tests = [
  {
    name: 'dashboard Habit tracking projects shared today, week, summary, and Streak facts',
    run() {
      const habits = [
        makeHabit({
          id: 'daily-walk',
          completions: [
            completion('2026-07-10'),
            completion('2026-07-11'),
            completion('2026-07-12')
          ]
        }),
        makeHabit({
          id: 'read',
          completions: [completion('2026-07-06')]
        })
      ]
      const dashboard = createDashboardHabitTracking({
        getHabits: () => habits,
        toggleYesNoCompletion: async () => {
          throw new Error('not used by this projection test')
        }
      })

      const sunday = dashboard.getSnapshot({
        referenceDate,
        weekStartsOn: 0
      })
      const monday = dashboard.getSnapshot({
        referenceDate,
        weekStartsOn: 1
      })

      assert.deepEqual(sunday.todayHabits.map(habit => habit.id), ['daily-walk', 'read'])
      assert.deepEqual(sunday.todayHabits.map(habit => habit.isCompleted), [true, false])
      assert.deepEqual(sunday.todayHabits.map(habit => habit.currentStreak), [3, 0])
      assert.deepEqual(sunday.weeklyCompletionFacts.map(day => day.date), [
        '2026-07-12',
        '2026-07-13',
        '2026-07-14',
        '2026-07-15',
        '2026-07-16',
        '2026-07-17',
        '2026-07-18'
      ])
      assert.deepEqual(monday.weeklyCompletionFacts.map(day => day.date), [
        '2026-07-06',
        '2026-07-07',
        '2026-07-08',
        '2026-07-09',
        '2026-07-10',
        '2026-07-11',
        '2026-07-12'
      ])
      assert.deepEqual(
        {
          totalHabits: sunday.totalHabits,
          todayCompletedCount: sunday.todayCompletedCount,
          completionRate: sunday.completionRate,
          topCurrentStreak: sunday.topCurrentStreak
        },
        {
          totalHabits: 2,
          todayCompletedCount: 1,
          completionRate: 50,
          topCurrentStreak: 3
        }
      )
    }
  },
  {
    name: 'dashboard Yes/No Completion outcomes report committed complete and incomplete facts',
    async run() {
      const target = makeHabit({ id: 'target' })
      const alreadyComplete = makeHabit({
        id: 'already-complete',
        completions: [completion('2026-07-12')]
      })
      const remaining = makeHabit({ id: 'remaining' })
      const { dashboard, persistence } = createHarness([
        target,
        alreadyComplete,
        remaining
      ])

      const completed = await dashboard.toggleYesNo({
        habitId: target.id,
        referenceDate
      })
      const incomplete = await dashboard.toggleYesNo({
        habitId: target.id,
        referenceDate
      })

      assert.deepEqual(
        {
          ok: completed.ok,
          completionState: completed.completionState,
          completedCount: completed.completedCount,
          allComplete: completed.allComplete,
          intermediateMilestone: completed.intermediateMilestone
        },
        {
          ok: true,
          completionState: 'complete',
          completedCount: 2,
          allComplete: false,
          intermediateMilestone: false
        }
      )
      assert.deepEqual(
        {
          ok: incomplete.ok,
          completionState: incomplete.completionState,
          completedCount: incomplete.completedCount,
          allComplete: incomplete.allComplete,
          intermediateMilestone: incomplete.intermediateMilestone
        },
        {
          ok: true,
          completionState: 'incomplete',
          completedCount: 1,
          allComplete: false,
          intermediateMilestone: false
        }
      )
      assert.equal(persistence.getHabit(target.id).completions.length, 0)
    }
  },
  {
    name: 'dashboard intermediate milestones require a successful third positive Completion',
    async run() {
      const target = makeHabit({ id: 'third-completion' })
      const first = makeHabit({
        id: 'first',
        completions: [completion('2026-07-12')]
      })
      const second = makeHabit({
        id: 'second',
        completions: [completion('2026-07-12')]
      })
      const remaining = makeHabit({ id: 'remaining' })
      const { dashboard } = createHarness([target, first, second, remaining])

      const thirdCompletion = await dashboard.toggleYesNo({
        habitId: target.id,
        referenceDate
      })
      const uncompletion = await dashboard.toggleYesNo({
        habitId: target.id,
        referenceDate
      })

      assert.deepEqual(
        {
          completionState: thirdCompletion.completionState,
          completedCount: thirdCompletion.completedCount,
          allComplete: thirdCompletion.allComplete,
          intermediateMilestone: thirdCompletion.intermediateMilestone
        },
        {
          completionState: 'complete',
          completedCount: 3,
          allComplete: false,
          intermediateMilestone: true
        }
      )
      assert.deepEqual(
        {
          completionState: uncompletion.completionState,
          completedCount: uncompletion.completedCount,
          allComplete: uncompletion.allComplete,
          intermediateMilestone: uncompletion.intermediateMilestone
        },
        {
          completionState: 'incomplete',
          completedCount: 2,
          allComplete: false,
          intermediateMilestone: false
        }
      )
    }
  },
  {
    name: 'dashboard all-complete outcomes take precedence over intermediate milestones',
    async run() {
      const target = makeHabit({ id: 'final-completion' })
      const first = makeHabit({
        id: 'first',
        completions: [completion('2026-07-12')]
      })
      const second = makeHabit({
        id: 'second',
        completions: [completion('2026-07-12')]
      })
      const { dashboard } = createHarness([target, first, second])

      const result = await dashboard.toggleYesNo({
        habitId: target.id,
        referenceDate
      })

      assert.deepEqual(
        {
          completionState: result.completionState,
          completedCount: result.completedCount,
          allComplete: result.allComplete,
          intermediateMilestone: result.intermediateMilestone
        },
        {
          completionState: 'complete',
          completedCount: 3,
          allComplete: true,
          intermediateMilestone: false
        }
      )
    }
  },
  {
    name: 'dashboard milestone outcomes exclude another Habit update that later fails',
    async run() {
      let rejectPendingUpdate
      let markCommittedUpdateStarted
      const committedUpdateStarted = new Promise(resolve => {
        markCommittedUpdateStarted = resolve
      })
      const persistence = {
        async updateHabit(habit) {
          if (habit.id === 'pending-failure') {
            return new Promise((resolve, reject) => {
              rejectPendingUpdate = reject
            })
          }

          markCommittedUpdateStarted()
          return habit
        }
      }
      const { dashboard } = createHarness([
        makeHabit({ id: 'committed-success' }),
        makeHabit({ id: 'pending-failure' })
      ], { persistence })

      const pendingFailure = dashboard.toggleYesNo({
        habitId: 'pending-failure',
        referenceDate
      })
      const committedSuccess = dashboard.toggleYesNo({
        habitId: 'committed-success',
        referenceDate
      })

      await committedUpdateStarted
      await new Promise(resolve => setTimeout(resolve, 0))
      rejectPendingUpdate(new Error('forced pending update failure'))

      const [failedResult, committedResult] = await Promise.all([
        pendingFailure,
        committedSuccess
      ])

      assert.equal(failedResult.ok, false)
      assert.deepEqual(
        {
          ok: committedResult.ok,
          completionState: committedResult.completionState,
          completedCount: committedResult.completedCount,
          allComplete: committedResult.allComplete,
          intermediateMilestone: committedResult.intermediateMilestone
        },
        {
          ok: true,
          completionState: 'complete',
          completedCount: 1,
          allComplete: false,
          intermediateMilestone: false
        }
      )
    }
  },
  {
    name: 'dashboard Completion failure returns only after exact Habit rollback',
    async run() {
      const habit = makeHabit({ id: 'rollback' })
      const error = new Error('database unavailable')
      const { dashboard, getHabits, persistence } = createHarness([habit])
      persistence.failNextWrite(error)

      const result = await dashboard.toggleYesNo({
        habitId: habit.id,
        referenceDate
      })

      assert.equal(result.ok, false)
      assert.equal(result.error, error)
      assert.equal(result.habit, habit)
      assert.equal(getHabits()[0], habit)
      assert.equal(persistence.getHabit(habit.id), habit)
      assert.equal('completionState' in result, false)
      assert.equal('intermediateMilestone' in result, false)
    }
  }
]
