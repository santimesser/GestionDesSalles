import { Injectable } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { map } from 'rxjs/operators';

/**
 * Garde qui permet d'accéder à une route uniquement si l'utilisateur est
 * connecté et a le rôle "admin".
 * Si l'utilisateur n'est pas connecté ou n'a pas le rôle "admin", il est
 * redirigé vers la page d'erreur 403.
 * @returns Un observable qui se résout avec un boolean indiquant si
 * l'utilisateur peut accéder à la route.
 */
export const adminGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  return authService.getCurrentUserWithRole().pipe(
    map(user => { 
      if (user && user.role === 'admin') { // Si l'utilisateur est connecté et a le rôle admin
        return true;
      } else {
        router.navigate(['/unauthorized']); 
        return false;
      }
    })
  );
};