import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import Button from '../../components/ui/Button';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import TareaCard from './TareaCard';
import TareaModal from './TareaModal';
import TareaHistorialModal from './TareaHistorialModal';
import styles from './Tareas.module.css';

const COLUMNAS = [
  { estado: 'pendiente', titulo: 'Pendiente' },
  { estado: 'en_progreso', titulo: 'En progreso' },
  { estado: 'hecho', titulo: 'Hecho' }
];

const REFRESH_MS = 15000;

export default function Tareas() {
  const { id: obraId } = useParams();
  const { usuario } = useAuth();
  const toast = useToast();

  const [tareas, setTareas] = useState([]);
  const [colaboradores, setColaboradores] = useState([]);
  const [miRol, setMiRol] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [modalOpen, setModalOpen] = useState(false);
  const [tareaEditando, setTareaEditando] = useState(null);
  const [tareaHistorial, setTareaHistorial] = useState(null);
  const [tareaAEliminar, setTareaAEliminar] = useState(null);
  const [eliminando, setEliminando] = useState(false);

  const cargarBase = useCallback(async () => {
    try {
      const resumen = await api.get(`/api/obras/${obraId}/resumen`);
      setMiRol(resumen.mi_rol);
      setColaboradores(resumen.colaboradores || []);
    } catch {
      // el banner de tareas no depende críticamente de esto, se reintenta con el poll
    }
  }, [obraId]);

  const cargarTareas = useCallback(async ({ silencioso = false } = {}) => {
    if (!silencioso) setLoading(true);
    setError('');
    try {
      const data = await api.get(`/api/tareas?obra_id=${obraId}`);
      setTareas(data);
    } catch (err) {
      if (!silencioso) setError(err.message);
    } finally {
      if (!silencioso) setLoading(false);
    }
  }, [obraId]);

  useEffect(() => { cargarBase(); }, [cargarBase]);
  useEffect(() => { cargarTareas(); }, [cargarTareas]);

  // Refresco automático silencioso para que el admin vea cambios de
  // estado de los colaboradores sin tener que recargar la página.
  useEffect(() => {
    const interval = setInterval(() => cargarTareas({ silencioso: true }), REFRESH_MS);
    return () => clearInterval(interval);
  }, [cargarTareas]);

  const esAdmin = miRol === 'admin';

  function puedeEditar(tarea) {
    return esAdmin || Number(tarea.creador_id) === Number(usuario?.id);
  }

  function puedeCambiarEstado(tarea) {
    return esAdmin || Number(tarea.asignado_a) === Number(usuario?.id);
  }

  function abrirNueva() {
    setTareaEditando(null);
    setModalOpen(true);
  }

  function abrirEditar(tarea) {
    setTareaEditando(tarea);
    setModalOpen(true);
  }

  function handleSaved() {
    toast.success(tareaEditando ? 'Tarea actualizada' : 'Tarea creada');
    cargarTareas();
  }

  async function cambiarEstado(tarea, estado) {
    // actualización optimista para que se sienta instantáneo
    setTareas((prev) => prev.map((t) => (t.id === tarea.id ? { ...t, estado } : t)));
    try {
      await api.put(`/api/tareas/${tarea.id}/estado`, { estado });
      toast.success('Estado actualizado');
      cargarTareas({ silencioso: true });
    } catch (err) {
      toast.error(err.message);
      cargarTareas({ silencioso: true }); // revierte al estado real del servidor
    }
  }

  function pedirEliminar(tarea) {
    setTareaAEliminar(tarea);
  }

  async function confirmarEliminar() {
    if (!tareaAEliminar) return;
    setEliminando(true);
    try {
      await api.del(`/api/tareas/${tareaAEliminar.id}`);
      setTareas((prev) => prev.filter((t) => t.id !== tareaAEliminar.id));
      toast.success('Tarea eliminada');
      setTareaAEliminar(null);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setEliminando(false);
    }
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <h1>Tareas</h1>
          <p className={styles.subtitle}>
            {esAdmin ? 'Crea tareas y asígnalas a tu equipo' : 'Cambia el estado de tus tareas asignadas'}
          </p>
        </div>
        {esAdmin && <Button onClick={abrirNueva}>+ Nueva tarea</Button>}
      </header>

      {loading && <div className={styles.state}>Cargando tareas…</div>}
      {!loading && error && (
        <div className={styles.stateError}>
          {error}
          <button onClick={() => cargarTareas()} className={styles.retry}>Reintentar</button>
        </div>
      )}

      {!loading && !error && tareas.length === 0 && (
        <div className={styles.empty}>
          <h3>Sin tareas todavía</h3>
          <p>{esAdmin ? 'Crea la primera tarea y asígnala a un colaborador.' : 'El administrador aún no ha creado tareas para esta obra.'}</p>
          {esAdmin && <Button onClick={abrirNueva}>+ Crear tarea</Button>}
        </div>
      )}

      {!loading && !error && tareas.length > 0 && (
        <div className={styles.board}>
          {COLUMNAS.map((col) => {
            const items = tareas.filter((t) => t.estado === col.estado);
            return (
              <section key={col.estado} className={styles.column}>
                <h4 className={styles.columnTitle}>
                  {col.titulo} <span className={styles.count}>{items.length}</span>
                </h4>
                <div className={styles.columnList}>
                  {items.length === 0 && <p className={styles.columnEmpty}>Nada aquí</p>}
                  {items.map((tarea) => (
                    <TareaCard
                      key={tarea.id}
                      tarea={tarea}
                      puedeEditar={puedeEditar(tarea)}
                      puedeCambiarEstado={puedeCambiarEstado(tarea)}
                      onCambiarEstado={cambiarEstado}
                      onEdit={abrirEditar}
                      onDelete={pedirEliminar}
                      onVerHistorial={setTareaHistorial}
                    />
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      )}

      <TareaModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        obraId={obraId}
        colaboradores={colaboradores}
        tarea={tareaEditando}
        onSaved={handleSaved}
      />

      <TareaHistorialModal
        open={Boolean(tareaHistorial)}
        onClose={() => setTareaHistorial(null)}
        tarea={tareaHistorial}
      />

      <ConfirmDialog
        open={Boolean(tareaAEliminar)}
        onClose={() => setTareaAEliminar(null)}
        onConfirm={confirmarEliminar}
        title="Eliminar tarea"
        message={`¿Eliminar "${tareaAEliminar?.titulo}"? Esta acción no se puede deshacer.`}
        confirmLabel="Eliminar"
        danger
        loading={eliminando}
      />
    </div>
  );
}
