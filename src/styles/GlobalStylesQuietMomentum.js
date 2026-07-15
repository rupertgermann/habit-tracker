// Preserved from design snapshot 24ddae65079ecdf2bbb8249c57b3c2b9df66d4f8.
import { createGlobalStyle } from 'styled-components'

export const GlobalStyles = createGlobalStyle`
  *, *::before, *::after { box-sizing: border-box; }
  * { margin: 0; padding: 0; }

  :root {
    color-scheme: ${props => props.theme.mode};
    --color-bg: ${props => props.theme.colors.background};
    --color-surface: ${props => props.theme.colors.surface};
    --color-surface-alt: ${props => props.theme.colors.surfaceAlt};
    --color-text: ${props => props.theme.colors.text.primary};
    --color-muted: ${props => props.theme.colors.text.secondary};
    --color-accent: ${props => props.theme.colors.primary};
    --color-signal: ${props => props.theme.colors.secondary};
    --color-focus: ${props => props.theme.colors.focus};
    --color-success: ${props => props.theme.colors.success};
    --color-warning: ${props => props.theme.colors.warning};
    --color-danger: ${props => props.theme.colors.destructive};
    --font-display: ${props => props.theme.typography.displayFamily};
    --font-body: ${props => props.theme.typography.fontFamily};
    --font-mono: ${props => props.theme.typography.monoFamily};
    --text-xs: .72rem; --leading-xs: 1.35;
    --text-sm: .86rem; --leading-sm: 1.5;
    --text-base: 1rem; --leading-base: 1.6;
    --text-lg: 1.28rem; --leading-lg: 1.28;
    --text-xl: clamp(2rem, 4vw, 3.4rem); --leading-xl: 1;
    --text-2xl: clamp(3.4rem, 9vw, 7.8rem); --leading-2xl: .92;
    --space-1: ${props => props.theme.spacing.xs}; --space-2: ${props => props.theme.spacing.sm};
    --space-3: ${props => props.theme.spacing.md}; --space-4: ${props => props.theme.spacing.lg};
    --space-6: ${props => props.theme.spacing.xl}; --space-8: ${props => props.theme.spacing.xxl};
    --radius-sm: ${props => props.theme.borderRadius.small}; --radius-md: ${props => props.theme.borderRadius.medium};
    --radius-lg: ${props => props.theme.borderRadius.large};
    --shadow-sm: ${props => props.theme.shadows.subtle}; --shadow-md: ${props => props.theme.shadows.medium};
    --shadow-lg: ${props => props.theme.shadows.strong};
    --duration-fast: ${props => props.theme.motion.fast}; --duration-base: ${props => props.theme.motion.base};
    --duration-slow: ${props => props.theme.motion.slow}; --ease-out: ${props => props.theme.motion.easeOut};
    --ease-spring: ${props => props.theme.motion.spring};
  }

  html { min-width: 320px; min-height: 100%; background: var(--color-bg); scroll-behavior: smooth; }
  body {
    min-width: 320px; min-height: 100vh; overflow-x: hidden;
    background:
      radial-gradient(circle at 90% 8%, ${props => props.theme.colors.secondary}18 0 9%, transparent 9.2%),
      radial-gradient(circle at 8% 78%, ${props => props.theme.colors.primary}0F 0 13%, transparent 13.2%),
      var(--color-bg);
    color: var(--color-text); font-family: var(--font-body); font-size: var(--text-base);
    line-height: var(--leading-base); -webkit-font-smoothing: antialiased;
  }
  #root { min-height: 100vh; isolation: isolate; }
  ::selection { background: var(--color-signal); color: #263028; }
  h1, h2, h3, h4, h5, h6 {
    color: var(--color-text); font-family: var(--font-display); font-weight: 500;
    line-height: var(--leading-xl); letter-spacing: -.035em; text-wrap: balance;
  }
  h1 { font-size: ${props => props.theme.typography.fontSize.headingLarge}; }
  h2 { font-size: ${props => props.theme.typography.fontSize.headingMedium}; }
  p { margin-bottom: var(--space-3); }
  a { color: var(--color-accent); text-decoration-thickness: 1px; text-underline-offset: .28em; }
  a:hover { color: ${props => props.theme.colors.primaryHover}; }
  button, input, textarea, select { font: inherit; }
  button { min-height: 44px; border: 0; cursor: pointer; }
  button:disabled, input:disabled, textarea:disabled, select:disabled { cursor: not-allowed; opacity: .48; }
  input, textarea, select { color: var(--color-text); background: var(--color-surface); border: 1px solid ${props => props.theme.colors.border}; border-radius: var(--radius-sm); }
  input::placeholder, textarea::placeholder { color: var(--color-muted); opacity: .82; }
  :focus-visible { outline: 3px solid var(--color-focus) !important; outline-offset: 4px !important; }
  .sr-only { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0,0,0,0); white-space: nowrap; border: 0; }
  .text-center { text-align: center; } .text-left { text-align: left; } .text-right { text-align: right; }
  .mb-sm { margin-bottom: var(--space-2); } .mb-md { margin-bottom: var(--space-3); } .mb-lg { margin-bottom: var(--space-4); }
  .mt-sm { margin-top: var(--space-2); } .mt-md { margin-top: var(--space-3); } .mt-lg { margin-top: var(--space-4); }
  .fade-in { animation: quiet-arrive var(--duration-slow) var(--ease-out) both; }
  @keyframes quiet-arrive { from { opacity: 0; transform: translateY(18px); } to { opacity: 1; transform: translateY(0); } }
  @media (max-width: 479px) { body { font-size: 15px; } }
  @media (min-width: 768px) { body { font-size: 16px; } }
  @media (min-width: 1200px) { body { font-size: 17px; } }
  @media (prefers-reduced-motion: reduce) {
    html { scroll-behavior: auto; }
    *, *::before, *::after { animation-duration: .01ms !important; animation-iteration-count: 1 !important; scroll-behavior: auto !important; transition-duration: .01ms !important; }
  }
`
