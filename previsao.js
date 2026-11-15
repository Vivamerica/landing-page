/* ═══════════════════════════════════════════════════════════════════
   PREVISAO — a etiqueta "Previsão: MM/AAAA" no canto da foto dos cards
   ───────────────────────────────────────────────────────────────────
   Pedido do Fabio em 15/11/2026: todo card de loteamento mostra a previsão
   de entrega no canto da foto ("Previsão: 12/2027"), ou "Entregue".
   "Entrega" aqui é quando o comprador pode começar a construir.

   O dado mora na fonte única (campo prev em LOTES do gera-folheto.js, e
   na linha do gera-alphaville.js para quem é de outra cidade):
     prev:'2027-07'      →  Previsão: 07/2027
     prev:'2026-12', prev2:'2028-05'  →  Previsão: 12/2026 e 05/2028 (duas fases)
     prev:'entregue'     →  Entregue
     prev:'consulte'     →  Previsão: consulte (a loteadora ainda não informou)

   Todo loteamento de LOTES precisa de prev: o gera-folheto.js para sem ele (validarLotes).

   Todo gerador que monta card de loteamento lê daqui:
     const PREV = require('./previsao.js');
     PREV.chip(e)   o <span class="card-prev"> (vazio sem prev)
     PREV.CSS       as regras da etiqueta, para a <style> da página
   ═══════════════════════════════════════════════════════════════════ */
const RE_MES = /^\d{4}-(0[1-9]|1[0-2])$/;

function validar(e) {
  if (!e || e.prev == null) {
    if (e && e.prev2 != null) throw new Error('PREVISAO: ' + e.n + ' tem prev2 sem prev');
    return;
  }
  if (e.prev !== 'entregue' && e.prev !== 'consulte' && !RE_MES.test(e.prev)) throw new Error('PREVISAO: ' + e.n + ' tem prev "' + e.prev + '" (use AAAA-MM, "entregue" ou "consulte")');
  if (e.prev2 != null && (!RE_MES.test(e.prev) || !RE_MES.test(e.prev2))) throw new Error('PREVISAO: ' + e.n + ' tem prev2 "' + e.prev2 + '" (AAAA-MM, só junto de um prev com mês)');
}

const mmaaaa = s => s.slice(5, 7) + '/' + s.slice(0, 4);

function rotulo(e) {
  validar(e);
  if (!e || !e.prev) return '';
  if (e.prev === 'entregue') return 'Entregue';
  if (e.prev === 'consulte') return 'Previsão: consulte';
  return 'Previsão: ' + [e.prev].concat(e.prev2 ? [e.prev2] : []).map(mmaaaa).join(' e ');
}

function chip(e) {
  const r = rotulo(e);
  return r ? '<span class="card-prev">' + r + '</span>' : '';
}

// canto inferior esquerdo da foto: o direito já tem "Imagem ilustrativa" e o superior
// esquerdo tem o selo de fase no /alphaville/ e no folheto
const CSS = '.card-prev{position:absolute;left:.6rem;bottom:.6rem;max-width:calc(100% - 1.2rem);'
  + 'font-size:.7rem;font-weight:700;line-height:1.3;letter-spacing:.02em;background:rgba(22,22,22,.82);'
  + 'color:#fff;padding:.22rem .55rem;border-radius:3px;border-left:3px solid #C9A227;pointer-events:none}';

// garante a regra na primeira <style> da página (as páginas são escritas à mão e os geradores só
// trocam pedaços delas). O bloco vai entre marcas de início e de fim e é REGRAVADO a cada rodada:
// mudou o CSS aqui ou o extra do gerador, a página acompanha. A primeira versão (15/11/2026) gravava
// só a marca de início, logo antes do </style>; ela é reconhecida e trocada pelo bloco novo.
const MARCA = '/* previsão de entrega no card */';
const FIM = '/* fim previsão */';
function garanteCss(html, extra) {
  const bloco = MARCA + '\n    ' + CSS + (extra ? '\n    ' + extra : '') + '\n    ' + FIM;
  const ini = html.indexOf(MARCA);
  if (ini >= 0) {
    const fim = html.indexOf(FIM, ini);
    const ate = fim >= 0 ? fim + FIM.length : html.lastIndexOf('\n', html.indexOf('</style>', ini));
    if (ate < ini) throw new Error('PREVISAO: bloco da etiqueta sem fim reconhecível');
    return html.slice(0, ini) + bloco + html.slice(ate);
  }
  const i = html.indexOf('</style>');
  if (i < 0) throw new Error('PREVISAO: página sem <style> para a etiqueta');
  return html.slice(0, i) + '    ' + bloco + '\n  ' + html.slice(i);
}

// todo loteamento tem etiqueta: sem prev, o gerador para (Fabio, 15/11/2026: o que falta apurar mostra "Previsão: consulte")
function validarLotes(lista) {
  const sem = lista.filter(e => e.prev == null).map(e => e.n);
  if (sem.length) throw new Error('PREVISAO: loteamento sem prev na fonte única (use AAAA-MM, "entregue" ou "consulte"): ' + sem.join(', '));
  lista.forEach(validar);
}

module.exports = { validar, validarLotes, rotulo, chip, CSS, garanteCss };
