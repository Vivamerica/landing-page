/* ═══════════════════════════════════════════════════════════════════
   HUB-COMUM — peças comuns às páginas de categoria geradas inteiras
   ───────────────────────────────────────────────────────────────────
   Usado por gera-apartamentos.js (/apartamentos-na-planta-indaiatuba/) e
   gera-mcmv.js (/empreendimentos-minha-casa-minha-vida-indaiatuba/).
   Separado em 18/11/2026 sem mudar nenhum byte do HTML que o
   gera-apartamentos.js produzia (conferido com diff antes/depois).

   O que mora aqui:
   - fontes: APTOS do gera-folheto.js (só os à venda, pela lista "sem
     disponibilidade" do sem-disponibilidade-regras.js), VENDIDOS (quem tem
     tarja vira card de esgotado) e EDICAO do gera-observatorio.js;
   - utilitários de preço, mês da tabela e texto (brl, mil, mesDe, tabDe…);
   - a miniatura leve do card (<nome>-640.webp do hero-leve.py);
   - o card de empreendimento (mesmo HTML nas duas páginas; o que muda vem
     em opções: o nome da página na mensagem do WhatsApp, o alt do campo
     alt da fonte única e uma observação opcional abaixo das specs);
   - o CSS base dos hubs gerados;
   - a malha (<!--GEN:malha-->, do gera-relacionados.js) e a camada de marca
     (<style id="marca">, do identidade.js) preservadas entre rodadas.
   ═══════════════════════════════════════════════════════════════════ */

const fs = require('fs');
const R = __dirname + '/';

// ─── fontes ───
function extrair(arquivo, nome) {
  const src = fs.readFileSync(R + arquivo, 'utf8');
  const ini = src.indexOf('const ' + nome + ' = ');
  if (ini < 0) throw new Error(nome + ' nao achado em ' + arquivo);
  const eArr = src[ini + ('const ' + nome + ' = ').length] === '[';
  const fim = eArr ? src.indexOf('\n];', ini) + 2 : src.indexOf('};', ini) + 1;
  return eval('(' + src.slice(ini + ('const ' + nome + ' = ').length, fim) + ')');
}
// Sem disponibilidade (sem-disponibilidade.json; regra no sem-disponibilidade-regras.js): "ocultar" sai da
// página; "tarja" vira card de esgotado ("100% vendido (desde dd/mm/aaaa)", sem preço), no fim da grade, e
// sai das contas, das seções, da tabela-resumo e do FAQ. APTOS daqui para baixo = só os à venda.
const SD = require('./sem-disponibilidade-regras.js').carregar();
const APTOS_F = extrair('gera-folheto.js', 'APTOS');
const APTOS = SD.aVenda(APTOS_F);
const VENDIDOS = APTOS_F.filter(e => SD.comTarja(e.slug)).map(e => Object.assign({}, e,
  { sd: true, est: undefined, estEm: 'desde ' + SD.desdeBR(e.slug), vend: undefined, tarja: undefined, s: SD.semEstoque(e.s) }));   // sem o estoque da última tabela (regra no módulo)
const EDICAO = extrair('gera-observatorio.js', 'EDICAO');

// ─── utilitários ───
const WA = '5519989769457';
const brl = n => 'R$ ' + n.toLocaleString('pt-BR');
const mil = n => n >= 1e6
  ? 'R$ ' + (n / 1e6).toFixed(1).replace('.', ',').replace(',0', '') + ' mi'
  : 'R$ ' + Math.round(n / 1000) + ' mil';
const MES_ABREV = { '01': 'jan', '02': 'fev', '03': 'mar', '04': 'abr', '05': 'mai', '06': 'jun',
  '07': 'jul', '08': 'ago', '09': 'set', '10': 'out', '11': 'nov', '12': 'dez' };
const mesLongo = EDICAO.mes.toLowerCase() + '/' + EDICAO.ano;           // agosto/2026
const mesExtenso = EDICAO.mes.toLowerCase() + ' de ' + EDICAO.ano;      // agosto de 2026
// Mês da tabela de CADA apartamento: vem do campo tab da fonte única; preço sem tab é
// tabela de pré-lançamento. O mês da edição (EDICAO) só dá nome à edição da página:
// nunca é carimbado como mês da tabela nem do estoque de um produto.
const mesDe = iso => MES_ABREV[iso.slice(5, 7)] + '/' + iso.slice(0, 4);   // 2026-09 -> set/2026
// conf (fonte única): tabela de mês anterior com os mesmos preços confirmados para um mês depois
// tabela sem data impressa (campo tabRec da fonte única): tab é o mês em que foi recebida
const tabMes = e => (e.tabRec ? 'tabela recebida em ' : 'tabela ') + mesDe(e.tab);
const tabDe = e => e.tab ? tabMes(e) + (e.conf ? ', preços confirmados para ' + mesDe(e.conf) : '') : 'tabela de pré-lançamento';
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const semTags = s => String(s).replace(/<[^>]+>/g, '');
const eMCMV = e => /^MCMV/.test(e.t || '');
const wa = texto => 'https://wa.me/' + WA + '?text=' + encodeURIComponent(texto);

// ─── miniatura leve do card ───
// O card usa <nome>-640.webp (gravado por ferramentas/hero-leve.py ao lado do original) quando o
// arquivo existe; sem ele sai o original, como antes. Largura e altura vêm do cabeçalho do .webp.
function dimWebp(arq) {
  const b = Buffer.alloc(30);
  const fd = fs.openSync(arq, 'r');
  try { fs.readSync(fd, b, 0, 30, 0); } finally { fs.closeSync(fd); }
  if (b.toString('latin1', 0, 4) !== 'RIFF' || b.toString('latin1', 8, 12) !== 'WEBP') return null;
  const tipo = b.toString('latin1', 12, 16);
  if (tipo === 'VP8 ') return { w: b.readUInt16LE(26) & 0x3fff, h: b.readUInt16LE(28) & 0x3fff };
  if (tipo === 'VP8L') { const n = b.readUInt32LE(21); return { w: (n & 0x3fff) + 1, h: ((n >>> 14) & 0x3fff) + 1 }; }
  if (tipo === 'VP8X') return { w: 1 + b.readUIntLE(24, 3), h: 1 + b.readUIntLE(27, 3) };
  return null;
}
function miniatura(img) {
  const leve = img.replace(/\.(jpe?g|png)$/i, '-640.webp');
  const d = leve !== img && fs.existsSync(R + leve) ? dimWebp(R + leve) : null;
  return d ? { src: leve, w: d.w, h: d.h } : null;
}

// ─── card ───
// opc.pagina   nome da página na mensagem do WhatsApp ("Vi o X na página de <pagina>")
// opc.altDoCampo  true: o alt da foto vem do campo alt da fonte única quando ele existe
//                 ("Perspectiva ilustrada …"); sem o campo, o alt de sempre
// opc.obs      função e → texto (ou vazio) de uma observação abaixo das specs
const badgeCls = e => e.esgotado ? 'b-esg' : eMCMV(e) ? 'b-mcmv' : e.t === 'Alto padrão' ? 'b-alto' : e.t === 'Pré-lançamento' ? 'b-pre' : 'b-outro';
const badgeTxt = e => e.esgotado ? e.t : e.t;

function card(e, opc = {}) {
  const pagina = opc.pagina || 'apartamentos na planta em Indaiatuba';
  const alt = opc.altDoCampo && e.alt ? e.alt : e.n + ' — apartamento em Indaiatuba';
  const txtObs = opc.obs ? opc.obs(e) : '';
  const obs = txtObs ? `
          <p class="obs">${esc(txtObs)}</p>` : '';
  const preco = e.esgotado
    ? `<p class="preco preco-sc"><span>estoque</span><strong>100% vendido${e.estEm ? ' (' + esc(e.estEm) + ')' : ''}</strong><em>${e.sd ? 'todas as unidades foram vendidas, conforme informou a construtora' : 'veja as alternativas no mesmo complexo'}</em></p>`
    : e.p
      ? `<p class="preco"><span>a partir de</span><strong>${brl(e.p)}</strong><em>${tabDe(e)}</em></p>`
      : (e.t === 'Pré-lançamento'
          ? `<p class="preco preco-sc"><span>tabela</span><strong>Pré-lançamento · consulte</strong><em>peça em primeira mão</em></p>`
          : `<p class="preco preco-sc"><span>tabela</span><strong>Sob consulta</strong><em>peça a tabela em vigor</em></p>`);
  // selo de escassez só com a data da contagem (estEm da fonte única); sem data, sem selo.
  // No mesmo selo: o % vendido (vend da fonte única, truncado e com a data da lista) e a
  // tarja comercial (tarja), como na home.
  const temSelo = typeof e.est === 'number' && e.est <= 60 && !!e.estEm;
  const pv = e.vend && e.vend.tot > 0 ? Math.floor((1 - e.vend.disp / e.vend.tot) * 100) + '% vendido' : '';
  const partesSelo = [];
  if (temSelo) partesSelo.push(`Últimas ${e.est} unidades${pv && e.vend.em === e.estEm ? ' · ' + pv : ''} (${e.estEm})`);
  else if (pv) partesSelo.push(`${pv} (${e.vend.em})`);
  if (e.tarja) partesSelo.push(e.tarja);
  const est = partesSelo.length ? `<span class="est">${esc(partesSelo.join(' · '))}</span>` : '';
  const mini = miniatura(e.img);
  return `
      <article class="card" id="c-${e.slug}">
        <a href="/${e.slug}/" class="card-img"><img loading="lazy" decoding="async" src="/${mini ? mini.src : e.img}" alt="${esc(alt)}" width="${mini ? mini.w : 400}" height="${mini ? mini.h : 220}"><span class="badge ${badgeCls(e)}">${esc(badgeTxt(e))}</span>${est}</a>
        <div class="card-b">
          <p class="constr">${esc(e.c)}</p>
          <h3><a href="/${e.slug}/">${esc(e.n)}</a></h3>
          <p class="specs">${esc(temSelo ? (e.s || '').replace(/\s*·\s*últimas \d+ unidades(\s*\([^)]*\))?/i, '') : e.s)}</p>${obs}
          ${preco}
          <div class="acoes">
            <a class="btn-card" href="/${e.slug}/">${e.esgotado ? 'Ver a página' : e.p ? 'Ver detalhes e preços' : 'Ver o empreendimento'}</a>
            ${e.esgotado ? '' : `<a class="btn-wa" href="${wa('Olá! Vi o ' + e.n + ' na página de ' + pagina + ' e quero ' + (e.p ? 'a tabela completa.' : 'a tabela em primeira mão.'))}" target="_blank" rel="noopener">WhatsApp</a>`}
          </div>
        </div>
      </article>`;
}

// ─── CSS base dos hubs gerados (o conteúdo do <style> da página de apartamentos) ───
const CSS_HUB = `    *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
    :root{--preto:#161616;--dourado:#C9A227;--creme:#F7F5F0;--texto:#161616;--muted:#6b6559;--linha:#e3ddcd}
    body{font-family:'Josefin Sans',system-ui,sans-serif;color:var(--texto);background:var(--creme);line-height:1.65}
    a{color:inherit}
    header{background:var(--preto);padding:0 5%;display:flex;align-items:center;justify-content:space-between;height:72px;position:sticky;top:0;z-index:100}
    .logo-text{color:#fff;text-decoration:none;font-size:clamp(.9rem,2vw,1.05rem)}
    nav{display:flex;align-items:center}
    @media(max-width:680px){nav{display:none}}
    nav a{color:rgba(255,255,255,.85);text-decoration:none;margin-left:1.6rem}
    nav a:hover,nav a.on{color:var(--dourado)}
    @media(max-width:680px){nav a{margin-left:.9rem;font-size:.7rem}}
    .topo{background:var(--preto);color:#fff;padding:2.4rem 5% 2.2rem}
    .wrap{max-width:1160px;margin:0 auto}
    .breadcrumb{font-size:.78rem;color:rgba(255,255,255,.65);margin-bottom:.9rem}
    .breadcrumb a{color:rgba(255,255,255,.75);text-decoration:none}
    .breadcrumb a:hover{color:var(--dourado)}
    h1{font-size:clamp(1.35rem,3.4vw,2.1rem);margin:0 0 .45rem;max-width:26ch}
    h1 em{font-style:normal;color:var(--dourado)}
    .hub-numeros{font-size:clamp(1.05rem,2.3vw,1.25rem);font-weight:600;line-height:1.4}
    .hub-numeros b{color:#F7D77E;font-weight:700}
    .hub-edicao{font-size:.85rem;opacity:.75;margin-top:.2rem}
    .lede{max-width:75ch;margin:2.2rem 0 0;padding-top:.9rem;border-top:3px solid var(--preto);color:#5a5346;font-size:1rem;line-height:1.7}
    .lede strong{color:var(--preto)}
    .lede a{color:var(--preto);font-weight:700;text-decoration:none;border-bottom:1px solid var(--dourado)}
    .lede a:hover{border-bottom-width:2px}
    .atalhos{display:flex;flex-wrap:wrap;gap:.45rem;max-width:1160px;margin:1.2rem auto 0;padding:0 5%}
    .atalhos a{font-size:.72rem;font-weight:600;letter-spacing:.08em;text-transform:uppercase;padding:.5rem .9rem;border:1px solid var(--linha);background:#fff;color:var(--muted);text-decoration:none;border-radius:4px}
    .atalhos a:hover{border-color:var(--dourado);color:var(--preto)}
    .section{max-width:1160px;margin:0 auto;padding:1.6rem 5% 0}
    h2{font-size:clamp(1.25rem,2.6vw,1.7rem);margin:2.4rem 0 .35rem;letter-spacing:-.01em}
    h2 small{font-weight:400;font-size:.8rem;color:var(--muted);margin-left:.5rem;letter-spacing:.06em}
    .sub{color:var(--muted);font-size:.92rem;margin-bottom:1rem;max-width:72ch}
    .grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:1.3rem;margin-top:1.2rem}
    .card{background:#fff;border:1px solid var(--linha);border-radius:4px;overflow:hidden;display:flex;flex-direction:column;transition:border-color .2s,box-shadow .2s}
    .card:hover{border-color:var(--dourado);box-shadow:0 8px 22px rgba(0,0,0,.07)}
    .card-img{display:block;position:relative;aspect-ratio:400/220;background:#E6E1D6}
    .card-img img{width:100%;height:100%;object-fit:cover;display:block}
    .badge{position:absolute;top:.7rem;left:.7rem;font-size:.66rem;font-weight:700;letter-spacing:.08em;text-transform:uppercase;padding:.3rem .6rem;border-radius:4px;background:var(--preto);color:var(--dourado)}
    .b-mcmv{background:#1565C0;color:#fff}.b-pre{background:#a15e2c;color:#fff}.b-esg{background:#C62828;color:#fff}
    .est{position:absolute;right:.7rem;bottom:.7rem;max-width:calc(100% - 1.4rem);font-size:.66rem;font-weight:700;background:#C62828;color:#fff;padding:.28rem .55rem;border-radius:4px;letter-spacing:.04em}
    .card-b{padding:1rem 1.1rem 1.1rem;display:flex;flex-direction:column;flex:1}
    .constr{font-size:.66rem;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:#8f7418;margin-bottom:.25rem}
    .card h3{font-size:1.08rem;margin:0 0 .35rem;line-height:1.25}
    .card h3 a{text-decoration:none}
    .specs{font-size:.82rem;color:var(--muted);line-height:1.45;flex:1;margin-bottom:.7rem}
    .preco{border-top:1px dashed var(--linha);padding-top:.6rem;margin-bottom:.8rem}
    .preco span{display:block;font-size:.64rem;color:#8a8272;text-transform:uppercase;letter-spacing:.1em}
    .preco strong{display:block;font-size:1.28rem;font-weight:700;line-height:1.1;margin-top:.15rem}
    .preco em{display:block;font-style:normal;font-size:.7rem;color:#8a8272;margin-top:.2rem}
    .preco-sc strong{color:#a15e2c;font-size:1rem}
    .acoes{display:flex;gap:.5rem;flex-wrap:wrap}
    .btn-card,.btn-wa{display:inline-flex;align-items:center;min-height:42px;padding:.55rem 1rem;font-size:.8rem;font-weight:600;letter-spacing:.05em;text-decoration:none;border-radius:4px}
    .btn-card{background:var(--preto);color:#fff;flex:1;justify-content:center}
    .btn-wa{background:#25D366;color:#fff}
    .btn-card:hover,.btn-wa:hover{opacity:.9}
    .sec{scroll-margin-top:90px}
    .lista{list-style:none;display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:.6rem}
    .lista a{display:flex;flex-direction:column;background:#fff;border:1px solid var(--linha);border-left:3px solid var(--dourado);padding:.75rem .9rem;text-decoration:none;border-radius:4px}
    .lista a:hover{border-color:var(--dourado)}
    .lista b{font-weight:600}
    .lista span{font-size:.72rem;color:var(--muted);letter-spacing:.06em;text-transform:uppercase}
    .lista em{font-style:normal;font-size:.84rem;margin-top:.2rem}
    .vazio{color:var(--muted);font-size:.9rem}
    .tabela-wrap{overflow-x:auto;background:#fff;border:1px solid var(--linha);border-radius:4px}
    table{width:100%;border-collapse:collapse;font-size:.9rem;min-width:800px}
    th{text-align:left;font-size:.68rem;letter-spacing:.1em;text-transform:uppercase;color:#8a8272;padding:.8rem 1rem;border-bottom:2px solid var(--preto);background:var(--creme)}
    td{padding:.65rem 1rem;border-bottom:1px solid #eee9db;vertical-align:top}
    tr:last-child td{border-bottom:none}
    td a{font-weight:600;text-decoration:none;border-bottom:1px solid var(--dourado)}
    td.num{white-space:nowrap;font-variant-numeric:tabular-nums}
    .sc{color:#a15e2c;font-weight:600}
    .tabela-mes{font-size:.78rem;letter-spacing:.1em;text-transform:uppercase;color:#8f7418;font-weight:600;margin-bottom:.5rem}
    .faq details{background:#fff;border:1px solid var(--linha);border-radius:4px;margin-bottom:.6rem;padding:1rem 1.2rem}
    .faq summary{font-weight:600;cursor:pointer}
    .faq p{margin-top:.6rem;color:#4a4a42;max-width:78ch}
    .cruzado{background:#f2efe6;border-left:4px solid var(--dourado);padding:1.1rem 1.3rem;margin:2.2rem 0 0;font-size:.94rem;color:#4a4a42;border-radius:0 4px 4px 0}
    .cruzado a{font-weight:600}
    .cta{background:var(--preto);color:#fff;text-align:center;padding:2.4rem 1.4rem;margin:2.6rem 0 0;border-radius:4px}
    .cta strong{font-size:1.25rem;display:block;margin-bottom:.5rem;font-weight:600}
    .cta p{opacity:.85;max-width:52ch;margin:0 auto .9rem;font-weight:300}
    .cta a.btn{display:inline-block;background:#25D366;color:#fff;font-weight:600;text-decoration:none;border-radius:4px;padding:.95rem 1.8rem;letter-spacing:.05em}
    .links-uteis{display:flex;flex-wrap:wrap;gap:1.2rem;justify-content:center;margin:1.6rem 0 2.6rem;font-size:.84rem}
    .links-uteis a{color:var(--muted)}
    footer{background:#101010;color:rgba(255,255,255,.7);padding:2.5rem 5%;text-align:center;font-size:.82rem;font-weight:300}
    footer .footer-links{display:flex;flex-wrap:wrap;gap:1.4rem;justify-content:center;margin-bottom:1rem}
    footer a{color:rgba(255,255,255,.75);text-decoration:none;letter-spacing:.08em;text-transform:uppercase;font-size:.74rem}
    footer a:hover{color:var(--dourado)}`;

// ─── malha e camada de marca da rodada anterior ───
// A malha (gera-relacionados, que roda DEPOIS) e a camada de marca (identidade.js, último do
// ritual) são preservadas: sem isto, rodar um gerador sozinho publicava a página sem malha e
// sem a tipografia da marca (aconteceu em 09/10/2026).
function lerAnterior(arq) {
  let malha = '', marca = '';
  if (fs.existsSync(arq)) {
    const old = fs.readFileSync(arq, 'utf8');
    const i = old.indexOf('<!--GEN:malha-->'), j = old.indexOf('<!--/GEN:malha-->');
    if (i >= 0 && j > i) malha = old.slice(i + '<!--GEN:malha-->'.length, j);
    marca = (old.match(/\n?\s*<style id="marca">[\s\S]*?<\/style>/) || [''])[0];
  }
  return { malha, marca };
}
// grava a página repondo a camada de marca no mesmo ponto em que o identidade.js a injeta
// (depois do 1º </style>)
function gravar(arq, html, marca) {
  let saida = html;
  if (marca && !saida.includes('id="marca"')) {
    const k = saida.indexOf('</style>');
    if (k > 0) saida = saida.slice(0, k + 8) + marca + saida.slice(k + 8);
  }
  fs.mkdirSync(require('path').dirname(arq), { recursive: true });
  fs.writeFileSync(arq, saida, 'utf8');
  if (!saida.includes('id="marca"')) console.log('  ATENCAO: pagina sem a camada de marca; rode node identidade.js antes de publicar');
  return saida;
}

module.exports = {
  R, WA, extrair, SD, APTOS_F, APTOS, VENDIDOS, EDICAO,
  brl, mil, MES_ABREV, mesLongo, mesExtenso, mesDe, tabMes, tabDe, esc, semTags, eMCMV, wa,
  dimWebp, miniatura, badgeCls, badgeTxt, card, CSS_HUB, lerAnterior, gravar,
};
