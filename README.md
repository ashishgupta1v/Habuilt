# Habuilt (Warrior Tracker)

Habuilt is a habit-tracking dashboard built with Laravel 11, Inertia, Vue 3, and Vite. The project uses a domain-first structure so the UI stays simple while business rules remain in dedicated Tracking and Economy layers.

This README explains the app in a beginner-friendly way, especially the full path from a browser click to database persistence and then back to the screen.

## Current Stack

- Backend: Laravel 11, PHP 8.3
- Frontend: Vue 3, Inertia.js, Vite
- Data mapping: Spatie Laravel Data
- Architecture style: domain-first, action-based, event-driven
- Styling: custom app stylesheet in `resources/css/app.css`

## Supabase Database Setup

The backend persists through Laravel Eloquent, so Supabase must be configured as the Laravel database connection.

1. In `.env`, set `DB_CONNECTION=pgsql`.
2. Set either `SUPABASE_DB_URL` (preferred) or `DB_URL` to your Supabase Postgres connection string.
3. Keep `DB_SSLMODE=require` for Supabase.
4. Clear cached config after changes:

```bash
php artisan config:clear
```

## Deployment Reality Check (Vercel + Laravel)

This repository is currently configured as a static Vercel build:

- `vercel.json` outputs `dist/` and rewrites all routes to `index.html`.
- `scripts/prepare-vercel-dist.mjs` copies frontend assets only and excludes PHP.

Because of that, Laravel controllers are not executed on Vercel in this setup, so POST/DELETE habit routes will not persist to Supabase through Laravel.

### If you want Laravel to handle all fetch/store (recommended)

Deploy Laravel on a PHP-capable host and connect it to Supabase Postgres.

Good options:

- Laravel Cloud
- Render
- Railway
- Fly.io
- VPS (Forge + DigitalOcean/AWS/Linode)

Required backend env vars:

- `DB_CONNECTION=pgsql`
- `SUPABASE_DB_URL=postgresql://...` (preferred) or `DB_URL=postgresql://...`
- `DB_SSLMODE=require`

Then run:

```bash
php artisan config:clear
php artisan migrate --force
```

### If you must keep frontend on Vercel

You have two architecture choices:

1. Host Laravel elsewhere and use that URL as the app origin for Inertia pages.
2. Rewrite the app to a pure SPA that talks directly to Supabase via `@supabase/supabase-js` (no Laravel route persistence).

With the current codebase, option 1 is the least risky path.

This repository now also supports a static-mode fallback for Vercel:

- Month navigation works using `?month=MM&year=YYYY` query params.
- Habit checkboxes persist per user/month in browser storage.
- If Supabase client env vars are provided, habits and check-ins are fetched/stored directly from Supabase.

Required Vercel env vars for this static-mode sync:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_HABUILT_DEMO_USER_ID` (26-char ULID used as `user_id`)

Supabase RLS note for static mode:

- Your anon key must have policies allowing select/insert/delete for that `user_id` on `habits` and `check_ins`.
- Without matching RLS policies, the app will fall back to local browser storage only.

### Vercel Environment Variables (when hosting any backend/API there)

- `APP_ENV=production`
- `APP_DEBUG=false`
- `APP_KEY=<base64 key>`
- `APP_URL=<public backend url>`
- `DB_CONNECTION=pgsql`
- `SUPABASE_DB_URL=<supabase postgres url>`
- `DB_SSLMODE=require`

### Supabase Settings Checklist

- Use the Postgres connection string from Supabase project settings.
- Keep SSL required (`sslmode=require`).
- Ensure migrations were executed against the same Supabase database used by production.
- If using a connection pooler host/port, use that exact host/port in the URL.

## What the App Does

The current app focuses on one main flow:

1. Show a dashboard of habits for the current month.
2. Let the user mark a habit as completed for a specific day.
3. Prevent duplicate completion for the same habit on the same day.
4. Award points when a habit is completed.
5. Re-render the dashboard with updated wallet and completion state.

The dashboard also contains browser-only planning tools such as dark mode, focus tasks, reward spending, and weekly review notes.

## High-Level Architecture

The application is split into clear layers:

### 1. Routing Layer

- `routes/web.php` defines the public HTTP entry points.
- `GET /` loads the dashboard.
- `POST /habits/{habit}/check-ins` records a habit completion.

### 2. Application Layer

This layer translates HTTP requests into domain work.

- `src/Application/Http/Controllers/DashboardController.php`
- `src/Application/Http/Controllers/HabitCheckInController.php`
- `src/Application/Http/Requests/CompleteHabitRequest.php`
- `src/Application/Http/Data/HabitData.php`
- `src/Application/Http/Middleware/HandleInertiaRequests.php`
- `src/Application/Support/CurrentUserResolver.php`

### 3. Domain Layer

This layer owns business rules.

- `src/Domains/Tracking/` handles habits and check-ins.
- `src/Domains/Economy/` handles points and the wallet ledger.

### 4. Frontend Layer

This layer renders server data and handles UI behavior.

- `resources/js/Pages/Dashboard.vue`
- `resources/js/Layouts/AppLayout.vue`

## Folder Guide

```text
src/
  Application/
    Http/
      Controllers/     -> HTTP entry points
      Data/            -> request-to-domain DTO mapping
      Middleware/      -> shared Inertia props
      Requests/        -> validation rules
    Providers/         -> infrastructure bindings and event listener registration
    Support/           -> small app-level helpers like current user resolution
  Domains/
    Tracking/          -> habits, check-ins, completion rules, events
    Economy/           -> point transactions and wallet accounting
  Shared/              -> shared abstractions like event dispatching

resources/
  js/
    Components/        -> reusable UI blocks
    Layouts/           -> page shell
    Pages/             -> Inertia pages
  css/
    app.css            -> custom global styling

config/
  habuilt.php          -> demo user and default habit seed list
```

## Data Ownership: What Lives Where

One of the most important design choices is separating **backend truth** from **browser convenience state**.

### Stored on the backend

- habits
- check-ins
- awarded points
- wallet total derived from point transactions

### Stored only in the browser (`localStorage`)

- dark mode preference
- focus tasks by day
- reward spending ledger used only by the current browser session history
- weekly review notes and checklist

This means the real habit progress and points are reliable on refresh, while personal planning widgets remain lightweight and fast.

## Detailed End-to-End Workflow

There are two main journeys to understand.

---

## Workflow A: Dashboard Page Load

This is what happens when the browser opens the home page.

### Step 1: Route matches the request

`GET /` is defined in `routes/web.php` and points to `DashboardController`.

### Step 2: The controller resolves the current user

`DashboardController` uses `CurrentUserResolver`.

`CurrentUserResolver` tries several sources in order:

1. authenticated user id
2. `X-User-Id` request header
3. `user_id` input value
4. `config('habuilt.demo_user_id')`
5. a hard fallback id

This makes the app usable even in demo mode before full authentication is in place.

### Step 3: Default habits are created if the user has none

Inside `DashboardController`, `ensureDefaultHabits()` checks whether the resolved user already has active habits.

If not, it seeds habits from `config/habuilt.php`.

This is why the dashboard can boot with useful sample habits immediately.

### Step 4: Repositories load current month data

The controller calculates:

- today
- current month
- first day of month
- last day of month
- number of days in the month

Then it asks repositories for:

- active habits for the user
- check-ins for each habit within the month
- point transactions for wallet calculation

### Step 5: Domain data is mapped into UI-friendly props

The controller turns each habit into a lightweight dashboard card array containing:

- `id`
- `name`
- `points`
- `completedToday`
- `completedDays`

This is important because the Vue page should receive simple display-ready data, not heavy domain models.

### Step 6: Inertia returns the page

`DashboardController` returns:

```php
Inertia::render('Dashboard', [...props])
```

That tells Laravel to render the Vue page at `resources/js/Pages/Dashboard.vue` and pass the prepared props into it.

### Step 7: Shared props are added by Inertia middleware

`HandleInertiaRequests` adds shared data for every Inertia response, including:

- auth info
- wallet points
- resolved user context
- flash success/error messages

That means the dashboard can access wallet data without every controller manually repeating it.

### Step 8: Vue renders the dashboard shell

The frontend rendering path is:

1. `AppLayout.vue` creates the shell.
2. `Dashboard.vue` renders all major sections (hero, analytics, habits, rewards, weekly review).

### Step 9: `Dashboard.vue` computes dashboard-only view models

Once it receives props, `Dashboard.vue` computes a lot of display values such as:

- total habits
- completed count today
- today points
- monthly total points
- completion rate
- daily average
- personal best day
- chart points and chart paths
- weekly and monthly summary cards

These are UI calculations only. They do not replace backend truth.

### Step 10: Browser-only local state is loaded

`Dashboard.vue` also loads local browser state using a key based on user and month.

That local state stores:

- dark mode
- daily focus tasks
- reward ledger
- weekly review content

So the dashboard feels rich and personal without needing a backend table for every small widget.

---

## Workflow B: Habit Completion (Click a Cell)

This is the most important end-to-end flow in the app.

### Step 1: The user clicks a day cell

Inside `Dashboard.vue`, each habit/day intersection is a button.

If the cell is already complete or currently pending, it is blocked.

Otherwise, the component emits a `complete` event upward.

### Step 2: `Dashboard.vue` receives the event and posts to Laravel

`Dashboard.vue` handles the emitted event, marks the cell as pending, and posts to the check-in route through Inertia.

The request includes values such as:

- habit id
- selected day
- month
- year
- optional metadata like source or notes

### Step 3: Laravel validates the request

`CompleteHabitRequest` performs input validation.

It ensures:

- the habit id exists in the expected ULID-like format
- `day`, `month`, and `year` are in valid ranges
- optional values are safe strings

It also normalizes the route habit id into uppercase during `prepareForValidation()`.

### Step 4: The controller converts HTTP input into a DTO

`HabitCheckInController` creates `HabitData` from the validated request.

`HabitData` then converts the HTTP fields into the domain DTO `HabitCompletionData`.

This is where the completion time is resolved carefully:

- use `completed_at` if explicitly provided
- otherwise build a date from `day`, `month`, and `year`
- otherwise fall back to now

This keeps controller code thin and avoids mixing parsing logic with business logic.

### Step 5: The action loads the habit and enforces rules

`RegisterHabitCompletionAction` is the core use-case class.

Its job is to:

1. load the habit aggregate from the repository
2. prevent duplicate completion on the same calendar day
3. call the habit domain behavior
4. save the check-in
5. dispatch a domain event
6. return a typed result DTO

This action is the heart of the write flow.

### Step 6: The duplicate guard runs before saving

The action builds a midnight day boundary and asks the check-in repository whether the habit was already completed on that date.

If yes, it throws `HabitAlreadyCompletedTodayException`.

This protects the wallet and habit streak data from accidental double-awards.

### Step 7: The habit domain creates the event

If the check-in is allowed, the action calls the habit aggregate's completion behavior.

That domain behavior returns a `HabitCompleted` event containing important information like:

- user id
- habit id
- check-in id
- points awarded
- occurrence timestamp

### Step 8: The new check-in is persisted

The action saves a new `CheckIn` record through `CheckInRepositoryInterface`.

At this point, Tracking has persisted the completion itself.

### Step 9: Economy reacts through an event listener

The action dispatches the `HabitCompleted` event through `DomainEventDispatcherInterface`.

`DomainServiceProvider` wires this event to the listener `CreditPointsForCompletedHabit`.

That listener writes a new `PointTransaction` in the Economy context.

This separation is the key architectural idea:

- Tracking owns completion
- Economy owns points
- they communicate through events instead of direct coupling

### Step 10: The controller redirects with a flash message

If the action succeeds, `HabitCheckInController` redirects back to the dashboard with a success message.

If the user already completed that habit for the selected day, it redirects back with an error flash message instead.

### Step 11: Inertia reloads the dashboard with fresh backend truth

Because the page returns to the dashboard route, `DashboardController` runs again.

That means the UI gets fresh values for:

- `completedDays`
- `completedToday`
- wallet points
- flash message

This is why the dashboard stays consistent after each completion.

## Frontend Layout Breakdown

### `resources/js/Layouts/AppLayout.vue`

This is the outer shell. It keeps layout concerns separate from page logic.

### `resources/js/Pages/Dashboard.vue`

This is the main UI orchestrator. It is responsible for:

- receiving server props
- loading and saving browser-local widgets
- computing KPIs and chart data
- handling completion requests
- rendering sections like overview, habits, rewards, and weekly review
- rendering the check-in matrix directly inside the page

## Backend Responsibility Breakdown

### `DashboardController`

- read-side controller
- prepares dashboard props
- seeds defaults if necessary
- calculates wallet summary from point transactions

### `HabitCheckInController`

- write-side controller
- accepts a validated check-in request
- delegates business work to the action
- redirects back with flash feedback

### `CompleteHabitRequest`

- request validation and normalization

### `HabitData`

- maps HTTP input to domain-safe data

### `RegisterHabitCompletionAction`

- use-case orchestrator for one habit completion

### `CreditPointsForCompletedHabit`

- event listener that credits wallet points after completion

### `DomainServiceProvider`

- binds repository interfaces to Eloquent implementations
- registers event dispatcher integration
- loads domain migration paths
- registers domain event listeners

## Why This Design Is Useful

For a beginner, the big idea is simple:

- controllers should stay thin
- validation should happen before domain logic
- business rules should live in actions and domain models
- separate business areas should talk through events
- Vue should render prepared props, not build business rules itself

This keeps the app easier to change later.

For example, if point-awarding rules become more complex, that work belongs in the Economy side, not in the habit controller.

## Local Development

### Install dependencies

```bash
composer install
npm install
```

### Create environment file if needed

```bash
copy .env.example .env
php artisan key:generate
```

### Run the app

```bash
composer run dev
```

That starts Laravel, queue listening, Reverb, and the Vite dev server through the Composer `dev` script.

## Validation Commands

Use these before committing:

```bash
npm run build
php artisan test
```

## Netlify Deployment Compatibility

This repository is a Laravel + Inertia application.

Important: Netlify does not provide a native long-running PHP runtime for serving Laravel routes and controllers directly. That means full-stack deployment of this repo on Netlify alone is not compatible without additional architecture changes.

### What Was Updated

- Removed legacy static entry file `index.html`.
- Removed legacy `_redirects` rules that forced traffic to `/index.html`.
- Updated `netlify.toml` to:
  - run `npm ci && npm run build`
  - publish `public/build`
  - add long-cache headers for built assets

### What Still Needs To Be In Place Before Production Deploy

1. Host Laravel backend on a PHP-capable platform (for example: Laravel Forge/VPS, Render, Railway, Fly.io, or similar).
2. Point Netlify site to frontend/static assets only, or migrate to a separate SPA frontend that calls your hosted API.
3. Set production environment variables on the backend (`APP_KEY`, database credentials, queue/cache/session config, etc.).
4. Confirm CORS and auth/session strategy if frontend and backend are on different domains.

### Recommended Deployment Paths

- Path A (recommended for current codebase):
  - Deploy Laravel app to a PHP host.
  - Use Netlify only for frontend/static distribution as needed.

- Path B (requires refactor):
  - Convert this into a true API + standalone SPA architecture.
  - Deploy SPA to Netlify and API to PHP host.

If you want full Laravel routing/server rendering in one place, choose a PHP-native host instead of Netlify-only.

## Current Validation Status

Last checked on 2026-03-28:

- `npm run build` passed
- `php artisan test` passed

## Important Commit Note

Generated Vite build output in `public/build/` should not be kept in the source-only working diff for this project state. Commit source changes, not regenerated frontend artifacts.
