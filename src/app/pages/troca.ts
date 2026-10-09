import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { EscalaService } from '../escala.service';
import { Avatar } from '../ui/avatar';
import { Modal } from '../ui/modal';

@Component({
  selector: 'app-troca',
  imports: [FormsModule, Avatar, Modal],
  template: `
    @if (escala.carregando() && !escala.responsaveis().length) {
      <div class="h-64 animate-pulse rounded-3xl bg-sky-200/60"></div>
      <div class="mt-8 space-y-3">
        @for (i of [1, 2, 3, 4]; track i) {
          <div class="h-16 animate-pulse rounded-2xl bg-slate-200/70"></div>
        }
      </div>
    } @else if (escala.proximo(); as proximo) {
      <section
        class="relative overflow-hidden rounded-3xl bg-linear-to-br from-sky-500 to-blue-700 p-6 text-white shadow-xl shadow-sky-900/20 sm:p-8"
      >
        <svg
          aria-hidden="true"
          viewBox="0 0 120 200"
          class="pointer-events-none absolute -right-4 -bottom-6 h-56 text-white/15"
          fill="currentColor"
        >
          <rect x="44" y="0" width="32" height="22" rx="5" />
          <path d="M38 26h44l22 34v118a20 20 0 0 1-20 20H36a20 20 0 0 1-20-20V60z" />
        </svg>

        <p class="text-sm font-semibold tracking-widest text-sky-100 uppercase">Agora é a vez de</p>
        <div class="mt-3 flex items-center gap-4">
          <app-avatar [nome]="proximo.nome" [grande]="true" tom="bg-white text-sky-700" />
          <p class="min-w-0 text-3xl font-extrabold tracking-tight break-words sm:text-4xl">{{ proximo.nome }}</p>
        </div>

        <p class="relative mt-4 text-sm text-sky-100">
          @if (escala.ultimaTroca(); as ultima) {
            Última troca: <strong class="font-semibold text-white">{{ ultima.nome }}</strong> em
            {{ ultima.dataUltimaTroca }}
          } @else {
            Nenhuma troca registrada ainda.
          }
        </p>

        <button
          type="button"
          class="relative mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-white px-6 py-4 text-lg font-bold text-sky-700 shadow-lg transition hover:bg-sky-50 active:scale-[0.98]"
          (click)="abrir()"
        >
          <svg aria-hidden="true" viewBox="0 0 20 20" fill="currentColor" class="size-6">
            <path
              fill-rule="evenodd"
              d="M16.7 5.3a1 1 0 0 1 0 1.4l-7.5 7.5a1 1 0 0 1-1.4 0L3.3 9.7a1 1 0 1 1 1.4-1.4l3.8 3.8 6.8-6.8a1 1 0 0 1 1.4 0Z"
              clip-rule="evenodd"
            />
          </svg>
          Troquei o galão
        </button>
        @if (seguinte(); as seguinte) {
          <p class="relative mt-3 text-center text-sm text-sky-100">
            Ao confirmar, a vez passa para {{ seguinte.nome }}.
          </p>
          <button
            type="button"
            class="relative mt-4 w-full rounded-2xl px-6 py-3 font-semibold text-white ring-1 ring-white/50 transition hover:bg-white/10"
            (click)="abrirPulo()"
          >
            {{ proximo.nome }} não pode trocar agora
          </button>
        }
      </section>

      @if (escala.fila().length > 1) {
        <section class="mt-8">
          <h2 class="px-1 text-sm font-semibold tracking-wide text-slate-500 uppercase">Depois vem</h2>
          <ol class="mt-3 space-y-2">
            @for (r of escala.fila().slice(1); track r.linha; let i = $index) {
              <li class="flex items-center gap-3 rounded-2xl bg-white p-3 shadow-sm ring-1 ring-slate-200/70">
                <span class="w-8 text-center text-sm font-bold text-slate-400">{{ i + 2 }}º</span>
                <app-avatar [nome]="r.nome" />
                <div class="min-w-0 flex-1">
                  <p class="truncate font-semibold text-slate-800">{{ r.nome }}</p>
                  <p class="text-xs text-slate-500">
                    {{ r.dataUltimaTroca ? 'Trocou em ' + r.dataUltimaTroca : 'Ainda não trocou' }}
                  </p>
                </div>
              </li>
            }
          </ol>
        </section>
      }
    } @else if (escala.configurado && !escala.erro()) {
      <div class="rounded-3xl bg-white p-8 text-center shadow-sm ring-1 ring-slate-200">
        <p class="text-lg font-semibold text-slate-800">Ninguém na escala</p>
        <p class="mt-1 text-slate-500">Cadastre os responsáveis na aba Administrador.</p>
      </div>
    }

    @if (pulando(); as nome) {
      <app-modal [titulo]="'Passar a vez de ' + nome + '?'" (fechar)="fechar()">
        <p class="mt-2 text-slate-600">
          <strong class="text-slate-900">{{ seguinte()?.nome }}</strong> assume a troca agora e
          <strong class="text-slate-900">{{ nome }}</strong> fica logo em seguida na fila.
        </p>

        <label class="mt-5 mb-1.5 block text-sm font-medium text-slate-700" for="motivo-pulo">Motivo</label>
        <textarea
          id="motivo-pulo"
          rows="2"
          class="w-full rounded-xl border border-slate-300 p-3 text-slate-900 placeholder:text-slate-400 focus:border-sky-500 focus:ring-4 focus:ring-sky-100 focus:outline-none"
          placeholder="Ex.: está de férias"
          [(ngModel)]="motivo"
        ></textarea>

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
            type="button"
            class="rounded-xl bg-sky-600 px-5 py-3 font-semibold text-white shadow-sm hover:bg-sky-700 disabled:opacity-50"
            [disabled]="escala.salvando() || !motivo().trim()"
            (click)="pular(nome)"
          >
            {{ escala.salvando() ? 'Salvando…' : 'Passar a vez' }}
          </button>
        </div>
      </app-modal>
    }

    @if (confirmando(); as nome) {
      <app-modal titulo="Confirmar troca do galão?" (fechar)="fechar()">
        <p class="mt-2 text-slate-600">
          Vamos registrar na planilha que <strong class="text-slate-900">{{ nome }}</strong> trocou o galão hoje,
          {{ hoje }}.
        </p>

        <label class="mt-5 mb-1.5 block text-sm font-medium text-slate-700" for="obs-troca">
          Observação <span class="font-normal text-slate-400">(opcional)</span>
        </label>
        <textarea
          id="obs-troca"
          rows="2"
          class="w-full rounded-xl border border-slate-300 p-3 text-slate-900 placeholder:text-slate-400 focus:border-sky-500 focus:ring-4 focus:ring-sky-100 focus:outline-none"
          placeholder="Ex.: era o último galão do estoque"
          [(ngModel)]="observacao"
        ></textarea>

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
            type="button"
            class="rounded-xl bg-sky-600 px-5 py-3 font-semibold text-white shadow-sm hover:bg-sky-700 disabled:opacity-60"
            [disabled]="escala.salvando()"
            (click)="confirmar(nome)"
          >
            {{ escala.salvando() ? 'Registrando…' : 'Sim, registrar troca' }}
          </button>
        </div>
      </app-modal>
    }
  `,
})
export class Troca {
  protected readonly escala = inject(EscalaService);
  protected readonly confirmando = signal('');
  protected readonly observacao = signal('');
  protected readonly pulando = signal('');
  protected readonly motivo = signal('');
  protected readonly hoje = new Date().toLocaleDateString('pt-BR');
  protected readonly seguinte = computed(() => this.escala.fila()[1] ?? null);

  protected abrir(): void {
    const proximo = this.escala.proximo();
    if (!proximo) return;
    this.escala.erro.set(null);
    this.observacao.set('');
    this.confirmando.set(proximo.nome);
  }

  protected abrirPulo(): void {
    const proximo = this.escala.proximo();
    if (!proximo) return;
    this.escala.erro.set(null);
    this.motivo.set('');
    this.pulando.set(proximo.nome);
  }

  protected fechar(): void {
    if (this.escala.salvando()) return;
    this.confirmando.set('');
    this.pulando.set('');
  }

  protected async pular(nome: string): Promise<void> {
    if (await this.escala.pularVez(nome, this.motivo().trim())) {
      this.pulando.set('');
      this.escala.notificar(`Agora é a vez de ${this.escala.proximo()?.nome}.`);
    }
  }

  protected async confirmar(nome: string): Promise<void> {
    if (await this.escala.registrarTroca(nome, this.observacao().trim())) {
      this.confirmando.set('');
      this.escala.notificar(`Troca de ${nome} registrada na planilha.`);
    }
  }
}
