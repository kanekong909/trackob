import { Injectable } from '@angular/core';
import { ApiService } from './api.service';
import { Observable } from 'rxjs';

export interface Categoria {
  id: number;
  nombre: string;
  color: string;
  tipo: string;
  es_global: number;
}

export interface Gasto {
  id: number | string;
  descripcion: string;
  monto: number;
  fecha: string;
  obra_id: number;
  proveedor?: string;
  notas?: string;
  cantidad?: number;
  unidad?: string;
  valor_unitario?: number;
  foto_url?: string;
  usuario_nombre?: string;
  categorias?: Categoria[];
  categoria_color?: string;
  _pendiente?: boolean;
}

export interface GastosResponse {
  gastos: Gasto[];
  total: number;
  paginas: number;
  suma: number;
  suma_ingresos?: number;
}

@Injectable({ providedIn: 'root' })
export class GastoService {
  constructor(private api: ApiService) {}

  getGastos(obraId: number, page = 1, limit = 50, params: any = {}): Observable<GastosResponse> {
    let url = `/api/gastos?obra_id=${obraId}&page=${page}&limit=${limit}`;
    if (params.desde) url += `&fecha_desde=${params.desde}`;
    if (params.hasta) url += `&fecha_hasta=${params.hasta}`;
    if (params.categoria_id) url += `&categoria_id=${params.categoria_id}`;
    return this.api.get<GastosResponse>(url);
  }

  getCategorias(obraId: number): Observable<Categoria[]> {
    return this.api.get<Categoria[]>(`/api/gastos/categorias?obra_id=${obraId}`);
  }

  crearGasto(formData: FormData): Observable<any> {
    return this.api.postForm('/api/gastos', formData);
  }

  editarGasto(id: number, formData: FormData): Observable<any> {
    return this.api.putForm(`/api/gastos/${id}`, formData);
  }

  eliminarGasto(id: number): Observable<any> {
    return this.api.delete(`/api/gastos/${id}`);
  }

  exportarCSV(obraId: number, desde?: string, hasta?: string): string {
    let url = `/api/gastos/exportar?obra_id=${obraId}`;
    if (desde) url += `&fecha_desde=${desde}`;
    if (hasta) url += `&fecha_hasta=${hasta}`;
    return url;
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
