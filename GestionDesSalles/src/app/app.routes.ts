import { Routes } from '@angular/router';
import { ForgotPasswordComponent } from './forgot-password/forgot-password.component';
import { SetupProfileComponent } from './setup-profile/setup-profile.component';
import { DashboardComponent } from '../dashboard/dashboard.component';
import { adminGuard } from './guards/admin.guard';

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
  },
  {
    path: 'salles',
    canActivate: [adminGuard],
    loadComponent: () => import('./salles/salle-dashboard.component').then(m => m.SalleDashboardComponent)
  },
  {
    path: 'unauthorized',
    loadComponent: () => import('./unauthorized/unauthorized.component').then(m => m.UnauthorizedComponent)
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
