/* ═══════════════════════════════════════════════════════════════════
   GERA-APARTAMENTOS — /apartamentos-na-planta-indaiatuba/
   ───────────────────────────────────────────────────────────────────
   A página de categoria "Apartamentos na planta" é GERADA INTEIRA daqui,
   no mesmo padrão do gera-observatorio.js: lê APTOS do gera-folheto.js
   (fonte única), EXTRAS_APTOS do gera-relacionados.js (landings vivas de
   apartamento fora da fonte única — esgotados), EDICAO do
   gera-observatorio.js (mês da edição; o mês da tabela de cada
   apartamento vem do campo tab da fonte única) e o nó RealEstateAgent da home
   (index.html), para que a entidade seja a mesma em todo o site.

   Nasceu em 02/09/2026 com a decisão "opção B": a home é a única dona
   do termo "lançamentos imobiliários indaiatuba"; o hub
   /lancamentos-indaiatuba/ virou 301 para a home; esta página responde
   por "apartamentos na planta / em lançamento" em Indaiatuba. O domínio
   raiz (imoveisvivamerica.com.br/site/venda/indaiatuba/apartamentos)
   responde por apartamentos PRONTOS de revenda — link cruzado aqui.

   REGRAS DE CLASSIFICAÇÃO (derivadas só de p, t e s — nada inventado):
   - #2-dormitorios      s declara "2 dorm"; só sem contagem declarada em s vale
                         t começar com "MCMV" (o Uni é MCMV de 1 dormitório)
   - #3-suites-alto-padrao t === "Alto padrão" OU s contém "3 suítes"
   - #ate-300-mil        p <= 300.000
   - #300-a-600-mil      300.000 < p <= 600.000
   - #acima-de-600-mil   p > 600.000            (sem p = fora das faixas)
   - #pre-lancamento     t === "Pré-lançamento"
   - #em-obras           s traz data de entrega "mmm/aaaa" (ex.: dez/2026)
                         e t não é pré-lançamento
   - #pronto             t contém "Pronto" OU s contém "pronto"
   Empreendimento sem sinal de fase em t/s NÃO entra em seção de fase
   (Uni, Tangará, Colibri, Itamaracá, Aurora: a fonte única não diz).
   Os EXTRAS (esgotados) entram só na grade e no ItemList, sem preço e
   sem faixa/fase.

   Tabela-resumo: dormitórios, m² e entrega/fase são lidos de s por regex;
   o que não está em s vira "—". A coluna "Tabela" é o mês de tab.

   Escassez: o selo "Últimas N unidades (data)" só sai quando a fonte única
   traz est (até 60) E estEm (data da contagem); sem data, não há selo.

   Ordem: cards por preço crescente; sem preço no fim; esgotados por último.

   Topo (como a home e os outros dois hubs: os cards primeiro, o texto
   embaixo): H1 fixo "Apartamentos na planta em Indaiatuba"; logo abaixo,
   a linha "N lançamentos, M com preço aberto" e "Atualizado em mês/ano"
   (mês da edição). Essa linha da data tem a classe atualizado: o
   gera-sitemap.js a lê como a data visível da página e, se o lastmod cair
   em outro mês, troca o texto por dd/mm/aaaa (a guarda 5 do identidade.js
   confere). Os atalhos seguem logo depois do topo; o parágrafo de abertura
   fica embaixo da grade de cards.

   O bloco <!--GEN:malha--> é preenchido pelo gera-relacionados.js (que
   roda DEPOIS deste); ao regerar, o conteúdo anterior da malha é
   preservado para a página não ficar sem malha entre um passo e outro.
   A camada <style id="marca"> é do identidade.js (último do ritual).

   Ritual (ordem completa no CHECKLIST-NOVA-PAGINA.md):
     gera-folheto → gera-observatorio → gera-home → gera-apartamentos → gera-mcmv →
     gera-alphaville → gera-blog-ofertas → gera-blog-indice → gera-relacionados → identidade
   Fontes, utilitários, card, CSS base, malha e marca: hub-comum.js (comuns com o
   gera-mcmv.js, que gera /empreendimentos-minha-casa-minha-vida-indaiatuba/).
   ═══════════════════════════════════════════════════════════════════ */

const fs = require('fs');
// fontes, utilitários, card, CSS base, malha e marca: comuns com o gera-mcmv.js (hub-comum.js)
const H = require('./hub-comum.js');
const { R, extrair, SD, APTOS, VENDIDOS, EDICAO, brl, mil, mesLongo, mesExtenso, mesDe, tabMes, tabDe, esc, semTags, eMCMV, wa, CSS_HUB } = H;
const SLUG = 'apartamentos-na-planta-indaiatuba';
const ABS = 'https://lancamentos.imoveisvivamerica.com.br';
const URL = ABS + '/' + SLUG + '/';
const SITE_PRONTOS = 'https://imoveisvivamerica.com.br/site/venda/indaiatuba/apartamentos';

// ─── fontes ───
// APTOS (só os à venda), VENDIDOS (tarja da lista "sem disponibilidade") e EDICAO vêm do hub-comum.js
const EXTRAS = extrair('gera-relacionados.js', 'EXTRAS_APTOS')
  .filter(e => fs.existsSync(R + e.slug + '/index.html') && !SD.oculto(e.slug));

// entidade única (nó RealEstateAgent com @id) e tag GA4 com guarda: fonte única em identidade.js
const { blocoEntidade, GA4 } = require('./identidade.js');
// menu do site: fonte única em gera-menu.js
const { MENU_CSS, MENU_HTML } = require('./gera-menu.js');

// ─── utilitários: brl, mil, mesDe, tabMes, tabDe, esc, semTags, miniatura (hub-comum.js) ───

// ─── classificação (regras no cabeçalho) ───
// Só vale como ENTREGA a data precedida da palavra "entrega" nas specs da fonte única
// ("(set/2026)" e "tabela ago/2026" são datas de tabela/estoque, não de entrega — 04/09/2026).
const RE_DATA = /entrega\s+(jan|fev|mar|abr|mai|jun|jul|ago|set|out|nov|dez)\/(\d{4})\b/i;
// Texto da entrega como a spec traz: uma data ("nov/2028") ou duas, quando o prazo muda de torre
// para torre ("abr/2028 (Torre 1) e set/2028 (Torre 2)"). Com duas, a tabela-resumo e o FAQ mostram
// as duas, para o preço "a partir de" não aparecer ao lado só da primeira. A fase e a ordem
// continuam pela primeira data (RE_DATA).
const RE_DATAS = /entrega\s+((?:jan|fev|mar|abr|mai|jun|jul|ago|set|out|nov|dez)\/\d{4}(?:\s*\([^)]*\))?(?:\s+e\s+(?:jan|fev|mar|abr|mai|jun|jul|ago|set|out|nov|dez)\/\d{4}(?:\s*\([^)]*\))?)?)/i;
const datasEntrega = e => { const d = (e.s || '').match(RE_DATAS); return d ? d[1].replace(/[a-z]{3}(?=\/\d{4})/gi, x => x.toLowerCase()) : ''; };
// Quando a spec DECLARA a contagem de dormitorios, ela manda. Pela regra antiga (MCMV OU
// contagem na spec), todo MCMV caia na secao de dois dormitorios mesmo quando a spec dizia
// outra coisa (out/2026, comunicado de construtora corrigindo a configuracao de um produto).
const dormsDeclarados = e => { const m = (e.s || '').match(/(\d)\s*dorm/i); return m ? +m[1] : null; };
const e2dorm = e => { const d = dormsDeclarados(e); return d !== null ? d === 2 : eMCMV(e); };
const e3suites = e => e.t === 'Alto padrão' || /3 su[ií]tes/i.test(e.s || '');
const faixa = e => !e.p ? null : e.p <= 300000 ? 'ate-300-mil' : e.p <= 600000 ? '300-a-600-mil' : 'acima-de-600-mil';
function fase(e) {
  if (e.t === 'Pré-lançamento') return 'pre-lancamento';
  if (/pronto/i.test(e.t || '') || /pronto/i.test(e.s || '')) return 'pronto';
  if (RE_DATA.test(e.s || '')) return 'em-obras';
  return null;
}
function entregaTexto(e) {
  const f = fase(e);
  if (f === 'pre-lancamento') return 'Pré-lançamento';
  if (f === 'pronto') return 'Pronto para morar';
  const m = (e.s || '').match(RE_DATA);
  // "previsão de entrega" quando a spec da fonte única diz assim; senão "entrega", como a spec
  if (m) return 'Em obras · ' + (/previs[aã]o de entrega/i.test(e.s) ? 'previsão de entrega ' : 'entrega ') + (datasEntrega(e) || m[1].toLowerCase() + '/' + m[2]);
  return '—';
}
function dormsTexto(e) {
  const s = e.s || '';
  let m = s.match(/(\d)\s*dorm(?:\.|itórios?)?(\s*c\/\s*su[ií]te)?/i);
  if (m) return m[1] + ' dorm' + (m[2] ? ' c/ suíte' : '');
  m = s.match(/(\d(?:\s*e\s*\d)?)\s*su[ií]tes/i);
  if (m) return m[1].replace(/\s+/g, ' ') + ' suítes';
  return '—';
}
function m2Texto(e) {
  // "65 a 91 m²" e também "63,85 e 64,44 m²" (duas plantas): sem o "e", só a 2ª metragem aparecia
  const m = (e.s || '').match(/(\d+(?:,\d+)?(?:\s*(?:a|e)\s*\d+(?:,\d+)?)?)\s*m²/);
  return m ? m[1].replace(/\s+/g, ' ') + ' m²' : '—';
}

// ─── ordenação: preço crescente, sem preço no fim, esgotados por último ───
const ativos = APTOS.slice().sort((a, b) => (a.p || 9e12) - (b.p || 9e12));
const esgotados = VENDIDOS.concat(EXTRAS).map(e => Object.assign({ esgotado: true }, e));
const todos = ativos.concat(esgotados);

const comPreco = ativos.filter(e => e.p);
const menor = comPreco.reduce((a, b) => a.p < b.p ? a : b);
const maior = comPreco.reduce((a, b) => a.p > b.p ? a : b);
const N = APTOS.length;
const NP = comPreco.length;
// guardas da fonte única: preço sem mês de tabela só vale em pré-lançamento declarado,
// e contagem de estoque sem data (estEm) não vira selo de escassez
const semMes = comPreco.filter(e => !e.tab && !/pré-lançamento/i.test(e.prox || ''));
if (semMes.length) throw new Error('preco sem mes de tabela (campo tab) e sem pre-lancamento em prox: ' + semMes.map(e => e.n).join(', '));
const semDataEst = ativos.filter(e => typeof e.est === 'number' && !e.estEm);

// ─── textos de SEO (com guarda de tamanho) ───
const TITLE = `Apartamentos na Planta em Indaiatuba ${EDICAO.ano} | ${N} Lançamentos`;
// o preço citado leva o mês da tabela DELE (ou "pré-lançamento"), não o mês da edição
const DESC = `${N} apartamentos em lançamento em Indaiatuba SP, ${NP} com preço na tela, sem cadastro: a partir de ${mil(menor.p)} (${menor.tab ? tabMes(menor) : 'pré-lançamento'}), do popular ao alto padrão.`;
// H1 fixo; os números vão na linha logo abaixo (como na home)
const H1 = 'Apartamentos na planta em Indaiatuba';
const NUMEROS = `<b>${N}</b> ${N === 1 ? 'lançamento' : 'lançamentos'}, <b>${NP}</b> com preço aberto`;
if (TITLE.length > 60) throw new Error('title com ' + TITLE.length + ' caracteres (max 60): ' + TITLE);
if (DESC.length < 120 || DESC.length > 155) throw new Error('description com ' + DESC.length + ' caracteres (120-155): ' + DESC);

// ─── cards ───
// card: o mesmo do gera-mcmv.js (hub-comum.js)
const card = e => H.card(e);

// ─── seções por âncora ───
const SECOES = [
  { id: '2-dormitorios', titulo: 'Apartamentos de 2 dormitórios', sub: 'Com planta de 2 dormitórios na tabela da construtora, vários dentro do Minha Casa Minha Vida (MCMV).', pega: e => e2dorm(e) },
  { id: '3-suites-alto-padrao', titulo: 'Apartamentos de 3 suítes e alto padrão', sub: 'Alto padrão pela tabela da construtora ou planta de 3 suítes.', pega: e => e3suites(e) },
  { id: 'ate-300-mil', titulo: 'Até R$ 300 mil', sub: 'Preço "a partir de", com o mês da tabela de cada construtora.', pega: e => faixa(e) === 'ate-300-mil' },
  { id: '300-a-600-mil', titulo: 'De R$ 300 mil a R$ 600 mil', sub: 'Preço "a partir de", com o mês da tabela de cada construtora.', pega: e => faixa(e) === '300-a-600-mil' },
  { id: 'acima-de-600-mil', titulo: 'Acima de R$ 600 mil', sub: 'Preço "a partir de", com o mês da tabela de cada construtora.', pega: e => faixa(e) === 'acima-de-600-mil' },
  { id: 'pre-lancamento', titulo: 'Pré-lançamento', sub: 'Tabela ainda não publicada pela construtora — quem entra agora escolhe unidade antes.', pega: e => fase(e) === 'pre-lancamento' },
  { id: 'em-obras', titulo: 'Em obras, com data de entrega na tabela', sub: 'Só entram aqui os que informam a previsão de entrega na tabela oficial.', pega: e => fase(e) === 'em-obras' },
  { id: 'pronto', titulo: 'Pronto para morar', sub: 'Recém-entregue: chaves e mudança imediata.', pega: e => fase(e) === 'pronto' },
];
function secao(sc) {
  const itens = ativos.filter(sc.pega);
  const lista = itens.length
    ? `<ul class="lista">${itens.map(e => `
        <li><a href="/${e.slug}/"><b>${esc(e.n)}</b><span>${esc(e.c)}</span><em>${e.p ? 'a partir de ' + brl(e.p) + ' · ' + tabDe(e) : 'tabela sob consulta'}</em></a></li>`).join('')}
      </ul>`
    : `<p class="vazio">Nenhum apartamento nesta condição em ${mesLongo}.</p>`;
  return `
    <section class="sec" id="${sc.id}">
      <h2>${sc.titulo} <small>${itens.length}</small></h2>
      <p class="sub">${sc.sub}</p>
      ${lista}
    </section>`;
}

// ─── tabela-resumo ───
const linha = e => `
        <tr>
          <td><a href="/${e.slug}/">${esc(e.n)}</a></td>
          <td>${dormsTexto(e)}</td>
          <td class="num">${m2Texto(e)}</td>
          <td class="num">${e.p ? '<strong>' + brl(e.p) + '</strong>' : '<span class="sc">sob consulta</span>'}</td>
          <td class="num">${e.p ? (e.tab ? (e.tabRec ? 'recebida em ' : '') + mesDe(e.tab) : 'pré-lançamento') : '—'}</td>
          <td>${entregaTexto(e)}</td>
          <td>${esc(e.c)}</td>
        </tr>`;

// ─── FAQ (vira FAQPage) ───
const emObras = ativos.filter(e => fase(e) === 'em-obras')
  .map(e => ({ e, m: e.s.match(RE_DATA) }))
  .sort((a, b) => (a.m[2] + a.m[1]).localeCompare(b.m[2] + b.m[1]));
const prontos = ativos.filter(e => fase(e) === 'pronto');
const ordemMes = { jan: 1, fev: 2, mar: 3, abr: 4, mai: 5, jun: 6, jul: 7, ago: 8, set: 9, out: 10, nov: 11, dez: 12 };
emObras.sort((a, b) => (+a.m[2] * 100 + ordemMes[a.m[1].toLowerCase()]) - (+b.m[2] * 100 + ordemMes[b.m[1].toLowerCase()]));
// no FAQ, duas datas saem como "Torre 1: abr/2028 e Torre 2: set/2028" (sem parênteses dentro de parênteses)
const entregaNoFaq = x => (datasEntrega(x.e) || x.m[1].toLowerCase() + '/' + x.m[2]).replace(/(\S+\/\d{4})\s*\(([^)]*)\)/g, '$2: $1');

// exemplos de entrada escritos a partir das páginas: só entram os empreendimentos à venda (sem-disponibilidade)
const EXEMPLOS_ENTRADA = [
  { slug: 'vivere-indaiatuba', txt: 'no Vívere Residencial, sinal de R$ 5.000 mais 36 parcelas de R$ 876,59 direto com a Masotti' },
  { slug: 'storia-congesa-indaiatuba', txt: 'no Storia Congesa, entrada de 35% em três parcelas (12% no ato, 11,5% em 30 dias e 11,5% em 60 dias) e 65% a financiar, pela tabela Congesa de outubro/2026' },
].filter(x => ativos.some(e => e.slug === x.slug));
const exemplosEntrada = EXEMPLOS_ENTRADA.length
  ? (EXEMPLOS_ENTRADA.length === 1 ? 'Exemplo publicado na página do empreendimento: ' : 'Exemplos publicados nas páginas dos empreendimentos: ') + EXEMPLOS_ENTRADA.map(x => x.txt).join('; ') + '. '
  : '';
const FAQ = [
  { q: 'Quanto custa um apartamento na planta em Indaiatuba?',
    a: `Em ${mesExtenso}, os ${NP} apartamentos em lançamento com preço publicado vão de ${brl(menor.p)} (${menor.n}, ${menor.c}, ${tabDe(menor)}) a ${brl(maior.p)} (${maior.n}, ${maior.c}, ${tabDe(maior)}). É o preço "a partir de" — a menor unidade disponível na data de cada tabela; outros ${N - NP} ainda não têm tabela publicada pela construtora.` },
  { q: 'Dá para usar FGTS ou Minha Casa Minha Vida em apartamento na planta?',
    a: `Nos apartamentos enquadrados no Minha Casa Minha Vida (${ativos.filter(eMCMV).map(e => e.n).join(', ')}), o saldo do FGTS pode ser usado como entrada ou abatimento e o financiamento é pela Caixa Econômica Federal. O enquadramento depende da renda familiar e da análise de crédito do banco — a imobiliária faz a simulação, mas quem aprova é a Caixa.` },
  { q: 'Qual a diferença entre apartamento na planta e apartamento pronto?',
    a: `Na planta, você compra antes ou durante a obra: paga a entrada parcelada direto com a construtora, escolhe andar e posição e recebe as chaves na data prevista em contrato, com o saldo corrigido pelo Índice Nacional de Custo da Construção (INCC) até a entrega. Pronto, você financia e muda na hora, sem prazo de obra. Esta página reúne os apartamentos na planta, em obras e recém-entregues em lançamento; os apartamentos prontos de revenda estão no site principal da Viv'América.` },
  { q: 'Quais apartamentos entregam antes?',
    a: (prontos.length ? `Pronto para morar hoje: ${prontos.map(e => e.n).join(', ')}. ` : '') +
       (emObras.length ? `Entre os que informam a previsão de entrega na tabela da construtora: ${emObras.map(x => x.e.n + ' (' + entregaNoFaq(x) + ')').join(', ')}. ` : '') +
       `Os demais não trazem previsão de entrega na tabela — confirme na página de cada um ou no WhatsApp.` },
  { q: 'Como funciona a entrada parcelada na compra na planta?',
    a: `A entrada é dividida com a própria construtora enquanto a obra anda, e o saldo é financiado na entrega. ${exemplosEntrada}Cada construtora tem a sua tabela — peça a simulação com o valor da sua unidade.` },
];

// ─── schemas ───
const jsonItemList = {
  '@context': 'https://schema.org', '@type': 'ItemList',
  name: 'Apartamentos na planta em Indaiatuba SP',
  description: `Apartamentos em lançamento, em obras e recém-entregues representados pela Imobiliária Viv'América em Indaiatuba. Edição de ${mesLongo} do Observatório de Preços.`,
  numberOfItems: todos.length,
  itemListElement: todos.map((e, i) => ({ '@type': 'ListItem', position: i + 1, name: e.n, url: ABS + '/' + e.slug + '/' })),
};
const jsonBread = {
  '@context': 'https://schema.org', '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Início', item: ABS + '/' },
    { '@type': 'ListItem', position: 2, name: 'Apartamentos na planta', item: URL },
  ],
};
const jsonFaq = {
  '@context': 'https://schema.org', '@type': 'FAQPage',
  mainEntity: FAQ.map(f => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: semTags(f.a) } })),
};
// malha anterior (preenchida pelo gera-relacionados), preservada entre rodadas
const ARQ = R + SLUG + '/index.html';
const { malha: malhaAnterior, marca: marcaAnterior } = H.lerAnterior(ARQ);

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
  <meta property="og:image" content="${ABS}/${menor.img}">
  <meta property="og:url" content="${URL}">
  <meta property="og:locale" content="pt_BR">
  <meta property="og:site_name" content="Imobiliária Viv'América">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${esc(TITLE)}">
  <meta name="twitter:description" content="${esc(DESC)}">
  <meta name="twitter:image" content="${ABS}/${menor.img}">
  <link rel="canonical" href="${URL}">
  <link rel="icon" type="image/png" href="/favicon.png">
  ${blocoEntidade()}
  <script type="application/ld+json">
  ${JSON.stringify(jsonItemList)}
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
${CSS_HUB}
  </style>
  ${MENU_CSS}
</head>
<body>
${MENU_HTML}

  <section class="topo">
    <div class="wrap">
      <p class="breadcrumb"><a href="/">Início</a> › Apartamentos na planta</p>
      <h1>${esc(H1)}</h1>
      <p class="hub-numeros">${NUMEROS}</p>
      <p class="hub-edicao atualizado">Atualizado em ${mesLongo}</p>
    </div>
  </section>

  <nav class="atalhos" aria-label="Atalhos por tipo, preço e fase">
    <a href="#2-dormitorios">2 dormitórios</a>
    <a href="#3-suites-alto-padrao">3 suítes · alto padrão</a>
    <a href="#ate-300-mil">até R$ 300 mil</a>
    <a href="#300-a-600-mil">R$ 300 a 600 mil</a>
    <a href="#acima-de-600-mil">acima de R$ 600 mil</a>
    <a href="#pre-lancamento">pré-lançamento</a>
    <a href="#em-obras">em obras</a>
    <a href="#pronto">pronto</a>
    <a href="#tabela">tabela-resumo</a>
    <a href="#faq">perguntas</a>
    <a href="/empreendimentos-minha-casa-minha-vida-indaiatuba/">Minha Casa Minha Vida</a>
  </nav>

  <div class="section">
    <h2 id="todos">Todos os apartamentos na planta em Indaiatuba <small>${todos.length} páginas · do menor ao maior preço</small></h2>
    <p class="sub">Ordem por preço "a partir de", cada um com o mês da tabela da construtora; sem tabela pública ao final${esgotados.length ? '; os esgotados ficam por último, com a página no ar para quem procura o nome' : ''}.</p>
    <div class="grid">${todos.map(card).join('')}
    </div>

    <p class="lede">Nesta página estão os apartamentos <strong>na planta, em obras ou recém-entregues</strong> que a Viv'América representa em Indaiatuba — do Minha Casa Minha Vida (MCMV), com uso do Fundo de Garantia do Tempo de Serviço (FGTS), ao alto padrão — com o preço "a partir de" aberto, sem cadastro, e link para a página completa de cada um. Procura apartamento pronto de revenda? Está no site principal: <a href="${SITE_PRONTOS}">apartamentos à venda em Indaiatuba</a>.</p>

${SECOES.map(secao).join('\n')}

    <section class="sec" id="tabela">
      <h2>Tabela-resumo <small>${N} apartamentos</small></h2>
      <p class="tabela-mes">Edição de ${mesLongo}</p>
      <div class="tabela-wrap">
        <table>
          <thead><tr><th>Empreendimento</th><th>Dormitórios</th><th>m²</th><th>A partir de</th><th>Tabela</th><th>Entrega / fase</th><th>Incorporadora</th></tr></thead>
          <tbody>${ativos.map(linha).join('')}
          </tbody>
        </table>
      </div>
      <p class="sub" style="margin-top:.8rem">"—" = a tabela oficial não informa. A coluna "Tabela" traz o mês da tabela de cada construtora; "pré-lançamento" é tabela de pré-lançamento, sujeita a reajuste no lançamento oficial. Preço "a partir de" é o da menor unidade disponível na data da tabela e pode variar por andar, posição e condição de pagamento. A movimentação mês a mês está no <a href="/precos-lancamentos-indaiatuba/">Observatório de Preços</a>.</p>
    </section>

    <div class="cruzado">
      <b>Pronto de revenda × na planta.</b> Esta página é só de lançamentos. Apartamentos prontos, usados e para locação em Indaiatuba estão no site principal da Viv'América: <a href="${SITE_PRONTOS}">apartamentos à venda em Indaiatuba</a>. Na home deste site, o filtro <a href="/?t=apartamento">só apartamentos</a> mostra os mesmos ${N} lançamentos ao lado dos lotes.
    </div>

    <section class="sec faq" id="faq">
      <h2>Perguntas frequentes</h2>
${FAQ.map(f => `      <details><summary>${esc(f.q)}</summary><p>${f.a}</p></details>`).join('\n')}
    </section>

    <div class="cta">
      <strong>Quer a tabela completa de algum apartamento?</strong>
      <p>Unidade por unidade, com simulação de financiamento e o valor de entrada — é só chamar.</p>
      <a class="btn" href="${wa('Olá! Vi a página de apartamentos na planta em Indaiatuba e quero a tabela completa de um empreendimento.')}" target="_blank" rel="noopener">Falar no WhatsApp</a>
    </div>

    <p class="links-uteis">
      <a href="/precos-lancamentos-indaiatuba/">Observatório de Preços (${mesLongo})</a>
      <a href="/?t=apartamento">Filtrar só apartamentos na home</a>
      <a href="/loteamentos-em-indaiatuba/">Loteamentos em Indaiatuba</a>
      <a href="/condominios-fechados-indaiatuba/">Condomínios fechados</a>
      <a href="/blog/fgts-imovel-na-planta-indaiatuba/">FGTS em imóvel na planta</a>
    </p>
  </div>

  <!--GEN:malha-->${malhaAnterior}<!--/GEN:malha-->

  <footer>
    <div class="footer-links">
      <a href="/">Início</a>
      <a href="/${SLUG}/">Apartamentos na planta</a>
      <a href="/loteamentos-em-indaiatuba/">Loteamentos</a>
      <a href="/condominios-fechados-indaiatuba/">Condomínios fechados</a>
      <a href="/precos-lancamentos-indaiatuba/">Observatório de Preços</a>
      <a href="/blog/">Blog</a>
    </div>
    <p>© ${EDICAO.ano} Imobiliária Viv'América · Apartamentos na planta em Indaiatuba SP · CRECI 47394-J</p>
  <p class="nap">Imobiliária Viv'América · CRECI 47394-J · Av. Higienópolis, 70 – Jardim União, Indaiatuba/SP · <a href="https://wa.me/5519989769457">+55 19 98976-9457</a> · <a href="/sobre/">Sobre a imobiliária</a> · <a href="https://imoveisvivamerica.com.br/politica-de-privacidade">Política de Privacidade</a></p>
  </footer>
</body>
</html>
`;

// repõe a camada de marca no mesmo ponto em que o identidade.js a injeta (depois do 1º </style>)
H.gravar(ARQ, HTML, marcaAnterior);
console.log('gera-apartamentos: ' + todos.length + ' cards (' + N + ' ativos, ' + NP + ' com preco, ' + esgotados.length + ' esgotados) · edicao ' + mesLongo);
if (semDataEst.length) console.log('  ATENCAO: est sem estEm (sem data nao sai selo de escassez): ' + semDataEst.map(e => e.n).join(', '));
console.log('  title ' + TITLE.length + ' chars · description ' + DESC.length + ' chars');
console.log('  secoes: ' + SECOES.map(s => s.id + '=' + ativos.filter(s.pega).length).join(' · '));
