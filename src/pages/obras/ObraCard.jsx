import { Link } from 'react-router-dom';
import { formatCurrency } from '../../utils/format';
import { useExchangeRates } from '../../hooks/useExchangeRates';
import styles from './ObraCard.module.css';

export default function ObraCard({ obra }) {
  const moneda = obra.moneda || 'COP';
  const presupuesto = Number(obra.presupuesto) || 0;
  const gastado = Number(obra.total_gastado) || 0;
  const pct = presupuesto > 0 ? Math.min(100, (gastado / presupuesto) * 100) : 0;
  const sobrepasado = presupuesto > 0 && gastado > presupuesto;

  const { convertir, rates } = useExchangeRates();
  const gastadoEnCop = moneda !== 'COP' && rates ? convertir(gastado, moneda, 'COP') : null;

  return (
    <Link to={`/obras/${obra.id}`} className={styles.card}>
      <div className={styles.top}>
        <div>
          <h3 className={styles.name}>{obra.nombre}</h3>
          {obra.ubicacion && <p className={styles.location}>{obra.ubicacion}</p>}
        </div>
        <span className={`${styles.roleBadge} ${obra.mi_rol === 'admin' ? styles.roleAdmin : ''}`}>
          {obra.mi_rol === 'admin' ? 'Admin' : 'Colaborador'}
        </span>
      </div>

      <div className={styles.tapeBlock}>
        <div className={styles.tapeLabels}>
          <span className={`${styles.num} ${sobrepasado ? styles.over : ''}`}>
            {formatCurrency(gastado, moneda)}
          </span>
          <span className={styles.tapeLabelMuted}>
            de {presupuesto > 0 ? formatCurrency(presupuesto, moneda) : 'sin presupuesto'}
          </span>
        </div>
        {gastadoEnCop !== null && (
          <p className={styles.tapeEquivalente}>≈ {formatCurrency(gastadoEnCop, 'COP')}</p>
        )}
        <div className={styles.tapeTrack}>
          <div
            className={`${styles.tapeFill} ${sobrepasado ? styles.tapeFillOver : ''}`}
            style={{ width: `${presupuesto > 0 ? pct : gastado > 0 ? 100 : 0}%` }}
          />
        </div>
      </div>

      <div className={styles.stats}>
        <span className={styles.stat}>
          <strong className={styles.num}>{obra.total_gastos_count ?? 0}</strong> gastos
        </span>
        <span className={styles.stat}>
          <strong className={`${styles.num} ${Number(obra.tareas_pendientes) > 0 ? styles.pending : ''}`}>
            {obra.tareas_pendientes ?? 0}
          </strong> tareas pendientes
        </span>
      </div>
    </Link>
  );
}
