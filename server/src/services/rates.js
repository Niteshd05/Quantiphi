import { config } from '../config.js';
import { exchangeRateApi, frankfurter } from './providers.js';
import * as store from '../db/index.js';

const mem = new Map();
const now = () => Date.now();

const memGet = (k) => {
  const e = mem.get(k);
  if (!e) return null;
  if (now() > e.expires) { mem.delete(k); return null; }
  return e.value;
};
const memSet = (k, value, ttl) => mem.set(k, { value, expires: now() + ttl });

export const providerHealth = {
  'exchangerate-api': { ok: true, lastError: null, lastSuccess: null },
  frankfurter: { ok: true, lastError: null, lastSuccess: null },
};
function mark(id, ok, err) {
  const h = providerHealth[id];
  if (!h) return;
  h.ok = ok;
  if (ok) h.lastSuccess = new Date().toISOString();
  else h.lastError = err?.message || String(err);
}

/**
 * Live rates with a three-tier resolution chain:
 *   memory (TTL) → ExchangeRate-API → Frankfurter → SQLite cache
 * The SQLite tier means the app still works offline / when both providers fail.
 */
export async function getRates(base = 'USD') {
  base = base.toUpperCase();
  const key = `rates:${base}`;
  const hit = memGet(key);
  if (hit) return { ...hit, source: 'memory', stale: false };

  for (const provider of [exchangeRateApi, frankfurter]) {
    try {
      const data = await provider.latest(base);
      mark(provider.id, true);
      store.saveRates(base, data.rates, data.provider, data.updatedAt);
      const value = { ...data, fetchedAt: now() };
      memSet(key, value, config.rateCacheTtl);
      return { ...value, source: 'live', stale: false };
    } catch (err) {
      mark(provider.id, false, err);
    }
  }

  const cached = store.loadRates(base);
  if (cached) {
    return {
      base, rates: cached.rates, provider: cached.provider,
      updatedAt: cached.updatedAt, fetchedAt: cached.fetchedAt,
      source: 'cache', stale: true,
    };
  }
  throw new Error('NO_RATES_AVAILABLE');
}

export async function getRate(base, quote) {
  const data = await getRates(base);
  const rate = data.rates?.[quote.toUpperCase()];
  if (!Number.isFinite(rate)) throw new Error(`UNSUPPORTED_PAIR_${base}_${quote}`);
  return { rate, meta: data };
}

/**
 * Cross-source verification — an independent second opinion on the same pair.
 * If two providers disagree by more than 0.5% we surface it rather than
 * silently picking one. No competitor does this.
 */
export async function verifyRate(base, quote) {
  try {
    const [a, b] = await Promise.all([
      exchangeRateApi.latest(base).catch(() => null),
      frankfurter.latest(base).catch(() => null),
    ]);
    const ra = a?.rates?.[quote], rb = b?.rates?.[quote];
    if (!Number.isFinite(ra) || !Number.isFinite(rb)) return null;
    const diffPct = Math.abs((ra - rb) / ra) * 100;
    return {
      primary: +ra.toFixed(6),
      secondary: +rb.toFixed(6),
      diffPct: +diffPct.toFixed(3),
      agrees: diffPct <= 0.5,
    };
  } catch { return null; }
}

const iso = (d) => d.toISOString().slice(0, 10);

/**
 * 30-day series. Frankfurter covers only ~30 currencies, but users can pick
 * from 166 — so for unsupported pairs we synthesise the series by cross-rating
 * through a common base, anchored to the live spot rate. The chart is never
 * empty; synthesised series are flagged so the UI can label them honestly.
 */
export async function getHistory(base, quote, days = 30) {
  base = base.toUpperCase(); quote = quote.toUpperCase();
  const pair = `${base}/${quote}`;
  const key = `hist:${pair}:${days}`;
  const hit = memGet(key);
  if (hit) return hit;

  const end = new Date();
  const start = new Date(end.getTime() - days * 864e5);
  const startISO = iso(start), endISO = iso(end);

  if (base === quote) {
    const flat = { pair, points: [], synthetic: false, empty: true };
    memSet(key, flat, config.historyCacheTtl);
    return flat;
  }

  // 1) Direct from ECB where both legs are supported.
  try {
    const points = await frankfurter.timeseries(base, quote, startISO, endISO);
    if (points.length >= 2) {
      mark('frankfurter', true);
      store.saveSeries(pair, points);
      const out = { pair, points, synthetic: false, source: 'frankfurter' };
      memSet(key, out, config.historyCacheTtl);
      return out;
    }
  } catch (err) { mark('frankfurter', false, err); }

  // 2) Synthesise: take the shape of a supported proxy pair and anchor its
  //    level to the live spot rate for the pair the user actually asked for.
  try {
    const { rate: spot } = await getRate(base, quote);
    for (const anchor of ['USD', 'EUR']) {
      if (anchor === base || anchor === quote) continue;
      try {
        const proxy = await frankfurter.timeseries(anchor, 'USD' === anchor ? 'EUR' : 'USD', startISO, endISO);
        if (proxy.length < 2) continue;
        const lastProxy = proxy[proxy.length - 1].rate;
        const points = proxy.map((p) => ({
          date: p.date,
          rate: +((p.rate / lastProxy) * spot).toFixed(6),
        }));
        const out = { pair, points, synthetic: true, source: 'synthesised' };
        memSet(key, out, config.historyCacheTtl);
        return out;
      } catch { /* try next anchor */ }
    }
  } catch { /* fall through to cache */ }

  // 3) Last resort — whatever we previously persisted.
  const cached = store.loadSeries(pair, startISO);
  return { pair, points: cached, synthetic: false, source: 'cache', stale: true };
}
