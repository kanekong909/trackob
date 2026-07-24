import { useCallback, useEffect, useState } from 'react';
import { api } from '../../api/client';
import { useToast } from '../../context/ToastContext';
import Button from '../../components/ui/Button';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import { formatCurrency } from '../../utils/format';
import styles from './Superadmin.module.css';

export default function PagosTab() {
  const toast = useToast();
  const [pagos, setPagos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [procesandoId, setProcesandoId] = useState(null);
  const [aRechazar, setARechazar] = useState(null);
  const [fotoAmpliada, setFotoAmpliada] = useState(null);

  const cargar = useCallback(() => {
    setLoading(true);
    api.get('/api/admin/pagos-pendientes')
      .then(setPagos)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  async function aprobar(pago) {
    setProcesandoId(pago.id);
    try {
      await api.post(`/api/admin/pagos/${pago.id}/aprobar`, {});
      toast.success(`Pago de ${pago.usuario_nombre} aprobado`);
      cargar();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setProcesandoId(null);
    }
  }

  async function confirmarRechazar() {
    if (!aRechazar) return;
    setProcesandoId(aRechazar.id);
    try {
      await api.post(`/api/admin/pagos/${aRechazar.id}/rechazar`, {});
      toast.success('Pago rechazado');
      setARechazar(null);
      cargar();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setProcesandoId(null);
    }
  }

  if (loading) return <div className={styles.state}>Cargando pagos pendientes…</div>;
  if (error) return <div className={styles.stateError}>{error}</div>;

  return (
    <div>
      {pagos.length === 0 && <p className={styles.vacio}>No hay pagos pendientes de revisión 🎉</p>}

      <div className={styles.pagosLista}>
        {pagos.map((p) => (
          <div key={p.id} className={styles.pagoCard}>
            <div className={styles.pagoInfo}>
              <p className={styles.pagoUsuario}>{p.usuario_nombre} <span className={styles.celdaMuted}>· {p.usuario_email}</span></p>
              <p className={styles.pagoDetalle}>Plan {p.plan_nombre} · {formatCurrency(p.monto)} · Ref. {p.referencia}</p>
              <span className={`${styles.estadoBadgePago} ${styles['estado_' + p.estado]}`}>{p.estado}</span>
            </div>

            {p.comprobante_url ? (
              <button className={styles.verComprobante} onClick={() => setFotoAmpliada(p.comprobante_url)}>
                Ver comprobante
              </button>
            ) : (
              <span className={styles.sinComprobante}>Sin comprobante todavía</span>
            )}

            <div className={styles.pagoAcciones}>
              <Button
                size="sm"
                onClick={() => aprobar(p)}
                loading={procesandoId === p.id}
                disabled={!p.comprobante_url}
              >
                Aprobar
              </Button>
              <Button
                size="sm"
                variant="danger"
                onClick={() => setARechazar(p)}
                disabled={procesandoId === p.id}
              >
                Rechazar
              </Button>
            </div>
          </div>
        ))}
      </div>

      {fotoAmpliada && (
        <div className={styles.lightbox} onClick={() => setFotoAmpliada(null)}>
          <img src={fotoAmpliada} alt="Comprobante de pago" />
        </div>
      )}

      <ConfirmDialog
        open={Boolean(aRechazar)}
        onClose={() => setARechazar(null)}
        onConfirm={confirmarRechazar}
        title="Rechazar pago"
        message={`¿Rechazar la solicitud de ${aRechazar?.usuario_nombre}? Puede volver a intentarlo después.`}
        confirmLabel="Rechazar"
        danger
        loading={procesandoId === aRechazar?.id}
      />
    </div>
  );
}
