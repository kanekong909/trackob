import { useEffect, useState } from 'react';
import { api } from '../../api/client';
import { formatCurrency } from '../../utils/format';
import styles from './Superadmin.module.css';

export default function ResumenTab() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/api/admin/stats')
      .then(setStats)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className={styles.state}>Cargando estadísticas…</div>;
  if (error) return <div className={styles.stateError}>{error}</div>;
  if (!stats) return null;

  const tarjetas = [
    { label: 'Usuarios', valor: stats.usuarios },
    { label: 'Obras', valor: stats.obras },
    { label: 'Gastos registrados', valor: stats.gastos },
    { label: 'Dinero total gestionado', valor: formatCurrency(stats.total_dinero) },
    { label: 'Tareas', valor: stats.tareas },
    { label: 'Eventos de auditoría', valor: stats.eventos_auditoria },
    { label: 'Eventos hoy', valor: stats.eventos_hoy }
  ];

  return (
    <div>
      <div className={styles.statsGrid}>
        {tarjetas.map((t) => (
          <div key={t.label} className={styles.statCard}>
            <p className={styles.statValor}>{t.valor}</p>
            <p className={styles.statLabel}>{t.label}</p>
          </div>
        ))}
      </div>

      <div className={styles.dosColumnas}>
        <section>
          <h3>Usuarios más activos (7 días)</h3>
          <div className={styles.miniTabla}>
            {stats.top_usuarios?.map((u, i) => (
              <div key={i} className={styles.miniFila}>
                <span>{u.usuario_nombre || 'Sistema'}</span>
                <strong>{u.acciones}</strong>
              </div>
            ))}
            {(!stats.top_usuarios || stats.top_usuarios.length === 0) && (
              <p className={styles.vacio}>Sin actividad reciente</p>
            )}
          </div>
        </section>

        <section>
          <h3>Acciones por tipo</h3>
          <div className={styles.miniTabla}>
            {stats.top_acciones?.map((a, i) => (
              <div key={i} className={styles.miniFila}>
                <span>{a.accion}</span>
                <strong>{a.total}</strong>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
