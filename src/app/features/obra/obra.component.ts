import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { GastoService } from '../../core/services/gasto.service';
import { TabGastosComponent } from './../tabs/gastos/gastos.component';
import { TabResumenComponent } from '../tabs/resumen/resumen.component';
import { TabEquipoComponent } from '../tabs/equipo/equipo.component';
import { TabProgresoComponent } from '../tabs/progreso/progreso.component';
import { TabTareasComponent } from '../tabs/tareas/tareas.component';

export type TabActivo = 'gastos' | 'resumen' | 'equipo' | 'progreso' | 'tareas';

@Component({
  selector: 'app-obra',
  standalone: true,
  imports: [CommonModule, TabGastosComponent, TabResumenComponent, TabEquipoComponent, TabProgresoComponent, TabTareasComponent],
  templateUrl: './obra.component.html',
  styleUrl: './obra.component.scss',
})
export class ObraComponent implements OnInit {
  obra = signal<any>(null);
  tabActivo = signal<TabActivo>('gastos');

  // Badge tareas
  badgeTareas = signal(0);

  usuario = computed(() => this.auth.usuario());

  readonly TABS: { id: TabActivo; label: string; icon: string }[] = [
    { id: 'gastos', label: 'Gastos', icon: 'assets/icons/mone.svg' },
    { id: 'resumen', label: 'Resumen', icon: 'assets/icons/analytics.svg' },
    { id: 'equipo', label: 'Equipo', icon: 'assets/icons/teams.svg' },
    { id: 'progreso', label: 'Progreso', icon: 'assets/icons/progreso.svg' },
    { id: 'tareas', label: 'Tareas', icon: 'assets/icons/tasks.svg' },
  ];

  constructor(
    private route: ActivatedRoute,
    public router: Router,
    public auth: AuthService,
    private gastoService: GastoService,
  ) {}

  ngOnInit() {
    // Obtener obra desde localStorage
    const obraData = localStorage.getItem('og_obra');
    if (!obraData) {
      this.router.navigate(['/dashboard']);
      return;
    }
    this.obra.set(JSON.parse(obraData));
  }

  cambiarTab(tab: TabActivo) {
    this.tabActivo.set(tab);
  }

  esTabActivo(tab: TabActivo) {
    return this.tabActivo() === tab;
  }
}
