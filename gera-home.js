/* ═══════════════════════════════════════════════════════════════════
   GERA-HOME — a home lê a fonte única
   ───────────────────────────────────────────────────────────────────
   Preenche os trechos marcados de index.html a partir dos MESMOS dados
   do folheto/observatório (APTOS/LOTES de gera-folheto.js + MOVIMENTOS
   e EDICAO de gera-observatorio.js):

   - <title>, description, og/twitter e <!--GEN:h1--> da home: a home é a
     única dona do termo "lançamentos imobiliários indaiatuba" (decisão
     de 02/09/2026, opção B); o número no título/H1 nunca envelhece à mão
   - <!--GEN:lede-->     1º parágrafo do hero como resposta direta (N com
                         preço, apartamento e lote mais baratos, próximos)
   - <!--GEN:selos-->    selos do hero (avaliações, contagens, menores preços)
   - <!--GEN:obscard-->  card do Observatório (m² médio + altas do mês)
   - <!--GEN:proximos--> seção "Próximos lançamentos" (APTOS com campo prox:
                         situação informada pela incorporadora, com data ou
                         "não divulgada" — nunca "em breve" sem fonte)
   - <!--GEN:faq-barato--> e <!--GEN:faq-proximos--> respostas do FAQ;
     o FAQPage JSON-LD da home é regerado dos <details> visíveis
   - contadores dos cabeçalhos de seção (N empreendimentos em #apartamentos
     e em #lotes; padrão que não casar vira aviso, não silêncio)
   - preço dentro de cada card, casado pelo slug: data-preco, o
     "A partir de R$", o R$/m² e o preço no texto do botão de WhatsApp;
     nos lotes, também a metragem ("A partir de N m²" e o m² da mensagem)
   - escassez dos cards: "Últimas N unidades (data)" e "Ver as N unidades"
     saem de est + estEm da fonte única (data da contagem, nunca o mês da
     edição); nos hubs, sem estEm não sai selo

   E nos DOIS HUBS DE LOTE (loteamentos-em-indaiatuba/ e
   condominios-fechados-indaiatuba/), a partir de LOTES + EDICAO:
   - <title>, description, og/twitter, <!--GEN:h1--> com contagem viva
   - <!--GEN:hubgrid-->   grade de cards ordenada por R$/m² (loteamentos =
                          dois grupos com H2 — abertos / fechados e
                          condomínios de lotes —, cada um com sua grade;
                          condomínios = os mesmos fechados do 2º grupo,
                          condomínios de lotes e loteamentos fechados, em
                          uma grade); cada card traz o mês da própria tabela
   - <!--GEN:faq-m2-->    resposta do m² (min/média/max, com o mês da tabela
                          de cada empreendimento citado)
   - <!--GEN:faq-mudou--> exemplo de variação de preço do mês (MOVIMENTOS)
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
   gera-apartamentos → gera-alphaville → gera-blog-ofertas →
   gera-blog-indice → gera-relacionados → identidade.js (último).

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
const mesAbrev = MES_ABREV[EDICAO.iso.slice(5, 7)] + '/' + EDICAO.ano;   // out/2026
const mesLongo = EDICAO.mes.toLowerCase() + '/' + EDICAO.ano;           // outubro/2026
const mesExtenso = EDICAO.mes.toLowerCase() + ' de ' + EDICAO.ano;      // outubro de 2026
const hojeBR = EDICAO.lastmod.split('-').reverse().join('/');           // 10/10/2026
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const todos = APTOS.concat(LOTES);
const total = todos.length;
const construtoras = new Set(todos.map(e => e.c.split(' · ')[0].trim())).size;
const comPreco = todos.filter(e => e.p);
const menor = Math.min(...comPreco.map(e => e.p));
const aptoMin = APTOS.filter(e => e.p).reduce((a, b) => a.p < b.p ? a : b);
const aptoMax = APTOS.filter(e => e.p).reduce((a, b) => a.p > b.p ? a : b);
const loteMin = LOTES.reduce((a, b) => a.p < b.p ? a : b);
const menorApto = aptoMin.p;
const menorLote = loteMin.p;
const m2s = LOTES.map(l => l.p / l.m2);
const m2Medio = Math.round(m2s.reduce((a, b) => a + b, 0) / m2s.length);
const altas = MOVIMENTOS.filter(m => m.para > m.de).length;
const proximos = APTOS.filter(e => e.prox);
const lista = arr => arr.length <= 1 ? arr.join('') : arr.slice(0, -1).join(', ') + ' e ' + arr[arr.length - 1];
const WA = '5519989769457';
const waInteresse = n => 'https://wa.me/' + WA + '?text=' + encodeURIComponent('Olá! Tenho interesse no ' + n + ' em Indaiatuba. Pode me enviar mais informações?');

let h = fs.readFileSync(R + 'index.html', 'utf8');
let feitos = [], falhas = [];
// Data da última mudança REAL de conteúdo dos dois hubs de lote (grade, nav,
// FAQ do m², seção de regiões). O dateModified do Article usa a maior entre
// esta data e EDICAO.lastmod — nunca a data do build, para não "atualizar"
// sem mudar nada. Mudou o hub de verdade? Troque aqui e no sitemap.
const HUBS_ALTERADOS_EM = '2026-10-11';   // 11/10: o hub de condomínios passa a listar também os loteamentos fechados; mês da tabela em cada card; H1 novos

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
const HOME_DESC = `${total} lançamentos em Indaiatuba SP, ${comPreco.length} com preço na tela: de ${mil(menorLote)} (lote) a ${mil(aptoMax.p)} (apartamento), sem cadastro. Tabela atualizada em ${hojeBR}.`;
h = metaVivo(h, 'home', HOME_TITLE, HOME_DESC);
feitos.push('title/description');

// ─── 1. trechos marcados ───
function gen(marca, conteudo) {
  const r = genEm(h, marca, conteudo);
  if (r === null) { falhas.push(marca); return; }
  h = r;
  feitos.push(marca);
}

gen('h1', `Lançamentos imobiliários em Indaiatuba: ${total} empreendimentos, ${comPreco.length} com preço aberto (edição de ${mesAbrev})`);

const mcmvApto = /MCMV/.test(aptoMin.t) ? ' — Minha Casa Minha Vida (MCMV)' + (/FGTS/.test(aptoMin.t) ? ', com uso do Fundo de Garantia do Tempo de Serviço (FGTS)' : '') : '';
gen('lede', `<strong>Resposta direta:</strong> em ${mesExtenso}, a Imobiliária Viv'América representa ${total} lançamentos em Indaiatuba, ${comPreco.length} com preço aberto na tabela. O apartamento mais barato é o ${esc(aptoMin.n)} (${esc(aptoMin.c)}), a partir de ${brl(aptoMin.p)}${mcmvApto}; o lote mais barato é o do ${esc(loteMin.n)} (${esc(loteMin.c)}), a partir de ${brl(loteMin.p)} por ${loteMin.m2} m². Os ${proximos.length} <a href="#proximos-lancamentos" style="color:#C9A227">próximos lançamentos</a>, ainda sem tabela definitiva, estão listados abaixo. Apartamentos prontos de revenda ficam no <a href="https://imoveisvivamerica.com.br/site/venda/indaiatuba/apartamentos" style="color:#C9A227">site principal</a>.`);

gen('selos', `
          <span class="selo-h"><b>★ ${AVAL.nota}</b> no Google · ${AVAL.n} avaliações</span>
          <span class="selo-h"><b>${total}</b> lançamentos · <b>${construtoras}</b> construtoras</span>
          <span class="selo-h">apartamentos a partir de <b>${mil(menorApto)}</b> · lotes a partir de <b>${mil(menorLote)}</b></span>
        `);

gen('obscard', `
        <p class="oc-t">Observatório · ${mesLongo}</p>
        <p class="oc-m2">${brl(m2Medio)}<small>/m² médio do lote</small></p>
        <p class="oc-linha"><b>${altas} empreendimento${altas === 1 ? '' : 's'}</b> ${altas === 1 ? 'subiu' : 'subiram'} o preço de entrada neste mês</p>
        <a href="/precos-lancamentos-indaiatuba/">Ver a tabela completa →</a>
      `);

// ─── 1b. próximos lançamentos: só o que a incorporadora informou, com data ou "não divulgada" ───
gen('proximos', `
      <h2 id="proximos-h2">Próximos lançamentos em Indaiatuba (sem tabela definitiva)</h2>
      <p class="proximos-sub">Os ${proximos.length} empreendimentos que a Viv'América representa e ainda não têm tabela definitiva, com o que cada incorporadora informou até ${hojeBR}. Quando não há data divulgada, dizemos isso. Assim que a tabela sair, o preço entra na <a href="/precos-lancamentos-indaiatuba/">tabela de preços do mês</a>.</p>
      <div class="tabela-wrap">
        <table>
          <caption>Próximos lançamentos em Indaiatuba — situação informada pelas incorporadoras, edição de ${mesLongo} (${hojeBR}).</caption>
          <thead><tr><th>Empreendimento</th><th>Incorporadora</th><th>Situação em ${mesAbrev}</th><th>Preço</th><th>Contato</th></tr></thead>
          <tbody>${proximos.map(e => `
            <tr>
              <td><a class="nome" href="/${e.slug}/">${esc(e.n)}</a><br><small>${esc(e.s)}</small></td>
              <td data-l="Incorporadora">${esc(e.c)}</td>
              <td data-l="Situação em ${mesAbrev}">${esc(e.prox)}</td>
              <td data-l="Preço">${e.p ? 'a partir de <strong>' + brl(e.p) + '</strong> (pré-lançamento)' : '<strong>sob consulta</strong>'}</td>
              <td><a class="wa" href="${waInteresse(e.n)}" target="_blank" rel="noopener" aria-label="Pedir informações sobre ${esc(e.n)} no WhatsApp">Pedir informações</a></td>
            </tr>`).join('')}
          </tbody>
        </table>
      </div>
    `);

// ─── 1c. FAQ da home: respostas geradas + FAQPage regerado dos <details> visíveis ───
gen('faq-barato', `Entre os lançamentos representados pela Imobiliária Viv'América em ${mesExtenso}, o lote mais barato é o do ${esc(loteMin.n)} (${esc(loteMin.c)}), a partir de ${brl(loteMin.p)} por ${loteMin.m2} m², e o apartamento mais barato é o ${esc(aptoMin.n)} (${esc(aptoMin.c)}), a partir de ${brl(aptoMin.p)}${/MCMV/.test(aptoMin.t) ? ', enquadrado no Minha Casa Minha Vida' : ''}, em Indaiatuba/SP. Os ${comPreco.length} preços estão abertos na tabela de ${mesLongo} do Observatório de Preços.`);
gen('faq-proximos', `Em ${mesExtenso}, os próximos lançamentos representados pela Viv'América em Indaiatuba são: ${proximos.map(e => esc(e.n) + ' (' + esc(e.c) + ') — ' + esc(e.prox)).join('; ')}. A data de lançamento, quando a incorporadora informa, está indicada em cada um; a tabela entra nesta página assim que for liberada.`);
const mcmv = APTOS.filter(e => e.p && /MCMV/.test(e.t)).sort((a, b) => a.p - b.p);
// mês da tabela de CADA empreendimento (campo tab da fonte única). O mês da edição
// (mesAbrev/mesLongo) dá nome à edição; nunca vira mês da tabela nem do estoque de um produto.
const mesDe = iso => MES_ABREV[iso.slice(5, 7)] + '/' + iso.slice(0, 4);   // 2026-09 -> set/2026
const tabDe = e => e.tab ? 'tabela de ' + mesDe(e.tab) : 'tabela de pré-lançamento';
gen('faq-mcmv', `Sim. Em ${mesExtenso} há ${mcmv.length} apartamentos enquadrados no MCMV (Minha Casa Minha Vida) com preço aberto em Indaiatuba: ${lista(mcmv.map(e => esc(e.n) + ' (' + esc(e.c) + ' — ' + esc(e.s) + ' — a partir de ' + brl(e.p) + ', ' + tabDe(e) + ')'))}. Todos permitem financiamento pela Caixa e uso do FGTS (Fundo de Garantia do Tempo de Serviço) como entrada ou abatimento, conforme as regras do Fundo, a renda familiar e a análise de crédito do banco. Preço e estoque são os da tabela de cada construtora, na data indicada em cada um.`);

// ─── 1d. ItemList JSON-LD da home gerado da fonte única (nome, tipo, construtora, preço e mês da tabela) ───
const itemList = JSON.stringify({
  '@context': 'https://schema.org', '@type': 'ItemList',
  name: 'Lançamentos imobiliários em Indaiatuba SP',
  description: `Empreendimentos representados pela Imobiliária Viv'América em Indaiatuba: apartamentos MCMV, alto padrão, condomínios fechados e loteamentos. Edição de ${mesLongo} do Observatório de Preços.`,
  numberOfItems: total,
  itemListElement: APTOS.filter(e => e.p).sort((a, b) => a.p - b.p).concat(APTOS.filter(e => !e.p), LOTES.slice().sort((a, b) => a.p - b.p)).map((e, i) => ({
    '@type': 'ListItem', position: i + 1,
    name: `${e.n} — ${LOTES.includes(e) ? tipoLoteSchema(e) : 'apartamento'} ${e.c} em Indaiatuba · ${e.s}${e.p ? ' · a partir de ' + brl(e.p) + ' (' + tabDe(e) + ')' : ' · tabela sob consulta'}`,
    url: 'https://lancamentos.imoveisvivamerica.com.br/' + e.slug + '/',
  })),
});
function tipoLoteSchema(e) { return /^Loteamento fechado/i.test(e.s) ? 'loteamento fechado' : e.t === 'Cond. fechado' ? 'condomínio fechado de lotes' : /fechado/i.test(e.s) ? 'loteamento fechado' : 'loteamento aberto'; }
let itemListOk = false;
h = h.replace(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g, (bloco, corpo) => {
  let o; try { o = JSON.parse(corpo); } catch (e) { return bloco; }
  if (!o || o['@type'] !== 'ItemList') return bloco;
  itemListOk = true;
  return '<script type="application/ld+json">\n  ' + itemList + '\n  </script>';
});
if (itemListOk) feitos.push('ItemList (' + total + ' itens)'); else falhas.push('ItemList');

// ─── 2. contadores das seções ───
// Cada contador é casado pelo id do cabeçalho da sua seção, aceite o texto
// "empreendimentos" ou "loteamentos"; padrão que não casa entra em "nao achei".
const contador = (id, n) => {
  const re = new RegExp('(<div class="cat-header" id="' + id + '">[\\s\\S]{0,300}?<span class="cat-count">)\\d+( (?:empreendimentos|loteamentos?) · )');
  if (!re.test(h)) { falhas.push('contador #' + id); return; }
  h = h.replace(re, (m0, antes, depois) => antes + n + ' empreendimentos · ');
};
contador('apartamentos', APTOS.length);
contador('lotes', LOTES.length);
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
  // preco dentro do texto do WhatsApp (URL-encoded: R%24%20 + numero com . literal)
  card = card.replace(/de%20R%24%20[\d.]+/g, 'de%20R%24%20' + e.p.toLocaleString('pt-BR'));
  // metragem do menor lote (m2 da fonte única): "A partir de N m²" do card e o ", N m²"
  // da mensagem de WhatsApp. Só nos lotes e só onde o card usa esse formato.
  if (e.m2 && LOTES.includes(e)) {
    const m2txt = e.m2.toLocaleString('pt-BR');
    card = card.replace(/(<p class="card-meta">A partir de )[\d.,]+( m²)/, '$1' + m2txt + '$2');
    card = card.replace(/(de%20R%24%20[\d.]+%2C%20)[\d.]+(?:%2C\d+)?(%20m%C2%B2)/g, '$1' + encodeURIComponent(m2txt) + '$2');
  }

  h = h.slice(0, ini) + card + h.slice(fim);
  precosOk++;
});
feitos.push('precos em ' + precosOk + ' cards');

// ─── 4. estoque: "Últimas N unidades (data)" sincronizado nos cards da home ───
// O número vem de est e a data de estEm (data da contagem na fonte única), nunca do
// mês da edição. O botão "Ver as N unidades" acompanha o mesmo número.
const semDataEst = todos.filter(e => typeof e.est === 'number' && !e.estEm);
if (semDataEst.length) falhas.push('estEm (data da contagem) de ' + semDataEst.map(e => e.n).join(', '));
let estHome = 0;
todos.forEach(e => {
  if (typeof e.est !== 'number' || !e.slug) return;
  const i = h.indexOf('href="/' + e.slug + '/" class="card-img-link"');
  if (i < 0) return;
  const ini = h.lastIndexOf('<article', i);
  const fim = h.indexOf('</article>', i);
  let card = h.slice(ini, fim);
  const novo = card
    .replace(/Últimas \d+(?:( [Uu]nidades)|(?=\s*[·(<]))( \([^)]*\))?/, (m0, un, data) =>
      'Últimas ' + e.est + (un || ' unidades') + (e.estEm ? ' (' + e.estEm + ')' : (data || '')))
    .replace(/(class="btn-card">Ver as )\d+( unidades<)/, '$1' + e.est + '$2');
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

// ─── 5b. JSON-LD das landings: brand SEMPRE @type Brand (o GSC acusa "tipo do
//        objeto do campo brand não é válido" quando vai Organization) e SEM
//        priceValidUntil. A doc do Google (product-snippet) diz que a propriedade é
//        recomendada "if applicable" e que "your product snippet may not display if
//        the priceValidUntil property indicates a past date". Tabela de construtora
//        não tem validade conhecida e a leva mensal depende de o Fabio receber
//        tabela: com data, uma leva atrasada apagaria o preço de TODAS as landings
//        no resultado de busca. Sem a propriedade não há aviso crítico nem perda de
//        elegibilidade (lido em 04/09/2026). Casado por pasta. ───
let ldLand = 0;
todos.forEach(e => {
  if (!e.slug) return;
  const arq = R + e.slug + '/index.html';
  if (!fs.existsSync(arq)) return;
  let s = fs.readFileSync(arq, 'utf8');
  const antes = s;
  s = s.replace(/,\s*"priceValidUntil":\s*"[^"]*"/g, '');          // no meio ou no fim do objeto
  s = s.replace(/"priceValidUntil":\s*"[^"]*",\s*/g, '');          // primeira propriedade do objeto
  s = s.replace(/("brand":\s*\{\s*"@type":\s*)"Organization"/g, '$1"Brand"');
  if (s !== antes) { fs.writeFileSync(arq, s, 'utf8'); ldLand++; }
});
feitos.push('JSON-LD (sem priceValidUntil, brand Brand) em ' + ldLand + ' landings');

// ─── FAQPage regerado do que a pessoa lê (home: <details>; hubs: .faq-item) ───
const faqDeVisivel = html => {
  const limpa = s => s.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
  const itens = [];
  const reItem = /<div class="faq-item">\s*<h3>([\s\S]*?)<\/h3>\s*<p>([\s\S]*?)<\/p>/g;
  const reDet = /<details>\s*<summary>([\s\S]*?)<\/summary>\s*<p>([\s\S]*?)<\/p>\s*<\/details>/g;
  let m;
  while ((m = reItem.exec(html))) itens.push({ q: limpa(m[1]), a: limpa(m[2]) });
  while ((m = reDet.exec(html))) itens.push({ q: limpa(m[1]), a: limpa(m[2]) });
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
h = faqDeVisivel(h);
feitos.push('FAQPage da home regerado dos <details>');

fs.writeFileSync(R + 'index.html', h, 'utf8');

// ─── 6. hubs de lote gerados da fonte única ───
// (o antigo "hubgrid" alimentava /lancamentos-indaiatuba/, que virou 301
//  para a home em 02/09/2026; a página de apartamentos na planta é gerada
//  inteira pelo gera-apartamentos.js)
const porM2 = arr => arr.slice().sort((x, y) => (x.p / x.m2) - (y.p / y.m2));
// rótulo pelo que a landing diz: "Loteamento fechado" no início do s vence o t
const tipoLote = e => /^Loteamento fechado/i.test(e.s) ? 'Loteamento fechado'
  : e.t === 'Cond. fechado' ? 'Condomínio fechado'
  : /fechado/i.test(e.s) ? 'Loteamento fechado' : 'Loteamento aberto';
// selo de escassez só com a data da contagem (estEm da fonte única); sem data, sem selo
const seloEst = e => (typeof e.est === 'number' && e.est <= 60 && e.estEm)
  ? ' · últimas ' + e.est + ' unidades (' + esc(e.estEm) + ')' : '';
// mês da tabela de cada lote, impresso no card e ao lado de cada preço citado no texto
// (no card, só quando as specs ainda não dizem de que tabela é o dado)
const tabLote = e => (e.tab && !/tabela de /i.test(e.s || '')) ? ' · tabela de ' + mesDe(e.tab) : '';
const virgTab = e => e.tab ? ', tabela de ' + mesDe(e.tab) : '';
const comTab = e => esc(e.n) + virgTab(e);
// as specs já dizem a metragem dos lotes? então o card não repete "lotes a partir de N m²"
// (N é o lote de menor preço, que pode não ser o menor lote do empreendimento)
const areaNoS = e => /lotes?\s+(?:de|a partir de)\s+[\d.,]+/i.test(e.s || '');
const m2De = e => brl(Math.round(e.p / e.m2));
const m2Stats = arr => {
  const v = arr.map(l => l.p / l.m2);
  const min = arr.reduce((a, b) => a.p / a.m2 < b.p / b.m2 ? a : b);
  const max = arr.reduce((a, b) => a.p / a.m2 > b.p / b.m2 ? a : b);
  return { min, max, medio: Math.round(v.reduce((a, b) => a + b, 0) / v.length) };
};

// card no estilo de cada hub (classes CSS já existentes em cada página)
const cardLoteamentos = e => `
      <a href="/${e.slug}/" class="listing-card">
        <img loading="lazy" decoding="async" src="/${e.img}" width="800" height="450" alt="${esc(e.n)} — ${tipoLote(e)} em Indaiatuba">
        <div class="listing-card-body">
          <p class="listing-card-badge">${tipoLote(e)}${seloEst(e)}</p>
          <h3>${esc(e.n)}</h3>
          <p>${esc(e.c)} · ${esc(e.s)}${tabLote(e)}</p>
          <div class="listing-card-footer">
            <span class="listing-card-price">A partir de ${brl(e.p)} · ${brl(Math.round(e.p / e.m2))}/m²</span>
            <span class="listing-card-cta">Ver detalhes →</span>
          </div>
        </div>
      </a>`;
const cardCondominios = e => `
      <a href="/${e.slug}/" class="listing-card">
        <img loading="lazy" decoding="async" src="/${e.img}" width="800" height="450" alt="${esc(e.n)} — ${tipoLote(e).toLowerCase()} em Indaiatuba">
        <div class="card-body">
          <span class="card-badge">${tipoLote(e)}${seloEst(e)}</span>
          <h3>${esc(e.n)}</h3>
          <p>${esc(e.c)} · ${esc(e.s)}${areaNoS(e) ? '' : ' · lotes a partir de ' + e.m2 + ' m²'}${tabLote(e)}</p>
          <div class="card-price">A partir de ${brl(e.p)} · ${brl(Math.round(e.p / e.m2))}/m²</div>
          <span class="btn-card">Ver detalhes</span>
        </div>
      </a>`;

const abertos = LOTES.filter(e => tipoLote(e) === 'Loteamento aberto');
const fechados = LOTES.filter(e => tipoLote(e) !== 'Loteamento aberto');
// Hub de condomínios: todos os fechados, isto é, condomínios de lotes E loteamentos
// fechados, cada card com o rótulo que a loteadora usa. Texto com contagem diz os
// dois nomes ("condomínios e loteamentos fechados"); o title fica sem contagem.
const conds = fechados;
const terras = LOTES.find(e => e.slug === 'terras-de-san-marino-indaiatuba');
const sL = m2Stats(LOTES), sC = m2Stats(conds), sA = m2Stats(abertos), sF = m2Stats(fechados);
// exemplo de variação do mês para o FAQ "valorizar": só lotes, só o que está em MOVIMENTOS
const movLotes = MOVIMENTOS.filter(m => LOTES.some(l => l.n === m.n));
const faqMudou = 'Não prometemos valorização nem prazo. O que publicamos é o preço de cada loteamento, aberto na tabela do Observatório de Preços e atualizado mensalmente. '
  + (movLotes.length
    ? 'Na edição de ' + mesLongo + ', por exemplo, ' + lista(movLotes.map(m => m.n + ' ' + (m.para > m.de ? 'passou' : 'caiu') + ' de ' + brl(m.de) + ' para ' + brl(m.para) + ' (' + m.causa + ')')) + '. '
    : 'Na edição de ' + mesLongo + ' nenhum loteamento mudou o preço de entrada entre duas tabelas oficiais. ')
  + 'Compare antes de decidir.';
const HUBS = [
  {
    arq: 'loteamentos-em-indaiatuba/index.html',
    title: `Loteamentos em Indaiatuba: ${LOTES.length} lançamentos desde ${mil(menorLote)}`,
    desc: `Os ${LOTES.length} loteamentos e condomínios de lotes em lançamento em Indaiatuba, com preço aberto: lote desde ${mil(menorLote)}, m² de ${brl(Math.round(sL.min.p / sL.min.m2))} a ${brl(Math.round(sL.max.p / sL.max.m2))} (edição ${mesAbrev}).`,
    h1: `Loteamentos em Indaiatuba: ${LOTES.length} com lote a partir de ${mil(menorLote)}${loteMin.tab ? ' (' + mesDe(loteMin.tab) + ')' : ''}`,
    grid: `
    <h2 id="loteamentos-abertos">Loteamentos abertos em Indaiatuba: ${abertos.length} com preço aberto</h2>
    <p style="color:var(--gray);line-height:1.8;">Entre os lançamentos que representamos, o m² dos loteamentos abertos vai de ${m2De(sA.min)} (${comTab(sA.min)}) a ${m2De(sA.max)} (${comTab(sA.max)}).</p>
    <div class="listings-grid">${porM2(abertos).map(cardLoteamentos).join('')}
    </div>
    <h2 id="loteamentos-fechados">Loteamentos fechados e condomínios de lotes em Indaiatuba: ${fechados.length} com preço aberto</h2>
    <p style="color:var(--gray);line-height:1.8;">Portaria, ruas de uso restrito e lazer interno já no preço: o m² vai de ${m2De(sF.min)} (${comTab(sF.min)}) a ${m2De(sF.max)} (${comTab(sF.max)}). O rótulo de cada card é o que a própria loteadora usa (loteamento fechado ou condomínio de lotes).</p>
    <div class="listings-grid">${porM2(fechados).map(cardLoteamentos).join('')}
    </div>
    `,
    faqM2: `Nos ${LOTES.length} loteamentos em lançamento monitorados no Observatório de Preços (edição de ${mesLongo}), o m² de lote vai de ${m2De(sL.min)} (${sL.min.n}, ${tipoLote(sL.min).toLowerCase()}${virgTab(sL.min)}) a ${m2De(sL.max)} (${sL.max.n}, ${tipoLote(sL.max).toLowerCase()}${virgTab(sL.max)}), com média de ${brl(sL.medio)}/m². Nos ${abertos.length} loteamentos abertos, o m² vai de ${m2De(sA.min)} a ${m2De(sA.max)}; nos ${fechados.length} loteamentos fechados e condomínios de lotes, com portaria e lazer, de ${m2De(sF.min)} a ${m2De(sF.max)}. O preço é o "a partir de" da menor unidade na data da tabela de cada um.`,
    faqMudou,
    destaque: brl(terras ? terras.p : menorLote),
  },
  {
    arq: 'condominios-fechados-indaiatuba/index.html',
    title: `Condomínios Fechados em Indaiatuba ${EDICAO.ano}: lotes com preço`,
    desc: `Os ${conds.length} condomínios e loteamentos fechados de Indaiatuba SP com preço aberto: terrenos a partir de ${mil(Math.min(...conds.map(e => e.p)))}, m² de ${m2De(sC.min)} a ${m2De(sC.max)} (edição ${mesAbrev}).`,
    h1: `Condomínios e loteamentos fechados em Indaiatuba: ${conds.length} com preço aberto`,
    grid: porM2(conds).map(cardCondominios).join('') + '\n    ',
    faqM2: `Nos ${conds.length} condomínios e loteamentos fechados em lançamento monitorados no Observatório de Preços (edição de ${mesLongo}), o m² de lote vai de ${m2De(sC.min)} (${comTab(sC.min)}) a ${m2De(sC.max)} (${comTab(sC.max)}), com média de ${brl(sC.medio)}/m², já com portaria e lazer interno no preço. O preço é o "a partir de" da menor unidade na data da tabela de cada um.`,
    faqMudou,
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
  const g = (marca, conteudo, opcional) => { const r = genEm(s, marca, conteudo); if (r === null) { if (!opcional) falhas.push(hub.arq + ' ' + marca); } else { s = r; partes.push(marca); } };
  g('h1', esc(hub.h1));
  g('hubgrid', hub.grid);
  g('faq-m2', hub.faqM2);
  g('faq-mudou', hub.faqMudou, true);   // só o hub de loteamentos tem o marcador
  g('destaque', hub.destaque);
  g('atualizado', 'Atualizado em ' + mesLongo);
  s = s.replace(/"dateModified":\s*"\d{4}-\d{2}-\d{2}"/, '"dateModified": "' + (HUBS_ALTERADOS_EM > EDICAO.lastmod ? HUBS_ALTERADOS_EM : EDICAO.lastmod) + '"');
  s = faqDeVisivel(s);
  if (s !== antes) fs.writeFileSync(arq, s, 'utf8');
  feitos.push(hub.arq.split('/')[0] + ' (' + partes.join(',') + ')');
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
console.log('selos: ' + total + ' lanc / ' + construtoras + ' construtoras / menor ' + brl(menor) + ' / m2 medio ' + brl(m2Medio) + ' / ' + altas + ' altas / proximos: ' + proximos.map(e => e.n).join(', '));
