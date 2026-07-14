# Habit Tracker Design Specifications

## Art Direction: Signal Room

Habit Tracker presents recurring behavior as a live control circuit. The interface borrows the clarity of Swiss transit graphics and the material directness of an instrument panel: strong rules, oversized data, coded labels, hard-edged surfaces, and high-visibility signal color.

The system is intentionally neither a wellness dashboard nor a paper journal. Its voice is calm, exact, and operational. Habits are stations, completions are signals, and longer-term patterns are frequencies.

### Signature Element

The dashboard’s **habit circuit** is the defining interaction:

- Every Habit is a station on one continuous route.
- Yes/No Habit station markers are the Completion controls.
- Count Habits use the same route but expose their Count stepper as the station control.
- Completed stations energize the route with signal yellow.
- Station metadata communicates active/awaiting state and the current Streak.

This metaphor is functional: the visual line is also the primary daily input surface.

## Design Tokens

The source of truth is `src/styles/theme.js`, exposed as CSS custom properties by `src/styles/GlobalStyles.js`.

### Color

| Role | Light | Dark | Purpose |
|---|---:|---:|---|
| Background | `#E9EBE4` | `#0D100E` | Gridded application field |
| Surface | `#F8F9F4` | `#171B18` | Cards, controls, panels |
| Surface alternate | `#DDE0D7` | `#242A25` | Hover and inactive states |
| Primary | `#1546E8` | `#5C7CFF` | Navigation, progress, primary actions |
| Primary hover | `#0B2FB0` | `#8FA3FF` | Interactive feedback |
| Signal | `#E6F600` | `#E6F600` | Live Completion state and current day |
| Text | `#111411` | `#F2F4ED` | Primary content |
| Muted text | `#565C54` | `#AEB6AA` | Secondary content |
| Focus | `#E5482F` | `#FF795F` | Keyboard focus |
| Success | `#0A7652` | `#60D7AE` | Positive status |
| Warning | `#9B5D00` | `#FFC15C` | Warning status |
| Danger | `#D94132` | `#FF7869` | Errors and destructive actions |

Signal yellow always uses near-black text. Primary blue uses `onPrimary`, except the lighter dark-theme blue uses near-black in compact option controls to preserve WCAG contrast.

### Typography

| Role | Stack | Treatment |
|---|---|---|
| Display | Futura, Avenir Next Condensed, Century Gothic, Avantgarde | Uppercase, tightly tracked, heavy |
| Body | Optima, Candara, Avenir Next, Segoe UI | Quiet, readable, humanist |
| Data | Menlo, Monaco, Consolas, Liberation Mono | Uppercase labels, codes, dates, control text |

Display sizes use `clamp()` so the typographic hierarchy survives from 320px mobile screens to wide desktops. Body copy remains 15–17px depending on viewport.

### Geometry and Material

- Spacing scale: 5, 10, 16, 24, 36, 52, 88px.
- Radius is limited to 2–4px; route stations and true circular data marks may be round.
- Surfaces use 1–2px structural rules.
- Elevation is expressed with offset hard shadows, not soft floating blur.
- The page field uses a 32px technical grid and one low-opacity directional accent.
- Interactive surfaces move against their offset shadow on hover and return to the plane on press.

## Application Shell

### Desktop, 1024px and wider

- A fixed 184px control rail occupies the left edge.
- The cobalt brand block anchors the top of the rail.
- Navigation is a six-stop vertical route with index numbers.
- The active route uses a primary fill and a signal-yellow edge.
- A local-record status indicator anchors the bottom.
- Route content receives 184px left padding.

### Mobile and tablet, below 1024px

- Navigation becomes a fixed six-stop strip at the bottom.
- Each stop maintains a minimum 44px touch target.
- Content includes safe-area padding and never sits behind navigation.
- Labels remain visible at 320px, using tightly tuned mono sizing.

## Dashboard

### Header

- An operational eyebrow provides the current date code.
- `Dashboard` is the dominant typographic event.
- Desktop shows a separate day/month block.
- A signal-yellow rule marks the active edge.

### Daily Signal Console

The summary is a split instrument panel rather than a set of metric cards.

- The cobalt panel shows completion rate as an oversized score.
- A ten-cell meter provides a second, quickly scanned expression of the rate.
- The seven-day frequency panel renders one data cell per day.
- Cell fill height encodes completed Habits; signal yellow identifies today.
- Current Completions and top Streak remain visible as compact data readouts.

### Broadcast

The contextual message is a full-width signal-yellow transmission. Copy changes with Completion rate and Streak state. It always includes a direct route to Progress analytics.

### Today’s Circuit

- The section is one connected surface, not a stack of unrelated cards.
- Yes/No Habit markers toggle Completion without leaving the Dashboard.
- Count Habits expose 44px decrement/increment controls.
- Clicking the rest of a station opens Habit detail.
- The station grid reflows controls beneath metadata on narrow screens.

### Secondary Routes

Calendar and Journal are presented as two large directional controls. They use opposing surface/primary treatments while preserving the same border, shadow, and type grammar.

## Shared Components

### Button

- Primary: cobalt fill, `onPrimary` text, hard shadow.
- Secondary: signal-yellow fill, near-black text, hard shadow.
- Ghost: transparent with a bordered surface on hover.
- Destructive: danger fill and white text.
- Loading: current-color spinner and `aria-busy`.
- Disabled: reduced opacity, no hover movement, and `aria-disabled`.
- All standard buttons meet a 44px minimum touch target.

### Card

- Surface fill and one-pixel border.
- Elevated cards use the hard offset shadow and stronger border.
- Clickable cards translate up and left on hover, then return on press.
- Cards do not run independent entrance animations; screens own motion orchestration.

### Inputs and Selects

- 48px controls on surface fill.
- Mono uppercase labels.
- Focus adds a cobalt inset signal bar plus the global coral focus outline.
- Validation uses explicit danger copy below the control.
- Disabled controls retain their structure at reduced opacity.
- Select menus align directly beneath their trigger and match its width.

### Empty State

- Empty states are bordered instrument panels with a round signal marker.
- Copy explains what is absent and gives the next useful action.
- No emoji or emoticon iconography is used.

### Toast

- Status color is selected by success, error, warning, or info role.
- Toasts use a two-pixel structural border and hard shadow.
- Messages state the result and, on failure, the recovery action.

## Interaction States

Every interactive component supports:

- default;
- hover;
- pressed;
- visible keyboard focus;
- disabled;
- loading where asynchronous work occurs;
- error where persistence or validation can fail.

Habit Completion writes are optimistic but roll back on failure. The corresponding Toast reports the failed Habit by name.

## Loading, Empty, and Failure States

The Dashboard treats data states as part of the design:

- **Loading:** a scanning signal track and `aria-busy` while the local record opens.
- **Offline/error:** a bordered interruption panel explains that data was not changed and offers reconnect.
- **Empty:** a “Build your first circuit” panel explains what the first Habit will create.
- **Partial data:** available Habits render normally; counts and charts default safely to zero.

Other screens use the shared Empty State, Input errors, and Toast system. Silent failures and default browser error presentation are not accepted.

## Motion

- Dashboard sections enter in one short, ordered sequence.
- Completion controls use small transform feedback.
- Data and circuit state changes favor background, transform, and opacity.
- Motion is disabled to near-zero duration under `prefers-reduced-motion`.
- Functional content never depends on an animation completing.

## Accessibility

- Semantic headings, sections, navigation, buttons, lists, and status roles are used.
- The active navigation stop exposes `aria-current="page"`.
- Data graphics have concise accessible labels.
- Yes/No station buttons name both the action and Habit.
- Focus uses a three-pixel coral outline with offset.
- Light and dark palettes target WCAG AA contrast.
- Dark heatmap cells and selected dropdown options have dedicated contrast tests.
- Keyboard navigation reaches every action.

## Responsive Quality Gates

The design is verified at a minimum of:

- 320 × 720 mobile;
- 390 × 900 mobile;
- 768px tablet transition;
- 1280 × 900 desktop.

Automated smoke tests assert that primary routes do not cause root overflow. The mobile Progress summary compacts so the horizontal Streak timeline remains visible and mouse/touch draggable above fixed navigation.

## Extension Rules

When adding a screen or component:

1. Use existing theme and CSS tokens before adding a value.
2. Treat one dominant data point as the typographic anchor.
3. Use borders and offset shadows for depth.
4. Reserve signal yellow for live/current state.
5. Use mono labels for controls and metadata, not paragraphs.
6. Keep corners structural and nearly square.
7. Add loading, empty, error, disabled, and focus behavior with the first implementation.
8. Do not introduce emoji icons, glass cards, soft gradient blobs, or generic rounded dashboard tiles.
