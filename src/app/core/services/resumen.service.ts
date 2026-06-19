import { Injectable } from '@angular/core';
import { ApiService } from './api.service';
import { Observable } from 'rxjs';

export interface ResumenData {
  totales: {
    total_gastado: number;
    cantidad_gastos: number;
    total_ingresos: number;
    primera_fecha: string;
    ultima_fecha: string;
  };
  obra: { presupuesto: number };
  por_categoria: {
    id: number;
    nombre: string;
    color: string;
    tipo: string;
    total: number;
  }[];
}

export interface SemanalData {
  semana_actual: number;
  semana_anterior: number;
  mes_actual: number;
  mes_anterior: number;
  dias_semana: number[];
}

@Injectable({ providedIn: 'root' })
export class ResumenService {
  constructor(private api: ApiService) {}

  getResumen(obraId: number): Observable<ResumenData> {
    return this.api.get<ResumenData>(`/api/obras/${obraId}/resumen`);
  }

  getSemanal(obraId: number, lunes: string): Observable<SemanalData> {
    return this.api.get<SemanalData>(`/api/obras/${obraId}/semanal?lunes=${lunes}`);
  }

  getTopGastos(obraId: number): Observable<any> {
    return this.api.get<any>(`/api/gastos?obra_id=${obraId}&limit=100`);
  }
}
