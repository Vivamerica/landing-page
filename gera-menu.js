/* ═══════════════════════════════════════════════════════════════════
   GERA-MENU — o menu do site, igual em todas as páginas (fonte única)
   ───────────────────────────────────────────────────────────────────
   Escreve duas peças em cada página, sempre as mesmas:
   - <style id="menu-site-css"> logo antes do </head>;
   - <!--GEN:menu-->…<!--/GEN:menu--> logo depois do <body>: o cabeçalho
     <header id="menu-site">, um <script> curto e o corretor.js (a janela
     "Sou Corretor" é montada por ele; não fica no HTML da página).
   O id "menu-site" é SÓ do <header>: o getElementById devolve o primeiro
   elemento com o id, e um <style id="menu-site"> no <head> vinha antes,
   o script do menu pegava o <style> e parava (o botão do celular não
   abria). Por isso o estilo tem id próprio e a guarda exige um único
   id="menu-site" na página.

   Itens, nesta ordem: Sou Corretor · Empreendimentos · Apartamentos ·
   Loteamentos · Condomínios · Veja no Mapa · Blog · Revenda e Locação.
   Empreendimentos/Apartamentos/Loteamentos/Condomínios levam a /#… e têm
   data-filtro-menu: na home, a própria página filtra (window.vmFiltro);
   nas outras, o link navega para a âncora. O endereço nunca é reescrito.

   CSS blindado: o reset all:revert preso ao id vence as regras soltas de
   header/nav/a de cada página e da camada de marca; depois dele, só regras
   com #menu-site e classes ms-*. Cores: #161616, #C9A227, #F7D77E e #fff;
   apóstrofo reto; nenhum emoji (o identidade.js, que roda por último,
   reescreveria o bloco e os dois geradores se desfariam a cada rodada).
   Computador: barra de 70 px. Até 1260 px (ou quando os itens não cabem
   numa linha, conferido no navegador): barra de 60 px e botão de menu.

   Em cada página (idempotente):
   (a) cabeçalho antigo com <h1> dentro: para com erro (migre à mão antes);
   (b) tira o 1º <header> sem atributo fora do bloco, todo nav.nav-site fora
       do bloco e o <style id="nav-site">;
   (c) põe ou repõe o <style id="menu-site-css"> antes do </head> (o de
       nome antigo, <style id="menu-site">, é trocado por ele);
   (d) põe ou repõe o bloco GEN:menu logo depois do <body>.
   O CSS antigo de header/nav de cada página fica: o reset o neutraliza.

   Alvos: todo index.html do site (fora ferramentas/, qrcode/, seo/…) e o
   404.html. Impressos (folder*, folheto) nunca recebem menu.

   Uso:
     node gera-menu.js                 grava em todas as páginas
     node gera-menu.js --ensaio        não grava: lista o que mudaria
     node gera-menu.js --so a/index.html,b/index.html   só nessas páginas
     node gera-menu.js --raiz <pasta>  trabalha em outra cópia do site
     node gera-menu.js --guarda        só confere (exit 1 se alguma página
                                       estiver fora do padrão)
   Ritual: depois do gera-relacionados.js e antes do hero-leve.py --aplicar.
   Geradores que escrevem a página inteira importam daqui:
     const { MENU_CSS, MENU_HTML } = require('./gera-menu.js');
   e o identidade.js chama guardaMenu() (exit 1 quando falta o menu).
   ═══════════════════════════════════════════════════════════════════ */
const fs = require('fs');
const path = require('path');

const CORTE = 1260;   // px: abaixo disso, barra de celular com o botão de menu

const ITENS = [
  { href: '/sou-corretor/', texto: 'Sou Corretor', attr: ' data-sou-corretor', contorno: true, rota: '^/sou-corretor/' },
  { href: '/#lancamentos', texto: 'Empreendimentos', attr: ' data-filtro-menu="todos"' },
  { href: '/#apartamentos', texto: 'Apartamentos', attr: ' data-filtro-menu="apartamentos"', rota: '^/apartamentos-na-planta-indaiatuba/' },
  { href: '/#loteamentos', texto: 'Loteamentos', attr: ' data-filtro-menu="loteamentos"', rota: '^/loteamentos-em-indaiatuba/' },
  { href: '/#condominios', texto: 'Condomínios', attr: ' data-filtro-menu="condominios"', rota: '^/condominios-fechados-indaiatuba/' },
  { href: '/mapa-lotes-indaiatuba/', texto: 'Veja no Mapa', rota: '^/mapa-lotes-indaiatuba/' },
  { href: '/blog/', texto: 'Blog', rota: '^/blog/' },
  { href: 'https://imoveisvivamerica.com.br/', texto: 'Revenda e Locação <span aria-hidden="true">↗</span>', contorno: true },
];

// regras do modo celular, escritas uma vez e aplicadas por @media e pela classe .ms-compacto (rede de segurança do JS).
// .ms-lista em coluna volta a justify-content:flex-start: o flex-end da barra do computador jogava o que não cabe
// (celular deitado) para cima da tela, sem rolagem, e o 1º item sumia.
const compacto = P => [
  `${P}{flex-wrap:nowrap;height:var(--menu-h)}`,
  `${P} .ms-abre{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:5px;width:48px;height:48px;margin:0 -10px 0 0;padding:0;border:0;border-radius:4px;background:none;color:#fff;cursor:pointer}`,
  `${P} .ms-abre span{display:block;width:24px;height:2px;margin:0;padding:0;background:#fff;border-radius:1px}`,
  `${P}.ms-aberto .ms-abre span:nth-child(1){transform:translateY(7px) rotate(45deg)}`,
  `${P}.ms-aberto .ms-abre span:nth-child(2){opacity:0}`,
  `${P}.ms-aberto .ms-abre span:nth-child(3){transform:translateY(-7px) rotate(-45deg)}`,
  `${P} .ms-lista{display:none;position:absolute;top:100%;left:0;right:0;flex-direction:column;flex-wrap:nowrap;align-items:stretch;justify-content:flex-start;gap:0;padding:8px max(16px,2.5vw) 16px;background:#161616;border-top:1px solid #C9A227;max-height:calc(100vh - var(--menu-h));max-height:calc(100dvh - var(--menu-h));overflow-y:auto}`,
  `${P}.ms-aberto .ms-lista{display:flex}`,
  `${P} .ms-lista a{display:flex;align-items:center;min-height:48px;padding:0 4px;font-size:15px}`,
  `${P} .ms-lista a.ms-contorno{justify-content:center;margin:8px 0 0;padding:0 14px}`,
];

// z-index 1150; aberto no celular, 1160: a lista aberta fica acima dos botões fixos das páginas (1150,
// no mapa) e abaixo das gavetas e fundos escuros (1190 e acima), que se abrem com o menu fechado.
const MENU_CSS = `<style id="menu-site-css">
:root{--menu-h:70px}
@media (max-width:${CORTE}px){:root{--menu-h:60px}}
#menu-site,#menu-site *{all:revert;box-sizing:border-box}
#menu-site{position:sticky;top:0;z-index:1150;flex:none;display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:0 24px;min-height:var(--menu-h);margin:0;padding:0 max(16px,2.5vw);background:#161616;color:#fff;font:400 16px/1.2 'Josefin Sans',system-ui,sans-serif;text-align:left}
#menu-site.ms-aberto{z-index:1160}
#menu-site .ms-logo{flex:none;padding:8px 0;color:#fff;text-decoration:none;font-family:'Poiret One',cursive;font-size:17px;font-weight:400;letter-spacing:.16em;text-transform:uppercase;white-space:nowrap}
#menu-site .ms-abre{display:none}
#menu-site .ms-lista{display:flex;flex-wrap:wrap;align-items:center;justify-content:flex-end;gap:4px 18px;margin:0;padding:0}
#menu-site .ms-lista a{color:#fff;text-decoration:none;font-size:12.5px;letter-spacing:.06em;text-transform:uppercase;white-space:nowrap;padding:10px 0;cursor:pointer}
#menu-site .ms-lista a:hover,#menu-site .ms-lista a[aria-current]{color:#F7D77E}
#menu-site .ms-lista a.ms-contorno{padding:9px 13px;border:1px solid #C9A227;border-radius:4px;color:#F7D77E}
#menu-site .ms-lista a.ms-contorno:hover,#menu-site .ms-lista a.ms-contorno[aria-current]{background:#C9A227;color:#161616}
#menu-site a:focus-visible,#menu-site button:focus-visible{outline:2px solid #F7D77E;outline-offset:3px}
@media (min-width:${CORTE + 1}px) and (max-width:1519px){#menu-site{gap:0 20px;padding:0 max(16px,2vw)}#menu-site .ms-logo{font-size:15px;letter-spacing:.1em}#menu-site .ms-lista{gap:4px 13px}#menu-site .ms-lista a{font-size:12px;letter-spacing:.035em}#menu-site .ms-lista a.ms-contorno{padding:8px 10px}}
@media (max-width:${CORTE}px){
${compacto('#menu-site').join('\n')}
}
${compacto('#menu-site.ms-compacto').join('\n')}
@media (max-width:420px){#menu-site .ms-logo{font-size:15px;letter-spacing:.12em}}
@media (max-width:360px){#menu-site .ms-logo{font-size:13.5px;letter-spacing:.08em}}
@media (prefers-reduced-motion:no-preference){#menu-site .ms-lista a,#menu-site .ms-abre span{transition:color .2s,background-color .2s,transform .2s,opacity .2s}}
@media print{#menu-site{display:none}}
</style>`;

const ROTAS = ITENS.map((it, i) => it.rota ? '[/' + it.rota.replace(/\//g, '\\/') + '/,' + i + ']' : null).filter(Boolean).join(',');

// JS do bloco: aria-current pelo endereço; botão do celular (Esc, toque fora, item escolhido e tela
// alargada fecham; o foco volta ao botão); filtro da home por window.vmFiltro, lido do data-filtro-menu
// (o href ganha ?c= do atrib.js); rede de segurança: se os itens não cabem numa linha, modo celular.
const MENU_JS = `<script>
(function () {
  var h = document.querySelector('header#menu-site');
  var b = h && h.querySelector('.ms-abre'), l = h && h.querySelector('#ms-lista'), logo = h && h.querySelector('.ms-logo');
  if (!b || !l || !logo || h.getAttribute('data-ms')) return;
  h.setAttribute('data-ms', '1');
  var itens = l.getElementsByTagName('a');
  var mq = window.matchMedia ? window.matchMedia('(max-width:${CORTE}px)') : null;
  var rotas = [${ROTAS}];
  for (var i = 0; i < rotas.length; i++) if (rotas[i][0].test(location.pathname)) { itens[rotas[i][1]].setAttribute('aria-current', 'page'); break; }
  function estreita() { return mq ? mq.matches : window.innerWidth <= ${CORTE}; }
  function aberto() { return h.classList.contains('ms-aberto'); }
  function abrir() { h.classList.add('ms-aberto'); b.setAttribute('aria-expanded', 'true'); b.setAttribute('aria-label', 'Fechar menu'); }
  // foco: 0 = fica onde está, 1 = volta ao botão se estava no painel, 2 = volta ao botão
  function fechar(foco) {
    if (!aberto()) return;
    var dentro = l.contains(document.activeElement);
    h.classList.remove('ms-aberto'); b.setAttribute('aria-expanded', 'false'); b.setAttribute('aria-label', 'Abrir menu');
    if (foco === 2 || (foco === 1 && dentro)) b.focus({ preventScroll: true });
  }
  b.addEventListener('click', function () { if (aberto()) fechar(0); else abrir(); });
  document.addEventListener('keydown', function (e) { if ((e.key === 'Escape' || e.key === 'Esc') && aberto()) fechar(2); });
  document.addEventListener(window.PointerEvent ? 'pointerdown' : 'touchstart', function (e) { if (aberto() && !h.contains(e.target)) fechar(1); }, true);
  l.addEventListener('click', function (e) {
    var a = e.target.closest ? e.target.closest('a') : null;
    if (!a) return;
    var f = a.getAttribute('data-filtro-menu');
    if (f && typeof window.vmFiltro === 'function' && !e.defaultPrevented && !e.button && !e.ctrlKey && !e.metaKey && !e.shiftKey && !e.altKey) {
      e.preventDefault();
      window.vmFiltro(f);
    }
    fechar(1);
  });
  function ajustar() {
    if (!estreita()) {
      h.classList.remove('ms-compacto');
      var p = itens[0], u = itens[itens.length - 1];
      if (h.scrollWidth > h.clientWidth + 1 || l.offsetTop >= logo.offsetTop + logo.offsetHeight || Math.abs(p.offsetTop - u.offsetTop) > 8) h.classList.add('ms-compacto');
    }
    if (!estreita() && !h.classList.contains('ms-compacto')) fechar(0);
  }
  var largura = -1;
  function talvez() { var x = document.documentElement.clientWidth; if (x !== largura) { largura = x; ajustar(); } }
  talvez();
  if (window.ResizeObserver) new ResizeObserver(talvez).observe(document.documentElement); else window.addEventListener('resize', talvez);
  if (mq && mq.addEventListener) mq.addEventListener('change', ajustar);
  if (document.fonts) { if (document.fonts.ready) document.fonts.ready.then(ajustar); if (document.fonts.addEventListener) document.fonts.addEventListener('loadingdone', ajustar); }
  window.addEventListener('load', ajustar);
})();
</script>`;

const A = '<!--GEN:menu-->', B = '<!--/GEN:menu-->';
const MENU_HTML = A + `
<header id="menu-site">
<a class="ms-logo" href="/">Imobiliária Viv'América</a>
<button class="ms-abre" type="button" aria-expanded="false" aria-controls="ms-lista" aria-label="Abrir menu"><span></span><span></span><span></span></button>
<nav id="ms-lista" class="ms-lista" aria-label="Menu principal">
${ITENS.map(it => '<a' + (it.contorno ? ' class="ms-contorno"' : '') + ' href="' + it.href + '"' + (it.attr || '') + '>' + it.texto + '</a>').join('\n')}
</nav>
</header>
${MENU_JS}
<script src="/corretor.js?v=20261015" defer></script>
` + B;

// ─── páginas ───
const RAIZ_SITE = __dirname;
const FORA = /^(ferramentas|qrcode|seo|node_modules|\.git|\.claude|folder|treinamento)(\/|$)/;
const IMPRESSOS = ['folder-frente.html', 'folder-verso.html', 'folheto-lancamentos.html'];
function listarAlvos(raiz) {
  const out = [];
  (function andar(d) {
    for (const n of fs.readdirSync(d, { withFileTypes: true })) {
      const p = path.join(d, n.name);
      const rel = path.relative(raiz, p).split(path.sep).join('/');
      if (n.isDirectory()) { if (!FORA.test(rel)) andar(p); }
      else if (n.name === 'index.html') out.push(rel);
    }
  })(raiz);
  if (fs.existsSync(path.join(raiz, '404.html'))) out.push('404.html');
  return out.sort();
}

const RE_BLOCO = /<!--GEN:menu-->[\s\S]*?<!--\/GEN:menu-->/g;
// o estilo do menu; aceita também o nome antigo (<style id="menu-site">), que é trocado pelo novo
const RE_ESTILO = /<style id="menu-site(?:-css)?">[\s\S]*?<\/style>/g;
const RE_ESTILO_NAV = /[ \t]*<style id="nav-site">[\s\S]*?<\/style>[ \t]*\r?\n?/g;
const RE_NAV_SITE = /[ \t]*<nav\b[^>]*\bclass="(?:[^"]*\s)?nav-site(?:\s[^"]*)?"[^>]*>[\s\S]*?<\/nav>[ \t]*\r?\n?/g;
const RE_COMENTARIO_CAB = /[ \t]*<!--[\s─═-]*(?:HEADER|CABE[ÇC]ALHO)[\s─═-]*-->[ \t]*\r?\n?$/i;
const conta = (h, re) => (h.match(re) || []).length;
// o texto fora do bloco (o bloco vira espaços, para as posições continuarem valendo)
const foraDoBloco = h => h.replace(RE_BLOCO, m => ' '.repeat(m.length));

function aplicarMenu(html, rel) {
  let h = html;
  if (conta(h, /<\/head>/g) !== 1) throw new Error(rel + ': a página precisa de exatamente um </head>');
  if (conta(h, /<body\b[^>]*>/g) !== 1) throw new Error(rel + ': a página precisa de exatamente um <body>');
  if (conta(h, RE_BLOCO) > 1) throw new Error(rel + ': mais de um bloco GEN:menu');
  // (a) e (b) cabeçalho antigo: o 1º <header> sem atributo fora do bloco
  const f = foraDoBloco(h);
  const ini = f.search(/<header>/);
  if (ini >= 0) {
    const fim = f.indexOf('</header>', ini);
    if (fim < 0) throw new Error(rel + ': <header> sem </header>');
    const cab = h.slice(ini, fim + 9);
    if (/<h1\b/i.test(cab)) throw new Error(rel + ': o cabeçalho antigo tem o <h1> dentro; tire o <h1> do <header> à mão antes');
    let a = ini, z = fim + 9;
    while (a > 0 && (h[a - 1] === ' ' || h[a - 1] === '\t')) a--;   // a indentação da linha
    const resto = h.slice(z).match(/^[ \t]*\r?\n/);
    if (resto) z += resto[0].length;
    const com = h.slice(0, a).match(RE_COMENTARIO_CAB);              // <!-- HEADER --> logo acima
    if (com) a -= com[0].length;
    h = h.slice(0, a) + h.slice(z);
  }
  h = h.replace(RE_NAV_SITE, '');
  h = h.replace(RE_ESTILO_NAV, '');
  // (c) estilo
  if (conta(h, RE_ESTILO) > 1) throw new Error(rel + ': mais de um <style id="menu-site-css"> (ou do nome antigo menu-site)');
  if (h.match(RE_ESTILO)) h = h.replace(RE_ESTILO, () => MENU_CSS);
  else h = h.replace('</head>', () => '  ' + MENU_CSS + '\n</head>');
  // (d) bloco
  if (h.match(RE_BLOCO)) h = h.replace(RE_BLOCO, () => MENU_HTML);
  else h = h.replace(/<body\b[^>]*>/, m => m + '\n' + MENU_HTML);
  return h;
}

// Problemas de uma página (vazio = ok). Usada pelo --guarda e pelo identidade.js.
function conferirPagina(h) {
  const p = [];
  const blocos = h.match(RE_BLOCO) || [];
  if (blocos.length !== 1) p.push(blocos.length + ' bloco(s) GEN:menu (esperado 1)');
  else if (blocos[0] !== MENU_HTML) p.push(/^<!--GEN:menu-->\s*<!--\/GEN:menu-->$/.test(blocos[0]) ? 'GEN:menu vazio' : 'GEN:menu diferente do gera-menu.js');
  else if (!/<body\b[^>]*>\s*<!--GEN:menu-->/.test(h)) p.push('GEN:menu fora do lugar (vai logo depois do <body>)');
  const estilos = h.match(RE_ESTILO) || [];
  if (estilos.length !== 1) p.push(estilos.length + ' <style id="menu-site-css"> (esperado 1)');
  else if (estilos[0] !== MENU_CSS) p.push('<style id="menu-site-css"> diferente do gera-menu.js');
  else if (h.indexOf(MENU_CSS) > h.indexOf('</head>')) p.push('<style id="menu-site-css"> fora do <head>');
  // id repetido: o script do menu pega o PRIMEIRO elemento com o id e o botão do celular deixa de abrir
  for (const id of ['menu-site', 'ms-lista']) {
    const n = conta(h, new RegExp('\\sid=["\']?' + id + '(?=["\'\\s>])', 'g'));
    if (n !== 1) p.push(n + ' elemento(s) com id="' + id + '" (esperado 1)');
  }
  const f = foraDoBloco(h);
  if (/<header\b/i.test(f)) p.push('<header> fora do bloco');
  if (/<nav\b[^>]*\bclass="(?:[^"]*\s)?nav-site(?:\s[^"]*)?"/.test(f)) p.push('nav.nav-site fora do bloco');
  if (/<style id="nav-site">/.test(h)) p.push('<style id="nav-site">');
  return p;
}
function guardaMenu(raiz) {
  raiz = raiz || RAIZ_SITE;
  const erros = [];
  for (const rel of listarAlvos(raiz)) {
    const p = conferirPagina(fs.readFileSync(path.join(raiz, rel), 'utf8'));
    if (p.length) erros.push(rel + ': ' + p.join('; '));
  }
  for (const rel of IMPRESSOS) {
    const f = path.join(raiz, rel);
    if (fs.existsSync(f) && /<!--GEN:menu-->|id="menu-site(?:-css)?"/.test(fs.readFileSync(f, 'utf8'))) erros.push(rel + ': impresso com menu (não pode)');
  }
  return erros;
}

function main() {
  const args = process.argv.slice(2);
  const valor = nome => { const i = args.indexOf(nome); return i >= 0 ? args[i + 1] : null; };
  const raiz = path.resolve(valor('--raiz') || RAIZ_SITE);
  const ensaio = args.includes('--ensaio');
  if (args.includes('--guarda')) {
    const erros = guardaMenu(raiz);
    console.log('gera-menu --guarda: ' + (erros.length ? erros.length + ' página(s) fora do padrão' : 'todas as páginas com o menu'));
    if (erros.length) { console.log('  ' + erros.join('\n  ')); process.exit(1); }
    return;
  }
  let alvos = listarAlvos(raiz);
  const so = valor('--so');
  if (so) {
    const pedidas = so.split(',').map(s => s.trim().replace(/\\/g, '/')).filter(Boolean);
    const fora = pedidas.filter(p => !alvos.includes(p));
    if (fora.length) { console.error('gera-menu: fora da lista de páginas do site: ' + fora.join(', ')); process.exit(1); }
    alvos = pedidas;
  }
  const linhas = [], erros = [], gravar = [];
  for (const rel of alvos) {
    const arq = path.join(raiz, rel);
    const antes = fs.readFileSync(arq, 'utf8');
    let depois;
    try { depois = aplicarMenu(antes, rel); } catch (e) { erros.push(e.message); continue; }
    if (depois === antes) continue;
    gravar.push([arq, depois]);
    const o = [];
    const fa = foraDoBloco(antes);
    if (/<header>/.test(fa)) o.push('sai o cabeçalho antigo');
    if (RE_NAV_SITE.test(fa)) o.push('sai nav.nav-site');
    RE_NAV_SITE.lastIndex = 0;
    if (/<style id="nav-site">/.test(antes)) o.push('sai <style id="nav-site">');
    o.push(conta(antes, RE_BLOCO) ? 'bloco atualizado' : 'bloco novo');
    o.push(conta(antes, RE_ESTILO) ? 'estilo atualizado' : 'estilo novo');
    const d = Buffer.byteLength(depois) - Buffer.byteLength(antes);
    linhas.push('  ' + rel + '  ' + Buffer.byteLength(antes) + ' -> ' + Buffer.byteLength(depois) + ' bytes (' + (d >= 0 ? '+' : '') + d + ')  [' + o.join(', ') + ']');
  }
  // com erro em qualquer página, nada é gravado
  const grava = !ensaio && !erros.length;
  if (grava) for (const [arq, depois] of gravar) fs.writeFileSync(arq, depois, 'utf8');
  const parado = !ensaio && erros.length ? ' (PARADO por erro, nada gravado)' : '';
  console.log('gera-menu' + (ensaio ? ' (ENSAIO, nada gravado)' : '') + parado + ': ' + alvos.length + ' página(s), ' + gravar.length + ' ' +
    (grava ? 'alteradas' : 'mudariam') + ', ' + (alvos.length - gravar.length - erros.length) + ' já estavam' +
    (erros.length ? ', ' + erros.length + ' com erro' : '') + (raiz !== RAIZ_SITE ? ' · raiz ' + raiz : ''));
  if (linhas.length) console.log(linhas.join('\n'));
  if (erros.length) { console.error('ERROS:\n  ' + erros.join('\n  ')); process.exit(1); }
}

if (require.main === module) main();

module.exports = { MENU_CSS, MENU_HTML, ITENS, CORTE, aplicarMenu, conferirPagina, guardaMenu, listarAlvos };
