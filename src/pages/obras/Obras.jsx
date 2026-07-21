import { useEffect, useState } from 'react';
import { api } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import ObraCard from './ObraCard';
import CrearObraModal from './CrearObraModal';
import Button from '../../components/ui/Button';
import PerfilModal from '../perfil/PerfilModal';
import styles from './Obras.module.css';

export default function Obras() {
  const { usuario } = useAuth();
  const [obras, setObras] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [perfilOpen, setPerfilOpen] = useState(false);

  useEffect(() => { cargarObras(); }, []);

  async function cargarObras() {
    setLoading(true);
    setError('');
    try {
      const data = await api.get('/api/obras');
      setObras(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function handleCreated(obra) {
    setObras((prev) => [{ ...obra, mi_rol: 'admin', total_gastos_count: 0, tareas_pendientes: 0, total_gastado: 0 }, ...prev]);
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <p className={styles.eyebrow}>Hola, {usuario?.nombre?.split(' ')[0]}</p>
          <h1>Tus obras</h1>
        </div>
        <div className={styles.headerActions}>
          <button className={styles.perfilBtn} onClick={() => setPerfilOpen(true)} aria-label="Mi perfil">
            {usuario?.nombre?.[0]?.toUpperCase()}
          </button>
          <Button onClick={() => setModalOpen(true)}>+ Nueva obra</Button>
        </div>
      </header>

      <PerfilModal open={perfilOpen} onClose={() => setPerfilOpen(false)} />

      {loading && <div className={styles.state}>Cargando obras…</div>}

      {!loading && error && (
        <div className={styles.stateError}>
          No se pudieron cargar tus obras. {error}
          <button onClick={cargarObras} className={styles.retry}>Reintentar</button>
        </div>
      )}

      {!loading && !error && obras.length === 0 && (
        <div className={styles.empty}>
          <div className={styles.emptyIcon}>◧</div>
          <h3>Todavía no tienes obras</h3>
          <p>Crea la primera para empezar a registrar gastos, tareas y avance.</p>
          <Button onClick={() => setModalOpen(true)}>+ Crear mi primera obra</Button>
        </div>
      )}

      {!loading && !error && obras.length > 0 && (
        <div className={styles.grid}>
          {obras.map((obra) => (
            <ObraCard key={obra.id} obra={obra} />
          ))}
        </div>
      )}

      <CrearObraModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onCreated={handleCreated}
      />
    </div>
  );
}
