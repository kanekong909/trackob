import { useEffect, useState } from 'react';
import Modal from '../../components/ui/Modal';
import Button from '../../components/ui/Button';
import { api } from '../../api/client';
import { useToast } from '../../context/ToastContext';
import { formatCurrency } from '../../utils/format';
import styles from './Planes.module.css';

export default function TransferenciaModal({ open, onClose, plan, referenciaExistente, onCompletado }) {
  const toast = useToast();
  const [solicitud, setSolicitud] = useState(null);
  const [creando, setCreando] = useState(false);
  const [error, setError] = useState('');
  const [comprobante, setComprobante] = useState(null);
  const [subiendo, setSubiendo] = useState(false);

  useEffect(() => {
    if (!open || !plan) return;
    setError('');
    setComprobante(null);
    setSolicitud(null);

    if (referenciaExistente) {
      // ya existe una solicitud pendiente, no crear otra - solo dejar subir el comprobante
      setSolicitud({ referencia: referenciaExistente, monto: plan.precio_mensual, plan_nombre: plan.nombre });
      return;
    }

    setCreando(true);
    api.post('/api/pagos/transferencia', { plan_id: plan.id })
      .then(setSolicitud)
      .catch((err) => setError(err.message))
      .finally(() => setCreando(false));
  }, [open, plan, referenciaExistente]);

  async function handleSubirComprobante(e) {
    e.preventDefault();
    if (!comprobante) return;
    setSubiendo(true);
    try {
      const fd = new FormData();
      fd.append('comprobante', comprobante);
      await api.post(`/api/pagos/${solicitud.referencia}/comprobante`, fd, { isForm: true });
      onCompletado();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSubiendo(false);
    }
  }

  if (!plan) return null;

  return (
    <Modal open={open} onClose={onClose} title={`Pagar plan ${plan.nombre}`}>
      <div className={styles.transferWrap}>
        {creando && <p className={styles.state}>Generando tu solicitud…</p>}
        {error && <div className={styles.stateError}>{error}</div>}

        {solicitud && (
          <>
            <div className={styles.datosCuenta}>
              <p className={styles.datosLabel}>Transfiere</p>
              <p className={styles.montoGrande}>{formatCurrency(plan.precio_mensual)}</p>
              <p className={styles.cuentaTexto}>{solicitud.datos_cuenta}</p>
              <div className={styles.referenciaBox}>
                <span>Referencia (inclúyela en la transferencia)</span>
                <strong>{solicitud.referencia}</strong>
              </div>
            </div>

            <form onSubmit={handleSubirComprobante} className={styles.comprobanteForm}>
              <label className={styles.uploadLabel}>
                {comprobante ? comprobante.name : '📎 Adjuntar comprobante (foto o PDF)'}
                <input
                  type="file"
                  accept="image/*,application/pdf"
                  onChange={(e) => setComprobante(e.target.files?.[0] || null)}
                  hidden
                />
              </label>
              <Button type="submit" fullWidth loading={subiendo} disabled={!comprobante}>
                Enviar comprobante
              </Button>
            </form>
          </>
        )}
      </div>
    </Modal>
  );
}
