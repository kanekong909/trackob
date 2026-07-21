import { useState } from 'react';
import { NavLink, useLocation, useParams } from 'react-router-dom';
import { useNovedadesPendientes } from '../../hooks/useNovedadesPendientes';
import { useMiRolObra } from '../../hooks/useMiRolObra';
import PerfilModal from '../../pages/perfil/PerfilModal';
import styles from './BottomNav.module.css';
import {
  LayoutDashboard,
  Wallet,
  CheckSquare,
  BellRing,
  MessageCircle,
  ChartColumn,
  NotebookText,
  Logs,
  UserRound,
  Ellipsis
} from "lucide-react";

const PRIMARY_ITEMS = [
  {
    to: "",
    label: "Resumen",
    icon: LayoutDashboard,
    end: true,
  },
  {
    to: "gastos",
    label: "Gastos",
    icon: Wallet,
  },
  {
    to: "tareas",
    label: "Tareas",
    icon: CheckSquare,
  },
  {
    to: "novedades",
    label: "Novedades",
    icon: BellRing,
    badge: true,
  },
];

const MORE_ITEMS = [
  {
    to: "progreso",
    label: "Avance",
    icon: ChartColumn,
  },
  {
    to: "bitacora",
    label: "Bitácora",
    icon: NotebookText,
  },
  {
    to: "chat",
    label: "Chat",
    icon: MessageCircle,
  },
];

export default function BottomNav() {
  const { id } = useParams();
  const location = useLocation();
  const pendientes = useNovedadesPendientes(id);
  const { esAdmin } = useMiRolObra(id);
  const [masAbierto, setMasAbierto] = useState(false);
  const [perfilOpen, setPerfilOpen] = useState(false);

  if (!id) return null;

  const masItems = esAdmin ? [...MORE_ITEMS, { to: 'auditoria', label: 'Actividad', icon: Logs }] : MORE_ITEMS;
  const enMasActivo = masItems.some((item) => location.pathname.endsWith(`/${item.to}`));

  return (
    <>
      {masAbierto && <div className={styles.overlay} onClick={() => setMasAbierto(false)} />}

      <div className={`${styles.sheet} ${masAbierto ? styles.sheetOpen : ''}`}>
        {masItems.map((item) => {
          const Icon = item.icon;

          return (
            <NavLink
              key={item.label}
              to={`/obras/${id}/${item.to}`}
              className={styles.sheetItem}
              onClick={() => setMasAbierto(false)}
            >
              <Icon size={20} />
              {item.label}
            </NavLink>
          );
        })}
        <button
          type="button"
          className={styles.sheetItem}
          onClick={() => { setMasAbierto(false); setPerfilOpen(true); }}
        >
          <UserRound size={20} />
          Mi perfil
        </button>
      </div>

      <nav className={styles.bottomNav}>
        {PRIMARY_ITEMS.map((item) => {
          const Icon = item.icon;

          return (
            <NavLink
              key={item.label}
              to={`/obras/${id}${item.to ? `/${item.to}` : ""}`}
              end={item.end}
              className={({ isActive }) =>
                `${styles.item} ${isActive ? styles.active : ""}`
              }
            >
              <span className={styles.iconWrap}>
                <Icon size={20} />

                {item.badge && pendientes > 0 && (
                  <span className={styles.dot} />
                )}
              </span>

              <span className={styles.label}>
                {item.label}
              </span>
            </NavLink>
          );
        })}
        <button
          type="button"
          className={`${styles.item} ${enMasActivo ? styles.active : ''}`}
          onClick={() => setMasAbierto((v) => !v)}
        >
          <Ellipsis size={20} />
          <span className={styles.label}>Más</span>
        </button>
      </nav>

      <PerfilModal open={perfilOpen} onClose={() => setPerfilOpen(false)} />
    </>
  );
}
