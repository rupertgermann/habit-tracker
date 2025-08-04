import React, { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { ThemeProvider as StyledThemeProvider } from 'styled-components'
import { GlobalStyles } from './styles/GlobalStyles'
import Dashboard from './screens/Dashboard'
import HabitsList from './screens/HabitsList'
import CalendarView from './screens/CalendarView'
import HabitDetail from './screens/HabitDetail'
import ProgressStats from './screens/ProgressStats'
import Settings from './screens/Settings'
import AddEditHabit from './screens/AddEditHabit'
import JournalView from './screens/JournalView'
import BottomNavigation from './components/BottomNavigation'
import TabletSplitView from './components/TabletSplitView'
import { HabitsProvider } from './context/HabitsContext.jsx'
import { ToastProvider } from './context/ToastContext.jsx'
import { ThemeProvider, useTheme } from './context/ThemeContext.jsx'
import { NavigationProvider } from './context/NavigationContext.jsx'

function AppContent() {
  const [isTablet, setIsTablet] = useState(false)
  const { theme } = useTheme()

  useEffect(() => {
    const checkIsTablet = () => {
      setIsTablet(window.innerWidth >= 768)
    }
    
    checkIsTablet()
    window.addEventListener('resize', checkIsTablet)
    
    return () => window.removeEventListener('resize', checkIsTablet)
  }, [])

  return (
    <StyledThemeProvider theme={theme}>
      <GlobalStyles />
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
        paddingBottom: isTablet ? '0' : '80px' // No space needed for bottom nav on tablet
      }}>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/habits" element={isTablet ? <TabletSplitView /> : <HabitsList />} />
          <Route path="/calendar" element={<CalendarView />} />
          <Route path="/habit/:id" element={isTablet ? <TabletSplitView /> : <HabitDetail />} />
          <Route path="/progress" element={<ProgressStats />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/add-habit" element={<AddEditHabit />} />
          <Route path="/edit-habit/:id" element={<AddEditHabit />} />
          <Route path="/journal" element={<JournalView />} />
        </Routes>
        {!isTablet && <BottomNavigation />}
      </div>
    </StyledThemeProvider>
  )
}

function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <HabitsProvider>
          <Router>
            <NavigationProvider>
              <AppContent />
            </NavigationProvider>
          </Router>
        </HabitsProvider>
      </ToastProvider>
    </ThemeProvider>
  )
}

export default App