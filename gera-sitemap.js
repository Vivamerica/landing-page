/* GERA-SITEMAP — sitemap.xml com <lastmod> que diz a verdade, e as três datas
   de cada página contando a mesma história.

   O que faz, a partir do git (fonte única das datas):
   1. Lista as páginas do site (index.html rastreados, mais os novos ainda não
      commitados), fora ferramentas/, qrcode/, quermesse/ e páginas noindex.
   2. Para cada página, acha a data do último commit que mudou o TEXTO
      PRINCIPAL: compara a "impressão digital" do conteúdo entre versões
      consecutivas e ignora o que não é texto — camada de marca (<style>),
      tag GA4, bloco da entidade, malha de rodapé, menu, rodapé, botões de
      WhatsApp (molde e rótulo), cards/CTA/aside gerados no blog e os próprios
      campos de data. Um commit que só trocou isso não conta. Página alterada
      na árvore de trabalho com mudança de texto recebe a data de hoje.
   3. Escreve sitemap.xml (BOM + LF, formato de sempre; changefreq/priority da
      TABELA abaixo, com padrão por tipo para página nova).
   4. Alinha nas páginas o dateModified dos JSON-LD e o "Atualizado em
      dd/mm/aaaa" visível (p.procedencia nas fichas, p.meta no blog,
      .atualizado no Observatório e em /sobre/) com o lastmod. O
      "Atualizado em mês/ano" dos hubs de lote é do gera-home.js e fica
      como está; a guarda do identidade.js aceita a granularidade de mês.

   Ritual (ordem): gera-folheto → gera-observatorio → gera-home →
   gera-apartamentos → gera-alphaville → gera-blog-ofertas → gera-blog-indice →
   gera-relacionados → node gera-sitemap.js → node identidade.js (último; a
   guarda 5 dele falha quando lastmod, dateModified e "Atualizado em" divergem).
   Idempotente: rodado duas vezes, a segunda não muda nada. Nunca edite o
   sitemap.xml à mão — a próxima rodada desfaz.

   Para outros geradores: const { dataPagina } = require('./gera-sitemap.js')
   devolve a data (AAAA-MM-DD) de uma página pelo caminho relativo. */
const fs = require('fs');
const path = require('path');
const { execFileSync, spawnSync } = require('child_process');

const RAIZ = 'C:\\Users\\Usuario\\Desktop\\landing-page';
const DOMINIO = 'https://lancamentos.imoveisvivamerica.com.br/';
const SITEMAP = path.join(RAIZ, 'sitemap.xml');
const FORA = /^(ferramentas|qrcode|quermesse|seo|node_modules|\.git|\.claude|folder|treinamento)(\/|$)/;
const BOM = '\uFEFF';

// changefreq e priority por página, na ordem de publicação do sitemap.
// Página que não está aqui recebe o padrão do seu tipo e entra depois das listadas.
const TABELA = [
  ['', 'weekly', '1.0'],
  ['loteamentos-em-indaiatuba', 'monthly', '0.8'],
  ['condominios-fechados-indaiatuba', 'monthly', '0.8'],
  ['mapa-lotes-indaiatuba', 'weekly', '0.8'],
  ['apartamentos-na-planta-indaiatuba', 'weekly', '0.9'],
  ['alphaville', 'weekly', '0.8'],
  ['casas-alphaville-dom-pedro-0-campinas', 'weekly', '0.9'],
  ['aurora-indaiatuba', 'weekly', '0.9'],
  ['manai-bosque-indaiatuba', 'weekly', '0.9'],
  ['reserva-botanica-indaiatuba', 'weekly', '0.9'],
  ['parque-zarah-indaiatuba', 'weekly', '0.9'],
  ['itamaraca-indaiatuba', 'weekly', '0.9'],
  ['spazio-italia-indaiatuba', 'weekly', '0.9'],
  ['terras-de-san-marino-indaiatuba', 'weekly', '0.9'],
  ['storia-congesa-indaiatuba', 'weekly', '0.9'],
  ['seasons-indaiatuba', 'weekly', '0.9'],
  ['vila-fahl-indaiatuba', 'weekly', '0.9'],
  ['espaco-conceicao-indaiatuba', 'weekly', '0.9'],
  ['arete-home-indaiatuba', 'weekly', '0.9'],
  ['viva-parque-aura-indaiatuba', 'weekly', '0.9'],
  ['viva-parque-sense-indaiatuba', 'weekly', '0.9'],
  ['alpnach-indaiatuba', 'monthly', '0.9'],
  ['residencial-ravello-indaiatuba', 'monthly', '0.9'],
  ['di-italia-indaiatuba', 'weekly', '0.9'],
  ['monte-carmelo-indaiatuba', 'monthly', '0.9'],
  ['uni-residencial-indaiatuba', 'weekly', '0.9'],
  ['gran-vic-tangara-indaiatuba', 'weekly', '0.9'],
  ['gran-vic-andorinha-indaiatuba', 'monthly', '0.7'],
  ['gran-vic-canario-indaiatuba', 'weekly', '0.9'],
  ['gran-vic-colibri-indaiatuba', 'weekly', '0.9'],
  ['helade-indaiatuba', 'weekly', '0.9'],
  ['blog', 'weekly', '0.7'],
  ['blog/o-que-e-alphaville', 'monthly', '0.9'],
  ['blog/como-usar-fgts-comprar-imovel-indaiatuba', 'monthly', '0.9'],
  ['blog/fgts-como-entrada-apartamento-indaiatuba', 'monthly', '0.8'],
  ['blog/fgts-imovel-na-planta-indaiatuba', 'monthly', '0.8'],
  ['blog/fgts-imovel-a-vista', 'monthly', '0.8'],
  ['blog/como-comprar-apartamento-sem-fgts-indaiatuba', 'monthly', '0.8'],
  ['blog/casa-propria-motorista-de-aplicativo', 'monthly', '0.8'],
  ['blog/minha-casa-minha-vida-indaiatuba', 'monthly', '0.9'],
  ['blog/quem-tem-direito-minha-casa-minha-vida-indaiatuba', 'monthly', '0.8'],
  ['blog/mcmv-faixa-3-indaiatuba', 'monthly', '0.8'],
  ['blog/como-se-inscrever-minha-casa-minha-vida-indaiatuba', 'monthly', '0.8'],
  ['blog/minha-casa-minha-vida-caixa-indaiatuba', 'monthly', '0.8'],
  ['blog/melhores-bairros-para-morar-indaiatuba', 'monthly', '0.7'],
  ['blog/apartamento-ou-lote-indaiatuba', 'monthly', '0.7'],
  ['blog/morar-em-indaiatuba', 'monthly', '0.9'],
  ['blog/morar-em-indaiatuba-e-bom', 'monthly', '0.8'],
  ['blog/quanto-custa-morar-em-indaiatuba', 'monthly', '0.8'],
  ['blog/hospital-parque-dos-passaros-indaiatuba', 'monthly', '0.8'],
  ['blog/indaiatuba-ou-campinas', 'monthly', '0.8'],
  ['blog/indaiatuba-ou-sorocaba', 'monthly', '0.8'],
  ['blog/morar-em-indaiatuba-e-seguro', 'monthly', '0.8'],
  ['blog/desvantagens-de-morar-em-indaiatuba', 'monthly', '0.8'],
  ['blog/morar-em-indaiatuba-trabalhar-em-sao-paulo', 'monthly', '0.8'],
  ['precos-lancamentos-indaiatuba', 'monthly', '0.9'],
  ['vivere-indaiatuba', 'weekly', '0.9'],
  ['sobre', 'monthly', '0.5'],
  ['loteamentos-e-bairros-de-indaiatuba', 'monthly', '0.5'],
  ['imprensa-e-dados', 'monthly', '0.5'],
  ['izzi-residence-indaiatuba', 'weekly', '0.9'],
  ['artemis-residencial-indaiatuba', 'weekly', '0.9'],
  ['parque-das-aguas-indaiatuba', 'weekly', '0.9'],
  ['360-home-office-mall-indaiatuba', 'weekly', '0.9'],
  ['alphaville-indaiatuba', 'weekly', '0.9'],
  ['lagos-de-helvetia-indaiatuba', 'weekly', '0.9'],
  ['porteira-de-ferro-indaiatuba', 'weekly', '0.9'],
  ['ville-de-provence-indaiatuba', 'weekly', '0.9'],
  ['maria-candida-indaiatuba', 'weekly', '0.9'],
];
function padrao(slug) {
  if (slug.startsWith('blog/')) return ['monthly', '0.8'];
  if (/-indaiatuba$|-campinas$/.test(slug)) return ['weekly', '0.9'];
  return ['monthly', '0.5'];
}

// ─── git ───
function git(args, opts) {
  return execFileSync('git', args, Object.assign({ cwd: RAIZ, encoding: 'utf8', maxBuffer: 1 << 28 }, opts || {}));
}
const slugDe = rel => rel === 'index.html' ? '' : rel.replace(/\/index\.html$/, '');
const relDe = slug => slug ? slug + '/index.html' : 'index.html';
const locDe = slug => DOMINIO + (slug ? slug + '/' : '');
function paginaDoLoc(loc) {
  if (!loc.startsWith(DOMINIO)) return null;
  const resto = loc.slice(DOMINIO.length).replace(/\/$/, '');
  return relDe(resto);
}
const ehNoindex = html => /<meta name="robots" content="[^"]*noindex/.test(html);

function listarPaginas() {
  const rastreadas = git(['ls-files', '--', '*index.html']).split(/\r?\n/).filter(Boolean);
  const novas = git(['status', '--porcelain', '--untracked-files=all', '--', '*index.html'])
    .split(/\r?\n/).filter(l => l.startsWith('?? ')).map(l => l.slice(3).trim());
  const todas = [...new Set([...rastreadas, ...novas])].filter(f => !FORA.test(f) && fs.existsSync(path.join(RAIZ, f)));
  return todas.filter(f => !ehNoindex(fs.readFileSync(path.join(RAIZ, f), 'utf8'))).sort();
}

// commits que tocaram cada página, do mais novo ao mais antigo (uma chamada só)
function historico(paginas) {
  const saida = git(['log', '--format=%x01%H %cs', '--name-only', '--', ...paginas]);
  const hist = new Map(paginas.map(p => [p, []]));
  for (const bloco of saida.split('\x01').slice(1)) {
    const linhas = bloco.split(/\r?\n/).filter(Boolean);
    const [sha, data] = linhas[0].split(' ');
    for (const f of linhas.slice(1)) if (hist.has(f)) hist.get(f).push({ sha, data });
  }
  return hist;
}

// várias versões de arquivos numa chamada: "sha:caminho" → conteúdo (null se não existe)
function lerBlobs(specs) {
  const res = new Map();
  if (!specs.length) return res;
  const r = spawnSync('git', ['cat-file', '--batch'], { cwd: RAIZ, input: specs.join('\n') + '\n', maxBuffer: 1 << 30 });
  if (r.status !== 0) throw new Error('git cat-file: ' + String(r.stderr));
  const buf = r.stdout;
  let pos = 0;
  for (const spec of specs) {
    const nl = buf.indexOf(10, pos);
    const cab = buf.slice(pos, nl).toString();
    pos = nl + 1;
    if (/ (missing|ambiguous)$/.test(cab)) { res.set(spec, null); continue; }
    const tam = parseInt(cab.split(' ')[2], 10);
    res.set(spec, buf.slice(pos, pos + tam).toString('utf8'));
    pos += tam + 1;
  }
  return res;
}

// ─── impressão digital do texto principal ───
const MESES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
const RE_DATA_VISIVEL = /(atualizad[oa] em )(\d{2}\/\d{2}\/\d{4}|(?:janeiro|fevereiro|março|abril|maio|junho|julho|agosto|setembro|outubro|novembro|dezembro)(?: de |\/)\d{4})/i;
const GEN_CHROME = /<!--GEN:(malha|entidade|barra|aside|oferta|cta-topo|atualizado)-->[\s\S]*?<!--\/GEN:\1-->/g;

const ehObj = v => !!v && typeof v === 'object' && !Array.isArray(v);
const tipos = v => String((v && v['@type']) || '');
function ehImobiliaria(v) {
  if (!ehObj(v)) return false;
  if (/RealEstateAgent/.test(tipos(v))) return true;
  return /Organization|LocalBusiness|Corporation/.test(tipos(v)) && /viv.?am[eé]rica|viva am[eé]rica/i.test(String(v.name || ''));
}
const ehAutor = v => ehObj(v) && /Person/.test(tipos(v)) && /fabio correia/i.test(String(v.name || ''));
function limparLd(v) {
  if (Array.isArray(v)) return v.filter(x => !ehImobiliaria(x)).map(limparLd);
  if (!ehObj(v)) return v;
  if (ehImobiliaria(v) || ehAutor(v)) return 'ENTIDADE';          // a entidade é da camada de marca
  const o = {};
  for (const k of Object.keys(v).sort()) {
    if (k === 'dateModified' || k === '@id') continue;
    o[k] = limparLd(v[k]);
  }
  return o;
}
function normalizarLd(corpo) {
  let o;
  try { o = JSON.parse(corpo); } catch (e) { return corpo.replace(/\s+/g, ' ').trim(); }
  if (ehImobiliaria(o)) return '';
  return JSON.stringify(limparLd(o));
}
function fingerprint(html) {
  let h = html.replace(/\r\n?/g, '\n')
    .replace(/[\u2018\u2019\u00B4`]/g, "'").replace(/[\u201C\u201D]/g, '"');
  h = h.replace(GEN_CHROME, ' ');
  h = h.replace(/<!--[\s\S]*?-->/g, ' ');
  // linha de procedência (fichas), linha de data/autor (blog) e selos "atualizado em": são a data da página, não o texto
  h = h.replace(/<(p|span|div)\b[^>]*class="[^"]*\b(?:procedencia|meta|atualizado)\b[^"]*"[^>]*>[\s\S]*?<\/\1>/gi, ' ');
  h = h.replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, ' ');
  h = h.replace(/<link\b[^>]*>/gi, m => /rel="canonical"/.test(m) ? m : ' ');
  h = h.replace(/<nav\b[\s\S]*?<\/nav>/gi, ' ');
  h = h.replace(/<footer\b[\s\S]*?<\/footer>/gi, ' ');
  h = h.replace(/<a\b[^>]*wa\.me[^>]*>[\s\S]*?<\/a>/gi, ' ');
  const ld = [];
  h = h.replace(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi, (m, attrs, corpo) => {
    if (/application\/ld\+json/.test(attrs)) { ld.push(normalizarLd(corpo)); return ' '; }
    if (/gtag\(|dataLayer|googletagmanager/.test(corpo + attrs)) return ' ';   // tag GA4, formato antigo ou novo
    return ' ' + corpo.replace(/\s+/g, ' ') + ' ';
  });
  h = h.replace(/(atualizad[oa] em )(\d{2}\/\d{2}\/\d{4}|[a-zç]+ de \d{4}|[a-zç]+\/\d{4})/gi, '$1DATA');
  const titulo = (h.match(/<title>([\s\S]*?)<\/title>/i) || [])[1] || '';
  const desc = (h.match(/<meta\s+name="description"\s+content="([^"]*)"/i) || [])[1] || '';
  const hrefs = [];
  h.replace(/\shref="([^"]+)"/g, (m, u) => { hrefs.push(u); return m; });
  const srcs = [];
  h.replace(/<img\b[^>]*\ssrc="([^"]+)"/gi, (m, u) => { srcs.push(u); return m; });
  const texto = h.replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
  return [titulo, desc, hrefs.join('|'), srcs.join('|'), ld.filter(Boolean).join('|'), texto].join('\n');
}

// ─── data de cada página ───
function hoje() {
  const d = new Date();
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}
function calcularDatas(paginas) {
  const HOJE = hoje();
  const hist = historico(paginas);
  const mudadas = new Set(git(['status', '--porcelain', '--untracked-files=all', '--', ...paginas])
    .split(/\r?\n/).filter(Boolean).map(l => l.slice(3).trim()));
  const blobs = new Map();          // "sha:rel" → conteúdo
  const fps = new Map();            // "sha:rel" → fingerprint
  const fpDe = spec => { if (!fps.has(spec)) fps.set(spec, fingerprint(blobs.get(spec))); return fps.get(spec); };
  const datas = new Map();
  const motivo = new Map();
  const cursor = new Map();         // rel → índice do commit em exame

  // 1) árvore de trabalho: mudou texto desde o HEAD? → hoje
  const pedir = [];
  for (const p of paginas) {
    cursor.set(p, 0);
    if (mudadas.has(p)) pedir.push('HEAD:' + p);
  }
  for (const [k, v] of lerBlobs(pedir)) blobs.set(k, v);
  for (const p of paginas) {
    if (!mudadas.has(p)) continue;
    const head = blobs.get('HEAD:' + p);
    const atual = fs.readFileSync(path.join(RAIZ, p), 'utf8');
    if (head == null) { datas.set(p, HOJE); motivo.set(p, 'página nova, ainda sem commit'); continue; }
    if (fingerprint(atual) !== fingerprint(head)) { datas.set(p, HOJE); motivo.set(p, 'texto alterado na árvore de trabalho'); }
  }

  // 2) histórico: anda commit a commit até achar mudança de texto
  const K = 4;
  for (let rodada = 0; rodada < 200; rodada++) {
    const faltam = [];
    for (const p of paginas) {
      if (datas.has(p)) continue;
      const cs = hist.get(p);
      const i = cursor.get(p);
      for (let j = i; j <= i + K && j < cs.length; j++) {
        const spec = cs[j].sha + ':' + p;
        if (!blobs.has(spec)) faltam.push(spec);
      }
    }
    for (const [k, v] of lerBlobs([...new Set(faltam)])) blobs.set(k, v);
    let pendentes = 0;
    for (const p of paginas) {
      if (datas.has(p)) continue;
      const cs = hist.get(p);
      if (!cs.length) { datas.set(p, HOJE); motivo.set(p, 'sem histórico no git'); continue; }
      let i = cursor.get(p);
      while (i < cs.length) {
        const aqui = cs[i].sha + ':' + p;
        if (i + 1 >= cs.length) { datas.set(p, cs[i].data); motivo.set(p, 'criação ' + cs[i].sha.slice(0, 7)); break; }
        const antes = cs[i + 1].sha + ':' + p;
        if (!blobs.has(aqui) || !blobs.has(antes)) break;
        if (blobs.get(antes) == null || fpDe(aqui) !== fpDe(antes)) {
          datas.set(p, cs[i].data); motivo.set(p, 'texto mudou em ' + cs[i].sha.slice(0, 7) + (i ? ' (' + i + ' commit(s) só de malha/marca/botões depois)' : ''));
          break;
        }
        i++;
      }
      cursor.set(p, i);
      if (!datas.has(p)) pendentes++;
    }
    if (!pendentes) break;
  }
  for (const p of paginas) if (!datas.has(p)) throw new Error('não consegui datar ' + p);
  return { datas, motivo, mudadas, HOJE };
}

// ─── sitemap ───
function montarSitemap(paginas, datas) {
  const slugs = new Set(paginas.map(slugDe));
  const ordem = [];
  for (const [slug, cf, pr] of TABELA) if (slugs.has(slug)) ordem.push([slug, cf, pr]);
  const listados = new Set(ordem.map(o => o[0]));
  for (const slug of [...slugs].filter(s => !listados.has(s)).sort()) {
    const [cf, pr] = padrao(slug);
    ordem.push([slug, cf, pr]);
    console.log('  página fora da TABELA, com padrão ' + cf + '/' + pr + ': /' + slug + '/');
  }
  const urls = ordem.map(([slug, cf, pr]) =>
    '  <url>\n    <loc>' + locDe(slug) + '</loc>\n    <lastmod>' + datas.get(relDe(slug)) + '</lastmod>\n' +
    '    <changefreq>' + cf + '</changefreq>\n    <priority>' + pr + '</priority>\n  </url>');
  return BOM + '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' + urls.join('\n') + '\n</urlset>\n';
}

// ─── datas dentro da página ───
// Devolve { dateModified: [valores], visivel: { texto, iso, mes } | null }.
// visivel = primeiro "Atualizado em …" dentro de .procedencia, .meta ou .atualizado
// (as outras ocorrências na página são datas de tabela, não da página).
const RE_ELEM_DATA = /<(p|span|div)\b[^>]*class="[^"]*\b(?:procedencia|meta|atualizado)\b[^"]*"[^>]*>/g;
const RE_GEN_DATA = /<!--GEN:atualizado-->\s*/g;
function interpretar(texto) {
  const dma = texto.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (dma) return { iso: dma[3] + '-' + dma[2] + '-' + dma[1], mes: null };
  const mm = texto.match(/^([a-zç]+)(?: de |\/)(\d{4})$/i);
  return { iso: null, mes: mm ? mm[2] + '-' + String(MESES.indexOf(mm[1].toLowerCase()) + 1).padStart(2, '0') : null };
}
function dataVisivel(html) {
  const achados = [];
  RE_ELEM_DATA.lastIndex = 0;
  let m;
  while ((m = RE_ELEM_DATA.exec(html))) {
    const fim = html.indexOf('</' + m[1] + '>', m.index);
    const trecho = html.slice(m.index, fim < 0 ? m.index + 400 : fim);
    const d = trecho.match(RE_DATA_VISIVEL);
    if (d) achados.push({ texto: d[2], gen: false, inicio: m.index + d.index + d[1].length, fim: m.index + d.index + d[0].length });
  }
  RE_GEN_DATA.lastIndex = 0;
  while ((m = RE_GEN_DATA.exec(html))) {            // hubs de lote: "Atualizado em mês/ano" do gera-home.js
    const d = html.slice(m.index, m.index + 120).match(RE_DATA_VISIVEL);
    if (d) achados.push({ texto: d[2], gen: true, inicio: m.index + d.index + d[1].length, fim: m.index + d.index + d[0].length });
  }
  if (!achados.length) return null;
  const v = achados.sort((a, b) => a.inicio - b.inicio)[0];
  return Object.assign(v, interpretar(v.texto));
}
function lerDatas(html) {
  const dateModified = [];
  html.replace(/"dateModified"\s*:\s*"([^"]*)"/g, (m, v) => { dateModified.push(v); return m; });
  return { dateModified, visivel: dataVisivel(html) };
}
// a data visível bate com o lastmod? (dd/mm/aaaa exato; mês/ano pela granularidade do texto)
function mesmaData(visivel, iso) {
  if (!visivel) return true;
  if (visivel.iso) return visivel.iso === iso;
  if (visivel.mes) return visivel.mes === iso.slice(0, 7);
  return false;
}
const dataBR = iso => iso.split('-').reverse().join('/');
function alinharPagina(html, iso) {
  let h = html.replace(/("dateModified"\s*:\s*")[^"]*(")/g, (m, a, b) => a + iso + b);
  const v = dataVisivel(h);
  if (v && !v.gen && !mesmaData(v, iso)) h = h.slice(0, v.inicio) + dataBR(iso) + h.slice(v.fim);   // o GEN:atualizado é do gera-home.js
  return h;
}

function main() {
  const paginas = listarPaginas();
  const { datas, motivo, mudadas, HOJE } = calcularDatas(paginas);
  const anterior = fs.existsSync(SITEMAP) ? fs.readFileSync(SITEMAP, 'utf8') : '';
  const lastmodAntes = new Map();
  anterior.replace(/<loc>([^<]+)<\/loc>\s*<lastmod>([^<]+)<\/lastmod>/g, (m, loc, d) => { lastmodAntes.set(paginaDoLoc(loc), d); return m; });

  const novo = montarSitemap(paginas, datas);
  const mudouSitemap = novo !== anterior;
  if (mudouSitemap) fs.writeFileSync(SITEMAP, novo, 'utf8');

  let alinhadas = 0;
  const detalhe = [];
  for (const p of paginas) {
    const f = path.join(RAIZ, p);
    const antes = fs.readFileSync(f, 'utf8');
    const depois = alinharPagina(antes, datas.get(p));
    if (depois !== antes) { fs.writeFileSync(f, depois, 'utf8'); alinhadas++; }
    const dAntes = lastmodAntes.get(p);
    if (dAntes !== datas.get(p)) detalhe.push('  ' + (dAntes || '(nova)') + ' -> ' + datas.get(p) + '  ' + p + '  [' + motivo.get(p) + ']');
  }
  const hojeN = [...datas.values()].filter(d => d === HOJE).length;
  console.log('sitemap.xml: ' + paginas.length + ' páginas, ' + (mudouSitemap ? 'reescrito' : 'já estava') +
    '; lastmod alterado em ' + detalhe.length + ' página(s); ' + hojeN + ' com a data de hoje (' + HOJE + '), ' +
    mudadas.size + ' alteradas na árvore de trabalho');
  if (detalhe.length) console.log(detalhe.join('\n'));
  console.log('páginas: dateModified / "Atualizado em" alinhados em ' + alinhadas + ' arquivo(s)');
}

if (require.main === module) main();

module.exports = { listarPaginas, calcularDatas, fingerprint, lerDatas, mesmaData, paginaDoLoc, relDe, slugDe, dataBR,
  dataPagina: rel => calcularDatas([rel]).datas.get(rel) };
