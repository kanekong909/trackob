import styles from './ToastContainer.module.css';

const ICONS = { success: '✓', error: '✕', info: 'ℹ' };

export default function ToastContainer({ toasts, onDismiss }) {
  if (!toasts.length) return null;

  return (
    <div className={styles.stack}>
      {toasts.map((t) => (
        <div key={t.id} className={`${styles.toast} ${styles[t.type]}`} role="status">
          <span className={styles.icon}>{ICONS[t.type]}</span>
          <span className={styles.message}>{t.message}</span>
          <button className={styles.close} onClick={() => onDismiss(t.id)} aria-label="Cerrar">✕</button>
        </div>
      ))}
    </div>
  );
}
