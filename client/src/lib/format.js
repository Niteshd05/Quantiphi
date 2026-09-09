/** Currency-aware formatting. Respects zero-decimal currencies (JPY, KRW, VND). */
export function money(value, code, decimals = 2) {
  if (!Number.isFinite(value)) return '—';
  try {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: code,
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(value);
  } catch {
    return `${value.toFixed(decimals)} ${code}`;
  }
}

export function num(value, decimals = 2) {
  if (!Number.isFinite(value)) return '—';
  return new Intl.NumberFormat(undefined, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

/** Significant-digit rate display — 94.8432 but 0.008431 both stay readable. */
export function rateStr(r) {
  if (!Number.isFinite(r)) return '—';
  if (r >= 1000) return num(r, 2);
  if (r >= 1) return num(r, 4);
  return num(r, 6);
}

export const pct = (v, d = 2) =>
  Number.isFinite(v) ? `${v > 0 ? '+' : ''}${v.toFixed(d)}%` : '—';

export function ago(ts) {
  if (!ts) return 'unknown';
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

export const shortDate = (iso) =>
  new Date(iso + 'T00:00:00').toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
