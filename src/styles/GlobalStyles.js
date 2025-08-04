import { createGlobalStyle } from 'styled-components'

export const GlobalStyles = createGlobalStyle`
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  body {
    font-family: ${props => props.theme.typography.fontFamily};
    background-color: ${props => props.theme.colors.background};
    color: ${props => props.theme.colors.text.primary};
    line-height: ${props => props.theme.typography.lineHeight.normal};
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    overflow-x: hidden;
  }

  #root {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
  }

  h1, h2, h3, h4, h5, h6 {
    font-weight: ${props => props.theme.typography.fontWeight.bold};
    line-height: ${props => props.theme.typography.lineHeight.tight};
    margin-bottom: ${props => props.theme.spacing.sm};
  }

  h1 {
    font-size: ${props => props.theme.typography.fontSize.headingLarge};
  }

  h2 {
    font-size: ${props => props.theme.typography.fontSize.headingMedium};
  }

  p {
    margin-bottom: ${props => props.theme.spacing.md};
  }

  a {
    color: ${props => props.theme.colors.primary};
    text-decoration: none;
    transition: opacity 0.2s ease;

    &:hover {
      opacity: 0.8;
    }
  }

  button {
    font-family: inherit;
    cursor: pointer;
    border: none;
    outline: none;
    transition: transform 0.2s ease, box-shadow 0.2s ease;

    &:active {
      transform: scale(0.98);
    }

    &:disabled {
      cursor: not-allowed;
      opacity: 0.5;
    }
  }

  input, textarea {
    font-family: inherit;
    outline: none;
    border: 1px solid ${props => props.theme.colors.border};
    border-radius: ${props => props.theme.borderRadius.small};
    padding: ${props => props.theme.spacing.md};
    font-size: ${props => props.theme.typography.fontSize.bodyLarge};
    background-color: ${props => props.theme.colors.white};
    transition: border-color 0.2s ease;

    &:focus {
      border-color: ${props => props.theme.colors.primary};
    }

    &::placeholder {
      color: ${props => props.theme.colors.text.secondary};
    }
  }

  /* Mobile-first responsive design */
  @media (min-width: ${props => props.theme.breakpoints.mobile}) {
    body {
      font-size: ${props => props.theme.typography.fontSize.bodyLarge};
    }
  }

  @media (min-width: ${props => props.theme.breakpoints.tablet}) {
    /* Tablet styles */
    .app-container {
      max-width: 1024px;
      margin: 0 auto;
    }
  }

  /* Utility classes */
  .text-center {
    text-align: center;
  }

  .text-left {
    text-align: left;
  }

  .text-right {
    text-align: right;
  }

  .mb-sm {
    margin-bottom: ${props => props.theme.spacing.sm};
  }

  .mb-md {
    margin-bottom: ${props => props.theme.spacing.md};
  }

  .mb-lg {
    margin-bottom: ${props => props.theme.spacing.lg};
  }

  .mt-sm {
    margin-top: ${props => props.theme.spacing.sm};
  }

  .mt-md {
    margin-top: ${props => props.theme.spacing.md};
  }

  .mt-lg {
    margin-top: ${props => props.theme.spacing.lg};
  }

  /* Animation classes */
  .fade-in {
    animation: fadeIn 0.3s ease-in;
  }

  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateY(10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .bounce {
    animation: bounce 0.3s ease-out;
  }

  @keyframes bounce {
    0%, 20%, 50%, 80%, 100% {
      transform: translateY(0);
    }
    40% {
      transform: translateY(-10px);
    }
    60% {
      transform: translateY(-5px);
    }
  }

  /* Accessibility */
  .sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
  }

  /* Focus styles for keyboard navigation */
  *:focus-visible {
    outline: 2px solid ${props => props.theme.colors.primary};
    outline-offset: 2px;
  }
`