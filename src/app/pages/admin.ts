import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { EscalaService, Responsavel } from '../escala.service';
import { StatusBadge } from '../status-badge';

const CAMPO =
  'w-full rounded-lg border border-slate-300 bg-white p-2.5 text-slate-900 placeholder:text-slate-400 focus:border-sky-500 focus:outline-2 focus:outline-sky-200';

@Component({
  selector: 'app-admin',
  imports: [FormsModule, StatusBadge],
  template: `
    @if (sucesso()) {
      <p class="mb-4 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800 ring-1 ring-emerald-200" role="status">
        {{ sucesso() }}
      </p>
    }

    <section class="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
      <h2 class="text-lg font-semibold text-slate-800">Cadastrar responsável</h2>
      <p class="mt-1 text-sm text-slate-500">O novo responsável entra no fim da escala.</p>

      <form class="mt-4 grid gap-4 sm:grid-cols-2" (ngSubmit)="adicionar()">
        <div class="sm:col-span-2">
          <label class="mb-1 block text-sm font-medium text-slate-700" for="novo-nome">Nome</label>
          <input id="novo-nome" name="nome" [class]="campo" [(ngModel)]="nome" required />
        </div>
        <div>
          <label class="mb-1 block text-sm font-medium text-slate-700" for="novo-just">Justificativa</label>
          <textarea id="novo-just" name="justificativa" rows="2" [class]="campo" [(ngModel)]="justificativa" required></textarea>
        </div>
        <div>
          <label class="mb-1 block text-sm font-medium text-slate-700" for="novo-obs">Observação (opcional)</label>
          <textarea id="novo-obs" name="observacao" rows="2" [class]="campo" [(ngModel)]="observacao"></textarea>
        </div>
        <div class="sm:col-span-2">
          <button
            type="submit"
            class="rounded-lg bg-sky-600 px-5 py-2.5 font-semibold text-white shadow-sm hover:bg-sky-700 disabled:opacity-50"
            [disabled]="escala.salvando() || !nome().trim() || !justificativa().trim()"
          >
            {{ escala.salvando() && !removendo() ? 'Salvando…' : 'Cadastrar' }}
          </button>
        </div>
      </form>
    </section>

    <section class="mt-6 overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
      <h2 class="border-b border-slate-200 px-5 py-4 text-lg font-semibold text-slate-800">Responsáveis ativos</h2>
      @if (escala.carregando() && !escala.responsaveis().length) {
        <p class="p-5 text-slate-500">Carregando escala…</p>
      }
      <ul class="divide-y divide-slate-100">
        @for (r of escala.ativos(); track r.linha) {
          <li class="px-5 py-3">
            <div class="flex items-center gap-4">
              <span class="w-6 text-right text-sm font-semibold text-slate-400">{{ r.ordem }}</span>
              <p class="min-w-0 flex-1 truncate font-medium text-slate-800">{{ r.nome }}</p>
              <app-status-badge [status]="r.status" />
              <button
                type="button"
                class="rounded-lg px-3 py-1.5 text-sm font-medium text-rose-700 ring-1 ring-rose-200 hover:bg-rose-50"
                (click)="abrirRemocao(r)"
              >
                Remover
              </button>
            </div>

            @if (removendo()?.linha === r.linha) {
              <form class="mt-3 grid gap-3 rounded-xl bg-rose-50 p-4 sm:grid-cols-2" (ngSubmit)="remover(r)">
                <div>
                  <label class="mb-1 block text-sm font-medium text-slate-700" [for]="'just-' + r.linha">Justificativa</label>
                  <textarea [id]="'just-' + r.linha" name="justRemocao" rows="2" [class]="campo" [(ngModel)]="justRemocao" required></textarea>
                </div>
                <div>
                  <label class="mb-1 block text-sm font-medium text-slate-700" [for]="'obs-' + r.linha">Observação (opcional)</label>
                  <textarea [id]="'obs-' + r.linha" name="obsRemocao" rows="2" [class]="campo" [(ngModel)]="obsRemocao"></textarea>
                </div>
                <div class="flex flex-wrap gap-3 sm:col-span-2">
                  <button
                    type="submit"
                    class="rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700 disabled:opacity-50"
                    [disabled]="escala.salvando() || !justRemocao().trim()"
                  >
                    {{ escala.salvando() ? 'Removendo…' : 'Confirmar remoção de ' + r.nome }}
                  </button>
                  <button
                    type="button"
                    class="rounded-lg px-4 py-2 text-sm font-semibold text-slate-700 ring-1 ring-slate-300 hover:bg-white"
                    [disabled]="escala.salvando()"
                    (click)="removendo.set(null)"
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            }
          </li>
        }
      </ul>
    </section>

    @if (escala.removidos().length) {
      <section class="mt-6 overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
        <h2 class="border-b border-slate-200 px-5 py-4 text-lg font-semibold text-slate-800">Removidos</h2>
        <ul class="divide-y divide-slate-100">
          @for (r of escala.removidos(); track r.linha) {
            <li class="px-5 py-3">
              <p class="font-medium text-slate-500 line-through">{{ r.nome }}</p>
              <p class="mt-0.5 text-sm text-slate-500">{{ r.observacoes }}</p>
            </li>
          }
        </ul>
      </section>
    }
  `,
})
export class Admin {
  protected readonly escala = inject(EscalaService);
  protected readonly campo = CAMPO;

  protected readonly nome = signal('');
  protected readonly justificativa = signal('');
  protected readonly observacao = signal('');

  protected readonly removendo = signal<Responsavel | null>(null);
  protected readonly justRemocao = signal('');
  protected readonly obsRemocao = signal('');

  protected readonly sucesso = signal('');

  protected async adicionar(): Promise<void> {
    const nome = this.nome().trim();
    this.sucesso.set('');
    this.removendo.set(null);
    if (await this.escala.adicionar(nome, this.justificativa().trim(), this.observacao().trim())) {
      this.sucesso.set(`${nome} foi adicionado à escala.`);
      this.nome.set('');
      this.justificativa.set('');
      this.observacao.set('');
    }
  }

  protected abrirRemocao(responsavel: Responsavel): void {
    this.removendo.set(responsavel);
    this.justRemocao.set('');
    this.obsRemocao.set('');
  }

  protected async remover(responsavel: Responsavel): Promise<void> {
    this.sucesso.set('');
    if (
      await this.escala.remover(responsavel, this.justRemocao().trim(), this.obsRemocao().trim())
    ) {
      this.sucesso.set(`${responsavel.nome} foi removido da escala.`);
      this.removendo.set(null);
    }
  }
}
