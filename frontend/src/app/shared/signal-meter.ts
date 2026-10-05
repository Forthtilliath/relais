import { Component, computed, input } from '@angular/core';

import type { ConnectionState } from '../core/realtime';

const LABELS: Record<ConnectionState, string> = {
  online: 'Liaison établie',
  connecting: 'Connexion…',
  reconnecting: 'Reconnexion…',
  idle: 'Hors ligne',
};

/** Barres de réception : état de la connexion WebSocket. */
@Component({
  selector: 'app-signal-meter',
  template: `
    <span class="meter" [attr.data-state]="state()" role="status" [attr.aria-label]="label()">
      <span class="meter__bars" aria-hidden="true"><i></i><i></i><i></i><i></i></span>
      <span class="meter__label mono">{{ label() }}</span>
    </span>
  `,
  styles: `
    .meter {
      display: inline-flex;
      align-items: center;
      gap: 0.45rem;
      color: var(--text-faint);
    }
    .meter__bars {
      display: inline-flex;
      align-items: flex-end;
      gap: 2px;
      height: 12px;
    }
    .meter__bars i {
      width: 3px;
      border-radius: 1px;
      background: var(--panel-high);
    }
    .meter__bars i:nth-child(1) {
      height: 4px;
    }
    .meter__bars i:nth-child(2) {
      height: 6px;
    }
    .meter__bars i:nth-child(3) {
      height: 9px;
    }
    .meter__bars i:nth-child(4) {
      height: 12px;
    }
    [data-state='online'] {
      color: var(--live);
    }
    [data-state='online'] i {
      background: var(--live);
      box-shadow: 0 0 6px rgb(111 220 184 / 0.4);
    }
    [data-state='connecting'] i,
    [data-state='reconnecting'] i {
      animation: scan 1.2s infinite;
    }
    [data-state='connecting'],
    [data-state='reconnecting'] {
      color: var(--signal);
    }
    [data-state] i:nth-child(2) {
      animation-delay: 0.15s;
    }
    [data-state] i:nth-child(3) {
      animation-delay: 0.3s;
    }
    [data-state] i:nth-child(4) {
      animation-delay: 0.45s;
    }
    @keyframes scan {
      0%,
      100% {
        background: var(--panel-high);
      }
      40% {
        background: var(--signal);
      }
    }
  `,
})
export class SignalMeter {
  readonly state = input.required<ConnectionState>();
  protected readonly label = computed(() => LABELS[this.state()]);
}
