/**
 * Deterministic trend analytics. No LLM: this is spot-vs-mean arithmetic,
 * and statistics are faster, free, reproducible and correct here.
 */
export function analyseSeries(points, spot) {
  if (!points?.length) return null;
  const rates = points.map((p) => p.rate);
  const first = rates[0];
  const last = spot ?? rates[rates.length - 1];
  const mean = rates.reduce((a, b) => a + b, 0) / rates.length;
  const variance = rates.reduce((a, b) => a + (b - mean) ** 2, 0) / rates.length;
  const stdev = Math.sqrt(variance);
  const high = Math.max(...rates);
  const low = Math.min(...rates);
  const changePct = first ? ((last - first) / first) * 100 : 0;
  // Coefficient of variation — comparable across currency pairs of any magnitude.
  const volatilityPct = mean ? (stdev / mean) * 100 : 0;
  // How far spot sits from the 30-day mean, in standard deviations.
  const z = stdev ? (last - mean) / stdev : 0;

  let verdict, tone;
  if (z > 0.7) { verdict = 'Above the 30-day average — favourable time to convert'; tone = 'good'; }
  else if (z < -0.7) { verdict = 'Below the 30-day average — you may get more by waiting'; tone = 'poor'; }
  else { verdict = 'Trading near its 30-day average — a neutral time to convert'; tone = 'neutral'; }

  // Position of spot within the 30-day range, 0–100.
  const range = high - low;
  const position = range ? ((last - low) / range) * 100 : 50;

  return {
    changePct: +changePct.toFixed(3),
    volatilityPct: +volatilityPct.toFixed(3),
    high: +high.toFixed(6),
    low: +low.toFixed(6),
    mean: +mean.toFixed(6),
    position: +position.toFixed(1),
    trend: changePct > 0.05 ? 'up' : changePct < -0.05 ? 'down' : 'flat',
    verdict,
    tone,
  };
}

/**
 * True Cost Engine — the mid-market rate is what every app shows, and what
 * nobody actually receives. This models what lands in your pocket per channel.
 */
export function trueCost(amount, midRate, markups) {
  const ideal = amount * midRate;
  return markups.map((m) => {
    const effectiveRate = midRate * (1 - m.pct);
    const receive = amount * effectiveRate;
    return {
      id: m.id, label: m.label, hint: m.hint, icon: m.icon,
      markupPct: +(m.pct * 100).toFixed(2),
      effectiveRate: +effectiveRate.toFixed(6),
      receive: +receive.toFixed(2),
      lost: +(ideal - receive).toFixed(2),
    };
  });
}
