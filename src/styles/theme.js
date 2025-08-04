export const lightTheme = {
  colors: {
    primary: '#4CAF50', // Darker green for better contrast
    secondary: '#FFC107', // Darker yellow for better contrast
    destructive: '#F44336', // Darker red for better contrast
    background: '#FFFFFF', // Pure white for better contrast
    text: {
      primary: '#212121', // Darker text for better contrast
      secondary: '#424242' // Darker secondary text for better contrast
    },
    white: '#FFFFFF',
    border: '#BDBDBD', // Darker border for better contrast
    shadow: {
      subtle: 'rgba(0, 0, 0, 0.08)',
      medium: 'rgba(0, 0, 0, 0.12)',
      strong: 'rgba(0, 0, 0, 0.18)'
    }
  },
  typography: {
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    fontSize: {
      headingLarge: '24px',
      headingMedium: '20px',
      bodyLarge: '16px',
      bodyMedium: '14px',
      bodySmall: '12px'
    },
    fontWeight: {
      regular: 400,
      medium: 500,
      bold: 700
    },
    lineHeight: {
      tight: 1.2,
      normal: 1.4,
      relaxed: 1.5
    }
  },
  spacing: {
    xs: '4px',
    sm: '8px',
    md: '16px',
    lg: '20px',
    xl: '24px',
    xxl: '32px',
    xxxl: '48px'
  },
  borderRadius: {
    small: '8px',
    medium: '12px',
    large: '16px',
    round: '50%'
  },
  shadows: {
    subtle: '0 1px 2px rgba(0, 0, 0, 0.05)',
    medium: '0 2px 4px rgba(0, 0, 0, 0.1)',
    strong: '0 4px 8px rgba(0, 0, 0, 0.15)'
  },
  breakpoints: {
    mobile: '768px',
    tablet: '1024px'
  }
}

export const darkTheme = {
  colors: {
    primary: '#66BB6A', // Lighter green for better contrast on dark
    secondary: '#FFD54F', // Lighter yellow for better contrast on dark
    destructive: '#EF5350', // Lighter red for better contrast on dark
    background: '#121212', // Darker background for better contrast
    text: {
      primary: '#FFFFFF', // Pure white for better contrast
      secondary: '#E0E0E0' // Lighter secondary text for better contrast
    },
    white: '#1E1E1E',
    border: '#616161', // Lighter border for better contrast
    shadow: {
      subtle: 'rgba(0, 0, 0, 0.3)',
      medium: 'rgba(0, 0, 0, 0.4)',
      strong: 'rgba(0, 0, 0, 0.5)'
    }
  },
  typography: {
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    fontSize: {
      headingLarge: '24px',
      headingMedium: '20px',
      bodyLarge: '16px',
      bodyMedium: '14px',
      bodySmall: '12px'
    },
    fontWeight: {
      regular: 400,
      medium: 500,
      bold: 700
    },
    lineHeight: {
      tight: 1.2,
      normal: 1.4,
      relaxed: 1.5
    }
  },
  spacing: {
    xs: '4px',
    sm: '8px',
    md: '16px',
    lg: '20px',
    xl: '24px',
    xxl: '32px',
    xxxl: '48px'
  },
  borderRadius: {
    small: '8px',
    medium: '12px',
    large: '16px',
    round: '50%'
  },
  shadows: {
    subtle: '0 1px 2px rgba(0, 0, 0, 0.05)',
    medium: '0 2px 4px rgba(0, 0, 0, 0.1)',
    strong: '0 4px 8px rgba(0, 0, 0, 0.15)'
  },
  breakpoints: {
    mobile: '768px',
    tablet: '1024px'
  }
}

// Default theme
export const theme = lightTheme