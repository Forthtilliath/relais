import { computed, inject, Injectable, signal } from '@angular/core';
import { type Observable, tap } from 'rxjs';

import { debounce, sum } from '@forthtilliath/ts-kit';

import { ChatApi, toProblem } from '../../../core/chat-api';
import type { MessageView, RoomId, RoomView } from '../../../core/models';

export const DEFAULT_ROOM = 'general';

export interface Arrival {
  mine: boolean;
  mentionsMe: boolean;
  /** Le canal est affiché, onglet visible : le message est lu à son arrivée. */
  reading: boolean;
}

/** Liste des canaux, canal affiché, non-lus et marque-pages de lecture. */
@Injectable()
export class RoomsStore {
  private readonly api = inject(ChatApi);

  readonly rooms = signal<RoomView[]>([]);
  readonly loaded = signal(false);
  readonly loadError = signal<string | null>(null);
  readonly activeName = signal<string | null>(null);
  /**
   * Marque-page du canal affiché, figé à son ouverture : le repère « nouveaux messages » reste en place
   * pendant la lecture, alors que le marque-page, lui, avance dès que les messages s'affichent.
   */
  readonly openedReadMark = signal<number | null>(null);
  /** Mentions non lues par canal, comptées en direct (badge rouge). */
  readonly mentions = signal<Partial<Record<RoomId, number>>>({});
  /** Incrémenté quand un membre entre ou sort du canal affiché : la liste des membres se recharge. */
  readonly memberChanges = signal(0);

  readonly active = computed(() => this.rooms().find((r) => r.name === this.activeName()) ?? null);
  readonly joined = computed(() => this.rooms().filter((r) => r.joined));
  readonly discoverable = computed(() => this.rooms().filter((r) => !r.joined));
  readonly totalUnread = computed(() => sum(this.joined().map((r) => r.unread)));
  /** Canaux à écouter en direct : ceux rejoints, plus celui affiché en aperçu. */
  readonly trackedIds = computed(
    () => {
      const ids = new Set(this.joined().map((r) => r.id));
      const active = this.active();
      if (active) {
        ids.add(active.id);
      }
      return [...ids].sort();
    },
    { equal: (a, b) => a.join() === b.join() },
  );

  private readonly readMarks = new Map<RoomId, number>();
  private readonly pendingReads = new Map<RoomId, number>();
  private readonly flushReads = debounce(() => {
    for (const [roomId, messageId] of this.pendingReads) {
      this.api.markRead(roomId, messageId).subscribe({ error: () => undefined });
    }
    this.pendingReads.clear();
  }, 600);

  open(name: string): void {
    this.activeName.set(name);
    this.openedReadMark.set(this.rooms().find((r) => r.name === name)?.lastReadMessageId ?? null);
  }

  load(): void {
    this.api.rooms().subscribe({
      next: (rooms) => {
        const firstLoad = !this.loaded();
        this.rooms.set(rooms);
        this.loaded.set(true);
        this.loadError.set(null);
        if (firstLoad) {
          this.openedReadMark.set(this.active()?.lastReadMessageId ?? null);
        }
      },
      error: (err: unknown) => {
        this.loadError.set(toProblem(err).detail ?? 'Canaux indisponibles.');
      },
    });
  }

  /** Canal annoncé sur /topic/rooms (créé par quelqu'un, peut-être nous). */
  add(room: RoomView): void {
    if (!this.rooms().some((r) => r.id === room.id)) {
      this.rooms.update((rooms) => [...rooms, room].sort((a, b) => a.name.localeCompare(b.name)));
    }
  }

  receive(message: MessageView, arrival: Arrival): void {
    const counts = !arrival.mine && !arrival.reading;
    this.patch(message.roomId, (room) => ({
      ...room,
      lastMessage: message,
      unread: room.joined && counts ? room.unread + 1 : room.unread,
    }));
    if (counts && arrival.mentionsMe) {
      this.mentions.update((m) => ({ ...m, [message.roomId]: (m[message.roomId] ?? 0) + 1 }));
    }
  }

  /** Mouvement de membre diffusé. Le compteur ne bouge que pour les autres : nos propres entrées/sorties
   *  sont comptées au retour de l'appel REST (l'événement peut arriver avant ou jamais selon l'abonnement). */
  memberMoved(roomId: RoomId, joined: boolean, isMe: boolean): void {
    this.patch(roomId, (room) => ({
      ...room,
      joined: isMe ? joined : room.joined,
      memberCount: isMe ? room.memberCount : Math.max(0, room.memberCount + (joined ? 1 : -1)),
    }));
    if (this.active()?.id === roomId) {
      this.memberChanges.update((n) => n + 1);
    }
  }

  setMemberCount(roomId: RoomId, memberCount: number): void {
    this.patch(roomId, (room) => ({ ...room, memberCount }));
  }

  join(room: RoomView): Observable<unknown> {
    return this.api.join(room.id).pipe(
      tap(() => {
        this.patch(room.id, (r) =>
          r.joined
            ? r
            : {
                ...r,
                joined: true,
                unread: 0,
                memberCount: r.memberCount + 1,
                lastReadMessageId: r.lastMessage?.id ?? null,
              },
        );
      }),
    );
  }

  leave(room: RoomView): Observable<unknown> {
    return this.api.leave(room.id).pipe(
      tap(() => {
        this.patch(room.id, (r) =>
          r.joined ? { ...r, joined: false, unread: 0, memberCount: r.memberCount - 1 } : r,
        );
      }),
    );
  }

  create(name: string, topic: string): Observable<RoomView> {
    return this.api.createRoom(name, topic).pipe(
      tap((room) => {
        this.rooms.update((rooms) =>
          [...rooms.filter((r) => r.id !== room.id), room].sort((a, b) =>
            a.name.localeCompare(b.name),
          ),
        );
      }),
    );
  }

  /** Remet les compteurs à zéro et avance le marque-page serveur (regroupé, une requête par canal). */
  markRead(roomId: RoomId, messageId: number): void {
    this.patch(roomId, (room) =>
      room.unread === 0 && (room.lastReadMessageId ?? 0) >= messageId
        ? room
        : {
            ...room,
            unread: 0,
            lastReadMessageId: Math.max(room.lastReadMessageId ?? 0, messageId),
          },
    );
    if (this.mentions()[roomId]) {
      this.mentions.update((counts) => ({ ...counts, [roomId]: 0 }));
    }
    if ((this.readMarks.get(roomId) ?? 0) >= messageId) {
      return;
    }
    this.readMarks.set(roomId, messageId);
    this.pendingReads.set(roomId, messageId);
    this.flushReads();
  }

  private patch(roomId: RoomId, change: (room: RoomView) => RoomView): void {
    this.rooms.update((rooms) => rooms.map((room) => (room.id === roomId ? change(room) : room)));
  }
}
