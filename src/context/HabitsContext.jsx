import React, { createContext, useContext, useReducer, useEffect } from 'react'
import { habitsApi } from '../api/habitsApi'
import {
  decrementCompletionForDate,
  getCountForDate as getHabitCountForDate,
  getDailyCountsForRange as getHabitDailyCountsForRange,
  getHabitRangeStats as getTrackingRangeStats,
  getHabitStreak as getTrackingHabitStreak,
  getMonthlyCompletionData as getTrackingMonthlyCompletionData,
  getTodayHabits as getTrackingTodayHabits,
  getTrackingStats,
  getWeeklyCompletionData as getTrackingWeeklyCompletionData,
  incrementCompletionForDate,
  toggleBinaryCompletionForDate
} from '../domain/habitTracking'
import { usePreferences } from './PreferencesContext.jsx'

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
  hasLoaded: false,
  error: null
}

const habitsReducer = (state, action) => {
  switch (action.type) {
    case 'FETCH_HABITS_START':
      return { ...state, isLoading: true, error: null }
    case 'FETCH_HABITS_SUCCESS':
      return { ...state, isLoading: false, hasLoaded: true, habits: action.payload }
    case 'FETCH_HABITS_ERROR':
      return { ...state, isLoading: false, hasLoaded: true, error: action.payload }
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
  const { weekStartsOn } = usePreferences()

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

  const toggleHabitCompletion = (habitId, date = new Date()) => {
    const habit = state.habits.find(h => h.id === habitId)
    if (!habit) return

    const updatedHabit = toggleBinaryCompletionForDate(habit, date)
    dispatch({ type: 'UPDATE_HABIT', payload: updatedHabit })
    habitsApi.updateHabit(updatedHabit).catch(err => console.error('Failed to toggle habit completion:', err))
    return updatedHabit
  }

  // Append one occurrence for a date (count-type habits log multiple per day)
  const incrementCompletion = (habitId, date = new Date()) => {
    const habit = state.habits.find(h => h.id === habitId)
    if (!habit) return

    const updatedHabit = incrementCompletionForDate(habit, date)
    dispatch({ type: 'UPDATE_HABIT', payload: updatedHabit })
    habitsApi.updateHabit(updatedHabit).catch(err => console.error('Failed to increment completion:', err))
    return updatedHabit
  }

  // Remove the most recent occurrence logged for a date
  const decrementCompletion = (habitId, date = new Date()) => {
    const habit = state.habits.find(h => h.id === habitId)
    if (!habit) return

    const updatedHabit = decrementCompletionForDate(habit, date)
    if (updatedHabit === habit) return

    dispatch({ type: 'UPDATE_HABIT', payload: updatedHabit })
    habitsApi.updateHabit(updatedHabit).catch(err => console.error('Failed to decrement completion:', err))
    return updatedHabit
  }

  // Number of occurrences logged on a given yyyy-MM-dd date
  const getCountForDate = (habit, dateStr) => {
    return getHabitCountForDate(habit, dateStr)
  }

  // Per-day counts for a habit across an inclusive date interval
  const getDailyCountsForRange = (habitId, start, end) => {
    const habit = state.habits.find(h => h.id === habitId)
    return getHabitDailyCountsForRange(habit, start, end)
  }

  // Stats for a habit over a period: 'week' | 'month' | 'year'
  const getHabitRangeStats = (habitId, range, refDate = new Date()) => {
    const habit = state.habits.find(h => h.id === habitId)
    return getTrackingRangeStats(habit, range, refDate, new Date(), weekStartsOn)
  }

  const getHabitById = (id) => {
    return state.habits.find(habit => habit.id === id)
  }

  const getTodayHabits = () => {
    return getTrackingTodayHabits(state.habits)
  }

  // Strict consecutive-day streak using UTC dates
  const getHabitStreak = (habit) => {
    return getTrackingHabitStreak(habit)
  }

  const getWeeklyCompletionData = () => {
    return getTrackingWeeklyCompletionData(state.habits, new Date(), weekStartsOn)
  }

  const getMonthlyCompletionData = () => {
    return getTrackingMonthlyCompletionData(state.habits)
  }

  const getStats = () => {
    return getTrackingStats(state.habits)
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
    addJournalEntry,
    updateJournalEntry,
    deleteJournalEntry,
    getJournalEntriesByDate,
    getJournalEntriesByDateRange,
    getJournalEntryForHabit,
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
