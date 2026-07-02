# PRAHARI X — AI Defense Operations Command Platform

A premium, enterprise-grade command console for mission planning, intelligence
fusion, asset readiness, and personnel operations — built as a fictional
flagship SaaS product, elevated from the original Codex Master PRD.

> PRAHARI X is a demonstration product. All missions, personnel, regions, and
> testimonials are fictional and generated for illustrative purposes.

---

## 1. Project structure

```
prahari-x/
  frontend/     React 19 + Vite + TypeScript + Tailwind CSS v4 SPA
  server/       Express + Prisma + JWT API (SQLite by default, Postgres-ready)
```

The frontend runs standalone against an in-browser mock API (see
`frontend/src/services/`) — there's no setup required to explore the full
product. The `server/` directory is a complete, production-shaped API that
the frontend can be pointed at instead (see §4).

## 2. Quick start (frontend only)

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173`. Sign in with the pre-filled demo credentials on
the login screen (any password of 4+ characters works against the mock API),
or use "Request Access" to create a new profile. All data is generated on
first load and persisted to `localStorage`, so your changes survive reloads.

## 3. Quick start (with the real API)

```bash
cd server
npm install
cp .env.example .env
npm run prisma:generate
npm run prisma:migrate   # creates prisma/dev.db (SQLite)
npm run seed             # seeds a commander account + sample data
npm run dev              # starts the API on http://localhost:4000, routes under /api
```

Then, in a second terminal:

```bash
cd frontend
cp .env.example .env
# edit .env: set VITE_USE_MOCK_API=false
npm install
npm run dev
```

The Vite dev server proxies `/api/*` to `http://localhost:4000` (see
`vite.config.ts`), so no CORS setup is needed for local development. The
mock/real switch lives in `src/services/api.ts`, which re-exports either
`mockApi.ts` (localStorage) or `realApi.ts` (real `fetch` calls, via
`httpClient.ts` + `mappers.ts`) based on `VITE_USE_MOCK_API` — every page
imports from `services/api.ts` only, so flipping the env var and restarting
`npm run dev` is the entire migration; no page or component changes.

Seeded login: **commander@prahari-x.mil** / **sentinel** (also **soldier@prahari-x.mil** / **sentinel**)

### Authentication & email

Auth is fully database-driven in real-API mode: registration creates an
unverified account, login is rejected with a distinct "Account Not Found" /
"Invalid Credentials" / "Please verify your email" message as appropriate,
and forgotten passwords go through a real, expiring, hashed OTP. See
`server/.env.example` for the JWT and SMTP variables.

By default `SMTP_HOST` is unset, so verification links and OTP codes are
printed to the **server console** instead of emailed — open the terminal
running `npm run dev` in `/server` to read them while testing locally. Fill
in `SMTP_HOST`/`SMTP_USER`/`SMTP_PASS`/etc. in `server/.env` to send real
email through any provider (no code changes needed).

Sessions use short-lived JWT access tokens (15 min) plus a rotating,
revocable refresh token persisted in the `RefreshToken` table — "Remember
me" controls whether that refresh token lives 30 days or 1 day. Logging out
revokes it server-side, and the client also guards against the browser's
back/forward cache re-showing a protected page after logout.

## 4. Feature overview

- **Landing** — hero with an original orbit/radar visual, a "Platform" mega-menu
  covering every module, feature grid, 4-step workflow, animated stats, and CTA.
- **Authentication** — email/password login with account-not-found /
  invalid-credentials / not-verified messaging, sign-up with required email
  verification, and a 3-step forgot-password flow (email → OTP → reset).
  JWT access + refresh tokens, Remember Me, and session restoration on reload.
- **Dashboard** — live stat cards, mission/threat trend charts, personnel
  readiness donut, live threat feed, recent missions.
- **Operations** — full mission CRUD with filters, and a mission detail view
  with Overview / Objectives / Timeline / Squad / Equipment / Logs tabs,
  personnel & asset assignment drawers, and a "mark complete" action.
- **Intelligence Center** — an original sector-density heatmap, category
  filters (cyber / drone / satellite / ground / signal), AI recommendation
  panel, and full threat-report CRUD with a "neutralize" action.
- **Assets** — tabbed registry (vehicles, drones, weapons, medical,
  satellites) with condition tracking, maintenance dates, CRUD, and
  mission assignment.
- **Personnel** — roster CRUD, a profile drawer with health readiness and
  mission history, search & status filters.
- **AI Assistant** — multi-conversation chat with prompt suggestions,
  simulated streaming-style responses, history, export-to-PDF (via the
  browser print dialog), and conversation deletion.
- **Settings** — profile, password & 2FA, appearance (theme / density /
  accent), notification preferences, device sessions, and audit logs.

## 5. Architecture

**Frontend** (`frontend/src`):

```
components/   ui/ (design-system primitives) · motion/ · charts/ · layout/ · graphics/
layouts/      AppLayout, AuthLayout
pages/        one folder per module, colocated with its form modals/drawers
routes/       ProtectedRoute
store/        Zustand slices — auth, theme, sidebar, notifications, filters,
              current mission, user preferences, toasts
services/     api.ts (mock REST layer) + db.ts (localStorage persistence)
lib/          utils, mock data generators
types/        shared domain types, mirroring the Prisma schema
```

Every CRUD mutation goes through `services/api.ts`, persists to
`localStorage` via `services/db.ts`, and the calling page re-fetches or
patches local state — so dashboard widgets, tables, and detail views stay in
sync the moment something changes, without a global cache layer.

**Backend** (`server/src`): Express routes are grouped by resource
(`auth`, `missions`, `dashboard`, `assets`, `personnel`, `threats`), each
backed by Prisma. JWT access tokens are verified in `middleware/auth.ts`;
`requireRole` exists for role-gating specific mutations. Prisma's schema
(`server/prisma/schema.prisma`) mirrors the frontend's `types/index.ts`
exactly, so the same shapes flow through both halves of the stack.

## 6. Design system

- **Palette** — near-black obsidian surfaces, a restrained "Sentinel Blue"
  primary accent, and "Signal Amber" for priority/attention states. No
  gratuitous gradients, no hacker-green.
- **Spacing** — 8px baseline grid throughout.
- **Radius** — 24px on primary cards, smaller radii for nested controls.
- **Typography** — Inter for UI text, JetBrains Mono for IDs, timestamps,
  and coordinates (`.mono-tag` utility).
- **Motion** — Motion (Framer Motion's successor) for component-level
  interaction, GSAP-friendly structure for future timeline work, Lenis for
  smooth scroll on the marketing page. Every interactive surface has a
  purposeful transition — page transitions, drawer/modal choreography,
  animated counters, skeleton loading, staggered reveals.

## 7. Deployment

- **Frontend** → Vercel (or any static host). `npm run build` outputs a
  static `dist/` bundle.
- **Backend** → Render, Railway, Fly.io, or any Node host. Point
  `DATABASE_URL` at a managed PostgreSQL instance and flip the `provider` in
  `schema.prisma` from `sqlite` to `postgresql`.
- **Assets** → Cloudinary (optional), for user-uploaded imagery not covered
  by this demo.

## 8. Tech stack

React 19 · Vite 6 · TypeScript · Tailwind CSS v4 · Radix UI primitives ·
Motion · GSAP · Lenis · Zustand · React Hook Form · Zod · Recharts ·
TanStack Table · Node.js · Express · Prisma · SQLite/PostgreSQL · JWT · bcrypt.

See `EXPLAINER.md` for the reasoning behind key design and engineering
decisions.
