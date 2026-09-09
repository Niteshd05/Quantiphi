import { useState, useCallback, useMemo, useEffect } from 'react';
import { api } from './lib/api';
import { money, rateStr, pct, num, ago } from './lib/format';
import { useDebounced, useLocalStorage, useAsync, useCountUp, useOnline } from './hooks';
import CurrencySelect from './components/CurrencySelect';
import TrendChart from './components/TrendChart';
import TrueCostPanel from './components/TrueCostPanel';
import FavoritesRail from './components/FavoritesRail';
import TravelBudget from './components/TravelBudget';

export default function App() {
  const [theme, setTheme] = useLocalStorage('fxlens:theme', 'light');
  const [from, setFrom] = useLocalStorage('fxlens:from', 'USD');
  const [to, setTo] = useLocalStorage('fxlens:to', 'INR');
  const [amountRaw, setAmountRaw] = useLocalStorage('fxlens:amount', '1000');
  const [travelMode, setTravelMode] = useLocalStorage('fxlens:travel', false);
  const [travelAmt, setTravelAmt] = useLocalStorage('fxlens:travelAmt', '2000');
  const [days, setDays] = useLocalStorage('fxlens:days', 30);
  const [spin, setSpin] = useState(false);
  const [favTick, setFavTick] = useState(0);

  const online = useOnline();
  const amount = Number(amountRaw) || 0;
  const dAmount = useDebounced(amount, 320);
  const dTravel = useDebounced(Number(travelAmt) || 0, 320);

  useEffect(() => { document.documentElement.dataset.theme = theme; }, [theme]);

  // ---- data ----
  const ccy = useAsync(() => api.currencies(), []);
  const conv = useAsync(() => api.convert(from, to, dAmount), [from, to, dAmount]);
  const hist = useAsync(() => api.history(from, to, days), [from, to, days]);
  const favs = useAsync(() => api.favorites(), [favTick]);
  const travel = useAsync(
    () => api.travel(from, dTravel),
    [from, dTravel, travelMode],
    { skip: !travelMode }
  );

  const currencies = ccy.data?.currencies || [];
  const c = conv.data;
  const analytics = hist.data?.analytics;
  const animated = useCountUp(c?.result ?? 0);

  const pair = `${from}/${to}`;
  const isFav = useMemo(
    () => (favs.data?.favorites || []).some((f) => f.base === from && f.quote === to),
    [favs.data, from, to]
  );

  // ---- actions ----
  const swap = useCallback(() => {
    setSpin(true);
    setFrom(to); setTo(from);
    setTimeout(() => setSpin(false), 420);
  }, [from, to, setFrom, setTo]);

  const toggleFav = useCallback(async () => {
    try {
      if (isFav) await api.removeFavorite(from, to);
      else await api.addFavorite(from, to);
      setFavTick((t) => t + 1);
    } catch { /* non-fatal: favourites are a convenience */ }
  }, [isFav, from, to]);

  const removeFav = useCallback(async (b, q) => {
    try { await api.removeFavorite(b, q); setFavTick((t) => t + 1); } catch {}
  }, []);

  const selectFav = useCallback((b, q) => { setFrom(b); setTo(q); }, [setFrom, setTo]);

  // ---- freshness ----
  const offline = !online || c?._offline;
  const stale = c?.stale || c?.source === 'cache';
  const freshness = offline
    ? { cls: 'off', text: 'Offline · cached rates' }
    : stale
      ? { cls: 'cache', text: 'Cached rate' }
      : { cls: 'live', text: `Live · ${c?.provider === 'frankfurter' ? 'ECB' : 'ExchangeRate-API'}` };

  const dp = c?.quoteMeta?.decimals ?? 2;

  return (
    <div className="shell">
      <header className="hdr">
        <div className="brand">
          <div className="brand-mark" aria-hidden="true">💱</div>
          <div>
            <h1>FXLens</h1>
            <p>Real rates, real costs</p>
          </div>
        </div>

        <div className="badge" role="status" aria-live="polite">
          <span className={`dot ${freshness.cls}`} aria-hidden="true" />
          {freshness.text}
        </div>

        <button
          className="press icon-btn"
          onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
          aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} theme`}
        >
          {theme === 'light' ? '🌙' : '☀️'}
        </button>
      </header>

      {offline && (
        <div className="offline-bar" role="alert">
          <span aria-hidden="true">📡</span>
          You&apos;re offline — showing the last rates saved on this device
          {c?._cachedAt ? ` (${ago(c._cachedAt)})` : ''}. Conversions still work.
        </div>
      )}

      <div className="grid">
        {/* ---------------- left column ---------------- */}
        <div className="col">
          <section className="neu card rise" aria-labelledby="conv-h">
            <div className="card-hd">
              <h2 id="conv-h">Convert</h2>
              <div className="sp" />
              <button
                className={`press ${isFav ? 'on' : ''}`}
                style={{ padding: '7px 13px', fontSize: 12, fontWeight: 700 }}
                onClick={toggleFav}
                aria-pressed={isFav}
                aria-label={isFav ? `Remove ${pair} from favourites` : `Save ${pair} to favourites`}
              >
                {isFav ? '★ Saved' : '☆ Save pair'}
              </button>
            </div>

            <div className="field" style={{ marginBottom: 14 }}>
              <label htmlFor="amt">Amount</label>
              <div className="amount-wrap">
                <span className="sym" aria-hidden="true">{c?.baseMeta?.symbol || '$'}</span>
                <input
                  id="amt"
                  className="amount-input"
                  type="text"
                  inputMode="decimal"
                  value={amountRaw}
                  onChange={(e) => {
                    const v = e.target.value;
                    if (v === '' || /^\d*\.?\d*$/.test(v)) setAmountRaw(v);
                  }}
                  placeholder="0.00"
                  aria-label={`Amount in ${from}`}
                />
              </div>
            </div>

            <div className="conv-row">
              <CurrencySelect
                label="From" value={from} onChange={setFrom}
                currencies={currencies} exclude={to}
              />
              <button
                className={`press swap-btn ${spin ? 'spin' : ''}`}
                onClick={swap}
                aria-label={`Swap currencies: convert ${to} to ${from} instead`}
              >
                ⇄
              </button>
              <CurrencySelect
                label="To" value={to} onChange={setTo}
                currencies={currencies} exclude={from}
              />
            </div>

            <div className="result" role="status" aria-live="polite">
              {conv.loading && !c ? (
                <div className="skel" style={{ height: 52, margin: '0 auto', maxWidth: 300 }} />
              ) : conv.error ? (
                <div className="err">Couldn&apos;t load this rate. {String(conv.error.message || '')}</div>
              ) : (
                <>
                  <div className="out mono">{money(animated, to, dp)}</div>
                  <div className="sub">
                    {money(amount, from, c?.baseMeta?.decimals ?? 2)} equals
                  </div>
                  <div className="rate-line">
                    <span className="mono">1 {from} = {rateStr(c?.rate)} {to}</span>
                    <span aria-hidden="true">·</span>
                    <span className="mono">1 {to} = {rateStr(c?.inverse)} {from}</span>
                    {c?.updatedAt && (
                      <span className="chip">
                        {new Date(c.updatedAt).toLocaleString(undefined, {
                          month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
                        })}
                      </span>
                    )}
                  </div>
                </>
              )}
            </div>
          </section>

          <section className="neu card rise" style={{ animationDelay: '60ms' }} aria-labelledby="trend-h">
            <div className="card-hd">
              <h2 id="trend-h">
                {pair} · {days}-day trend
              </h2>
              <div className="sp" />
              <div className="range-btns" role="group" aria-label="Chart time range">
                {[7, 30, 90].map((d) => (
                  <button
                    key={d}
                    className={`press ${days === d ? 'on' : ''}`}
                    onClick={() => setDays(d)}
                    aria-pressed={days === d}
                  >
                    {d}D
                  </button>
                ))}
              </div>
            </div>

            <TrendChart
              points={hist.data?.points}
              loading={hist.loading && !hist.data}
              quote={to}
              synthetic={hist.data?.synthetic}
            />

            {analytics && (
              <>
                <div className="stats">
                  <div className="stat">
                    <div className="k">Change</div>
                    <div className={`v mono ${analytics.trend === 'up' ? 'up' : analytics.trend === 'down' ? 'down' : 'flat'}`}>
                      {pct(analytics.changePct)}
                    </div>
                  </div>
                  <div className="stat">
                    <div className="k">{days}-day high</div>
                    <div className="v mono">{rateStr(analytics.high)}</div>
                  </div>
                  <div className="stat">
                    <div className="k">{days}-day low</div>
                    <div className="v mono">{rateStr(analytics.low)}</div>
                  </div>
                  <div className="stat">
                    <div className="k">Volatility</div>
                    <div className="v mono">{num(analytics.volatilityPct, 2)}%</div>
                  </div>
                </div>

                <div className={`verdict ${analytics.tone}`} role="note">
                  <span aria-hidden="true">
                    {analytics.tone === 'good' ? '✅' : analytics.tone === 'poor' ? '⏳' : '➖'}
                  </span>
                  <span>
                    {analytics.verdict} · currently at {num(analytics.position, 0)}% of its {days}-day range.
                  </span>
                </div>
              </>
            )}
          </section>

          {travelMode && (
            <section className="neu card rise" aria-labelledby="travel-h">
              <h2 id="travel-h" className="sr-only">Travel budget comparison</h2>
              <TravelBudget
                data={travel.data}
                loading={travel.loading && !travel.data}
                amount={travelAmt}
                onAmount={setTravelAmt}
                baseMeta={c?.baseMeta}
              />
            </section>
          )}
        </div>

        {/* ---------------- right column ---------------- */}
        <div className="col">
          <button
            className="neu press travel-toggle rise"
            onClick={() => setTravelMode((v) => !v)}
            aria-pressed={travelMode}
            style={{ borderRadius: 'var(--r-lg)' }}
          >
            <span aria-hidden="true" style={{ fontSize: 20 }}>🧳</span>
            <span style={{ textAlign: 'left', flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: 14 }}>Travel budgeting</div>
              <div style={{ fontSize: 11.5, color: 'var(--text-mute)' }}>
                One amount, 5 major currencies
              </div>
            </span>
            <span className={`switch ${travelMode ? 'on' : ''}`} aria-hidden="true" />
          </button>

          <section className="neu card rise" style={{ animationDelay: '90ms' }} aria-labelledby="tc-h">
            <div className="card-hd">
              <h2 id="tc-h">What you&apos;d actually receive</h2>
            </div>
            <TrueCostPanel
              rows={c?.trueCost}
              quote={to}
              quoteMeta={c?.quoteMeta}
              amount={amount}
              loading={conv.loading && !c}
            />
          </section>

          <section className="neu card rise" style={{ animationDelay: '120ms' }} aria-labelledby="fav-h">
            <h2 id="fav-h" className="sr-only">Favourite currency pairs</h2>
            <FavoritesRail
              favorites={favs.data?.favorites || []}
              loading={favs.loading && !favs.data}
              activePair={pair}
              onSelect={selectFav}
              onRemove={removeFav}
              onAdd={toggleFav}
              canAdd={!isFav}
            />
          </section>
        </div>
      </div>

      <footer className="foot">
        Rates from{' '}
        <a href="https://www.exchangerate-api.com" target="_blank" rel="noopener noreferrer">
          ExchangeRate-API
        </a>{' '}
        and the European Central Bank via{' '}
        <a href="https://frankfurter.dev" target="_blank" rel="noopener noreferrer">Frankfurter</a>.
        <br />
        Mid-market rates shown for reference — they are not an offer to exchange.
      </footer>
    </div>
  );
}
