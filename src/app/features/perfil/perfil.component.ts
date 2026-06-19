import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { ApiService } from '../../core/services/api.service';

interface Perfil {
  id: number;
  nombre: string;
  email: string;
  rol: string;
  fondo_url?: string;
}

const WALLPAPERS = [
  { thumb: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=400&q=80', full: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=1920&q=90', label: 'Construcción' },
  { thumb: 'https://images.unsplash.com/photo-1590496793929-36417d3117de?w=400&q=80', full: 'https://images.unsplash.com/photo-1590496793929-36417d3117de?w=1920&q=90', label: 'Obra' },
  { thumb: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=400&q=80', full: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=1920&q=90', label: 'Trabajo' },
  { thumb: 'https://images.unsplash.com/photo-1486325212027-8081e485255e?w=400&q=80', full: 'https://images.unsplash.com/photo-1486325212027-8081e485255e?w=1920&q=90', label: 'Ciudad' },
  { thumb: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=400&q=80', full: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=1920&q=90', label: 'Casa' },
  { thumb: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&q=80', full: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1920&q=90', label: 'Arquitectura' },
  { thumb: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=400&q=80', full: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=1920&q=90', label: 'Campo' },
  { thumb: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=400&q=80', full: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1920&q=90', label: 'Montaña' },
  { thumb: 'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=400&q=80', full: 'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=1920&q=90', label: 'Ciudad noche' }
];

@Component({
  selector: 'app-perfil',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './perfil.component.html',
  styleUrl: './perfil.component.scss'
})
export class PerfilComponent implements OnInit {
  perfil = signal<Perfil | null>(null);
  cargando = signal(true);
  guardando = signal(false);
  toast = signal('');

  // Editar nombre
  editandoNombre = signal(false);
  nuevoNombre = '';

  // Fondo
  wallpapers = WALLPAPERS;
  fondoActual = signal(localStorage.getItem('og_fondo') || '');

  // Confirmar logout
  mostrarConfirmarLogout = signal(false);

  usuario = computed(() => this.auth.usuario());
  esSuperadmin = computed(() => this.usuario()?.rol === 'superadmin');

  constructor(
    public auth: AuthService,
    private api: ApiService,
    public router: Router
  ) {}

  ngOnInit() {
    this.cargarPerfil();
    this.aplicarFondoGuardado();
  }

  cargarPerfil() {
    this.api.get<Perfil>('/api/auth/perfil').subscribe({
      next: (p) => {
        this.perfil.set(p);
        this.cargando.set(false);
        if (p.fondo_url && p.fondo_url !== this.fondoActual()) {
          this.aplicarFondo(p.fondo_url);
        }
      },
      error: () => this.cargando.set(false)
    });
  }

  // ── Nombre ──
  abrirEditarNombre() {
    this.nuevoNombre = this.perfil()?.nombre || '';
    this.editandoNombre.set(true);
  }

  guardarNombre() {
    if (!this.nuevoNombre.trim()) return;
    this.guardando.set(true);
    this.api.put('/api/auth/perfil', { nombre: this.nuevoNombre.trim() }).subscribe({
      next: () => {
        const p = this.perfil();
        if (p) {
          const actualizado = { ...p, nombre: this.nuevoNombre.trim() };
          this.perfil.set(actualizado);
          localStorage.setItem('og_usuario', JSON.stringify(actualizado));
          this.auth.usuario.set(actualizado);
        }
        this.editandoNombre.set(false);
        this.guardando.set(false);
        this.mostrarToast('Nombre actualizado ✓');
      },
      error: (err) => { this.mostrarToast(err.message); this.guardando.set(false); }
    });
  }

  // ── Fondo ──
  aplicarFondoGuardado() {
    const fondo = localStorage.getItem('og_fondo');
    if (fondo) this.aplicarFondo(fondo);
  }

  aplicarFondo(url: string) {
    document.documentElement.style.setProperty('--fondo-url', `url(${url})`);
    document.documentElement.classList.add('con-fondo-html');
    document.body.classList.add('con-fondo');
    localStorage.setItem('og_fondo', url);
    this.fondoActual.set(url);
  }

  async elegirWallpaper(url: string) {
    this.aplicarFondo(url);
    this.api.put('/api/auth/fondo', { fondo_url: url }).subscribe();
    this.mostrarToast('✓ Fondo aplicado');
  }

  subirFondoPropio(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    if (file.size > 15 * 1024 * 1024) { this.mostrarToast('Máximo 15MB'); return; }
    this.mostrarToast('⏳ Subiendo fondo…');
    this.comprimirYSubir(file);
  }

  private comprimirYSubir(file: File) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    const img = new Image();
    const reader = new FileReader();
    reader.onload = (e) => {
      img.onload = () => {
        const maxW = 1920;
        const ratio = Math.min(1, maxW / img.width);
        canvas.width = img.width * ratio;
        canvas.height = img.height * ratio;
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        canvas.toBlob((blob) => {
          if (!blob) return;
          const fd = new FormData();
          fd.append('foto', blob, file.name);
          this.api.postForm<{ url: string }>('/api/auth/fondo-upload', fd).subscribe({
            next: (res) => {
              this.aplicarFondo(res.url);
              this.api.put('/api/auth/fondo', { fondo_url: res.url }).subscribe();
              this.mostrarToast('✓ Fondo aplicado');
            },
            error: () => {
              // Fallback local
              canvas.toBlob((b2) => {
                if (!b2) return;
                const fr = new FileReader();
                fr.onload = (ev) => {
                  this.aplicarFondo(ev.target?.result as string);
                  this.mostrarToast('Guardado localmente');
                };
                fr.readAsDataURL(b2);
              }, 'image/jpeg', 0.75);
            }
          });
        }, 'image/jpeg', 0.85);
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  }

  quitarFondo() {
    localStorage.removeItem('og_fondo');
    document.documentElement.style.removeProperty('--fondo-url');
    document.documentElement.classList.remove('con-fondo-html');
    document.body.classList.remove('con-fondo');
    this.fondoActual.set('');
    this.api.put('/api/auth/fondo', { fondo_url: null }).subscribe();
    this.mostrarToast('Fondo quitado');
  }

  esFondoSeleccionado(url: string) {
    return this.fondoActual() === url;
  }

  // ── Toast ──
  mostrarToast(msg: string) {
    this.toast.set(msg);
    setTimeout(() => this.toast.set(''), 3000);
  }

  // ── Logout ──
  confirmarLogout() {
    this.auth.logout();
  }
}
