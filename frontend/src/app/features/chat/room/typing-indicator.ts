import { Component, computed, input } from '@angular/core';

import { typingLabel } from '../../../core/format';

/** « ada écrit… » avec une petite onde d'oscilloscope ; la ligne garde sa hauteur pour ne rien faire sauter. */
@Component({
  selector: 'app-typing-indicator',
  template: `
    <p class="typing" aria-live="polite">
      @if (label(); as label) {
        <svg class="typing__wave" viewBox="0 0 36 12" aria-hidden="true">
          <path d="M0 6 Q4.5 0 9 6 T18 6 T27 6 T36 6" />
        </svg>
        <span>{{ label }}</span>
      }
    </p>
  `,
  styles: `
    .typing {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      height: 1.7rem;
      color: var(--text-soft);
      font-size: 0.8125rem;
    }
    .typing__wave {
      width: 28px;
      height: 10px;
      overflow: visible;
    }
    .typing__wave path {
      fill: none;
      stroke: var(--signal);
      stroke-width: 1.8;
      stroke-linecap: round;
      stroke-dasharray: 9 4;
      animation: travel 0.9s linear infinite;
    }
    @keyframes travel {
      to {
        stroke-dashoffset: -26;
      }
    }
  `,
})
export class TypingIndicator {
  readonly names = input.required<readonly string[]>();
  protected readonly label = computed(() => typingLabel(this.names()));
}
