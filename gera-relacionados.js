/* ═══════════════════════════════════════════════════════════════════
   GERA-RELACIONADOS — a malha "todas ↔ todas" vira máquina
   ───────────────────────────────────────────────────────────────────
   Regra de construção do site (memória): toda página amarra todas as
   outras. Antes isso era ritual manual e decaía — landing antiga não
   ganhava os links das novas (Monte Carmelo apontava p/ 9 destinos
   enquanto o Vívere, recém-feito, apontava p/ 22).

   Este gerador injeta em CADA landing, antes do <footer>, o bloco
   <!--GEN:malha-->: links para TODOS os outros empreendimentos da
   fonte única (APTOS/LOTES de gera-folheto.js) + as páginas de
   categoria + os guias-pilares do blog.

   Ritual: entrou/saiu empreendimento → node gera-relacionados.js
   (e o identidade.js cuida do estilo pela camada de marca).
   ═══════════════════════════════════════════════════════════════════ */

const fs = require('fs');
const R = __dirname + '/';

function extrair(nome) {
  const src = fs.readFileSync(R + 'gera-folheto.js', 'utf8');
  const ini = src.indexOf('const ' + nome + ' = ');
  const fim = src.indexOf('\n];', ini) + 2;
  return eval('(' + src.slice(ini + ('const ' + nome + ' = ').length, fim) + ')');
}
const APTOS = extrair('APTOS');
const LOTES = extrair('LOTES');

// páginas vivas fora da fonte única (esgotados que seguem no ar)
const EXTRAS_APTOS = [
  { n: 'Gran Vic Canário', slug: 'gran-vic-canario-indaiatuba' },
  { n: 'Gran Vic Andorinha', slug: 'gran-vic-andorinha-indaiatuba' },
];

const aptos = APTOS.map(e => ({ n: e.n, slug: e.slug })).concat(EXTRAS_APTOS)
  .filter(e => fs.existsSync(R + e.slug + '/index.html'));
const lotes = LOTES.map(e => ({ n: e.n, slug: e.slug }))
  .filter(e => fs.existsSync(R + e.slug + '/index.html'));

const GUIAS = [
  ['Morar em Indaiatuba', '/blog/morar-em-indaiatuba/'],
  ['Minha Casa Minha Vida', '/blog/minha-casa-minha-vida-indaiatuba/'],
  ['Guia de bairros', '/blog/melhores-bairros-para-morar-indaiatuba/'],
  ['Indaiatuba é segura?', '/blog/morar-em-indaiatuba-e-seguro/'],
  ['Tabela de preços', '/precos-lancamentos-indaiatuba/'],
];

function malhaPara(slugAtual) {
  const li = e => (e.slug === slugAtual)
    ? ''
    : '<a href="/' + e.slug + '/">' + e.n + '</a>';
  return `
  <section class="malha" aria-label="Todos os lançamentos de Indaiatuba">
    <div class="malha-in">
      <p class="malha-titulo">Todos os lançamentos em Indaiatuba</p>
      <div class="malha-grupo"><span class="malha-rotulo">Apartamentos</span>${aptos.map(li).join('')}</div>
      <div class="malha-grupo"><span class="malha-rotulo">Lotes e condomínios</span>${lotes.map(li).join('')}</div>
      <div class="malha-grupo"><span class="malha-rotulo">Guias</span>${GUIAS.map(([n, u]) => '<a href="' + u + '">' + n + '</a>').join('')}</div>
    </div>
  </section>
  `;
}

const alvos = aptos.concat(lotes).map(e => e.slug);
let feitos = 0, criados = 0;
for (const slug of alvos) {
  const f = R + slug + '/index.html';
  let h = fs.readFileSync(f, 'utf8');
  if (!h.includes('<!--GEN:malha-->')) {
    const i = h.lastIndexOf('<footer');
    if (i < 0) { console.log('SEM <footer>: ' + slug); continue; }
    h = h.slice(0, i) + '<!--GEN:malha--><!--/GEN:malha-->\n\n  ' + h.slice(i);
    criados++;
  }
  const a = '<!--GEN:malha-->', b = '<!--/GEN:malha-->';
  const i = h.indexOf(a), j = h.indexOf(b);
  h = h.slice(0, i + a.length) + malhaPara(slug) + h.slice(j);
  fs.writeFileSync(f, h, 'utf8');
  feitos++;
}
console.log('gera-relacionados: malha em ' + feitos + ' landings (' + criados + ' marcadores novos) · ' +
  (aptos.length + lotes.length) + ' empreendimentos + ' + GUIAS.length + ' guias por página');
