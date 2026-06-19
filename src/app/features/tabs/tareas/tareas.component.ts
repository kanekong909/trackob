import { Component, OnInit, Input, Output, EventEmitter, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TareaService, Tarea, HistorialTarea } from '../../../core/services/tarea.service';

const ESTADO_CONFIG: Record<string, { label: string; color: string; emoji: string; next: string }> = {
  pendiente:   { label: 'Pendiente',   color: '#ff3b30', emoji: '🔴', next: 'en_progreso' },
  en_progreso: { label: 'En progreso', color: '#f5a623', emoji: '🟡', next: 'hecho' },
  hecho:       { label: 'Hecho',       color: '#34c759', emoji: '🟢', next: 'pendiente' }
};

@Component({
  selector: 'app-tab-tareas',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './tareas.component.html',
  styleUrl: './tareas.component.scss'
})
export class TabTareasComponent implements OnInit {
  @Input() obra!: any;
  @Output() badgeChange = new EventEmitter<number>();

  tareas = signal<Tarea[]>([]);
  cargando = signal(true);
  estadoFiltro = signal('');
  mostrarHistorial = signal(false);

  // Modales
  mostrarForm = signal(false);
  mostrarConfirmarEliminar = signal(false);
  mostrarHistorialTarea = signal(false);

  // Tarea activa
  tareaEditando = signal<Tarea | null>(null);
  tareaAEliminar = signal<Tarea | null>(null);
  historialActual = signal<HistorialTarea[]>([]);
  tituloHistorial = signal('');
  cargandoHistorial = signal(false);

  // Form
  formTitulo = '';
  formDesc = '';
  formFecha = '';
  guardando = signal(false);

  readonly ESTADO_CONFIG = ESTADO_CONFIG;
  readonly ESTADO_LABELS: Record<string, { emoji: string; label: string }> = {
    pendiente:   { emoji: '🔴', label: 'Pendiente' },
    en_progreso: { emoji: '🟡', label: 'En progreso' },
    hecho:       { emoji: '🟢', label: 'Hecho' }
  };

  activas = computed(() => {
    const filtro = this.estadoFiltro();
    return filtro
      ? this.tareas().filter(t => t.estado === filtro && t.estado !== 'hecho')
      : this.tareas().filter(t => t.estado !== 'hecho');
  });

  hechas = computed(() => this.tareas().filter(t => t.estado === 'hecho'));
  pendientes = computed(() => this.tareas().filter(t => t.estado === 'pendiente').length);
  enProgreso = computed(() => this.tareas().filter(t => t.estado === 'en_progreso').length);

  constructor(private tareaService: TareaService) {}

  ngOnInit() {
    this.cargarTareas();
  }

  formatDate(str: string): string {
    if (!str) return '';
    const [y, m, d] = str.substring(0, 10).split('-').map(Number);
    return new Date(y, m-1, d).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  estaVencida(t: Tarea): boolean {
    return !!t.fecha_limite && t.estado !== 'hecho' && new Date(t.fecha_limite) < new Date();
  }

  getCfg(estado: string) {
    return ESTADO_CONFIG[estado] || ESTADO_CONFIG['pendiente'];
  }

  // ── Cargar ──
  cargarTareas() {
    this.cargando.set(true);
    this.tareaService.getTareas(this.obra.id).subscribe({
      next: (tareas) => {
        this.tareas.set(tareas);
        this.cargando.set(false);
        const nActivas = tareas.filter(t => t.estado !== 'hecho').length;
        this.badgeChange.emit(nActivas);
      },
      error: () => this.cargando.set(false)
    });
  }

  // ── Form ──
  abrirNuevaTarea() {
    this.tareaEditando.set(null);
    this.formTitulo = '';
    this.formDesc = '';
    this.formFecha = '';
    this.mostrarForm.set(true);
  }

  abrirEditarTarea(t: Tarea) {
    this.tareaEditando.set(t);
    this.formTitulo = t.titulo;
    this.formDesc = t.descripcion || '';
    this.formFecha = t.fecha_limite?.substring(0, 10) || '';
    this.mostrarForm.set(true);
  }

  guardarTarea() {
    if (!this.formTitulo.trim()) return;
    this.guardando.set(true);
    const data = {
      titulo: this.formTitulo.trim(),
      descripcion: this.formDesc.trim(),
      fecha_limite: this.formFecha || null,
      obra_id: this.obra.id
    };
    const req = this.tareaEditando()
      ? this.tareaService.editarTarea(this.tareaEditando()!.id, data)
      : this.tareaService.crearTarea(data);

    req.subscribe({
      next: () => {
        this.guardando.set(false);
        this.mostrarForm.set(false);
        this.cargarTareas();
      },
      error: () => this.guardando.set(false)
    });
  }

  // ── Estado ──
  cambiarEstado(id: number, estado: string) {
    this.tareaService.cambiarEstado(id, estado).subscribe({
      next: () => this.cargarTareas()
    });
  }

  // ── Eliminar ──
  pedirEliminar(t: Tarea) {
    this.tareaAEliminar.set(t);
    this.mostrarConfirmarEliminar.set(true);
  }

  confirmarEliminar() {
    if (!this.tareaAEliminar()) return;
    this.tareaService.eliminarTarea(this.tareaAEliminar()!.id).subscribe({
      next: () => {
        this.mostrarConfirmarEliminar.set(false);
        this.cargarTareas();
      }
    });
  }

  // ── Historial ──
  verHistorial(t: Tarea) {
    this.tituloHistorial.set(t.titulo);
    this.historialActual.set([]);
    this.cargandoHistorial.set(true);
    this.mostrarHistorialTarea.set(true);
    this.tareaService.getHistorial(t.id).subscribe({
      next: (h) => { this.historialActual.set(h); this.cargandoHistorial.set(false); },
      error: () => this.cargandoHistorial.set(false)
    });
  }

  toggleHistorial() {
    this.mostrarHistorial.update(v => !v);
  }
}
