import { Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { ApiService } from './api.service';
import { tap } from 'rxjs/operators';

export interface Usuario {
  id: number;
  nombre: string;
  email: string;
  rol: string;
  fondo_url?: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  usuario = signal<Usuario | null>(this.cargarUsuario());

  constructor(private api: ApiService, private router: Router) {}

  private cargarUsuario(): Usuario | null {
    const raw = localStorage.getItem('og_usuario');
    return raw ? JSON.parse(raw) : null;
  }

  login(email: string, password: string) {
    return this.api.post<{ token: string; usuario: Usuario }>('/api/auth/login', { email, password })
      .pipe(tap(data => this.guardarSesion(data.token, data.usuario)));
  }

  registro(nombre: string, email: string, password: string) {
    return this.api.post<{ token: string; usuario: Usuario }>('/api/auth/registro', { nombre, email, password })
      .pipe(tap(data => this.guardarSesion(data.token, data.usuario)));
  }

  private guardarSesion(token: string, usuario: Usuario) {
    localStorage.setItem('og_token', token);
    localStorage.setItem('og_usuario', JSON.stringify(usuario));
    this.usuario.set(usuario);
  }

  logout() {
    localStorage.clear();
    this.usuario.set(null);
    this.router.navigate(['/login']);
  }

  get token() { return localStorage.getItem('og_token'); }
  get estaAutenticado() { return !!this.token; }
}
