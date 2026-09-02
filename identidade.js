/* IDENTIDADE VISUAL — Poiret One + Josefin Sans, preto #161616 e dourado #C9A227
   (a mesma do site principal imoveisvivamerica.com.br)

   Ritual: criou landing/página nova → node identidade.js
   Idempotente: aplica cores, fontes e a camada <style id="marca"> só onde falta.
   Fora do escopo: folheto-lancamentos.html e folder*.html (impressos aprovados).
   Acentos por produto (verde Vívere, marrom VIC) são preservados — só o chrome
   (header, hero, footer, botões) entra na marca. */
const fs = require('fs');
const path = require('path');
const RAIZ = 'C:\\Users\\Usuario\\Desktop\\landing-page';

const CORES = [
  ['linear-gradient(100deg, rgba(15,28,41,.93) 0%, rgba(15,28,41,.74) 48%, rgba(15,28,41,.42) 100%)',
   'linear-gradient(100deg, rgba(16,16,16,.93) 0%, rgba(16,16,16,.74) 48%, rgba(16,16,16,.40) 100%)'],
  ['linear-gradient(135deg,var(--navy),#24405c)', '#161616'],
  ['#1a2b3c', '#161616'], ['#0f1c29', '#161616'], ['#24405c', '#2a2a2a'],
  ['#1A2B3C', '#161616'], ['#0F1C29', '#161616'], ['#C9A84C', '#C9A227'],
  ['#1a1a1a', '#161616'],
  ['#0f2a1a', '#161616'], ['#0a1f12', '#101010'],  // chrome verde do Vivere -> marca
  ['#c9a84c', '#C9A227'], ['#a8862e', '#8f7418'], ['#d4a962', '#C9A227'],
  ['#13212e', '#101010'], ['#fbfaf6', '#F7F5F0'], ['#f7f7f5', '#F7F5F0'],
  ['#faf8f2', '#F7F5F0'], ['#f3ecd8', '#F5EFDF'], ['#fdfaf2', '#FBF8F0'],
  ['#e6e0d0', '#E6E1D6'],
  ['"Segoe UI", Arial, sans-serif', "'Josefin Sans', system-ui, sans-serif"],
  ['"Segoe UI",Arial,sans-serif', "'Josefin Sans',system-ui,sans-serif"], ['#ddd6c4', '#DCD6C6'], ['#e8dcbb', '#E4D9BC'],
];
const EMOJIS = ['📚','📊','🏠','📍','✅','🚗','🏢','🏞️','🔥','⚠️','⚠','🎯','💰','📄','🔑','🧮','🏦','📈','📉','🛵','⭐','✂️','🗞️','📦','🚦','☑️','✔️','🌳','🏗️','🔒','🏡','🌿','💧','🚌','🎓','🩺'];

const FONTS = '<link rel="preconnect" href="https://fonts.googleapis.com">\n' +
  '<link href="https://fonts.googleapis.com/css2?family=Josefin+Sans:wght@300;400;600;700&family=Poiret+One&display=swap" rel="stylesheet">';

const MARCA = `
  <style id="marca">
    /* Identidade Viv'América — Poiret One + Josefin Sans, preto e dourado */
    body, button, input, select, textarea { font-family:'Josefin Sans', system-ui, sans-serif; }
    .logo-text { font-family:'Poiret One', cursive; font-weight:400; letter-spacing:.2em;
                 text-transform:uppercase; }
    h1 { font-family:'Poiret One', cursive; font-weight:400; letter-spacing:.08em;
         text-transform:uppercase; line-height:1.25; }
    h2, h3 { font-weight:600; }
    nav a { letter-spacing:.08em; text-transform:uppercase; font-size:0.78rem; }
    .tag, .selo-h, .card-badge, .chip, .post-tag, .filtro-label { letter-spacing:.1em; }
    .btn-wpp, .btn-tipo, .btn-card, .cta a { border-radius:4px; letter-spacing:.05em; }
    .nav-cta { border:1px solid #C9A227; color:#C9A227 !important; padding:.45rem .9rem; border-radius:4px; }
    .nav-cta:hover { background:#C9A227; color:#161616 !important; }
    .cta-topo { display:flex; flex-wrap:wrap; gap:.8rem; align-items:center; justify-content:space-between;
                background:#161616; padding:1rem 1.2rem; margin:1.4rem 0 1.8rem; border-radius:4px; }
    .cta-topo p { color:#fff; margin:0; font-weight:300; font-size:.95rem; }
    .cta-topo a { background:#C9A227; color:#161616; font-weight:600; padding:.7rem 1.3rem; text-decoration:none;
                  letter-spacing:.08em; text-transform:uppercase; font-size:.78rem; border-radius:4px; white-space:nowrap; }
    .cta-topo a:hover { background:#E0C05A; }
    .malha { background:#161616; padding:2.2rem 5%; }
    .malha-in { max-width:1160px; margin:0 auto; }
    .malha-titulo { font-family:'Poiret One', cursive; font-weight:400; letter-spacing:.18em;
                    text-transform:uppercase; color:#C9A227; font-size:.95rem; margin:0 0 1rem; }
    .malha-grupo { margin:0 0 .7rem; line-height:2; }
    .malha-rotulo { color:#C9A227; font-size:.68rem; font-weight:600; letter-spacing:.16em;
                    text-transform:uppercase; margin-right:.9rem; }
    .malha a { color:rgba(255,255,255,.78); text-decoration:none; font-size:.82rem;
               font-weight:300; margin-right:.9rem; white-space:nowrap; }
    .malha a:hover { color:#C9A227; }
  </style>`;

function trocarCores(s) {
  for (const [de, para] of CORES) s = s.split(de).join(para);
  return s;
}
function tirarEmojis(s) {
  for (const e of EMOJIS) {
    s = s.split('>' + e + ' ').join('>');
    s = s.split('>' + e).join('>');
    s = s.split('"' + e + ' ').join('"');
    s = s.split("'" + e + ' ').join("'");   // template literals dos geradores
    s = s.split('`' + e + ' ').join('`');
  }
  return s;
}

// ─── Fase 1: geradores ───
for (const g of ['gera-observatorio.js', 'gera-home.js']) {
  const f = path.join(RAIZ, g);
  let s = fs.readFileSync(f, 'utf8');
  const antes = s;
  s = trocarCores(s);
  s = tirarEmojis(s);
  s = s.split("'Segoe UI',system-ui,Arial,sans-serif").join("'Josefin Sans',system-ui,sans-serif");
  s = s.split('"Segoe UI",Arial,sans-serif').join("'Josefin Sans',system-ui,sans-serif");
  // observatorio emite a pagina inteira: fontes + display no proprio template
  if (g === 'gera-observatorio.js' && !s.includes('family=Poiret+One')) {
    s = s.replace('<style>', FONTS + '\n<style>');
    s = s.replace("body{font-family:'Josefin Sans'",
      "h1{font-family:'Poiret One',cursive;font-weight:400;letter-spacing:.08em;text-transform:uppercase;line-height:1.25}\n  body{font-family:'Josefin Sans'");
  }
  if (s !== antes) fs.writeFileSync(f, s, 'utf8');
  console.log(g + ': ' + (s !== antes ? 'atualizado' : 'ja estava'));
}

// ─── Fase 2: paginas ───
function reskinPagina(html) {
  let h = trocarCores(html);
  if (!h.includes('family=Poiret+One')) h = h.replace('<style>', FONTS + '\n  <style>');
  if (h.includes('id="marca"')) {
    h = h.replace(/\n?\s*<style id="marca">[\s\S]*?<\/style>/, MARCA);
  } else {
    const i = h.indexOf('</style>');
    if (i > 0) h = h.slice(0, i + 8) + MARCA + h.slice(i + 8);
  }
  h = tirarEmojis(h);
  return h;
}

const alvos = ['index.html'];
for (const d of fs.readdirSync(RAIZ, { withFileTypes: true })) {
  if (!d.isDirectory()) continue;
  if (['seo', 'images', '.git', '.claude'].includes(d.name)) continue;
  if (d.name === 'blog') { for (const b of fs.readdirSync(path.join(RAIZ,'blog'))) { const fb = path.join('blog', b, 'index.html'); if (fs.existsSync(path.join(RAIZ, fb))) alvos.push(fb); } alvos.push(path.join('blog','index.html')); continue; }
  const f = path.join(d.name, 'index.html');
  if (fs.existsSync(path.join(RAIZ, f))) alvos.push(f);
}

let n = 0, iguais = 0;
for (const a of alvos) {
  const f = path.join(RAIZ, a);
  const antes = fs.readFileSync(f, 'utf8');
  const depois = reskinPagina(antes);
  if (depois !== antes) { fs.writeFileSync(f, depois, 'utf8'); n++; } else iguais++;
}
console.log('paginas: ' + n + ' transformadas, ' + iguais + ' ja estavam (' + alvos.length + ' alvos)');

// GUARDA: acento duplamente codificado ("HÃ©lade", "ImobiliÃ¡ria", "â€”").
// Em 02/09/2026 havia 453 ocorrencias em 39 paginas, dentro do JSON-LD
// (name/description do Product e do RealEstateAgent) e no rodape — tudo de um
// unico commit (28a7875) que gravou o schema lido como CP1252. O Google casa a
// entidade pelo name: "HÃ©lade" nao e' "Hélade". Falha alto para nao voltar.
const _c = String.fromCharCode;
const _cont = _c(0x80) + '-' + _c(0xBF) + _c(0x20AC) + _c(0x2013) + _c(0x2014) + _c(0x201C) + _c(0x201D) + _c(0x2018) + _c(0x2019) + _c(0x2026) + _c(0x2122);
const MOJIBAKE = new RegExp('[' + _c(0xC2) + _c(0xC3) + '][' + _cont + ']|' + _c(0xE2) + '[' + _cont + '][' + _cont + ']');
const sujos = alvos.filter(a => MOJIBAKE.test(fs.readFileSync(path.join(RAIZ, a), 'utf8')));
if (sujos.length) {
  console.error('ACENTO CORROMPIDO em ' + sujos.length + ' pagina(s): ' + sujos.join(', ') + '\n  -> rode o desmojibake (scratchpad) ou corrija a origem; nao publique assim.');
  process.exit(1);
}
