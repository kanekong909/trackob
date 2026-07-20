import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../../api/client';
import { useToast } from '../../context/ToastContext';
import { useMiRolObra } from '../../hooks/useMiRolObra';
import Button from '../../components/ui/Button';
import Field from '../../components/ui/Field';
import { describirEvento, formatFechaHora, descargarReportePDF } from './auditoriaHelpers';
import styles from './Auditoria.module.css';

const ACCIONES = [
  { value: '', label: 'Todas las acciones' },
  { value: 'CREAR', label: 'Creaciones' },
  { value: 'EDITAR', label: 'Ediciones' },
  { value: 'ELIMINAR', label: 'Eliminaciones' }
];

const ENTIDADES = [
  { value: '', label: 'Todo' },
  { value: 'gasto', label: 'Gastos' },
  { value: 'tarea', label: 'Tareas' },
  { value: 'novedad', label: 'Novedades' },
  { value: 'progreso', label: 'Avance' },
  { value: 'bitacora', label: 'Bitácora' },
  { value: 'obra', label: 'Obra' }
];

export default function Auditoria() {
  const { id: obraId } = useParams();
  const toast = useToast();
  const { miRol, esAdmin, loading: cargandoRol } = useMiRolObra(obraId);

  const [obra, setObra] = useState(null);
  const [colaboradores, setColaboradores] = useState([]);
  const [eventos, setEventos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [generandoPDF, setGenerandoPDF] = useState(false);

  const [filtros, setFiltros] = useState({ usuario_id: '', accion: '', entidad: '', fecha_desde: '', fecha_hasta: '' });

  useEffect(() => {
    if (!esAdmin) return;
    api.get(`/api/obras/${obraId}/resumen`)
      .then((r) => { setObra(r.obra); setColaboradores(r.colaboradores || []); })
      .catch(() => {});
  }, [obraId, esAdmin]);

  const cargar = useCallback(() => {
    if (!esAdmin) return;
    setLoading(true);
    setError('');
    const params = new URLSearchParams();
    Object.entries(filtros).forEach(([k, v]) => { if (v) params.set(k, v); });
    api.get(`/api/obras/${obraId}/auditoria?${params.toString()}`)
      .then(setEventos)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [obraId, filtros, esAdmin]);

  useEffect(() => { cargar(); }, [cargar]);

  function updateFiltro(campo) {
    return (e) => setFiltros((f) => ({ ...f, [campo]: e.target.value }));
  }

  async function handleDescargarPDF() {
    if (!eventos.length) {
      toast.error('No hay eventos para incluir en el PDF con estos filtros');
      return;
    }
    setGenerandoPDF(true);
    try {
      await descargarReportePDF({
        obraNombre: obra?.nombre || 'Obra',
        eventos,
        moneda: obra?.moneda || 'COP'
      });
      toast.success('PDF descargado');
    } catch (err) {
      toast.error('No se pudo generar el PDF');
    } finally {
      setGenerandoPDF(false);
    }
  }

  if (cargandoRol) return <div className={styles.state}>Verificando acceso…</div>;

  if (!esAdmin) {
    return (
      <div className={styles.page}>
        <div className={styles.sinAcceso}>
          <h3>Solo el administrador puede ver esto</h3>
          <p>El registro de actividad de los colaboradores es visible únicamente para el admin de la obra.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <h1>Actividad</h1>
          <p className={styles.subtitle}>Registro de lo que hace cada colaborador en esta obra</p>
        </div>
        <Button onClick={handleDescargarPDF} loading={generandoPDF} disabled={loading || eventos.length === 0}>
          ⬇ Descargar PDF
        </Button>
      </header>

      <div className={styles.filters}>
        <Field as="select" value={filtros.usuario_id} onChange={updateFiltro('usuario_id')}>
          <option value="">Todos los colaboradores</option>
          {colaboradores.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
        </Field>
        <Field as="select" value={filtros.accion} onChange={updateFiltro('accion')}>
          {ACCIONES.map((a) => <option key={a.value} value={a.value}>{a.label}</option>)}
        </Field>
        <Field as="select" value={filtros.entidad} onChange={updateFiltro('entidad')}>
          {ENTIDADES.map((e) => <option key={e.value} value={e.value}>{e.label}</option>)}
        </Field>
        <Field type="date" value={filtros.fecha_desde} onChange={updateFiltro('fecha_desde')} />
        <Field type="date" value={filtros.fecha_hasta} onChange={updateFiltro('fecha_hasta')} />
      </div>

      {loading && <div className={styles.state}>Cargando actividad…</div>}
      {!loading && error && (
        <div className={styles.stateError}>
          {error}
          <button onClick={cargar} className={styles.retry}>Reintentar</button>
        </div>
      )}

      {!loading && !error && eventos.length === 0 && (
        <div className={styles.empty}>
          <h3>Sin actividad registrada</h3>
          <p>Con estos filtros no aparece ningún evento todavía.</p>
        </div>
      )}

      {!loading && !error && eventos.length > 0 && (
        <div className={styles.tablePreview}>
          <p className={styles.previewNote}>
            Vista previa — {eventos.length} evento{eventos.length !== 1 ? 's' : ''}. El PDF incluye exactamente lo que ves aquí.
          </p>
          <div className={styles.table}>
            <div className={styles.tableHead}>
              <span>Fecha</span>
              <span>Colaborador</span>
              <span>Detalle</span>
            </div>
            {eventos.map((ev) => (
              <div key={ev.id} className={styles.tableRow}>
                <span className={styles.tableFecha}>{formatFechaHora(ev.creado_en)}</span>
                <span className={styles.tableUsuario}>{ev.usuario_nombre || '—'}</span>
                <span className={styles.tableDetalle}>
                  <span className={`${styles.accionBadge} ${styles['accion' + ev.accion]}`}>{ev.accion}</span>
                  {describirEvento(ev, obra?.moneda || 'COP')}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
