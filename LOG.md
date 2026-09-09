# FXLens — Build Log
Running record of decisions, state, and progress. **Read this first to resume after a session break.**

---

## Session 1 — 2026-09-09

### Current status
**Phase 3 complete. Backend + frontend built and verified against live APIs.**

### Decision log

**D1 · Dual-provider data layer.** *(Phase 0, research)*
Probed both APIs live before writing code. ExchangeRate-API open tier = 166 currencies but **no historical data**. Frankfurter (ECB) = free timeseries back to 1999 but **only 30 currencies**. Neither satisfies the brief alone.
→ Live rates from ExchangeRate-API, history from Frankfurter, each failing over to the other, both backstopped by SQLite. Rationale: the brief names ExchangeRate API, so it stays primary for conversion; history is additive rather than a substitution.

**D2 · Cross-rate synthesis for history.** Frankfurter covers 30 currencies; users can pick from 166. For an unsupported pair we rebuild the series through a common base (EUR/USD) using the current ratio anchored to the historical shape.
→ Chart is **never empty**. Synthesized series are flagged `synthetic: true` so the UI can label them honestly rather than implying ECB precision we don't have.

**D3 · No chart library.** Hand-rolled SVG instead of Recharts/Chart.js.
→ Saves ~180 KB, gives exact control over the neumorphic styling and the draw-in animation, and removes a dependency. The chart is one path plus one gradient — a library is overkill.

**D4 · Accessible neumorphism.** Research shows neumorphism structurally fails WCAG: low contrast *is* the aesthetic, and shadow-only affordances are invisible to screen readers.
→ Kept soft extruded surfaces, but text ≥4.5:1, interactive borders ≥3:1, real focus rings, ARIA labels. Depth is decoration; it never carries meaning alone.

**D5 · No Ollama / no LLM.** Considered for the "is this a good time to convert" verdict.
→ Rejected. It's a comparison of spot vs. 30-day mean and stdev — deterministic stats are faster, free, reproducible, and correct. An LLM would add latency and a hallucination surface to arithmetic. *(If narrative summaries are ever wanted: POST to `http://localhost:11434/api/generate`, model `llama3.2`, feeding the stats block from `analytics.js`. Deliberately not wired in.)*

**D6 · `better-sqlite3` over `node:sqlite`.** Synchronous API suits a request-scoped cache, is battle-tested, and avoids Node's still-experimental built-in. Single `db/index.js` seam so Postgres is a drop-in later.

**D7 · Three-tier cache.** Memory (10 min TTL) → SQLite → network. Cuts provider calls hard, which matters because the open tier rate-limits at ~1 req/hr/IP with a 20-minute ban on 429.

**D8 · True Cost Engine is the headline USP.** Research finding: every competitor shows mid-market, nobody shows what you actually receive; markup is the #1 traveler complaint. Markup constants (card 2.9%, bank 3.5%, airport 12%, digital 0.6%) are transparent, cited in the UI as typical industry figures, and live in one config object so they're tunable — not presented as live quotes from named vendors.

**D9 · Flag emoji replaced with SVG assets.** *(found in browser verification)*
Rendered the UI in Chromium and saw flags showing as letter boxes ("US", "IN") rather than 🇺🇸🇮🇳. Diagnosed rather than guessed: the regional-indicator codepoints were correct, but **Windows ships no country-flag glyphs** — Segoe UI Emoji deliberately renders those pairs as letters. This affects every Windows user.
→ New `Flag.jsx` uses flagcdn SVGs with a currency→ISO-3166 map, falling back to a styled code badge on error (offline, blocked, or codes with no country like XDR). Verified 11/11 flags load.

**D10 · Travel mode now always returns 5 currencies.** *(found in verification)*
The basket was exactly the 5 majors, and the route correctly excludes the base from its own comparison — so a USD user saw only 4 rows, against a brief that specifies 5.
→ Basket extended to 7 (AUD, CAD added); the route drops the base then takes 5. Verified across USD/EUR/INR/JPY bases — all return 5.

### Verification performed (live, not assumed)
- All 8 endpoints exercised against live APIs; conversion, history, travel, favorites, verify confirmed returning real data.
- Synthesis fallback confirmed on USD→AED (outside ECB's 30): 22 points returned, correctly flagged `synthetic`.
- Cross-source verification: providers agreed within 0.014%.
- Input validation: bad currency code → HTTP 400.
- Zero-decimal currency (JPY) → `decimals: 0` respected.
- Browser render at 1440px and 390px: zero console errors, chart paths present, true-cost rows present, dark theme confirmed.
- Production build: 55 KB gzipped JS + 3.7 KB CSS; Express serves SPA and API from one process.

### API contract (verified live, 2026-09-09)
- `open.er-api.com/v6/latest/{BASE}` → `{result, rates{166}, time_last_update_utc, time_next_update_unix}`
- `api.frankfurter.dev/v1/{start}..{end}?base=X&symbols=Y` → `{rates: {"YYYY-MM-DD": {SYM: n}}}` — business days only
- `api.frankfurter.dev/v1/currencies` → 30 codes

### Gotchas hit
- Frankfurter returns **business days only** — no weekend points. Chart must not assume contiguous dates; x-axis is positional over returned points, gaps are real.
- ExchangeRate-API open tier: exceeding ~1 req/hr risks HTTP 429 + **20-min IP ban**. Makes the memory cache load-bearing, not an optimization.
- ER-API's `rates` object includes the base itself at `1` — filter before display.
- Frankfurter `base=USD` omits USD from `rates`; must be re-inserted as 1.0 when normalizing.

### Resume checklist
1. `cd server && npm install && npm run dev` (port 5175)
2. `cd client && npm install && npm run dev` (port 5173, proxies /api)
3. `curl localhost:5175/api/health` → provider + cache status
4. Data resets safely: delete `server/fxlens.db`, it rebuilds on boot.
