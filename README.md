# PRAHARI X — AI-Assisted Defense Operations Command Platform

PRAHARI X is a full-stack, enterprise-grade command console for coordinating military-style operations across two connected portals: a **Commander portal** for mission planning, intelligence, logistics, and personnel command, and a **Soldier portal** scoped strictly to the signed-in soldier's own assignments, equipment, training, and reporting. It's a fictional flagship SaaS product — every mission, unit, region, and person in the seed data is invented — built to demonstrate what a production-shaped defense operations platform looks like end to end: real authentication, a real relational database, a real REST API, and a densely-featured React frontend, rather than a static mockup.

> PRAHARI X is a demonstration product. All missions, personnel, regions, and organizations referenced anywhere in the app or its seed data are fictional.

The problem it addresses is the one every operations-heavy organization has: information about missions, people, equipment, and threats lives in disconnected spreadsheets and channels, so a change made in one place (a soldier's status, a mission's roster, an asset's location) doesn't propagate anywhere else. PRAHARI X solves this by making the database the single source of truth for both portals — every create, update, or delete on one page is visible everywhere else that data is read, with no separate caches to fall out of sync.

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Technologies Used](#technologies-used)
3. [Folder Structure](#folder-structure)
4. [Installation Guide](#installation-guide)
5. [Features](#features)
6. [Challenges Faced](#challenges-faced)
7. [Future Improvements](#future-improvements)

---

## Project Overview

### Purpose

PRAHARI X gives a defense-style organization one system of record for the full operational picture: who's deployed where, which missions are active, what equipment is assigned to whom, what threats have been detected, and what needs a Commander's approval. It replaces the "several independent modules" pattern (a common failure mode in internal tools) with one relational database that every page — dashboards, maps, analytics, forms — reads from and writes to directly.

### Target Users

- **Commander and command staff** (Intelligence Officer, Mission Planner, Logistics Officer, Administrator) — plan missions, manage the personnel roster, assign equipment and tasks, review intelligence, approve leave/badges, and monitor the live operations picture.
- **Soldiers** — a scoped portal showing only their own assignments, equipment, training schedule, and a channel to submit field reports, leave requests, and emergency alerts back up to command.

### Main Workflow

1. A Commander creates a mission, builds a squad, and assigns personnel and assets to it.
2. Assigned soldiers see the mission, their equipment, and any tasks immediately in their own portal (via short-interval polling — see [Challenges Faced](#challenges-faced)).
3. Soldiers submit field reports, request leave, or raise an emergency alert; these appear in the Commander's Assignment Center / Approvals queue as notifications, in real time relative to the polling interval.
4. Every action — mission creation, personnel status change, asset assignment, threat detection — is written to the database and immediately reflected on the Dashboard, Analytics, and Live Operations Map, because those pages query the same tables rather than a separate cache.

### Overall Architecture

PRAHARI X is a two-package monorepo:

```
prahari-x/
├── frontend/   React 19 + Vite + TypeScript SPA (both portals)
└── server/     Express + Prisma + JWT REST API
```

The frontend is a single-page application that talks to the backend exclusively through `frontend/src/services/api.ts` — every page imports from this one file, never from `fetch` or Prisma directly. The backend is a conventional layered Express API: routes → Zod validation → Prisma queries → JSON response, with JWT-based authentication gating every route except `/health`, `/auth/register`, and `/auth/login`.

### High-Level System Design

```
┌─────────────────────────┐        HTTPS / JSON        ┌──────────────────────────┐
│   React 19 SPA (Vite)   │ ─────────────────────────▶ │   Express API (Node)     │
│   Commander + Soldier   │ ◀───────────────────────── │   /api/* routes          │
│   portals, Zustand,     │      JWT access token       │   JWT auth middleware    │
│   Radix UI, Motion      │      + refresh rotation     │   Zod request validation │
└─────────────────────────┘                             └────────────┬─────────────┘
                                                                       │ Prisma ORM
                                                                       ▼
                                                          ┌──────────────────────────┐
                                                          │  PostgreSQL (Neon) /     │
                                                          │  SQLite (local dev)      │
                                                          │  30-model relational     │
                                                          │  schema                  │
                                                          └──────────────────────────┘
```

Both portals are React Router branches guarded by the same two components: `ProtectedRoute` (is there a valid session?) and `RoleGate` (does this role belong on this branch?) — a Soldier account is redirected away from `/app/*` and a Commander account away from `/soldier/*` even by typing the URL directly.

---

## Technologies Used

### Frontend

| Category | Technology |
|---|---|
| Framework | React 19, TypeScript |
| Build tool | Vite 6 |
| Styling | Tailwind CSS v4 (`@tailwindcss/vite`), custom CSS design tokens |
| Component primitives | Radix UI (`react-dialog`, `react-tabs`, `react-tooltip`, `react-dropdown-menu`, `react-select`, `react-switch`, `react-checkbox`) for every primitive that needs correct focus/keyboard/ARIA behavior; `react-avatar` and `react-progress` are installed but not currently used (Avatar and ProgressBar are custom-built instead) |
| Animation | Motion (`motion/react`, the successor to Framer Motion) for all component/page animation; Lenis for smooth scrolling on the marketing page; GSAP drives the cinematic landing intro's phase timeline, title-reveal sequence, and several of the AI Core reactor's shader/scan-pulse animations (`components/intro/`, see [Cinematic Landing Intro](#features) below) |
| 3D / WebGL | Three.js + React Three Fiber (`@react-three/fiber`) + `@react-three/drei`, powering the AI Core — a fully procedural holographic reactor (globe, ~28 independently-animated orbit rings, a volumetric energy beam, a projection platform) rendered as the hero of the cinematic landing intro. No GLTF models, HDRI environment maps, or other external 3D assets are loaded — every surface is procedural geometry plus custom GLSL shaders (`shaderMaterial` via `drei` + `extend`). `@react-three/postprocessing` and `postprocessing` are installed but currently unused (an `EffectComposer` bloom pass was deliberately removed — see [Challenges Faced](#challenges-faced)) |
| Routing | React Router DOM v6 |
| State management | Zustand (auth, theme, sidebar, notifications, filters, current mission, user prefs, toasts) |
| Forms & validation | React Hook Form + `@hookform/resolvers` + Zod |
| Data visualization | Recharts, TanStack Table |
| Maps | MapLibre GL JS (loaded from a CDN at runtime — see [Challenges Faced](#challenges-faced)) over free OpenStreetMap raster tiles |
| Utilities | `clsx`, `tailwind-merge`, `class-variance-authority`, `date-fns`, `lucide-react` icons |
| Tooling | ESLint 9, TypeScript project references (`tsc -b`) |

### Backend

| Category | Technology |
|---|---|
| Runtime | Node.js (ESM, `"type": "module"`) |
| Framework | Express 4 |
| Language | TypeScript, run via `tsx` in dev, compiled with `tsc` for production |
| Validation | Zod (every route body is parsed through a schema before touching the database) |
| Security middleware | Helmet, CORS (multi-origin aware) |
| Logging | Morgan |
| Email | Nodemailer (console-log fallback when no SMTP is configured, so the app runs with zero external setup) |

### Database

| Category | Technology |
|---|---|
| ORM | Prisma 5 |
| Production database | PostgreSQL (Neon) |
| Local development database | SQLite (file-based, zero setup) — the historical default; the current `schema.prisma` targets `postgresql` for the deployed environment (see `DEPLOYMENT.md`) |
| Schema | 30 relational models covering identity, missions, personnel, assets, intelligence, logistics, and the full Commander↔Soldier command-and-control workflow |

### Authentication

- Custom JWT implementation (`jsonwebtoken`) — no third-party auth provider.
- Short-lived (15 min) access tokens + long-lived, rotating, revocable refresh tokens persisted in a dedicated `RefreshToken` table (hashed, never stored raw).
- Passwords hashed with `bcryptjs` (12 salt rounds).
- Strict portal separation enforced **server-side**: a Soldier account cannot authenticate through the Commander login endpoint and vice versa, regardless of what the client sends.
- Session management UI (Settings → Security): view and revoke active sessions, view login history.

### Maps

- **MapLibre GL JS** (open-source, no API key) rendering free **OpenStreetMap** raster tiles, loaded lazily from a CDN only when the Live Operations Map page is visited.
- Deterministic, seed-based pseudo-geocoding: every fictional location string (e.g. "Himalayan Frontier Post") hashes to a stable `[lng, lat]` inside a fixed Indian-subcontinent area of operations, so the same entity always renders in the same spot without any real-world coordinate data being stored.

### Deployment

| Layer | Target |
|---|---|
| Frontend | Vercel (static Vite build, SPA rewrite via `vercel.json`) |
| Backend | Render (blueprint via `render.yaml`) or Railway |
| Database | Neon (managed PostgreSQL) |

See `DEPLOYMENT.md` for the full provisioning and verification runbook.

### Tooling

- ESLint 9 (frontend)
- TypeScript compiler project references (`tsc -b`) for build-time type checking
- Prisma CLI (`generate`, `migrate dev`, `migrate deploy`, `studio`)
- `better-sqlite3` (dev-only) for the one-time SQLite → PostgreSQL data migration script

---

## Folder Structure

```
prahari-x/
├── DEPLOYMENT.md              Cloud deployment runbook (Neon + Render + Vercel)
├── render.yaml                 Render blueprint for the API service
│
├── frontend/
│   ├── vercel.json              Vercel build + SPA rewrite config
│   ├── vite.config.ts            Dev server, /api proxy, path alias
│   └── src/
│       ├── components/
│       │   ├── ui/                Design-system primitives: Button, Card, Input,
│       │   │                      Select, Switch, Checkbox, Tooltip, Modal, Drawer,
│       │   │                      Tabs, DataTable, Toaster, CommandPalette,
│       │   │                      Pagination, Breadcrumb, StatCard, ProgressBar,
│       │   │                      Skeleton, EmptyState, ConfirmDialog, Avatar
│       │   ├── motion/             Reveal / RevealStagger, CountUp, PageTransition,
│       │   │                      MagneticButton — the shared animation vocabulary
│       │   ├── charts/             TrendAreaChart, DonutChart, BarChartPanel (Recharts)
│       │   ├── layout/             Sidebar, Topbar, ProfileMenu, NotificationsPanel,
│       │   │                      SoldierSidebar, SoldierTopbar
│       │   ├── graphics/           OrbitHero, RadarGraphic — bespoke SVG/Motion visuals
│       │   ├── intro/              Cinematic landing intro: CinematicIntro.tsx
│       │   │                      (GSAP phase timeline: void → boot → assemble →
│       │   │                      hud → title → ready → dissolving), BootTerminal,
│       │   │                      NodeWidget, EncryptionProgress (left HUD column),
│       │   │                      HUDStack (right HUD panels), TitleReveal,
│       │   │                      AtmosphereCanvas/AtmosphereOverlays (Canvas2D
│       │   │                      particle atmosphere), plus useIntroAudio
│       │   │                      (synthesized Web Audio score), useDeviceTier,
│       │   │                      and useCursorParallax (whole-HUD mouse tilt).
│       │   │                      intro/core/ is the AI Core itself — a React
│       │   │                      Three Fiber 3D scene (AICore.tsx) composing
│       │   │                      TacticalGlobe (procedural black-glass
│       │   │                      holographic globe with custom Fresnel shaders),
│       │   │                      OrbitRings (~28 independent rotating rings),
│       │   │                      HolographicPlatform, and VolumetricBeam (a
│       │   │                      custom-shader energy column), plus CoreStage
│       │   │                      (DOM centering wrapper) and CoreLabels (the
│       │   │                      floating label ring). intro/scene/ and several
│       │   │                      intro/core/ files (GlassShell, HexLattice,
│       │   │                      CoreGlassOverlay, CoreParticleCanvas) are
│       │   │                      deprecated `export {}` stubs from earlier
│       │   │                      creative directions — kept in place only
│       │   │                      because this workspace can't delete files
│       │   └── shared/             CommentsPanel, ActivityFeed, EntityDetailDrawer
│       │                          (reused across every module that needs discussion
│       │                          threads or an activity/audit tab)
│       ├── layouts/                AppLayout (Commander shell), SoldierLayout, AuthLayout
│       ├── pages/                  One folder per module (see Features below):
│       │                          landing (IntroLandingPage wraps the cinematic
│       │                          intro around the unmodified LandingPage), auth,
│       │                          dashboard, assignments,
│       │                          operations-map, analytics, squads, approvals,
│       │                          operations, intelligence, assets, weapons,
│       │                          training, units, fleet, medical-comms,
│       │                          base-emergency, situation-room, personnel,
│       │                          ai-assistant, settings, soldier
│       ├── routes/                 ProtectedRoute (session gate), RoleGate (portal gate)
│       ├── store/                  Zustand slices: auth, theme, sidebar, notifications,
│       │                          filters, mission, user, toast
│       ├── services/                api.ts (single switch point), mockApi.ts,
│       │                          realApi.ts, httpClient.ts (fetch wrapper +
│       │                          token refresh), mappers.ts, apiError.ts, db.ts
│       ├── hooks/                   useLenis, usePolling, useSoldierContext
│       ├── lib/                     utils.ts (cn helper), exportCsv.ts, mock data
│       ├── types/                   index.ts — shared domain types mirroring
│       │                          the Prisma schema
│       └── styles/                  globals.css — design tokens (color, radius,
│                                    spacing, shadows, easing curves)
│
└── server/
    ├── prisma/
    │   ├── schema.prisma           30-model relational schema
    │   └── migrations/             SQL migration history
    ├── scripts/
    │   └── migrate-sqlite-to-postgres.ts   One-time data migration tool
    └── src/
        ├── routes/                 One file per resource: auth, missions, dashboard,
        │                          assets, personnel, threats, notifications, chats,
        │                          audit, inventory, training, comments, assignments,
        │                          reports, squads (+ patrol routes), personnel-ops
        │                          (shifts, leave, badges, attendance)
        ├── lib/                    prisma.ts (client), jwt.ts, roles.ts, notify.ts,
        │                          mailer.ts, tokens.ts
        ├── middleware/              auth.ts (requireAuth / requireRole),
        │                          errorHandler.ts
        ├── seed.ts                  Idempotent demo-data seed script
        └── index.ts                 Express app entrypoint, route mounting, CORS
```

---

## Installation Guide

### Prerequisites

- Node.js 20+
- npm
- Git

### Clone

```bash
git clone <repository-url>
cd prahari-x
```

### Backend setup

```bash
cd server
npm install
cp .env.example .env
```

Edit `server/.env`:
- `DATABASE_URL` — a PostgreSQL connection string (see `DEPLOYMENT.md` for Neon setup), or a local `file:./dev.db` SQLite path if you switch `provider` back to `"sqlite"` in `schema.prisma` for pure local experimentation.
- `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET` — any long random strings.
- `CLIENT_ORIGIN` — the frontend's origin (defaults to `http://localhost:5173`).
- `SMTP_*` — optional; leave unset to have verification-style emails print to the server console instead.

```bash
npm run prisma:generate      # generates the Prisma client
npm run prisma:migrate       # applies the schema to your database
npm run seed                 # idempotent — seeds a full demo dataset once
npm run dev                  # starts the API on http://localhost:4000
```

Seeded login: **commander@prahari-x.mil** / **sentinel** (also **soldier@prahari-x.mil** / **sentinel**, plus additional command and soldier accounts — see the seed script's console output for the full list).

### Frontend setup

In a second terminal:

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

Open `http://localhost:5173`. The Vite dev server proxies `/api/*` to `http://localhost:4000` (see `vite.config.ts`), so no CORS configuration is needed locally.

### Environment variables reference

**`server/.env`**

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | Prisma connection string |
| `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET` | Token signing secrets (must differ) |
| `JWT_ACCESS_TTL`, `JWT_REFRESH_TTL`, `JWT_REFRESH_TTL_SHORT` | Token lifetimes |
| `PORT` | API port (default `4000`) |
| `CLIENT_ORIGIN` | Allowed CORS origin(s), comma-separated |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM` | Optional real email delivery |

**`frontend/.env`**

| Variable | Purpose |
|---|---|
| `VITE_USE_MOCK_API` | `false` (default) talks to the real API; `true` uses an in-browser `localStorage` mock for offline UI work |
| `VITE_API_BASE_URL` | `/api` locally (proxied); the full deployed backend URL in production |

### Database migration & seeding

```bash
cd server
npx prisma migrate deploy   # applies the committed migration history
npm run seed                # safe to run repeatedly — no-ops if data already exists
```

The seed script checks for a known account (`commander@prahari-x.mil`) before writing anything, so it can never duplicate records or overwrite data you've created through the app.

### Build

```bash
# Backend
cd server && npm run build && npm start

# Frontend
cd frontend && npm run build && npm run preview
```

### Production deployment

Full step-by-step instructions (Neon database provisioning, Render backend deployment, Vercel frontend deployment, environment variables, and a manual verification checklist) are in **`DEPLOYMENT.md`**.

---

## Features

### Authentication
Portal-scoped registration and login (Commander vs. Soldier, enforced server-side), JWT access + rotating refresh tokens, "Remember me", session restoration on reload, active-session management with revocation, and login history — all in Settings → Security.

### Dashboard
Live stat cards, mission/threat trend charts, a personnel-readiness donut chart, a live threat feed, and recent missions — every widget is computed live from the database on each load, so it reflects the latest CRUD activity from anywhere in the app.

### Live Operations Map
An interactive MapLibre GL + OpenStreetMap tactical map plotting bases, personnel, squads, vehicles, missions, patrol routes, operational zones, threat indicators, and emergencies, with per-layer visibility toggles and a detail panel on marker selection.

### Analytics
A dedicated analytics suite of charts covering mission outcomes, personnel readiness, asset status, and threat trends.

### Command & Control Workflow
Assignment Center (issuing equipment/tasks to soldiers), Squads & Patrols management, an Approvals queue (leave requests and badge awarding), and shift scheduling — the full loop between what a Commander assigns and what a Soldier reports back.

### Operations
Full mission CRUD with filters, and a mission detail view with Overview / Objectives / Timeline / Squad / Equipment / Logs tabs, personnel and asset assignment drawers, and a "mark complete" action.

### Intelligence Center
A sector-density heatmap, category filters (cyber / drone / satellite / ground / signal), an AI-recommendation panel, and full threat-report CRUD with a "neutralize" action.

### Assets, Weapons & Inventory
Tabbed asset registries (vehicles, drones, weapons, medical, satellites) with condition tracking and maintenance dates, a dedicated Weapons & Ammunition module, and an inventory/logistics catalog — each with full CRUD and CSV export.

### Personnel & Unit Management
Roster CRUD, a profile drawer with health readiness and mission history, search and status filters, and a Unit Management view for organizing personnel into formal units.

### Training & Readiness, Fleet & Logistics, Medical & Comms, Base & Emergency, Situation Room
Purpose-built modules for training program tracking, fleet/logistics oversight, medical and communications status, base/emergency response coordination, and a situation-room briefing generator.

### Soldier Portal
A fully separate, role-gated experience scoped to the signed-in soldier: their missions, assigned equipment, training schedule, comms, and a profile page — plus field report and leave request submission that routes straight to the Commander's Approvals/notifications.

### AI Assistant
Multi-conversation chat with prompt suggestions, simulated streaming-style responses grounded in the same regions/missions/units seeded elsewhere in the app, conversation history, PDF export (via the browser print dialog), and conversation deletion.

### Settings
Profile editing (name, email, rank, unit, phone, avatar — synchronized to the linked Personnel record for Soldier accounts), password/2FA, appearance (theme/density/accent), notification preferences, device sessions, and audit logs.

### Notifications
A live notification center, refreshed via polling, covering mission updates, threat alerts, personnel changes, and system events — targeted per-user or broadcast to all command staff.

### Search
A global command palette (`⌘/Ctrl+K`) that searches live missions, personnel, assets, threats, and inventory alongside static navigation commands.

### Filtering & Data Tables
Status/category/priority filters across every module's list view, backed by a shared `DataTable` component with sorting via TanStack Table.

### Real-Time Sync (Polling-Based)
No WebSocket server is wired up (see [Future Improvements](#future-improvements)); instead, a shared `usePolling` hook refetches on an interval and whenever the browser tab regains focus/visibility, so Commander assignments and Soldier reports show up on the other portal without a manual reload.

### Cinematic Landing Intro
A fullscreen cinematic boot sequence plays before the marketing homepage (`components/intro/`, mounted by `pages/landing/IntroLandingPage.tsx` in front of the otherwise-untouched `LandingPage`): a black-void system boot with a blinking cursor, a boot terminal typing out classified telemetry alongside a node widget and encryption-progress readout, then the **AI Core** assembles — the hero of the whole sequence, a fully three-dimensional holographic reactor built with React Three Fiber/Three.js (`components/intro/core/`). It's a procedural black-glass globe (custom-GLSL Fresnel rim shaders, layered emissive lighting, an internal particle field, animated latitude/longitude grid lines, network nodes, and data-link lines — no texture maps), surrounded by roughly 28 independently rotating rings (segmented, arc, thin, tick, pulse, and scan-marker variants, each with its own radius, speed, tilt, and opacity), floating above a holographic projection platform connected by a custom-shader volumetric energy beam. A right-hand HUD stack (Mission Status, System Health, Signal Strength, System Check) and a ring of floating labels around the core reveal next, then a GSAP-driven title reveal (a metallic sheen sweep and a brief chromatic-glitch pass) for "PRAHARI X," followed by a "Scroll to Enter" prompt. A fully synthesized Web Audio cinematic score (tense pad, distant pulse, wind, rumble — no audio files, so nothing to host) starts automatically and fades in lockstep with the same scroll progress that dissolves the intro into the real homepage; scrolling back up re-hides the site navigation and brings the score back, and the Skip button drives that identical scroll-based transition rather than a separate shortcut. The AI Core's own camera framing is viewport-responsive (its field of view is derived from the live `window.innerWidth`/`innerHeight` aspect ratio, not a fixed pixel assumption) so the reactor's composition holds at any window size, aspect ratio, or browser zoom level. This is the second creative direction for this intro — an earlier, heavier React Three Fiber battlefield scene was torn out for a lightweight DOM/CSS/GSAP version, which was then itself superseded by this leaner, more constrained 3D reactor (procedural geometry and custom shaders only — no postprocessing pass, no GLTF models, no HDRI environment maps) once the earlier heaviness concerns were addressed structurally (see `EXPLAINER.md`, Q4 and Q7).

### Responsive Design
Tailwind-based responsive layouts across both portals, with a collapsible sidebar and mobile-aware navigation.

### Animations
Page transitions, staggered scroll reveals, animated count-up statistics, a magnetic-hover button, skeleton loading states, and a bespoke 3D mouse-parallax orbit hero on the landing page — see [Challenges Faced](#challenges-faced) for the engineering behind it.

### Role Management
Five command-staff roles (Commander, Intelligence Officer, Mission Planner, Logistics Officer, Administrator) plus Soldier, enforced through a single `COMMAND_ROLES` constant shared by the frontend's `RoleGate` and the backend's route guards.

### Security
Hashed passwords (bcrypt), hashed-at-rest refresh tokens, short-lived access tokens, Helmet security headers, multi-origin CORS allowlisting, and server-side (not just UI-level) portal/role enforcement.

### Performance Optimizations
Route-level code splitting (`React.lazy` per page), a CDN-loaded map library that only downloads on the page that needs it, GPU-friendly animation properties (opacity/transform), and skeleton states to keep layout stable during data loads.

---

## Challenges Faced

**Real-time-feeling sync without a WebSocket server.** The Commander and Soldier portals need to feel connected — an assignment issued by a Commander should show up for the soldier, and a field report submitted by a soldier should show up for command — but this project has no Socket.IO/SSE infrastructure. The solution was a shared `usePolling` hook that refetches on a fixed interval *and* whenever the browser tab regains focus or visibility, which covers the realistic case (a user switching back to the tab) far more cheaply than always-on polling, without the operational complexity of running a persistent WebSocket server.

**A relational schema that mirrors two very different portals.** Commander-side data (missions, squads, assets, intelligence) and Soldier-side data (assignments, field reports, leave, attendance) needed to share a single Personnel/User identity model without either portal leaking into the other's data. The resolution was a `User` table with an optional `personnelId` link: Commander accounts have no Personnel record (they run the roster, they aren't on it), Soldier accounts always do, and every route that returns "my data" filters strictly by the caller's own `personnelId` — never the roster at large.

**A geospatial map with zero real-world location data.** The Live Operations Map needed to render bases, squads, and threats at consistent map positions across reloads, without ever storing actual latitude/longitude for a fictional entity. The solution was a deterministic hash function (`mapGeo.ts`) that turns a location string like `"Himalayan Frontier Post"` into a stable `[lng, lat]` inside a fixed area of operations — the same string always hashes to the same point, so markers don't jump around between page loads, with no coordinate data to seed or maintain.

**Loading a mapping library without adding a heavy npm dependency.** MapLibre GL JS isn't in `package.json` — it's loaded lazily from a CDN, following MapLibre's own documented no-bundler integration path, the first time the Live Operations Map page is actually visited. This keeps the ~230KB library out of every other page's bundle while still giving the map full GL-accelerated rendering.

**One design system, many module "identities."** With over 20 distinct feature modules (Operations, Intelligence, Assets, Weapons, Training, Fleet, Medical & Comms, Base & Emergency, Situation Room, and more), the risk was either visual monotony or a system that felt like ten different products stitched together. The resolution was strict separation of what varies (page layout, iconography, one signature visual per page) from what's fixed (color tokens, spacing, radius, and the shared component primitives in `components/ui`) — every module is built from the same 20-odd primitives, but no two modules look interchangeable.

**Keeping the frontend genuinely swappable between mock and real data.** Early development needed the UI to be explorable with zero backend setup, but the finished product needed every page reading live from PostgreSQL with no code changes in between. `services/api.ts` is the single point every page imports from; it re-exports either the `localStorage`-backed `mockApi.ts` or the `fetch`-backed `realApi.ts` based on one environment variable, so the migration from "demo mode" to "production mode" touched exactly one file, not every page.

**An immersive cinematic intro that still had to build reliably.** The landing intro went through two real scope corrections, not one. The first version was built on React Three Fiber/Three.js — a full WebGL battlefield scene, a first-person weapon rig, postprocessing effects — which added real weight and fragility (heavy dependencies, WebGL-specific edge cases) for a submission that needed to build and run predictably every time in an environment with no way to actually execute `npm run build` to verify a change before shipping it. That was torn out for a lightweight DOM/CSS + GSAP + Motion rebuild instead. The **second** correction went the other direction: the DOM/CSS version was later replaced by the current React Three Fiber "AI Core" reactor once the project's creative direction called for a genuinely three-dimensional hero element — but this time the earlier heaviness was addressed structurally rather than by avoiding 3D altogether: no `EffectComposer`/postprocessing pass (it was implicated in an early transparent-background bug and removed for good, with glow instead carried entirely by emissive materials, additive blending, and custom Fresnel shaders), no GLTF models or HDRI environment maps (every surface is procedural geometry plus hand-written GLSL, avoiding any external asset fetch that could fail or slow the build), and every layer's world-space size derived from one shared coordinate system so the whole reactor scales together. Several rounds of this rebuild also fixed genuine root-cause bugs rather than symptom patches — a `<canvas>` clipping the reactor to an undersized CSS box (fixed by making the canvas truly fullscreen), a centering technique that used `vw`/`vh`-sized boxes translated by half their own width (which drifts from true page-center whenever a scrollbar changes the effective viewport width — replaced with scrollbar-immune `inset: 0` / `margin: auto` centering), and a fixed camera field-of-view that didn't compensate for aspect ratio (replaced with a live `window.innerWidth`/`innerHeight`-driven FOV calculation). Every change since the original React Three Fiber removal has been verified the only way possible without a build step — careful manual re-reading of each file against the actual library APIs, plus repo-wide greps for dangling references — rather than by compiling.

**Migrating the database engine without touching the schema.** Moving from local SQLite to production PostgreSQL (for Neon/Render/Vercel deployment) had to preserve every model, field, and relationship exactly — including getting foreign-key `onDelete` behavior (`CASCADE` vs `RESTRICT` vs `SET NULL`) correct across all 44 relations, which required auditing every `@relation` annotation in `schema.prisma` individually rather than assuming a single default.

---

## Future Improvements

- **Real-time push (WebSocket/SSE)** to replace interval polling for notifications and the live threat feed, reducing latency and unnecessary request volume.
- **Automated testing** — no unit, integration, or end-to-end tests currently exist; introducing Vitest/React Testing Library on the frontend and a request-level test suite (e.g. Supertest) on the API would be the highest-leverage next step before further feature work.
- **CI/CD pipeline** — there's no GitHub Actions (or equivalent) workflow yet; adding lint/typecheck/test/build gates on every pull request, plus automatic Render/Vercel deploys on merge, is a natural next step now that `render.yaml`/`vercel.json` exist.
- **Reintroduce email verification and OTP password reset.** These flows were deliberately simplified out for a faster-to-demo submission (the mailer templates and token helpers already exist in `server/src/lib/mailer.ts` and `tokens.ts`, just currently unused) — wiring them back into `/auth/register` and a `/auth/forgot-password` flow is a scoped, well-understood task.
- **Per-role UI, not just per-role route access.** Intelligence Officer, Mission Planner, Logistics Officer, and Administrator currently share the Commander's full navigation and view; tailoring each role's default dashboard and available actions would make the five-role model feel purposeful rather than cosmetic.
- **Monitoring & error tracking** (e.g. Sentry) in production, plus structured server logging beyond Morgan's request log.
- **A genuine file/image upload pipeline** (e.g. Cloudinary or S3) for profile photos and mission documents, which currently expect a URL rather than supporting direct upload.
- **Offline support / PWA** for the Soldier portal specifically, since field connectivity is the realistic constraint for that user.
- **Database-level rate limiting and audit alerting** — audit logs are recorded but not yet monitored or alerted on.
