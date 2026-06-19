import { Injectable } from '@angular/core';
import { ApiService } from './api.service';
import { Observable } from 'rxjs';

export interface Obra {
  id: number;
  nombre: string;
  descripcion?: string;
  ubicacion?: string;
  presupuesto?: number;
  total_gastado: number;
  total_gastos_count: number;
  tareas_pendientes: number;
  activa: number;
}

@Injectable({ providedIn: 'root' })
export class ObraService {
  constructor(private api: ApiService) {}

  getObras(): Observable<Obra[]> {
    return this.api.get<Obra[]>('/api/obras');
  }

  crearObra(data: Partial<Obra>): Observable<any> {
    return this.api.post('/api/obras', data);
  }

  actualizarObra(id: number, data: Partial<Obra>): Observable<any> {
    return this.api.put(`/api/obras/${id}`, data);
  }

  eliminarObra(id: number): Observable<any> {
    return this.api.delete(`/api/obras/${id}`);
  }
}
