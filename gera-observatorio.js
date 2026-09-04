/* ═══════════════════════════════════════════════════════════════════
   OBSERVATÓRIO DE PREÇOS — /precos-lancamentos-indaiatuba/
   ───────────────────────────────────────────────────────────────────
   A página de dados originais do site: tabela completa dos lançamentos
   com preço, R$/m² dos lotes, médias calculadas e a movimentação de
   preços do mês — informação que nem portal nem construtora publica.

   Fonte única: APTOS/LOTES do gera-folheto.js (mesmos dados do site,
   do folheto e do folder). A movimentação do mês é registrada na
   constante MOVIMENTOS, com origem em tabela oficial de construtora.

   RITUAL MENSAL: quando chegarem as tabelas do mês,
   1. atualizar gera-folheto.js (como sempre);
   2. registrar as mudanças em MOVIMENTOS (de → para, % calculada aqui);
   3. trocar EDICAO (mes/ano/iso/lastmod — a home, os hubs de lote e a
      página de apartamentos leem daqui o "tabela de <mês/ano>");
   4. rodar o ritual completo, nesta ordem: gera-folheto →
      gera-observatorio → gera-home → gera-apartamentos →
      gera-blog-ofertas → gera-blog-indice → gera-relacionados →
      identidade.js (último) && commit && push && ping IndexNow.
   ═══════════════════════════════════════════════════════════════════ */

const fs = require('fs');
const R = __dirname + '/';

const EDICAO = { mes: 'Setembro', ano: 2026, iso: '2026-09', lastmod: '2026-09-02' };

// estoque do mês ANTERIOR, para o "antes e depois" (vendidos = anterior - atual;
// o atual vem do campo est da fonte única). null = primeira medição.
const ESTOQUE_ANTERIOR = {
  'monte-carmelo-indaiatuba':      { n: 587, data: 'ago/2026', fonte: 'relatório de estoque Dominium da edição de agosto; atual: "Lotes disponíveis - Monte Carmelo" de 02/09/2026' },
  'residencial-ravello-indaiatuba': { n: 197, data: 'ago/2026', fonte: 'relatório de estoque Dominium da edição de agosto; atual: "Lotes disponíveis - Ravello" de 02/09/2026' },
  'di-italia-indaiatuba':          { n: 43,  data: '14/08/2026', fonte: 'relatório de estoque de 14/08/2026 — sem nova medição em setembro' },
  'vivere-indaiatuba':             { n: 5,   data: '22/08/2026', fonte: 'arte da Masotti de 22/08/2026 — sem nova medição em setembro' },
  // Reserva Botânica: 1ª medição com número (3 lotes, tabela Zarin de 10/07/2026);
  // antes o site só dizia "últimas unidades", sem contagem.
  // Terras de San Marino e Alpnach: 1ª medição (sem série anterior).
};

// mudanças de preço do mês, conferidas nas tabelas oficiais das construtoras
const MOVIMENTOS = [
  // setembro/2026
  { n: 'Residencial Ravello',  c: 'Dominium', de: 672000,  para: 714000,  causa: 'o menor lote disponível (420 m²) mudou no relatório de estoque', fonte: 'relatório de estoque Dominium de 02/09/2026' },
  { n: 'Reserva Botânica',     c: 'Zarin',    de: 391682,  para: 532563,  causa: 'menor lote passou de 250 para 340 m² — restam 3 lotes (tabela jul/2026)', fonte: 'tabela Zarin de 10/07/2026' },
  { n: 'Hélade — Park Meraki', c: 'PERPLAN',  de: 1300668, para: 1391504, causa: 'reajuste na tabela da construtora', fonte: 'tabela PERPLAN de setembro/2026' },
  { n: 'Parque Zarah',         c: 'Zarin',    de: 249123,  para: 172500,  causa: 'menor lote agora é misto de 150 m² (fase Pérola); residencial a partir de R$ 212.072', fonte: 'tabela Zarin de setembro/2026 (3 fases)' },
];
// Histórico da edição de agosto/2026 (já publicado então; NÃO entra na contagem
// "mudaram neste mês" nem nas altas do card da home). Quando o Observatório
// ganhar "edições anteriores", é daqui que sai.
const MOVIMENTOS_AGOSTO_2026 = [
  { n: 'Terras de San Marino', c: 'Dominium',       de: 225000, para: 247500, causa: 'reajuste na tabela da loteadora', fonte: 'tabela de 29/07/2026, piso confirmado no espelho de 13/08/2026' },
  { n: 'Gran Vic Tangará',    c: 'VIC Engenharia', de: 302464, para: 331737, causa: 'reajuste na tabela da construtora', fonte: 'tabela VIC de 15/08/2026' },
  { n: 'Jardim Di Italia',    c: 'Dominium',       de: 180000, para: 188000, causa: 'os lotes mais baratos foram vendidos — o preço de entrada subiu', fonte: 'relatório de estoque de 14/08/2026' },
];

// empreendimentos que ganharam tabela nesta edição (saíram de "sob consulta");
// ficam fora de MOVIMENTOS porque não há "antes" para calcular variação
// (o gera-home conta altas em MOVIMENTOS e trataria de:null como alta)
const ENTRADAS = [
  { n: 'Itamaracá Residencial', c: 'Zarin',   para: 339990, causa: 'primeira tabela publicada — 48,11 e 53,84 m²', fonte: 'tabela Zarin de julho/2026' },
  { n: 'Spazio Italia',         c: 'Zarin',   para: 448820, causa: 'primeira tabela publicada — 59,5 e 63,58 m²', fonte: 'tabela Zarin de 10/07/2026' },
  { n: 'Areté Home',            c: 'PERPLAN', para: 991005, causa: 'primeira tabela publicada — 93 a 117 m²', fonte: 'tabela PERPLAN de agosto/2026' },
];

// ─── dados: mesma fonte do folheto ───
const fonte = fs.readFileSync(R + 'gera-folheto.js', 'utf8');
function extrair(nome) {
  const ini = fonte.indexOf('const ' + nome + ' = [');
  const fim = fonte.indexOf('\n];', ini);
  if (ini < 0 || fim < 0) throw new Error('nao achei ' + nome);
  return eval(fonte.slice(ini + ('const ' + nome + ' = ').length, fim + 2));
}
const APTOS = extrair('APTOS');
const LOTES = extrair('LOTES');

const brl = n => 'R$ ' + n.toLocaleString('pt-BR');
const URL = 'https://lancamentos.imoveisvivamerica.com.br/precos-lancamentos-indaiatuba/';

// ─── números calculados ───
const aptosComPreco = APTOS.filter(e => e.p);
const menorApto = aptosComPreco.reduce((a, b) => a.p < b.p ? a : b);
const menorLote = LOTES.reduce((a, b) => a.p < b.p ? a : b);
const m2s = LOTES.map(l => l.p / l.m2);
const m2Medio = Math.round(m2s.reduce((a, b) => a + b, 0) / m2s.length);
const m2Min = Math.round(Math.min(...m2s));
const m2Max = Math.round(Math.max(...m2s));
const total = APTOS.length + LOTES.length;

const linhaApto = e => `
      <tr>
        <td><a href="/${e.slug}/">${e.n}</a></td>
        <td>${e.c}</td>
        <td class="num">${e.p ? '<strong>' + brl(e.p) + '</strong>' : '<span class="sc">sob consulta</span>'}</td>
        <td class="obs">${e.s}</td>
      </tr>`;

const linhaLote = e => `
      <tr>
        <td><a href="/${e.slug}/">${e.n}</a></td>
        <td>${e.c}</td>
        <td class="num">a partir de ${e.m2} m²</td>
        <td class="num"><strong>${brl(e.p)}</strong></td>
        <td class="num">${brl(Math.round(e.p / e.m2))}/m²</td>
      </tr>`;

const comEst = APTOS.concat(LOTES).filter(e => typeof e.est === 'number');
const linhaEst = e => {
  const ant = ESTOQUE_ANTERIOR[e.slug];
  const vend = ant ? ant.n - e.est : null;
  return `
      <tr>
        <td><a href="/${e.slug}/">${e.n}</a></td>
        <td>${e.c}</td>
        <td class="num"><strong>${e.est}</strong> unidade${e.est === 1 ? '' : 's'}</td>
        <td class="num">${ant ? ant.n + ' <small style="color:#8a8272">(' + ant.data + ')</small>' : '<span style="color:#8a8272">1ª medição</span>'}</td>
        <td class="num">${vend !== null ? '<strong class="desce">' + vend + ' vendida' + (vend === 1 ? '' : 's') + '</strong>' : '—'}</td>
      </tr>`;
};

const linhaMov = m => {
  const pct = ((m.para - m.de) / m.de * 100);
  const cls = pct > 0 ? 'sobe' : 'desce';
  const seta = pct > 0 ? '▲' : '▼';
  return `
      <tr>
        <td>${m.n}<br><small style="color:#8a8272;font-size:.78em">${m.causa}</small></td>
        <td>${m.c}</td>
        <td class="num">${brl(m.de)}</td>
        <td class="num"><strong>${brl(m.para)}</strong></td>
        <td class="num ${cls}">${seta} ${Math.abs(pct).toFixed(1).replace('.', ',')}%</td>
      </tr>`;
};

const linhaEntrada = m => `
      <tr>
        <td>${m.n}<br><small style="color:#8a8272;font-size:.78em">${m.causa}</small></td>
        <td>${m.c}</td>
        <td class="num"><span class="sc">sob consulta</span></td>
        <td class="num"><strong>${brl(m.para)}</strong></td>
        <td class="num" style="color:#8a8272;font-weight:700">novo na tabela</td>
      </tr>`;

// ─── FAQ (vira FAQPage no JSON-LD, gerado das mesmas respostas) ───
const FAQ = [
  { q: 'Qual é o lançamento mais barato de Indaiatuba em ' + EDICAO.mes.toLowerCase() + ' de ' + EDICAO.ano + '?',
    a: 'Entre os lotes, o ' + menorLote.n + ' (' + menorLote.c + '), a partir de ' + brl(menorLote.p) + ' em lote de ' + menorLote.m2 + ' m². Entre os apartamentos, o ' + menorApto.n + ' (' + menorApto.c + '), a partir de ' + brl(menorApto.p) + ', enquadrado no Minha Casa Minha Vida.' },
  { q: 'Quanto custa o metro quadrado de lote em Indaiatuba?',
    a: 'Nos ' + LOTES.length + ' loteamentos em lançamento monitorados nesta edição, o m² varia de ' + brl(m2Min) + ' a ' + brl(m2Max) + ', com média de ' + brl(m2Medio) + '/m². Loteamento aberto fica na faixa de baixo; condomínio fechado com lazer, na de cima.' },
  { q: 'De onde vêm os preços desta página?',
    a: 'Das tabelas oficiais que as construtoras e loteadoras enviam à Imobiliária Viv’América, sempre com a data da tabela registrada. O valor exibido é o "a partir de" — a menor unidade disponível no momento da tabela. A página é atualizada mensalmente.' },
  { q: 'Os preços mudam com frequência?',
    a: 'Sim — e é por isso que esta página existe. Na edição de ' + EDICAO.mes.toLowerCase() + '/' + EDICAO.ano + ', ' + MOVIMENTOS.length + ' empreendimentos mudaram de preço de entrada e ' + ENTRADAS.length + ' ganharam a primeira tabela, com variações de ' + Math.min(...MOVIMENTOS.map(m => (m.para - m.de) / m.de * 100)).toFixed(1).replace('.', ',') + '% a +' + Math.max(...MOVIMENTOS.map(m => (m.para - m.de) / m.de * 100)).toFixed(1).replace('.', ',') + '%. Tabela de lançamento tem validade curta e reajuste por INCC (Índice Nacional de Custo da Construção) ou IGP-M.' },
];

const jsonFaq = JSON.stringify({
  '@context': 'https://schema.org', '@type': 'FAQPage',
  mainEntity: FAQ.map(f => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
});

const jsonDataset = JSON.stringify({
  '@context': 'https://schema.org', '@type': 'Dataset',
  name: 'Preços de lançamentos imobiliários em Indaiatuba/SP — ' + EDICAO.mes + ' de ' + EDICAO.ano,
  description: 'Tabela mensal com o preço "a partir de" dos ' + total + ' lançamentos imobiliários de Indaiatuba/SP: apartamentos, loteamentos e condomínios fechados, com preço por m² dos lotes e variações mensais. Fonte: tabelas oficiais das construtoras.',
  url: URL,
  temporalCoverage: EDICAO.iso,
  spatialCoverage: { '@type': 'Place', name: 'Indaiatuba, São Paulo, Brasil' },
  creator: { '@type': 'Organization', name: "Imobiliária Viv'América", url: 'https://lancamentos.imoveisvivamerica.com.br/' },
  license: 'https://creativecommons.org/licenses/by/4.0/deed.pt-br',
  isAccessibleForFree: true,
  dateModified: EDICAO.lastmod,
});

const jsonBread = JSON.stringify({
  '@context': 'https://schema.org', '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Lançamentos Indaiatuba', item: 'https://lancamentos.imoveisvivamerica.com.br/' },
    { '@type': 'ListItem', position: 2, name: 'Preços ' + EDICAO.mes + '/' + EDICAO.ano, item: URL },
  ],
});

const HTML = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<script src="/atrib.js"></script>
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Preços de Lançamentos em Indaiatuba — Tabela ${EDICAO.mes}/${EDICAO.ano}</title>
<meta name="description" content="Tabela de ${EDICAO.mes.toLowerCase()}/${EDICAO.ano} com preço na tela, sem cadastro: os ${total} lançamentos de Indaiatuba, m² de lote de ${brl(m2Min)} a ${brl(m2Max)} e quem subiu ou baixou no mês.">
<link rel="canonical" href="${URL}">
<meta property="og:title" content="Preços de Lançamentos em Indaiatuba — Tabela ${EDICAO.mes}/${EDICAO.ano}">
<meta property="og:description" content="Tabela de ${EDICAO.mes.toLowerCase()}/${EDICAO.ano} com preço na tela, sem cadastro: os ${total} lançamentos de Indaiatuba, m² de lote de ${brl(m2Min)} a ${brl(m2Max)} e quem subiu ou baixou no mês.">
<meta property="og:url" content="${URL}">
<meta name="twitter:card" content="summary">
<meta name="twitter:title" content="Preços de Lançamentos em Indaiatuba — Tabela ${EDICAO.mes}/${EDICAO.ano}">
<meta name="twitter:description" content="Tabela de ${EDICAO.mes.toLowerCase()}/${EDICAO.ano} com preço na tela, sem cadastro: os ${total} lançamentos de Indaiatuba, m² de lote de ${brl(m2Min)} a ${brl(m2Max)} e quem subiu ou baixou no mês.">
<meta property="og:locale" content="pt_BR">
<link rel="icon" type="image/png" href="/favicon.png">
<script type="application/ld+json">${jsonDataset}</script>
<script type="application/ld+json">${jsonFaq}</script>
<script type="application/ld+json">${jsonBread}</script>
<!-- Google Analytics GA4 -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-40C0379NPR"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-40C0379NPR');
  document.addEventListener('click', function(e){
    var a = e.target.closest && e.target.closest('a[href*="wa.me"]');
    if (a) gtag('event', 'whatsapp_click', { event_category: 'contato', page: 'observatorio' });
  });
</script>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Josefin+Sans:wght@300;400;600;700&family=Poiret+One&display=swap" rel="stylesheet">
<style>
  *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
  h1{font-family:'Poiret One',cursive;font-weight:400;letter-spacing:.08em;text-transform:uppercase;line-height:1.25}
  body{font-family:'Josefin Sans',system-ui,sans-serif;color:#161616;background:#F7F5F0;line-height:1.65}
  a{color:#161616}
  .topo{background:#161616;color:#fff;padding:2.6rem 1.2rem 2.2rem}
  .wrap{max-width:1000px;margin:0 auto;padding:0 1.2rem}
  .topo .wrap{padding:0}
  .marca{font-size:.68rem;letter-spacing:.4em;text-transform:uppercase;color:#C9A227;font-weight:700}
  .marca a{color:#fff;text-decoration:none}
  .nav-site{display:flex;flex-wrap:wrap;gap:1.2rem;margin:0 0 1.2rem}
  .nav-site a{color:rgba(255,255,255,.8);text-decoration:none;font-size:.78rem;letter-spacing:.08em;text-transform:uppercase}
  .nav-site a:hover{color:#C9A227}
  @media(max-width:680px){.nav-site{display:none}}
  h1{font-size:clamp(1.6rem,4.5vw,2.4rem);font-weight:800;line-height:1.15;margin:.6rem 0 .5rem;letter-spacing:-.02em}
  h1 em{font-style:normal;color:#C9A227}
  .lede{max-width:62ch;opacity:.9;font-size:1.02rem}
  .atualizado{display:inline-block;margin-top:1rem;font-size:.78rem;letter-spacing:.12em;text-transform:uppercase;
    background:rgba(201,168,76,.16);border:1px solid rgba(201,168,76,.45);color:#C9A227;
    border-radius:99px;padding:.35rem 1rem;font-weight:700}

  .tiles{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:1rem;margin:-1.6rem auto 2.4rem;max-width:1000px;padding:0 1.2rem}
  .tile{background:#fff;border:1px solid #e3ddcd;border-radius:12px;padding:1.1rem 1.2rem;box-shadow:0 6px 18px rgba(15,28,41,.06)}
  .tile b{display:block;font-size:1.45rem;font-weight:800;color:#161616;font-variant-numeric:tabular-nums}
  .tile span{font-size:.74rem;letter-spacing:.08em;text-transform:uppercase;color:#8a8272;font-weight:700}

  h2{font-size:1.35rem;font-weight:800;margin:2.6rem 0 .4rem;letter-spacing:-.01em}
  h2 small{font-weight:600;font-size:.85rem;color:#8a8272;margin-left:.5rem}
  .sub{color:#6b6559;font-size:.92rem;margin-bottom:1rem;max-width:70ch}

  .tabela-wrap{overflow-x:auto;background:#fff;border:1px solid #e3ddcd;border-radius:12px}
  table{width:100%;border-collapse:collapse;font-size:.92rem;min-width:640px}
  th{text-align:left;font-size:.7rem;letter-spacing:.1em;text-transform:uppercase;color:#8a8272;
    padding:.8rem 1rem;border-bottom:2px solid #161616;background:#F7F5F0}
  td{padding:.7rem 1rem;border-bottom:1px solid #eee9db;vertical-align:top}
  tr:last-child td{border-bottom:none}
  td a{font-weight:700;text-decoration:none;border-bottom:1px solid #C9A227}
  td.num{white-space:nowrap;font-variant-numeric:tabular-nums}
  td.obs{color:#6b6559;font-size:.84rem;max-width:34ch}
  .sc{color:#a15e2c;font-weight:700}
  .sobe{color:#b23a3a;font-weight:800}
  .desce{color:#2e7d4f;font-weight:800}

  .faq{margin-top:1rem}
  .faq details{background:#fff;border:1px solid #e3ddcd;border-radius:10px;margin-bottom:.6rem;padding:1rem 1.2rem}
  .faq summary{font-weight:700;cursor:pointer}
  .faq p{margin-top:.6rem;color:#4a4a42;max-width:75ch}

  .metodo{background:#f2efe6;border-left:4px solid #C9A227;border-radius:0 10px 10px 0;
    padding:1.2rem 1.4rem;margin:2.4rem 0;font-size:.92rem;color:#4a4a42}
  .metodo b{color:#161616}

  .cta{background:#161616;border-radius:14px;color:#fff;text-align:center;padding:2.2rem 1.4rem;margin:2.6rem 0}
  .cta p{opacity:.85;max-width:52ch;margin:0 auto .5rem}
  .cta strong{font-size:1.25rem;display:block;margin-bottom:.9rem}
  .cta a.btn{display:inline-block;background:#25D366;color:#fff;font-weight:800;text-decoration:none;
    border-radius:10px;padding:.95rem 1.8rem;margin-top:.4rem}
  footer{text-align:center;color:#8a8272;font-size:.8rem;padding:2rem 1rem 3rem}
  footer a{color:#8a8272}
</style>
</head>
<body>

<div class="topo">
  <div class="wrap">
    <p class="marca"><a href="/">Imobiliária Viv'América</a> · Observatório de Lançamentos</p>
    <nav class="nav-site" aria-label="Seções do site">
      <a href="/apartamentos-na-planta-indaiatuba/">Apartamentos</a>
      <a href="/loteamentos-em-indaiatuba/">Loteamentos</a>
      <a href="/condominios-fechados-indaiatuba/">Condomínios</a>
      <a href="/blog/">Blog</a>
    </nav>
    <h1>Preços de lançamentos em Indaiatuba<br><em>${EDICAO.mes} de ${EDICAO.ano}</em></h1>
    <p class="lede">Os ${total} empreendimentos em lançamento na cidade, com o preço "a partir de"
    aberto — sem cadastro, sem formulário. Dados das tabelas oficiais das construtoras,
    atualizados todo mês, com a variação de quem subiu e de quem baixou.</p>
    <span class="atualizado">Edição de ${EDICAO.mes.toLowerCase()}/${EDICAO.ano} · atualizada em ${EDICAO.lastmod.split('-').reverse().join('/')}</span>
  </div>
</div>

<div class="tiles">
  <div class="tile"><b>${total}</b><span>Lançamentos monitorados</span></div>
  <div class="tile"><b>${brl(menorLote.p)}</b><span>Menor entrada (lote)</span></div>
  <div class="tile"><b>${brl(menorApto.p)}</b><span>Apto mais barato (MCMV — Minha Casa Minha Vida)</span></div>
  <div class="tile"><b>${brl(m2Medio)}/m²</b><span>Média do m² de lote</span></div>
</div>

<div class="wrap">

  <h2>Preço de entrada: o que mudou <small>entre as duas últimas tabelas de cada empreendimento</small></h2>
  <p class="sub">Só entram aqui variações confirmadas entre duas tabelas oficiais <b>do mesmo tipo</b> —
  o valor acompanhado é o <b>preço de entrada</b> ("a partir de") — ele sobe por reajuste
  de tabela ou porque as unidades mais baratas foram vendidas, e a causa está dita em cada linha.</p>
  <div class="tabela-wrap">
    <table>
      <thead><tr><th>Empreendimento</th><th>Construtora</th><th>Antes</th><th>Agora</th><th>Variação</th></tr></thead>
      <tbody>${MOVIMENTOS.map(linhaMov).join('')}${ENTRADAS.map(linhaEntrada).join('')}
      </tbody>
    </table>
  </div>

  <h2>Estoque e ritmo de vendas <small>unidades disponíveis nos empreendimentos com relatório oficial de estoque</small></h2>
  <p class="sub">O "antes e depois" que mostra a velocidade do mercado: quantas unidades cada
  empreendimento tinha, quantas tem agora e quantas saíram no período. Onde consta
  "1ª medição", ainda não há série anterior; onde a fonte não foi remedida no mês, a
  medição anterior repete a última publicada e a coluna de vendidas fica em zero.</p>
  <div class="tabela-wrap">
    <table>
      <thead><tr><th>Empreendimento</th><th>Construtora</th><th>Estoque atual</th><th>Medição anterior</th><th>Vendidas</th></tr></thead>
      <tbody>${comEst.sort((a, b) => a.est - b.est).map(linhaEst).join('')}
      </tbody>
    </table>
  </div>

  <h2>Apartamentos <small>${APTOS.length} empreendimentos · do menor ao maior investimento</small></h2>
  <div class="tabela-wrap">
    <table>
      <thead><tr><th>Empreendimento</th><th>Construtora</th><th>A partir de</th><th>Características</th></tr></thead>
      <tbody>${APTOS.map(linhaApto).join('')}
      </tbody>
    </table>
  </div>

  <h2>Lotes e condomínios fechados <small>${LOTES.length} loteamentos · com preço por m²</small></h2>
  <div class="tabela-wrap">
    <table>
      <thead><tr><th>Loteamento</th><th>Loteadora</th><th>Lote</th><th>A partir de</th><th>Preço/m²</th></tr></thead>
      <tbody>${LOTES.map(linhaLote).join('')}
      </tbody>
    </table>
  </div>

  <div class="metodo">
    <b>Metodologia.</b> Os valores vêm das tabelas de preço oficiais que construtoras e
    loteadoras enviam à Imobiliária Viv'América, com a data de cada tabela registrada.
    O preço exibido é o <b>"a partir de"</b> — a menor unidade disponível na data da tabela —
    e pode variar conforme unidade, andar e condição de pagamento. "Sob consulta" indica
    empreendimento cuja tabela a construtora ainda não liberou para publicação.
    Esta página é atualizada <b>uma vez por mês</b>; a data da edição vigente está no topo.
  </div>

  <h2>Perguntas frequentes</h2>
  <div class="faq">
${FAQ.map(f => `    <details><summary>${f.q}</summary><p>${f.a}</p></details>`).join('\n')}
  </div>

  <div class="cta">
    <strong>Quer a tabela completa de algum empreendimento?</strong>
    <p>Unidade por unidade, com condições de pagamento e simulação — é só chamar.</p>
    <a class="btn" href="https://wa.me/5519989769457?text=Ol%C3%A1!%20Vi%20o%20Observat%C3%B3rio%20de%20Pre%C3%A7os%20e%20quero%20a%20tabela%20completa%20de%20um%20empreendimento." target="_blank" rel="noopener">Falar no WhatsApp</a>
  </div>

</div>

<footer>
  Imobiliária Viv'América · Indaiatuba/SP · (19) 98976-9457 ·
  <a href="/">todos os lançamentos</a> ·
  <a href="/apartamentos-na-planta-indaiatuba/">apartamentos na planta</a> ·
  <a href="/loteamentos-em-indaiatuba/">loteamentos</a> ·
  <a href="/condominios-fechados-indaiatuba/">condomínios fechados</a>
</footer>
</body>
</html>`;

fs.mkdirSync(R + 'precos-lancamentos-indaiatuba', { recursive: true });
fs.writeFileSync(R + 'precos-lancamentos-indaiatuba/index.html', HTML, 'utf8');

console.log('Observatório gerado — edição ' + EDICAO.mes + '/' + EDICAO.ano);
console.log('  empreendimentos: ' + total + ' (' + APTOS.length + ' aptos + ' + LOTES.length + ' lotes)');
console.log('  m² de lote: min ' + brl(m2Min) + ' · médio ' + brl(m2Medio) + ' · max ' + brl(m2Max));
console.log('  movimentações do mês: ' + MOVIMENTOS.length);
console.log('  bytes: ' + HTML.length);
