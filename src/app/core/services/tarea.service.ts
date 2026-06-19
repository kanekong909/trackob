import { Injectable } from '@angular/core';
import { ApiService } from './api.service';
import { Observable } from 'rxjs';

export interface Tarea {
  id: number;
  titulo: string;
  descripcion?: string;
  estado: 'pendiente' | 'en_progreso' | 'hecho';
  fecha_limite?: string;
  obra_id: number;
  creador_nombre?: string;
  completado_en?: string;
  completado_por_nombre?: string;
  _pendiente?: boolean;
}

export interface HistorialTarea {
  id: number;
  estado_anterior: string;
  estado_nuevo: string;
  usuario_nombre: string;
  cambiado_en: string;
}

@Injectable({ providedIn: 'root' })
export class TareaService {
  constructor(private api: ApiService) {}

  getTareas(obraId: number): Observable<Tarea[]> {
    return this.api.get<Tarea[]>(`/api/tareas?obra_id=${obraId}`);
  }

  crearTarea(data: any): Observable<any> {
    return this.api.post('/api/tareas', data);
  }

  editarTarea(id: number, data: any): Observable<any> {
    return this.api.put(`/api/tareas/${id}`, data);
  }

  cambiarEstado(id: number, estado: string): Observable<any> {
    return this.api.put(`/api/tareas/${id}/estado`, { estado });
  }

  eliminarTarea(id: number): Observable<any> {
    return this.api.delete(`/api/tareas/${id}`);
  }

  getHistorial(id: number): Observable<HistorialTarea[]> {
    return this.api.get<HistorialTarea[]>(`/api/tareas/${id}/historial`);
  }
}
