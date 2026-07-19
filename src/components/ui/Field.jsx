import styles from './Field.module.css';

export default function Field({
  label,
  error,
  hint,
  type = 'text',
  as = 'input',
  children,
  ...rest
}) {
  const Comp = as;
  return (
    <label className={styles.field}>
      {label && <span className={styles.label}>{label}</span>}
      {as === 'select' ? (
        <select className={`${styles.input} ${error ? styles.invalid : ''}`} {...rest}>
          {children}
        </select>
      ) : as === 'textarea' ? (
        <textarea className={`${styles.input} ${styles.textarea} ${error ? styles.invalid : ''}`} {...rest} />
      ) : (
        <input type={type} className={`${styles.input} ${error ? styles.invalid : ''}`} {...rest} />
      )}
      {hint && !error && <span className={styles.hint}>{hint}</span>}
      {error && <span className={styles.error}>{error}</span>}
    </label>
  );
}
