import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import type { Observable } from 'rxjs';

import type {
  ApiProblem,
  LampColor,
  MessageView,
  RoomId,
  RoomView,
  SessionResponse,
  UserView,
} from './models';

/** Partie REST de l'API (le jeton est ajouté par authInterceptor). L'envoi passe par STOMP. */
@Injectable({ providedIn: 'root' })
export class ChatApi {
  private readonly http = inject(HttpClient);

  openSession(
    nickname: string,
    color: LampColor,
    token: string | null,
  ): Observable<SessionResponse> {
    const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};
    return this.http.post<SessionResponse>('/api/session', { nickname, color }, { headers });
  }

  me(): Observable<UserView> {
    return this.http.get<UserView>('/api/session');
  }

  closeSession(): Observable<unknown> {
    return this.http.delete('/api/session');
  }

  rooms(): Observable<RoomView[]> {
    return this.http.get<RoomView[]>('/api/rooms');
  }

  createRoom(name: string, topic: string): Observable<RoomView> {
    return this.http.post<RoomView>('/api/rooms', { name, topic });
  }

  join(id: RoomId): Observable<unknown> {
    return this.http.post(`/api/rooms/${id}/join`, null);
  }

  leave(id: RoomId): Observable<unknown> {
    return this.http.post(`/api/rooms/${id}/leave`, null);
  }

  markRead(id: RoomId, messageId: number): Observable<unknown> {
    return this.http.post(`/api/rooms/${id}/read`, { messageId });
  }

  history(id: RoomId, before?: number): Observable<MessageView[]> {
    const params: Record<string, number> = before === undefined ? {} : { before };
    return this.http.get<MessageView[]>(`/api/rooms/${id}/messages`, { params });
  }
}

/** Extrait le ProblemDetail d'une erreur HTTP, avec un message de repli lisible. */
export function toProblem(error: unknown): ApiProblem {
  if (error instanceof HttpErrorResponse) {
    if (error.status === 0) {
      return { status: 0, detail: 'Relais est injoignable : le backend est-il démarré ?' };
    }
    const body = error.error as Partial<ApiProblem> | null;
    return {
      status: error.status,
      detail: body?.detail ?? error.message,
      ...(body?.errors ? { errors: body.errors } : {}),
    };
  }
  return { status: -1, detail: 'Erreur inattendue.' };
}
