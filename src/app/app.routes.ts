import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  {
    path: 'login',
    loadComponent: () => import('./features/auth/login/login.component')
      .then(m => m.LoginComponent)
  },
  {
    path: 'dashboard',
    canActivate: [authGuard],
    loadComponent: () => import('./features/dashboard/dashboard.component')
      .then(m => m.DashboardComponent)
  },
  {
    path: 'obra/:id',
    canActivate: [authGuard],
    loadComponent: () => import('./features/obra/obra.component')
      .then(m => m.ObraComponent)
  },
  {
    path: 'perfil',
    canActivate: [authGuard],
    loadComponent: () => import('./features/perfil/perfil.component')
      .then(m => m.PerfilComponent)
  },
  { path: '**', redirectTo: 'login' }
];
