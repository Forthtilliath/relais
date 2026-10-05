import {
  afterNextRender,
  Component,
  computed,
  type ElementRef,
  inject,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { Router } from '@angular/router';

import { toProblem } from '../../../core/chat-api';
import { roomNameError, toRoomName } from '../../../core/nickname';
import { Icon } from '../../../shared/icon';
import { RoomsStore } from '../state/rooms.store';

/** Création d'un canal dans un <dialog> natif (piège du focus, Échap et fond gérés par le navigateur). */
@Component({
  selector: 'app-create-room-dialog',
  imports: [Icon],
  template: `
    <dialog #dialog class="dialog" aria-labelledby="create-room-title" (close)="closed.emit()">
      <form class="dialog__form" (submit)="submit($event)" novalidate>
        <header class="dialog__head">
          <h2 class="display dialog__title" id="create-room-title">Ouvrir un canal</h2>
          <button type="button" class="icon-btn" aria-label="Fermer" (click)="close()">
            <app-icon name="close" />
          </button>
        </header>

        <div class="field">
          <label class="field__label mono" for="room-name">Nom</label>
          <div class="name">
            <span class="name__hash" aria-hidden="true">#</span>
            <input
              #nameInput
              id="room-name"
              class="input name__input"
              maxlength="32"
              spellcheck="false"
              placeholder="angular-signals"
              [value]="name()"
              (input)="editName(nameInput.value)"
              (blur)="touched.set(true)"
              [attr.aria-invalid]="!!(nameError() ?? serverError())"
              aria-describedby="room-name-help"
            />
          </div>
          @if (nameError() ?? serverError(); as message) {
            <p class="field__error" id="room-name-help" role="alert">{{ message }}</p>
          } @else {
            <p class="field__hint" id="room-name-help">
              Minuscules, chiffres et tirets — la saisie est convertie automatiquement.
            </p>
          }
        </div>

        <div class="field">
          <label class="field__label mono" for="room-topic"
            >Sujet <span class="faint">(facultatif)</span></label
          >
          <input
            #topicInput
            id="room-topic"
            class="input"
            maxlength="160"
            placeholder="De quoi parle-t-on ici ?"
            [value]="topic()"
            (input)="topic.set(topicInput.value)"
          />
        </div>

        <footer class="dialog__actions">
          <button type="button" class="btn btn--ghost" (click)="close()">Annuler</button>
          <button type="submit" class="btn btn--signal" [disabled]="saving()">
            {{ saving() ? 'Ouverture…' : 'Ouvrir le canal' }}
          </button>
        </footer>
      </form>
    </dialog>
  `,
  styles: `
    .dialog {
      width: min(28rem, calc(100vw - 2rem));
      padding: 0;
      border: 1px solid var(--line-strong);
      border-radius: calc(var(--radius) + 4px);
      background: var(--panel-raised);
      color: var(--text);
      box-shadow: 0 40px 100px -20px rgb(0 0 0 / 0.85);
    }
    .dialog::backdrop {
      background: rgb(5 4 3 / 0.7);
      backdrop-filter: blur(3px);
    }
    .dialog[open] {
      animation: rise 200ms var(--ease-out);
    }
    .dialog__form {
      display: grid;
      gap: 1.2rem;
      padding: 1.4rem;
    }
    .dialog__head {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .dialog__title {
      font-size: 1.6rem;
    }
    .dialog__actions {
      display: flex;
      justify-content: flex-end;
      gap: 0.5rem;
    }
    .name {
      position: relative;
    }
    .name__hash {
      position: absolute;
      top: 50%;
      left: 0.85rem;
      translate: 0 -50%;
      color: var(--signal);
      font-family: var(--font-mono);
    }
    .name__input {
      padding-left: 1.9rem;
      font-family: var(--font-mono);
    }
    @keyframes rise {
      from {
        opacity: 0;
        translate: 0 12px;
      }
    }
  `,
})
export class CreateRoomDialog {
  readonly closed = output();
  readonly created = output();

  private readonly rooms = inject(RoomsStore);
  private readonly router = inject(Router);
  private readonly dialog = viewChild.required<ElementRef<HTMLDialogElement>>('dialog');

  protected readonly name = signal('');
  protected readonly topic = signal('');
  protected readonly touched = signal(false);
  protected readonly saving = signal(false);
  protected readonly serverError = signal<string | null>(null);
  protected readonly nameError = computed(() =>
    this.touched() ? roomNameError(this.name()) : null,
  );

  constructor() {
    afterNextRender(() => {
      this.dialog().nativeElement.showModal();
    });
  }

  protected editName(value: string): void {
    this.name.set(toRoomName(value));
    this.serverError.set(null);
  }

  protected close(): void {
    this.dialog().nativeElement.close();
  }

  protected submit(event: Event): void {
    event.preventDefault();
    this.touched.set(true);
    const name = this.name().replace(/-+$/, '');
    if (roomNameError(name) || this.saving()) {
      return;
    }
    this.saving.set(true);
    this.rooms.create(name, this.topic().trim()).subscribe({
      next: (room) => {
        this.created.emit();
        this.close();
        void this.router.navigate(['/c', room.name]);
      },
      error: (err: unknown) => {
        const problem = toProblem(err);
        this.saving.set(false);
        this.serverError.set(problem.errors?.['name'] ?? problem.detail ?? 'Création impossible.');
      },
    });
  }
}
