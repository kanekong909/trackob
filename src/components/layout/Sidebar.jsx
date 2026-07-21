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
  ClipboardList,
  Logs
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

  // Si el usuario es el creador de la obra, usa el logo del AuthContext
  // para reflejar los cambios inmediatamente al editar el perfil.
  const logoAMostrar =
    obra?.creador_id === usuario?.id
      ? usuario?.logo_empresa_url
      : obra?.logo_empresa_url;

  return (
    <aside className={styles.sidebar}>
      <div className={styles.brand}>
        {logoAMostrar ? (
          <img
            src={cloudinaryThumb(logoAMostrar, 160)}
            alt=""
            className={styles.logoEmpresa}
          />
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
              <Logs size={20} />
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
