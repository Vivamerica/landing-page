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
- [ ] `<h1>` = `Nome — tipo em Indaiatuba` (+ bairro quando houver), ex.: `Parque Zarah — Condomínio fechado de lotes em Indaiatuba`, `Vívere Residencial — apartamentos prontos para morar em Indaiatuba · Jardim Veneza`; **um só por página** — slogan vai em `<p class="hero-tagline">`. Nas landings geradas o H1 sai de `nome` + `hero.sub` do config (o `gera_landing.py` avisa quando a cidade não aparece)
- [ ] **Linha de procedência** logo abaixo do `<h1>`, em texto: `<p class="procedencia">Atualizado em dd/mm/aaaa · tabela <incorporadora> de mm/aaaa · Fabio Correia, CRECI 303686-F</p>` (a fonte pode ser "relatório de estoque Dominium de 01/10/2026", "tabela de pré-lançamento Masotti" ou "sem tabela pública em out/2026"). "Atualizado em" = data do **último commit que mudou o texto** da ficha — não o da malha, rodapé ou link de WhatsApp — e `dateModified` do JSON-LD leva a mesma data. Nas geradas, campos `atualizado` e `fonte_tabela` do config
- [ ] **Hero no padrão do site**: 1º parágrafo = "Resposta direta" (2–3 frases: o que é, a partir de quanto, tipologia/metragem, entrega ou "a confirmar", de quem é o dado); linha `<p class="hero-preco">a partir de R$ X · condição resumida · tabela de mm/aaaa</p>` lida da fonte única (`p` e `tab` do `gera-folheto.js`; sem `tab`, usa-se o `prox` — nunca inventar o mês); "N unidades disponíveis (dd/mm)" só se a fonte única tiver `est` com data; pré-lançamento sem tabela → "condições de pré-lançamento — solicite a tabela"
- [ ] **Botões**: hero e bloco final com botão 1 = tabela (molde tabela) e botão 2 = "Agendar visita" (molde visita); flutuante com o molde interesse. Os 6 moldes estão no cabeçalho de `ferramentas/wa-padroniza.py`; antes de publicar, `py -3.12 ferramentas/wa-padroniza.py` (ensaio) não pode listar troca (`*`) nas páginas tocadas
- [ ] **Bloco "O que mudou"** (changelog datado, 1 linha por mudança, lida do `git log`) nas fichas principais; nada de "em breve", "últimas unidades", "pré-reservas abertas" ou "vagas limitadas" sem data
- [ ] FAQ visível = `FAQPage` 1:1 (o validador acusa erro quando diferem; `node gera-faq.js` corrige copiando o visível); `RealEstateListing` e `Product` com a mesma disponibilidade e o mesmo preço
- [ ] **Nunca** prometer valorização, aprovação de crédito ou prazo; todo número com fonte e data-base (fatos de preço só os registrados no `gera-observatorio.js`)
- [ ] Toda escassez (`últimas N unidades`, `X% vendido`, `N lotes disponíveis`) carrega mês/ano: `últimas 5 unidades (set/2026)`; o N vem da fonte única (`est` em `gera-folheto.js`) e a data da contagem vai em `estEm` no mesmo item (dd/mm/aaaa, ou mmm/aaaa quando a fonte só traz o mês); sem `estEm` os geradores não imprimem o selo
- [ ] `lastmod` (sitemap), `dateModified` (JSON-LD) e o "Atualizado em" visível só mudam quando o texto principal muda — não em ajuste de rodapé/card/malha/botão de WhatsApp. Quem decide é o `gera-sitemap.js`, lendo do `git` o último commit que mudou o texto (página alterada na árvore de trabalho = hoje) e alinhando os três campos; a guarda 5 do `identidade.js` falha (exit 1) quando divergem. Nunca escreva essas datas à mão nem edite o `sitemap.xml`
- [ ] `brand` do `Product` no JSON-LD é `{"@type":"Brand","name":"…"}` (Organization dá tipo inválido no Search Console)
- [ ] Toda imagem referenciada (`<img src>`, `og:image`, `url()` de CSS, `image` do JSON-LD) existe no disco — a guarda do `node identidade.js` falha com exit 1 se faltar
- [ ] Todo bloco `<script type="application/ld+json">` passa em `JSON.parse`
- [ ] Menu padrão de TODA página (landing, hub, home, Observatório, blog): **Apartamentos** (→ `/apartamentos-na-planta-indaiatuba/`) · **Loteamentos** · **Condomínios** · **Veja no mapa** (→ `/mapa-lotes-indaiatuba/`, desde 04/09/2026) · **Blog**; a logo → `/`. Landing sem `<nav>` recebe `<nav class="nav-site">` (CSS `#nav-site`)
- [ ] Breadcrumb (visível + `BreadcrumbList`): apartamento = `Início › Apartamentos na planta › <Nome>`; lote = `Início › Loteamentos › <Nome>`; condomínio fechado = `Início › Condomínios fechados › <Nome>`
- [ ] Nada aponta para `/lancamentos-indaiatuba/` (hub extinto em 02/09/2026, 301 para a home — a home é a única dona de "lançamentos imobiliários indaiatuba"). Só `_redirects` cita a URL.
- [ ] Ritual de fechamento, **nesta ordem** (gera-folder.js entra logo após o gera-folheto — o folder-verso ficou com Dominium/preços velhos em 04/09 por não estar na corrente) (cada gerador é idempotente; rodada duas vezes, a 2ª não muda nada):
  0. `python ferramentas/hero-leve.py` — versões leves (.webp) da foto de abertura e das miniaturas; só gera o que falta ou ficou mais velho que o original. Vem antes dos geradores, que só usam a miniatura leve se o arquivo existir
  1. `node gera-folheto.js` — fonte única (APTOS/LOTES)
  2. `node gera-observatorio.js` — EDICAO + Observatório
  3. `node gera-home.js` — home (title/description/H1/selos/cards) + os dois hubs de lote (grade, m², destaque, "Atualizado em")
  4. `node gera-apartamentos.js` — página inteira `/apartamentos-na-planta-indaiatuba/`
  5. `node gera-alphaville.js` — página inteira `/alphaville/` (lê o preço de Indaiatuba na fonte única; os de outras cidades ficam no próprio gerador, com o mês da tabela)
  6. `node gera-blog-ofertas.js` — cards/CTA/menu dos artigos
  7. `node gera-blog-indice.js` — `blog/index.html`
  8. `node gera-relacionados.js` — malha todas↔todas (landings + páginas de categoria + Alphaville de outras cidades)
  9. `python ferramentas/hero-leve.py --aplicar <pasta do site>` — põe a foto de abertura leve (o recorte de celular e, de 1441 px de tela em diante, a foto original) e as miniaturas leves no HTML das páginas escritas à mão; a 2ª rodada tem de dizer "0 reescritas"
  10. `node gera-faq.js` — `FAQPage` de cada página regravado a partir do FAQ visível (o visível manda)
  11. `python ferramentas/mapa-lotes/gera-lista-indexavel.py` — lista indexável do mapa de lotes (tabela, resumo e perguntas da página do mapa)
  12. `node gera-sitemap.js` — `sitemap.xml` inteiro (toda página do site entra sozinha; `lastmod` lido do `git`) e alinha `dateModified` + "Atualizado em" nas páginas; página nova sem commit sai com a data de hoje
  13. **por último** `node identidade.js` (exit 0; guardas de acento, imagem, GA4, entidade e datas; repõe a camada de marca nas páginas regeradas)

---

## 2. SITEMAP

- [ ] Nada a escrever à mão: o `sitemap.xml` é gerado inteiro pelo `node gera-sitemap.js` (passo 12 do ritual). Toda pasta com `index.html` entra sozinha, fora `ferramentas/`, `qrcode/`, `quermesse/` e páginas `noindex`; `lastmod` = data do último commit que mudou o texto principal (página ainda sem commit = hoje)
- [ ] `changefreq`/`priority` saem da `TABELA` do gerador; página nova recebe o padrão do tipo (landing `weekly`/`0.9`, artigo `monthly`/`0.8`, demais `monthly`/`0.5`) e entra no fim da lista — para outro valor, acrescente a linha na `TABELA`
- [ ] Na página: `dateModified` em todo JSON-LD e "Atualizado em dd/mm/aaaa" na linha de procedência (`p.procedencia`) ou de meta do artigo (`p.meta`) — o gerador alinha os dois com o `lastmod`; nas landings geradas, o campo `atualizado` do config deve trazer a mesma data (senão o `gera_landing.py` reescreve a antiga e o `gera-sitemap.js` corrige de novo a cada rodada)

---

## 3. HOME E PÁGINAS DE CATEGORIA

- [ ] Registrar o empreendimento em `APTOS` ou `LOTES` do `gera-folheto.js` (fonte única) — é daí que saem: contadores e preços da home, a grade dos hubs de lote, a página de apartamentos na planta, o Observatório, o folheto e o folder
- [ ] Adicionar o card à mão em `index.html` (a home ainda tem cards escritos à mão; o `gera-home.js` só sincroniza preço/estoque pelo slug)
- [ ] Apartamento vivo mas fora da fonte única (esgotado) → `EXTRAS_APTOS` em `gera-relacionados.js`
- [ ] Rodar o ritual da seção 1b — os hubs (`/apartamentos-na-planta-indaiatuba/`, `/loteamentos-em-indaiatuba/`, `/condominios-fechados-indaiatuba/`) e os contadores se atualizam sozinhos; **não** existe mais `lancamentos-indaiatuba/`

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
