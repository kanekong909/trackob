import styles from './CategoriaChip.module.css';

export default function CategoriaChip({ categoria, selected, onToggle, size = 'md' }) {
  return (
    <button
      type="button"
      onClick={() => onToggle?.(categoria.id)}
      className={`${styles.chip} ${styles[size]} ${selected ? styles.selected : ''}`}
      style={selected ? { background: categoria.color, borderColor: categoria.color } : { borderColor: categoria.color }}
    >
      <span className={styles.dot} style={{ background: categoria.color }} />
      {categoria.nombre}
    </button>
  );
}
