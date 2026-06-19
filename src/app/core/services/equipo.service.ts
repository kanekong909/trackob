import { Injectable } from '@angular/core';
import { ApiService } from './api.service';
import { Observable } from 'rxjs';

export interface Colaborador {
  id: number;
  nombre: string;
  email: string;
  rol: string;
}

export interface Categoria {
  id: number;
  nombre: string;
  color: string;
  tipo: string;
  es_global: number;
}

@Injectable({ providedIn: 'root' })
export class EquipoService {
  constructor(private api: ApiService) {}

  getColaboradores(obraId: number): Observable<Colaborador[]> {
    return this.api.get<Colaborador[]>(`/api/obras/${obraId}/colaboradores`);
  }

  invitar(email: string, obraId: number, rol: string): Observable<any> {
    return this.api.post('/api/auth/invitar', { email, obra_id: obraId, rol });
  }

  getCategorias(obraId: number): Observable<Categoria[]> {
    return this.api.get<Categoria[]>(`/api/gastos/categorias?obra_id=${obraId}`);
  }

  crearCategoria(data: any): Observable<any> {
    return this.api.post('/api/gastos/categorias', data);
  }

  editarCategoria(id: number, data: any): Observable<any> {
    return this.api.put(`/api/gastos/categorias/${id}`, data);
  }

  eliminarCategoria(id: number): Observable<any> {
    return this.api.delete(`/api/gastos/categorias/${id}`);
  }
}
