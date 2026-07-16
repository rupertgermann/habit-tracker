// Preserved from design snapshot 7c9a357e5f9fb6191abb4640dd256eb8272a8b31.
import { createGlobalStyle } from 'styled-components'

export const GlobalStyles = createGlobalStyle`
  *, *::before, *::after {
    box-sizing: border-box;
  }

  * {
    margin: 0;
    padding: 0;
  }

  :root {
    color-scheme: ${props => props.theme.mode};
    --color-bg: ${props => props.theme.colors.background};
    --color-surface: ${props => props.theme.colors.surface};
    --color-surface-alt: ${props => props.theme.colors.surfaceAlt};
    --color-text: ${props => props.theme.colors.text.primary};
    --color-muted: ${props => props.theme.colors.text.secondary};
    --color-accent: ${props => props.theme.colors.primary};
    --color-focus: ${props => props.theme.colors.focus};
    --color-success: ${props => props.theme.colors.success};
    --color-warning: ${props => props.theme.colors.warning};
    --color-danger: ${props => props.theme.colors.destructive};
    --font-display: ${props => props.theme.typography.displayFamily};
    --font-body: ${props => props.theme.typography.fontFamily};
    --font-mono: ${props => props.theme.typography.monoFamily};
    --duration-fast: ${props => props.theme.motion.fast};
    --duration-base: ${props => props.theme.motion.base};
    --duration-slow: ${props => props.theme.motion.slow};
    --ease-out: ${props => props.theme.motion.easeOut};
    --ease-spring: ${props => props.theme.motion.spring};
  }

  html {
    min-width: 320px;
    background: ${props => props.theme.colors.background};
    scroll-behavior: smooth;
  }

  body {
    min-width: 320px;
    min-height: 100vh;
    font-family: ${props => props.theme.typography.fontFamily};
    background-color: ${props => props.theme.colors.background};
    background-image:
      radial-gradient(circle at 18% 12%, ${props => props.theme.colors.primary}0A 0 1px, transparent 1.5px),
      linear-gradient(90deg, ${props => props.theme.colors.text.primary}06 1px, transparent 1px),
      linear-gradient(${props => props.theme.colors.text.primary}04 1px, transparent 1px);
    background-size: 17px 17px, 48px 48px, 48px 48px;
    color: ${props => props.theme.colors.text.primary};
    font-size: 16px;
    line-height: ${props => props.theme.typography.lineHeight.normal};
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    overflow-x: hidden;
  }

  #root {
    min-height: 100vh;
    isolation: isolate;
  }

  ::selection {
    background: ${props => props.theme.colors.secondary};
    color: #201D18;
  }

  h1, h2, h3, h4, h5, h6 {
    font-family: ${props => props.theme.typography.displayFamily};
    font-weight: ${props => props.theme.typography.fontWeight.bold};
    line-height: ${props => props.theme.typography.lineHeight.tight};
    letter-spacing: -0.035em;
    text-wrap: balance;
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
    text-decoration-thickness: 1px;
    text-underline-offset: 0.22em;
    transition: color var(--duration-fast) ease;
  }

  a:hover {
    color: ${props => props.theme.colors.primaryHover};
  }

  button, input, textarea, select {
    font: inherit;
  }

  button {
    cursor: pointer;
    border: 0;
  }

  button:disabled, input:disabled, textarea:disabled, select:disabled {
    cursor: not-allowed;
    opacity: 0.48;
  }

  input, textarea, select {
    color: ${props => props.theme.colors.text.primary};
    background: ${props => props.theme.colors.surface};
    border: 1px solid ${props => props.theme.colors.border};
    border-radius: ${props => props.theme.borderRadius.small};
  }

  input::placeholder, textarea::placeholder {
    color: ${props => props.theme.colors.text.secondary};
    opacity: 0.72;
  }

  :focus-visible {
    outline: 3px solid ${props => props.theme.colors.focus};
    outline-offset: 3px;
  }

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

  .text-center { text-align: center; }
  .text-left { text-align: left; }
  .text-right { text-align: right; }
  .mb-sm { margin-bottom: ${props => props.theme.spacing.sm}; }
  .mb-md { margin-bottom: ${props => props.theme.spacing.md}; }
  .mb-lg { margin-bottom: ${props => props.theme.spacing.lg}; }
  .mt-sm { margin-top: ${props => props.theme.spacing.sm}; }
  .mt-md { margin-top: ${props => props.theme.spacing.md}; }
  .mt-lg { margin-top: ${props => props.theme.spacing.lg}; }

  .fade-in {
    animation: field-note-in var(--duration-slow) var(--ease-out) both;
  }

  @keyframes field-note-in {
    from { opacity: 0; transform: translateY(18px); }
    to { opacity: 1; transform: translateY(0); }
  }

  @media (max-width: 479px) {
    body { font-size: 15px; }
  }

  @media (min-width: 768px) {
    body { font-size: 16px; }
  }

  @media (min-width: 1024px) {
    body { font-size: 17px; }
  }

  @media (prefers-reduced-motion: reduce) {
    html { scroll-behavior: auto; }
    *, *::before, *::after {
      animation-duration: 0.01ms !important;
      animation-iteration-count: 1 !important;
      scroll-behavior: auto !important;
      transition-duration: 0.01ms !important;
    }
  }
`
