import { DestroyRef, inject, Injectable, signal } from '@angular/core';

/** Signaux sur l'état du navigateur : horloge (pour les « il y a… ») et visibilité de l'onglet. */
@Injectable({ providedIn: 'root' })
export class Browser {
  /** Avance toutes les 30 s : suffisant pour des libellés relatifs à la minute près. */
  readonly now = signal(new Date());
  readonly visible = signal(document.visibilityState === 'visible');

  constructor() {
    const timer = setInterval(() => {
      this.now.set(new Date());
    }, 30_000);
    const onVisibility = (): void => {
      this.visible.set(document.visibilityState === 'visible');
      this.now.set(new Date());
    };
    document.addEventListener('visibilitychange', onVisibility);
    inject(DestroyRef).onDestroy(() => {
      clearInterval(timer);
      document.removeEventListener('visibilitychange', onVisibility);
    });
  }
}
