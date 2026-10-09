import { Injectable, computed, signal } from '@angular/core';
import { APPS_SCRIPT_URL } from './config';

export interface Responsavel {
  linha: number;
  ordem: number;
  nome: string;
  status: string;
  dataUltimaTroca: string;
  observacoes: string;
}

interface Resposta {
  ok: boolean;
  responsaveis?: Responsavel[];
  erro?: string;
}

export const STATUS = {
  concluido: 'Concluído',
  proximo: 'Próximo',
  pendente: 'Pendente',
  removido: 'Removido',
} as const;

@Injectable({ providedIn: 'root' })
export class EscalaService {
  readonly configurado = !!APPS_SCRIPT_URL;
  readonly responsaveis = signal<Responsavel[]>([]);
  readonly carregando = signal(false);
  readonly salvando = signal(false);
  readonly erro = signal<string | null>(null);
  readonly aviso = signal('');

  readonly ativos = computed(() => this.responsaveis().filter((r) => r.status !== STATUS.removido));
  readonly removidos = computed(() =>
    this.responsaveis().filter((r) => r.status === STATUS.removido),
  );
  readonly proximo = computed(() => {
    const fila = this.ativos();
    return (
      fila.find((r) => r.status === STATUS.proximo) ?? fila.find((r) => !r.status || r.status === STATUS.pendente) ?? fila[0] ?? null
    );
  });

  /** Ativos na ordem em que vão trocar: começa por quem é a vez e dá a volta na lista. */
  readonly fila = computed(() => {
    const ativos = this.ativos();
    const proximo = this.proximo();
    const inicio = proximo ? ativos.indexOf(proximo) : 0;
    return [...ativos.slice(inicio), ...ativos.slice(0, inicio)];
  });
  readonly ultimaTroca = computed(() => {
    let ultimo: Responsavel | null = null;
    // De trás para frente: em datas iguais vale quem está mais perto do fim da fila.
    for (const r of [...this.fila()].reverse()) {
      if (r.dataUltimaTroca && (!ultimo || dataEmMs(r) > dataEmMs(ultimo))) ultimo = r;
    }
    return ultimo;
  });

  private avisoTimer?: ReturnType<typeof setTimeout>;

  notificar(mensagem: string): void {
    clearTimeout(this.avisoTimer);
    this.aviso.set(mensagem);
    this.avisoTimer = setTimeout(() => this.aviso.set(''), 5000);
  }

  async carregar(): Promise<void> {
    if (!this.configurado) return;
    this.carregando.set(true);
    await this.chamar(() => fetch(APPS_SCRIPT_URL));
    this.carregando.set(false);
  }

  registrarTroca(nome: string, observacao: string): Promise<boolean> {
    return this.enviar({ action: 'troca', nome, observacao });
  }

  pularVez(nome: string, motivo: string): Promise<boolean> {
    return this.enviar({ action: 'pular', nome, motivo });
  }

  adicionar(nome: string, justificativa: string, observacao: string): Promise<boolean> {
    return this.enviar({ action: 'adicionar', nome, justificativa, observacao });
  }

  remover(responsavel: Responsavel, justificativa: string, observacao: string): Promise<boolean> {
    return this.enviar({
      action: 'remover',
      linha: responsavel.linha,
      nome: responsavel.nome,
      justificativa,
      observacao,
    });
  }

  private async enviar(corpo: Record<string, unknown>): Promise<boolean> {
    this.salvando.set(true);
    // text/plain evita o preflight de CORS, que o Apps Script não responde.
    const ok = await this.chamar(() =>
      fetch(APPS_SCRIPT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(corpo),
      }),
    );
    this.salvando.set(false);
    return ok;
  }

  private async chamar(requisicao: () => Promise<Response>): Promise<boolean> {
    this.erro.set(null);
    try {
      const resposta: Resposta = await (await requisicao()).json();
      if (!resposta.ok) throw new Error(resposta.erro ?? 'Erro desconhecido.');
      this.responsaveis.set(resposta.responsaveis ?? []);
      return true;
    } catch (e) {
      this.erro.set(
        e instanceof Error && !(e instanceof TypeError || e instanceof SyntaxError)
          ? e.message
          : 'Não foi possível falar com a planilha. Verifique a publicação do Apps Script.',
      );
      return false;
    }
  }
}

function dataEmMs(responsavel: Responsavel): number {
  const [dia, mes, ano] = responsavel.dataUltimaTroca.split('/').map(Number);
  return new Date(ano, mes - 1, dia).getTime();
}
