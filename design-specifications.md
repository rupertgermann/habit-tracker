# Habit Tracker App - Design Specifications

## Design System Foundation

### Runtime Design Families

The app exposes five complete visual systems from Settings. The selected `design` is persisted through the SQLite-backed settings API, while light/dark mode remains an independent preference within every design.

| Design | Runtime id | Source snapshot | Direction |
|---|---|---|---|
| Standard | `standard` | `2bbc54a61644f1e0ccda4d474a04af2e42bc3932` | Friendly green mobile habit tracker |
| Rhythm Ledger | `rhythm-ledger` | `7c9a357e5f9fb6191abb4640dd256eb8272a8b31` | Field journal and precision instrument |
| Orbit | `orbit` | `7aec7cbf85c486775f68cb6c72fc4bc4897776b2` | Spatial command deck and orbital progress |
| Quiet Momentum | `quiet-momentum` | `24ddae65079ecdf2bbb8249c57b3c2b9df66d4f8` | Calm botanical editorial system |
| Sunday Club | `sunday-club` | `9e35ba2350cecc709ce01d5552a59d9d59e629fb` | Playful punch cards and bright weekend ink |

`src/App.jsx` switches the global texture, signature Dashboard, primary navigation, and desktop frame as one unit. `src/styles/designs.js` resolves each design's light/dark token pair. The detailed component specifications below describe the Standard baseline; the named variants retain the authored structures from their source snapshots.

### Color Palette

#### Light Theme

| Token | Hex Code | Usage |
|-------|----------|-------|
| Primary Green | `#4CAF50` | Primary actions, progress indicators, active states |
| Secondary Yellow | `#FFC107` | Secondary actions, highlights, warnings |
| Destructive Red | `#F44336` | Streak breaks, errors, destructive actions |
| Background | `#FFFFFF` | App background |
| Surface | `#FFFFFF` | Cards, inputs, and button surfaces |
| Primary Text | `#212121` | Headings, primary content |
| Secondary Text | `#424242` | Secondary content, placeholders |
| Border | `#BDBDBD` | Dividers, borders |

#### Dark Theme

| Token | Hex Code | Usage |
|-------|----------|-------|
| Primary Green | `#66BB6A` | Primary actions, progress indicators, active states |
| Secondary Yellow | `#FFD54F` | Secondary actions, highlights, warnings |
| Destructive Red | `#EF5350` | Errors and destructive actions |
| Background | `#121212` | App background |
| Surface | `#1E1E1E` | Cards, inputs, navigation, and controls |
| Primary Text | `#FFFFFF` | Headings, primary content |
| Secondary Text | `#E0E0E0` | Secondary content, placeholders |
| Border | `#616161` | Dividers, borders |

### Typography

| Type | Font | Size | Weight | Line Height | Usage |
|------|------|------|--------|-------------|-------|
| Heading Large | Inter/SF Pro | 24px | Bold | 1.2 | Screen titles |
| Heading Medium | Inter/SF Pro | 20px | Bold | 1.2 | Section headers |
| Body Large | Inter/SF Pro | 16px | Regular | 1.5 | Primary content |
| Body Medium | Inter/SF Pro | 14px | Regular | 1.4 | Secondary content |
| Body Small | Inter/SF Pro | 12px | Medium | 1.3 | Captions, microcopy |

### Spacing Scale

Based on 8px increments:
- 4px (0.5x) - Micro spacing
- 8px (1x) - Small spacing
- 16px (2x) - Default padding
- 20px (2.5x) - Outer padding
- 24px (3x) - Section spacing
- 32px (4x) - Large spacing
- 48px (6x) - Extra large spacing

### Shadows

| Shadow | Blur | Offset | Color | Usage |
|--------|------|--------|------|-------|
| Subtle | 2px | 0px 1px | rgba(0, 0, 0, 0.05) | Light elements |
| Medium | 4px | 0px 2px | rgba(0, 0, 0, 0.1) | Cards, buttons |
| Strong | 8px | 0px 4px | rgba(0, 0, 0, 0.15) | Floating elements |

### Border Radius

| Element | Radius |
|---------|--------|
| Cards | 12px |
| Buttons | 8px |
| Inputs | 8px |
| Avatars | 50% |

## Core UI Components

### Button

**Component Name:** `Button`

**Description:** A versatile button component for primary and secondary actions.

**Props:**
- `variant`: "primary" | "secondary" | "ghost" | "destructive"
- `size`: "small" | "medium" | "large"
- `disabled`: boolean
- `icon`: string (optional)
- `loading`: boolean (optional)

**States:**
- Default: Background based on variant
- Hover: Slightly darker background
- Pressed: Scale to 0.98
- Disabled: 50% opacity
- Loading: Show spinner

**Specifications:**
- Primary: theme primary background, white text
- Secondary: theme secondary background, primary text
- Ghost: transparent background, theme primary text
- Destructive: theme destructive background, white text
- Small: 32px height, 12px horizontal padding
- Medium: 40px height, 16px horizontal padding
- Large: 48px height, 20px horizontal padding

### Card

**Component Name:** `Card`

**Description:** A container component with subtle shadow and rounded corners.

**Props:**
- `padding`: "none" | "small" | "medium" | "large"
- `elevated`: boolean
- `clickable`: boolean
- `border`: boolean

**States:**
- Default: theme surface background, subtle shadow
- Elevated: Medium shadow
- Clickable: Hover effect with scale to 1.02
- Border: 1px solid theme border

**Specifications:**
- Background: theme surface color
- Border radius: 12px
- Padding: Based on prop (none: 0, small: 12px, medium: 16px, large: 24px)
- Shadow: Based on elevated prop

### Input

**Component Name:** `Input`

**Description:** A text input field with label and optional error message.

**Props:**
- `label`: string
- `placeholder`: string
- `value`: string
- `error`: string (optional)
- `disabled`: boolean
- `type`: "text" | "email" | "password" | "number"

**States:**
- Default: theme border
- Focused: theme primary border
- Error: theme destructive border
- Disabled: theme background, 50% opacity

**Specifications:**
- Height: 48px
- Border radius: 8px
- Border: 1px solid
- Padding: 0 16px
- Font: 16px regular

### Bottom Navigation

**Component Name:** `BottomNavigation`

**Description:** Fixed bottom navigation bar with tab items.

**Props:**
- `items`: Array of { label: string, icon: string, active: boolean }
- `onTabChange`: function

**States:**
- Default: theme surface background, medium shadow
- Active item: theme primary icon and text

**Specifications:**
- Height: 80px (including safe area)
- Background: theme surface color
- Shadow: Medium
- Icon size: 24px
- Text: 12px medium
- Active color: theme primary
- Inactive color: theme secondary text
- Items: Dashboard, Habits, Calendar, Journal, Progress, Settings

## Screen Designs

### Dashboard Screen

**Component Name:** `DashboardScreen`

**Description:** Home screen showing daily summary and motivational content.

**Layout:**
- Header: "Today" heading with date
- Daily Summary Card: Circular progress indicator with completion stats
- Motivational Card: Encouraging message based on progress
- Recent Habits: List of today's habits with quick check-off

**Components:**
1. `DailySummaryCard`
   - Props: `completedCount`, `totalCount`, `streakCount`
   - Circular progress ring (70% of card width)
   - Center text: "5/7 habits"
   - Bottom text: "3 day streak 🔥"

2. `MotivationalCard`
   - Props: `message`, `type` ("encouragement" | "milestone" | "reminder")
   - Background gradient based on type
   - Icon and message text

3. `HabitPreviewList`
   - Props: `habits` (array of habit objects)
   - Horizontal scrollable list
   - Each item: Habit name, check button, streak count

**Specifications:**
- Outer padding: 20px
- Card spacing: 16px
- Daily Summary Card: 200px height
- Motivational Card: 120px height
- Habit Preview: 100px height each

### Habits List Screen

**Component Name:** `HabitsListScreen`

**Description:** Screen showing all user habits in a vertical list.

**Layout:**
- Header: "Habits" heading with add button
- Filter Tabs: "All", "Active", "Completed"
- Habits List: Vertical cards with habit details
- Floating Action Button: Add new habit

**Components:**
1. `HabitCard`
   - Props: `id`, `title`, `streakCount`, `isChecked`, `color`, `icon`
   - Left: Icon and habit name
   - Right: Streak count and check button
   - Background: theme surface with subtle shadow
   - Border radius: 12px
   - Height: 80px
   - Padding: 16px

2. `FilterTabs`
   - Props: `activeTab`, `onTabChange`
   - Three tabs with underline indicator
   - Active tab: theme primary text and indicator

**Specifications:**
- Outer padding: 20px
- Card spacing: 12px
- FAB: 56px diameter, theme primary background, plus icon

### Calendar View Screen

**Component Name:** `CalendarViewScreen`

**Description:** Calendar heatmap showing habit completion history.

**Layout:**
- Header: "Calendar" heading with month/year
- Toggle: Week/Month/Year view
- Habit selector for focusing one habit
- Calendar grid or contribution-style year heatmap
- Selected-day details card with same-day habit action
- Legend: count intensity levels

**Components:**
1. `CalendarHeatmap`
   - Props: `completionData`, `viewType` ("week" | "month" | "year")
   - Grid of day cells
   - Color intensity based on logged count
   - Cell size: 40px
   - Cell spacing: 4px

2. `ViewToggle`
   - Props: `activeView`, `onViewChange`
   - Three segmented buttons
   - Active: theme surface/primary state

**Specifications:**
- Outer padding: 20px
- Cell intensity levels: 0, 1, 2-3, 4-6, 7+
- Dark mode uses opaque surface and heatmap colors with readable text contrast
- Week layout follows the Settings week-start preference

### Habit Detail Screen

**Component Name:** `HabitDetailScreen`

**Description:** Detailed view of a single habit with history and stats.

**Layout:**
- Header: Habit name with edit button
- Stats Overview: Current streak, completion rate, total completions
- Streak Timeline: Visual history of consecutive days
- Action Buttons: Edit, delete, pause

**Components:**
1. `HabitStats`
   - Props: `currentStreak`, `longestStreak`, `completionRate`, `totalCompletions`
   - Three stat cards in a row
   - Each card: Icon, value, label

2. `StreakTimeline`
   - Props: `streakData`
   - Horizontal scrollable timeline
   - Each day: Circle with completion status
   - Connected with lines

3. `HabitActions`
   - Props: `onEdit`, `onDelete`, `onPause`
   - Three buttons in a column
   - Icons and labels

**Specifications:**
- Outer padding: 20px
- Stats card: 100px height, 1/3 width
- Timeline height: 120px
- Action button: 48px height

### Progress/Stats Screen

**Component Name:** `ProgressStatsScreen`

**Description:** Analytics screen showing overall progress and statistics.

**Layout:**
- Header: "Progress" heading with time period selector
- Overview Cards: Total habits, completion rate, current streak
- Charts: Weekly completion bar chart, monthly trend
- Insights: Key achievements and recommendations

**Components:**
1. `OverviewCards`
   - Props: `totalHabits`, `completionRate`, `currentStreak`
   - Three cards in a row
   - Large numbers with labels

2. `WeeklyBarChart`
   - Props: `weeklyData`
   - Bar chart for each day of week
   - Green for completed, red for missed
   - Height: 200px

3. `MonthlyTrendChart`
   - Props: `monthlyData`
   - Line chart showing completion rate over time
   - Height: 200px

4. `InsightsCard`
   - Props: `insights`
   - List of achievement cards
   - Icon, title, description

**Specifications:**
- Outer padding: 20px
- Card spacing: 16px
- Chart height: 200px each

### Settings Screen

**Component Name:** `SettingsScreen`

**Description:** App settings and preferences.

**Layout:**
- Header: "Settings" heading
- Profile section: avatar, name, email, photo actions, and edit controls
- Appearance group: five-design visual picker and dark mode toggle
- Preferences group: notifications, reminder time, and week-start selector
- Data group: JSON export, CSV export, backup, restore, and clear-all action
- App info: version plus Privacy, Terms, and Support links

**Components:**
1. `ProfileSection`
   - Props: `name`, `email`, `avatar`
   - Avatar image or initial
   - Name and email
   - Photo, remove photo, edit, save, and cancel actions

2. `SettingsGroup`
   - Props: `title`, `items`
   - Section title with list of settings
   - Each setting: icon, title, description, value, control, or chevron

3. `SettingItem`
   - Props: `icon`, `title`, `description`, `value`, `type` ("toggle" | "time" | "select" | "navigate" | "action")
   - Left: Icon and title
   - Right: value, toggle, time input, select dropdown, or chevron

**Specifications:**
- Outer padding: 20px
- Group spacing: 24px
- Item height: 56px
- Toggle switch: 48px width, 28px height
- Reminder time input and week-start dropdown share stable widths
- Dark-mode time input uses an app-rendered clock glyph
- Profile and preference settings persist through the database

### Add/Edit Habit Flow

**Component Name:** `AddEditHabitFlow`

**Description:** Multi-step flow for creating or editing habits.

**Layout:**
- Header: "New Habit" or "Edit Habit" with back button
- Form Sections: name, description, type, daily goal, frequency, category, reminders, color, icon
- Action Buttons: Cancel and Save

**Components:**
1. `HabitNameInput`
   - Props: `value`, `onChange`
   - Text input with placeholder
   - Character counter

2. `FrequencySelector`
   - Props: `frequency`, `onChange`
   - Options: Daily, Weekly, Custom
   - Custom days selector

3. `ReminderPicker`
   - Props: `reminders`, `onAdd`, `onRemove`
   - List of time pickers
   - Add reminder button

4. `ColorIconPicker`
   - Props: `selectedColor`, `selectedIcon`, `onColorChange`, `onIconChange`
   - Grid of color options
   - Searchable grouped Tabler icon picker
   - Legacy icon values remain renderable when editing older data

**Specifications:**
- Outer padding: 20px
- Section spacing: 24px
- Color grid: 40px circles, 8px spacing
- Icon grid: 40px squares, 8px spacing
- Count habits expose a daily goal field
- Yes/No habits hide the daily goal field

### Empty States

**Component Name:** `EmptyState`

**Description:** Placeholder content when no data is available.

**Props:**
- `type`: "habits" | "dashboard" | "calendar" | "progress"
- `title`: string
- `description`: string
- `actionLabel`: string
- `onAction`: function

**Specifications:**
- Illustration: 200px height
- Title: 20px bold
- Description: 16px regular, `#6B7280` color
- Action button: Primary variant
- Padding: 40px 20px

**Variants:**
1. Habits Empty: "Start your first habit today!"
2. Dashboard Empty: "Track your progress here"
3. Calendar Empty: "Your calendar will appear here"
4. Progress Empty: "Complete habits to see your stats"

## Data Visualization Components

### CircularProgress

**Component Name:** `CircularProgress`

**Description:** Circular progress indicator for completion rates.

**Props:**
- `progress`: number (0-100)
- `size`: number
- `strokeWidth`: number
- `color`: string
- `backgroundColor`: string
- `showPercentage`: boolean

**Specifications:**
- Default size: 120px
- Default stroke width: 8px
- Default color: theme primary
- Default background: theme border/background contrast color
- Animation: 500ms ease-in-out

### BarChart

**Component Name:** `BarChart`

**Description:** Vertical bar chart for weekly completion data.

**Props:**
- `data`: Array of { day: string, completed: number, missed: number }
- `height`: number
- `barWidth`: number
- `spacing`: number

**Specifications:**
- Default height: 200px
- Default bar width: 24px
- Default spacing: 8px
- Completed color: theme primary
- Missed color: theme destructive
- Animation: 300ms ease-out

### LineChart

**Component Name:** `LineChart`

**Description:** Line chart for trend visualization.

**Props:**
- `data`: Array of { date: string, value: number }
- `height`: number
- `color`: string
- `showDots`: boolean
- `showArea`: boolean

**Specifications:**
- Default height: 200px
- Default color: theme primary
- Default area opacity: 0.1
- Animation: 500ms ease-in-out

## Interaction Patterns and Animations

### Check-off Animation
- Scale to 1.2 on press
- Bounce back to 1.0 with 150ms ease-out
- Micro-confetti effect from check position
- Confetti particles: Small circles using theme primary, secondary, and destructive colors

### Toast Notifications
- Slide up from bottom (100px to 0)
- Duration: 3000ms
- Background: high-contrast dark surface with 90% opacity
- Text: `#FFFFFF`
- Height: 48px
- Padding: 0 16px
- Border radius: 24px

### Expand/Collapse Transitions
- Height animation with 300ms ease-in-out
- Rotate chevron icon 180deg
- Opacity fade for content

### Page Transitions
- Slide in from right (forward) or left (back)
- Duration: 200ms ease-in-out
- Parallel fade animation

## Accessibility Considerations

### Color Contrast
- All text meets 4.5:1 contrast ratio
- Interactive elements have 3:1 contrast ratio
- Tested with both light and dark backgrounds

### Screen Reader Support
- All icons have aria-labels
- Form inputs have proper labels
- Buttons have descriptive text
- Live regions for dynamic content

### Keyboard Navigation
- Tab order follows visual layout
- Focus indicators visible
- Shortcuts for common actions
- Skip to content link

### Touch Targets
- Minimum 44px height for all interactive elements
- 8px spacing between touch targets
- Visual feedback on touch

## Component Specifications Summary

### Core Components
- `Button`: Versatile action button with variants
- `Card`: Container with shadow and rounded corners
- `Input`: Text input with label and validation
- `BottomNavigation`: Fixed tab navigation

### Screen Components
- `DashboardScreen`: Home with daily summary
- `HabitsListScreen`: Vertical habit cards
- `CalendarViewScreen`: Heatmap calendar
- `HabitDetailScreen`: Individual habit details
- `ProgressStatsScreen`: Analytics and charts
- `JournalScreen`: Weekly reflection timeline with mood and search
- `SettingsScreen`: App preferences
- `InfoPage`: Privacy, terms, and support content
- `AddEditHabitFlow`: Habit creation/editing

### Data Visualization
- `CircularProgress`: Circular completion indicator
- `BarChart`: Weekly completion bars
- `LineChart`: Trend visualization

### Utility Components
- `AppIcon`: Tabler icon renderer with legacy fallback
- `CountStepper`: Increment/decrement control for count habits
- `EmptyState`: Placeholder content
- `SelectDropdown`: Accessible custom select control
- `StreakVisualization`: Streak milestones and timeline
- `Toast`: Notification messages
- `FilterTabs`: Tabbed filtering
- `ViewToggle`: View switcher

This design specification describes the current Habit Tracker interface, theme system, components, screens, interactions, responsive behavior, and accessibility expectations.
