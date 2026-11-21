/* ═══════════════════════════════════════════════════════════════════
   ASSINATURA — a linha de procedência das páginas de lista
   ───────────────────────────────────────────────────────────────────
   "Levantamento Viv'América · tabelas de ago a nov/2026 · atualizado em
   18/11/2026 · CRECI 47394-J", logo depois da lista de empreendimentos da
   home, de /apartamentos-na-planta-indaiatuba/, de
   /empreendimentos-minha-casa-minha-vida-indaiatuba/, de
   /loteamentos-em-indaiatuba/ e de /condominios-fechados-indaiatuba/
   (desde 21/11/2026). O mapa de lotes tem a mesma linha, escrita pelo
   ferramentas/mapa-lotes/gera-lista-indexavel.py com os dados do próprio mapa.

   Por quê: as IAs usam os números destas listas sem dizer de quem são
   (levantamento de 21/11/2026: fonte em 15 de 30 respostas, indicada como
   imobiliária em 6). A linha serve também ao leitor: diz quem fez a conta,
   de que tabelas e quando.

   Nada aqui é digitado; tudo sai da fonte única:
   - "tabela(s) de …": o mês da tabela de cada empreendimento DA PÁGINA
     (campo tab; com conf, o mês para o qual a incorporadora confirmou os
     mesmos preços). Um mês só: "tabela de nov/2026"; vários: "tabelas de
     ago a nov/2026". Pré-lançamento sem tab fica fora da faixa.
   - "atualizado em dd/mm/aaaa": o dia em que os DADOS da fonte única mudaram
     pela última vez — preço, área, mês da tabela, estoque e a data dele, %
     vendido, situação de pré-lançamento, tarja, previsão de entrega, entrada
     ou saída de empreendimento (CAMPOS, abaixo). Vem do git: o último commit
     que mudou esses campos em APTOS/LOTES do gera-folheto.js; com a fonte
     única alterada na árvore de trabalho, a data de hoje. Nunca fica antes de
     EDICAO.lastmod (a data de apuração do Observatório). Trocar só o texto do
     card (s), a foto ou o rótulo NÃO muda a data. Fora de um repositório git
     (cópia solta do site), vale EDICAO.lastmod.
   - CRECI: o da ENTIDADE (identidade.js).

   A linha tem a classe "assinatura" e fica entre <!--GEN:assinatura--> e
   <!--/GEN:assinatura-->: o gera-sitemap.js a tira da impressão digital,
   como faz com a linha de procedência das fichas. Pôr, tirar ou trocar a
   assinatura não muda o lastmod nem o "Atualizado em" da página; o que muda
   a data da página continua sendo a lista em si.

   Uso (geradores):
     const ASS = require('./assinatura.js');
     ASS.bloco(itens)       → '<!--GEN:assinatura--><p class="assinatura">…</p><!--/GEN:assinatura-->'
     ASS.texto(itens)       → só o texto
     ASS.dataLevantamento() → 'AAAA-MM-DD'
   itens = os empreendimentos que a página lista (com tab/conf da fonte única).
   ═══════════════════════════════════════════════════════════════════ */

const fs = require('fs');
const { execFileSync } = require('child_process');
const R = __dirname + '/';

const MES_ABREV = { '01': 'jan', '02': 'fev', '03': 'mar', '04': 'abr', '05': 'mai', '06': 'jun',
  '07': 'jul', '08': 'ago', '09': 'set', '10': 'out', '11': 'nov', '12': 'dez' };
const mesDe = iso => MES_ABREV[iso.slice(5, 7)] + '/' + iso.slice(0, 4);   // 2026-09 -> set/2026
const dataBR = iso => iso.split('-').reverse().join('/');
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// campos da fonte única que são DADO (o resto — s, img, alt, t, obsMcmv — é texto do card)
const CAMPOS = ['n', 'slug', 'c', 'p', 'm2', 'tab', 'tabRec', 'conf', 'est', 'estEm', 'vend', 'prox', 'tarja', 'prev', 'prev2'];

function recortar(src, nome) {
  const achado = new RegExp('const ' + nome + '\\s*=\\s*\\[').exec(src);
  if (!achado) return null;
  const ini = achado.index + achado[0].length - 1;
  const fim = src.indexOf('\n];', ini);
  if (fim < 0) return null;
  try { return eval('(' + src.slice(ini, fim + 2) + ')'); } catch (e) { return null; }
}
// "impressão digital" dos dados de APTOS + LOTES: a ordem da lista não conta
function digital(src) {
  const a = recortar(src, 'APTOS'), l = recortar(src, 'LOTES');
  if (!a || !l) return null;
  const linhas = a.map(e => ['A'].concat(CAMPOS.map(k => e[k] === undefined ? null : e[k])))
    .concat(l.map(e => ['L'].concat(CAMPOS.map(k => e[k] === undefined ? null : e[k]))))
    .map(x => JSON.stringify(x)).sort();
  return linhas.join('\n');
}
const EDICAO = (() => {
  const src = fs.readFileSync(R + 'gera-observatorio.js', 'utf8');
  const ini = src.indexOf('const EDICAO = ');
  const fim = src.indexOf('};', ini) + 1;
  return eval('(' + src.slice(ini + 'const EDICAO = '.length, fim) + ')');
})();
function hoje() {
  const d = new Date();
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}
const git = args => execFileSync('git', args, { cwd: R, encoding: 'utf8', maxBuffer: 1 << 26, stdio: ['ignore', 'pipe', 'ignore'] });

let _data = null;
function dataLevantamento() {
  if (_data) return _data;
  let d = EDICAO.lastmod;
  try {
    const atual = digital(fs.readFileSync(R + 'gera-folheto.js', 'utf8'));
    const commits = git(['log', '--format=%H %cs', '--', 'gera-folheto.js']).split(/\r?\n/).filter(Boolean).map(l => l.split(' '));
    let achou = null;
    if (commits.length) {
      // 1) árvore de trabalho: os dados mudaram desde o último commit? → hoje
      const head = digital(git(['show', commits[0][0] + ':gera-folheto.js']));
      if (atual !== head) achou = hoje();
      // 2) histórico: o commit mais novo cujos dados diferem dos da versão anterior
      let fpAqui = head;
      for (let i = 0; !achou && i < commits.length; i++) {
        if (i + 1 >= commits.length) { achou = commits[i][1]; break; }
        const fpAntes = digital(git(['show', commits[i + 1][0] + ':gera-folheto.js']));
        if (fpAntes !== fpAqui) { achou = commits[i][1]; break; }
        fpAqui = fpAntes;
      }
    }
    if (achou && achou > d) d = achou;
  } catch (e) { /* fora do git: fica a data de apuração da edição */ }
  _data = d;
  return d;
}

// "tabela de nov/2026" | "tabelas de ago a nov/2026" | "tabelas de jul/2025 a nov/2026"
function faixaMeses(itens) {
  const ms = [...new Set(itens.filter(e => e && e.tab).map(e => e.conf || e.tab))].sort();
  if (!ms.length) return '';
  const a = ms[0], b = ms[ms.length - 1];
  if (a === b) return 'tabela de ' + mesDe(a);
  return 'tabelas de ' + (a.slice(0, 4) === b.slice(0, 4) ? MES_ABREV[a.slice(5, 7)] : mesDe(a)) + ' a ' + mesDe(b);
}
function creci() {
  const v = require('./identidade.js').ENTIDADE.identifier.value;
  return 'CRECI ' + v;
}
function texto(itens) {
  return ["Levantamento Viv'América", faixaMeses(itens), 'atualizado em ' + dataBR(dataLevantamento()), creci()]
    .filter(Boolean).join(' · ');
}
// o <p> (para quem preenche um <!--GEN:assinatura--> que já está na página) e o bloco com os marcadores
// (para quem escreve a página inteira). Estilo no próprio <p>, para valer igual em toda página (fundo
// claro ou escuro: a cor é a do bloco em que a linha está) sem mexer na camada de marca de todas.
const ESTILO = 'font-size:.78rem;letter-spacing:.03em;line-height:1.5;opacity:.85;margin:1rem 0 0';
const conteudo = itens => '<p class="assinatura" style="' + ESTILO + '">' + esc(texto(itens)) + '</p>';
const bloco = itens => '<!--GEN:assinatura-->' + conteudo(itens) + '<!--/GEN:assinatura-->';

module.exports = { dataLevantamento, faixaMeses, texto, conteudo, bloco, CAMPOS, dataBR };

if (require.main === module) {
  console.log('data do levantamento: ' + dataLevantamento() + ' (EDICAO.lastmod ' + EDICAO.lastmod + ')');
}
