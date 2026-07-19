import styles from './AuthLayout.module.css';

export default function AuthLayout({ children, tagline }) {
  return (
    <div className={styles.wrap}>
      <aside className={styles.brand}>
        <div className={styles.grid} aria-hidden="true" />
        <div className={styles.brandContent}>
          <div className={styles.logo}>
            <span className={styles.logoMark}>TO</span>
            <span className={styles.logoName}>TrackOb</span>
          </div>
          <h1 className={styles.headline}>{tagline || 'Cada peso de la obra, en su lugar.'}</h1>
          <p className={styles.sub}>
            Gastos, tareas, avance fotográfico y bitácora de tus obras, todo en un mismo lugar.
          </p>
          <div className={styles.tape} aria-hidden="true">
            <span>PRESUPUESTO</span>
            <span className={styles.tapeFill} />
            <span>GASTADO</span>
          </div>
        </div>
      </aside>
      <main className={styles.panel}>
        <div className={styles.panelInner}>{children}</div>
      </main>
    </div>
  );
}
