import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';

import { Icon } from '../../shared/icon';

import { Notifier } from './state/notifier';

/** Bandeaux de notification, empilés en bas à droite ; une mention mène au canal concerné. */
@Component({
  selector: 'app-toasts',
  imports: [RouterLink, Icon],
  template: `
    <section class="toasts" aria-live="polite" aria-label="Notifications">
      @for (toast of notifier.toasts(); track toast.id) {
        <article class="toast" [attr.data-tone]="toast.tone">
          @if (toast.roomName) {
            <a
              class="toast__body"
              [routerLink]="['/c', toast.roomName]"
              (click)="notifier.dismiss(toast.id)"
            >
              <strong class="toast__title">{{ toast.title }}</strong>
              <span class="toast__text">{{ toast.body }}</span>
            </a>
          } @else {
            <div class="toast__body">
              <strong class="toast__title">{{ toast.title }}</strong>
              <span class="toast__text">{{ toast.body }}</span>
            </div>
          }
          <button
            type="button"
            class="icon-btn"
            aria-label="Fermer"
            (click)="notifier.dismiss(toast.id)"
          >
            <app-icon name="close" />
          </button>
        </article>
      }
    </section>
  `,
  styles: `
    /* En haut à droite, sous les en-têtes : en bas, ils masqueraient la saisie et « Rejoindre » */
    .toasts {
      position: fixed;
      top: 4.75rem;
      right: 1rem;
      z-index: 50;
      display: grid;
      gap: 0.6rem;
      width: min(22rem, calc(100vw - 2rem));
      pointer-events: none;
    }
    .toast {
      --tone: var(--signal);
      display: flex;
      align-items: flex-start;
      gap: 0.4rem;
      padding: 0.75rem 0.5rem 0.75rem 0.95rem;
      border: 1px solid var(--line-strong);
      border-left: 3px solid var(--tone);
      border-radius: var(--radius);
      background: var(--panel-high);
      box-shadow: 0 18px 50px -14px rgb(0 0 0 / 0.85);
      pointer-events: auto;
      animation: enter 260ms var(--ease-out);
    }
    .toast[data-tone='mention'] {
      --tone: var(--alert);
    }
    .toast[data-tone='error'] {
      --tone: var(--danger);
    }
    .toast__body {
      display: grid;
      flex: 1;
      gap: 0.15rem;
      min-width: 0;
      color: inherit;
      text-decoration: none;
    }
    .toast__title {
      color: var(--tone);
      font-size: 0.875rem;
    }
    .toast__text {
      color: var(--text-soft);
      font-size: 0.875rem;
      overflow-wrap: anywhere;
    }
    @keyframes enter {
      from {
        opacity: 0;
        translate: 0 -12px;
      }
    }
  `,
})
export class Toasts {
  protected readonly notifier = inject(Notifier);
}
