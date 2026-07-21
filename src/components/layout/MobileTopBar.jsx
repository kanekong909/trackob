import { useParams, useNavigate } from 'react-router-dom';
import styles from './MobileTopBar.module.css';

export default function MobileTopBar() {
  const { id } = useParams();
  const navigate = useNavigate();

  if (!id) return null;

  return (
    <div className={styles.bar}>
      <button type="button" className={styles.backBtn} onClick={() => navigate('/obras')}>
        <span className={styles.arrow}>←</span> Todas las obras
      </button>
    </div>
  );
}
