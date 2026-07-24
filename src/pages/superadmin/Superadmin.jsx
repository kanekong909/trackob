import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import ResumenTab from './ResumenTab';
import UsuariosTab from './UsuariosTab';
import AuditoriaTab from './AuditoriaTab';
import PagosTab from './PagosTab';
import styles from './Superadmin.module.css';

const TABS = [
  { key: 'resumen', label: 'Resumen' },
  { key: 'pagos', label: 'Pagos pendientes' },
  { key: 'usuarios', label: 'Usuarios' },
  { key: 'auditoria', label: 'Auditoría global' }
];

export default function Superadmin() {
  const { usuario } = useAuth();
  const [tab, setTab] = useState('resumen');

  if (usuario?.rol !== 'superadmin') {
    return (
      <div className={styles.page}>
        <div className={styles.sinAcceso}>
          <h3>Esta sección es solo para el equipo de TrackOb</h3>
          <p>No tienes permisos de superadmin.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1>Panel de superadmin</h1>
        <p className={styles.subtitle}>Visión general de todos los clientes y obras de la plataforma</p>
      </header>

      <div className={styles.tabs}>
        {TABS.map((t) => (
          <button
            key={t.key}
            className={`${styles.tabBtn} ${tab === t.key ? styles.tabActive : ''}`}
            onClick={() => setTab(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className={styles.tabContent}>
        {tab === 'resumen' && <ResumenTab />}
        {tab === 'pagos' && <PagosTab />}
        {tab === 'usuarios' && <UsuariosTab />}
        {tab === 'auditoria' && <AuditoriaTab />}
      </div>
    </div>
  );
}
