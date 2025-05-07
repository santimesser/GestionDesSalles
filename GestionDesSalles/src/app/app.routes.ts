import { Routes } from '@angular/router';
import { ForgotPasswordComponent } from './forgot-password/forgot-password.component';
import { SetupProfileComponent } from './setup-profile/setup-profile.component';
import { DashboardComponent } from '../dashboard/dashboard.component';
import { adminGuard } from './guards/admin.guard';
import { ClientGuard } from './guards/client.guard';

export const appRoutes: Routes = [
  {
    path: 'auth',
    loadChildren: () => import('./auth/auth.routes').then(m => m.authRoutes)
  },
  { 
    path: 'forgot-password',
    component: ForgotPasswordComponent
  },
  { path: 'setup-profile', 
    component: SetupProfileComponent 
  },
  {
    path: 'dashboard',
    component: DashboardComponent
  },{
    path: 'admin',
    canActivate: [adminGuard],
    loadComponent: () => import('./admin/admin-dashboard/admin-dashboard.component').then(m => m.AdminDashboardComponent)
  },
  {
    path: 'salles',
    canActivate: [adminGuard],
    loadComponent: () => import('./admin/salles/salle-dashboard.component').then(m => m.SalleDashboardComponent)
  },
  {
    path: 'statistiques',
    canActivate: [adminGuard],
    loadComponent: () => import('./admin/statistiques/statistiques.component').then(m => m.StatistiquesComponent)
  },
  {
    path: 'unauthorized',
    loadComponent: () => import('./unauthorized/unauthorized.component').then(m => m.UnauthorizedComponent)
  },
  {
    path: 'client',
    canActivate: [ClientGuard],
    loadComponent: () => import('./client/client-dashboard/client-dashboard.component').then(m => m.ClientDashboardComponent)
  },
  {
    path: 'gestion',
    canActivate: [ClientGuard],
    loadComponent: () => import('./client/client-reservation/client-reservation.component').then(m => m.ClientReservationComponent)
  },
  {
    path: '',
    redirectTo: '/auth/login',
    pathMatch: 'full'
  },
  {
    path: '**',
    redirectTo: '/auth/login'
  }
];
