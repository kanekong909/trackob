import { Component, OnInit, Input, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { GastoService, Gasto, Categoria } from '../../../core/services/gasto.service';
import { MoneyPipe } from '../../../shared/pipes/money.pipe';
import { ApiService } from '../../../core/services/api.service';

@Component({
  selector: 'app-tab-gastos',
  standalone: true,
  imports: [CommonModule, FormsModule, MoneyPipe],
  templateUrl: './gastos.component.html',
  styleUrl: './gastos.component.scss'
})
export class TabGastosComponent implements OnInit {
  @Input() obra!: any;

  // Estado
  gastos = signal<Gasto[]>([]);
  categorias = signal<Categoria[]>([]);
  cargando = signal(true);
  paginaActual = signal(1);
  totalPaginas = signal(1);
  sumaVisible = signal(0);
  sumaIngresos = signal(0);
  catFiltro = signal('');
  busqFiltro = signal('');
  fechaDesde = signal('');
  fechaHasta = signal('');

  // Selección múltiple
  modoSeleccion = signal(false);
  gastosSeleccionados = signal<Set<number | string>>(new Set());

  // Modales
  mostrarFormGasto = signal(false);
  mostrarDetalleGasto = signal(false);
  mostrarConfirmarEliminar = signal(false);
  mostrarEdicionMasiva = signal(false);
  mostrarSuma = signal(false);

  // Gasto activo
  gastoEditando = signal<Gasto | null>(null);
  gastoDetalle = signal<Gasto | null>(null);
  guardando = signal(false);

  // Categorías seleccionadas en form
  catsSeleccionadas = signal<number[]>([]);

  // Form gasto
  formDesc = '';
  formMonto = '';
  formMontoDisplay = '';
  formFecha = '';
  formProveedor = '';
  formNotas = '';
  formCantidad = '';
  formUnidad = '';
  formVunitario = '';
  formVunitarioDisplay = '';
  fotoFile: File | null = null;
  fotoPreviewUrl = '';
  fotoExistenteUrl = '';
  borrarFoto = false;

  // Edición masiva
  bulkCampo = '';
  bulkValor = '';

  // Conteos por categoría
  conteosCat = signal<Record<string | number, number>>({});

  gastosFiltrados = computed(() => {
    const busq = this.busqFiltro().toLowerCase();
    if (!busq) return this.gastos();
    return this.gastos().filter(g =>
      g.descripcion.toLowerCase().includes(busq) ||
      (g.proveedor || '').toLowerCase().includes(busq)
    );
  });

  constructor(
    private gastoService: GastoService,
    private api: ApiService
  ) {}

  ngOnInit() {
    this.formFecha = this.todayISO();
    this.cargarCategorias();
    this.cargarGastos();
  }

  todayISO() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  }

  formatMoney(n: number) {
    return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n || 0);
  }

  formatDate(str: string) {
    if (!str) return '';
    const [y,m,d] = str.substring(0,10).split('-').map(Number);
    return new Date(y, m-1, d).toLocaleDateString('es-CO', { day:'2-digit', month:'short', year:'numeric' });
  }

  // ── Cargar datos ──
  cargarCategorias() {
    this.gastoService.getCategorias(this.obra.id).subscribe({
      next: (cats) => {
        this.categorias.set(cats);
        this.cargarConteosCategorias(); // ← aquí
      }
    });
  }

  cargarGastos() {
    this.cargando.set(true);
    this.gastoService.getGastos(this.obra.id, this.paginaActual(), 50, {
      desde: this.fechaDesde(),
      hasta: this.fechaHasta(),
      categoria_id: this.catFiltro()
    }).subscribe({
      next: (data) => {
        this.gastos.set(data.gastos);
        this.totalPaginas.set(data.paginas);
        this.sumaVisible.set(data.suma);
        this.sumaIngresos.set(data.suma_ingresos || 0);
        this.cargando.set(false);
      },
      error: () => this.cargando.set(false)
    });
  }

  actualizarConteos(gastos: Gasto[]) {
    const conteos: Record<string|number, number> = { total: gastos.length };
    gastos.forEach(g => {
      g.categorias?.forEach(c => {
        conteos[c.id] = (conteos[c.id] || 0) + 1;
      });
    });
    this.conteosCat.set(conteos);
  }

  cargarConteosCategorias() {
    this.gastoService.getGastos(this.obra.id, 1, 500).subscribe({
      next: (data) => {
        const conteos: Record<string | number, number> = {};
        let total = 0;
        data.gastos.forEach(g => {
          const esIngreso = g.categorias?.some(c => c.tipo === 'ingreso');
          if (!esIngreso) total++;
          g.categorias?.forEach(c => {
            conteos[c.id] = (conteos[c.id] || 0) + 1;
          });
        });
        conteos['total'] = total;
        this.conteosCat.set(conteos);

        // Ordenar categorías por conteo descendente
        const catsOrdenadas = [...this.categorias()].sort((a, b) => {
          return (conteos[b.id] || 0) - (conteos[a.id] || 0);
        });
        this.categorias.set(catsOrdenadas);
      }
    });
  }

  // ── Filtros ──
  filtrarCategoria(catId: string) {
    this.catFiltro.set(catId);
    this.paginaActual.set(1);
    this.cargarGastos();
  }

  cambiarPagina(dir: number) {
    this.paginaActual.set(Math.max(1, Math.min(this.totalPaginas(), this.paginaActual() + dir)));
    this.cargarGastos();
  }

  limpiarFecha(cual: 'desde' | 'hasta') {
    if (cual === 'desde') this.fechaDesde.set('');
    else this.fechaHasta.set('');
    this.cargarGastos();
  }

  // ── Abrir gasto ──
  abrirNuevoGasto() {
    this.gastoEditando.set(null);
    this.formDesc = '';
    this.formMonto = '';
    this.formMontoDisplay = '';
    this.formFecha = this.todayISO();
    this.formProveedor = '';
    this.formNotas = '';
    this.formCantidad = '';
    this.formUnidad = '';
    this.formVunitario = '';
    this.formVunitarioDisplay = '';
    this.fotoFile = null;
    this.fotoPreviewUrl = '';
    this.fotoExistenteUrl = '';
    this.borrarFoto = false;
    this.catsSeleccionadas.set([]);
    this.mostrarFormGasto.set(true);
  }

  abrirEditarGasto(g: Gasto) {
    this.gastoEditando.set(g);
    this.formDesc = g.descripcion;
    this.formMonto = String(g.monto);
    this.formMontoDisplay = Math.round(g.monto).toLocaleString('es-CO').replace(/,/g,'.');
    this.formFecha = g.fecha?.substring(0,10) || this.todayISO();
    this.formProveedor = g.proveedor || '';
    this.formNotas = g.notas || '';
    this.formCantidad = g.cantidad ? String(g.cantidad) : '';
    this.formUnidad = g.unidad || '';
    this.formVunitario = g.valor_unitario ? String(Math.round(g.valor_unitario)) : '';
    this.formVunitarioDisplay = g.valor_unitario ? Math.round(g.valor_unitario).toLocaleString('es-CO').replace(/,/g,'.') : '';
    this.fotoFile = null;
    this.fotoExistenteUrl = g.foto_url || '';
    this.fotoPreviewUrl = g.foto_url || '';
    this.borrarFoto = false;
    this.catsSeleccionadas.set(g.categorias?.map(c => c.id) || []);
    this.mostrarDetalleGasto.set(false);
    setTimeout(() => this.mostrarFormGasto.set(true), 200);
  }

  verGasto(g: Gasto) {
    this.gastoDetalle.set(g);
    this.mostrarDetalleGasto.set(true);
  }

  // ── Guardar gasto ──
  guardarGasto() {
    if (!this.formDesc.trim() || !this.formMonto) return;
    this.guardando.set(true);

    const fd = new FormData();
    fd.append('descripcion', this.formDesc.trim());
    fd.append('monto', this.formMonto);
    fd.append('fecha', this.formFecha);
    fd.append('obra_id', String(this.obra.id));
    fd.append('categorias', JSON.stringify(this.catsSeleccionadas()));
    fd.append('proveedor', this.formProveedor.trim());
    fd.append('notas', this.formNotas.trim());
    fd.append('cantidad', this.formCantidad);
    fd.append('unidad', this.formUnidad.trim());
    fd.append('valor_unitario', this.formVunitario);
    if (this.fotoFile) fd.append('foto', this.fotoFile);
    else if (this.borrarFoto) fd.append('borrar_foto', '1');

    const req = this.gastoEditando()
      ? this.gastoService.editarGasto(this.gastoEditando()!.id as number, fd)
      : this.gastoService.crearGasto(fd);

    req.subscribe({
      next: () => {
        this.guardando.set(false);
        this.mostrarFormGasto.set(false);
        this.cargarGastos();
      },
      error: () => this.guardando.set(false)
    });
  }

  // ── Eliminar ──
  pedirEliminar() {
    this.mostrarDetalleGasto.set(false);
    setTimeout(() => this.mostrarConfirmarEliminar.set(true), 200);
  }

  confirmarEliminar() {
    const g = this.gastoDetalle();
    if (!g) return;
    this.api.delete(`/api/gastos/${g.id}`).subscribe({
      next: () => {
        this.mostrarConfirmarEliminar.set(false);
        this.cargarGastos();
      }
    });
  }

  // ── Foto ──
  onFotoSeleccionada(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    this.fotoFile = file;
    this.borrarFoto = false;
    const reader = new FileReader();
    reader.onload = (e) => this.fotoPreviewUrl = e.target?.result as string;
    reader.readAsDataURL(file);
  }

  quitarFoto() {
    this.fotoFile = null;
    this.fotoPreviewUrl = '';
    this.fotoExistenteUrl = '';
    this.borrarFoto = true;
  }

  // ── Formato números ──
  onMontoInput(e: Event) {
    const raw = (e.target as HTMLInputElement).value.replace(/\D/g,'');
    this.formMonto = raw;
    this.formMontoDisplay = raw ? parseInt(raw).toLocaleString('es-CO').replace(/,/g,'.') : '';
    this.calcularMonto();
  }

  onVunitarioInput(e: Event) {
    const raw = (e.target as HTMLInputElement).value.replace(/\D/g,'');
    this.formVunitario = raw;
    this.formVunitarioDisplay = raw ? parseInt(raw).toLocaleString('es-CO').replace(/,/g,'.') : '';
    this.calcularMonto();
  }

  calcularMonto() {
    const cant = parseFloat(this.formCantidad) || 0;
    const vu = parseFloat(this.formVunitario) || 0;
    if (cant > 0 && vu > 0) {
      const total = Math.round(cant * vu);
      this.formMonto = String(total);
      this.formMontoDisplay = total.toLocaleString('es-CO').replace(/,/g,'.');
    }
  }

  // ── Categorías ──
  toggleCategoria(id: number) {
    const actual = [...this.catsSeleccionadas()];
    const idx = actual.indexOf(id);
    if (idx === -1) actual.push(id);
    else actual.splice(idx, 1);
    this.catsSeleccionadas.set(actual);
  }

  esCatSeleccionada(id: number) {
    return this.catsSeleccionadas().includes(id);
  }

  getCatColor(id: number) {
    return this.categorias().find(c => c.id === id)?.color || '#aeaeb2';
  }

  // ── Selección múltiple ──
  activarSeleccion(g: Gasto) {
    this.modoSeleccion.set(true);
    this.toggleSeleccion(g);
  }

  toggleSeleccion(g: Gasto) {
    const set = new Set(this.gastosSeleccionados());
    if (set.has(g.id)) set.delete(g.id);
    else set.add(g.id);
    this.gastosSeleccionados.set(set);
  }

  cancelarSeleccion() {
    this.modoSeleccion.set(false);
    this.gastosSeleccionados.set(new Set());
  }

  seleccionarTodos() {
    const todos = new Set(this.gastosFiltrados().map(g => g.id));
    this.gastosSeleccionados.set(todos);
  }

  get sumaSeleccionados() {
    return this.gastosFiltrados()
      .filter(g => this.gastosSeleccionados().has(g.id))
      .reduce((s, g) => s + parseFloat(String(g.monto)), 0);
  }

  get nSeleccionados() { return this.gastosSeleccionados().size; }

  abrirEdicionMasiva() {
    if (!this.nSeleccionados) return;
    this.bulkCampo = '';
    this.bulkValor = '';
    this.mostrarEdicionMasiva.set(true);
  }

  guardarEdicionMasiva() {
    if (!this.bulkCampo) return;
    const ids = [...this.gastosSeleccionados()];
    this.api.put('/api/gastos/bulk', {
      ids, campo: this.bulkCampo,
      valor: this.bulkValor || null,
      obra_id: this.obra.id
    }).subscribe({
      next: () => {
        this.mostrarEdicionMasiva.set(false);
        this.cancelarSeleccion();
        this.cargarGastos();
      }
    });
  }

  // ── Exportar ──
  exportarCSV() {
    const token = localStorage.getItem('og_token');
    const base = (window as any).__env?.apiUrl || '';
    let url = `${base}/api/gastos/exportar?obra_id=${this.obra.id}`;
    if (this.fechaDesde()) url += `&fecha_desde=${this.fechaDesde()}`;
    if (this.fechaHasta()) url += `&fecha_hasta=${this.fechaHasta()}`;
    fetch(url, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.blob())
      .then(blob => {
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `gastos-${this.obra.nombre}.csv`;
        a.click();
      });
  }

  isSeleccionado(g: Gasto) {
    return this.gastosSeleccionados().has(g.id);
  }

  private longPressTimer: any;

  activarSeleccionTimer(g: Gasto) {
    this.longPressTimer = setTimeout(() => {
      this.activarSeleccion(g);
    }, 500);
  }

  cancelarTimer() {
    clearTimeout(this.longPressTimer);
  }

  onBusqInput(e: Event) {
    this.busqFiltro.set((e.target as HTMLInputElement).value);
  }

  onFechaDesdeChange(e: Event) {
    this.fechaDesde.set((e.target as HTMLInputElement).value);
    this.cargarGastos();
  }

  onFechaHastaChange(e: Event) {
    this.fechaHasta.set((e.target as HTMLInputElement).value);
    this.cargarGastos();
  }

  abrirFotoEnNuevaTab(url: string) {
    window.open(url);
  }

}
