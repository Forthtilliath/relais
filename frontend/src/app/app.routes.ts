import type { Routes } from '@angular/router';

import { guestGuard, sessionGuard } from './core/auth';

export const routes: Routes = [
  {
    path: 'connexion',
    title: 'Relais — prendre l’antenne',
    canMatch: [guestGuard],
    loadComponent: () => import('./features/login/login.page').then((m) => m.LoginPage),
  },
  {
    path: 'c/:room',
    canMatch: [sessionGuard],
    loadComponent: () => import('./features/chat/chat.page').then((m) => m.ChatPage),
  },
  { path: '', pathMatch: 'full', redirectTo: 'c/general' },
  { path: '**', redirectTo: 'c/general' },
];
