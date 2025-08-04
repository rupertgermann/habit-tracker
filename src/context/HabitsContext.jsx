import React, { createContext, useContext, useReducer, useEffect } from 'react'
import { format, startOfWeek, endOfWeek, eachDayOfInterval, isToday, isSameDay } from 'date-fns'

const HabitsContext = createContext()

const initialState = {
  habits: [],
  categories: [
    { id: 'health', name: 'Health & Fitness', color: '#6CC47C', icon: '💪' },
    { id: 'productivity', name: 'Productivity', color: '#F6D860', icon: '📝' },
    { id: 'mindfulness', name: 'Mindfulness', color: '#8B5CF6', icon: '🧘' },
    { id: 'learning', name: 'Learning', color: '#0EA5E9', icon: '📚' },
    { id: 'social', name: 'Social', color: '#F28A8A', icon: '👥' },
    { id: 'creativity', name: 'Creativity', color: '#EC4899', icon: '🎨' },
    { id: 'other', name: 'Other', color: '#6B7280', icon: '📌' }
  ],
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

  // Load habits from localStorage on mount
  useEffect(() => {
    const savedHabits = localStorage.getItem('habits')
    if (savedHabits) {
      try {
        const habits = JSON.parse(savedHabits)
        dispatch({ type: 'FETCH_HABITS_SUCCESS', payload: habits })
      } catch (error) {
        console.error('Failed to load habits from localStorage:', error)
      }
    }
  }, [])

  // Save habits to localStorage whenever they change
  useEffect(() => {
    if (state.habits.length > 0) {
      localStorage.setItem('habits', JSON.stringify(state.habits))
    }
  }, [state.habits])

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
    return newHabit
  }

  const addJournalEntry = (entryData) => {
    const newEntry = {
      id: Date.now().toString(),
      ...entryData,
      createdAt: new Date().toISOString()
    }
    dispatch({ type: 'ADD_JOURNAL_ENTRY', payload: newEntry })
    return newEntry
  }

  const updateJournalEntry = (id, entryData) => {
    const updatedEntry = {
      ...state.journalEntries.find(entry => entry.id === id),
      ...entryData,
      updatedAt: new Date().toISOString()
    }
    dispatch({ type: 'UPDATE_JOURNAL_ENTRY', payload: updatedEntry })
    return updatedEntry
  }

  const deleteJournalEntry = (id) => {
    dispatch({ type: 'DELETE_JOURNAL_ENTRY', payload: id })
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
    return updatedHabit
  }

  const deleteHabit = (id) => {
    dispatch({ type: 'DELETE_HABIT', payload: id })
  }

  const toggleHabitCompletion = (habitId) => {
    dispatch({ type: 'TOGGLE_HABIT_COMPLETION', payload: { habitId } })
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

  const getHabitStreak = (habit) => {
    if (!habit.completions || habit.completions.length === 0) return 0
    
    const sortedCompletions = habit.completions
      .map(c => new Date(c.date))
      .sort((a, b) => b - a)
    
    let streak = 0
    let currentDate = new Date()
    currentDate.setHours(0, 0, 0, 0)
    
    for (const completionDate of sortedCompletions) {
      const compDate = new Date(completionDate)
      compDate.setHours(0, 0, 0, 0)
      
      const diffDays = Math.floor((currentDate - compDate) / (1000 * 60 * 60 * 24))
      
      if (diffDays === streak) {
        streak++
      } else if (diffDays === streak + 1) {
        // Allow for one day gap (yesterday)
        streak++
        currentDate = compDate
      } else {
        break
      }
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
    })
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
    return newCategory
  }

  const updateCategory = (id, categoryData) => {
    const updatedCategory = {
      ...state.categories.find(c => c.id === id),
      ...categoryData,
      updatedAt: new Date().toISOString()
    }
    dispatch({ type: 'UPDATE_CATEGORY', payload: updatedCategory })
    return updatedCategory
  }

  const deleteCategory = (id) => {
    // Move habits with this category to 'other'
    const habitsToUpdate = state.habits.filter(habit => habit.category === id)
    habitsToUpdate.forEach(habit => {
      updateHabit(habit.id, { category: 'other' })
    })
    
    dispatch({ type: 'DELETE_CATEGORY', payload: id })
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