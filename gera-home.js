/* ═══════════════════════════════════════════════════════════════════
   GERA-HOME — a home lê a fonte única
   ───────────────────────────────────────────────────────────────────
   Preenche os trechos marcados de index.html a partir dos MESMOS dados
   do folheto/observatório (APTOS/LOTES de gera-folheto.js + MOVIMENTOS
   e EDICAO de gera-observatorio.js):

   - <title>, description, og/twitter e <!--GEN:h1--> da home: a home é a
     única dona do termo "lançamentos imobiliários indaiatuba" (decisão
     de 02/09/2026, opção B); o número no título/H1 nunca envelhece à mão
   - <!--GEN:selos-->    selos do hero (avaliações, contagens, menores preços)
   - <!--GEN:obscard-->  card do Observatório (m² médio + altas do mês)
   - contadores dos cabeçalhos de seção (N empreendimentos / loteamentos)
   - preço dentro de cada card, casado pelo slug: data-preco, o
     "A partir de R$", o R$/m² e o preço no texto do botão de WhatsApp

   E nos DOIS HUBS DE LOTE (loteamentos-em-indaiatuba/ e
   condominios-fechados-indaiatuba/), a partir de LOTES + EDICAO:
   - <title>, description, og/twitter, <!--GEN:h1--> com contagem viva
   - <!--GEN:hubgrid-->   grade de cards ordenada por R$/m² (loteamentos =
                          os 8 lotes com selo aberto/fechado; condomínios =
                          só t 'Cond. fechado')
   - <!--GEN:faq-m2-->    resposta do m² (min/média/max com mês da tabela)
   - <!--GEN:destaque-->  preço de destaque (Terras de San Marino / menor
                          condomínio) — um valor só, o da fonte única
   - <!--GEN:atualizado-->"Atualizado em mês/ano" + dateModified do Article
   - FAQPage JSON-LD regerado a partir dos .faq-item visíveis (o schema
     nunca diverge do que a pessoa lê)
   O hub /lancamentos-indaiatuba/ deixou de existir (301 para a home) e
   este gerador não escreve mais nele.

   Ritual: mudou preço ou entrou produto na fonte única →
     node gera-folheto.js && node gera-observatorio.js && node gera-home.js
   e site, folheto, folder e observatório saem coerentes por construção.
   Ordem completa: gera-folheto → gera-observatorio → gera-home →
   gera-apartamentos → gera-blog-ofertas → gera-blog-indice →
   gera-relacionados → identidade.js (último).

   ÚNICO dado manual daqui: AVAL (nota e nº de avaliações do Google —
   não existe API conectada; o Fabio avisa quando mudar).
   ═══════════════════════════════════════════════════════════════════ */

const fs = require('fs');
const R = __dirname + '/';

const AVAL = { nota: '5,0', n: 9 };   // Google Business — atualizar à mão

// ─── fontes ───
function extrairDe(arquivo, nome) {
  const src = fs.readFileSync(R + arquivo, 'utf8');
  const ini = src.indexOf('const ' + nome + ' = ');
  const fim = src.indexOf('\n];', ini) + 2;
  const fimObj = src.indexOf('};', ini) + 1;
  if (ini < 0) throw new Error(nome + ' nao achado em ' + arquivo);
  const corpo = (nome === 'EDICAO' || nome === 'ESTOQUE_ANTERIOR')
    ? src.slice(ini + ('const ' + nome + ' = ').length, fimObj + 1)
    : src.slice(ini + ('const ' + nome + ' = ').length, fim);
  return eval('(' + corpo.replace(/;\s*$/, '') + ')');
}
const APTOS = extrairDe('gera-folheto.js', 'APTOS');
const LOTES = extrairDe('gera-folheto.js', 'LOTES');
const MOVIMENTOS = extrairDe('gera-observatorio.js', 'MOVIMENTOS');
const ESTOQUE_ANTERIOR = extrairDe('gera-observatorio.js', 'ESTOQUE_ANTERIOR');
const EDICAO = extrairDe('gera-observatorio.js', 'EDICAO');

const brl = n => 'R$ ' + n.toLocaleString('pt-BR');
const mil = n => n >= 1e6
  ? 'R$ ' + (n / 1e6).toFixed(1).replace('.', ',').replace(',0', '') + ' mi'
  : 'R$ ' + Math.round(n / 1000) + ' mil';
const MES_ABREV = { '01': 'jan', '02': 'fev', '03': 'mar', '04': 'abr', '05': 'mai', '06': 'jun',
  '07': 'jul', '08': 'ago', '09': 'set', '10': 'out', '11': 'nov', '12': 'dez' };
const mesAbrev = MES_ABREV[EDICAO.iso.slice(5, 7)] + '/' + EDICAO.ano;   // ago/2026
const mesLongo = EDICAO.mes.toLowerCase() + '/' + EDICAO.ano;           // agosto/2026
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const todos = APTOS.concat(LOTES);
const total = todos.length;
const construtoras = new Set(todos.map(e => e.c.split(' · ')[0].trim())).size;
const comPreco = todos.filter(e => e.p);
const menor = Math.min(...comPreco.map(e => e.p));
const menorApto = Math.min(...APTOS.filter(e => e.p).map(e => e.p));
const menorLote = Math.min(...LOTES.map(e => e.p));
const m2s = LOTES.map(l => l.p / l.m2);
const m2Medio = Math.round(m2s.reduce((a, b) => a + b, 0) / m2s.length);
const altas = MOVIMENTOS.filter(m => m.para > m.de).length;

let h = fs.readFileSync(R + 'index.html', 'utf8');
let feitos = [], falhas = [];
// Data da última mudança REAL de conteúdo dos dois hubs de lote (grade, nav,
// FAQ do m², seção de regiões). O dateModified do Article usa a maior entre
// esta data e EDICAO.lastmod — nunca a data do build, para não "atualizar"
// sem mudar nada. Mudou o hub de verdade? Troque aqui e no sitemap.
const HUBS_ALTERADOS_EM = '2026-09-02';

// ─── 0. metadados vivos: title/description/og/twitter/H1 ───
// Funções compartilhadas com os hubs de lote (abaixo). O title tem teto de
// 60 e a description de 120–155 (CHECKLIST 1b); estoura = erro, não publica.
function metaVivo(html, nome, TITLE, DESC) {
  if (TITLE.length > 60) throw new Error(nome + ': title com ' + TITLE.length + ' chars (max 60): ' + TITLE);
  if (DESC.length < 120 || DESC.length > 155) throw new Error(nome + ': description com ' + DESC.length + ' chars (120-155): ' + DESC);
  const T = esc(TITLE), D = esc(DESC);
  let s = html;
  s = s.replace(/<title>[^<]*<\/title>/, '<title>' + T + '</title>');
  s = s.replace(/<meta name="description" content="[^"]*">/, '<meta name="description" content="' + D + '">');
  s = s.replace(/<meta property="og:title" content="[^"]*">/, '<meta property="og:title" content="' + T + '">');
  s = s.replace(/<meta property="og:description" content="[^"]*">/, '<meta property="og:description" content="' + D + '">');
  s = s.replace(/<meta name="twitter:title" content="[^"]*">/, '<meta name="twitter:title" content="' + T + '">');
  s = s.replace(/<meta name="twitter:description" content="[^"]*">/, '<meta name="twitter:description" content="' + D + '">');
  return s;
}
function genEm(html, marca, conteudo) {
  const a = '<!--GEN:' + marca + '-->', b = '<!--/GEN:' + marca + '-->';
  const i = html.indexOf(a), j = html.indexOf(b);
  if (i < 0 || j < 0) return null;
  return html.slice(0, i + a.length) + conteudo + html.slice(j);
}

const HOME_TITLE = `Lançamentos imobiliários em Indaiatuba ${EDICAO.ano}: ${comPreco.length} com preço`;
const HOME_DESC = `Os ${total} lançamentos de Indaiatuba SP com preço na tela, sem cadastro: apartamentos a partir de ${mil(menorApto)} e lotes a partir de ${mil(menorLote)} (tabela ${mesAbrev}).`;
h = metaVivo(h, 'home', HOME_TITLE, HOME_DESC);
feitos.push('title/description');

// ─── 1. trechos marcados ───
function gen(marca, conteudo) {
  const r = genEm(h, marca, conteudo);
  if (r === null) { falhas.push(marca); return; }
  h = r;
  feitos.push(marca);
}

gen('h1', `Lançamentos imobiliários em Indaiatuba: ${total} empreendimentos, ${comPreco.length} com preço aberto`);

gen('selos', `
          <span class="selo-h"><b>★ ${AVAL.nota}</b> no Google · ${AVAL.n} avaliações</span>
          <span class="selo-h"><b>${total}</b> lançamentos · <b>${construtoras}</b> construtoras</span>
          <span class="selo-h">apartamentos a partir de <b>${mil(menorApto)}</b> · lotes a partir de <b>${mil(menorLote)}</b></span>
        `);

gen('obscard', `
        <p class="oc-t">Observatório · ${EDICAO.mes.toLowerCase()}/${EDICAO.ano}</p>
        <p class="oc-m2">${brl(m2Medio)}<small>/m² médio do lote</small></p>
        <p class="oc-linha"><b>${altas} empreendimento${altas === 1 ? '' : 's'}</b> ${altas === 1 ? 'subiu' : 'subiram'} o preço de entrada neste mês</p>
        <a href="/precos-lancamentos-indaiatuba/">Ver a tabela completa →</a>
      `);

// ─── 2. contadores das seções ───
h = h.replace(/<span class="cat-count">\d+ empreendimentos · do menor ao maior investimento<\/span>/,
  `<span class="cat-count">${APTOS.length} empreendimentos · do menor ao maior investimento</span>`);
h = h.replace(/<span class="cat-count">\d+ loteamentos? · do menor ao maior investimento<\/span>/,
  `<span class="cat-count">${LOTES.length} loteamentos · do menor ao maior investimento</span>`);
feitos.push('contadores');

// ─── 3. preço dentro de cada card, casado pelo slug ───
let precosOk = 0;
todos.forEach(e => {
  if (!e.p || !e.slug) return;
  const i = h.indexOf('href="/' + e.slug + '/" class="card-img-link"');
  if (i < 0) { falhas.push('card ' + e.slug); return; }
  const ini = h.lastIndexOf('<article', i);
  const fim = h.indexOf('</article>', i);
  let card = h.slice(ini, fim);

  card = card.replace(/data-preco="\d+"/, 'data-preco="' + e.p + '"');
  card = card.replace(/A partir de <strong>R\$ [\d.]+<\/strong>/,
    'A partir de <strong>' + brl(e.p) + '</strong>');
  if (e.m2) {
    card = card.replace(/<strong class="pm2">R\$ [\d.]+\/m²<\/strong>/,
      '<strong class="pm2">' + brl(Math.round(e.p / e.m2)) + '/m²</strong>');
    card = card.replace(/data-pm2="\d+"/, 'data-pm2="' + Math.round(e.p / e.m2) + '"');
  }
  // preco dentro do texto do WhatsApp (URL-encoded: R%24%20 + numero com %2E? nao — usa . literal codificado como .)
  card = card.replace(/de%20R%24%20[\d.]+/g, 'de%20R%24%20' + e.p.toLocaleString('pt-BR'));

  h = h.slice(0, ini) + card + h.slice(fim);
  precosOk++;
});
feitos.push('precos em ' + precosOk + ' cards');

// ─── 4. estoque: "Últimas N" sincronizado nos cards da home ───
let estHome = 0;
todos.forEach(e => {
  if (typeof e.est !== 'number' || !e.slug) return;
  const i = h.indexOf('href="/' + e.slug + '/" class="card-img-link"');
  if (i < 0) return;
  const ini = h.lastIndexOf('<article', i);
  const fim = h.indexOf('</article>', i);
  let card = h.slice(ini, fim);
  const novo = card.replace(/Últimas \d+(\s*·| Unidades| unidades)/, 'Últimas ' + e.est + '$1');
  if (novo !== card) { h = h.slice(0, ini) + novo + h.slice(fim); estHome++; }
});
feitos.push('estoque em ' + estHome + ' badges da home');

// ─── 5. estoque nas LANDINGS: padrões seguros, casados por pasta ───
let estLand = 0;
todos.forEach(e => {
  if (typeof e.est !== 'number' || !e.slug) return;
  const arq = R + e.slug + '/index.html';
  if (!fs.existsSync(arq)) return;
  // SÓ troca número igual à medição ANTERIOR registrada — nunca um
  // subconjunto (ex.: "Últimas 3 unidades" dos Lotes Especiais do Di Italia,
  // que o padrão guloso quase estampou com o total 43)
  const ant = ESTOQUE_ANTERIOR[e.slug];
  if (!ant) return;
  const A = String(ant.n);
  let s = fs.readFileSync(arq, 'utf8');
  const antes = s;
  s = s.replace(/Últimas (\d+) [Uu]nidades/g, (m0, d) => d === A ? m0.replace(d, e.est) : m0);
  s = s.replace(/[Rr]estam( apenas)? (\d+) (lotes|unidades)/g, (m0, ap, d) => d === A ? m0.replace(d, e.est) : m0);
  s = s.replace(/[Aa]penas (\d+) lotes (restantes|disponíveis)/g, (m0, d) => d === A ? m0.replace(d, e.est) : m0);
  if (s !== antes) { fs.writeFileSync(arq, s, 'utf8'); estLand++; }
});
feitos.push('estoque em ' + estLand + ' landings');

// ─── 5b. JSON-LD das landings: priceValidUntil = último dia do mês da edição
//        (tabela de construtora vale até a próxima leva; 31/12 à mão era mentira
//        de conveniência) e brand SEMPRE @type Brand — o GSC acusa "tipo do objeto
//        do campo brand não é válido" quando vai Organization. Casado por pasta. ───
const ultimoDia = new Date(Number(EDICAO.iso.slice(0, 4)), Number(EDICAO.iso.slice(5, 7)), 0).getDate();
const validade = EDICAO.iso + '-' + String(ultimoDia).padStart(2, '0');
let ldLand = 0;
todos.forEach(e => {
  if (!e.slug) return;
  const arq = R + e.slug + '/index.html';
  if (!fs.existsSync(arq)) return;
  let s = fs.readFileSync(arq, 'utf8');
  const antes = s;
  s = s.replace(/"priceValidUntil":(\s*)"\d{4}-\d{2}-\d{2}"/g, '"priceValidUntil":$1"' + validade + '"');
  s = s.replace(/("brand":\s*\{\s*"@type":\s*)"Organization"/g, '$1"Brand"');
  if (s !== antes) { fs.writeFileSync(arq, s, 'utf8'); ldLand++; }
});
feitos.push('priceValidUntil ' + validade + ' + brand Brand em ' + ldLand + ' landings');

fs.writeFileSync(R + 'index.html', h, 'utf8');

// ─── 6. hubs de lote gerados da fonte única ───
// (o antigo "hubgrid" alimentava /lancamentos-indaiatuba/, que virou 301
//  para a home em 02/09/2026; a página de apartamentos na planta é gerada
//  inteira pelo gera-apartamentos.js)
const porM2 = arr => arr.slice().sort((x, y) => (x.p / x.m2) - (y.p / y.m2));
const tipoLote = e => e.t === 'Cond. fechado' ? 'Condomínio fechado' : 'Loteamento aberto';
const seloEst = e => (typeof e.est === 'number' && e.est <= 60)
  ? ' · últimas ' + e.est + ' unidades (' + mesAbrev + ')' : '';
const m2Stats = arr => {
  const v = arr.map(l => l.p / l.m2);
  const min = arr.reduce((a, b) => a.p / a.m2 < b.p / b.m2 ? a : b);
  const max = arr.reduce((a, b) => a.p / a.m2 > b.p / b.m2 ? a : b);
  return { min, max, medio: Math.round(v.reduce((a, b) => a + b, 0) / v.length) };
};
const faqDeVisivel = html => {
  // regera o FAQPage a partir dos .faq-item (h3 + p) que a pessoa lê
  const itens = [];
  const re = /<div class="faq-item">\s*<h3>([\s\S]*?)<\/h3>\s*<p>([\s\S]*?)<\/p>/g;
  let m;
  while ((m = re.exec(html))) itens.push({ q: m[1].replace(/<[^>]+>/g, '').trim(), a: m[2].replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim() });
  if (!itens.length) return html;
  const novo = JSON.stringify({
    '@context': 'https://schema.org', '@type': 'FAQPage',
    mainEntity: itens.map(f => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
  });
  return html.replace(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g, (bloco, corpo) => {
    let o; try { o = JSON.parse(corpo); } catch (e) { return bloco; }
    return (o && o['@type'] === 'FAQPage') ? '<script type="application/ld+json">\n  ' + novo + '\n  </script>' : bloco;
  });
};

// card no estilo de cada hub (classes CSS já existentes em cada página)
const cardLoteamentos = e => `
      <a href="/${e.slug}/" class="listing-card">
        <img loading="lazy" decoding="async" src="/${e.img}" alt="${esc(e.n)} — ${tipoLote(e)} em Indaiatuba">
        <div class="listing-card-body">
          <p class="listing-card-badge">${tipoLote(e)}${seloEst(e)}</p>
          <h3>${esc(e.n)}</h3>
          <p>${esc(e.c)} · ${esc(e.s)}</p>
          <div class="listing-card-footer">
            <span class="listing-card-price">A partir de ${brl(e.p)} · ${brl(Math.round(e.p / e.m2))}/m²</span>
            <span class="listing-card-cta">Ver detalhes →</span>
          </div>
        </div>
      </a>`;
const cardCondominios = e => `
      <a href="/${e.slug}/" class="listing-card">
        <img loading="lazy" decoding="async" src="/${e.img}" alt="${esc(e.n)} — condomínio fechado em Indaiatuba">
        <div class="card-body">
          <span class="card-badge">${tipoLote(e)}${seloEst(e)}</span>
          <h3>${esc(e.n)}</h3>
          <p>${esc(e.c)} · ${esc(e.s)} · lotes a partir de ${e.m2} m²</p>
          <div class="card-price">A partir de ${brl(e.p)} · ${brl(Math.round(e.p / e.m2))}/m²</div>
          <span class="btn-card">Ver detalhes</span>
        </div>
      </a>`;

const conds = LOTES.filter(e => e.t === 'Cond. fechado');
const terras = LOTES.find(e => e.slug === 'terras-de-san-marino-indaiatuba');
const sL = m2Stats(LOTES), sC = m2Stats(conds);
const HUBS = [
  {
    arq: 'loteamentos-em-indaiatuba/index.html', lista: porM2(LOTES), card: cardLoteamentos,
    title: `Lotes e Loteamentos em Indaiatuba ${EDICAO.ano}: ${LOTES.length} com preço aberto`,
    desc: `Os ${LOTES.length} loteamentos e condomínios de lotes de Indaiatuba SP com preço aberto: terrenos a partir de ${mil(menorLote)}, m² de ${brl(Math.round(sL.min.p / sL.min.m2))} a ${brl(Math.round(sL.max.p / sL.max.m2))} (tabela ${mesAbrev}).`,
    h1: `Loteamentos e terrenos em Indaiatuba: ${LOTES.length} com preço aberto`,
    faqM2: `Nos ${LOTES.length} loteamentos em lançamento monitorados no Observatório de Preços (tabela de ${mesLongo}), o m² de lote vai de ${brl(Math.round(sL.min.p / sL.min.m2))} (${sL.min.n}, ${tipoLote(sL.min).toLowerCase()}) a ${brl(Math.round(sL.max.p / sL.max.m2))} (${sL.max.n}, ${tipoLote(sL.max).toLowerCase()}), com média de ${brl(sL.medio)}/m². Loteamento aberto fica na faixa de baixo; condomínio fechado com portaria e lazer, na de cima. O preço é o "a partir de" da menor unidade na data da tabela.`,
    destaque: brl(terras ? terras.p : menorLote),
  },
  {
    arq: 'condominios-fechados-indaiatuba/index.html', lista: porM2(conds), card: cardCondominios,
    title: `Condomínios Fechados em Indaiatuba ${EDICAO.ano}: ${conds.length} com preço aberto`,
    desc: `Os ${conds.length} condomínios fechados de lotes de Indaiatuba SP com preço aberto: terrenos a partir de ${mil(Math.min(...conds.map(e => e.p)))}, m² de ${brl(Math.round(sC.min.p / sC.min.m2))} a ${brl(Math.round(sC.max.p / sC.max.m2))} (tabela ${mesAbrev}).`,
    h1: `Condomínios fechados de lotes em Indaiatuba: ${conds.length} com preço aberto`,
    faqM2: `Nos ${conds.length} condomínios fechados em lançamento monitorados no Observatório de Preços (tabela de ${mesLongo}), o m² de lote vai de ${brl(Math.round(sC.min.p / sC.min.m2))} (${sC.min.n}) a ${brl(Math.round(sC.max.p / sC.max.m2))} (${sC.max.n}), com média de ${brl(sC.medio)}/m² — já com portaria, ruas privativas e lazer interno no preço. O preço é o "a partir de" da menor unidade na data da tabela.`,
    destaque: brl(Math.min(...conds.map(e => e.p))),
  },
];
for (const hub of HUBS) {
  const arq = R + hub.arq;
  if (!fs.existsSync(arq)) { falhas.push(hub.arq); continue; }
  let s = fs.readFileSync(arq, 'utf8');
  const antes = s;
  s = metaVivo(s, hub.arq, hub.title, hub.desc);
  const partes = [];
  const g = (marca, conteudo) => { const r = genEm(s, marca, conteudo); if (r === null) falhas.push(hub.arq + ' ' + marca); else { s = r; partes.push(marca); } };
  g('h1', esc(hub.h1));
  g('hubgrid', hub.lista.map(hub.card).join('') + '\n    ');
  g('faq-m2', hub.faqM2);
  g('destaque', hub.destaque);
  g('atualizado', 'Atualizado em ' + mesLongo);
  s = s.replace(/"dateModified":\s*"\d{4}-\d{2}-\d{2}"/, '"dateModified": "' + (HUBS_ALTERADOS_EM > EDICAO.lastmod ? HUBS_ALTERADOS_EM : EDICAO.lastmod) + '"');
  s = faqDeVisivel(s);
  if (s !== antes) fs.writeFileSync(arq, s, 'utf8');
  feitos.push(hub.arq.split('/')[0] + ' (' + hub.lista.length + ' cards; ' + partes.join(',') + ')');
}
if (fs.existsSync(R + 'lancamentos-indaiatuba')) {
  // Guarda dura: o hub virou 301 para a home (opção B, 02/09/2026). Se a pasta
  // renascer, o Netlify serviria a página por baixo do redirect e a
  // canibalização voltaria. Falha alto, no padrão das guardas do identidade.js.
  console.error('GERA-HOME: lancamentos-indaiatuba/ AINDA EXISTE — o hub virou 301, apague a pasta. Nao publique assim.');
  process.exit(1);
}
console.log('gera-home: ' + feitos.join(' · '));
if (falhas.length) console.log('ATENCAO, nao achei: ' + falhas.join(', '));
console.log('selos: ' + total + ' lanc / ' + construtoras + ' construtoras / menor ' + brl(menor) + ' / m2 medio ' + brl(m2Medio) + ' / ' + altas + ' altas');
