import React, { createContext, useContext, useReducer, useEffect } from 'react'
import { format, startOfWeek, endOfWeek, eachDayOfInterval, isToday, isSameDay, startOfMonth, endOfMonth, startOfYear, endOfYear, parseISO, differenceInCalendarDays } from 'date-fns'
import { habitsApi } from '../api/habitsApi'

const HabitsContext = createContext()

const initialState = {
  habits: [],
  categories: [],
  journalEntries: [],
  moodOptions: [
    { id: 'very-bad', name: 'Very Bad', emoji: '😔', color: '#F28A8A' },
    { id: 'bad', name: 'Bad', emoji: '😕', color: '#FBBF24' },
    { id: 'neutral', name: 'Neutral', emoji: '😐', color: '#6B7280' },
    { id: 'good', name: 'Good', emoji: '😊', color: '#6CC47C' },
    { id: 'very-good', name: 'Very Good', emoji: '😄', color: '#34D399' }
  ],
  isLoading: false,
  error: null
}

const habitsReducer = (state, action) => {
  switch (action.type) {
    case 'FETCH_HABITS_START':
      return { ...state, isLoading: true, error: null }
    case 'FETCH_HABITS_SUCCESS':
      return { ...state, isLoading: false, habits: action.payload }
    case 'FETCH_HABITS_ERROR':
      return { ...state, isLoading: false, error: action.payload }
    case 'FETCH_JOURNAL_ENTRIES_SUCCESS':
      return { ...state, journalEntries: action.payload }
    case 'FETCH_CATEGORIES_SUCCESS':
      return { ...state, categories: action.payload }
    case 'ADD_HABIT':
      return { ...state, habits: [...state.habits, action.payload] }
    case 'UPDATE_HABIT':
      return {
        ...state,
        habits: state.habits.map(habit =>
          habit.id === action.payload.id ? action.payload : habit
        )
      }
    case 'DELETE_HABIT':
      return {
        ...state,
        habits: state.habits.filter(habit => habit.id !== action.payload)
      }
    case 'TOGGLE_HABIT_COMPLETION':
      return {
        ...state,
        habits: state.habits.map(habit => {
          if (habit.id === action.payload.habitId) {
            const today = format(new Date(), 'yyyy-MM-dd')
            const existingCompletion = habit.completions.find(c => c.date === today)
            
            if (existingCompletion) {
              return {
                ...habit,
                completions: habit.completions.filter(c => c.date !== today)
              }
            } else {
              return {
                ...habit,
                completions: [...habit.completions, { date: today, completedAt: new Date().toISOString() }]
              }
            }
          }
          return habit
        })
      }
    case 'ADD_CATEGORY':
      return { ...state, categories: [...state.categories, action.payload] }
    case 'UPDATE_CATEGORY':
      return {
        ...state,
        categories: state.categories.map(category =>
          category.id === action.payload.id ? action.payload : category
        )
      }
    case 'DELETE_CATEGORY':
      return {
        ...state,
        categories: state.categories.filter(category => category.id !== action.payload)
      }
    case 'ADD_JOURNAL_ENTRY':
      return { ...state, journalEntries: [...state.journalEntries, action.payload] }
    case 'UPDATE_JOURNAL_ENTRY':
      return {
        ...state,
        journalEntries: state.journalEntries.map(entry =>
          entry.id === action.payload.id ? action.payload : entry
        )
      }
    case 'DELETE_JOURNAL_ENTRY':
      return {
        ...state,
        journalEntries: state.journalEntries.filter(entry => entry.id !== action.payload)
      }
    default:
      return state
  }
}

export const HabitsProvider = ({ children }) => {
  const [state, dispatch] = useReducer(habitsReducer, initialState)

  // Load full state from the SQLite-backed API on mount
  useEffect(() => {
    let cancelled = false
    dispatch({ type: 'FETCH_HABITS_START' })
    habitsApi.getState()
      .then(data => {
        if (cancelled) return
        dispatch({ type: 'FETCH_HABITS_SUCCESS', payload: data.habits || [] })
        dispatch({ type: 'FETCH_CATEGORIES_SUCCESS', payload: data.categories || [] })
        dispatch({ type: 'FETCH_JOURNAL_ENTRIES_SUCCESS', payload: data.journalEntries || [] })
      })
      .catch(error => {
        if (cancelled) return
        console.error('Failed to load data from API:', error)
        dispatch({ type: 'FETCH_HABITS_ERROR', payload: error.message })
      })
    return () => { cancelled = true }
  }, [])

  const addHabit = (habitData) => {
    const newHabit = {
      id: Date.now().toString(),
      ...habitData,
      category: habitData.category || 'other',
      createdAt: new Date().toISOString(),
      completions: [],
      streak: 0,
      longestStreak: 0
    }
    dispatch({ type: 'ADD_HABIT', payload: newHabit })
    habitsApi.createHabit(newHabit).catch(err => console.error('Failed to create habit:', err))
    return newHabit
  }

  const addJournalEntry = (entryData) => {
    const newEntry = {
      id: Date.now().toString(),
      ...entryData,
      createdAt: new Date().toISOString()
    }
    dispatch({ type: 'ADD_JOURNAL_ENTRY', payload: newEntry })
    habitsApi.createJournalEntry(newEntry).catch(err => console.error('Failed to create journal entry:', err))
    return newEntry
  }

  const updateJournalEntry = (id, entryData) => {
    const updatedEntry = {
      ...state.journalEntries.find(entry => entry.id === id),
      ...entryData,
      updatedAt: new Date().toISOString()
    }
    dispatch({ type: 'UPDATE_JOURNAL_ENTRY', payload: updatedEntry })
    habitsApi.updateJournalEntry(updatedEntry).catch(err => console.error('Failed to update journal entry:', err))
    return updatedEntry
  }

  const deleteJournalEntry = (id) => {
    dispatch({ type: 'DELETE_JOURNAL_ENTRY', payload: id })
    habitsApi.deleteJournalEntry(id).catch(err => console.error('Failed to delete journal entry:', err))
  }

  const getJournalEntriesByDate = (date) => {
    return state.journalEntries.filter(entry => entry.date === date)
  }

  const getJournalEntriesByDateRange = (startDate, endDate) => {
    return state.journalEntries.filter(entry =>
      entry.date >= startDate && entry.date <= endDate
    )
  }

  const getJournalEntryForHabit = (habitId, date) => {
    return state.journalEntries.find(entry =>
      entry.habitId === habitId && entry.date === date
    )
  }

  const updateHabit = (id, habitData) => {
    const updatedHabit = {
      ...state.habits.find(h => h.id === id),
      ...habitData,
      updatedAt: new Date().toISOString()
    }
    dispatch({ type: 'UPDATE_HABIT', payload: updatedHabit })
    habitsApi.updateHabit(updatedHabit).catch(err => console.error('Failed to update habit:', err))
    return updatedHabit
  }

  const deleteHabit = (id) => {
    dispatch({ type: 'DELETE_HABIT', payload: id })

    // Remove any journal entries linked to this habit to prevent orphan data
    const updatedEntries = state.journalEntries.filter(entry => entry.habitId !== id)
    dispatch({ type: 'FETCH_JOURNAL_ENTRIES_SUCCESS', payload: updatedEntries })

    // Server cascades journal-entry deletion for this habit
    habitsApi.deleteHabit(id).catch(err => console.error('Failed to delete habit:', err))
  }

  const toggleHabitCompletion = (habitId) => {
    const habit = state.habits.find(h => h.id === habitId)
    if (!habit) return

    const today = format(new Date(), 'yyyy-MM-dd')
    const alreadyCompleted = habit.completions.some(c => c.date === today)
    const completions = alreadyCompleted
      ? habit.completions.filter(c => c.date !== today)
      : [...habit.completions, { date: today, completedAt: new Date().toISOString() }]

    const updatedHabit = { ...habit, completions }
    dispatch({ type: 'UPDATE_HABIT', payload: updatedHabit })
    habitsApi.updateHabit(updatedHabit).catch(err => console.error('Failed to toggle habit completion:', err))
  }

  // Append one occurrence for today (count-type habits log multiple per day)
  const incrementCompletion = (habitId) => {
    const habit = state.habits.find(h => h.id === habitId)
    if (!habit) return

    const today = format(new Date(), 'yyyy-MM-dd')
    const completions = [...(habit.completions || []), { date: today, completedAt: new Date().toISOString() }]
    const updatedHabit = { ...habit, completions }
    dispatch({ type: 'UPDATE_HABIT', payload: updatedHabit })
    habitsApi.updateHabit(updatedHabit).catch(err => console.error('Failed to increment completion:', err))
    return updatedHabit
  }

  // Remove the most recent occurrence logged for today
  const decrementCompletion = (habitId) => {
    const habit = state.habits.find(h => h.id === habitId)
    if (!habit) return

    const today = format(new Date(), 'yyyy-MM-dd')
    const todayEntries = (habit.completions || []).filter(c => c.date === today)
    if (todayEntries.length === 0) return

    // Drop the last today-entry, keep everything else
    const lastEntry = todayEntries[todayEntries.length - 1]
    let removed = false
    const completions = (habit.completions || []).filter(c => {
      if (!removed && c === lastEntry) {
        removed = true
        return false
      }
      return true
    })
    const updatedHabit = { ...habit, completions }
    dispatch({ type: 'UPDATE_HABIT', payload: updatedHabit })
    habitsApi.updateHabit(updatedHabit).catch(err => console.error('Failed to decrement completion:', err))
    return updatedHabit
  }

  // Number of occurrences logged on a given yyyy-MM-dd date
  const getCountForDate = (habit, dateStr) => {
    if (!habit || !habit.completions) return 0
    return habit.completions.filter(c => c.date === dateStr).length
  }

  // Per-day counts for a habit across an inclusive date interval
  const getDailyCountsForRange = (habitId, start, end) => {
    const habit = state.habits.find(h => h.id === habitId)
    const days = eachDayOfInterval({ start, end })
    return days.map(day => {
      const dateStr = format(day, 'yyyy-MM-dd')
      return { date: dateStr, day, count: habit ? getCountForDate(habit, dateStr) : 0 }
    })
  }

  // Stats for a habit over a period: 'week' | 'month' | 'year'
  const getHabitRangeStats = (habitId, range, refDate = new Date()) => {
    const habit = state.habits.find(h => h.id === habitId)
    const empty = { totalCount: 0, daysWithEntry: 0, daysElapsed: 0, percentDaysSaid: 0, avgPerActiveDay: 0, bestCount: 0, bestDate: null }
    if (!habit) return empty

    let periodStart
    let periodEnd
    if (range === 'week') {
      periodStart = startOfWeek(refDate, { weekStartsOn: 0 })
      periodEnd = endOfWeek(refDate, { weekStartsOn: 0 })
    } else if (range === 'year') {
      periodStart = startOfYear(refDate)
      periodEnd = endOfYear(refDate)
    } else {
      periodStart = startOfMonth(refDate)
      periodEnd = endOfMonth(refDate)
    }

    // Window for "days elapsed": clamp to habit creation and to today
    const today = new Date()
    const createdAt = habit.createdAt ? parseISO(habit.createdAt) : periodStart
    const windowStart = createdAt > periodStart ? createdAt : periodStart
    const windowEnd = today < periodEnd ? today : periodEnd

    if (windowEnd < windowStart) return empty

    const days = getDailyCountsForRange(habitId, windowStart, windowEnd)
    const totalCount = days.reduce((sum, d) => sum + d.count, 0)
    const daysWithEntry = days.filter(d => d.count > 0).length
    const daysElapsed = days.length
    const best = days.reduce((acc, d) => (d.count > acc.count ? d : acc), { count: 0, date: null })

    return {
      totalCount,
      daysWithEntry,
      daysElapsed,
      percentDaysSaid: daysElapsed > 0 ? Math.round((daysWithEntry / daysElapsed) * 100) : 0,
      avgPerActiveDay: daysWithEntry > 0 ? Math.round((totalCount / daysWithEntry) * 10) / 10 : 0,
      bestCount: best.count,
      bestDate: best.date
    }
  }

  const getHabitById = (id) => {
    return state.habits.find(habit => habit.id === id)
  }

  const getTodayHabits = () => {
    const today = format(new Date(), 'yyyy-MM-dd')
    return state.habits.map(habit => ({
      ...habit,
      isCompleted: habit.completions.some(c => c.date === today)
    }))
  }

  // Strict consecutive-day streak using UTC dates
  const getHabitStreak = (habit) => {
    if (!habit.completions || habit.completions.length === 0) return 0

    const completionSet = new Set(habit.completions.map(c => c.date))
    let streak = 0
    let cursor = new Date()
    cursor.setUTCHours(0, 0, 0, 0)

    while (completionSet.has(format(cursor, 'yyyy-MM-dd'))) {
      streak += 1
      cursor.setUTCDate(cursor.getUTCDate() - 1)
    }

    return streak
  }

  const getWeeklyCompletionData = () => {
    const today = new Date()
    const weekStart = startOfWeek(today, { weekStartsOn: 0 }) // Sunday
    const weekEnd = endOfWeek(today, { weekStartsOn: 0 })
    const daysOfWeek = eachDayOfInterval({ start: weekStart, end: weekEnd })

    return daysOfWeek.map(day => {
      const dayStr = format(day, 'yyyy-MM-dd')
      const dayName = format(day, 'EEE')

      const completed = state.habits.filter(habit =>
        habit.completions.some(c => c.date === dayStr)
      ).length

      const missed = state.habits.length - completed

      return {
        day: dayName,
        date: dayStr,
        completed,
        missed,
        isToday: isToday(day)
      }
    });
  }

  const getMonthlyCompletionData = () => {
    const today = new Date()
    const year = today.getFullYear()
    const month = today.getMonth()
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    
    const data = []
    
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = format(new Date(year, month, day), 'yyyy-MM-dd')
      const completions = state.habits.filter(habit =>
        habit.completions.some(c => c.date === dateStr)
      ).length
      
      data.push({
        date: dateStr,
        day,
        completions,
        percentage: state.habits.length > 0 ? (completions / state.habits.length) * 100 : 0
      })
    }
    
    return data
  }

  const getStats = () => {
    const today = format(new Date(), 'yyyy-MM-dd')
    const todayCompletions = state.habits.filter(habit =>
      habit.completions.some(c => c.date === today)
    ).length
    
    const totalCompletions = state.habits.reduce((total, habit) => 
      total + habit.completions.length, 0
    )
    
    const currentStreaks = state.habits.map(getHabitStreak)
    const maxStreak = Math.max(...currentStreaks, 0)
    
    const completionRate = state.habits.length > 0 
      ? (todayCompletions / state.habits.length) * 100 
      : 0
    
    return {
      totalHabits: state.habits.length,
      todayCompletions,
      totalCompletions,
      maxStreak,
      completionRate: Math.round(completionRate)
    }
  }

  const addCategory = (categoryData) => {
    const newCategory = {
      id: Date.now().toString(),
      ...categoryData,
      createdAt: new Date().toISOString()
    }
    dispatch({ type: 'ADD_CATEGORY', payload: newCategory })
    habitsApi.createCategory(newCategory).catch(err => console.error('Failed to create category:', err))
    return newCategory
  }

  const updateCategory = (id, categoryData) => {
    const updatedCategory = {
      ...state.categories.find(c => c.id === id),
      ...categoryData,
      updatedAt: new Date().toISOString()
    }
    dispatch({ type: 'UPDATE_CATEGORY', payload: updatedCategory })
    habitsApi.updateCategory(updatedCategory).catch(err => console.error('Failed to update category:', err))
    return updatedCategory
  }

  const deleteCategory = (id) => {
    // Move habits with this category to 'other'
    const habitsToUpdate = state.habits.filter(habit => habit.category === id)
    habitsToUpdate.forEach(habit => {
      updateHabit(habit.id, { category: 'other' })
    })

    dispatch({ type: 'DELETE_CATEGORY', payload: id })
    habitsApi.deleteCategory(id).catch(err => console.error('Failed to delete category:', err))
  }

  const getHabitsByCategory = (categoryId) => {
    return state.habits.filter(habit => habit.category === categoryId)
  }

  const getCategoryById = (id) => {
    return state.categories.find(category => category.id === id)
  }

  const value = {
    ...state,
    addHabit,
    updateHabit,
    deleteHabit,
    toggleHabitCompletion,
    incrementCompletion,
    decrementCompletion,
    getCountForDate,
    getDailyCountsForRange,
    getHabitRangeStats,
    getHabitById,
    getTodayHabits,
    getHabitStreak,
    getWeeklyCompletionData,
    getMonthlyCompletionData,
    getStats,
    addCategory,
    updateCategory,
    deleteCategory,
    getHabitsByCategory,
    getCategoryById
  }

  return (
    <HabitsContext.Provider value={value}>
      {children}
    </HabitsContext.Provider>
  )
}

export const useHabits = () => {
  const context = useContext(HabitsContext)
  if (!context) {
    throw new Error('useHabits must be used within a HabitsProvider')
  }
  return context
}