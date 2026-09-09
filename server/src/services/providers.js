import { config } from '../config.js';

async function getJSON(url) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), config.requestTimeout);
  try {
    const res = await fetch(url, { signal: ctrl.signal, headers: { accept: 'application/json' } });
    if (res.status === 429) throw new Error('RATE_LIMITED');
    if (!res.ok) throw new Error(`HTTP_${res.status}`);
    return await res.json();
  } finally {
    clearTimeout(t);
  }
}

/**
 * ExchangeRate-API — 166 currencies, live. Primary source for conversion.
 * Uses the keyed endpoint when EXCHANGERATE_API_KEY is present, else open access.
 */
export const exchangeRateApi = {
  id: 'exchangerate-api',
  label: 'ExchangeRate-API',
  async latest(base) {
    const url = config.apiKey
      ? `https://v6.exchangerate-api.com/v6/${config.apiKey}/latest/${base}`
      : `https://open.er-api.com/v6/latest/${base}`;
    const d = await getJSON(url);
    const rates = d.conversion_rates || d.rates;
    if (d.result !== 'success' || !rates) throw new Error('BAD_PAYLOAD');
    return {
      base: d.base_code || base,
      rates,
      provider: this.id,
      updatedAt: d.time_last_update_utc || null,
      nextUpdate: d.time_next_update_unix ? d.time_next_update_unix * 1000 : null,
    };
  },
};

/**
 * Frankfurter (ECB) — 30 currencies, but free historical timeseries back to 1999.
 * Primary source for history; failover for live rates.
 * Note: ECB publishes business days only, and omits the base from `rates`.
 */
export const frankfurter = {
  id: 'frankfurter',
  label: 'Frankfurter / ECB',
  async latest(base) {
    const d = await getJSON(`https://api.frankfurter.dev/v1/latest?base=${base}`);
    if (!d?.rates) throw new Error('BAD_PAYLOAD');
    return {
      base: d.base || base,
      rates: { ...d.rates, [d.base || base]: 1 },
      provider: this.id,
      updatedAt: d.date || null,
      nextUpdate: null,
    };
  },
  async currencies() {
    return await getJSON('https://api.frankfurter.dev/v1/currencies');
  },
  /** Returns [{date, rate}] ascending, business days only. */
  async timeseries(base, quote, start, end) {
    const d = await getJSON(
      `https://api.frankfurter.dev/v1/${start}..${end}?base=${base}&symbols=${quote}`
    );
    if (!d?.rates) throw new Error('BAD_PAYLOAD');
    return Object.entries(d.rates)
      .map(([date, r]) => ({ date, rate: r[quote] }))
      .filter((p) => Number.isFinite(p.rate))
      .sort((a, b) => a.date.localeCompare(b.date));
  },
};
