import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { EscalaService, STATUS } from '../escala.service';
import { StatusBadge } from '../status-badge';

@Component({
  selector: 'app-troca',
  imports: [FormsModule, StatusBadge],
  template: `
    @if (escala.proximo(); as proximo) {
      <section class="rounded-2xl bg-gradient-to-br from-sky-500 to-cyan-600 p-6 text-white shadow-lg">
        <p class="text-sm font-medium uppercase tracking-wide text-sky-100">Próximo a trocar</p>
        <p class="mt-1 text-4xl font-bold">{{ proximo.nome }}</p>
        <p class="mt-1 text-sm text-sky-100">Posição {{ proximo.ordem }} da escala</p>

        @if (confirmando()) {
          <div class="mt-5 space-y-3">
            <label class="block text-sm font-medium" for="obs-troca">Observação (opcional)</label>
            <textarea
              id="obs-troca"
              rows="2"
              class="w-full rounded-lg border-0 bg-white/95 p-3 text-slate-900 placeholder:text-slate-400 focus:outline-2 focus:outline-white"
              placeholder="Ex.: galão veio com lacre violado"
              [(ngModel)]="observacao"
            ></textarea>
            <div class="flex flex-wrap gap-3">
              <button
                type="button"
                class="rounded-lg bg-white px-5 py-2.5 font-semibold text-sky-700 shadow hover:bg-sky-50 disabled:opacity-60"
                [disabled]="escala.salvando()"
                (click)="confirmar(proximo.nome)"
              >
                {{ escala.salvando() ? 'Salvando…' : 'Confirmar troca' }}
              </button>
              <button
                type="button"
                class="rounded-lg px-5 py-2.5 font-semibold text-white ring-1 ring-white/60 hover:bg-white/10"
                [disabled]="escala.salvando()"
                (click)="confirmando.set(false)"
              >
                Cancelar
              </button>
            </div>
          </div>
        } @else {
          <button
            type="button"
            class="mt-5 rounded-lg bg-white px-5 py-2.5 font-semibold text-sky-700 shadow hover:bg-sky-50"
            (click)="confirmando.set(true)"
          >
            Registrar troca do galão
          </button>
        }
      </section>
    } @else if (!escala.carregando() && escala.configurado && !escala.erro()) {
      <p class="rounded-xl bg-white p-6 text-slate-600 shadow-sm">
        Nenhum responsável ativo na escala. Cadastre alguém na aba Administrador.
      </p>
    }

    @if (sucesso()) {
      <p class="mt-4 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800 ring-1 ring-emerald-200" role="status">
        {{ sucesso() }}
      </p>
    }

    <section class="mt-6 overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
      <h2 class="border-b border-slate-200 px-5 py-4 text-lg font-semibold text-slate-800">Escala</h2>
      @if (escala.carregando() && !escala.responsaveis().length) {
        <p class="p-5 text-slate-500">Carregando escala…</p>
      } @else {
        <ul class="divide-y divide-slate-100">
          @for (r of escala.ativos(); track r.linha) {
            <li class="flex items-center gap-4 px-5 py-3" [class.bg-sky-50]="r.status === status.proximo">
              <span class="w-6 text-right text-sm font-semibold text-slate-400">{{ r.ordem }}</span>
              <div class="min-w-0 flex-1">
                <p class="truncate font-medium text-slate-800">{{ r.nome }}</p>
                @if (r.dataUltimaTroca) {
                  <p class="text-xs text-slate-500">Última troca: {{ r.dataUltimaTroca }}</p>
                }
              </div>
              <app-status-badge [status]="r.status" />
            </li>
          }
        </ul>
      }
    </section>
  `,
})
export class Troca {
  protected readonly escala = inject(EscalaService);
  protected readonly status = STATUS;
  protected readonly confirmando = signal(false);
  protected readonly observacao = signal('');
  protected readonly sucesso = signal('');

  protected async confirmar(nome: string): Promise<void> {
    this.sucesso.set('');
    if (await this.escala.registrarTroca(nome, this.observacao().trim())) {
      this.sucesso.set(`Troca de ${nome} registrada na planilha.`);
      this.observacao.set('');
    }
    this.confirmando.set(false);
  }
}
