import { inject, Injectable, signal } from '@angular/core';

import { randomId } from '@forthtilliath/ts-kit';

import { ChatApi, toProblem } from '../../../core/chat-api';
import type { ChatMessage, MessageView, RoomId, UserRef } from '../../../core/models';
import { Realtime } from '../../../core/realtime';
import { mergeIncoming, mergeLatest, prependOlder } from '../../../core/timeline';

const PAGE_SIZE = 50;
/** Sans écho du serveur passé ce délai, l'envoi est considéré comme perdu (et peut être relancé). */
const SEND_TIMEOUT_MS = 8_000;

export interface Timeline {
  messages: ChatMessage[];
  loaded: boolean;
  loading: boolean;
  hasMore: boolean;
  error: string | null;
}

const EMPTY: Timeline = { messages: [], loaded: false, loading: false, hasMore: true, error: null };

/** Fil de chaque canal ouvert : historique paginé, messages en direct et envois optimistes. */
@Injectable()
export class MessagesStore {
  private readonly api = inject(ChatApi);
  private readonly realtime = inject(Realtime);
  private readonly timelines = signal<Partial<Record<RoomId, Timeline>>>({});

  timeline(roomId: RoomId | null | undefined): Timeline {
    return (roomId ? this.timelines()[roomId] : undefined) ?? EMPTY;
  }

  lastConfirmedId(roomId: RoomId): number | null {
    const sent = this.timeline(roomId).messages.filter((m) => m.state === 'sent');
    return sent.at(-1)?.id ?? null;
  }

  ensureLoaded(roomId: RoomId): void {
    const timeline = this.timeline(roomId);
    if (!timeline.loaded && !timeline.loading) {
      this.loadLatest(roomId);
    }
  }

  /** Dernière page : premier affichage, ou rattrapage après une coupure (fusion sans doublon). */
  loadLatest(roomId: RoomId): void {
    this.patch(roomId, (t) => ({ ...t, loading: true, error: null }));
    this.api.history(roomId).subscribe({
      next: (page) => {
        this.patch(roomId, (t) => ({
          ...t,
          messages: mergeLatest(t.messages, page),
          loaded: true,
          loading: false,
          hasMore: t.loaded ? t.hasMore : page.length === PAGE_SIZE,
        }));
      },
      error: (err: unknown) => {
        this.patch(roomId, (t) => ({
          ...t,
          loading: false,
          error: toProblem(err).detail ?? 'Historique indisponible.',
        }));
      },
    });
  }

  /** Après une reconnexion : chaque fil déjà ouvert récupère ce qui a pu passer pendant la coupure. */
  refreshLoaded(): void {
    for (const [roomId, timeline] of Object.entries(this.timelines())) {
      if (timeline?.loaded) {
        this.loadLatest(roomId as RoomId);
      }
    }
  }

  loadOlder(roomId: RoomId): void {
    const timeline = this.timeline(roomId);
    const oldest = timeline.messages.find((m) => m.id !== null)?.id;
    if (
      !timeline.loaded ||
      timeline.loading ||
      !timeline.hasMore ||
      oldest === undefined ||
      oldest === null
    ) {
      return;
    }
    this.patch(roomId, (t) => ({ ...t, loading: true }));
    this.api.history(roomId, oldest).subscribe({
      next: (page) => {
        this.patch(roomId, (t) => ({
          ...t,
          messages: prependOlder(t.messages, page),
          loading: false,
          hasMore: page.length === PAGE_SIZE,
        }));
      },
      error: () => {
        this.patch(roomId, (t) => ({ ...t, loading: false }));
      },
    });
  }

  receive(message: MessageView): void {
    if (this.timeline(message.roomId).loaded) {
      this.patch(message.roomId, (t) => ({ ...t, messages: mergeIncoming(t.messages, message) }));
    }
  }

  /** Affiche tout de suite le message (en attente), puis l'émet ; l'écho du serveur le confirmera. */
  send(roomId: RoomId, content: string, author: UserRef): void {
    const clientId = randomId();
    const pending: ChatMessage = {
      key: clientId,
      id: null,
      clientId,
      roomId,
      author,
      content,
      sentAt: new Date().toISOString(),
      state: 'pending',
    };
    this.patch(roomId, (t) => ({ ...t, messages: [...t.messages, pending] }));
    this.emit(pending);
  }

  retry(roomId: RoomId, key: string): void {
    const failed = this.timeline(roomId).messages.find(
      (m) => m.key === key && m.state === 'failed',
    );
    if (failed) {
      const pending: ChatMessage = { ...failed, state: 'pending', error: undefined };
      this.replace(roomId, key, pending);
      this.emit(pending);
    }
  }

  discard(roomId: RoomId, key: string): void {
    this.patch(roomId, (t) => ({
      ...t,
      messages: t.messages.filter((m) => m.key !== key || m.state === 'sent'),
    }));
  }

  /** Refus du serveur (/user/queue/errors) ou délai dépassé. */
  fail(clientId: string, error: string): void {
    for (const [roomId, timeline] of Object.entries(this.timelines())) {
      const message = timeline?.messages.find(
        (m) => m.clientId === clientId && m.state === 'pending',
      );
      if (message) {
        this.replace(roomId as RoomId, message.key, { ...message, state: 'failed', error });
      }
    }
  }

  private emit(message: ChatMessage): void {
    const clientId = message.clientId ?? message.key;
    const sent = this.realtime.publish(`/app/rooms/${message.roomId}/messages`, {
      content: message.content,
      clientId,
    });
    if (!sent) {
      this.fail(clientId, 'Hors ligne : le message n’est pas parti.');
      return;
    }
    setTimeout(() => {
      this.fail(clientId, 'Pas de confirmation du serveur.');
    }, SEND_TIMEOUT_MS);
  }

  private replace(roomId: RoomId, key: string, message: ChatMessage): void {
    this.patch(roomId, (t) => ({
      ...t,
      messages: t.messages.map((m) => (m.key === key ? message : m)),
    }));
  }

  private patch(roomId: RoomId, change: (timeline: Timeline) => Timeline): void {
    this.timelines.update((all) => ({ ...all, [roomId]: change(all[roomId] ?? EMPTY) }));
  }
}
