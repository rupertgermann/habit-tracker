const typography = {
  displayFamily: 'Futura, "Avenir Next Condensed", "Century Gothic", Avantgarde, sans-serif',
  fontFamily: 'Optima, Candara, "Avenir Next", "Segoe UI", sans-serif',
  monoFamily: 'Menlo, Monaco, Consolas, "Liberation Mono", monospace',
  fontSize: {
    headingLarge: 'clamp(2.4rem, 6vw, 5rem)',
    headingMedium: 'clamp(1.45rem, 3vw, 2.4rem)',
    bodyLarge: '1rem',
    bodyMedium: '0.875rem',
    bodySmall: '0.72rem'
  },
  fontWeight: {
    regular: 400,
    medium: 600,
    bold: 800
  },
  lineHeight: {
    tight: 0.94,
    normal: 1.5,
    relaxed: 1.72
  }
}

const spacing = {
  xs: '5px',
  sm: '10px',
  md: '16px',
  lg: '24px',
  xl: '36px',
  xxl: '52px',
  xxxl: '88px'
}

const foundations = {
  typography,
  spacing,
  borderRadius: {
    small: '2px',
    medium: '2px',
    large: '4px',
    round: '999px'
  },
  breakpoints: {
    narrow: '480px',
    mobile: '768px',
    tablet: '1024px'
  },
  motion: {
    fast: '120ms',
    base: '240ms',
    slow: '620ms',
    easeOut: 'cubic-bezier(0.16, 1, 0.3, 1)',
    spring: 'cubic-bezier(0.2, 0.9, 0.2, 1.2)'
  }
}

export const lightTheme = {
  ...foundations,
  mode: 'light',
  colors: {
    primary: '#1546E8',
    primaryHover: '#0B2FB0',
    secondary: '#E6F600',
    destructive: '#D94132',
    success: '#0A7652',
    warning: '#9B5D00',
    focus: '#E5482F',
    background: '#E9EBE4',
    surface: '#F8F9F4',
    surfaceAlt: '#DDE0D7',
    ink: '#111411',
    text: {
      primary: '#111411',
      secondary: '#565C54'
    },
    white: '#F8F9F4',
    onPrimary: '#FFFFFF',
    border: '#A9AEA4',
    borderStrong: '#111411',
    shadow: {
      subtle: 'rgba(17, 20, 17, 0.10)',
      medium: 'rgba(17, 20, 17, 0.16)',
      strong: 'rgba(17, 20, 17, 0.26)'
    }
  },
  shadows: {
    subtle: '0 1px 0 rgba(17, 20, 17, 0.18)',
    medium: '6px 6px 0 rgba(17, 20, 17, 0.18)',
    strong: '10px 10px 0 rgba(17, 20, 17, 0.24)'
  }
}

export const darkTheme = {
  ...foundations,
  mode: 'dark',
  colors: {
    primary: '#5C7CFF',
    primaryHover: '#8FA3FF',
    secondary: '#E6F600',
    destructive: '#FF7869',
    success: '#60D7AE',
    warning: '#FFC15C',
    focus: '#FF795F',
    background: '#0D100E',
    surface: '#171B18',
    surfaceAlt: '#242A25',
    ink: '#F2F4ED',
    text: {
      primary: '#F2F4ED',
      secondary: '#AEB6AA'
    },
    white: '#171B18',
    onPrimary: '#FFFFFF',
    border: '#424A42',
    borderStrong: '#F2F4ED',
    shadow: {
      subtle: 'rgba(0, 0, 0, 0.30)',
      medium: 'rgba(0, 0, 0, 0.46)',
      strong: 'rgba(0, 0, 0, 0.62)'
    }
  },
  shadows: {
    subtle: '0 1px 0 rgba(255, 255, 255, 0.10)',
    medium: '6px 6px 0 rgba(0, 0, 0, 0.55)',
    strong: '10px 10px 0 rgba(0, 0, 0, 0.72)'
  }
}

export const theme = lightTheme
