import { useEffect, useState } from 'react';
import { api } from '../../api/client';
import styles from './Superadmin.module.css';

export default function UsuariosTab() {
  const [usuarios, setUsuarios] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/api/admin/usuarios')
      .then(setUsuarios)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const filtrados = usuarios.filter((u) =>
    !busqueda ||
    u.nombre?.toLowerCase().includes(busqueda.toLowerCase()) ||
    u.email?.toLowerCase().includes(busqueda.toLowerCase())
  );

  if (loading) return <div className={styles.state}>Cargando usuarios…</div>;
  if (error) return <div className={styles.stateError}>{error}</div>;

  return (
    <div>
      <input
        type="text"
        className={styles.buscador}
        placeholder="Buscar por nombre o correo…"
        value={busqueda}
        onChange={(e) => setBusqueda(e.target.value)}
      />

      <div className={styles.tabla}>
        <div className={styles.tablaHead}>
          <span>Nombre</span>
          <span>Correo</span>
          <span>Rol</span>
          <span>Obras</span>
          <span>Gastos</span>
          <span>Última actividad</span>
        </div>
        {filtrados.map((u) => (
          <div key={u.id} className={styles.tablaRow}>
            <span>{u.nombre}</span>
            <span className={styles.celdaMuted}>{u.email}</span>
            <span><span className={styles.rolBadge}>{u.rol}</span></span>
            <span>{u.total_obras}</span>
            <span>{u.total_gastos}</span>
            <span className={styles.celdaMuted}>
              {u.ultima_actividad ? new Date(u.ultima_actividad).toLocaleDateString('es-CO') : '—'}
            </span>
          </div>
        ))}
        {filtrados.length === 0 && <p className={styles.vacio}>Sin resultados</p>}
      </div>
    </div>
  );
}
