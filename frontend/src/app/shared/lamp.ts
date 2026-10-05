import { Component, computed, input } from '@angular/core';

import type { LampColor } from '../core/models';

/**
 * Voyant d'un utilisateur, qui lui sert d'avatar : une ampoule de sa couleur, allumée s'il est en ligne,
 * éteinte (verre sombre, sans halo) sinon.
 */
@Component({
  selector: 'app-lamp',
  template: `<span
    class="lamp"
    [attr.data-lamp]="color()"
    [class.lamp--off]="!lit()"
    [style.--size.px]="size()"
    aria-hidden="true"
    >{{ initial() }}</span
  >`,
  styles: `
    :host {
      display: inline-flex;
      flex: none;
    }
    .lamp {
      --size: 36px;
      display: grid;
      place-items: center;
      width: var(--size);
      height: var(--size);
      border-radius: 50%;
      background:
        radial-gradient(circle at 35% 30%, rgb(255 255 255 / 0.55), transparent 38%),
        radial-gradient(
          circle at 50% 55%,
          var(--lamp),
          color-mix(in oklab, var(--lamp) 55%, #000) 95%
        );
      box-shadow:
        0 0 0 1px color-mix(in oklab, var(--lamp) 60%, #000),
        0 0 calc(var(--size) * 0.45) color-mix(in oklab, var(--lamp) 45%, transparent);
      color: color-mix(in oklab, var(--lamp) 22%, #000);
      font-family: var(--font-display);
      font-size: calc(var(--size) * 0.44);
      font-weight: 800;
      line-height: 1;
      transition:
        filter 300ms,
        box-shadow 300ms;
    }
    .lamp--off {
      background:
        radial-gradient(circle at 35% 30%, rgb(255 255 255 / 0.12), transparent 40%),
        radial-gradient(
          circle at 50% 55%,
          color-mix(in oklab, var(--lamp) 28%, #1c1a16),
          #12110e 95%
        );
      box-shadow: 0 0 0 1px var(--line-strong);
      color: color-mix(in oklab, var(--lamp) 70%, var(--text-faint));
    }
  `,
})
export class Lamp {
  readonly color = input.required<LampColor>();
  readonly nickname = input.required<string>();
  readonly lit = input(true);
  readonly size = input(36);

  protected readonly initial = computed(() => this.nickname().charAt(0).toUpperCase());
}
