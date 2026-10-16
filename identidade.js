/* IDENTIDADE VISUAL — Poiret One + Josefin Sans, preto #161616 e dourado #C9A227
   (a mesma do site principal imoveisvivamerica.com.br)

   Ritual: criou landing/página nova → node identidade.js   (sempre o ÚLTIMO gerador)
   Idempotente: aplica cores, fontes e a camada <style id="marca"> só onde falta.
   Fora do escopo: folheto-lancamentos.html e folder*.html (impressos aprovados).
   Acentos por produto (verde Vívere, marrom VIC) são preservados — só o chrome
   (header, hero, footer, botões) entra na marca.

   Desde 10/10/2026 este arquivo também é a FONTE ÚNICA de duas coisas que todas
   as páginas do site carregam (o mapa de lotes inclusive):
   - a tag GA4 (<script id="ga4">): só carrega o gtag.js fora de localhost,
     127.0.0.1 e previews *.netlify.app; o evento whatsapp_click manda o rótulo
     do botão (event_label), a posição (cta_pos: hero|meio|flutuante|rodape|barra)
     e a página (origem). No blog o bloco é do gera-blog-ofertas.js (mesma guarda,
     origem = slug do artigo) e não é tocado aqui. O par antigo (<script async
     gtag/js> + gtag('config')) é convertido onde ainda existir.
   - a entidade única (ENTIDADE): um nó RealEstateAgent com @id dentro do marcador
     <!--GEN:entidade-->; os outros blocos JSON-LD passam a referenciar o @id em
     seller/broker/publisher/creator/offeredBy (REF_IMOB) e o author do BlogPosting
     vira a Pessoa (PESSOA). Qualquer RealEstateAgent de topo que outro gerador
     emita é substituído pelo marcador.
   Geradores em JS importam daqui:
     const { GA4, blocoEntidade, REF_IMOB, PESSOA } = require('./identidade.js');

   Guarda 5 (10/10/2026): o lastmod do sitemap.xml, o dateModified dos JSON-LD e
   o "Atualizado em" visível de cada página têm de contar a mesma data; quem os
   alinha é o gera-sitemap.js, que roda logo antes deste.

   Guarda 6 (15/10/2026): o menu do site (gera-menu.js) em toda página: um
   GEN:menu igual ao do gerador logo depois do <body>, um <style id="menu-site-css">
   no <head>, um único id="menu-site" (o do <header>), nenhum <header> fora do
   bloco, nenhum nav.nav-site e nenhum GEN:menu vazio (ficha gerada sem o
   ritual). Impressos nunca têm menu.

   node identidade.js --conferir   não grava nada: diz quantos arquivos as fases
   1 a 3 mudariam e roda todas as guardas sobre os arquivos como estão (exit 1 se
   alguma falhar), para conferir uma árvore em que outros geradores ainda mexem. */
const fs = require('fs');
const path = require('path');
const RAIZ = 'C:\\Users\\Usuario\\Desktop\\landing-page';
const DOMINIO = 'https://lancamentos.imoveisvivamerica.com.br/';

const CORES = [
  ['linear-gradient(100deg, rgba(15,28,41,.93) 0%, rgba(15,28,41,.74) 48%, rgba(15,28,41,.42) 100%)',
   'linear-gradient(100deg, rgba(16,16,16,.93) 0%, rgba(16,16,16,.74) 48%, rgba(16,16,16,.40) 100%)'],
  ['linear-gradient(135deg,var(--navy),#24405c)', '#161616'],
  ['#1a2b3c', '#161616'], ['#0f1c29', '#161616'], ['#24405c', '#2a2a2a'],
  ['#1A2B3C', '#161616'], ['#0F1C29', '#161616'], ['#C9A84C', '#C9A227'],
  ['#1a1a1a', '#161616'],
  ['#0f2a1a', '#161616'], ['#0a1f12', '#101010'],  // chrome verde do Vivere -> marca
  ['#c9a84c', '#C9A227'], ['#a8862e', '#8f7418'], ['#d4a962', '#C9A227'],
  ['#13212e', '#101010'], ['#fbfaf6', '#F7F5F0'], ['#f7f7f5', '#F7F5F0'],
  ['#faf8f2', '#F7F5F0'], ['#f3ecd8', '#F5EFDF'], ['#fdfaf2', '#FBF8F0'],
  ['#e6e0d0', '#E6E1D6'],
  ['"Segoe UI", Arial, sans-serif', "'Josefin Sans', system-ui, sans-serif"],
  ['"Segoe UI",Arial,sans-serif', "'Josefin Sans',system-ui,sans-serif"], ['#ddd6c4', '#DCD6C6'], ['#e8dcbb', '#E4D9BC'],
];
const EMOJIS = ['📚','📊','🏠','📍','✅','🚗','🏢','🏞️','🔥','⚠️','⚠','🎯','💰','📄','🔑','🧮','🏦','📈','📉','🛵','⭐','✂️','🗞️','📦','🚦','☑️','✔️','🌳','🏗️','🔒','🏡','🌿','💧','🚌','🎓','🩺'];

const FONTS = '<link rel="preconnect" href="https://fonts.googleapis.com">\n' +
  '<link href="https://fonts.googleapis.com/css2?family=Josefin+Sans:wght@300;400;600;700&family=Poiret+One&display=swap" rel="stylesheet">';

const MARCA = `
  <style id="marca">
    /* Identidade Viv'América — Poiret One + Josefin Sans, preto e dourado */
    body, button, input, select, textarea { font-family:'Josefin Sans', system-ui, sans-serif; }
    .logo-text { font-family:'Poiret One', cursive; font-weight:400; letter-spacing:.2em;
                 text-transform:uppercase; }
    h1 { font-family:'Poiret One', cursive; font-weight:400; letter-spacing:.08em;
         text-transform:uppercase; line-height:1.25; }
    h2, h3 { font-weight:600; }
    /* width/height nas <img> reservam espaço; quando o CSS só fixa a largura, a altura do
       atributo esticava o logo (Andorinha/Colibri/Tangará, 04/09/2026) */
    :where(img[width][height]) { height:auto; }   /* :where = especificidade zero: qualquer CSS da página vence (o .logo{height:90px} do Terras perdia) */
    @media (max-width:760px) { body:has(.wa-float, .float-wpp, .whats-flutuante) footer { padding-bottom: 6.5rem; } }   /* 07/09: o botão flutuante do WhatsApp cobria a linha NAP do rodapé no celular */
    nav a { letter-spacing:.08em; text-transform:uppercase; font-size:0.78rem; }
    .tag, .selo-h, .card-badge, .chip, .post-tag, .filtro-label { letter-spacing:.1em; }
    .btn-wpp, .btn-tipo, .btn-card, .cta a { border-radius:4px; letter-spacing:.05em; }
    .nav-cta { border:1px solid #C9A227; color:#C9A227 !important; padding:.45rem .9rem; border-radius:4px; }
    .nav-cta:hover { background:#C9A227; color:#161616 !important; }
    .cta-topo { display:flex; flex-wrap:wrap; gap:.8rem; align-items:center; justify-content:space-between;
                background:#161616; padding:1rem 1.2rem; margin:1.4rem 0 1.8rem; border-radius:4px; }
    .cta-topo p { color:#fff; margin:0; font-weight:300; font-size:.95rem; }
    .cta-topo a { background:#C9A227; color:#161616; font-weight:600; padding:.7rem 1.3rem; text-decoration:none;
                  letter-spacing:.08em; text-transform:uppercase; font-size:.78rem; border-radius:4px; white-space:nowrap; }
    .cta-topo a:hover { background:#E0C05A; }
    .malha { background:#161616; padding:2.2rem 5%; }
    .malha-in { max-width:1160px; margin:0 auto; }
    .malha-titulo { font-family:'Poiret One', cursive; font-weight:400; letter-spacing:.18em;
                    text-transform:uppercase; color:#C9A227; font-size:.95rem; margin:0 0 1rem; }
    /* flex-wrap: os links saem do gerador colados (sem espaço entre <a>) e com
       nowrap; como inline puro viravam UMA linha de 1.700px e o celular
       encolhia a página inteira (02/09/2026). Cada link é um item flex. */
    .malha-grupo { display:flex; flex-wrap:wrap; align-items:baseline; gap:.15rem .9rem;
                   margin:0 0 .7rem; line-height:1.8; max-width:100%; }
    .malha-rotulo { color:#C9A227; font-size:.68rem; font-weight:600; letter-spacing:.16em;
                    text-transform:uppercase; }
    .malha a { color:rgba(255,255,255,.78); text-decoration:none; font-size:.82rem;
               font-weight:300; white-space:nowrap; }
    .malha a:hover { color:#C9A227; }
  </style>`;

// ─── ENTIDADE ÚNICA (NAP) — a imobiliária como um só nó em todo o site ───
// Horário: o que a página /sobre/ publica (seg–sex 08:30–18:00, sáb 09:00–12:00).
// legalName sem acento, como consta no registro da empresa. sameAs só com perfis
// da empresa que respondem (Instagram, Facebook, YouTube e LinkedIn, conferidos em
// 10/10/2026; o perfil no Chaves na Mão ficou fora porque a URL respondia 404).
const ID_IMOB = 'https://imoveisvivamerica.com.br/#imobiliaria';
const NOME_IMOB = "Imobiliária Viv'América";
const REF_IMOB = { '@type': 'RealEstateAgent', '@id': ID_IMOB, name: NOME_IMOB };
const ENTIDADE = {
  '@context': 'https://schema.org',
  '@type': 'RealEstateAgent',
  '@id': ID_IMOB,
  name: NOME_IMOB,
  alternateName: ["Viv'América Imóveis", 'Imobiliária Viva América'],
  legalName: 'Imobiliaria Viva America Ltda - ME',
  taxID: '57.213.317/0001-23',
  identifier: { '@type': 'PropertyValue', propertyID: 'CRECI', value: '47394-J' },
  description: 'Imobiliária de Indaiatuba/SP (CRECI 47394-J) que comercializa lançamentos imobiliários: apartamentos na planta, loteamentos e condomínios fechados, com o preço da tabela oficial e o mês de referência em cada página.',
  url: DOMINIO,
  logo: DOMINIO + 'favicon.png',
  image: DOMINIO + 'images/hero.jpg',
  telephone: '+5519989769457',
  email: 'financeiro@imoveisvivamerica.com.br',
  address: {
    '@type': 'PostalAddress',
    streetAddress: 'Av. Higienópolis, 70 - Jardim União',
    addressLocality: 'Indaiatuba',
    addressRegion: 'SP',
    postalCode: '13348-671',
    addressCountry: 'BR',
  },
  areaServed: { '@type': 'City', name: 'Indaiatuba' },
  openingHoursSpecification: [
    { '@type': 'OpeningHoursSpecification', dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'], opens: '08:30', closes: '18:00' },
    { '@type': 'OpeningHoursSpecification', dayOfWeek: 'Saturday', opens: '09:00', closes: '12:00' },
  ],
  knowsAbout: [
    'Lançamentos imobiliários em Indaiatuba',
    'Minha Casa Minha Vida',
    'Financiamento Caixa e uso de FGTS',
    'Condomínios fechados e loteamentos em Indaiatuba',
  ],
  sameAs: [
    'https://www.instagram.com/imoveisvivamerica',
    'https://www.facebook.com/imoveisvivamerica',
    'https://www.youtube.com/@ImoveisVivAmerica',
    'https://www.linkedin.com/company/imobiliaria-vivamerica',
  ],
  contactPoint: { '@type': 'ContactPoint', telephone: '+5519989769457', contactType: 'sales', areaServed: 'BR', availableLanguage: 'Portuguese' },
};
// Autor dos artigos do blog: definido por inteiro em /sobre/#fabio-correia e
// repetido (com o mesmo @id) no author de cada BlogPosting.
const ID_PESSOA = DOMINIO + 'sobre/#fabio-correia';
const PESSOA = {
  '@type': 'Person',
  '@id': ID_PESSOA,
  name: 'Fabio Correia',
  jobTitle: 'Corretor de imóveis',
  identifier: { '@type': 'PropertyValue', propertyID: 'CRECI', value: '303686-F' },
  url: ID_PESSOA,
  image: DOMINIO + 'images/fabio-correia.jpg',
  worksFor: REF_IMOB,
};
function blocoEntidade() {
  return '<!--GEN:entidade-->\n  <script type="application/ld+json">\n  ' +
    JSON.stringify(ENTIDADE, null, 2).replace(/\n/g, '\n  ') + '\n  </script>\n  <!--/GEN:entidade-->';
}

// ─── TAG GA4 com guarda — o mesmo bloco em todas as páginas fora do blog ───
// cta_pos: data-cta (blog), data-origem (mapa) ou a posição inferida pelo
// contêiner do botão; origem: caminho da página; lote: só no mapa.
const GA4 = String.raw`  <script id="ga4">
    // GA4 só em produção: localhost, 127.0.0.1 e previews *.netlify.app ficam fora da medição
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    (function () {
      if (/localhost|127\.0\.0\.1|netlify\.app$/.test(location.hostname)) return;
      var s = document.createElement('script');
      s.async = true; s.src = 'https://www.googletagmanager.com/gtag/js?id=G-40C0379NPR';
      document.head.appendChild(s);
      gtag('js', new Date()); gtag('config', 'G-40C0379NPR');
    })();
    // whatsapp_click: rótulo do botão, posição (hero|meio|flutuante|rodape|barra) e página de origem
    document.addEventListener('click', function (e) {
      var el = e.target.closest('a[href*="wa.me"]');
      if (!el) return;
      var pos = el.getAttribute('data-cta') ||
        ({ topo: 'hero', flutuante: 'flutuante', lote: 'meio', lista: 'rodape' })[el.getAttribute('data-origem')] ||
        (el.closest('.wa-float, .wa-float-home, .float-wpp, .whats-flutuante') ? 'flutuante' :
         el.closest('.bo-barra, .barra-wa') ? 'barra' :
         el.closest('header, .hero, #hero, .topo, .cta-topo, .article-hero') ? 'hero' :
         el.closest('footer, .cta, .cta-section, .cta-final') ? 'rodape' : 'meio');
      var p = {
        event_category: 'conversao',
        event_label: ((el.textContent || '').replace(/\s+/g, ' ').trim() || el.getAttribute('aria-label') || '').slice(0, 100),
        cta_pos: pos,
        origem: location.pathname
      };
      if (el.getAttribute('data-lote')) p.lote = el.getAttribute('data-lote');
      gtag('event', 'whatsapp_click', p);
    });
  </script>`;

function trocarCores(s) {
  for (const [de, para] of CORES) s = s.split(de).join(para);
  return s;
}
function tirarEmojis(s) {
  for (const e of EMOJIS) {
    s = s.split('>' + e + ' ').join('>');
    s = s.split('>' + e).join('>');
    s = s.split('"' + e + ' ').join('"');
    s = s.split("'" + e + ' ').join("'");   // template literals dos geradores
    s = s.split('`' + e + ' ').join('`');
  }
  return s;
}

// Nome da marca sempre com apóstrofo reto: o Google casa a entidade pelo name, e
// "Viv’América" (apóstrofo tipográfico) não é "Viv'América". Vale no texto e no
// JSON-LD; <script> comum fica de fora para não mexer em string JS.
const RE_NOME_CURVO = /Viv[‘’´`]Am[eé]rica/g;
function apostrofoReto(h) {
  return h.split(/(<script\b[^>]*>[\s\S]*?<\/script>)/).map(parte =>
    (/^<script\b/.test(parte) && !/^<script type="application\/ld\+json"/.test(parte))
      ? parte : parte.replace(RE_NOME_CURVO, m => "Viv'" + m.slice(4))).join('');
}

function reskinPagina(html) {
  let h = apostrofoReto(trocarCores(html));
  if (!h.includes('family=Poiret+One')) h = h.replace('<style>', FONTS + '\n  <style>');
  if (h.includes('id="marca"')) {
    h = h.replace(/\n?\s*<style id="marca">[\s\S]*?<\/style>/, MARCA);
  } else {
    const i = h.indexOf('</style>');
    if (i > 0) h = h.slice(0, i + 8) + MARCA + h.slice(i + 8);
  }
  h = tirarEmojis(h);
  return h;
}

// ─── GA4: converte o par antigo e normaliza o bloco <script id="ga4"> ───
const RE_GA4 = /[ \t]*<script id="ga4">[\s\S]*?<\/script>/;
const SRC_GTAG = '<script async src="https://www.googletagmanager.com/gtag/js?id=G-40C0379NPR"></script>';
const RE_CONFIG = /gtag\(\s*'config'\s*,\s*'G-40C0379NPR'\s*\)\s*;?/;
// Tira do <script> antigo só o que era GA4 (init do dataLayer, gtag js/config e o
// ouvinte do whatsapp_click, formatado ou minificado) e devolve o que sobrar — o
// Vívere, por exemplo, guardava o mapa sob demanda no mesmo <script>.
function semGA4(corpo) {
  let s = corpo;
  const ini = s.indexOf('document.addEventListener(');
  if (ini >= 0) {
    let prof = 0, fim = -1;
    for (let x = ini; x < s.length; x++) {
      if (s[x] === '(') prof++;
      else if (s[x] === ')' && --prof === 0) { fim = x + 1; break; }
    }
    const wa = s.indexOf('whatsapp_click', ini);
    if (fim > 0 && wa > ini && wa < fim) {
      if (s[fim] === ';') fim++;
      s = s.slice(0, ini) + s.slice(fim);
    }
  }
  for (const re of [
    /window\.dataLayer\s*=\s*window\.dataLayer\s*\|\|\s*\[\]\s*;?/,
    /function gtag\(\)\s*\{\s*dataLayer\.push\(arguments\)\s*;?\s*\}/,
    /gtag\(\s*'js'\s*,\s*new Date\(\)\s*\)\s*;?/,
    RE_CONFIG,
    /\/\/ Rastrear cliques no WhatsApp como convers[^\n]*/,
  ]) s = s.replace(re, '');
  return s.replace(/^[ \t]*\n/gm, '').replace(/\s+$/, '');
}
function aplicarGA4(h, pagina) {
  if (pagina.startsWith('blog/')) return h;                    // bloco do blog: gera-blog-ofertas.js / gera-blog-indice.js
  if (h.includes('<script id="ga4">')) return h.replace(RE_GA4, () => GA4);
  const i = h.indexOf(SRC_GTAG);
  if (i < 0) return h;                                         // página sem GA4: nada a converter
  const j = h.indexOf('<script>', i + SRC_GTAG.length);
  const k = j < 0 ? -1 : h.indexOf('</script>', j);
  if (j < 0 || k < 0 || h.slice(i + SRC_GTAG.length, j).trim() !== '' || !RE_CONFIG.test(h.slice(j, k))) {
    throw new Error(pagina + ': tag GA4 antiga sem o bloco gtag(config) logo depois');
  }
  const resto = semGA4(h.slice(j + '<script>'.length, k));
  if (/gtag\(|dataLayer/.test(resto)) {
    throw new Error(pagina + ': o <script> do GA4 antigo tem código de medição que o conversor não reconhece:\n' + resto);
  }
  // o comentário "<!-- Google Analytics GA4 -->" e a indentação do par antigo saem junto
  const antes = h.slice(0, i).replace(/[ \t]*(<!-- Google Analytics GA4 -->\n)?[ \t]*$/, '');
  return antes + GA4 + (resto ? '\n  <script>\n' + resto + '\n  </script>' : '') + h.slice(k + '</script>'.length);
}

// ─── ENTIDADE: um só RealEstateAgent por página; os demais nós referenciam o @id ───
const RE_LD = /([ \t]*)<script type="application\/ld\+json">([\s\S]*?)<\/script>([ \t]*\n?)/g;
const A_ENT = '<!--GEN:entidade-->', B_ENT = '<!--/GEN:entidade-->', MARCA_ENT = '\u0000ENTIDADE\u0000';
const RE_NOME_IMOB = /viv.?am[eé]rica|viva am[eé]rica/i;
const TIPOS_ORG = ['Organization', 'LocalBusiness', 'Corporation', 'RealEstateAgent'];
const tipos = v => [].concat((v && v['@type']) || []);
const ehObj = v => !!v && typeof v === 'object' && !Array.isArray(v);
const clone = o => JSON.parse(JSON.stringify(o));
const igual = (a, b) => JSON.stringify(a) === JSON.stringify(b);
function ehImobiliaria(v) {
  if (!ehObj(v)) return false;
  if (v['@id'] === ID_IMOB) return true;
  const t = tipos(v);
  if (t.includes('RealEstateAgent')) return true;
  return t.some(x => TIPOS_ORG.includes(x)) && RE_NOME_IMOB.test(String(v.name || ''));
}
function ehFabio(v) {
  return ehObj(v) && tipos(v).includes('Person') && /^fabio correia$/i.test(String(v.name || '').trim());
}
// Dentro de um nó: a imobiliária vira REF_IMOB (ou PESSOA, se for author de BlogPosting);
// a pessoa vira PESSOA. brand é a construtora e nunca entra. Devolve true se mudou.
function normalizar(o, topo) {
  let mudou = false;
  const canonico = (v, chave) => {
    if (ehImobiliaria(v)) return clone(chave === 'author' && topo === 'BlogPosting' ? PESSOA : REF_IMOB);
    if (ehFabio(v)) return clone(PESSOA);
    return null;
  };
  for (const k of Object.keys(o)) {
    if (k === 'brand') continue;
    const v = o[k];
    const itens = Array.isArray(v) ? v : [v];
    itens.forEach((x, i) => {
      if (!ehObj(x)) return;
      const n = canonico(x, k);
      if (n) { if (!igual(x, n)) { if (Array.isArray(v)) v[i] = n; else o[k] = n; mudou = true; } }
      else if (normalizar(x, topo)) mudou = true;
    });
  }
  return mudou;
}
const serializar = o => '<script type="application/ld+json">\n  ' + JSON.stringify(o, null, 2).replace(/\n/g, '\n  ') + '\n  </script>';
// aninhados=false: só injeta o bloco da entidade (o mapa tem JSON-LD de outro gerador)
function aplicarEntidade(h, pagina, aninhados) {
  const ia = h.indexOf(A_ENT), ib = h.indexOf(B_ENT);
  if (ia >= 0 && ib > ia) h = h.slice(0, ia) + MARCA_ENT + h.slice(ib + B_ENT.length);
  let colocou = h.includes(MARCA_ENT);
  const invalidos = [];
  h = h.replace(RE_LD, (m, ind, corpo, fim) => {
    let o; try { o = JSON.parse(corpo); } catch (e) { invalidos.push(e.message.slice(0, 60)); return m; }
    if (Array.isArray(o)) {
      const novo = o.filter(x => !ehImobiliaria(x));
      novo.forEach(x => { if (ehObj(x) && aninhados) normalizar(x, tipos(x)[0]); });
      return igual(o, novo) ? m : ind + serializar(novo) + fim;
    }
    if (!ehObj(o)) return m;
    if (ehImobiliaria(o)) {                              // RealEstateAgent de topo: sai, e o marcador fica no lugar do primeiro
      if (colocou) return '';
      colocou = true;
      return ind + MARCA_ENT + fim;
    }
    if (ehFabio(o)) {
      const n = Object.assign({ '@context': 'https://schema.org' }, PESSOA);
      return igual(o, n) ? m : ind + serializar(n) + fim;
    }
    if (!aninhados || !normalizar(o, tipos(o)[0])) return m;
    return ind + serializar(o) + fim;
  });
  if (invalidos.length) throw new Error(pagina + ': JSON-LD inválido (' + invalidos.join('; ') + ')');
  if (!colocou) h = h.replace('</head>', () => '  ' + MARCA_ENT + '\n</head>');
  return h.split(MARCA_ENT).join(blocoEntidade());
}

// Páginas do site: as mesmas que o validador conta (ferramentas, qrcode, seo... ficam fora)
const FORA = /^(ferramentas|qrcode|seo|node_modules|\.git|\.claude|folder|treinamento)(\/|$)/;
const MAPA = 'mapa-lotes-indaiatuba/index.html';
function listarPaginas() {
  const out = [];
  (function andar(d) {
    for (const n of fs.readdirSync(d, { withFileTypes: true })) {
      const p = path.join(d, n.name);
      const rel = path.relative(RAIZ, p).split(path.sep).join('/');
      if (n.isDirectory()) { if (!FORA.test(rel)) andar(p); }
      else if (n.name === 'index.html') out.push(rel);
    }
  })(RAIZ);
  return out.sort();
}

// ─── GUARDA 5: as três datas de uma página contam a mesma história ───
// Referência: o <lastmod> do sitemap.xml (gera-sitemap.js, lido do git — data do
// último commit que mudou o texto principal). O dateModified de todo JSON-LD e o
// "Atualizado em" visível (p.procedencia nas fichas, p.meta no blog, .atualizado
// no Observatório, em /sobre/ e na página de apartamentos, GEN:atualizado nos hubs
// de loteamentos e de condomínios) têm de bater: dd/mm/aaaa
// exato; "mês/ano" vale pela granularidade do texto. Em 09/10/2026 o commit
// 038b3c7 carimbou 59 lastmod sem mudar texto enquanto 48 páginas diziam outra
// data no dateModified — o Google só usa o lastmod "se for consistente".
// Também pega página do site fora do sitemap e URL do sitemap sem página.
function guardaDatas(paginas) {
  const { lerDatas, mesmaData, paginaDoLoc } = require('./gera-sitemap.js');
  const sm = fs.readFileSync(path.join(RAIZ, 'sitemap.xml'), 'utf8');
  const lastmod = new Map();
  sm.replace(/<loc>([^<]+)<\/loc>\s*<lastmod>([^<]+)<\/lastmod>/g, (m, loc, d) => { lastmod.set(paginaDoLoc(loc), d); return m; });
  const erros = [];
  for (const p of paginas) {
    const h = fs.readFileSync(path.join(RAIZ, p), 'utf8');
    const lm = lastmod.get(p);
    if (!lm) { if (!/<meta name="robots" content="[^"]*noindex/.test(h)) erros.push(p + ': fora do sitemap.xml'); continue; }
    const d = lerDatas(h);
    const problemas = [];
    for (const dm of new Set(d.dateModified)) if (dm.slice(0, 10) !== lm) problemas.push('dateModified ' + dm);
    if (d.visivel && !mesmaData(d.visivel, lm)) problemas.push('"Atualizado em ' + d.visivel.texto + '"');
    if (problemas.length) erros.push(p + ' (lastmod ' + lm + '): ' + problemas.join(', '));
  }
  for (const p of lastmod.keys()) if (!paginas.includes(p)) erros.push(p + ': no sitemap.xml sem página no site');
  return erros;
}

function main() {
  const CONFERIR = process.argv.includes('--conferir');
  let falhou = false;
  const falha = () => { falhou = true; if (!CONFERIR) process.exit(1); };
  const grava = (f, s) => { if (!CONFERIR) fs.writeFileSync(f, s, 'utf8'); };
  if (CONFERIR) console.log('--conferir: nada é gravado; as guardas leem os arquivos como estão');
  // ─── Fase 1: geradores ───
  for (const g of ['gera-observatorio.js', 'gera-home.js']) {
    const f = path.join(RAIZ, g);
    let s = fs.readFileSync(f, 'utf8');
    const antes = s;
    s = trocarCores(s);
    s = tirarEmojis(s);
    s = s.split("'Segoe UI',system-ui,Arial,sans-serif").join("'Josefin Sans',system-ui,sans-serif");
    s = s.split('"Segoe UI",Arial,sans-serif').join("'Josefin Sans',system-ui,sans-serif");
    // observatorio emite a pagina inteira: fontes + display no proprio template
    if (g === 'gera-observatorio.js' && !s.includes('family=Poiret+One')) {
      s = s.replace('<style>', FONTS + '\n<style>');
      s = s.replace("body{font-family:'Josefin Sans'",
        "h1{font-family:'Poiret One',cursive;font-weight:400;letter-spacing:.08em;text-transform:uppercase;line-height:1.25}\n  body{font-family:'Josefin Sans'");
    }
    if (s !== antes) grava(f, s);
    console.log(g + ': ' + (s !== antes ? (CONFERIR ? 'mudaria' : 'atualizado') : 'ja estava'));
  }

  // ─── Fase 2: paginas (camada de marca) ───
  const alvos = ['index.html'];
  for (const d of fs.readdirSync(RAIZ, { withFileTypes: true })) {
    if (!d.isDirectory()) continue;
    if (['seo', 'images', '.git', '.claude', 'mapa-lotes-indaiatuba'].includes(d.name)) continue;   // o mapa é um app Leaflet, fora da camada de marca
    if (d.name === 'blog') { for (const b of fs.readdirSync(path.join(RAIZ,'blog'))) { const fb = path.join('blog', b, 'index.html'); if (fs.existsSync(path.join(RAIZ, fb))) alvos.push(fb); } alvos.push(path.join('blog','index.html')); continue; }
    const f = path.join(d.name, 'index.html');
    if (fs.existsSync(path.join(RAIZ, f))) alvos.push(f);
  }

  let n = 0, iguais = 0;
  for (const a of alvos) {
    const f = path.join(RAIZ, a);
    const antes = fs.readFileSync(f, 'utf8');
    const depois = reskinPagina(antes);
    if (depois !== antes) { grava(f, depois); n++; if (CONFERIR) console.log('  mudaria (marca): ' + a.split(path.sep).join('/')); } else iguais++;
  }
  console.log('paginas: ' + n + (CONFERIR ? ' mudariam' : ' transformadas') + ', ' + iguais + ' ja estavam (' + alvos.length + ' alvos)');

  // ─── Fase 3: tag GA4 com guarda + entidade única, em todas as páginas do site ───
  const paginas = listarPaginas();
  let nGa4 = 0, nEnt = 0;
  for (const p of paginas) {
    const f = path.join(RAIZ, p);
    const antes = fs.readFileSync(f, 'utf8');
    const comGa4 = aplicarGA4(antes, p);
    const depois = aplicarEntidade(comGa4, p, p !== MAPA);
    if (comGa4 !== antes) nGa4++;
    if (depois !== comGa4) nEnt++;
    if (depois !== antes) { grava(f, depois); if (CONFERIR) console.log('  mudaria (GA4/entidade): ' + p); }
  }
  console.log('ga4: ' + nGa4 + ' paginas ' + (CONFERIR ? 'a tocar' : 'tocadas') + '; entidade: ' + nEnt + ' paginas ' + (CONFERIR ? 'a tocar' : 'tocadas') + ' (' + paginas.length + ' paginas do site)');

  // GUARDA: acento duplamente codificado ("HÃ©lade", "ImobiliÃ¡ria", "â€”").
  // Em 02/09/2026 havia 453 ocorrencias em 39 paginas, dentro do JSON-LD
  // (name/description do Product e do RealEstateAgent) e no rodape — tudo de um
  // unico commit (28a7875) que gravou o schema lido como CP1252. O Google casa a
  // entidade pelo name: "HÃ©lade" nao e' "Hélade". Falha alto para nao voltar.
  const _c = String.fromCharCode;
  const _cont = _c(0x80) + '-' + _c(0xBF) + _c(0x20AC) + _c(0x2013) + _c(0x2014) + _c(0x201C) + _c(0x201D) + _c(0x2018) + _c(0x2019) + _c(0x2026) + _c(0x2122);
  const MOJIBAKE = new RegExp('[' + _c(0xC2) + _c(0xC3) + '][' + _cont + ']|' + _c(0xE2) + '[' + _cont + '][' + _cont + ']');
  const sujos = alvos.filter(a => MOJIBAKE.test(fs.readFileSync(path.join(RAIZ, a), 'utf8')));
  if (sujos.length) {
    console.error('ACENTO CORROMPIDO em ' + sujos.length + ' pagina(s): ' + sujos.join(', ') + '\n  -> rode o desmojibake (scratchpad) ou corrija a origem; nao publique assim.');
    falha();
  }

  // GUARDA 2: imagem referenciada tem de existir no disco. Em 02/09/2026 tres
  // paginas apontavam para terras-de-san-marino-indaiatuba/images/hero.jpg (o hero
  // da Terras mora em /images/hero.jpg, na raiz) — 404 no <img> de dois cards e no
  // "image" do Product. Cobre <img src>, og:image/twitter:image, url(...) de CSS
  // e image/logo/thumbnailUrl dentro dos JSON-LD, so' para caminhos locais
  // (relativos, absolutos ou com o dominio do site). Falha alto.
  const EXT_IMG = /\.(jpe?g|png|webp|gif|svg|avif)$/i;
  function localizar(ref, pagina) {
    if (!ref || /^(data:|blob:|#)/.test(ref)) return null;
    let r = ref.trim();
    if (r.startsWith(DOMINIO)) r = '/' + r.slice(DOMINIO.length);
    else if (/^(https?:)?\/\//i.test(r)) return null;           // host externo: fora do escopo
    r = r.split(/[?#]/)[0];
    try { r = decodeURIComponent(r); } catch (e) { /* mantem */ }
    if (!EXT_IMG.test(r)) return null;
    const base = r.startsWith('/') ? RAIZ : path.dirname(path.join(RAIZ, pagina));
    return path.resolve(base, r.startsWith('/') ? r.slice(1) : r);
  }
  function colherImagens(h) {
    const refs = [];
    h.replace(/<img\b[^>]*?\s(?:src|data-src)="([^"]+)"/gi, (m, u) => { refs.push(u); return m; });
    h.replace(/<meta\s+(?:property|name)="(?:og:image|twitter:image)"\s+content="([^"]+)"/gi, (m, u) => { refs.push(u); return m; });
    h.replace(/url\(\s*['"]?([^'")]+)['"]?\s*\)/gi, (m, u) => { refs.push(u); return m; });
    h.replace(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g, (m, j) => {
      let o; try { o = JSON.parse(j); } catch (e) { return m; }
      (function anda(v) {
        if (Array.isArray(v)) return v.forEach(anda);
        if (v && typeof v === 'object') for (const k of Object.keys(v)) {
          if (['image', 'logo', 'thumbnailUrl'].includes(k)) {
            const x = v[k]; (Array.isArray(x) ? x : [x]).forEach(i => { if (typeof i === 'string') refs.push(i); else if (i && i.url) refs.push(i.url); });
          } else anda(v[k]);
        }
      })(o);
      return m;
    });
    return refs;
  }
  const faltantes = [];
  for (const a of alvos) {
    const h = fs.readFileSync(path.join(RAIZ, a), 'utf8');
    const vistos = new Set();
    for (const ref of colherImagens(h)) {
      const abs = localizar(ref, a);
      if (!abs || vistos.has(abs)) continue;
      vistos.add(abs);
      if (!fs.existsSync(abs)) faltantes.push(a + ' -> ' + ref);
    }
  }
  if (faltantes.length) {
    console.error('IMAGEM INEXISTENTE (' + faltantes.length + '):\n  ' + faltantes.join('\n  ') + '\n  -> corrija o caminho ou coloque o arquivo; nao publique assim.');
    falha();
  }

  // GUARDA 3: uma tag GA4 por página, sempre com a guarda de host (o par antigo
  // carregava o gtag.js em localhost e nos previews da Netlify e inflava a medição).
  // GUARDA 4: todo JSON-LD parseia; um só RealEstateAgent de topo, com o @id da
  // entidade, dentro do marcador; nenhum nó da imobiliária ou do autor sem @id.
  const errosMed = [];
  for (const p of paginas) {
    const h = fs.readFileSync(path.join(RAIZ, p), 'utf8');
    const nTag = (h.match(/<script id="ga4">/g) || []).length;
    const nSrc = (h.match(/googletagmanager\.com\/gtag\/js/g) || []).length;
    if (nTag !== 1 || nSrc !== 1 || h.includes(SRC_GTAG)) errosMed.push(p + ': tag GA4 (' + nTag + ' bloco(s), ' + nSrc + ' src)');
    if (!/\/localhost\|127\\\.0\\\.0\\\.1\|netlify\\\.app\$\/\.test\(location\.hostname\)/.test(h)) errosMed.push(p + ': tag GA4 sem a guarda de host');
    const ia = h.indexOf(A_ENT), ib = h.indexOf(B_ENT);
    if (ia < 0 || ib < ia || h.indexOf(A_ENT, ia + 1) >= 0) errosMed.push(p + ': marcador GEN:entidade ausente ou duplicado');
    let topoRea = 0;
    const semId = [];
    for (const m of h.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) {
      let o; try { o = JSON.parse(m[1]); } catch (e) { errosMed.push(p + ': JSON-LD inválido: ' + e.message.slice(0, 60)); continue; }
      const nos = Array.isArray(o) ? o : [o];
      for (const x of nos) {
        if (ehImobiliaria(x)) { topoRea++; if (x['@id'] !== ID_IMOB || x.name !== NOME_IMOB) semId.push('topo'); }
        if (p === MAPA) continue;
        (function anda(v, chave) {
          if (Array.isArray(v)) return v.forEach(i => anda(i, chave));
          if (!ehObj(v)) return;
          if (v !== x && chave !== 'brand') {
            if (ehImobiliaria(v) && v['@id'] !== ID_IMOB) semId.push(chave);
            if (ehFabio(v) && v['@id'] !== ID_PESSOA) semId.push(chave);
          }
          for (const k of Object.keys(v)) anda(v[k], k);
        })(x, '');
      }
    }
    if (topoRea !== 1) errosMed.push(p + ': ' + topoRea + ' RealEstateAgent de topo (esperado 1)');
    if (semId.length) errosMed.push(p + ': nó da imobiliária/autor sem @id em ' + semId.join(', '));
    if (RE_NOME_CURVO.test(h)) errosMed.push(p + ': nome da marca com apóstrofo tipográfico dentro de <script> (troque na origem)');
    RE_NOME_CURVO.lastIndex = 0;
  }
  if (errosMed.length) {
    console.error('MEDIÇÃO/ENTIDADE (' + errosMed.length + '):\n  ' + errosMed.join('\n  ') + '\n  -> corrija o gerador da página; nao publique assim.');
    falha();
  }
  const errosData = guardaDatas(paginas);
  if (errosData.length) {
    console.error('DATAS DIVERGENTES (' + errosData.length + '):\n  ' + errosData.join('\n  ') + '\n  -> rode node gera-sitemap.js (logo antes deste) ou corrija o gerador da página; nao publique assim.');
    falha();
  }
  // GUARDA 6: o menu do site, igual em toda página (gera-menu.js é a fonte única; ver o cabeçalho)
  const errosMenu = require('./gera-menu.js').guardaMenu(RAIZ);
  if (errosMenu.length) {
    console.error('MENU (' + errosMenu.length + '):\n  ' + errosMenu.join('\n  ') + '\n  -> rode node gera-menu.js (depois do gera-relacionados) ou corrija o gerador da página; nao publique assim.');
    falha();
  }
  if (falhou) process.exit(1);
  console.log('guardas: acentos ok, imagens ok, GA4 ok, entidade ok, datas ok, menu ok (' + alvos.length + ' alvos de marca, ' + paginas.length + ' paginas do site)');
}

if (require.main === module) main();

module.exports = { ID_IMOB, REF_IMOB, ENTIDADE, ID_PESSOA, PESSOA, GA4, blocoEntidade, aplicarGA4, aplicarEntidade, guardaDatas, listarPaginas };
