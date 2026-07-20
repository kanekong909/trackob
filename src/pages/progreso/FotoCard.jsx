import { formatDate, cloudinaryThumb } from '../../utils/format';
import styles from './Progreso.module.css';

export default function FotoCard({ foto, onClick }) {
  return (
    <button type="button" className={styles.card} onClick={onClick}>
      <img
        src={cloudinaryThumb(foto.foto_url, 400)}
        alt={foto.etapa || 'Avance de obra'}
        className={styles.cardImg}
        loading="lazy"
      />
      <div className={styles.cardOverlay}>
        {foto.etapa && <span className={styles.cardEtapa}>{foto.etapa}</span>}
        <span className={styles.cardFecha}>{formatDate(foto.fecha)}</span>
      </div>
    </button>
  );
}
