import { Component, inject, input, output } from '@angular/core';
import { EscalaService } from '../escala.service';

@Component({
  selector: 'app-modal',
  host: { '(document:keydown.escape)': 'fechar.emit()' },
  template: `
    <div
      class="fixed inset-0 z-40 flex items-end justify-center bg-slate-900/50 backdrop-blur-sm sm:items-center sm:p-4"
      (click)="fechar.emit()"
    >
      <div
        role="dialog"
        aria-modal="true"
        [attr.aria-label]="titulo()"
        class="max-h-[90dvh] w-full max-w-md overflow-y-auto rounded-t-3xl bg-white p-6 shadow-2xl sm:rounded-3xl"
        (click)="$event.stopPropagation()"
      >
        <h2 class="text-xl font-bold text-slate-900">{{ titulo() }}</h2>
        @if (escala.erro(); as erro) {
          <p class="mt-3 rounded-xl bg-rose-50 p-3 text-sm text-rose-800" role="alert">
            {{ erro }}
          </p>
        }
        <ng-content />
      </div>
    </div>
  `,
})
export class Modal {
  protected readonly escala = inject(EscalaService);
  readonly titulo = input.required<string>();
  readonly fechar = output<void>();
}
