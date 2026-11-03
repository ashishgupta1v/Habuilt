# Habuilt

Habuilt is a habit tracker. The signed-in website and the Android widget save a completion through Laravel. The participant id is the subject of that person's Supabase Auth JWT. Neither client uses the service-role key.

## Architecture

- Hostinger Postgres is the application database. Laravel's `DB_CONNECTION`, `DB_HOST`, and `DB_DATABASE` point there.
- Supabase Auth issues the browser and widget session. `SUPABASE_URL` is that Auth host. `SUPABASE_SERVICE_ROLE_KEY` stays on the server and is used only to delete an Auth user.
- `HABUILT_LEDGER_DATABASE_URL` is optional. When it is set, account export, account deletion, and `php artisan habuilt:secure-ledger` also use that second Postgres connection. It is not the application database.
- The public app origin is `https://habuilt.com`. The widget posts to `/api/habits/check-ins` with the user's bearer token. If that request fails, the completion stays in a local queue until Laravel accepts it.
- A guest never leaves the device.
- ZoetiCoach is an optional server-side coach forwarder. The app shows a connected state only when that proxy is not skipped.

The live Laravel app is deployed from this repo with `.github/workflows/deploy-kvm.yml`.

Check-in points come from the value saved on the habit or protocol. The client cannot raise that value. Reward redemption locks the caller's rows inside one transaction.

## Stack

- Backend: Laravel 11, PHP 8.3, PostgreSQL
- Frontend: Vue 3, Inertia.js, Vite
- Auth: Supabase Auth
- Widget: Android home-screen widget posting to Laravel

## Local development

```bash
composer install
npm install
copy .env.example .env
php artisan key:generate
composer run dev
```

`composer run dev` starts Laravel, the queue listener, Reverb, and the Vite dev server.

## Checks

```bash
npm run build
php artisan test
npm run test:sync
```

Commit source changes. Do not commit `.env` or regenerated `public/build` output.
