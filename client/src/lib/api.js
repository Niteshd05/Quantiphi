/**
 * API client with an offline-first cache.
 *
 * Research finding: XE removed offline rate caching, yet the moment you most
 * need a rate is at an airport or border with no signal. Every successful GET
 * is mirrored into localStorage, so a failed request falls back to the last
 * known good response and the UI keeps working — clearly labelled as cached.
 */
const NS = 'fxlens:cache:';

const readCache = (key) => {
  try {
    const raw = localStorage.getItem(NS + key);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
};

const writeCache = (key, data) => {
  try {
    localStorage.setItem(NS + key, JSON.stringify({ data, at: Date.now() }));
  } catch { /* quota or private mode — cache is an optimisation, never required */ }
};

async function get(path) {
  try {
    const res = await fetch(`/api${path}`);
    if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || `HTTP_${res.status}`);
    const data = await res.json();
    writeCache(path, data);
    return { ...data, _offline: false };
  } catch (err) {
    const cached = readCache(path);
    if (cached) return { ...cached.data, _offline: true, _cachedAt: cached.at };
    throw err;
  }
}

async function send(method, path, body) {
  const res = await fetch(`/api${path}`, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || `HTTP_${res.status}`);
  return res.json();
}

export const api = {
  currencies: () => get('/currencies'),
  convert: (from, to, amount) =>
    get(`/convert?from=${from}&to=${to}&amount=${encodeURIComponent(amount)}`),
  history: (from, to, days = 30) => get(`/history?from=${from}&to=${to}&days=${days}`),
  travel: (base, amount) => get(`/travel?base=${base}&amount=${encodeURIComponent(amount)}`),
  verify: (from, to) => get(`/verify?from=${from}&to=${to}`),
  favorites: () => get('/favorites'),
  addFavorite: (base, quote) => send('POST', '/favorites', { base, quote }),
  removeFavorite: (base, quote) => send('DELETE', `/favorites/${base}/${quote}`),
};
