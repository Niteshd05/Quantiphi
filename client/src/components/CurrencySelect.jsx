import { useState, useRef, useMemo, useEffect } from 'react';
import { useDismiss } from '../hooks';
import Flag from './Flag';

/**
 * Searchable currency selector. Built on buttons + a listbox rather than a
 * native <select> so we can show flag, code and full name together — and so
 * it stays fully keyboard operable (arrows, Enter, Escape) with ARIA roles.
 */
export default function CurrencySelect({ label, value, onChange, currencies, exclude }) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const [hi, setHi] = useState(0);
  const wrap = useRef(null);
  const input = useRef(null);
  const listRef = useRef(null);

  useDismiss(wrap, () => setOpen(false), open);

  const current = currencies.find((c) => c.code === value) || { code: value, name: value, flag: '🏳️' };

  const results = useMemo(() => {
    const t = q.trim().toLowerCase();
    const pool = currencies.filter((c) => c.code !== exclude);
    if (!t) return pool.slice(0, 60);
    return pool
      .filter((c) => c.code.toLowerCase().includes(t) || c.name.toLowerCase().includes(t))
      // Exact code match first, then prefix matches, then the rest.
      .sort((a, b) => {
        const rank = (c) => (c.code.toLowerCase() === t ? 0 : c.code.toLowerCase().startsWith(t) ? 1 : 2);
        return rank(a) - rank(b);
      })
      .slice(0, 60);
  }, [q, currencies, exclude]);

  useEffect(() => { setHi(0); }, [q]);
  useEffect(() => {
    if (open) { setQ(''); setTimeout(() => input.current?.focus(), 30); }
  }, [open]);

  // Keep the highlighted option scrolled into view during keyboard nav.
  useEffect(() => {
    if (!open || !listRef.current) return;
    listRef.current.querySelectorAll('button')[hi]?.scrollIntoView({ block: 'nearest' });
  }, [hi, open]);

  const pick = (code) => { onChange(code); setOpen(false); };

  const onKeyDown = (e) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setHi((i) => Math.min(i + 1, results.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setHi((i) => Math.max(i - 1, 0)); }
    else if (e.key === 'Enter' && results[hi]) { e.preventDefault(); pick(results[hi].code); }
  };

  const id = `sel-${label.replace(/\s+/g, '-').toLowerCase()}`;

  return (
    <div className="field sel-wrap" ref={wrap}>
      <label htmlFor={id}>{label}</label>
      <button
        id={id}
        type="button"
        className="press sel-btn"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={`${label}: ${current.code}, ${current.name}. Activate to change.`}
      >
        <Flag code={current.code} size="lg" />
        <span style={{ minWidth: 0 }}>
          <div className="cd">{current.code}</div>
          <div className="nm">{current.name}</div>
        </span>
        <span className="ch" aria-hidden="true">{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div className="pop">
          <input
            ref={input}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Search 160+ currencies…"
            aria-label="Search currencies"
            aria-controls={`${id}-list`}
          />
          {results.length === 0 ? (
            <div className="empty">No currency matches “{q}”</div>
          ) : (
            <ul id={`${id}-list`} role="listbox" ref={listRef} aria-label={label}>
              {results.map((c, i) => (
                <li key={c.code} role="option" aria-selected={c.code === value}>
                  <button
                    type="button"
                    className={i === hi ? 'hi' : ''}
                    onClick={() => pick(c.code)}
                    onMouseEnter={() => setHi(i)}
                  >
                    <Flag code={c.code} size="sm" />
                    <span className="cd">{c.code}</span>
                    <span className="nm">{c.name}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
