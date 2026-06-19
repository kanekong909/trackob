import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ObraService, Obra } from '../../core/services/obra.service';
import { AuthService } from '../../core/services/auth.service';
import { MoneyPipe } from '../../shared/pipes/money.pipe';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, MoneyPipe],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent implements OnInit {
  Math = Math;
  obras = signal<Obra[]>([]);
  cargando = signal(true);
  mostrarFormObra = signal(false);
  mostrarConfirmarEliminar = signal(false);
  obraEditando = signal<Obra | null>(null);
  obraAEliminar = signal<Obra | null>(null);
  guardando = signal(false);
  eliminando = signal(false);

  // Form
  formNombre = '';
  formDesc = '';
  formUbicacion = '';
  formPresupuesto = '';
  formPresupuestoDisplay = '';

  usuario = computed(() => this.auth.usuario());

  constructor(
    private obraService: ObraService,
    public auth: AuthService,
    public router: Router
  ) {}

  ngOnInit() {
    this.cargarObras();
  }

  cargarObras() {
    this.cargando.set(true);
    this.obraService.getObras().subscribe({
      next: (obras) => { this.obras.set(obras); this.cargando.set(false); },
      error: () => this.cargando.set(false)
    });
  }

  abrirObra(obra: Obra) {
    localStorage.setItem('og_obra', JSON.stringify(obra));
    this.router.navigate(['/obra', obra.id]);
  }

  abrirNuevaObra() {
    this.obraEditando.set(null);
    this.formNombre = '';
    this.formDesc = '';
    this.formUbicacion = '';
    this.formPresupuesto = '';
    this.formPresupuestoDisplay = '';
    this.mostrarFormObra.set(true);
  }

  abrirEditarObra(e: Event, obra: Obra) {
    e.stopPropagation();
    this.obraEditando.set(obra);
    this.formNombre = obra.nombre;
    this.formDesc = obra.descripcion || '';
    this.formUbicacion = obra.ubicacion || '';
    const pv = obra.presupuesto ? Math.round(obra.presupuesto) : 0;
    this.formPresupuesto = pv ? String(pv) : '';
    this.formPresupuestoDisplay = pv ? pv.toLocaleString('es-CO').replace(/,/g, '.') : '';
    this.mostrarFormObra.set(true);
  }

  guardarObra() {
    if (!this.formNombre.trim()) return;
    this.guardando.set(true);
    const data = {
      nombre: this.formNombre.trim(),
      descripcion: this.formDesc.trim(),
      ubicacion: this.formUbicacion.trim(),
      presupuesto: parseFloat(this.formPresupuesto) || 0
    };
    const req = this.obraEditando()
      ? this.obraService.actualizarObra(this.obraEditando()!.id, data)
      : this.obraService.crearObra(data);

    req.subscribe({
      next: () => {
        this.guardando.set(false);
        this.mostrarFormObra.set(false);
        this.cargarObras();
      },
      error: () => this.guardando.set(false)
    });
  }

  pedirEliminar(e: Event, obra: Obra) {
    e.stopPropagation();
    this.obraAEliminar.set(obra);
    this.mostrarConfirmarEliminar.set(true);
  }

  confirmarEliminar() {
    if (!this.obraAEliminar()) return;
    this.eliminando.set(true);
    this.obraService.eliminarObra(this.obraAEliminar()!.id).subscribe({
      next: () => {
        this.eliminando.set(false);
        this.mostrarConfirmarEliminar.set(false);
        this.obraAEliminar.set(null);
        this.cargarObras();
      },
      error: () => this.eliminando.set(false)
    });
  }

  formatPresupuesto(e: Event) {
    const input = e.target as HTMLInputElement;
    const raw = input.value.replace(/\D/g, '');
    this.formPresupuesto = raw;
    this.formPresupuestoDisplay = raw
      ? parseInt(raw).toLocaleString('es-CO').replace(/,/g, '.')
      : '';
  }

  get esSuperadmin() { return this.usuario()?.rol === 'superadmin'; }
}
