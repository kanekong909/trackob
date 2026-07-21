import { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../../api/client';
import { useToast } from '../../context/ToastContext';
import Button from '../../components/ui/Button';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import FotoCard from './FotoCard';
import ProgresoModal from './ProgresoModal';
import FotoDetailModal from './FotoDetailModal';
import FotoLightbox from './FotoLightbox';
import styles from './Progreso.module.css';

export default function Progreso() {
  const { id: obraId } = useParams();
  const toast = useToast();

  const [fotos, setFotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [etapaFiltro, setEtapaFiltro] = useState('');

  const [modalOpen, setModalOpen] = useState(false);
  const [indiceAbierto, setIndiceAbierto] = useState(null);
  const [fotoDetalle, setFotoDetalle] = useState(null);
  const [fotoAEliminar, setFotoAEliminar] = useState(null);
  const [eliminando, setEliminando] = useState(false);

  const cargar = useCallback(() => {
    setLoading(true);
    setError('');
    return api.get(`/api/progreso?obra_id=${obraId}`)
      .then(setFotos)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [obraId]);

  useEffect(() => { cargar(); }, [cargar]);

  const etapas = useMemo(() => {
    const set = new Set(fotos.map((f) => f.etapa).filter(Boolean));
    return Array.from(set);
  }, [fotos]);

  const fotosFiltradas = useMemo(() => {
    if (!etapaFiltro) return fotos;
    return fotos.filter((f) => f.etapa === etapaFiltro);
  }, [fotos, etapaFiltro]);

  function handleCreated() {
    toast.success('Foto agregada');
    cargar();
  }

  function handleUpdated() {
    toast.success('Foto actualizada');
    setFotoDetalle(null);
    cargar();
  }

  function pedirEliminar(foto) {
    setFotoDetalle(null);
    setIndiceAbierto(null);
    setFotoAEliminar(foto);
  }

  async function confirmarEliminar() {
    if (!fotoAEliminar) return;
    setEliminando(true);
    try {
      await api.del(`/api/progreso/${fotoAEliminar.id}`);
      setFotos((prev) => prev.filter((f) => f.id !== fotoAEliminar.id));
      toast.success('Foto eliminada');
      setFotoAEliminar(null);
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
          <h1>Avance fotográfico</h1>
          <p className={styles.subtitle}>Registra el progreso de la obra con fotos por etapa</p>
        </div>
        <Button onClick={() => setModalOpen(true)}>+ Nueva foto</Button>
      </header>

      {etapas.length > 0 && (
        <div className={styles.filters}>
          <button
            className={`${styles.filterBtn} ${!etapaFiltro ? styles.filterActive : ''}`}
            onClick={() => setEtapaFiltro('')}
          >
            Todas
          </button>
          {etapas.map((etapa) => (
            <button
              key={etapa}
              className={`${styles.filterBtn} ${etapaFiltro === etapa ? styles.filterActive : ''}`}
              onClick={() => setEtapaFiltro(etapa)}
            >
              {etapa}
            </button>
          ))}
        </div>
      )}

      {loading && <div className={styles.state}>Cargando fotos…</div>}
      {!loading && error && (
        <div className={styles.stateError}>
          {error}
          <button onClick={cargar} className={styles.retry}>Reintentar</button>
        </div>
      )}

      {!loading && !error && fotosFiltradas.length === 0 && (
        <div className={styles.empty}>
          <h3>Sin fotos todavía</h3>
          <p>Registra el avance de la obra tomando una foto — queda con fecha y etapa para armar la línea de tiempo.</p>
          <Button onClick={() => setModalOpen(true)}>+ Agregar la primera foto</Button>
        </div>
      )}

      {!loading && !error && fotosFiltradas.length > 0 && (
        <div className={styles.grid}>
          {fotosFiltradas.map((foto, i) => (
            <FotoCard key={foto.id} foto={foto} onClick={() => setIndiceAbierto(i)} />
          ))}
        </div>
      )}

      <ProgresoModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        obraId={obraId}
        etapasExistentes={etapas}
        onCreated={handleCreated}
      />

      {indiceAbierto !== null && (
        <FotoLightbox
          fotos={fotosFiltradas}
          index={indiceAbierto}
          onClose={() => setIndiceAbierto(null)}
          onIndexChange={setIndiceAbierto}
          onVerDetalles={(foto) => { setIndiceAbierto(null); setFotoDetalle(foto); }}
        />
      )}

      <FotoDetailModal
        open={Boolean(fotoDetalle)}
        onClose={() => setFotoDetalle(null)}
        foto={fotoDetalle}
        etapasExistentes={etapas}
        onUpdated={handleUpdated}
        onDelete={pedirEliminar}
      />

      <ConfirmDialog
        open={Boolean(fotoAEliminar)}
        onClose={() => setFotoAEliminar(null)}
        onConfirm={confirmarEliminar}
        title="Eliminar foto"
        message="¿Eliminar esta foto de avance? Esta acción no se puede deshacer."
        confirmLabel="Eliminar"
        danger
        loading={eliminando}
      />
    </div>
  );
}
