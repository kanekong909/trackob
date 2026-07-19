import { formatCurrency, formatQty } from '../../utils/format';
import styles from './Gastos.module.css';

export default function GastoRow({ gasto, selected, onToggleSelect, onEdit, onDelete, onOpenDetail, puedeEditar, moneda = 'COP' }) {
  const esIngreso = gasto.categorias?.some((c) => c.tipo === 'ingreso');

  return (
    <div className={styles.row} onClick={() => onOpenDetail(gasto)} role="button" tabIndex={0}>
      <input
        type="checkbox"
        className={styles.checkbox}
        checked={selected}
        onChange={() => onToggleSelect(gasto.id)}
        onClick={(e) => e.stopPropagation()}
        aria-label={`Seleccionar ${gasto.descripcion}`}
      />

      {gasto.foto_url ? (
        <img src={gasto.foto_url} alt="" className={styles.thumb} />
      ) : (
        <div className={styles.thumbEmpty}>—</div>
      )}

      <div className={styles.rowMain}>
        <p className={styles.rowDesc}>{gasto.descripcion}</p>
        <div className={styles.rowMeta}>
          {gasto.categorias?.map((c) => (
            <span key={c.id} className={styles.miniChip} style={{ background: `${c.color}1A`, color: c.color }}>
              {c.nombre}
            </span>
          ))}
          {gasto.proveedor && <span className={styles.rowProveedor}>{gasto.proveedor}</span>}
          {gasto.cantidad && (
            <span className={styles.rowCantidad}>{formatQty(gasto.cantidad)} {gasto.unidad || ''}</span>
          )}
          <span className={styles.rowUser}>· {gasto.usuario_nombre}</span>
        </div>
      </div>

      <div className={styles.rowRight}>
        <span className={`${styles.rowAmount} ${esIngreso ? styles.ingreso : ''}`}>
          {esIngreso ? '+' : ''}{formatCurrency(gasto.monto, moneda)}
        </span>
        {puedeEditar ? (
          <div className={styles.rowActions}>
            <button onClick={(e) => { e.stopPropagation(); onEdit(gasto); }} className={styles.actionBtn} aria-label="Editar">✎</button>
            <button onClick={(e) => { e.stopPropagation(); onDelete(gasto); }} className={`${styles.actionBtn} ${styles.actionDanger}`} aria-label="Eliminar">🗑</button>
          </div>
        ) : (
          <span className={styles.rowLocked} title="Solo quien lo registró o un administrador puede editar o eliminar este gasto">🔒</span>
        )}
      </div>
    </div>
  );
}
