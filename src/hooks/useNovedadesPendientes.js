import { useEffect, useState } from 'react';
import { api } from '../api/client';

const POLL_MS = 5000;

export function useNovedadesPendientes(obraId) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!obraId) {
      setCount(0);
      return;
    }
    let cancelado = false;

    function cargar() {
      api.get(`/api/novedades?obra_id=${obraId}&estado=pendiente`)
        .then((data) => { if (!cancelado) setCount(data.length); })
        .catch(() => {});
    }

    cargar();
    const interval = setInterval(cargar, POLL_MS);
    return () => { cancelado = true; clearInterval(interval); };
  }, [obraId]);

  return count;
}
