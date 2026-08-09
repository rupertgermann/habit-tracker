import React, { createContext, useContext, useReducer, useEffect, useRef } from 'react'
import { habitsApi } from '../api/habitsApi'
import {
  createHabitLifecycle,
  createHabitPersistence
} from '../domain/habitLifecycle'
import { createDashboardHabitTracking } from '../domain/dashboardHabitTracking'
import {
  createJournalEntryPersistence,
  createJournalEntryWriter
} from '../domain/journalEntryWrites'

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
  error: null,
  mutationError: null
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
    case 'REPLACE_HABITS':
      return state.habits === action.payload
        ? state
        : { ...state, habits: action.payload }
    case 'DELETE_HABIT_SUCCESS':
      return {
        ...state,
        habits: action.payload.habits,
        journalEntries: action.payload.journalEntries
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
    case 'REPLACE_JOURNAL_ENTRIES':
      return state.journalEntries === action.payload
        ? state
        : { ...state, journalEntries: action.payload }
    case 'SET_MUTATION_ERROR':
      return { ...state, mutationError: action.payload }
    case 'CLEAR_MUTATION_ERROR':
      return { ...state, mutationError: null }
    default:
      return state
  }
}

const productionHabitPersistence = createHabitPersistence({
  createHabit: habit => habitsApi.createHabit(habit),
  updateHabit: habit => habitsApi.updateHabit(habit),
  deleteHabit: id => habitsApi.deleteHabit(id)
})

const productionJournalEntryPersistence = createJournalEntryPersistence({
  createJournalEntry: entry => habitsApi.createJournalEntry(entry),
  updateJournalEntry: entry => habitsApi.updateJournalEntry(entry),
  deleteJournalEntry: id => habitsApi.deleteJournalEntry(id)
})

export const HabitsProvider = ({
  children,
  habitPersistence = productionHabitPersistence,
  journalEntryPersistence = productionJournalEntryPersistence
}) => {
  const [state, dispatch] = useReducer(habitsReducer, initialState)
  const habitsRef = useRef(state.habits)
  const journalEntriesRef = useRef(state.journalEntries)
  const pendingHabitWrites = useRef(new Map())
  const pendingJournalEntryWrites = useRef(new Map())
  habitsRef.current = state.habits
  journalEntriesRef.current = state.journalEntries

  const replaceHabits = replacement => {
    habitsRef.current = replacement
    dispatch({ type: 'REPLACE_HABITS', payload: replacement })
  }

  const replaceDeletedState = replacement => {
    habitsRef.current = replacement.habits
    journalEntriesRef.current = replacement.journalEntries
    dispatch({
      type: 'DELETE_HABIT_SUCCESS',
      payload: replacement
    })
  }

  const getHabitLifecycle = () => createHabitLifecycle({
    persistence: habitPersistence,
    getHabits: () => habitsRef.current,
    replaceHabits,
    replaceDeletedState,
    pendingWrites: pendingHabitWrites.current
  })

  const replaceJournalEntries = replacement => {
    journalEntriesRef.current = replacement
    dispatch({ type: 'REPLACE_JOURNAL_ENTRIES', payload: replacement })
  }

  const getJournalEntryWriter = () => createJournalEntryWriter({
    persistence: journalEntryPersistence,
    getJournalEntries: () => journalEntriesRef.current,
    replaceJournalEntries,
    pendingWrites: pendingJournalEntryWrites.current
  })

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

  const addHabit = habitData => getHabitLifecycle().create(habitData)

  const addJournalEntry = entryData => getJournalEntryWriter().create(entryData)

  const updateJournalEntry = (id, entryData) =>
    getJournalEntryWriter().update(id, entryData)

  const deleteJournalEntry = id => getJournalEntryWriter().delete(id)

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

  const updateHabit = (id, habitData) => getHabitLifecycle().update(id, habitData)

  const deleteHabit = id => getHabitLifecycle().delete(id)

  const toggleYesNoCompletion = async (habitId, date = new Date()) => {
    dispatch({ type: 'CLEAR_MUTATION_ERROR' })
    const result = await getHabitLifecycle().toggleYesNo({ habitId, date })
    if (!result.ok) {
      dispatch({
        type: 'SET_MUTATION_ERROR',
        payload: {
          habitId,
          message: `Could not update "${result.habit?.name || 'Habit'}". Please try again.`
        }
      })
    }
    return result
  }

  const incrementCountCompletion = async (habitId, date = new Date()) => {
    return getHabitLifecycle().incrementCount({ habitId, date })
  }

  const decrementCountCompletion = async (habitId, date = new Date()) => {
    return getHabitLifecycle().decrementCount({ habitId, date })
  }

  const dashboardHabitTracking = createDashboardHabitTracking({
    getHabits: () => habitsRef.current,
    toggleYesNoCompletion,
    settleCompletionWrites: () => getHabitLifecycle().settle()
  })

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
    dashboardHabitTracking,
    toggleYesNoCompletion,
    incrementCountCompletion,
    decrementCountCompletion,
    addCategory,
    updateCategory,
    deleteCategory
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
