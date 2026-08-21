/* ═══════════════════════════════════════════════════════════════════
   GERA-HOME — a home lê a fonte única
   ───────────────────────────────────────────────────────────────────
   Preenche os trechos marcados de index.html a partir dos MESMOS dados
   do folheto/observatório (APTOS/LOTES de gera-folheto.js + MOVIMENTOS
   e EDICAO de gera-observatorio.js):

   - <!--GEN:selos-->    selos do hero (avaliações, contagens, menor preço)
   - <!--GEN:obscard-->  card do Observatório (m² médio + altas do mês)
   - contadores dos cabeçalhos de seção (N empreendimentos / loteamentos)
   - preço dentro de cada card, casado pelo slug: data-preco, o
     "A partir de R$", o R$/m² e o preço no texto do botão de WhatsApp

   Ritual: mudou preço ou entrou produto na fonte única →
     node gera-folheto.js && node gera-observatorio.js && node gera-home.js
   e site, folheto, folder e observatório saem coerentes por construção.

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
  const corpo = (nome === 'EDICAO')
    ? src.slice(ini + ('const ' + nome + ' = ').length, fimObj + 1)
    : src.slice(ini + ('const ' + nome + ' = ').length, fim);
  return eval('(' + corpo.replace(/;\s*$/, '') + ')');
}
const APTOS = extrairDe('gera-folheto.js', 'APTOS');
const LOTES = extrairDe('gera-folheto.js', 'LOTES');
const MOVIMENTOS = extrairDe('gera-observatorio.js', 'MOVIMENTOS');
const EDICAO = extrairDe('gera-observatorio.js', 'EDICAO');

const brl = n => 'R$ ' + n.toLocaleString('pt-BR');
const todos = APTOS.concat(LOTES);
const total = todos.length;
const construtoras = new Set(todos.map(e => e.c.split(' · ')[0].trim())).size;
const menor = Math.min(...todos.filter(e => e.p).map(e => e.p));
const m2s = LOTES.map(l => l.p / l.m2);
const m2Medio = Math.round(m2s.reduce((a, b) => a + b, 0) / m2s.length);
const altas = MOVIMENTOS.filter(m => m.para > m.de).length;

let h = fs.readFileSync(R + 'index.html', 'utf8');
let feitos = [], falhas = [];

// ─── 1. trechos marcados ───
function gen(marca, conteudo) {
  const a = '<!--GEN:' + marca + '-->', b = '<!--/GEN:' + marca + '-->';
  const i = h.indexOf(a), j = h.indexOf(b);
  if (i < 0 || j < 0) { falhas.push(marca); return; }
  h = h.slice(0, i + a.length) + conteudo + h.slice(j);
  feitos.push(marca);
}

gen('selos', `
          <span class="selo-h"><b>★ ${AVAL.nota}</b> no Google · ${AVAL.n} avaliações</span>
          <span class="selo-h"><b>${total}</b> lançamentos · <b>${construtoras}</b> construtoras</span>
          <span class="selo-h">a partir de <b>${brl(menor).replace('.000', ' mil')}</b></span>
        `);

gen('obscard', `
        <p class="oc-t">📊 Observatório · ${EDICAO.mes.toLowerCase()}/${EDICAO.ano}</p>
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

fs.writeFileSync(R + 'index.html', h, 'utf8');
console.log('gera-home: ' + feitos.join(' · '));
if (falhas.length) console.log('ATENCAO, nao achei: ' + falhas.join(', '));
console.log('selos: ' + total + ' lanc / ' + construtoras + ' construtoras / menor ' + brl(menor) + ' / m2 medio ' + brl(m2Medio) + ' / ' + altas + ' altas');
