import React, { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import styled, { ThemeProvider as StyledThemeProvider } from 'styled-components'
import { GlobalStyles } from './styles/GlobalStyles'
import { GlobalStyles as RhythmLedgerGlobalStyles } from './styles/GlobalStylesRhythmLedger'
import { GlobalStyles as OrbitGlobalStyles } from './styles/GlobalStylesOrbit'
import { GlobalStyles as QuietMomentumGlobalStyles } from './styles/GlobalStylesQuietMomentum'
import { GlobalStyles as SundayClubGlobalStyles } from './styles/GlobalStylesSundayClub'
import Dashboard from './screens/Dashboard'
import DashboardRhythmLedger from './screens/DashboardRhythmLedger'
import DashboardOrbit from './screens/DashboardOrbit'
import DashboardQuietMomentum from './screens/DashboardQuietMomentum'
import DashboardSundayClub from './screens/DashboardSundayClub'
import HabitsList from './screens/HabitsList'
import CalendarView from './screens/CalendarView'
import HabitDetail from './screens/HabitDetail'
import ProgressStats from './screens/ProgressStats'
import Settings from './screens/Settings'
import InfoPage from './screens/InfoPage'
import AddEditHabit from './screens/AddEditHabit'
import JournalView from './screens/JournalView'
import BottomNavigation from './components/BottomNavigation'
import BottomNavigationRhythmLedger from './components/BottomNavigationRhythmLedger'
import BottomNavigationOrbit from './components/BottomNavigationOrbit'
import BottomNavigationQuietMomentum from './components/BottomNavigationQuietMomentum'
import BottomNavigationSundayClub from './components/BottomNavigationSundayClub'
import TabletSplitView from './components/TabletSplitView'
import { HabitsProvider } from './context/HabitsContext.jsx'
import { ToastProvider } from './context/ToastContext.jsx'
import { ThemeProvider, useTheme } from './context/ThemeContext.jsx'
import { NavigationProvider } from './context/NavigationContext.jsx'
import { PreferencesProvider } from './context/PreferencesContext.jsx'

const DASHBOARDS = {
  standard: Dashboard,
  'rhythm-ledger': DashboardRhythmLedger,
  orbit: DashboardOrbit,
  'quiet-momentum': DashboardQuietMomentum,
  'sunday-club': DashboardSundayClub
}

const GLOBAL_STYLES = {
  standard: GlobalStyles,
  'rhythm-ledger': RhythmLedgerGlobalStyles,
  orbit: OrbitGlobalStyles,
  'quiet-momentum': QuietMomentumGlobalStyles,
  'sunday-club': SundayClubGlobalStyles
}

const NAVIGATIONS = {
  standard: BottomNavigation,
  'rhythm-ledger': BottomNavigationRhythmLedger,
  orbit: BottomNavigationOrbit,
  'quiet-momentum': BottomNavigationQuietMomentum,
  'sunday-club': BottomNavigationSundayClub
}

const getMobileFramePadding = design => {
  if (design === 'rhythm-ledger') return '92px'
  if (design === 'standard') return '80px'
  return 'calc(76px + env(safe-area-inset-bottom, 0px))'
}

const getWideFramePadding = design => {
  switch (design) {
    case 'rhythm-ledger':
      return '0 0 0 112px'
    case 'orbit':
      return '0 0 0 168px'
    case 'quiet-momentum':
      return '88px 0 0'
    case 'sunday-club':
      return '0 176px 0 0'
    default:
      return '64px 0 0'
  }
}

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
  padding-bottom: ${props => getMobileFramePadding(props.$design)};

  @media (min-width: ${props => props.theme.breakpoints.tablet}) {
    padding: ${props => getWideFramePadding(props.$design)};
  }
`

const Main = styled.main`
  min-height: 100vh;
`

function AppContent() {
  const [isWideLayout, setIsWideLayout] = useState(false)
  const { theme, design } = useTheme()
  const DashboardComponent = DASHBOARDS[design]
  const GlobalStylesComponent = GLOBAL_STYLES[design]
  const NavigationComponent = NAVIGATIONS[design]

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
        <AppFrame $design={design}>
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
