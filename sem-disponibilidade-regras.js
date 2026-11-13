/* ═══════════════════════════════════════════════════════════════════
   SEM-DISPONIBILIDADE-REGRAS — a regra do "sem disponibilidade" num lugar só
   ───────────────────────────────────────────────────────────────────
   Desde 09/11/2026 um empreendimento pode ser marcado "sem disponibilidade"
   na Central. A Central publica a lista; o leitor (ferramentas/sem-disponibilidade.js,
   passo 00 do ritual) grava sem-disponibilidade.json na raiz, e TODO gerador que
   lista ou vende empreendimento lê a lista por este módulo:

     const SD = require('./sem-disponibilidade-regras.js').carregar();

   Duas situações por empreendimento (campo site) e uma opção (tirar_do_mapa):
     tarja    a página ganha o bloco "100% vendido" no topo (GEN:sem-disponibilidade);
              no <head>, title/description/og/twitter passam a dizer "100% vendido";
              no JSON-LD, availability SoldOut, inventoryLevel e offerCount 0, descrição
              de estoque trocada e o FAQPage sai (o FAQ visível fica como registro);
              os cards da home, dos hubs e da página de apartamentos mostram o selo
              "100% vendido (desde dd/mm/aaaa)" sem preço; sai do folheto, do folder e
              dos cards do blog (material de venda não oferece o que acabou); cards e
              linhas escritos à mão em outras páginas que oferecem preço ou estoque
              (cards "Outros empreendimentos", lista do complexo, aviso "Novo:") ficam
              guardados num <template>; no llms.txt a linha vira uma linha curta de
              "100% vendido".
     ocultar  tudo da tarja na página + <meta name="robots" content="noindex, follow">
              (o gera-sitemap tira do sitemap); sai da home, dos hubs, da página de
              apartamentos, da malha de relacionados, dos cards do blog, dos rodapés e
              listas escritos à mão (template), do llms.txt, do folheto/folder e do mapa.
              A página continua no ar e abre pelo link.
     tirar_do_mapa (com tarja; com ocultar o mapa já sai): o bairro do mapa de lotes
              fica oculto:true.
   Desmarcar = o empreendimento sai da lista: a rodada seguinte desfaz tudo (o bloco
   some, o head, o JSON-LD, o noindex, as linhas do llms.txt, os templates, o card e o
   bairro voltam). Todo efeito escrito em página feita à mão guarda o original ao lado
   (data-sd-orig do bloco, data-sd-orig da meta robots, <template> ou guardado_llms) e
   a volta é byte a byte. Marcação escrita À MÃO (oculto:true, noindex, texto) não é
   desta regra: o passo 00 nunca a desfaz.

   O que este módulo NÃO faz: não edita APTOS/LOTES (a fonte única continua com o
   preço da última tabela; o Observatório explica o que faz com isso) e não reescreve
   texto corrido de artigo ou de ficha (o leitor lista, como AVISO, cada linha fora
   dos blocos gerados que ainda cita o empreendimento, para tratar antes do push).

   Quem usa: gera-folheto, gera-folder-2dobras, gera-observatorio, gera-home,
   gera-apartamentos, gera-alphaville, gera-blog-ofertas, gera-relacionados,
   ferramentas/valida-site.js e o leitor (páginas, links à mão, mapa e llms.txt,
   que não têm gerador próprio).
   ═══════════════════════════════════════════════════════════════════ */

const fs = require('fs');
const path = require('path');

const RAIZ = __dirname;
const ARQ = path.join(RAIZ, 'sem-disponibilidade.json');
const DOMINIO = 'https://lancamentos.imoveisvivamerica.com.br';
const MAPA = 'mapa-lotes-indaiatuba';
const SITUACOES = ['tarja', 'ocultar'];

// correspondência explícita ficha/landing → bairros do mapa, para quando o BAIRROS do
// mapa não tem landing:'/slug/' nem nome igual ao da fonte única. Vazia em 09/11/2026:
// todo lote da fonte única que está no mapa tem landing: no bairro.
const MAPA_POR_SLUG = {
  // 'slug-da-landing': ['id-do-bairro', ...],
};

// páginas que um gerador escreve INTEIRAS a cada rodada: o leitor não mexe nelas (o
// gerador já respeita a lista) e não as lista nos avisos de "link escrito à mão"
const PAGINAS_GERADAS = ['apartamentos-na-planta-indaiatuba/index.html', 'precos-lancamentos-indaiatuba/index.html',
  'imprensa-e-dados/index.html', 'alphaville/index.html', 'blog/index.html', 'folheto-lancamentos.html'];
const FORA = /^(ferramentas|qrcode|quermesse|seo|node_modules|\.git|\.claude|folder|treinamento)(\/|$)/;

// hub com unidades à venda, por tipo de empreendimento
const HUB = {
  apto: { url: '/apartamentos-na-planta-indaiatuba/', txt: 'Ver os apartamentos na planta com unidades à venda' },
  lote: { url: '/loteamentos-em-indaiatuba/', txt: 'Ver os loteamentos e condomínios com lotes à venda' },
  outro: { url: '/#lancamentos', txt: 'Ver os lançamentos com unidades à venda' },
};
const QUEM = { apto: 'a construtora', lote: 'a loteadora', outro: 'a incorporadora' };
const TODAS = { apto: 'Todas as unidades foram vendidas', lote: 'Todos os lotes foram vendidos', outro: 'Todas as unidades foram vendidas' };
const SEM = { apto: 'sem unidades à venda', lote: 'sem lotes à venda', outro: 'sem unidades à venda' };

const ROBOTS_NOINDEX = 'noindex, follow';
const SOLDOUT = 'https://schema.org/SoldOut';
const SOLDOUT_INS = SOLDOUT + '__sd';                  // marcador de availability inserida (só durante a troca)
const INS_AV = ', "availability": "' + SOLDOUT_INS + '"';
const FAQ_MARCA = '<!--sd:faqpage-->';

// texto de JSON-LD que fala de estoque (descrição de oferta, de Product/Residence...)
const RE_ESTOQUE_TXT = /[úu]ltim[oa]s?\s+\d|\d+\s+(?:unidades?|lotes?|apartamentos?|casas?|aptos?)\b|dispon[íi]ve(?:l|is)|restam?\s+\d|\d+\s*%\s*vendid|estoque/i;
// trechos de estoque no campo s da fonte única ("· últimas 3 unidades (09/10/2026)", "· 74 unidades (05/10/2026)",
// "· 166 disponíveis (11/10/2026)", "· 98% vendido (...)") e o "2 lotes de" dos lotes
const RE_ESTOQUE_S = /\s*·\s*(?:últimas \d+ unidades|\d+ (?:unidades|disponíveis)|\d+% vendido)(?:\s*\([^)]*\))?/gi;
const semEstoque = s => String(s || '').replace(RE_ESTOQUE_S, '').replace(/\b\d+ lotes de\b/gi, 'lotes de').replace(/\b(?:últimas|restam) \d+ (?:unidades|lotes)\b\s*/gi, '').trim();
// linha escrita à mão que oferece preço ou estoque
const RE_OFERTA = /R\$\s?\d|[úu]ltim[oa]s?\s+\d|\d+\s+(?:unidades|disponíveis)|lotes?\s+dispon|a partir de/i;

const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const desc = s => String(s).replace(/&quot;/g, '"').replace(/&#x27;/g, "'").replace(/&#39;/g, "'").replace(/&gt;/g, '>').replace(/&lt;/g, '<').replace(/&amp;/g, '&');
const dataBR = iso => iso.split('-').reverse().join('/');   // 2026-11-09 → 09/11/2026
const b64 = o => Buffer.from(JSON.stringify(o), 'utf8').toString('base64');
const deB64 = s => JSON.parse(Buffer.from(s, 'base64').toString('utf8'));
const mesSeguinte = ym => { const [a, m] = ym.split('-').map(Number); return m === 12 ? (a + 1) + '-01' : a + '-' + String(m + 1).padStart(2, '0'); };

// ─── leitura da fonte única (como texto, igual aos geradores) ───
function extrairArray(arquivo, nome) {
  const f = path.join(RAIZ, arquivo);
  if (!fs.existsSync(f)) return [];
  const src = fs.readFileSync(f, 'utf8');
  const ini = src.indexOf('const ' + nome + ' = [');
  if (ini < 0) return [];
  const fim = src.indexOf('\n];', ini);
  return eval(src.slice(ini + ('const ' + nome + ' = ').length, fim + 2));
}
let _fonte = null;
function fonte() {
  if (_fonte) return _fonte;
  const APTOS = extrairArray('gera-folheto.js', 'APTOS');
  const LOTES = extrairArray('gera-folheto.js', 'LOTES');
  const EXTRAS = extrairArray('gera-relacionados.js', 'EXTRAS_APTOS');
  const ALPHA = extrairArray('gera-alphaville.js', 'ALPHAVILLE').filter(e => e.slug);
  _fonte = { APTOS, LOTES, EXTRAS, ALPHA };
  return _fonte;
}

// BAIRROS do mapa: id, nome, landing e se já está oculto, lidos linha a linha
function bairrosDoMapa(html) {
  const s = html != null ? html : (fs.existsSync(path.join(RAIZ, MAPA, 'index.html')) ? fs.readFileSync(path.join(RAIZ, MAPA, 'index.html'), 'utf8') : '');
  const ib = s.indexOf('const BAIRROS = [');
  if (ib < 0) return [];
  const fb = s.indexOf('\n];', ib);
  return s.slice(ib, fb).split('\n').map(l => {
    const id = /^\s*\{ id:'([^']+)'/.exec(l);
    if (!id) return null;
    const nome = /\bnome:'([^']*)'/.exec(l), landing = /\blanding:'([^']*)'/.exec(l);
    return { id: id[1], nome: nome ? nome[1] : '', landing: landing ? landing[1] : null,
      casas: /\bcasas:true\b/.test(l), ocultoManual: /\boculto:true\b(?! \/\* sem-disponibilidade \*\/)/.test(l), lotes: 0, revenda: 0 };
  }).filter(Boolean).map(b => {
    // lotes desse bairro no LOTES do mapa: os da tabela da loteadora e os de revenda (proprietário)
    const linhas = s.split('\n').filter(l => l.indexOf("{ b:'" + b.id + "'") >= 0);
    b.revenda = linhas.filter(l => /\brevenda:'/.test(l)).length;
    b.lotes = linhas.length - b.revenda;
    return b;
  });
}
const normNome = s => String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

// slugs que são ficha de empreendimento no site (só eles podem receber a marcação)
function fichasDoSite() {
  const F = fonte();
  const s = new Set();
  F.APTOS.concat(F.LOTES, F.EXTRAS, F.ALPHA).forEach(e => e.slug && s.add(e.slug));
  bairrosDoMapa().forEach(b => { const m = /^\/([a-z0-9-]+)\/$/.exec(b.landing || ''); if (m) s.add(m[1]); });
  return new Set([...s].filter(x => fs.existsSync(path.join(RAIZ, x, 'index.html'))));
}

// ─── a lista ───
// formato gravado (sem-disponibilidade.json):
// { versao: 1, empreendimentos: [ { ficha, nome, pagina, slug, bairro, site, tirar_do_mapa, desde, chegou_em } ],
//   guardado_llms?: [ { op: 'tirar'|'trocar', slug, i, linha, depois_de?, nova? } ] }
// chegou_em = dia em que a marcação entrou no site (1ª rodada do leitor que a viu)
function validarGravada(o, origem) {
  const erros = [];
  const data = s => /^\d{4}-\d{2}-\d{2}$/.test(s || '');
  if (!o || typeof o !== 'object') erros.push('não é um objeto');
  else {
    if (o.versao !== 1) erros.push('versao ' + JSON.stringify(o.versao) + ' (esperado 1)');
    if (!Array.isArray(o.empreendimentos)) erros.push('empreendimentos não é uma lista');
    else o.empreendimentos.forEach((e, i) => {
      const q = 'empreendimentos[' + i + ']';
      if (!e || typeof e !== 'object') return erros.push(q + ' não é objeto');
      if (!/^[a-z0-9-]+$/.test(e.ficha || '')) erros.push(q + '.ficha inválida');
      if (e.slug !== null && !/^[a-z0-9-]+$/.test(e.slug || '')) erros.push(q + '.slug inválido');
      if (e.bairro !== null && !/^[a-z0-9-]+$/.test(e.bairro || '')) erros.push(q + '.bairro inválido');
      if (!e.slug && !e.bairro) erros.push(q + ' sem slug e sem bairro');
      if (!SITUACOES.includes(e.site)) erros.push(q + '.site inválido');
      if (typeof e.tirar_do_mapa !== 'boolean') erros.push(q + '.tirar_do_mapa inválido');
      if (!data(e.desde)) erros.push(q + '.desde inválido');
      if (e.chegou_em !== undefined && !data(e.chegou_em)) erros.push(q + '.chegou_em inválido');
    });
    if (o.guardado_llms !== undefined && (!Array.isArray(o.guardado_llms) || o.guardado_llms.some(g => !g || !['tirar', 'trocar'].includes(g.op) || !Number.isInteger(g.i) || typeof g.linha !== 'string')))
      erros.push('guardado_llms fora do formato');
  }
  if (erros.length) throw new Error('sem-disponibilidade: ' + origem + ' inválido — ' + erros.join('; '));
  return o;
}

// edições já publicadas do Observatório (imprensa-e-dados/dados-lancamentos-indaiatuba-AAAA-MM.json)
function edicaoPublicadaAntes(edicaoIso) {
  const pasta = path.join(RAIZ, 'imprensa-e-dados');
  if (!fs.existsSync(pasta)) return null;
  const isos = fs.readdirSync(pasta).map(f => /^dados-lancamentos-indaiatuba-(\d{4}-\d{2})\.json$/.exec(f)).filter(Boolean).map(m => m[1]).filter(x => x < edicaoIso).sort();
  if (!isos.length) return null;
  const iso = isos[isos.length - 1];
  try { return { iso, urls: new Set(JSON.parse(fs.readFileSync(path.join(pasta, 'dados-lancamentos-indaiatuba-' + iso + '.json'), 'utf8')).map(r => r.url)) }; }
  catch (e) { return null; }
}

class Regras {
  constructor(lista) {
    this.lista = lista || { versao: 1, empreendimentos: [] };
    this.itens = this.lista.empreendimentos;
    this.porSlug = new Map(this.itens.filter(e => e.slug).map(e => [e.slug, e]));
  }
  // ─── consultas que os geradores usam ───
  item(slug) { return this.porSlug.get(slug) || null; }
  situacao(slug) { const e = this.item(slug); return e ? e.site : null; }
  vendido(slug) { return this.porSlug.has(slug); }            // tarja ou ocultar
  oculto(slug) { return this.situacao(slug) === 'ocultar'; }
  comTarja(slug) { return this.situacao(slug) === 'tarja'; }
  aVenda(arr) { return arr.filter(e => !this.vendido(e.slug)); }    // material de venda, preços, contagens
  visiveis(arr) { return arr.filter(e => !this.oculto(e.slug)); }   // listas com card (tarja fica, com selo)
  desdeBR(slug) { const e = this.item(slug); return e ? dataBR(e.desde) : ''; }
  desdeIso(slug) { const e = this.item(slug); return e ? e.desde : ''; }
  selo(slug) { return '100% vendido (desde ' + this.desdeBR(slug) + ')'; }
  semTxt(slug) { return SEM[this.tipoDe(slug)]; }
  hub(slug) { return HUB[this.tipoDe(slug)]; }
  semEstoque(s) { return semEstoque(s); }
  // ─── Observatório ───
  // Mês-base da marcação = o mais tardio entre o "desde" e o dia em que ela chegou ao site
  // (chegou_em): uma marcação retroativa (desde de um mês já publicado) não reescreve a edição
  // que saiu com o empreendimento dentro.
  mesBase(slug) { const e = this.item(slug); if (!e) return null; const d = e.chegou_em && e.chegou_em > e.desde ? e.chegou_em : e.desde; return d.slice(0, 7); }
  // o vendido sai das contas só na edição de mês POSTERIOR ao mês-base (a edição corrente e as
  // passadas não são reescritas; ver gera-observatorio.js)
  foraDaEdicao(slug, edicaoIso) { const b = this.mesBase(slug); return !!b && edicaoIso > b; }
  // entra nas SAÍDAS ("saiu da lista") só na primeira edição fora: a última edição publicada
  // antes desta ainda o trazia (sem edição anterior em disco, vale o mês seguinte ao mês-base)
  saiNaEdicao(slug, edicaoIso) {
    if (!this.foraDaEdicao(slug, edicaoIso)) return false;
    const ant = edicaoPublicadaAntes(edicaoIso);
    if (ant) return ant.urls.has(DOMINIO + '/' + slug + '/');
    return edicaoIso === mesSeguinte(this.mesBase(slug));
  }
  tipoDe(slug) {
    const F = fonte();
    if (F.LOTES.some(e => e.slug === slug)) return 'lote';
    if (F.APTOS.some(e => e.slug === slug) || F.EXTRAS.some(e => e.slug === slug)) return 'apto';
    const b = bairrosDoMapa().find(x => x.landing === '/' + slug + '/');
    if (b) return b.casas ? 'outro' : 'lote';
    return 'outro';
  }
  // bairros do mapa de um item: pela âncora do mapa, pela tabela explícita, pelo landing: ou pelo nome
  bairrosDe(e, bairros) {
    const B = bairros || bairrosDoMapa();
    if (e.bairro) return B.filter(b => b.id === e.bairro).map(b => b.id);
    if (!e.slug) return [];
    if (MAPA_POR_SLUG[e.slug]) return MAPA_POR_SLUG[e.slug].filter(id => B.some(b => b.id === id));
    const porLanding = B.filter(b => b.landing === '/' + e.slug + '/').map(b => b.id);
    if (porLanding.length) return porLanding;
    const F = fonte();
    const f = F.LOTES.concat(F.APTOS).find(x => x.slug === e.slug);
    const nomes = [f && f.n, e.nome].filter(Boolean).map(normNome);
    return B.filter(b => nomes.includes(normNome(b.nome))).map(b => b.id);
  }
  // ids que o mapa esconde por causa da lista (ocultar, ou tirar_do_mapa)
  bairrosOcultos(bairros) {
    const B = bairros || bairrosDoMapa();
    const ids = new Set();
    this.itens.filter(e => e.site === 'ocultar' || e.tirar_do_mapa).forEach(e => this.bairrosDe(e, B).forEach(id => ids.add(id)));
    return ids;
  }
  nomeDe(slug) {
    const F = fonte();
    const f = F.APTOS.concat(F.LOTES, F.EXTRAS, F.ALPHA).find(x => x.slug === slug);
    const e = this.item(slug);
    return f ? f.n : e && e.nome ? e.nome : slug;
  }

  // ─── páginas (landing) ───
  textos(slug) {
    const t = this.tipoDe(slug), nome = this.nomeDe(slug), data = this.desdeBR(slug);
    return {
      t, nome, data,
      // descrição de JSON-LD (trocada só onde o texto falava de estoque)
      ld: nome + ': 100% vendido. ' + TODAS[t] + ', conforme informou ' + QUEM[t] + '; ' + SEM[t] + ' desde ' + data + '.',
      // description, og:description e twitter:description
      head: nome + ': 100% vendido desde ' + data + '. ' + TODAS[t] + ', conforme informou ' + QUEM[t] + '. Veja outros lançamentos' + (t === 'outro' ? '.' : ' em Indaiatuba.'),
    };
  }
  blocoPagina(slug, orig) {
    const t = this.tipoDe(slug), h = HUB[t];
    return '<div id="sem-disponibilidade" class="sd-tarja" role="note" data-sd-orig="' + b64(orig) + '"'
      + ' style="background:#7A1F1F;color:#fff;padding:16px 5%;text-align:center;line-height:1.5">'
      + '<style>.urgencia-bar,.urgencia-badge,.urgencia-section{display:none!important}</style>'
      + '<p style="margin:0;font-size:1.2rem;font-weight:700;letter-spacing:.08em;text-transform:uppercase">100% vendido</p>'
      + '<p style="margin:.35rem auto 0;max-width:64ch;font-size:.95rem">' + TODAS[t] + ', conforme informou ' + QUEM[t]
      + '. ' + SEM[t].charAt(0).toUpperCase() + SEM[t].slice(1) + ' desde ' + this.desdeBR(slug)
      + '. As informações abaixo ficam como registro do empreendimento e são da data de atualização indicada na página.</p>'
      + '<p style="margin:.6rem 0 0"><a href="' + h.url + '" style="color:#fff;font-weight:700;text-decoration:underline">' + h.txt + ' →</a></p>'
      + '</div>';
  }
  // tira da página tudo o que este módulo pôs (volta byte a byte ao original)
  static limparPagina(html) {
    let s = html, orig = null;
    const RE_BLOCO = /\n<!--GEN:sem-disponibilidade-->([\s\S]*?)<!--\/GEN:sem-disponibilidade-->/;
    const m = RE_BLOCO.exec(s);
    if (m) {
      const d = /data-sd-orig="([^"]*)"/.exec(m[1]);
      if (!d) throw new Error('sem-disponibilidade: bloco sem data-sd-orig — confira à mão antes de seguir');
      orig = deB64(d[1]);
      s = s.replace(RE_BLOCO, '');
    }
    // robots: o original fica em data-sd-orig; vazio = a página não tinha a meta
    s = s.replace(/\n?<meta name="robots" content="[^"]*" data-sd-orig="([^"]*)">/g, (m0, o) => {
      const ori = desc(o);
      return ori ? m0.replace(/content="[^"]*" data-sd-orig="[^"]*"/, 'content="' + esc(ori) + '"') : '';
    });
    if (!orig) return s;
    // <head>
    for (const [k, re] of HEAD_TAGS) if (orig.head && orig.head[k] !== undefined) s = s.replace(re, (m0, a, v, b) => a + orig.head[k] + b);
    // FAQPage tirado: volta no lugar da marca
    let f = 0;
    s = s.replace(new RegExp(FAQ_MARCA, 'g'), () => { if (f >= orig.faq.length) throw new Error('sem-disponibilidade: marca de FAQPage a mais na página'); return orig.faq[f++]; });
    if (f !== orig.faq.length) throw new Error('sem-disponibilidade: a página perdeu a marca do FAQPage guardado — confira à mão antes de seguir');
    // JSON-LD: os mesmos tokens, na mesma ordem, recebem o original
    const n = { av: 0, inv: 0, oc: 0, desc: 0 };
    s = foraDaEntidade(s, t => t.replace(RE_LD, (bloco, corpo) => {
      let c = corpo;
      c = c.replace(/(, )?("availability"\s*:\s*")([^"]*)(")/g, (m0, vg, a, v, b) => {
        const o = orig.av[n.av++];
        if (o === undefined) throw new Error('sem-disponibilidade: availability a mais na página');
        if (o === null) { if (vg !== ', ') throw new Error('sem-disponibilidade: availability inserida fora do lugar'); return ''; }
        return (vg || '') + a + o + b;
      });
      c = c.replace(RE_INV1, (m0, a, v) => { const o = orig.inv[n.inv++]; if (o === undefined) throw new Error('sem-disponibilidade: inventoryLevel a mais'); return a + o; });
      c = c.replace(RE_INV2, (m0, a, v) => { const o = orig.inv[n.inv++]; if (o === undefined) throw new Error('sem-disponibilidade: inventoryLevel a mais'); return a + o; });
      c = c.replace(RE_OC, (m0, a, v) => { const o = orig.oc[n.oc++]; if (o === undefined) throw new Error('sem-disponibilidade: offerCount a mais'); return a + o; });
      c = c.replace(RE_DESC, (m0, a, lit) => {
        let v; try { v = JSON.parse(lit); } catch (e) { return m0; }
        if (v !== orig.descNovo) return m0;
        const o = orig.desc[n.desc++]; if (o === undefined) throw new Error('sem-disponibilidade: descrição trocada a mais'); return a + o;
      });
      return c === corpo ? bloco : bloco.replace(corpo, () => c);
    }));
    for (const k of Object.keys(n)) if (n[k] !== orig[k].length)
      throw new Error('sem-disponibilidade: a página tem ' + n[k] + ' ' + k + ' e o bloco guardou ' + orig[k].length + ' — confira à mão antes de seguir');
    return s;
  }
  aplicarPagina(html, slug) {
    let s = Regras.limparPagina(html);
    const e = this.item(slug);
    if (!e) return s;
    const T = this.textos(slug);
    const orig = { av: [], inv: [], oc: [], desc: [], descNovo: T.ld, faq: [], head: {} };
    // <head>: title "<nome do title>: 100% vendido"; description/og/twitter com a frase curta
    const tm = HEAD_TAGS[0][1].exec(s);
    const nomeTit = tm ? desc(tm[2]).split(/\s+[|·—–]\s+|:\s/)[0].trim() : T.nome;
    const novoHead = { title: esc(nomeTit + ': 100% vendido'), description: esc(T.head) };
    novoHead['og:title'] = novoHead['twitter:title'] = novoHead.title;
    novoHead['og:description'] = novoHead['twitter:description'] = novoHead.description;
    for (const [k, re] of HEAD_TAGS) s = s.replace(re, (m0, a, v, b) => { orig.head[k] = v; return a + novoHead[k] + b; });
    // JSON-LD (fora do bloco da entidade)
    s = foraDaEntidade(s, t => t.replace(RE_LD, (bloco, corpo) => {
      let o; try { o = JSON.parse(corpo); } catch (err) { return bloco; }
      const tipos = [].concat(o && o['@type'] || []);
      if (tipos.includes('FAQPage')) { orig.faq.push(bloco); return FAQ_MARCA; }
      let c = inserirAvailability(corpo, o);
      c = c.replace(/("availability"\s*:\s*")([^"]*)(")/g, (m0, a, v, b) => { orig.av.push(v === SOLDOUT_INS ? null : v); return a + SOLDOUT + b; });
      c = c.replace(RE_INV1, (m0, a, v) => { orig.inv.push(v); return a + '0'; });
      c = c.replace(RE_INV2, (m0, a, v) => { orig.inv.push(v); return a + '0'; });
      c = c.replace(RE_OC, (m0, a, v) => { orig.oc.push(v); return a + '0'; });
      c = c.replace(RE_DESC, (m0, a, lit) => {
        let v; try { v = JSON.parse(lit); } catch (err) { return m0; }
        if (!RE_ESTOQUE_TXT.test(v)) return m0;
        orig.desc.push(lit); return a + JSON.stringify(T.ld);
      });
      return c === corpo ? bloco : bloco.replace(corpo, () => c);
    }));
    const bloco = '\n<!--GEN:sem-disponibilidade-->' + this.blocoPagina(slug, orig) + '<!--/GEN:sem-disponibilidade-->';
    const k = s.indexOf('<!--/GEN:menu-->');
    if (k >= 0) s = s.slice(0, k + 16) + bloco + s.slice(k + 16);
    else { const b = /<body[^>]*>/.exec(s); if (!b) throw new Error('sem-disponibilidade: ' + slug + ' sem <body>'); s = s.slice(0, b.index + b[0].length) + bloco + s.slice(b.index + b[0].length); }
    if (e.site === 'ocultar') {
      const r = /<meta name="robots" content="([^"]*)">/.exec(s);
      if (r) s = s.replace(r[0], '<meta name="robots" content="' + ROBOTS_NOINDEX + '" data-sd-orig="' + r[1] + '">');
      else s = s.replace(/(<meta charset="[^"]*">)/i, '$1\n<meta name="robots" content="' + ROBOTS_NOINDEX + '" data-sd-orig="">');
    }
    return s;
  }
  // todas as landings (pastas da raiz com index.html): marca as da lista e limpa as que saíram
  aplicarPaginas(opc) {
    const o = opc || {}, mudou = [], semPagina = [];
    const pastas = fs.readdirSync(RAIZ, { withFileTypes: true }).filter(d => d.isDirectory() && fs.existsSync(path.join(RAIZ, d.name, 'index.html'))).map(d => d.name);
    this.itens.filter(e => e.slug && !pastas.includes(e.slug)).forEach(e => semPagina.push(e.slug));
    for (const p of pastas) {
      const f = path.join(RAIZ, p, 'index.html');
      const antes = fs.readFileSync(f, 'utf8');
      if (!this.item(p) && antes.indexOf('GEN:sem-disponibilidade') < 0 && antes.indexOf('data-sd-orig=') < 0) continue;
      const depois = this.aplicarPagina(antes, p);
      if (depois !== antes) { mudou.push(p); if (!o.ensaio) fs.writeFileSync(f, depois, 'utf8'); }
    }
    return { mudou, semPagina };
  }

  // ─── links e cards escritos à mão em outras páginas ───
  // Guardados dentro de <template data-sd-link="slug"> (o navegador não mostra e o robô não segue);
  // a rodada seguinte tira todos os templates e marca de novo pela lista atual.
  //   tarja e ocultar: card "Outros empreendimentos" (a.outro-card, a.alt-card); linha que é só um link
  //                    com preço ou estoque (lista do complexo); no rodapé, <p> curto com um link só
  //                    ("Novo: ...") com preço ou estoque
  //   só ocultar:      no rodapé (<footer>), qualquer link e o <p> curto com um link só; selo "no site"
  //                    (a.selo) da lista A–Z
  // O resto (texto corrido de artigo e de ficha) vira AVISO com arquivo:linha.
  static paginasDoSite() {
    const out = [];
    const anda = d => {
      for (const x of fs.readdirSync(path.join(RAIZ, d), { withFileTypes: true })) {
        const rel = d ? d + '/' + x.name : x.name;
        if (FORA.test(rel)) continue;
        if (x.isDirectory()) anda(rel);
        else if (x.name.endsWith('.html')) out.push(rel);
      }
    };
    anda('');
    return out.sort();
  }
  static restaurarLinks(h) { return h.replace(/<template data-sd-link="[a-z0-9-]+">([\s\S]*?)<\/template>/g, '$1'); }
  marcarLinks(h, propria) {
    let s = h;
    const env = (slug, x) => '<template data-sd-link="' + slug + '">' + x + '</template>';
    for (const e of this.itens.filter(x => x.slug && x.slug !== propria)) {
      const oc = e.site === 'ocultar';
      const url = '(?:/|https://lancamentos\\.imoveisvivamerica\\.com\\.br/|\\.\\./)' + e.slug + '/';
      const HREF = new RegExp('\\shref="' + url + '"');
      // cada passo recalcula os trechos protegidos e os <footer> (o passo anterior pode ter posto template)
      const passo = (re, teste, monta) => {
        const prot = protegidos(s);
        const rodapes = [];
        { const rf = /<footer\b[\s\S]*?<\/footer>/g; let m; while ((m = rf.exec(s))) rodapes.push([m.index, m.index + m[0].length]); }
        const noRodape = off => rodapes.some(([i, j]) => off >= i && off < j);
        s = s.replace(re, function () {
          const a = arguments, m0 = a[0], off = a[a.length - 2];
          if (prot(off, m0.length) || !teste(a, noRodape(off))) return m0;
          return monta(a);
        });
      };
      // 1. cards "Outros empreendimentos" (tarja e ocultar)
      passo(/<a\b[^>]*\bclass="(?:outro-card|alt-card)"[^>]*>[\s\S]*?<\/a>/g,
        a => HREF.test(/^<a\b[^>]*>/.exec(a[0])[0]) && !/<a\b/.test(a[0].slice(2)), a => env(e.slug, a[0]));
      // 2. no rodapé, <p> curto com um link só ("Novo: <a>…</a>"): ocultar sempre; tarja se oferece preço/estoque
      passo(/<p\b[^>]*>([^<]{0,20})(<a\b[^>]*>[^<]*<\/a>)([^<]{0,20})<\/p>/g,
        (a, rod) => rod && HREF.test(a[2]) && (oc || RE_OFERTA.test(a[2])), a => env(e.slug, a[0]));
      // 3. linha que é só um link (com " ·" de separador): com preço/estoque no texto (lista do complexo), em
      //    qualquer lugar; sem preço, só no rodapé e só em ocultar (fora dele pode ser pedaço de frase: vira AVISO)
      passo(/^([ \t]*)(<a\b[^>]*>[^<]*<\/a>(?: ·)?)([ \t\r]*)$/gm,
        (a, rod) => HREF.test(a[2]) && !/class="(?:outro-card|alt-card|card-img-link|btn-card|card-img)"/.test(a[2]) && (RE_OFERTA.test(a[2]) || (oc && rod)),
        a => a[1] + env(e.slug, a[2]) + a[3]);
      if (!oc) continue;
      // 4. dentro de <footer>: link (e o " · " que vem depois)
      passo(/<a\b[^>]*>[^<]*<\/a>(?: · )?/g, (a, rod) => rod && HREF.test(/^<a\b[^>]*>/.exec(a[0])[0]), a => env(e.slug, a[0]));
      // 5. selo "no site · X" da lista A–Z
      passo(/<a class="selo"[^>]*>[^<]*<\/a>/g, a => HREF.test(a[0]), a => env(e.slug, a[0]));
    }
    return s;
  }
  // linhas fora de bloco gerado e de template que ainda citam um empreendimento marcado
  static restos(h, slug, soOferta, extra) {
    const prot = protegidos(h, extra);
    const out = [];
    const re = new RegExp('href="(?:/|https://lancamentos\\.imoveisvivamerica\\.com\\.br/|\\.\\./)' + slug + '/', 'g');
    let m;
    const linhas = h.split('\n');
    const iniLinha = []; { let p = 0; for (const l of linhas) { iniLinha.push(p); p += l.length + 1; } }
    const vistos = new Set();
    while ((m = re.exec(h))) {
      if (prot(m.index, m[0].length)) continue;
      let i = 0, lo = 0, hi = iniLinha.length - 1;
      while (lo <= hi) { const md = (lo + hi) >> 1; if (iniLinha[md] <= m.index) { i = md; lo = md + 1; } else hi = md - 1; }
      if (vistos.has(i)) continue;
      vistos.add(i);
      const txt = linhas[i].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
      const oferta = RE_OFERTA.test(txt);
      if (soOferta && !oferta) continue;
      out.push({ linha: i + 1, oferta, txt: txt.slice(0, 110) });
    }
    return out;
  }
  aplicarLinks(opc) {
    const o = opc || {}, mudou = [], restos = {};
    for (const rel of Regras.paginasDoSite()) {
      const f = path.join(RAIZ, rel);
      const antes = fs.readFileSync(f, 'utf8');
      const gerada = PAGINAS_GERADAS.includes(rel);
      if (antes.indexOf('data-sd-link=') < 0 && (gerada || !this.itens.some(e => e.slug && antes.indexOf(e.slug + '/') >= 0))) continue;
      let s = Regras.restaurarLinks(antes);
      const propria = rel.replace(/\/index\.html$/, '');
      if (!gerada) s = this.marcarLinks(s, propria);
      if (s !== antes) { mudou.push(rel); if (!o.ensaio) fs.writeFileSync(f, s, 'utf8'); }
      if (gerada) continue;
      // cards da home, grade e destaque dos hubs: quem cuida é o gera-home (roda depois)
      const extra = rel === 'index.html' ? /<article class="listing-card"[\s\S]*?<\/article>/g
        : /^(loteamentos-em-indaiatuba|condominios-fechados-indaiatuba)\/index\.html$/.test(rel) ? /<section class="featured-section">[\s\S]*?<\/section>/g : null;
      for (const e of this.itens.filter(x => x.slug && x.slug !== propria)) {
        const r = Regras.restos(s, e.slug, e.site !== 'ocultar', extra);
        if (r.length) (restos[e.slug] = restos[e.slug] || []).push(...r.map(x => rel + ':' + x.linha + (x.oferta ? ' [preço/estoque]' : '') + ' — ' + x.txt));
      }
    }
    return { mudou, restos };
  }

  // ─── mapa de lotes ───
  aplicarMapa(opc) {
    const o = opc || {};
    const f = path.join(RAIZ, MAPA, 'index.html');
    if (!fs.existsSync(f)) return { mudou: false, ocultos: [], semBairro: [], tarjaNoMapa: [], jaOcultos: [], revenda: [] };
    const antes = fs.readFileSync(f, 'utf8');
    const MARCA = "oculto:true /* sem-disponibilidade */, ";
    let s = antes.split(MARCA).join('');
    const B = bairrosDoMapa(s);
    const ocultos = this.bairrosOcultos(B);
    const jaOcultos = [], revenda = [];
    ocultos.forEach(id => {
      const b = B.find(x => x.id === id);
      if (b.ocultoManual) { jaOcultos.push(id); return; }
      if (b.revenda) revenda.push(id + ' (' + b.revenda + ' lote(s) de revenda de proprietário, que não são da tabela da loteadora, saem do mapa junto)');
      s = s.replace("{ id:'" + id + "', ", "{ id:'" + id + "', " + MARCA);
    });
    // avisos: item que devia sair do mapa e não tem bairro; tarja que fica no mapa com lotes
    // (apartamento oculto não está no mapa e não precisa de aviso; só quem pediu "tirar do mapa" ou lote oculto)
    const semBairro = this.itens.filter(e => (e.tirar_do_mapa || (e.site === 'ocultar' && e.slug && this.tipoDe(e.slug) === 'lote')) && !this.bairrosDe(e, B).length).map(e => e.slug || e.ficha);
    const tarjaNoMapa = this.itens.filter(e => e.site === 'tarja' && !e.tirar_do_mapa)
      .map(e => ({ e, ids: this.bairrosDe(e, B) })).filter(x => x.ids.length)
      .map(x => (x.e.slug || x.e.ficha) + ' (' + x.ids.map(id => { const b = B.find(z => z.id === id); return id + ': ' + b.lotes + ' lote(s) da tabela' + (b.revenda ? ' + ' + b.revenda + ' de revenda' : ''); }).join(', ') + ')');
    const mudou = s !== antes;
    if (mudou && !o.ensaio) fs.writeFileSync(f, s, 'utf8');
    return { mudou, ocultos: [...ocultos].sort(), semBairro, tarjaNoMapa, jaOcultos, revenda };
  }

  // ─── llms.txt (escrito à mão, sem gerador) ───
  // ocultar: a linha sai (e o título da seção, se ela ficar vazia; a contagem "— N empreendimentos"
  // do título acompanha); tarja: a linha vira uma linha curta de "100% vendido".
  // Cada operação fica em guardado_llms, na ordem em que foi feita; a rodada seguinte desfaz TODAS,
  // de trás para a frente (pilha exata), e só então aplica a lista atual.
  aplicarLlms(guardadoAnterior, opc) {
    const o = opc || {};
    const f = path.join(RAIZ, 'llms.txt');
    const avisos = [];
    if (!fs.existsSync(f)) return { mudou: false, guardado: guardadoAnterior || [], avisos };
    const antes = fs.readFileSync(f, 'utf8');
    const linhas = antes.split('\n');
    // 1. desfaz tudo, de trás para a frente
    const ops = guardadoAnterior || [];
    for (let k = ops.length - 1; k >= 0; k--) {
      const g = ops[k];
      if (g.op === 'trocar') {
        const i = linhas[g.i] === g.nova ? g.i : linhas.indexOf(g.nova);
        if (i < 0) { avisos.push('llms.txt: a linha marcada de ' + (g.slug || 'uma seção') + ' foi mudada à mão; a original não voltou: "' + g.linha.slice(0, 80) + '"'); continue; }
        linhas[i] = g.linha;
      } else {
        let i = g.i;
        if (!(i <= linhas.length && (i === 0 ? g.depois_de === '' : linhas[i - 1] === g.depois_de))) {
          const j = linhas.indexOf(g.depois_de);
          i = j >= 0 ? j + 1 : -1;
        }
        if (i < 0) { avisos.push('llms.txt: a âncora da linha de ' + (g.slug || 'uma seção') + ' sumiu (arquivo mudado à mão); a linha voltou no fim do arquivo'); linhas.push(g.linha); }
        else linhas.splice(i, 0, g.linha);
      }
    }
    // 2. aplica a lista atual, guardando cada operação na ordem
    const guardado = [];
    const urlDe = slug => DOMINIO + '/' + slug + '/';
    const donoDe = l => l.startsWith('- [') ? this.itens.find(e => e.slug && l.indexOf('](' + urlDe(e.slug) + ')') > 0) || null : null;
    const ehTitulo = l => /^#{1,6} /.test(l);
    // 2a. tarja: troca a linha (não muda índice)
    linhas.forEach((l, i) => {
      const e = donoDe(l);
      if (!e || e.site !== 'tarja') return;
      const m = /^(- \[[^\]]*\]\([^)]*\))/.exec(l);
      const t = this.tipoDe(e.slug);
      const nova = m[1] + ': **100% vendido** (' + SEM[t] + ' desde ' + this.desdeBR(e.slug) + '), conforme informou ' + QUEM[t] + '. A página fica como registro do empreendimento.';
      guardado.push({ op: 'trocar', slug: e.slug, i, linha: l, nova });
      linhas[i] = nova;
    });
    // 2b. ocultar: seção a seção, de baixo para cima (cada índice guardado vale no momento da operação)
    const titulos = linhas.map((l, i) => ehTitulo(l) ? i : -1).filter(i => i >= 0);
    const secoes = titulos.map((h, k) => ({ h, fim: k + 1 < titulos.length ? titulos[k + 1] : linhas.length }));
    for (let k = secoes.length - 1; k >= 0; k--) {
      const { h, fim } = secoes[k];
      const tirar = [];
      for (let i = h + 1; i < fim; i++) { const e = donoDe(linhas[i]); if (e && e.site === 'ocultar') tirar.push({ i, slug: e.slug }); }
      if (!tirar.length) continue;
      const vazia = h > 0 && /^#{2,6} /.test(linhas[h]) && linhas.slice(h + 1, fim).every((l, d) => !l.trim() || tirar.some(x => x.i === h + 1 + d));
      const rem = vazia ? Array.from({ length: fim - h }, (_, d) => ({ i: h + d, slug: tirar[0].slug })) : tirar;
      for (let r = rem.length - 1; r >= 0; r--) {
        const i = rem[r].i;
        guardado.push({ op: 'tirar', slug: rem[r].slug, i, linha: linhas[i], depois_de: i > 0 ? linhas[i - 1] : '' });
        linhas.splice(i, 1);
      }
      if (!vazia) {
        const c = /— (\d+) empreendimentos\b/.exec(linhas[h]);
        if (c) {
          const nova = linhas[h].replace(c[0], '— ' + (+c[1] - tirar.length) + ' empreendimentos');
          guardado.push({ op: 'trocar', slug: tirar[0].slug, i: h, linha: linhas[h], nova });
          linhas[h] = nova;
        }
      }
    }
    const depois = linhas.join('\n');
    const mudou = depois !== antes;
    if (mudou && !o.ensaio) fs.writeFileSync(f, depois, 'utf8');
    return { mudou, guardado, avisos };
  }

  // ─── cards da home (index.html, escritos à mão) ───
  // ocultar → o <article> inteiro vai para dentro de <template data-sd-oculto="slug">;
  // tarja   → o card-body original vai para <template data-sd-orig="card-body"> e um card-body
  //           novo, sem preço e com o selo, fica no lugar; data-preco/data-faixa/data-pm2 do
  //           <article> viram data-sd-* (o filtro de preço deixa de achar o card). homeRestaurar
  //           desfaz os dois.
  static homeRestaurar(h) {
    let s = h.replace(/<template data-sd-oculto="[a-z0-9-]+">(<article class="listing-card"[\s\S]*?<\/article>)<\/template>/g, '$1');
    s = s.replace(/ data-sd-(preco|faixa|pm2)="/g, ' data-$1="');
    const T0 = '<template data-sd-orig="card-body">';
    let i;
    while ((i = s.indexOf(T0)) >= 0) {
      const fimT = s.indexOf('</template>', i);
      const orig = s.slice(i + T0.length, fimT);
      const fimArt = s.indexOf('</article>', fimT);
      const fimBody = s.lastIndexOf('</div>', fimArt) + 6;
      s = s.slice(0, i) + orig + s.slice(fimBody);
    }
    return s;
  }
  homeAplicar(h) {
    let s = h;
    const desc0 = { apto: 'Todas as unidades foram vendidas, conforme informou a construtora. A página segue no ar como registro do empreendimento.',
      lote: 'Todos os lotes foram vendidos, conforme informou a loteadora. A página segue no ar como registro do empreendimento.',
      outro: 'Todas as unidades foram vendidas, conforme informou a incorporadora. A página segue no ar como registro do empreendimento.' };
    const achados = [];
    for (const e of this.itens.filter(x => x.slug)) {
      const marca = 'href="/' + e.slug + '/" class="card-img-link"';
      const k = s.indexOf(marca);
      if (k < 0) continue;
      const ini = s.lastIndexOf('<article', k);
      const fim = s.indexOf('</article>', k) + '</article>'.length;
      const art = s.slice(ini, fim);
      achados.push(e.slug);
      if (e.site === 'ocultar') {
        s = s.slice(0, ini) + '<template data-sd-oculto="' + e.slug + '">' + art + '</template>' + s.slice(fim);
        continue;
      }
      const fimTag = art.indexOf('>') + 1;
      const tag = art.slice(0, fimTag).replace(/ data-(preco|faixa|pm2)="/g, ' data-sd-$1="');
      const iB = art.indexOf('<div class="card-body">');
      const jB = art.lastIndexOf('</div>') + 6;
      const body = art.slice(iB, jB);
      const constr = (/<p class="card-constr">[\s\S]*?<\/p>/.exec(body) || [''])[0];
      const h3 = (/<h3>[\s\S]*?<\/h3>/.exec(body) || [''])[0];
      const t = this.tipoDe(e.slug);
      const novo = '<div class="card-body" data-sd="vendido">\n'
        + '          <span class="card-badge" style="background:#7A1F1F;color:#fff;">' + this.selo(e.slug) + '</span>\n'
        + '          ' + constr + '\n'
        + '          ' + h3 + '\n'
        + '          <p class="card-desc">' + desc0[t] + '</p>\n'
        + '          <div class="card-price">' + SEM[t].charAt(0).toUpperCase() + SEM[t].slice(1) + '</div>\n'
        + '          <div class="card-actions">\n'
        + '            <a href="/' + e.slug + '/" class="btn-card">Ver a página</a>\n'
        + '          </div>\n'
        + '        </div>';
      const art2 = tag + art.slice(fimTag, iB) + '<template data-sd-orig="card-body">' + body + '</template>' + novo + art.slice(jB);
      s = s.slice(0, ini) + art2 + s.slice(fim);
    }
    return { html: s, achados };
  }
  // conta os cards da home fora dos <template> (o que a pessoa vê)
  static cardsVisiveis(h) {
    const semTpl = h.replace(/<template data-sd-oculto="[a-z0-9-]+">[\s\S]*?<\/template>/g, '');
    return (semTpl.match(/<article class="listing-card"/g) || []).length;
  }
  // seção escrita à mão (ex.: "Lançamento em Destaque" do hub de loteamentos) que destaca um
  // empreendimento marcado: vai inteira para dentro de <template data-sd-oculto="slug">
  static secaoRestaurar(h) { return h.replace(/<template data-sd-oculto="[a-z0-9-]+">(<section\b[\s\S]*?<\/section>)<\/template>/g, '$1'); }
  secaoAplicar(h, classe) {
    let s = h, achados = [];
    const re = new RegExp('<section class="' + classe + '">[\\s\\S]*?<\\/section>', 'g');
    s = s.replace(re, sec => {
      const e = this.itens.find(x => x.slug && sec.indexOf('href="/' + x.slug + '/"') >= 0);
      if (!e) return sec;
      achados.push(e.slug);
      return '<template data-sd-oculto="' + e.slug + '">' + sec + '</template>';
    });
    return { html: s, achados };
  }
}

// title, description, og e twitter: [chave, regex com 3 grupos (antes, valor, depois)]
const HEAD_TAGS = [
  ['title', /(<title>)([^<]*)(<\/title>)/],
  ['description', /(<meta name="description" content=")([^"]*)(")/],
  ['og:title', /(<meta property="og:title" content=")([^"]*)(")/],
  ['og:description', /(<meta property="og:description" content=")([^"]*)(")/],
  ['twitter:title', /(<meta name="twitter:title" content=")([^"]*)(")/],
  ['twitter:description', /(<meta name="twitter:description" content=")([^"]*)(")/],
];
const RE_LD = /<script\b[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g;
const RE_INV1 = /("inventoryLevel"\s*:\s*\{[^{}]*?"value"\s*:\s*"?)(\d+)/g;
const RE_INV2 = /("inventoryLevel"\s*:\s*"?)(\d+)/g;
const RE_OC = /("offerCount"\s*:\s*"?)(\d+)/g;
const RE_DESC = /("description"\s*:\s*)("(?:[^"\\]|\\.)*")/g;

// aplica fn ao texto com o bloco da entidade (GEN:entidade, do identidade.js) guardado à parte
function foraDaEntidade(s, fn) {
  const ent = [];
  const t = s.replace(/<!--GEN:entidade-->[\s\S]*?<!--\/GEN:entidade-->/g, m => { ent.push(m); return '\u0000SDENT' + (ent.length - 1) + '\u0000'; });
  return fn(t).replace(/\u0000SDENT(\d+)\u0000/g, (m, i) => ent[+i]);
}
// Offer/AggregateOffer sem availability: insere uma (marcada) logo depois do "@type"
function inserirAvailability(corpo, obj) {
  const tem = [];
  const anda = v => {
    if (Array.isArray(v)) return v.forEach(anda);
    if (!v || typeof v !== 'object') return;
    if (v['@type'] === 'Offer' || v['@type'] === 'AggregateOffer') tem.push(Object.prototype.hasOwnProperty.call(v, 'availability'));
    Object.keys(v).forEach(k => anda(v[k]));
  };
  anda(obj);
  if (tem.every(Boolean)) return corpo;
  const re = /"@type"\s*:\s*"(?:Offer|AggregateOffer)"/g;
  const toks = corpo.match(re) || [];
  if (toks.length !== tem.length) return corpo;          // texto fora do padrão: não arrisca
  let k = 0;
  return corpo.replace(re, m => tem[k++] ? m : m + INS_AV);
}
// trechos que o leitor não toca: blocos GEN, <template> e comentários
function protegidos(s, extra) {
  const r = [];
  const re = /<!--GEN:([a-z0-9-]+)-->[\s\S]*?<!--\/GEN:\1-->|<template\b[\s\S]*?<\/template>|<!--[\s\S]*?-->|<script\b[\s\S]*?<\/script>/g;
  let m;
  while ((m = re.exec(s))) r.push([m.index, m.index + m[0].length]);
  if (extra) { extra.lastIndex = 0; while ((m = extra.exec(s))) r.push([m.index, m.index + m[0].length]); }
  return (off, len) => r.some(([i, j]) => off < j && off + len > i);
}

function carregar() {
  if (!fs.existsSync(ARQ)) return new Regras(null);
  return new Regras(validarGravada(JSON.parse(fs.readFileSync(ARQ, 'utf8').replace(/^﻿/, '')), 'sem-disponibilidade.json'));
}

module.exports = { carregar, Regras, validarGravada, bairrosDoMapa, fichasDoSite, semEstoque, ARQ, RAIZ, DOMINIO, MAPA, SITUACOES, PAGINAS_GERADAS, dataBR };
