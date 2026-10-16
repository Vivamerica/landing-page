(function () {
  'use strict';
  if (window.__vmCorretor) return;
  window.__vmCorretor = true;

  var DESTINO = 'https://imoveisvivamerica.com.br/site/corretor/candidatura';
  var PAGINA = '/sou-corretor/';
  var LIMITE_MS = 40000;
  var RE_CODIGO = /^[A-Z2-9]{6}$/;
  var RE_PAGINA = /^\/[a-z0-9\-\/]{0,120}$/;
  var RE_CRECI = /^\d{3,7}-?[A-Z]?$/;
  var T_TITULO = 'Fa\u00E7a parte do nosso time';
  var T_CARREGANDO = 'Carregando o formul\u00E1rio\u2026';
  var T_ENVIANDO = 'Enviando\u2026';
  var T_FECHAR = 'Fechar';

  var HOST = String(location.hostname || '').toLowerCase();
  var LOCAL = HOST === '' || HOST === 'localhost' || HOST === '127.0.0.1' || HOST === '[::1]' || HOST === '::1' || /\.localhost$/.test(HOST);
  var SIMULAR_OK = LOCAL && /[?&]corretor=simular-ok(?:&|#|$)/.test(String(location.search || ''));
  var TEM_DIALOG = typeof window.HTMLDialogElement === 'function' &&
    typeof document.createElement('dialog').showModal === 'function';
  var TEM_BUSCA = typeof window.fetch === 'function' && typeof window.DOMParser === 'function';

  var janela = null;
  var montada = false;
  var abridor = null;
  var inicioJanela = 0;
  var modelo = null;
  var apertouFundo = false;

  var CSS = [
    '#ms-corretor,#ms-corretor :where(*),#ms-corretor :where(*)::before,#ms-corretor :where(*)::after{all:revert;box-sizing:border-box}',
    'dialog#ms-corretor{width:calc(100% - 32px);max-width:640px;max-height:calc(100% - 48px);padding:0;border:0;border-radius:10px;background:#fff;color:#161616;box-shadow:0 24px 64px rgba(0,0,0,.4);overflow:hidden;font-family:\'Josefin Sans\',system-ui,-apple-system,sans-serif;font-size:16px;font-weight:400;font-style:normal;line-height:1.5;letter-spacing:normal;text-transform:none;text-align:left}',
    'dialog#ms-corretor:not([open]){display:none}',
    'dialog#ms-corretor[open]{display:flex;flex-direction:column}',
    'dialog#ms-corretor::backdrop{background:rgba(22,22,22,.72)}',
    '#ms-corretor [hidden]{display:none!important}',
    '#ms-corretor .fc-janela-topo{display:flex;flex:none;align-items:center;justify-content:space-between;gap:12px;min-height:60px;margin:0;padding:8px 8px 8px 20px;background:#161616;color:#fff}',
    '#ms-corretor .fc-janela-titulo{margin:0;padding:0;font-family:\'Poiret One\',\'Josefin Sans\',system-ui,sans-serif;font-size:20px;font-weight:400;line-height:1.25;letter-spacing:.1em;text-transform:uppercase;color:#F7D77E}',
    '#ms-corretor .fc-janela-titulo:focus{outline:none}',
    '#ms-corretor .fc-janela-fechar{position:relative;flex:none;width:44px;height:44px;margin:0;padding:0;border:0;border-radius:4px;background:transparent;color:#fff;cursor:pointer}',
    '#ms-corretor .fc-janela-fechar::before,#ms-corretor .fc-janela-fechar::after{content:\'\';position:absolute;left:50%;top:50%;width:22px;height:2px;margin:-1px 0 0 -11px;background:currentColor;border-radius:2px;transform:rotate(45deg)}',
    '#ms-corretor .fc-janela-fechar::after{transform:rotate(-45deg)}',
    '#ms-corretor .fc-janela-fechar:hover{color:#F7D77E}',
    '#ms-corretor .fc-janela-fechar:focus-visible{outline:3px solid #F7D77E;outline-offset:-3px}',
    '#ms-corretor .fc-rolagem{position:relative;flex:1 1 auto;min-height:0;margin:0;padding:20px 20px 0;overflow-x:hidden;overflow-y:auto;overscroll-behavior:contain;-webkit-overflow-scrolling:touch;scroll-padding:16px 0 140px}',
    '#ms-corretor .fc-janela-intro{margin:0 0 18px;font-size:16px;line-height:1.5}',
    '#ms-corretor .fc-carregando{margin:0;padding:24px 0 32px;text-align:center}',
    '#ms-corretor .fc{display:block;margin:0;padding:0;font-size:16px}',
    '#ms-corretor .fc-campos{display:grid;grid-template-columns:1fr 1fr;gap:20px 16px;margin:0;padding:0}',
    '#ms-corretor .fc-largo{grid-column:1/-1}',
    '#ms-corretor .fc-campo{min-width:0;margin:0;padding:0;border:0}',
    '#ms-corretor .fc-campo>label,#ms-corretor .fc-campo>legend{display:block;margin:0 0 6px;padding:0;font-size:16px;font-weight:600;line-height:1.35}',
    '#ms-corretor .fc input[type="text"],#ms-corretor .fc input[type="email"],#ms-corretor .fc input[type="tel"],#ms-corretor .fc select{display:block;width:100%;min-height:50px;margin:0;padding:10px 12px;font-family:inherit;font-size:17px;font-weight:400;line-height:1.3;color:#161616;background:#fff;border:1.5px solid rgba(22,22,22,.6);border-radius:4px;box-shadow:none}',
    '#ms-corretor .fc input::placeholder{color:rgba(22,22,22,.6);opacity:1}',
    '#ms-corretor .fc input:focus,#ms-corretor .fc select:focus{outline:3px solid #161616;outline-offset:1px;border-color:#161616}',
    '#ms-corretor .fc-seta{position:relative;display:block}',
    '#ms-corretor .fc-seta select{-webkit-appearance:none;appearance:none;padding-right:44px;cursor:pointer}',
    '#ms-corretor .fc-seta::after{content:\'\';position:absolute;right:18px;top:50%;width:9px;height:9px;margin-top:-7px;border:solid #161616;border-width:0 2px 2px 0;transform:rotate(45deg);pointer-events:none}',
    '#ms-corretor .fc [aria-invalid="true"]:not([type="radio"]){border-color:#A61B1B;box-shadow:inset 0 0 0 1px #A61B1B}',
    '#ms-corretor .fc-erro{margin:6px 0 0;padding:0;color:#A61B1B;font-size:16px;font-weight:600;line-height:1.4}',
    '#ms-corretor .fc-opcoes{display:flex;gap:10px;margin:0;padding:0}',
    '#ms-corretor .fc-opcao{display:flex;flex:1 1 0;align-items:center;gap:10px;min-height:50px;margin:0;padding:8px 14px;font-size:17px;font-weight:400;background:#fff;border:1.5px solid rgba(22,22,22,.6);border-radius:4px;cursor:pointer}',
    '#ms-corretor .fc-opcao input{flex:none;width:22px;height:22px;margin:0;accent-color:#161616;cursor:pointer}',
    '#ms-corretor .fc-opcao:has(input:checked){background:#F7D77E;border-color:#161616}',
    '#ms-corretor .fc-opcao:has(input[aria-invalid="true"]){border-color:#A61B1B}',
    '#ms-corretor .fc-opcao:focus-within{outline:3px solid #161616;outline-offset:1px}',
    '#ms-corretor .fc-aceite{display:grid;grid-template-columns:auto 1fr;gap:6px 12px;align-items:start;padding:14px;background:rgba(247,215,126,.28);border:1px solid rgba(201,162,39,.7);border-radius:4px}',
    '#ms-corretor .fc-aceite input{width:24px;height:24px;margin:1px 0 0;accent-color:#161616;cursor:pointer}',
    '#ms-corretor .fc-aceite input:focus-visible{outline:3px solid #161616;outline-offset:2px}',
    '#ms-corretor .fc-aceite>label{margin:0;font-size:16px;font-weight:400;line-height:1.45;cursor:pointer}',
    '#ms-corretor .fc-aceite a{color:#161616;text-decoration:underline}',
    '#ms-corretor .fc-aceite .fc-erro{grid-column:1/-1;margin:0}',
    '#ms-corretor .fc-frase{margin:0;font-size:16px;line-height:1.5}',
    '#ms-corretor .fc-rodape{position:sticky;bottom:0;z-index:1;margin:0 -20px;padding:12px 20px 16px;padding-bottom:calc(16px + env(safe-area-inset-bottom, 0px));background:#fff;border-top:1px solid rgba(22,22,22,.12)}',
    '#ms-corretor .fc-enviar{display:block;width:100%;min-height:54px;margin:0;padding:12px 20px;font-family:inherit;font-size:17px;font-weight:700;line-height:1.2;letter-spacing:.08em;text-transform:uppercase;color:#161616;background:#C9A227;border:0;border-radius:4px;cursor:pointer}',
    '#ms-corretor .fc-enviar:hover{background:#F7D77E}',
    '#ms-corretor .fc-enviar[aria-disabled="true"]{opacity:.75;cursor:progress}',
    '#ms-corretor .fc-enviar:focus-visible,#ms-corretor .fc-btn:focus-visible{outline:3px solid #161616;outline-offset:2px}',
    '#ms-corretor .fc-falha{margin:0 0 12px;padding:14px;background:#fff;border:1.5px solid #A61B1B;border-radius:4px}',
    '#ms-corretor .fc-falha p{margin:0 0 12px;font-size:16px;line-height:1.5}',
    '#ms-corretor .fc-falha-botoes{display:flex;flex-wrap:wrap;gap:10px}',
    '#ms-corretor .fc-btn{display:inline-flex;flex:1 1 200px;align-items:center;justify-content:center;min-height:48px;margin:0;padding:10px 18px;font-family:inherit;font-size:16px;font-weight:700;line-height:1.2;text-align:center;text-decoration:none;border:0;border-radius:4px;cursor:pointer}',
    '#ms-corretor .fc-btn-ouro{color:#161616;background:#C9A227}',
    '#ms-corretor .fc-btn-ouro:hover{background:#F7D77E}',
    '#ms-corretor .fc-btn-escuro{color:#fff;background:#161616}',
    '#ms-corretor .fc-btn-escuro:hover{color:#F7D77E}',
    '#ms-corretor .fc-sucesso{padding:16px 8px 32px;text-align:center}',
    '#ms-corretor .fc-sucesso:focus{outline:none}',
    '#ms-corretor .fc-sucesso-icone{position:relative;display:block;width:56px;height:56px;margin:0 auto;background:#F7D77E;border:2px solid #161616;border-radius:50%}',
    '#ms-corretor .fc-sucesso-icone::after{content:\'\';position:absolute;left:18px;top:9px;width:12px;height:24px;border:solid #161616;border-width:0 4px 4px 0;transform:rotate(45deg)}',
    '#ms-corretor .fc-sucesso-texto{max-width:440px;margin:16px auto 24px;font-size:20px;font-weight:600;line-height:1.4}',
    '#ms-corretor .fc-sucesso .fc-btn{flex:none;min-width:220px}',
    '#ms-corretor .fc-sr{position:absolute!important;width:1px;height:1px;margin:-1px;padding:0;overflow:hidden;clip:rect(0 0 0 0);clip-path:inset(50%);white-space:nowrap;border:0}',
    '#ms-corretor .fc-hp{position:absolute!important;left:-10000px;top:auto;width:1px;height:1px;overflow:hidden}',
    '@media (max-width:600px){',
    'dialog#ms-corretor{top:0;right:0;bottom:0;left:0;width:auto;max-width:none;height:auto;max-height:none;margin:0;border-radius:0;box-shadow:none}',
    '#ms-corretor .fc-campos{grid-template-columns:1fr}',
    '#ms-corretor .fc-rolagem{padding:16px 16px 0}',
    '#ms-corretor .fc-rodape{margin:0 -16px;padding-left:16px;padding-right:16px}',
    '#ms-corretor .fc-janela-topo{padding-left:16px}',
    '}',
    '@media (prefers-reduced-motion:no-preference){dialog#ms-corretor[open]{animation:ms-corretor-entra .18s ease-out}}',
    '@keyframes ms-corretor-entra{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:none}}'
  ].join('\n');

  function limpa(s) {
    return String(s == null ? '' : s).replace(/\s+/g, ' ').replace(/^\s+|\s+$/g, '');
  }

  function todos(raiz, sel) {
    return Array.prototype.slice.call(raiz.querySelectorAll(sel));
  }

  function sobe(el, sel) {
    while (el && el.nodeType !== 1) el = el.parentNode;
    if (!el) return null;
    if (el.closest) return el.closest(sel);
    var m = el.matches || el.msMatchesSelector || el.webkitMatchesSelector;
    while (el && el.nodeType === 1) {
      if (m.call(el, sel)) return el;
      el = el.parentNode;
    }
    return null;
  }

  function visivel(el) {
    return !!(el && (el.offsetWidth || el.offsetHeight || (el.getClientRects && el.getClientRects().length)));
  }

  function semMovimento() {
    try { return window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) { return false; }
  }

  function focar(el) {
    if (!el) return;
    try { el.focus({ preventScroll: true }); } catch (e) { try { el.focus(); } catch (e2) {} }
  }

  function formataNacional(d) {
    if (d.length > 11) return d;
    if (d.length > 10) return '(' + d.slice(0, 2) + ') ' + d.slice(2, 7) + '-' + d.slice(7);
    if (d.length > 6) return '(' + d.slice(0, 2) + ') ' + d.slice(2, 6) + '-' + d.slice(6);
    if (d.length > 2) return '(' + d.slice(0, 2) + ') ' + d.slice(2);
    if (d.length > 0) return '(' + d;
    return '';
  }

  function normalizaTel(bruto) {
    var s = String(bruto || '');
    var d = s.replace(/\D/g, '');
    if (/^\s*\+/.test(s)) {
      if (d.slice(0, 2) === '55' && d.length >= 12) return formataNacional(d.slice(2));
      return d ? '+' + d.slice(0, 15) : '';
    }
    if (d.length > 11 && d.slice(0, 2) === '55') d = d.slice(2);
    else if (d.length > 11 && d.charAt(0) === '0') d = d.slice(1);
    return formataNacional(d);
  }

  function telValido(v) {
    var s = String(v || '');
    var d = s.replace(/\D/g, '');
    if (/^\s*\+/.test(s)) return d.length >= 8 && d.length <= 15 && d.slice(0, 2) !== '55';
    return (d.length === 10 || d.length === 11) && d.charAt(0) !== '0';
  }

  // a mesma limpeza da rota que recebe o formulário: o cliente nunca pode recusar o que ela aceita
  function normalizaCreci(v) {
    return String(v || '').toUpperCase()
      .replace(/CRECI/g, '')
      .replace(/[\s.:\/]/g, '')
      .replace(/^-?SP-?|-?SP$/g, '');
  }

  function ajustaTel(el) {
    if (!el) return;
    var novo = normalizaTel(el.value);
    if (novo !== el.value) el.value = novo;
  }

  function ajustaCreci(el) {
    if (!el || !el.value) return;
    var novo = normalizaCreci(el.value);
    if (RE_CRECI.test(novo) && novo !== el.value) el.value = novo;
  }

  function aoDigitarTel(ev) {
    var el = ev.target;
    var tipo = ev.inputType || '';
    if (!tipo || tipo === 'insertReplacementText' || tipo === 'insertFromPaste' || tipo === 'insertFromDrop') {
      ajustaTel(el);
      return;
    }
    if (tipo.indexOf('insert') !== 0) return;
    if (/^\s*\+/.test(el.value)) return;
    if (typeof el.selectionStart === 'number' && el.selectionStart !== el.value.length) return;
    var d = el.value.replace(/\D/g, '');
    var novo = formataNacional(d);
    if (novo !== el.value) el.value = novo;
  }

  function marcado(form, nome) {
    return todos(form, 'input[name="' + nome + '"]').some(function (el) { return el.checked; });
  }

  function msgDe(caixa, chave) {
    return caixa.getAttribute(chave) || caixa.getAttribute('data-erro') || '';
  }

  function controles(caixa) {
    return todos(caixa, 'input, select, textarea').filter(function (el) { return el.type !== 'hidden'; });
  }

  function validar(form, caixa) {
    var nome = caixa.getAttribute('data-campo');
    var el = caixa.querySelector('input, select');
    var v = el ? limpa(el.value) : '';
    switch (nome) {
      case 'nome':
        return (v.length >= 3 && v.length <= 120 && /[A-Za-z\u00C0-\u024F]/.test(v)) ? '' : msgDe(caixa, 'data-erro');
      case 'endereco':
        return (v.length >= 5 && v.length <= 200) ? '' : msgDe(caixa, 'data-erro');
      case 'creci':
        return (v === '' || RE_CRECI.test(normalizaCreci(v))) ? '' : msgDe(caixa, 'data-erro');
      case 'idade':
        return v ? '' : msgDe(caixa, 'data-erro');
      case 'experiencia':
      case 'veiculo':
        return marcado(form, nome) ? '' : msgDe(caixa, 'data-erro');
      case 'email':
        if (!v) return msgDe(caixa, 'data-erro-vazio');
        if (v.indexOf('@') < 0) return msgDe(caixa, 'data-erro-arroba');
        return /^[^\s@]+@[^\s@.]+(\.[^\s@.]+)*\.[^\s@.]{2,}$/.test(v) ? '' : msgDe(caixa, 'data-erro');
      case 'telefone':
        return telValido(el && el.value) ? '' : msgDe(caixa, 'data-erro');
      case 'aceite':
        return el && el.checked ? '' : msgDe(caixa, 'data-erro');
    }
    return '';
  }

  function marcarErro(caixa, msg) {
    var p = caixa.querySelector('.fc-erro');
    if (!p) return;
    p.textContent = msg || '';
    p.hidden = !msg;
    controles(caixa).forEach(function (el) {
      if (msg) {
        el.setAttribute('aria-invalid', 'true');
        el.setAttribute('aria-describedby', p.id);
      } else {
        el.removeAttribute('aria-invalid');
        if (el.getAttribute('aria-describedby') === p.id) el.removeAttribute('aria-describedby');
      }
    });
  }

  function temErro(caixa) {
    var p = caixa.querySelector('.fc-erro');
    return !!(p && !p.hidden);
  }

  function focarCampo(caixa) {
    var els = controles(caixa);
    var alvo = null;
    for (var i = 0; i < els.length; i++) {
      if (els[i].type === 'radio' && els[i].checked) { alvo = els[i]; break; }
    }
    alvo = alvo || els[0];
    try { caixa.scrollIntoView({ block: 'center', behavior: 'auto' }); } catch (e) {}
    focar(alvo);
  }

  function avisar(form, txt) {
    var r = form.querySelector('.fc-aviso');
    if (!r) return;
    r.textContent = '';
    setTimeout(function () { r.textContent = txt || ''; }, 60);
  }

  function ocupado(form, sim) {
    var b = form.querySelector('.fc-enviar');
    if (!b) return;
    if (!b.getAttribute('data-texto')) b.setAttribute('data-texto', limpa(b.textContent));
    if (sim) {
      b.setAttribute('aria-disabled', 'true');
      b.textContent = T_ENVIANDO;
    } else {
      b.removeAttribute('aria-disabled');
      b.textContent = b.getAttribute('data-texto');
    }
  }

  function mostrarFalha(form, motivo) {
    var caixa = form.querySelector('.fc-falha');
    var enviar = form.querySelector('.fc-enviar');
    if (!caixa) return;
    var txt = '';
    todos(caixa, '[data-motivo]').forEach(function (p) {
      var este = p.getAttribute('data-motivo') === motivo;
      p.hidden = !este;
      if (este) txt = limpa(p.textContent);
    });
    var repetir = caixa.querySelector('[data-fc-repetir]');
    if (repetir) repetir.hidden = motivo !== 'envio';
    caixa.hidden = false;
    var alvo = todos(caixa, 'button, a[href]').filter(function (b) { return !b.hidden; })[0];
    focar(alvo);
    if (enviar) enviar.hidden = motivo !== 'recarga';
    try { caixa.scrollIntoView({ block: 'nearest', behavior: 'auto' }); } catch (e) {}
    avisar(form, txt);
  }

  function esconderFalha(form) {
    var caixa = form.querySelector('.fc-falha');
    if (!caixa || caixa.hidden) return;
    var dentro = caixa.contains(document.activeElement);
    caixa.hidden = true;
    var enviar = form.querySelector('.fc-enviar');
    if (enviar) {
      enviar.hidden = false;
      if (dentro) focar(enviar);
    }
  }

  function medir(forma) {
    if (LOCAL) return;
    try {
      if (typeof window.gtag === 'function') {
        window.gtag('event', 'sou_corretor_enviado', { event_category: 'recrutamento', forma: forma, origem: location.pathname });
      }
    } catch (e) {}
  }

  function mostrarSucesso(form) {
    var est = form.__fc;
    var campos = form.querySelector('.fc-campos');
    var s = form.querySelector('.fc-sucesso');
    try { form.reset(); } catch (e) {}
    todos(form, '[data-campo]').forEach(function (c) { marcarErro(c, ''); });
    esconderFalha(form);
    if (campos) campos.hidden = true;
    if (s) {
      s.hidden = false;
      var rol = sobe(form, '.fc-rolagem');
      if (rol) rol.scrollTop = 0;
      else { try { s.scrollIntoView({ block: 'center', behavior: 'auto' }); } catch (e) {} }
      focar(s);
      var t = s.querySelector('.fc-sucesso-texto');
      avisar(form, limpa((t || s).textContent));
    }
    medir(est.forma);
  }

  function codigoCampanha() {
    try {
      var a = window.VA_ATRIB;
      var v = a && typeof a.codigo === 'function' ? a.codigo() : '';
      v = String(v || '').toUpperCase();
      return RE_CODIGO.test(v) ? v : '';
    } catch (e) { return ''; }
  }

  function paginaAtual() {
    var p = String(location.pathname || '/').toLowerCase().replace(/index\.html$/, '');
    return RE_PAGINA.test(p) ? p : '/';
  }

  function campoOculto(form, nome) {
    var el = form.querySelector('input[name="' + nome + '"]');
    return el && el.type === 'hidden' ? el : null;
  }

  function preencherOcultos(form, est) {
    var t = campoOculto(form, 't');
    var pagina = campoOculto(form, 'pagina');
    var origem = campoOculto(form, 'origem');
    if (t) t.value = String(Math.max(0, Math.round(Date.now() - est.inicio)));
    if (pagina) pagina.value = paginaAtual();
    if (origem) {
      var v = String(origem.value || '').toUpperCase();
      if (!RE_CODIGO.test(v)) v = codigoCampanha();
      origem.value = v;
    }
  }

  function serializar(form) {
    var partes = [];
    var enc = function (s) { return encodeURIComponent(s).replace(/%20/g, '+'); };
    var els = form.elements;
    for (var i = 0; i < els.length; i++) {
      var el = els[i];
      var tipo = String(el.type || '').toLowerCase();
      if (!el.name || el.disabled || el.name === 'modo') continue;
      if (tipo === 'submit' || tipo === 'button' || tipo === 'reset' || tipo === 'file' || tipo === 'image') continue;
      if ((tipo === 'radio' || tipo === 'checkbox') && !el.checked) continue;
      partes.push(enc(el.name) + '=' + enc(el.value));
    }
    partes.push('modo=js');
    return partes.join('&');
  }

  function interpretar(status, j) {
    if (status === 200 && j && j.ok === true) return { tipo: 'ok' };
    if (status === 400 && j && typeof j.campo === 'string' && /^[a-z_]{1,30}$/.test(j.campo)) {
      return { tipo: 'campo', campo: j.campo, msg: typeof j.msg === 'string' ? limpa(j.msg).slice(0, 200) : '' };
    }
    if (status === 429) return { tipo: 'falha', motivo: 'limite' };
    return { tipo: 'falha', motivo: 'envio' };
  }

  function concluir(form, est, r) {
    est.enviando = false;
    ocupado(form, false);
    if (r.tipo === 'ok') { mostrarSucesso(form); return; }
    if (r.tipo === 'campo') {
      var caixa = form.querySelector('[data-campo="' + r.campo + '"]');
      if (caixa) {
        var m = validar(form, caixa) || r.msg || caixa.getAttribute('data-erro') || '';
        marcarErro(caixa, m);
        focarCampo(caixa);
        avisar(form, m);
        return;
      }
    }
    mostrarFalha(form, r.motivo || 'envio');
  }

  function enviar(form, est, corpo) {
    est.enviando = true;
    ocupado(form, true);
    avisar(form, T_ENVIANDO);
    if (LOCAL) {
      setTimeout(function () {
        concluir(form, est, SIMULAR_OK ? { tipo: 'ok' } : { tipo: 'falha', motivo: 'envio' });
      }, 700);
      return;
    }
    var terminou = false;
    var ctrl = null;
    try { ctrl = typeof window.AbortController === 'function' ? new AbortController() : null; } catch (e) { ctrl = null; }
    var relogio = setTimeout(function () {
      if (terminou) return;
      terminou = true;
      if (ctrl) { try { ctrl.abort(); } catch (e) {} }
      concluir(form, est, { tipo: 'falha', motivo: 'envio' });
    }, LIMITE_MS);
    var opcoes = {
      method: 'POST',
      mode: 'cors',
      credentials: 'omit',
      cache: 'no-store',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: corpo
    };
    if (ctrl) opcoes.signal = ctrl.signal;
    var fim = function (r) {
      if (terminou) return;
      terminou = true;
      clearTimeout(relogio);
      concluir(form, est, r);
    };
    try {
      window.fetch(DESTINO, opcoes).then(function (resp) {
        return resp.text().then(function (txt) {
          var j = null;
          try { j = JSON.parse(txt); } catch (e) { j = null; }
          return interpretar(resp.status, j);
        }, function () { return interpretar(resp.status, null); });
      }).then(fim, function () { fim({ tipo: 'falha', motivo: 'envio' }); });
    } catch (e) {
      fim({ tipo: 'falha', motivo: 'envio' });
    }
  }

  function aoEnviar(ev) {
    var form = ev.currentTarget || this;
    var est = form.__fc;
    if (est.enviando) { ev.preventDefault(); return; }
    ajustaTel(form.querySelector('input[name="telefone"]'));
    ajustaCreci(form.querySelector('input[name="creci"]'));
    var primeiro = null;
    var primeiraMsg = '';
    todos(form, '[data-campo]').forEach(function (caixa) {
      var m = validar(form, caixa);
      marcarErro(caixa, m);
      if (m && !primeiro) { primeiro = caixa; primeiraMsg = m; }
    });
    if (primeiro) {
      ev.preventDefault();
      esconderFalha(form);
      focarCampo(primeiro);
      avisar(form, primeiraMsg);
      return;
    }
    preencherOcultos(form, est);
    var corpo = serializar(form);
    ev.preventDefault();
    esconderFalha(form);
    enviar(form, est, corpo);
  }

  function aoMudar(ev) {
    var form = ev.currentTarget || this;
    var alvo = ev.target;
    if (!alvo || alvo.type === 'hidden' || alvo.name === 'website') return;
    esconderFalha(form);
    var caixa = sobe(alvo, '[data-campo]');
    if (caixa && temErro(caixa)) marcarErro(caixa, validar(form, caixa));
  }

  function melhorar(form, forma, inicio) {
    if (!form || form.__fc) return;
    form.__fc = { forma: forma, inicio: inicio || Date.now(), enviando: false };
    form.noValidate = true;
    form.addEventListener('submit', aoEnviar);
    form.addEventListener('input', aoMudar);
    form.addEventListener('change', aoMudar);
    var tel = form.querySelector('input[name="telefone"]');
    if (tel) {
      tel.addEventListener('input', aoDigitarTel);
      tel.addEventListener('change', function () { ajustaTel(tel); });
      tel.addEventListener('blur', function () { ajustaTel(tel); });
    }
    var creci = form.querySelector('input[name="creci"]');
    if (creci) creci.addEventListener('blur', function () { ajustaCreci(creci); });
    var b = form.querySelector('.fc-enviar');
    if (b && !b.getAttribute('data-texto')) b.setAttribute('data-texto', limpa(b.textContent));
  }

  function injetarCss() {
    if (document.getElementById('corretor-css')) return;
    var s = document.createElement('style');
    s.id = 'corretor-css';
    s.textContent = CSS;
    (document.head || document.documentElement).appendChild(s);
  }

  function focaveis(raiz) {
    return todos(raiz, 'a[href], button, input, select, textarea, [tabindex]').filter(function (el) {
      if (el.disabled || el.type === 'hidden') return false;
      var ti = el.getAttribute('tabindex');
      if (ti !== null && Number(ti) < 0) return false;
      return visivel(el);
    });
  }

  function prender(ev) {
    if (ev.key !== 'Tab' && ev.keyCode !== 9) return;
    var f = focaveis(janela);
    if (!f.length) return;
    var a = document.activeElement;
    var prim = f[0];
    var ult = f[f.length - 1];
    if (ev.shiftKey) {
      if (a === prim || f.indexOf(a) < 0) { ev.preventDefault(); focar(ult); }
    } else if (a === ult || !janela.contains(a)) {
      ev.preventDefault();
      focar(prim);
    }
  }

  function fechar() {
    if (janela && janela.open) {
      try { janela.close(); } catch (e) {}
    }
  }

  function devolverFoco() {
    var a = abridor;
    abridor = null;
    if (a && document.documentElement.contains(a) && visivel(a)) { focar(a); return; }
    var b = document.querySelector('#menu-site .ms-abre');
    if (b && visivel(b)) focar(b);
  }

  function criarJanela() {
    injetarCss();
    var d = document.createElement('dialog');
    d.id = 'ms-corretor';
    d.setAttribute('aria-labelledby', 'ms-corretor-titulo');
    var topo = document.createElement('div');
    topo.className = 'fc-janela-topo';
    var titulo = document.createElement('p');
    titulo.className = 'fc-janela-titulo';
    titulo.id = 'ms-corretor-titulo';
    titulo.setAttribute('tabindex', '-1');
    titulo.textContent = T_TITULO;
    var x = document.createElement('button');
    x.type = 'button';
    x.className = 'fc-janela-fechar';
    x.setAttribute('aria-label', T_FECHAR);
    topo.appendChild(titulo);
    topo.appendChild(x);
    var rol = document.createElement('div');
    rol.className = 'fc-rolagem';
    var carregando = document.createElement('p');
    carregando.className = 'fc-carregando';
    carregando.setAttribute('role', 'status');
    carregando.textContent = T_CARREGANDO;
    rol.appendChild(carregando);
    d.appendChild(topo);
    d.appendChild(rol);
    d.addEventListener('keydown', prender);
    d.addEventListener('close', devolverFoco);
    d.addEventListener('mousedown', function (ev) { apertouFundo = ev.target === d; });
    d.addEventListener('click', function (ev) {
      var fundo = ev.target === d && apertouFundo;
      apertouFundo = false;
      if (fundo) { fechar(); return; }
      if (sobe(ev.target, '.fc-janela-fechar, [data-fc-fechar]')) fechar();
    });
    document.body.appendChild(d);
    return d;
  }

  function carregar() {
    if (modelo) return modelo;
    var p = window.fetch(PAGINA, { credentials: 'same-origin' }).then(function (r) {
      if (!r.ok) throw new Error(String(r.status));
      return r.text();
    }).then(function (html) {
      var doc = new DOMParser().parseFromString(html, 'text/html');
      var f = doc.getElementById('form-corretor');
      if (!f) throw new Error('form');
      var h1 = doc.querySelector('h1');
      var intro = doc.getElementById('fc-intro');
      return { form: f, titulo: limpa(h1 && h1.textContent), intro: limpa(intro && intro.textContent) };
    });
    modelo = p;
    p.then(null, function () { if (modelo === p) modelo = null; });
    return p;
  }

  function montar(dados) {
    var rol = janela.querySelector('.fc-rolagem');
    var titulo = janela.querySelector('.fc-janela-titulo');
    if (dados.titulo && titulo) titulo.textContent = dados.titulo;
    var form = document.importNode(dados.form, true);
    form.id = 'ms-corretor-form';
    todos(form, '[data-so-pagina]').forEach(function (el) { if (el.parentNode) el.parentNode.removeChild(el); });
    todos(form, '[data-so-janela]').forEach(function (el) { el.hidden = false; });
    var pagina = campoOculto(form, 'pagina');
    if (pagina) pagina.value = paginaAtual();
    while (rol.firstChild) rol.removeChild(rol.firstChild);
    if (dados.intro) {
      var p = document.createElement('p');
      p.className = 'fc-janela-intro';
      p.textContent = dados.intro;
      rol.appendChild(p);
    }
    rol.appendChild(form);
    melhorar(form, 'janela', inicioJanela);
    montada = true;
  }

  function irParaPagina(link) {
    var destino = link && link.href ? link.href : PAGINA;
    try { window.location.href = destino; } catch (e) {}
  }

  function abrir(link) {
    abridor = link || document.activeElement;
    if (!janela) janela = criarJanela();
    if (!janela.open) {
      try { janela.showModal(); } catch (e) { irParaPagina(link); return; }
    }
    if (!inicioJanela) inicioJanela = Date.now();
    focar(janela.querySelector('.fc-janela-titulo'));
    if (montada) return;
    carregar().then(function (dados) {
      if (!montada) montar(dados);
    }, function () {
      if (!janela.open) return;
      fechar();
      irParaPagina(link);
    });
  }

  function irAoFormulario(form, teclado) {
    var alvo = form.querySelector('.fc-sucesso:not([hidden])') || form;
    try { alvo.scrollIntoView({ block: 'start', behavior: semMovimento() ? 'auto' : 'smooth' }); } catch (e) {}
    if (teclado) {
      var c = alvo === form ? form.querySelector('input:not([type="hidden"]):not([tabindex="-1"]), select') : alvo;
      focar(c);
    }
  }

  function linkCorretor(alvo) {
    return sobe(alvo, 'a[data-sou-corretor]');
  }

  function formDaPagina() {
    return document.getElementById('form-corretor');
  }

  function aoClicar(ev) {
    if (ev.defaultPrevented || ev.button !== 0 || ev.ctrlKey || ev.metaKey || ev.shiftKey || ev.altKey) return;
    var a = linkCorretor(ev.target);
    if (!a) return;
    var fp = formDaPagina();
    if (fp) {
      ev.preventDefault();
      irAoFormulario(fp, ev.detail === 0);
      return;
    }
    if (!TEM_DIALOG || !TEM_BUSCA) return;
    ev.preventDefault();
    abrir(a);
  }

  function preBuscar(ev) {
    if (modelo || !TEM_DIALOG || !TEM_BUSCA || montada) return;
    if (!linkCorretor(ev.target) || formDaPagina()) return;
    carregar();
  }

  function iniciar() {
    var fp = formDaPagina();
    if (fp) {
      var inicio = Date.now();
      try { if (window.performance && typeof performance.now === 'function') inicio = Date.now() - performance.now(); } catch (e) {}
      melhorar(fp, 'pagina', inicio);
    }
  }

  document.addEventListener('click', aoClicar);
  document.addEventListener('pointerenter', preBuscar, true);
  document.addEventListener('focusin', preBuscar);
  document.addEventListener('touchstart', preBuscar, { passive: true, capture: true });

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciar);
  else iniciar();
})();
