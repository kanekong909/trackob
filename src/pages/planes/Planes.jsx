import { useEffect, useState } from 'react';
import { api } from '../../api/client';
import { useToast } from '../../context/ToastContext';
import Button from '../../components/ui/Button';
import { formatCurrency } from '../../utils/format';
import TransferenciaModal from './TransferenciaModal';
import styles from './Planes.module.css';

export default function Planes() {
  const toast = useToast();
  const [planes, setPlanes] = useState([]);
  const [miPlan, setMiPlan] = useState(null);
  const [misPagos, setMisPagos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [planSeleccionado, setPlanSeleccionado] = useState(null);

  function cargar() {
    setLoading(true);
    setError('');
    Promise.all([
      api.get('/api/pagos/planes'),
      api.get('/api/pagos/mi-plan'),
      api.get('/api/pagos/mis-pagos')
    ])
      .then(([planesData, miPlanData, misPagosData]) => {
        setPlanes(planesData);
        setMiPlan(miPlanData);
        setMisPagos(misPagosData);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }

  useEffect(() => { cargar(); }, []);

  const pagoPendiente = misPagos.find((p) => p.estado === 'pendiente' || p.estado === 'en_revision');
  const planActualId = miPlan?.plan_id;

  function handleSolicitudCreada() {
    toast.success('Solicitud enviada, en revisión');
    setPlanSeleccionado(null);
    cargar();
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1>Planes</h1>
        <p className={styles.subtitle}>Elige el plan que mejor se ajuste al tamaño de tu operación</p>
      </header>

      {loading && <div className={styles.state}>Cargando planes…</div>}
      {!loading && error && <div className={styles.stateError}>{error}</div>}

      {!loading && !error && (
        <>
          <div className={styles.miPlanCard}>
            <div>
              <p className={styles.miPlanLabel}>Tu plan actual</p>
              <p className={styles.miPlanNombre}>
                {miPlan?.plan === 'gratis' ? 'Gratis' : (miPlan?.plan_nombre || 'Gratis')}
              </p>
              {miPlan?.fecha_vencimiento && (
                <p className={styles.miPlanVence}>
                  {miPlan.vencida ? '⚠ Venció el ' : 'Vence el '}
                  {new Date(miPlan.fecha_vencimiento).toLocaleDateString('es-CO')}
                </p>
              )}
            </div>
          </div>

          {pagoPendiente && (
            <div className={styles.avisoPendiente}>
              <strong>Tienes una solicitud de pago {pagoPendiente.estado === 'pendiente' ? 'esperando comprobante' : 'en revisión'}</strong>
              <p>Plan {pagoPendiente.plan_nombre} · Referencia {pagoPendiente.referencia}</p>
              {pagoPendiente.estado === 'pendiente' && (
                <Button size="sm" variant="outline" onClick={() => setPlanSeleccionado({ id: pagoPendiente.plan_id, referenciaExistente: pagoPendiente.referencia })}>
                  Subir comprobante
                </Button>
              )}
            </div>
          )}

          <div className={styles.grid}>
            {planes.map((plan) => {
              const esActual = plan.id === planActualId;
              return (
                <div key={plan.id} className={`${styles.card} ${esActual ? styles.cardActual : ''}`}>
                  {esActual && <span className={styles.badgeActual}>Tu plan</span>}
                  <h3 className={styles.planNombre}>{plan.nombre}</h3>
                  <p className={styles.precio}>
                    {formatCurrency(plan.precio_mensual)}<span className={styles.precioMes}>/mes</span>
                  </p>
                  <ul className={styles.lista}>
                    <li>{plan.max_obras} obra{plan.max_obras !== 1 ? 's' : ''}</li>
                    <li>{plan.max_colaboradores} colaboradores por obra</li>
                    <li>{plan.permite_auditoria ? '✓ Auditoría' : '✕ Sin auditoría'}</li>
                    <li>{plan.permite_pdf ? '✓ Exportar PDF' : '✕ Sin exportar PDF'}</li>
                  </ul>
                  {!esActual && (
                    <Button fullWidth onClick={() => setPlanSeleccionado({ id: plan.id })} disabled={Boolean(pagoPendiente)}>
                      Elegir este plan
                    </Button>
                  )}
                </div>
              );
            })}
          </div>

          {misPagos.length > 0 && (
            <section className={styles.historial}>
              <h2>Historial de pagos</h2>
              <div className={styles.historialLista}>
                {misPagos.map((p) => (
                  <div key={p.id} className={styles.historialFila}>
                    <span>{p.plan_nombre}</span>
                    <span className={`${styles.estadoBadge} ${styles['estado_' + p.estado]}`}>{p.estado}</span>
                    <span className={styles.historialFecha}>{new Date(p.creado_en).toLocaleDateString('es-CO')}</span>
                  </div>
                ))}
              </div>
            </section>
          )}
        </>
      )}

      <TransferenciaModal
        open={Boolean(planSeleccionado)}
        onClose={() => setPlanSeleccionado(null)}
        plan={planes.find((p) => p.id === planSeleccionado?.id)}
        referenciaExistente={planSeleccionado?.referenciaExistente}
        onCompletado={handleSolicitudCreada}
      />
    </div>
  );
}
