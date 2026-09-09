import { rateStr, pct } from '../lib/format';
import Flag from './Flag';

export default function FavoritesRail({ favorites, loading, activePair, onSelect, onRemove, onAdd, canAdd }) {
  return (
    <>
      <div className="card-hd">
        <h2>Favourite pairs</h2>
        <div className="sp" />
        {canAdd && (
          <button className="press" style={{ padding: '7px 13px', fontSize: 12, fontWeight: 700 }} onClick={onAdd}>
            + Add current
          </button>
        )}
      </div>

      {loading ? (
        <div className="fav-list">
          {[0, 1, 2].map((i) => <div key={i} className="skel" style={{ height: 52 }} />)}
        </div>
      ) : favorites.length === 0 ? (
        <div className="empty-state">
          <span className="em" aria-hidden="true">⭐</span>
          No favourites yet. Pin the pairs you check often for one-tap access.
        </div>
      ) : (
        <div className="fav-list">
          {favorites.map((f) => {
            const pair = `${f.base}/${f.quote}`;
            const dir = f.change > 0.05 ? 'up' : f.change < -0.05 ? 'down' : 'flat';
            return (
              <div
                key={pair}
                className={`fav ${pair === activePair ? 'active' : ''}`}
                onClick={() => onSelect(f.base, f.quote)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelect(f.base, f.quote); }
                }}
                role="button"
                tabIndex={0}
                aria-label={`Load ${f.base} to ${f.quote}${f.rate ? `, rate ${rateStr(f.rate)}` : ''}`}
              >
                <div className="fav-pair">
                  <Flag code={f.base} size="sm" />
                  {f.base}
                  <span style={{ color: 'var(--text-mute)' }}>→</span>
                  <Flag code={f.quote} size="sm" />
                  {f.quote}
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div className="fav-rate mono">{rateStr(f.rate)}</div>
                  {f.change != null && (
                    <div className={`fav-chg ${dir}`}>
                      {dir === 'up' ? '▲' : dir === 'down' ? '▼' : '—'} {pct(f.change)}
                    </div>
                  )}
                </div>
                <button
                  className="fav-x"
                  onClick={(e) => { e.stopPropagation(); onRemove(f.base, f.quote); }}
                  aria-label={`Remove ${f.base} to ${f.quote} from favourites`}
                >
                  ×
                </button>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
