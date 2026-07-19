import { useState } from 'react';
import styles from './Novedades.module.css';

function formatFechaHora(iso) {
  return new Date(iso).toLocaleString('es-CO', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
}

export default function NovedadCard({ novedad, esAdmin, puedeEliminar, onMarcarEstado, onEliminar }) {
  const [fotoAbierta, setFotoAbierta] = useState(false);
  const resuelta = novedad.estado === 'resuelta';

  return (
    <div className={`${styles.card} ${resuelta ? styles.cardResuelta : ''}`}>
      <div className={styles.cardHeader}>
        <div>
          <span className={styles.cardAutor}>{novedad.usuario_nombre}</span>
          <span className={styles.cardFecha}>{formatFechaHora(novedad.creado_en)}</span>
        </div>
        <span className={`${styles.badge} ${resuelta ? styles.badgeResuelta : styles.badgePendiente}`}>
          {resuelta ? '✓ Resuelta' : '● Pendiente'}
        </span>
      </div>

      <p className={styles.cardDesc}>{novedad.descripcion}</p>

      {novedad.foto_url && (
        <>
          <img
            src={novedad.foto_url}
            alt="Foto del incidente"
            className={styles.cardFoto}
            onClick={() => setFotoAbierta(true)}
          />
          {fotoAbierta && (
            <div className={styles.lightbox} onClick={() => setFotoAbierta(false)}>
              <img src={novedad.foto_url} alt="Foto del incidente ampliada" />
            </div>
          )}
        </>
      )}

      {resuelta && novedad.resuelta_por_nombre && (
        <p className={styles.resueltaPor}>Resuelta por {novedad.resuelta_por_nombre}</p>
      )}

      <div className={styles.cardFooter}>
        {esAdmin && (
          <button
            className={resuelta ? styles.reabrirBtn : styles.resolverBtn}
            onClick={() => onMarcarEstado(novedad, resuelta ? 'pendiente' : 'resuelta')}
          >
            {resuelta ? 'Reabrir' : 'Marcar como resuelta'}
          </button>
        )}
        {puedeEliminar && (
          <button className={styles.deleteBtn} onClick={() => onEliminar(novedad)}>Eliminar</button>
        )}
      </div>
    </div>
  );
}
