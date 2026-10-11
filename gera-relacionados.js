/* ═══════════════════════════════════════════════════════════════════
   GERA-RELACIONADOS — a malha "todas ↔ todas" vira máquina
   ───────────────────────────────────────────────────────────────────
   Regra de construção do site (memória): toda página amarra todas as
   outras. Antes isso era ritual manual e decaía — landing antiga não
   ganhava os links das novas (Monte Carmelo apontava p/ 9 destinos
   enquanto o Vívere, recém-feito, apontava p/ 22).

   Este gerador injeta em CADA landing e em cada página de categoria
   (apartamentos na planta, loteamentos, condomínios), antes do <footer>,
   o bloco <!--GEN:malha-->: links para TODOS os outros empreendimentos
   da fonte única (APTOS/LOTES de gera-folheto.js) + os EXTRAS_APTOS
   (esgotados no ar) + as páginas de categoria + os guias-pilares do blog.

   Ritual: entrou/saiu empreendimento → node gera-relacionados.js
   (e o identidade.js cuida do estilo pela camada de marca).
   Ordem completa: gera-folheto → gera-observatorio → gera-home →
   gera-apartamentos → gera-alphaville → gera-blog-ofertas →
   gera-blog-indice → gera-relacionados → identidade.js (último).
   ═══════════════════════════════════════════════════════════════════ */

const fs = require('fs');
const R = __dirname + '/';

function extrair(nome, arquivo = 'gera-folheto.js') {
  const src = fs.readFileSync(R + arquivo, 'utf8');
  const ini = src.indexOf('const ' + nome + ' = ');
  const fim = src.indexOf('\n];', ini) + 2;
  return eval('(' + src.slice(ini + ('const ' + nome + ' = ').length, fim) + ')');
}
const APTOS = extrair('APTOS');
const LOTES = extrair('LOTES');

// páginas vivas fora da fonte única (esgotados que seguem no ar).
// c/s/img/t são lidos pelo gera-apartamentos.js, que os mostra como cards
// sem preço na página /apartamentos-na-planta-indaiatuba/.
const EXTRAS_APTOS = [
  // 04/09/2026: Canário (3 unidades) e Andorinha (2) voltaram ao estoque na tabela VIC de 02/09/2026
  // e estão de novo em APTOS. Quando esgotarem outra vez, voltam para cá com t:'Esgotado'.
];

const aptos = APTOS.map(e => ({ n: e.n, slug: e.slug })).concat(EXTRAS_APTOS)
  .filter(e => fs.existsSync(R + e.slug + '/index.html'));
const lotes = LOTES.map(e => ({ n: e.n, slug: e.slug }))
  .filter(e => fs.existsSync(R + e.slug + '/index.html'));

// Empreendimentos Alphaville (gera-alphaville.js): a página principal /alphaville/
// e as landings de outras cidades. Elas não estão na fonte única (que é só
// Indaiatuba) e, sem isto, ficariam sem malha e sem página nenhuma apontando
// para elas.
const ALPHA = fs.existsSync(R + 'gera-alphaville.js') ? extrair('ALPHAVILLE', 'gera-alphaville.js') : [];
const alphaFora = ALPHA
  .filter(e => e.slug && e.cidade !== 'Indaiatuba' && fs.existsSync(R + e.slug + '/index.html'))
  .map(e => ({ n: e.n + ' (' + e.cidade + ')', slug: e.slug }));
const alpha = (fs.existsSync(R + 'alphaville/index.html')
  ? [{ n: 'Empreendimentos Alphaville', slug: 'alphaville' }] : []).concat(alphaFora);

const GUIAS = [
  ['Apartamentos na planta', '/apartamentos-na-planta-indaiatuba/'],
  ['Loteamentos', '/loteamentos-em-indaiatuba/'],
  ['Condomínios fechados', '/condominios-fechados-indaiatuba/'],
  ['Morar em Indaiatuba', '/blog/morar-em-indaiatuba/'],
  ['Minha Casa Minha Vida', '/blog/minha-casa-minha-vida-indaiatuba/'],
  ['Guia de bairros', '/blog/melhores-bairros-para-morar-indaiatuba/'],
  ['Indaiatuba é segura?', '/blog/morar-em-indaiatuba-e-seguro/'],
  ['Tabela de preços', '/precos-lancamentos-indaiatuba/'],
];

// Dados e listas (10/10/2026): páginas de apoio que não são guia nem ficha e
// que, sem este grupo, só recebiam link do sitemap — o mapa de lotes, a lista
// oficial A–Z da Prefeitura e os dados abertos do Observatório (CSV/JSON).
// Só entra o que existe no disco: a malha nunca aponta para página ausente.
const DADOS = [
  ['Mapa de lotes', 'mapa-lotes-indaiatuba'],
  ['Lista oficial A–Z de loteamentos e bairros', 'loteamentos-e-bairros-de-indaiatuba'],
  ['Dados abertos e imprensa', 'imprensa-e-dados'],
].filter(([, s]) => fs.existsSync(R + s + '/index.html')).map(([n, s]) => [n, '/' + s + '/']);

// Dinheiro e financiamento (11/10/2026): os guias de custo e financiamento do
// blog. Sem este grupo só recebiam link do índice do blog e do sitemap.
// Mesma regra do grupo acima: só entra o que existe no disco.
const DINHEIRO = [
  ['Quanto ganhar para financiar', 'renda-necessaria-financiar-imovel'],
  ['ITBI, escritura e registro', 'itbi-escritura-registro-indaiatuba'],
  ['Na planta ou pronto?', 'comprar-na-planta-ou-pronto-para-morar'],
  ['Condomínio de lotes ou loteamento fechado', 'condominio-de-lotes-ou-loteamento-fechado'],
  ['Quanto custa construir', 'quanto-custa-construir-em-indaiatuba-cub-2026'],
  ['Depois das chaves', 'depois-das-chaves-o-que-muda-no-pagamento'],
  ['Patrimônio de afetação', 'patrimonio-de-afetacao-como-saber-se-a-obra-esta-protegida'],
].filter(([, s]) => fs.existsSync(R + 'blog/' + s + '/index.html')).map(([n, s]) => [n, '/blog/' + s + '/']);

function malhaPara(slugAtual) {
  const li = e => (e.slug === slugAtual)
    ? ''
    : '<a href="/' + e.slug + '/">' + e.n + '</a>';
  return `
  <section class="malha" aria-label="Todos os lançamentos de Indaiatuba">
    <div class="malha-in">
      <p class="malha-titulo">Todos os lançamentos em Indaiatuba</p>
      <div class="malha-grupo"><span class="malha-rotulo">Apartamentos</span>${aptos.map(li).join('')}</div>
      <div class="malha-grupo"><span class="malha-rotulo">Lotes e condomínios</span>${lotes.map(li).join('')}</div>${alpha.length ? `
      <div class="malha-grupo"><span class="malha-rotulo">Alphaville</span>${alpha.map(li).join('')}</div>` : ''}
      <div class="malha-grupo"><span class="malha-rotulo">Guias</span>${GUIAS.map(([n, u]) => '<a href="' + u + '">' + n + '</a>').join('')}</div>${DINHEIRO.length ? `
      <div class="malha-grupo"><span class="malha-rotulo">Dinheiro e financiamento</span>${DINHEIRO.map(([n, u]) => '<a href="' + u + '">' + n + '</a>').join('')}</div>` : ''}${DADOS.length ? `
      <div class="malha-grupo"><span class="malha-rotulo">Dados e listas</span>${DADOS.map(([n, u]) => '<a href="' + u + '">' + n + '</a>').join('')}</div>` : ''}
    </div>
  </section>
  `;
}

// páginas de categoria também recebem a malha (02/09/2026): os dois hubs de
// lote e a página de apartamentos na planta. O hub /lancamentos-indaiatuba/
// não existe mais (301 para a home).
const CATEGORIAS = ['apartamentos-na-planta-indaiatuba', 'loteamentos-em-indaiatuba', 'condominios-fechados-indaiatuba', 'alphaville']
  .filter(s => fs.existsSync(R + s + '/index.html'));

const alvos = aptos.concat(lotes).concat(alphaFora).map(e => e.slug).concat(CATEGORIAS);
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
console.log('gera-relacionados: malha em ' + feitos + ' paginas (' + criados + ' marcadores novos; ' + CATEGORIAS.length + ' de categoria) · ' +
  (aptos.length + lotes.length) + ' empreendimentos + ' + GUIAS.length + ' guias + ' + DADOS.length + ' dados/listas por página');
