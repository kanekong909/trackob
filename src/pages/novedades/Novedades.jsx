import { useCallback, useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import Button from '../../components/ui/Button';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import NovedadCard from './NovedadCard';
import NovedadModal from './NovedadModal';
import styles from './Novedades.module.css';

const REFRESH_MS = 15000;
const FILTROS = [
  { value: '', label: 'Todas' },
  { value: 'pendiente', label: 'Pendientes' },
  { value: 'resuelta', label: 'Resueltas' }
];

export default function Novedades() {
  const { id: obraId } = useParams();
  const { usuario } = useAuth();
  const toast = useToast();

  const [novedades, setNovedades] = useState([]);
  const [miRol, setMiRol] = useState(null);
  const [filtro, setFiltro] = useState('pendiente');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [modalOpen, setModalOpen] = useState(false);
  const [novedadAEliminar, setNovedadAEliminar] = useState(null);
  const [eliminando, setEliminando] = useState(false);

  const idsConocidos = useRef(null); // null = todavía no hemos cargado una vez

  const cargarRol = useCallback(() => {
    api.get(`/api/obras/${obraId}/resumen`).then((r) => setMiRol(r.mi_rol)).catch(() => {});
  }, [obraId]);

  const cargar = useCallback(async ({ silencioso = false } = {}) => {
    if (!silencioso) setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({ obra_id: obraId });
      if (filtro) params.set('estado', filtro);
      const data = await api.get(`/api/novedades?${params.toString()}`);

      if (silencioso && idsConocidos.current) {
        const nuevas = data.filter((n) => !idsConocidos.current.has(n.id) && Number(n.usuario_id) !== Number(usuario?.id));
        if (nuevas.length > 0) {
          toast.info(nuevas.length === 1
            ? `Nueva novedad de ${nuevas[0].usuario_nombre}`
            : `${nuevas.length} novedades nuevas`);
        }
      }
      idsConocidos.current = new Set(data.map((n) => n.id));
      setNovedades(data);
    } catch (err) {
      if (!silencioso) setError(err.message);
    } finally {
      if (!silencioso) setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [obraId, filtro]);

  useEffect(() => { cargarRol(); }, [cargarRol]);
  useEffect(() => { idsConocidos.current = null; cargar(); }, [cargar]);

  useEffect(() => {
    const interval = setInterval(() => cargar({ silencioso: true }), REFRESH_MS);
    return () => clearInterval(interval);
  }, [cargar]);

  const esAdmin = miRol === 'admin';

  function puedeEliminar(novedad) {
    return esAdmin || Number(novedad.usuario_id) === Number(usuario?.id);
  }

  function handleCreated() {
    toast.success('Novedad reportada');
    cargar();
  }

  async function marcarEstado(novedad, estado) {
    setNovedades((prev) => prev.map((n) => (n.id === novedad.id ? { ...n, estado } : n)));
    try {
      await api.put(`/api/novedades/${novedad.id}/estado`, { estado });
      toast.success(estado === 'resuelta' ? 'Novedad resuelta' : 'Novedad reabierta');
      cargar({ silencioso: true });
    } catch (err) {
      toast.error(err.message);
      cargar({ silencioso: true });
    }
  }

  function pedirEliminar(novedad) {
    setNovedadAEliminar(novedad);
  }

  async function confirmarEliminar() {
    if (!novedadAEliminar) return;
    setEliminando(true);
    try {
      await api.del(`/api/novedades/${novedadAEliminar.id}`);
      setNovedades((prev) => prev.filter((n) => n.id !== novedadAEliminar.id));
      toast.success('Novedad eliminada');
      setNovedadAEliminar(null);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setEliminando(false);
    }
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <h1>Novedades</h1>
          <p className={styles.subtitle}>Reporta incidentes con foto para que el admin los vea al instante</p>
        </div>
        <Button onClick={() => setModalOpen(true)}>+ Reportar novedad</Button>
      </header>

      <div className={styles.filters}>
        {FILTROS.map((f) => (
          <button
            key={f.value}
            className={`${styles.filterBtn} ${filtro === f.value ? styles.filterActive : ''}`}
            onClick={() => setFiltro(f.value)}
          >
            {f.label}
          </button>
        ))}
      </div>

      {loading && <div className={styles.state}>Cargando novedades…</div>}
      {!loading && error && (
        <div className={styles.stateError}>
          {error}
          <button onClick={() => cargar()} className={styles.retry}>Reintentar</button>
        </div>
      )}

      {!loading && !error && novedades.length === 0 && (
        <div className={styles.empty}>
          <h3>{filtro === 'pendiente' ? 'Sin novedades pendientes 🎉' : 'Nada por aquí'}</h3>
          <p>Cuando alguien reporte un incidente con foto, aparece aquí al instante.</p>
        </div>
      )}

      {!loading && !error && novedades.length > 0 && (
        <div className={styles.feed}>
          {novedades.map((n) => (
            <NovedadCard
              key={n.id}
              novedad={n}
              esAdmin={esAdmin}
              puedeEliminar={puedeEliminar(n)}
              onMarcarEstado={marcarEstado}
              onEliminar={pedirEliminar}
            />
          ))}
        </div>
      )}

      <NovedadModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        obraId={obraId}
        onCreated={handleCreated}
      />

      <ConfirmDialog
        open={Boolean(novedadAEliminar)}
        onClose={() => setNovedadAEliminar(null)}
        onConfirm={confirmarEliminar}
        title="Eliminar novedad"
        message="¿Eliminar este reporte? Esta acción no se puede deshacer."
        confirmLabel="Eliminar"
        danger
        loading={eliminando}
      />
    </div>
  );
}
