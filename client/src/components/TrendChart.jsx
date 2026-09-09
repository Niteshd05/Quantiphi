import { useMemo, useState, useRef, useId } from 'react';
import { rateStr, shortDate, pct } from '../lib/format';

/**
 * Hand-rolled SVG line chart — no charting library.
 * Saves ~180KB, and gives exact control over the neumorphic styling and the
 * draw-in animation. It is one path, one gradient area and a crosshair.
 *
 * Note: ECB publishes business days only, so points are NOT evenly spaced in
 * calendar time. We plot positionally over the returned points and label the
 * axis with real dates, rather than pretending the gaps do not exist.
 */
const W = 640, H = 210, PAD = { t: 14, r: 14, b: 26, l: 46 };

export default function TrendChart({ points, loading, quote, synthetic }) {
  const [hover, setHover] = useState(null);
  const svgRef = useRef(null);
  const uid = useId().replace(/:/g, '');

  const geom = useMemo(() => {
    if (!points || points.length < 2) return null;
    const vals = points.map((p) => p.rate);
    const min = Math.min(...vals), max = Math.max(...vals);
    // 8% headroom so the line never touches the frame.
    const padY = (max - min) * 0.08 || max * 0.002 || 0.01;
    const lo = min - padY, hi = max + padY;

    const iw = W - PAD.l - PAD.r, ih = H - PAD.t - PAD.b;
    const x = (i) => PAD.l + (i / (points.length - 1)) * iw;
    const y = (v) => PAD.t + (1 - (v - lo) / (hi - lo)) * ih;

    const coords = points.map((p, i) => ({ ...p, x: x(i), y: y(p.rate), i }));

    // Catmull-Rom → cubic Bézier for a smooth line that still hits every point.
    let line = `M ${coords[0].x} ${coords[0].y}`;
    for (let i = 0; i < coords.length - 1; i++) {
      const p0 = coords[i - 1] || coords[i];
      const p1 = coords[i], p2 = coords[i + 1];
      const p3 = coords[i + 2] || p2;
      const c1x = p1.x + (p2.x - p0.x) / 6, c1y = p1.y + (p2.y - p0.y) / 6;
      const c2x = p2.x - (p3.x - p1.x) / 6, c2y = p2.y - (p3.y - p1.y) / 6;
      line += ` C ${c1x} ${c1y}, ${c2x} ${c2y}, ${p2.x} ${p2.y}`;
    }
    const area = `${line} L ${coords.at(-1).x} ${H - PAD.b} L ${coords[0].x} ${H - PAD.b} Z`;

    const rising = vals.at(-1) >= vals[0];
    const gridY = [0, 0.5, 1].map((f) => ({ y: PAD.t + f * ih, v: hi - f * (hi - lo) }));

    return { coords, line, area, rising, gridY, first: vals[0], last: vals.at(-1) };
  }, [points]);

  const onMove = (e) => {
    if (!geom || !svgRef.current) return;
    const r = svgRef.current.getBoundingClientRect();
    const cx = ((e.clientX - r.left) / r.width) * W;
    let best = geom.coords[0];
    for (const c of geom.coords) if (Math.abs(c.x - cx) < Math.abs(best.x - cx)) best = c;
    setHover(best);
  };

  if (loading) return <div className="skel" style={{ height: 210, width: '100%' }} />;

  if (!geom) {
    return (
      <div className="empty-state" style={{ height: 210, display: 'grid', placeContent: 'center' }}>
        <span className="em" aria-hidden="true">📊</span>
        Not enough history for this pair yet
      </div>
    );
  }

  const stroke = geom.rising ? 'var(--good)' : 'var(--bad)';
  const changePct = geom.first ? ((geom.last - geom.first) / geom.first) * 100 : 0;

  return (
    <div className="chart-box">
      <svg
        ref={svgRef}
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="none"
        onMouseMove={onMove}
        onMouseLeave={() => setHover(null)}
        role="img"
        aria-label={`Exchange rate trend over ${points.length} data points. Rate moved ${pct(changePct)} from ${rateStr(geom.first)} to ${rateStr(geom.last)} ${quote}.`}
      >
        <defs>
          <linearGradient id={`fill-${uid}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={stroke} stopOpacity="0.26" />
            <stop offset="100%" stopColor={stroke} stopOpacity="0" />
          </linearGradient>
        </defs>

        {geom.gridY.map((g, i) => (
          <g key={i}>
            <line
              x1={PAD.l} y1={g.y} x2={W - PAD.r} y2={g.y}
              stroke="var(--line)" strokeWidth="1" strokeDasharray="3 5"
            />
            <text
              x={PAD.l - 7} y={g.y + 3.5} textAnchor="end"
              fontSize="9.5" fill="var(--text-mute)" fontWeight="600"
            >
              {rateStr(g.v)}
            </text>
          </g>
        ))}

        <path d={geom.area} fill={`url(#fill-${uid})`} />
        <path
          className="draw"
          d={geom.line}
          fill="none"
          stroke={stroke}
          strokeWidth="2.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* endpoint marker */}
        <circle cx={geom.coords.at(-1).x} cy={geom.coords.at(-1).y} r="4.5" fill={stroke} />
        <circle cx={geom.coords.at(-1).x} cy={geom.coords.at(-1).y} r="8" fill={stroke} opacity="0.18" />

        {hover && (
          <g>
            <line
              x1={hover.x} y1={PAD.t} x2={hover.x} y2={H - PAD.b}
              stroke="var(--accent)" strokeWidth="1.4" strokeDasharray="3 3"
            />
            <circle cx={hover.x} cy={hover.y} r="5" fill="var(--accent)" stroke="var(--surface)" strokeWidth="2.4" />
          </g>
        )}

        {/* x-axis: first, middle and last real dates */}
        {[0, Math.floor(geom.coords.length / 2), geom.coords.length - 1].map((i, k) => (
          <text
            key={k}
            x={geom.coords[i].x}
            y={H - 7}
            textAnchor={k === 0 ? 'start' : k === 2 ? 'end' : 'middle'}
            fontSize="9.5" fill="var(--text-mute)" fontWeight="600"
          >
            {shortDate(geom.coords[i].date)}
          </text>
        ))}
      </svg>

      {hover && (
        <div
          className="tip"
          style={{ left: `${(hover.x / W) * 100}%`, top: `${(hover.y / H) * 100}%` }}
        >
          <div className="mono">{rateStr(hover.rate)} {quote}</div>
          <div className="d">{shortDate(hover.date)}</div>
        </div>
      )}

      {synthetic && (
        <div className="tc-note" style={{ marginTop: 8 }}>
          ⓘ This pair is outside the ECB reference set — the trend shape is modelled from a
          correlated pair and anchored to the live rate. Directionally indicative, not official.
        </div>
      )}
    </div>
  );
}
