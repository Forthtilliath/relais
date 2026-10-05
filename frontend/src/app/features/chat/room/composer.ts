import {
  afterRenderEffect,
  Component,
  computed,
  type ElementRef,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';

import type { UserView } from '../../../core/models';
import { Icon } from '../../../shared/icon';
import { Lamp } from '../../../shared/lamp';

const MAX_LENGTH = 2000;
const MAX_HEIGHT_PX = 200;
/** « @ab » juste avant le curseur, en début de texte ou après un séparateur (même règle que les mentions). */
const MENTION_QUERY = /(?:^|[^\w@])@([A-Za-z0-9_-]{0,24})$/;

/**
 * Zone de saisie : Entrée émet, Maj+Entrée va à la ligne, « @ » propose les membres du canal (flèches,
 * Entrée ou Tab pour choisir). Un brouillon est gardé par canal.
 */
@Component({
  selector: 'app-composer',
  imports: [Icon, Lamp],
  templateUrl: './composer.html',
  styleUrl: './composer.css',
})
export class Composer {
  readonly roomName = input.required<string>();
  readonly members = input.required<UserView[]>();
  readonly offline = input(false);
  readonly sent = output<string>();
  readonly typing = output();

  private readonly field = viewChild.required<ElementRef<HTMLTextAreaElement>>('field');
  private readonly drafts = new Map<string, string>();
  private draftRoom: string | null = null;

  protected readonly maxLength = MAX_LENGTH;
  protected readonly text = signal('');
  protected readonly query = signal<string | null>(null);
  protected readonly highlighted = signal(0);
  protected readonly suggestions = computed(() => {
    const query = this.query()?.toLowerCase();
    if (query === undefined) {
      return [];
    }
    return this.members()
      .filter((m) => m.nickname.toLowerCase().startsWith(query))
      .slice(0, 6);
  });
  protected readonly remaining = computed(() => MAX_LENGTH - this.text().length);
  protected readonly canSend = computed(
    () => this.text().trim().length > 0 && this.remaining() >= 0 && !this.offline(),
  );

  constructor() {
    // Changement de canal : on range le brouillon courant et on ressort celui du nouveau canal.
    afterRenderEffect(() => {
      const room = this.roomName();
      if (room === this.draftRoom) {
        return;
      }
      if (this.draftRoom !== null) {
        this.drafts.set(this.draftRoom, this.field().nativeElement.value);
      }
      this.draftRoom = room;
      this.setText(this.drafts.get(room) ?? '');
      this.query.set(null);
      if (window.matchMedia('(pointer: fine)').matches) {
        this.field().nativeElement.focus();
      }
    });
  }

  protected onInput(): void {
    const el = this.field().nativeElement;
    this.text.set(el.value);
    this.autosize();
    const match = MENTION_QUERY.exec(el.value.slice(0, el.selectionStart));
    this.query.set(match?.[1] ?? null);
    this.highlighted.set(0);
    if (el.value.trim()) {
      this.typing.emit();
    }
  }

  protected onKeydown(event: KeyboardEvent): void {
    const suggestions = this.suggestions();
    if (suggestions.length) {
      const count = suggestions.length;
      if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
        event.preventDefault();
        this.highlighted.update((i) => (i + (event.key === 'ArrowDown' ? 1 : count - 1)) % count);
        return;
      }
      const choice = suggestions[this.highlighted()];
      if ((event.key === 'Enter' || event.key === 'Tab') && choice) {
        event.preventDefault();
        this.pick(choice);
        return;
      }
      if (event.key === 'Escape') {
        event.preventDefault();
        event.stopPropagation();
        this.query.set(null);
        return;
      }
    }
    if (event.key === 'Enter' && !event.shiftKey && !event.isComposing) {
      event.preventDefault();
      this.submit();
    }
  }

  protected pick(member: UserView): void {
    const el = this.field().nativeElement;
    const caret = el.selectionStart;
    const before = el.value.slice(0, caret).replace(/@[A-Za-z0-9_-]*$/, `@${member.nickname} `);
    this.setText(before + el.value.slice(caret));
    el.setSelectionRange(before.length, before.length);
    el.focus();
    this.query.set(null);
  }

  protected submit(): void {
    if (!this.canSend()) {
      return;
    }
    this.sent.emit(this.text().trim());
    this.setText('');
    this.query.set(null);
  }

  private setText(value: string): void {
    this.field().nativeElement.value = value;
    this.text.set(value);
    this.autosize();
  }

  private autosize(): void {
    const el = this.field().nativeElement;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, MAX_HEIGHT_PX)}px`;
  }
}
