import Database from 'better-sqlite3';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import fs from 'node:fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// DB_PATH lets a host point the database at a mounted persistent disk. Without
// it we fall back to the repo directory, which is fine locally but is wiped on
// every deploy of an ephemeral-filesystem host — set DB_PATH in production so
// favourites and cached rates survive restarts.
const DB_PATH = process.env.DB_PATH || path.join(__dirname, '..', '..', 'fxlens.db');

fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });

export const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');

db.exec(`
CREATE TABLE IF NOT EXISTS rate_cache (
  base       TEXT PRIMARY KEY,
  rates      TEXT NOT NULL,
  provider   TEXT NOT NULL,
  fetched_at INTEGER NOT NULL,
  updated_at TEXT
);

CREATE TABLE IF NOT EXISTS rate_history (
  pair       TEXT NOT NULL,
  day        TEXT NOT NULL,
  rate       REAL NOT NULL,
  PRIMARY KEY (pair, day)
);
CREATE INDEX IF NOT EXISTS idx_history_pair ON rate_history(pair, day DESC);

CREATE TABLE IF NOT EXISTS favorites (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  base       TEXT NOT NULL,
  quote      TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  UNIQUE(base, quote)
);

CREATE TABLE IF NOT EXISTS conversions (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  base       TEXT NOT NULL,
  quote      TEXT NOT NULL,
  amount     REAL NOT NULL,
  result     REAL NOT NULL,
  rate       REAL NOT NULL,
  created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_conv_time ON conversions(created_at DESC);
`);

// ---- rate cache -------------------------------------------------------
const _putRates = db.prepare(
  `INSERT INTO rate_cache (base, rates, provider, fetched_at, updated_at)
   VALUES (@base, @rates, @provider, @fetched_at, @updated_at)
   ON CONFLICT(base) DO UPDATE SET
     rates=excluded.rates, provider=excluded.provider,
     fetched_at=excluded.fetched_at, updated_at=excluded.updated_at`
);
const _getRates = db.prepare('SELECT * FROM rate_cache WHERE base = ?');

export function saveRates(base, rates, provider, updatedAt) {
  _putRates.run({
    base, rates: JSON.stringify(rates), provider,
    fetched_at: Date.now(), updated_at: updatedAt || null,
  });
}
export function loadRates(base) {
  const row = _getRates.get(base);
  if (!row) return null;
  return {
    rates: JSON.parse(row.rates), provider: row.provider,
    fetchedAt: row.fetched_at, updatedAt: row.updated_at,
  };
}

// ---- history ----------------------------------------------------------
const _putPoint = db.prepare(
  `INSERT INTO rate_history (pair, day, rate) VALUES (?, ?, ?)
   ON CONFLICT(pair, day) DO UPDATE SET rate=excluded.rate`
);
const _getSeries = db.prepare(
  'SELECT day, rate FROM rate_history WHERE pair = ? AND day >= ? ORDER BY day ASC'
);
export const saveSeries = db.transaction((pair, points) => {
  for (const p of points) _putPoint.run(pair, p.date, p.rate);
});
export function loadSeries(pair, since) {
  return _getSeries.all(pair, since).map((r) => ({ date: r.day, rate: r.rate }));
}

// ---- favorites --------------------------------------------------------
export const listFavorites = () =>
  db.prepare('SELECT id, base, quote, created_at AS createdAt FROM favorites ORDER BY created_at DESC').all();
export function addFavorite(base, quote) {
  db.prepare('INSERT OR IGNORE INTO favorites (base, quote, created_at) VALUES (?,?,?)')
    .run(base, quote, Date.now());
  return db.prepare('SELECT id, base, quote, created_at AS createdAt FROM favorites WHERE base=? AND quote=?')
    .get(base, quote);
}
export const removeFavorite = (base, quote) =>
  db.prepare('DELETE FROM favorites WHERE base=? AND quote=?').run(base, quote).changes > 0;

// ---- conversion history ----------------------------------------------
export function saveConversion(c) {
  db.prepare(`INSERT INTO conversions (base, quote, amount, result, rate, created_at)
              VALUES (@base,@quote,@amount,@result,@rate,@created_at)`)
    .run({ ...c, created_at: Date.now() });
}
export const recentConversions = (limit = 8) =>
  db.prepare(`SELECT base, quote, amount, result, rate, created_at AS createdAt
              FROM conversions ORDER BY created_at DESC LIMIT ?`).all(limit);
