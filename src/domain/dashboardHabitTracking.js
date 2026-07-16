import {
  getHabitStreak,
  getTodayHabits,
  getTrackingStats,
  getWeeklyCompletionData
} from './habitTracking'

const getDashboardSnapshot = ({
  habits,
  referenceDate,
  weekStartsOn
}) => {
  const stats = getTrackingStats(habits, referenceDate)

  return {
    todayHabits: getTodayHabits(habits, referenceDate).map(habit => ({
      ...habit,
      currentStreak: getHabitStreak(habit, referenceDate)
    })),
    weeklyCompletionFacts: getWeeklyCompletionData(habits, referenceDate, weekStartsOn),
    totalHabits: stats.totalHabits,
    todayCompletedCount: stats.todayCompletions,
    completionRate: stats.completionRate,
    topCurrentStreak: stats.maxStreak
  }
}

export const createDashboardHabitTracking = ({
  getHabits,
  toggleYesNoCompletion
}) => {
  const getSnapshot = ({
    referenceDate = new Date(),
    weekStartsOn = 0
  } = {}) => getDashboardSnapshot({
    habits: getHabits(),
    referenceDate,
    weekStartsOn
  })

  const toggleYesNo = async ({
    habitId,
    referenceDate = new Date()
  }) => {
    const result = await toggleYesNoCompletion(habitId, referenceDate)
    if (!result.ok) return result

    const currentHabits = getHabits()
    const includesUpdatedHabit = currentHabits.some(habit => habit.id === result.habit.id)
    const resultingHabits = includesUpdatedHabit
      ? currentHabits.map(habit => habit.id === result.habit.id ? result.habit : habit)
      : [...currentHabits, result.habit]
    const snapshot = getDashboardSnapshot({
      habits: resultingHabits,
      referenceDate,
      weekStartsOn: 0
    })
    const updatedHabit = snapshot.todayHabits.find(habit => habit.id === result.habit.id)
    const completionState = updatedHabit?.isCompleted ? 'complete' : 'incomplete'
    const allComplete = snapshot.totalHabits > 0 &&
      snapshot.todayCompletedCount === snapshot.totalHabits

    return {
      ...result,
      completionState,
      completedCount: snapshot.todayCompletedCount,
      allComplete,
      intermediateMilestone: completionState === 'complete' &&
        snapshot.todayCompletedCount > 0 &&
        snapshot.todayCompletedCount % 3 === 0 &&
        !allComplete
    }
  }

  return {
    getSnapshot,
    toggleYesNo
  }
}
