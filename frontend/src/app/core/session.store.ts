import { computed, inject, Injectable, signal } from '@angular/core';
import { firstValueFrom, map, type Observable, tap } from 'rxjs';

import { ChatApi, toProblem } from './chat-api';
import type { LampColor, UserView } from './models';
import { nicknameKey } from './nickname';
import { local, perTab, readStored, writeStored } from './storage';

const SESSION_KEY = 'relais.session';
const KEYCHAIN_KEY = 'relais.keychain';
const IDENTITY_KEY = 'relais.identity';

export interface Identity {
  nickname: string;
  color: LampColor;
}

/**
 * Session de l'onglet. Le jeton actif vit dans sessionStorage : chaque onglet peut prendre un indicatif
 * différent (pratique pour se parler à soi-même pendant une démo). Un trousseau dans localStorage garde le
 * jeton de chaque indicatif utilisé sur ce navigateur, pour pouvoir le reprendre depuis un autre onglet.
 */
@Injectable({ providedIn: 'root' })
export class SessionStore {
  private readonly api = inject(ChatApi);

  readonly token = signal<string | null>(readStored(perTab, SESSION_KEY, null));
  readonly me = signal<UserView | null>(null);
  readonly isLoggedIn = computed(() => this.me() !== null);

  /** Dernier indicatif utilisé sur ce navigateur, pour pré-remplir la connexion. */
  readonly lastIdentity = readStored<Identity | null>(local, IDENTITY_KEY, null);

  login(nickname: string, color: LampColor): Observable<UserView> {
    const known = this.keychain()[nicknameKey(nickname)] ?? null;
    return this.api.openSession(nickname, color, known).pipe(
      tap(({ token, user }) => {
        this.store(token);
        this.me.set(user);
        this.remember(user.nickname, token);
        writeStored(local, IDENTITY_KEY, { nickname: user.nickname, color: user.color });
      }),
      map(({ user }) => user),
    );
  }

  /** Vérifie le jeton de l'onglet auprès du serveur. Seul un 401 l'efface : une panne réseau le conserve. */
  async restore(): Promise<boolean> {
    if (this.me()) {
      return true;
    }
    if (!this.token()) {
      return false;
    }
    try {
      this.me.set(await firstValueFrom(this.api.me()));
      return true;
    } catch (err: unknown) {
      if (toProblem(err).status === 401) {
        this.expire();
      }
      return false;
    }
  }

  /** Déconnexion volontaire : le serveur libère l'indicatif, on l'oublie aussi localement. */
  logout(): void {
    const me = this.me();
    this.api.closeSession().subscribe({ error: () => undefined });
    if (me) {
      this.remember(me.nickname, null);
    }
    this.expire();
  }

  /** Jeton refusé par le serveur (401, CONNECT STOMP rejeté) : retour à l'écran de connexion. */
  expire(): void {
    const me = this.me();
    if (me) {
      this.remember(me.nickname, null);
    }
    this.store(null);
    this.me.set(null);
  }

  private store(token: string | null): void {
    this.token.set(token);
    writeStored(perTab, SESSION_KEY, token);
  }

  private keychain(): Record<string, string> {
    return readStored<Record<string, string>>(local, KEYCHAIN_KEY, {});
  }

  private remember(nickname: string, token: string | null): void {
    const key = nicknameKey(nickname);
    const others = Object.entries(this.keychain()).filter(([known]) => known !== key);
    writeStored(
      local,
      KEYCHAIN_KEY,
      Object.fromEntries(token ? [...others, [key, token]] : others),
    );
  }
}
