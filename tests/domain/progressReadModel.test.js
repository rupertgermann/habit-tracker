import assert from 'node:assert/strict'
import { progressReadModel } from '/src/domain/progressReadModel.js'

const completion = date => ({
  date,
  completedAt: `${date}T09:00:00.000Z`
})

const makeHabit = ({
  id,
  name = id,
  createdAt,
  completions = [],
  type = 'binary'
}) => ({
  id,
  name,
  createdAt,
  completions,
  type,
  icon: 'book',
  color: '#6CC47C'
})

export const tests = [
  {
    name: 'Progress Snapshot uses one reference date and neutral Habit eligibility across every fact',
    run() {
      const referenceDate = new Date(2026, 6, 15, 12)
      const habit = makeHabit({
        id: 'midmonth-reader',
        name: 'Read a chapter',
        createdAt: '2026-07-15T08:00:00.000Z',
        completions: [
          completion('2026-07-14'),
          completion('2026-07-15')
        ]
      })

      const snapshot = progressReadModel.getSnapshot({
        habits: [habit],
        referenceDate,
        weekStartsOn: 0
      })

      assert.deepEqual(snapshot.summary, {
        totalHabits: 1,
        eligibleTodayHabits: 1,
        todayCompletedHabits: 1,
        totalCompletionRecords: 1,
        maxStreak: 1,
        completionRate: 100
      })
      assert.deepEqual(
        snapshot.weekly.map(day => ({
          date: day.date,
          eligibleHabitCount: day.eligibleHabitCount,
          completedHabitCount: day.completedHabitCount,
          missedHabitCount: day.missedHabitCount,
          isToday: day.isToday
        })),
        [
          { date: '2026-07-12', eligibleHabitCount: 0, completedHabitCount: 0, missedHabitCount: 0, isToday: false },
          { date: '2026-07-13', eligibleHabitCount: 0, completedHabitCount: 0, missedHabitCount: 0, isToday: false },
          { date: '2026-07-14', eligibleHabitCount: 0, completedHabitCount: 0, missedHabitCount: 0, isToday: false },
          { date: '2026-07-15', eligibleHabitCount: 1, completedHabitCount: 1, missedHabitCount: 0, isToday: true },
          { date: '2026-07-16', eligibleHabitCount: 0, completedHabitCount: 0, missedHabitCount: 0, isToday: false },
          { date: '2026-07-17', eligibleHabitCount: 0, completedHabitCount: 0, missedHabitCount: 0, isToday: false },
          { date: '2026-07-18', eligibleHabitCount: 0, completedHabitCount: 0, missedHabitCount: 0, isToday: false }
        ]
      )
      assert.deepEqual(
        snapshot.monthly.slice(13, 17).map(day => ({
          date: day.date,
          eligibleHabitCount: day.eligibleHabitCount,
          completedHabitCount: day.completedHabitCount,
          percentage: day.percentage,
          isToday: day.isToday
        })),
        [
          { date: '2026-07-14', eligibleHabitCount: 0, completedHabitCount: 0, percentage: null, isToday: false },
          { date: '2026-07-15', eligibleHabitCount: 1, completedHabitCount: 1, percentage: 100, isToday: true },
          { date: '2026-07-16', eligibleHabitCount: 0, completedHabitCount: 0, percentage: null, isToday: false },
          { date: '2026-07-17', eligibleHabitCount: 0, completedHabitCount: 0, percentage: null, isToday: false }
        ]
      )
      assert.equal(snapshot.monthly[0].percentage, null)
      assert.equal(snapshot.monthly.at(-1).percentage, null)
      assert.equal(snapshot.streaks[0].recentDays.at(-2).isEligible, false)
      assert.equal(snapshot.streaks[0].recentDays.at(-2).isCompleted, false)
      assert.deepEqual(
        snapshot.streaks.map(item => ({
          habitId: item.habit.id,
          currentStreak: item.currentStreak,
          today: item.recentDays.at(-1)
        })),
        [{
          habitId: 'midmonth-reader',
          currentStreak: 1,
          today: {
            date: referenceDate,
            dateStr: '2026-07-15',
            isCompleted: true,
            isEligible: true,
            isToday: true,
            day: 'Wed',
            dayName: 'Wed',
            dayNumber: '15'
          }
        }]
      )
    }
  },
  {
    name: 'Progress Snapshot summary excludes future Habits and Completion records',
    run() {
      const referenceDate = new Date(2026, 6, 15, 12)
      const currentHabit = makeHabit({
        id: 'current',
        createdAt: '2026-07-01T08:00:00.000Z',
        completions: [completion('2026-07-15')]
      })
      const futureHabit = makeHabit({
        id: 'future',
        createdAt: '2026-07-16T08:00:00.000Z',
        completions: [completion('2026-07-16')]
      })

      const snapshot = progressReadModel.getSnapshot({
        habits: [currentHabit, futureHabit],
        referenceDate
      })

      assert.deepEqual(snapshot.summary, {
        totalHabits: 2,
        eligibleTodayHabits: 1,
        todayCompletedHabits: 1,
        totalCompletionRecords: 1,
        maxStreak: 1,
        completionRate: 100
      })
    }
  },
  {
    name: 'Progress Snapshot keeps Count logs separate from completed Habit facts',
    run() {
      const referenceDate = new Date(2026, 6, 15, 12)
      const countHabit = makeHabit({
        id: 'glasses-of-water',
        name: 'Glasses of water',
        type: 'count',
        createdAt: '2026-07-01T08:00:00.000Z',
        completions: [
          completion('2026-07-15'),
          { ...completion('2026-07-15'), completedAt: '2026-07-15T11:00:00.000Z' }
        ]
      })
      const yesNoHabit = makeHabit({
        id: 'read',
        name: 'Read',
        type: 'binary',
        createdAt: '2026-07-01T08:00:00.000Z',
        completions: [completion('2026-07-15')]
      })

      const snapshot = progressReadModel.getSnapshot({
        habits: [countHabit, yesNoHabit],
        referenceDate
      })
      const today = snapshot.weekly.find(day => day.isToday)

      assert.equal(snapshot.summary.todayCompletedHabits, 2)
      assert.equal(snapshot.summary.totalCompletionRecords, 3)
      assert.equal(snapshot.summary.completionRate, 100)
      assert.equal(today.completedHabitCount, 2)
      assert.equal(today.missedHabitCount, 0)
      assert.deepEqual(today.completedHabits.map(habit => habit.name), [
        'Glasses of water',
        'Read'
      ])
      assert.equal(snapshot.monthly[14].completedHabitCount, 2)
      assert.equal(snapshot.monthly[14].percentage, 100)
    }
  },
  {
    name: 'Progress Snapshot respects Monday weeks across a leap-month boundary',
    run() {
      const referenceDate = new Date(2024, 1, 29, 23, 59, 59, 999)
      const habit = makeHabit({
        id: 'leap-reader',
        createdAt: '2024-02-27T08:00:00.000Z',
        completions: [completion('2024-02-29')]
      })

      const snapshot = progressReadModel.getSnapshot({
        habits: [habit],
        referenceDate,
        weekStartsOn: 1
      })

      assert.deepEqual(snapshot.weekly.map(day => day.date), [
        '2024-02-26',
        '2024-02-27',
        '2024-02-28',
        '2024-02-29',
        '2024-03-01',
        '2024-03-02',
        '2024-03-03'
      ])
      assert.equal(snapshot.weekly[0].eligibleHabitCount, 0)
      assert.equal(snapshot.weekly[3].completedHabitCount, 1)
      assert.equal(snapshot.weekly[3].isToday, true)
      assert.equal(snapshot.weekly[4].eligibleHabitCount, 0)
      assert.equal(snapshot.monthly.length, 29)
      assert.equal(snapshot.monthly.at(-1).date, '2024-02-29')
      assert.equal(snapshot.monthly.at(-1).percentage, 100)
    }
  },
  {
    name: 'Progress Snapshot treats a just-after-midnight reference as the new local day',
    run() {
      const referenceDate = new Date(2026, 6, 16, 0, 0, 0, 1)
      const habit = makeHabit({
        id: 'midnight-reader',
        createdAt: '2026-07-15T08:00:00.000Z',
        completions: [completion('2026-07-15')]
      })

      const snapshot = progressReadModel.getSnapshot({
        habits: [habit],
        referenceDate
      })
      const yesterday = snapshot.weekly.find(day => day.date === '2026-07-15')
      const today = snapshot.weekly.find(day => day.date === '2026-07-16')
      const tomorrow = snapshot.weekly.find(day => day.date === '2026-07-17')

      assert.equal(yesterday.completedHabitCount, 1)
      assert.equal(yesterday.isToday, false)
      assert.equal(today.completedHabitCount, 0)
      assert.equal(today.missedHabitCount, 1)
      assert.equal(today.isToday, true)
      assert.equal(tomorrow.eligibleHabitCount, 0)
      assert.equal(snapshot.monthly[15].percentage, 0)
      assert.equal(snapshot.monthly[16].percentage, null)
      assert.equal(snapshot.summary.completionRate, 0)
    }
  }
]
