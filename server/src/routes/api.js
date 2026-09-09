import { Router } from 'express';
import { config } from '../config.js';
import * as rates from '../services/rates.js';
import { analyseSeries, trueCost } from '../services/analytics.js';
import { CURRENCIES, meta } from '../services/currencies.js';
import * as store from '../db/index.js';

export const api = Router();
const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
const CODE = /^[A-Z]{3}$/;
const code = (v, fallback) => {
  const c = String(v || fallback).toUpperCase();
  if (!CODE.test(c)) throw Object.assign(new Error('INVALID_CURRENCY_CODE'), { status: 400 });
  return c;
};

api.get('/health', wrap(async (_req, res) => {
  res.json({
    ok: true,
    uptime: process.uptime(),
    providers: rates.providerHealth,
    keyed: Boolean(config.apiKey),
    time: new Date().toISOString(),
  });
}));

api.get('/currencies', (_req, res) => {
  res.json({ currencies: CURRENCIES, travelBasket: config.travelBasket });
});

api.get('/rates/:base', wrap(async (req, res) => {
  const base = code(req.params.base, 'USD');
  const data = await rates.getRates(base);
  res.json({
    base: data.base, rates: data.rates, provider: data.provider,
    updatedAt: data.updatedAt, fetchedAt: data.fetchedAt,
    source: data.source, stale: data.stale,
  });
}));

/** Core conversion — rate, true-cost breakdown, and cross-source verification. */
api.get('/convert', wrap(async (req, res) => {
  const base = code(req.query.from, 'USD');
  const quote = code(req.query.to, 'EUR');
  const amount = Math.max(0, Number(req.query.amount) || 0);

  const { rate, meta: m } = await rates.getRate(base, quote);
  const result = amount * rate;

  if (amount > 0) {
    try { store.saveConversion({ base, quote, amount, result, rate }); } catch {}
  }

  res.json({
    base, quote, amount,
    rate: +rate.toFixed(6),
    result: +result.toFixed(4),
    inverse: +(1 / rate).toFixed(6),
    baseMeta: meta(base), quoteMeta: meta(quote),
    trueCost: trueCost(amount || 1, rate, config.markups),
    source: m.source, stale: m.stale, provider: m.provider,
    updatedAt: m.updatedAt, fetchedAt: m.fetchedAt,
  });
}));

/** Second opinion from an independent provider. */
api.get('/verify', wrap(async (req, res) => {
  const base = code(req.query.from, 'USD');
  const quote = code(req.query.to, 'EUR');
  res.json({ verification: await rates.verifyRate(base, quote) });
}));

/** 30-day series + deterministic trend analytics. */
api.get('/history', wrap(async (req, res) => {
  const base = code(req.query.from, 'USD');
  const quote = code(req.query.to, 'EUR');
  const days = Math.min(365, Math.max(7, Number(req.query.days) || 30));

  const hist = await rates.getHistory(base, quote, days);
  let spot = null;
  try { spot = (await rates.getRate(base, quote)).rate; } catch {}

  res.json({
    ...hist, days, spot,
    analytics: analyseSeries(hist.points, spot),
    baseMeta: meta(base), quoteMeta: meta(quote),
  });
}));

/** Travel Budgeting — one amount, 5 major currencies, side by side. */
api.get('/travel', wrap(async (req, res) => {
  const base = code(req.query.base, 'USD');
  const amount = Math.max(0, Number(req.query.amount) || 0);
  // Always land on 5 comparison currencies: drop the base, then take 5.
  const custom = Boolean(req.query.targets);
  const targets = (custom ? String(req.query.targets).split(',') : config.travelBasket)
    .map((t) => t.toUpperCase())
    .filter((t) => CODE.test(t) && t !== base)
    .slice(0, custom ? 8 : 5);

  const data = await rates.getRates(base);
  const rows = targets
    .filter((t) => Number.isFinite(data.rates?.[t]))
    .map((t) => {
      const rate = data.rates[t];
      const cost = trueCost(amount || 1, rate, config.markups);
      const best = cost.reduce((a, b) => (b.receive > a.receive ? b : a));
      const worst = cost.reduce((a, b) => (b.receive < a.receive ? b : a));
      return {
        code: t, meta: meta(t),
        rate: +rate.toFixed(6),
        converted: +(amount * rate).toFixed(2),
        best: { label: best.label, receive: best.receive },
        worst: { label: worst.label, receive: worst.receive },
        spread: +(best.receive - worst.receive).toFixed(2),
      };
    });

  res.json({
    base, baseMeta: meta(base), amount, rows,
    provider: data.provider, source: data.source, stale: data.stale,
    updatedAt: data.updatedAt,
  });
}));

// ---- favorites --------------------------------------------------------
api.get('/favorites', wrap(async (_req, res) => {
  const favs = store.listFavorites();
  const enriched = await Promise.all(favs.map(async (f) => {
    let rate = null, change = null;
    try {
      rate = +(await rates.getRate(f.base, f.quote)).rate.toFixed(6);
      const h = await rates.getHistory(f.base, f.quote, 30);
      change = analyseSeries(h.points, rate)?.changePct ?? null;
    } catch {}
    return { ...f, rate, change, baseMeta: meta(f.base), quoteMeta: meta(f.quote) };
  }));
  res.json({ favorites: enriched });
}));

api.post('/favorites', wrap(async (req, res) => {
  const base = code(req.body?.base), quote = code(req.body?.quote);
  if (base === quote) return res.status(400).json({ error: 'SAME_CURRENCY' });
  res.status(201).json({ favorite: store.addFavorite(base, quote) });
}));

api.delete('/favorites/:base/:quote', wrap(async (req, res) => {
  const removed = store.removeFavorite(code(req.params.base), code(req.params.quote));
  res.json({ removed });
}));

api.get('/conversions', (_req, res) => {
  res.json({ conversions: store.recentConversions(8).map((c) => ({
    ...c, baseMeta: meta(c.base), quoteMeta: meta(c.quote),
  })) });
});
