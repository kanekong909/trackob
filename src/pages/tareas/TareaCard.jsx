import { formatDate } from '../../utils/format';
import styles from './Tareas.module.css';

const ESTADOS = [
  { value: 'pendiente', label: 'Pendiente' },
  { value: 'en_progreso', label: 'En progreso' },
  { value: 'hecho', label: 'Hecho' }
];

function estaVencida(tarea) {
  if (!tarea.fecha_limite || tarea.estado === 'hecho') return false;
  const [y, m, d] = tarea.fecha_limite.split('T')[0].split('-').map(Number);
  const limite = new Date(y, m - 1, d);
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  return limite < hoy;
}

export default function TareaCard({ tarea, puedeEditar, puedeCambiarEstado, onCambiarEstado, onEdit, onDelete, onVerHistorial }) {
  const vencida = estaVencida(tarea);

  return (
    <div className={`${styles.card} ${tarea.estado === 'hecho' ? styles.cardDone : ''}`}>
      <div className={styles.cardTop}>
        <p className={styles.cardTitle}>{tarea.titulo}</p>
        {puedeEditar && (
          <div className={styles.cardActions}>
            <button onClick={() => onEdit(tarea)} className={styles.cardActionBtn} aria-label="Editar">✎</button>
            <button onClick={() => onDelete(tarea)} className={`${styles.cardActionBtn} ${styles.cardActionDanger}`} aria-label="Eliminar">🗑</button>
          </div>
        )}
      </div>

      {tarea.descripcion && <p className={styles.cardDesc}>{tarea.descripcion}</p>}

      <div className={styles.cardMeta}>
        <span className={styles.cardAsignado}>
          {tarea.asignado_nombre ? `👤 ${tarea.asignado_nombre}` : 'Sin asignar'}
        </span>
        {tarea.fecha_limite && (
          <span className={`${styles.cardFecha} ${vencida ? styles.cardFechaVencida : ''}`}>
            {vencida ? '⚠ ' : ''}{formatDate(tarea.fecha_limite)}
          </span>
        )}
      </div>

      <div className={styles.cardFooter}>
        {puedeCambiarEstado ? (
          <select
            className={styles.estadoSelect}
            value={tarea.estado}
            onChange={(e) => onCambiarEstado(tarea, e.target.value)}
          >
            {ESTADOS.map((e) => <option key={e.value} value={e.value}>{e.label}</option>)}
          </select>
        ) : (
          <span className={styles.estadoReadonly}>{ESTADOS.find((e) => e.value === tarea.estado)?.label}</span>
        )}
        <button className={styles.historialLink} onClick={() => onVerHistorial(tarea)}>Historial</button>
      </div>
    </div>
  );
}
