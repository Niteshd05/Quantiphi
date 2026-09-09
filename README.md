# FXLens 💱

**Real-time currency conversion with true-cost intelligence and 30-day trend analysis.**

Most converters answer *"what is the mid-market rate?"* — a number almost nobody
actually receives. FXLens answers the question travellers really have:
**"how much money will actually land in my pocket?"**

---

## Quick start

```bash
# 1. Backend  (port 5175)
cd server && npm install && npm run dev

# 2. Frontend (port 5173, proxies /api)
cd client && npm install && npm run dev
```

Open **http://localhost:5173**.

**No API key or configuration is required** — the app runs entirely on free,
keyless endpoints out of the box.

### Production (single deployable unit)

```bash
cd client && npm install && npm run build   # emits client/dist
cd ../server && npm install && npm start    # serves API + built SPA on :5175
```

---

## Features

### Core
- **Dual converter** — searchable source/target selectors across **160+ currencies**, live conversion, one-tap swap.
- **30-day trend chart** — hand-rolled SVG line graph with hover crosshair, 7/30/90-day ranges, and animated draw-in.
- **Favourites** — pin frequently used pairs; each shows its live rate and 30-day change. Persisted in SQLite.
- **Travel Budgeting mode** — one base amount converted into 5 major currencies simultaneously in a comparison table.

### What makes it different

| Feature | Why it exists |
|---|---|
| **True Cost Engine** | Every app shows mid-market; nobody gets it. We show what you'd actually receive across 4 channels (digital wallet, card, bank, airport kiosk) and what the best-vs-worst spread is worth in cash. On $1,000 → INR that gap is **₹11,381**. |
| **Offline-first** | XE dropped offline caching in 2025/26 — yet an airport or border is exactly where you have no signal. Rates are cached server-side (SQLite) and client-side (localStorage); the app keeps working offline, clearly labelled. |
| **Dual-provider failover** | Two independent rate sources. If one is down or rate-limited, the other takes over; SQLite backstops both. The app never shows a blank state. |
| **Cross-source verification** | An independent second opinion on every rate. If the two providers disagree by >0.5%, we say so instead of silently picking one. |
| **Trend intelligence** | Not a decorative line — 30-day change, volatility, high/low, and a plain-English verdict on whether now is a good time to convert (deterministic statistics, not a guess). |
| **Freshness transparency** | LIVE / CACHED / OFFLINE badge with the exact timestamp. ECB publishes business days only; we never pass off Friday's rate as "live". |

---

## Architecture

```
client/  React 18 + Vite          server/  Express + better-sqlite3
  App.jsx                            routes/api.js
  components/                        services/
    CurrencySelect  TrendChart         rates.js      3-tier cache + failover
    TrueCostPanel   FavoritesRail      providers.js  ExchangeRate-API + Frankfurter
    TravelBudget                       analytics.js  trend stats + true cost
  hooks/  lib/                         currencies.js 160 codes, symbols, flags
                                     db/index.js     SQLite schema + queries
```

### The data-layer decision

Both APIs were probed live before any code was written:

| Provider | Currencies | History | Key | Role |
|---|---|---|---|---|
| ExchangeRate-API (`open.er-api.com`) | **166** | ❌ none free | none | Live rates |
| Frankfurter / ECB | 30 | ✅ back to 1999 | none | History + failover |

Neither satisfies the brief alone — one has breadth without history, the other
history without breadth. So live conversion uses ExchangeRate-API, history uses
Frankfurter, each fails over to the other, and SQLite backstops both.

For pairs outside the ECB's 30 currencies, the series is **synthesised** from a
correlated pair anchored to the live spot rate, and flagged as such in the UI —
so the chart is never empty, and never overstates its precision.

**Resolution chain:** in-memory (10 min TTL) → SQLite → ExchangeRate-API → Frankfurter → cached.

---

## API

| Endpoint | Purpose |
|---|---|
| `GET /api/health` | Provider status, uptime |
| `GET /api/currencies` | 160 currencies with symbols, flags, decimals |
| `GET /api/rates/:base` | Full rate table for a base |
| `GET /api/convert?from&to&amount` | Conversion + true-cost breakdown |
| `GET /api/history?from&to&days` | Time series + trend analytics |
| `GET /api/travel?base&amount` | 5-currency comparison |
| `GET /api/verify?from&to` | Cross-source rate verification |
| `GET/POST/DELETE /api/favorites` | Favourite pair management |

---

## Design: accessible neumorphism

Neumorphism has a documented structural accessibility problem — low contrast
*is* the aesthetic, and shadow-only affordances are invisible to screen readers.
We kept the soft extruded surfaces but fixed the failure modes:

- Body text ≥ 4.5:1, interactive borders ≥ 3:1 (WCAG AA)
- Visible focus ring on every control; full keyboard navigation
- Depth is decoration — it never carries meaning alone; ARIA labels throughout
- `prefers-reduced-motion` fully respected
- Light + dark themes; in dark mode highlights are never pure white (which turns soft moulding into harsh plastic)
- Responsive: 2-column desktop → single column ≤1040px → stacked ≤620px, touch targets ≥44px

---

## Configuration

All optional — see `server/.env.example`.

| Variable | Default | Purpose |
|---|---|---|
| `PORT` | `5175` | Server port |
| `EXCHANGERATE_API_KEY` | *(none)* | Unlocks the keyed tier; open access used automatically without it |
| `RATE_CACHE_TTL` | `600` | Live-rate cache TTL (seconds) |

## Scalability notes

- **Stateless server** — SQLite is a cache, not a source of truth. Swap for Postgres/Redis behind the single `db/index.js` seam.
- **Uniform provider interface** — adding a paid source is one file.
- **One deployable artifact** — Express serves the built SPA; deploys to Docker/Railway/Render/Fly unchanged.
- **No LLM dependency** — the "good time to convert" verdict is spot-vs-mean statistics: faster, free, reproducible, and correct.

---

Rates from [ExchangeRate-API](https://www.exchangerate-api.com) and the European
Central Bank via [Frankfurter](https://frankfurter.dev). Mid-market rates are
shown for reference and are not an offer to exchange.
