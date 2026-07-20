import { NavLink, useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useNovedadesPendientes } from '../../hooks/useNovedadesPendientes';
import { useMiRolObra } from '../../hooks/useMiRolObra';
import styles from './Sidebar.module.css';

const NAV_ITEMS = [
  { to: '', label: 'Resumen', icon: '◧', end: true },
  { to: 'gastos', label: 'Gastos', icon: '✎' },
  { to: 'tareas', label: 'Tareas', icon: '☑' },
  { to: 'novedades', label: 'Novedades', icon: '⚠', badge: true },
  { to: 'progreso', label: 'Avance', icon: '▤' },
  { to: 'bitacora', label: 'Bitácora', icon: '≡' }
];

export default function Sidebar() {
  const { usuario, logout } = useAuth();
  const { id } = useParams();
  const pendientes = useNovedadesPendientes(id);
  const { esAdmin } = useMiRolObra(id);

  return (
    <aside className={styles.sidebar}>
      <div className={styles.brand}>
        <span className={styles.logoMark}>TO</span>
        <span className={styles.logoName}>TrackOb</span>
      </div>

      {id && (
        <NavLink to="/obras" end className={styles.allObras}>
          ← Todas las obras
        </NavLink>
      )}

      {id && (
        <nav className={styles.nav}>
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.label}
              to={`/obras/${id}${item.to ? `/${item.to}` : ''}`}
              end={item.end}
              className={({ isActive }) => `${styles.navItem} ${isActive ? styles.active : ''}`}
            >
              <span className={styles.icon}>{item.icon}</span>
              {item.label}
              {item.badge && pendientes > 0 && <span className={styles.navBadge}>{pendientes}</span>}
            </NavLink>
          ))}
          {esAdmin && (
            <NavLink
              to={`/obras/${id}/auditoria`}
              className={({ isActive }) => `${styles.navItem} ${isActive ? styles.active : ''}`}
            >
              <span className={styles.icon}>🔍</span>
              Actividad
            </NavLink>
          )}
        </nav>
      )}

      <div className={styles.footer}>
        <div className={styles.user}>
          <span className={styles.avatar}>{usuario?.nombre?.[0]?.toUpperCase()}</span>
          <span className={styles.userName}>{usuario?.nombre}</span>
        </div>
        <button className={styles.logout} onClick={logout}>Salir</button>
      </div>
    </aside>
  );
}
