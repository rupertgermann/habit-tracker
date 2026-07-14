const typography = {
  displayFamily: '"Iowan Old Style", "Palatino Linotype", "Book Antiqua", Palatino, Georgia, serif',
  fontFamily: '"Avenir Next", Avenir, "Gill Sans", "Trebuchet MS", sans-serif',
  monoFamily: '"SFMono-Regular", Consolas, "Liberation Mono", monospace',
  fontSize: {
    headingLarge: 'clamp(2rem, 5vw, 3.25rem)',
    headingMedium: 'clamp(1.45rem, 3vw, 2.25rem)',
    bodyLarge: '1rem',
    bodyMedium: '0.875rem',
    bodySmall: '0.75rem'
  },
  fontWeight: {
    regular: 400,
    medium: 600,
    bold: 800
  },
  lineHeight: {
    tight: 0.96,
    normal: 1.45,
    relaxed: 1.7
  }
}

const spacing = {
  xs: '4px',
  sm: '8px',
  md: '16px',
  lg: '24px',
  xl: '32px',
  xxl: '48px',
  xxxl: '80px'
}

const foundations = {
  typography,
  spacing,
  borderRadius: {
    small: '2px',
    medium: '4px',
    large: '8px',
    round: '50%'
  },
  breakpoints: {
    narrow: '480px',
    mobile: '768px',
    tablet: '1024px'
  },
  motion: {
    fast: '140ms',
    base: '260ms',
    slow: '700ms',
    easeOut: 'cubic-bezier(0.22, 1, 0.36, 1)',
    spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)'
  }
}

export const lightTheme = {
  ...foundations,
  mode: 'light',
  colors: {
    primary: '#C63E27',
    primaryHover: '#A92F1D',
    secondary: '#D7A928',
    destructive: '#B42318',
    success: '#276B4B',
    warning: '#8A5B00',
    focus: '#0A5BD8',
    background: '#F2EBDD',
    surface: '#FBF7EE',
    surfaceAlt: '#E7DDCC',
    ink: '#201D18',
    text: {
      primary: '#201D18',
      secondary: '#625B50'
    },
    white: '#FBF7EE',
    onPrimary: '#FFF9EF',
    border: '#B9AD99',
    borderStrong: '#201D18',
    shadow: {
      subtle: 'rgba(54, 42, 25, 0.09)',
      medium: 'rgba(54, 42, 25, 0.15)',
      strong: 'rgba(54, 42, 25, 0.24)'
    }
  },
  shadows: {
    subtle: '2px 2px 0 rgba(32, 29, 24, 0.10)',
    medium: '5px 5px 0 rgba(32, 29, 24, 0.16)',
    strong: '9px 9px 0 rgba(32, 29, 24, 0.22)'
  }
}

export const darkTheme = {
  ...foundations,
  mode: 'dark',
  colors: {
    primary: '#FF6B4A',
    primaryHover: '#FF896F',
    secondary: '#E6B84A',
    destructive: '#FF766F',
    success: '#78C99D',
    warning: '#F4C765',
    focus: '#75A7FF',
    background: '#171512',
    surface: '#211E19',
    surfaceAlt: '#2D2922',
    ink: '#F4ECDD',
    text: {
      primary: '#F4ECDD',
      secondary: '#C9BEAD'
    },
    white: '#211E19',
    onPrimary: '#171512',
    border: '#5E5548',
    borderStrong: '#F4ECDD',
    shadow: {
      subtle: 'rgba(0, 0, 0, 0.28)',
      medium: 'rgba(0, 0, 0, 0.40)',
      strong: 'rgba(0, 0, 0, 0.55)'
    }
  },
  shadows: {
    subtle: '2px 2px 0 rgba(0, 0, 0, 0.30)',
    medium: '5px 5px 0 rgba(0, 0, 0, 0.45)',
    strong: '9px 9px 0 rgba(0, 0, 0, 0.58)'
  }
}

export const theme = lightTheme
