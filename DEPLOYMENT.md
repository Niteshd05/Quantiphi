# Deployment

FXLens builds to **one deployable unit** — Express serves both the JSON API and
the built React SPA from a single process on a single port.

```bash
npm run build   # installs both halves, builds client → client/dist
npm start       # serves API + SPA on $PORT (default 5175)
```

Any host that runs a long-lived Node process will work. Below are the specifics.

---

## Recommended: Render

A `render.yaml` is included, so Render configures itself from the repo.

1. Push to GitHub.
2. Go to [dashboard.render.com](https://dashboard.render.com) → **New** → **Blueprint**.
3. Connect the repo. Render reads `render.yaml` and fills in the build/start commands.
4. **Create**. First build takes ~2–3 minutes.

Health check is wired to `/api/health`, which reports live provider status.

### Manual setup (without the blueprint)

| Setting | Value |
|---|---|
| Runtime | Node |
| Build command | `npm run build` |
| Start command | `npm start` |
| Health check path | `/api/health` |
| Node version | 22 |

No environment variables are required — the app runs on free, keyless APIs.

---

## Railway

1. [railway.app](https://railway.app) → **New Project** → **Deploy from GitHub repo**.
2. Railway auto-detects Node and reads the root `package.json` scripts.
3. Add a volume (Settings → Volumes), mount at `/data`, then set
   `DB_PATH=/data/fxlens.db` to make the database persistent.

Railway supports volumes on its paid usage-based plan.

---

## Fly.io

```bash
fly launch --no-deploy          # generates fly.toml; accept Node detection
fly volumes create fxlens_data --size 1
```

Then in `fly.toml`:

```toml
[mounts]
  source = "fxlens_data"
  destination = "/data"

[env]
  DB_PATH = "/data/fxlens.db"
```

```bash
fly deploy
```

---

## A note on persistence

The app writes to SQLite in five places: user favourites, conversion history,
and three cache layers (rates, history series, and the offline fallback).

**Favourites are the only user-visible casualty of an ephemeral filesystem.**
Everything else degrades gracefully — cached rates simply get re-fetched from
the providers, which is the normal cold-start path anyway.

| Host | Free tier persists? | How to fix |
|---|---|---|
| Render | ❌ Free plan cannot attach disks | Starter plan ($7/mo) + disk, set `DB_PATH` |
| Railway | ❌ Not on trial | Add a volume, set `DB_PATH` |
| Fly.io | ✅ Volumes on free allowance | Works out of the box |

`DB_PATH` is read in [`server/src/db/index.js`](server/src/db/index.js) and
creates its parent directory automatically, so pointing it at a mounted disk
needs no code change.

---

## Why not Vercel

Vercel runs serverless functions with a **read-only filesystem** (except `/tmp`,
which is ephemeral and per-instance). Two consequences:

1. **Favourites silently vanish** — a POST succeeds, then the row disappears
   when the instance recycles. A core feature appears broken rather than absent.
2. **Caching degrades to memory-only**, so cold starts always hit the providers.
   ExchangeRate-API's open tier rate-limits at roughly one request per hour per
   IP and returns HTTP 429 with a 20-minute ban — the SQLite tier exists
   specifically to absorb that.

`better-sqlite3` is also a native binary that must match the Lambda runtime.

**To deploy on Vercel anyway**, swap SQLite for a hosted database. The data
layer is isolated behind `server/src/db/index.js` for exactly this reason:

- **Turso** (libSQL) — same SQLite dialect, so the queries port nearly as-is.
  Smallest change.
- **Vercel Postgres / Neon** — needs the SQL rewritten to Postgres dialect
  (`?` → `$1` placeholders, `INSERT … ON CONFLICT` syntax differences).

---

## Local production check

Verify the production path before deploying:

```bash
npm run build
npm start
# → http://localhost:5175
```

This is the exact code path the host runs.
