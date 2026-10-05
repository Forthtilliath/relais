import { isSameDay } from '@forthtilliath/ts-kit';

import { dayLabel } from './format';
import type { ChatMessage, MessageView, UserId } from './models';

/** Fenêtre pendant laquelle les messages consécutifs d'un même auteur sont regroupés sous un seul en-tête. */
const GROUP_WINDOW_MS = 5 * 60_000;

export type TimelineItem =
  | { kind: 'day'; key: string; label: string }
  | { kind: 'unread'; key: 'unread' }
  | { kind: 'message'; key: string; message: ChatMessage; continued: boolean };

export interface Reader {
  meId: UserId;
  /** Marque-page à l'ouverture du canal ; null = pas de repère « nouveaux messages ». */
  readUpTo: number | null;
}

/** Fil affiché : séparateurs de jour, repère « nouveaux messages » et regroupement par auteur. */
export function buildTimeline(
  messages: readonly ChatMessage[],
  { meId, readUpTo }: Reader,
  now: Date,
): TimelineItem[] {
  const items: TimelineItem[] = [];
  let previous: ChatMessage | null = null;
  let unreadPlaced = false;

  for (const message of messages) {
    const sentAt = new Date(message.sentAt);
    const previousAt = previous ? new Date(previous.sentAt) : null;
    const newDay = previousAt === null || !isSameDay(previousAt, sentAt);
    if (newDay) {
      items.push({ kind: 'day', key: `day-${message.key}`, label: dayLabel(sentAt, now) });
    }
    const unreadStartsHere =
      !unreadPlaced &&
      readUpTo !== null &&
      message.id !== null &&
      message.id > readUpTo &&
      message.author.id !== meId;
    if (unreadStartsHere) {
      items.push({ kind: 'unread', key: 'unread' });
      unreadPlaced = true;
    }
    const continued =
      !newDay &&
      !unreadStartsHere &&
      previous?.author.id === message.author.id &&
      sentAt.getTime() - previousAt.getTime() < GROUP_WINDOW_MS;
    items.push({ kind: 'message', key: message.key, message, continued });
    previous = message;
  }
  return items;
}

export function fromServer(message: MessageView, key = `m${message.id}`): ChatMessage {
  return {
    key,
    id: message.id,
    clientId: message.clientId ?? null,
    roomId: message.roomId,
    author: message.author,
    content: message.content,
    sentAt: message.sentAt,
    state: 'sent',
  };
}

/**
 * Message reçu en direct. Doublon (déjà reçu avant une reconnexion) : ignoré. Écho de notre propre envoi
 * ({@code clientId} connu) : remplace le message en attente en gardant sa clé, donc son élément DOM.
 */
export function mergeIncoming(list: readonly ChatMessage[], message: MessageView): ChatMessage[] {
  if (list.some((m) => m.id === message.id)) {
    return [...list];
  }
  const pending = message.clientId
    ? list.findIndex((m) => m.clientId === message.clientId && m.state !== 'sent')
    : -1;
  if (pending === -1) {
    return settle([...list, fromServer(message)]);
  }
  const next = [...list];
  next[pending] = fromServer(message, list[pending]?.key);
  return settle(next);
}

/** Page plus ancienne chargée en remontant le fil. */
export function prependOlder(
  list: readonly ChatMessage[],
  page: readonly MessageView[],
): ChatMessage[] {
  const known = new Set(list.map((m) => m.id));
  return settle([...page.filter((m) => !known.has(m.id)).map((m) => fromServer(m)), ...list]);
}

/** Dernière page rechargée après une coupure : on complète sans perdre les envois en attente. */
export function mergeLatest(
  list: readonly ChatMessage[],
  page: readonly MessageView[],
): ChatMessage[] {
  return page.reduce<ChatMessage[]>((acc, message) => mergeIncoming(acc, message), [...list]);
}

/** Messages confirmés triés par identifiant serveur, puis envois en attente ou en échec dans leur ordre. */
function settle(list: ChatMessage[]): ChatMessage[] {
  const sent = list.filter((m) => m.state === 'sent').sort((a, b) => (a.id ?? 0) - (b.id ?? 0));
  return [...sent, ...list.filter((m) => m.state !== 'sent')];
}
