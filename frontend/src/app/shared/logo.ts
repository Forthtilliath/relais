import { Component, input } from '@angular/core';

/** Le voyant de Relais et ses ondes, qui pulsent doucement quand la liaison est établie. */
@Component({
  selector: 'app-logo',
  template: `
    <span class="logo" [class.logo--live]="live()">
      <svg class="logo__mark" viewBox="0 0 40 40" aria-hidden="true">
        <path
          class="logo__wave logo__wave--outer"
          d="M7 8a17 17 0 0 0 0 24M33 8a17 17 0 0 1 0 24"
        />
        <path class="logo__wave" d="M12.5 13a10 10 0 0 0 0 14M27.5 13a10 10 0 0 1 0 14" />
        <circle class="logo__bulb" cx="20" cy="20" r="5.5" />
      </svg>
      <span class="logo__word display">Relais</span>
    </span>
  `,
  styles: `
    .logo {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
    }
    .logo__mark {
      width: 2rem;
      height: 2rem;
    }
    .logo__bulb {
      fill: var(--signal);
      filter: drop-shadow(0 0 5px var(--signal-glow));
    }
    .logo__wave {
      fill: none;
      stroke: var(--signal);
      stroke-width: 2.6;
      stroke-linecap: round;
      opacity: 0.6;
    }
    .logo__wave--outer {
      opacity: 0.3;
    }
    .logo--live .logo__wave {
      animation: emit 2.6s var(--ease-out) infinite;
    }
    .logo--live .logo__wave--outer {
      animation-delay: 0.35s;
    }
    .logo__word {
      font-size: 1.5rem;
      font-variation-settings: 'wdth' 78;
    }
    @keyframes emit {
      0%,
      100% {
        opacity: 0.2;
      }
      30% {
        opacity: 0.85;
      }
    }
  `,
})
export class Logo {
  readonly live = input(false);
}
