import { Component, OnInit, Input, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { EquipoService, Colaborador, Categoria } from '../../../core/services/equipo.service';

@Component({
  selector: 'app-tab-equipo',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './equipo.component.html',
  styleUrl: './equipo.component.scss'
})
export class TabEquipoComponent implements OnInit {
  @Input() obra!: any;

  colaboradores = signal<Colaborador[]>([]);
  categorias = signal<Categoria[]>([]);
  cargando = signal(true);

  // Modales
  mostrarInvitar = signal(false);
  mostrarNuevaCat = signal(false);
  mostrarEditarCat = signal(false);
  mostrarConfirmarEliminarCat = signal(false);

  // Form invitar
  invEmail = '';
  invRol = 'colaborador';
  invitando = signal(false);

  // Form categoría
  catNombre = '';
  catColor = '#6366f1';
  catTipo = 'egreso';
  catEditandoId = signal<number | null>(null);
  catAEliminarId = signal<number | null>(null);
  catAEliminarNombre = signal('');
  guardandoCat = signal(false);

  constructor(private equipoService: EquipoService) {}

  ngOnInit() {
    this.cargarDatos();
  }

  cargarDatos() {
    this.cargando.set(true);
    Promise.all([
      this.equipoService.getColaboradores(this.obra.id).toPromise(),
      this.equipoService.getCategorias(this.obra.id).toPromise()
    ]).then(([colabs, cats]) => {
      this.colaboradores.set(colabs || []);
      this.categorias.set(cats || []);
      this.cargando.set(false);
    }).catch(() => this.cargando.set(false));
  }

  // ── Colaboradores ──
  abrirInvitar() {
    this.invEmail = '';
    this.invRol = 'colaborador';
    this.mostrarInvitar.set(true);
  }

  invitar() {
    if (!this.invEmail.trim()) return;
    this.invitando.set(true);
    this.equipoService.invitar(this.invEmail.trim(), this.obra.id, this.invRol).subscribe({
      next: () => {
        this.invitando.set(false);
        this.mostrarInvitar.set(false);
        this.cargarDatos();
      },
      error: () => this.invitando.set(false)
    });
  }

  getInicial(nombre: string): string {
    return nombre.charAt(0).toUpperCase();
  }

  // ── Categorías ──
  abrirNuevaCat() {
    this.catNombre = '';
    this.catColor = '#6366f1';
    this.catTipo = 'egreso';
    this.catEditandoId.set(null);
    this.mostrarNuevaCat.set(true);
  }

  abrirEditarCat(cat: Categoria) {
    this.catNombre = cat.nombre;
    this.catColor = cat.color;
    this.catTipo = cat.tipo || 'egreso';
    this.catEditandoId.set(cat.id);
    this.mostrarEditarCat.set(true);
  }

  guardarCategoria() {
    if (!this.catNombre.trim()) return;
    this.guardandoCat.set(true);
    const data = { nombre: this.catNombre.trim(), color: this.catColor, tipo: this.catTipo, obra_id: this.obra.id };

    const req = this.catEditandoId()
      ? this.equipoService.editarCategoria(this.catEditandoId()!, data)
      : this.equipoService.crearCategoria(data);

    req.subscribe({
      next: () => {
        this.guardandoCat.set(false);
        this.mostrarNuevaCat.set(false);
        this.mostrarEditarCat.set(false);
        this.cargarDatos();
      },
      error: () => this.guardandoCat.set(false)
    });
  }

  pedirEliminarCat(cat: Categoria) {
    this.catAEliminarId.set(cat.id);
    this.catAEliminarNombre.set(cat.nombre);
    this.mostrarConfirmarEliminarCat.set(true);
  }

  confirmarEliminarCat() {
    if (!this.catAEliminarId()) return;
    this.equipoService.eliminarCategoria(this.catAEliminarId()!).subscribe({
      next: () => {
        this.mostrarConfirmarEliminarCat.set(false);
        this.cargarDatos();
      }
    });
  }
}
