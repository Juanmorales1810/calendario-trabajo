# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

**HorasWork** — a Next.js 16 (App Router, React 19) PWA for tracking work hours, overtime, and estimated salary. Spanish-language UI (`lang="es"`, es_AR locale). Package manager is **pnpm** (pnpm-lock.yaml + pnpm-workspace.yaml present; ignore package-lock.json).

## Commands

```bash
pnpm dev          # dev server with Turbopack
pnpm build        # production build with Turbopack
pnpm start        # run production build
pnpm lint         # eslint (flat config: next/core-web-vitals + next/typescript)
```

There is no test suite/runner configured in this repo.

## Architecture

### Data layer — two DB clients on one MongoDB database

- [src/lib/auth.ts](src/lib/auth.ts) — `better-auth` instance (email/password) using its own `mongodbAdapter`, talking to MongoDB via the raw `mongodb` driver.
- [src/lib/db.ts](src/lib/db.ts) — separate cached `mongoose` connection (`connectDB()`, memoized on `global.mongoose` for hot-reload/serverless reuse) used by all Mongoose models in `src/models/`.
- Every API route must call **both**: `auth.api.getSession({ headers: await headers() })` for the user, and `connectDB()` before touching a Mongoose model. Route handlers do this in parallel via `Promise.all`.
- Client-side auth: [src/lib/auth-client.ts](src/lib/auth-client.ts) exports `useSession` (better-auth React client), used in pages to gate access and redirect to `/login`.

### Domain model — work entries with two shifts per day

[src/models/work-entry.ts](src/models/work-entry.ts) stores one document per shift-day: `entrada`/`salida` (shift 1) plus optional `entrada2`/`salida2` (shift 2), all as `"HH:MM"` strings. Durations (`horasTurno`, `horasTurno2`, `horasLaborales`, `horasExtras`) are stored **in minutes**, not hours.

Overtime (`horasExtras`) rules, duplicated in both [src/app/api/clock/route.ts](src/app/api/clock/route.ts) (`calculateDayExtras`) and [src/lib/time-utils.ts](src/lib/time-utils.ts) (`calculateExtras`) — keep both in sync if the rule changes:
- Sunday: 100% of worked time counts as overtime.
- Saturday: overtime is everything beyond 4h if `trabajaSabados` (user setting) is true, otherwise 100% overtime.
- Weekday: overtime is time beyond `horasJornada` (user setting, minutes).

[src/lib/time-utils.ts](src/lib/time-utils.ts) also has `calculateSalaryEstimate`, which assumes a fixed 176 working hours/month and pays overtime at the same hourly rate as regular time (no multiplier).

Per-user config lives in [src/models/user-settings.ts](src/models/user-settings.ts) (`salarioMensual`, `horasJornada`, `trabajaSabados`, `moneda`), created lazily with a `horasJornada: 9` default on first `GET /api/settings`.

### Clock in/out state machine

[src/app/api/clock/route.ts](src/app/api/clock/route.ts) drives the "fichaje" flow for *today's* entry (found by `fecha` within `[today, tomorrow)`): `idle → clocked-in → between-shifts → clocked-in-2 → done`. `GET` derives current status by inspecting which fields are filled; `POST` accepts `{ action: 'clock-in'|'clock-out'|'clock-in-2'|'clock-out-2', clientTime?, ubicacion? }`. `clientTime` (from the browser) is preferred over server time to avoid UTC/timezone drift. Clock-in and clock-out fire push notifications via `sendPushToUser` (fire-and-forget, errors swallowed).

Manual entry CRUD (arbitrary date, not just "today") goes through [src/app/api/work-entries/route.ts](src/app/api/work-entries/route.ts) and `[id]/route.ts`, validated client-side with the Zod schemas in [src/lib/schemas.ts](src/lib/schemas.ts).

### Push notifications (Web Push / PWA)

- [src/lib/push.ts](src/lib/push.ts): server-side `sendPushToUser` using `web-push`, VAPID keys from env (`NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, optional `VAPID_MAILTO`). No-ops silently if VAPID keys aren't set. Auto-deletes subscriptions on `410 Gone`.
- Subscriptions stored in [src/models/push-subscription.ts](src/models/push-subscription.ts), managed through `src/app/api/push/subscribe` and `/resubscribe`, and the client component `src/components/push-notification-manager.tsx`.
- [public/sw.js](public/sw.js) is a hand-written service worker (not next-pwa/Workbox): cache-first for `/_next/static/*`, versioned `CACHE_VERSION` cache names, precaches `/` and `/offline`, and listens for a `SKIP_WAITING` postMessage to support the "new version available" prompt in [src/components/service-worker-register.tsx](src/components/service-worker-register.tsx). Bump `CACHE_VERSION` when changing caching behavior so old caches get cleaned up on activate.
- `/offline` ([src/app/offline/page.tsx](src/app/offline/page.tsx)) is the fallback page for network failures.

### UI structure

- `src/app/page.tsx` — main dashboard (protected: redirects to `/login` if no session). Composes `WorkEntryForm`, `WorkEntryTable`, `MonthlySummary`, `ClockButton`, filtered by month/year query to `/api/work-entries`.
- `src/app/configuracion`, `src/app/reportes`, `src/app/login`, `src/app/registro` — settings, reports, and auth pages.
- `src/components/ui/*` — shadcn/ui primitives (Radix-based), configured via [components.json](components.json). Add new ones with `npx shadcn@latest add <component>` rather than hand-rolling.
- `src/components/*.ts(x)` at the top level (`event-calendar.tsx`, `day-view.tsx`, `week-view.tsx`, `month-view.tsx`, `agenda-view.tsx`, `calendar-dnd-context.tsx`, drag/drop helpers, etc.) form a full drag-and-drop calendar widget re-exported from [src/components/index.ts](src/components/index.ts). It is not currently wired into any `app/` page — check before assuming it's live UI.
- Path alias `@/*` → `src/*` (see [tsconfig.json](tsconfig.json)).
