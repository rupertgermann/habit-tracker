import React, { createContext, useContext, useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'

const NavigationContext = createContext()

export const NavigationProvider = ({ children }) => {
  const [activeTab, setActiveTab] = useState('dashboard')
  const location = useLocation()

  // Update active tab based on current location
  useEffect(() => {
    const path = location.pathname
    const navItems = [
      { id: 'dashboard', path: '/' },
      { id: 'habits', path: '/habits' },
      { id: 'calendar', path: '/calendar' },
      { id: 'journal', path: '/journal' },
      { id: 'progress', path: '/progress' },
      { id: 'settings', path: '/settings' }
    ]
    
    const activeItem = navItems.find(item => item.path === path)
    if (activeItem) {
      setActiveTab(activeItem.id)
    }
  }, [location.pathname])

  const value = {
    activeTab,
    setActiveTab
  }

  return (
    <NavigationContext.Provider value={value}>
      {children}
    </NavigationContext.Provider>
  )
}

export const useNavigation = () => {
  const context = useContext(NavigationContext)
  if (!context) {
    throw new Error('useNavigation must be used within a NavigationProvider')
  }
  return context
}