import { useEffect, useState } from 'react';
import Modal from '../../components/ui/Modal';
import Button from '../../components/ui/Button';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import { api } from '../../api/client';
import { useToast } from '../../context/ToastContext';
import CategoriaRow from './CategoriaRow';
import styles from './CategoriasModal.module.css';

export default function CategoriasModal({ open, onClose, obraId, onChanged }) {
  const toast = useToast();
  const [categorias, setCategorias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [categoriaAEliminar, setCategoriaAEliminar] = useState(null);
  const [eliminando, setEliminando] = useState(false);

  const [nueva, setNueva] = useState({ nombre: '', color: '#6366f1', tipo: 'egreso' });
  const [creando, setCreando] = useState(false);

  const cargar = () => {
    setLoading(true);
    setError('');
    return api.get(`/api/gastos/categorias?obra_id=${obraId}`)
      .then(setCategorias)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (open) cargar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  async function handleSave(id, datos) {
    try {
      await api.put(`/api/gastos/categorias/${id}`, datos);
      setCategorias((prev) => prev.map((c) => (c.id === id ? { ...c, ...datos } : c)));
      toast.success('Categoría actualizada');
      onChanged();
    } catch (err) {
      toast.error(err.message);
    }
  }

  function pedirEliminar(categoria) {
    setCategoriaAEliminar(categoria);
  }

  async function confirmarEliminar() {
    if (!categoriaAEliminar) return;
    setEliminando(true);
    try {
      await api.del(`/api/gastos/categorias/${categoriaAEliminar.id}`);
      setCategorias((prev) => prev.filter((c) => c.id !== categoriaAEliminar.id));
      toast.success('Categoría eliminada');
      setCategoriaAEliminar(null);
      onChanged();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setEliminando(false);
    }
  }

  async function handleCrear(e) {
    e.preventDefault();
    if (!nueva.nombre.trim()) return;
    setCreando(true);
    try {
      const creada = await api.post('/api/gastos/categorias', { ...nueva, obra_id: obraId });
      setCategorias((prev) => [...prev, creada]);
      setNueva({ nombre: '', color: '#6366f1', tipo: 'egreso' });
      toast.success('Categoría creada');
      onChanged();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setCreando(false);
    }
  }

  return (
    <>
      <Modal open={open} onClose={onClose} title="Categorías">
        <p className={styles.hint}>
          Las categorías <strong>Global</strong> están disponibles en todas las obras — puedes cambiarles nombre y color,
          pero no se pueden eliminar. Las que crees aquí son propias de esta obra.
        </p>

        {loading && <div className={styles.state}>Cargando…</div>}
        {!loading && error && <div className={styles.stateError}>{error}</div>}

        {!loading && !error && (
          <div className={styles.list}>
            {categorias.map((c) => (
              <CategoriaRow key={c.id} categoria={c} onSave={handleSave} onDelete={pedirEliminar} />
            ))}
          </div>
        )}

        <form className={styles.nuevaForm} onSubmit={handleCrear}>
          <input
            type="color"
            className={styles.colorInput}
            value={nueva.color}
            onChange={(e) => setNueva((n) => ({ ...n, color: e.target.value }))}
          />
          <input
            type="text"
            className={styles.nombreInput}
            placeholder="Nueva categoría…"
            value={nueva.nombre}
            onChange={(e) => setNueva((n) => ({ ...n, nombre: e.target.value }))}
          />
          <select
            className={styles.tipoSelect}
            value={nueva.tipo}
            onChange={(e) => setNueva((n) => ({ ...n, tipo: e.target.value }))}
          >
            <option value="egreso">Gasto</option>
            <option value="ingreso">Ingreso</option>
          </select>
          <Button type="submit" loading={creando} disabled={!nueva.nombre.trim()}>+ Agregar</Button>
        </form>
      </Modal>

      <ConfirmDialog
        open={Boolean(categoriaAEliminar)}
        onClose={() => setCategoriaAEliminar(null)}
        onConfirm={confirmarEliminar}
        title="Eliminar categoría"
        message={`¿Eliminar "${categoriaAEliminar?.nombre}"? Los gastos que la tenían asignada la perderán.`}
        confirmLabel="Eliminar"
        danger
        loading={eliminando}
      />
    </>
  );
}
