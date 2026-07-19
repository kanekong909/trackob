import Modal from '../../components/ui/Modal';
import Button from '../../components/ui/Button';
import { formatCurrency, formatDate, formatQty } from '../../utils/format';
import styles from './Gastos.module.css';

export default function GastoDetailModal({ open, onClose, gasto, puedeEditar, onEdit, onDelete, moneda = 'COP' }) {
  if (!gasto) return null;
  const esIngreso = gasto.categorias?.some((c) => c.tipo === 'ingreso');

  return (
    <Modal open={open} onClose={onClose} title="Detalle del gasto">
      <div className={styles.detail}>
        <div className={styles.detailAmount}>
          <span className={`${styles.detailAmountValue} ${esIngreso ? styles.ingreso : ''}`}>
            {esIngreso ? '+' : ''}{formatCurrency(gasto.monto, moneda)}
          </span>
          <span className={styles.detailDate}>{formatDate(gasto.fecha, { weekday: 'long' })}</span>
        </div>

        <h3 className={styles.detailDesc}>{gasto.descripcion}</h3>

        {gasto.categorias?.length > 0 && (
          <div className={styles.detailChips}>
            {gasto.categorias.map((c) => (
              <span key={c.id} className={styles.miniChip} style={{ background: `${c.color}1A`, color: c.color }}>
                {c.nombre}
              </span>
            ))}
          </div>
        )}

        {gasto.foto_url && (
          <a href={gasto.foto_url} target="_blank" rel="noreferrer" className={styles.detailFotoLink}>
            <img src={gasto.foto_url} alt="Comprobante" className={styles.detailFoto} />
          </a>
        )}

        <dl className={styles.detailList}>
          {gasto.cantidad && (
            <div className={styles.detailRow}>
              <dt>Cantidad</dt>
              <dd>{formatQty(gasto.cantidad)} {gasto.unidad}</dd>
            </div>
          )}
          {gasto.valor_unitario && (
            <div className={styles.detailRow}>
              <dt>Valor unitario</dt>
              <dd>{formatCurrency(gasto.valor_unitario, moneda)}</dd>
            </div>
          )}
          {gasto.proveedor && (
            <div className={styles.detailRow}>
              <dt>Proveedor</dt>
              <dd>{gasto.proveedor}</dd>
            </div>
          )}
          <div className={styles.detailRow}>
            <dt>Registrado por</dt>
            <dd>{gasto.usuario_nombre}</dd>
          </div>
          {gasto.notas && (
            <div className={styles.detailRow}>
              <dt>Notas</dt>
              <dd>{gasto.notas}</dd>
            </div>
          )}
        </dl>

        {puedeEditar ? (
          <div className={styles.detailActions}>
            <Button variant="outline" fullWidth onClick={() => onEdit(gasto)}>Editar</Button>
            <Button variant="danger" fullWidth onClick={() => onDelete(gasto)}>Eliminar</Button>
          </div>
        ) : (
          <p className={styles.detailLockedNote}>
            🔒 Solo {gasto.usuario_nombre} o un administrador de la obra puede editar o eliminar este gasto.
          </p>
        )}
      </div>
    </Modal>
  );
}
