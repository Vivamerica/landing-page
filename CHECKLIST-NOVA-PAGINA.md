# ✅ Checklist — Nova Landing Page

Use este checklist toda vez que uma nova landing page for criada.
Cada item é executado pelo Claude automaticamente, exceto onde indicado 👤.

---

## 1. ARQUIVOS DA PÁGINA

- [ ] Criar pasta: `nome-do-empreendimento-indaiatuba/`
- [ ] Criar subpasta: `nome-do-empreendimento-indaiatuba/images/`
- [ ] Processar e comprimir imagens (máx. 1280px, qualidade 75%)
- [ ] Criar `index.html` com:
  - [ ] `<title>` otimizado com palavra-chave + cidade + preço
  - [ ] `<meta name="description">` com 150-160 caracteres
  - [ ] `<meta name="keywords">` com termos locais
  - [ ] `<link rel="canonical">` apontando para URL definitiva
  - [ ] `<link rel="icon">` para favicon.png
  - [ ] Schema.org `RealEstateListing` com availability correta
  - [ ] Google Analytics GA4 (G-40C0379NPR) + evento WhatsApp
  - [ ] Breadcrumb para navegação e SEO
  - [ ] Links internos para outros empreendimentos (cluster)
  - [ ] Seção "Outros empreendimentos" no rodapé

---

## 1b. REGRAS DE TEXTO E SEO (auditoria 02/09/2026 — valem para toda página, nova ou antiga)

- [ ] `<title>` ≤ 60 caracteres, com preço arredondado (`R$ 331 mil`) + mês da tabela (`set/2026`)
- [ ] `<meta name="description">` com 120–155 caracteres; o número (preço/tipologia/bairro) antes do caractere 120
- [ ] `og:title` = `twitter:title` = `<title>`; `og:description` = `twitter:description` = description
- [ ] `<h1>` = `Nome — tipo em Indaiatuba` (+ bairro quando houver), ex.: `Parque Zarah — Condomínio fechado de lotes em Indaiatuba`, `Vívere Residencial — apartamentos prontos para morar em Indaiatuba · Jardim Veneza`; **um só por página** — slogan vai em `<p class="hero-tagline">`. Nas landings geradas o H1 sai de `nome` + `hero.sub` do config (o `gera_landing.py` avisa quando a cidade não aparece). **Exceções**: a home e os hubs de categoria têm H1 curto e fixo (ver seção 3)
- [ ] **Linha de procedência** logo abaixo do `<h1>`, em texto: `<p class="procedencia">Atualizado em dd/mm/aaaa · tabela <incorporadora> de mm/aaaa · Fabio Correia, CRECI 303686-F</p>` (a fonte pode ser "relatório de estoque Dominium de 01/10/2026", "tabela de pré-lançamento Masotti" ou "sem tabela pública em out/2026"). "Atualizado em" = data do **último commit que mudou o texto** da ficha — não o da malha, rodapé ou link de WhatsApp — e `dateModified` do JSON-LD leva a mesma data. Nas geradas, campos `atualizado` e `fonte_tabela` do config
- [ ] **Hero no padrão do site**: 1º parágrafo = "Resposta direta" (2–3 frases: o que é, a partir de quanto, tipologia/metragem, entrega ou "a confirmar", de quem é o dado); linha `<p class="hero-preco">a partir de R$ X · condição resumida · tabela de mm/aaaa</p>` lida da fonte única (`p` e `tab` do `gera-folheto.js`; sem `tab`, usa-se o `prox` — nunca inventar o mês); "N unidades disponíveis (dd/mm)" só se a fonte única tiver `est` com data; pré-lançamento sem tabela → "condições de pré-lançamento — solicite a tabela". **A home é exceção**: no hero só o H1 fixo e a linha de números; a "Resposta direta" fica na seção `#resumo`, logo depois dos cards (seção 3)
- [ ] **Botões**: hero e bloco final com botão 1 = tabela (molde tabela) e botão 2 = "Agendar visita" (molde visita); flutuante com o molde interesse. Os 6 moldes estão no cabeçalho de `ferramentas/wa-padroniza.py`; antes de publicar, `py -3.12 ferramentas/wa-padroniza.py` (ensaio) não pode listar troca (`*`) nas páginas tocadas
- [ ] **Bloco "O que mudou"** (changelog datado, 1 linha por mudança, lida do `git log`) nas fichas principais; nada de "em breve", "últimas unidades", "pré-reservas abertas" ou "vagas limitadas" sem data
- [ ] FAQ visível = `FAQPage` 1:1 (o validador acusa erro quando diferem; `node gera-faq.js` corrige copiando o visível); `RealEstateListing` e `Product` com a mesma disponibilidade e o mesmo preço
- [ ] **Nunca** prometer valorização, aprovação de crédito ou prazo; todo número com fonte e data-base (fatos de preço só os registrados no `gera-observatorio.js`)
- [ ] Toda escassez (`últimas N unidades`, `X% vendido`, `N lotes disponíveis`) carrega mês/ano: `últimas 5 unidades (set/2026)`; o N vem da fonte única (`est` em `gera-folheto.js`) e a data da contagem vai em `estEm` no mesmo item (dd/mm/aaaa, ou mmm/aaaa quando a fonte só traz o mês); sem `estEm` os geradores não imprimem o selo
- [ ] `lastmod` (sitemap), `dateModified` (JSON-LD) e o "Atualizado em" visível só mudam quando o texto principal muda — não em ajuste de rodapé/card/malha/botão de WhatsApp. Quem decide é o `gera-sitemap.js`, lendo do `git` o último commit que mudou o texto (página alterada na árvore de trabalho = hoje) e alinhando os três campos; a guarda 5 do `identidade.js` falha (exit 1) quando divergem. Nunca escreva essas datas à mão nem edite o `sitemap.xml`. O menu (`GEN:menu` e o cabeçalho antigo, menos o `<h1>`) e o `GEN:guias` do blog ficam fora da impressão digital: trocar o menu não mexe em `lastmod`, `dateModified` nem "Atualizado em"
- [ ] `brand` do `Product` no JSON-LD é `{"@type":"Brand","name":"…"}` (Organization dá tipo inválido no Search Console)
- [ ] Toda imagem referenciada (`<img src>`, `og:image`, `url()` de CSS, `image` do JSON-LD) existe no disco — a guarda do `node identidade.js` falha com exit 1 se faltar
- [ ] Todo bloco `<script type="application/ld+json">` passa em `JSON.parse`
- [ ] **Menu único de TODA página** (landing, hub, home, Observatório, blog, mapa, 404, Sou Corretor), escrito **só pelo `gera-menu.js`** (desde 15/10/2026): `<style id="menu-site-css">` antes do `</head>` e `<!--GEN:menu-->…<!--/GEN:menu-->` logo depois do `<body>`. Itens, nesta ordem: **Sou Corretor** (→ `/sou-corretor/`, abre a janela do formulário) · **Empreendimentos** (→ `/#lancamentos`) · **Apartamentos** (→ `/#apartamentos`) · **Loteamentos** (→ `/#loteamentos`) · **Condomínios** (→ `/#condominios`) · **Veja no Mapa** (→ `/mapa-lotes-indaiatuba/`) · **Blog** · **Revenda e Locação ↗** (→ site principal); a logo → `/`. Os quatro itens `/#…` levam `data-filtro-menu`: na home a própria página filtra (`window.vmFiltro`), nas outras o link navega para a âncora. O bloco termina com `<script src="/corretor.js?v=AAAAMMDD" defer>` (é assim que toda página recebe a janela do Sou Corretor). Nunca escreva `<header>`, `<nav class="nav-site">` nem o menu à mão: a guarda 6 do `identidade.js` falha (exit 1). Página nova recebe o menu no ritual; landing do `gera_landing.py` nasce com o `GEN:menu` vazio, que o ritual preenche
- [ ] **Regras de página por causa do menu**: nenhum elemento `<header>` fora do bloco do menu (cabeçalho de artigo ou de seção usa outra tag); não usar os ids `menu-site`/`menu-site-css`/`ms-lista` nem classes `ms-*` (o id `menu-site` é só do `<header>` do menu: com ele repetido, o script pega o primeiro elemento e o botão do celular não abre; a guarda 6 conta); o `body` não pode ser flex em linha (o menu viraria uma coluna ao lado do conteúdo); o menu tem 70 px no computador e 60 px até 1260 px — âncoras com `scroll-margin-top` de 80 px ou mais continuam certas, e quando uma altura depende do menu use `var(--menu-h)` (como no mapa); o bloco não pode ter `<h1>`/`<h2>` e o `gera-menu.js` recusa cabeçalho antigo com `<h1>` dentro (tire o `<h1>` à mão antes)
- [ ] **Blog**: todo artigo tem `<div class="footer-links">` no rodapé, onde o `gera-blog-ofertas.js` escreve o `<!--GEN:guias-->` com os 3 hubs (sem a div ele avisa `SEM <div class="footer-links">`); não escreva link de hub à mão no `.footer-links` (o gerador tira). Guia que mora fora de `/blog/` (página de categoria) entra no índice pelo `GUIAS_FORA_DO_BLOG` do `gera-blog-indice.js` (`slug → { tag, cat, link }`): vira card fixo no topo, título e resumo lidos da própria página (headline do `Article` e meta description), selo do "Atualizado em mês/ano" dela; não entra no `Blog.blogPost`; nunca copiar a página para `/blog/` nem linkar `/blog/<slug>/`
- [ ] Breadcrumb (visível + `BreadcrumbList`): apartamento = `Início › Apartamentos na planta › <Nome>`; lote = `Início › Loteamentos › <Nome>`; condomínio fechado = `Início › Condomínios fechados › <Nome>`
- [ ] Nada aponta para `/lancamentos-indaiatuba/` (hub extinto em 02/09/2026, 301 para a home — a home é a única dona de "lançamentos imobiliários indaiatuba"). Só `_redirects` cita a URL.
- [ ] Ritual de fechamento, **nesta ordem** (gera-folder.js entra logo após o gera-folheto — o folder-verso ficou com Dominium/preços velhos em 04/09 por não estar na corrente) (cada gerador é idempotente; rodada duas vezes, a 2ª não muda nada):
  0. `python ferramentas/hero-leve.py` — versões leves (.webp) da foto de abertura e das miniaturas; só gera o que falta ou ficou mais velho que o original. Vem antes dos geradores, que só usam a miniatura leve se o arquivo existir
  1. `node gera-folheto.js` — fonte única (APTOS/LOTES)
  2. `node gera-observatorio.js` — EDICAO + Observatório
  3. `node gera-home.js` — home (title/description/H1, linha de números, "Resposta direta" do `#resumo`, selos, painel de cidades, atributos de filtro e preços dos cards, `ItemList`) + os dois hubs de lote (grade, m², destaque, contagem, "Atualizado em"); lê também o `ALPHAVILLE` do `gera-alphaville.js`, só para o card de outra cidade na home
  4. `node gera-apartamentos.js` — página inteira `/apartamentos-na-planta-indaiatuba/` (H1 fixo, linha "N lançamentos, M com preço aberto" + "Atualizado em mês/ano", grade, abertura embaixo da grade)
  5. `node gera-alphaville.js` — página inteira `/alphaville/` (lê o preço de Indaiatuba na fonte única; os de outras cidades ficam no próprio gerador, com o mês da tabela)
  6. `node gera-blog-ofertas.js` — cards/CTA dos artigos + `GEN:guias` (os 3 hubs) no `.footer-links`
  7. `node gera-blog-indice.js` — `blog/index.html` (com os guias de `GUIAS_FORA_DO_BLOG` fixos no topo; precisa rodar depois do `gera-home.js`). Sozinho ele tira a camada de marca e a entidade do índice: só fica completo depois do `identidade.js`
  8. `node gera-relacionados.js` — malha todas↔todas (landings + páginas de categoria + Alphaville de outras cidades)
  8b. `node gera-menu.js` — menu único em toda página (tira o cabeçalho antigo, põe o `<style id="menu-site-css">` e o bloco `GEN:menu`). Idempotente: a 2ª rodada diz "0 alteradas". Opções: `--ensaio` (não grava, lista o que mudaria), `--so a/index.html,b/index.html`, `--raiz <cópia>` e `--guarda` (só confere)
  9. `python ferramentas/hero-leve.py --aplicar <pasta do site>` — põe a foto de abertura leve (o recorte de celular e, de 1441 px de tela em diante, a foto original) e as miniaturas leves no HTML das páginas escritas à mão; a 2ª rodada tem de dizer "0 reescritas"
  10. `node gera-faq.js` — `FAQPage` de cada página regravado a partir do FAQ visível (o visível manda)
  11. `python ferramentas/mapa-lotes/gera-lista-indexavel.py` — lista indexável do mapa de lotes (tabela, resumo e perguntas da página do mapa)
  12. `node gera-sitemap.js` — `sitemap.xml` inteiro (toda página do site entra sozinha; `lastmod` lido do `git`) e alinha `dateModified` + "Atualizado em" nas páginas; página nova sem commit sai com a data de hoje
  13. **por último** `node identidade.js` (exit 0; guardas de acento, imagem, GA4, entidade, datas e menu; repõe a camada de marca nas páginas regeradas). Para conferir uma árvore em que outros geradores ainda mexem, `node identidade.js --conferir` não grava nada: roda todas as guardas e diz quantos arquivos as fases 1 a 3 mudariam

---

## 2. SITEMAP

- [ ] Nada a escrever à mão: o `sitemap.xml` é gerado inteiro pelo `node gera-sitemap.js` (passo 12 do ritual). Toda pasta com `index.html` entra sozinha, fora `ferramentas/`, `qrcode/`, `quermesse/` e páginas `noindex`; `lastmod` = data do último commit que mudou o texto principal (página ainda sem commit = hoje)
- [ ] `changefreq`/`priority` saem da `TABELA` do gerador; página nova recebe o padrão do tipo (landing `weekly`/`0.9`, artigo `monthly`/`0.8`, demais `monthly`/`0.5`) e entra no fim da lista — para outro valor, acrescente a linha na `TABELA`
- [ ] Na página: `dateModified` em todo JSON-LD e "Atualizado em dd/mm/aaaa" na linha de procedência (`p.procedencia`) ou de meta do artigo (`p.meta`) — o gerador alinha os dois com o `lastmod`; nas landings geradas, o campo `atualizado` do config deve trazer a mesma data (senão o `gera_landing.py` reescreve a antiga e o `gera-sitemap.js` corrige de novo a cada rodada). Na página de apartamentos o `p.atualizado` "Atualizado em mês/ano" é escrito pelo `gera-apartamentos.js` com o mês da edição; se o `lastmod` cair em outro mês, o `gera-sitemap.js` troca por dd/mm/aaaa. O `GEN:atualizado` continua só nos hubs de loteamentos e de condomínios (do `gera-home.js`)

---

## 3. HOME E PÁGINAS DE CATEGORIA

- [ ] Registrar o empreendimento em `APTOS` ou `LOTES` do `gera-folheto.js` (fonte única) — é daí que saem: contadores e preços da home, a grade dos hubs de lote, a página de apartamentos na planta, o Observatório, o folheto e o folder
- [ ] Adicionar o card à mão em `index.html`, na seção certa (apartamentos, loteamentos ou `#casas` para casa em condomínio de outra cidade). Vale para o que entrou em `APTOS`/`LOTES` e para linha do `ALPHAVILLE` com slug e cidade diferente de Indaiatuba (essa linha precisa de preço e tabela no formato `out/2026`). Sem o card o `gera-home.js` para ("a home tem N cards e deveria ter M"). Os atributos `data-tipo`, `data-cidade`, `data-cond` e `data-lote`, o preço e a cidade do filtro saem sozinhos do gerador, casados pelo slug: não edite esses atributos à mão. O card de casa em condomínio de outra cidade é texto à mão (só o preço é sincronizado): mudou o texto ou o número de casas, edite o card
- [ ] Apartamento vivo mas fora da fonte única (esgotado) → `EXTRAS_APTOS` em `gera-relacionados.js`
- [ ] Rodar o ritual da seção 1b — os hubs (`/apartamentos-na-planta-indaiatuba/`, `/loteamentos-em-indaiatuba/`, `/condominios-fechados-indaiatuba/`) e os contadores se atualizam sozinhos; **não** existe mais `lancamentos-indaiatuba/`
- [ ] **Home (exceção ao padrão de hero)**: H1 fixo e curto `Lançamentos imobiliários em Indaiatuba e região`; logo abaixo a linha `GEN:numeros` (`<p class="hero-numeros"><b>N</b> empreendimentos, <b>M</b> com preço aberto</p>` + `<p class="hero-edicao">(atualização mês/ano)</p>`, nunca com as classes `meta`/`atualizado`/`procedencia`). A "Resposta direta" (`GEN:lede`) fica na seção `#resumo`, logo depois dos cards. O hero, os selos e o `ItemList` contam a página inteira (inclusive o card de outra cidade); title, description e FAQ contam só Indaiatuba
- [ ] **Filtro da home**: chips de tipo (Todos · Apartamentos · Loteamentos · Condomínios; Condomínios = `data-cond="1"`), botão de cidades com caixas todas marcadas (`GEN:cidades`, some quando só há 1 cidade), preço, fase e MCMV. Endereços aceitos: `?tipo=apartamentos|loteamentos|condominios`, `?cidade=slug[,slug]`, os antigos `?t=apartamento|lote`, `?f=mcmv|fechado`, `?p=a|b|c`, `?s=lancamento|obras|pre|pronto`, e as âncoras `#lancamentos`, `#apartamentos`, `#loteamentos` e `#condominios` (`#lotes` vira loteamentos). Esses quatro ids existem na página (sem JS a âncora ainda leva ao lugar certo). A URL nunca é reescrita (nada de `history.pushState/replaceState`: o GA4 contaria `page_view`). `window.vmFiltro('todos'|'apartamentos'|'loteamentos'|'condominios')` é o contrato com o menu
- [ ] **Hubs de categoria (cards primeiro)**: topo curto (trilha, H1 curto e fixo, linha de contagem, "Atualizado em mês/ano") e a grade de cards logo depois; o texto vira guia embaixo (`section#guia`), nunca dentro de `<details>`; FAQ sempre no formato `div.faq-item > h3 + p`. Condomínios: H1 `Condomínios em Indaiatuba` e a contagem no H2 `GEN:contagem`. Apartamentos: H1 `Apartamentos na planta em Indaiatuba`, linha "N lançamentos, M com preço aberto" e o parágrafo de abertura embaixo da grade, tudo do `gera-apartamentos.js` (editar o HTML à mão se perde na próxima rodada). Mudou a ordem ou o texto de um hub, troque o `HUBS_ALTERADOS_EM` do `gera-home.js`

---

## 3b. SOU CORRETOR (formulário de candidatura)

- [ ] **Fonte única do formulário = `sou-corretor/index.html`** (escrita à mão, `noindex,follow`, fora do sitemap, não entra na `TABELA` do `gera-sitemap.js`). Funciona sem JavaScript (`action` absoluto, `method="post"`) e lê `?enviado=1` e `?erro=<campo|envio|limite>` na volta
- [ ] A janela **não** fica no HTML das páginas: o `/corretor.js` intercepta o clique em `a[data-sou-corretor]` (o item Sou Corretor do menu), busca `/sou-corretor/` e clona o `form#form-corretor`. Sem suporte a `<dialog>` ou se a busca falhar, o link segue para a página. Em `/sou-corretor/` ele não abre janela, só melhora o formulário
- [ ] O `<script src="/corretor.js?v=AAAAMMDD" defer>` sai do bloco do `gera-menu.js`. Mudou o `corretor.js`, troque o `?v=` no `gera-menu.js` e rode o `gera-menu.js` (o cache de `.js` na Netlify é de 1 dia + 7 de revalidação)
- [ ] Textos do formulário só no `sou-corretor/index.html`: rótulos, `data-erro`/`data-erro-vazio`/`data-erro-arroba`, falhas em `[data-motivo=envio|limite|recarga]`, sucesso e link do WhatsApp (todo `wa.me` com `text=`). O `corretor.js` só tem "Enviando…", "Carregando o formulário…", "Fechar" e o título de reserva
- [ ] O visual do formulário existe em **dois** lugares: o `<style>` da página e a constante CSS do `corretor.js` (janela presa a `#ms-corretor` com `all:revert`, classes `fc-*`). Mexeu num, mexa no outro. Nada de SVG dentro da janela (o `all:revert` apaga a geometria do SVG no Chrome): ícones em CSS
- [ ] Contrato de nomes que o `corretor.js` e o script da página leem: `form#form-corretor`, `[data-campo]` + `p.fc-erro#fc-erro-<campo>`, `.fc-campos`, `.fc-sucesso`, `.fc-falha`, `[data-fc-repetir]`, `.fc-enviar`, `.fc-aviso` (`role=status`, fora de `.fc-campos`), `[data-so-janela]`/`[data-so-pagina]`, `#fc-intro`, o `<h1>` da página (vira o título da janela, em `<p>`) e `a[data-sou-corretor]` no menu. O `corretor.js` também lê `window.VA_ATRIB.codigo()` do `atrib.js`: não renomeie
- [ ] O envio vai para a rota do sistema (`https://imoveisvivamerica.com.br/site/corretor/candidatura`, por `fetch` URL-encoded, `credentials:'omit'`). Mudança que dependa da rota: o sistema publica **antes** do site; ao contrário, todo envio cai na tela de erro com saída pelo WhatsApp. Se o domínio do site mudar, a lista de origens aceitas na rota precisa mudar junto
- [ ] Conferência local: em `localhost`/`127.0.0.1` o envio nunca sai (mostra a tela de erro); com `?corretor=simular-ok` mostra a de sucesso; em produção o parâmetro é ignorado

---

## 4. LINKS INTERNOS

- [ ] Adicionar link para a nova página nos empreendimentos relacionados
  (ex: se for do Parque dos Pássaros, atualizar Canário, Tangará e Colibri)

---

## 5. GIT & DEPLOY

- [ ] `git add` **pelo caminho nominal** de cada arquivo (nunca `git add .` nem `-A`); config novo em `ferramentas/…/configs/` precisa de `git add -f`
- [ ] `git commit -m "Adiciona landing page [Nome]"`
- [ ] `git push origin main`
- [ ] ✅ Netlify faz deploy automático (~30 segundos)

---

## 6. GOOGLE SEARCH CONSOLE 👤
- [ ] Sempre que uma publicação mudar preço, estoque ou contagem no `<title>` de uma ficha ou página de categoria, pedir a indexação dessa URL no mesmo dia (Inspeção de URL → Solicitar indexação). O sitemap sozinho não traz o Google de volta a tempo.

- [ ] Acessar: https://search.google.com/search-console
- [ ] Ir em **Sitemaps** → confirmar que o sitemap foi reprocessado
- [ ] Ir em **Inspeção de URL** → colar a URL da nova página → **Solicitar indexação**
- [ ] Aguardar confirmação de indexação (geralmente 24-72h)

---

## 7. VERIFICAÇÃO FINAL

- [ ] Abrir a página no navegador e conferir visualmente
- [ ] Testar link do WhatsApp (botão flutuante + botão CTA)
- [ ] Verificar no GA4 em tempo real se a visita aparece
- [ ] Checar se a imagem hero está carregando corretamente
- [ ] Testar no celular (responsividade)
- [ ] Menu: abaixo de 1260 px aparece o botão de menu (abre e fecha, Esc fecha e devolve o foco); na home, Apartamentos/Loteamentos/Condomínios filtram sem recarregar; Sou Corretor abre a janela do formulário

---

## REFERÊNCIA RÁPIDA

| Item | Valor |
|------|-------|
| GA4 Measurement ID | `G-40C0379NPR` |
| WhatsApp | `5519989769457` |
| Domínio | `lancamentos.imoveisvivamerica.com.br` |
| Sitemap | `/sitemap.xml` |
| Repositório | `github.com/Vivamerica/landing-page` |
| Deploy | Automático via Netlify (push → live) |

Eventos GA4 próprios do site, além do `whatsapp_click`:
- `filtro_usado` (home): ganhou os parâmetros `tipo` e `cidades`;
- `sou_corretor_enviado`: `event_category` recrutamento, `forma` janela|pagina, `origem` = caminho da página; nenhum dado pessoal;
- o `whatsapp_click` do formulário Sou Corretor vem com `cta_pos=corretor`: é recrutamento, não contato de cliente (fica fora das conversões).

Parâmetro novo só aparece nos relatórios depois de registrado como dimensão personalizada na propriedade do GA4.
