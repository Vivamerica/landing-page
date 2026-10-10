/* ═══════════════════════════════════════════════════════════════════
   GERA-ALPHAVILLE — /alphaville/
   ───────────────────────────────────────────────────────────────────
   A página principal dos empreendimentos Alphaville é GERADA INTEIRA
   daqui, no mesmo padrão do gera-apartamentos.js.

   Os dados ficam na lista ALPHAVILLE, logo abaixo: uma linha por
   empreendimento do catálogo oficial da Alphaville com venda em
   andamento na data de CONSULTA. A lista é um literal puro (sem variável
   nem função) e fecha com "];" na coluna 0, para que os outros geradores
   possam lê-la como texto, do mesmo jeito que leem APTOS e LOTES.

   TRÊS BLOCOS SAEM DA MESMA LISTA
   - com página completa   linha com slug          card com foto, preço,
                                                   botão da landing e WhatsApp
   - próximas páginas      linha com preparo:true  card só de texto, sem foto
                                                   e sem preço
   - catálogo              todas as linhas         tabela-resumo

   CAMPOS DE CADA LINHA
   n, cidade, uf   nome oficial e praça
   linha           'Alphaville' ou 'Terras Alpha'
   tipo            produto, como o catálogo classifica
   fase            fase do catálogo; obs (opcional) complementa a fase
   slug            pasta da landing neste site (só quem tem página)
   img             foto do card; ilustrativa:true põe a etiqueta
                   "Imagem ilustrativa" (obrigatória em perspectiva)
   fonte:true      preço e specs vêm de APTOS/LOTES do gera-folheto.js
                   (fonte única), pelo slug — o número não é copiado aqui
   p               preço "a partir de" quando o produto não está na fonte única
   tabela          mês da tabela de vendas do preço (aparece ao lado dele)
   nota            o que o preço inclui ou deixa de fora
   s               specs do card (com fonte:true, vêm da fonte única)
   preparo:true    card do bloco "próximas páginas"

   GUARDAS (param o gerador)
   - slug declarado sem pasta/index.html: o validador não confere link
     interno, então um 404 passaria sem aviso;
   - imagem do card que não existe no disco;
   - preço sem o mês da tabela;
   - landing que não cita mais o mês de "tabela", ou que não traz o preço
     "p": sinal de que a tabela mudou e a linha daqui ficou para trás;
   - title acima de 60 caracteres ou description fora de 120–155.

   O bloco <!--GEN:malha--> é preenchido pelo gera-relacionados.js (que
   roda DEPOIS deste); ao regerar, o conteúdo anterior da malha é
   preservado. A camada <style id="marca"> é do identidade.js (último
   do ritual).

   Ritual:
     gera-folheto → gera-observatorio → gera-home → gera-apartamentos →
     gera-alphaville → gera-blog-ofertas → gera-blog-indice →
     gera-relacionados → identidade
   ═══════════════════════════════════════════════════════════════════ */

const fs = require('fs');
const R = __dirname + '/';
const SLUG = 'alphaville';
const ABS = 'https://lancamentos.imoveisvivamerica.com.br';
const URL = ABS + '/' + SLUG + '/';
const WA = '5519989769457';

// data da consulta ao catálogo oficial da Alphaville (dd/mm/aaaa)
const CONSULTA = '09/10/2026';

const ALPHAVILLE = [
  { n:'Alphaville Indaiatuba', cidade:'Indaiatuba', uf:'SP', linha:'Alphaville', tipo:'Lotes residenciais', fase:'Lançamento',
    slug:'alphaville-indaiatuba', img:'alphaville-indaiatuba/images/hero.jpg', ilustrativa:true,
    fonte:true, tabela:'set/2026', nota:'custas de escrituração à parte' },
  { n:'Casas Alphaville Dom Pedro 0', cidade:'Campinas', uf:'SP', linha:'Alphaville', tipo:'Casas', fase:'Entregue',
    obs:'5 casas na tabela de vendas de out/2026',
    slug:'casas-alphaville-dom-pedro-0-campinas', img:'casas-alphaville-dom-pedro-0-campinas/images/hero.jpg', ilustrativa:true,
    p:3306135, tabela:'out/2026', nota:'intermediação imobiliária incluída',
    s:'Casas de 288 a 362 m² em área reservada do residencial Alphaville Dom Pedro 0 · 5 casas na tabela de out/2026 · realização Alphaville e Incorpi' },
  { n:'Parque Alphaville Campinas', cidade:'Campinas', uf:'SP', linha:'Alphaville', tipo:'Lotes comerciais', fase:'Em construção', preparo:true },
  { n:'Parque Alphaville Alvorada', cidade:'Votorantim', uf:'SP', linha:'Terras Alpha', tipo:'Lotes residenciais e comerciais', fase:'Breve lançamento',
    obs:'lotes residenciais ainda não liberados', preparo:true },
  { n:'Terras Alpha Ribeirão Preto', cidade:'Ribeirão Preto', uf:'SP', linha:'Terras Alpha', tipo:'Lotes residenciais', fase:'Em construção' },
  { n:'Alphaville Guarajuba 4', cidade:'Camaçari', uf:'BA', linha:'Alphaville', tipo:'Lotes residenciais', fase:'Em construção', preparo:true },
  { n:'Alphaville Litoral Norte 4', cidade:'Camaçari', uf:'BA', linha:'Alphaville', tipo:'Lotes residenciais', fase:'Em construção', preparo:true },
  { n:'Alphaville Ceará 5', cidade:'Eusébio', uf:'CE', linha:'Alphaville', tipo:'Lotes residenciais', fase:'Em construção' },
  { n:'Terras Alphaville Ceará 6', cidade:'Eusébio', uf:'CE', linha:'Terras Alpha', tipo:'Lotes residenciais', fase:'Em construção' },
  { n:'Comercial Ceará 7 e 8', cidade:'Fortaleza', uf:'CE', linha:'Alphaville', tipo:'Lotes comerciais', fase:'Em construção' },
  { n:'Terras Alphaville Teresina 2', cidade:'Teresina', uf:'PI', linha:'Terras Alpha', tipo:'Lotes residenciais', fase:'Em construção' },
  { n:'Terras Alphaville Teresina 3', cidade:'Teresina', uf:'PI', linha:'Terras Alpha', tipo:'Lotes residenciais', fase:'Em construção' },
  { n:'Terras Alpha Cascavel 3', cidade:'Cascavel', uf:'PR', linha:'Terras Alpha', tipo:'Lotes residenciais', fase:'Lançamento' },
];

// ─── fontes ───
function extrair(arquivo, nome) {
  const src = fs.readFileSync(R + arquivo, 'utf8');
  const ini = src.indexOf('const ' + nome + ' = ');
  if (ini < 0) throw new Error(nome + ' nao achado em ' + arquivo);
  const fim = src.indexOf('\n];', ini) + 2;
  return eval('(' + src.slice(ini + ('const ' + nome + ' = ').length, fim) + ')');
}
const FONTE_UNICA = extrair('gera-folheto.js', 'APTOS').concat(extrair('gera-folheto.js', 'LOTES'));

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
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const semTags = s => String(s).replace(/<[^>]+>/g, '');
const wa = texto => 'https://wa.me/' + WA + '?text=' + encodeURIComponent(texto);
const minusc = s => s.charAt(0).toLowerCase() + s.slice(1);
const ANO = CONSULTA.slice(-4);
const MES_LONGO = { jan: 'janeiro', fev: 'fevereiro', mar: 'março', abr: 'abril', mai: 'maio', jun: 'junho',
  jul: 'julho', ago: 'agosto', set: 'setembro', out: 'outubro', nov: 'novembro', dez: 'dezembro' };

// ─── preço, specs e guardas de cada linha ───
const EMP = ALPHAVILLE.map(bruto => {
  const e = Object.assign({}, bruto);
  e.praca = e.cidade + '/' + e.uf;
  if (!e.slug) return e;

  const pagina = R + e.slug + '/index.html';
  if (!fs.existsSync(pagina)) throw new Error('slug declarado sem pagina: ' + e.slug + '/index.html nao existe (' + e.n + ')');
  if (!e.img || !fs.existsSync(R + e.img)) throw new Error('imagem do card nao existe: ' + e.img + ' (' + e.n + ')');

  if (e.fonte) {
    const f = FONTE_UNICA.find(x => x.slug === e.slug);
    if (!f) throw new Error(e.slug + ' nao esta em APTOS/LOTES do gera-folheto.js (linha com fonte:true)');
    if (e.p) throw new Error(e.n + ': linha com fonte:true nao leva p — o preco vem do gera-folheto.js');
    e.p = f.p || null;
    e.s = e.s || f.s;
  }
  if (e.p) {
    const m = /^([a-z]{3})\/(\d{4})$/.exec(e.tabela || '');
    if (!m || !MES_LONGO[m[1]]) throw new Error(e.n + ': preco sem o mes da tabela (campo tabela, formato "set/2026")');
    const landing = fs.readFileSync(pagina, 'utf8');
    const citaTabela = new RegExp('tabela[^<.]{0,40}(' + m[1] + '|' + MES_LONGO[m[1]] + ')/' + m[2], 'i');
    if (!citaTabela.test(landing)) throw new Error(e.n + ': a landing /' + e.slug + '/ nao cita a tabela de ' + e.tabela + ' — confira o preco e atualize o campo tabela');
    if (!e.fonte && !landing.includes(brl(e.p))) throw new Error(e.n + ': a landing /' + e.slug + '/ nao traz ' + brl(e.p) + ' — confira o campo p com a tabela de vendas');
  }
  return e;
});

const comPagina = EMP.filter(e => e.slug);
const emPreparo = EMP.filter(e => e.preparo && !e.slug);
const N = EMP.length;
// A abertura e o FAQ foram escritos para DUAS páginas completas ("Dois têm página completa… São o A e o B").
// Quando uma terceira ganhar landing, reescreva esses textos antes de tirar esta guarda.
if (comPagina.length !== 2) throw new Error('gera-alphaville: ' + comPagina.length + ' linhas com pagina; a abertura e a 1a resposta do FAQ falam em duas');
const porSlug = s => { const e = comPagina.find(x => x.slug === s); if (!e) throw new Error('linha sem pagina: ' + s); return e; };
const IND = porSlug('alphaville-indaiatuba');
const DP0 = porSlug('casas-alphaville-dom-pedro-0-campinas');

// mensagens de WhatsApp: a cidade só entra quando o nome ainda não a traz
const msgInteresse = e => 'Olá! Tenho interesse no ' + e.n + (e.n.includes(e.cidade) ? '' : ' em ' + e.cidade) + '. Pode me enviar mais informações?';
const MSG_HUB = 'Olá! Vi a página dos empreendimentos Alphaville e quero saber o que está à venda.';

// ─── textos de SEO (com guarda de tamanho) ───
const TITLE = "Todos os Empreendimentos Alphaville à Venda | Viv'América";
const H1 = 'Empreendimentos Alphaville';
const DESC = `Alphaville à venda com a Viv'América: lotes em Indaiatuba a partir de ${brl(IND.p)} (${IND.tabela}) e casas em Campinas a partir de ${brl(DP0.p)} (${DP0.tabela}).`;
if (TITLE.length > 60) throw new Error('title com ' + TITLE.length + ' caracteres (max 60): ' + TITLE);
if (DESC.length < 120 || DESC.length > 155) throw new Error('description com ' + DESC.length + ' caracteres (120-155): ' + DESC);
const IMG_OG = comPagina[0].img;

// ─── bloco 1: cards com página completa ───
function card(e) {
  const preco = e.p
    ? `<p class="preco"><span>a partir de</span><strong>${brl(e.p)}</strong><em>tabela de ${e.tabela}${e.nota ? ' · ' + esc(e.nota) : ''}</em></p>`
    : `<p class="preco preco-sc"><span>tabela</span><strong>Sob consulta</strong><em>peça no atendimento</em></p>`;
  return `
        <article class="card" id="c-${e.slug}">
          <a href="/${e.slug}/" class="card-img"><img loading="lazy" decoding="async" src="/${e.img}" alt="${esc(e.n)}, em ${esc(e.praca)}${e.ilustrativa ? ' (imagem ilustrativa)' : ''}" width="640" height="360"><span class="badge">${esc(e.fase)}</span>${e.ilustrativa ? '<span class="ilustr">Imagem ilustrativa</span>' : ''}</a>
          <div class="card-b">
            <p class="constr">${esc(e.praca)} · linha ${esc(e.linha)}</p>
            <h3><a href="/${e.slug}/">${esc(e.n)}</a></h3>
            <p class="specs">${esc(e.s || e.tipo)}</p>
            ${preco}
            <div class="acoes">
              <a class="btn-card" href="/${e.slug}/">Ver página completa</a>
              <a class="btn-wa" href="${wa(msgInteresse(e))}" target="_blank" rel="noopener">WhatsApp</a>
            </div>
          </div>
        </article>`;
}

// ─── bloco 2: próximas páginas (só texto) ───
function cardPreparo(e) {
  return `
        <article class="prep">
          <p class="prep-tag">Página em preparo</p>
          <h3>${esc(e.n)}</h3>
          <ul>
            <li><b>Onde</b> ${esc(e.praca)}</li>
            <li><b>Linha</b> ${esc(e.linha)}</li>
            <li><b>Produto</b> ${esc(e.tipo)}</li>
            <li><b>Fase</b> ${esc(e.fase)}${e.obs ? ' · ' + esc(e.obs) : ''}</li>
          </ul>
          <a class="btn-info" href="${wa(msgInteresse(e))}" target="_blank" rel="noopener">Pedir informações</a>
        </article>`;
}

// ─── bloco 3: tabela do catálogo ───
const linhaTabela = e => `
            <tr>
              <td>${e.slug ? `<a href="/${e.slug}/">${esc(e.n)}</a>` : `<b>${esc(e.n)}</b>`}${e.preparo && !e.slug ? '<span class="t-prep">página em preparo</span>' : ''}</td>
              <td>${esc(e.praca)}</td>
              <td>${esc(e.linha)}</td>
              <td>${esc(e.tipo)}</td>
              <td>${esc(e.fase)}${e.obs ? `<span class="obs">${esc(e.obs)}</span>` : ''}</td>
            </tr>`;

// ─── FAQ (o mesmo array vira o HTML e o FAQPage) ───
const REGIAO = ['Indaiatuba', 'Campinas'];
const regiaoSemPagina = EMP.filter(e => !e.slug && REGIAO.includes(e.cidade));
const terrasExemplo = EMP.find(e => e.linha === 'Terras Alpha');
const FAQ = [
  { q: 'Quais Alphaville estão à venda na região de Campinas e Indaiatuba?',
    a: `Dois têm página completa na Imobiliária Viv'América, com preço e tabela de vendas. São o <a href="/${IND.slug}/">${IND.n}</a>, com lotes a partir de ${brl(IND.p)} na tabela de ${IND.tabela}, e o <a href="/${DP0.slug}/">${DP0.n}</a>, em ${DP0.cidade}, com casas a partir de ${brl(DP0.p)} na tabela de ${DP0.tabela}.` +
       (regiaoSemPagina.length ? ` O catálogo oficial da Alphaville, consultado em ${CONSULTA}, mostra ainda ${regiaoSemPagina.map(e => 'o ' + e.n + ', em ' + e.cidade + ' (' + minusc(e.tipo) + ', ' + minusc(e.fase) + ')').join(' e ')}.` : '') },
  { q: 'Qual a diferença entre Alphaville e Terras Alpha?',
    a: `São duas linhas da mesma companhia. Segundo o Formulário de Referência 2026 da Alphaville, a linha Alphaville reúne empreendimentos com lotes de no mínimo 360 m², e a linha Terras Alpha, empreendimentos com lotes de tamanho médio de 200 a 360 m². Na tabela desta página, a coluna Linha mostra a qual delas cada empreendimento pertence: o ${IND.n} é da linha Alphaville` +
       (terrasExemplo ? `, e o ${terrasExemplo.n}, em ${terrasExemplo.cidade}, é da linha Terras Alpha.` : '.') },
  { q: "A Viv'América é a Alphaville?",
    a: `Não. A Imobiliária Viv'América (CRECI 47394-J) é uma imobiliária independente, com sede em Indaiatuba, que intermedeia a venda. Alphaville é marca da Alphaville S.A., e esta página não é o site oficial da incorporadora.` },
  { q: 'Tem Alphaville em Indaiatuba?',
    a: `Sim. O ${IND.n} é um condomínio fechado de lotes no bairro do Itaici. Na tabela de vendas de ${IND.tabela}, os lotes partem de ${brl(IND.p)}, com as custas de escrituração cobradas à parte. A <a href="/${IND.slug}/">página do ${IND.n}</a> traz a tabela, as condições de pagamento e o mapa.` },
  { q: `As ${DP0.n} são prontas?`,
    a: `O residencial Alphaville Dom Pedro 0, onde as casas ficam, foi entregue em outubro de 2025, e o conjunto das casas em dezembro de 2025, segundo a divulgação de resultados da Alphaville do 4º trimestre de 2025; no catálogo da companhia, o Casas Alphaville Dom Pedro 0 aparece como entregue. A situação de cada casa, incluindo o habite-se (a autorização da prefeitura para ocupar o imóvel), não consta da tabela de vendas e é confirmada no atendimento. A <a href="/${DP0.slug}/">página das ${DP0.n}</a> traz as casas da tabela de ${DP0.tabela}.` },
];

// ─── schemas ───
const jsonItemList = {
  '@context': 'https://schema.org', '@type': 'ItemList',
  name: "Empreendimentos Alphaville com página na Imobiliária Viv'América",
  description: `Empreendimentos da marca Alphaville com página completa no site de lançamentos da Imobiliária Viv'América. Catálogo oficial da Alphaville consultado em ${CONSULTA}.`,
  numberOfItems: comPagina.length,
  itemListElement: comPagina.map((e, i) => ({ '@type': 'ListItem', position: i + 1, name: e.n, url: ABS + '/' + e.slug + '/' })),
};
const jsonBread = {
  '@context': 'https://schema.org', '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Início', item: ABS + '/' },
    { '@type': 'ListItem', position: 2, name: 'Empreendimentos Alphaville', item: URL },
  ],
};
const jsonFaq = {
  '@context': 'https://schema.org', '@type': 'FAQPage',
  mainEntity: FAQ.map(f => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: semTags(f.a) } })),
};
const jsonAgente = AGENTE;

// malha anterior (preenchida pelo gera-relacionados), preservada entre rodadas
let malhaAnterior = '', marcaAnterior = '';
const ARQ = R + SLUG + '/index.html';
if (fs.existsSync(ARQ)) {
  const old = fs.readFileSync(ARQ, 'utf8');
  const i = old.indexOf('<!--GEN:malha-->'), j = old.indexOf('<!--/GEN:malha-->');
  if (i >= 0 && j > i) malhaAnterior = old.slice(i + '<!--GEN:malha-->'.length, j);
  // camada de marca (identidade.js): preservada como a malha. Sem isto, rodar este gerador
  // sozinho publicava a página sem a tipografia da marca (aconteceu em 09/10/2026).
  marcaAnterior = (old.match(/\n?\s*<style id="marca">[\s\S]*?<\/style>/) || [''])[0];
}

const listaPaginas = comPagina.map(e => `o <a href="/${e.slug}/">${esc(e.n)}</a> (${esc(minusc(e.tipo))} em ${esc(e.praca)})`).join(' e ');
const plural = (n, um, varios) => n + ' ' + (n === 1 ? um : varios);

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
  <meta property="og:image" content="${ABS}/${IMG_OG}">
  <meta property="og:url" content="${URL}">
  <meta property="og:locale" content="pt_BR">
  <meta property="og:site_name" content="Imobiliária Viv'América">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${esc(TITLE)}">
  <meta name="twitter:description" content="${esc(DESC)}">
  <meta name="twitter:image" content="${ABS}/${IMG_OG}">
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
    img{max-width:100%}
    header{background:var(--preto);padding:0 5%;display:flex;align-items:center;justify-content:space-between;height:72px;position:sticky;top:0;z-index:100}
    .logo-text{color:#fff;text-decoration:none;font-size:clamp(.9rem,2vw,1.05rem)}
    nav{display:flex;align-items:center}
    @media(max-width:680px){nav{display:none}}
    @media(max-width:1000px){header nav{display:none}}
    nav a{color:rgba(255,255,255,.85);text-decoration:none;margin-left:1.6rem}
    header nav a{white-space:nowrap}
    nav a:hover{color:var(--dourado)}
    .topo{background:var(--preto);color:#fff;padding:2.4rem 5% 2.4rem}
    .wrap{max-width:1160px;margin:0 auto}
    .breadcrumb{font-size:.78rem;color:rgba(255,255,255,.65);margin-bottom:.9rem}
    .breadcrumb a{color:rgba(255,255,255,.75);text-decoration:none}
    .breadcrumb a:hover{color:var(--dourado)}
    h1{font-size:clamp(1.35rem,3.4vw,2.1rem);margin:0 0 .8rem}
    .lede{max-width:74ch;opacity:.92;font-weight:300;font-size:1.02rem}
    .lede a{color:var(--dourado)}
    .lede strong{font-weight:600}
    .pill{display:inline-block;margin-top:1.1rem;font-size:.72rem;letter-spacing:.1em;text-transform:uppercase;background:rgba(201,162,39,.16);border:1px solid rgba(201,162,39,.45);color:var(--dourado);border-radius:4px;padding:.4rem .9rem;font-weight:600;line-height:1.5}
    .faixa{padding:0 5%}
    .atalhos{display:flex;flex-wrap:wrap;gap:.45rem;max-width:1160px;margin:1.2rem auto 0}
    .atalhos a{font-size:.72rem;font-weight:600;letter-spacing:.08em;text-transform:uppercase;padding:.5rem .9rem;border:1px solid var(--linha);background:#fff;color:var(--muted);text-decoration:none;border-radius:4px;margin-left:0}
    .atalhos a:hover{border-color:var(--dourado);color:var(--preto)}
    .section{padding:.4rem 5% 0}
    .sec{scroll-margin-top:90px}
    h2{font-size:clamp(1.25rem,2.6vw,1.7rem);margin:2.4rem 0 .35rem;letter-spacing:-.01em;line-height:1.25}
    h2 small{font-weight:400;font-size:.8rem;color:var(--muted);margin-left:.5rem;letter-spacing:.06em;white-space:nowrap}
    @media(max-width:560px){h2 small{display:block;margin:.15rem 0 0}}
    .sub{color:var(--muted);font-size:.92rem;margin-bottom:1rem;max-width:76ch}
    .sub a{color:var(--texto);font-weight:600}

    /* bloco 1: com página completa */
    .grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:1.4rem;margin-top:1.2rem}
    @media(max-width:760px){.grid{grid-template-columns:minmax(0,1fr)}}
    .card{min-width:0;background:#fff;border:1px solid var(--linha);border-radius:4px;overflow:hidden;display:flex;flex-direction:column;transition:border-color .2s,box-shadow .2s}
    .card:hover{border-color:var(--dourado);box-shadow:0 8px 22px rgba(0,0,0,.07)}
    .card-img{display:block;position:relative;aspect-ratio:16/9;overflow:hidden;background:#E6E1D6}
    .card-img img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;display:block}
    .badge{position:absolute;top:.8rem;left:.8rem;font-size:.66rem;font-weight:700;letter-spacing:.08em;text-transform:uppercase;padding:.32rem .65rem;border-radius:4px;background:var(--preto);color:var(--dourado)}
    .ilustr{position:absolute;right:.6rem;bottom:.6rem;font-size:.64rem;letter-spacing:.04em;background:rgba(22,22,22,.72);color:#fff;padding:.2rem .5rem;border-radius:3px}
    .card-b{padding:1.1rem 1.3rem 1.3rem;display:flex;flex-direction:column;flex:1}
    .constr{font-size:.68rem;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:#8f7418;margin-bottom:.3rem}
    .card h3{font-size:1.3rem;margin:0 0 .4rem;line-height:1.25}
    .card h3 a{text-decoration:none}
    .specs{font-size:.88rem;color:var(--muted);line-height:1.5;flex:1;margin-bottom:.9rem}
    .preco{border-top:1px dashed var(--linha);padding-top:.7rem;margin-bottom:.95rem}
    .preco span{display:block;font-size:.64rem;color:#8a8272;text-transform:uppercase;letter-spacing:.1em}
    .preco strong{display:block;font-size:1.55rem;font-weight:700;line-height:1.1;margin-top:.15rem}
    .preco em{display:block;font-style:normal;font-size:.74rem;color:#8a8272;margin-top:.25rem}
    .preco-sc strong{color:#a15e2c;font-size:1.1rem}
    .acoes{display:flex;gap:.5rem;flex-wrap:wrap}
    .btn-card,.btn-wa,.btn-info{display:inline-flex;align-items:center;justify-content:center;min-height:44px;padding:.6rem 1.1rem;font-size:.82rem;font-weight:600;letter-spacing:.05em;text-decoration:none;border-radius:4px;white-space:nowrap}
    .btn-card{background:var(--preto);color:#fff;flex:1}
    .btn-wa{background:#25D366;color:#fff}
    .btn-card:hover,.btn-wa:hover{opacity:.9}
    @media(max-width:420px){.card-b{padding:1rem 1rem 1.1rem}.card h3{font-size:1.15rem}.btn-card,.btn-wa{padding:.6rem .85rem}}
    @media(max-width:340px){.btn-card,.btn-wa{flex:1 1 100%}}

    /* bloco 2: próximas páginas — só texto, sem foto e sem preço */
    .grid-prep{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));column-gap:1rem;row-gap:0;margin-top:1.2rem}
    @media(max-width:1000px){.grid-prep{grid-template-columns:repeat(2,minmax(0,1fr))}}
    @media(max-width:560px){.grid-prep{grid-template-columns:minmax(0,1fr)}}
    .prep{min-width:0;display:flex;flex-direction:column;border:1px dashed #cbbf9c;border-radius:4px;padding:1rem 1.1rem 1.1rem;margin-bottom:1rem}
    .prep-tag{align-self:flex-start;justify-self:start;font-size:.6rem;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:#8f7418;border:1px solid #d9cda6;border-radius:99px;padding:.18rem .6rem;margin-bottom:.7rem}
    .prep h3{font-size:1.02rem;line-height:1.3;margin:0 0 .55rem}
    .prep ul{list-style:none;font-size:.84rem;color:#4a4a42;line-height:1.5;flex:1;margin-bottom:1rem}
    .prep li{padding:.28rem 0;border-top:1px solid #e9e3d3}
    .prep li b{display:block;font-size:.6rem;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:#8a8272}
    @media(max-width:560px){.prep li{display:flex;gap:.9rem;align-items:baseline}.prep li b{flex:0 0 4.4rem}}
    .btn-info{border:1px solid #1f9d55;color:#157a41;background:#fff}
    .btn-info:hover{background:#eefaf2}
    /* etiqueta, título, dados e botão na mesma linha em todos os cards, mesmo quando um título quebra */
    @supports (grid-template-rows:subgrid){
      .prep{display:grid;grid-template-rows:subgrid;grid-row:span 4}
      .prep ul{align-self:start}
      .prep .btn-info{align-self:end}
    }

    /* bloco 3: tabela do catálogo */
    .tabela-wrap{overflow-x:auto;background:#fff;border:1px solid var(--linha);border-radius:4px;-webkit-overflow-scrolling:touch}
    table{width:100%;border-collapse:collapse;font-size:.9rem;min-width:760px}
    .tabela-mes{font-size:.76rem;letter-spacing:.1em;text-transform:uppercase;color:#8f7418;font-weight:600;margin-bottom:.5rem}
    th{text-align:left;font-size:.68rem;letter-spacing:.1em;text-transform:uppercase;color:#8a8272;padding:.8rem 1rem;border-bottom:2px solid var(--preto);background:var(--creme)}
    td{padding:.65rem 1rem;border-bottom:1px solid #eee9db;vertical-align:top}
    tr:last-child td{border-bottom:none}
    td a{font-weight:600;text-decoration:none;border-bottom:1px solid var(--dourado)}
    td b{font-weight:600}
    .t-prep,.obs{display:block;font-size:.74rem;color:var(--muted);line-height:1.4}
    .t-prep{color:#8f7418}
    .arraste{display:none;font-size:.76rem;color:var(--muted);margin:0 0 .5rem}
    /* tela estreita: a tabela rola dentro da moldura e a coluna do nome fica parada */
    @media(max-width:860px){
      .arraste{display:block}
      th:first-child,td:first-child{position:sticky;left:0;z-index:1;width:9.6rem;min-width:9.6rem;max-width:9.6rem;box-shadow:1px 0 0 var(--linha)}
      td:first-child{background:#fff}
    }
    .fonte{color:var(--muted);font-size:.86rem;margin-top:.8rem;max-width:86ch}

    /* bloco 4: linhas da marca */
    .linhas{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:1rem;margin-top:1rem}
    @media(max-width:560px){.linhas{grid-template-columns:minmax(0,1fr)}}
    .linhas div{min-width:0;background:#fff;border:1px solid var(--linha);border-left:3px solid var(--dourado);border-radius:4px;padding:.9rem 1.2rem 1rem}
    .linhas b{display:block;font-size:.68rem;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:#8f7418;margin-bottom:.15rem}
    .linhas span{font-size:1.08rem;font-weight:600;line-height:1.35}
    .leia{display:flex;flex-wrap:wrap;gap:.6rem;margin-top:1rem}
    .leia a{display:inline-flex;align-items:center;min-height:44px;padding:.55rem 1rem;border:1px solid var(--preto);border-radius:4px;text-decoration:none;font-size:.84rem;font-weight:600}
    .leia a:hover{background:var(--preto);color:#fff}

    .faq details{background:#fff;border:1px solid var(--linha);border-radius:4px;margin-bottom:.6rem;padding:1rem 1.2rem}
    .faq summary{font-weight:600;cursor:pointer}
    .faq p{margin-top:.6rem;color:#4a4a42;max-width:78ch}
    .cta{background:var(--preto);color:#fff;text-align:center;padding:2.4rem 1.4rem;margin:2.6rem 0 0;border-radius:4px}
    .cta strong{font-size:1.25rem;display:block;margin-bottom:.5rem;font-weight:600}
    .cta p{opacity:.85;max-width:56ch;margin:0 auto .9rem;font-weight:300}
    .cta a.btn{display:inline-block;background:#25D366;color:#fff;font-weight:600;text-decoration:none;border-radius:4px;padding:.95rem 1.8rem;letter-spacing:.05em}
    .aviso{background:#f2efe6;border-left:4px solid var(--dourado);padding:1.1rem 1.3rem;margin:2.2rem 0 0;font-size:.88rem;color:#4a4a42;border-radius:0 4px 4px 0}
    .aviso p+p{margin-top:.5rem}
    .links-uteis{display:flex;flex-wrap:wrap;gap:.6rem 1.2rem;justify-content:center;margin:1.6rem 0 2.6rem;font-size:.84rem}
    .links-uteis a{color:var(--muted)}
    footer{background:#101010;color:rgba(255,255,255,.7);padding:2.5rem 5%;text-align:center;font-size:.82rem;font-weight:300}
    footer .footer-links{display:flex;flex-wrap:wrap;gap:.8rem 1.4rem;justify-content:center;margin-bottom:1rem}
    footer a{color:rgba(255,255,255,.75);text-decoration:none;letter-spacing:.08em;text-transform:uppercase;font-size:.74rem}
    footer a:hover{color:var(--dourado)}
    footer .nap{margin-top:.6rem}
  </style>
</head>
<body>
  <header>
    <a href="/" class="logo-text">Imobiliária Viv'América</a>
    <nav>
      <a href="/apartamentos-na-planta-indaiatuba/">Apartamentos</a>
      <a href="/loteamentos-em-indaiatuba/">Loteamentos</a>
      <a href="/condominios-fechados-indaiatuba/">Condomínios</a>
      <a href="/mapa-lotes-indaiatuba/">Veja no mapa</a>
      <a href="/blog/">Blog</a>
    </nav>
  </header>

  <section class="topo">
    <div class="wrap">
      <p class="breadcrumb"><a href="/">Início</a> › Empreendimentos Alphaville</p>
      <h1>${esc(H1)}</h1>
      <p class="lede">Os empreendimentos da marca Alphaville com venda em andamento, com a cidade e a fase de cada um, conforme o catálogo oficial da companhia, consultado em ${CONSULTA}. Neste site, que é da Imobiliária Viv'América, ${comPagina.length === 2 ? 'dois' : comPagina.length} têm <strong>página completa</strong>, com preço e tabela: ${listaPaginas}.</p>
      <span class="pill">Catálogo de ${CONSULTA} · ${plural(N, 'empreendimento', 'empreendimentos')} · ${comPagina.length} com página completa</span>
    </div>
  </section>

  <div class="faixa">
    <nav class="atalhos" aria-label="Atalhos desta página">
      <a href="#com-pagina">com página completa</a>
      <a href="#proximas-paginas">próximas páginas</a>
      <a href="#catalogo">catálogo</a>
      <a href="#linhas">linhas da marca</a>
      <a href="#faq">perguntas</a>
    </nav>
  </div>

  <div class="section"><div class="wrap">
    <section class="sec" id="com-pagina">
      <h2>Com página completa <small>${plural(comPagina.length, 'empreendimento', 'empreendimentos')}</small></h2>
      <p class="sub">O preço "a partir de" é o da tabela de vendas indicada em cada card. A página de cada um traz a tabela, as condições de pagamento e o mapa.</p>
      <div class="grid">${comPagina.map(card).join('')}
      </div>
    </section>

    <section class="sec" id="proximas-paginas">
      <h2>Próximas páginas <small>${emPreparo.length} em preparo</small></h2>
      <p class="sub">Estes empreendimentos estão no catálogo oficial e ainda não têm página aqui. O material de cada um está sendo preparado; enquanto isso, o atendimento passa o que já existe. Preço, total de lotes e metragem só entram quando chegar a tabela de vendas.</p>
      <div class="grid-prep">${emPreparo.map(cardPreparo).join('')}
      </div>
    </section>

    <section class="sec" id="catalogo">
      <h2>Catálogo Alphaville com venda em andamento <small>${plural(N, 'empreendimento', 'empreendimentos')}</small></h2>
      <p class="sub">Os empreendimentos que o catálogo oficial mostra em lançamento, em breve lançamento ou em construção, mais o que aparece como entregue e ainda tem tabela de vendas em vigor.</p>
      <p class="tabela-mes" id="catalogo-rotulo">Catálogo oficial da Alphaville, consultado em ${CONSULTA}</p>
      <p class="arraste">Arraste a tabela para o lado para ver todas as colunas.</p>
      <div class="tabela-wrap">
        <table aria-labelledby="catalogo-rotulo">
          <thead><tr><th scope="col">Empreendimento</th><th scope="col">Cidade e estado</th><th scope="col">Linha</th><th scope="col">Produto</th><th scope="col">Fase</th></tr></thead>
          <tbody>${EMP.map(linhaTabela).join('')}
          </tbody>
        </table>
      </div>
      <p class="fonte">Fonte: catálogo oficial da Alphaville, consultado em ${CONSULTA}. A fase é a que o catálogo informa nessa data; as observações abaixo da fase vêm da divulgação de resultados da companhia do 2º trimestre de 2026 e das tabelas de vendas citadas. Ficam de fora os que o catálogo marca como 100% vendidos e os demais entregues. O Alphaville Paraná, em Campo Largo/PR, aparece no catálogo como em construção e também como 100% vendido, e por isso ficou de fora. Os nomes com link têm página completa neste site.</p>
    </section>

    <section class="sec" id="linhas">
      <h2>Linhas da marca</h2>
      <p class="sub">A coluna Linha da tabela indica a qual das linhas da companhia cada empreendimento pertence. Uma das diferenças entre elas é o tamanho do lote:</p>
      <div class="linhas">
        <div><b>Linha Alphaville</b><span>Lotes de no mínimo 360 m²</span></div>
        <div><b>Linha Terras Alpha</b><span>Lotes com tamanho médio de 200 a 360 m²</span></div>
      </div>
      <p class="fonte">Segundo o Formulário de Referência 2026 da companhia (versão 3, página 13 de 264). No histórico do mesmo documento (página 1), a Terras Alpha aparece com lotes médios de 250 a 360 m², ao lado de uma terceira linha, a Jardim Alpha, com lote médio de 200 a 250 m².</p>
      <p class="leia">
        <a href="/blog/o-que-e-alphaville/">O que é Alphaville: a história e os números da marca</a>
        <a href="/mapa-lotes-indaiatuba/#alphaville">Alphaville Indaiatuba no mapa de lotes</a>
        <a href="/mapa-lotes-indaiatuba/#dompedro0">Casas Alphaville Dom Pedro 0 no mapa</a>
      </p>
    </section>

    <section class="sec faq" id="faq">
      <h2>Perguntas frequentes</h2>
${FAQ.map(f => `      <details><summary>${esc(f.q)}</summary><p>${f.a}</p></details>`).join('\n')}
    </section>

    <div class="cta">
      <strong>Quer saber o que está à venda?</strong>
      <p>Diga qual empreendimento ou cidade interessa. Enviamos a tabela dos que já têm página e o material disponível dos demais.</p>
      <a class="btn" href="${wa(MSG_HUB)}" target="_blank" rel="noopener">Falar no WhatsApp</a>
    </div>

    <div class="aviso">
      <p>Alphaville é marca da Alphaville S.A. Esta página é da Imobiliária Viv'América (CRECI 47394-J), que intermedeia a venda, e não é o site oficial da incorporadora.</p>
      <p>Preços conforme a tabela de vendas indicada em cada card, sujeitos a alteração sem aviso; a disponibilidade é confirmada no atendimento. As imagens dos cards são ilustrativas.</p>
    </div>

    <p class="links-uteis">
      <a href="/condominios-fechados-indaiatuba/">Condomínios fechados em Indaiatuba</a>
      <a href="/loteamentos-em-indaiatuba/">Loteamentos em Indaiatuba</a>
      <a href="/mapa-lotes-indaiatuba/">Mapa de lotes de Indaiatuba</a>
      <a href="/precos-lancamentos-indaiatuba/">Observatório de Preços</a>
      <a href="/blog/o-que-e-alphaville/">O que é Alphaville</a>
    </p>
  </div></div>

  <!--GEN:malha-->${malhaAnterior}<!--/GEN:malha-->

  <footer>
    <div class="footer-links">
      <a href="/">Início</a>
      <a href="/apartamentos-na-planta-indaiatuba/">Apartamentos na planta</a>
      <a href="/loteamentos-em-indaiatuba/">Loteamentos</a>
      <a href="/condominios-fechados-indaiatuba/">Condomínios fechados</a>
      <a href="/precos-lancamentos-indaiatuba/">Observatório de Preços</a>
      <a href="/blog/">Blog</a>
    </div>
    <p>© ${ANO} Imobiliária Viv'América · Empreendimentos Alphaville · CRECI 47394-J</p>
  <p class="nap">Imobiliária Viv'América · CRECI 47394-J · Av. Higienópolis, 70 – Jardim União, Indaiatuba/SP · <a href="https://wa.me/5519989769457">(19) 98976-9457</a> · <a href="/sobre/">Sobre a imobiliária</a> · <a href="https://imoveisvivamerica.com.br/politica-de-privacidade">Política de Privacidade</a></p>
  </footer>
</body>
</html>
`;

fs.mkdirSync(R + SLUG, { recursive: true });
// repõe a camada de marca no mesmo ponto em que o identidade.js a injeta (depois do 1º </style>)
let SAIDA = HTML;
if (marcaAnterior && !SAIDA.includes('id="marca"')) {
  const k = SAIDA.indexOf('</style>');
  if (k > 0) SAIDA = SAIDA.slice(0, k + 8) + marcaAnterior + SAIDA.slice(k + 8);
}
fs.writeFileSync(ARQ, SAIDA, 'utf8');
if (!SAIDA.includes('id="marca"')) console.log('  ATENCAO: pagina sem a camada de marca; rode node identidade.js antes de publicar');
console.log('gera-alphaville: ' + N + ' no catalogo de ' + CONSULTA + ' · ' + comPagina.length + ' com pagina · ' + emPreparo.length + ' em preparo');
console.log('  title ' + TITLE.length + ' chars · description ' + DESC.length + ' chars');
console.log('  precos: ' + comPagina.map(e => e.slug + '=' + (e.p ? brl(e.p) + ' (' + e.tabela + (e.fonte ? ', fonte unica' : '') + ')' : 'sob consulta')).join(' · '));
