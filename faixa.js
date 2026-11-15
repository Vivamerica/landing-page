/* faixa.js - faixa da campanha Alpha Week Alphaville (15 a 30/11/2026). Criado em 13/11/2026.
   Quem carrega: o gancho no fim do /corretor.js (script.async), que todas as paginas ja' trazem. Assim a faixa
   nao depende de editar o HTML das paginas do Alphaville, que sao regeradas por outro processo.

   O que faz, pelo caminho da pagina (location.pathname) e pela hora de Brasilia:
   - ate' 30/11/2026 23:59:59 (Brasilia, UTC-3); depois disso nao mostra nada, em pagina nenhuma.
   - paginas que PARTICIPAM (/alphaville-indaiatuba/ e a pagina do Parque Alphaville Alvorada, caminho com
     "alphaville" e "alvorada"): faixa + secao id="alpha-week" com as regras oficiais, inserida logo depois do hero
     (se a pagina ainda nao tiver um elemento com esse id). Com #alpha-week na URL, rola ate' a secao.
     No Alphaville Indaiatuba o desconto e' 20% FIXO em qualquer lote residencial (arte da Alphaville para ele,
     13/11/2026); no Alvorada e nas paginas gerais fica o "ate' 20%" do folder nacional dos 11 empreendimentos.
   - /alphaville/ e /blog/o-que-e-alphaville/: faixa geral, com link para /alphaville-indaiatuba/#alpha-week.
   - /casas-alphaville-dom-pedro-0-campinas/: faixa dizendo que as casas do Dom Pedro 0 NAO participam.
   - /mapa-lotes-indaiatuba/: faixa geral so' enquanto o endereco tiver "alphaville" depois do #.
   - qualquer outra pagina: nada.
   A faixa entra como primeiro elemento do <body>, no fluxo (nao fica fixa por cima de nada); o botao de fechar
   vale para a sessao (sessionStorage). Teste local: ?faixa-data=AAAA-MM-DD (ou AAAA-MM-DDTHH:MM, hora de
   Brasilia), aceito so' em localhost/127.0.0.1, como o LOCAL do corretor.js.
   ES5, sem biblioteca; os textos usam \u para nao depender da codificacao com que o navegador le o arquivo. */
(function () {
  'use strict';
  if (window.__vmFaixa) return;
  window.__vmFaixa = true;

  // 30/11/2026 23:59:59.999 em Brasilia = 01/12/2026 02:59:59.999 UTC (Brasilia nao tem horario de verao desde 2019)
  var FIM = Date.UTC(2026, 11, 1, 2, 59, 59, 999);
  var CHAVE = 'vm-faixa-alphaweek-fechada';
  var ID_FAIXA = 'vm-faixa';
  var ID_SECAO = 'alpha-week';
  var DESTINO = '/alphaville-indaiatuba/#alpha-week';
  var REGULAMENTO = 'https://alphaville.com.br/regulamento/alphaville/';
  // so' se a pagina nao tiver link de WhatsApp nenhum: e' o numero de todos os 575 links wa.me do site (13/11/2026)
  var WA_SITE = '5519989769457';

  var HOST = String(location.hostname || '').toLowerCase();
  var LOCAL = HOST === '' || HOST === 'localhost' || HOST === '127.0.0.1' || HOST === '[::1]' || HOST === '::1' || /\.localhost$/.test(HOST);

  var T_FORTE = 'Alpha Week Alphaville';
  var TEXTOS = {
    participa: {
      resto: ', 15 a 30/11/2026: at\u00E9 20% de desconto \u00E0 vista para os 5 primeiros lotes residenciais vendidos neste empreendimento.',
      link: 'Ver condi\u00E7\u00F5es',
      href: '#' + ID_SECAO
    },
    // Alphaville Indaiatuba: a arte da Alphaville para ele diz "5 lotes (qualquer lote) com 20% de desconto para
    // pagamento a' vista"; o "ate' 20%" do folder nacional fica para as outras paginas
    indaiatuba: {
      resto: ', 15 a 30/11/2026: 20% de desconto \u00E0 vista para os 5 primeiros lotes residenciais vendidos neste empreendimento.',
      link: 'Ver condi\u00E7\u00F5es',
      href: '#' + ID_SECAO
    },
    geral: {
      resto: ', 15 a 30/11/2026: at\u00E9 20% de desconto \u00E0 vista em lotes residenciais selecionados de 11 empreendimentos, entre eles o Alphaville Indaiatuba.',
      link: 'Ver condi\u00E7\u00F5es',
      href: DESTINO
    },
    dompedro: {
      resto: ' (15 a 30/11/2026): at\u00E9 20% de desconto \u00E0 vista em lotes residenciais selecionados. As casas do Dom Pedro 0 n\u00E3o participam.',
      link: 'Ver lotes do Alphaville Indaiatuba',
      href: DESTINO
    }
  };

  var CSS = [
    '#vm-faixa,#vm-faixa :where(*),#vm-faixa :where(*)::before,#vm-faixa :where(*)::after{all:revert;box-sizing:border-box}',
    '#vm-faixa{display:block;flex:none;position:relative;margin:0;padding:0;background:#161616;color:#fff;border-bottom:2px solid #F7D77E;font-family:\'Josefin Sans\',system-ui,-apple-system,\'Segoe UI\',sans-serif;font-size:14px;font-weight:400;font-style:normal;line-height:1.45;letter-spacing:normal;text-transform:none;text-align:left}',
    '#vm-faixa .vm-faixa-in{display:flex;align-items:center;gap:8px;max-width:1200px;margin:0 auto;padding:4px 8px 4px 16px}',
    '#vm-faixa .vm-faixa-txt{flex:1 1 auto;min-width:0;margin:0;padding:5px 0;text-align:center}',
    '#vm-faixa strong{font-weight:700;color:#F7D77E}',
    '#vm-faixa a{color:#F7D77E;font-weight:600;text-decoration:underline;text-underline-offset:2px;white-space:nowrap;border-radius:2px}',
    '#vm-faixa a:hover{color:#fff}',
    '#vm-faixa a:focus-visible{outline:2px solid #F7D77E;outline-offset:2px}',
    '#vm-faixa .vm-faixa-fechar{position:relative;flex:none;width:36px;height:36px;margin:0;padding:0;border:0;border-radius:4px;background:transparent;color:#fff;cursor:pointer}',
    '#vm-faixa .vm-faixa-fechar::before,#vm-faixa .vm-faixa-fechar::after{content:\'\';position:absolute;left:50%;top:50%;width:16px;height:2px;margin:-1px 0 0 -8px;background:currentColor;border-radius:2px;transform:rotate(45deg)}',
    '#vm-faixa .vm-faixa-fechar::after{transform:rotate(-45deg)}',
    '#vm-faixa .vm-faixa-fechar:hover{color:#F7D77E}',
    '#vm-faixa .vm-faixa-fechar:focus-visible{outline:2px solid #F7D77E;outline-offset:-2px}',
    '@media (max-width:600px){#vm-faixa{font-size:13px;line-height:1.4}#vm-faixa .vm-faixa-in{align-items:flex-start;padding:2px 4px 2px 16px}#vm-faixa .vm-faixa-txt{padding:9px 0 8px;text-align:left}#vm-faixa .vm-faixa-fechar{width:40px;height:40px}}',
    '@media (prefers-reduced-motion:no-preference){#vm-faixa a,#vm-faixa .vm-faixa-fechar{transition:color .15s}}',
    '@media print{#vm-faixa{display:none}}',
    // secao com as regras (so' nas paginas que participam e so' quando a pagina nao tem a sua propria)
    '#alpha-week.vm-aw,#alpha-week.vm-aw :where(*),#alpha-week.vm-aw :where(*)::before,#alpha-week.vm-aw :where(*)::after{all:revert;box-sizing:border-box}',
    '#alpha-week.vm-aw{display:block;margin:0;padding:40px 0;background:#F7F5F0;color:#161616;border-top:3px solid #C9A227;border-bottom:1px solid #E6E1D6;font-family:\'Josefin Sans\',system-ui,-apple-system,\'Segoe UI\',sans-serif;font-size:16px;font-weight:400;font-style:normal;line-height:1.65;letter-spacing:normal;text-transform:none;text-align:left;scroll-margin-top:calc(var(--menu-h, 70px) + 12px)}',
    '#alpha-week.vm-aw .vm-aw-in{display:block;max-width:1120px;margin:0 auto;padding:0 5%}',
    '#alpha-week.vm-aw .vm-aw-rotulo{display:block;margin:0;font-size:12px;font-weight:700;letter-spacing:.2em;text-transform:uppercase;color:#6E5300}',
    '#alpha-week.vm-aw h2{display:block;margin:8px 0 16px;font-family:\'Poiret One\',\'Josefin Sans\',system-ui,sans-serif;font-size:clamp(26px,3.2vw,40px);font-weight:400;line-height:1.2;color:#161616;text-wrap:balance}',
    '#alpha-week.vm-aw p{display:block;max-width:60rem;margin:0 0 16px}',
    '#alpha-week.vm-aw b{font-weight:700}',
    '#alpha-week.vm-aw ul{display:block;max-width:60rem;margin:0 0 24px;padding:0 0 0 1.2em;list-style:disc outside}',
    '#alpha-week.vm-aw li{display:list-item;margin:0 0 8px}',
    '#alpha-week.vm-aw li::marker{color:#8A6D1F}',
    '#alpha-week.vm-aw .vm-aw-btn{display:inline-block;padding:14px 26px;background:#C9A227;color:#161616;font-size:14px;font-weight:700;line-height:1.3;letter-spacing:.08em;text-transform:uppercase;text-decoration:none;border-radius:4px;cursor:pointer}',
    '#alpha-week.vm-aw .vm-aw-btn:hover{background:#F7D77E}',
    '#alpha-week.vm-aw a:focus-visible{outline:3px solid #161616;outline-offset:2px}',
    '#alpha-week.vm-aw .vm-aw-nota{margin:18px 0 0;font-size:14px;line-height:1.55;color:#5C5C5C}',
    '#alpha-week.vm-aw .vm-aw-nota a{color:#161616;text-decoration:underline;overflow-wrap:anywhere}',
    '@media (max-width:600px){#alpha-week.vm-aw{padding:32px 0}#alpha-week.vm-aw .vm-aw-btn{display:block;text-align:center}}'
  ].join('\n');

  function agora() {
    if (LOCAL) {
      var m = /[?&]faixa-data=(\d{4})-(\d{2})-(\d{2})(?:T(\d{2}):(\d{2}))?(?:&|$)/.exec(String(location.search || ''));
      // hora de Brasilia = UTC-3; sem hora, meio-dia
      if (m) return Date.UTC(+m[1], +m[2] - 1, +m[3], (m[4] ? +m[4] : 12) + 3, m[5] ? +m[5] : 0, 0, 0);
    }
    return new Date().getTime();
  }

  function caminho() {
    var p = String(location.pathname || '/').toLowerCase();
    try { p = decodeURIComponent(p); } catch (e) {}
    p = p.replace(/index\.html?$/, '');
    if (p.charAt(p.length - 1) !== '/') p += '/';
    return p;
  }

  function tipoDaPagina(p) {
    if (p === '/casas-alphaville-dom-pedro-0-campinas/') return 'dompedro';
    if (p === '/alphaville/' || p === '/blog/o-que-e-alphaville/') return 'geral';
    if (p === '/mapa-lotes-indaiatuba/') return 'mapa';
    // so' a raiz da pagina do empreendimento (um nivel): um 404 em /alphaville-indaiatuba/xyz/ nao ganha secao.
    // "alvorada" so' junto com "alphaville": ha' um bairro Alvorada em Indaiatuba que NAO e' da Alphaville.
    var m = /^\/([a-z0-9-]+)\/$/.exec(p);
    if (m && (m[1].indexOf('alphaville-indaiatuba') >= 0 || (m[1].indexOf('alphaville') >= 0 && m[1].indexOf('alvorada') >= 0))) return 'participa';
    return '';
  }

  function nomeDoEmpreendimento(p) {
    return p.indexOf('alvorada') >= 0 ? 'Parque Alphaville Alvorada' : 'Alphaville Indaiatuba';
  }

  // 20% fixo so' no Alphaville Indaiatuba (arte especifica dele); nos demais, "ate' 20%"
  function descontoFixo(nome, p) {
    return nome === 'Alphaville Indaiatuba' || String(p || '').indexOf('alphaville-indaiatuba') >= 0;
  }

  function fechada() {
    try { return window.sessionStorage.getItem(CHAVE) === '1'; } catch (e) { return false; }
  }

  function gravaFechada() {
    try { window.sessionStorage.setItem(CHAVE, '1'); } catch (e) {}
  }

  function focar(el) {
    if (!el) return;
    try { el.focus({ preventScroll: true }); } catch (e) { try { el.focus(); } catch (e2) {} }
  }

  function el(tag, atributos, filhos) {
    var n = document.createElement(tag);
    var k, i;
    if (atributos) for (k in atributos) if (Object.prototype.hasOwnProperty.call(atributos, k)) n.setAttribute(k, atributos[k]);
    if (filhos) {
      for (i = 0; i < filhos.length; i++) {
        if (filhos[i] == null) continue;
        n.appendChild(typeof filhos[i] === 'string' ? document.createTextNode(filhos[i]) : filhos[i]);
      }
    }
    return n;
  }

  function injetaCss() {
    if (document.getElementById('vm-faixa-css')) return;
    var s = document.createElement('style');
    s.id = 'vm-faixa-css';
    s.appendChild(document.createTextNode(CSS));
    (document.head || document.documentElement).appendChild(s);
  }

  // numero do WhatsApp: o mesmo que a pagina ja' usa (botao flutuante primeiro, depois qualquer link wa.me)
  function numeroWhats() {
    var candidatos = [document.querySelector('a.wa-float[href]'), document.querySelector('a[href*="wa.me/"]')];
    for (var i = 0; i < candidatos.length; i++) {
      var a = candidatos[i];
      var m = a && /wa\.me\/(\d{10,15})/.exec(a.getAttribute('href') || '');
      if (m) return m[1];
    }
    return WA_SITE;
  }

  function tiraFaixa() {
    var f = document.getElementById(ID_FAIXA);
    if (f && f.parentNode) f.parentNode.removeChild(f);
  }

  function mostraFaixa(t) {
    if (!t || fechada() || !document.body) return;
    if (document.getElementById(ID_FAIXA)) return;
    var botao = el('button', { type: 'button', 'class': 'vm-faixa-fechar', 'aria-label': 'Fechar aviso da Alpha Week' });
    var faixa = el('div', { id: ID_FAIXA, role: 'region', 'aria-label': 'Campanha Alpha Week Alphaville' }, [
      el('div', { 'class': 'vm-faixa-in' }, [
        el('p', { 'class': 'vm-faixa-txt' }, [
          el('strong', null, [T_FORTE]), t.resto + ' ',
          el('a', { href: t.href }, [t.link])
        ]),
        botao
      ])
    ]);
    botao.addEventListener('click', function () {
      try {
        gravaFechada();
        var tinhaFoco = faixa.contains(document.activeElement);
        tiraFaixa();
        if (tinhaFoco) focar(document.querySelector('#menu-site .ms-logo, a[href], button'));
      } catch (e) {}
    });
    document.body.insertBefore(faixa, document.body.firstChild);
  }

  // onde entra a secao: logo depois do hero; sem hero, no comeco do <main>; sem main, depois do primeiro
  // <header> que nao seja o menu do site; por ultimo, logo depois do menu
  function pontoDaSecao() {
    var menu = document.getElementById('menu-site');
    var hero = document.querySelector('section.hero, .hero, #hero');
    if (hero && hero.parentNode && !(menu && menu.contains(hero))) return [hero.parentNode, hero.nextSibling];
    var main = document.querySelector('main');
    if (main) return [main, main.firstChild];
    var hs = document.getElementsByTagName('header');
    for (var i = 0; i < hs.length; i++) {
      if (hs[i] !== menu && hs[i].parentNode) return [hs[i].parentNode, hs[i].nextSibling];
    }
    if (menu && menu.parentNode) return [menu.parentNode, menu.nextSibling];
    return [document.body, document.body.firstChild];
  }

  function garanteSecao(nome, fixo) {
    var existente = document.getElementById(ID_SECAO);
    if (existente) return existente;
    var wa = 'https://wa.me/' + numeroWhats() + '?text=' +
      encodeURIComponent('Ol\u00E1! Quero consultar as condi\u00E7\u00F5es \u00E0 vista da Alpha Week no ' + nome + '.');
    var secao = el('section', { id: ID_SECAO, 'class': 'vm-aw', 'aria-labelledby': 'alpha-week-h2' }, [
      el('div', { 'class': 'vm-aw-in' }, [
        el('p', { 'class': 'vm-aw-rotulo' }, ['Campanha da Alphaville \u00B7 15 a 30/11/2026']),
        el('h2', { id: 'alpha-week-h2' }, [fixo ?
          'Alpha Week Alphaville, de 15 a 30/11/2026: 20% de desconto \u00E0 vista nos 5 primeiros lotes residenciais vendidos' :
          'Alpha Week Alphaville, de 15 a 30/11/2026: at\u00E9 20% de desconto \u00E0 vista em lotes selecionados']),
        fixo ? el('p', null, [
          'Na Alpha Week da Alphaville, o ' + nome + ' tem desconto de ',
          el('b', null, ['20% sobre o valor total']),
          ' em qualquer lote residencial, com pagamento integral \u00E0 vista, para os 5 primeiros lotes vendidos. As regras, conforme a arte e o folder oficiais da Alphaville:'
        ]) : el('p', null, [
          'Na Alpha Week da Alphaville, lotes residenciais selecionados de 11 empreendimentos t\u00EAm desconto de ',
          el('b', null, ['at\u00E9 20% sobre o valor total']),
          ', com pagamento integral \u00E0 vista. O ' + nome + ' est\u00E1 entre eles. As regras, conforme o folder oficial da campanha:'
        ]),
        el('ul', null, [
          el('li', null, [fixo ?
            'Desconto de 20% sobre o valor total, em qualquer lote residencial do ' + nome + ', com pagamento integral \u00E0 vista.' :
            'Desconto de at\u00E9 20% sobre o valor total; o percentual depende da unidade, da disponibilidade e da confirma\u00E7\u00E3o de elegibilidade pela Alphaville.']),
          // no Indaiatuba a arte diz "qualquer lote": falar em "5 unidades participantes" sugeriria 5 lotes ja' escolhidos
          el('li', null, ['Vale para os 5 primeiros lotes vendidos no ' + nome + ' durante a campanha' +
            (fixo ? '.' : ' (s\u00E3o as 5 unidades participantes do folder).')]),
          el('li', null, ['\u00C9 preciso formalizar o Compromisso de Compra e Venda at\u00E9 30/11/2026, com pagamento integral \u00E0 vista, em parcela \u00FAnica, conforme as condi\u00E7\u00F5es contratuais.']),
          // o "desconto por prazo" so' existe na ficha do Alphaville Indaiatuba; nas outras fica so' a regra do folder
          el('li', null, ['N\u00E3o se soma a outras condi\u00E7\u00F5es comerciais especiais' +
            (nome === 'Alphaville Indaiatuba' ? ', inclusive ao desconto por prazo da condi\u00E7\u00E3o normal da tabela.' : '.')]),
          el('li', null, ['Vale de 15 a 30/11/2026 ou at\u00E9 serem vendidos os 5 primeiros lotes, o que ocorrer primeiro.'])
        ]),
        el('p', null, [
          el('a', { 'class': 'vm-aw-btn', href: wa, target: '_blank', rel: 'noopener' }, ['Consultar condi\u00E7\u00F5es \u00E0 vista no WhatsApp'])
        ]),
        el('p', { 'class': 'vm-aw-nota' }, [
          (fixo ? 'Fonte: arte do ' + nome + ' e folder oficial da campanha Alpha Week da Alphaville, recebidos em 13/11/2026.' :
            'Fonte: folder oficial da campanha Alpha Week da Alphaville, recebido em 13/11/2026.') +
          ' Regulamento completo no site oficial da Alphaville: ',
          el('a', { href: REGULAMENTO, target: '_blank', rel: 'noopener' }, ['alphaville.com.br/regulamento/alphaville']),
          '.'
        ])
      ])
    ]);
    var ponto = pontoDaSecao();
    ponto[0].insertBefore(secao, ponto[1]);
    return secao;
  }

  // a secao entra depois do carregamento, entao o navegador pode nao ter rolado ate' o #alpha-week sozinho
  function rolaParaSecao(secao, mexeu) {
    if (!secao || mexeu() || String(location.hash || '').toLowerCase() !== '#' + ID_SECAO) return;
    try { secao.scrollIntoView({ block: 'start', behavior: 'auto' }); } catch (e) { try { secao.scrollIntoView(true); } catch (e2) {} }
  }

  function iniciaParticipa(p) {
    var mexido = false;
    function marca() { mexido = true; }
    function mexeu() { return mexido; }
    var nome = nomeDoEmpreendimento(p);
    var fixo = descontoFixo(nome, p);
    var secao = garanteSecao(nome, fixo);
    mostraFaixa(fixo ? TEXTOS.indaiatuba : TEXTOS.participa);
    rolaParaSecao(secao, mexeu);
    if (document.readyState !== 'complete') {
      var tipos = ['wheel', 'touchstart', 'keydown', 'mousedown'];
      for (var i = 0; i < tipos.length; i++) window.addEventListener(tipos[i], marca, { passive: true, capture: true });
      window.addEventListener('load', function () {
        try { rolaParaSecao(document.getElementById(ID_SECAO), mexeu); } catch (e) {}
      });
    }
  }

  // mapa: a faixa acompanha o #. A lista do mapa troca o # por history.replaceState, que nao dispara
  // hashchange; por isso tambem se confere logo depois de cada clique.
  function iniciaMapa() {
    function confere() {
      try {
        if (agora() > FIM) { tiraFaixa(); return; }
        if (/alphaville/i.test(String(location.hash || ''))) mostraFaixa(TEXTOS.geral);
        else tiraFaixa();
      } catch (e) {}
    }
    window.addEventListener('hashchange', confere);
    window.addEventListener('popstate', confere);
    document.addEventListener('click', function () { setTimeout(confere, 0); });
    confere();
  }

  function inicia() {
    try {
      if (!document.body || agora() > FIM) return;
      var p = caminho();
      var tipo = tipoDaPagina(p);
      if (!tipo) return;
      injetaCss();
      if (tipo === 'participa') iniciaParticipa(p);
      else if (tipo === 'mapa') iniciaMapa();
      else mostraFaixa(TEXTOS[tipo]);
    } catch (e) {}
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', inicia);
  else inicia();
})();
