/* GERA-FAQ — o FAQPage do JSON-LD repete, pergunta a pergunta, o FAQ que o
   visitante lê na página.

   Regra do site: FAQ visível = FAQPage, e a verdade é o que está na página.
   Para cada página (URLs do sitemap.xml + index.html que ainda não entraram
   nele):
   1. lê os pares pergunta/resposta VISÍVEIS;
   2. acha o bloco FAQPage do JSON-LD;
   3. se o FAQPage já diz o mesmo que o visível, não toca em nada (compara o
      texto normalizado; o texto do JSON-LD vale lido como texto puro ou como
      HTML, então o FAQPage escrito por outro gerador com entidade ou tag de
      trecho não é regravado à toa); se não, regrava só o "mainEntity": mesmas
      perguntas, mesma ordem, resposta = texto visível sem tags, com entidades
      decodificadas e espaços colapsados (o texto dos links fica). O formato
      do bloco (uma linha ou identado) é copiado do que já estava; o resto do
      bloco e da página não muda.

   Marcações de FAQ reconhecidas (inventário das páginas em 11/10/2026):
   a) <details><summary>Pergunta</summary> resposta </details> dentro de um
      bloco de FAQ — elemento com classe ou id contendo "faq", "perguntas" ou
      "duvidas" (.faq-geo, .faq, #faq…), ou caixa que traz, antes do
      <details>, o título "Perguntas frequentes" / "Dúvidas frequentes" /
      "FAQ". É o caso das fichas, dos artigos, da home, do Observatório e das
      páginas de categoria geradas;
   b) <div class="faq-item"><h3>Pergunta</h3><p>resposta</p></div> — páginas
      de loteamentos, de condomínios e o mapa de lotes;
   c) <dl> com <dt>/<dd> dentro de um bloco de FAQ;
   d) bloco de FAQ sem nada disso: cada <h3>…<h6> é a pergunta e o que vem
      até o próximo título é a resposta.
   <details> fora de bloco de FAQ (ex.: "Ver como tabela") e <dl> de ficha
   técnica não são FAQ.

   O que NÃO faz: não cria FAQPage em página que não tem; não mexe em página
   com FAQPage cujo FAQ visível não foi reconhecido (avisa e lista); não toca
   em JSON-LD dentro de <!--GEN:entidade-->.

   Ritual (ordem): hero-leve.py → gera-folheto → gera-observatorio → gera-home →
   gera-apartamentos → gera-alphaville → gera-blog-ofertas → gera-blog-indice →
   gera-relacionados → hero-leve.py --aplicar → node gera-faq.js → mapa-lotes/gera-lista-indexavel.py →
   gera-sitemap → identidade.js (último).
   Entra depois de todo gerador que escreve texto de FAQ e antes do
   gera-sitemap, que lê o JSON-LD para decidir a data de cada página.
   Idempotente: rodado duas vezes, a segunda não muda nenhum byte. Preserva o
   BOM e o fim de linha de cada arquivo.

   Uso: node gera-faq.js [pasta-raiz] [--ensaio] [--detalhe]
     pasta-raiz  1º argumento ou variável de ambiente RAIZ_SITE; sem nenhum
                 dos dois, a pasta deste script
     --ensaio    mostra o que mudaria e não grava
     --detalhe   uma linha por página, com o número de pares e o que diferia

   Para o validador e outros geradores:
     const { normalizar, paresVisiveis, faqDoJsonLd, diferencasFaq } = require('./gera-faq.js') */
const fs = require('fs');
const path = require('path');

const DOMINIO = 'https://lancamentos.imoveisvivamerica.com.br/';
const FORA = /^(ferramentas|qrcode|quermesse|seo|node_modules|\.git|\.claude|folder|treinamento)(\/|$)/;

// ─── texto: o mesmo critério para o que se lê na página e para o JSON-LD ───
const ENT = {
  amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: '\u00A0', shy: '\u00AD',
  iexcl: '¡', cent: '¢', pound: '£', curren: '¤', yen: '¥', brvbar: '¦', sect: '§', uml: '¨', copy: '©', ordf: 'ª',
  laquo: '«', not: '¬', reg: '®', macr: '¯', deg: '°', plusmn: '±', sup2: '²', sup3: '³', acute: '´', micro: 'µ',
  para: '¶', middot: '·', cedil: '¸', sup1: '¹', ordm: 'º', raquo: '»', frac14: '¼', frac12: '½', frac34: '¾', iquest: '¿',
  Agrave: 'À', Aacute: 'Á', Acirc: 'Â', Atilde: 'Ã', Auml: 'Ä', Aring: 'Å', AElig: 'Æ', Ccedil: 'Ç', Egrave: 'È', Eacute: 'É',
  Ecirc: 'Ê', Euml: 'Ë', Igrave: 'Ì', Iacute: 'Í', Icirc: 'Î', Iuml: 'Ï', ETH: 'Ð', Ntilde: 'Ñ', Ograve: 'Ò', Oacute: 'Ó',
  Ocirc: 'Ô', Otilde: 'Õ', Ouml: 'Ö', times: '×', Oslash: 'Ø', Ugrave: 'Ù', Uacute: 'Ú', Ucirc: 'Û', Uuml: 'Ü', Yacute: 'Ý',
  THORN: 'Þ', szlig: 'ß', agrave: 'à', aacute: 'á', acirc: 'â', atilde: 'ã', auml: 'ä', aring: 'å', aelig: 'æ', ccedil: 'ç',
  egrave: 'è', eacute: 'é', ecirc: 'ê', euml: 'ë', igrave: 'ì', iacute: 'í', icirc: 'î', iuml: 'ï', eth: 'ð', ntilde: 'ñ',
  ograve: 'ò', oacute: 'ó', ocirc: 'ô', otilde: 'õ', ouml: 'ö', divide: '÷', oslash: 'ø', ugrave: 'ù', uacute: 'ú', ucirc: 'û',
  uuml: 'ü', yacute: 'ý', thorn: 'þ', yuml: 'ÿ',
  ndash: '–', mdash: '—', lsquo: '‘', rsquo: '’', sbquo: '‚', ldquo: '“', rdquo: '”', bdquo: '„', dagger: '†', Dagger: '‡',
  bull: '•', hellip: '…', permil: '‰', prime: '′', Prime: '″', lsaquo: '‹', rsaquo: '›', oline: '‾', frasl: '⁄', euro: '€',
  trade: '™', larr: '←', uarr: '↑', rarr: '→', darr: '↓', harr: '↔', rArr: '⇒', minus: '−', le: '≤', ge: '≥', ne: '≠',
  asymp: '≈', infin: '∞', check: '✓', ensp: '\u2002', emsp: '\u2003', thinsp: '\u2009', zwnj: '\u200C', zwj: '\u200D',
};
function decodificar(s) {
  return s.replace(/&(#[xX][0-9a-fA-F]+|#\d+|[a-zA-Z][a-zA-Z0-9]*);/g, (m, e) => {
    if (e[0] === '#') {
      const n = /^#x/i.test(e) ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10);
      return n > 0 && n <= 0x10FFFF ? String.fromCodePoint(n) : m;
    }
    return Object.prototype.hasOwnProperty.call(ENT, e) ? ENT[e] : m;
  });
}
const ATRIBUTOS = '(?:"[^"]*"|\'[^\']*\'|[^>"\'])*';
const RE_TAG = new RegExp('<\\/?[a-zA-Z][a-zA-Z0-9-]*(?=[\\s/>])' + ATRIBUTOS + '>', 'g');
// tag que quebra linha na tela vira espaço; tag de trecho (strong, a, span…) some sem deixar espaço
const RE_TAG_BLOCO = new RegExp('<\\/?(?:address|article|aside|blockquote|br|dd|details|div|dl|dt|figcaption|figure|footer|h[1-6]|header|hr|li|main|nav|ol|p|pre|section|summary|table|tbody|td|tfoot|th|thead|tr|ul)(?=[\\s/>])' + ATRIBUTOS + '>', 'gi');

// sem caracteres invisíveis (hífen opcional, espaço de largura zero) e com os espaços colapsados
const limpar = s => String(s == null ? '' : s).replace(/[\u00AD\u200B\uFEFF]/g, '').replace(/\s+/g, ' ').trim();

// Texto como o visitante lê um trecho de HTML: sem comentários, scripts e tags,
// com as entidades decodificadas, sem caracteres invisíveis e com os espaços
// colapsados. É o texto que vai para o FAQPage.
function normalizar(s) {
  return limpar(decodificar(String(s == null ? '' : s)
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<(script|style|template|noscript|svg)\b[\s\S]*?<\/\1\s*>/gi, ' ')
    .replace(/<([a-zA-Z][a-zA-Z0-9]*)\b(?=[^>]*(?:\shidden(?=[\s=>\/])|\sstyle\s*=\s*["'][^"']*display\s*:\s*none))[^>]*>[\s\S]*?<\/\1\s*>/g, ' ')
    .replace(RE_TAG_BLOCO, ' ')
    .replace(RE_TAG, '')));
}

// ─── árvore mínima do HTML (só elementos, com a posição de cada um no arquivo) ───
const VAZIOS = new Set('area base br col embed hr img input link meta param source track wbr'.split(' '));
const CRUS = new Set(['script', 'style', 'textarea', 'title', 'template', 'noscript']);   // conteúdo que não é lido como HTML
const FECHA_P = new Set('address article aside blockquote details div dl fieldset figcaption figure footer form h1 h2 h3 h4 h5 h6 header hr main nav ol p pre section table ul'.split(' '));
const RE_MARCA = '<!--[\\s\\S]*?-->|<!\\[CDATA\\[[\\s\\S]*?\\]\\]>|<![^>]*>|<\\/([a-zA-Z][a-zA-Z0-9-]*)\\s*>|<([a-zA-Z][a-zA-Z0-9-]*)(' + ATRIBUTOS + ')>';

function arvore(html) {
  const raiz = { tag: '#raiz', attrs: '', filhos: [], pai: null, ini: 0, iniDentro: 0, fimDentro: html.length, fim: html.length };
  let no = raiz;
  const fechar = (ate, pos, fimTag) => {          // fecha do nó atual até `ate`, inclusive
    for (let x = no; ; x = x.pai) {
      x.fimDentro = pos;
      x.fim = x === ate ? fimTag : pos;
      if (x === ate) break;
    }
    no = ate.pai;
  };
  const re = new RegExp(RE_MARCA, 'g');
  let m;
  while ((m = re.exec(html))) {
    if (m[1]) {
      const t = m[1].toLowerCase();
      let alvo = no;
      while (alvo !== raiz && alvo.tag !== t) alvo = alvo.pai;
      if (alvo !== raiz) fechar(alvo, m.index, re.lastIndex);       // </x> sem <x> aberto é ignorado
    } else if (m[2]) {
      const t = m[2].toLowerCase();
      if (no.tag === 'p' && FECHA_P.has(t)) fechar(no, m.index, m.index);
      else if ((t === 'li' && no.tag === 'li') || (/^d[dt]$/.test(t) && /^d[dt]$/.test(no.tag))) fechar(no, m.index, m.index);
      const el = { tag: t, attrs: m[3] || '', filhos: [], pai: no, ini: m.index, iniDentro: re.lastIndex, fimDentro: null, fim: null };
      no.filhos.push(el);
      if (CRUS.has(t)) {
        const fecha = new RegExp('<\\/' + t + '\\s*>', 'ig');
        fecha.lastIndex = re.lastIndex;
        const f = fecha.exec(html);
        el.fimDentro = f ? f.index : html.length;
        el.fim = f ? fecha.lastIndex : html.length;
        re.lastIndex = el.fim;
      } else if (VAZIOS.has(t) || /\/\s*$/.test(el.attrs)) {
        el.fimDentro = el.iniDentro; el.fim = el.iniDentro;
      } else no = el;
    }
  }
  for (let x = no; x !== raiz; x = x.pai) { x.fimDentro = html.length; x.fim = html.length; }   // o que ficou aberto
  return raiz;
}
const attr = (el, nome) => {
  const m = el.attrs.match(new RegExp('(?:^|\\s)' + nome + '\\s*=\\s*(?:"([^"]*)"|\'([^\']*)\'|([^\\s"\'>]+))', 'i'));
  return m ? (m[1] != null ? m[1] : m[2] != null ? m[2] : m[3]) : null;
};
const classes = el => (attr(el, 'class') || '').split(/\s+/).filter(Boolean);
const oculto = el => /(?:^|\s)hidden(?:\s|=|$)/i.test(el.attrs.replace(/"[^"]*"|'[^']*'/g, '""')) || /display\s*:\s*none/i.test(attr(el, 'style') || '');

// ─── FAQ visível ───
const RE_BLOCO_FAQ = /faq|perguntas|d[uú]vidas/i;                    // classe ou id do bloco
const RE_ITEM_FAQ = /^faq[-_]?(item|par|bloco|qa)$/i;                // classe de um par pergunta/resposta
const RE_TITULO_FAQ = /perguntas\s+(?:mais\s+)?frequentes|d[uú]vidas\s+(?:mais\s+)?frequentes|perguntas\s+e\s+respostas|\bfaq\b/i;
const CAIXAS = new Set(['section', 'article', 'aside', 'div']);       // quem pode ser um bloco de FAQ na marcação (d)
const ehBlocoFaq = el => RE_BLOCO_FAQ.test((attr(el, 'class') || '') + ' ' + (attr(el, 'id') || ''));

// Devolve { pares: [{ q, a, tipo }], avisos: [] } na ordem em que aparecem na página.
function paresVisiveis(html) {
  const raiz = arvore(html);
  const pares = [], avisos = [];
  const texto = (a, b) => normalizar(html.slice(a, b));
  const por = (q, a, tipo, el) => pares.push({ q, a, tipo, pos: el.ini });
  const primeiro = (el, re) => {
    for (const f of el.filhos) {
      if (re.test(f.tag)) return f;
      const d = primeiro(f, re);
      if (d) return d;
    }
    return null;
  };
  // seção sem classe de FAQ, mas com título "Perguntas frequentes": o título vem
  // antes do <details> e é filho direto de uma das caixas que o envolvem, até a
  // <section> mais próxima. <body> e <main> não valem como caixa: o título de uma
  // seção não transforma em FAQ os <details> do resto da página.
  const tituloFaqPerto = el => {
    for (let c = el.pai; c && !/^(#raiz|html|body|main)$/.test(c.tag); c = c.pai) {
      if (c.filhos.some(t => /^h[1-4]$/.test(t.tag) && t.ini < el.ini && RE_TITULO_FAQ.test(texto(t.iniDentro, t.fimDentro)))) return true;
      if (/^(section|article|aside)$/.test(c.tag)) break;
    }
    return false;
  };
  const paresDl = dl => {
    const seq = [];
    (function colher(e) { for (const f of e.filhos) { if (f.tag === 'dt' || f.tag === 'dd') seq.push(f); else colher(f); } })(dl);
    let dt = null, resp = [];
    const fecharPar = () => { if (dt) por(texto(dt.iniDentro, dt.fimDentro), resp.join(' ').trim(), 'dl', dt); dt = null; resp = []; };
    for (const f of seq) {
      if (f.tag === 'dt') { fecharPar(); dt = f; }
      else if (dt) resp.push(texto(f.iniDentro, f.fimDentro));
    }
    fecharPar();
  };
  const topos = [];      // blocos de FAQ mais externos, candidatos à marcação (d)
  (function andar(el, emFaq) {
    for (const f of el.filhos) {
      if (CRUS.has(f.tag) || oculto(f)) continue;
      const marca = ehBlocoFaq(f);
      if (f.tag === 'details') {
        const sum = f.filhos.find(x => x.tag === 'summary');
        if (sum && (emFaq || marca || tituloFaqPerto(f))) por(texto(sum.iniDentro, sum.fimDentro), texto(sum.fim, f.fimDentro), 'details', f);
        continue;                                   // nunca desce em <details>
      }
      if (classes(f).some(c => RE_ITEM_FAQ.test(c))) {
        const cab = primeiro(f, /^(h[2-6]|dt|summary|button)$/);
        if (cab) { por(texto(cab.iniDentro, cab.fimDentro), texto(cab.fim, f.fimDentro), 'item', f); continue; }
      }
      if (f.tag === 'dl' && (emFaq || marca)) { paresDl(f); continue; }
      if (marca && !emFaq && CAIXAS.has(f.tag)) topos.push(f);
      andar(f, emFaq || marca);
    }
  })(raiz, false);
  // (d) bloco de FAQ em que nada acima foi achado: títulos h3–h6 + o que vem depois
  for (const b of topos) {
    if (pares.some(p => p.pos >= b.ini && p.pos < b.fim)) continue;
    const titulos = [];
    (function colher(e) {
      for (const f of e.filhos) {
        if (CRUS.has(f.tag) || oculto(f)) continue;
        if (/^h[3-6]$/.test(f.tag)) titulos.push(f); else colher(f);
      }
    })(b);
    titulos.forEach((t, i) => {
      const prox = titulos[i + 1];
      const fim = prox && prox.pai === t.pai ? prox.ini : t.pai.fimDentro;
      const q = texto(t.iniDentro, t.fimDentro), a = texto(t.fim, fim);
      if (q && a) por(q, a, 'titulo', t);
    });
  }
  pares.sort((x, y) => x.pos - y.pos);
  const vistos = new Map(), saida = [];
  for (const p of pares) {
    if (!p.q || !p.a) { avisos.push('par visível sem ' + (p.q ? 'resposta' : 'pergunta') + ' (ignorado): ' + (p.q || p.a).slice(0, 60)); continue; }
    if (vistos.has(p.q)) {                           // o FAQPage leva cada pergunta uma vez: vale a primeira
      avisos.push((vistos.get(p.q) === p.a ? 'pergunta repetida na página (contada uma vez): ' : 'mesma pergunta com duas respostas diferentes na página (vale a primeira): ') + p.q.slice(0, 60));
      continue;
    }
    vistos.set(p.q, p.a);
    const sobra = (p.q + ' ' + p.a).match(/&[a-zA-Z][a-zA-Z0-9]*;/);
    if (sobra) avisos.push('entidade HTML que este gerador não conhece (' + sobra[0] + ') foi para o FAQPage como está: ' + p.q.slice(0, 60));
    saida.push({ q: p.q, a: p.a, tipo: p.tipo });
  }
  return { pares: saida, avisos };
}

// ─── FAQPage do JSON-LD ───
// Leitor de JSON que guarda a posição de cada valor no texto, para trocar só o mainEntity.
function varrerJson(src) {
  let i = 0;
  const erro = oq => new Error('JSON: ' + oq + ' na posição ' + i);
  const pular = () => { while (i < src.length && /\s/.test(src[i])) i++; };
  function valor() {
    pular();
    const ini = i, c = src[i];
    if (c === '{') {
      i++;
      const chaves = {};
      pular();
      if (src[i] === '}') { i++; return { tipo: 'obj', ini, fim: i, chaves }; }
      for (;;) {
        const k = valor();
        if (k.tipo !== 'str') throw erro('chave sem aspas');
        pular();
        if (src[i] !== ':') throw erro('falta ":"');
        i++;
        chaves[k.valor] = valor();
        pular();
        if (src[i] === ',') { i++; continue; }
        if (src[i] === '}') { i++; break; }
        throw erro('falta "," ou "}"');
      }
      return { tipo: 'obj', ini, fim: i, chaves };
    }
    if (c === '[') {
      i++;
      const itens = [];
      pular();
      if (src[i] === ']') { i++; return { tipo: 'arr', ini, fim: i, itens }; }
      for (;;) {
        itens.push(valor());
        pular();
        if (src[i] === ',') { i++; continue; }
        if (src[i] === ']') { i++; break; }
        throw erro('falta "," ou "]"');
      }
      return { tipo: 'arr', ini, fim: i, itens };
    }
    if (c === '"') {
      i++;
      while (i < src.length && src[i] !== '"') i += src[i] === '\\' ? 2 : 1;
      if (i >= src.length) throw erro('texto sem fechar');
      i++;
      return { tipo: 'str', ini, fim: i, valor: JSON.parse(src.slice(ini, i)) };
    }
    const m = /^(?:-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?|true|false|null)/.exec(src.slice(i, i + 40));
    if (!m) throw erro('valor inesperado');
    i += m[0].length;
    return { tipo: 'lit', ini, fim: i, valor: JSON.parse(m[0]) };
  }
  const v = valor();
  pular();
  if (i !== src.length) throw erro('sobra de texto');
  return v;
}
const ehFaqPage = no => {
  if (no.tipo !== 'obj' || !no.chaves['@type']) return false;
  const t = no.chaves['@type'];
  return t.tipo === 'str' ? t.valor === 'FAQPage' : t.tipo === 'arr' && t.itens.some(x => x.tipo === 'str' && x.valor === 'FAQPage');
};
function nosFaqPage(no, achados) {
  if (no.tipo === 'arr') no.itens.forEach(x => nosFaqPage(x, achados));
  else if (no.tipo === 'obj') {
    if (ehFaqPage(no)) achados.push(no);
    else for (const k of Object.keys(no.chaves)) nosFaqPage(no.chaves[k], achados);
  }
  return achados;
}
const RE_LD = new RegExp('(<script\\b' + ATRIBUTOS + '>)([\\s\\S]*?)<\\/script\\s*>', 'gi');
const ehLd = abre => /type\s*=\s*["']?application\/ld\+json/i.test(abre);

// Blocos FAQPage da página: [{ ini, fim, corpo, no, perguntas: [{ q, a, qPuro, aPuro }] }].
// ini/fim são a posição do corpo do <script> no arquivo; q/a trazem o texto do
// JSON-LD lido como HTML (normalizar) e qPuro/aPuro, lido como texto puro. O bloco
// da entidade (<!--GEN:entidade-->) nunca entra.
function faqDoJsonLd(html) {
  const zonas = [];
  const reZona = /<!--GEN:entidade-->[\s\S]*?<!--\/GEN:entidade-->/g;
  let z;
  while ((z = reZona.exec(html))) zonas.push([z.index, reZona.lastIndex]);
  const reComentario = /<!--[\s\S]*?-->/g;
  while ((z = reComentario.exec(html))) if (/<script\b/i.test(z[0])) zonas.push([z.index, reComentario.lastIndex]);
  const blocos = [], invalidos = [];
  const re = new RegExp(RE_LD.source, 'gi');
  let m;
  while ((m = re.exec(html))) {
    if (!ehLd(m[1])) continue;
    if (zonas.some(([a, b]) => m.index >= a && m.index < b)) continue;
    const ini = m.index + m[1].length, corpo = m[2];
    if (!/FAQPage/.test(corpo)) continue;
    let raiz;
    try { JSON.parse(corpo); raiz = varrerJson(corpo); } catch (e) { invalidos.push(String(e.message).slice(0, 80)); continue; }
    for (const no of nosFaqPage(raiz, [])) {
      const me = no.chaves.mainEntity;
      const itens = !me ? [] : me.tipo === 'arr' ? me.itens : [me];
      const perguntas = itens.filter(x => x.tipo === 'obj').map(x => {
        const n = x.chaves.name, aa = x.chaves.acceptedAnswer;
        const t = aa && aa.tipo === 'obj' ? aa.chaves.text : null;
        const qv = n && n.tipo === 'str' ? n.valor : '', av = t && t.tipo === 'str' ? t.valor : '';
        return { q: normalizar(qv), a: normalizar(av), qPuro: limpar(qv), aPuro: limpar(av) };
      });
      blocos.push({ ini, fim: ini + corpo.length, corpo, no, perguntas });
    }
  }
  return { blocos, invalidos };
}

// Lista, em frases, o que o FAQPage tem de diferente do FAQ visível. Vazia = iguais.
// visiveis: pares de paresVisiveis(); doLd: perguntas de faqDoJsonLd(). O texto do
// JSON-LD vale nas duas leituras: como texto puro (o que este gerador grava) e
// como HTML (o que outros geradores gravam, com entidade ou tag de trecho).
function diferencasFaq(visiveis, doLd) {
  const difs = [];
  const corta = s => s.length > 60 ? s.slice(0, 57) + '…' : s;
  const vis = new Map(visiveis.map(p => [p.q, p.a]));
  const chave = p => (p.qPuro != null && vis.has(p.qPuro) ? p.qPuro : p.q);
  const mesmaResposta = (p, a) => a === p.a || (p.aPuro != null && a === p.aPuro);
  const ld = new Set(doLd.map(chave));
  for (const p of doLd) {
    if (!vis.has(chave(p))) difs.push('FAQPage com pergunta que a página não mostra: ' + corta(p.q));
    else if (!mesmaResposta(p, vis.get(chave(p)))) difs.push('FAQPage com resposta diferente da visível: ' + corta(p.q));
  }
  for (const p of visiveis) if (!ld.has(p.q)) difs.push('pergunta visível fora do FAQPage: ' + corta(p.q));
  if (!difs.length && (visiveis.length !== doLd.length || visiveis.some((p, i) => p.q !== chave(doLd[i]) || !mesmaResposta(doLd[i], p.a)))) {
    difs.push('FAQPage em ordem diferente da visível (ou com pergunta repetida)');
  }
  return difs;
}

// texto JSON de uma string, seguro dentro de <script>
const literal = s => JSON.stringify(s).replace(/<(?=[\/!])/g, '\\u003c').replace(/\u2028/g, '\\u2028').replace(/\u2029/g, '\\u2029');

// Novo texto do mainEntity, no formato do que já estava: o 1º item antigo serve
// de molde (só as duas strings mudam) e o separador entre itens é o que havia.
function textoMainEntity(corpo, me, pares) {
  const strDe = (o, k) => o && o.tipo === 'obj' && o.chaves[k] && o.chaves[k].tipo === 'str' ? o.chaves[k] : null;
  let antes, sep, depois, montar;
  const e0 = me.tipo === 'arr' ? me.itens[0] : null;
  const n0 = strDe(e0, 'name'), t0 = e0 && strDe(e0.chaves.acceptedAnswer, 'text');
  const soAsChaves = (o, lista) => Object.keys(o.chaves).every(k => lista.includes(k));
  if (n0 && t0 && soAsChaves(e0, ['@type', 'name', 'acceptedAnswer']) && soAsChaves(e0.chaves.acceptedAnswer, ['@type', 'text'])) {
    const [a, b] = n0.ini < t0.ini ? [n0, t0] : [t0, n0];
    const p1 = corpo.slice(e0.ini, a.ini), p2 = corpo.slice(a.fim, b.ini), p3 = corpo.slice(b.fim, e0.fim);
    montar = p => p1 + literal(a === n0 ? p.q : p.a) + p2 + literal(b === n0 ? p.q : p.a) + p3;
    antes = corpo.slice(me.ini + 1, e0.ini);
    sep = me.itens.length > 1 ? corpo.slice(e0.fim, me.itens[1].ini) : ',' + antes;
    depois = corpo.slice(me.itens[me.itens.length - 1].fim, me.fim - 1);
  } else if (/\n/.test(corpo.trim())) {              // bloco identado sem item que sirva de molde
    const linha = corpo.slice(corpo.lastIndexOf('\n', me.ini) + 1, me.ini);
    const base = (linha.match(/^[ \t]*/) || [''])[0];
    montar = p => '{ "@type": "Question", "name": ' + literal(p.q) + ', "acceptedAnswer": { "@type": "Answer", "text": ' + literal(p.a) + ' } }';
    const nl = /\r\n/.test(corpo) ? '\r\n' : '\n';
    antes = nl + base + '  '; sep = ',' + nl + base + '  '; depois = nl + base;
  } else {                                           // bloco em uma linha
    montar = p => '{"@type":"Question","name":' + literal(p.q) + ',"acceptedAnswer":{"@type":"Answer","text":' + literal(p.a) + '}}';
    antes = ''; sep = ','; depois = '';
  }
  return '[' + antes + pares.map(montar).join(sep) + depois + ']';
}

// Estado de uma página: 'sem-faqpage' | 'json-invalido' | 'varios-faqpage' |
// 'sem-mainentity' | 'nao-reconhecido' | 'igual' | 'regravar'
function examinar(html) {
  const { blocos, invalidos } = faqDoJsonLd(html);
  const r = { estado: 'sem-faqpage', html, pares: [], antes: [], difs: [], avisos: [] };
  if (invalidos.length) { r.estado = 'json-invalido'; r.avisos.push('JSON-LD com FAQPage inválido: ' + invalidos[0]); return r; }
  if (!blocos.length) return r;
  r.antes = blocos[0].perguntas;
  if (blocos.length > 1) { r.estado = 'varios-faqpage'; r.avisos.push(blocos.length + ' blocos FAQPage na mesma página (deixe um só)'); return r; }
  const vis = paresVisiveis(html);
  r.pares = vis.pares;
  r.avisos = vis.avisos;
  if (!vis.pares.length) { r.estado = 'nao-reconhecido'; return r; }
  const b = blocos[0];
  r.difs = diferencasFaq(vis.pares, b.perguntas);
  if (!r.difs.length) { r.estado = 'igual'; return r; }
  const me = b.no.chaves.mainEntity;
  if (!me || (me.tipo !== 'arr' && me.tipo !== 'obj')) { r.estado = 'sem-mainentity'; r.avisos.push('FAQPage sem "mainEntity"'); return r; }
  const corpo = b.corpo.slice(0, me.ini) + textoMainEntity(b.corpo, me, vis.pares) + b.corpo.slice(me.fim);
  JSON.parse(corpo);                                 // o bloco novo tem de continuar JSON válido
  r.html = html.slice(0, b.ini) + corpo + html.slice(b.fim);
  r.estado = r.html === html ? 'igual' : 'regravar';
  return r;
}

// ─── páginas: sitemap.xml + index.html que ainda não estão nele ───
function listarPaginas(raiz) {
  const rels = new Set(), semArquivo = [];
  const sm = path.join(raiz, 'sitemap.xml');
  if (fs.existsSync(sm)) {
    for (const m of fs.readFileSync(sm, 'utf8').matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/g)) {
      if (!m[1].startsWith(DOMINIO)) continue;
      const resto = m[1].slice(DOMINIO.length).replace(/[?#].*$/, '').replace(/\/$/, '');
      const rel = /\.html?$/.test(resto) ? resto : (resto ? resto + '/' : '') + 'index.html';
      if (fs.existsSync(path.join(raiz, rel))) rels.add(rel); else semArquivo.push(rel);
    }
  }
  const noSitemap = rels.size;
  (function andar(d) {
    for (const n of fs.readdirSync(d, { withFileTypes: true })) {
      const p = path.join(d, n.name);
      const rel = path.relative(raiz, p).split(path.sep).join('/');
      if (n.isDirectory()) { if (!FORA.test(rel)) andar(p); }
      else if (n.name === 'index.html') rels.add(rel);
    }
  })(raiz);
  return { paginas: [...rels].sort(), noSitemap, semArquivo };
}

function main() {
  const args = process.argv.slice(2);
  const ensaio = args.includes('--ensaio'), detalhe = args.includes('--detalhe'), forcar = args.includes('--forcar');
  const pasta = args.find(a => !a.startsWith('--')) || process.env.RAIZ_SITE || __dirname;
  const RAIZ = path.resolve(pasta);
  if (!fs.existsSync(path.join(RAIZ, 'index.html'))) throw new Error('gera-faq: não achei index.html em ' + RAIZ);
  const { paginas, noSitemap, semArquivo } = listarPaginas(RAIZ);
  const nome = rel => '/' + rel.replace(/index\.html$/, '');
  const cont = { faqpage: 0, regravadas: 0, iguais: 0, pares: 0 };
  const regravadas = [], naoRec = [], avisos = [], linhas = [], retidas = [];
  for (const rel of semArquivo) avisos.push(nome(rel) + ' está no sitemap.xml e não tem arquivo');
  for (const rel of paginas) {
    const arq = path.join(RAIZ, rel);
    const bruto = fs.readFileSync(arq);
    const html = bruto.toString('utf8');
    if (!Buffer.from(html, 'utf8').equals(bruto)) { avisos.push(nome(rel) + ' não é UTF-8 válido: não examinada'); continue; }
    let r;
    try { r = examinar(html); } catch (e) { avisos.push(nome(rel) + ' não examinada: ' + String(e.message).slice(0, 100)); continue; }
    for (const a of r.avisos) avisos.push(nome(rel) + ' ' + a);
    if (r.estado === 'sem-faqpage') { if (detalhe) linhas.push('  sem FAQPage  ' + nome(rel)); continue; }
    cont.faqpage++;
    if (r.estado === 'nao-reconhecido') { naoRec.push(nome(rel) + ' (' + r.antes.length + ' perguntas no FAQPage)'); continue; }
    if (r.estado === 'igual') { cont.iguais++; cont.pares += r.pares.length; if (detalhe) linhas.push('  já igual     ' + nome(rel) + ' · ' + r.pares.length + ' pares'); continue; }
    if (r.estado !== 'regravar') continue;           // inválido, repetido ou sem mainEntity: já está nos avisos
    // guarda: o leitor do FAQ visível pode ter lido de menos ou de mais; na dúvida, não grava sem --forcar
    const novas = new Set(r.pares.map(p => p.q));
    const corpoLido = normalizar(html.slice(Math.max(0, html.search(/<body[\s>]/i))));
    const ficou = r.antes.filter(p => p.q && !novas.has(p.q) && !novas.has(p.qPuro) && corpoLido.includes(p.q) && !r.pares.some(n => n.q.includes(p.q)));
    const semInterrog = r.pares.filter(p => !/\?\s*$/.test(p.q));
    if ((ficou.length || semInterrog.length) && !forcar) {
      retidas.push(nome(rel) + ' (' + r.antes.length + '→' + r.pares.length + ')' +
        (ficou.length ? '\n      sai do FAQPage e continua escrita na página: ' + ficou.map(p => p.q.slice(0, 60)).join(' | ') : '') +
        (semInterrog.length ? '\n      pergunta sem "?" (pode não ser FAQ): ' + semInterrog.map(p => p.q.slice(0, 60)).join(' | ') : ''));
      continue;
    }
    if (!ensaio) fs.writeFileSync(arq, r.html, 'utf8');
    cont.regravadas++; cont.pares += r.pares.length;
    regravadas.push(nome(rel) + ' (' + r.antes.length + '→' + r.pares.length + ')');
    if (detalhe) linhas.push('  ' + (ensaio ? 'regravaria   ' : 'regravada    ') + nome(rel) + ' · ' + r.antes.length + ' no FAQPage → ' + r.pares.length + ' pares visíveis\n      ' + r.difs.join('\n      '));
  }
  console.log('gera-faq: ' + paginas.length + ' páginas (' + noSitemap + ' do sitemap) · ' + cont.faqpage + ' com FAQPage · ' +
    cont.regravadas + (ensaio ? ' a regravar (ensaio, nada gravado)' : ' regravadas') + ' · ' + cont.iguais + ' já iguais ao visível · ' +
    naoRec.length + ' sem FAQ visível reconhecido · ' + cont.pares + ' pares');
  if (regravadas.length) console.log('  ' + (ensaio ? 'a regravar' : 'regravadas') + ' (perguntas antes→depois): ' + regravadas.join(' · '));
  if (linhas.length) console.log(linhas.join('\n'));
  if (naoRec.length) console.log('SEM FAQ VISÍVEL RECONHECIDO (FAQPage mantido como estava):\n  ' + naoRec.join('\n  '));
  if (avisos.length) console.log('AVISOS:\n  ' + avisos.join('\n  '));
  if (retidas.length) {
    console.log('NÃO REGRAVADAS (o leitor do FAQ visível pode ter errado; confira a página e rode com --forcar se estiver certo):\n  ' + retidas.join('\n  '));
    process.exitCode = 1;
  }
}

if (require.main === module) main();

module.exports = { normalizar, limpar, decodificar, paresVisiveis, faqDoJsonLd, diferencasFaq, examinar, listarPaginas, FORA };
