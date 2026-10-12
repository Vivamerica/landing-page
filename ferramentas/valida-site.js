// Validador do site de lançamentos (recriado em 16/09/2026 dentro do repo — o valida-setembro.js vivia no
// scratchpad e sumiu na limpeza da pasta temporária).
// Uso: node ferramentas/valida-site.js [pasta1 pasta2 ...]   (sem argumento: todas as páginas)
//      --raiz=PASTA ou a variável RAIZ_SITE validam outra cópia do site (padrão: a pasta acima desta).
// Saída: "N páginas · E erros · A avisos". Publicar só com 0 erros.
//
// O que confere, página a página:
//   erro   CRLF · <title> ≠ 1 · sem description · og/twitter ≠ title/description · sem canonical · <h1> ≠ 1 ·
//          JSON-LD inválido · FAQPage diferente do FAQ visível (texto inteiro, pergunta a pergunta, pelo mesmo
//          critério do gera-faq.js) · price/lowPrice do JSON-LD ≠ preço da fonte única (tolerância de R$ 1) ·
//          imagem que não existe · link interno que não leva a arquivo · marcador "[… confirmar …]" no texto ·
//          texto proibido
//   aviso  canonical fora do esperado · title > 60 ou < 30 · description fora de 120–155 · FAQPage sem FAQ
//          visível reconhecido · offerCount/inventoryLevel ≠ estoque da fonte única · escassez ("últimas N
//          unidades", "último lote", "restam N") sem data por perto · link interno que cai em redirecionamento ·
//          imagem > 300 KB · sem linha NAP
const fs = require('fs');
const path = require('path');
const args = process.argv.slice(2);
const argRaiz = args.find(a => a.startsWith('--raiz='));
const R = path.resolve(argRaiz ? argRaiz.slice('--raiz='.length) : process.env.RAIZ_SITE || path.join(__dirname, '..'));
const BASE = 'https://lancamentos.imoveisvivamerica.com.br/';
const FORA = /^(ferramentas|qrcode|seo|node_modules|\.git|folder|treinamento)(\/|$)/;

// O gera-faq.js é o dono do critério de FAQ (como se lê o FAQ visível e como se normaliza o texto).
// Sem ele, o validador volta à conferência antiga, por trecho, só como aviso.
let FAQ = null;
let errosGerais = 0;
try { FAQ = require(path.join(__dirname, '..', 'gera-faq.js')); } catch (e) {
  FAQ = null;
  errosGerais++;
  console.log('ERRO  gera-faq.js não carregou: a regra "FAQPage = FAQ visível" NÃO rodou (' + String(e.message).split('\n')[0].slice(0, 100) + ')');
}

function paginas() {
  const out = [];
  (function andar(d) {
    for (const n of fs.readdirSync(d, { withFileTypes: true })) {
      const p = path.join(d, n.name);
      const rel = path.relative(R, p).split(path.sep).join('/');
      if (n.isDirectory()) { if (!FORA.test(rel)) andar(p); }
      else if (n.name === 'index.html') out.push(rel);
    }
  })(R);
  return out.sort();
}

const des = s => s.replace(/&#x27;|&#39;/g, "'").replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>');
const meta = (h, attr, nome) => { const m = h.match(new RegExp('<meta ' + attr + '="' + nome.replace(/[.:]/g, '\\$&') + '" content="([^"]*)"')); return m ? des(m[1]) : null; };
const texto = h => des(h.replace(/<script[\s\S]*?<\/script>/g, ' ').replace(/<style[\s\S]*?<\/style>/g, ' ').replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ');
// só o que o visitante lê no corpo da página: sem <head>, comentários, scripts e estilos
const semCodigo = h => h.replace(/<!--[\s\S]*?-->/g, ' ').replace(/<(script|style|noscript|template)\b[\s\S]*?<\/\1\s*>/gi, ' ');
const visivel = h => {
  const i = h.search(/<body[\s>]/i);
  const t = semCodigo(i < 0 ? h : h.slice(i)).replace(/<[^>]+>/g, ' ');
  return (FAQ ? FAQ.decodificar(t) : des(t)).replace(/\s+/g, ' ');
};

// ─── fonte única de preço e estoque: APTOS e LOTES do gera-folheto.js, com o mesmo recorte dos geradores ───
let avisosGerais = 0;
function fonteUnica() {
  try {
    const src = fs.readFileSync(path.join(R, 'gera-folheto.js'), 'utf8');
    const extrair = nome => {
      const ini = src.indexOf('const ' + nome + ' = ');
      if (ini < 0) throw new Error(nome + ' não achado');
      const fim = src.indexOf('\n];', ini) + 2;
      return eval('(' + src.slice(ini + ('const ' + nome + ' = ').length, fim) + ')');
    };
    return new Map(extrair('APTOS').concat(extrair('LOTES')).map(e => [e.slug, e]));
  } catch (e) {
    errosGerais++;
    console.log('ERRO  gera-folheto.js: fonte única não lida, preço e estoque do JSON-LD NÃO foram conferidos (' + e.message + ')');
    return null;
  }
}
const FONTE = fonteUnica();

// price/lowPrice, offerCount e inventoryLevel que estão sob uma chave "offers" do JSON-LD.
// Preço por unidade de medida ou por período (UnitPriceSpecification com unidade) não é o preço do imóvel.
function colherOfertas(v, dentro, out) {
  if (Array.isArray(v)) { v.forEach(x => colherOfertas(x, dentro, out)); return; }
  if (!v || typeof v !== 'object') return;
  const unitario = /UnitPriceSpecification/.test(String(v['@type'] || '')) &&
    (v.unitText || v.unitCode || v.referenceQuantity || v.billingDuration || v.billingIncrement);
  for (const k of Object.keys(v)) {
    const x = v[k];
    if (dentro && !unitario && (k === 'price' || k === 'lowPrice') && x != null && typeof x !== 'object') {
      if (x !== '' && isFinite(Number(x))) out.precos.push({ k, n: Number(x) }); else out.ruins.push(k + ' "' + x + '"');
    }
    if (dentro && k === 'offerCount' && x !== '' && isFinite(Number(x))) out.estoques.push({ k, n: Number(x) });
    if (dentro && k === 'inventoryLevel') {
      const n = x && typeof x === 'object' ? x.value : x;
      if (n != null && n !== '' && isFinite(Number(n))) out.estoques.push({ k, n: Number(n) });
    }
    if (k === 'offers' && Array.isArray(x) && x.length > 1) {      // várias ofertas: vale a mais barata
      const sub = { precos: [], estoques: [], ruins: [] };
      colherOfertas(x, true, sub);
      if (sub.precos.length) out.precos.push({ k: 'price (a menor de ' + sub.precos.length + ' ofertas)', n: Math.min(...sub.precos.map(p => p.n)) });
      out.estoques.push(...sub.estoques); out.ruins.push(...sub.ruins);
    } else colherOfertas(x, dentro || k === 'offers', out);
  }
}

// ─── escassez sem data ───
const RE_ESCASSEZ = /(?<![A-Za-zÀ-ÿ])(?:[úu]ltim[oa]s?\s+(?:\d+\s+)?(?:unidades?|lotes?|apartamentos?|aptos?|casas?|salas?|vagas?)|\d+\s+[úu]ltim[oa]s\s+(?:unidades|lotes|apartamentos|aptos|casas|salas|vagas)|restam?\s+(?:apenas\s+|s[oó]\s+|somente\s+)?\d+)/gi;
const RE_DATA = /\d{1,2}\/\d{1,2}\/\d{2,4}|(?:jan|fev|mar|abr|mai|jun|jul|ago|set|out|nov|dez)[a-zç]*\.?(?:\/| de )\d{2,4}|\b(?:de|em)\s+20\d{2}\b/i;
const ANTES = 120, DEPOIS = 160;       // "por perto": a mesma frase ou a vizinha

// ─── redirecionamentos da Netlify (link para eles funciona, mas o certo é apontar para o destino) ───
const REDIRECTS = (() => {
  try {
    return fs.readFileSync(path.join(R, '_redirects'), 'utf8').split(/\r?\n/)
      .map(l => l.trim().split(/\s+/)[0]).filter(p => p && p.startsWith('/'));
  } catch (e) { return []; }
})();
const redireciona = p => REDIRECTS.some(r => r.endsWith('/*') ? (p + '/').startsWith(r.slice(0, -1)) || p === r.slice(0, -2) : p === r || p === r + '/');
function resolve(href) {
  let p = href.split('#')[0].split('?')[0];
  try { p = decodeURIComponent(p); } catch (e) { /* fica como veio */ }
  const arq = path.join(R, p);
  if (fs.existsSync(arq) && fs.statSync(arq).isFile()) return 'ok';
  if (fs.existsSync(path.join(arq, 'index.html')) || (!p.endsWith('/') && fs.existsSync(arq + '.html'))) return 'ok';
  return redireciona(p) ? 'redirect' : 'quebrado';
}

const alvo = args.filter(a => !a.startsWith('--'));
let lista = paginas();
if (alvo.length) lista = lista.filter(f => alvo.some(a => f.startsWith(a.replace(/\/$/, '') + '/') || f === a));
let erros = errosGerais, avisos = avisosGerais, faqDiferente = 0;
for (const f of lista) {
  const h = fs.readFileSync(path.join(R, f), 'utf8');
  const E = [], A = [];
  const noindex = /<meta name="robots" content="[^"]*noindex/.test(h);
  if (h.includes('\r')) E.push('CRLF no arquivo');
  const cabeca = h.split('</head>')[0];
  const titulos = cabeca.match(/<title>([\s\S]*?)<\/title>/g) || [];  // <title> de SVG no corpo não conta
  if (titulos.length !== 1) E.push('title: ' + titulos.length);
  const title = titulos.length ? des(titulos[0].replace(/<\/?title>/g, '')) : '';
  const desc = meta(h, 'name', 'description');
  if (!desc) E.push('sem meta description');
  if (!noindex) {
    const ogt = meta(h, 'property', 'og:title'), ogd = meta(h, 'property', 'og:description');
    if (ogt !== null && ogt !== title) E.push('og:title != title');
    if (ogd !== null && ogd !== desc) E.push('og:description != description');
    const twt = meta(h, 'name', 'twitter:title'), twd = meta(h, 'name', 'twitter:description');
    if (twt !== null && twt !== title) E.push('twitter:title != title');
    if (twd !== null && twd !== desc) E.push('twitter:description != description');
    const can = (h.match(/<link rel="canonical" href="([^"]+)"/) || [])[1];
    const esperado = BASE + f.replace(/index\.html$/, '');
    if (!can) E.push('sem canonical');
    else if (can !== esperado) A.push('canonical ' + can + ' (esperado ' + esperado + ')');
    if (title.length < 30 || title.length > 60) A.push('title ' + title.length + ' (30–60)');
    if (desc && (desc.length < 120 || desc.length > 155)) A.push('description ' + desc.length + ' (120–155)');
  }
  const h1 = (h.match(/<h1[\s>]/g) || []).length;
  if (h1 !== 1) E.push('h1: ' + h1);
  const blocos = [...h.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map(m => m[1]);
  const corpo = texto(h);
  const ofertas = { precos: [], estoques: [], ruins: [] };
  for (const b of blocos) {
    let o;
    try { o = JSON.parse(b); } catch (e) { E.push('JSON-LD inválido: ' + e.message.slice(0, 60)); continue; }
    colherOfertas(o, false, ofertas);
    if (!FAQ && o['@type'] === 'FAQPage') {
      for (const q of o.mainEntity || []) {
        if (!corpo.includes(q.name)) A.push('FAQ sem pergunta visível: ' + q.name.slice(0, 50));
        const a = (q.acceptedAnswer || {}).text || '';
        if (a && !corpo.includes(a.replace(/\s+/g, ' ').slice(0, 80))) A.push('FAQ com resposta diferente da visível: ' + q.name.slice(0, 50));
      }
    }
  }
  // FAQ visível = FAQPage, texto inteiro, pergunta a pergunta
  if (FAQ) {
    const ld = FAQ.faqDoJsonLd(h);
    const vis = FAQ.paresVisiveis(h);
    if (ld.blocos.length > 1) E.push(ld.blocos.length + ' blocos FAQPage na página');
    if (ld.blocos.length && !vis.pares.length) A.push('FAQPage sem FAQ visível reconhecido (' + ld.blocos[0].perguntas.length + ' perguntas)');
    else if (ld.blocos.length) {
      const difs = FAQ.diferencasFaq(vis.pares, ld.blocos[0].perguntas);
      if (difs.length) { faqDiferente++; E.push(...difs); }
    } else if (vis.pares.length > 1) A.push('FAQ visível (' + vis.pares.length + ' perguntas) sem FAQPage');
    for (const a of vis.avisos) A.push('FAQ: ' + a);
  }
  // preço e estoque do JSON-LD contra a fonte única (só nas fichas de empreendimento)
  const emp = FONTE && FONTE.get(f.replace(/\/?index\.html$/, ''));
  if (emp) {
    for (const p of ofertas.precos) {
      if (emp.p == null) E.push('JSON-LD com ' + p.k + ' ' + p.n + ' e a fonte única sem preço');
      else if (Math.abs(p.n - emp.p) > 1) E.push('JSON-LD ' + p.k + ' ' + p.n + ' ≠ preço da fonte única ' + emp.p);
    }
    for (const r of ofertas.ruins) A.push('JSON-LD com preço fora do formato numérico: ' + r);
    if (emp.est != null) for (const s of ofertas.estoques) {
      if (s.n !== emp.est) A.push('JSON-LD ' + s.k + ' ' + s.n + ' ≠ estoque da fonte única ' + emp.est + (emp.estEm ? ' (' + emp.estEm + ')' : ''));
    }
  }
  for (const m of h.matchAll(/<img[^>]+src="([^"]+)"/g)) {
    const src = m[1];
    if (/^(https?:|data:)/.test(src)) continue;
    const p = src.startsWith('/') ? path.join(R, src) : path.join(R, path.dirname(f), src);
    if (!fs.existsSync(p)) { E.push('imagem não existe: ' + src); continue; }
    const kb = fs.statSync(p).size;
    if (kb > 300 * 1024) A.push('img>300KB: ' + src + ' (' + kb + ')');
  }
  if ((h.match(/<style id="landing-extra">/g) || []).length > 1) E.push('<style id="landing-extra"> em dobro (regere a ficha com o gera_landing.py corrigido)');
  // url() dos <style> e de style="", <link rel="preload" as="image">, srcset e imagesrcset
  const refsImg = [];
  for (const m of h.matchAll(/url\(\s*['"]?([^'")]+)['"]?\s*\)/gi)) refsImg.push(m[1]);
  for (const m of h.matchAll(/<link\b[^>]*\brel="preload"[^>]*>/gi)) {
    if (!/\bas="image"/i.test(m[0])) continue;
    const hr = m[0].match(/\shref="([^"]+)"/i);
    if (hr) refsImg.push(hr[1]);
    const is = m[0].match(/\simagesrcset="([^"]+)"/i);
    if (is) is[1].split(',').forEach(x => refsImg.push(x.trim().split(/\s+/)[0]));
  }
  for (const m of h.matchAll(/\ssrcset="([^"]+)"/gi)) m[1].split(',').forEach(x => refsImg.push(x.trim().split(/\s+/)[0]));
  for (const ref of new Set(refsImg)) {
    if (!ref || /^(https?:|data:|blob:|#|\/\/)/i.test(ref)) continue;
    const limpo = ref.split(/[?#]/)[0];
    const p = limpo.startsWith('/') ? path.join(R, limpo) : path.join(R, path.dirname(f), limpo);
    if (!fs.existsSync(p)) E.push('imagem não existe (CSS, preload ou srcset): ' + ref);
  }
  // link interno (href começando com /) tem de levar a um arquivo do site
  const hrefs = new Set([...semCodigo(h).matchAll(/\shref\s*=\s*"(\/[^"]*)"/g)].map(m => m[1]).filter(u => !u.startsWith('//')));
  for (const u of hrefs) {
    const r = resolve(des(u));
    if (r === 'quebrado') E.push('link interno quebrado: ' + u);
    else if (r === 'redirect') A.push('link interno cai em redirecionamento: ' + u);
  }
  const lido = visivel(h);
  for (const m of lido.matchAll(/\[[^\]]{0,60}confirmar[^\]]{0,60}\]/gi)) E.push('marcador por resolver no texto: ' + m[0]);
  // escassez só com data: "últimas N unidades", "último lote", "restam N" pedem o mês ou o dia por perto
  for (const m of lido.matchAll(RE_ESCASSEZ)) {
    if (/["“”«'‘]/.test(lido[m.index - 1] || '')) continue;        // expressão citada entre aspas, não uma oferta
    const ctx = lido.slice(Math.max(0, m.index - ANTES), m.index + m[0].length + DEPOIS);
    if (!RE_DATA.test(ctx)) A.push('escassez sem data por perto: …' + lido.slice(Math.max(0, m.index - 40), m.index + m[0].length + 40).trim() + '…');
  }
  if (/vista verde/i.test(corpo)) E.push('texto proibido: "Vista Verde"');
  if (!noindex && !/class="nap"/.test(h) && !/^(blog\/index|index)\.html$/.test(f)) A.push('sem linha NAP');
  if (E.length) { erros += E.length; console.log('ERRO  ' + f + '\n    ' + E.join('\n    ')); }
  if (A.length) { avisos += A.length; console.log('aviso ' + f + ': ' + A.join(' | ')); }
}
if (faqDiferente) console.log('\nFAQPage diferente do FAQ visível em ' + faqDiferente + ' página(s): "node gera-faq.js" regrava o FAQPage a partir do que está na página.');
console.log('\n' + lista.length + ' páginas · ' + erros + ' erros · ' + avisos + ' avisos');
process.exit(erros ? 1 : 0);
