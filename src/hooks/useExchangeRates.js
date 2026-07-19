import { useEffect, useState } from 'react';

const CACHE_KEY = 'trackob_tasas_cambio';
const CACHE_MS = 6 * 60 * 60 * 1000; // 6 horas
const API_URL = 'https://open.er-api.com/v6/latest/COP';

function leerCache() {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (Date.now() - parsed.fetchedAt > CACHE_MS) return null;
    return parsed.rates;
  } catch {
    return null;
  }
}

function guardarCache(rates) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ rates, fetchedAt: Date.now() }));
  } catch {
    // localStorage puede fallar en modo privado - no es crítico, se vuelve a pedir
  }
}

// Tasas con base COP: { COP: 1, USD: 0.00024, EUR: 0.00022, ... }
export function useExchangeRates() {
  const [rates, setRates] = useState(() => leerCache());
  const [loading, setLoading] = useState(!rates);

  useEffect(() => {
    if (rates) return;
    let cancelado = false;
    setLoading(true);
    fetch(API_URL)
      .then((r) => r.json())
      .then((data) => {
        if (cancelado || !data?.rates) return;
        setRates(data.rates);
        guardarCache(data.rates);
      })
      .catch(() => {})
      .finally(() => { if (!cancelado) setLoading(false); });
    return () => { cancelado = true; };
  }, [rates]);

  // Convierte un monto de una divisa a otra usando la tasa base COP
  function convertir(monto, desde, hacia) {
    if (!rates || desde === hacia) return Number(monto) || 0;
    const enCop = desde === 'COP' ? Number(monto) : Number(monto) / (rates[desde] || 1);
    return hacia === 'COP' ? enCop : enCop * (rates[hacia] || 1);
  }

  return { rates, loading, convertir };
}
