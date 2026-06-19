import { Component, OnInit, Input, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ResumenService, ResumenData, SemanalData } from '../../../core/services/resumen.service';
import { MoneyPipe } from '../../../shared/pipes/money.pipe';

@Component({
  selector: 'app-tab-resumen',
  standalone: true,
  imports: [CommonModule, MoneyPipe],
  templateUrl: './resumen.component.html',
  styleUrl: './resumen.component.scss'
})
export class TabResumenComponent implements OnInit {
  @Input() obra!: any;
  Math = Math;

  resumen = signal<ResumenData | null>(null);
  semanal = signal<SemanalData | null>(null);
  topGastos = signal<any[]>([]);
  cargando = signal(true);

  readonly DIAS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

  constructor(private resumenService: ResumenService) {}

  ngOnInit() {
    this.cargar();
  }

  cargar() {
    this.cargando.set(true);
    const lunes = this.getLunesActual();

    Promise.all([
      this.resumenService.getResumen(this.obra.id).toPromise(),
      this.resumenService.getSemanal(this.obra.id, lunes).toPromise(),
      this.resumenService.getTopGastos(this.obra.id).toPromise()
    ]).then(([resumen, semanal, gastosData]) => {
      this.resumen.set(resumen!);
      this.semanal.set(semanal!);

      const unicos = Object.values(
        (gastosData.gastos as any[]).reduce((acc: any, g: any) => { acc[g.id] = g; return acc; }, {})
      ) as any[];
      const top = unicos
        .filter(g => !g.categorias?.some((c: any) => c.tipo === 'ingreso'))
        .sort((a, b) => b.monto - a.monto)
        .slice(0, 5);
      this.topGastos.set(top);
      this.cargando.set(false);
    }).catch(() => this.cargando.set(false));
  }

  getLunesActual(): string {
    const hoy = new Date();
    const y = hoy.getFullYear(), m = hoy.getMonth(), d = hoy.getDate();
    const local = new Date(y, m, d);
    const dia = local.getDay();
    local.setDate(d + (dia === 0 ? -6 : 1 - dia));
    return `${local.getFullYear()}-${String(local.getMonth()+1).padStart(2,'0')}-${String(local.getDate()).padStart(2,'0')}`;
  }

  getDiaSemana(i: number): number {
    const [y, m, d] = this.getLunesActual().split('-').map(Number);
    const lunes = new Date(y, m - 1, d);
    lunes.setDate(lunes.getDate() + i);
    return lunes.getDate();
  }

  getDiaIdx(): number {
    const dia = new Date().getDay();
    return dia === 0 ? 6 : dia - 1;
  }

  getMaxDia(): number {
    return Math.max(...(this.semanal()?.dias_semana || [0]), 1);
  }

  getAlturaBarra(val: number): number {
    return Math.max(Math.round((val / this.getMaxDia()) * 48), val > 0 ? 4 : 2);
  }

  getPorcentajePresupuesto(): number {
    const r = this.resumen();
    if (!r?.obra.presupuesto) return 0;
    return Math.round((r.totales.total_gastado / r.obra.presupuesto) * 100);
  }

  getMaxCategoria(): number {
    return Math.max(...(this.resumen()?.por_categoria.map(c => c.total) || [1]), 1);
  }

  formatDate(str: string): string {
    if (!str) return '';
    const [y, m, d] = str.substring(0, 10).split('-').map(Number);
    return new Date(y, m - 1, d).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  getDiffPorcentaje(actual: number, anterior: number): number | null {
    if (!anterior) return null;
    return Math.round(((actual - anterior) / anterior) * 100);
  }

  irReporte() {
    window.open('reporte.html', '_blank');
  }
}
