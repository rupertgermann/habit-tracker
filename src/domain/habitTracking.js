import {
  addMonths,
  addWeeks,
  addYears,
  eachDayOfInterval,
  eachMonthOfInterval,
  endOfMonth,
  endOfWeek,
  endOfYear,
  format,
  parseISO,
  startOfDay,
  startOfMonth,
  startOfWeek,
  startOfYear,
  subDays,
  subMonths,
  subWeeks,
  subYears
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

export const getHabitById = (habits, id) =>
  habits.find(habit => habit.id === id)

export const getCountForDate = (habit, dateStr) =>
  getCompletions(habit).filter(completion => completion.date === dateStr).length

export const isCompletedOnDate = (habit, dateStr) =>
  getCountForDate(habit, dateStr) > 0

export const isHabitEligibleOnDate = (habit, date, referenceDate = date) => {
  if (!habit) return false

  const day = startOfDay(date)
  if (day > startOfDay(referenceDate)) return false
  if (!habit.createdAt) return true

  return day >= startOfDay(parseISO(habit.createdAt))
}

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

const getRangeStatsForDays = (days) => {
  if (days.length === 0) return emptyRangeStats

  const totalCount = days.reduce((sum, day) => sum + day.count, 0)
  const daysWithEntry = days.filter(day => day.count > 0).length
  const daysElapsed = days.length
  const daysWithoutEntry = daysElapsed - daysWithEntry
  const best = days.reduce(
    (currentBest, day) => day.count > currentBest.count
      ? { count: day.count, date: day.dateKey || day.date }
      : currentBest,
    { count: 0, date: null }
  )
  const percentDaysSaid = Math.round((daysWithEntry / daysElapsed) * 100)

  return {
    totalCount,
    daysWithEntry,
    daysWithoutEntry,
    daysElapsed,
    percentDaysSaid,
    percentDaysMissed: 100 - percentDaysSaid,
    avgPerActiveDay: daysWithEntry > 0 ? Math.round((totalCount / daysWithEntry) * 10) / 10 : 0,
    bestCount: best.count,
    bestDate: best.date
  }
}

export const getHabitRangeStats = (habit, range, refDate = new Date(), asOfDate = new Date(), weekStartsOn = 0) => {
  if (!habit) return emptyRangeStats

  const { periodStart, periodEnd } = getPeriodRange(range, refDate, weekStartsOn)
  const eligibleDays = getDailyCountsForRange(habit, periodStart, periodEnd)
    .filter(day => isHabitEligibleOnDate(habit, day.day, asOfDate))

  return getRangeStatsForDays(eligibleDays)
}

const createCalendarDay = (habit, date, asOfDate) => {
  const dateKey = toDateKey(date)
  const count = getCountForDate(habit, dateKey)

  return {
    type: 'day',
    date,
    dateKey,
    dayNumber: format(date, 'd'),
    dayName: format(date, 'EEE'),
    shortLabel: format(date, 'MMM d'),
    longLabel: format(date, 'MMMM d, yyyy'),
    count,
    isCompleted: count > 0,
    isToday: dateKey === toDateKey(asOfDate)
  }
}

const createPaddingCells = (count, placement, keyPrefix) =>
  Array.from({ length: count }, (_, index) => ({
    type: 'padding',
    placement,
    key: `${keyPrefix}-${placement}-${index}`
  }))

const createMonthProjection = (habit, monthDate, asOfDate, weekStartsOn) => {
  const monthStart = startOfMonth(monthDate)
  const monthEnd = endOfMonth(monthDate)
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd })
    .map(date => createCalendarDay(habit, date, asOfDate))
  const leadingCellCount = (monthStart.getDay() - getWeekOptions(weekStartsOn).weekStartsOn + 7) % 7
  const trailingCellCount = (7 - ((leadingCellCount + days.length) % 7)) % 7
  const keyPrefix = format(monthStart, 'yyyy-MM')

  return {
    monthStart,
    monthEnd,
    label: format(monthStart, 'MMM'),
    longLabel: format(monthStart, 'MMMM yyyy'),
    leadingCellCount,
    trailingCellCount,
    days,
    cells: [
      ...createPaddingCells(leadingCellCount, 'leading', keyPrefix),
      ...days,
      ...createPaddingCells(trailingCellCount, 'trailing', keyPrefix)
    ]
  }
}

export const getCalendarPeriod = (
  habit,
  range,
  refDate = new Date(),
  asOfDate = new Date(),
  weekStartsOn = 0
) => {
  const normalizedRange = range === 'week' || range === 'year' ? range : 'month'
  const { periodStart, periodEnd } = getPeriodRange(normalizedRange, refDate, weekStartsOn)
  const days = eachDayOfInterval({ start: periodStart, end: periodEnd })
    .map(date => createCalendarDay(habit, date, asOfDate))
  const summaryDays = days.filter(day => isHabitEligibleOnDate(habit, day.date, asOfDate))
  const months = normalizedRange === 'year'
    ? eachMonthOfInterval({ start: periodStart, end: periodEnd })
      .map(month => createMonthProjection(habit, month, asOfDate, weekStartsOn))
    : []
  const month = normalizedRange === 'month'
    ? createMonthProjection(habit, periodStart, asOfDate, weekStartsOn)
    : null
  const weekOptions = getWeekOptions(weekStartsOn)
  const previousReferenceDate = normalizedRange === 'week'
    ? subWeeks(refDate, 1)
    : normalizedRange === 'year'
      ? subYears(refDate, 1)
      : subMonths(refDate, 1)
  const nextReferenceDate = normalizedRange === 'week'
    ? addWeeks(refDate, 1)
    : normalizedRange === 'year'
      ? addYears(refDate, 1)
      : addMonths(refDate, 1)

  return {
    range: normalizedRange,
    periodStart,
    periodEnd,
    headerLabel: normalizedRange === 'week'
      ? `${format(periodStart, 'MMM d')} - ${format(periodEnd, 'MMM d, yyyy')}`
      : normalizedRange === 'year'
        ? format(periodStart, 'yyyy')
        : format(periodStart, 'MMMM yyyy'),
    summaryLabel: normalizedRange === 'week'
      ? 'This Week'
      : normalizedRange === 'year'
        ? 'This Year'
        : 'This Month',
    dayHeaders: eachDayOfInterval({
      start: startOfWeek(refDate, weekOptions),
      end: endOfWeek(refDate, weekOptions)
    }).map(day => format(day, 'EEE')),
    days,
    cells: normalizedRange === 'month' ? month.cells : days,
    month,
    months,
    stats: getRangeStatsForDays(summaryDays),
    previousReferenceDate,
    nextReferenceDate
  }
}

export const getHabitStreak = (habit, refDate = new Date()) => {
  const completionSet = new Set(getCompletions(habit).map(completion => completion.date))
  let streak = 0
  let cursor = startOfDay(refDate)

  while (
    isHabitEligibleOnDate(habit, cursor, refDate) &&
    completionSet.has(toDateKey(cursor))
  ) {
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
    const isEligible = isHabitEligibleOnDate(habit, date, refDate)

    days.push({
      date,
      dateStr,
      isCompleted: isEligible && isCompletedOnDate(habit, dateStr),
      isEligible,
      isToday: dateStr === toDateKey(refDate),
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
      isToday: date === toDateKey(refDate)
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
