import { useEffect, useMemo, useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { formatCurrency, formatDate } from '../../utils/format';
import { downloadBlob } from '../../utils/download';
import Button from '../../components/ui/Button';
import Field from '../../components/ui/Field';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import GastoRow from './GastoRow';
import GastoModal from './GastoModal';
import GastoDetailModal from './GastoDetailModal';
import styles from './Gastos.module.css';

export default function Gastos() {
  const { id: obraId } = useParams();
  const { usuario } = useAuth();
  const toast = useToast();

  const [gastos, setGastos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [miRol, setMiRol] = useState(null);
  const [moneda, setMoneda] = useState('COP');
  const [rolError, setRolError] = useState(false);
  const [suma, setSuma] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [filtros, setFiltros] = useState({ fecha_desde: '', fecha_hasta: '', categoria_id: '' });
  const [busqueda, setBusqueda] = useState('');
  const [seleccion, setSeleccion] = useState(new Set());
  const [modalOpen, setModalOpen] = useState(false);
  const [gastoEditando, setGastoEditando] = useState(null);
  const [gastoDetalle, setGastoDetalle] = useState(null);
  const [gastoAEliminar, setGastoAEliminar] = useState(null);
  const [eliminando, setEliminando] = useState(false);
  const [bulkCategoria, setBulkCategoria] = useState('');
  const [exportando, setExportando] = useState(false);

  // mi_rol depends only on the obra, not on filters - load it once here so
  // it's never stuck as null due to the gastos-loading effect below.
  const cargarMiRol = useCallback(() => {
    setRolError(false);
    api.get(`/api/obras/${obraId}/resumen`)
      .then((r) => { setMiRol(r.mi_rol); setMoneda(r.obra?.moneda || 'COP'); })
      .catch(() => setRolError(true));
  }, [obraId]);

  useEffect(() => { cargarMiRol(); }, [cargarMiRol]);

  const cargarDatos = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({ obra_id: obraId, limit: '100' });
      if (filtros.fecha_desde) params.set('fecha_desde', filtros.fecha_desde);
      if (filtros.fecha_hasta) params.set('fecha_hasta', filtros.fecha_hasta);
      if (filtros.categoria_id) params.set('categoria_id', filtros.categoria_id);

      const [gastosData, catsData] = await Promise.all([
        api.get(`/api/gastos?${params.toString()}`),
        categorias.length ? Promise.resolve(categorias) : api.get(`/api/gastos/categorias?obra_id=${obraId}`)
      ]);

      setGastos(gastosData.gastos);
      setSuma(gastosData.suma);
      if (!categorias.length) setCategorias(catsData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [obraId, filtros]);

  useEffect(() => { cargarDatos(); }, [cargarDatos]);

  const gastosFiltrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    if (!q) return gastos;
    return gastos.filter((g) =>
      g.descripcion?.toLowerCase().includes(q) ||
      g.proveedor?.toLowerCase().includes(q) ||
      g.usuario_nombre?.toLowerCase().includes(q) ||
      g.categorias?.some((c) => c.nombre.toLowerCase().includes(q))
    );
  }, [gastos, busqueda]);

  const grupos = useMemo(() => {
    const map = new Map();
    for (const g of gastosFiltrados) {
      const key = g.fecha?.split('T')[0];
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(g);
    }
    return Array.from(map.entries());
  }, [gastosFiltrados]);

  function toggleSelect(id) {
    setSeleccion((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function limpiarSeleccion() {
    setSeleccion(new Set());
  }

  function puedeEditar(gasto) {
    return miRol === 'admin' || Number(gasto.usuario_id) === Number(usuario?.id);
  }

  function abrirNuevo() {
    setGastoEditando(null);
    setModalOpen(true);
  }

  function abrirEditar(gasto) {
    setGastoDetalle(null);
    setGastoEditando(gasto);
    setModalOpen(true);
  }

  function abrirDetalle(gasto) {
    setGastoDetalle(gasto);
  }

  function handleSaved() {
    toast.success(gastoEditando ? 'Gasto actualizado' : 'Gasto registrado');
    cargarDatos();
  }

  function pedirEliminar(gasto) {
    setGastoDetalle(null);
    setGastoAEliminar(gasto);
  }

  async function confirmarEliminar() {
    if (!gastoAEliminar) return;
    setEliminando(true);
    try {
      await api.del(`/api/gastos/${gastoAEliminar.id}`);
      setGastos((prev) => prev.filter((g) => g.id !== gastoAEliminar.id));
      toast.success('Gasto eliminado');
      setGastoAEliminar(null);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setEliminando(false);
    }
  }

  async function aplicarBulkCategoria() {
    if (!bulkCategoria) return;
    try {
      await api.put('/api/gastos/bulk', {
        ids: Array.from(seleccion),
        campo: 'categoria_id',
        valor: bulkCategoria,
        obra_id: obraId
      });
      toast.success(`${seleccion.size} gasto${seleccion.size > 1 ? 's' : ''} actualizado${seleccion.size > 1 ? 's' : ''}`);
      limpiarSeleccion();
      setBulkCategoria('');
      cargarDatos();
    } catch (err) {
      toast.error(err.message);
    }
  }

  async function exportarCSV() {
    setExportando(true);
    try {
      const params = new URLSearchParams({ obra_id: obraId });
      if (filtros.fecha_desde) params.set('fecha_desde', filtros.fecha_desde);
      if (filtros.fecha_hasta) params.set('fecha_hasta', filtros.fecha_hasta);
      const blob = await api.get(`/api/gastos/exportar?${params.toString()}`);
      downloadBlob(blob, `gastos-obra-${obraId}.csv`);
      toast.success('CSV descargado');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setExportando(false);
    }
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <h1>Gastos</h1>
          <p className={styles.total}>Total del periodo: <strong className={styles.num}>{formatCurrency(suma, moneda)}</strong></p>
        </div>
        <div className={styles.headerActions}>
          <Button variant="outline" onClick={exportarCSV} loading={exportando}>Exportar CSV</Button>
          <Button onClick={abrirNuevo}>+ Nuevo gasto</Button>
        </div>
      </header>

      {rolError && (
        <div className={styles.stateError}>
          No se pudo verificar tu rol en esta obra, por lo que algunos botones de editar/eliminar podrían faltar.
          <button onClick={cargarMiRol} className={styles.retry}>Reintentar</button>
        </div>
      )}

      <div className={styles.search}>
        <Field
          placeholder="Buscar por descripción, proveedor, categoría o quién lo registró…"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
        />
        {busqueda && (
          <button
            type="button"
            className={styles.searchClear}
            onClick={() => setBusqueda('')}
            aria-label="Limpiar búsqueda"
          >
            ✕
          </button>
        )}
      </div>

      <div className={styles.filters}>
        <Field type="date" label="Desde" value={filtros.fecha_desde} onChange={(e) => setFiltros((f) => ({ ...f, fecha_desde: e.target.value }))} />
        <Field type="date" label="Hasta" value={filtros.fecha_hasta} onChange={(e) => setFiltros((f) => ({ ...f, fecha_hasta: e.target.value }))} />
        <Field as="select" label="Categoría" value={filtros.categoria_id} onChange={(e) => setFiltros((f) => ({ ...f, categoria_id: e.target.value }))}>
          <option value="">Todas</option>
          {categorias.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
        </Field>
      </div>

      {(filtros.fecha_desde || filtros.fecha_hasta || filtros.categoria_id) && (
        <button
          type="button"
          className={styles.clearFilters}
          onClick={() => setFiltros({ fecha_desde: '', fecha_hasta: '', categoria_id: '' })}
        >
          Limpiar filtros
        </button>
      )}

      {seleccion.size > 0 && (
        <div className={styles.bulkBar}>
          <span>{seleccion.size} seleccionado{seleccion.size > 1 ? 's' : ''}</span>
          <Field as="select" value={bulkCategoria} onChange={(e) => setBulkCategoria(e.target.value)}>
            <option value="">Cambiar categoría a…</option>
            {categorias.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
          </Field>
          <Button size="sm" variant="secondary" onClick={aplicarBulkCategoria} disabled={!bulkCategoria}>Aplicar</Button>
          <Button size="sm" variant="ghost" onClick={limpiarSeleccion}>Cancelar</Button>
        </div>
      )}

      {loading && <div className={styles.state}>Cargando gastos…</div>}
      {!loading && error && <div className={styles.stateError}>{error}</div>}

      {!loading && !error && gastosFiltrados.length === 0 && (
        <div className={styles.empty}>
          <h3>{busqueda ? 'Sin resultados' : 'Sin gastos registrados'}</h3>
          <p>{busqueda ? 'Prueba con otro término de búsqueda.' : 'Ajusta los filtros o registra el primer gasto de esta obra.'}</p>
          {!busqueda && <Button onClick={abrirNuevo}>+ Registrar gasto</Button>}
        </div>
      )}

      {!loading && !error && grupos.map(([fecha, items]) => (
        <section key={fecha} className={styles.group}>
          <h4 className={styles.groupDate}>{formatDate(fecha, { weekday: 'long' })}</h4>
          <div className={styles.groupList}>
            {items.map((g) => (
              <GastoRow
                key={g.id}
                gasto={g}
                moneda={moneda}
                selected={seleccion.has(g.id)}
                onToggleSelect={toggleSelect}
                onEdit={abrirEditar}
                onDelete={pedirEliminar}
                onOpenDetail={abrirDetalle}
                puedeEditar={puedeEditar(g)}
              />
            ))}
          </div>
        </section>
      ))}

      <GastoModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        obraId={obraId}
        moneda={moneda}
        categorias={categorias}
        gasto={gastoEditando}
        onSaved={handleSaved}
      />

      <GastoDetailModal
        open={Boolean(gastoDetalle)}
        onClose={() => setGastoDetalle(null)}
        gasto={gastoDetalle}
        moneda={moneda}
        puedeEditar={gastoDetalle ? puedeEditar(gastoDetalle) : false}
        onEdit={abrirEditar}
        onDelete={pedirEliminar}
      />

      <ConfirmDialog
        open={Boolean(gastoAEliminar)}
        onClose={() => setGastoAEliminar(null)}
        onConfirm={confirmarEliminar}
        title="Eliminar gasto"
        message={`¿Eliminar "${gastoAEliminar?.descripcion}"? Esta acción no se puede deshacer.`}
        confirmLabel="Eliminar"
        danger
        loading={eliminando}
      />
    </div>
  );
}
