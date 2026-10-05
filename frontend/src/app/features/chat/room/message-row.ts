import { Component, computed, input, output } from '@angular/core';

import { clockTime } from '../../../core/format';
import { parseMessage } from '../../../core/message-format';
import type { ChatMessage } from '../../../core/models';
import { Icon } from '../../../shared/icon';
import { Lamp } from '../../../shared/lamp';

/**
 * Un message. Les suites d'un même auteur ({@code continued}) n'affichent ni voyant ni nom, seulement l'heure
 * au survol. Le contenu est rendu segment par segment : aucun HTML venu d'un utilisateur n'est interprété.
 */
@Component({
  selector: 'app-message-row',
  imports: [Lamp, Icon],
  templateUrl: './message-row.html',
  styleUrl: './message-row.css',
})
export class MessageRow {
  readonly message = input.required<ChatMessage>();
  readonly continued = input(false);
  readonly meNickname = input.required<string>();
  readonly lit = input(false);
  readonly retry = output();
  readonly discard = output();

  protected readonly segments = computed(() =>
    parseMessage(this.message().content, this.meNickname()),
  );
  protected readonly mentionsMe = computed(
    () =>
      this.message().author.nickname.toLowerCase() !== this.meNickname().toLowerCase() &&
      this.segments().some((s) => s.kind === 'mention' && s.self),
  );
  protected readonly time = computed(() => clockTime(this.message().sentAt));
}
