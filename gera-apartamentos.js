/* ═══════════════════════════════════════════════════════════════════
   GERA-APARTAMENTOS — /apartamentos-na-planta-indaiatuba/
   ───────────────────────────────────────────────────────────────────
   A página de categoria "Apartamentos na planta" é GERADA INTEIRA daqui,
   no mesmo padrão do gera-observatorio.js: lê APTOS do gera-folheto.js
   (fonte única), EXTRAS_APTOS do gera-relacionados.js (landings vivas de
   apartamento fora da fonte única — esgotados), EDICAO do
   gera-observatorio.js (mês da tabela) e o nó RealEstateAgent da home
   (index.html), para que a entidade seja a mesma em todo o site.

   Nasceu em 02/09/2026 com a decisão "opção B": a home é a única dona
   do termo "lançamentos imobiliários indaiatuba"; o hub
   /lancamentos-indaiatuba/ virou 301 para a home; esta página responde
   por "apartamentos na planta / em lançamento" em Indaiatuba. O domínio
   raiz (imoveisvivamerica.com.br/site/venda/indaiatuba/apartamentos)
   responde por apartamentos PRONTOS de revenda — link cruzado aqui.

   REGRAS DE CLASSIFICAÇÃO (derivadas só de p, t e s — nada inventado):
   - #2-dormitorios      t começa com "MCMV" OU s contém "2 dorm"
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
   o que não está em s vira "—".

   Ordem: cards por preço crescente; sem preço no fim; esgotados por último.

   O bloco <!--GEN:malha--> é preenchido pelo gera-relacionados.js (que
   roda DEPOIS deste); ao regerar, o conteúdo anterior da malha é
   preservado para a página não ficar sem malha entre um passo e outro.
   A camada <style id="marca"> é do identidade.js (último do ritual).

   Ritual (ordem completa no CHECKLIST-NOVA-PAGINA.md):
     gera-folheto → gera-observatorio → gera-home → gera-apartamentos →
     gera-blog-ofertas → gera-blog-indice → gera-relacionados → identidade
   ═══════════════════════════════════════════════════════════════════ */

const fs = require('fs');
const R = __dirname + '/';
const SLUG = 'apartamentos-na-planta-indaiatuba';
const ABS = 'https://lancamentos.imoveisvivamerica.com.br';
const URL = ABS + '/' + SLUG + '/';
const SITE_PRONTOS = 'https://imoveisvivamerica.com.br/site/venda/indaiatuba/apartamentos';
const WA = '5519989769457';

// ─── fontes ───
function extrair(arquivo, nome) {
  const src = fs.readFileSync(R + arquivo, 'utf8');
  const ini = src.indexOf('const ' + nome + ' = ');
  if (ini < 0) throw new Error(nome + ' nao achado em ' + arquivo);
  const eArr = src[ini + ('const ' + nome + ' = ').length] === '[';
  const fim = eArr ? src.indexOf('\n];', ini) + 2 : src.indexOf('};', ini) + 1;
  return eval('(' + src.slice(ini + ('const ' + nome + ' = ').length, fim) + ')');
}
const APTOS = extrair('gera-folheto.js', 'APTOS');
const EXTRAS = extrair('gera-relacionados.js', 'EXTRAS_APTOS')
  .filter(e => fs.existsSync(R + e.slug + '/index.html'));
const EDICAO = extrair('gera-observatorio.js', 'EDICAO');

// nó RealEstateAgent copiado da home — mesma entidade em todo o site
function agenteDaHome() {
  const home = fs.readFileSync(R + 'index.html', 'utf8');
  const re = /<script type="application\/ld\+json">([\s\S]*?)<\/script>/g;
  let m;
  while ((m = re.exec(home))) {
    let o; try { o = JSON.parse(m[1]); } catch (e) { continue; }
    if (o && o['@type'] === 'RealEstateAgent') return o;
  }
  throw new Error('RealEstateAgent nao achado em index.html');
}
const AGENTE = agenteDaHome();

// ─── utilitários ───
const brl = n => 'R$ ' + n.toLocaleString('pt-BR');
const mil = n => n >= 1e6
  ? 'R$ ' + (n / 1e6).toFixed(1).replace('.', ',').replace(',0', '') + ' mi'
  : 'R$ ' + Math.round(n / 1000) + ' mil';
const MES_ABREV = { '01': 'jan', '02': 'fev', '03': 'mar', '04': 'abr', '05': 'mai', '06': 'jun',
  '07': 'jul', '08': 'ago', '09': 'set', '10': 'out', '11': 'nov', '12': 'dez' };
const mesAbrev = MES_ABREV[EDICAO.iso.slice(5, 7)] + '/' + EDICAO.ano;   // ago/2026
const mesLongo = EDICAO.mes.toLowerCase() + '/' + EDICAO.ano;           // agosto/2026
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const semTags = s => String(s).replace(/<[^>]+>/g, '');

// ─── classificação (regras no cabeçalho) ───
// Só vale como ENTREGA a data precedida da palavra "entrega" nas specs da fonte única
// ("(set/2026)" e "tabela ago/2026" são datas de tabela/estoque, não de entrega — 04/09/2026).
const RE_DATA = /entrega\s+(jan|fev|mar|abr|mai|jun|jul|ago|set|out|nov|dez)\/(\d{4})\b/i;
const eMCMV = e => /^MCMV/.test(e.t || '');
const e2dorm = e => eMCMV(e) || /2 dorm/i.test(e.s || '');
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
  if (m) return 'Em obras · entrega ' + m[1].toLowerCase() + '/' + m[2];
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
  const m = (e.s || '').match(/(\d+(?:,\d+)?(?:\s*a\s*\d+(?:,\d+)?)?)\s*m²/);
  return m ? m[1].replace(/\s+/g, ' ') + ' m²' : '—';
}

// ─── ordenação: preço crescente, sem preço no fim, esgotados por último ───
const ativos = APTOS.slice().sort((a, b) => (a.p || 9e12) - (b.p || 9e12));
const esgotados = EXTRAS.map(e => Object.assign({ esgotado: true }, e));
const todos = ativos.concat(esgotados);

const comPreco = ativos.filter(e => e.p);
const menor = comPreco.reduce((a, b) => a.p < b.p ? a : b);
const maior = comPreco.reduce((a, b) => a.p > b.p ? a : b);
const N = APTOS.length;
const NP = comPreco.length;

// ─── textos de SEO (com guarda de tamanho) ───
const TITLE = `Apartamentos na Planta em Indaiatuba ${EDICAO.ano} | ${N} Lançamentos`;
const DESC = `Os ${N} apartamentos em lançamento de Indaiatuba SP com preço na tela, sem cadastro: a partir de ${mil(menor.p)} (tabela ${mesAbrev}), do popular ao alto padrão.`;
const H1 = `Apartamentos na planta em Indaiatuba: ${N} lançamentos, ${NP} com preço aberto`;
if (TITLE.length > 60) throw new Error('title com ' + TITLE.length + ' caracteres (max 60): ' + TITLE);
if (DESC.length < 120 || DESC.length > 155) throw new Error('description com ' + DESC.length + ' caracteres (120-155): ' + DESC);

// ─── cards ───
const wa = texto => 'https://wa.me/' + WA + '?text=' + encodeURIComponent(texto);
const badgeCls = e => e.esgotado ? 'b-esg' : eMCMV(e) ? 'b-mcmv' : e.t === 'Alto padrão' ? 'b-alto' : e.t === 'Pré-lançamento' ? 'b-pre' : 'b-outro';
const badgeTxt = e => e.esgotado ? e.t : e.t;

function card(e) {
  const preco = e.esgotado
    ? `<p class="preco preco-sc"><span>estoque</span><strong>100% vendido (${mesAbrev})</strong><em>veja as alternativas no mesmo complexo</em></p>`
    : e.p
      ? `<p class="preco"><span>a partir de</span><strong>${brl(e.p)}</strong><em>tabela ${mesAbrev}</em></p>`
      : `<p class="preco preco-sc"><span>tabela</span><strong>Pré-lançamento · consulte</strong><em>peça em primeira mão</em></p>`;
  const est = (typeof e.est === 'number' && e.est <= 60)
    ? `<span class="est">Últimas ${e.est} unidades (${mesAbrev})</span>` : '';
  return `
      <article class="card" id="c-${e.slug}">
        <a href="/${e.slug}/" class="card-img"><img loading="lazy" decoding="async" src="/${e.img}" alt="${esc(e.n)} — apartamento em Indaiatuba" width="400" height="220"><span class="badge ${badgeCls(e)}">${esc(badgeTxt(e))}</span>${est}</a>
        <div class="card-b">
          <p class="constr">${esc(e.c)}</p>
          <h3><a href="/${e.slug}/">${esc(e.n)}</a></h3>
          <p class="specs">${esc(e.est ? (e.s || '').replace(/\s*·\s*últimas \d+ unidades/i, '') : e.s)}</p>
          ${preco}
          <div class="acoes">
            <a class="btn-card" href="/${e.slug}/">${e.esgotado ? 'Ver a página' : e.p ? 'Ver detalhes e preços' : 'Ver o empreendimento'}</a>
            ${e.esgotado ? '' : `<a class="btn-wa" href="${wa('Olá! Vi o ' + e.n + ' na página de apartamentos na planta em Indaiatuba e quero ' + (e.p ? 'a tabela completa.' : 'a tabela em primeira mão.'))}" target="_blank" rel="noopener">WhatsApp</a>`}
          </div>
        </div>
      </article>`;
}

// ─── seções por âncora ───
const SECOES = [
  { id: '2-dormitorios', titulo: 'Apartamentos de 2 dormitórios (Minha Casa Minha Vida)', sub: 'Enquadrados no Minha Casa Minha Vida (MCMV) ou com planta de 2 dormitórios na tabela.', pega: e => e2dorm(e) },
  { id: '3-suites-alto-padrao', titulo: 'Apartamentos de 3 suítes e alto padrão', sub: 'Alto padrão pela tabela da construtora ou planta de 3 suítes.', pega: e => e3suites(e) },
  { id: 'ate-300-mil', titulo: 'Até R$ 300 mil', sub: 'Preço "a partir de" na tabela de ' + mesLongo + '.', pega: e => faixa(e) === 'ate-300-mil' },
  { id: '300-a-600-mil', titulo: 'De R$ 300 mil a R$ 600 mil', sub: 'Preço "a partir de" na tabela de ' + mesLongo + '.', pega: e => faixa(e) === '300-a-600-mil' },
  { id: 'acima-de-600-mil', titulo: 'Acima de R$ 600 mil', sub: 'Preço "a partir de" na tabela de ' + mesLongo + '.', pega: e => faixa(e) === 'acima-de-600-mil' },
  { id: 'pre-lancamento', titulo: 'Pré-lançamento', sub: 'Tabela ainda não publicada pela construtora — quem entra agora escolhe unidade antes.', pega: e => fase(e) === 'pre-lancamento' },
  { id: 'em-obras', titulo: 'Em obras, com data de entrega na tabela', sub: 'Só entram aqui os que informam a previsão de entrega na tabela oficial.', pega: e => fase(e) === 'em-obras' },
  { id: 'pronto', titulo: 'Pronto para morar', sub: 'Recém-entregue: chaves e mudança imediata.', pega: e => fase(e) === 'pronto' },
];
function secao(sc) {
  const itens = ativos.filter(sc.pega);
  const lista = itens.length
    ? `<ul class="lista">${itens.map(e => `
        <li><a href="/${e.slug}/"><b>${esc(e.n)}</b><span>${esc(e.c)}</span><em>${e.p ? 'a partir de ' + brl(e.p) : 'tabela sob consulta'}</em></a></li>`).join('')}
      </ul>`
    : `<p class="vazio">Nenhum apartamento nesta condição na tabela de ${mesLongo}.</p>`;
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

const FAQ = [
  { q: 'Quanto custa um apartamento na planta em Indaiatuba?',
    a: `Na tabela de ${mesLongo}, os ${NP} apartamentos em lançamento com preço publicado vão de ${brl(menor.p)} (${menor.n}, ${menor.c}) a ${brl(maior.p)} (${maior.n}, ${maior.c}). É o preço "a partir de" — a menor unidade disponível na data da tabela; outros ${N - NP} ainda não têm tabela publicada pela construtora.` },
  { q: 'Dá para usar FGTS ou Minha Casa Minha Vida em apartamento na planta?',
    a: `Nos apartamentos enquadrados no Minha Casa Minha Vida (${ativos.filter(eMCMV).map(e => e.n).join(', ')}), o saldo do FGTS pode ser usado como entrada ou abatimento e o financiamento é pela Caixa Econômica Federal. O enquadramento depende da renda familiar e da análise de crédito do banco — a imobiliária faz a simulação, mas quem aprova é a Caixa.` },
  { q: 'Qual a diferença entre apartamento na planta e apartamento pronto?',
    a: `Na planta, você compra antes ou durante a obra: paga a entrada parcelada direto com a construtora, escolhe andar e posição e recebe as chaves na data prevista em contrato, com o saldo corrigido pelo Índice Nacional de Custo da Construção (INCC) até a entrega. Pronto, você financia e muda na hora, sem prazo de obra. Esta página reúne os apartamentos na planta, em obras e recém-entregues em lançamento; os apartamentos prontos de revenda estão no site principal da Viv'América.` },
  { q: 'Quais apartamentos entregam antes?',
    a: (prontos.length ? `Pronto para morar hoje: ${prontos.map(e => e.n).join(', ')}. ` : '') +
       (emObras.length ? `Entre os que informam a data na tabela de ${mesLongo}: ${emObras.map(x => x.e.n + ' (' + x.m[1].toLowerCase() + '/' + x.m[2] + ')').join(', ')}. ` : '') +
       `Os demais não trazem previsão de entrega na tabela — confirme na landing de cada um ou no WhatsApp.` },
  { q: 'Como funciona a entrada parcelada na compra na planta?',
    a: `A entrada é dividida com a própria construtora enquanto a obra anda, e o saldo é financiado na entrega. Exemplos publicados nas landings: no Vívere Residencial, sinal de R$ 5.000 mais 36 parcelas de R$ 876,59 direto com a Masotti; no Storia Congesa, 13% de entrada em 3 parcelas, 22% em mensais e 65% financiado na entrega. Cada construtora tem a sua tabela — peça a simulação com o valor da sua unidade.` },
];

// ─── schemas ───
const jsonItemList = {
  '@context': 'https://schema.org', '@type': 'ItemList',
  name: 'Apartamentos na planta em Indaiatuba SP',
  description: `Apartamentos em lançamento, em obras e recém-entregues representados pela Imobiliária Viv'América em Indaiatuba. Tabela de ${mesLongo}.`,
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
const jsonAgente = AGENTE;

// malha anterior (preenchida pelo gera-relacionados), preservada entre rodadas
let malhaAnterior = '';
const ARQ = R + SLUG + '/index.html';
if (fs.existsSync(ARQ)) {
  const old = fs.readFileSync(ARQ, 'utf8');
  const i = old.indexOf('<!--GEN:malha-->'), j = old.indexOf('<!--/GEN:malha-->');
  if (i >= 0 && j > i) malhaAnterior = old.slice(i + '<!--GEN:malha-->'.length, j);
}

const HTML = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
<script src="/atrib.js"></script>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${esc(TITLE)}</title>
  <meta name="description" content="${esc(DESC)}">
  <meta name="robots" content="index, follow">
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
  <script type="application/ld+json">
  ${JSON.stringify(jsonAgente)}
  </script>
  <script type="application/ld+json">
  ${JSON.stringify(jsonItemList)}
  </script>
  <script type="application/ld+json">
  ${JSON.stringify(jsonBread)}
  </script>
  <script type="application/ld+json">
  ${JSON.stringify(jsonFaq)}
  </script>
  <!-- Google Analytics GA4 -->
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
  <link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Josefin+Sans:wght@300;400;600;700&family=Poiret+One&display=swap" rel="stylesheet">
  <style>
    *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
    :root{--preto:#161616;--dourado:#C9A227;--creme:#F7F5F0;--texto:#161616;--muted:#6b6559;--linha:#e3ddcd}
    body{font-family:'Josefin Sans',system-ui,sans-serif;color:var(--texto);background:var(--creme);line-height:1.65}
    a{color:inherit}
    header{background:var(--preto);padding:0 5%;display:flex;align-items:center;justify-content:space-between;height:72px;position:sticky;top:0;z-index:100}
    .logo-text{color:#fff;text-decoration:none;font-size:clamp(.9rem,2vw,1.05rem)}
    nav{display:flex;align-items:center}
    @media(max-width:680px){nav{display:none}}
    nav a{color:rgba(255,255,255,.85);text-decoration:none;margin-left:1.6rem}
    nav a:hover,nav a.on{color:var(--dourado)}
    @media(max-width:680px){nav a{margin-left:.9rem;font-size:.7rem}}
    .topo{background:var(--preto);color:#fff;padding:2.4rem 5% 2.2rem}
    .wrap{max-width:1160px;margin:0 auto}
    .breadcrumb{font-size:.78rem;color:rgba(255,255,255,.65);margin-bottom:.9rem}
    .breadcrumb a{color:rgba(255,255,255,.75);text-decoration:none}
    .breadcrumb a:hover{color:var(--dourado)}
    h1{font-size:clamp(1.35rem,3.4vw,2.1rem);margin:0 0 .8rem;max-width:26ch}
    h1 em{font-style:normal;color:var(--dourado)}
    .lede{max-width:70ch;opacity:.92;font-weight:300;font-size:1.02rem}
    .lede a{color:var(--dourado)}
    .pill{display:inline-block;margin-top:1rem;font-size:.74rem;letter-spacing:.12em;text-transform:uppercase;background:rgba(201,162,39,.16);border:1px solid rgba(201,162,39,.45);color:var(--dourado);border-radius:99px;padding:.35rem 1rem;font-weight:600}
    .atalhos{display:flex;flex-wrap:wrap;gap:.45rem;max-width:1160px;margin:1.2rem auto 0;padding:0 5%}
    .atalhos a{font-size:.72rem;font-weight:600;letter-spacing:.08em;text-transform:uppercase;padding:.5rem .9rem;border:1px solid var(--linha);background:#fff;color:var(--muted);text-decoration:none;border-radius:4px}
    .atalhos a:hover{border-color:var(--dourado);color:var(--preto)}
    .section{max-width:1160px;margin:0 auto;padding:1.6rem 5% 0}
    h2{font-size:clamp(1.25rem,2.6vw,1.7rem);margin:2.4rem 0 .35rem;letter-spacing:-.01em}
    h2 small{font-weight:400;font-size:.8rem;color:var(--muted);margin-left:.5rem;letter-spacing:.06em}
    .sub{color:var(--muted);font-size:.92rem;margin-bottom:1rem;max-width:72ch}
    .grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:1.3rem;margin-top:1.2rem}
    .card{background:#fff;border:1px solid var(--linha);border-radius:4px;overflow:hidden;display:flex;flex-direction:column;transition:border-color .2s,box-shadow .2s}
    .card:hover{border-color:var(--dourado);box-shadow:0 8px 22px rgba(0,0,0,.07)}
    .card-img{display:block;position:relative;aspect-ratio:400/220;background:#E6E1D6}
    .card-img img{width:100%;height:100%;object-fit:cover;display:block}
    .badge{position:absolute;top:.7rem;left:.7rem;font-size:.66rem;font-weight:700;letter-spacing:.08em;text-transform:uppercase;padding:.3rem .6rem;border-radius:4px;background:var(--preto);color:var(--dourado)}
    .b-mcmv{background:#1565C0;color:#fff}.b-pre{background:#a15e2c;color:#fff}.b-esg{background:#C62828;color:#fff}
    .est{position:absolute;right:.7rem;bottom:.7rem;font-size:.66rem;font-weight:700;background:#C62828;color:#fff;padding:.28rem .55rem;border-radius:4px;letter-spacing:.04em}
    .card-b{padding:1rem 1.1rem 1.1rem;display:flex;flex-direction:column;flex:1}
    .constr{font-size:.66rem;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:#8f7418;margin-bottom:.25rem}
    .card h3{font-size:1.08rem;margin:0 0 .35rem;line-height:1.25}
    .card h3 a{text-decoration:none}
    .specs{font-size:.82rem;color:var(--muted);line-height:1.45;flex:1;margin-bottom:.7rem}
    .preco{border-top:1px dashed var(--linha);padding-top:.6rem;margin-bottom:.8rem}
    .preco span{display:block;font-size:.64rem;color:#8a8272;text-transform:uppercase;letter-spacing:.1em}
    .preco strong{display:block;font-size:1.28rem;font-weight:700;line-height:1.1;margin-top:.15rem}
    .preco em{display:block;font-style:normal;font-size:.7rem;color:#8a8272;margin-top:.2rem}
    .preco-sc strong{color:#a15e2c;font-size:1rem}
    .acoes{display:flex;gap:.5rem;flex-wrap:wrap}
    .btn-card,.btn-wa{display:inline-flex;align-items:center;min-height:42px;padding:.55rem 1rem;font-size:.8rem;font-weight:600;letter-spacing:.05em;text-decoration:none;border-radius:4px}
    .btn-card{background:var(--preto);color:#fff;flex:1;justify-content:center}
    .btn-wa{background:#25D366;color:#fff}
    .btn-card:hover,.btn-wa:hover{opacity:.9}
    .sec{scroll-margin-top:90px}
    .lista{list-style:none;display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:.6rem}
    .lista a{display:flex;flex-direction:column;background:#fff;border:1px solid var(--linha);border-left:3px solid var(--dourado);padding:.75rem .9rem;text-decoration:none;border-radius:4px}
    .lista a:hover{border-color:var(--dourado)}
    .lista b{font-weight:600}
    .lista span{font-size:.72rem;color:var(--muted);letter-spacing:.06em;text-transform:uppercase}
    .lista em{font-style:normal;font-size:.84rem;margin-top:.2rem}
    .vazio{color:var(--muted);font-size:.9rem}
    .tabela-wrap{overflow-x:auto;background:#fff;border:1px solid var(--linha);border-radius:4px}
    table{width:100%;border-collapse:collapse;font-size:.9rem;min-width:720px}
    th{text-align:left;font-size:.68rem;letter-spacing:.1em;text-transform:uppercase;color:#8a8272;padding:.8rem 1rem;border-bottom:2px solid var(--preto);background:var(--creme)}
    td{padding:.65rem 1rem;border-bottom:1px solid #eee9db;vertical-align:top}
    tr:last-child td{border-bottom:none}
    td a{font-weight:600;text-decoration:none;border-bottom:1px solid var(--dourado)}
    td.num{white-space:nowrap;font-variant-numeric:tabular-nums}
    .sc{color:#a15e2c;font-weight:600}
    .tabela-mes{font-size:.78rem;letter-spacing:.1em;text-transform:uppercase;color:#8f7418;font-weight:600;margin-bottom:.5rem}
    .faq details{background:#fff;border:1px solid var(--linha);border-radius:4px;margin-bottom:.6rem;padding:1rem 1.2rem}
    .faq summary{font-weight:600;cursor:pointer}
    .faq p{margin-top:.6rem;color:#4a4a42;max-width:78ch}
    .cruzado{background:#f2efe6;border-left:4px solid var(--dourado);padding:1.1rem 1.3rem;margin:2.2rem 0 0;font-size:.94rem;color:#4a4a42;border-radius:0 4px 4px 0}
    .cruzado a{font-weight:600}
    .cta{background:var(--preto);color:#fff;text-align:center;padding:2.4rem 1.4rem;margin:2.6rem 0 0;border-radius:4px}
    .cta strong{font-size:1.25rem;display:block;margin-bottom:.5rem;font-weight:600}
    .cta p{opacity:.85;max-width:52ch;margin:0 auto .9rem;font-weight:300}
    .cta a.btn{display:inline-block;background:#25D366;color:#fff;font-weight:600;text-decoration:none;border-radius:4px;padding:.95rem 1.8rem;letter-spacing:.05em}
    .links-uteis{display:flex;flex-wrap:wrap;gap:1.2rem;justify-content:center;margin:1.6rem 0 2.6rem;font-size:.84rem}
    .links-uteis a{color:var(--muted)}
    footer{background:#101010;color:rgba(255,255,255,.7);padding:2.5rem 5%;text-align:center;font-size:.82rem;font-weight:300}
    footer .footer-links{display:flex;flex-wrap:wrap;gap:1.4rem;justify-content:center;margin-bottom:1rem}
    footer a{color:rgba(255,255,255,.75);text-decoration:none;letter-spacing:.08em;text-transform:uppercase;font-size:.74rem}
    footer a:hover{color:var(--dourado)}
  </style>
</head>
<body>
  <header>
    <a href="/" class="logo-text">Imobiliária Viv'América</a>
    <nav>
      <a href="/${SLUG}/" class="on">Apartamentos</a>
      <a href="/loteamentos-em-indaiatuba/">Loteamentos</a>
      <a href="/condominios-fechados-indaiatuba/">Condomínios</a>
      <a href="/mapa-lotes-indaiatuba/">Veja no mapa</a>
      <a href="/blog/">Blog</a>
    </nav>
  </header>

  <section class="topo">
    <div class="wrap">
      <p class="breadcrumb"><a href="/">Início</a> › Apartamentos na planta</p>
      <h1>${esc(H1)}</h1>
      <p class="lede">Aqui estão os apartamentos <strong>na planta, em obras ou recém-entregues</strong> que a Viv'América representa em Indaiatuba — do Minha Casa Minha Vida (MCMV), com uso do Fundo de Garantia do Tempo de Serviço (FGTS), ao alto padrão — com o preço "a partir de" aberto, sem cadastro, e link para a página completa de cada um. Procura apartamento pronto de revenda? Está no site principal: <a href="${SITE_PRONTOS}">apartamentos à venda em Indaiatuba</a>.</p>
      <span class="pill">Tabela de ${mesLongo} · ${N} lançamentos · ${NP} com preço</span>
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
  </nav>

  <div class="section">
    <h2 id="todos">Todos os apartamentos na planta em Indaiatuba <small>${todos.length} páginas · do menor ao maior preço</small></h2>
    <p class="sub">Ordem por preço "a partir de" da tabela de ${mesLongo}; pré-lançamentos sem tabela ao final; os esgotados ficam por último, com a página no ar para quem procura o nome.</p>
    <div class="grid">${todos.map(card).join('')}
    </div>

${SECOES.map(secao).join('\n')}

    <section class="sec" id="tabela">
      <h2>Tabela-resumo <small>${N} apartamentos</small></h2>
      <p class="tabela-mes">Tabela de ${mesLongo}</p>
      <div class="tabela-wrap">
        <table>
          <thead><tr><th>Empreendimento</th><th>Dormitórios</th><th>m²</th><th>A partir de</th><th>Entrega / fase</th><th>Incorporadora</th></tr></thead>
          <tbody>${ativos.map(linha).join('')}
          </tbody>
        </table>
      </div>
      <p class="sub" style="margin-top:.8rem">"—" = a tabela oficial não informa. Preço "a partir de" é o da menor unidade disponível na data da tabela e pode variar por andar, posição e condição de pagamento. A movimentação mês a mês está no <a href="/precos-lancamentos-indaiatuba/">Observatório de Preços</a>.</p>
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
    <p>© ${EDICAO.ano} Imobiliária Viv'América · Apartamentos na planta em Indaiatuba SP · CRECI 047394-J</p>
  </footer>
</body>
</html>
`;

fs.mkdirSync(R + SLUG, { recursive: true });
fs.writeFileSync(ARQ, HTML, 'utf8');
console.log('gera-apartamentos: ' + todos.length + ' cards (' + N + ' ativos, ' + NP + ' com preco, ' + esgotados.length + ' esgotados) · tabela ' + mesLongo);
console.log('  title ' + TITLE.length + ' chars · description ' + DESC.length + ' chars');
console.log('  secoes: ' + SECOES.map(s => s.id + '=' + ativos.filter(s.pega).length).join(' · '));
