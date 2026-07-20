import { formatCurrency } from '../../utils/format';

function parseJSON(valor) {
  if (!valor) return null;
  if (typeof valor === 'object') return valor;
  try { return JSON.parse(valor); } catch { return null; }
}

const ENTIDAD_LABEL = {
  gasto: 'el gasto',
  tarea: 'la tarea',
  novedad: 'la novedad',
  progreso: 'la foto de avance',
  bitacora: 'la nota de bitácora',
  obra: 'la obra'
};

// Convierte un evento crudo de auditoría en una frase legible en español.
export function describirEvento(evento, moneda = 'COP') {
  const despues = parseJSON(evento.datos_despues) || {};
  const antes = parseJSON(evento.datos_antes) || {};
  const articulo = ENTIDAD_LABEL[evento.entidad] || evento.entidad;

  if (evento.entidad === 'tarea' && evento.accion === 'EDITAR' && despues.estado) {
    const ESTADOS = { pendiente: 'pendiente', en_progreso: 'en progreso', hecho: 'hecho' };
    return `Cambió el estado de una tarea a "${ESTADOS[despues.estado] || despues.estado}"`;
  }
  if (evento.entidad === 'novedad' && evento.accion === 'EDITAR' && despues.estado) {
    return despues.estado === 'resuelta' ? 'Marcó una novedad como resuelta' : 'Reabrió una novedad';
  }
  if (evento.entidad === 'gasto' && despues.monto) {
    const verbo = evento.accion === 'CREAR' ? 'Registró' : 'Editó';
    return `${verbo} ${articulo} "${despues.descripcion || ''}" (${formatCurrency(despues.monto, moneda)})`;
  }
  if (evento.entidad === 'tarea' && evento.accion === 'CREAR') {
    return `Creó la tarea "${despues.titulo || ''}"${despues.asignado_a ? '' : ' (sin asignar)'}`;
  }
  if (evento.entidad === 'bitacora') {
    return `Escribió la nota de bitácora del ${despues.fecha || ''}`;
  }
  if (evento.entidad === 'progreso') {
    return evento.accion === 'CREAR'
      ? `Subió una foto de avance${despues.etapa ? ` (${despues.etapa})` : ''}`
      : `Editó una foto de avance`;
  }

  const VERBOS = { CREAR: 'Creó', EDITAR: 'Editó', ELIMINAR: 'Eliminó' };
  const titulo = despues.titulo || despues.nombre || antes.titulo || antes.nombre;
  return `${VERBOS[evento.accion] || evento.accion} ${articulo}${titulo ? ` "${titulo}"` : ''}`;
}

export function formatFechaHora(iso) {
  return new Date(iso).toLocaleString('es-CO', {
    day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
  });
}

// Genera el PDF en el navegador a partir de los eventos ya cargados
// (los mismos que se ven en la pantalla, con los filtros aplicados) y
// dispara la descarga. No pasa por el backend.
export async function descargarReportePDF({ obraNombre, eventos, moneda }) {
  const { jsPDF } = await import('jspdf');
  const autoTable = (await import('jspdf-autotable')).default;

  const doc = new jsPDF();
  doc.setFontSize(16);
  doc.text('Reporte de actividad', 14, 18);
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(`Obra: ${obraNombre}`, 14, 25);
  doc.text(`Generado: ${new Date().toLocaleString('es-CO')}`, 14, 30);
  doc.text(`Eventos: ${eventos.length}`, 14, 35);

  autoTable(doc, {
    startY: 40,
    head: [['Fecha', 'Colaborador', 'Acción', 'Detalle']],
    body: eventos.map((ev) => [
      formatFechaHora(ev.creado_en),
      ev.usuario_nombre || '—',
      ev.accion,
      describirEvento(ev, moneda)
    ]),
    styles: { fontSize: 8, cellPadding: 3 },
    headStyles: { fillColor: [22, 35, 47] },
    columnStyles: { 0: { cellWidth: 32 }, 1: { cellWidth: 32 }, 2: { cellWidth: 20 } }
  });

  const nombreArchivo = `auditoria-${obraNombre.replace(/\s+/g, '-').toLowerCase()}-${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(nombreArchivo);
}
