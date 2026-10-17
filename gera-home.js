/* ═══════════════════════════════════════════════════════════════════
   GERA-HOME — a home lê a fonte única
   ───────────────────────────────────────────────────────────────────
   Preenche os trechos marcados de index.html a partir dos MESMOS dados
   do folheto/observatório (APTOS/LOTES de gera-folheto.js + MOVIMENTOS
   e EDICAO de gera-observatorio.js):

   - <title>, description, og/twitter da home: a home é a única dona do
     termo "lançamentos imobiliários indaiatuba" (decisão de 02/09/2026,
     opção B); o número do title nunca envelhece à mão. Title, description
     e FAQ contam só Indaiatuba (APTOS + LOTES)
   - <!--GEN:h1-->       H1 fixo: "Lançamentos imobiliários em Indaiatuba e região"
   - <!--GEN:numeros-->  logo abaixo do H1: "N empreendimentos, M com preço
                         aberto" e "(atualização mês/ano)"; conta a página
                         inteira (naPagina = Indaiatuba + região). Classes
                         hero-numeros/hero-edicao, nunca meta/atualizado/
                         procedencia (essas o gera-sitemap lê como data)
   - <!--GEN:lede-->     a resposta direta (N com preço, apartamento e lote
                         mais baratos, a região, próximos), na seção #resumo,
                         logo depois da lista de cards
   - <!--GEN:selos-->    selos do hero (avaliações, contagens, menores preços)
   - <!--GEN:cidades-->  caixas do filtro de cidade (uma por cidade com card na
                         página, mais cards primeiro, todas marcadas, com a
                         contagem); o filtro some da tela com uma cidade só
   - <!--GEN:obscard-->  card do Observatório (m² médio + altas do mês)
   - <!--GEN:proximos--> seção "Próximos lançamentos" (APTOS com campo prox:
                         situação informada pela incorporadora, com data ou
                         "não divulgada" — nunca "em breve" sem fonte)
   - <!--GEN:faq-barato--> e <!--GEN:faq-proximos--> respostas do FAQ;
     o FAQPage JSON-LD da home é regerado dos <details> visíveis
   - contadores dos cabeçalhos de seção (N empreendimentos em #apartamentos,
     #loteamentos e #casas; padrão que não casar vira aviso, não silêncio)
   - atributos de cada card, casados pelo slug: data-tipo (apartamento,
     lote, casa), data-cidade, data-cond (1 = loteamento fechado, condomínio
     de lotes ou casa em condomínio) e data-lote (aberto/fechado, nos lotes);
     é o que o filtro da home usa
   - ItemList JSON-LD com todos os cards, na ordem em que aparecem
   - GUARDA: o número de cards da home tem de ser igual ao de empreendimentos
     da página (naPagina); card faltando ou sobrando para o gerador
   - preço dentro de cada card, casado pelo slug: data-preco, o
     "A partir de R$", o R$/m² e o preço no texto do botão de WhatsApp;
     nos lotes, também a metragem ("A partir de N m²" e o m² da mensagem)
   - escassez dos cards: "Últimas N unidades (data)" e "Ver as N unidades"
     saem de est + estEm da fonte única (data da contagem, nunca o mês da
     edição); nos hubs, sem estEm não sai selo
   - selo dos cards: "N% vendido (data)" sai de vend da fonte única (truncado,
     com a data da lista) e a tarja comercial (ex.: desconto de lançamento) sai
     de tarja; card com preço na fonte única e "sob consulta" na home vira aviso

   REGIÃO: as linhas do ALPHAVILLE (gera-alphaville.js) com página própria e
   cidade diferente de Indaiatuba viram card na home (seção "Casas em
   condomínio") e entram na linha do hero, nos selos, no ItemList e no filtro
   de cidade. NUNCA entram em APTOS/LOTES, que alimentam folheto,
   Observatório, hubs e a página de apartamentos. Linha com preço e sem o mês
   da tabela para o gerador.

   E nos DOIS HUBS DE LOTE (loteamentos-em-indaiatuba/ e
   condominios-fechados-indaiatuba/), a partir de LOTES + EDICAO
   (nos dois, a grade vem logo depois do topo e o texto vira guia embaixo):
   - <title>, description, og/twitter, <!--GEN:h1--> (loteamentos: com
     contagem viva; condomínios: fixo "Condomínios em Indaiatuba")
   - <!--GEN:contagem-->  só no de condomínios: H2 logo abaixo do H1 com a
                          contagem viva ("N condomínios e loteamentos fechados,
                          todos com preço aberto")
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
  const achado = new RegExp('const ' + nome + '\\s*=\\s*').exec(src);   // tolera "NOME =" com ou sem espaço
  if (!achado) throw new Error(nome + ' nao achado em ' + arquivo);
  const ini = achado.index + achado[0].length;
  const fim = src.indexOf('\n];', ini) + 2;
  const fimObj = src.indexOf('};', ini) + 1;
  const corpo = (nome === 'EDICAO' || nome === 'ESTOQUE_ANTERIOR')
    ? src.slice(ini, fimObj + 1)
    : src.slice(ini, fim);
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
// mês da tabela de CADA empreendimento (campo tab da fonte única). O mês da edição
// (mesAbrev/mesLongo) dá nome à edição; nunca vira mês da tabela nem do estoque de um produto.
const mesDe = iso => MES_ABREV[iso.slice(5, 7)] + '/' + iso.slice(0, 4);   // 2026-09 -> set/2026
// tabela de mês anterior com os preços confirmados para um mês depois (campo conf da fonte única)
const confTxt = e => e.conf ? ', preços confirmados para ' + mesDe(e.conf) : '';
const tabDe = e => e.tab ? 'tabela de ' + mesDe(e.tab) + confTxt(e) : 'tabela de pré-lançamento';

// ─── região: empreendimentos fora de Indaiatuba com página própria ───
// Linhas do ALPHAVILLE (gera-alphaville.js) com slug, cidade diferente de Indaiatuba e sem
// fonte:true (essas já estão em APTOS/LOTES). Ficam só na home: card, linha do hero, selos,
// ItemList e filtro de cidade. Title, description, FAQ, folheto, Observatório e hubs seguem
// só de Indaiatuba.
const MES_NUM = {};
Object.keys(MES_ABREV).forEach(n => { MES_NUM[MES_ABREV[n]] = n; });
const ALPHAVILLE = fs.existsSync(R + 'gera-alphaville.js') ? extrairDe('gera-alphaville.js', 'ALPHAVILLE') : [];
const REGIAO = ALPHAVILLE
  .filter(e => e.slug && e.cidade && e.cidade !== 'Indaiatuba' && !e.fonte && fs.existsSync(R + e.slug + '/index.html'))
  .map(e => {
    const m = /^([a-z]{3})\/(\d{4})$/.exec(e.tabela || '');
    if (e.p && !(m && MES_NUM[m[1]])) throw new Error('GERA-HOME: ' + e.n + ' tem preço sem o mês da tabela (campo tabela, formato "out/2026", no gera-alphaville.js)');
    const tipoCard = /^casas?\b/i.test(e.tipo || '') ? 'casa' : /^lotes?\b/i.test(e.tipo || '') ? 'lote' : 'apartamento';
    return {
      n: e.n, c: 'Alphaville', p: e.p || null, s: e.s || e.tipo || '', slug: e.slug,
      cidade: e.cidade, tab: m ? m[2] + '-' + MES_NUM[m[1]] : null, tipoCard,
      cond: tipoCard === 'apartamento' ? 0 : 1,   // casas e lotes Alphaville ficam em residencial fechado
    };
  });
// todos os cards da home, na ordem em que aparecem: apartamentos (com preço, do menor ao
// maior; depois os sem tabela), lotes (do menor ao maior) e os da região
const porPreco = arr => arr.filter(e => e.p).sort((a, b) => a.p - b.p).concat(arr.filter(e => !e.p));
const naPagina = porPreco(APTOS).concat(porPreco(LOTES), porPreco(REGIAO));
const comPrecoPag = naPagina.filter(e => e.p);
const construtorasPag = new Set(naPagina.map(e => e.c.split(' · ')[0].trim())).size;
const tipoCardDe = e => e.tipoCard || (LOTES.includes(e) ? 'lote' : 'apartamento');
const cidadeDe = e => e.cidade || 'Indaiatuba';
const slugCidade = s => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
// condomínio = loteamento fechado ou condomínio de lotes (mesma regra dos hubs) ou casa em condomínio
const condDe = e => LOTES.includes(e) ? (tipoLoteSchema(e) === 'loteamento aberto' ? 0 : 1) : (e.cond || 0);
const empreendimentos = n => n === 1 ? 'empreendimento' : 'empreendimentos';

let h = fs.readFileSync(R + 'index.html', 'utf8');
let feitos = [], falhas = [];
// Data da última mudança REAL de conteúdo dos dois hubs de lote (grade, nav,
// FAQ do m², seção de regiões). O dateModified do Article usa a maior entre
// esta data e EDICAO.lastmod — nunca a data do build, para não "atualizar"
// sem mudar nada. Mudou o hub de verdade? Troque aqui e no sitemap.
const HUBS_ALTERADOS_EM = '2026-10-15';   // 15/10: nos dois hubs a grade de cards vem logo depois do topo e o texto vira guia embaixo; o de condomínios ganha H1 "Condomínios em Indaiatuba" e o H2 com a contagem

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

// H1 fixo; os números ficam na linha logo abaixo (GEN:numeros), contando a página inteira
gen('h1', 'Lançamentos imobiliários em Indaiatuba e região');
gen('numeros', `
        <p class="hero-numeros"><b>${naPagina.length}</b> ${empreendimentos(naPagina.length)}, ${comPrecoPag.length === naPagina.length ? 'todos' : '<b>' + comPrecoPag.length + '</b>'} com preço aberto</p>
        <p class="hero-edicao">(atualização ${mesAbrev})</p>
        `);

const mcmvApto = /MCMV/.test(aptoMin.t) ? ' — Minha Casa Minha Vida (MCMV)' + (/FGTS/.test(aptoMin.t) ? ', com uso do Fundo de Garantia do Tempo de Serviço (FGTS)' : '') : '';
// a região numa frase: "Na região, representa também o X, em Cidade, a partir de R$ N (tabela de mês/ano)."
const regiaoFrase = REGIAO.length
  ? ' Na região, representa também ' + lista(REGIAO.map(e => `o <a href="/${e.slug}/">${esc(e.n)}</a>, em ${esc(e.cidade)}, ${e.p ? 'a partir de ' + brl(e.p) + ' (' + tabDe(e) + ')' : 'com tabela sob consulta'}`)) + '.'
  : '';
gen('lede', `<strong>Resposta direta:</strong> em ${mesExtenso}, a Imobiliária Viv'América representa ${total} lançamentos em Indaiatuba, ${comPreco.length} com preço aberto na tabela. O apartamento mais barato é o ${esc(aptoMin.n)} (${esc(aptoMin.c)}), a partir de ${brl(aptoMin.p)}${mcmvApto}; o lote mais barato é o do ${esc(loteMin.n)} (${esc(loteMin.c)}), a partir de ${brl(loteMin.p)} por ${loteMin.m2} m².${regiaoFrase} Os ${proximos.length} <a href="#proximos-lancamentos">próximos lançamentos</a>, ainda sem tabela definitiva, estão listados abaixo. Apartamentos prontos de revenda ficam no <a href="https://imoveisvivamerica.com.br/site/venda/indaiatuba/apartamentos">site principal</a>.`);

gen('selos', `
          <span class="selo-h"><b>★ ${AVAL.nota}</b> no Google · ${AVAL.n} avaliações</span>
          <span class="selo-h"><b>${naPagina.length}</b> lançamentos · <b>${construtorasPag}</b> construtoras</span>
          <span class="selo-h">apartamentos a partir de <b>${mil(menorApto)}</b> · lotes a partir de <b>${mil(menorLote)}</b></span>
        `);

// caixas do filtro de cidade: uma por cidade com card na página, mais cards primeiro
const porCidade = new Map();
naPagina.forEach(e => porCidade.set(cidadeDe(e), (porCidade.get(cidadeDe(e)) || 0) + 1));
const cidades = [...porCidade].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'pt-BR'));
gen('cidades', cidades.map(([c, n]) => `
            <label><input type="checkbox" name="cidade" value="${slugCidade(c)}" checked> <span>${esc(c)}</span> <small>${n}</small></label>`).join('') + `
          `);

gen('obscard', `
        <p class="oc-t">Observatório · ${mesLongo}</p>
        <p class="oc-m2">${brl(m2Medio)}<small>/m² médio do lote</small></p>
        <p class="oc-linha"><b>${altas} empreendimento${altas === 1 ? '' : 's'}</b> ${altas === 1 ? 'subiu' : 'subiram'} o preço de entrada nesta edição</p>
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
gen('faq-mcmv', `Sim. Em ${mesExtenso} há ${mcmv.length} apartamentos enquadrados no MCMV (Minha Casa Minha Vida) com preço aberto em Indaiatuba: ${lista(mcmv.map(e => esc(e.n) + ' (' + esc(e.c) + ' — ' + esc(e.s) + ' — a partir de ' + brl(e.p) + ', ' + tabDe(e) + ')'))}. Todos permitem financiamento pela Caixa e uso do FGTS (Fundo de Garantia do Tempo de Serviço) como entrada ou abatimento, conforme as regras do Fundo, a renda familiar e a análise de crédito do banco. Preço e estoque são os da tabela de cada construtora, na data indicada em cada um.`);

// ─── 1d. ItemList JSON-LD da home: todos os cards (Indaiatuba e região), na ordem da página ───
// É estático: o filtro só esconde cards no navegador; o HTML e o ItemList trazem todos.
const tipoItem = e => LOTES.includes(e) ? tipoLoteSchema(e)
  : e.tipoCard === 'casa' ? 'casas em condomínio' : e.tipoCard === 'lote' ? 'lotes em condomínio' : 'apartamento';
const temCasa = REGIAO.some(e => e.tipoCard === 'casa');
const itemList = JSON.stringify({
  '@context': 'https://schema.org', '@type': 'ItemList',
  name: 'Lançamentos imobiliários em Indaiatuba e região',
  description: `Empreendimentos representados pela Imobiliária Viv'América em Indaiatuba e região: ${lista(['apartamentos MCMV e de alto padrão', 'condomínios fechados', 'loteamentos'].concat(temCasa ? ['casas em condomínio'] : []))}. Edição de ${mesLongo}, com o mês da tabela de cada um.`,
  numberOfItems: naPagina.length,
  itemListElement: naPagina.map((e, i) => ({
    '@type': 'ListItem', position: i + 1,
    name: `${e.n} — ${tipoItem(e)} ${e.c} em ${cidadeDe(e)} · ${e.s}${e.p ? ' · a partir de ' + brl(e.p) + ' (' + tabDe(e) + ')' : ' · tabela sob consulta'}`,
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
if (itemListOk) feitos.push('ItemList (' + naPagina.length + ' itens)'); else falhas.push('ItemList');

// ─── 2. contadores das seções ───
// Cada contador é casado pelo id do cabeçalho da sua seção, aceite o texto
// "empreendimento(s)" ou "loteamento(s)"; padrão que não casa entra em "nao achei".
const contador = (id, n) => {
  const re = new RegExp('(<div class="cat-header" id="' + id + '">[\\s\\S]{0,300}?<span class="cat-count">)\\d+ (?:empreendimentos?|loteamentos?) · ');
  if (!re.test(h)) { falhas.push('contador #' + id); return; }
  h = h.replace(re, (m0, antes) => antes + n + ' ' + empreendimentos(n) + ' · ');
};
const nTipo = t => naPagina.filter(e => tipoCardDe(e) === t).length;
contador('apartamentos', nTipo('apartamento'));
contador('loteamentos', nTipo('lote'));
if (nTipo('casa')) contador('casas', nTipo('casa'));
feitos.push('contadores');

// ─── 2b. GUARDA: um card para cada empreendimento da página, e nada além ───
// Card faltando ou sobrando para o gerador (antes virava só "nao achei").
const nCards = (h.match(/<article class="listing-card"/g) || []).length;
const semCard = naPagina.filter(e => !e.slug || h.indexOf('href="/' + e.slug + '/" class="card-img-link"') < 0);
if (semCard.length || nCards !== naPagina.length) {
  throw new Error('GERA-HOME: a home tem ' + nCards + ' cards e deveria ter ' + naPagina.length
    + (semCard.length ? ' (sem card: ' + semCard.map(e => e.slug || e.n).join(', ') + ')' : '')
    + '. Crie ou apague o card em index.html; nada foi gravado.');
}

// ─── 2c. atributos de cada card, casados pelo slug: tipo, cidade, condomínio e lote ───
// O filtro da home lê só estes atributos (Apartamentos = data-tipo apartamento;
// Loteamentos = data-tipo lote; Condomínios = data-cond 1; cidade = data-cidade).
const comAtributo = (tag, nome, valor) => {
  const re = new RegExp('\\s' + nome + '="[^"]*"');
  return re.test(tag) ? tag.replace(re, ' ' + nome + '="' + valor + '"') : tag.replace(/\s*>$/, ' ' + nome + '="' + valor + '">');
};
naPagina.forEach(e => {
  const i = h.indexOf('href="/' + e.slug + '/" class="card-img-link"');
  const ini = h.lastIndexOf('<article', i);
  const fimTag = h.indexOf('>', ini) + 1;
  let tag = h.slice(ini, fimTag);
  tag = comAtributo(tag, 'data-tipo', tipoCardDe(e));
  tag = comAtributo(tag, 'data-cidade', slugCidade(cidadeDe(e)));
  tag = comAtributo(tag, 'data-cond', String(condDe(e)));
  if (LOTES.includes(e)) tag = comAtributo(tag, 'data-lote', condDe(e) ? 'fechado' : 'aberto');
  h = h.slice(0, ini) + tag + h.slice(fimTag);
});
feitos.push('atributos em ' + naPagina.length + ' cards');

// ─── 3. preço dentro de cada card, casado pelo slug ───
let precosOk = 0;
naPagina.forEach(e => {
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

  // card que ainda está como "sob consulta" (sem o padrão "A partir de <strong>R$ ...") não
  // recebe o preço: vira aviso, não silêncio (mover o card para a grade com preço é à mão)
  if (card.indexOf('A partir de <strong>' + brl(e.p) + '</strong>') < 0) falhas.push('preço no card ' + e.slug + ' (o card ainda não tem "A partir de <strong>R$ ...</strong>")');
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

// ─── 4b. selo do card: % vendido (vend) e tarja comercial (tarja) da fonte única ───
// "76% vendido (05/10/2026)" sai de vend { tot, disp, em }: o % é truncado, nunca arredondado
// para cima, e sempre leva a data da lista de disponíveis. O selo é lido em partes separadas
// por " · ": as partes que o gerador escreveu antes ("N% vendido", "N% de desconto") são
// trocadas, as outras ficam; parte que a tarja já diz ("Lançamento") sai. Com "Últimas N" no
// selo (est ≤ 60), o % não entra na home: a escassez já está dita, com a data.
const pctVend = e => Math.floor((1 - e.vend.disp / e.vend.tot) * 100);
todos.forEach(e => {
  if (!e.vend) return;
  const v = e.vend;
  if (!(v.tot > 0 && v.disp >= 0 && v.disp <= v.tot && /^\d{2}\/\d{2}\/\d{4}$/.test(v.em || '')))
    throw new Error('GERA-HOME: vend de ' + e.n + ' precisa de tot > 0, 0 ≤ disp ≤ tot e em no formato dd/mm/aaaa');
  if (typeof e.est === 'number' && (e.est !== v.disp || e.estEm !== v.em))
    throw new Error('GERA-HOME: ' + e.n + ' tem est ' + e.est + ' (' + e.estEm + ') e vend.disp ' + v.disp + ' (' + v.em + ') — os dois contam a mesma lista; acerte a fonte única');
});
todos.forEach(e => {
  if (e.tarja && / · /.test(e.tarja)) throw new Error('GERA-HOME: a tarja de ' + e.n + ' não pode ter " · " (é o separador do selo)');
});
let selosHome = 0;
todos.forEach(e => {
  if (!e.slug || (!e.vend && !e.tarja)) return;
  const i = h.indexOf('href="/' + e.slug + '/" class="card-img-link"');
  if (i < 0) return;
  const ini = h.lastIndexOf('<article', i);
  const fim = h.indexOf('</article>', i);
  const card = h.slice(ini, fim);
  const m = /(<span class="card-badge"[^>]*>)([^<]*)(<\/span>)/.exec(card);
  if (!m) { falhas.push('selo do card ' + e.slug); return; }
  const gerado = /\b\d+% (?:vendido|de desconto)\b/i;
  const partes = m[2].split(' · ').map(x => x.trim()).filter(x => x && !gerado.test(x));
  const temUltimas = partes.some(x => /^Últimas \d+/i.test(x));
  const novos = [e.tarja || '', e.vend && !temUltimas ? pctVend(e) + '% vendido (' + e.vend.em + ')' : ''].filter(Boolean);
  const resto = partes.filter(x => !novos.some(n => n.toLowerCase().includes(x.toLowerCase())));
  const txt = novos.map(esc).concat(resto).join(' · ');
  if (txt === m[2]) return;
  const novo = card.slice(0, m.index) + m[1] + txt + m[3] + card.slice(m.index + m[0].length);
  h = h.slice(0, ini) + novo + h.slice(fim);
  selosHome++;
});
feitos.push('% vendido/tarja em ' + selosHome + ' selos da home');

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
// (no card, só quando as specs ainda não dizem de que tabela é o dado); a confirmação de preços
// para um mês depois (conf) entra uma vez só, também quando as specs já trazem a data da tabela
const tabLote = e => !e.tab ? ''
  : !/tabela de /i.test(e.s || '') ? ' · tabela de ' + mesDe(e.tab) + confTxt(e)
  : (e.conf && !/confirmad/i.test(e.s || '') ? ' · preços confirmados para ' + mesDe(e.conf) : '');
const virgTab = e => e.tab ? ', tabela de ' + mesDe(e.tab) + confTxt(e) : '';
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

// miniatura leve do card: usa <nome>-640.webp (gravado por ferramentas/hero-leve.py ao lado do
// original) quando o arquivo existe; sem ele sai o original, como antes. Largura e altura vêm do
// cabeçalho do .webp.
function dimWebp(arq) {
  const b = Buffer.alloc(30);
  const fd = fs.openSync(arq, 'r');
  try { fs.readSync(fd, b, 0, 30, 0); } finally { fs.closeSync(fd); }
  if (b.toString('latin1', 0, 4) !== 'RIFF' || b.toString('latin1', 8, 12) !== 'WEBP') return null;
  const tipo = b.toString('latin1', 12, 16);
  if (tipo === 'VP8 ') return { w: b.readUInt16LE(26) & 0x3fff, h: b.readUInt16LE(28) & 0x3fff };
  if (tipo === 'VP8L') { const n = b.readUInt32LE(21); return { w: (n & 0x3fff) + 1, h: ((n >>> 14) & 0x3fff) + 1 }; }
  if (tipo === 'VP8X') return { w: 1 + b.readUIntLE(24, 3), h: 1 + b.readUIntLE(27, 3) };
  return null;
}
function miniatura(img) {
  const leve = img.replace(/\.(jpe?g|png)$/i, '-640.webp');
  const d = leve !== img && fs.existsSync(R + leve) ? dimWebp(R + leve) : null;
  return d ? { src: leve, w: d.w, h: d.h } : null;
}
// atributos src, width e height da <img> do card (800x450 é a reserva de espaço de sempre, usada sem o .webp)
const imgCard = e => { const m = miniatura(e.img); return m ? `src="/${m.src}" width="${m.w}" height="${m.h}"` : `src="/${e.img}" width="800" height="450"`; };

// card no estilo de cada hub (classes CSS já existentes em cada página)
const cardLoteamentos = e => `
      <a href="/${e.slug}/" class="listing-card">
        <img loading="lazy" decoding="async" ${imgCard(e)} alt="${esc(e.n)} — ${tipoLote(e)} em Indaiatuba">
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
        <img loading="lazy" decoding="async" ${imgCard(e)} alt="${esc(e.n)} — ${tipoLote(e).toLowerCase()} em Indaiatuba">
        <div class="card-body">
          <span class="card-badge">${tipoLote(e)}${seloEst(e)}</span>
          <h3>${esc(e.n)}</h3>
          <p>${esc(e.c)} · ${esc(e.s)}${areaNoS(e) ? '' : ' · lotes a partir de ' + e.m2.toLocaleString('pt-BR') + ' m²'}${tabLote(e)}</p>
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
    h1: 'Condomínios em Indaiatuba',
    // H2 logo abaixo do H1: a contagem viva, com "fechados" (o H1 ficou curto)
    contagem: conds.length === 1
      ? `1 condomínio ou loteamento fechado${conds[0].p ? ', com preço aberto' : ''}`
      : `${conds.length} condomínios e loteamentos fechados, ${conds.every(e => e.p) ? 'todos' : conds.filter(e => e.p).length} com preço aberto`,
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
  if (hub.contagem) g('contagem', esc(hub.contagem));
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
console.log('selos: ' + total + ' lanc em Indaiatuba + ' + REGIAO.length + ' na regiao = ' + naPagina.length + ' cards (' + comPrecoPag.length + ' com preco) / ' + construtorasPag + ' construtoras / menor ' + brl(menor) + ' / m2 medio ' + brl(m2Medio) + ' / ' + altas + ' altas / cidades: ' + cidades.map(c => c[0] + ' ' + c[1]).join(', ') + ' / proximos: ' + proximos.map(e => e.n).join(', '));
