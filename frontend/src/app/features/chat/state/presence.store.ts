import { computed, Injectable, signal } from '@angular/core';

import type { UserId, UserView } from '../../../core/models';

/** Qui est en ligne : instantané à l'abonnement (/app/presence), puis arrivées et départs (/topic/presence). */
@Injectable()
export class PresenceStore {
  private readonly byId = signal<ReadonlyMap<UserId, UserView>>(new Map());
  /** Dernière déconnexion observée en direct, pour « vu il y a… » sans recharger les membres. */
  private readonly lastSeen = signal<Partial<Record<UserId, string>>>({});

  /** Faux tant que l'instantané n'est pas arrivé : on se fie alors à l'état renvoyé par l'API REST. */
  readonly ready = signal(false);
  readonly online = computed(() =>
    [...this.byId().values()].sort((a, b) => a.nickname.localeCompare(b.nickname)),
  );
  readonly onlineIds = computed(() => new Set(this.byId().keys()));

  reset(users: readonly UserView[]): void {
    this.byId.set(new Map(users.map((user) => [user.id, user])));
    this.ready.set(true);
  }

  apply(user: UserView): void {
    this.byId.update((current) => {
      const next = new Map(current);
      if (user.online) {
        next.set(user.id, user);
      } else {
        next.delete(user.id);
      }
      return next;
    });
    if (!user.online && user.lastSeenAt) {
      this.lastSeen.update((seen) => ({ ...seen, [user.id]: user.lastSeenAt }));
    }
  }

  lastSeenOf(id: UserId): string | undefined {
    return this.lastSeen()[id];
  }
}
