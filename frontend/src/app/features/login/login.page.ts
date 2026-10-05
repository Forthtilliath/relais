import { Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';

import { toProblem } from '../../core/chat-api';
import { LAMP_COLORS, type LampColor } from '../../core/models';
import { NICKNAME_RULE, nicknameError } from '../../core/nickname';
import { SessionStore } from '../../core/session.store';
import { Lamp } from '../../shared/lamp';
import { Logo } from '../../shared/logo';

const COLOR_LABELS: Record<LampColor, string> = {
  ambre: 'Ambre',
  corail: 'Corail',
  menthe: 'Menthe',
  azur: 'Azur',
  lilas: 'Lilas',
  citron: 'Citron',
};

@Component({
  selector: 'app-login-page',
  imports: [Logo, Lamp],
  templateUrl: './login.page.html',
  styleUrl: './login.page.css',
})
export class LoginPage {
  private readonly session = inject(SessionStore);
  private readonly router = inject(Router);

  protected readonly colors = LAMP_COLORS;
  protected readonly colorLabels = COLOR_LABELS;
  protected readonly rule = NICKNAME_RULE;

  protected readonly nickname = signal(this.session.lastIdentity?.nickname ?? '');
  protected readonly color = signal<LampColor>(
    this.session.lastIdentity?.color ??
      LAMP_COLORS[Math.floor(Math.random() * LAMP_COLORS.length)] ??
      'ambre',
  );
  protected readonly touched = signal(false);
  protected readonly submitting = signal(false);
  protected readonly serverError = signal<string | null>(null);

  protected readonly error = computed(() =>
    this.touched() ? nicknameError(this.nickname()) : null,
  );
  protected readonly preview = computed(() => this.nickname().trim() || 'vous');

  protected edit(value: string): void {
    this.nickname.set(value);
    this.serverError.set(null);
  }

  protected submit(event: Event): void {
    event.preventDefault();
    this.touched.set(true);
    if (nicknameError(this.nickname()) || this.submitting()) {
      return;
    }
    this.submitting.set(true);
    this.session.login(this.nickname().trim(), this.color()).subscribe({
      next: () => void this.router.navigateByUrl('/c/general'),
      error: (err: unknown) => {
        const problem = toProblem(err);
        this.submitting.set(false);
        this.serverError.set(
          problem.errors?.['nickname'] ?? problem.detail ?? 'Connexion impossible.',
        );
      },
    });
  }
}
