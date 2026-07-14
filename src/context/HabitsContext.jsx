import React, { createContext, useContext, useReducer, useEffect, useRef } from 'react'
import { habitsApi } from '../api/habitsApi'
import {
  createCompletionPersistence,
  createCountCompletionWriter,
  createYesNoCompletionWriter
} from '../domain/completionWrites'

const HabitsContext = createContext()

const initialState = {
  habits: [],
  categories: [],
  journalEntries: [],
  moodOptions: [
    { id: 'very-bad', name: 'Very Bad', icon: 'circle-x', color: '#B42318' },
    { id: 'bad', name: 'Bad', icon: 'minus', color: '#A86E14' },
    { id: 'neutral', name: 'Neutral', icon: 'notes', color: '#6B7280' },
    { id: 'good', name: 'Good', icon: 'circle-check', color: '#377A58' },
    { id: 'very-good', name: 'Very Good', icon: 'sparkles', color: '#167B63' }
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
    case 'ADD_HABIT':
      return { ...state, habits: [...state.habits, action.payload] }
    case 'UPDATE_HABIT':
      return {
        ...state,
        habits: state.habits.map(habit =>
          habit.id === action.payload.id ? action.payload : habit
        )
      }
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
    case 'SET_MUTATION_ERROR':
      return { ...state, mutationError: action.payload }
    case 'CLEAR_MUTATION_ERROR':
      return { ...state, mutationError: null }
    default:
      return state
  }
}

const productionCompletionPersistence = createCompletionPersistence({
  updateHabit: habit => habitsApi.updateHabit(habit)
})

export const HabitsProvider = ({
  children,
  completionPersistence = productionCompletionPersistence
}) => {
  const [state, dispatch] = useReducer(habitsReducer, initialState)
  const habitsRef = useRef(state.habits)
  const pendingCompletionWrites = useRef(new Map())
  habitsRef.current = state.habits

  const replaceHabit = replacement => {
    habitsRef.current = habitsRef.current.map(habit => (
      habit.id === replacement.id ? replacement : habit
    ))
    dispatch({ type: 'UPDATE_HABIT', payload: replacement })
  }

  const getCompletionWriterDependencies = () => ({
    persistence: completionPersistence,
    getHabit: habitId => habitsRef.current.find(habit => habit.id === habitId),
    replaceHabit,
    pendingWrites: pendingCompletionWrites.current
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

  const addHabit = (habitData) => {
    const newHabit = {
      id: Date.now().toString(),
      ...habitData,
      category: habitData.category || 'other',
      createdAt: new Date().toISOString(),
      completions: []
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

  const deleteHabit = async (id) => {
    try {
      const result = await habitsApi.deleteHabit(id)
      dispatch({
        type: 'DELETE_HABIT_SUCCESS',
        payload: {
          habits: result.state.habits,
          journalEntries: result.state.journalEntries
        }
      })
      return result
    } catch (error) {
      console.error('Failed to delete habit:', error)
      return { ok: false, error }
    }
  }

  const toggleYesNoCompletion = async (habitId, date = new Date()) => {
    dispatch({ type: 'CLEAR_MUTATION_ERROR' })
    const writer = createYesNoCompletionWriter({
      ...getCompletionWriterDependencies(),
      onFailure: (error, previousHabit) => dispatch({
        type: 'SET_MUTATION_ERROR',
        payload: {
          habitId,
          message: `Could not update "${previousHabit?.name || 'Habit'}". Please try again.`
        }
      })
    })

    const result = await writer.toggle({ habitId, date })
    return result
  }

  const getCountCompletionWriter = () => createCountCompletionWriter({
    ...getCompletionWriterDependencies()
  })

  const incrementCountCompletion = async (habitId, date = new Date()) => {
    return getCountCompletionWriter().increment({ habitId, date })
  }

  const decrementCountCompletion = async (habitId, date = new Date()) => {
    return getCountCompletionWriter().decrement({ habitId, date })
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
