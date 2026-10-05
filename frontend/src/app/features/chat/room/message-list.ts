import {
  afterRenderEffect,
  Component,
  computed,
  type ElementRef,
  inject,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';

import { Browser } from '../../../core/browser';
import type { ChatMessage, RoomId, UserId, UserView } from '../../../core/models';
import { buildTimeline, type TimelineItem } from '../../../core/timeline';
import { Icon } from '../../../shared/icon';

import { MessageRow } from './message-row';

/** Distance au bas du fil (px) en dessous de laquelle on suit les nouveaux messages. */
const STICK_THRESHOLD = 80;
/** Distance au haut du fil (px) à partir de laquelle on charge la page précédente. */
const LOAD_OLDER_THRESHOLD = 240;

/**
 * Le fil d'un canal. Gère le défilement comme une messagerie : ouverture sur le premier non-lu, suivi du bas
 * quand on y est, pastille « nouveaux messages » sinon, et position conservée quand l'historique se charge
 * au-dessus.
 */
@Component({
  selector: 'app-message-list',
  imports: [MessageRow, Icon],
  templateUrl: './message-list.html',
  styleUrl: './message-list.css',
})
export class MessageList {
  readonly roomId = input.required<RoomId>();
  readonly roomName = input.required<string>();
  readonly topic = input<string | null>(null);
  readonly messages = input.required<ChatMessage[]>();
  readonly loading = input(false);
  readonly hasMore = input(false);
  readonly error = input<string | null>(null);
  readonly readUpTo = input<number | null>(null);
  readonly me = input.required<UserView>();
  readonly onlineIds = input.required<ReadonlySet<UserId>>();

  readonly loadOlder = output();
  readonly retry = output<string>();
  readonly discard = output<string>();
  readonly reload = output();

  private readonly browser = inject(Browser);
  private readonly viewport = viewChild.required<ElementRef<HTMLElement>>('viewport');

  protected readonly items = computed(() =>
    buildTimeline(
      this.messages(),
      { meId: this.me().id, readUpTo: this.readUpTo() },
      this.browser.now(),
    ),
  );
  /** Messages arrivés pendant qu'on lisait plus haut. */
  protected readonly unseen = signal(0);

  private stick = true;
  private renderedRoom: RoomId | null = null;
  private needsInitialScroll = true;
  private firstKey: string | undefined;
  private lastKey: string | undefined;
  /** Distance au bas mémorisée avant de charger l'historique, pour ne pas faire sauter la lecture. */
  private restoreFromBottom: number | null = null;

  constructor() {
    afterRenderEffect(() => {
      const items = this.items();
      const room = this.roomId();
      const loading = this.loading();
      const el = this.viewport().nativeElement;
      const first = messageKey(items, 'first');
      const last = messageKey(items, 'last');

      if (room !== this.renderedRoom) {
        this.renderedRoom = room;
        this.needsInitialScroll = true;
        this.restoreFromBottom = null;
        this.unseen.set(0);
      }

      if (this.needsInitialScroll && last !== undefined) {
        this.needsInitialScroll = false;
        this.stick = true;
        const divider = el.querySelector<HTMLElement>('[data-unread-divider]');
        el.scrollTop = divider ? divider.offsetTop - 48 : el.scrollHeight;
      } else if (this.restoreFromBottom !== null && first !== this.firstKey) {
        el.scrollTop = el.scrollHeight - this.restoreFromBottom;
        this.restoreFromBottom = null;
      } else if (last !== this.lastKey && this.lastKey !== undefined) {
        const mine = this.messages().at(-1)?.author.id === this.me().id;
        if (this.stick || mine) {
          el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
        } else {
          this.unseen.update((n) => n + 1);
        }
      }
      if (!loading && this.restoreFromBottom !== null && first === this.firstKey) {
        this.restoreFromBottom = null;
      }
      this.firstKey = first;
      this.lastKey = last;
    });
  }

  protected onScroll(): void {
    const el = this.viewport().nativeElement;
    this.stick = el.scrollHeight - el.scrollTop - el.clientHeight < STICK_THRESHOLD;
    if (this.stick && this.unseen()) {
      this.unseen.set(0);
    }
    const canLoad = this.hasMore() && !this.loading() && this.restoreFromBottom === null;
    if (el.scrollTop < LOAD_OLDER_THRESHOLD && canLoad && !this.needsInitialScroll) {
      this.restoreFromBottom = el.scrollHeight - el.scrollTop;
      this.loadOlder.emit();
    }
  }

  protected jumpToLatest(): void {
    const el = this.viewport().nativeElement;
    el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
    this.unseen.set(0);
  }

  protected isLit(userId: UserId): boolean {
    return this.onlineIds().has(userId);
  }
}

function messageKey(items: readonly TimelineItem[], end: 'first' | 'last'): string | undefined {
  const messages = items.filter((item) => item.kind === 'message');
  return (end === 'first' ? messages[0] : messages.at(-1))?.key;
}
