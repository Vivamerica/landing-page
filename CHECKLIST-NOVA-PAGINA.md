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
- [ ] `<h1>` = nome do empreendimento + tipo + "em Indaiatuba" (ex.: `Parque Zarah — Condomínio fechado de lotes em Indaiatuba`); **um só por página** — slogan vai em `<p class="hero-tagline">`
- [ ] **Nunca** prometer valorização, aprovação de crédito ou prazo; todo número com fonte e data-base (fatos de preço só os registrados no `gera-observatorio.js`)
- [ ] Toda escassez (`últimas N unidades`, `X% vendido`, `N lotes disponíveis`) carrega mês/ano: `últimas 5 unidades (set/2026)`; o N vem da fonte única (`est` em `gera-folheto.js`)
- [ ] `lastmod` (sitemap) e `dateModified` (BlogPosting) só mudam quando o texto principal muda — não em ajuste de rodapé/card
- [ ] `brand` do `Product` no JSON-LD é `{"@type":"Brand","name":"…"}` (Organization dá tipo inválido no Search Console)
- [ ] Toda imagem referenciada (`<img src>`, `og:image`, `url()` de CSS, `image` do JSON-LD) existe no disco — a guarda do `node identidade.js` falha com exit 1 se faltar
- [ ] Todo bloco `<script type="application/ld+json">` passa em `JSON.parse`
- [ ] Menu padrão de TODA página (landing, hub, home, Observatório, blog): **Apartamentos** (→ `/apartamentos-na-planta-indaiatuba/`) · **Loteamentos** · **Condomínios** · **Blog**; a logo → `/`. Landing sem `<nav>` recebe `<nav class="nav-site">` (CSS `#nav-site`)
- [ ] Breadcrumb (visível + `BreadcrumbList`): apartamento = `Início › Apartamentos na planta › <Nome>`; lote = `Início › Loteamentos › <Nome>`; condomínio fechado = `Início › Condomínios fechados › <Nome>`
- [ ] Nada aponta para `/lancamentos-indaiatuba/` (hub extinto em 02/09/2026, 301 para a home — a home é a única dona de "lançamentos imobiliários indaiatuba"). Só `_redirects` cita a URL.
- [ ] Ritual de fechamento, **nesta ordem** (gera-folder.js entra logo após o gera-folheto — o folder-verso ficou com Dominium/preços velhos em 04/09 por não estar na corrente) (cada gerador é idempotente; rodada duas vezes, a 2ª não muda nada):
  1. `node gera-folheto.js` — fonte única (APTOS/LOTES)
  2. `node gera-observatorio.js` — EDICAO + Observatório
  3. `node gera-home.js` — home (title/description/H1/selos/cards) + os dois hubs de lote (grade, m², destaque, "Atualizado em")
  4. `node gera-apartamentos.js` — página inteira `/apartamentos-na-planta-indaiatuba/`
  5. `node gera-blog-ofertas.js` — cards/CTA/menu dos artigos
  6. `node gera-blog-indice.js` — `blog/index.html`
  7. `node gera-relacionados.js` — malha todas↔todas (landings + 3 páginas de categoria)
  8. **por último** `node identidade.js` (exit 0; guardas de acento e imagem; repõe a camada de marca nas páginas regeradas)

---

## 2. SITEMAP

- [ ] Adicionar nova URL em `sitemap.xml`:
```xml
<url>
  <loc>https://lancamentos.imoveisvivamerica.com.br/nome-slug/</loc>
  <lastmod>AAAA-MM-DD</lastmod>
  <changefreq>weekly</changefreq>
  <priority>0.9</priority>
</url>
```

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

- [ ] `git add .`
- [ ] `git commit -m "Adiciona landing page [Nome]"`
- [ ] `git push origin main`
- [ ] ✅ Netlify faz deploy automático (~30 segundos)

---

## 6. GOOGLE SEARCH CONSOLE 👤

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
