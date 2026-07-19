function parseLocalDate(value) {
  const datePart = typeof value === 'string' ? value.split('T')[0] : value;
  if (typeof datePart !== 'string') return new Date(datePart);
  const [y, m, d] = datePart.split('-').map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
}

export function formatQty(value) {
  if (value === null || value === undefined || value === '') return '';
  const n = Number(value);
  if (Number.isNaN(n)) return value;
  return n % 1 === 0 ? String(n) : String(parseFloat(n.toFixed(2)));
}

export function formatMiles(value) {
  if (value === '' || value === null || value === undefined) return '';
  const n = Number(value);
  if (Number.isNaN(n)) return '';
  return n.toLocaleString('es-CO');
}

export function parseMiles(str) {
  return String(str).replace(/\D/g, '');
}

export const MONEDAS = {
  COP: { symbol: '$', locale: 'es-CO', nombre: 'Peso colombiano' },
  USD: { symbol: 'US$', locale: 'en-US', nombre: 'Dólar estadounidense' },
  EUR: { symbol: '€', locale: 'de-DE', nombre: 'Euro' }
};

export function formatCurrency(value, moneda = 'COP') {
  const n = Number(value) || 0;
  const cfg = MONEDAS[moneda] || MONEDAS.COP;
  return new Intl.NumberFormat(cfg.locale, {
    style: 'currency',
    currency: moneda,
    maximumFractionDigits: 0
  }).format(n);
}

export function formatDate(value, opts = {}) {
  if (!value) return '';
  const date = parseLocalDate(value);
  return new Intl.DateTimeFormat('es-CO', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    ...opts
  }).format(date);
}

export function formatDateShort(value) {
  if (!value) return '';
  const date = parseLocalDate(value);
  return new Intl.DateTimeFormat('es-CO', { day: '2-digit', month: 'short' }).format(date);
}
