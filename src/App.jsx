import React, { useState } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { ThemeProvider } from 'styled-components'
import { GlobalStyles } from './styles/GlobalStyles'
import { theme } from './styles/theme'
import Dashboard from './screens/Dashboard'
import HabitsList from './screens/HabitsList'
import CalendarView from './screens/CalendarView'
import HabitDetail from './screens/HabitDetail'
import ProgressStats from './screens/ProgressStats'
import Settings from './screens/Settings'
import AddEditHabit from './screens/AddEditHabit'
import BottomNavigation from './components/BottomNavigation'
import { HabitsProvider } from './context/HabitsContext'

function App() {
  const [activeTab, setActiveTab] = useState('dashboard')

  return (
    <ThemeProvider theme={theme}>
      <GlobalStyles />
      <HabitsProvider>
        <Router>
          <div style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            minHeight: '100vh',
            paddingBottom: '80px' // Space for bottom nav
          }}>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/habits" element={<HabitsList />} />
              <Route path="/calendar" element={<CalendarView />} />
              <Route path="/habit/:id" element={<HabitDetail />} />
              <Route path="/progress" element={<ProgressStats />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/add-habit" element={<AddEditHabit />} />
              <Route path="/edit-habit/:id" element={<AddEditHabit />} />
            </Routes>
            <BottomNavigation activeTab={activeTab} onTabChange={setActiveTab} />
          </div>
        </Router>
      </HabitsProvider>
    </ThemeProvider>
  )
}

export default App