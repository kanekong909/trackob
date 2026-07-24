import { useCallback, useEffect, useState } from 'react';
import { api } from '../../api/client';
import { useToast } from '../../context/ToastContext';
import Button from '../../components/ui/Button';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import styles from './Superadmin.module.css';

function formatFechaHora(iso) {
  return new Date(iso).toLocaleString('es-CO', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export default function AuditoriaTab() {
  const toast = useToast();
  const [eventos, setEventos] = useState([]);
  const [pagina, setPagina] = useState(1);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filtros, setFiltros] = useState({ buscar: '', accion: '', entidad: '', fecha_desde: '', fecha_hasta: '' });
  const [aRevertir, setARevertir] = useState(null);
  const [revirtiendo, setRevirtiendo] = useState(false);

  const cargar = useCallback(() => {
    setLoading(true);
    setError('');
    const params = new URLSearchParams({ page: pagina, limit: 30 });
    Object.entries(filtros).forEach(([k, v]) => { if (v) params.set(k, v); });
    api.get(`/api/admin/auditoria?${params.toString()}`)
      .then((r) => { setEventos(r.eventos); setTotalPaginas(r.paginas); })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [pagina, filtros]);

  useEffect(() => { cargar(); }, [cargar]);

  function updateFiltro(campo) {
    return (e) => { setPagina(1); setFiltros((f) => ({ ...f, [campo]: e.target.value })); };
  }

  async function confirmarRevertir() {
    if (!aRevertir) return;
    setRevirtiendo(true);
    try {
      const r = await api.post(`/api/admin/revertir/${aRevertir.id}`, {});
      toast.success(r.mensaje || 'Acción revertida');
      setARevertir(null);
      cargar();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setRevirtiendo(false);
    }
  }

  return (
    <div>
      <div className={styles.filtrosGrid}>
        <input
          type="text"
          className={styles.buscador}
          placeholder="Buscar usuario, obra, entidad…"
          value={filtros.buscar}
          onChange={updateFiltro('buscar')}
        />
        <select className={styles.select} value={filtros.accion} onChange={updateFiltro('accion')}>
          <option value="">Todas las acciones</option>
          <option value="CREAR">Crear</option>
          <option value="EDITAR">Editar</option>
          <option value="ELIMINAR">Eliminar</option>
          <option value="REVERTIR">Revertir</option>
        </select>
        <select className={styles.select} value={filtros.entidad} onChange={updateFiltro('entidad')}>
          <option value="">Todo</option>
          <option value="gasto">Gasto</option>
          <option value="tarea">Tarea</option>
          <option value="obra">Obra</option>
          <option value="novedad">Novedad</option>
          <option value="progreso">Progreso</option>
          <option value="bitacora">Bitácora</option>
        </select>
        <input type="date" className={styles.select} value={filtros.fecha_desde} onChange={updateFiltro('fecha_desde')} />
        <input type="date" className={styles.select} value={filtros.fecha_hasta} onChange={updateFiltro('fecha_hasta')} />
      </div>

      {loading && <div className={styles.state}>Cargando…</div>}
      {!loading && error && <div className={styles.stateError}>{error}</div>}

      {!loading && !error && (
        <>
          <div className={styles.tabla}>
            <div className={styles.tablaHeadAuditoria}>
              <span>Fecha</span>
              <span>Usuario</span>
              <span>Acción</span>
              <span>Entidad</span>
              <span>Obra</span>
              <span></span>
            </div>
            {eventos.map((e) => (
              <div key={e.id} className={styles.tablaRowAuditoria}>
                <span className={styles.celdaMuted}>{formatFechaHora(e.creado_en)}</span>
                <span>{e.usuario_nombre || 'Sistema'}</span>
                <span><span className={`${styles.accionBadge} ${styles['accion' + e.accion]}`}>{e.accion}</span></span>
                <span className={styles.celdaMuted}>{e.entidad}</span>
                <span className={styles.celdaMuted}>{e.obra_nombre || '—'}</span>
                <span>
                  {(e.accion === 'EDITAR' || e.accion === 'ELIMINAR') && !e.revertido && e.datos_antes && (
                    <button className={styles.revertirBtn} onClick={() => setARevertir(e)}>Revertir</button>
                  )}
                  {e.revertido && <span className={styles.revertidoTag}>revertido</span>}
                </span>
              </div>
            ))}
            {eventos.length === 0 && <p className={styles.vacio}>Sin eventos con estos filtros</p>}
          </div>

          <div className={styles.paginacion}>
            <Button variant="outline" size="sm" disabled={pagina <= 1} onClick={() => setPagina((p) => p - 1)}>← Anterior</Button>
            <span>Página {pagina} de {totalPaginas}</span>
            <Button variant="outline" size="sm" disabled={pagina >= totalPaginas} onClick={() => setPagina((p) => p + 1)}>Siguiente →</Button>
          </div>
        </>
      )}

      <ConfirmDialog
        open={Boolean(aRevertir)}
        onClose={() => setARevertir(null)}
        onConfirm={confirmarRevertir}
        title="Revertir acción"
        message={`¿Revertir esta acción de tipo "${aRevertir?.accion}" sobre ${aRevertir?.entidad}? Esto restaura los valores anteriores.`}
        confirmLabel="Revertir"
        danger
        loading={revirtiendo}
      />
    </div>
  );
}
