import { Injectable, signal } from '@angular/core';

import type { RoomId, UserId, UserRef } from '../../../core/models';

/** Un « … écrit » s'éteint s'il n'est pas renouvelé (le client émetteur en renvoie un toutes les 2,5 s). */
export const TYPING_TTL_MS = 4_000;
const SWEEP_EVERY_MS = 1_000;

interface Typer {
  user: UserRef;
  until: number;
}

/** Qui écrit dans quel canal. Éphémère : rien n'est demandé au serveur, tout expire tout seul. */
@Injectable()
export class TypingStore {
  private readonly entries = signal<Partial<Record<RoomId, readonly Typer[]>>>({});
  private sweepTimer: ReturnType<typeof setTimeout> | null = null;

  typers(roomId: RoomId | null | undefined): UserRef[] {
    return roomId ? (this.entries()[roomId] ?? []).map((t) => t.user) : [];
  }

  add(roomId: RoomId, user: UserRef, now = Date.now()): void {
    this.entries.update((all) => ({
      ...all,
      [roomId]: [
        ...(all[roomId] ?? []).filter((t) => t.user.id !== user.id),
        { user, until: now + TYPING_TTL_MS },
      ],
    }));
    this.scheduleSweep();
  }

  /** Son message vient d'arriver : inutile d'attendre l'expiration. */
  remove(roomId: RoomId, userId: UserId): void {
    const typers = this.entries()[roomId];
    if (typers?.some((t) => t.user.id === userId)) {
      this.entries.update((all) => ({
        ...all,
        [roomId]: typers.filter((t) => t.user.id !== userId),
      }));
    }
  }

  sweep(now = Date.now()): void {
    let remaining = 0;
    this.entries.update((all) => {
      const next: Partial<Record<RoomId, readonly Typer[]>> = {};
      for (const [roomId, typers] of Object.entries(all)) {
        const alive = (typers ?? []).filter((t) => t.until > now);
        remaining += alive.length;
        if (alive.length) {
          next[roomId as RoomId] = alive;
        }
      }
      return next;
    });
    if (remaining) {
      this.scheduleSweep();
    }
  }

  clear(): void {
    if (this.sweepTimer) {
      clearTimeout(this.sweepTimer);
      this.sweepTimer = null;
    }
    this.entries.set({});
  }

  private scheduleSweep(): void {
    this.sweepTimer ??= setTimeout(() => {
      this.sweepTimer = null;
      this.sweep();
    }, SWEEP_EVERY_MS);
  }
}
