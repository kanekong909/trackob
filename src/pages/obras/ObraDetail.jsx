import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../../api/client';
import { formatCurrency } from '../../utils/format';
import styles from './ObraDetail.module.css';

export default function ObraDetail() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    setError('');
    api.get(`/api/obras/${id}/resumen`)
      .then(setData)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className={styles.state}>Cargando resumen…</div>;
  if (error) return <div className={styles.stateError}>{error}</div>;
  if (!data) return null;

  const { obra, totales, por_categoria, colaboradores } = data;
  const presupuesto = Number(obra.presupuesto) || 0;
  const gastado = Number(totales.total_gastado) || 0;
  const restante = presupuesto - gastado;
  const pct = presupuesto > 0 ? Math.min(100, (gastado / presupuesto) * 100) : 0;
  const sobrepasado = presupuesto > 0 && gastado > presupuesto;
  const moneda = obra.moneda || 'COP';

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <p className={styles.eyebrow}>{obra.ubicacion || 'Sin ubicación'} · {moneda}</p>
        <h1>{obra.nombre}</h1>
        {obra.descripcion && <p className={styles.desc}>{obra.descripcion}</p>}
      </header>

      <section className={styles.tapeCard}>
        <div className={styles.tapeRow}>
          <div>
            <span className={styles.tapeLabel}>Gastado</span>
            <p className={`${styles.tapeValue} ${sobrepasado ? styles.over : ''}`}>{formatCurrency(gastado, moneda)}</p>
          </div>
          <div className={styles.tapeRight}>
            <span className={styles.tapeLabel}>Presupuesto</span>
            <p className={styles.tapeValue}>{presupuesto > 0 ? formatCurrency(presupuesto, moneda) : '—'}</p>
          </div>
        </div>
        <div className={styles.tapeTrack}>
          <div
            className={`${styles.tapeFill} ${sobrepasado ? styles.tapeFillOver : ''}`}
            style={{ width: `${presupuesto > 0 ? pct : gastado > 0 ? 100 : 0}%` }}
          />
        </div>
        <p className={`${styles.tapeFooter} ${sobrepasado ? styles.over : ''}`}>
          {presupuesto > 0
            ? sobrepasado
              ? `Excedido por ${formatCurrency(Math.abs(restante), moneda)}`
              : `Disponible: ${formatCurrency(restante, moneda)}`
            : 'Todavía no has definido un presupuesto para esta obra'}
        </p>
      </section>

      <div className={styles.statsRow}>
        <div className={styles.statCard}>
          <span className={styles.statNum}>{totales.cantidad_gastos ?? 0}</span>
          <span className={styles.statLabel}>Gastos registrados</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statNum}>{colaboradores?.length ?? 0}</span>
          <span className={styles.statLabel}>Colaboradores</span>
        </div>
        {Number(totales.total_ingresos) > 0 && (
          <div className={styles.statCard}>
            <span className={`${styles.statNum} ${styles.success}`}>{formatCurrency(totales.total_ingresos, moneda)}</span>
            <span className={styles.statLabel}>Ingresos / capital</span>
          </div>
        )}
      </div>

      {por_categoria?.length > 0 && (
        <section className={styles.section}>
          <h2>Por categoría</h2>
          <div className={styles.catList}>
            {por_categoria.map((cat) => {
              const catPct = gastado > 0 ? (Number(cat.total) / gastado) * 100 : 0;
              return (
                <div key={cat.nombre} className={styles.catRow}>
                  <span className={styles.catDot} style={{ background: cat.color }} />
                  <span className={styles.catName}>{cat.nombre}</span>
                  <div className={styles.catBar}>
                    <div className={styles.catBarFill} style={{ width: `${catPct}%`, background: cat.color }} />
                  </div>
                  <span className={styles.catAmount}>{formatCurrency(cat.total, moneda)}</span>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {colaboradores?.length > 0 && (
        <section className={styles.section}>
          <h2>Equipo</h2>
          <div className={styles.team}>
            {colaboradores.map((c) => (
              <div key={c.id} className={styles.teamMember}>
                <span className={styles.teamAvatar}>{c.nombre?.[0]?.toUpperCase()}</span>
                <div>
                  <p className={styles.teamName}>{c.nombre}</p>
                  <p className={styles.teamRole}>{c.rol === 'admin' ? 'Admin' : 'Colaborador'}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
