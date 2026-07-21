import { useCallback, useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { formatCurrency, cloudinaryThumb } from '../../utils/format';
import Button from '../../components/ui/Button';
import DivisaToggle from '../../components/ui/DivisaToggle';
import EditarObraModal from './EditarObraModal';
import { useDisplayCurrency } from '../../hooks/useDisplayCurrency';
import styles from './ObraDetail.module.css';

export default function ObraDetail() {
  const { id } = useParams();
  const { usuario } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editando, setEditando] = useState(false);
  const idRef = useRef(id);

  useEffect(() => { idRef.current = id; }, [id]);

  const cargar = useCallback(() => {
    const solicitando = id;
    setLoading(true);
    setError('');
    return api.get(`/api/obras/${id}/resumen`)
      .then((r) => { if (idRef.current === solicitando) setData(r); })
      .catch((err) => { if (idRef.current === solicitando) setError(err.message); })
      .finally(() => { if (idRef.current === solicitando) setLoading(false); });
  }, [id]);

  useEffect(() => { cargar(); }, [cargar]);

  const moneda = data?.obra?.moneda || 'COP';
  const { verEn, setVerEn, divisaActiva, mostrar, revertir } = useDisplayCurrency(moneda);

  if (loading) return <div className={styles.state}>Cargando resumen…</div>;
  if (error) return <div className={styles.stateError}>{error}</div>;
  if (!data?.obra) return <div className={styles.stateError}>No se pudo cargar la información de esta obra.</div>;

  const { obra, totales = {}, por_categoria, colaboradores } = data;
  const presupuesto = Number(obra.presupuesto) || 0;
  const gastado = Number(totales.total_gastado) || 0;
  const restante = presupuesto - gastado;
  const pct = presupuesto > 0 ? Math.min(100, (gastado / presupuesto) * 100) : 0;
  const sobrepasado = presupuesto > 0 && gastado > presupuesto;

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          {(obra.creador_id === usuario?.id ? usuario?.logo_empresa_url : obra.logo_empresa_url) && (
            <img
              src={cloudinaryThumb(obra.creador_id === usuario?.id ? usuario.logo_empresa_url : obra.logo_empresa_url, 200)}
              alt=""
              className={styles.logoEmpresa}
            />
          )}
          <p className={styles.eyebrow}>{obra.ubicacion || 'Sin ubicación'} · {moneda}</p>
          <h1>{obra.nombre}</h1>
          {obra.descripcion && <p className={styles.desc}>{obra.descripcion}</p>}
        </div>
        <div className={styles.headerActions}>
          <DivisaToggle monedaNativa={moneda} verEn={verEn} onChange={setVerEn} />
          {data.mi_rol === 'admin' && (
            <Button variant="outline" onClick={() => setEditando(true)}>Editar obra</Button>
          )}
        </div>
      </header>

      <EditarObraModal
        open={editando}
        onClose={() => setEditando(false)}
        obra={obra}
        divisaActiva={divisaActiva}
        mostrar={mostrar}
        revertir={revertir}
        onSaved={cargar}
      />

      <section className={styles.tapeCard}>
        <div className={styles.tapeRow}>
          <div>
            <span className={styles.tapeLabel}>Gastado</span>
            <p className={`${styles.tapeValue} ${sobrepasado ? styles.over : ''}`}>{formatCurrency(mostrar(gastado), divisaActiva)}</p>
          </div>
          <div className={styles.tapeRight}>
            <span className={styles.tapeLabel}>Presupuesto</span>
            <p className={styles.tapeValue}>{presupuesto > 0 ? formatCurrency(mostrar(presupuesto), divisaActiva) : '—'}</p>
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
              ? `Excedido por ${formatCurrency(mostrar(Math.abs(restante)), divisaActiva)}`
              : `Disponible: ${formatCurrency(mostrar(restante), divisaActiva)}`
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
            <span className={`${styles.statNum} ${styles.success}`}>{formatCurrency(mostrar(totales.total_ingresos), divisaActiva)}</span>
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
                  <span className={styles.catAmount}>{formatCurrency(mostrar(cat.total), divisaActiva)}</span>
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
