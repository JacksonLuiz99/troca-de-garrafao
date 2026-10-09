# Troca de Galão de Água

Frontend em Angular + Tailwind CSS que alimenta a
[planilha da escala](https://docs.google.com/spreadsheets/d/1em8uTMIB12SS_ojbmZtaQJOnJzqienVK0lnDsBv9Vvw/edit?gid=0#gid=0)
através de um Google Apps Script.

- **Troca**: mostra quem é o próximo e registra a troca (status `Concluído` + data; o seguinte vira `Próximo`; no fim da lista o ciclo recomeça).
- **Administrador**: cadastra e remove responsáveis mediante justificativa e observação. Quem é removido continua na planilha com status `Removido` e é pulado na fila.

## 1. Publicar o Apps Script

1. Na planilha: **Extensões > Apps Script**.
2. Substitua o conteúdo de `Código.gs` pelo de [`apps-script/Code.gs`](apps-script/Code.gs) e salve.
3. **Implantar > Nova implantação > App da Web**
   - Executar como: **Eu**
   - Quem pode acessar: **Qualquer pessoa**
4. Autorize o acesso e copie a URL que termina em `/exec`.
5. Cole a URL em `APPS_SCRIPT_URL` no arquivo [`src/app/config.ts`](src/app/config.ts).

Ao alterar o script depois, use **Implantar > Gerenciar implantações > Editar > Nova versão** para manter a mesma URL.

## 2. Rodar localmente

```bash
npm install
npm start
```

## 3. Deploy no GitHub Pages

```bash
npm run deploy
```

O comando compila o projeto e publica `dist/troca-de-garrafao/browser` na branch `gh-pages`
do repositório (`origin`). No GitHub, deixe **Settings > Pages** apontando para a branch `gh-pages`.

As rotas usam hash (`/#/admin`) e o `base href` é relativo, então o site funciona em qualquer
caminho do Pages sem configuração extra.
