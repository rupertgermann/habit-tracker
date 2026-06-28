# Habit Tracker

A clean, minimalist mobile-first web app for tracking habits, building streaks, and visualizing progress. Built with React 19 and Vite, it provides a distraction-free experience with animations, charts, journaling, and full dark-mode support. Data is persisted in a SQLite database served by an Express API.

## Features

- **Dashboard** — daily overview of habits, completion progress, and quick check-off / count-logging actions.
- **Habit management** — create, edit, and delete habits with categories, icons, colors, and custom schedules.
- **Tracking types** — habits are either **Yes/No** (done once per day) or **Count** (log how many times per day, with an optional daily goal).
- **Categories & tags** — organize habits by category with filtering, icons, and colors.
- **Calendar view** — per-habit week, month, and year views with a count heatmap, per-day tooltips, and a stats card showing the percentage of days completed, total count, and best day.
- **Progress & stats** — animated circular progress rings and bar/line charts for weekly and monthly completion.
- **Streak visualization** — current and longest streaks, streak history timeline, and milestone celebrations.
- **Journaling** — daily notes and reflections per habit with mood tracking and note search.
- **Check-off celebrations** — micro-confetti and toast notifications on completion and streak milestones.
- **Dark mode** — light/dark theme variants with system-preference detection.
- **Reminders** — browser notification scheduling with permission handling and multiple reminders per habit.
- **Data management** — JSON/CSV export with date-range selection, plus full backup and restore against the database.
- **Persistent storage** — habits, categories, and journal entries live in a SQLite database via an Express REST API.
- **Accessibility** — ARIA labels across the UI, keyboard navigation, screen-reader support, and high-contrast options.
- **Responsive layout** — mobile bottom navigation and a tablet split view (list + detail) at wider breakpoints.
- **Performance** — virtualized lists, chart data-point limiting, and optimized rendering for large datasets.

## Tech Stack

| Area | Library |
|---|---|
| UI library | React 19 |
| Build tool | Vite 8 |
| Routing | React Router 7 |
| Styling | styled-components 6 |
| Animations | Framer Motion 12 |
| Charts | Recharts 3 |
| Dates | date-fns 4 |
| Celebrations | react-confetti 6 |
| API server | Express 5 |
| Database | SQLite (better-sqlite3) |

## Getting Started

### Prerequisites

- Node.js 20.19+ (Node 22 recommended; required by Vite 8)
- npm

### Installation

```bash
npm install
```

### Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start the API server and the Vite dev server together at `http://localhost:3000`. |
| `npm run dev:client` | Start only the Vite dev server at `http://localhost:3000` (requires the API server separately). |
| `npm run dev:e2e` | Start the API and client against a temporary `.tmp/e2e` SQLite database for browser regression tests. |
| `npm run server` | Start only the Express API server at `http://127.0.0.1:3001`. |
| `npm run dev:all` | Alias for `npm run dev`. |
| `npm run test` | Run domain regression tests and browser regression tests. |
| `npm run test:domain` | Run domain regression tests for habit tracking and journal timeline rules. |
| `npm run test:e2e` | Run Playwright browser regression tests for persisted habit flows, journal flows, and responsive smoke coverage. |
| `npm run build` | Build the production bundle to `dist/` (with source maps). |
| `npm run preview` | Serve the production build locally for preview. |

The frontend needs the API server running to load and persist data. Use `npm run dev` to run both at once, or run `npm run server` and `npm run dev:client` in separate terminals. The API binds to `127.0.0.1` by default; override `HOST` only when you explicitly need another bind address.

Browser regression tests use Playwright through `npm run test:e2e`. The test server uses `HABIT_TRACKER_DB_PATH=.tmp/e2e/habit-tracker.db`, so each spec can seed and clean temporary Habit, Completion, and Journal Entry data without touching the normal local database under `server/data/`.

## Project Structure

```
habit-tracker/
├── index.html              # App entry HTML (Inter font, root mount)
├── vite.config.js          # Vite + React plugin config (port 3000, /api proxy, dist output)
├── server/
│   ├── index.js            # Express REST API
│   ├── db.js               # SQLite setup, schema, and data access
│   └── data/               # SQLite database file (git-ignored, created at runtime)
├── src/
│   ├── main.jsx            # React root (createRoot) + StrictMode
│   ├── App.jsx             # Providers + route definitions
│   ├── api/                # Frontend API client (habitsApi)
│   ├── components/         # Reusable UI components
│   ├── screens/            # Page-level views (Dashboard, Calendar, Settings, ...)
│   ├── context/            # React Context state (Habits, Theme, Toast, Navigation)
│   └── styles/             # Theme and global styles
└── docs/                   # Design and implementation documentation
```

## Architecture

The app follows a modular structure with clear separation of concerns:

- **Components** (`src/components/`) — reusable UI building blocks (cards, charts, inputs, navigation, tooltips, confetti, etc.).
- **Screens** (`src/screens/`) — page-level views mapped to routes.
- **Context** (`src/context/`) — application state via React Context.
- **Styles** (`src/styles/`) — theme system and global base styles.

### State Management

State is managed with React Context:

- **HabitsContext** — habit data, completion, streaks, and categories. Loads from and persists to the API with optimistic updates.
- **ThemeContext** — theme selection and dark mode (stored as a UI preference in `localStorage`).
- **ToastContext** — toast notifications.
- **NavigationContext** — active navigation state synced with the current route.

### Data Persistence

Habits, categories, and journal entries are stored in a SQLite database (`server/data/habit-tracker.db`) through an Express REST API. The frontend talks to it via the `src/api/habitsApi.js` client, and Vite proxies `/api` to the backend in development. Default categories are seeded automatically on first run. Theme and notification preferences remain in the browser's `localStorage`.

#### API Endpoints

| Method & Path | Description |
|---|---|
| `GET /api/state` | Full app state (habits, categories, journal entries). |
| `POST /api/habits` / `PUT /api/habits/:id` / `DELETE /api/habits/:id` | Create, update, or delete a habit (deleting also removes its journal entries). |
| `POST /api/categories` / `PUT /api/categories/:id` / `DELETE /api/categories/:id` | Manage categories. |
| `POST /api/journal` / `PUT /api/journal/:id` / `DELETE /api/journal/:id` | Manage journal entries. |
| `POST /api/restore` | Replace all data from a backup payload. |
| `DELETE /api/data` | Clear all data and re-seed default categories. |

The API server listens on port `3001` (configurable via the `PORT` environment variable).

### Routing

| Path | Screen |
|---|---|
| `/` | Dashboard |
| `/habits` | Habits list (tablet split view on wide screens) |
| `/calendar` | Calendar view |
| `/habit/:id` | Habit detail (tablet split view on wide screens) |
| `/progress` | Progress & stats |
| `/journal` | Journal view |
| `/settings` | Settings |
| `/add-habit` | Add habit |
| `/edit-habit/:id` | Edit habit |

### Styling

styled-components powers all styling through a comprehensive theme with light and dark variants, global base styles, and component-co-located styles. The Inter font is loaded in `index.html`.

## Documentation

Additional design and implementation notes live alongside the code:

- `design-specifications.md` — UI/UX design specification.
- `docs/prompt.md` — original design brief.
- `docs/implementation-summary.md` — feature and technical overview.
