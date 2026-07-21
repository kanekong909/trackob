import { useParams, useNavigate } from 'react-router-dom';
import styles from './MobileTopBar.module.css';
import { useAuth } from '../../context/AuthContext';
import { cloudinaryThumb } from '../../utils/format';

export default function MobileTopBar() {
  const { usuario } = useAuth();
  const { id } = useParams();
  const navigate = useNavigate();

  if (!id) return null;

  return (
    <div className={styles.bar}>
      <button
        type="button"
        className={styles.backBtn}
        onClick={() => navigate('/obras')}
      >
        <span className={styles.arrow}>←</span>
        Todas las obras
      </button>

      {usuario?.fondo_url ? (
        <img
          src={cloudinaryThumb(usuario.fondo_url, 64)}
          alt={usuario?.nombre}
          className={styles.avatar}
        />
      ) : (
        <div className={styles.avatarFallback}>
          {usuario?.nombre?.[0]?.toUpperCase()}
        </div>
      )}
    </div>
  );
}
