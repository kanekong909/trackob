import styles from './ComingSoon.module.css';

export default function ComingSoon({ label }) {
  return (
    <div className={styles.wrap}>
      <div className={styles.icon}>🚧</div>
      <h2>{label}</h2>
      <p>Este módulo lo construimos en el siguiente paso.</p>
    </div>
  );
}
