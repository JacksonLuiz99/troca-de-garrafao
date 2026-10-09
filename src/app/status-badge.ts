import { Component, computed, input } from '@angular/core';
import { STATUS } from './escala.service';

@Component({
  selector: 'app-status-badge',
  template: `
    <span class="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium" [class]="classes()">
      {{ status() || 'Aguardando' }}
    </span>
  `,
})
export class StatusBadge {
  readonly status = input('');

  protected readonly classes = computed(() => {
    switch (this.status()) {
      case STATUS.proximo:
        return 'bg-sky-100 text-sky-800 ring-1 ring-sky-300';
      case STATUS.concluido:
        return 'bg-emerald-100 text-emerald-800';
      case STATUS.removido:
        return 'bg-rose-100 text-rose-800';
      default:
        return 'bg-slate-100 text-slate-600';
    }
  });
}
