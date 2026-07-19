import { MONEDAS } from '../../utils/format';
import styles from './DivisaToggle.module.css';

export default function DivisaToggle({ monedaNativa, verEn, onChange }) {
  const opciones = [monedaNativa, ...Object.keys(MONEDAS).filter((m) => m !== monedaNativa)];
  const activa = verEn || monedaNativa;

  return (
    <div className={styles.toggle}>
      <span className={styles.label}>Ver en</span>
      {opciones.map((code) => (
        <button
          key={code}
          type="button"
          className={`${styles.chip} ${activa === code ? styles.active : ''}`}
          onClick={() => onChange(code === monedaNativa ? null : code)}
        >
          {code}
        </button>
      ))}
    </div>
  );
}
