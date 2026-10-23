# Abel Conecta

Aplicação web progressiva (PWA) da **Escola Estadual Professor Abel Freire Coelho**, feita com HTML, CSS e JavaScript puros, sem frameworks e sem dependências externas.

O app reúne, em uma interface com aparência de aplicativo mobile:

- tela inicial com emblema, nome da escola e boas-vindas;
- cartões de navegação para **Início**, **Avisos**, **Horários** e **Sobre**;
- avisos demonstrativos claramente identificados como exemplos;
- horários de aula demonstrativos, com abas por dia da semana;
- informações do desenvolvedor;
- tema claro/escuro;
- instalação na tela inicial e funcionamento offline.

> **Conteúdo demonstrativo:** todos os avisos e horários exibidos são exemplos de layout. Nenhuma data, horário, turno, sala ou comunicado oficial foi inventado. Consulte sempre os canais oficiais da escola.

---

## Observações importantes sobre os assets

O repositório não continha o arquivo `assets/logo-abel.png` nem uma definição das cores institucionais oficiais. Para que a aplicação pudesse ser entregue e testada:

1. Foi criado um **emblema provisório** em `assets/logo-abel.png`, com a fonte editável em `assets/logo-abel.svg`.
   **Substitua esse arquivo pelo logo oficial**, mantendo o mesmo nome e caminho. Todos os ícones do PWA foram gerados a partir dele; se quiser regenerá-los, use uma ferramenta como ImageMagick, Sharp ou um gerador de ícones de PWA.
2. Foi adotada uma paleta **azul-marinho + dourado**, centralizada em variáveis CSS no início de `style.css`. Se a escola tiver cores oficiais, basta alterar os valores de `--navy`, `--navy-deep`, `--gold` e `--gold-light` (e os demais tokens derivados) para alinhar o app.

Nenhum dado oficial da escola foi inventado. O nome utilizado é apenas o fornecido no pedido.

---

## Estrutura de arquivos

```text
abel-conecta/
├── index.html                 # estrutura e conteúdo das quatro seções
├── style.css                  # identidade visual, responsividade e temas
├── script.js                  # rotas, tema, instalação, abas e offline
├── manifest.webmanifest       # manifesto de instalação do PWA
├── service-worker.js          # cache e funcionamento offline
├── assets/
│   ├── logo-abel.png          # emblema usado na interface (provisório)
│   ├── logo-abel.svg          # fonte vetorial do emblema provisório
│   ├── favicon.svg
│   └── icons/
│       ├── icon-192.png
│       ├── icon-512.png
│       ├── icon-maskable-512.png
│       ├── apple-touch-icon.png
│       └── favicon-32.png
├── .nojekyll                  # evita processamento desnecessário no GitHub Pages
└── README.md
```

Todos os caminhos são **relativos** (`./`), para funcionar tanto na raiz quanto em um subdiretório do GitHub Pages, como `https://usuario.github.io/abel-conecta/`.

---

## Como testar localmente

O app não tem etapa de build. É necessário servir os arquivos por HTTP, pois `file://` bloqueia service worker, instalação e modo offline.

### 1. Inicie um servidor local

Na pasta do projeto, execute uma das opções:

```bash
# Opção A — Python (já disponível na maioria dos sistemas)
python3 -m http.server 8000

# Opção B — Node.js
npx serve .
```

Abra:

```text
http://localhost:8000
```

> `localhost` é considerado um contexto seguro pelos navegadores. Em produção, o app exige **HTTPS**.

### 2. Teste a navegação

- Use os cartões da tela inicial e a barra inferior.
- Confirme que a URL muda para `#/inicio`, `#/avisos`, `#/horarios` e `#/sobre`.
- Recarregue a página em `#/avisos` para verificar o link direto.
- Use o botão de tema (sol/lua) e recarregue: a preferência deve ser mantida.
- Na seção **Horários**, troque de dia e teste as setas do teclado com foco nas abas.

### 3. Teste o PWA no Chrome ou Edge

1. Abra **DevTools → Application → Manifest**.
   - Confira o nome, as cores, os ícones 192/512 e o ícone maskable.
   - Não deve haver erros de manifesto.
2. Em **Application → Service Workers**, confirme o status **activated** e o escopo correto (`/` ou `/abel-conecta/`).
3. Marque **Offline** em **Application → Service Workers** (ou desligue a rede) e recarregue. A interface deve continuar abrindo.
4. Procure o ícone de instalação na barra de endereço, ou use o botão **Instalar** no cabeçalho.
5. Rode **Lighthouse → Progressive Web App** para conferir a instalação.

### 4. Teste em subdiretório (como no GitHub Pages)

Sirva a pasta **pai** do projeto e acesse pelo subdiretório:

```bash
cd ..
python3 -m http.server 8001
```

```text
http://localhost:8001/abel-conecta/
```

Confirme no DevTools que o escopo do service worker é `/abel-conecta/` e que, offline, o app continua funcionando.

### 5. Teste offline após a primeira visita

1. Abra o app com internet e aguarde a ativação do service worker.
2. Recarregue uma vez para garantir o cache.
3. Ative o modo offline no DevTools e recarregue.
4. O app deve carregar a interface, a seção visitada e exibir o aviso **Offline** no cabeçalho.

### 6. Limitações de instalação por navegador

- **HTTPS é obrigatório** (exceto `localhost`). Em `file://` o service worker não é registrado.
- Para testar a instalação **no celular** antes de publicar, use um túnel HTTPS (por exemplo, Cloudflare Tunnel ou ngrok) ou publique no GitHub Pages. Um endereço `http://192.168.x.x` não é considerado contexto seguro e não permitirá service worker/instalação.
- **Chrome/Edge (Android e desktop):** costumam exibir o prompt nativo `beforeinstallprompt`; o botão **Instalar** aproveita esse prompt. Se ele não estiver disponível, o app mostra instruções manuais.
- **iPhone/iPad (Safari):** o iOS não dispara `beforeinstallprompt`. A instalação é manual: **Compartilhar → Adicionar à Tela de Início**. O app explica isso no diálogo.
- **Firefox:** o suporte a instalação de PWA varia por plataforma e versão. O botão **Instalar** abre as instruções.
- **Modo privado/incógnito:** pode bloquear service worker e cache; a instalação pode não aparecer.
- **Atualizações:** o app avisa quando uma nova versão estiver disponível. Ao publicar mudanças, aumente `CACHE_VERSION` em `service-worker.js` para forçar a renovação do cache.

---

## Publicar no GitHub Pages

### Opção 1 — Publicação a partir de uma branch (recomendada)

1. Envie os arquivos para o repositório:

   ```bash
   git add .
   git commit -m "Cria o PWA Abel Conecta"
   git push origin main
   ```

2. No GitHub, abra **Settings → Pages**.
3. Em **Build and deployment → Source**, escolha **Deploy from a branch**.
4. Selecione a branch **main** e a pasta **/ (root)**.
5. Clique em **Save** e aguarde o deploy.
6. Acesse:

   ```text
   https://SEU-USUARIO.github.io/NOME-DO-REPOSITORIO/
   ```

   Exemplo: `https://cristian-davi.github.io/abel-conecta/`.

7. Em **Settings → Pages**, ative **Enforce HTTPS** (o GitHub Pages já fornece HTTPS para domínios `github.io`).

### Opção 2 — GitHub Actions

Como o projeto é 100% estático e não tem build, a opção por branch é suficiente. Se preferir Actions, publique a raiz do repositório como artefato (`actions/upload-pages-artifact`) sem alterar os caminhos relativos.

### Após publicar

- Abra a URL no celular e teste a instalação.
- Confirme que o manifesto e o service worker estão sendo servidos pela URL do subdiretório.
- Ao alterar qualquer arquivo, **incremente `CACHE_VERSION`** no service worker antes do deploy.
- Se o navegador insistir em uma versão antiga durante os testes, use **Application → Service Workers → Unregister** e recarregue com cache limpo.

O GitHub Pages exige que o repositório seja público (ou plano compatível para Pages em repositórios privados). O link gerado já usa HTTPS; para domínio próprio, configure o DNS e ative **Enforce HTTPS**.

---

## Personalização rápida

### Logo

1. Substitua `assets/logo-abel.png` pelo arquivo oficial (PNG quadrado, de preferência 512×512 ou 1024×1024).
2. Para melhores resultados, regenere os ícones em `assets/icons/` com o mesmo emblema:
   - `icon-192.png` e `icon-512.png` (propósito `any`);
   - `icon-maskable-512.png` (conteúdo principal dentro da zona segura de 80%);
   - `apple-touch-icon.png` (180×180).
3. Se a logo oficial tiver fundo transparente, mantenha o fundo azul nos ícones maskable.

### Cores institucionais

Edite os tokens no início de `style.css`:

```css
:root {
  --navy: #0d3b66;
  --navy-deep: #082744;
  --gold: #e9b949;
  --gold-light: #f8dfa0;
  --teal: #137a6b;
  /* ... */
}
```

O bloco `:root[data-theme="dark"]` contém as variantes do tema escuro. O gradiente do hero e do cartão do desenvolvedor usam `--hero-bg` e valores explícitos que podem ser ajustados no mesmo arquivo.

### Avisos e horários

- **Avisos:** edite os `<article class="notice">` em `index.html`. Mantenha o selo **Exemplo** enquanto forem dados de demonstração.
- **Horários:** edite as tabelas dentro dos painéis `#panel-segunda` a `#panel-sexta`. Se a escola fornecer horários oficiais, remova os avisos de demonstração e o selo **Exemplo**.
- **Dados do desenvolvedor:** estão na seção `#view-sobre` do `index.html`.

---

## Acessibilidade e privacidade

- Navegação por teclado, link para pular ao conteúdo e foco visível.
- Abas de horários com os padrões ARIA e suporte às setas/Home/End.
- Respeito à preferência `prefers-reduced-motion`.
- Contraste verificado com ferramentas de acessibilidade (WCAG AA) nos temas claro e escuro.
- Nenhum dado pessoal é coletado. A única preferência persistida é o tema, salva em `localStorage`.
- O service worker guarda apenas os arquivos estáticos do próprio app.

---

## Desenvolvedor

- **Nome:** Cristian Davi Santos de Freitas
- **Turma:** 3º ano de Informática
- **Série:** Ensino Médio

Projeto demonstrativo desenvolvido para a Escola Estadual Professor Abel Freire Coelho.
