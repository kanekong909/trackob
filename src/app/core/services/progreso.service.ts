import { Injectable } from '@angular/core';
import { ApiService } from './api.service';
import { Observable } from 'rxjs';

export interface FotoProgreso {
  id: number;
  obra_id: number;
  foto_url: string;
  fecha: string;
  etapa?: string;
  usuario_nombre?: string;
}

export interface NotaBitacora {
  id: number;
  obra_id: number;
  fecha: string;
  nota: string;
  autor_nombre?: string;
}

@Injectable({ providedIn: 'root' })
export class ProgresoService {
  constructor(private api: ApiService) {}

  getFotos(obraId: number): Observable<FotoProgreso[]> {
    return this.api.get<FotoProgreso[]>(`/api/progreso?obra_id=${obraId}`);
  }

  subirFoto(formData: FormData): Observable<any> {
    return this.api.postForm('/api/progreso', formData);
  }

  editarFoto(id: number, data: any): Observable<any> {
    return this.api.put(`/api/progreso/${id}`, data);
  }

  eliminarFoto(id: number): Observable<any> {
    return this.api.delete(`/api/progreso/${id}`);
  }

  getBitacora(obraId: number): Observable<NotaBitacora[]> {
    return this.api.get<NotaBitacora[]>(`/api/bitacora?obra_id=${obraId}`);
  }

  guardarNota(data: any): Observable<any> {
    return this.api.post('/api/bitacora', data);
  }

  eliminarNota(id: number): Observable<any> {
    return this.api.delete(`/api/bitacora/${id}`);
  }
}
