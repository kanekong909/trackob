import { useState } from 'react';
import { NavLink, useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useNovedadesPendientes } from '../../hooks/useNovedadesPendientes';
import { useMiRolObra } from '../../hooks/useMiRolObra';
import PerfilModal from '../../pages/perfil/PerfilModal';
import { cloudinaryThumb } from '../../utils/format';
import styles from './Sidebar.module.css';
import {
  LayoutDashboard,
  Wallet,
  CheckSquare,
  BellRing,
  ChartColumn,
  NotebookText,
  History,
  ArrowLeft,
  ClipboardList
} from "lucide-react";

const NAV_ITEMS = [
  {
    to: "",
    label: "Resumen",
    icon: LayoutDashboard,
    end: true
  },
  {
    to: "gastos",
    label: "Gastos",
    icon: Wallet
  },
  {
    to: "tareas",
    label: "Tareas",
    icon: CheckSquare
  },
  {
    to: "novedades",
    label: "Novedades",
    icon: BellRing,
    badge: true
  },
  {
    to: "progreso",
    label: "Avance",
    icon: ChartColumn
  },
  {
    to: "bitacora",
    label: "Bitácora",
    icon: NotebookText
  }
];

export default function Sidebar() {
  const { usuario, logout } = useAuth();
  const { id } = useParams();
  const pendientes = useNovedadesPendientes(id);
  const { esAdmin, obra } = useMiRolObra(id);
  const [perfilOpen, setPerfilOpen] = useState(false);

  return (
    <aside className={styles.sidebar}>
      <div className={styles.brand}>
        {obra?.logo_empresa_url ? (
          <img src={cloudinaryThumb(obra.logo_empresa_url, 160)} alt="" className={styles.logoEmpresa} />
        ) : (
          <>
            <span className={styles.logoMark}>TO</span>
            <span className={styles.logoName}>TrackOb</span>
          </>
        )}
      </div>

      {id && (
        <NavLink to="/obras" end className={styles.allObras}>
          ← Todas las obras
        </NavLink>
      )}

      {id && (
        <nav className={styles.nav}>
          {NAV_ITEMS.map((item) => {
              const Icon = item.icon;

              return (
                  <NavLink
                      key={item.label}
                      to={`/obras/${id}${item.to ? `/${item.to}` : ""}`}
                      end={item.end}
                      className={({ isActive }) =>
                          `${styles.navItem} ${isActive ? styles.active : ""}`
                      }
                  >
                      <Icon size={20} strokeWidth={2} />

                      <span>{item.label}</span>

                      {item.badge && pendientes > 0 && (
                          <span className={styles.navBadge}>
                              {pendientes}
                          </span>
                      )}
                  </NavLink>
              );
          })}
          {esAdmin && (
            <NavLink
              to={`/obras/${id}/auditoria`}
              className={({ isActive }) => `${styles.navItem} ${isActive ? styles.active : ''}`}
            >
              <ClipboardList size={20} />
              <span>Actividad</span>
            </NavLink>
          )}
        </nav>
      )}

      <div className={styles.footer}>
        <button className={styles.user} onClick={() => setPerfilOpen(true)}>
          {usuario?.fondo_url ? (
            <img src={cloudinaryThumb(usuario.fondo_url, 60)} alt="" className={styles.avatarImg} />
          ) : (
            <span className={styles.avatar}>{usuario?.nombre?.[0]?.toUpperCase()}</span>
          )}
          <span className={styles.userName}>{usuario?.nombre}</span>
        </button>
        <button className={styles.logout} onClick={logout}>Salir</button>
      </div>

      <PerfilModal open={perfilOpen} onClose={() => setPerfilOpen(false)} />
    </aside>
  );
}
