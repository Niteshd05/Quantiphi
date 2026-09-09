import { money, num } from '../lib/format';

const ICONS = { zap: '⚡', card: '💳', bank: '🏦', plane: '✈️' };

/**
 * The headline USP.
 *
 * Every converter shows the mid-market rate. Nobody actually receives it —
 * banks and kiosks bury a 2–12% margin in the rate while advertising
 * "zero fees". This panel shows what actually lands in your pocket per
 * channel, and what the spread between best and worst is worth in cash.
 */
export default function TrueCostPanel({ rows, quote, quoteMeta, amount, loading }) {
  if (loading) {
    return (
      <div className="tc-list">
        {[0, 1, 2, 3].map((i) => <div key={i} className="skel" style={{ height: 62 }} />)}
      </div>
    );
  }
  if (!rows?.length) return null;

  const dp = quoteMeta?.decimals ?? 2;
  const best = rows.reduce((a, b) => (b.receive > a.receive ? b : a));
  const worst = rows.reduce((a, b) => (b.receive < a.receive ? b : a));
  const spread = best.receive - worst.receive;

  return (
    <>
      <div className="tc-list">
        {rows.map((r) => (
          <div
            key={r.id}
            className={`tc-row ${r.id === best.id ? 'best' : ''} ${r.id === worst.id ? 'worst' : ''}`}
          >
            <div className="tc-ico" aria-hidden="true">{ICONS[r.icon] || '💱'}</div>
            <div style={{ minWidth: 0 }}>
              <div className="tc-name">
                {r.label}
                {r.id === best.id && (
                  <span className="chip ok" style={{ marginLeft: 8 }}>BEST</span>
                )}
              </div>
              <div className="tc-hint">{r.hint} · {num(r.markupPct, 1)}% markup</div>
            </div>
            <div className="tc-amt">
              <div className="v mono">{money(r.receive, quote, dp)}</div>
              <div className="l">−{money(r.lost, quote, dp)}</div>
            </div>
          </div>
        ))}
      </div>

      {spread > 0 && (
        <div className="saving">
          <span aria-hidden="true">💡</span>
          <span>
            Choosing {best.label} over {worst.label} keeps{' '}
            <strong className="mono">{money(spread, quote, dp)}</strong> in your pocket
            {amount > 0 ? ' on this amount' : ' per unit'}.
          </span>
        </div>
      )}

      <p className="tc-note">
        Mid-market is the rate you see everywhere — and the one almost nobody gets.
        Figures use typical published industry margins by channel, not live quotes from
        named providers; your actual rate varies by provider, card and timing.
      </p>
    </>
  );
}
