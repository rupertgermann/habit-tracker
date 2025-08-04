Goal
Design a clean, minimalist mobile app UI for a habit tracker and goal planner. The app helps users build habits, track streaks, and visualize progress in a motivating and distraction-free way. Output high-fidelity mobile screens and components ready for Lovable.

Deliverables
Mobile-first (iOS and Android), with tablet variations if needed.
Provide: Dashboard, Habits List, Calendar View, Habit Detail, Progress/Stats, Settings, and Add/Edit Habit flow.
Include component specs (names, states, props) so I can map them to code.

Visual Style
Aesthetic: Ultra-minimal, Apple Health meets Notion.

Palette:
Primary: #6CC47C (fresh green).
Secondary: #F6D860 (soft yellow), #F28A8A (muted red for streak breaks).
Background: #F9FAFB.
Text: #1A1A1A (primary), #6B7280 (secondary).
Shadows: Subtle, 2–4px blur.
Corners: 12px radius for cards, 8px for buttons.
Typography: Inter or SF Pro.
Headings: 20–24px bold.
Body: 14–16px regular.
Microcopy: 12–14px medium.
Icons: Rounded line icons, 2px stroke, consistent 24px grid.

Layout & Navigation
Bottom nav bar: Tabs for Dashboard, Habits, Calendar, Progress, Settings.
Main content: Card-based habit items, streak counters, circular progress indicators.
Padding: 20px outer, 16px inner. Spacing scale: 8px increments.
Responsive: On tablet, show split view (list left, detail right).

Core Components & Screens
Dashboard: Daily summary (completed vs pending habits), motivational card.
Habits List: Vertical cards with habit name, streak counter, check-off button.
Calendar View: Month heatmap (completion days), week toggle.
Habit Detail: Streak history timeline, edit habit.
Progress/Stats: Bar + circular charts showing success rate, longest streaks.
Add/Edit Habit Flow: Form with habit name, reminders, frequency, color/icon picker.
Empty States: Inspiring vector illustration + text (“Start your first habit today!”).

Data Visualization
Circular progress rings for daily completions.
Weekly bar charts (color-coded: green = complete, red = missed).
Tooltips on tap for details.
Interaction & Motion
Check-off: Bounce animation + micro-confetti (150ms ease-out).
Toasts: Slide up from bottom for success/alerts.
Sections: Smooth expand/collapse transitions.

Accessibility & Content
Contrast ratio: 4.5:1 for text.
All icons have aria-labels (e.g., “Mark habit complete”).
Tone: Encouraging microcopy (“You’re on a 5-day streak!”).

Constraints
No stock photos—vector illustrations or subtle emojis only.
Modular components (cards, charts, buttons) that are easy to re-order.
Provide component names + 1-line descriptions for each.

Output Format
Present screens/components in clear sections (Dashboard, Habits, etc.).
Include all hex codes, pixel sizes, and spacing values explicitly.
Use bullet lists for component states/props, e.g.,
HabitCard { title, streakCount, isChecked }.