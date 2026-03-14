# Warrior Tracker

A single-file productivity app to track daily habits, maintain a points wallet, redeem rewards, and sync progress across devices.

## Overview

Warrior Tracker is built as a single-page app in one HTML file (`index.html`) using Alpine.js for state management and Chart.js for analytics visualization.

It includes:

- Daily habit completion matrix
- Points wallet and reward redemption ledger
- Monthly analytics chart and KPIs
- "Today's Focus" day-wise checklist with checkbox tasks
- Background cross-device sync via Supabase Realtime
- CSV export of habit and ledger data
- Dark/Light mode toggle

## Tech Stack

- HTML + Tailwind CSS (CDN)
- Alpine.js v3 (CDN)
- Chart.js (CDN)
- Supabase JavaScript client v2 (CDN)
- Browser localStorage for offline persistence

## File Structure

```
Warrior_Tracker/
  ├─ index.html      # Full application (UI + logic)
  ├─ netlify.toml    # Netlify config
  ├─ _redirects      # Netlify SPA fallback redirects
  └─ README.md       # Project documentation
```

## Core Workflows

### 1) Daily Usage Workflow

1. Open the app.
2. In **Today's Focus**, day dropdown defaults to today's date.
3. Add focus tasks in the input box (`Enter` or `+ Add`).
4. Tick each checkbox when task is done by EOD.
5. Mark completed habits in the monthly habit grid.
6. Redeem rewards from Reward Shop when wallet is sufficient.
7. Review analytics (daily average, completion rate, personal best).
8. Use **Export Data** to download a CSV snapshot.

### 2) Focus Checklist Workflow

- Focus tasks are stored per day (`day-1`, `day-2`, ...).
- A task entry is saved as:

```json
{ "text": "Your task", "done": false }
```

- Older legacy text-only focus notes are auto-migrated to a task list format on load.

### 3) Sync Workflow (Background, No UI Panel)

Sync runs silently in the background when config is available.

1. App determines `syncId` from URL:
   - Query param: `?sync=<your-shared-key>`
   - Hash param: `#sync=<your-shared-key>`
   - Fallback: `warrior-<hostname>`
2. App loads local data from `localStorage`.
3. App fetches remote row from Supabase table `warrior_sync`.
4. Newer payload wins via `updatedAt` timestamp comparison.
5. App subscribes to realtime row updates for same `syncId`.
6. Local saves are debounced and upserted to Supabase.

Conflict strategy:

- Last write wins (`updatedAt`)
- Echo loop prevention through `updatedBy` client instance id

## Data Model

### localStorage Keys

- `warrior_v3_data`: primary app data
- `warrior_sync_config`: sync configuration
- `warrior_pro_data`: legacy key (auto-migrated if present)

### `warrior_v3_data` Shape

```json
{
  "completions": { "14-0": true, "14-1": true },
  "ledger": [
    {
      "item": "Cheat Meal",
      "description": "Weekend reward",
      "cost": 15,
      "date": "3/14/2026, 10:00:00 PM",
      "timestamp": 1773500000000
    }
  ],
  "darkMode": false,
  "focusNotes": {
    "day-14": [
      { "text": "Apply to 3 jobs", "done": true },
      { "text": "Boxing + rinse", "done": false }
    ]
  },
  "updatedAt": 1773500000000
}
```

### Supabase Table (`warrior_sync`)

- `sync_id` (text, primary key)
- `data_payload` (jsonb)

## Supabase Setup (Required for Cross-Device Sync)

Run in Supabase SQL editor:

```sql
create table if not exists public.warrior_sync (
  sync_id text primary key,
  data_payload jsonb not null default '{}'::jsonb
);

alter table public.warrior_sync enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'warrior_sync' and policyname = 'warrior_sync_select_anon'
  ) then
    create policy warrior_sync_select_anon
      on public.warrior_sync
      for select
      to anon
      using (true);
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'warrior_sync' and policyname = 'warrior_sync_insert_anon'
  ) then
    create policy warrior_sync_insert_anon
      on public.warrior_sync
      for insert
      to anon
      with check (true);
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'warrior_sync' and policyname = 'warrior_sync_update_anon'
  ) then
    create policy warrior_sync_update_anon
      on public.warrior_sync
      for update
      to anon
      using (true)
      with check (true);
  end if;
end $$;

alter publication supabase_realtime add table public.warrior_sync;
```

> Note: Open `anon` policies are easy for MVP setup. For production hardening, add tighter controls and rotate keys as needed.

## Deployment Workflow (Netlify)

### Option A: Deploy directly from `Warrior_Tracker/`

1. Ensure `index.html`, `netlify.toml`, and `_redirects` are in this folder.
2. Deploy folder to Netlify.

### Option B: If your Netlify site points to another folder

Copy updated app file before deploy:

```powershell
Copy-Item -Path "c:\Users\ashis\OneDrive\Desktop\Project\Warrior_Tracker\index.html" -Destination "c:\Users\ashis\OneDrive\Desktop\Project\index.html" -Force
```

## Running Locally

Because this is a static single file app, you can:

- Open `index.html` directly in browser, or
- Serve folder with any static server

No npm install/build step is required.

## Sync Usage Example

Use the same URL and same sync key on all devices:

```
https://<your-site>.netlify.app/?sync=ashis-warrior-2026
```

If keys differ, each key creates a separate sync room.

## Troubleshooting

### Day dropdown shows wrong day

- Ensure system clock/timezone on device is correct.
- App reads current day from `new Date().getDate()`.

### Focus tasks not visible after switching day

- Tasks are day-specific (`day-<n>`). Switch back to the same day in dropdown.

### Sync not working between devices

Check all below:

1. Both devices open URL with exact same `?sync=` value.
2. Supabase table exists and realtime publication is enabled.
3. RLS policies allow anon select/insert/update.
4. Network allows WebSocket connections.

### Netlify shows 404

- Confirm `_redirects` includes:

```
/ /index.html 200
/* /index.html 200
```

## Security Notes

- Supabase `anonKey` is public by design but should be restricted with proper RLS.
- Treat `?sync=` key as a shared room secret; anyone with the same key can access that room’s data.

## Maintenance Checklist

- Keep a backup export using CSV before major changes.
- Test sync across two browsers after editing persistence logic.
- Keep `index.html` in deployment folder in sync with development version.
