# Habit Tracker Design Specifications

## Art Direction

Habit Tracker uses a **field journal meets precision instrument** direction. The interface treats each completion as a mark in a durable personal record: editorial type, paper-like surfaces, inked rules, measured rhythm, and one decisive vermilion action color.

The design avoids generic productivity-dashboard conventions. Panels use hard edges, visible structure, and offset print-like shadows instead of soft floating cards. Copy is concise, observant, and rooted in the domain language from `CONTEXT.md`.

### Signature Element

The Dashboard's **Seven-day rhythm rail** is the primary signature. It turns weekly Completion data into seven vertical marks, highlights the current day in ochre, and pairs the plot with today's Completion rate, total Habits, and longest live Streak. It is functional evidence, not decoration.

The responsive navigation is the second spatial anchor:

- Mobile: a compact floating bottom dock.
- Wide layouts: a fixed left rail with the `R/7` rhythm-log mark.
- The current route is indicated by a vermilion field, inset keyline, and ochre edge marker.

## Design Tokens

Tokens live in `src/styles/theme.js`. Global CSS custom properties are exposed by `src/styles/GlobalStyles.js` for color, typography, motion, and component interoperability.

### Light Theme

| Role | Value | Use |
|---|---|---|
| Background | `#F2EBDD` | Warm paper field |
| Surface | `#FBF7EE` | Cards, controls, and inverse panels |
| Alternate surface | `#E7DDCC` | Hover and secondary layers |
| Primary text | `#201D18` | Ink, rules, navigation |
| Secondary text | `#625B50` | Metadata and helper copy |
| Primary | `#C63E27` | Completion, primary action, current route |
| Secondary | `#D7A928` | Current-day marker and field note |
| Focus | `#0A5BD8` | Keyboard focus ring |
| Success | `#276B4B` | Success semantics |
| Danger | `#B42318` | Destructive actions and errors |

### Dark Theme

| Role | Value | Use |
|---|---|---|
| Background | `#171512` | Ink-black page field |
| Surface | `#211E19` | Controls and cards |
| Alternate surface | `#2D2922` | Hover and secondary layers |
| Primary text | `#F4ECDD` | Warm paper text and inverse panels |
| Secondary text | `#C9BEAD` | Metadata and helper copy |
| Primary | `#FF6B4A` | Completion and primary action |
| Secondary | `#E6B84A` | Current-day and selection marker |
| Focus | `#75A7FF` | Keyboard focus ring |
| Success | `#78C99D` | Success semantics |
| Danger | `#FF766F` | Destructive actions and errors |

Dark calendar heatmap cells use explicit opaque vermilion-brown steps. Marked and unmarked days remain luminance-distinct, and text retains WCAG AA contrast intent.

### Typography

| Role | Stack | Character |
|---|---|---|
| Display | Iowan Old Style, Palatino, Book Antiqua, Georgia | Editorial authority and strong optical rhythm |
| Body | Avenir Next, Avenir, Gill Sans, Trebuchet MS | Humanist clarity for controls and content |
| Mono | SFMono-Regular, Consolas, Liberation Mono | Dates, indexes, counts, and instrument labels |

Headings use tight line height and negative letter spacing. Metadata uses uppercase mono text with deliberate tracking. Body copy uses a relaxed line height for journal and settings content.

### Shape, Depth, and Texture

- Small radii range from 2px to 8px; circles are reserved for progress and avatar semantics.
- Cards use a one-pixel rule and directional print-like shadows.
- The page background combines a subtle dot field with a 48px drafting grid.
- Depth stays consistent: borders establish structure; offset shadows establish elevation.
- Glass effects and blurred translucent panels are not used.

### Motion

- Fast feedback: `140ms`.
- Standard structural motion: `260ms`.
- Orchestrated entrance: `700ms`.
- Dashboard content enters as one measured sequence; weekly bars follow with a short stagger.
- Hover motion uses small translation, never ornamental floating.
- `prefers-reduced-motion` reduces animation and scrolling to immediate state changes.

## Application Shell

`src/App.jsx` provides a semantic `main`, a keyboard-visible skip link, and responsive space for the navigation dock or rail.

`src/components/BottomNavigation.jsx` exposes the six primary routes with semantic buttons, route-aware `aria-current`, full accessible names, and a minimum 44px mobile target. Visible labels collapse on the narrowest screens while accessible names remain intact.

## Core Components

### Button

- Primary: vermilion fill, high-contrast text, ink offset shadow.
- Secondary: ochre fill with ink text.
- Ghost: transparent with a ruled text edge.
- Destructive: danger fill with high-contrast text.
- States: default, hover, pressed, focus-visible, disabled, and loading.
- Mobile target height is at least 44px.

### Card

- Warm surface, one-pixel border, 4px nominal radius.
- Clickable cards translate against their directional shadow on hover and press.
- Elevated state increases the print offset instead of adding blur-heavy depth.

### Inputs and Selectors

- Surface background, visible border, integrated blue focus ring.
- Placeholder, error, disabled, and loading states stay within the same token system.
- Dropdown controls preserve a 48px control height where required by browser regression coverage.

### Empty, Loading, and Failure States

- Empty states use a ruled paper panel with a contextual next action.
- Dashboard loading uses animated ledger rules and `aria-busy`.
- API failure produces a branded offline panel with recovery copy and a retry action.
- Mutation failures use visible Toast feedback and preserve or restore prior state.

### Mood Controls

Journal mood choices use Tabler line icons and semantic labels. Emoji are normalized only for legacy stored icon compatibility; they are not used as interface icons.

## Primary Screens

### Dashboard

- Oversized editorial `Dashboard` heading with dated issue label.
- Inverse progress board with a conic Completion dial.
- Seven-day rhythm rail for weekly Completion evidence.
- Ochre field note with state-aware motivational copy.
- Ruled Today's Habits list with per-Habit color bars, quick Yes/No Completion, and Count Habit steppers.
- Calendar and Journal entry points authored as record extensions.

### Habits

- Ruled page header, filter tabs, category controls, and structured Habit rows.
- Habit color remains a user-controlled identifying signal.
- Add and quick-completion actions retain keyboard labels and touch-safe sizes.

### Calendar

- Week, month, and year Calendar Period controls.
- Habit selector, period navigation, heatmap, selected-day detail, and count legend.
- Ochre marks selection/today; vermilion intensity encodes Completion count.

### Progress

- Compact mobile summary keeps the Current Streak timeline usable above the dock.
- On wider screens, the timeline remains deliberately horizontally scrollable so the current day can be positioned at the live edge.
- Weekly and monthly plots use the same vermilion evidence language.

### Journal

- Week-scoped record with search, reflection cards, and line-icon Mood annotation.
- Copy and layout prioritize readable long-form reflection over dashboard density.

### Settings and Forms

- Profile, preferences, reminder, theme, and data controls use the shared ruled-card system.
- Destructive operations remain visually distinct and are never implied by color alone.

## Responsive Rules

The system is checked at three layout bands:

- Narrow mobile: `320px-479px`.
- Mobile/tablet: `480px-1023px`.
- Wide: `1024px+`.

The dashboard changes from a stacked record to an asymmetric two-column composition. The bottom dock becomes a fixed left rail at 1024px. Habit list/detail navigation switches to the tablet split view at the same threshold. Root overflow is prohibited at every band.

## Accessibility Requirements

- Semantic heading order, landmarks, and navigation labels.
- Keyboard-visible focus with a dedicated focus token.
- Skip link to the main content.
- `aria-current` on active navigation.
- Text alternatives for progress and weekly rhythm data.
- Minimum 44px touch targets on mobile.
- WCAG AA contrast intent for text, controls, and heatmap states.
- Reduced-motion fallback.
- Loading, empty, offline, validation, and mutation failure states are visible and recoverable.

## Extension Rules

- Use existing theme tokens before adding a new value.
- New data visuals should use ink structure, vermilion evidence, and ochre current-state emphasis.
- New cards need a clear information role; do not add generic dashboard tiles.
- New icons must come through `AppIcon` and the Tabler catalog.
- New copy should describe Habits, Completions, Daily Goals, Streaks, Calendar Periods, Journal Entries, Categories, and Moods using the vocabulary in `CONTEXT.md`.
- Preserve the paper/ink narrative in every loading, error, and empty state.
