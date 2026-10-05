import { Component, computed, inject, output } from '@angular/core';

import { Browser } from '../../../core/browser';
import { lastSeenLabel } from '../../../core/format';
import type { UserView } from '../../../core/models';
import { SessionStore } from '../../../core/session.store';
import { Icon } from '../../../shared/icon';
import { Lamp } from '../../../shared/lamp';
import { MembersStore } from '../state/members.store';
import { RoomsStore } from '../state/rooms.store';

/** « À l'écoute » : les membres du canal, voyants allumés en tête, dernière visite pour les autres. */
@Component({
  selector: 'app-members-panel',
  imports: [Lamp, Icon],
  template: `
    <aside class="members" [attr.aria-label]="'Membres de #' + (rooms.activeName() ?? '')">
      <header class="members__head">
        <h2 class="mono">À l’écoute</h2>
        <button
          type="button"
          class="icon-btn"
          aria-label="Masquer les membres"
          (click)="dismiss.emit()"
        >
          <app-icon name="close" />
        </button>
      </header>

      <div class="members__scroll">
        <h3 class="panel-heading mono">
          En ligne <span class="count count--live">{{ online().length }}</span>
        </h3>
        <ul class="list">
          @for (member of online(); track member.id) {
            <li class="member">
              <app-lamp [color]="member.color" [nickname]="member.nickname" [size]="28" />
              <span class="member__name" [attr.data-lamp]="member.color">{{
                member.nickname
              }}</span>
              @if (member.bot) {
                <span class="tag">bot</span>
              } @else if (member.id === meId()) {
                <span class="tag">vous</span>
              }
            </li>
          }
        </ul>

        @if (offline().length) {
          <h3 class="panel-heading mono">
            Hors ligne <span class="count">{{ offline().length }}</span>
          </h3>
          <ul class="list">
            @for (member of offline(); track member.id) {
              <li class="member member--off">
                <app-lamp
                  [color]="member.color"
                  [nickname]="member.nickname"
                  [lit]="false"
                  [size]="28"
                />
                <span class="member__text">
                  <span class="member__name">{{ member.nickname }}</span>
                  <span class="member__seen">{{ seen(member) }}</span>
                </span>
              </li>
            }
          </ul>
        }
      </div>
    </aside>
  `,
  styles: `
    :host {
      display: block;
      border-left: 1px solid var(--line);
      background: var(--panel);
    }
    .members {
      display: grid;
      grid-template-rows: auto minmax(0, 1fr);
      height: 100%;
    }
    .members__head {
      display: flex;
      align-items: center;
      justify-content: space-between;
      min-height: 4rem;
      padding: 0 0.75rem 0 1.1rem;
      border-bottom: 1px solid var(--line);
      color: var(--text-soft);
    }
    .members__scroll {
      display: grid;
      align-content: start;
      gap: 0.4rem;
      padding: 1rem 0.5rem;
      overflow-y: auto;
    }
    .panel-heading {
      min-height: 1.8rem;
    }
    .list {
      display: grid;
      gap: 0.1rem;
      margin-bottom: 0.9rem;
    }
    .count {
      color: var(--text-faint);
    }
    .count--live {
      color: var(--live);
    }
    .member {
      display: flex;
      align-items: center;
      gap: 0.65rem;
      padding: 0.35rem 0.75rem;
      border-radius: var(--radius-sm);
    }
    .member__name {
      overflow: hidden;
      color: var(--lamp);
      font-weight: 500;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .member--off .member__name {
      color: var(--text-soft);
    }
    .member__text {
      display: grid;
      min-width: 0;
      line-height: 1.25;
    }
    .member__seen {
      color: var(--text-faint);
      font-size: 0.75rem;
    }
  `,
})
export class MembersPanel {
  readonly dismiss = output();

  private readonly members = inject(MembersStore);
  private readonly browser = inject(Browser);
  private readonly session = inject(SessionStore);
  protected readonly rooms = inject(RoomsStore);
  protected readonly meId = computed(() => this.session.me()?.id);

  protected readonly online = computed(() => this.members.members().filter((m) => m.online));
  protected readonly offline = computed(() => this.members.members().filter((m) => !m.online));

  protected seen(member: UserView): string {
    return lastSeenLabel(member.lastSeenAt, this.browser.now());
  }
}
