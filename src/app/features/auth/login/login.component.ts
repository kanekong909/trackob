import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent {
  tab = signal<'login' | 'registro'>('login');
  cargando = signal(false);
  error = signal('');

  features = [
    { icon: '💰', titulo: 'Control de gastos', desc: 'Registra cada gasto con foto, categoría y proveedor.' },
    { icon: '✅', titulo: 'Tareas y pendientes', desc: 'Asigna tareas al equipo y rastrea el estado.' },
    { icon: '📸', titulo: 'Progreso visual', desc: 'Timeline fotográfico con bitácora diaria.' },
    { icon: '📊', titulo: 'Reportes PDF', desc: 'Genera reportes profesionales para el cliente.' }
  ];

  // Login
  loginEmail = '';
  loginPass = '';

  // Registro
  regNombre = '';
  regEmail = '';
  regPass = '';

  constructor(private auth: AuthService, private router: Router) {
    if (this.auth.estaAutenticado) this.router.navigate(['/dashboard']);
  }

  login() {
    if (!this.loginEmail || !this.loginPass) return;
    this.cargando.set(true);
    this.error.set('');
    console.log('Intentando login...');
    this.auth.login(this.loginEmail, this.loginPass).subscribe({
      next: (data) => {
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        console.error('Error login:', err);
        this.error.set(err.message);
        this.cargando.set(false);
      },
      complete: () => console.log('Observable completado')
    });
  }

  registro() {
    if (!this.regNombre || !this.regEmail || !this.regPass) return;
    this.cargando.set(true);
    this.error.set('');
    this.auth.registro(this.regNombre, this.regEmail, this.regPass).subscribe({
      next: () => this.router.navigate(['/dashboard']),
      error: (err) => { this.error.set(err.message); this.cargando.set(false); }
    });
  }
}
