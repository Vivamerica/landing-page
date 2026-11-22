/* ═══════════════════════════════════════════════════════════════════
   GERA-MCMV — /empreendimentos-minha-casa-minha-vida-indaiatuba/
   ───────────────────────────────────────────────────────────────────
   Página de categoria "Empreendimentos Minha Casa Minha Vida em
   Indaiatuba", GERADA INTEIRA daqui, no molde do gera-apartamentos.js
   (pedido do Fabio de 18/11/2026: uma página com todos os cards do MCMV).
   É a vitrine com os cards; o guia informativo continua no blog
   (/blog/minha-casa-minha-vida-indaiatuba/).

   Fontes (as mesmas do gera-apartamentos.js, pelo hub-comum.js): APTOS do
   gera-folheto.js, só os à venda pela lista "sem disponibilidade"; quem
   tem tarja vira card de esgotado no fim da seção dele; EDICAO do
   gera-observatorio.js; entidade e GA4 do identidade.js; menu do
   gera-menu.js. Nada desta página é escrito à mão: editar o HTML se perde
   na próxima rodada.

   REGRAS (derivadas só de t e p da fonte única — nada inventado):
   - #com-selo-mcmv   t começa com "MCMV" (marcado como MCMV neste site; o
                      texto NÃO afirma "selo no material da construtora",
                      porque a fonte varia: selo, tabela "Faixa 3" ou só o
                      site da construtora)
   - #cabem-no-teto   sem t MCMV e com p <= TETO_FAIXA_3 (R$ 400.000): o
                      preço "a partir de" cabe no teto da Faixa 3, mas o
                      material não traz o selo; se a construtora opera pelo
                      programa na Caixa, a imobiliária confirma caso a caso
   Cards do menor ao maior preço; sem preço no fim; esgotados por último.
   obsMcmv (campo opcional da fonte única) sai no card e no FAQ quando
   existe (ex.: quantas unidades da tabela ficam até o teto). A faixa de
   um empreendimento nunca é escrita aqui: quem enquadra é a Caixa, pela
   renda da família e pela unidade escolhida.

   Normas citadas no guia e no FAQ: as que o guia do blog publica
   (Portaria MCID 333/2026; Res. CCFGTS 702/2012, art. 20 e art. 32, e
   Res. CCFGTS 1.116/2025, na redação da Res. 1.148/2026; tabela do art. 20
   para as Faixas 1 e 2 na redação da Res. 1.138/2025). Mudou a norma,
   mude lá e aqui.

   Topo como os outros hubs: trilha, H1 fixo, linha de contagem e
   "Atualizado em mês/ano" (class atualizado: o gera-sitemap.js troca por
   dd/mm/aaaa quando o lastmod cai em outro mês). Grade logo depois; guia
   em section#guia e FAQ em div.faq-item > h3 + p embaixo. Depois das duas
   seções, a assinatura da lista (assinatura.js, desde 21/11/2026).
   <!--GEN:malha--> (gera-relacionados.js) e <style id="marca">
   (identidade.js) são preservados entre rodadas (hub-comum.js).

   Ritual (ordem completa no CHECKLIST-NOVA-PAGINA.md):
     … → gera-home → gera-apartamentos → gera-mcmv → gera-alphaville → …
   ═══════════════════════════════════════════════════════════════════ */

const H = require('./hub-comum.js');
const { R, APTOS, VENDIDOS, EDICAO, brl, mil, mesLongo, tabMes, tabDe, esc, semTags, eMCMV, wa, CSS_HUB } = H;
const SLUG = 'empreendimentos-minha-casa-minha-vida-indaiatuba';
const ABS = 'https://lancamentos.imoveisvivamerica.com.br';
const URL = ABS + '/' + SLUG + '/';
const TETO_FAIXA_3 = 400000;     // teto da Faixa 3 (Res. CCFGTS 702/2012, art. 20, na redação da Res. 1.148/2026)
const TETO_LOCAL_F12 = 264000;   // teto das Faixas 1 e 2 em Indaiatuba: tabela de municípios do Agente Operador do FGTS (Caixa), vigência 01/01/2026, lida em 21/11/2026. A célula da tabela do art. 20 da Res. 702/2012 dá 225.000, mas vale o maior valor entre o de antes e o de depois da Res. CCFGTS 1.062/2023 (art. 2º); a conta está no guia do blog
const PAGINA = 'empreendimentos Minha Casa Minha Vida em Indaiatuba';   // nome da página na mensagem do WhatsApp

// entidade única e tag GA4 (identidade.js); menu do site (gera-menu.js)
const { blocoEntidade, GA4, REF_IMOB } = require('./identidade.js');
const { MENU_CSS, MENU_HTML } = require('./gera-menu.js');
// assinatura da lista ("Levantamento Viv'América · tabelas de … · atualizado em … · CRECI"), depois das duas seções
const ASS = require('./assinatura.js');

// ─── seleção ───
const porPreco = (a, b) => (a.p || 9e12) - (b.p || 9e12);
const cabeNoTeto = e => !eMCMV(e) && !!e.p && e.p <= TETO_FAIXA_3;
const SELO = APTOS.filter(eMCMV).sort(porPreco);
const TETO = APTOS.filter(cabeNoTeto).sort(porPreco);
const esgotado = e => Object.assign({ esgotado: true }, e);
const SELO_ESG = VENDIDOS.filter(eMCMV).map(esgotado);
const TETO_ESG = VENDIDOS.filter(cabeNoTeto).map(esgotado);
const NS = SELO.length, NT = TETO.length;
if (!NS) throw new Error('nenhum empreendimento com t MCMV à venda na fonte única');
const comPreco = SELO.concat(TETO).filter(e => e.p);
const menor = comPreco.slice().sort(porPreco)[0];
const menorSelo = SELO.find(e => e.p);
const menorTeto = TETO[0];
const capa = menorSelo || menor;   // title e imagem de compartilhamento: o mais barato COM o selo
// guarda da fonte única (a mesma do gera-apartamentos.js): preço sem mês de tabela só em pré-lançamento declarado
const semMes = comPreco.filter(e => !e.tab && !/pré-lançamento/i.test(e.prox || ''));
if (semMes.length) throw new Error('preco sem mes de tabela (campo tab) e sem pre-lancamento em prox: ' + semMes.map(e => e.n).join(', '));
// tabela de pré-lançamento (preço sem tab) é sujeita a reajuste no lançamento oficial
const tabDeLonga = e => tabDe(e) + (e.tab ? '' : ', sujeita a reajuste no lançamento oficial');
const obsDe = e => e.obsMcmv ? String(e.obsMcmv) : '';
const maiuscula = s => s.charAt(0).toUpperCase() + s.slice(1);
const lista = a => a.length < 2 ? a.join('') : a.slice(0, -1).join(', ') + ' e ' + a[a.length - 1];

// ─── textos de SEO (com guarda de tamanho) ───
const TITLE = `Minha Casa Minha Vida em Indaiatuba | ${NS} desde ${mil(capa.p)}`;
const DESC = `${NS} empreendimentos com o selo do Minha Casa Minha Vida em Indaiatuba SP e ${NT} no teto de ${mil(TETO_FAIXA_3)}: a partir de ${mil(menor.p)} (${menor.tab ? tabMes(menor) : 'pré-lançamento'}).`;
const H1 = 'Empreendimentos Minha Casa Minha Vida em Indaiatuba';
const NUMEROS = `<b>${NS}</b> com o selo do programa · <b>${NT}</b> que ${NT === 1 ? 'cabe' : 'cabem'} no teto pelo preço`;
if (TITLE.length > 60) throw new Error('title com ' + TITLE.length + ' caracteres (max 60): ' + TITLE);
if (DESC.length < 120 || DESC.length > 155) throw new Error('description com ' + DESC.length + ' caracteres (120-155): ' + DESC);

// ─── cards ───
const card = e => H.card(e, { pagina: PAGINA, altDoCampo: true, obs: e => maiuscula(obsDe(e)) });
const SECOES = [
  { id: 'com-selo-mcmv', titulo: 'Com o selo do Minha Casa Minha Vida', itens: SELO, esg: SELO_ESG,
    sub: `Empreendimentos marcados como Minha Casa Minha Vida (MCMV) neste site, com financiamento pela Caixa e uso do Fundo de Garantia do Tempo de Serviço (FGTS) conforme a renda da família e a análise do banco. Do menor ao maior preço "a partir de", cada um com o mês da tabela.` },
  { id: 'cabem-no-teto', titulo: `Também cabem no teto de ${mil(TETO_FAIXA_3)} pelo preço`, itens: TETO, esg: TETO_ESG,
    sub: `O material destas construtoras não traz o selo do programa: entram aqui porque o preço "a partir de" fica até ${brl(TETO_FAIXA_3)}, o teto da Faixa 3, e nas unidades maiores o preço sobe e pode passar do teto. Se a construtora opera o empreendimento pelo programa na Caixa, a imobiliária confirma caso a caso; o enquadramento de qualquer imóvel, com ou sem selo, depende da renda da família e da análise da Caixa.` },
];
const secao = sc => `
    <section class="sec" id="${sc.id}">
      <h2>${esc(sc.titulo)} <small>${sc.itens.length}</small></h2>
      <p class="sub">${esc(sc.sub)}</p>
      ${sc.itens.length + sc.esg.length ? `<div class="grid">${sc.itens.concat(sc.esg).map(card).join('')}
      </div>` : `<p class="vazio">Nenhum empreendimento nesta condição em ${mesLongo}.</p>`}
    </section>`;

// ─── guia (curto, com fonte; números do guia do blog) ───
const GUIAS_BLOG = [
  ['minha-casa-minha-vida-indaiatuba', 'Guia completo do Minha Casa Minha Vida em Indaiatuba: faixas, juros e subsídio'],
  ['mcmv-faixa-3-indaiatuba', 'Faixa 3 em Indaiatuba: quanto ganha, quanto compra'],
  ['quem-tem-direito-minha-casa-minha-vida-indaiatuba', 'Quem tem direito ao Minha Casa Minha Vida'],
  ['como-se-inscrever-minha-casa-minha-vida-indaiatuba', 'Como se inscrever no Minha Casa Minha Vida em Indaiatuba'],
  ['minha-casa-minha-vida-caixa-indaiatuba', 'Minha Casa Minha Vida pela Caixa em Indaiatuba'],
  ['casa-minha-casa-minha-vida-indaiatuba', 'Casa pelo Minha Casa Minha Vida: nova ou usada, e o que existe hoje'],
  ['fgts-classe-media-imovel-600-mil', 'Programa Classe Média do FGTS: imóvel até R$ 600 mil'],
  ['fgts-como-entrada-apartamento-indaiatuba', 'FGTS como entrada em apartamento em Indaiatuba'],
].filter(([s]) => require('fs').existsSync(R + 'blog/' + s + '/index.html'));

// ─── FAQ (vira FAQPage) ───
const itemFaq = e => `${e.n} (${e.c}, ${e.p ? 'a partir de ' + brl(e.p) + ', ' + tabDe(e) : 'tabela sob consulta'}${obsDe(e) ? '; ' + obsDe(e) : ''})`;
// meses de tabela, do mais recente ao mais antigo; pré-lançamento por último
const grupos = new Map();
comPreco.slice().sort((a, b) => (b.tab || '').localeCompare(a.tab || '')).forEach(e => {
  const k = tabDe(e);
  if (!grupos.has(k)) grupos.set(k, []);
  grupos.get(k).push(e.n);
});
// "nenhum cabe no teto local" só quando TODO card da página (à venda e esgotado) tem preço acima dele
const foraDoTetoLocal = SELO.concat(SELO_ESG, TETO, TETO_ESG).every(e => e.p && e.p > TETO_LOCAL_F12);
const FAQ = [
  { q: 'Quais empreendimentos do Minha Casa Minha Vida há em Indaiatuba?',
    a: `Nesta página estão ${NS} empreendimentos com o selo do Minha Casa Minha Vida, do menor ao maior preço "a partir de": ${lista(SELO.map(itemFaq))}.` +
       (NT ? ` Outros ${NT} não trazem o selo, mas o preço "a partir de" fica dentro do teto de ${brl(TETO_FAIXA_3)} da Faixa 3: ${lista(TETO.map(itemFaq))}.` : '') +
       ` Em qual faixa cada família se enquadra, e se a unidade escolhida cabe no programa, quem confirma é a Caixa na análise de crédito.` },
  { q: 'Qual o empreendimento Minha Casa Minha Vida de menor preço em Indaiatuba?',
    a: (menorSelo ? `Entre os empreendimentos desta página com o selo do programa, o ${menorSelo.n} (${menorSelo.c}), a partir de ${brl(menorSelo.p)} (${tabDeLonga(menorSelo)}).` : 'Nenhum empreendimento com o selo tem preço publicado nesta edição.') +
       (menorTeto ? ` Sem o selo, o de menor preço desta página que cabe no teto de ${brl(TETO_FAIXA_3)} é o ${menorTeto.n} (${menorTeto.c}), a partir de ${brl(menorTeto.p)} (${tabDeLonga(menorTeto)}); se a construtora opera esse empreendimento pelo programa na Caixa, a imobiliária confirma caso a caso.` : '') +
       ` É o preço da menor unidade na data da tabela: as outras unidades do mesmo empreendimento custam mais e podem passar do teto.` },
  { q: 'Posso usar o FGTS para comprar pelo Minha Casa Minha Vida?',
    a: `Pode, conforme as regras do Fundo de Garantia do Tempo de Serviço (FGTS), a renda da família e a análise de crédito da Caixa. O saldo entra como entrada, como amortização do saldo devedor ou no pagamento de parte das parcelas. Quem soma 3 anos de trabalho sob o regime do FGTS, contando todos os contratos, é cotista e tem juros 0,5 ponto menores (Resolução 702/2012 do Conselho Curador do FGTS, art. 32, § 1º). A imobiliária simula; quem aprova é a Caixa.` },
  { q: 'Qual renda preciso para comprar pelo Minha Casa Minha Vida?',
    a: `Depende da renda bruta da família que vai morar no imóvel e do valor do imóvel. Pela Portaria 333/2026 do Ministério das Cidades (MCID), a Faixa 1 vai até R$ 3.200, a Faixa 2 de R$ 3.200,01 a R$ 5.000 e a Faixa 3 de R$ 5.000,01 a R$ 9.600. Nas Faixas 1 e 2 o teto do imóvel vai de R$ 210.000 a R$ 275.000, conforme o município (em Indaiatuba, ${brl(TETO_LOCAL_F12)}, pela tabela de municípios do Agente Operador do FGTS, publicada pela Caixa e em vigor desde 01/01/2026; confirme na simulação); na Faixa 3, ${brl(TETO_FAIXA_3)}.${foraDoTetoLocal ? ' Nenhum empreendimento desta página cabe no teto das Faixas 1 e 2 em Indaiatuba (' + brl(TETO_LOCAL_F12) + '): quem ganha até R$ 5.000 compra pelo teto de ' + brl(TETO_FAIXA_3) + ', sem subsídio e sem os juros reduzidos da faixa (Res. CCFGTS 702/2012, art. 20, § 5º).' : ''} No programa Classe Média do FGTS, a renda vai até R$ 13.000 e o imóvel até R$ 600.000 (Resolução CCFGTS 1.148/2026). O teto vale para o valor do imóvel que a Caixa considerar.` },
  { q: 'Os preços desta página são de quando?',
    a: `Cada card traz o mês da tabela da construtora: ${[...grupos].map(([k, ns]) => k + ' (' + lista(ns) + ')').join('; ')}. O preço "a partir de" é o da menor unidade na data da tabela e pode mudar por andar, posição e condição de pagamento; a tabela de pré-lançamento é sujeita a reajuste no lançamento oficial.` },
];
if (!grupos.size) throw new Error('sem preço para o FAQ');

// ─── schemas ───
const TODOS = SELO.concat(SELO_ESG, TETO, TETO_ESG);
const jsonColecao = {
  '@context': 'https://schema.org', '@type': 'CollectionPage',
  '@id': URL + '#pagina', url: URL, name: H1, description: DESC, inLanguage: 'pt-BR',
  publisher: REF_IMOB,
  mainEntity: {
    '@type': 'ItemList',
    name: 'Empreendimentos Minha Casa Minha Vida em Indaiatuba SP',
    description: `Com o selo do programa (${NS}) e sem o selo com preço "a partir de" até ${brl(TETO_FAIXA_3)} (${NT}), representados pela Imobiliária Viv'América em Indaiatuba. Edição de ${mesLongo} do Observatório de Preços.`,
    numberOfItems: TODOS.length,
    itemListElement: TODOS.map((e, i) => ({ '@type': 'ListItem', position: i + 1, name: e.n, url: ABS + '/' + e.slug + '/' })),
  },
};
const jsonBread = {
  '@context': 'https://schema.org', '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Início', item: ABS + '/' },
    { '@type': 'ListItem', position: 2, name: 'Empreendimentos Minha Casa Minha Vida', item: URL },
  ],
};
const jsonFaq = {
  '@context': 'https://schema.org', '@type': 'FAQPage',
  mainEntity: FAQ.map(f => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: semTags(f.a) } })),
};

const ARQ = R + SLUG + '/index.html';
const { malha: malhaAnterior, marca: marcaAnterior } = H.lerAnterior(ARQ);

const CSS_MCMV = `
    .obs{font-size:.78rem;line-height:1.4;color:#5a4a12;background:#f7f1dc;border-left:3px solid var(--dourado);padding:.4rem .6rem;margin:-.3rem 0 .75rem;border-radius:0 4px 4px 0}
    .guia{max-width:80ch}
    .guia p{margin:0 0 .9rem;color:#4a4a42}
    .guia ul{margin:0 0 1rem 1.2rem;color:#4a4a42}
    .guia li{margin-bottom:.35rem}
    .guia a{color:var(--preto);font-weight:600;text-decoration:none;border-bottom:1px solid var(--dourado)}
    .guia .fonte{font-size:.82rem;color:var(--muted)}
    .guia-links{list-style:none;margin:.4rem 0 0 !important;display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:.5rem}
    .guia-links a{display:block;height:100%;background:#fff;border:1px solid var(--linha);border-left:3px solid var(--dourado);padding:.65rem .85rem;border-radius:4px;font-size:.9rem}
    .faq-item{background:#fff;border:1px solid var(--linha);border-radius:4px;margin-bottom:.6rem;padding:1rem 1.2rem}
    .faq-item h3{font-size:1rem;margin:0 0 .45rem;line-height:1.35}
    .faq-item p{color:#4a4a42;max-width:78ch}`;

const HTML = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
<script src="/atrib.js"></script>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${esc(TITLE)}</title>
  <meta name="description" content="${esc(DESC)}">
  <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1">
  <meta property="og:title" content="${esc(TITLE)}">
  <meta property="og:description" content="${esc(DESC)}">
  <meta property="og:type" content="website">
  <meta property="og:image" content="${ABS}/${capa.img}">
  <meta property="og:url" content="${URL}">
  <meta property="og:locale" content="pt_BR">
  <meta property="og:site_name" content="Imobiliária Viv'América">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${esc(TITLE)}">
  <meta name="twitter:description" content="${esc(DESC)}">
  <meta name="twitter:image" content="${ABS}/${capa.img}">
  <link rel="canonical" href="${URL}">
  <link rel="icon" type="image/png" href="/favicon.png">
  ${blocoEntidade()}
  <script type="application/ld+json">
  ${JSON.stringify(jsonColecao)}
  </script>
  <script type="application/ld+json">
  ${JSON.stringify(jsonBread)}
  </script>
  <script type="application/ld+json">
  ${JSON.stringify(jsonFaq)}
  </script>
${GA4}
  <link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Josefin+Sans:wght@300;400;600;700&family=Poiret+One&display=swap" rel="stylesheet">
  <style>
${CSS_HUB}${CSS_MCMV}
  </style>
  ${MENU_CSS}
</head>
<body>
${MENU_HTML}

  <section class="topo">
    <div class="wrap">
      <p class="breadcrumb"><a href="/">Início</a> › Empreendimentos Minha Casa Minha Vida</p>
      <h1>${esc(H1)}</h1>
      <p class="hub-numeros">${NUMEROS}</p>
      <p class="hub-edicao atualizado">Atualizado em ${mesLongo}</p>
    </div>
  </section>

  <nav class="atalhos" aria-label="Atalhos da página">
    <a href="#com-selo-mcmv">com o selo do programa</a>
    <a href="#cabem-no-teto">cabem no teto pelo preço</a>
    <a href="#guia">faixas e tetos</a>
    <a href="#faq">perguntas</a>
    <a href="/apartamentos-na-planta-indaiatuba/">todos os apartamentos na planta</a>
  </nav>

  <div class="section">
${SECOES.map(secao).join('\n')}
    ${ASS.bloco(SELO.concat(TETO))}

    <section class="sec guia" id="guia">
      <h2>Faixas e tetos do Minha Casa Minha Vida</h2>
      <p>O Minha Casa Minha Vida é o programa habitacional do governo federal, regido pela Lei 14.620/2023 e operado principalmente pela Caixa Econômica Federal com recursos do FGTS. As faixas de renda são da Portaria 333/2026 do Ministério das Cidades (MCID), em vigor desde 01/04/2026. Os tetos de valor do imóvel estão na Resolução 702/2012 do Conselho Curador do FGTS (CCFGTS) e na Res. CCFGTS 1.116/2025, do programa Classe Média, as duas na redação da Res. CCFGTS 1.148/2026, em vigor desde 30/03/2026.</p>
      <ul>
        <li><strong>Faixas 1 e 2</strong> (renda bruta familiar até R$ 3.200 e de R$ 3.200,01 a R$ 5.000): teto de R$ 210.000 a R$ 275.000, conforme o município (em Indaiatuba, ${brl(TETO_LOCAL_F12)}, pela tabela de municípios do Agente Operador do FGTS, publicada pela Caixa, em vigor desde 01/01/2026 e lida em 21/11/2026; a tabela é anterior à Res. CCFGTS 1.148/2026: confirme na simulação. Res. CCFGTS 702/2012, art. 20, tabela na redação da Res. 1.138/2025, e Res. CCFGTS 1.062, de 20/06/2023, art. 2º); com renda até R$ 5.000 também dá para comprar até ${brl(TETO_FAIXA_3)}, mas sem subsídio e sem os juros reduzidos da faixa (Res. CCFGTS 702/2012, art. 20, § 5º, na redação da Res. 1.148/2026);</li>
        <li><strong>Faixa 3</strong>: imóvel até ${brl(TETO_FAIXA_3)}, renda bruta familiar de R$ 5.000,01 a R$ 9.600 (renda: Portaria MCID 333/2026; teto: Res. CCFGTS 702/2012, art. 20, na redação da Res. 1.148/2026);</li>
        <li><strong>Programa Classe Média do FGTS</strong>: imóvel até R$ 600.000, renda até R$ 13.000 (Res. CCFGTS 1.116/2025, na redação da Res. 1.148/2026).</li>
      </ul>
      <p>O teto vale para o valor do imóvel que a Caixa considerar, e o enquadramento é por unidade: num mesmo empreendimento, as unidades com preço acima do teto ficam fora. O FGTS entra como entrada, amortização ou parte das parcelas, conforme as regras do Fundo, a renda e a análise da Caixa. A imobiliária simula, quem aprova é a Caixa.</p>
      <p>Procura casa? Entre os lançamentos que representamos em Indaiatuba não há casa, só apartamentos e lotes. O programa também financia casa pronta, nova ou usada: veja <a href="/blog/casa-minha-casa-minha-vida-indaiatuba/">casa pelo Minha Casa Minha Vida em Indaiatuba</a>.</p>
      <p class="fonte">Fontes: Portaria MCID 333/2026 (Diário Oficial da União de 01/04/2026); Res. CCFGTS 702/2012, art. 20 (tabela das Faixas 1 e 2 na redação da Res. 1.138/2025), e Res. CCFGTS 1.116/2025, na redação da Res. 1.148/2026. Juros, subsídio e como chegamos ao teto das Faixas 1 e 2 em Indaiatuba estão no guia completo, abaixo.</p>
      <ul class="guia-links">${GUIAS_BLOG.map(([s, t]) => `
        <li><a href="/blog/${s}/">${esc(t)}</a></li>`).join('')}
        <li><a href="/apartamentos-na-planta-indaiatuba/">Todos os apartamentos na planta em Indaiatuba, do popular ao alto padrão</a></li>
      </ul>
    </section>

    <section class="sec faq" id="faq">
      <h2>Perguntas frequentes</h2>
${FAQ.map(f => `      <div class="faq-item">
        <h3>${esc(f.q)}</h3>
        <p>${f.a}</p>
      </div>`).join('\n')}
    </section>

    <div class="cta">
      <strong>Quer saber em qual faixa você se enquadra?</strong>
      <p>A simulação sai com a renda da sua família e o valor da unidade escolhida. A imobiliária simula, quem aprova é a Caixa.</p>
      <a class="btn" href="${wa('Olá! Vi a página de empreendimentos Minha Casa Minha Vida em Indaiatuba e quero simular com a minha renda.')}" target="_blank" rel="noopener">Falar no WhatsApp</a>
    </div>

    <p class="links-uteis">
      <a href="/apartamentos-na-planta-indaiatuba/">Apartamentos na planta</a>
      <a href="/precos-lancamentos-indaiatuba/">Observatório de Preços (${mesLongo})</a>
      <a href="/blog/minha-casa-minha-vida-indaiatuba/">Guia do Minha Casa Minha Vida</a>
      <a href="/blog/fgts-classe-media-imovel-600-mil/">Classe Média do FGTS</a>
    </p>
  </div>

  <!--GEN:malha-->${malhaAnterior}<!--/GEN:malha-->

  <footer>
    <div class="footer-links">
      <a href="/">Início</a>
      <a href="/apartamentos-na-planta-indaiatuba/">Apartamentos na planta</a>
      <a href="/${SLUG}/">Minha Casa Minha Vida</a>
      <a href="/loteamentos-em-indaiatuba/">Loteamentos</a>
      <a href="/condominios-fechados-indaiatuba/">Condomínios fechados</a>
      <a href="/precos-lancamentos-indaiatuba/">Observatório de Preços</a>
      <a href="/blog/">Blog</a>
    </div>
    <p>© ${EDICAO.ano} Imobiliária Viv'América · Empreendimentos Minha Casa Minha Vida em Indaiatuba SP · CRECI 47394-J</p>
  <p class="nap">Imobiliária Viv'América · CRECI 47394-J · Av. Higienópolis, 70 – Jardim União, Indaiatuba/SP · <a href="https://wa.me/5519989769457">+55 19 98976-9457</a> · <a href="/sobre/">Sobre a imobiliária</a> · <a href="https://imoveisvivamerica.com.br/politica-de-privacidade">Política de Privacidade</a></p>
  </footer>
</body>
</html>
`;

H.gravar(ARQ, HTML, marcaAnterior);
console.log('gera-mcmv: ' + TODOS.length + ' cards (' + NS + ' com selo MCMV, ' + NT + ' no teto de ' + brl(TETO_FAIXA_3) + ' sem selo, ' +
  (SELO_ESG.length + TETO_ESG.length) + ' esgotados) · edicao ' + mesLongo);
console.log('  title ' + TITLE.length + ' chars · description ' + DESC.length + ' chars');
console.log('  selo: ' + SELO.map(e => e.n).join(', '));
console.log('  teto: ' + TETO.map(e => e.n).join(', '));
