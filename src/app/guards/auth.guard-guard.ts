import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { StorageService } from '../services/storage.service';
// Guard con acceso a los servicios de Storage para verificar si existe un token, al no existir redirige al login.
// Funcionalidad: Para cuidar paginas dentro del Routing de Angular
export const authGuardGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  const storage = inject(StorageService);

  return storage.getCurrentUser() ? true : router.createUrlTree(['/auth/login']);
};
