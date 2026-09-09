/**
 * Currency flag.
 *
 * Windows ships no country-flag glyphs — Segoe UI Emoji renders regional
 * indicator pairs as two letter boxes ("US" rather than 🇺🇸), so emoji flags
 * silently degrade for every Windows user. We use flagcdn SVGs and fall back
 * to a styled currency-code badge if the image fails (offline, blocked, or a
 * currency with no country, e.g. XDR).
 */
import { useState } from 'react';

const SIZES = { sm: 18, md: 22, lg: 26 };

// Currency code → ISO-3166 country for the flag asset. Only entries where the
// first two letters of the currency code are NOT the country code, plus the
// supranational ones.
const OVERRIDE = {
  EUR: 'eu', XAF: 'cm', XOF: 'sn', XCD: 'ag', XPF: 'pf', XDR: null,
  ANG: 'cw', CHF: 'ch', GBP: 'gb', JPY: 'jp', USD: 'us', INR: 'in',
  DKK: 'dk', SEK: 'se', NOK: 'no', ISK: 'is', CZK: 'cz', PLN: 'pl',
  RON: 'ro', RSD: 'rs', TRY: 'tr', ZAR: 'za', AED: 'ae', SAR: 'sa',
  KRW: 'kr', CNY: 'cn', TWD: 'tw', SGD: 'sg', HKD: 'hk', MOP: 'mo',
  PHP: 'ph', VND: 'vn', MMK: 'mm', KHR: 'kh', LAK: 'la', BND: 'bn',
  MYR: 'my', IDR: 'id', THB: 'th', BDT: 'bd', LKR: 'lk', NPR: 'np',
  PKR: 'pk', AFN: 'af', IRR: 'ir', IQD: 'iq', ILS: 'il', JOD: 'jo',
  SYP: 'sy', YER: 'ye', OMR: 'om', QAR: 'qa', KWD: 'kw', BHD: 'bh',
  EGP: 'eg', LYD: 'ly', TND: 'tn', DZD: 'dz', MAD: 'ma', SDG: 'sd',
  SSP: 'ss', ETB: 'et', ERN: 'er', DJF: 'dj', SOS: 'so', KES: 'ke',
  UGX: 'ug', TZS: 'tz', RWF: 'rw', BIF: 'bi', MWK: 'mw', ZMW: 'zm',
  ZWL: 'zw', BWP: 'bw', NAD: 'na', LSL: 'ls', SZL: 'sz', MZN: 'mz',
  AOA: 'ao', CDF: 'cd', GHS: 'gh', NGN: 'ng', GMD: 'gm', GNF: 'gn',
  SLE: 'sl', LRD: 'lr', CVE: 'cv', STN: 'st', MGA: 'mg', MUR: 'mu',
  SCR: 'sc', KMF: 'km', MVR: 'mv', BTN: 'bt', MNT: 'mn', KZT: 'kz',
  UZS: 'uz', KGS: 'kg', TJS: 'tj', TMT: 'tm', AZN: 'az', AMD: 'am',
  GEL: 'ge', UAH: 'ua', BYN: 'by', MDL: 'md', ALL: 'al', MKD: 'mk',
  BAM: 'ba', BGN: 'bg', HRK: 'hr', HUF: 'hu', RUB: 'ru', BRL: 'br',
  ARS: 'ar', CLP: 'cl', CLF: 'cl', COP: 'co', PEN: 'pe', UYU: 'uy',
  PYG: 'py', BOB: 'bo', VES: 've', GYD: 'gy', SRD: 'sr', TTD: 'tt',
  JMD: 'jm', BBD: 'bb', BSD: 'bs', BZD: 'bz', KYD: 'ky', BMD: 'bm',
  AWG: 'aw', DOP: 'do', HTG: 'ht', CUP: 'cu', CUC: 'cu', GTQ: 'gt',
  HNL: 'hn', NIO: 'ni', CRC: 'cr', PAB: 'pa', MXN: 'mx', CAD: 'ca',
  AUD: 'au', NZD: 'nz', FJD: 'fj', PGK: 'pg', SBD: 'sb', VUV: 'vu',
  WST: 'ws', TOP: 'to', GIP: 'gi', FKP: 'fk', SHP: 'sh', JEP: 'je',
  GGP: 'gg', IMP: 'im', KPW: 'kp', MRU: 'mr',
};

const country = (code) =>
  code in OVERRIDE ? OVERRIDE[code] : code.slice(0, 2).toLowerCase();

export default function Flag({ code = '', size = 'md' }) {
  const [failed, setFailed] = useState(false);
  const px = SIZES[size] || SIZES.md;
  const cc = country(code);

  const badge = (
    <span
      aria-hidden="true"
      style={{
        display: 'inline-grid', placeItems: 'center', flex: 'none',
        width: px * 1.34, height: px, borderRadius: 3,
        background: 'var(--sunk)', boxShadow: 'var(--in-sm)',
        fontSize: px * 0.42, fontWeight: 800, letterSpacing: '.02em',
        color: 'var(--text-mute)', fontFamily: 'Inter, sans-serif',
      }}
    >
      {code.slice(0, 2)}
    </span>
  );

  if (!cc || failed) return badge;

  return (
    <img
      src={`https://flagcdn.com/${cc}.svg`}
      alt=""
      aria-hidden="true"
      loading="lazy"
      onError={() => setFailed(true)}
      style={{
        width: px * 1.34, height: px, flex: 'none',
        objectFit: 'cover', borderRadius: 3,
        boxShadow: '0 0 0 1px color-mix(in srgb, var(--line-strong) 60%, transparent)',
      }}
    />
  );
}
