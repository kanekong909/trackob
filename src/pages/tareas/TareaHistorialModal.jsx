import { useEffect, useState } from 'react';
import Modal from '../../components/ui/Modal';
import { api } from '../../api/client';
import styles from './Tareas.module.css';

const LABELS = { pendiente: 'Pendiente', en_progreso: 'En progreso', hecho: 'Hecho' };

function formatFechaHora(iso) {
  return new Date(iso).toLocaleString('es-CO', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
}

export default function TareaHistorialModal({ open, onClose, tarea }) {
  const [historial, setHistorial] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open || !tarea) return;
    setLoading(true);
    setError('');
    api.get(`/api/tareas/${tarea.id}/historial`)
      .then(setHistorial)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [open, tarea]);

  return (
    <Modal open={open} onClose={onClose} title={`Historial · ${tarea?.titulo || ''}`}>
      {loading && <div className={styles.state}>Cargando historial…</div>}
      {!loading && error && <div className={styles.stateError}>{error}</div>}
      {!loading && !error && historial.length === 0 && (
        <p className={styles.columnEmpty}>Sin cambios de estado registrados todavía.</p>
      )}
      {!loading && !error && historial.length > 0 && (
        <ul className={styles.historialList}>
          {historial.map((h) => (
            <li key={h.id} className={styles.historialItem}>
              <span className={styles.historialTransicion}>
                {h.estado_anterior ? `${LABELS[h.estado_anterior]} → ` : ''}{LABELS[h.estado_nuevo]}
              </span>
              <span className={styles.historialMeta}>{h.usuario_nombre} · {formatFechaHora(h.cambiado_en)}</span>
            </li>
          ))}
        </ul>
      )}
    </Modal>
  );
}
