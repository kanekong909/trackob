import { useState } from 'react';
import { NavLink, useLocation, useParams } from 'react-router-dom';
import { useNovedadesPendientes } from '../../hooks/useNovedadesPendientes';
import { useMiRolObra } from '../../hooks/useMiRolObra';
import styles from './BottomNav.module.css';

const PRIMARY_ITEMS = [
  { to: '', label: 'Resumen', icon: '◧', end: true },
  { to: 'gastos', label: 'Gastos', icon: '✎' },
  { to: 'tareas', label: 'Tareas', icon: '☑' },
  { to: 'novedades', label: 'Novedades', icon: '⚠', badge: true }
];

const MORE_ITEMS = [
  { to: 'progreso', label: 'Avance', icon: '▤' },
  { to: 'bitacora', label: 'Bitácora', icon: '≡' }
];

export default function BottomNav() {
  const { id } = useParams();
  const location = useLocation();
  const pendientes = useNovedadesPendientes(id);
  const { esAdmin } = useMiRolObra(id);
  const [masAbierto, setMasAbierto] = useState(false);

  if (!id) return null;

  const masItems = esAdmin ? [...MORE_ITEMS, { to: 'auditoria', label: 'Actividad', icon: '🔍' }] : MORE_ITEMS;
  const enMasActivo = masItems.some((item) => location.pathname.endsWith(`/${item.to}`));

  return (
    <>
      {masAbierto && <div className={styles.overlay} onClick={() => setMasAbierto(false)} />}

      <div className={`${styles.sheet} ${masAbierto ? styles.sheetOpen : ''}`}>
        {masItems.map((item) => (
          <NavLink
            key={item.label}
            to={`/obras/${id}/${item.to}`}
            className={styles.sheetItem}
            onClick={() => setMasAbierto(false)}
          >
            <span className={styles.icon}>{item.icon}</span>
            {item.label}
          </NavLink>
        ))}
      </div>

      <nav className={styles.bottomNav}>
        {PRIMARY_ITEMS.map((item) => (
          <NavLink
            key={item.label}
            to={`/obras/${id}${item.to ? `/${item.to}` : ''}`}
            end={item.end}
            className={({ isActive }) => `${styles.item} ${isActive ? styles.active : ''}`}
          >
            <span className={styles.iconWrap}>
              <span className={styles.icon}>{item.icon}</span>
              {item.badge && pendientes > 0 && <span className={styles.dot} />}
            </span>
            <span className={styles.label}>{item.label}</span>
          </NavLink>
        ))}
        <button
          type="button"
          className={`${styles.item} ${enMasActivo ? styles.active : ''}`}
          onClick={() => setMasAbierto((v) => !v)}
        >
          <span className={styles.icon}>⋯</span>
          <span className={styles.label}>Más</span>
        </button>
      </nav>
    </>
  );
}
