import { lightTheme as standardLightTheme, darkTheme as standardDarkTheme } from './theme'
import { lightTheme as rhythmLedgerLightTheme, darkTheme as rhythmLedgerDarkTheme } from './themeRhythmLedger'
import { lightTheme as orbitLightTheme, darkTheme as orbitDarkTheme } from './themeOrbit'
import { lightTheme as quietMomentumLightTheme, darkTheme as quietMomentumDarkTheme } from './themeQuietMomentum'
import { lightTheme as sundayClubLightTheme, darkTheme as sundayClubDarkTheme } from './themeSundayClub'

export const DEFAULT_DESIGN_ID = 'standard'

export const DESIGN_OPTIONS = [
  {
    id: DEFAULT_DESIGN_ID,
    name: 'Standard',
    description: 'The familiar, friendly green Habit Tracker.',
    commit: '2bbc54a61644f1e0ccda4d474a04af2e42bc3932',
    preview: ['#FFFFFF', '#4CAF50', '#FFC107', '#212121']
  },
  {
    id: 'rhythm-ledger',
    name: 'Rhythm Ledger',
    description: 'Warm paper, editorial type, and a seven-day rhythm rail.',
    commit: '7c9a357e5f9fb6191abb4640dd256eb8272a8b31',
    preview: ['#F2EBDD', '#C63E27', '#D7A928', '#201D18']
  },
  {
    id: 'orbit',
    name: 'Orbit',
    description: 'A spatial command deck with cobalt paths and lime signals.',
    commit: '7aec7cbf85c486775f68cb6c72fc4bc4897776b2',
    preview: ['#E6ECF4', '#3457D5', '#C6E84D', '#111827']
  },
  {
    id: 'quiet-momentum',
    name: 'Quiet Momentum',
    description: 'Soft botanical calm for deliberate, low-noise progress.',
    commit: '24ddae65079ecdf2bbb8249c57b3c2b9df66d4f8',
    preview: ['#F3EFE6', '#526B54', '#E4B75D', '#263028']
  },
  {
    id: 'sunday-club',
    name: 'Sunday Club',
    description: 'Playful punch cards, bright ink, and a little weekend energy.',
    commit: '9e35ba2350cecc709ce01d5552a59d9d59e629fb',
    preview: ['#F6EFAF', '#1D5BFF', '#FF4E9B', '#171A17']
  }
]

const themesByDesign = {
  standard: { light: standardLightTheme, dark: standardDarkTheme },
  'rhythm-ledger': { light: rhythmLedgerLightTheme, dark: rhythmLedgerDarkTheme },
  orbit: { light: orbitLightTheme, dark: orbitDarkTheme },
  'quiet-momentum': { light: quietMomentumLightTheme, dark: quietMomentumDarkTheme },
  'sunday-club': { light: sundayClubLightTheme, dark: sundayClubDarkTheme }
}

export const normalizeDesignPreference = value => (
  DESIGN_OPTIONS.some(option => option.id === value) ? value : DEFAULT_DESIGN_ID
)

export const getDesignTheme = (design, isDarkMode) => {
  const normalizedDesign = normalizeDesignPreference(design)
  const mode = isDarkMode ? 'dark' : 'light'

  return {
    ...themesByDesign[normalizedDesign][mode],
    design: normalizedDesign
  }
}
