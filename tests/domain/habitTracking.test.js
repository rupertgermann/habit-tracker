import assert from 'node:assert/strict'
import {
  decrementCompletionForDate,
  getCalendarPeriod,
  getCountForDate,
  getHabitById,
  getHabitRangeStats,
  getHabitStreak,
  getTrackingStats,
  getWeeklyCompletionData,
  incrementCompletionForDate,
  isCompletedOnDate,
  toggleBinaryCompletionForDate
} from '/src/domain/habitTracking.js'

const refDate = new Date('2026-06-28T12:00:00.000Z')

const createCountHabit = () => ({
  id: 'love-you',
  name: 'Say love you',
  type: 'count',
  createdAt: '2026-06-26T08:00:00.000Z',
  completions: [
    { date: '2026-06-26', completedAt: '2026-06-26T09:00:00.000Z' },
    { date: '2026-06-28', completedAt: '2026-06-28T09:00:00.000Z' },
    { date: '2026-06-28', completedAt: '2026-06-28T11:00:00.000Z' }
  ]
})

export const tests = [
  {
    name: 'count habits keep multiple completions for the same day',
    run() {
      const habit = createCountHabit()

      assert.equal(getCountForDate(habit, '2026-06-28'), 2)
      assert.equal(isCompletedOnDate(habit, '2026-06-28'), true)

      const incremented = incrementCompletionForDate(habit, new Date('2026-06-28T15:00:00.000Z'))
      assert.equal(getCountForDate(incremented, '2026-06-28'), 3)

      const decremented = decrementCompletionForDate(incremented, new Date('2026-06-28T18:00:00.000Z'))
      assert.equal(getCountForDate(decremented, '2026-06-28'), 2)
    }
  },
  {
    name: 'range stats report said and missed day percentages',
    run() {
      const stats = getHabitRangeStats(createCountHabit(), 'month', refDate, refDate)

      assert.equal(stats.daysElapsed, 3)
      assert.equal(stats.daysWithEntry, 2)
      assert.equal(stats.daysWithoutEntry, 1)
      assert.equal(stats.percentDaysSaid, 67)
      assert.equal(stats.percentDaysMissed, 33)
      assert.equal(stats.totalCount, 3)
      assert.equal(stats.bestCount, 2)
      assert.equal(stats.avgPerActiveDay, 1.5)
    }
  },
  {
    name: 'weekly completion data counts one completed habit per day',
    run() {
      const [sunday] = getWeeklyCompletionData([createCountHabit()], refDate)

      assert.equal(sunday.date, '2026-06-28')
      assert.equal(sunday.completed, 1)
      assert.equal(sunday.missed, 0)
    }
  },
  {
    name: 'weekly completion data can start on Monday',
    run() {
      const weekData = getWeeklyCompletionData([
        {
          id: 'monday-first',
          completions: [
            { date: '2026-06-22', completedAt: '2026-06-22T08:00:00.000Z' },
            { date: '2026-06-28', completedAt: '2026-06-28T08:00:00.000Z' }
          ]
        }
      ], refDate, 1)

      assert.equal(weekData[0].day, 'Mon')
      assert.equal(weekData[0].date, '2026-06-22')
      assert.equal(weekData[0].completed, 1)
      assert.equal(weekData[6].day, 'Sun')
      assert.equal(weekData[6].date, '2026-06-28')
      assert.equal(weekData[6].completed, 1)
    }
  },
  {
    name: 'tracking stats count logs separately from completed habits',
    run() {
      const stats = getTrackingStats([createCountHabit()], refDate)

      assert.equal(stats.totalHabits, 1)
      assert.equal(stats.todayCompletions, 1)
      assert.equal(stats.totalCompletions, 3)
      assert.equal(stats.completionRate, 100)
    }
  },
  {
    name: 'binary toggles remove the date rather than duplicating it',
    run() {
      const habit = {
        id: 'binary',
        type: 'binary',
        completions: [{ date: '2026-06-28', completedAt: '2026-06-28T08:00:00.000Z' }]
      }

      const toggledOff = toggleBinaryCompletionForDate(habit, refDate)
      assert.equal(getCountForDate(toggledOff, '2026-06-28'), 0)

      const toggledOn = toggleBinaryCompletionForDate(toggledOff, refDate)
      assert.equal(getCountForDate(toggledOn, '2026-06-28'), 1)
    }
  },
  {
    name: 'date-targeted mutations affect only the requested past date',
    run() {
      const habit = {
        id: 'history',
        type: 'binary',
        completions: [{ date: '2026-06-28', completedAt: '2026-06-28T08:00:00.000Z' }]
      }
      const pastDate = new Date('2026-06-24T10:00:00.000Z')

      const toggledOn = toggleBinaryCompletionForDate(habit, pastDate)
      assert.equal(getCountForDate(toggledOn, '2026-06-24'), 1)
      assert.equal(getCountForDate(toggledOn, '2026-06-28'), 1)

      const incremented = incrementCompletionForDate(toggledOn, pastDate)
      assert.equal(getCountForDate(incremented, '2026-06-24'), 2)

      const decremented = decrementCompletionForDate(incremented, pastDate)
      assert.equal(getCountForDate(decremented, '2026-06-24'), 1)

      const toggledOff = toggleBinaryCompletionForDate(decremented, pastDate)
      assert.equal(getCountForDate(toggledOff, '2026-06-24'), 0)
      assert.equal(getCountForDate(toggledOff, '2026-06-28'), 1)
    }
  },
  {
    name: 'streaks require consecutive active days',
    run() {
      const habit = {
        id: 'streak',
        completions: [
          { date: '2026-06-25', completedAt: '2026-06-25T08:00:00.000Z' },
          { date: '2026-06-27', completedAt: '2026-06-27T08:00:00.000Z' },
          { date: '2026-06-28', completedAt: '2026-06-28T08:00:00.000Z' }
        ]
      }

      assert.equal(getHabitStreak(habit, refDate), 2)
    }
  },
  {
    name: 'habit reads ignore legacy persisted streak fields',
    run() {
      const habit = {
        id: 'legacy-streak',
        streak: 99,
        longestStreak: 999,
        completions: [
          { date: '2026-06-28', completedAt: '2026-06-28T08:00:00.000Z' }
        ]
      }

      assert.equal(getHabitById([habit], habit.id), habit)
      assert.equal(getHabitStreak(habit, refDate), 1)
    }
  },
  {
    name: 'week Calendar Periods respect week start and expose Completion facts',
    run() {
      const habit = createCountHabit()
      const sundayWeek = getCalendarPeriod(habit, 'week', refDate, refDate, 0)
      const mondayWeek = getCalendarPeriod(habit, 'week', refDate, refDate, 1)

      assert.equal(sundayWeek.headerLabel, 'Jun 28 - Jul 4, 2026')
      assert.deepEqual(sundayWeek.dayHeaders, ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'])
      assert.equal(sundayWeek.days[0].dateKey, '2026-06-28')
      assert.equal(sundayWeek.days[0].count, 2)
      assert.equal(sundayWeek.days[0].isCompleted, true)
      assert.equal(sundayWeek.days[0].isToday, true)

      assert.deepEqual(mondayWeek.dayHeaders, ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'])
      assert.equal(mondayWeek.days[0].dateKey, '2026-06-22')
      assert.equal(mondayWeek.days[6].dateKey, '2026-06-28')
      assert.equal(mondayWeek.days[6].count, 2)
    }
  },
  {
    name: 'month Calendar Periods pad leap months into complete weeks',
    run() {
      const leapDate = new Date('2024-02-15T12:00:00.000Z')
      const period = getCalendarPeriod(null, 'month', leapDate, leapDate, 1)

      assert.equal(period.headerLabel, 'February 2024')
      assert.equal(period.month.days.length, 29)
      assert.equal(period.month.leadingCellCount, 3)
      assert.equal(period.month.trailingCellCount, 3)
      assert.equal(period.cells.length, 35)
      assert.equal(period.cells[0].placement, 'leading')
      assert.equal(period.cells.at(-1).placement, 'trailing')
      assert.equal(period.stats.daysElapsed, 0)
    }
  },
  {
    name: 'Yes/No Calendar Periods expose binary facts for completed and empty dates',
    run() {
      const habit = {
        id: 'binary-calendar',
        type: 'binary',
        createdAt: '2026-06-01T08:00:00.000Z',
        completions: [{ date: '2026-06-14', completedAt: '2026-06-14T08:00:00.000Z' }]
      }
      const period = getCalendarPeriod(habit, 'month', refDate, refDate)
      const completedDay = period.days.find(day => day.dateKey === '2026-06-14')
      const emptyDay = period.days.find(day => day.dateKey === '2026-06-15')

      assert.deepEqual(
        { count: completedDay.count, isCompleted: completedDay.isCompleted },
        { count: 1, isCompleted: true }
      )
      assert.deepEqual(
        { count: emptyDay.count, isCompleted: emptyDay.isCompleted },
        { count: 0, isCompleted: false }
      )
    }
  },
  {
    name: 'Calendar Period summaries share created-date and future-date semantics',
    run() {
      const habit = createCountHabit()
      const period = getCalendarPeriod(habit, 'month', refDate, refDate)
      const directStats = getHabitRangeStats(habit, 'month', refDate, refDate)

      assert.deepEqual(period.stats, directStats)
      assert.equal(period.stats.daysElapsed, 3)
      assert.equal(period.stats.totalCount, 3)
      assert.equal(period.stats.bestDate, '2026-06-28')
      assert.equal(period.previousReferenceDate.getMonth(), 4)
      assert.equal(period.nextReferenceDate.getMonth(), 6)
    }
  },
  {
    name: 'year Calendar Periods expose twelve padded months and year navigation',
    run() {
      const yearDate = new Date('2026-12-15T12:00:00.000Z')
      const period = getCalendarPeriod(createCountHabit(), 'year', yearDate, yearDate)

      assert.equal(period.headerLabel, '2026')
      assert.equal(period.months.length, 12)
      assert.equal(period.months[0].longLabel, 'January 2026')
      assert.equal(period.months[11].longLabel, 'December 2026')
      assert.equal(period.months.every(month => month.cells.length % 7 === 0), true)
      assert.equal(period.previousReferenceDate.getFullYear(), 2025)
      assert.equal(period.nextReferenceDate.getFullYear(), 2027)
    }
  }
]
