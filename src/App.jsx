import React, { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import styled, { ThemeProvider as StyledThemeProvider } from 'styled-components'
import HabitsList from './screens/HabitsList'
import CalendarView from './screens/CalendarView'
import HabitDetail from './screens/HabitDetail'
import ProgressStats from './screens/ProgressStats'
import Settings from './screens/Settings'
import InfoPage from './screens/InfoPage'
import AddEditHabit from './screens/AddEditHabit'
import JournalView from './screens/JournalView'
import TabletSplitView from './components/TabletSplitView'
import { HabitsProvider } from './context/HabitsContext.jsx'
import { ToastProvider } from './context/ToastContext.jsx'
import { ThemeProvider, useTheme } from './context/ThemeContext.jsx'
import { NavigationProvider } from './context/NavigationContext.jsx'
import { PreferencesProvider } from './context/PreferencesContext.jsx'

const SkipLink = styled.a`
  position: fixed;
  top: 12px;
  left: 12px;
  z-index: 1000;
  padding: 10px 14px;
  background: ${props => props.theme.colors.text.primary};
  color: ${props => props.theme.colors.background};
  transform: translateY(-180%);
  transition: transform ${props => props.theme.motion?.fast || '140ms'} ${props => props.theme.motion?.easeOut || 'ease-out'};

  &:focus {
    transform: translateY(0);
  }
`

const AppFrame = styled.div`
  min-height: 100vh;
  padding: ${props => props.$mobilePadding};

  @media (min-width: ${props => props.theme.breakpoints.tablet}) {
    padding: ${props => props.$widePadding};
  }
`

const Main = styled.main`
  min-height: 100vh;
`

function AppContent() {
  const [isWideLayout, setIsWideLayout] = useState(false)
  const { theme, appDesign } = useTheme()
  const {
    dashboard: DashboardComponent,
    globalStyles: GlobalStylesComponent,
    primaryNavigation: NavigationComponent,
    frame
  } = appDesign

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
      <GlobalStylesComponent />
      <ToastProvider>
        <SkipLink href="#main-content">Skip to today</SkipLink>
        <AppFrame
          $mobilePadding={frame.mobile.padding}
          $widePadding={frame.wide.padding}
        >
          <Main id="main-content" tabIndex="-1">
            <Routes>
              <Route path="/" element={<DashboardComponent />} />
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
          </Main>
          <NavigationComponent />
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
