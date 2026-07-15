// Preserved from design snapshot 7aec7cbf85c486775f68cb6c72fc4bc4897776b2.
const typography = {
  displayFamily: 'Syne, "Arial Black", Impact, sans-serif',
  fontFamily: '"Space Grotesk", "Avenir Next", sans-serif',
  monoFamily: '"Space Mono", "SFMono-Regular", Consolas, monospace',
  fontSize: { headingLarge: 'clamp(2.35rem, 6vw, 4.8rem)', headingMedium: 'clamp(1.6rem, 4vw, 3rem)', bodyLarge: '1rem', bodyMedium: '.875rem', bodySmall: '.72rem' },
  fontWeight: { regular: 400, medium: 500, bold: 700 },
  lineHeight: { tight: .9, normal: 1.5, relaxed: 1.7 }
}

const foundations = {
  typography,
  spacing: { xs: '5px', sm: '10px', md: '16px', lg: '24px', xl: '36px', xxl: '54px', xxxl: '86px' },
  borderRadius: { small: '2px', medium: '6px', large: '12px', round: '999px' },
  breakpoints: { narrow: '480px', mobile: '768px', tablet: '1024px' },
  motion: { fast: '120ms', base: '260ms', slow: '760ms', easeOut: 'cubic-bezier(.16,1,.3,1)', spring: 'cubic-bezier(.2,.9,.2,1.25)' }
}

export const lightTheme = {
  ...foundations, mode: 'light',
  colors: {
    primary: '#3457D5', primaryHover: '#2344B5', secondary: '#C6E84D', destructive: '#C44252', success: '#24755E', warning: '#8E641A', focus: '#B34BDE',
    background: '#E6ECF4', surface: '#F6F8FC', surfaceAlt: '#D7DFEB', ink: '#111827', text: { primary: '#111827', secondary: '#5A6678' },
    white: '#F6F8FC', onPrimary: '#FFFFFF', border: '#B8C3D2', borderStrong: '#5B687B',
    shadow: { subtle: 'rgba(24,38,61,.1)', medium: 'rgba(24,38,61,.18)', strong: 'rgba(24,38,61,.27)' }
  },
  shadows: { subtle: '0 0 0 1px rgba(24,38,61,.08)', medium: '0 18px 50px rgba(24,38,61,.14)', strong: '0 30px 90px rgba(24,38,61,.22)' }
}

export const darkTheme = {
  ...foundations, mode: 'dark',
  colors: {
    primary: '#7D9BFF', primaryHover: '#A2B6FF', secondary: '#D2F65B', destructive: '#FF7786', success: '#68D8B4', warning: '#F2C86F', focus: '#D88CFF',
    background: '#070B14', surface: '#0D1423', surfaceAlt: '#151F33', ink: '#F3F6FC', text: { primary: '#F3F6FC', secondary: '#8F9BB0' },
    white: '#0D1423', onPrimary: '#080D18', border: '#26334B', borderStrong: '#596987',
    shadow: { subtle: 'rgba(0,0,0,.3)', medium: 'rgba(0,0,0,.48)', strong: 'rgba(0,0,0,.65)' }
  },
  shadows: { subtle: '0 0 0 1px rgba(125,155,255,.12)', medium: '0 18px 50px rgba(0,0,0,.38)', strong: '0 30px 90px rgba(0,0,0,.6)' }
}

export const theme = lightTheme
