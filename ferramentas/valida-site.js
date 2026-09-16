// Validador do site de lançamentos (recriado em 16/09/2026 dentro do repo — o valida-setembro.js vivia no
// scratchpad e sumiu na limpeza da pasta temporária).
// Uso: node ferramentas/valida-site.js [pasta1 pasta2 ...]   (sem argumento: todas as páginas)
// Saída: "N páginas · E erros · A avisos". Publicar só com 0 erros.
const fs = require('fs');
const path = require('path');
const R = path.resolve(__dirname, '..');
const BASE = 'https://lancamentos.imoveisvivamerica.com.br/';
const FORA = /^(ferramentas|qrcode|seo|node_modules|\.git|folder|treinamento)(\/|$)/;

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

const alvo = process.argv.slice(2);
let lista = paginas();
if (alvo.length) lista = lista.filter(f => alvo.some(a => f.startsWith(a.replace(/\/$/, '') + '/') || f === a));
let erros = 0, avisos = 0;
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
    if (title.length < 30 || title.length > 65) A.push('title ' + title.length);
    if (desc && (desc.length < 110 || desc.length > 160)) A.push('description ' + desc.length);
  }
  const h1 = (h.match(/<h1[\s>]/g) || []).length;
  if (h1 !== 1) E.push('h1: ' + h1);
  const blocos = [...h.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map(m => m[1]);
  const corpo = texto(h);
  for (const b of blocos) {
    let o;
    try { o = JSON.parse(b); } catch (e) { E.push('JSON-LD inválido: ' + e.message.slice(0, 60)); continue; }
    if (o['@type'] === 'FAQPage') {
      for (const q of o.mainEntity || []) {
        if (!corpo.includes(q.name)) A.push('FAQ sem pergunta visível: ' + q.name.slice(0, 50));
        const a = (q.acceptedAnswer || {}).text || '';
        if (a && !corpo.includes(a.replace(/\s+/g, ' ').slice(0, 80))) A.push('FAQ com resposta diferente da visível: ' + q.name.slice(0, 50));
      }
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
  if (/vista verde/i.test(corpo)) E.push('texto proibido: "Vista Verde"');
  if (!noindex && !/class="nap"/.test(h) && !/^(blog\/index|index)\.html$/.test(f)) A.push('sem linha NAP');
  if (E.length) { erros += E.length; console.log('ERRO  ' + f + '\n    ' + E.join('\n    ')); }
  if (A.length) { avisos += A.length; console.log('aviso ' + f + ': ' + A.join(' | ')); }
}
console.log('\n' + lista.length + ' páginas · ' + erros + ' erros · ' + avisos + ' avisos');
process.exit(erros ? 1 : 0);
