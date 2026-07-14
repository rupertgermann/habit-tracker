import React, { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import styled, { ThemeProvider as StyledThemeProvider } from 'styled-components'
import { GlobalStyles } from './styles/GlobalStyles'
import Dashboard from './screens/Dashboard'
import HabitsList from './screens/HabitsList'
import CalendarView from './screens/CalendarView'
import HabitDetail from './screens/HabitDetail'
import ProgressStats from './screens/ProgressStats'
import Settings from './screens/Settings'
import InfoPage from './screens/InfoPage'
import AddEditHabit from './screens/AddEditHabit'
import JournalView from './screens/JournalView'
import BottomNavigation from './components/BottomNavigation'
import TabletSplitView from './components/TabletSplitView'
import { HabitsProvider } from './context/HabitsContext.jsx'
import { ToastProvider } from './context/ToastContext.jsx'
import { ThemeProvider, useTheme } from './context/ThemeContext.jsx'
import { NavigationProvider } from './context/NavigationContext.jsx'
import { PreferencesProvider } from './context/PreferencesContext.jsx'

const AppFrame = styled.div`
  min-height: 100vh;
  padding-bottom: calc(76px + env(safe-area-inset-bottom, 0px));

  @media (min-width: ${props => props.theme.breakpoints.tablet}) {
    padding: 88px 0 0;
  }
`

function AppContent() {
  const [isWideLayout, setIsWideLayout] = useState(false)
  const { theme } = useTheme()

  useEffect(() => {
    const wideLayoutBreakpoint = Number.parseInt(theme.breakpoints.tablet, 10)
    const checkIsWideLayout = () => {
      setIsWideLayout(window.innerWidth >= wideLayoutBreakpoint)
    }
    
    checkIsWideLayout()
    window.addEventListener('resize', checkIsWideLayout)
    
    return () => window.removeEventListener('resize', checkIsWideLayout)
  }, [theme.breakpoints.tablet])

  return (
    <StyledThemeProvider theme={theme}>
      <GlobalStyles />
      <ToastProvider>
        <AppFrame>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/habits" element={isWideLayout ? <TabletSplitView /> : <HabitsList />} />
            <Route path="/calendar" element={<CalendarView />} />
            <Route path="/habit/:id" element={isWideLayout ? <TabletSplitView /> : <HabitDetail />} />
            <Route path="/progress" element={<ProgressStats />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/privacy" element={<InfoPage page="privacy" />} />
            <Route path="/terms" element={<InfoPage page="terms" />} />
            <Route path="/support" element={<InfoPage page="support" />} />
            <Route path="/add-habit" element={<AddEditHabit />} />
            <Route path="/edit-habit/:id" element={<AddEditHabit />} />
            <Route path="/journal" element={<JournalView />} />
          </Routes>
          <BottomNavigation />
        </AppFrame>
      </ToastProvider>
    </StyledThemeProvider>
  )
}

function App() {
  return (
    <ThemeProvider>
      <PreferencesProvider>
        <HabitsProvider>
          <Router>
            <NavigationProvider>
              <AppContent />
            </NavigationProvider>
          </Router>
        </HabitsProvider>
      </PreferencesProvider>
    </ThemeProvider>
  )
}

export default App
