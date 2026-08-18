# Convite de Date

Um site interativo em formato de "date invitation" — feito em HTML, CSS e JavaScript puros. **Sem React, sem Vite, sem npm, sem build.** Só abrir e funciona.

## Como abrir

Qualquer uma dessas opções funciona, sem instalar nada:

- **Duplo clique** no arquivo `index.html`. Abre direto no navegador.
- **VS Code + Live Server**: clique com o botão direito em `index.html` → "Open with Live Server".
- Arrastar a pasta inteira pra qualquer hospedagem estática (Netlify, Vercel, GitHub Pages) — não precisa rodar nenhum comando de build antes, os arquivos já estão prontos como estão.

## Onde está o Formspree

Abra o arquivo `app.js` e veja as primeiras linhas:

```js
const FORMSPREE_ENDPOINT = "https://formspree.io/f/xjybegdk";
```

Esse já é o endpoint configurado. Se precisar trocar por outro no futuro, é só substituir esse valor.

## Deploy

Como não tem build nenhum, publicar é o mais simples possível:

**Netlify (arrastar e soltar):**
1. Acesse [app.netlify.com/drop](https://app.netlify.com/drop)
2. Arraste a pasta inteira do projeto (com `index.html`, `styles.css`, `app.js`) pra dentro da página.

**Netlify ou Vercel conectado ao GitHub (atualiza automaticamente a cada push):**
1. Sobe essa pasta pra um repositório no GitHub.
2. Conecta o repositório na Netlify ou na Vercel.
3. Deixa o **build command em branco** (não tem build) e o **publish/output directory** como a raiz do projeto (`.` ou vazio).

**GitHub Pages:**
Funciona direto, sem configuração de build nenhuma — é só ativar o GitHub Pages apontando pra branch/pasta onde está o `index.html`.

## Estrutura do projeto

```
index.html   -> estrutura da página e a biblioteca de ícones (SVG inline, sem emojis)
styles.css   -> toda a estilização, animações e responsividade
app.js       -> estado da aplicação, navegação entre telas e lógica de cada tela
```

Tudo em três arquivos, sem dependências externas.
