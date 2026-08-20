/* ═══════════════════════════════════════════════════════════════════════════
   ATRIBUIÇÃO DE ORIGEM — lancamentos.imoveisvivamerica.com.br
   Salvar como:  landing-page/atrib.js   (na RAIZ do repositório)
   ───────────────────────────────────────────────────────────────────────────
   O QUE FAZ

   1. Lê o código de campanha da URL (?c=ABC234). São 6 caracteres do alfabeto
      A-Z2-9 — sem 0, O, 1 e I, que se confundem no papel impresso.
   2. Guarda esse código no navegador (sessionStorage + localStorage).
   3. Carimba o código nos links internos e no <form>, para ele sobreviver
      quando a pessoa navega de uma página para outra.
   4. Acrescenta " [#ABC234]" no fim do texto de TODO botão de WhatsApp,
      preservando o texto que já existe naquele botão.

   POR QUE " [#ABC234]" NO FIM DO TEXTO

   Esse sufixo é a ÚNICA coisa que atravessa para dentro do WhatsApp. A pessoa
   envia a mensagem, o sistema lê o código e sabe de qual folheto, placa ou
   anúncio ela veio. O formato está casado caractere por caractere com quem lê
   do outro lado — app/crm/campanhas.py:356, regex \[#?([A-Z2-9]{6})\].
   NÃO mude o espaço, os colchetes nem a cerquilha.

   SEM CÓDIGO NA URL E SEM CÓDIGO GUARDADO, ESTE ARQUIVO NÃO FAZ NADA —
   o site continua exatamente como é hoje.

   COMO ENTRA NA PÁGINA (importa):
      <script src="/atrib.js"></script>
   logo depois do <meta charset>, SEM defer e SEM async.

   Por que SEM defer: em index.html o </head> está no byte 31.147 e o primeiro
   botão de WhatsApp no byte 35.429, de um arquivo de 115.671 bytes. Não há
   nenhum rel="stylesheet" (todo o CSS são 2 blocos <style> inline), então a
   página PINTA cedo e o botão já é tocável enquanto os ~80 KB restantes ainda
   estão sendo lidos. Script com defer só roda depois do parse COMPLETO: um
   toque nessa janela abriria o WhatsApp SEM o código, sem erro e sem aviso.
   Sem defer, o ouvinte de clique existe desde o começo do parse. São 17 KB do
   mesmo domínio (menos de 5 KB comprimidos) — o custo é de milissegundos.

   Por que depois do <meta charset>: o navegador precisa saber a codificação
   da página antes de buscar um script que não declara a dele.

   Sem dependência externa. Funciona no Safari do iPhone, no navegador de
   dentro do Instagram e em aba anônima.
   ═══════════════════════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  /* ── ajustes ─────────────────────────────────────────────────────────── */

  // Nome da chave no navegador. Transparente de propósito: quem abrir o
  // DevTools entende na hora o que está guardado ali.
  var CHAVE = 'va_origem';

  // Validade do código guardado, em dias. DECISÃO DO DONO.
  // O Safari do iPhone apaga armazenamento escrito por JavaScript depois de
  // 7 dias sem visita, de qualquer jeito; número maior que isso só vale para
  // Android e PC.
  var VALIDADE_DIAS = 30;

  // Nome do parâmetro na URL. "?cupom=" NÃO é confundido com "?c=".
  var PARAM = 'c';

  // Alfabeto do código: idêntico ao gerador do sistema
  // (app/models.py:4666, ABCDEFGHJKLMNPQRSTUVWXYZ23456789) e idêntico à
  // expressão que lê do outro lado. Código que não casar com isto é IGNORADO
  // — nunca vai para o WhatsApp e nunca é guardado.
  var RE_CODIGO = /^[A-Z2-9]{6}$/;

  // Texto usado SÓ nos botões de WhatsApp que hoje não têm ?text= nenhum
  // (são 10 no site). Sem código na URL esses botões continuam como estão.
  // Escrito com \u de propósito: assim o texto sai certo mesmo se o servidor
  // mandar o .js sem "charset=utf-8". Lê-se:
  //   "Olá! Vim do site de lançamentos da Viv'América."
  var TEXTO_PADRAO =
    'Ol\u00e1! Vim do site de lan\u00e7amentos da Viv\u0027Am\u00e9rica.';

  // ── O NOME DO EMPREENDIMENTO NO TEXTO (decisao do dono, 17/08/2026) ─
  // "Hoje aparece que a pessoa esta interessada no lancamento X... podemos
  //  adaptar a frase e adicionar para ser mais certeiro."
  //
  // Assim o corretor recebe "quero saber do Alpnach" em vez de um "oi" seco.
  //
  // DE ONDE VEM O NOME: do <title>, antes do "|". Ele ja e escrito a mao por
  // pagina e traz o nome comercial certo ("Congesa Seasons Natural Wellness",
  // que o endereco /seasons-indaiatuba/ nao daria).
  //
  // QUANDO NAO USAR: so pagina de empreendimento tem nome proprio. A home, o
  // blog e a quermesse caem no texto generico — sem esta guarda, a pagina de
  // obrigado do cupom mandaria "Vi o Cupom garantido!", que e o <title> dela.
  // Por isso o ENDERECO decide SE ha empreendimento, e o titulo so NOMEIA.
  var SEM_EMPREENDIMENTO = ['blog', 'quermesse', 'qrcode',
                            'condominios-fechados-indaiatuba',
                            'loteamentos-em-indaiatuba',
                            'lancamentos-indaiatuba'];

  function nomeDoEmpreendimento() {
    try {
      var partes = String(window.location.pathname || '').split('/')
        .filter(function (x) { return x && x.indexOf('.') === -1; });
      // Empreendimento e UM segmento so: /aurora-indaiatuba/. A home tem zero;
      // /blog/post/ e /quermesse/obrigado/ tem dois.
      if (partes.length !== 1) return null;
      if (SEM_EMPREENDIMENTO.indexOf(partes[0].toLowerCase()) !== -1) return null;
      var t = String(document.title || '').split('|')[0]
        .replace(/^\s+|\s+$/g, '');
      if (t.length < 4 || t.length > 60) return null;   // nao parece nome proprio
      return t;
    } catch (e) { return null; }
  }

  // "Ola! Vi o <NOME> no site da Viv'America e quero mais informacoes."
  function textoPadrao() {
    var nome = nomeDoEmpreendimento();
    if (!nome) return TEXTO_PADRAO;
    // Aspas DUPLAS: o apostrofo de Viv'America fecharia a string simples.
    // Escrito com \u como o resto do arquivo, para sair certo mesmo se o
    // servidor mandar o .js sem "charset=utf-8".
    return "Olá! Vi o " + nome + " no site da Viv'América e "
         + "quero mais informações.";
  }

  // Hosts tratados como "o próprio site". O host de produção está na lista
  // porque parte dos links do site são absolutos — assim a propagação se
  // comporta igual em produção e num servidor local de teste.
  var HOSTS_PROPRIOS = [
    String((typeof window !== 'undefined' && window.location &&
            window.location.host) || '').toLowerCase(),
    'lancamentos.imoveisvivamerica.com.br'
  ];

  // Hosts de WhatsApp. Só estes recebem o sufixo.
  var HOSTS_WA = ['wa.me', 'api.whatsapp.com', 'web.whatsapp.com',
                  'whatsapp.com', 'chat.whatsapp.com'];

  // Extensões que nunca recebem o parâmetro (imagem, PDF, etc).
  var RE_ARQUIVO =
    /\.(pdf|jpe?g|png|webp|gif|svg|ico|zip|rar|mp4|mp3|wav|txt|xml|csv|css|js|json|docx?|xlsx?|pptx?)$/i;

  // Esquemas que nunca são tocados.
  var RE_NAO_LINK = /^(#|mailto:|tel:|sms:|javascript:|data:|blob:|whatsapp:|intent:)/i;

  // Nome do campo escondido que o script preenche dentro do <form>, SE ele
  // existir. Enquanto não existir, esta parte não faz nada.
  var CAMPO_FORM = 'origem';

  // BEACON — DESLIGADO por padrão. Ver DECISÃO 3 na especificação.
  // Quando vazio, o script NÃO fala com servidor nenhum. Se um dia o dono
  // quiser que a visita pelo site também conte como "scan" no painel de
  // campanhas, basta pôr aqui a base do sistema, por exemplo
  // 'https://sistema.imoveisvivamerica.com.br'. O script então dispara UMA
  // vez por sessão um GET em <base>/w/<CODIGO>, que é a mesma rota do QR.
  var URL_SISTEMA = '';

  /* ── leitura do código ───────────────────────────────────────────────── */

  function limpaCodigo(bruto) {
    var v = String(bruto == null ? '' : bruto);
    try { v = decodeURIComponent(v.replace(/\+/g, ' ')); } catch (e) { /* fica cru */ }
    v = v.replace(/^\s+|\s+$/g, '').toUpperCase();
    return RE_CODIGO.test(v) ? v : null;
  }

  // Lê ?c= da busca. Recebe a string de busca para poder ser testada fora do
  // navegador.
  function codigoDaUrl(busca) {
    var q = String(busca == null
      ? ((typeof window !== 'undefined' && window.location &&
          window.location.search) || '')
      : busca);
    if (q.charAt(0) !== '?') q = '?' + q;
    var m = new RegExp('[?&]' + PARAM + '=([^&#]*)').exec(q);
    return m ? limpaCodigo(m[1]) : null;
  }

  /* ── memória do navegador ────────────────────────────────────────────── */

  // Só tocar em sessionStorage/localStorage já lança exceção em algumas
  // configurações de privacidade. Tudo aqui é à prova disso.
  function caixa(nome) {
    try {
      var s = window[nome];
      var t = '__va__';
      s.setItem(t, '1'); s.removeItem(t);
      return s;
    } catch (e) { return null; }
  }

  function guardar(cod) {
    var reg;
    try { reg = JSON.stringify({ c: cod, t: Date.now() }); } catch (e) { return; }
    var a = caixa('sessionStorage'); if (a) { try { a.setItem(CHAVE, reg); } catch (e) {} }
    var b = caixa('localStorage');   if (b) { try { b.setItem(CHAVE, reg); } catch (e) {} }
  }

  function lerDe(nome) {
    var s = caixa(nome); if (!s) return null;
    var bruto;
    try { bruto = s.getItem(CHAVE); } catch (e) { return null; }
    if (!bruto) return null;
    var o;
    try { o = JSON.parse(bruto); } catch (e) { return null; }
    if (!o || !RE_CODIGO.test(String(o.c || ''))) return null;
    var t = Number(o.t || 0);
    if (!t || (Date.now() - t) > VALIDADE_DIAS * 86400000) {
      try { s.removeItem(CHAVE); } catch (e) {}
      return null;
    }
    return o.c;
  }

  // Cache de uma execução: a URL manda; depois a sessão; depois o disco.
  var _cod;
  function codigoAtual() {
    if (_cod !== undefined) return _cod;
    _cod = codigoDaUrl() || lerDe('sessionStorage') || lerDe('localStorage') || null;
    return _cod;
  }

  /* ── peças de URL (string, sem reescrever o resto do link) ────────────── */

  function partes(bruto) {
    var s = String(bruto == null ? '' : bruto);
    var hash = '', i = s.indexOf('#');
    if (i !== -1) { hash = s.slice(i); s = s.slice(0, i); }
    var busca = '', j = s.indexOf('?');
    if (j !== -1) { busca = s.slice(j + 1); s = s.slice(0, j); }
    return { base: s, busca: busca, hash: hash };
  }

  function junta(p) {
    return p.base + (p.busca ? '?' + p.busca : '') + p.hash;
  }

  function paresDe(busca) {
    if (!busca) return [];
    var brutos = busca.split('&'), saida = [];
    for (var i = 0; i < brutos.length; i++) {
      if (brutos[i] === '') continue;
      var eq = brutos[i].indexOf('=');
      saida.push(eq === -1
        ? { k: brutos[i], v: null }
        : { k: brutos[i].slice(0, eq), v: brutos[i].slice(eq + 1) });
    }
    return saida;
  }

  function montaBusca(ps) {
    var out = [];
    for (var i = 0; i < ps.length; i++) {
      out.push(ps[i].v === null ? ps[i].k : ps[i].k + '=' + ps[i].v);
    }
    return out.join('&');
  }

  // Resolve o link contra a página atual só para DECIDIR o que ele é.
  // O link gravado de volta continua na forma original (relativo continua
  // relativo) — 1.430 links relativos do site não viram absolutos.
  function resolve(bruto, base) {
    try {
      var b = base || (typeof window !== 'undefined' && window.location
                       ? window.location.href : 'https://lancamentos.imoveisvivamerica.com.br/');
      return new URL(String(bruto), b);
    } catch (e) { return null; }
  }

  function host(u) {
    return String(u.hostname || '').toLowerCase().replace(/^www\./, '');
  }

  /* ── classificação ───────────────────────────────────────────────────── */

  function ehWhatsApp(bruto, base) {
    if (!bruto || RE_NAO_LINK.test(String(bruto).replace(/^\s+/, ''))) return false;
    var u = resolve(bruto, base);
    if (!u) return false;
    if (u.protocol !== 'http:' && u.protocol !== 'https:') return false;
    var h = host(u);
    for (var i = 0; i < HOSTS_WA.length; i++) if (h === HOSTS_WA[i]) return true;
    return false;
  }

  // `el` é opcional; quando vem, respeita o atributo download.
  function ehInterno(bruto, base, el) {
    if (!bruto) return false;
    var s = String(bruto).replace(/^\s+/, '');
    if (RE_NAO_LINK.test(s)) return false;
    if (el && el.hasAttribute && el.hasAttribute('download')) return false;
    var u = resolve(s, base);
    if (!u) return false;
    if (u.protocol !== 'http:' && u.protocol !== 'https:') return false;
    var h = String(u.hostname || '').toLowerCase();
    var ok = false;
    for (var i = 0; i < HOSTS_PROPRIOS.length; i++) {
      if (HOSTS_PROPRIOS[i] && h === HOSTS_PROPRIOS[i]) { ok = true; break; }
    }
    if (!ok) return false;
    if (RE_ARQUIVO.test(u.pathname || '')) return false;
    return true;
  }

  /* ── carimbo ─────────────────────────────────────────────────────────── */

  // Um código anterior no fim do texto é TROCADO, nunca empilhado.
  var RE_SUFIXO_FIM = /\s*\[#?[A-Z2-9]{6}\]\s*$/;

  function marcarWhatsApp(bruto, cod, base) {
    if (!cod) return bruto;
    var p = partes(bruto);
    var ps = paresDe(p.busca);
    var texto = null, achou = -1;
    for (var i = 0; i < ps.length; i++) {
      if (ps[i].k === 'text') {
        achou = i;
        try {
          texto = decodeURIComponent(String(ps[i].v || '').replace(/\+/g, ' '));
        } catch (e) { texto = String(ps[i].v || ''); }
        break;
      }
    }
    if (texto === null || texto.replace(/^\s+|\s+$/g, '') === '') texto = textoPadrao();
    texto = texto.replace(RE_SUFIXO_FIM, '');
    var novo = texto + ' [#' + cod + ']';
    // encodeURIComponent, NUNCA URLSearchParams: o URLSearchParams escreve
    // espaço como "+", e o WhatsApp mostra o "+" literal no balão.
    var v = encodeURIComponent(novo);
    if (achou === -1) ps.push({ k: 'text', v: v });
    else ps[achou].v = v;
    p.busca = montaBusca(ps);
    return junta(p);
  }

  function marcarInterno(bruto, cod) {
    if (!cod) return bruto;
    var p = partes(bruto);
    var ps = paresDe(p.busca);
    for (var i = 0; i < ps.length; i++) {
      if (ps[i].k === PARAM) { ps[i].v = cod; p.busca = montaBusca(ps); return junta(p); }
    }
    ps.push({ k: PARAM, v: cod });
    p.busca = montaBusca(ps);
    return junta(p);
  }

  /* ── aplicação na página ─────────────────────────────────────────────── */

  function marcarUm(el, cod, attr) {
    var bruto = el.getAttribute(attr);
    if (bruto === null) return 0;
    var novo = bruto;
    if (ehWhatsApp(bruto)) novo = marcarWhatsApp(bruto, cod);
    else if (ehInterno(bruto, null, el)) novo = marcarInterno(bruto, cod);
    if (novo !== bruto) { el.setAttribute(attr, novo); return 1; }
    return 0;
  }

  function aplicar() {
    var cod = codigoAtual();
    if (!cod) return;                       // sem código, o site fica como é hoje
    var as = document.querySelectorAll('a[href]');
    for (var i = 0; i < as.length; i++) marcarUm(as[i], cod, 'href');

    // FORMULÁRIO. O site tem 2 (o cupom da quermesse, em index.html e em
    // /quermesse/). Sem isto o `action` leva a pessoa para
    // /quermesse/obrigado/ sem o código — e é justamente lá que existe um
    // botão de WhatsApp montado por JavaScript.
    var fs = document.querySelectorAll('form[action]');
    for (var j = 0; j < fs.length; j++) {
      marcarUm(fs[j], cod, 'action');
      // Se o <form> tiver um campo escondido chamado "origem", ele é
      // preenchido e o código aparece no painel de Forms do Netlify.
      // Enquanto o campo não existir, esta linha não faz nada.
      var campo = fs[j].querySelector('[name="' + CAMPO_FORM + '"]');
      if (campo && !campo.value) campo.value = cod;
    }
  }

  // Rede de segurança: qualquer link tocado é carimbado no instante do toque,
  // mesmo que tenha nascido depois da varredura ou tenha sido reescrito por
  // outro script da página (é o caso de /quermesse/obrigado/, que monta o
  // href do botão de WhatsApp em JavaScript).
  function aoTocar(ev) {
    var cod = codigoAtual();
    if (!cod) return;
    var el = ev.target;
    while (el && el.nodeType === 1 &&
           !(el.tagName === 'A' && el.hasAttribute('href'))) el = el.parentNode;
    if (!el || el.nodeType !== 1 || el.tagName !== 'A') return;
    marcarUm(el, cod, 'href');
  }

  function aoEnviar(ev) {
    var cod = codigoAtual();
    if (!cod) return;
    var f = ev.target;
    if (!f || f.nodeType !== 1 || f.tagName !== 'FORM') return;
    if (f.hasAttribute('action')) marcarUm(f, cod, 'action');
    var campo = f.querySelector('[name="' + CAMPO_FORM + '"]');
    if (campo && !campo.value) campo.value = cod;
  }

  function beacon(cod) {
    if (!URL_SISTEMA) return;               // desligado: não fala com servidor
    var s = caixa('sessionStorage');
    var marca = CHAVE + '_scan';
    if (s) { try { if (s.getItem(marca) === cod) return; s.setItem(marca, cod); } catch (e) {} }
    try { (new Image()).src = URL_SISTEMA.replace(/\/+$/, '') + '/w/' + cod + '?px=1'; }
    catch (e) {}
  }

  /* ── partida ─────────────────────────────────────────────────────────── */

  var daUrl = codigoDaUrl();
  if (daUrl) { guardar(daUrl); beacon(daUrl); }

  // Ouvintes de captura ANTES de qualquer varredura: valem desde o começo do
  // parse, então o toque precoce em conexão ruim já sai carimbado.
  document.addEventListener('click', aoTocar, true);
  document.addEventListener('auxclick', aoTocar, true);      // botão do meio
  document.addEventListener('contextmenu', aoTocar, true);   // "copiar link"
  document.addEventListener('submit', aoEnviar, true);

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', aplicar);
  } else {
    aplicar();
  }
  // Segunda passada depois do load: pega link criado por script tardio.
  window.addEventListener('load', aplicar);

  // Exposto SÓ para conferência no console (window.VA_ATRIB.codigo()).
  window.VA_ATRIB = {
    codigo: codigoAtual, codigoDaUrl: codigoDaUrl, aplicar: aplicar,
    ehWhatsApp: ehWhatsApp, ehInterno: ehInterno,
    marcarWhatsApp: marcarWhatsApp, marcarInterno: marcarInterno
  };
})();
