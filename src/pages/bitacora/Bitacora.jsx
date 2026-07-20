import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import Button from '../../components/ui/Button';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import NotaCard from './NotaCard';
import NotaModal from './NotaModal';
import styles from './Bitacora.module.css';

function hoy() {
  return new Date().toISOString().split('T')[0];
}

export default function Bitacora() {
  const { id: obraId } = useParams();
  const { usuario } = useAuth();
  const toast = useToast();

  const [notas, setNotas] = useState([]);
  const [miRol, setMiRol] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [modalOpen, setModalOpen] = useState(false);
  const [notaEditando, setNotaEditando] = useState(null);
  const [notaAEliminar, setNotaAEliminar] = useState(null);
  const [eliminando, setEliminando] = useState(false);

  const cargarRol = useCallback(() => {
    api.get(`/api/obras/${obraId}/resumen`).then((r) => setMiRol(r.mi_rol)).catch(() => {});
  }, [obraId]);

  const cargar = useCallback(() => {
    setLoading(true);
    setError('');
    return api.get(`/api/bitacora?obra_id=${obraId}`)
      .then(setNotas)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [obraId]);

  useEffect(() => { cargarRol(); }, [cargarRol]);
  useEffect(() => { cargar(); }, [cargar]);

  const notaDeHoy = notas.find((n) => n.fecha?.split('T')[0] === hoy());

  function abrirNotaDeHoy() {
    setNotaEditando(notaDeHoy || { fecha: hoy(), nota: '' });
    setModalOpen(true);
  }

  function abrirNota(nota) {
    setNotaEditando(nota);
    setModalOpen(true);
  }

  function handleSaved() {
    toast.success('Nota guardada');
    cargar();
  }

  function pedirEliminar(nota) {
    setNotaAEliminar(nota);
  }

  async function confirmarEliminar() {
    if (!notaAEliminar) return;
    setEliminando(true);
    try {
      await api.del(`/api/bitacora/${notaAEliminar.id}`);
      setNotas((prev) => prev.filter((n) => n.id !== notaAEliminar.id));
      toast.success('Nota eliminada');
      setNotaAEliminar(null);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setEliminando(false);
    }
  }

  function puedeEliminar(nota) {
    return miRol === 'admin' || Number(nota.usuario_id) === Number(usuario?.id);
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <h1>Bitácora</h1>
          <p className={styles.subtitle}>Una nota por día con lo que pasó en la obra</p>
        </div>
        <Button onClick={abrirNotaDeHoy}>
          {notaDeHoy ? 'Editar nota de hoy' : '+ Nota de hoy'}
        </Button>
      </header>

      {loading && <div className={styles.state}>Cargando bitácora…</div>}
      {!loading && error && (
        <div className={styles.stateError}>
          {error}
          <button onClick={cargar} className={styles.retry}>Reintentar</button>
        </div>
      )}

      {!loading && !error && notas.length === 0 && (
        <div className={styles.empty}>
          <h3>Sin notas todavía</h3>
          <p>Escribe la nota de hoy para empezar el diario de la obra — clima, avance, personal en sitio.</p>
          <Button onClick={abrirNotaDeHoy}>+ Escribir la primera nota</Button>
        </div>
      )}

      {!loading && !error && notas.length > 0 && (
        <div className={styles.timeline}>
          {notas.map((nota) => (
            <NotaCard
              key={nota.id}
              nota={nota}
              esHoy={nota.fecha?.split('T')[0] === hoy()}
              puedeEliminar={puedeEliminar(nota)}
              onClick={() => abrirNota(nota)}
              onDelete={() => pedirEliminar(nota)}
            />
          ))}
        </div>
      )}

      <NotaModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        obraId={obraId}
        nota={notaEditando}
        fechasExistentes={notas.map((n) => n.fecha?.split('T')[0])}
        onSaved={handleSaved}
      />

      <ConfirmDialog
        open={Boolean(notaAEliminar)}
        onClose={() => setNotaAEliminar(null)}
        onConfirm={confirmarEliminar}
        title="Eliminar nota"
        message="¿Eliminar esta nota de la bitácora? Esta acción no se puede deshacer."
        confirmLabel="Eliminar"
        danger
        loading={eliminando}
      />
    </div>
  );
}
