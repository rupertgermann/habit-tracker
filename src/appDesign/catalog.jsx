import Dashboard from '../screens/Dashboard'
import DashboardRhythmLedger from '../screens/DashboardRhythmLedger'
import DashboardOrbit from '../screens/DashboardOrbit'
import DashboardQuietMomentum from '../screens/DashboardQuietMomentum'
import DashboardSundayClub from '../screens/DashboardSundayClub'
import BottomNavigation from '../components/BottomNavigation'
import BottomNavigationRhythmLedger from '../components/BottomNavigationRhythmLedger'
import BottomNavigationOrbit from '../components/BottomNavigationOrbit'
import BottomNavigationQuietMomentum from '../components/BottomNavigationQuietMomentum'
import BottomNavigationSundayClub from '../components/BottomNavigationSundayClub'
import { GlobalStyles } from '../styles/GlobalStyles'
import { GlobalStyles as RhythmLedgerGlobalStyles } from '../styles/GlobalStylesRhythmLedger'
import { GlobalStyles as OrbitGlobalStyles } from '../styles/GlobalStylesOrbit'
import { GlobalStyles as QuietMomentumGlobalStyles } from '../styles/GlobalStylesQuietMomentum'
import { GlobalStyles as SundayClubGlobalStyles } from '../styles/GlobalStylesSundayClub'
import { lightTheme as standardLightTheme, darkTheme as standardDarkTheme } from '../styles/theme'
import { lightTheme as rhythmLedgerLightTheme, darkTheme as rhythmLedgerDarkTheme } from '../styles/themeRhythmLedger'
import { lightTheme as orbitLightTheme, darkTheme as orbitDarkTheme } from '../styles/themeOrbit'
import { lightTheme as quietMomentumLightTheme, darkTheme as quietMomentumDarkTheme } from '../styles/themeQuietMomentum'
import { lightTheme as sundayClubLightTheme, darkTheme as sundayClubDarkTheme } from '../styles/themeSundayClub'

export const DEFAULT_APP_DESIGN_ID = 'standard'

const standard = {
  id: DEFAULT_APP_DESIGN_ID,
  name: 'Standard',
  description: 'The familiar, friendly green Habit Tracker.',
  commit: '2bbc54a61644f1e0ccda4d474a04af2e42bc3932',
  preview: ['#FFFFFF', '#4CAF50', '#FFC107', '#212121'],
  themes: {
    light: standardLightTheme,
    dark: standardDarkTheme
  },
  globalStyles: GlobalStyles,
  dashboard: Dashboard,
  primaryNavigation: BottomNavigation,
  frame: {
    mobile: { padding: '0 0 80px' },
    wide: { padding: '64px 0 0' }
  }
}

const rhythmLedger = {
  id: 'rhythm-ledger',
  name: 'Rhythm Ledger',
  description: 'Warm paper, editorial type, and a seven-day rhythm rail.',
  commit: '7c9a357e5f9fb6191abb4640dd256eb8272a8b31',
  preview: ['#F2EBDD', '#C63E27', '#D7A928', '#201D18'],
  themes: {
    light: rhythmLedgerLightTheme,
    dark: rhythmLedgerDarkTheme
  },
  globalStyles: RhythmLedgerGlobalStyles,
  dashboard: DashboardRhythmLedger,
  primaryNavigation: BottomNavigationRhythmLedger,
  frame: {
    mobile: { padding: '0 0 92px' },
    wide: { padding: '0 0 0 112px' }
  }
}

const orbit = {
  id: 'orbit',
  name: 'Orbit',
  description: 'A spatial command deck with cobalt paths and lime signals.',
  commit: '7aec7cbf85c486775f68cb6c72fc4bc4897776b2',
  preview: ['#E6ECF4', '#3457D5', '#C6E84D', '#111827'],
  themes: {
    light: orbitLightTheme,
    dark: orbitDarkTheme
  },
  globalStyles: OrbitGlobalStyles,
  dashboard: DashboardOrbit,
  primaryNavigation: BottomNavigationOrbit,
  frame: {
    mobile: { padding: '0 0 calc(76px + env(safe-area-inset-bottom, 0px))' },
    wide: { padding: '0 0 0 168px' }
  }
}

const quietMomentum = {
  id: 'quiet-momentum',
  name: 'Quiet Momentum',
  description: 'Soft botanical calm for deliberate, low-noise progress.',
  commit: '24ddae65079ecdf2bbb8249c57b3c2b9df66d4f8',
  preview: ['#F3EFE6', '#526B54', '#E4B75D', '#263028'],
  themes: {
    light: quietMomentumLightTheme,
    dark: quietMomentumDarkTheme
  },
  globalStyles: QuietMomentumGlobalStyles,
  dashboard: DashboardQuietMomentum,
  primaryNavigation: BottomNavigationQuietMomentum,
  frame: {
    mobile: { padding: '0 0 calc(76px + env(safe-area-inset-bottom, 0px))' },
    wide: { padding: '88px 0 0' }
  }
}

const sundayClub = {
  id: 'sunday-club',
  name: 'Sunday Club',
  description: 'Playful punch cards, bright ink, and a little weekend energy.',
  commit: '9e35ba2350cecc709ce01d5552a59d9d59e629fb',
  preview: ['#F6EFAF', '#1D5BFF', '#FF4E9B', '#171A17'],
  themes: {
    light: sundayClubLightTheme,
    dark: sundayClubDarkTheme
  },
  globalStyles: SundayClubGlobalStyles,
  dashboard: DashboardSundayClub,
  primaryNavigation: BottomNavigationSundayClub,
  frame: {
    mobile: { padding: '0 0 calc(76px + env(safe-area-inset-bottom, 0px))' },
    wide: { padding: '0 176px 0 0' }
  }
}

const appDesigns = [
  standard,
  rhythmLedger,
  orbit,
  quietMomentum,
  sundayClub
]

const isNonEmptyString = value => typeof value === 'string' && value.trim().length > 0

const requireRegistrationField = (design, field, isValid) => {
  if (!isValid) {
    const id = isNonEmptyString(design?.id) ? design.id : '<unknown>'
    throw new Error(`App Design "${id}" is missing required ${field}`)
  }
}

const validateRegistration = design => {
  requireRegistrationField(design, 'id', isNonEmptyString(design?.id))
  requireRegistrationField(design, 'name', isNonEmptyString(design?.name))
  requireRegistrationField(design, 'description', isNonEmptyString(design?.description))
  requireRegistrationField(design, 'commit metadata', isNonEmptyString(design?.commit))
  requireRegistrationField(
    design,
    'preview',
    Array.isArray(design?.preview) &&
      design.preview.length === 4 &&
      design.preview.every(isNonEmptyString)
  )
  requireRegistrationField(design, 'light theme', design?.themes?.light?.mode === 'light')
  requireRegistrationField(design, 'dark theme', design?.themes?.dark?.mode === 'dark')
  requireRegistrationField(design, 'global styles', Boolean(design?.globalStyles))
  requireRegistrationField(design, 'dashboard', Boolean(design?.dashboard))
  requireRegistrationField(design, 'primary navigation', Boolean(design?.primaryNavigation))
  requireRegistrationField(
    design,
    'mobile frame behavior',
    isNonEmptyString(design?.frame?.mobile?.padding)
  )
  requireRegistrationField(
    design,
    'wide frame behavior',
    isNonEmptyString(design?.frame?.wide?.padding)
  )
}

export const createAppDesignCatalog = (
  registrations,
  { defaultId = DEFAULT_APP_DESIGN_ID } = {}
) => {
  if (!Array.isArray(registrations) || registrations.length === 0) {
    throw new Error('App Design catalog requires at least one registration')
  }

  registrations.forEach(validateRegistration)

  const designs = Object.freeze([...registrations])
  const designsById = new Map()

  for (const design of designs) {
    if (designsById.has(design.id)) {
      throw new Error(`App Design catalog contains duplicate id "${design.id}"`)
    }

    designsById.set(design.id, design)
  }

  if (!designsById.has(defaultId)) {
    throw new Error(`App Design catalog is missing fallback "${defaultId}"`)
  }

  const normalize = value => (
    typeof value === 'string' && designsById.has(value)
      ? value
      : defaultId
  )

  const get = value => designsById.get(normalize(value))
  const getTheme = (value, isDarkMode) => {
    const design = get(value)
    const mode = isDarkMode ? 'dark' : 'light'

    return {
      ...design.themes[mode],
      design: design.id
    }
  }

  return Object.freeze({
    list: () => designs,
    normalize,
    get,
    getTheme
  })
}

const appDesignCatalog = createAppDesignCatalog(appDesigns)

export const listAppDesigns = () => appDesignCatalog.list()

export const normalizeAppDesignId = value => appDesignCatalog.normalize(value)

export const getAppDesign = id => appDesignCatalog.get(id)

export const getAppDesignTheme = (id, isDarkMode) =>
  appDesignCatalog.getTheme(id, isDarkMode)
