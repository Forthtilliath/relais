import { inject, Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';

import { truncate } from '@forthtilliath/ts-kit';

import type { MentionNotice } from '../../../core/models';
import { local, readStored, writeStored } from '../../../core/storage';

const SOUND_KEY = 'relais.sound';
const MAX_TOASTS = 4;

export type ToastTone = 'mention' | 'error' | 'info';

export interface Toast {
  id: number;
  tone: ToastTone;
  title: string;
  body: string;
  roomName?: string;
}

type Permission = NotificationPermission | 'unsupported';

/** Notifications : bandeaux dans l'application, carillon, et notifications système quand l'onglet est caché. */
@Injectable()
export class Notifier {
  private readonly router = inject(Router);
  private audio: AudioContext | null = null;
  private nextId = 0;

  readonly toasts = signal<Toast[]>([]);
  readonly sound = signal(readStored(local, SOUND_KEY, true));
  readonly permission = signal<Permission>(
    'Notification' in window ? Notification.permission : 'unsupported',
  );

  /** @param reading le canal est déjà sous les yeux : rien à signaler */
  mention(notice: MentionNotice, reading: boolean): void {
    if (reading) {
      return;
    }
    const title = `@${notice.message.author.nickname} dans #${notice.roomName}`;
    const body = truncate(notice.message.content, 140);
    this.push({ tone: 'mention', title, body, roomName: notice.roomName });
    if (this.sound()) {
      this.chime();
    }
    if (document.hidden && this.permission() === 'granted') {
      const notification = new Notification(title, {
        body,
        tag: `relais-${notice.roomName}`,
        icon: '/favicon.svg',
      });
      notification.onclick = () => {
        window.focus();
        void this.router.navigate(['/c', notice.roomName]);
        notification.close();
      };
    }
  }

  error(detail: string): void {
    this.push({ tone: 'error', title: 'Transmission refusée', body: detail });
  }

  info(title: string, body: string): void {
    this.push({ tone: 'info', title, body });
  }

  dismiss(id: number): void {
    this.toasts.update((toasts) => toasts.filter((t) => t.id !== id));
  }

  async enableSystemNotifications(): Promise<void> {
    if (this.permission() !== 'unsupported') {
      this.permission.set(await Notification.requestPermission());
    }
  }

  toggleSound(): void {
    this.sound.update((on) => !on);
    writeStored(local, SOUND_KEY, this.sound());
  }

  private push(toast: Omit<Toast, 'id'>): void {
    const id = this.nextId++;
    this.toasts.update((toasts) => [...toasts.slice(-(MAX_TOASTS - 1)), { ...toast, id }]);
    setTimeout(
      () => {
        this.dismiss(id);
      },
      toast.tone === 'error' ? 7_000 : 5_000,
    );
  }

  /** Deux notes brèves et douces (la5 puis mi6), synthétisées : aucun fichier audio à charger. */
  private chime(): void {
    try {
      const ctx = (this.audio ??= new AudioContext());
      const start = ctx.currentTime;
      [880, 1318.5].forEach((frequency, i) => {
        const oscillator = ctx.createOscillator();
        const gain = ctx.createGain();
        const at = start + i * 0.11;
        oscillator.type = 'sine';
        oscillator.frequency.value = frequency;
        gain.gain.setValueAtTime(0.0001, at);
        gain.gain.exponentialRampToValueAtTime(0.08, at + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, at + 0.28);
        oscillator.connect(gain).connect(ctx.destination);
        oscillator.start(at);
        oscillator.stop(at + 0.3);
      });
    } catch {
      // Audio indisponible (politique d'autoplay, navigateur) : la notification visuelle suffit.
    }
  }
}
