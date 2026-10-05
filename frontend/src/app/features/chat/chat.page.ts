import { Component, effect, inject, input, signal, untracked } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { Router } from '@angular/router';

import { SessionStore } from '../../core/session.store';

import { MembersPanel } from './members/members-panel';
import { RoomView } from './room/room-view';
import { Sidebar } from './sidebar/sidebar';
import { ChatSession } from './state/chat-session';
import { MembersStore } from './state/members.store';
import { MessagesStore } from './state/messages.store';
import { Notifier } from './state/notifier';
import { PresenceStore } from './state/presence.store';
import { DEFAULT_ROOM, RoomsStore } from './state/rooms.store';
import { TypingStore } from './state/typing.store';
import { Toasts } from './toasts';

const WIDE_SCREEN = '(min-width: 1100px)';

@Component({
  selector: 'app-chat-page',
  imports: [Sidebar, RoomView, MembersPanel, Toasts],
  providers: [
    RoomsStore,
    MessagesStore,
    PresenceStore,
    TypingStore,
    MembersStore,
    Notifier,
    ChatSession,
  ],
  templateUrl: './chat.page.html',
  styleUrl: './chat.page.css',
  host: { '(document:keydown.escape)': 'closePanels()' },
})
export class ChatPage {
  /** Nom du canal, depuis l'URL /c/:room. */
  readonly room = input.required<string>();

  private readonly session = inject(SessionStore);
  private readonly rooms = inject(RoomsStore);
  private readonly router = inject(Router);
  private readonly title = inject(Title);

  protected readonly navOpen = signal(false);
  protected readonly membersOpen = signal(window.matchMedia(WIDE_SCREEN).matches);

  constructor() {
    inject(ChatSession).start();

    effect(() => {
      const name = this.room();
      untracked(() => {
        this.rooms.open(name);
        this.navOpen.set(false);
      });
    });
    // Canal inconnu (supprimé, faute de frappe dans l'URL) : retour au canal commun.
    effect(() => {
      if (this.rooms.loaded() && !this.rooms.active() && this.room() !== DEFAULT_ROOM) {
        untracked(() => void this.router.navigate(['/c', DEFAULT_ROOM], { replaceUrl: true }));
      }
    });
    // Session expirée ou déconnexion : retour à l'écran de connexion.
    effect(() => {
      if (!this.session.me()) {
        untracked(() => void this.router.navigate(['/connexion']));
      }
    });
    effect(() => {
      const unread = this.rooms.totalUnread();
      this.title.setTitle(`${unread ? `(${unread}) ` : ''}#${this.room()} — Relais`);
    });
  }

  protected closePanels(): void {
    this.navOpen.set(false);
    if (!window.matchMedia(WIDE_SCREEN).matches) {
      this.membersOpen.set(false);
    }
  }
}
