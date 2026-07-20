import styles from './Bitacora.module.css';

function formatFechaLarga(iso) {
  const [y, m, d] = iso.split('T')[0].split('-').map(Number);
  const fecha = new Date(y, m - 1, d);
  return fecha.toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long' });
}

export default function NotaCard({ nota, esHoy, puedeEliminar, onClick, onDelete }) {
  return (
    <div className={`${styles.card} ${esHoy ? styles.cardHoy : ''}`}>
      <button type="button" className={styles.cardMain} onClick={onClick}>
        <div className={styles.cardHeader}>
          <span className={styles.cardFecha}>
            {formatFechaLarga(nota.fecha)}
            {esHoy && <span className={styles.badgeHoy}>Hoy</span>}
          </span>
          <span className={styles.cardAutor}>{nota.autor_nombre}</span>
        </div>
        <p className={styles.cardNota}>{nota.nota}</p>
      </button>
      {puedeEliminar && (
        <button type="button" className={styles.deleteBtn} onClick={onDelete} aria-label="Eliminar nota">🗑</button>
      )}
    </div>
  );
}
