# Habit Tracker App - Design Specifications

## Design System Foundation

### Color Palette

| Color | Hex Code | Usage |
|-------|----------|-------|
| Primary Green | `#6CC47C` | Primary actions, progress indicators, active states |
| Soft Yellow | `#F6D860` | Secondary actions, highlights, warnings |
| Muted Red | `#F28A8A` | Streak breaks, errors, destructive actions |
| Background | `#F9FAFB` | App background, card backgrounds |
| Primary Text | `#1A1A1A` | Headings, primary content |
| Secondary Text | `#6B7280` | Secondary content, placeholders |
| White | `#FFFFFF` | Card backgrounds, button backgrounds |
| Border | `#E5E7EB` | Dividers, borders |

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
- Primary: `#6CC47C` background, white text
- Secondary: `#F6D860` background, `#1A1A1A` text
- Ghost: Transparent background, `#6CC47C` text
- Destructive: `#F28A8A` background, white text
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
- Default: White background, subtle shadow
- Elevated: Medium shadow
- Clickable: Hover effect with scale to 1.02
- Border: 1px solid `#E5E7EB`

**Specifications:**
- Background: `#FFFFFF`
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
- Default: Border `#E5E7EB`
- Focused: Border `#6CC47C`
- Error: Border `#F28A8A`
- Disabled: Background `#F9FAFB`, 50% opacity

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
- Default: White background, medium shadow
- Active item: `#6CC47C` icon and text

**Specifications:**
- Height: 80px (including safe area)
- Background: `#FFFFFF`
- Shadow: Medium
- Icon size: 24px
- Text: 12px medium
- Active color: `#6CC47C`
- Inactive color: `#6B7280`

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
   - Background: White with subtle shadow
   - Border radius: 12px
   - Height: 80px
   - Padding: 16px

2. `FilterTabs`
   - Props: `activeTab`, `onTabChange`
   - Three tabs with underline indicator
   - Active tab: `#6CC47C` text and indicator

**Specifications:**
- Outer padding: 20px
- Card spacing: 12px
- FAB: 56px diameter, `#6CC47C` background, plus icon

### Calendar View Screen

**Component Name:** `CalendarViewScreen`

**Description:** Calendar heatmap showing habit completion history.

**Layout:**
- Header: "Calendar" heading with month/year
- Toggle: Week/Month view
- Calendar Grid: Heatmap of completion days
- Legend: Color coding for completion levels

**Components:**
1. `CalendarHeatmap`
   - Props: `completionData`, `viewType` ("week" | "month")
   - Grid of day cells
   - Color intensity based on completion rate
   - Cell size: 40px
   - Cell spacing: 4px

2. `ViewToggle`
   - Props: `activeView`, `onViewChange`
   - Two segmented buttons
   - Active: `#6CC47C` background, white text

**Specifications:**
- Outer padding: 20px
- Cell colors:
  - No data: `#F3F4F6`
  - 0-25%: `#E0F2E3`
  - 26-50%: `#A8E0B1`
  - 51-75%: `#6CC47C`
  - 76-100%: `#4A9F5A`

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
- Profile Section: User avatar and name
- Settings Groups: Organized setting categories
- App Info: Version and links

**Components:**
1. `ProfileSection`
   - Props: `name`, `email`, `avatar`
   - Avatar, name, email
   - Edit profile button

2. `SettingsGroup`
   - Props: `title`, `items`
   - Section title with list of settings
   - Each setting: Icon, title, value, chevron

3. `SettingItem`
   - Props: `icon`, `title`, `value`, `type` ("toggle" | "navigate" | "action")
   - Left: Icon and title
   - Right: Value or toggle

**Specifications:**
- Outer padding: 20px
- Group spacing: 24px
- Item height: 56px
- Toggle switch: 48px width, 28px height

### Add/Edit Habit Flow

**Component Name:** `AddEditHabitFlow`

**Description:** Multi-step flow for creating or editing habits.

**Layout:**
- Header: "New Habit" or "Edit Habit" with back button
- Form Sections: Name, frequency, reminders, color, icon
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
   - Grid of icon options

**Specifications:**
- Outer padding: 20px
- Section spacing: 24px
- Color grid: 40px circles, 8px spacing
- Icon grid: 40px squares, 8px spacing

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
- Default color: `#6CC47C`
- Default background: `#E5E7EB`
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
- Completed color: `#6CC47C`
- Missed color: `#F28A8A`
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
- Default color: `#6CC47C`
- Default area opacity: 0.1
- Animation: 500ms ease-in-out

## Interaction Patterns and Animations

### Check-off Animation
- Scale to 1.2 on press
- Bounce back to 1.0 with 150ms ease-out
- Micro-confetti effect from check position
- Confetti particles: Small circles in `#6CC47C`, `#F6D860`, `#F28A8A`

### Toast Notifications
- Slide up from bottom (100px to 0)
- Duration: 3000ms
- Background: `#1A1A1A` with 90% opacity
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
- `SettingsScreen`: App preferences
- `AddEditHabitFlow`: Habit creation/editing

### Data Visualization
- `CircularProgress`: Circular completion indicator
- `BarChart`: Weekly completion bars
- `LineChart`: Trend visualization

### Utility Components
- `EmptyState`: Placeholder content
- `Toast`: Notification messages
- `FilterTabs`: Tabbed filtering
- `ViewToggle`: View switcher

This design specification provides a comprehensive foundation for implementing the habit tracker app in Lovable, with all necessary details for colors, typography, spacing, components, and interactions.