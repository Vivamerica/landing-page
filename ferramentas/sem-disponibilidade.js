/* ═══════════════════════════════════════════════════════════════════
   SEM-DISPONIBILIDADE — leitor da lista da Central (passo 00 do ritual)
   ───────────────────────────────────────────────────────────────────
   A Central marca um empreendimento "sem disponibilidade" e publica a lista em
     GET https://imoveisvivamerica.com.br/site/lancamentos/sem-disponibilidade.json
     { "versao": 1, "gerado_em": "2026-11-09T10:00:00-03:00",
       "empreendimentos": [ { "ficha": "<slug da Central>", "nome": "...",
         "pagina": "https://lancamentos.imoveisvivamerica.com.br/<slug>/" | ".../mapa-lotes-indaiatuba/#<bairro>" | null,
         "site": "tarja" | "ocultar", "tirar_do_mapa": true | false, "desde": "AAAA-MM-DD" } ] }

   Este leitor busca a lista, valida o formato, grava sem-disponibilidade.json na
   raiz do site (dado público, entra no git: só o necessário, ordenado pela ficha)
   e aplica o que não tem gerador próprio: o bloco "100% vendido", o <head>, o JSON-LD
   e o noindex das páginas; os links e cards escritos à mão em outras páginas; o
   oculto:true dos bairros do mapa; as linhas do llms.txt. Os geradores do ritual leem
   o mesmo arquivo pelo sem-disponibilidade-regras.js (a regra mora lá).

   Só ficha de empreendimento recebe a marcação (APTOS/LOTES do gera-folheto, EXTRAS_APTOS,
   ALPHAVILLE com página e landing: do mapa). Hub, guia, blog ou página geral na "pagina"
   = lista recusada. "desde" no futuro = lista recusada. Âncora do mapa (#bairro) cujo
   bairro tem landing própria (e só ele aponta para ela) marca também a landing.

   Uso:
     node ferramentas/sem-disponibilidade.js                 busca na Central, grava e aplica
     node ferramentas/sem-disponibilidade.js --arquivo x.json usa um arquivo no lugar da Central (teste)
     node ferramentas/sem-disponibilidade.js --aplicar       não busca: reaplica o sem-disponibilidade.json atual
     ... --ensaio                                            não grava nada; mostra o que mudaria
   (teste: a variável SD_HOJE=AAAA-MM-DD troca a data de hoje)

   Saída: 0 = feito; 1 = lista inválida ou erro ao aplicar (nada gravado);
   2 = a busca falhou (rede, Cloudflare, 404 enquanto a rota não sobe): o arquivo
   anterior NÃO é apagado nem trocado.
   ═══════════════════════════════════════════════════════════════════ */

const fs = require('fs');
const path = require('path');
const SDM = require('../sem-disponibilidade-regras.js');
const { Regras, validarGravada, bairrosDoMapa, fichasDoSite, ARQ, RAIZ, DOMINIO, MAPA, SITUACOES } = SDM;

const URL_CENTRAL = 'https://imoveisvivamerica.com.br/site/lancamentos/sem-disponibilidade.json';
const args = process.argv.slice(2);
const ENSAIO = args.includes('--ensaio');
const APLICAR = args.includes('--aplicar');
const iArq = args.indexOf('--arquivo');
const ARQUIVO = iArq >= 0 ? args[iArq + 1] : null;
if (iArq >= 0 && !ARQUIVO) { console.error('sem-disponibilidade: --arquivo precisa do caminho do JSON'); process.exit(1); }
const HOJE = /^\d{4}-\d{2}-\d{2}$/.test(process.env.SD_HOJE || '') ? process.env.SD_HOJE
  : new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());

class FalhaBusca extends Error {}
class FalhaArquivo extends Error {}
const semBom = t => t.replace(/^﻿/, '');

async function buscar() {
  let r;
  try {
    r = await fetch(URL_CENTRAL, {
      headers: { Accept: 'application/json', 'User-Agent': 'VivAmerica-site/1.0 (ritual de publicacao do site de lancamentos)' },
      redirect: 'follow', signal: AbortSignal.timeout(20000),
    });
  } catch (e) { throw new FalhaBusca('sem resposta (' + (e.cause && e.cause.code || e.name || e.message) + ')'); }
  const txt = await r.text();
  if (!r.ok) throw new FalhaBusca('HTTP ' + r.status + (r.status === 404 ? ' (a rota da Central ainda não está no ar?)' : r.status === 403 || r.status === 503 ? ' (Cloudflare barrou a busca?)' : ''));
  try { return JSON.parse(semBom(txt)); }
  catch (e) { throw new FalhaBusca('a resposta não é JSON (' + (r.headers.get('content-type') || 'sem content-type') + '; começa com ' + JSON.stringify(txt.slice(0, 60)) + ')'); }
}

// ─── valida o formato da Central e normaliza para o arquivo do site ───
function dataValida(s) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s || '')) return false;
  const d = new Date(s + 'T12:00:00Z');
  return !isNaN(d) && d.toISOString().slice(0, 10) === s;
}
function normalizar(c, anterior) {
  const erros = [], avisos = [], semPagina = [];
  if (!c || typeof c !== 'object' || Array.isArray(c)) throw new Error('a lista não é um objeto JSON');
  if (c.versao !== 1) erros.push('versao ' + JSON.stringify(c.versao) + ' (este leitor só conhece a versão 1)');
  if (c.gerado_em !== undefined && (typeof c.gerado_em !== 'string' || isNaN(new Date(c.gerado_em)))) erros.push('gerado_em inválido: ' + JSON.stringify(c.gerado_em));
  if (!Array.isArray(c.empreendimentos)) erros.push('empreendimentos não é uma lista');
  const B = bairrosDoMapa();
  const fichas = fichasDoSite();
  const pastas = new Set(fs.readdirSync(RAIZ, { withFileTypes: true }).filter(d => d.isDirectory() && fs.existsSync(path.join(RAIZ, d.name, 'index.html'))).map(d => d.name));
  const chegou = new Map((anterior.empreendimentos || []).map(e => [e.ficha, e.chegou_em]));
  const vistos = new Set(), itens = [];
  (c.empreendimentos || []).forEach((e, i) => {
    const q = 'empreendimentos[' + i + ']' + (e && e.ficha ? ' (' + e.ficha + ')' : '');
    if (!e || typeof e !== 'object') return erros.push(q + ': não é objeto');
    if (typeof e.ficha !== 'string' || !/^[a-z0-9-]+$/.test(e.ficha)) erros.push(q + ': ficha fora do padrão [a-z0-9-]');
    else if (vistos.has(e.ficha)) erros.push(q + ': ficha repetida'); else vistos.add(e.ficha);
    if (e.nome !== undefined && e.nome !== null && typeof e.nome !== 'string') erros.push(q + ': nome não é texto');
    if (!SITUACOES.includes(e.site)) erros.push(q + ': site ' + JSON.stringify(e.site) + ' (vale "tarja" ou "ocultar")');
    if (typeof e.tirar_do_mapa !== 'boolean') erros.push(q + ': tirar_do_mapa precisa ser true ou false');
    if (!dataValida(e.desde)) erros.push(q + ': desde ' + JSON.stringify(e.desde) + ' (formato AAAA-MM-DD, data real)');
    else if (e.desde > HOJE) erros.push(q + ': desde ' + e.desde + ' é depois de hoje (' + HOJE + '); o site diria "sem unidades à venda desde" uma data que ainda não chegou');
    let slug = null, bairro = null, pagina = null;
    if (e.pagina === null || e.pagina === undefined) {
      semPagina.push(e.ficha + ' (pagina null: criado só na Central)');
    } else if (typeof e.pagina !== 'string' || !e.pagina.startsWith(DOMINIO + '/')) {
      erros.push(q + ': pagina fora do site (' + JSON.stringify(e.pagina) + ')');
    } else {
      const resto = e.pagina.slice(DOMINIO.length);
      const mMapa = new RegExp('^/' + MAPA + '/#([a-z0-9-]+)$').exec(resto);
      const mLand = /^\/([a-z0-9-]+)\/$/.exec(resto);
      if (mMapa) {
        const b = B.find(x => x.id === mMapa[1]);
        if (!b) semPagina.push(e.ficha + ' (o mapa não tem o bairro #' + mMapa[1] + ')');
        else {
          bairro = b.id; pagina = resto;
          // bairro com landing própria: a landing também recebe a marcação, se só esse bairro aponta para ela
          const l = /^\/([a-z0-9-]+)\/$/.exec(b.landing || '');
          if (l && fichas.has(l[1])) {
            const irmaos = B.filter(x => x.landing === b.landing && x.id !== b.id);
            if (!irmaos.length) slug = l[1];
            else avisos.push(e.ficha + ': #' + b.id + ' sai do mapa, mas a landing ' + b.landing + ' é de ' + (irmaos.length + 1) + ' bairros do mapa (' + [b.id].concat(irmaos.map(x => x.id)).join(', ') + ') e NÃO recebe a marcação; se o empreendimento todo acabou, marque a ficha com a página ' + b.landing);
          }
        }
      } else if (mLand && mLand[1] !== MAPA) {
        if (fichas.has(mLand[1])) { slug = mLand[1]; pagina = resto; }
        else if (pastas.has(mLand[1])) erros.push(q + ': a página ' + resto + ' não é ficha de empreendimento (hub, guia, blog ou página geral) — confira a página da ficha na Central');
        else semPagina.push(e.ficha + ' (a página ' + resto + ' não existe no site)');
      } else erros.push(q + ': pagina com caminho fora do padrão /<slug>/ ou /' + MAPA + '/#<bairro> (' + JSON.stringify(e.pagina) + ')');
    }
    if (pagina) itens.push({ ficha: e.ficha, nome: (e.nome || '').trim(), pagina, slug, bairro, site: e.site, tirar_do_mapa: e.tirar_do_mapa, desde: e.desde, chegou_em: chegou.get(e.ficha) || HOJE });
  });
  // duas fichas para a mesma página (ou para a mesma landing): a primeira manda (aviso)
  const porPag = new Map(), porSlug = new Map();
  const unicos = itens.filter(x => {
    if (porPag.has(x.pagina)) { avisos.push(x.ficha + ' aponta para ' + x.pagina + ', que já é de ' + porPag.get(x.pagina) + ' — ficou só a primeira'); return false; }
    if (x.slug && porSlug.has(x.slug)) { avisos.push(x.ficha + ' marca a landing /' + x.slug + '/, que já é de ' + porSlug.get(x.slug) + ' — a landing fica com a primeira; o bairro ' + (x.bairro ? '#' + x.bairro + ' ' : '') + 'segue a ficha'); x.slug = null; if (!x.bairro) return false; }
    porPag.set(x.pagina, x.ficha); if (x.slug) porSlug.set(x.slug, x.ficha); return true;
  });
  if (erros.length) throw new Error('lista inválida:\n  - ' + erros.join('\n  - '));
  unicos.sort((a, b) => a.ficha < b.ficha ? -1 : a.ficha > b.ficha ? 1 : 0);
  return { lista: { versao: 1, empreendimentos: unicos }, avisos, semPagina };
}

const descr = e => e.ficha + (e.slug ? ' → /' + e.slug + '/' : '') + (e.bairro ? ' → mapa #' + e.bairro : '') + ' · ' + e.site + (e.tirar_do_mapa ? ' + fora do mapa' : '') + ' · desde ' + e.desde + (e.chegou_em ? ' · no site desde ' + e.chegou_em : '');

async function main() {
  const anterior = fs.existsSync(ARQ) ? validarGravada(JSON.parse(semBom(fs.readFileSync(ARQ, 'utf8'))), 'sem-disponibilidade.json atual') : { versao: 1, empreendimentos: [] };
  let nova, avisos = [], semPagina = [], origem;
  if (APLICAR) {
    nova = { versao: 1, empreendimentos: anterior.empreendimentos };
    origem = 'sem-disponibilidade.json atual (--aplicar, sem busca)';
  } else {
    let bruto;
    if (ARQUIVO) {
      origem = ARQUIVO;
      let txt;
      try { txt = fs.readFileSync(ARQUIVO, 'utf8'); } catch (e) { throw new FalhaArquivo('não consegui ler ' + ARQUIVO + ' (' + e.code + ')'); }
      try { bruto = JSON.parse(semBom(txt)); } catch (e) { throw new FalhaArquivo(ARQUIVO + ' não é JSON válido (' + e.message + ')'); }
    } else { origem = URL_CENTRAL; bruto = await buscar(); }
    ({ lista: nova, avisos, semPagina } = normalizar(bruto, anterior));
  }
  const sd = new Regras(nova);
  // 1ª passada sem gravar (pega erro antes de tocar em qualquer arquivo), 2ª de verdade
  for (const ensaio of ENSAIO ? [true] : [true, false]) {
    const pag = sd.aplicarPaginas({ ensaio });
    const links = sd.aplicarLinks({ ensaio });
    const mapa = sd.aplicarMapa({ ensaio });
    const llms = sd.aplicarLlms(anterior.guardado_llms || [], { ensaio });
    if (!ensaio || ENSAIO) {
      const saida = { versao: 1, empreendimentos: nova.empreendimentos };
      if (llms.guardado.length) saida.guardado_llms = llms.guardado;
      const txt = JSON.stringify(saida, null, 2) + '\n';
      const mudouArq = !fs.existsSync(ARQ) || fs.readFileSync(ARQ, 'utf8') !== txt;
      if (!ENSAIO && mudouArq) fs.writeFileSync(ARQ, txt, 'utf8');
      relatorio({ origem, anterior, nova, avisos: avisos.concat(llms.avisos), semPagina, pag, links, mapa, llms, mudouArq });
    }
  }
}

function relatorio(r) {
  const chave = e => e.ficha;
  const ant = new Map(r.anterior.empreendimentos.map(e => [chave(e), e]));
  const nov = new Map(r.nova.empreendimentos.map(e => [chave(e), e]));
  const entrou = r.nova.empreendimentos.filter(e => !ant.has(chave(e)));
  const saiu = r.anterior.empreendimentos.filter(e => !nov.has(chave(e)));
  const mudou = r.nova.empreendimentos.filter(e => { const a = ant.get(chave(e)); return a && (a.site !== e.site || a.tirar_do_mapa !== e.tirar_do_mapa || a.desde !== e.desde || a.pagina !== e.pagina); });
  console.log('sem-disponibilidade' + (ENSAIO ? ' (ENSAIO: nada gravado)' : '') + ': lista de ' + r.origem);
  console.log('  na lista: ' + r.nova.empreendimentos.length + ' empreendimento(s) com página no site');
  r.nova.empreendimentos.forEach(e => console.log('    · ' + descr(e)));
  console.log('  entrou: ' + (entrou.length ? entrou.map(descr).join('; ') : 'nenhum'));
  console.log('  saiu (a rodada desfaz tudo): ' + (saiu.length ? saiu.map(descr).join('; ') : 'nenhum'));
  if (mudou.length) console.log('  mudou: ' + mudou.map(descr).join('; '));
  console.log('  sem página no site (só aviso): ' + (r.semPagina.length ? r.semPagina.join('; ') : 'nenhum'));
  console.log('  páginas ' + (ENSAIO ? 'que mudariam' : 'regravadas') + ': ' + (r.pag.mudou.length ? r.pag.mudou.join(', ') : 'nenhuma'));
  console.log('  links e cards escritos à mão (template): ' + (r.links.mudou.length ? r.links.mudou.length + ' página(s) ' + (ENSAIO ? 'mudariam' : 'regravadas') + ' (' + r.links.mudou.join(', ') + ')' : 'nenhuma página'));
  console.log('  mapa: ' + (r.mapa.ocultos.length ? 'ocultos pela lista: ' + r.mapa.ocultos.join(', ') : 'nenhum bairro oculto pela lista') + (r.mapa.mudou ? ' (arquivo ' + (ENSAIO ? 'mudaria' : 'regravado') + ')' : ''));
  if (r.mapa.jaOcultos.length) console.log('    já estavam ocultos à mão (o passo 00 não mexe neles): ' + r.mapa.jaOcultos.join(', '));
  if (r.mapa.semBairro.length) console.log('  AVISO: deviam sair do mapa, mas o mapa não tem bairro para: ' + r.mapa.semBairro.join(', ') + ' (se tiver, ponha em MAPA_POR_SLUG do sem-disponibilidade-regras.js)');
  if (r.mapa.tarjaNoMapa.length) console.log('  AVISO: tarja sem "tirar do mapa" — o mapa segue mostrando os lotes de ' + r.mapa.tarjaNoMapa.join('; ') + '. Se acabou, marque "tirar do mapa" na Central.');
  r.mapa.revenda.forEach(x => console.log('  AVISO: bairro fora do mapa com revenda: ' + x + '. Se a revenda continua à venda, avise antes do push.'));
  console.log('  llms.txt: ' + (r.llms.mudou ? (ENSAIO ? 'mudaria' : 'regravado') : 'sem mudança') + ' · operações guardadas: ' + r.llms.guardado.length);
  r.avisos.forEach(a => console.log('  AVISO: ' + a));
  const restos = Object.entries(r.links.restos);
  if (restos.length) {
    console.log('  AVISO: texto escrito à mão, fora dos blocos gerados, que ainda cita empreendimento marcado (trate antes do push;');
    console.log('         tarja: só as linhas com preço/estoque; ocultar: todas):');
    for (const [slug, ls] of restos) {
      console.log('    ' + slug + ' (' + r.nova.empreendimentos.find(e => e.slug === slug).site + '): ' + ls.length + ' linha(s)');
      ls.slice(0, 40).forEach(l => console.log('      ' + l));
      if (ls.length > 40) console.log('      (+' + (ls.length - 40) + ')');
    }
  }
  console.log('  ' + path.basename(ARQ) + ': ' + (r.mudouArq ? (ENSAIO ? 'mudaria' : 'gravado') : 'sem mudança'));
  console.log('  siga o ritual: node gera-folheto.js e os demais, na ordem do CHECKLIST-NOVA-PAGINA.md');
}

main().catch(e => {
  if (e instanceof FalhaBusca) {
    const existe = fs.existsSync(ARQ);
    let n = '?';
    try { n = existe ? JSON.parse(semBom(fs.readFileSync(ARQ, 'utf8'))).empreendimentos.length : 0; } catch (x) { /* fica ? */ }
    console.error('sem-disponibilidade: a busca da lista FALHOU — ' + e.message);
    console.error('  URL: ' + URL_CENTRAL);
    console.error('  Nada foi gravado: ' + (existe ? 'o ' + path.basename(ARQ) + ' anterior continua valendo (' + n + ' empreendimento(s)).' : 'não há ' + path.basename(ARQ) + ' anterior; o site segue sem nenhuma marcação.'));
    console.error('  Para seguir: tente de novo em alguns minutos; ou publique com a lista anterior');
    console.error('  (node ferramentas/sem-disponibilidade.js --aplicar e depois o ritual); ou, com a lista salva');
    console.error('  em arquivo, node ferramentas/sem-disponibilidade.js --arquivo <lista.json>.');
    process.exitCode = 2;   // sem process.exit(): no Windows, sair com o fetch aberto derruba o Node (assert do libuv)
    return;
  }
  if (e instanceof FalhaArquivo) {
    console.error('sem-disponibilidade: ERRO no arquivo da lista — ' + e.message);
    console.error('  Nada foi gravado. Corrija o arquivo (ou salve de novo a lista da Central) e rode outra vez.');
    process.exitCode = 1;
    return;
  }
  console.error('sem-disponibilidade: ERRO — ' + e.message);
  console.error('  Nada foi gravado' + (ENSAIO ? '' : ' (a checagem roda antes de tocar nos arquivos)') + '. Corrija a lista na Central (ou o arquivo) e rode de novo.');
  process.exitCode = 1;
});
