const typography = {
  displayFamily: 'Fraunces, "Iowan Old Style", "Palatino Linotype", Georgia, serif',
  fontFamily: '"DM Sans", Avenir, "Segoe UI", sans-serif',
  monoFamily: '"DM Mono", "SFMono-Regular", Consolas, monospace',
  fontSize: {
    headingLarge: 'clamp(2.35rem, 6vw, 4.8rem)',
    headingMedium: 'clamp(1.8rem, 4vw, 3.2rem)',
    bodyLarge: '1.05rem',
    bodyMedium: '0.9rem',
    bodySmall: '0.76rem'
  },
  fontWeight: { regular: 400, medium: 500, bold: 600 },
  lineHeight: { tight: 0.93, normal: 1.6, relaxed: 1.78 }
}

const foundations = {
  typography,
  spacing: { xs: '6px', sm: '11px', md: '18px', lg: '28px', xl: '42px', xxl: '64px', xxxl: '96px' },
  borderRadius: { small: '10px', medium: '18px', large: '32px', round: '999px' },
  breakpoints: { narrow: '480px', mobile: '768px', tablet: '1024px' },
  motion: {
    fast: '150ms',
    base: '280ms',
    slow: '700ms',
    easeOut: 'cubic-bezier(0.16, 1, 0.3, 1)',
    spring: 'cubic-bezier(0.22, 1.25, 0.36, 1)'
  }
}

export const lightTheme = {
  ...foundations,
  mode: 'light',
  colors: {
    primary: '#526B54', primaryHover: '#3E5641', secondary: '#E4B75D',
    destructive: '#A9453D', success: '#526B54', warning: '#9A6728', focus: '#B6583F',
    background: '#F3EFE6', surface: '#FBF8F1', surfaceAlt: '#E7E3D8', ink: '#263028',
    text: { primary: '#263028', secondary: '#687067' },
    white: '#FBF8F1', onPrimary: '#FBF8F1', border: '#CEC9BC', borderStrong: '#7B8178',
    shadow: { subtle: 'rgba(44, 53, 45, 0.08)', medium: 'rgba(44, 53, 45, 0.13)', strong: 'rgba(44, 53, 45, 0.18)' }
  },
  shadows: {
    subtle: '0 1px 2px rgba(44, 53, 45, 0.07)',
    medium: '0 16px 40px rgba(44, 53, 45, 0.10)',
    strong: '0 28px 70px rgba(44, 53, 45, 0.14)'
  }
}

export const darkTheme = {
  ...foundations,
  mode: 'dark',
  colors: {
    primary: '#A9C2A5', primaryHover: '#C0D4BC', secondary: '#D6AE66',
    destructive: '#E18B7F', success: '#A9C2A5', warning: '#E4BD77', focus: '#E18B7F',
    background: '#171D18', surface: '#202821', surfaceAlt: '#2A332B', ink: '#EEF0E7',
    text: { primary: '#EEF0E7', secondary: '#AAB2A8' },
    white: '#202821', onPrimary: '#172019', border: '#424C43', borderStrong: '#778178',
    shadow: { subtle: 'rgba(0, 0, 0, 0.24)', medium: 'rgba(0, 0, 0, 0.38)', strong: 'rgba(0, 0, 0, 0.52)' }
  },
  shadows: {
    subtle: '0 1px 2px rgba(0, 0, 0, 0.22)',
    medium: '0 16px 40px rgba(0, 0, 0, 0.28)',
    strong: '0 28px 70px rgba(0, 0, 0, 0.4)'
  }
}

export const theme = lightTheme
