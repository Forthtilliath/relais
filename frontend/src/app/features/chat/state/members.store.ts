import { httpResource } from '@angular/common/http';
import { computed, effect, inject, Injectable, untracked } from '@angular/core';

import type { UserView } from '../../../core/models';

import { PresenceStore } from './presence.store';
import { RoomsStore } from './rooms.store';

/** Membres du canal affiché (panneau « À l'écoute » et suggestions de mentions), présence en direct. */
@Injectable()
export class MembersStore {
  private readonly rooms = inject(RoomsStore);
  private readonly presence = inject(PresenceStore);

  private readonly resource = httpResource<UserView[]>(
    () => {
      const id = this.rooms.active()?.id;
      return id ? `/api/rooms/${id}/members` : undefined;
    },
    { defaultValue: [] },
  );

  readonly loading = this.resource.isLoading;
  readonly members = computed(() => {
    const ready = this.presence.ready();
    const online = this.presence.onlineIds();
    return this.resource
      .value()
      .map((user) => ({
        ...user,
        online: ready ? online.has(user.id) : user.online,
        lastSeenAt: this.presence.lastSeenOf(user.id) ?? user.lastSeenAt,
      }))
      .sort((a, b) => Number(b.online) - Number(a.online) || a.nickname.localeCompare(b.nickname));
  });
  readonly onlineCount = computed(() => this.members().filter((m) => m.online).length);

  constructor() {
    // La liste chargée fait foi : le compteur d'un canal qu'on n'écoutait pas peut être en retard.
    effect(() => {
      const room = this.rooms.active();
      if (room && this.resource.status() === 'resolved') {
        const count = this.resource.value().length;
        if (count !== room.memberCount) {
          untracked(() => {
            this.rooms.setMemberCount(room.id, count);
          });
        }
      }
    });
    effect(() => {
      if (this.rooms.memberChanges() > 0) {
        untracked(() => {
          this.resource.reload();
        });
      }
    });
  }
}
