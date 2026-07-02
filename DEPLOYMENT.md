# PRAHARI X — Production Deployment (Neon + Render + Vercel)

This covers moving PRAHARI X from local SQLite to a deployed PostgreSQL
stack: **Neon** (database), **Render** (API), **Vercel** (frontend).

## What's already done in the codebase

- `server/prisma/schema.prisma` — datasource switched from `sqlite` to
  `postgresql`. No models, fields, or relations changed.
- `server/prisma/migrations/20260701192900_npm_run_seed/migration.sql` —
  rewritten with PostgreSQL DDL for all 30 tables (same schema, Postgres
  syntax: trailing `PRIMARY KEY` constraints, `ALTER TABLE ... ADD
  CONSTRAINT` for foreign keys, `TIMESTAMP(3)` columns).
- `server/scripts/migrate-sqlite-to-postgres.ts` — one-time script that
  copies every row out of your local `dev.db` into Postgres, preserving IDs
  and relationships. Refuses to run if the target already has data.
- `server/package.json` — added `postinstall` (`prisma generate`), changed
  `start` to run `prisma migrate deploy` before booting, added
  `migrate:data` script and `better-sqlite3` as a dev dependency.
- `server/src/index.ts` — CORS now accepts a comma-separated
  `CLIENT_ORIGIN` list instead of a single origin.
- `render.yaml` (repo root) and `frontend/vercel.json` — deployment configs.
- `.env.example` files (both apps) — updated with production variable
  guidance.

**What I could not do, and why:** I have no shell access, no browser/computer
control, and no cloud credentials in this session — so I cannot create your
Neon/Render/Vercel accounts, run `prisma migrate deploy` against a live
database, push this code to git, click through either dashboard, or verify
a live deployed URL. Account creation and live deployment are also outside
what I should do on your behalf even if I had the tools. Everything below
is the exact sequence for you to run — I've written it as literally as I
can so there's no guesswork.

---

## 0. One thing to fix before you push to git

`server/.env` (your real local file, not `.env.example`) has a commented-out
Gmail address and app password on the `SMTP_USER` / `SMTP_PASS` lines. It's
already covered by `server/.gitignore`, so it won't get committed as-is —
but since it's a live, working Gmail app password sitting in plaintext,
rotate it (Google Account → Security → App passwords) if you ever shared
this folder or a screenshot of it, and never enter real SMTP credentials
into a file that could later be un-ignored. On Render, set `SMTP_*` values
through the dashboard's environment variable UI instead.

---

## 1. Create the Neon database

1. Sign up / log in at neon.tech, create a project (any region close to
   where Render will run — see step 3).
2. In the project's **Connection Details** panel, copy the **pooled**
   connection string (hostname contains `-pooler`). Postgres running behind
   Render needs the pooled endpoint, not the direct one.
3. Optional but recommended: create a **branch** off this project for local
   development (Neon branches are cheap, isolated copies of the database),
   so local testing never touches the same data as production.

## 2. Apply the schema to Neon and migrate your existing data

Run these from your machine, inside `server/`:

```bash
# Point at Neon for this step
export DATABASE_URL="postgresql://user:pass@ep-xxxx-pooler.region.aws.neon.tech/prahari_x?sslmode=require"

npx prisma generate
npx prisma migrate deploy      # creates all 30 tables in Neon

npm install                    # pulls in better-sqlite3 for the next step

# Copies every row from your local prisma/dev.db into Neon, preserving IDs.
# Refuses to run if Neon already has any User rows, so it's safe to re-run.
npm run migrate:data

npx prisma studio               # points at Neon now — verify record counts
```

If `prisma/dev.db` isn't at the default path, set `SQLITE_SOURCE_PATH`
before running `migrate:data`.

If you'd rather start Neon with fresh demo data instead of your local
records, run `npm run seed` instead of `migrate:data` — it has the same
idempotency guard (skips entirely if `commander@prahari-x.mil` already
exists) and won't run twice.

## 3. Push to git

Both apps need to be in a git repo that Render and Vercel can pull from
(GitHub is the simplest). `.env` files are already gitignored in both
`server/` and `frontend/` — confirm `git status` doesn't show them before
your first push.

## 4. Deploy the backend to Render

**Via Blueprint (uses `render.yaml` at the repo root):**
1. Render dashboard → New → Blueprint → connect the repo.
2. Render reads `render.yaml` and provisions `prahari-x-api` with root
   directory `server`.
3. Fill in the env vars marked `sync: false` in the dashboard:
   `DATABASE_URL` (same Neon pooled string), `JWT_ACCESS_SECRET` and
   `JWT_REFRESH_SECRET` (generate two different long random strings, e.g.
   `openssl rand -base64 48`), `CLIENT_ORIGIN` (fill in once you have the
   Vercel URL — step 5), and `SMTP_*` if you want real email.
4. Deploy. The build runs `npm install && npm run build`; `postinstall`
   generates the Prisma client; `preDeployCommand` runs
   `prisma migrate deploy` (no-ops since you already applied it in step 2);
   `start` runs `prisma migrate deploy` again as a safety net, then boots
   the server.
5. Confirm `https://<your-service>.onrender.com/health` returns
   `{"status":"ok"}`.

**Railway alternative:** no blueprint file is used — create a new service
from the repo, set its root directory to `server`, set the same env vars,
and Railway will run `npm install`/`npm start` from `server/package.json`
directly (same postinstall/preDeploy-equivalent behavior via `start`).

## 5. Deploy the frontend to Vercel

1. Vercel dashboard → New Project → import the repo → set **Root
   Directory** to `frontend`.
2. Vercel auto-detects Vite; `frontend/vercel.json` supplies the SPA
   rewrite rule so client-side routes (e.g. `/app/operations-map`) work on
   direct load/refresh, not just in-app navigation.
3. Add environment variable `VITE_API_BASE_URL` = your Render URL + `/api`,
   e.g. `https://prahari-x-api.onrender.com/api`. This is baked in at build
   time, so set it before the first deploy (or redeploy after adding it).
4. Deploy. Note the resulting `https://….vercel.app` domain.

## 6. Close the loop on CORS

Go back to Render, set `CLIENT_ORIGIN` to the Vercel domain from step 5
(comma-separate if you also want to allow a preview-deploy domain or
`localhost:5173`), and redeploy the backend.

## 7. Verify — do this yourself, since I can't reach a live URL

- Load the Vercel URL, register a new account on each portal, log in as
  both a seeded Commander account and a seeded Soldier account.
- Dashboards, Operations Map, Analytics, Personnel, Assets, Missions,
  Notifications, Chat, Settings/profile update — confirm each reads real
  data and that a change in one (e.g. editing a profile, creating an
  assignment) shows up immediately on the page that consumes it.
- Open `npx prisma studio` against the Neon `DATABASE_URL` and confirm the
  record counts match what you saw before deploying, and that new records
  created through the UI appear there.
- Refresh the browser on a deep route (e.g. `/app/operations-map`) directly
  — confirms the Vercel SPA rewrite is working.
- Check Render logs for the `[MAIL]` startup line to confirm which email
  mode is active.

---

### Local development going forward

`schema.prisma` now targets Postgres only — the old `DATABASE_URL="file:./dev.db"`
option no longer works. For local dev, either run a local Postgres instance
or use a Neon branch (step 1.3), and update your local `server/.env`
`DATABASE_URL` accordingly.
