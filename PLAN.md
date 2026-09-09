# FXLens — Currency Converter with Real-Rate Intelligence
**Plan & Architecture** · Owner: Nitesh · Created: 2026-09-09

---

## 1. Problem Statement (as given)
Build a clean, fast real-time currency converter with historical trend visualization.

| Required | Where it lands |
|---|---|
| Dual converter (source/target dropdowns + input) | `ConverterCard` |
| Trend chart, 30-day line graph | `TrendChart` (custom SVG) |
| Favorites list of currency pairs | `FavoritesRail` + SQLite |
| Live rates via ExchangeRate API | `services/rates.js` |
| SQLite caching of history + favorites | `db/schema.sql` |
| **Vibe check:** Travel Budgeting mode → 1 amount → 5 major currencies | `TravelBudget` + `/api/travel` |

---

## 2. Competitive Research → Gaps We Exploit

Researched XE, Wise, Revolut, Google Currency Converter, and the App Store travel-converter category.

| # | Gap found in existing apps | Evidence | Our answer (USP) |
|---|---|---|---|
| G1 | **Mid-market rate is a lie by omission.** Every app shows the mid-market rate; nobody actually gets it. Banks/booths add 2–3%, cards add ~3% FX fee. | XE advertises "zero fees" while the profit sits in the rate; Revolut adds +1% on weekends. | **True Cost Engine** — show mid-market *and* what you'll really receive across 4 channels (card, bank, airport kiosk, digital wallet), with the markup cost in cash. |
| G2 | **XE removed offline rate caching in 2025/26.** Rates are most needed at an airport/border with no data. | Documented regression; travel apps like TravelSpend stay usable offline. | **Offline-first.** SQLite server cache + `localStorage` client snapshot. App fully works with no network, banner shows rate age. |
| G3 | **Single point of failure.** One API down = dead app. | ExchangeRate-API open tier rate-limits (HTTP 429, 20-min IP ban). | **Dual-provider with failover + cross-verification.** Two independent sources; if they disagree >0.5% we flag it. |
| G4 | **Weekend/stale-rate blindness.** ECB doesn't publish weekends; apps silently show Friday's rate as "live". | Frankfurter returns only business days. | **Rate freshness badge** — LIVE / CACHED / STALE with exact age + next-update time. |
| G5 | **Charts are decorative,** not decision-support. A line with no read on it. | Generic app-store converters. | **Trend intelligence** — 30d change %, volatility, hi/lo, and a plain-English "good/bad time to convert" verdict vs. the 30-day mean. |
| G6 | Neumorphism looks great, **fails WCAG** (low contrast is the aesthetic). | Text on matched surfaces falls below 4.5:1; shadow-only affordances invisible to screen readers. | **Accessible neumorphism** — soft surfaces, but AA-compliant text, real borders + focus rings on every control, ARIA labels throughout. |

---

## 3. Data Layer — the key architectural decision

Probed both APIs live before designing:

| Provider | Currencies | History | Key | Verdict |
|---|---|---|---|---|
| ExchangeRate-API (`open.er-api.com`) | **166** | ❌ none on free tier | none | Primary for *live* |
| Frankfurter (ECB, `api.frankfurter.dev`) | 30 | ✅ **timeseries back to 1999** | none | Primary for *history*, failover for live |

**Neither alone satisfies the brief.** ExchangeRate-API has breadth but no history; Frankfurter has history but only 30 currencies. So:

- **Live rates** → ExchangeRate-API (166 ccy) → falls back to Frankfurter → falls back to SQLite cache.
- **30-day history** → Frankfurter timeseries. For currencies outside its 30, we **synthesize** the series by cross-rating through EUR/USD, so the chart never comes up empty.
- Everything that returns is written to SQLite, which is the last-resort source. Result: **the app never shows a blank state.**

---

## 4. Architecture

```
client/ (React + Vite)          server/ (Express)            data
  ConverterCard      ──HTTP──►  /api/rates/:base    ──►  providers/erapi.js
  TrendChart                    /api/history        ──►  providers/frankfurter.js
  TravelBudget                  /api/travel                    │
  FavoritesRail                 /api/favorites      ──►  SQLite (better-sqlite3)
  TrueCostPanel                 /api/history(conv)         rate_cache
                                                           rate_history
                                                           favorites
                                                           conversions
```

**Server** — Express + `better-sqlite3` (synchronous, zero-config, single file, ideal for this).
**Client** — React 18 + Vite. Chart is hand-rolled SVG: no chart library, so it's ~0 KB extra, fully themeable, and animates exactly how we want.
**Caching** — in-memory TTL (10 min) in front of SQLite in front of the network. Three tiers.

---

## 5. UI/UX Direction — "Accessible Neumorphism"

- **Soft-extruded surfaces** on a warm neutral ground; dual light/dark shadow pairs. Pressed state = inset shadow (real tactile feedback).
- **Contrast discipline:** body text ≥ 4.5:1, interactive borders ≥ 3:1, visible focus ring on every control. This is where most neumorphic UIs fail.
- **Everything essential on one screen** — no tabs, no drill-down. Converter, chart, verdict, favorites, and travel mode all above/near the fold on desktop; single-column reflow on mobile.
- **Motion:** spring-eased number roll-ups, chart path draw-in, staggered card entrance. All under 400 ms. Respects `prefers-reduced-motion`.
- **Responsive:** 3-col desktop → 2-col tablet → 1-col mobile. Touch targets ≥ 44 px.

---

## 6. Task List

### Phase 1 — Backend
- [ ] T1 Scaffold server, package.json, env config
- [ ] T2 SQLite schema + migrations (4 tables, indices)
- [ ] T3 Provider: ExchangeRate-API (live, 166 ccy)
- [ ] T4 Provider: Frankfurter (history + failover)
- [ ] T5 Rate service: 3-tier cache, failover chain, cross-rate synthesis
- [ ] T6 True Cost engine (4 channels, markup maths)
- [ ] T7 Trend analytics (change %, volatility, hi/lo, verdict)
- [ ] T8 Routes: rates, convert, history, travel, favorites, health
- [ ] T9 Currency metadata (166 codes: name, symbol, flag, decimals)

### Phase 2 — Frontend
- [ ] T10 Vite + React scaffold, design tokens, neumorphic CSS system
- [ ] T11 `useRates` / `useDebounce` / `useLocalStorage` hooks + API client w/ offline fallback
- [ ] T12 ConverterCard — searchable dropdowns, swap, live convert
- [ ] T13 TrendChart — SVG line, gradient fill, hover crosshair, tooltip
- [ ] T14 TrueCostPanel — channel comparison table
- [ ] T15 FavoritesRail — add/remove/select, persisted
- [ ] T16 TravelBudget — 5-currency comparison table
- [ ] T17 Header: freshness badge, theme toggle, offline banner
- [ ] T18 Responsive passes + a11y audit + reduced-motion

### Phase 3 — Ship
- [ ] T19 README, .env.example, single-command run
- [ ] T20 End-to-end verification against live APIs

---

## 7. Scalability & Deployability
- **Stateless server** — SQLite is a cache, not a source of truth; swap for Postgres/Redis via the single `db` module.
- **Provider interface** is uniform — adding a paid provider is one file.
- **Env-driven config**, no hardcoded secrets. Optional `EXCHANGERATE_API_KEY` unlocks the keyed tier without a code change.
- **Client builds to static assets**, served by the same Express process → one deployable unit (Docker/Railway/Render/Fly).
- **Ollama** — not required. No task here needs an LLM; the "good time to convert" verdict is deterministic statistics, which is faster, free, and reproducible. Hook documented in LOG.md if we ever want narrative summaries.
