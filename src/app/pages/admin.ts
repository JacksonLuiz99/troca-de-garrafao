import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { EscalaService, Responsavel, STATUS } from '../escala.service';
import { Avatar } from '../ui/avatar';
import { Modal } from '../ui/modal';

const CAMPO =
  'w-full rounded-xl border border-slate-300 p-3 text-slate-900 placeholder:text-slate-400 focus:border-sky-500 focus:ring-4 focus:ring-sky-100 focus:outline-none';
const ROTULO = 'mt-4 mb-1.5 block text-sm font-medium text-slate-700';

@Component({
  selector: 'app-admin',
  imports: [FormsModule, Avatar, Modal],
  template: `
    <div class="flex items-center justify-between gap-4">
      <div>
        <h2 class="text-2xl font-extrabold tracking-tight text-slate-900">Responsáveis</h2>
        <p class="text-sm text-slate-500">{{ escala.ativos().length }} na escala</p>
      </div>
      <button
        type="button"
        class="flex items-center gap-2 rounded-xl bg-sky-600 px-4 py-2.5 font-semibold text-white shadow-sm hover:bg-sky-700"
        (click)="abrirCadastro()"
      >
        <svg aria-hidden="true" viewBox="0 0 20 20" fill="currentColor" class="size-5">
          <path d="M10 4a1 1 0 0 1 1 1v4h4a1 1 0 1 1 0 2h-4v4a1 1 0 1 1-2 0v-4H5a1 1 0 1 1 0-2h4V5a1 1 0 0 1 1-1Z" />
        </svg>
        Adicionar
      </button>
    </div>

    <p class="mt-4 rounded-2xl bg-sky-50 p-4 text-sm text-sky-900">
      Para adicionar ou remover alguém é preciso informar uma justificativa. Ela fica registrada na coluna
      Observações da planilha.
    </p>

    @if (escala.carregando() && !escala.responsaveis().length) {
      <div class="mt-4 space-y-2">
        @for (i of [1, 2, 3, 4]; track i) {
          <div class="h-16 animate-pulse rounded-2xl bg-slate-200/70"></div>
        }
      </div>
    }

    <ul class="mt-4 space-y-2">
      @for (r of escala.ativos(); track r.linha) {
        <li class="flex items-center gap-3 rounded-2xl bg-white p-3 shadow-sm ring-1 ring-slate-200/70">
          <span class="w-8 text-center text-sm font-bold text-slate-400">{{ r.ordem }}</span>
          <app-avatar [nome]="r.nome" />
          <div class="min-w-0 flex-1">
            <p class="truncate font-semibold text-slate-800">{{ r.nome }}</p>
            @if (r.status === status.proximo) {
              <p class="text-xs font-medium text-sky-700">É a vez dele(a)</p>
            }
          </div>
          <button
            type="button"
            class="flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-semibold text-rose-700 hover:bg-rose-50"
            [attr.aria-label]="'Remover ' + r.nome"
            (click)="abrirRemocao(r)"
          >
            <svg aria-hidden="true" viewBox="0 0 20 20" fill="currentColor" class="size-4">
              <path
                fill-rule="evenodd"
                d="M8.75 1A1.75 1.75 0 0 0 7 2.75V4H3.5a.75.75 0 0 0 0 1.5h.55l.8 10.4A2.25 2.25 0 0 0 7.1 18h5.8a2.25 2.25 0 0 0 2.25-2.1l.8-10.4h.55a.75.75 0 0 0 0-1.5H13V2.75A1.75 1.75 0 0 0 11.25 1h-2.5ZM11.5 4V2.75a.25.25 0 0 0-.25-.25h-2.5a.25.25 0 0 0-.25.25V4h3Z"
                clip-rule="evenodd"
              />
            </svg>
            Remover
          </button>
        </li>
      }
    </ul>

    @if (escala.removidos().length) {
      <details class="mt-8 rounded-2xl bg-white shadow-sm ring-1 ring-slate-200/70">
        <summary class="cursor-pointer px-4 py-3 font-semibold text-slate-700">
          Removidos ({{ escala.removidos().length }})
        </summary>
        <ul class="divide-y divide-slate-100 border-t border-slate-100">
          @for (r of escala.removidos(); track r.linha) {
            <li class="px-4 py-3">
              <p class="font-semibold text-slate-700">{{ r.nome }}</p>
              <p class="mt-0.5 text-sm text-slate-500">{{ r.observacoes }}</p>
            </li>
          }
        </ul>
      </details>
    }

    @if (cadastrando()) {
      <app-modal titulo="Adicionar responsável" (fechar)="fechar()">
        <p class="mt-2 text-slate-600">A pessoa entra no fim da escala.</p>
        <form (ngSubmit)="adicionar()">
          <label [class]="rotulo" for="novo-nome">Nome</label>
          <input id="novo-nome" name="nome" autocomplete="off" [class]="campo" [(ngModel)]="nome" />

          <label [class]="rotulo" for="novo-just">Justificativa</label>
          <textarea
            id="novo-just"
            name="justificativa"
            rows="2"
            placeholder="Ex.: novo integrante da equipe"
            [class]="campo"
            [(ngModel)]="justificativa"
          ></textarea>

          <label [class]="rotulo" for="novo-obs">
            Observação <span class="font-normal text-slate-400">(opcional)</span>
          </label>
          <textarea id="novo-obs" name="observacao" rows="2" [class]="campo" [(ngModel)]="observacao"></textarea>

          <div class="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              class="rounded-xl px-5 py-3 font-semibold text-slate-600 hover:bg-slate-100"
              [disabled]="escala.salvando()"
              (click)="fechar()"
            >
              Cancelar
            </button>
            <button
              type="submit"
              class="rounded-xl bg-sky-600 px-5 py-3 font-semibold text-white shadow-sm hover:bg-sky-700 disabled:opacity-50"
              [disabled]="escala.salvando() || !nome().trim() || !justificativa().trim()"
            >
              {{ escala.salvando() ? 'Salvando…' : 'Adicionar à escala' }}
            </button>
          </div>
        </form>
      </app-modal>
    }

    @if (removendo(); as r) {
      <app-modal [titulo]="'Remover ' + r.nome + '?'" (fechar)="fechar()">
        <p class="mt-2 text-slate-600">
          {{ r.nome }} sai da fila de troca. A linha continua na planilha marcada como Removido.
        </p>
        <form (ngSubmit)="remover(r)">
          <label [class]="rotulo" for="rem-just">Justificativa</label>
          <textarea
            id="rem-just"
            name="justificativa"
            rows="2"
            placeholder="Ex.: mudou de setor"
            [class]="campo"
            [(ngModel)]="justificativa"
          ></textarea>

          <label [class]="rotulo" for="rem-obs">
            Observação <span class="font-normal text-slate-400">(opcional)</span>
          </label>
          <textarea id="rem-obs" name="observacao" rows="2" [class]="campo" [(ngModel)]="observacao"></textarea>

          <div class="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              class="rounded-xl px-5 py-3 font-semibold text-slate-600 hover:bg-slate-100"
              [disabled]="escala.salvando()"
              (click)="fechar()"
            >
              Cancelar
            </button>
            <button
              type="submit"
              class="rounded-xl bg-rose-600 px-5 py-3 font-semibold text-white shadow-sm hover:bg-rose-700 disabled:opacity-50"
              [disabled]="escala.salvando() || !justificativa().trim()"
            >
              {{ escala.salvando() ? 'Removendo…' : 'Remover da escala' }}
            </button>
          </div>
        </form>
      </app-modal>
    }
  `,
})
export class Admin {
  protected readonly escala = inject(EscalaService);
  protected readonly status = STATUS;
  protected readonly campo = CAMPO;
  protected readonly rotulo = ROTULO;

  protected readonly cadastrando = signal(false);
  protected readonly removendo = signal<Responsavel | null>(null);
  protected readonly nome = signal('');
  protected readonly justificativa = signal('');
  protected readonly observacao = signal('');

  protected abrirCadastro(): void {
    this.limpar();
    this.cadastrando.set(true);
  }

  protected abrirRemocao(responsavel: Responsavel): void {
    this.limpar();
    this.removendo.set(responsavel);
  }

  protected fechar(): void {
    if (this.escala.salvando()) return;
    this.cadastrando.set(false);
    this.removendo.set(null);
  }

  protected async adicionar(): Promise<void> {
    const nome = this.nome().trim();
    if (await this.escala.adicionar(nome, this.justificativa().trim(), this.observacao().trim())) {
      this.cadastrando.set(false);
      this.escala.notificar(`${nome} foi adicionado à escala.`);
    }
  }

  protected async remover(responsavel: Responsavel): Promise<void> {
    if (
      await this.escala.remover(responsavel, this.justificativa().trim(), this.observacao().trim())
    ) {
      this.removendo.set(null);
      this.escala.notificar(`${responsavel.nome} foi removido da escala.`);
    }
  }

  private limpar(): void {
    this.escala.erro.set(null);
    this.nome.set('');
    this.justificativa.set('');
    this.observacao.set('');
  }
}
