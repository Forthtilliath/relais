import type { Brand } from '@forthtilliath/ts-types';

/** Miroir des records Java (dev.forthtilliath.chat.*). Dates en ISO 8601. */

export type UserId = Brand<string, 'UserId'>;
export type RoomId = Brand<string, 'RoomId'>;

export const LAMP_COLORS = ['ambre', 'corail', 'menthe', 'azur', 'lilas', 'citron'] as const;
export type LampColor = (typeof LAMP_COLORS)[number];

export interface UserRef {
  id: UserId;
  nickname: string;
  color: LampColor;
  bot: boolean;
}

export interface UserView extends UserRef {
  online: boolean;
  lastSeenAt: string | null;
}

export interface SessionResponse {
  token: string;
  user: UserView;
}

export interface MessageView {
  id: number;
  roomId: RoomId;
  author: UserRef;
  content: string;
  sentAt: string;
  /** Présent seulement sur la diffusion qui suit un envoi : identifiant provisoire choisi par le client. */
  clientId?: string;
}

export interface RoomView {
  id: RoomId;
  name: string;
  topic: string | null;
  memberCount: number;
  joined: boolean;
  unread: number;
  /** Marque-page de lecture (null hors du canal) : place le repère « nouveaux messages ». */
  lastReadMessageId: number | null;
  lastMessage: MessageView | null;
}

/** Tout ce qui passe sur /topic/rooms/{id}. */
export type RoomEvent =
  | { type: 'message'; roomId: RoomId; message: MessageView }
  | { type: 'typing'; roomId: RoomId; user: UserRef }
  | { type: 'member'; roomId: RoomId; user: UserRef; joined: boolean };

export interface PresenceEvent {
  user: UserView;
}

export interface MentionNotice {
  roomName: string;
  message: MessageView;
}

export interface ChatError {
  status: number;
  detail: string;
  clientId?: string;
}

export interface ApiProblem {
  status: number;
  detail?: string;
  errors?: Record<string, string>;
}

/** Message affiché : confirmé par le serveur, ou encore en attente / en échec (envoi optimiste). */
export type DeliveryState = 'sent' | 'pending' | 'failed';

export interface ChatMessage {
  /** Clé stable pour le rendu : l'identifiant provisoire reste la clé une fois le message confirmé. */
  key: string;
  id: number | null;
  clientId: string | null;
  roomId: RoomId;
  author: UserRef;
  content: string;
  sentAt: string;
  state: DeliveryState;
  error?: string;
}
