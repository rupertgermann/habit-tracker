import {
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  parseISO,
  startOfMonth,
  startOfWeek
} from 'date-fns'
import {
  getCompletions,
  getHabitStreak,
  getRecentActivityDays,
  isCompletedOnDate,
  isHabitEligibleOnDate,
  toDateKey
} from './habitTracking'

const getWeekOptions = weekStartsOn => ({
  weekStartsOn: weekStartsOn === 1 ? 1 : 0
})

const projectHabitIdentity = habit => ({
  id: habit.id,
  name: habit.name,
  icon: habit.icon,
  color: habit.color
})

const getDayFacts = (habits, day, referenceDate) => {
  const date = toDateKey(day)
  const eligibleHabits = habits.filter(habit =>
    isHabitEligibleOnDate(habit, day, referenceDate)
  )
  const completedHabits = eligibleHabits.filter(habit =>
    isCompletedOnDate(habit, date)
  )
  const missedHabits = eligibleHabits.filter(habit =>
    !isCompletedOnDate(habit, date)
  )

  return {
    date,
    eligibleHabitCount: eligibleHabits.length,
    completedHabitCount: completedHabits.length,
    missedHabitCount: missedHabits.length,
    completedHabits: completedHabits.map(projectHabitIdentity),
    missedHabits: missedHabits.map(projectHabitIdentity),
    isToday: date === toDateKey(referenceDate)
  }
}

const getSummary = ({ habits, referenceDate, streaks, todayFacts }) => {
  return {
    totalHabits: habits.length,
    eligibleTodayHabits: todayFacts.eligibleHabitCount,
    todayCompletedHabits: todayFacts.completedHabitCount,
    totalCompletionRecords: habits.reduce(
      (total, habit) => total + getCompletions(habit).filter(completion =>
        isHabitEligibleOnDate(habit, parseISO(completion.date), referenceDate)
      ).length,
      0
    ),
    maxStreak: Math.max(...streaks.map(item => item.currentStreak), 0),
    completionRate: todayFacts.eligibleHabitCount > 0
      ? Math.round(
        (todayFacts.completedHabitCount / todayFacts.eligibleHabitCount) * 100
      )
      : 0
  }
}

const getSnapshot = ({
  habits = [],
  referenceDate = new Date(),
  weekStartsOn = 0
} = {}) => {
  const weekOptions = getWeekOptions(weekStartsOn)
  const streaks = habits.map(habit => ({
    habit,
    currentStreak: getHabitStreak(habit, referenceDate),
    recentDays: getRecentActivityDays(habit, 14, referenceDate)
  }))
  const todayFacts = getDayFacts(habits, referenceDate, referenceDate)
  const weekly = eachDayOfInterval({
    start: startOfWeek(referenceDate, weekOptions),
    end: endOfWeek(referenceDate, weekOptions)
  }).map(day => ({
    day: format(day, 'EEE'),
    ...getDayFacts(habits, day, referenceDate)
  }))
  const monthly = eachDayOfInterval({
    start: startOfMonth(referenceDate),
    end: endOfMonth(referenceDate)
  }).map(day => {
    const facts = getDayFacts(habits, day, referenceDate)

    return {
      date: facts.date,
      day: Number(format(day, 'd')),
      eligibleHabitCount: facts.eligibleHabitCount,
      completedHabitCount: facts.completedHabitCount,
      percentage: facts.eligibleHabitCount > 0
        ? Math.round(
          (facts.completedHabitCount / facts.eligibleHabitCount) * 100
        )
        : null,
      completedHabits: facts.completedHabits,
      missedHabits: facts.missedHabits,
      isToday: facts.isToday
    }
  })

  return {
    summary: getSummary({ habits, referenceDate, streaks, todayFacts }),
    streaks,
    weekly,
    monthly
  }
}

export const progressReadModel = {
  getSnapshot
}
