/* ═══════════════════════════════════════════════════════════════════
   GERA-BLOG-INDICE — o índice do blog lê os próprios artigos
   ───────────────────────────────────────────────────────────────────
   Varre blog/<slug>/index.html, extrai headline, descrição e data de
   publicação do schema BlogPosting de cada um, e regenera blog/index.html:

   - ordenado por data de publicação, mais novo primeiro (estilo jornal)
   - selo de data pequeno em cada card
   - filtros por tema no topo (mapa TEMA_POR_SLUG abaixo)
   - guias-pilares em largura total (conjunto DESTAQUES)

   Ritual: publicou artigo novo → registrar o slug em TEMA_POR_SLUG
   → node gera-blog-indice.js. Nunca editar blog/index.html à mão.
   ═══════════════════════════════════════════════════════════════════ */

const fs = require('fs');
const path = require('path');
const R = __dirname + '/';
const ABS = 'https://lancamentos.imoveisvivamerica.com.br';

// tema/categoria por slug — artigo novo entra aqui
const TEMA_POR_SLUG = {
  'casa-propria-motorista-de-aplicativo':            { tag: 'MCMV · Renda de app',    cat: 'mcmv' },
  'minha-casa-minha-vida-indaiatuba':                { tag: 'Minha Casa Minha Vida',  cat: 'mcmv' },
  'quem-tem-direito-minha-casa-minha-vida-indaiatuba': { tag: 'MCMV', cat: 'mcmv' },
  'mcmv-faixa-3-indaiatuba':                         { tag: 'MCMV',                   cat: 'mcmv' },
  'como-se-inscrever-minha-casa-minha-vida-indaiatuba': { tag: 'MCMV', cat: 'mcmv' },
  'minha-casa-minha-vida-caixa-indaiatuba':          { tag: 'MCMV',                   cat: 'mcmv' },
  'como-usar-fgts-comprar-imovel-indaiatuba':        { tag: 'FGTS',                   cat: 'fgts' },
  'fgts-como-entrada-apartamento-indaiatuba':        { tag: 'FGTS',                   cat: 'fgts' },
  'fgts-imovel-na-planta-indaiatuba':                { tag: 'FGTS',                   cat: 'fgts' },
  'fgts-imovel-a-vista':                             { tag: 'FGTS',                   cat: 'fgts' },
  'como-comprar-apartamento-sem-fgts-indaiatuba':    { tag: 'FGTS',                   cat: 'fgts' },
  'morar-em-indaiatuba':                             { tag: 'Guia completo',          cat: 'morar' },
  'morar-em-indaiatuba-e-bom':                       { tag: 'Morar em Indaiatuba',    cat: 'morar' },
  'quanto-custa-morar-em-indaiatuba':                { tag: 'Custo de vida',          cat: 'morar' },
  'morar-em-indaiatuba-trabalhar-em-sao-paulo':      { tag: 'SP × Indaiatuba',        cat: 'morar' },
  'desvantagens-de-morar-em-indaiatuba':             { tag: 'Análise honesta',        cat: 'morar' },
  'morar-em-indaiatuba-e-seguro':                    { tag: 'Segurança · Página-dado', cat: 'seguranca' },
  'melhores-bairros-para-morar-indaiatuba':          { tag: 'Bairros',                cat: 'bairros' },
  'indaiatuba-ou-sorocaba':                          { tag: 'Comparativo',            cat: 'comparativos' },
  'indaiatuba-ou-campinas':                          { tag: 'Comparativo',            cat: 'comparativos' },
  'hospital-parque-dos-passaros-indaiatuba':         { tag: 'Cidade · Obra pública',  cat: 'cidade' },
  'apartamento-ou-lote-indaiatuba':                  { tag: 'Investimento',           cat: 'investimento' },
};
const DESTAQUES = new Set([
  'morar-em-indaiatuba', 'minha-casa-minha-vida-indaiatuba', 'como-usar-fgts-comprar-imovel-indaiatuba',
]);
const CATEGORIAS = [
  ['', 'Todos'], ['mcmv', 'Minha Casa Minha Vida'], ['fgts', 'FGTS'],
  ['morar', 'Morar em Indaiatuba'], ['bairros', 'Bairros'], ['seguranca', 'Segurança'],
  ['comparativos', 'Comparativos'], ['investimento', 'Investimento'], ['cidade', 'Vida na cidade'],
];
const MESES = ['JAN','FEV','MAR','ABR','MAI','JUN','JUL','AGO','SET','OUT','NOV','DEZ'];

// ─── coleta ───
const artigos = [];
const avisos = [];
for (const d of fs.readdirSync(R + 'blog', { withFileTypes: true })) {
  if (!d.isDirectory()) continue;
  const f = path.join(R, 'blog', d.name, 'index.html');
  if (!fs.existsSync(f)) continue;
  const h = fs.readFileSync(f, 'utf8');
  const headline = (h.match(/"headline":\s*"([^"]+)"/) || [])[1];
  const desc = (h.match(/<meta name="description" content="([^"]+)"/) || [])[1];
  const pub = (h.match(/"datePublished":\s*"([^"]+)"/) || [])[1];
  const tema = TEMA_POR_SLUG[d.name];
  if (!headline || !desc || !pub) { avisos.push(d.name + ': faltando headline/description/datePublished'); continue; }
  if (!tema) avisos.push(d.name + ': SEM TEMA em TEMA_POR_SLUG — entra como "Guia"');
  artigos.push({
    slug: d.name, headline, desc, pub,
    tag: tema ? tema.tag : 'Guia', cat: tema ? tema.cat : '',
    destaque: DESTAQUES.has(d.name),
  });
}
artigos.sort((a, b) => b.pub.localeCompare(a.pub) || a.headline.localeCompare(b.headline, 'pt-BR'));

const dataBonita = iso => {
  const [a, m, dia] = iso.split('-');
  return dia + ' ' + MESES[+m - 1] + ' ' + a;
};

const cardHtml = c => `    <a class="post-card${c.destaque ? ' destaque' : ''}" href="/blog/${c.slug}/" data-cat="${c.cat}">
      <span class="post-topo"><span class="post-tag">${c.tag}</span><time class="post-data" datetime="${c.pub}">${dataBonita(c.pub)}</time></span>
      <h2>${c.headline}</h2>
      <p>${c.desc}</p>
      <span class="post-link">Ler guia →</span>
    </a>`;

const schemaBlog = {
  '@context': 'https://schema.org', '@type': 'Blog',
  name: "Blog da Imobiliária Viv'América — Guia do Mercado Imobiliário de Indaiatuba",
  url: ABS + '/blog/',
  publisher: { '@type': 'Organization', name: "Imobiliária Viv'América",
    logo: { '@type': 'ImageObject', url: ABS + '/favicon.png' } },
  blogPost: artigos.map(c => ({ '@type': 'BlogPosting', headline: c.headline,
    datePublished: c.pub, url: ABS + '/blog/' + c.slug + '/' })),
};
const schemaCrumb = {
  '@context': 'https://schema.org', '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Início', item: ABS + '/' },
    { '@type': 'ListItem', position: 2, name: 'Blog' },
  ],
};

const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
<script src="/atrib.js"></script>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Blog | Guia do Mercado Imobiliário de Indaiatuba | Viv'América</title>
  <meta name="description" content="Guias sobre morar, comprar e financiar imóvel em Indaiatuba: MCMV, FGTS, bairros, segurança, custo de vida e comparativos — com dados e fontes, sem cadastro.">
  <meta name="robots" content="index, follow">
  <meta property="og:title" content="Blog | Guia do Mercado Imobiliário de Indaiatuba | Viv'América">
  <meta property="og:description" content="Guias sobre morar, comprar e financiar imóvel em Indaiatuba: MCMV, FGTS, bairros, segurança, custo de vida e comparativos — com dados e fontes, sem cadastro.">
  <meta property="og:type" content="website">
  <meta property="og:url" content="${ABS}/blog/">
  <meta property="og:site_name" content="Imobiliária Viv'América">
  <link rel="canonical" href="${ABS}/blog/">
  <link rel="icon" type="image/png" href="/favicon.png">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Josefin+Sans:wght@300;400;600;700&family=Poiret+One&display=swap" rel="stylesheet">

  <script type="application/ld+json">
  ${JSON.stringify(schemaBlog, null, 2)}
  </script>
  <script type="application/ld+json">
  ${JSON.stringify(schemaCrumb, null, 2)}
  </script>

  <style>
    *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
    :root{--preto:#161616;--dourado:#C9A227;--creme:#F7F5F0;--texto:#222;--texto-claro:#5a5a5a;--linha:#E6E1D6;}
    body{font-family:'Josefin Sans',system-ui,sans-serif;color:var(--texto);background:var(--creme);line-height:1.65;}
    header{background:var(--preto);padding:0 5%;display:flex;align-items:center;justify-content:space-between;height:72px;position:sticky;top:0;z-index:100;}
    .logo-text{color:#fff;font-family:'Poiret One',cursive;font-weight:400;letter-spacing:.22em;text-transform:uppercase;font-size:clamp(0.9rem,2vw,1.05rem);text-decoration:none;}
    nav{display:flex;align-items:center;}
    nav a{color:rgba(255,255,255,0.85);text-decoration:none;margin-left:1.6rem;font-size:0.78rem;letter-spacing:.08em;text-transform:uppercase;}
    nav a:hover,nav a.on{color:var(--dourado);}
    nav a.nav-cta{border:1px solid var(--dourado);color:var(--dourado);padding:.45rem .9rem;border-radius:4px;}
    nav a.nav-cta:hover{background:var(--dourado);color:var(--preto);}
    @media(max-width:680px){nav a{margin-left:.9rem;font-size:.7rem;}nav a:not(.nav-cta){display:none;}}
    .hero-blog{background:var(--preto);color:#fff;text-align:center;padding:clamp(3rem,7vw,4.5rem) 5% clamp(2.4rem,5vw,3.2rem);}
    .hero-blog .label{color:var(--dourado);text-transform:uppercase;letter-spacing:.3em;font-size:0.72rem;font-weight:600;}
    .hero-blog h1{font-family:'Poiret One',cursive;font-weight:400;letter-spacing:.12em;text-transform:uppercase;font-size:clamp(1.5rem,3.6vw,2.5rem);max-width:900px;margin:1rem auto .9rem;line-height:1.3;}
    .hero-blog p{opacity:.85;max-width:620px;margin:0 auto 1.6rem;font-weight:300;font-size:1rem;}
    .hero-acoes{display:flex;gap:.9rem;justify-content:center;flex-wrap:wrap;}
    .btn-solido{display:inline-block;background:var(--dourado);color:var(--preto);text-decoration:none;
      padding:.8rem 1.7rem;letter-spacing:.12em;text-transform:uppercase;font-size:.78rem;font-weight:600;border-radius:4px;}
    .btn-solido:hover{background:#E0C05A;}
    .btn-tabela{display:inline-block;border:1px solid var(--dourado);color:var(--dourado);text-decoration:none;
      padding:.8rem 1.6rem;letter-spacing:.12em;text-transform:uppercase;font-size:.78rem;font-weight:600;border-radius:4px;transition:all .2s;}
    .btn-tabela:hover{background:var(--dourado);color:var(--preto);}
    .breadcrumb{max-width:1160px;margin:1.4rem auto 0;padding:0 5%;font-size:0.8rem;color:var(--texto-claro);}
    .breadcrumb a{color:var(--texto-claro);text-decoration:none;}
    .breadcrumb a:hover{color:var(--dourado);}
    .temas{max-width:1160px;margin:1.2rem auto 0;padding:0 5%;display:flex;flex-wrap:wrap;gap:.45rem;}
    .tema-chip{font:inherit;font-size:.72rem;font-weight:600;letter-spacing:.1em;text-transform:uppercase;
      padding:.5rem .95rem;border:1px solid var(--linha);background:#fff;color:var(--texto-claro);cursor:pointer;border-radius:4px;}
    .tema-chip:hover{border-color:var(--dourado);color:var(--preto);}
    .tema-chip.is-on{background:var(--preto);border-color:var(--preto);color:var(--dourado);}
    .posts{max-width:1160px;margin:1.4rem auto 4rem;padding:0 5%;display:grid;
      grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:1.1rem;}
    .post-card{background:#fff;border:1px solid var(--linha);padding:1.3rem 1.35rem 1.15rem;text-decoration:none;
      color:inherit;display:flex;flex-direction:column;gap:.55rem;transition:border-color .2s, box-shadow .2s;border-radius:4px;}
    .post-card:hover{border-color:var(--dourado);box-shadow:0 8px 22px rgba(0,0,0,.07);}
    .post-card[hidden]{display:none;}
    .post-topo{display:flex;justify-content:space-between;align-items:baseline;gap:.6rem;}
    .post-tag{color:var(--dourado);font-size:0.68rem;font-weight:600;letter-spacing:.16em;text-transform:uppercase;}
    .post-data{color:#9a938a;font-size:0.66rem;font-weight:400;letter-spacing:.12em;white-space:nowrap;}
    .post-card h2{font-size:1.04rem;font-weight:600;color:var(--preto);line-height:1.4;}
    .post-card p{font-size:0.88rem;color:var(--texto-claro);font-weight:300;}
    .post-link{margin-top:auto;padding-top:.6rem;color:var(--preto);font-size:0.74rem;font-weight:600;
      letter-spacing:.14em;text-transform:uppercase;border-top:1px solid var(--linha);}
    .post-card:hover .post-link{color:var(--dourado);}
    .post-card.destaque{grid-column:1/-1;border-left:3px solid var(--dourado);}
    .post-card.destaque h2{font-size:1.2rem;}
    .vazio{max-width:1160px;margin:0 auto 3rem;padding:0 5%;color:var(--texto-claro);display:none;}
    footer{background:#101010;color:rgba(255,255,255,0.7);padding:2.5rem 5%;text-align:center;font-size:0.82rem;font-weight:300;}
    footer .footer-links{display:flex;flex-wrap:wrap;gap:1.4rem;justify-content:center;margin-bottom:1rem;}
    footer a{color:rgba(255,255,255,0.75);text-decoration:none;letter-spacing:.08em;text-transform:uppercase;font-size:0.74rem;}
    footer a:hover{color:var(--dourado);}
  </style>

  <!-- Google tag (gtag.js) -->
  <script async src="https://www.googletagmanager.com/gtag/js?id=G-40C0379NPR"></script>
  <script>
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', 'G-40C0379NPR');
    document.addEventListener('click', function(e) {
      var el = e.target.closest('a[href*="wa.me"]');
      if (el) { gtag('event', 'whatsapp_click', { event_category: 'conversao', event_label: document.title }); }
    });
  </script>
</head>
<body>
  <header>
    <a href="/" class="logo-text">Viv'America · Indaiatuba</a>
    <nav>
      <a href="/loteamentos-em-indaiatuba/">Loteamentos</a>
      <a href="/condominios-fechados-indaiatuba/">Condomínios</a>
      <a href="/blog/" class="on">Blog</a>
      <a href="/lancamentos-indaiatuba/" class="nav-cta">Lançamentos de Imóveis</a>
    </nav>
  </header>

  <section class="hero-blog">
    <p class="label">Blog da Viv'América · Indaiatuba/SP</p>
    <h1>Guia do Mercado Imobiliário de Indaiatuba</h1>
    <p>Morar, comprar e financiar em Indaiatuba — explicado com dados, fontes e preço aberto, sem cadastro.</p>
    <div class="hero-acoes">
      <a class="btn-solido" href="/lancamentos-indaiatuba/">Ver Lançamentos</a>
      <a class="btn-tabela" href="/precos-lancamentos-indaiatuba/">Tabela de preços →</a>
    </div>
  </section>

  <p class="breadcrumb"><a href="/">Imobiliária Viv'América</a> › Blog</p>

  <div class="temas" id="temas" role="group" aria-label="Filtrar artigos por tema">
${CATEGORIAS.map(([v, r], i) => '    <button class="tema-chip' + (i === 0 ? ' is-on' : '') + '" data-cat="' + v + '">' + r + '</button>').join('\n')}
  </div>

  <section class="posts" id="posts">
${artigos.map(cardHtml).join('\n')}
  </section>
  <p class="vazio" id="vazio">Nenhum artigo neste tema ainda — em breve.</p>

  <footer>
    <div class="footer-links">
      <a href="/">Início</a>
      <a href="/lancamentos-indaiatuba/">Lançamentos</a>
      <a href="/precos-lancamentos-indaiatuba/">Observatório de Preços</a>
      <a href="/blog/">Blog</a>
    </div>
    <p>© 2026 Imobiliária Viv'América · Lançamentos imobiliários em Indaiatuba SP</p>
  </footer>

  <script>
  (function(){
    var chips = document.querySelectorAll('.tema-chip');
    var cards = document.querySelectorAll('.post-card');
    var vazio = document.getElementById('vazio');
    function filtra(cat){
      var visiveis = 0;
      cards.forEach(function(c){
        var mostra = !cat || c.dataset.cat === cat;
        c.hidden = !mostra;
        if (mostra) visiveis++;
      });
      vazio.style.display = visiveis ? 'none' : 'block';
      chips.forEach(function(ch){ ch.classList.toggle('is-on', ch.dataset.cat === cat || (!cat && ch.dataset.cat === '')); });
    }
    document.getElementById('temas').addEventListener('click', function(ev){
      var b = ev.target.closest('.tema-chip');
      if (b) filtra(b.dataset.cat);
    });
    // deep-link: /blog/?c=mcmv abre já filtrado
    var c = new URLSearchParams(location.search).get('c');
    if (c) filtra(c);
  })();
  </script>
</body>
</html>
`;
fs.writeFileSync(R + 'blog/index.html', html, 'utf8');
console.log('gera-blog-indice: ' + artigos.length + ' artigos, mais novo: ' + artigos[0].pub + ' (' + artigos[0].slug + ')');
if (avisos.length) console.log('AVISOS:\n  ' + avisos.join('\n  '));
