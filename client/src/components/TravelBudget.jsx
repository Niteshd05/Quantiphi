import { money, rateStr } from '../lib/format';
import Flag from './Flag';

/**
 * Travel Budgeting mode (the "vibe check").
 * One base amount → equivalent value in 5 major currencies at once, each row
 * also showing the realistic best/worst channel outcome so the comparison is
 * about money actually received, not the theoretical mid-market figure.
 */
export default function TravelBudget({ data, loading, amount, onAmount, baseMeta }) {
  return (
    <>
      <div className="card-hd">
        <h2>Travel budget · 5 major currencies</h2>
      </div>

      <div className="field" style={{ marginBottom: 16 }}>
        <label htmlFor="travel-amt">Budget in {baseMeta?.code || 'base currency'}</label>
        <div className="amount-wrap">
          <span className="sym" aria-hidden="true">{baseMeta?.symbol || '$'}</span>
          <input
            id="travel-amt"
            className="amount-input mono"
            type="text"
            inputMode="decimal"
            value={amount}
            onChange={(e) => {
              const v = e.target.value;
              if (v === '' || /^\d*\.?\d*$/.test(v)) onAmount(v);
            }}
            aria-label={`Travel budget amount in ${baseMeta?.code || 'base currency'}`}
          />
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'grid', gap: 8 }}>
          {[0, 1, 2, 3, 4].map((i) => <div key={i} className="skel" style={{ height: 52 }} />)}
        </div>
      ) : !data?.rows?.length ? (
        <div className="empty-state">Enter an amount to compare across currencies.</div>
      ) : (
        <div className="tbl-wrap">
          <table className="tbl">
            <caption className="sr-only">
              Equivalent value of {amount} {data.base} across major currencies, with best and
              worst realistic conversion outcomes.
            </caption>
            <thead>
              <tr>
                <th scope="col">Currency</th>
                <th scope="col">Rate</th>
                <th scope="col">Mid-market</th>
                <th scope="col">You&apos;d actually get</th>
              </tr>
            </thead>
            <tbody>
              {data.rows.map((r) => {
                const dp = r.meta?.decimals ?? 2;
                return (
                  <tr key={r.code}>
                    <td>
                      <div className="t-ccy">
                        <Flag code={r.code} size="md" />
                        <span>
                          <div>{r.code}</div>
                          <div className="nm">{r.meta.name}</div>
                        </span>
                      </div>
                    </td>
                    <td className="mono" style={{ fontWeight: 600, color: 'var(--text-soft)' }}>
                      {rateStr(r.rate)}
                    </td>
                    <td className="mono">{money(r.converted, r.code, dp)}</td>
                    <td>
                      <div className="mono" style={{ color: 'var(--good)' }}>
                        {money(r.best.receive, r.code, dp)}
                      </div>
                      <div className="t-sub">
                        via {r.best.label} · vs {money(r.worst.receive, r.code, dp)} worst
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <p className="tc-note">
        “You&apos;d actually get” applies the best realistic channel margin. The worst-case
        column is what a walk-up airport kiosk typically returns — often several percent lower.
      </p>
    </>
  );
}
