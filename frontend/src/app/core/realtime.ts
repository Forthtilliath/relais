import { Injectable, signal } from '@angular/core';

import { Client, type IMessage, type StompSubscription } from '@stomp/stompjs';

export type ConnectionState = 'idle' | 'connecting' | 'online' | 'reconnecting';

interface Watch {
  destination: string;
  handler: (body: unknown) => void;
  subscription: StompSubscription | null;
}

/**
 * Client STOMP de l'application. Les abonnements sont déclarés une fois ({@link watch}) et rétablis
 * automatiquement à chaque reconnexion : stompjs, lui, les perd quand le WebSocket tombe.
 */
@Injectable({ providedIn: 'root' })
export class Realtime {
  readonly state = signal<ConnectionState>('idle');
  /** Incrémenté à chaque connexion établie : au-delà de 1, il faut rattraper ce qui a été manqué. */
  readonly connections = signal(0);

  private client: Client | null = null;
  private readonly watches = new Map<number, Watch>();
  private nextWatchId = 0;

  /** @param onRejected appelé quand le serveur refuse la trame CONNECT (jeton invalide…) */
  connect(token: string, onRejected: (reason: string) => void): void {
    this.disconnect();
    const client = new Client({
      brokerURL: brokerUrl(),
      connectHeaders: { Authorization: `Bearer ${token}` },
      reconnectDelay: 2_000,
      heartbeatIncoming: 10_000,
      heartbeatOutgoing: 10_000,
      onConnect: () => {
        this.state.set('online');
        for (const watch of this.watches.values()) {
          this.attach(client, watch);
        }
        this.connections.update((n) => n + 1);
      },
      onWebSocketClose: () => {
        if (this.client === client) {
          this.state.set('reconnecting');
          for (const watch of this.watches.values()) {
            watch.subscription = null;
          }
        }
      },
      onStompError: (frame) => {
        onRejected(frame.headers['message'] ?? 'Connexion refusée par le serveur.');
      },
    });
    this.client = client;
    this.state.set('connecting');
    client.activate();
  }

  disconnect(): void {
    const client = this.client;
    this.client = null;
    for (const watch of this.watches.values()) {
      watch.subscription = null;
    }
    this.state.set('idle');
    void client?.deactivate();
  }

  /**
   * Abonnement durable ; renvoie la fonction de désabonnement. {@code T} est le contrat de la destination
   * (records Java miroirs dans models.ts) : le JSON reçu n'est pas revalidé, comme pour HttpClient.get<T>.
   */
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-parameters -- même contrat que HttpClient.get<T>
  watch<T>(destination: string, handler: (body: T) => void): () => void {
    const id = this.nextWatchId++;
    const watch: Watch = {
      destination,
      handler: handler as (body: unknown) => void,
      subscription: null,
    };
    this.watches.set(id, watch);
    if (this.client?.connected) {
      this.attach(this.client, watch);
    }
    return () => {
      if (this.client?.connected) {
        watch.subscription?.unsubscribe();
      }
      this.watches.delete(id);
    };
  }

  /** @returns false si la connexion est coupée (le message n'est pas parti) */
  publish(destination: string, body: unknown): boolean {
    if (!this.client?.connected) {
      return false;
    }
    this.client.publish({ destination, body: JSON.stringify(body) });
    return true;
  }

  private attach(client: Client, watch: Watch): void {
    watch.subscription = client.subscribe(watch.destination, (message: IMessage) => {
      watch.handler(JSON.parse(message.body));
    });
  }
}

function brokerUrl(): string {
  const { protocol, host } = window.location;
  return `${protocol === 'https:' ? 'wss' : 'ws'}://${host}/ws`;
}
