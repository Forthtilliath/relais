import { Component, computed, inject, output, signal } from '@angular/core';

import { SessionStore } from '../../../core/session.store';
import { Icon } from '../../../shared/icon';
import { Lamp } from '../../../shared/lamp';
import { Logo } from '../../../shared/logo';
import { SignalMeter } from '../../../shared/signal-meter';
import { ChatSession } from '../state/chat-session';
import { Notifier } from '../state/notifier';
import { PresenceStore } from '../state/presence.store';
import { RoomsStore } from '../state/rooms.store';

import { ChannelLink } from './channel-link';
import { CreateRoomDialog } from './create-room-dialog';

/** Tableau de gauche : canaux rejoints, canaux à découvrir, personnes en ligne, réglages de l'opérateur. */
@Component({
  selector: 'app-sidebar',
  imports: [Logo, SignalMeter, Lamp, Icon, ChannelLink, CreateRoomDialog],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.css',
})
export class Sidebar {
  readonly navigated = output();

  private readonly session = inject(SessionStore);
  protected readonly rooms = inject(RoomsStore);
  protected readonly presence = inject(PresenceStore);
  protected readonly notifier = inject(Notifier);
  protected readonly connection = inject(ChatSession).connection;

  protected readonly me = this.session.me;
  protected readonly creating = signal(false);
  protected readonly permissionHint = computed(() => {
    switch (this.notifier.permission()) {
      case 'granted':
        return 'Notifications système activées';
      case 'denied':
        return 'Notifications bloquées par le navigateur';
      default:
        return 'Activer les notifications système';
    }
  });

  protected logout(): void {
    this.session.logout();
  }
}
