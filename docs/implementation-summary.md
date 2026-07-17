# Habit Tracker App - Implementation Summary

## Overview

Habit Tracker is a mobile-first React app backed by an Express API and a local SQLite database. It supports yes/no habits, count habits, streaks, calendar heatmaps, progress analytics, journaling, profile settings, five switchable design systems, dark mode, data export/restore, and browser-tested responsive layouts.

The original product brief lives in `docs/prompt.md`; the current UI specification lives in `design-specifications.md`.

## Product Surface

### Dashboard

- **Location**: `src/screens/Dashboard.jsx`, `src/screens/DashboardRhythmLedger.jsx`, `src/screens/DashboardOrbit.jsx`, `src/screens/DashboardQuietMomentum.jsx`, `src/screens/DashboardSundayClub.jsx`
- Shows total habits, today's completion rate, circular progress, motivational messaging, today's habits, weekly overview, and journal entry point.
- Supports binary check-off and count-habit steppers from the same daily list.
- Uses `Confetti`, `ToastContext`, and `CircularProgress` for feedback and completion celebrations.
- `src/domain/dashboardHabitTracking.js` supplies every dashboard with the same Habit, Completion, Streak, weekly, and semantic milestone facts.
- Each dashboard keeps its authored wording, layout, motion, and feedback rendering while `src/appDesign/catalog.jsx` selects its complete design registration.

### Habit Management

- **Location**: `src/screens/AddEditHabit.jsx`, `src/screens/HabitsList.jsx`, `src/screens/HabitDetail.jsx`
- Habits support name, description, category, color, icon, frequency, reminders, type, and optional daily goal.
- Yes/no habits store one completion per date; count habits store multiple completions per date.
- Habit detail renders range stats, streak visualization, completion history, and journal reflection controls.
- Tablet-sized viewports use `src/components/TabletSplitView.jsx` for list/detail navigation.

### Icon System

- **Location**: `src/components/AppIcon.jsx`, `src/domain/iconCatalog.js`
- Habit and category icons use Tabler Icons React.
- The icon catalog groups options by essentials, health, food, learning, work, home, creativity, and social themes.
- Search and group tabs make the Add/Edit Habit icon picker usable with a large icon set.
- Legacy emoji and one-letter icon values render safely through normalization and fallback helpers.

### Calendar

- **Location**: `src/screens/CalendarView.jsx`
- Per-habit calendar periods include week, month, and year.
- Month and year views render a count heatmap with intensity levels for 0, 1, 2-3, 4-6, and 7+ completions.
- Day cells expose click/tap details and a same-day action for marking a habit incomplete.
- Week-start preference flows through `PreferencesContext` into calendar and journal date calculations.
- Dark-mode heatmap colors use explicit opaque values so marked and unmarked cells remain distinguishable.

### Progress & Streaks

- **Location**: `src/screens/ProgressStats.jsx`, `src/components/StreakVisualization.jsx`
- Progress includes total habits, completion rate, current streak, longest streak, weekly bar data, monthly trend data, and insight cards.
- Streak calculations live in `src/domain/habitTracking.js` and count consecutive active days ending at the reference day.

### Journal

- **Location**: `src/screens/JournalView.jsx`, `src/components/JournalEntry.jsx`, `src/domain/journalTimeline.js`, `src/domain/journalEntryWrites.js`
- Journal entries connect to habits by `habitId`, date, content, and mood.
- Weekly timeline data is scoped to the selected week and follows the configured week-start preference.
- Search matches entry content and habit names while staying within the active week.
- Create, update, and delete return committed results through one injected persistence interface; same-entry writes serialize and failures restore exact shared state before the editor reports failure.

### Settings, Profile, and Preferences

- **Location**: `src/screens/Settings.jsx`, `src/context/ThemeContext.jsx`, `src/context/PreferencesContext.jsx`
- Profile settings include name, email, image avatar upload, and avatar removal.
- Design, theme, and week-start preferences are stored in the database through `/api/settings/:key`.
- The Appearance picker switches between Standard, Rhythm Ledger, Orbit, Quiet Momentum, and Sunday Club while preserving an independent light/dark choice.
- Legacy `localStorage` profile, theme, and week-start values are removed so the database remains the source of truth.
- Reminder controls use the browser Notification API and a themed time-input clock glyph.
- Settings links route to app-local Privacy, Terms, and Support pages in `src/screens/InfoPage.jsx`.

### Data Management

- **Location**: `src/domain/backup.js`, `src/adapters/browserBackup.js`, `src/api/backupPersistence.js`, `src/screens/Settings.jsx`, `server/db.js`
- JSON export downloads habit data.
- CSV export downloads completion rows.
- Canonical format-version `2` backup reads `/api/state` and preserves every Habit, Category, Journal Entry, and persisted settings key, including unknown future keys.
- Restore validates before confirmation or mutation, supports canonical version `2` and legacy version `1.0.0`, and supplies safe defaults for omitted legacy Categories and settings.
- `POST /api/restore` replaces complete state in one SQLite transaction and returns the authoritative committed result; a controlled reload occurs only after success.
- Browser file selection and download behavior are isolated from backup format, validation, and migration rules.
- Clear-all uses `DELETE /api/data` and re-seeds default categories.

## Technical Architecture

### Frontend

- `src/App.jsx` defines routes and provider order.
- `src/api/habitsApi.js` centralizes REST requests.
- `src/context/HabitsContext.jsx` owns Habit, Category, Completion, and Journal Entry state and injects production persistence into the shared writers.
- `src/domain/habitTracking.js` and `src/domain/journalTimeline.js` provide pure Habit, Completion, Streak, Calendar Period, and timeline calculations.
- `src/domain/dashboardHabitTracking.js` composes those calculations with the persistence-aware Completion writer, settles in-flight Completion writes, and returns committed dashboard outcomes.
- `src/domain/journalEntryWrites.js` coordinates injected Journal Entry persistence, state replacement, same-entry ordering, exact rollback, and caller results.
- `src/domain/backup.js` coordinates injected persisted-state reads and restore writes around canonical validation and legacy migration; browser file effects stay in `src/adapters/browserBackup.js`.
- `shared/defaultCategories.json` keeps first-run and legacy-restore Category defaults identical.
- `src/appDesign/catalog.jsx` registers metadata, previews, themes, global styles, dashboards, primary navigation, and responsive frames for all five designs.
- `src/context/ThemeContext.jsx` owns persisted design and light/dark state and resolves both through the catalog.
- `src/context/PreferencesContext.jsx` owns calendar and journal week-start preference.
- `src/context/NavigationContext.jsx` keeps bottom navigation in sync with routes.
- `src/styles/theme*.js` and `src/styles/GlobalStyles*.js` preserve each design's tokens, typography, focus styles, texture, and responsive rules.

### Backend

- `server/index.js` exposes the REST API on `127.0.0.1:3301` by default.
- `server/db.js` initializes SQLite, enables WAL mode and foreign keys, seeds default categories, provides JSON row helpers, and owns transactional complete-state restore with the authoritative `{ ok, state }` result.
- The database path defaults to `server/data/habit-tracker.db` and can be overridden with `HABIT_TRACKER_DB_PATH`.
- Tables:
  - `habits`
  - `categories`
  - `journal_entries`
  - `settings`

### Development Server

- Vite runs on `3300` by default.
- Vite proxies `/api` to `http://127.0.0.1:${PORT || 3301}` unless `VITE_API_TARGET` is set.
- The e2e harness uses `3340/3341` with `.tmp/e2e/habit-tracker.db`.
- The screenshot harness uses `3330/3331` with `.tmp/screenshots/habit-tracker.db`.

## API Endpoints

| Method & Path | Purpose |
|---|---|
| `GET /api/state` | Full app state including settings. |
| `GET /api/runtime` | Runtime marker for test reset safety. |
| `GET /api/settings/:key` | Read one database-backed setting. |
| `PUT /api/settings/:key` | Persist one database-backed setting. |
| `POST /api/habits` | Create a habit. |
| `PUT /api/habits/:id` | Update a habit. |
| `DELETE /api/habits/:id` | Delete a habit and its journal entries. |
| `POST /api/categories` | Create a category. |
| `PUT /api/categories/:id` | Update a category. |
| `DELETE /api/categories/:id` | Delete a category. |
| `POST /api/journal` | Create a journal entry. |
| `PUT /api/journal/:id` | Update a journal entry. |
| `DELETE /api/journal/:id` | Delete a journal entry. |
| `POST /api/restore` | Atomically replace complete app state and return the authoritative committed result. |
| `DELETE /api/data` | Clear app data and re-seed default categories. |

## Commands

| Command | Purpose |
|---|---|
| `npm run dev` | Start API and client on `3301/3300`. |
| `npm run server` | Start only the API on `3301`. |
| `npm run dev:client` | Start only Vite on `3300`. |
| `npm run dev:e2e` | Start the isolated e2e runtime on `3341/3340`. |
| `npm run test:domain` | Run domain and context tests through Vite SSR. |
| `npm run test:server` | Run transactional SQLite server tests. |
| `npm run test:e2e` | Run Playwright tests against the isolated e2e runtime. |
| `npm run test` | Run domain, server, and e2e tests. |
| `npm run screenshots` | Generate README screenshots from seeded example data. |
| `npm run build` | Build the production bundle. |
| `npm run preview` | Preview the production bundle. |

## Testing

### Domain and Context Tests

- **Location**: `tests/domain/`, `tests/context/`, `scripts/run-domain-tests.mjs`
- Covers dashboard projections and semantic outcomes, persistence-aware Completion and Journal Entry writes, App Design catalog completeness, canonical backup validation and legacy migration, Habit date/Streak rules, journal timelines, and preference normalization.

### Server Tests

- **Location**: `tests/server/`
- Prove atomic Habit deletion and complete backup restore, including forced SQLite failures that must preserve exact previous state.

### Browser Tests

- **Location**: `tests/e2e/`, `playwright.config.js`, `scripts/run-e2e-dev.mjs`
- Uses a temp SQLite database under `.tmp/e2e`.
- Verifies the runtime marker before destructive reset/restore operations.
- Covers cross-design Completion persistence, reload, failure rollback, and confetti suppression; every App Design in light and dark mode across reloads; every design dashboard at mobile and desktop sizes; committed Journal Entry create/update/delete behavior; canonical and legacy backup/restore including visible failure preservation; invalid-file rejection; profile/avatar settings; dark calendar contrast; and responsive smoke coverage.

### Documentation Screenshots

- **Location**: `scripts/capture-readme-screenshots.mjs`, `docs/images/`
- Seeds example habits and journal entries into `.tmp/screenshots/habit-tracker.db`.
- Captures light dashboard, dark dashboard, and dark calendar screenshots for the README.

## Accessibility and Responsive Behavior

- Interactive controls use labels, focus styles, and keyboard-reachable elements.
- The bottom navigation supports the main mobile routes.
- Wide viewports switch habit list/detail workflows into a split layout.
- Playwright smoke tests assert no root overflow across mobile and desktop viewports.
- Dark-mode tests assert contrast-sensitive calendar cells and settings controls remain readable.

## Public Repository Positioning

Habit Tracker showcases AI-assisted product engineering across UI implementation, backend persistence, domain modeling, test automation, documentation, and reproducible project assets. The repository description and topics are documented in `README.md` for GitHub repository setup.
