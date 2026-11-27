/* GERA-FAQ-COMPRADOR — "Mais perguntas sobre o <Nome>" nas fichas de empreendimento.

   Desde 22/11/2026 (decisão do Fabio): o FAQ de cada ficha ganha as dúvidas de quem
   compra que dá para responder sem a construtora (documentos, ITBI, FGTS, distrato,
   afetação, renda, comprar morando fora, condomínio, vizinhos…). O texto vem de dados,
   não da página:

     faq-comprador/<slug>.json   um por ficha (quem escreve: o levantamento da base)
       { "slug": "...", "atualizado": "AAAA-MM-DD",
         "padrao": ["documentos","morando-fora","itbi","fgts","distrato","afetacao","renda"],
         "blocos": [ { "titulo": "Preço e pagamento", "perguntas": [
             { "p": "pergunta?", "r": "resposta", "fonte": "de onde veio", "origem": "base|ficha|vizinhos" } ] } ] }
       opcionais: "nome" ("o Vívere": artigo + nome, quando o título do FAQ atual não diz)
                  "tipo" ("apartamento" | "loteamento": força a variante dos textos padrão)
     faq-comprador/_padrao.json  textos padrão, iguais em toda ficha
       { "<id>": { "apartamento": { "p","r","fonte" }, "loteamento": { … } } }
       (variante "todos" vale para os dois tipos quando a específica não existe)

   O que faz, para cada <slug>.json:
   1. acha o FAQ atual da ficha (o bloco de FAQ do gera-faq.js com <details>);
   2. logo depois dele, escreve entre <!--GEN:faq-comprador--> e <!--/GEN:faq-comprador-->
      uma cópia da caixa do FAQ atual (mesma tag, classes e estilo, mais a classe
      faq-comprador) com o título "Mais perguntas sobre o <Nome>", um <h3> por bloco
      e um <details><summary> por pergunta — sem JavaScript; o CSS é o do FAQ da página,
      mais o <style id="faq-comprador-css"> (subtítulos e espaçamento) antes do </head>;
   3. blocos nesta ordem: Preço e pagamento · Financiamento · Obra, entrega e registro ·
      O imóvel e o condomínio · Localização e vizinhos · Documentos e custos (os da ficha
      e, depois, os padrões da lista "padrao", na ordem da lista) · Morando fora (o padrão
      "morando-fora", bloco próprio). Bloco sem pergunta não sai.
   O FAQPage do JSON-LD não é escrito aqui: o gera-faq.js (passo seguinte do ritual) lê
   TODO <details> dos blocos de FAQ da página, o atual e este, e regrava o mainEntity
   (um FAQPage só; visível = estruturado).

   Texto da resposta: texto puro (o gerador escapa < > &). Parágrafo novo = linha em
   branco. Link só para página do próprio site, de dois jeitos:
     [texto do link](/blog/slug/)       ou o caminho solto  /blog/slug/
   (o caminho solto vira link com o <h1> da página de destino como texto). O destino tem
   de existir na pasta do site. <a href="/x/">t</a> escrito no JSON também é aceito.

   GUARDAS (a ficha com erro NÃO é gravada; o resto segue; exit 1 no fim):
   · comissão, corretagem, margem, bônus (inclusive interno), valorização, lucro, retorno,
     rentabilidade, renda de aluguel, crédito aprovado/garantido — nunca no site;
   · Minha Casa Minha Vida / MCMV sem "sujeito a análise de crédito" na mesma resposta;
   · "a partir de R$ X" abaixo do preço da fonte única (APTOS/LOTES do gera-folheto.js:
     se divergirem, vale o site) ou sem o mês da tabela na resposta;
   · "condomínio fechado" em ficha que não é de condomínio fechado;
   · CPF, e-mail ou telefone que não seja o da imobiliária (dado pessoal);
   · pergunta sem "?" (o gera-faq.js retém a página), pergunta repetida no próprio JSON,
     bloco com título fora da lista, padrão sem texto para a variante, link quebrado.
   AVISOS (grava, mas leia): pergunta igual a uma do FAQ atual (pulada), pergunta
   parecida com outra (pode ser a mesma dúvida com outras palavras), "tabela de <mês>"
   quando a fonte única diz que a tabela não tem data impressa (tabRec: "tabela recebida
   em <mês>"), preço sem fonte única para conferir, "a partir de" acima do menor preço
   (só vale se for o menor de uma planta ou faixa, da mesma tabela).

   Não toca: ficha sem <slug>.json (fica como está); ficha marcada "sem disponibilidade"
   (sem-disponibilidade.json); fichas de ADIAR (lote aberto em outra janela). Se o JSON
   de uma ficha some, o bloco e o <style> dela saem na rodada seguinte. Pasta de dados
   ausente ou sem _padrao.json (outra worktree: os .json não vêm pelo git) = nada gravado.

   Ritual: depois do gera-menu e do hero-leve.py --aplicar, logo ANTES do gera-faq.js
   (que copia o visível para o FAQPage) e do gera-sitemap (que lê o texto para a data).
   Idempotente: rodado duas vezes, a segunda não muda nenhum byte. Preserva o BOM e o
   fim de linha de cada arquivo.

   Uso: node gera-faq-comprador.js [pasta-raiz] [--dados <pasta>] [--so slug1,slug2] [--ensaio]
     pasta-raiz  1º argumento ou RAIZ_SITE; sem nenhum dos dois, a pasta deste script
     --dados     pasta dos .json (padrão: <pasta-raiz>/faq-comprador)
     --so        só estas fichas
     --ensaio    mostra o que mudaria e não grava */
const fs = require('fs');
const path = require('path');

// Fichas com lote aberto em outra janela em 22/11/2026: este gerador não grava nada nelas
// (nem tira bloco). Tirou daqui quando o lote da outra janela subir.
const ADIAR = new Set([
  'pertenze-residencial-indaiatuba',
  'viva-parque-aura-indaiatuba',
  'viva-parque-sense-indaiatuba',
]);

const ORDEM_BLOCOS = ['Preço e pagamento', 'Financiamento', 'Obra, entrega e registro', 'O imóvel e o condomínio',
  'Localização e vizinhos', 'Documentos e custos', 'Morando fora'];
const DOCS = 'Documentos e custos', FORA_BR = 'Morando fora';
const semAcento = s => String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/\s+/g, ' ').trim();
const TITULO_POR_CHAVE = new Map(ORDEM_BLOCOS.map(t => [semAcento(t), t]));

const CSS = '<style id="faq-comprador-css">' +
  '.faq-comprador details.fc-tema{border:1px solid rgba(127,127,127,.28);border-radius:10px;margin:.55rem 0;padding:0 .95rem;background:transparent}' +
  '.faq-comprador details.fc-tema>summary.fc-bloco{font-size:1.05rem;font-weight:700;line-height:1.3;padding:.95rem 1.6rem .95rem 0;margin:0;color:inherit;text-align:left;letter-spacing:0;cursor:pointer;list-style:none;position:relative;border:0}' +
  '.faq-comprador details.fc-tema>summary.fc-bloco::-webkit-details-marker{display:none}' +
  '.faq-comprador details.fc-tema>summary.fc-bloco::before{display:none}' +
  '.faq-comprador details.fc-tema>summary.fc-bloco::after{content:"";position:absolute;right:.2rem;top:50%;width:.55rem;height:.55rem;border-right:2px solid currentColor;border-bottom:2px solid currentColor;transform:translateY(-70%) rotate(45deg);transition:transform .15s;opacity:.7}' +
  '.faq-comprador details.fc-tema[open]>summary.fc-bloco::after{transform:translateY(-30%) rotate(225deg)}' +
  '.faq-comprador details.fc-tema[open]>summary.fc-bloco{border-bottom:1px solid rgba(127,127,127,.2);margin-bottom:.3rem}' +
  '.faq-comprador .fc-n{font-weight:400;font-size:.85em;opacity:.65;margin-left:.35rem;white-space:nowrap}' +
  '.faq-comprador details.fc-tema>details:last-child{margin-bottom:.6rem}' +
  '@media (prefers-reduced-motion:reduce){.faq-comprador details.fc-tema>summary.fc-bloco::after{transition:none}}' +
  'section.faq-comprador{padding-top:.5rem!important}' +
  'div.faq-comprador{margin-top:2.5rem}' +
  '.faq-comprador details a{color:inherit;text-decoration:underline;text-underline-offset:2px}' +
  '.faq-comprador summary{overflow-wrap:anywhere}' +
  '</style>';
const RE_CSS = /[ \t]*<style id="faq-comprador-css">[\s\S]*?<\/style>\r?\n?/;
const RE_GEN = /\r?\n?[ \t]*<!--GEN:faq-comprador-->[\s\S]*?<!--\/GEN:faq-comprador-->/;

// ─── leitura da fonte única (o mesmo extrair dos outros geradores) ───
function extrair(raiz, arquivo, nome) {
  const src = fs.readFileSync(path.join(raiz, arquivo), 'utf8');
  const ini = src.indexOf('const ' + nome + ' = ');
  if (ini < 0) throw new Error(nome + ' não achado em ' + arquivo);
  const fim = src.indexOf('\n];', ini) + 2;
  return eval('(' + src.slice(ini + ('const ' + nome + ' = ').length, fim) + ')');
}

const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const escAttr = s => esc(s).replace(/"/g, '&quot;');
const MESES = /janeiro|fevereiro|março|marco|abril|maio|junho|julho|agosto|setembro|outubro|novembro|dezembro|\b(?:jan|fev|mar|abr|mai|jun|jul|ago|set|out|nov|dez)\/\d{2,4}|\b\d{2}\/20\d\d\b|\b20\d\d-\d\d\b/i;

// palavras que nunca vão ao site (decisão do Fabio 22/11/2026 e regras de conteúdo)
const PROIBIDAS = [
  [/comiss(?:ão|ao|ões|oes)/i, 'comissão'],
  [/corretagem/i, 'corretagem'],
  [/\bmargens?\b(?! d[ao]s? (?:rodovia|estrada|avenida|rio|c[oó]rrego|lago|represa|ribeir[aã]o))/i, 'margem'],
  [/b[oô]nus/i, 'bônus'],
  [/valoriza/i, 'valorização'],
  [/\blucr(?:o|os|ar|ativ)/i, 'lucro'],
  [/\bretorno (?:d[eo] |sobre (?:o )?)?investimento|\bretorno (?:garantido|financeiro|certo)/i, 'retorno'],
  [/rentabilidade|rendimento (?:do|de) (?:im[oó]vel|investimento|aluguel)/i, 'rentabilidade'],
  [/renda (?:de|com|do) aluguel|aluguel garantido|renda garantida|renda passiva/i, 'renda de aluguel'],
  [/cr[eé]dito (?:aprovado|garantido|f[aá]cil)|aprova[cç][aã]o (?:garantida|certa)|garantimos a aprova/i, 'aprovação de crédito'],
];
const RE_MCMV = /minha casa,? minha vida|\bmcmv\b/i;
const RE_ANALISE = /sujeit[oa]s? (?:a|à) an[aá]lise de cr[eé]dito/i;
const RE_COND_FECHADO = /condom[ií]nios? fechados?/i;
const RE_CPF = /\b\d{3}\.\d{3}\.\d{3}-\d{2}\b|\b\d{11}\b/;
const RE_EMAIL = /[\w.+-]+@[\w-]+\.[\w.]+/;
const RE_FONE = /(?:\(?\d{2}\)?\s?)?\b9?\d{4}[-\s]?\d{4}\b/g;
const FONE_EMPRESA = /98976[-\s]?9457/;

// ─── páginas ───
function lerPagina(arq) {
  const bruto = fs.readFileSync(arq);
  let html = bruto.toString('utf8');
  const bom = html.charCodeAt(0) === 0xFEFF;
  if (bom) html = html.slice(1);
  return { html, bom, nl: /\r\n/.test(html) ? '\r\n' : '\n' };
}

// título da página de destino de um link interno (h1 sem tags)
function tituloDe(raiz, caminho, FAQ) {
  const rel = caminho.replace(/^\//, '').replace(/[?#].*$/, '');
  const arq = path.join(raiz, /\.html?$/.test(rel) ? rel : path.join(rel, 'index.html'));
  if (!fs.existsSync(arq)) return null;
  const h = fs.readFileSync(arq, 'utf8');
  const m = h.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/i);
  return m ? FAQ.normalizar(m[1]) : caminho;
}

// resposta (texto puro + links internos) → HTML de parágrafos; erros vão para `erros`
function respostaHtml(r, raiz, FAQ, erros, onde) {
  let t = String(r).replace(/\r\n/g, '\n').trim();
  t = t.replace(/<a\s+href="([^"]+)"\s*>([^<]*)<\/a>/gi, (m, h, x) => '[' + x + '](' + h + ')');
  if (/<[a-zA-Z\/!]/.test(t)) erros.push(onde + ': resposta com HTML (use texto puro; link = [texto](/caminho/))');
  const links = [];
  const guardar = (href, texto) => {
    const local = href.replace(/^https:\/\/lancamentos\.imoveisvivamerica\.com\.br/, '');
    if (!/^\/[a-z0-9\-\/]*$/i.test(local)) { erros.push(onde + ': link para fora do site (' + href + ')'); return texto; }
    const tit = tituloDe(raiz, local, FAQ);
    if (tit == null) { erros.push(onde + ': link para página que não existe (' + local + ')'); return texto; }
    links.push({ href: local, texto: texto == null ? tit : texto });
    return '\u0000' + (links.length - 1) + '\u0000';
  };
  t = t.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (m, x, h) => guardar(h, x));
  t = t.replace(/(^|[\s(])((?:https:\/\/lancamentos\.imoveisvivamerica\.com\.br)?\/(?:[a-z0-9-]+\/)+)(?=$|[\s).,;:!?])/gi, (m, a, h) => a + guardar(h, null));
  return t.split(/\n\s*\n/).map(par => '<p>' + esc(par.replace(/\s*\n\s*/g, ' ')).replace(/\u0000(\d+)\u0000/g, (m, i) =>
    '<a href="' + escAttr(links[i].href) + '">' + esc(links[i].texto) + '</a>') + '</p>');
}

// texto que o visitante lê (para as guardas), sem a sintaxe de link
const textoLido = r => String(r).replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, '$1').replace(/<[^>]+>/g, '');

// palavras de conteúdo, para achar pergunta parecida
const PARADAS = new Set('a o as os um uma de do da dos das no na nos nas em e é que se para pra por com como qual quais quanto quantos quanta quantas quando onde tem ter há sobre ao aos à às eu meu minha posso pode precisa preciso vou vai ser foi esse essa este esta isso ele ela'.split(' '));
const palavras = s => new Set(semAcento(s).replace(/[^a-z0-9 ]/g, ' ').split(' ').filter(w => w.length > 2 && !PARADAS.has(w)));
// (as palavras do nome do empreendimento não contam: estão em quase toda pergunta da ficha)
function parecida(a, b, ignorar) {
  const tira = s => { for (const w of ignorar || []) s.delete(w); return s; };
  const A = tira(palavras(a)), B = tira(palavras(b));
  if (!A.size || !B.size) return 0;
  let i = 0;
  for (const w of A) if (B.has(w)) i++;
  return i / (A.size + B.size - i);
}

// acha a caixa do FAQ atual: o bloco de FAQ mais externo que contém o 1º <details> do FAQ
function caixaDoFaq(html, FAQ) {
  const vis = FAQ.paresVisiveis(html);
  if (!vis.pares.length) return null;
  const re = /<details\b[^>]*>\s*<summary\b[^>]*>([\s\S]*?)<\/summary>/gi;
  let m, pos = -1;
  while ((m = re.exec(html))) if (FAQ.normalizar(m[1]) === vis.pares[0].q) { pos = m.index; break; }
  if (pos < 0) return null;
  // árvore pelas aberturas e fechamentos de section/article/aside/div
  const pilha = [], caixas = [];
  const reT = /<!--[\s\S]*?-->|<(script|style)\b[\s\S]*?<\/\1\s*>|<(\/?)(section|article|aside|div)\b((?:"[^"]*"|'[^']*'|[^>"'])*)>/gi;
  while ((m = reT.exec(html))) {
    if (!m[3]) continue;
    if (!m[2]) pilha.push({ tag: m[3].toLowerCase(), attrs: m[4], ini: m.index, iniDentro: reT.lastIndex, pai: pilha[pilha.length - 1] || null, filhos: [] });
    else {
      const t = m[3].toLowerCase();
      let k = pilha.length - 1;
      while (k >= 0 && pilha[k].tag !== t) k--;
      if (k < 0) continue;
      const el = pilha[k];
      el.fimDentro = m.index; el.fim = reT.lastIndex;
      pilha.length = k;
      if (el.pai) el.pai.filhos.push(el);
      caixas.push(el);
    }
  }
  const attr = (el, n) => { const x = el.attrs.match(new RegExp('(?:^|\\s)' + n + '\\s*=\\s*"([^"]*)"', 'i')); return x ? x[1] : ''; };
  const ehFaq = el => /faq|perguntas|d[uú]vidas/i.test(attr(el, 'class') + ' ' + attr(el, 'id'));
  const dentro = caixas.filter(c => c.ini < pos && c.fim > pos);
  dentro.sort((a, b) => a.ini - b.ini);                 // do mais externo para o mais interno
  const faq = dentro.find(ehFaq);
  if (!faq) return null;
  // invólucros: div entre a caixa e o <details> que contém todo o FAQ (ex.: .container)
  const involucros = [];
  for (const c of dentro) if (c.ini > faq.ini && c.tag === 'div' && !/faq-item/i.test(attr(c, 'class'))) involucros.push(c);
  return { faq, involucros, attr, pos };
}

function montarBloco(ctx) {
  const { html, cx, nome, blocos, nl } = ctx;
  const linha = html.slice(html.lastIndexOf('\n', cx.faq.ini) + 1, cx.faq.ini);
  const base = /^[ \t]*$/.test(linha) ? linha : '';
  const ind = n => base + '  '.repeat(n);
  const classe = cx.attr(cx.faq, 'class');
  const estilo = cx.attr(cx.faq, 'style');
  const abre = '<' + cx.faq.tag + ' class="' + escAttr((classe ? classe + ' ' : '') + 'faq-comprador') + '" id="mais-perguntas"' +
    (estilo ? ' style="' + escAttr(estilo) + '"' : '') + ' aria-labelledby="mais-perguntas-h">';
  // rótulo e título copiam a marcação do FAQ atual (classe do h2 e do rótulo)
  const trecho = html.slice(cx.faq.iniDentro, cx.pos);
  const h2 = trecho.match(/<h2\b([^>]*)>/i);
  const rot = trecho.match(/<(p|span)\b([^>]*class="[^"]*(?:faq-label|sec-label)[^"]*"[^>]*)>/i);
  const L = [];
  L.push(base + '<!--GEN:faq-comprador-->');
  L.push(base + abre);
  let n = 1;
  for (const inv of cx.involucros) { L.push(ind(n) + '<div' + inv.attrs.replace(/\s+id="[^"]*"/i, '') + '>'); n++; }
  if (rot) L.push(ind(n) + '<' + rot[1] + rot[2] + '>Antes de comprar</' + rot[1] + '>');
  L.push(ind(n) + '<h2' + (h2 ? h2[1].replace(/\s+id="[^"]*"/i, '') : '') + ' id="mais-perguntas-h">Mais perguntas sobre ' + esc(nome) + '</h2>');
  // cascata (23/11/2026, pedido do Fabio): cada tema é um <details class="fc-tema"> fechado,
  // com o título e a contagem no <summary>; dentro, um <details> por pergunta. O gera-faq.js
  // desce no fc-tema (não o trata como pergunta), então o FAQPage continua com todas.
  for (const b of blocos) {
    const qtd = b.perguntas.length;
    L.push(ind(n) + '<details class="fc-tema"><summary class="fc-bloco">' + esc(b.titulo) +
      ' <span class="fc-n">' + qtd + (qtd === 1 ? ' pergunta' : ' perguntas') + '</span></summary>');
    for (const q of b.perguntas) {
      L.push(ind(n + 1) + '<details><summary>' + esc(q.p.trim()) + '</summary>');
      for (const p of q.html) L.push(ind(n + 2) + p);
      L.push(ind(n + 1) + '</details>');
    }
    L.push(ind(n) + '</details>');
  }
  for (let k = cx.involucros.length; k > 0; k--) { n--; L.push(ind(n) + '</div>'); }
  L.push(base + '</' + cx.faq.tag + '>');
  L.push(base + '<!--/GEN:faq-comprador-->');
  return L.join(nl);
}

function main() {
  const args = process.argv.slice(2);
  const val = k => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : null; };
  const ensaio = args.includes('--ensaio');
  const soArg = val('--so');
  const livres = args.filter((a, i) => !a.startsWith('--') && !['--dados', '--so'].includes(args[i - 1]));
  const RAIZ = path.resolve(livres[0] || process.env.RAIZ_SITE || __dirname);
  const DADOS = path.resolve(val('--dados') || path.join(RAIZ, 'faq-comprador'));
  if (!fs.existsSync(path.join(RAIZ, 'index.html'))) throw new Error('gera-faq-comprador: não achei index.html em ' + RAIZ);
  const FAQ = require(path.join(RAIZ, 'gera-faq.js'));

  const APTOS = extrair(RAIZ, 'gera-folheto.js', 'APTOS'), LOTES = extrair(RAIZ, 'gera-folheto.js', 'LOTES');
  let ALPHA = [];
  try { ALPHA = extrair(RAIZ, 'gera-alphaville.js', 'ALPHAVILLE').filter(e => e.slug); } catch (e) { /* sem Alphaville: segue */ }
  // preço "a partir de" de cada ficha: APTOS/LOTES do gera-folheto.js e, para o Alphaville de outra cidade, o p do gera-alphaville.js
  const fonte = slug => APTOS.find(e => e.slug === slug) || LOTES.find(e => e.slug === slug) || ALPHA.find(e => e.slug === slug && e.p) || null;
  // De quem é o preço: o empreendimento citado (link /slug/ ou nome da fonte única) mais perto,
  // antes do preço, no mesmo trecho (desde o último ";", ":" ou fim de frase). Sem citação: a própria ficha.
  const APELIDOS = APTOS.concat(LOTES, ALPHA.filter(e => e.p)).map(e => ({ e, nomes: [...new Set([e.n, e.n.replace(/^(?:Jardim Residencial|Residencial|Condom[ií]nio|Jardim) /i, '')])].filter(n => n.length >= 4).map(n => n.toLowerCase()) }));
  function referencia(antes, proprio) {
    let corte = 0;
    for (const m of antes.matchAll(/;|:(?!\/\/)|\.\s/g)) corte = m.index + 1;
    const trecho = antes.slice(corte), baixo = trecho.toLowerCase();
    let melhor = { pos: -1, slug: proprio, e: null };
    for (const m of trecho.matchAll(/(?:href="|\]\()(?:https:\/\/lancamentos\.imoveisvivamerica\.com\.br)?\/([a-z0-9-]+)\/?["#)]/g))
      if (m.index > melhor.pos) melhor = { pos: m.index, slug: m[1], e: fonte(m[1]) };
    for (const a of APELIDOS) for (const n of a.nomes) {
      const p = baixo.lastIndexOf(n);
      if (p > melhor.pos) melhor = { pos: p, slug: a.e.slug, e: a.e };
    }
    return melhor;
  }
  let SD = new Set();
  const arqSd = path.join(RAIZ, 'sem-disponibilidade.json');
  if (fs.existsSync(arqSd)) SD = new Set((JSON.parse(fs.readFileSync(arqSd, 'utf8')).empreendimentos || []).map(e => e.slug).filter(Boolean));

  const arqPadrao = path.join(DADOS, '_padrao.json');
  const PADRAO = fs.existsSync(arqPadrao) ? JSON.parse(fs.readFileSync(arqPadrao, 'utf8')) : {};
  const jsons = fs.existsSync(DADOS) ? fs.readdirSync(DADOS).filter(f => /^[a-z0-9-]+\.json$/.test(f)).map(f => f.replace(/\.json$/, '')) : [];
  const so = soArg ? new Set(soArg.split(',').map(s => s.trim()).filter(Boolean)) : null;

  // páginas que já têm o bloco (para tirar quando o JSON some)
  const comBloco = fs.readdirSync(RAIZ, { withFileTypes: true }).filter(d => d.isDirectory() && fs.existsSync(path.join(RAIZ, d.name, 'index.html')))
    .map(d => d.name).filter(s => fs.readFileSync(path.join(RAIZ, s, 'index.html'), 'utf8').includes('<!--GEN:faq-comprador-->'));
  // Pasta de dados ausente/vazia (ex.: outra worktree, onde faq-comprador/*.json não vem pelo git,
  // porque o .gitignore só libera .json por exceção nominal): NÃO tira bloco nenhum — senão uma
  // rodada do ritual em outra pasta apagaria as perguntas de todas as fichas.
  if ((!jsons.length || !fs.existsSync(arqPadrao)) && comBloco.length) {
    console.log('gera-faq-comprador: ' + comBloco.length + ' ficha(s) com o bloco, mas ' + (jsons.length ? 'falta ' + path.relative(RAIZ, arqPadrao) : 'nenhum JSON em ' + (path.relative(RAIZ, DADOS) || '.')) +
      ' — nada gravado (os blocos ficam como estão). Rode na pasta que tem os dados (Desktop/landing-page-faq2) ou copie a pasta faq-comprador.');
    return;
  }
  const alvos = [...new Set(jsons.concat(comBloco))].filter(s => !so || so.has(s)).sort();

  const linhas = [], avisos = [], recusadas = [];
  let gravadas = 0, iguais = 0;
  for (const slug of alvos) {
    const arq = path.join(RAIZ, slug, 'index.html');
    if (ADIAR.has(slug)) { avisos.push(slug + ': em ADIAR (lote aberto em outra janela), não tocada'); continue; }
    if (!fs.existsSync(arq)) { recusadas.push(slug + ': não existe ' + slug + '/index.html'); continue; }
    if (SD.has(slug)) { avisos.push(slug + ': marcada "sem disponibilidade", não tocada'); continue; }
    const pg = lerPagina(arq);
    let html = pg.html.replace(RE_GEN, '');
    const semJson = !jsons.includes(slug);
    if (semJson) {                                      // o JSON sumiu: tira o bloco e o estilo
      html = html.replace(RE_CSS, '');
      if (html !== pg.html) { if (!ensaio) fs.writeFileSync(arq, (pg.bom ? '﻿' : '') + html, 'utf8'); gravadas++; linhas.push('  bloco tirado  /' + slug + '/ (sem faq-comprador/' + slug + '.json)'); }
      continue;
    }
    const erros = [];
    let d;
    try { d = JSON.parse(fs.readFileSync(path.join(DADOS, slug + '.json'), 'utf8').replace(/^﻿/, '')); }
    catch (e) { recusadas.push(slug + ': JSON inválido (' + String(e.message).slice(0, 80) + ')'); continue; }
    if (d.slug !== slug) erros.push('"slug" do JSON (' + d.slug + ') diferente do nome do arquivo');

    const cx = caixaDoFaq(html, FAQ);
    if (!cx) { recusadas.push(slug + ': não achei o FAQ atual da página (bloco de FAQ com <details>)'); continue; }

    // tipo (variante dos padrões) e condomínio fechado
    const f = fonte(slug), a = ALPHA.find(e => e.slug === slug);
    const migalha = ((html.match(/"@type"\s*:\s*"BreadcrumbList"[\s\S]{0,1200}/) || [''])[0].match(/"name"\s*:\s*"([^"]+)"/g) || []).join(' ');
    let tipo = d.tipo || (APTOS.some(e => e.slug === slug) ? 'apartamento' : LOTES.some(e => e.slug === slug) ? 'loteamento'
      : a ? (/lote/i.test(a.tipo || '') ? 'loteamento' : 'apartamento')
      : /Condom[ií]nios fechados|Loteamentos/.test(migalha) ? 'loteamento' : /Apartamentos na planta/.test(migalha) ? 'apartamento' : null);
    if (!['apartamento', 'loteamento'].includes(tipo)) { recusadas.push(slug + ': não sei se é apartamento ou loteamento (ponha "tipo" no JSON)'); continue; }
    const condFechado = (f && (f.t === 'Cond. fechado' || /^Condom[ií]nio fechado/i.test(f.s || ''))) || /Condom[ií]nios fechados/.test(migalha);

    // nome com artigo, do título do FAQ atual ("… sobre o Vettia Residence")
    const h2 = html.slice(cx.faq.iniDentro, cx.pos).match(/<h2\b[^>]*>([\s\S]*?)<\/h2>/i);
    const doH2 = h2 && FAQ.normalizar(h2[1]).match(/\bsobre (o|a|os|as) (.+?)\s*\??$/i);
    const nome = d.nome || (doH2 ? doH2[1].toLowerCase() + ' ' + doH2[2] : f ? 'o ' + f.n : null);
    if (!nome) { recusadas.push(slug + ': sem nome (o título do FAQ atual não diz "sobre o <Nome>"; ponha "nome" no JSON)'); continue; }

    // monta os blocos: os do JSON + os padrões
    const porTitulo = new Map();
    for (const b of d.blocos || []) {
      const t = TITULO_POR_CHAVE.get(semAcento(b.titulo || ''));
      if (!t) { erros.push('bloco com título fora da lista: "' + b.titulo + '"'); continue; }
      if (!porTitulo.has(t)) porTitulo.set(t, []);
      for (const q of b.perguntas || []) porTitulo.get(t).push(Object.assign({ padrao: null }, q));
    }
    for (const id of d.padrao || []) {
      const ent = PADRAO[id];
      const v = ent && (ent[tipo] || ent.todos);
      if (!v || !v.p || !v.r) { erros.push('padrão "' + id + '" sem texto para ' + tipo + ' em _padrao.json'); continue; }
      const t = id === 'morando-fora' ? FORA_BR : DOCS;
      if (!porTitulo.has(t)) porTitulo.set(t, []);
      porTitulo.get(t).push({ p: v.p, r: v.r, fonte: v.fonte, origem: 'padrao', padrao: id });
    }

    const atuais = FAQ.paresVisiveis(html).pares.map(p => p.q);
    const palavrasNome = palavras(nome + ' ' + (f ? f.n : ''));
    const blocos = [], vistas = [];
    let novas = 0;
    for (const titulo of ORDEM_BLOCOS) {
      const lista = porTitulo.get(titulo);
      if (!lista || !lista.length) continue;
      const saida = [];
      for (const q of lista) {
        const onde = '"' + String(q.p || '').slice(0, 60) + '"';
        if (!q.p || !String(q.p).trim() || !q.r || !String(q.r).trim()) { erros.push('pergunta ou resposta vazia em ' + titulo + ': ' + onde); continue; }
        const qn = FAQ.normalizar(esc(q.p));
        if (!/\?\s*$/.test(qn)) erros.push(onde + ': pergunta sem "?" no fim');
        if (atuais.includes(qn)) { avisos.push(slug + ': ' + onde + ' já está no FAQ atual (pulada)'); continue; }
        const repetida = vistas.find(v => v.q === qn);
        if (repetida) { if (q.padrao) avisos.push(slug + ': padrão "' + q.padrao + '" igual a uma pergunta da ficha (pulado)'); else erros.push(onde + ': pergunta repetida no JSON'); continue; }
        for (const v of atuais.concat(vistas.map(x => x.q))) {
          const s = parecida(qn, v, palavrasNome);
          if (s >= 0.6) { avisos.push(slug + ': ' + onde + ' parecida com "' + v.slice(0, 60) + '" (' + Math.round(s * 100) + '%) — é a mesma dúvida?'); break; }
        }
        // guardas de conteúdo
        const txt = qn + ' ' + textoLido(q.r);
        for (const [re, oq] of PROIBIDAS) if (re.test(txt)) erros.push(onde + ': cita ' + oq + ' (nunca no site)');
        if (RE_MCMV.test(txt) && !RE_ANALISE.test(txt)) erros.push(onde + ': cita o Minha Casa Minha Vida sem "sujeito a análise de crédito"');
        if (RE_COND_FECHADO.test(txt) && !condFechado) erros.push(onde + ': "condomínio fechado" numa ficha que não é de condomínio fechado');
        if (RE_CPF.test(txt) || RE_EMAIL.test(txt)) erros.push(onde + ': parece dado pessoal (CPF ou e-mail)');
        for (const fone of txt.match(RE_FONE) || []) if (/\d{4}[-\s]?\d{4}/.test(fone) && !FONE_EMPRESA.test(fone) && /[-\s(]/.test(fone)) erros.push(onde + ': telefone que não é o da imobiliária (' + fone.trim() + ')');
        // preço: cada "a partir de R$ X" é conferido com o empreendimento citado no mesmo trecho
        // (link ou nome antes do preço, desde o último ";", ":" ou fim de frase); sem citação, é esta ficha
        const rCru = String(q.r);
        for (const m of rCru.matchAll(/a partir de R\$\s*([\d.]+)(?:,(\d{2}))?/gi)) {
          const ref = referencia(rCru.slice(0, m.index), slug);
          const e = ref.slug === slug ? f : ref.e;
          const quem = ref.slug === slug ? 'fonte única' : 'fonte única do ' + (e ? e.n : ref.slug);
          const v = Number(m[1].replace(/\./g, '')) + (m[2] ? Number(m[2]) / 100 : 0);
          if (ref.slug !== slug && SD.has(ref.slug)) avisos.push(slug + ': ' + onde + ' cita preço de /' + ref.slug + '/, marcada "sem disponibilidade"');
          if (!e || !e.p) avisos.push(slug + ': ' + onde + ' "a partir de R$ ' + m[1] + '" sem ' + quem + ' para conferir');
          else if (v < e.p - 1) erros.push(onde + ': "a partir de R$ ' + m[1] + '" abaixo do preço da ' + quem + ' (R$ ' + e.p.toLocaleString('pt-BR') + ', gera-folheto.js): vale o site');
          else if (Math.abs(v - e.p) >= 1) avisos.push(slug + ': ' + onde + ' "a partir de R$ ' + m[1] + '" ≠ ' + quem + ' (R$ ' + e.p.toLocaleString('pt-BR') + '): só vale se for o menor de uma planta ou faixa, da mesma tabela');
          if (!MESES.test(textoLido(q.r))) erros.push(onde + ': preço "a partir de" sem o mês da tabela');
        }
        for (const m of rCru.matchAll(/tabela de (?:janeiro|fevereiro|março|abril|maio|junho|julho|agosto|setembro|outubro|novembro|dezembro|jan|fev|mar|abr|mai|jun|jul|ago|set|out|nov|dez)\b/gi)) {
          const ref = referencia(rCru.slice(0, m.index), slug);
          const e = ref.slug === slug ? f : ref.e;
          if (e && e.tabRec) avisos.push(slug + ': ' + onde + ' diz "' + m[0] + '" do ' + e.n + ', mas a fonte única marca tabRec (tabela sem data impressa: "tabela recebida em <mês>")');
        }
        const htmlR = respostaHtml(q.r, RAIZ, FAQ, erros, onde);
        vistas.push({ q: qn });
        saida.push({ p: q.p, html: htmlR });
        novas++;
      }
      if (saida.length) blocos.push({ titulo, perguntas: saida });
    }
    if (erros.length) { recusadas.push(slug + ' (nada gravado):\n      ' + erros.join('\n      ')); continue; }
    if (!blocos.length) { avisos.push(slug + ': JSON sem pergunta nova, bloco não escrito'); html = html.replace(RE_CSS, ''); }
    else {
      const bloco = montarBloco({ html, cx, nome, blocos, nl: pg.nl });
      html = html.slice(0, cx.faq.fim) + pg.nl + bloco + html.slice(cx.faq.fim);
      if (RE_CSS.test(html)) html = html.replace(/<style id="faq-comprador-css">[\s\S]*?<\/style>/, () => CSS);
      else if ((html.match(/<\/head>/gi) || []).length === 1) html = html.replace(/<\/head>/i, () => '  ' + CSS + pg.nl + '</head>');
      else { recusadas.push(slug + ': a página precisa de exatamente um </head>'); continue; }
    }
    // a página continua com o FAQ reconhecido e com todas as perguntas novas lidas pelo gera-faq.js
    const depois = FAQ.paresVisiveis(html).pares.map(p => p.q);
    const faltou = vistas.filter(v => !depois.includes(v.q));
    if (faltou.length) { recusadas.push(slug + ': o gera-faq.js não leria ' + faltou.length + ' pergunta(s) nova(s) — nada gravado'); continue; }
    const total = depois.length;
    if (html === pg.html) { iguais++; linhas.push('  já igual     /' + slug + '/ · ' + atuais.length + ' no FAQ atual + ' + novas + ' novas = ' + total); continue; }
    if (!ensaio) fs.writeFileSync(arq, (pg.bom ? '﻿' : '') + html, 'utf8');
    gravadas++;
    linhas.push('  ' + (ensaio ? 'gravaria' : 'gravada ') + '     /' + slug + '/ · ' + tipo + ' · ' + atuais.length + ' no FAQ atual + ' + novas + ' novas = ' + total + ' perguntas');
  }
  console.log('gera-faq-comprador: ' + jsons.length + ' JSON em ' + path.relative(RAIZ, DADOS || '.') + (fs.existsSync(arqPadrao) ? ' (+ _padrao.json)' : ' (sem _padrao.json)') +
    ' · ' + gravadas + (ensaio ? ' a gravar (ensaio, nada gravado)' : ' gravadas') + ' · ' + iguais + ' já iguais · ' + recusadas.length + ' recusadas');
  if (linhas.length) console.log(linhas.join('\n'));
  if (avisos.length) console.log('AVISOS:\n  ' + avisos.join('\n  '));
  if (recusadas.length) { console.log('RECUSADAS (corrija o JSON e rode de novo):\n  ' + recusadas.join('\n  ')); process.exitCode = 1; }
  if (gravadas && !ensaio) console.log('Próximo passo do ritual: node gera-faq.js (copia as perguntas novas para o FAQPage).');
}

if (require.main === module) main();
module.exports = { ADIAR, ORDEM_BLOCOS };
