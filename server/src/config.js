const num = (v, d) => (Number.isFinite(Number(v)) && v !== '' ? Number(v) : d);

export const config = {
  port: num(process.env.PORT, 5175),
  apiKey: process.env.EXCHANGERATE_API_KEY?.trim() || null,
  rateCacheTtl: num(process.env.RATE_CACHE_TTL, 600) * 1000,
  historyCacheTtl: 6 * 60 * 60 * 1000,
  requestTimeout: 12000,

  // Typical real-world FX markups by channel. Sourced from published industry
  // averages, not live vendor quotes — surfaced as such in the UI. Tunable here.
  markups: [
    { id: 'digital', label: 'Digital wallet', hint: 'Wise, Revolut standard', pct: 0.006, icon: 'zap' },
    { id: 'card',    label: 'Credit card',    hint: 'Typical 2.9% FX fee',    pct: 0.029, icon: 'card' },
    { id: 'bank',    label: 'Bank transfer',  hint: 'High-street bank rate',  pct: 0.035, icon: 'bank' },
    { id: 'airport', label: 'Airport kiosk',  hint: 'Worst-case walk-up',     pct: 0.12,  icon: 'plane' },
  ],

  // Travel Budgeting mode always shows 5 comparison currencies. The base is
  // excluded from its own comparison, so this list is deliberately longer than
  // 5 — the route takes the first 5 that aren't the base.
  travelBasket: ['USD', 'EUR', 'GBP', 'JPY', 'INR', 'AUD', 'CAD'],
};
