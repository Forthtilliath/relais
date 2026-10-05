import { Component, input, output } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

import type { RoomView } from '../../../core/models';

/**
 * Un canal sur le tableau : sa prise jack s'allume (ambre) s'il y a du nouveau et clignote (rouge) si
 * quelqu'un vous a mentionné.
 */
@Component({
  selector: 'app-channel-link',
  imports: [RouterLink, RouterLinkActive],
  template: `
    <a
      class="channel"
      [routerLink]="['/c', room().name]"
      routerLinkActive="channel--active"
      ariaCurrentWhenActive="page"
      [class.channel--unread]="room().unread > 0"
      (click)="picked.emit()"
    >
      <span
        class="jack"
        [class.jack--lit]="room().unread > 0"
        [class.jack--alert]="mentions() > 0"
        aria-hidden="true"
      ></span>
      <span class="channel__name"><span class="channel__hash">#</span>{{ room().name }}</span>
      @if (mentions() > 0) {
        <span class="badge badge--alert" [attr.aria-label]="mentions() + ' mention(s)'"
          >&#64;{{ mentions() }}</span
        >
      } @else if (room().unread > 0) {
        <span class="badge" [attr.aria-label]="room().unread + ' non lu(s)'">{{
          room().unread > 99 ? '99+' : room().unread
        }}</span>
      } @else if (!room().joined) {
        <span class="channel__members mono" [attr.aria-label]="room().memberCount + ' membre(s)'">{{
          room().memberCount
        }}</span>
      }
    </a>
  `,
  styles: `
    .channel {
      display: flex;
      align-items: center;
      gap: 0.65rem;
      min-height: 2.15rem;
      padding: 0.25rem 0.6rem 0.25rem 0.75rem;
      border-radius: var(--radius-sm);
      color: var(--text-soft);
      text-decoration: none;
      transition:
        background-color 120ms,
        color 120ms;
    }
    .channel:hover {
      background: var(--panel-raised);
      color: var(--text);
    }
    .channel--unread {
      color: var(--text);
      font-weight: 600;
    }
    .channel--active {
      background: var(--panel-high);
      color: var(--text);
      box-shadow: inset 2px 0 0 var(--signal);
    }
    .channel__name {
      flex: 1;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .channel__hash {
      margin-right: 0.1em;
      color: var(--text-faint);
    }
    .channel__members {
      color: var(--text-faint);
    }

    /* Prise jack : une bague, un trou sombre ; la bague s'éclaire quand le canal a du nouveau */
    .jack {
      flex: none;
      width: 12px;
      height: 12px;
      border-radius: 50%;
      background: radial-gradient(circle, #050403 32%, transparent 36%), var(--panel-high);
      box-shadow:
        inset 0 0 0 1px var(--line-strong),
        inset 0 1px 1px rgb(255 255 255 / 0.06);
      transition:
        background-color 200ms,
        box-shadow 200ms;
    }
    .jack--lit {
      background: radial-gradient(circle, #050403 32%, transparent 36%), var(--signal);
      box-shadow: 0 0 9px var(--signal-glow);
    }
    .jack--alert {
      background: radial-gradient(circle, #050403 32%, transparent 36%), var(--alert);
      animation: blink 1.6s ease-in-out infinite;
    }
    @keyframes blink {
      0%,
      100% {
        box-shadow: 0 0 4px var(--alert-glow);
      }
      50% {
        box-shadow: 0 0 14px var(--alert);
      }
    }
  `,
})
export class ChannelLink {
  readonly room = input.required<RoomView>();
  readonly mentions = input(0);
  readonly picked = output();
}
