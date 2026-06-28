import {
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  endOfYear,
  format,
  isToday,
  parseISO,
  startOfDay,
  startOfMonth,
  startOfWeek,
  startOfYear,
  subDays
} from 'date-fns'

const DATE_KEY_FORMAT = 'yyyy-MM-dd'

const emptyRangeStats = {
  totalCount: 0,
  daysWithEntry: 0,
  daysWithoutEntry: 0,
  daysElapsed: 0,
  percentDaysSaid: 0,
  percentDaysMissed: 0,
  avgPerActiveDay: 0,
  bestCount: 0,
  bestDate: null
}

export const toDateKey = (date = new Date()) => format(date, DATE_KEY_FORMAT)

export const getCompletions = (habit) =>
  Array.isArray(habit?.completions) ? habit.completions : []

export const getCountForDate = (habit, dateStr) =>
  getCompletions(habit).filter(completion => completion.date === dateStr).length

export const isCompletedOnDate = (habit, dateStr) =>
  getCountForDate(habit, dateStr) > 0

export const toggleBinaryCompletionForDate = (habit, date = new Date()) => {
  if (!habit) return null

  const dateStr = toDateKey(date)
  const completions = getCompletions(habit)

  if (isCompletedOnDate(habit, dateStr)) {
    return {
      ...habit,
      completions: completions.filter(completion => completion.date !== dateStr)
    }
  }

  return {
    ...habit,
    completions: [...completions, { date: dateStr, completedAt: date.toISOString() }]
  }
}

export const incrementCompletionForDate = (habit, date = new Date()) => {
  if (!habit) return null

  return {
    ...habit,
    completions: [
      ...getCompletions(habit),
      { date: toDateKey(date), completedAt: date.toISOString() }
    ]
  }
}

export const decrementCompletionForDate = (habit, date = new Date()) => {
  if (!habit) return null

  const dateStr = toDateKey(date)
  const completions = [...getCompletions(habit)]
  let removeIndex = -1

  for (let index = completions.length - 1; index >= 0; index -= 1) {
    if (completions[index].date === dateStr) {
      removeIndex = index
      break
    }
  }

  if (removeIndex === -1) return habit

  completions.splice(removeIndex, 1)
  return { ...habit, completions }
}

export const getDailyCountsForRange = (habit, start, end) => {
  const days = eachDayOfInterval({ start: startOfDay(start), end: startOfDay(end) })

  return days.map(day => {
    const date = toDateKey(day)
    return { date, day, count: getCountForDate(habit, date) }
  })
}

const getWeekOptions = (weekStartsOn = 0) => ({
  weekStartsOn: weekStartsOn === 1 ? 1 : 0
})

const getPeriodRange = (range, refDate = new Date(), weekStartsOn = 0) => {
  if (range === 'week') {
    const weekOptions = getWeekOptions(weekStartsOn)

    return {
      periodStart: startOfWeek(refDate, weekOptions),
      periodEnd: endOfWeek(refDate, weekOptions)
    }
  }

  if (range === 'year') {
    return {
      periodStart: startOfYear(refDate),
      periodEnd: endOfYear(refDate)
    }
  }

  return {
    periodStart: startOfMonth(refDate),
    periodEnd: endOfMonth(refDate)
  }
}

export const getHabitRangeStats = (habit, range, refDate = new Date(), asOfDate = new Date(), weekStartsOn = 0) => {
  if (!habit) return emptyRangeStats

  const { periodStart, periodEnd } = getPeriodRange(range, refDate, weekStartsOn)
  const today = startOfDay(asOfDate)
  const createdAt = habit.createdAt ? startOfDay(parseISO(habit.createdAt)) : periodStart
  const windowStart = createdAt > periodStart ? createdAt : periodStart
  const windowEnd = today < periodEnd ? today : periodEnd

  if (windowEnd < windowStart) return emptyRangeStats

  const days = getDailyCountsForRange(habit, windowStart, windowEnd)
  const totalCount = days.reduce((sum, day) => sum + day.count, 0)
  const daysWithEntry = days.filter(day => day.count > 0).length
  const daysElapsed = days.length
  const daysWithoutEntry = daysElapsed - daysWithEntry
  const best = days.reduce((acc, day) => (day.count > acc.count ? day : acc), { count: 0, date: null })
  const percentDaysSaid = daysElapsed > 0 ? Math.round((daysWithEntry / daysElapsed) * 100) : 0

  return {
    totalCount,
    daysWithEntry,
    daysWithoutEntry,
    daysElapsed,
    percentDaysSaid,
    percentDaysMissed: daysElapsed > 0 ? 100 - percentDaysSaid : 0,
    avgPerActiveDay: daysWithEntry > 0 ? Math.round((totalCount / daysWithEntry) * 10) / 10 : 0,
    bestCount: best.count,
    bestDate: best.date
  }
}

export const getHabitStreak = (habit, refDate = new Date()) => {
  const completionSet = new Set(getCompletions(habit).map(completion => completion.date))
  let streak = 0
  let cursor = startOfDay(refDate)

  while (completionSet.has(toDateKey(cursor))) {
    streak += 1
    cursor = subDays(cursor, 1)
  }

  return streak
}

export const getRecentActivityDays = (habit, numberOfDays = 30, refDate = new Date()) => {
  const days = []

  for (let index = numberOfDays - 1; index >= 0; index -= 1) {
    const date = subDays(refDate, index)
    const dateStr = toDateKey(date)

    days.push({
      date,
      dateStr,
      isCompleted: isCompletedOnDate(habit, dateStr),
      isToday: isToday(date),
      day: format(date, 'EEE'),
      dayName: format(date, 'EEE'),
      dayNumber: format(date, 'd')
    })
  }

  return days
}

export const getTodayHabits = (habits, refDate = new Date()) => {
  const today = toDateKey(refDate)

  return habits.map(habit => ({
    ...habit,
    isCompleted: isCompletedOnDate(habit, today)
  }))
}

export const getWeeklyCompletionData = (habits, refDate = new Date(), weekStartsOn = 0) => {
  const weekOptions = getWeekOptions(weekStartsOn)
  const weekStart = startOfWeek(refDate, weekOptions)
  const weekEnd = endOfWeek(refDate, weekOptions)
  const daysOfWeek = eachDayOfInterval({ start: weekStart, end: weekEnd })

  return daysOfWeek.map(day => {
    const date = toDateKey(day)
    const completed = habits.filter(habit => isCompletedOnDate(habit, date)).length

    return {
      day: format(day, 'EEE'),
      date,
      completed,
      missed: habits.length - completed,
      isToday: isToday(day)
    }
  })
}

export const getMonthlyCompletionData = (habits, refDate = new Date()) => {
  const monthStart = startOfMonth(refDate)
  const monthEnd = endOfMonth(refDate)

  return eachDayOfInterval({ start: monthStart, end: monthEnd }).map(day => {
    const date = toDateKey(day)
    const completions = habits.filter(habit => isCompletedOnDate(habit, date)).length

    return {
      date,
      day: Number(format(day, 'd')),
      completions,
      percentage: habits.length > 0 ? (completions / habits.length) * 100 : 0
    }
  })
}

export const getTrackingStats = (habits, refDate = new Date()) => {
  const today = toDateKey(refDate)
  const todayCompletions = habits.filter(habit => isCompletedOnDate(habit, today)).length
  const totalCompletions = habits.reduce((total, habit) => total + getCompletions(habit).length, 0)
  const currentStreaks = habits.map(habit => getHabitStreak(habit, refDate))
  const maxStreak = Math.max(...currentStreaks, 0)
  const completionRate = habits.length > 0
    ? (todayCompletions / habits.length) * 100
    : 0

  return {
    totalHabits: habits.length,
    todayCompletions,
    totalCompletions,
    maxStreak,
    completionRate: Math.round(completionRate)
  }
}
