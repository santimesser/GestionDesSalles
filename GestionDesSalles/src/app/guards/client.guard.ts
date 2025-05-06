
import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { map } from 'rxjs/operators';

export const ClientGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  return authService.getCurrentUserWithRole().pipe(
    map(user => {
      if (user && user.role === 'client') {
        return true;
      } else {
        router.navigate(['/unauthorized']);
        return false;
      }
    })
  );
};