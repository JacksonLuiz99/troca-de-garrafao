import { Component, computed, input } from '@angular/core';

const CORES = [
  'bg-sky-100 text-sky-700',
  'bg-emerald-100 text-emerald-700',
  'bg-amber-100 text-amber-700',
  'bg-violet-100 text-violet-700',
  'bg-rose-100 text-rose-700',
  'bg-teal-100 text-teal-700',
  'bg-indigo-100 text-indigo-700',
  'bg-orange-100 text-orange-700',
];

@Component({
  selector: 'app-avatar',
  template: `
    <span
      aria-hidden="true"
      class="inline-flex shrink-0 items-center justify-center rounded-full font-bold"
      [class]="cor() + (grande() ? ' size-16 text-2xl' : ' size-10 text-sm')"
    >
      {{ iniciais() }}
    </span>
  `,
})
export class Avatar {
  readonly nome = input.required<string>();
  readonly grande = input(false);
  /** Classes de cor fixas; sem isso a cor é derivada do nome. */
  readonly tom = input('');

  protected readonly iniciais = computed(() => {
    const partes = this.nome().trim().split(/\s+/);
    const iniciais = partes.length > 1 ? partes[0][0] + partes[partes.length - 1][0] : partes[0].slice(0, 2);
    return iniciais.toUpperCase();
  });

  protected readonly cor = computed(() => {
    if (this.tom()) return this.tom();
    let soma = 0;
    for (const letra of this.nome()) soma += letra.charCodeAt(0);
    return CORES[soma % CORES.length];
  });
}
