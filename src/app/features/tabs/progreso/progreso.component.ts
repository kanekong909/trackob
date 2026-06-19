import { Component, OnInit, Input, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProgresoService, FotoProgreso, NotaBitacora } from '../../../core/services/progreso.service';

const ETAPAS = ['Cimientos', 'Estructura', 'Paredes', 'Techo', 'Acabados', 'Otro'];

@Component({
  selector: 'app-tab-progreso',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './progreso.component.html',
  styleUrl: './progreso.component.scss'
})
export class TabProgresoComponent implements OnInit {
  @Input() obra!: any;

  fotos = signal<FotoProgreso[]>([]);
  bitacora = signal<NotaBitacora[]>([]);
  cargando = signal(true);
  etapaFiltro = signal('');
  etapas = ETAPAS;

  // Carrusel
  carruselAbierto = signal(false);
  carruselIndex = signal(0);
  carruselFotos = signal<FotoProgreso[]>([]);
  fotoActual = signal<FotoProgreso | null>(null);
  touchStartX = 0;

  // Modales
  mostrarSubirFoto = signal(false);
  mostrarEditarFoto = signal(false);
  mostrarConfirmarEliminar = signal(false);
  mostrarNota = signal(false);
  mostrarFabMenu = signal(false);

  // Form subir foto
  fotoFile: File | null = null;
  fotoPreviewUrl = '';
  formFecha = '';
  formEtapa = '';
  subiendo = signal(false);

  // Form editar foto
  editFecha = '';
  editEtapa = '';

  // Form nota
  notaFecha = signal('');
  notaId = signal<number | null>(null);
  notaTexto = '';
  guardandoNota = signal(false);

  constructor(private progresoService: ProgresoService) {}

  ngOnInit() {
    this.formFecha = this.todayISO();
    this.cargar();
  }

  todayISO(): string {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  }

  formatDate(str: string): string {
    if (!str) return '';
    const [y, m, d] = str.substring(0, 10).split('-').map(Number);
    return new Date(y, m-1, d).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  // ── Cloudinary opt ──
  cloudinaryOpt(url: string, tipo: 'thumb' | 'medium' | 'full' = 'thumb'): string {
    if (!url || !url.includes('cloudinary.com')) return url;
    const transforms: Record<string, string> = {
      thumb:  'w_200,h_200,c_fill,f_auto,q_auto:low',
      medium: 'w_800,h_800,c_limit,f_auto,q_auto:good',
      full:   'w_1200,c_limit,f_auto,q_auto:good'
    };
    return url.replace('/upload/', `/upload/${transforms[tipo]}/`);
  }

  // ── Cargar ──
  cargar() {
    this.cargando.set(true);
    Promise.all([
      this.progresoService.getFotos(this.obra.id).toPromise(),
      this.progresoService.getBitacora(this.obra.id).toPromise()
    ]).then(([fotos, bitacora]) => {
      this.fotos.set(fotos || []);
      this.bitacora.set(bitacora || []);
      this.cargando.set(false);
    }).catch(() => this.cargando.set(false));
  }

  // ── Fechas del timeline ──
  getFechas(): string[] {
    const fotos = this.getFotosFiltradas();
    const notas = this.bitacora();
    const set = new Set([
      ...fotos.map(f => f.fecha?.substring(0, 10)),
      ...notas.map(b => b.fecha?.substring(0, 10))
    ]);
    return [...set].filter(Boolean).sort((a, b) => b.localeCompare(a));
  }

  getFotosFiltradas(): FotoProgreso[] {
    const etapa = this.etapaFiltro();
    return etapa ? this.fotos().filter(f => f.etapa === etapa) : this.fotos();
  }

  getFotosDia(fecha: string): FotoProgreso[] {
    return this.getFotosFiltradas().filter(f => f.fecha?.substring(0, 10) === fecha);
  }

  getNotaDia(fecha: string): NotaBitacora | undefined {
    return this.bitacora().find(b => b.fecha?.substring(0, 10) === fecha);
  }

  filtrarEtapa(etapa: string) {
    this.etapaFiltro.set(etapa);
  }

  // ── Subir foto ──
  abrirSubirFoto() {
    this.fotoFile = null;
    this.fotoPreviewUrl = '';
    this.formFecha = this.todayISO();
    this.formEtapa = '';
    this.mostrarFabMenu.set(false);
    this.mostrarSubirFoto.set(true);
  }

  onFotoSeleccionada(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    this.fotoFile = file;
    const reader = new FileReader();
    reader.onload = (e) => this.fotoPreviewUrl = e.target?.result as string;
    reader.readAsDataURL(file);
  }

  subirFoto() {
    if (!this.fotoFile) return;
    this.subiendo.set(true);
    const fd = new FormData();
    fd.append('foto', this.fotoFile);
    fd.append('obra_id', String(this.obra.id));
    fd.append('fecha', this.formFecha || this.todayISO());
    fd.append('etapa', this.formEtapa);
    this.progresoService.subirFoto(fd).subscribe({
      next: () => {
        this.subiendo.set(false);
        this.mostrarSubirFoto.set(false);
        this.cargar();
      },
      error: () => this.subiendo.set(false)
    });
  }

  // ── Carrusel ──
  abrirCarrusel(fotoId: number) {
    const fotos = this.getFotosFiltradas();
    const idx = fotos.findIndex(f => f.id === fotoId);
    this.carruselFotos.set(fotos);
    this.carruselIndex.set(idx >= 0 ? idx : 0);
    this.fotoActual.set(fotos[idx >= 0 ? idx : 0]);
    this.carruselAbierto.set(true);
    this.precargarAdyacentes(idx);
  }

  cerrarCarrusel() {
    this.carruselAbierto.set(false);
  }

  navegar(dir: number) {
    const nuevo = this.carruselIndex() + dir;
    const fotos = this.carruselFotos();
    if (nuevo >= 0 && nuevo < fotos.length) {
      this.carruselIndex.set(nuevo);
      this.fotoActual.set(fotos[nuevo]);
      this.precargarAdyacentes(nuevo);
    }
  }

  irA(i: number) {
    const fotos = this.carruselFotos();
    this.carruselIndex.set(i);
    this.fotoActual.set(fotos[i]);
  }

  precargarAdyacentes(idx: number) {
    const fotos = this.carruselFotos();
    [idx - 1, idx + 1].forEach(i => {
      if (i >= 0 && i < fotos.length) {
        const img = new Image();
        img.src = this.cloudinaryOpt(fotos[i].foto_url, 'medium');
      }
    });
  }

  onTouchStart(e: TouchEvent) {
    this.touchStartX = e.touches[0].clientX;
  }

  onTouchEnd(e: TouchEvent) {
    const diff = this.touchStartX - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) this.navegar(diff > 0 ? 1 : -1);
  }

  // ── Editar foto ──
  abrirEditarFoto() {
    const f = this.fotoActual();
    if (!f) return;
    this.editFecha = f.fecha?.substring(0, 10) || '';
    this.editEtapa = f.etapa || '';
    this.mostrarEditarFoto.set(true);
  }

  guardarEdicionFoto() {
    const f = this.fotoActual();
    if (!f) return;
    this.progresoService.editarFoto(f.id, { fecha: this.editFecha, etapa: this.editEtapa }).subscribe({
      next: () => {
        this.mostrarEditarFoto.set(false);
        this.cargar();
      }
    });
  }

  // ── Eliminar foto ──
  pedirEliminarFoto() {
    this.mostrarConfirmarEliminar.set(true);
  }

  confirmarEliminarFoto() {
    const f = this.fotoActual();
    if (!f) return;
    this.progresoService.eliminarFoto(f.id).subscribe({
      next: () => {
        this.mostrarConfirmarEliminar.set(false);
        this.cerrarCarrusel();
        this.cargar();
      }
    });
  }

  // ── Nota ──
  abrirNota(fecha: string, nota?: NotaBitacora) {
    this.notaFecha.set(fecha);
    this.notaId.set(nota?.id || null);
    this.notaTexto = nota?.nota || '';
    this.mostrarFabMenu.set(false);
    this.mostrarNota.set(true);
  }

  abrirNotaHoy() {
    this.abrirNota(this.todayISO());
  }

  guardarNota() {
    if (!this.notaTexto.trim()) return;
    this.guardandoNota.set(true);
    this.progresoService.guardarNota({
      obra_id: this.obra.id,
      fecha: this.notaFecha(),
      nota: this.notaTexto.trim()
    }).subscribe({
      next: () => {
        this.guardandoNota.set(false);
        this.mostrarNota.set(false);
        this.cargar();
      },
      error: () => this.guardandoNota.set(false)
    });
  }

  eliminarNota(id: number) {
    if (!confirm('¿Eliminar esta nota?')) return;
    this.progresoService.eliminarNota(id).subscribe({
      next: () => this.cargar()
    });
  }

  abrirEnNuevaTab(url: string) {
    window.open(url);
  }
}
