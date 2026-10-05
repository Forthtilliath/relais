import { Component, computed, inject, input, output, signal } from '@angular/core';

import { toProblem } from '../../../core/chat-api';
import type { RoomView as Room } from '../../../core/models';
import { SessionStore } from '../../../core/session.store';
import { Icon } from '../../../shared/icon';
import { ChatSession } from '../state/chat-session';
import { MembersStore } from '../state/members.store';
import { MessagesStore } from '../state/messages.store';
import { Notifier } from '../state/notifier';
import { PresenceStore } from '../state/presence.store';
import { DEFAULT_ROOM, RoomsStore } from '../state/rooms.store';
import { TypingStore } from '../state/typing.store';

import { Composer } from './composer';
import { MessageList } from './message-list';
import { TypingIndicator } from './typing-indicator';

/** Le canal affiché : en-tête, fil, « … écrit » et zone de saisie (ou invitation à rejoindre). */
@Component({
  selector: 'app-room-view',
  imports: [Icon, MessageList, Composer, TypingIndicator],
  templateUrl: './room-view.html',
  styleUrl: './room-view.css',
})
export class RoomView {
  readonly membersOpen = input(false);
  readonly toggleNav = output();
  readonly toggleMembers = output();

  private readonly notifier = inject(Notifier);
  private readonly typing = inject(TypingStore);
  protected readonly session = inject(SessionStore);
  protected readonly rooms = inject(RoomsStore);
  protected readonly messages = inject(MessagesStore);
  protected readonly members = inject(MembersStore);
  protected readonly presence = inject(PresenceStore);
  protected readonly chat = inject(ChatSession);

  protected readonly defaultRoom = DEFAULT_ROOM;
  protected readonly room = this.rooms.active;
  protected readonly timeline = computed(() => this.messages.timeline(this.room()?.id));
  protected readonly typers = computed(() =>
    this.typing.typers(this.room()?.id).map((u) => u.nickname),
  );
  protected readonly busy = signal(false);

  protected join(room: Room): void {
    this.run(this.rooms.join(room));
  }

  protected leave(room: Room): void {
    this.run(this.rooms.leave(room));
  }

  private run(action: ReturnType<RoomsStore['join']>): void {
    this.busy.set(true);
    action.subscribe({
      next: () => {
        this.busy.set(false);
      },
      error: (err: unknown) => {
        this.busy.set(false);
        this.notifier.error(toProblem(err).detail ?? 'Action impossible.');
      },
    });
  }
}
