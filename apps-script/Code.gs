/**
 * API da Escala de Troca de Galão de Água.
 *
 * Cole este arquivo em Extensões > Apps Script da planilha e publique como
 * App da Web (Executar como: Eu / Quem pode acessar: Qualquer pessoa).
 */

const GID_ABA = 0;
const CABECALHO = 'Ordem / Posição';
const COL_INICIAL = 2; // coluna B
const TOTAL_COLUNAS = 5; // B..F

const STATUS = {
  CONCLUIDO: 'Concluído',
  PROXIMO: 'Próximo',
  REMOVIDO: 'Removido',
};

function doGet() {
  return executar(function (aba) {
    return lerEscala(aba).itens;
  });
}

function doPost(e) {
  return executar(function (aba) {
    const dados = JSON.parse(e.postData.contents);
    switch (dados.action) {
      case 'troca':
        registrarTroca(aba, dados);
        break;
      case 'pular':
        pularVez(aba, dados);
        break;
      case 'adicionar':
        adicionarResponsavel(aba, dados);
        break;
      case 'remover':
        removerResponsavel(aba, dados);
        break;
      default:
        throw new Error('Ação desconhecida: ' + dados.action);
    }
    ajustarFormatacao(aba);
    SpreadsheetApp.flush();
    return lerEscala(aba).itens;
  });
}

function executar(acao) {
  const trava = LockService.getScriptLock();
  let resposta;
  try {
    trava.waitLock(20000);
    resposta = { ok: true, responsaveis: acao(obterAba()) };
  } catch (erro) {
    resposta = { ok: false, erro: String(erro.message || erro) };
  } finally {
    trava.releaseLock();
  }
  return ContentService.createTextOutput(JSON.stringify(resposta)).setMimeType(
    ContentService.MimeType.JSON,
  );
}

function obterAba() {
  const abas = SpreadsheetApp.getActiveSpreadsheet().getSheets();
  for (let i = 0; i < abas.length; i++) {
    if (abas[i].getSheetId() === GID_ABA) return abas[i];
  }
  return abas[0];
}

function lerEscala(aba) {
  const valores = aba
    .getRange(1, COL_INICIAL, aba.getLastRow(), TOTAL_COLUNAS)
    .getDisplayValues();

  let linhaCabecalho = -1;
  for (let i = 0; i < valores.length; i++) {
    if (valores[i][0].trim() === CABECALHO) {
      linhaCabecalho = i + 1;
      break;
    }
  }
  if (linhaCabecalho < 0) throw new Error('Cabeçalho "' + CABECALHO + '" não encontrado.');

  const itens = [];
  for (let i = linhaCabecalho; i < valores.length; i++) {
    const nome = valores[i][1].trim();
    if (!nome) break;
    itens.push({
      linha: i + 1,
      ordem: Number(valores[i][0]) || itens.length + 1,
      nome: nome,
      status: valores[i][2].trim(),
      dataUltimaTroca: valores[i][3].trim(),
      observacoes: valores[i][4].trim(),
    });
  }
  return { linhaCabecalho: linhaCabecalho, itens: itens };
}

/**
 * Deixa todas as linhas da escala com a aparência das duas primeiras (bordas e cores
 * alternadas) e quebra o texto das Observações, para a tabela crescer sem desalinhar.
 */
function ajustarFormatacao(aba) {
  const itens = lerEscala(aba).itens;
  if (!itens.length) return;
  const primeira = itens[0].linha;

  for (let i = 2; i < itens.length; i++) {
    aba
      .getRange(primeira + (i % 2), COL_INICIAL, 1, TOTAL_COLUNAS)
      .copyTo(
        aba.getRange(itens[i].linha, COL_INICIAL, 1, TOTAL_COLUNAS),
        SpreadsheetApp.CopyPasteType.PASTE_FORMAT,
        false,
      );
  }
  aba.getRange(primeira, COL_INICIAL + 3, itens.length, 1).setNumberFormat('dd/MM/yyyy');
  aba
    .getRange(primeira, COL_INICIAL + 4, itens.length, 1)
    .setWrapStrategy(SpreadsheetApp.WrapStrategy.WRAP)
    .setVerticalAlignment('middle');
  aba.autoResizeRows(primeira, itens.length);
}

/** Para rodar pelo editor do Apps Script quando a tabela estiver desalinhada. */
function corrigirFormatacao() {
  ajustarFormatacao(obterAba());
}

function ativos(itens) {
  return itens.filter(function (item) {
    return item.status !== STATUS.REMOVIDO;
  });
}

function definirStatus(aba, item, status) {
  aba.getRange(item.linha, COL_INICIAL + 2).setValue(status);
}

/** Passa a vez para quem vem depois de `item`; no fim da lista o ciclo recomeça. */
function passarVez(aba, fila, item) {
  const indice = fila.indexOf(item);
  const restantes = fila.filter(function (outro) {
    return outro !== item;
  });
  if (!restantes.length) return;

  if (indice < fila.length - 1) {
    definirStatus(aba, fila[indice + 1], STATUS.PROXIMO);
    return;
  }
  restantes.forEach(function (outro) {
    definirStatus(aba, outro, '');
  });
  definirStatus(aba, restantes[0], STATUS.PROXIMO);
}

function hoje() {
  return Utilities.formatDate(
    new Date(),
    SpreadsheetApp.getActiveSpreadsheet().getSpreadsheetTimeZone(),
    'dd/MM/yyyy',
  );
}

function registrarTroca(aba, dados) {
  const fila = ativos(lerEscala(aba).itens);
  if (!fila.length) throw new Error('Não há responsáveis ativos na escala.');

  const atual =
    fila.filter(function (item) {
      return item.status === STATUS.PROXIMO;
    })[0] ||
    fila.filter(function (item) {
      return !item.status;
    })[0] ||
    fila[0];

  if (dados.nome && dados.nome !== atual.nome) {
    throw new Error('A escala mudou: o próximo agora é ' + atual.nome + '. Atualize a página.');
  }

  definirStatus(aba, atual, STATUS.CONCLUIDO);
  aba
    .getRange(atual.linha, COL_INICIAL + 3)
    .setNumberFormat('dd/MM/yyyy')
    .setValue(new Date());
  const observacao = String(dados.observacao || '').trim();
  if (observacao) aba.getRange(atual.linha, COL_INICIAL + 4).setValue(observacao);

  if (fila.length === 1) {
    definirStatus(aba, atual, STATUS.PROXIMO);
    return;
  }
  if (fila.indexOf(atual) === fila.length - 1) definirStatus(aba, atual, '');
  passarVez(aba, fila, atual);
}

/**
 * Quem é a vez não pode trocar: troca de lugar na escala com a pessoa seguinte,
 * que assume a vez. O ausente fica logo depois dela.
 */
function pularVez(aba, dados) {
  const motivo = String(dados.motivo || '').trim();
  if (!motivo) throw new Error('Informe o motivo.');

  const fila = ativos(lerEscala(aba).itens);
  const atual =
    fila.filter(function (item) {
      return item.status === STATUS.PROXIMO;
    })[0] ||
    fila.filter(function (item) {
      return !item.status;
    })[0] ||
    fila[0];
  if (!atual || fila.length < 2) throw new Error('Não há outra pessoa na escala para assumir a vez.');
  if (dados.nome !== atual.nome) {
    throw new Error('A escala mudou: o próximo agora é ' + atual.nome + '. Atualize a página.');
  }

  const seguinte = fila[(fila.indexOf(atual) + 1) % fila.length];
  const observacao = 'Passou a vez em ' + hoje() + '. Motivo: ' + motivo;

  // Colunas: nome (C), status (D), data (E), observações (F). A ordem (B) não muda.
  aba
    .getRange(atual.linha, COL_INICIAL + 1, 1, 4)
    .setValues([[seguinte.nome, STATUS.PROXIMO, seguinte.dataUltimaTroca, seguinte.observacoes]]);
  aba
    .getRange(seguinte.linha, COL_INICIAL + 1, 1, 4)
    .setValues([[atual.nome, '', atual.dataUltimaTroca, observacao]]);
}

function montarObservacao(prefixo, dados) {
  const justificativa = String(dados.justificativa || '').trim();
  const observacao = String(dados.observacao || '').trim();
  if (!justificativa) throw new Error('Informe a justificativa.');
  let texto = prefixo + ' em ' + hoje() + '. Justificativa: ' + justificativa;
  if (observacao) texto += ' | Obs.: ' + observacao;
  return texto;
}

function adicionarResponsavel(aba, dados) {
  const nome = String(dados.nome || '').trim();
  if (!nome) throw new Error('Informe o nome do responsável.');
  const observacoes = montarObservacao('Incluído', dados);

  const escala = lerEscala(aba);
  const fila = ativos(escala.itens);
  const repetido = fila.some(function (item) {
    return item.nome.toLowerCase() === nome.toLowerCase();
  });
  if (repetido) throw new Error(nome + ' já está na escala.');

  const ultimaLinha = escala.itens.length
    ? escala.itens[escala.itens.length - 1].linha
    : escala.linhaCabecalho;
  const ordem =
    escala.itens.reduce(function (maior, item) {
      return Math.max(maior, item.ordem);
    }, 0) + 1;

  aba.insertRowAfter(ultimaLinha);
  aba
    .getRange(ultimaLinha + 1, COL_INICIAL, 1, TOTAL_COLUNAS)
    .setValues([[ordem, nome, fila.length ? '' : STATUS.PROXIMO, '', observacoes]]);
}

function removerResponsavel(aba, dados) {
  const observacoes = montarObservacao('Removido', dados);
  const itens = lerEscala(aba).itens;
  const item = itens.filter(function (candidato) {
    return candidato.linha === Number(dados.linha);
  })[0];

  if (!item || item.nome !== dados.nome) {
    throw new Error('A escala mudou. Atualize a página e tente novamente.');
  }
  if (item.status === STATUS.REMOVIDO) throw new Error(item.nome + ' já foi removido.');

  if (item.status === STATUS.PROXIMO) passarVez(aba, ativos(itens), item);
  definirStatus(aba, item, STATUS.REMOVIDO);
  aba.getRange(item.linha, COL_INICIAL + 4).setValue(observacoes);
}
