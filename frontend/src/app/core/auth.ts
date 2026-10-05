import { HttpErrorResponse, type HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { type CanMatchFn, Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

import { SessionStore } from './session.store';

/** Ajoute le jeton de l'onglet aux appels /api ; un 401 sur une session établie la fait expirer. */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const session = inject(SessionStore);
  const token = session.token();
  const hasOwnAuth = req.headers.has('Authorization');
  const request =
    token && !hasOwnAuth && req.url.startsWith('/api/')
      ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
      : req;

  return next(request).pipe(
    catchError((err: unknown) => {
      if (err instanceof HttpErrorResponse && err.status === 401 && token && !hasOwnAuth) {
        session.expire();
      }
      return throwError(() => err);
    }),
  );
};

/** Pages du chat : session valide obligatoire. */
export const sessionGuard: CanMatchFn = async () => {
  const session = inject(SessionStore);
  const router = inject(Router);
  return (await session.restore()) ? true : router.createUrlTree(['/connexion']);
};

/** Écran de connexion : inutile si l'onglet a déjà une session valide. */
export const guestGuard: CanMatchFn = async () => {
  const session = inject(SessionStore);
  const router = inject(Router);
  return (await session.restore()) ? router.createUrlTree(['/']) : true;
};
