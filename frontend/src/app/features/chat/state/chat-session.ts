import { DestroyRef, effect, inject, Injectable, untracked } from '@angular/core';

import { Browser } from '../../../core/browser';
import { ChatApi, toProblem } from '../../../core/chat-api';
import { mentions } from '../../../core/message-format';
import type {
  ChatError,
  MentionNotice,
  PresenceEvent,
  RoomEvent,
  RoomId,
  RoomView,
  UserView,
} from '../../../core/models';
import { Realtime } from '../../../core/realtime';
import { SessionStore } from '../../../core/session.store';

import { MessagesStore } from './messages.store';
import { Notifier } from './notifier';
import { PresenceStore } from './presence.store';
import { RoomsStore } from './rooms.store';
import { TypingStore } from './typing.store';

/** Délai minimal entre deux « … écrit » émis pour un même canal. */
const TYPING_THROTTLE_MS = 2_500;

/**
 * Chef d'orchestre de l'écran de chat : ouvre la connexion STOMP, déclare les abonnements et aiguille chaque
 * événement vers le store concerné. Fourni par la page : tout s'arrête quand on la quitte.
 */
@Injectable()
export class ChatSession {
  private readonly session = inject(SessionStore);
  private readonly realtime = inject(Realtime);
  private readonly api = inject(ChatApi);
  private readonly browser = inject(Browser);
  private readonly rooms = inject(RoomsStore);
  private readonly messages = inject(MessagesStore);
  private readonly presence = inject(PresenceStore);
  private readonly typing = inject(TypingStore);
  private readonly notifier = inject(Notifier);

  private readonly cleanups: (() => void)[] = [];
  private readonly roomWatches = new Map<RoomId, () => void>();
  private readonly typingSentAt = new Map<RoomId, number>();

  readonly connection = this.realtime.state;

  constructor() {
    // Un abonnement par canal écouté, ajusté quand on rejoint, quitte ou prévisualise un canal.
    effect(() => {
      const ids = this.rooms.trackedIds();
      untracked(() => {
        this.syncRoomWatches(ids);
      });
    });
    // Ouvrir un canal charge son historique.
    effect(() => {
      const id = this.rooms.active()?.id;
      if (id) {
        untracked(() => {
          this.messages.ensureLoaded(id);
        });
      }
    });
    // Canal affiché dans un onglet visible : il est lu jusqu'à son dernier message.
    effect(() => {
      const room = this.rooms.active();
      const lastId = room ? this.messages.lastConfirmedId(room.id) : null;
      if (room?.joined && lastId !== null && this.browser.visible()) {
        untracked(() => {
          this.rooms.markRead(room.id, lastId);
        });
      }
    });
    // Après une coupure : rattraper ce qui est passé pendant l'absence.
    effect(() => {
      if (this.realtime.connections() > 1) {
        untracked(() => {
          this.rooms.load();
          this.messages.refreshLoaded();
        });
      }
    });
    inject(DestroyRef).onDestroy(() => {
      this.stop();
    });
  }

  start(): void {
    const token = this.session.token();
    if (!token) {
      return;
    }
    // Ordre voulu : le topic de présence avant l'instantané, pour ne manquer aucun mouvement.
    this.cleanups.push(
      this.realtime.watch<PresenceEvent>('/topic/presence', (event) => {
        this.presence.apply(event.user);
      }),
      this.realtime.watch<UserView[]>('/app/presence', (users) => {
        this.presence.reset(users);
      }),
      this.realtime.watch<RoomView>('/topic/rooms', (room) => {
        this.rooms.add(room);
      }),
      this.realtime.watch<MentionNotice>('/user/queue/mentions', (notice) => {
        this.notifier.mention(notice, this.isReading(notice.message.roomId));
      }),
      this.realtime.watch<ChatError>('/user/queue/errors', (error) => {
        this.onError(error);
      }),
    );
    this.realtime.connect(token, (reason) => {
      this.onRejected(reason);
    });
    this.rooms.load();
  }

  send(roomId: RoomId, content: string): void {
    const me = this.session.me();
    if (me) {
      this.typingSentAt.delete(roomId);
      this.messages.send(roomId, content, me);
    }
  }

  notifyTyping(roomId: RoomId): void {
    const now = Date.now();
    if (now - (this.typingSentAt.get(roomId) ?? 0) >= TYPING_THROTTLE_MS) {
      this.typingSentAt.set(roomId, now);
      this.realtime.publish(`/app/rooms/${roomId}/typing`, {});
    }
  }

  private onRoomEvent(event: RoomEvent): void {
    const me = this.session.me();
    switch (event.type) {
      case 'message': {
        const { message } = event;
        this.messages.receive(message);
        this.typing.remove(event.roomId, message.author.id);
        this.rooms.receive(message, {
          mine: message.author.id === me?.id,
          mentionsMe: me !== null && mentions(message.content, me.nickname),
          reading: this.isReading(event.roomId),
        });
        break;
      }
      case 'typing':
        if (event.user.id !== me?.id) {
          this.typing.add(event.roomId, event.user);
        }
        break;
      case 'member':
        this.rooms.memberMoved(event.roomId, event.joined, event.user.id === me?.id);
        break;
    }
  }

  private isReading(roomId: RoomId): boolean {
    return this.rooms.active()?.id === roomId && this.browser.visible();
  }

  private syncRoomWatches(ids: readonly RoomId[]): void {
    const wanted = new Set(ids);
    for (const [id, unwatch] of this.roomWatches) {
      if (!wanted.has(id)) {
        unwatch();
        this.roomWatches.delete(id);
      }
    }
    for (const id of wanted) {
      if (!this.roomWatches.has(id)) {
        this.roomWatches.set(
          id,
          this.realtime.watch<RoomEvent>(`/topic/rooms/${id}`, (event) => {
            this.onRoomEvent(event);
          }),
        );
      }
    }
  }

  private onError(error: ChatError): void {
    if (error.clientId) {
      this.messages.fail(error.clientId, error.detail);
    } else {
      this.notifier.error(error.detail);
    }
  }

  /** CONNECT refusé : si le jeton est vraiment mort, l'intercepteur fait expirer la session (retour connexion). */
  private onRejected(reason: string): void {
    this.api.me().subscribe({
      error: (err: unknown) => {
        if (toProblem(err).status === 401) {
          this.stop();
        } else {
          this.notifier.error(reason);
        }
      },
    });
  }

  private stop(): void {
    this.cleanups.splice(0).forEach((unwatch) => {
      unwatch();
    });
    for (const unwatch of this.roomWatches.values()) {
      unwatch();
    }
    this.roomWatches.clear();
    this.realtime.disconnect();
    this.typing.clear();
  }
}
