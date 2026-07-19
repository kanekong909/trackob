import { formatDate } from '../../utils/format';
import styles from './Progreso.module.css';

export default function FotoCard({ foto, onClick }) {
  return (
    <button type="button" className={styles.card} onClick={onClick}>
      <img src={foto.foto_url} alt={foto.etapa || 'Avance de obra'} className={styles.cardImg} />
      <div className={styles.cardOverlay}>
        {foto.etapa && <span className={styles.cardEtapa}>{foto.etapa}</span>}
        <span className={styles.cardFecha}>{formatDate(foto.fecha)}</span>
      </div>
    </button>
  );
}
