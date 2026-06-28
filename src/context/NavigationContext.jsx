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
      { id: 'dashboard', paths: ['/'] },
      { id: 'habits', paths: ['/habits', '/habit', '/add-habit', '/edit-habit'] },
      { id: 'calendar', paths: ['/calendar'] },
      { id: 'journal', paths: ['/journal'] },
      { id: 'progress', paths: ['/progress'] },
      { id: 'settings', paths: ['/settings'] }
    ]
    
    const activeItem = navItems
      .flatMap(item => item.paths.map(itemPath => ({ ...item, path: itemPath })))
      .filter(item => item.path === '/' ? path === '/' : path.startsWith(item.path))
      .sort((a, b) => b.path.length - a.path.length)[0]

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
