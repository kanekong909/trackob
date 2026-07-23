import { useEffect, useState } from 'react';
import { api } from '../api/client';

const STORAGE_KEY = 'trackob_comentarios_vistos';
const POLL_MS = 10000;

function leerVistos() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {}; } catch { return {}; }
}
function guardarVistos(vistos) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(vistos)); } catch { /* modo privado, no es crítico */ }
}

export function useComentariosNuevos(obraId, novedadId, activo) {
  const [hayNuevos, setHayNuevos] = useState(false);

  useEffect(() => {
    if (activo || !obraId || !novedadId) return;
    let cancelado = false;

    function chequear() {
      api.get(`/api/chat?obra_id=${obraId}&novedad_id=${novedadId}`)
        .then((mensajes) => {
          if (cancelado) return;
          const vistos = leerVistos();
          const ultimoVisto = vistos[novedadId] || 0;
          setHayNuevos(mensajes.length > ultimoVisto);
        })
        .catch(() => {});
    }

    chequear();
    const interval = setInterval(chequear, POLL_MS);
    return () => { cancelado = true; clearInterval(interval); };
  }, [obraId, novedadId, activo]);

  function marcarVisto(cantidad) {
    const vistos = leerVistos();
    vistos[novedadId] = cantidad;
    guardarVistos(vistos);
    setHayNuevos(false);
  }

  return { hayNuevos, marcarVisto };
}