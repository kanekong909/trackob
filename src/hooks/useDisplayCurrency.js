import { useState } from 'react';
import { useExchangeRates } from './useExchangeRates';

// verEn = null significa "mostrar en la divisa nativa de la obra".
// mostrar(valor) SOLO transforma lo que se pinta en pantalla; el valor
// real que se guarda o se manda al backend nunca pasa por acá.
export function useDisplayCurrency(monedaNativa) {
  const [verEn, setVerEn] = useState(null);
  const { convertir, loading } = useExchangeRates();
  const divisaActiva = verEn || monedaNativa;

  function mostrar(valor) {
    if (!verEn || verEn === monedaNativa) return Number(valor) || 0;
    return convertir(valor, monedaNativa, verEn);
  }

  return { verEn, setVerEn, divisaActiva, mostrar, loading };
}
