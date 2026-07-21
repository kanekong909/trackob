import { useEffect, useState } from 'react';
import { api } from '../api/client';

export function useMiRolObra(obraId) {
  const [miRol, setMiRol] = useState(null);
  const [obra, setObra] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!obraId) {
      setMiRol(null);
      setObra(null);
      setLoading(false);
      return;
    }
    let cancelado = false;
    setLoading(true);
    api.get(`/api/obras/${obraId}/resumen`)
      .then((r) => { if (!cancelado) { setMiRol(r.mi_rol); setObra(r.obra); } })
      .catch(() => {})
      .finally(() => { if (!cancelado) setLoading(false); });
    return () => { cancelado = true; };
  }, [obraId]);

  return { miRol, esAdmin: miRol === 'admin', obra, loading };
}
