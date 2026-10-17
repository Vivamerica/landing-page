/* ═══════════════════════════════════════════════════════════════════
   FOLDER 1 DOBRA — arte fechada para gráfica
   ───────────────────────────────────────────────────────────────────
   Formato do gabarito:
     aberto  210 × 148 mm (A5 deitado)
     sangria 2 mm por lado  →  arquivo final 214 × 152 mm
     dobrado 105 × 148 mm (A6)
     área de segurança: 6 mm da borda do arquivo (2 de sangria + 4) e
     5 mm do vinco → 96 × 140 mm úteis por painel
   Imposição:
     FRENTE = página 4 (contracapa) | página 1 (capa)
     VERSO  = página 2 (apartamentos) | página 3 (lotes e condomínios)

   Desenho (desde 17/10/2026, pedido do Fabio): o miolo é de CARDS COM
   MINIATURA, 2 colunas por painel. Cada card: foto recortada à esquerda
   (cobre a caixa, sem transparência) e, ao lado, nome, construtora · m²
   e, embaixo, "a partir de" + mês da tabela à esquerda e o preço em
   destaque à direita. Sem selo MCMV e sem quadro do MCMV.
   A miniatura é a foto da fonte única (campo img), em JPEG — o PDF leva
   o JPEG como está; WebP e PNG viram imagem sem compressão (o verso
   passava de 17 MB). Exceções (outra foto, enquadramento ou recorte de
   um trecho) em MINI_FOTO. O gerador confere que ela
   existe, é JPEG (sem canal alfa) e dá 250 dpi ou mais.
   Selos, com a mesma regra do site e sempre com data: escassez ("últimas
   N unidades", "últimos N lotes") só quando a fonte única traz est até
   ESC_MAX E estEm (data da contagem); tarja comercial (ex.: desconto de
   lançamento, que já está no preço da tabela) só com o mês ou o dia. O
   selo ganha uma linha própria no card, embaixo da construtora.
   Apartamentos do menor para o maior preço, sem faixas (com miniatura,
   as 3 faixas não cabem sem apertar); lotes por tipo — loteamentos
   abertos e condomínios fechados, o corte do menu do site —, do menor
   para o maior preço dentro do tipo. Lido coluna a coluna. Só
   Indaiatuba, como o folheto A4.

   Dados: APTOS/LOTES e o parágrafo "Por que comprar no lançamento?" do
   gera-folheto.js (fonte única); EDICAO do gera-observatorio.js. No
   ritual, roda logo depois do gera-folheto.js. Cores e fontes ficam em
   variáveis no :root (--fundo, --ouro, --fonte-titulo...).

   Checagem — o gerador PARA (exit 1) e não grava nada quando falha.
   Monta as duas faces numa pasta temporária, abre no Edge sem interface
   (convidado, sem sincronização e sem login, perfil próprio apagado no
   fim, árvore de processos encerrada) e mede:
     · letra (de ascendente a descendente) fora da área de segurança ou
       fora da própria caixa (ficha, faixa, cabeçalho, notas, quadros);
     · caixa que corta o conteúdo; texto sem quebra mais largo que a linha;
       nome encostando no preço;
     · folga abaixo de 2 mm em qualquer coluna do miolo e nos espaços
       elásticos da capa e da contracapa;
     · corpo abaixo de 6 pt no miolo; abaixo de 7 pt ou mais fino que
       semibold sobre o fundo escuro;
     · preço faltando ou diferente da fonte única; fonte trocada; foto da
       capa ou miniatura sem carregar, sem cobrir a caixa ou abaixo de
       250 dpi; texto do card em cima da miniatura; "a partir de"
       encostando no preço; QR com módulo abaixo de 0,5 mm ou sem zona de
       silêncio;
     · transparência de qualquer tipo (opacidade, cor com alfa, degradê,
       sombra, filtro, imagem com canal alfa): visualizador e RIP podem
       descartar ou achatar mal.
   Os dois QR saem do qrcode/qrgen.js e são relidos pelo qrcode/qrdecode.js
   a cada rodada; os dois levam utm_source=folder.

   Pedido à gráfica (o PDF do navegador sai em RGB):
     · texto e fios do miolo só no preto (100% K): no arquivo são #000;
     · fundo da capa e da contracapa em preto calçado (ex.: C40 K100),
       nunca nas 4 cores carregadas;
     · texto vazado sobre o preto com 7 pt ou mais, semibold (a checagem
       garante).
   ═══════════════════════════════════════════════════════════════════ */

const fs = require('fs');
const os = require('os');
const path = require('path');
const cp = require('child_process');
const { pathToFileURL } = require('url');

const R = __dirname.replace(/\\/g, '/') + '/';   // raiz do site: de onde se lê
const SAIDA = R;                                  // onde se gravam folder-frente.html e folder-verso.html

// ─── fonte única ───
const folheto = fs.readFileSync(R + 'gera-folheto.js', 'utf8');
function extrair(nome) {
  const ini = folheto.indexOf('const ' + nome + ' = [');
  const fim = folheto.indexOf('\n];', ini);
  if (ini < 0 || fim < 0) throw new Error('nao achei ' + nome + ' em gera-folheto.js');
  return eval(folheto.slice(ini + ('const ' + nome + ' = ').length, fim + 2));
}
const APTOS = extrair('APTOS');
const LOTES = extrair('LOTES');
// "Por que comprar no lançamento?": só o parágrafo do folheto A4 (a lista de vantagens fica de fora,
// porque a correção pelo INCC não vale para lote)
const PQ = (() => {
  const ini = folheto.indexOf('const DEST = `');
  const m = ini < 0 ? null : /<p>([\s\S]*?)<\/p>/.exec(folheto.slice(ini, folheto.indexOf('`;', ini)));
  if (!m) throw new Error('nao achei o paragrafo "Por que comprar" (const DEST) em gera-folheto.js');
  return m[1].replace(/\s+/g, ' ').trim();
})();
const EDICAO = (() => {
  const src = fs.readFileSync(R + 'gera-observatorio.js', 'utf8');
  const ini = src.indexOf('const EDICAO = ');
  const fim = src.indexOf('};', ini) + 1;
  if (ini < 0 || fim < 1) throw new Error('nao achei EDICAO em gera-observatorio.js');
  return eval('(' + src.slice(ini + 'const EDICAO = '.length, fim) + ')');
})();
const edicao = EDICAO.mes.toLowerCase() + '/' + EDICAO.ano;            // outubro/2026

const MES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
const mesDe = iso => MES[+iso.slice(5, 7) - 1] + '/' + iso.slice(0, 4);  // 2026-10 → out/2026
const brl = n => 'R$ ' + n.toLocaleString('pt-BR');
const mil = n => n % 1000 === 0 ? 'R$ ' + (n / 1000).toLocaleString('pt-BR') + ' mil' : brl(n);  // nunca arredonda preço
const m2 = n => n.toLocaleString('pt-BR') + ' m²';
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const porPreco = (a, b) => (a.p || Infinity) - (b.p || Infinity);

// preço "a partir de" só sai com o mês da tabela (ou como pré-lançamento)
[...APTOS, ...LOTES].forEach(e => {
  if (e.p && !e.tab && !e.prox) throw new Error('GERA-FOLDER: ' + e.n + ' tem preço sem o mês da tabela (campo tab) nem pré-lançamento (prox)');
});
[...APTOS, ...LOTES].forEach((e, k) => { e._k = k; });                   // chave da ficha, para a medição

// ─── ajustes do desenho (em mm e pt) ───
const CORPO_ROTULO = 6;       // "a partir de" e "tabela mmm/aaaa" (6 pt é o piso do miolo)
const MINI_L = 11.2;          // mm de largura da miniatura; a altura é a do card (≈ 4:3)
const QR_SITE_MODULO = 0.6;   // mm por módulo do QR do site (a caixa branca inclui a zona de silêncio de 4 módulos)
const QR_MAPA_LADO = 24;      // mm do QR do mapa (a zona de silêncio é o branco da caixa em volta)
const URL_SITE = 'https://lancamentos.imoveisvivamerica.com.br/?utm_source=folder';
const URL_MAPA = 'https://lancamentos.imoveisvivamerica.com.br/mapa-lotes-indaiatuba/?utm_source=folder';
// foto da capa: faixa de borda reta, sem degradê nem transparência (o PDF de gráfica não leva), alinhada ao texto
// à esquerda e sangrando na borda direita. Com a foto a 126,5 mm de largura, o quadro de 102 mm vai da borda esquerda
// até antes da TV (x ≈ 1290 de 1600 px), de y = 31 mm (≈ 390 px, abaixo do pendente) para baixo.
const CAPA = { slug: 'aurora-indaiatuba', arquivo: 'aurora-indaiatuba/images/hero-casa-de-campo-piscina.jpg', largura: 126.5, y: 31, altura: 54 };
const capaDe = APTOS.find(e => e.slug === CAPA.slug) || LOTES.find(e => e.slug === CAPA.slug);
if (!capaDe) throw new Error('GERA-FOLDER: a foto da capa é de ' + CAPA.slug + ', que não está mais na fonte única — troque a foto (CAPA)');
if (!fs.existsSync(R + CAPA.arquivo)) throw new Error('GERA-FOLDER: foto da capa não existe: ' + CAPA.arquivo);

// ─── selos (com data; a mesma regra do site) ───
// escassez: desligada no impresso (ESC_MAX = 0): o folder circula por meses e a contagem envelhece;
// no site ela continua (est até 60 com estEm).
// tarja: o aviso comercial da fonte única, encurtado para caber na ficha ("10% de desconto — promoção
// de lançamento (out/2026)" → "10% de desconto (out/2026)"); sem mês ou dia, o gerador para.
const ESC_MAX = 0;
const DATA = /\b\d{2}\/\d{4}\b|\b(jan|fev|mar|abr|mai|jun|jul|ago|set|out|nov|dez)\/\d{4}\b/i;
function selos(e, lote) {
  const out = [];
  if (e.est === 0) throw new Error('GERA-FOLDER: ' + e.n + ' está com est 0 na fonte única (esgotado) — sai do folder pela fonte única');
  if (typeof e.est === 'number' && e.est <= ESC_MAX && e.estEm)
    out.push(lote ? (e.est === 1 ? 'último lote' : 'últimos ' + e.est + ' lotes') + ' (' + e.estEm + ')'
                  : (e.est === 1 ? 'última unidade' : 'últimas ' + e.est + ' unidades') + ' (' + e.estEm + ')');
  if (e.tarja) {
    if (!DATA.test(e.tarja)) throw new Error('GERA-FOLDER: a tarja de ' + e.n + ' não tem mês nem dia: ' + e.tarja);
    const m = /^(.*?)\s+—\s+.*?\s*(\([^()]*\))\s*$/.exec(e.tarja);
    out.push(m && DATA.test(m[2]) ? m[1] + ' ' + m[2] : e.tarja);
  }
  return out;
}

// ─── miniaturas ───
// A foto da fonte única (campo img), em JPEG. Por que JPEG: o PDF do navegador leva o JPEG como está (DCT),
// enquanto WebP e PNG viram imagem sem compressão com perdas (Flate) — com as -640.webp, o verso passava de
// 17 MB; com os JPEG, fica em 8,4 MB. E JPEG não tem canal alfa (o PDF de gráfica não leva transparência).
// O gerador confere o cabeçalho do arquivo, não a extensão, e para se não for JPEG.
// MINI_FOTO: exceções, quando a foto do site não funciona num quadro de 11 mm; pos = enquadramento (object-position);
// recorte = [cima, direita, baixo, esquerda] em % da foto (object-view-box: inset), para usar só um trecho dela sem
// gravar arquivo novo — o PDF leva o JPEG inteiro e mostra o trecho; o dpi conferido é o do trecho.
const MINI_FOTO = {
  'reserva-botanica-indaiatuba': { arq: 'reserva-botanica-indaiatuba/images/portaria-24h.jpg', pos: '50% 53%' }, // no site, a arte escura do logotipo
  'monte-carmelo-indaiatuba': { arq: 'monte-carmelo-indaiatuba/images/hero2.jpg' },  // no site, um anúncio cheio de texto
  'di-italia-indaiatuba': { arq: 'di-italia-indaiatuba/images/mapa.jpg' },           // no site, foto de banco de imagens (pessoa), sem o loteamento
  // no site, a arte com a família em primeiro plano (no quadro, só as pessoas): o topo da torre da direita, acima delas
  'itamaraca-indaiatuba': { arq: 'itamaraca-indaiatuba/images/hero.jpg', recorte: [0, 0, 71, 70] },
  // no site, a vista aérea com o slogan no canto de baixo (no quadro, microtexto ilegível): as 3 torres, sem o slogan
  'manai-bosque-indaiatuba': { arq: 'manai-bosque-indaiatuba/images/vista-aerea-real.jpg', recorte: [0, 26.4, 20.9, 23.75] },
  // no site, a fachada com o logotipo "STORIA" e o slogan (no quadro, o logotipo cortado): a mesma fachada, sem texto
  'storia-congesa-indaiatuba': { arq: 'storia-congesa-indaiatuba/images/fachada.jpg' },
};
const ehJpeg = arq => { const b = fs.readFileSync(R + arq); return b.length > 3 && b[0] === 0xFF && b[1] === 0xD8 && b[2] === 0xFF; };
const MINI = new Map(), avisosMini = [];
Object.keys(MINI_FOTO).forEach(s => {
  if (![...APTOS, ...LOTES].some(e => e.slug === s)) avisosMini.push('MINI_FOTO tem ' + s + ', que não está mais na fonte única — pode tirar');
});
[...APTOS, ...LOTES].forEach(e => {
  const x = MINI_FOTO[e.slug] || { arq: e.img };
  if (!x.arq) throw new Error('GERA-FOLDER: ' + e.n + ' está sem foto (campo img) na fonte única');
  if (!fs.existsSync(R + x.arq)) throw new Error('GERA-FOLDER: a foto da miniatura de ' + e.n + ' não existe: ' + x.arq);
  if (!ehJpeg(x.arq)) throw new Error('GERA-FOLDER: a miniatura de ' + e.n + ' não é JPEG (' + x.arq + '): WebP e PNG pesam no PDF, e PNG pode ter transparência — use a versão .jpg');
  if (x.recorte && (x.recorte.length !== 4 || x.recorte.some(v => typeof v !== 'number' || v < 0) || x.recorte[0] + x.recorte[2] >= 90 || x.recorte[1] + x.recorte[3] >= 90))
    throw new Error('GERA-FOLDER: recorte da miniatura de ' + e.n + ' inválido (4 números em %, cima direita baixo esquerda, sobrando ao menos 10% da foto): ' + JSON.stringify(x.recorte));
  const estilo = [x.pos ? 'object-position:' + x.pos : '', x.recorte ? 'object-view-box:inset(' + x.recorte.map(v => v + '%').join(' ') + ')' : ''].filter(Boolean).join(';');
  MINI.set(e, { arq: x.arq, estilo, kb: fs.statSync(R + x.arq).size / 1024 });
});

// ─── card ───
// esquerda (.mini): a miniatura, na altura do card. Direita (.tx): nome (quebra em 2 linhas se precisar);
// construtora · m² da unidade do preço (nos lotes, "lote de"; sem quebra no meio) · "pronto"; o selo (.sel),
// numa linha própria; embaixo (.pz), "a partir de" e o mês da tabela (ou "pré-lançamento*"; † preços
// confirmados) à esquerda e o preço em destaque à direita, na mesma linha de base do mês.
function linhaCons(e, lote) {
  const out = [esc(e.c)];
  if (e.m2) out.push((lote ? 'lote&nbsp;de&nbsp;' : '') + m2(e.m2).replace(' ', '&nbsp;'));
  if (/Pronto/i.test(e.t || '')) out.push('pronto');
  return out.join(' · ');
}
function ficha(e, lote) {
  const sel = selos(e, lote).map(esc).join(' · ');
  const tab = e.tab ? 'tabela ' + mesDe(e.tab) + (e.conf ? '<sup>†</sup>' : '')
            : e.prox ? 'pré-lançamento<sup>*</sup>' : '';
  const pz = e.p
    ? `<p class="rot"><span>a partir de</span><span>${tab}</span></p><p class="pr">${brl(e.p)}</p>`
    : `<p class="rot"><span>tabela</span></p><p class="pr pr-c">sob consulta</p>`;
  return `
        <div class="it" data-k="${e._k}">
          <div class="mini"><img src="${MINI.get(e).arq}" alt=""${MINI.get(e).estilo ? ` style="${MINI.get(e).estilo}"` : ''}></div>
          <div class="tx"><p class="nome">${esc(e.n)}</p><p class="cons">${linhaCons(e, lote)}</p>${sel ? `<p class="sel"><span>${sel}</span></p>` : ''}<div class="pz">${pz}</div></div>
        </div>`;
}

// ─── grupos ───
// Com miniatura, as 3 faixas de preço dos apartamentos não cabem sem apertar (21 cards: cada faixa custa uma
// linha de título, e a coluna 2 levaria duas); os lotes cabem com os 2 tipos. Para ligar ou desligar: GRUPOS.
const GRUPOS = { aptos: false, lotes: true };
const FAIXAS = [
  { ate: 400000, titulo: 'Até R$ 400 mil' },
  { ate: 800000, titulo: 'De R$ 400 mil a R$ 800 mil' },
  { ate: Infinity, titulo: 'Acima de R$ 800 mil' },
];
const emOrdem = lista => [...lista.filter(e => e.p).sort(porPreco), ...lista.filter(e => !e.p)];
const gruposApto = GRUPOS.aptos ? FAIXAS.map((f, i) => ({
  titulo: f.titulo,
  itens: APTOS.filter(e => e.p && e.p <= f.ate && (i === 0 || e.p > FAIXAS[i - 1].ate)).sort(porPreco),
})).filter(g => g.itens.length) : [{ titulo: '', itens: emOrdem(APTOS) }];
const semPrecoApto = APTOS.filter(e => !e.p);
if (GRUPOS.aptos && semPrecoApto.length) gruposApto.push({ titulo: 'Tabela sob consulta', itens: semPrecoApto });

// tipo de lote: o campo t da fonte única manda no grupo; a descrição (s) não pode dizer o contrário
const TIPO_LOTE = { 'Loteamento': 'Loteamentos abertos', 'Cond. fechado': 'Condomínios fechados' };
LOTES.forEach(e => {
  if (!TIPO_LOTE[e.t]) throw new Error('GERA-FOLDER: tipo de lote sem grupo no folder: ' + e.t + ' (' + e.n + ')');
  if (e.t === 'Loteamento' && /fechad|condom[ií]nio/i.test(e.s || ''))
    throw new Error('GERA-FOLDER: ' + e.n + ' está como Loteamento (aberto) na fonte única, mas a descrição diz "' + e.s + '" — acerte o tipo (t)');
  if (e.t === 'Cond. fechado' && /\baberto\b/i.test(e.s || ''))
    throw new Error('GERA-FOLDER: ' + e.n + ' está como Cond. fechado na fonte única, mas a descrição diz "' + e.s + '" — acerte o tipo (t)');
});
const gruposLote = GRUPOS.lotes
  ? Object.keys(TIPO_LOTE).map(t => ({ titulo: TIPO_LOTE[t], itens: emOrdem(LOTES.filter(e => e.t === t)) })).filter(g => g.itens.length)
  : [{ titulo: '', itens: emOrdem(LOTES) }];

if (gruposApto.reduce((t, g) => t + g.itens.length, 0) !== APTOS.length) throw new Error('GERA-FOLDER: apartamento fora de faixa');
if (gruposLote.reduce((t, g) => t + g.itens.length, 0) !== LOTES.length) throw new Error('GERA-FOLDER: lote fora de grupo');

// ─── divisão em 2 colunas ───
// Altura equilibrada (no empate, a coluna 1 fica com o card a mais), sem deixar 1 item sozinho de um grupo com
// título em uma coluna. As alturas começam estimadas; depois da 1ª medição no navegador, a divisão é refeita com
// as alturas medidas. Grupo sem título (apartamentos sem faixas) não tem linha de título nem "(cont.)".
const EST = { it: e => 10.5 + (e.n.length > 24 ? 2.6 : 0) + (selos(e, LOTES.includes(e)).length ? 2.6 : 0), faixa: 5.4, corte: 2 };
function dividir(grupos, H) {
  const seq = [];
  grupos.forEach((g, gi) => g.itens.forEach(it => seq.push({ gi, it })));
  const alt = s => s.reduce((t, x) => t + H.it(x.it), 0) + [...new Set(s.map(x => x.gi))].reduce((t, gi) => t + (grupos[gi].titulo ? H.faixa : 0), 0);
  let melhor = null;
  for (let k = 1; k < seq.length; k++) {
    const a = seq.slice(0, k), b = seq.slice(k);
    const corte = a[a.length - 1].gi === b[0].gi && !!grupos[b[0].gi].titulo;
    if (corte && (a.filter(x => x.gi === b[0].gi).length < 2 || b.filter(x => x.gi === b[0].gi).length < 2)) continue;
    const nota = Math.max(alt(a), alt(b)) + (corte ? H.corte : 0) + (alt(a) < alt(b) ? 1e-3 : 0);
    if (!melhor || nota < melhor.nota - 1e-6) melhor = { nota, k };
  }
  const col = s => {
    const out = [];
    s.forEach(x => {
      const ult = out[out.length - 1];
      if (ult && ult.gi === x.gi) ult.itens.push(x.it);
      else out.push({ gi: x.gi, titulo: grupos[x.gi].titulo, total: grupos[x.gi].itens.length, itens: [x.it] });
    });
    return out;
  };
  const c1 = col(seq.slice(0, melhor.k)), c2 = col(seq.slice(melhor.k));
  if (c2.length && c1.length && c2[0].gi === c1[c1.length - 1].gi && c2[0].titulo) c2[0].cont = true;
  return [c1, c2];
}
const colunas = (grupos, lote, H) => dividir(grupos, H).map(c => `
      <div class="col">${c.map(g => (g.titulo ? `
        <div class="gr"><span>${esc(g.titulo)}${g.cont ? ' <i>(cont.)</i>' : ''}</span><span class="gr-n">${g.cont ? '' : g.total}</span></div>` : '')
        + g.itens.map(e => ficha(e, lote)).join('')).join('')}
      </div>`).join('');

// ─── notas de rodapé (só as que o painel usa) ───
function notas(lista) {
  const out = [];
  if (lista.some(e => e.p && !e.tab && e.prox)) out.push('<sup>*</sup> Pré-lançamento: valor sujeito a reajuste no lançamento oficial (sem data divulgada).');
  const conf = lista.filter(e => e.conf);
  if (conf.length) out.push(`<sup>†</sup> Preços da tabela indicada, confirmados pela construtora para ${[...new Set(conf.map(e => mesDe(e.conf)))].join(' e ')}.`);
  return out.map(t => `<p>${t}</p>`).join('');
}

// ─── números da capa (calculados; nada fixo) ───
const total = APTOS.length + LOTES.length;
const construtoras = new Set([...APTOS, ...LOTES].map(e => e.c.split(' · ')[0].trim())).size;   // mesma conta do gera-folheto.js
const menorDatado = [...APTOS, ...LOTES].filter(e => e.p && e.tab).sort(porPreco)[0];
const menorGeral = [...APTOS, ...LOTES].filter(e => e.p).sort(porPreco)[0];
if (menorGeral.p < menorDatado.p) throw new Error('GERA-FOLDER: o menor preço (' + menorGeral.n + ') é de pré-lançamento, sem mês de tabela — revise os números da capa');

// ─── QR (qrgen.js da casa; conferido pelo qrdecode.js) ───
let TMP = null, nQr = 0;
function gerarQr(texto, nivel, zona) {
  const base = path.join(TMP, 'qr-' + (++nQr));
  const g = cp.spawnSync(process.execPath, [R + 'qrcode/qrgen.js', texto, base, nivel, String(zona)], { encoding: 'utf8' });
  if (g.status !== 0) throw new Error('qrgen.js falhou: ' + (g.stderr || g.stdout).trim());
  const d = cp.spawnSync(process.execPath, [R + 'qrcode/qrdecode.js', base + '.matrix.txt'], { encoding: 'utf8' });
  const lida = (/Mensagem: "([^"]*)"/.exec(d.stdout) || [])[1];
  const nivelLido = (/nivel ECC lido da matriz: ([LMQH])/.exec(d.stdout) || [])[1];
  if (d.status !== 0 || !/QR VALIDO/.test(d.stdout) || lida !== texto || nivelLido !== nivel)
    throw new Error('QR não confere no qrdecode.js: esperado ' + texto + ' (' + nivel + '), lido ' + lida + ' (' + nivelLido + ')');
  const tam = +fs.readFileSync(base + '.matrix.txt', 'utf8').split('\n')[0].split(' ')[0];
  const svg = fs.readFileSync(base + '-branco.svg', 'utf8').replace(/width="\d+" height="\d+"/, 'width="100%" height="100%"');
  return { svg, tam, versao: (tam - 17) / 4, nivel, zona, total: tam + 2 * zona };
}

// ─── estilo ───
const css = (Q) => `
  :root{
    --fundo:#161616;          /* capa e contracapa (gráfica: preto calçado) */
    --ouro:#C9A227; --ouro-claro:#F7D77E; --branco:#fff;
    --tinta:#000;             /* texto e fios do miolo: preto puro, para sair só no K */
    --fio:#D8CDA8;
    --fonte-titulo:'Segoe UI',Arial,sans-serif; --peso-titulo:600;
    --fonte-texto:'Segoe UI',Arial,sans-serif;
    --corpo-rotulo:${CORPO_ROTULO}pt;
  }
  *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
  @page{size:214mm 152mm;margin:0}
  html,body{width:214mm;height:152mm;background:#fff}
  body{font-family:var(--fonte-texto);color:var(--tinta);-webkit-print-color-adjust:exact;print-color-adjust:exact;font-kerning:normal}
  .folha{width:214mm;height:152mm;display:flex;position:relative;overflow:hidden}
  .painel{width:107mm;height:152mm;position:relative;overflow:hidden;background:#fff}
  /* segurança: 2 mm de sangria + 4 mm = 6 mm da borda do arquivo; 5 mm do vinco */
  .seg{position:absolute;top:6mm;bottom:6mm;display:flex;flex-direction:column}
  .p-esq .seg{left:6mm;right:5mm}
  .p-dir .seg{left:5mm;right:6mm}
  sup{font-size:6pt;line-height:0;vertical-align:.3em;margin-left:.1mm}
  .escuro{background:var(--fundo);color:var(--branco)}

  /* ── marca ── */
  .logo{line-height:1;padding-top:.6mm}
  .logo-n{display:block;font-family:var(--fonte-titulo);font-weight:var(--peso-titulo);font-size:13pt;line-height:1.2;letter-spacing:.24em}
  .logo-s{display:block;font-size:7pt;font-weight:600;letter-spacing:.42em;text-transform:uppercase;color:var(--ouro);margin-top:.8mm}

  /* ── CAPA ── */
  .capa-foto{flex-shrink:0;height:${CAPA.altura}mm;margin:4.6mm -6mm 0 0;background:url('${CAPA.arquivo}') 0 -${CAPA.y}mm/${CAPA.largura}mm auto no-repeat}
  .ilustr{font-size:7pt;font-weight:600;text-align:right;margin-top:1.4mm}
  .capa-baixo{margin-top:auto}
  .kick-c{font-size:7pt;font-weight:700;letter-spacing:.2em;text-transform:uppercase;color:var(--ouro-claro)}
  .capa h1{font-family:var(--fonte-titulo);font-weight:var(--peso-titulo);font-size:30pt;line-height:1.02;letter-spacing:-.3pt;margin-top:2.4mm}
  .capa h1 em{display:block;font-style:normal;color:var(--ouro)}
  .capa-sub{font-size:7.6pt;font-weight:600;line-height:1.45;margin-top:3.6mm}
  .nums{display:grid;grid-template-columns:auto auto 1fr;column-gap:6mm;margin-top:4.4mm;padding-top:3.4mm;border-top:.8pt solid var(--ouro)}
  .nums strong{display:block;font-family:var(--fonte-titulo);font-weight:var(--peso-titulo);font-size:14pt;line-height:1.1;color:var(--ouro-claro);white-space:nowrap}
  .nums span{display:block;font-size:7pt;font-weight:600;line-height:1.3;margin-top:1mm}

  /* ── CONTRACAPA ── */
  .cc{align-items:center;text-align:center}
  .fio{width:16mm;height:.8pt;background:var(--ouro);margin:4.2mm auto 0;flex-shrink:0}
  .cc-meio{margin:auto 0;display:flex;flex-direction:column;align-items:center}
  .cc-pq h2{font-family:var(--fonte-titulo);font-weight:var(--peso-titulo);font-size:11pt;line-height:1.2}
  .cc-pq h2 em{font-style:normal;color:var(--ouro-claro)}
  .cc-pq p{font-size:7.5pt;font-weight:600;line-height:1.45;max-width:86mm;margin-top:1.6mm}
  .cc-cham{font-size:8.2pt;font-weight:600;line-height:1.42;max-width:84mm;margin-top:4.2mm}
  .cc-cham em{font-style:normal;color:var(--ouro-claro)}
  .cc-qr{width:${Q.site}mm;height:${Q.site}mm;margin-top:4.2mm;border-radius:.8mm;overflow:hidden;background:#fff;flex-shrink:0}
  .cc-qr svg{display:block;width:100%;height:100%}
  .cc-qrleg{font-size:7pt;font-weight:700;letter-spacing:.2em;text-transform:uppercase;color:var(--ouro-claro);margin-top:2.2mm}
  .cc-site{font-size:7.4pt;font-weight:600;margin-top:.9mm}
  .cc-wa{margin-top:4.6mm}
  .cc-wa span{display:block;font-size:7pt;font-weight:600;letter-spacing:.14em;text-transform:uppercase}
  .cc-wa strong{display:block;font-family:var(--fonte-titulo);font-weight:var(--peso-titulo);font-size:18pt;line-height:1.15;color:var(--ouro);margin-top:.6mm}
  .cc-legal{width:100%;border-top:.8pt solid var(--ouro);padding-top:2.6mm}
  .cc-legal p{font-size:7pt;font-weight:600;line-height:1.45}
  .cc-legal p.leg{margin-top:1mm}

  /* ── MIOLO: cards com miniatura ── */
  .tit{flex-shrink:0;display:flex;justify-content:space-between;align-items:flex-end;padding-top:1.1mm;padding-bottom:1.6mm;border-bottom:1pt solid var(--tinta)}
  .tit h2{font-family:var(--fonte-titulo);font-weight:var(--peso-titulo);font-size:16pt;line-height:1;letter-spacing:-.1pt;display:flex;align-items:center;gap:2mm}
  .tit h2 i{display:block;width:1.3mm;height:5.2mm;background:var(--ouro)}
  .tit .ed{text-align:right;line-height:1.25}
  .tit .ed b{display:block;font-size:6.3pt;font-weight:700;letter-spacing:.12em;text-transform:uppercase}
  .tit .ed span{display:block;font-size:6.5pt;font-weight:600}
  .cols{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);column-gap:2.6mm;margin-top:1.4mm;align-items:start}
  .gr{display:flex;justify-content:space-between;align-items:baseline;gap:1mm;background:var(--ouro-claro);
      padding:.75mm 1.3mm .6mm;margin-top:1.9mm;font-size:6.4pt;font-weight:700;letter-spacing:.07em;text-transform:uppercase;line-height:1.15}
  .col>.gr:first-child{margin-top:0}
  .gr i{font-style:normal;font-weight:600;letter-spacing:0;text-transform:none}
  .gr-n{letter-spacing:0}
  .it{display:grid;grid-template-columns:${MINI_L}mm minmax(0,1fr);column-gap:1.4mm;padding:.36mm 0 .26mm;border-bottom:.45pt solid var(--fio)}
  .mini{position:relative;min-height:8mm}
  .mini img{position:absolute;left:0;top:0;width:100%;height:100%;object-fit:cover;display:block}
  .tx{display:flex;flex-direction:column;min-width:0}
  .nome{font-size:6.9pt;font-weight:700;line-height:1.05}
  .cons{font-size:6.2pt;line-height:1.06;margin-top:.05mm}
  .sel{font-size:6.2pt;line-height:1.1;margin-top:.25mm}
  .sel span{background:var(--ouro-claro);font-weight:700;padding:0 .7mm}
  .pz{display:flex;justify-content:space-between;align-items:last baseline;gap:1mm;margin-top:auto;padding-top:.2mm}
  .rot{font-size:var(--corpo-rotulo);line-height:1.05;white-space:nowrap}
  .rot span{display:block}
  .pr{font-size:8.2pt;font-weight:700;line-height:1;white-space:nowrap;font-variant-numeric:tabular-nums;letter-spacing:-.05pt}
  .pr-c{font-size:7.2pt}
  .mapa{display:flex;gap:3.4mm;align-items:center;margin-top:auto;padding:2.6mm;border:.8pt solid var(--ouro);flex-shrink:0}
  .mapa-qr{width:${Q.mapa}mm;height:${Q.mapa}mm;flex-shrink:0}
  .mapa-qr svg{display:block;width:100%;height:100%}
  .mapa b{display:block;font-size:6.6pt;font-weight:700;letter-spacing:.12em;text-transform:uppercase}
  .mapa p{font-size:6.8pt;line-height:1.35;margin-top:1mm}
  .mapa p.url{font-size:6.3pt;font-weight:600;margin-top:1.2mm}
  .pe{margin-top:auto;padding-top:1.4mm;flex-shrink:0;border-top:.45pt solid var(--tinta)}
  .mapa+.pe{margin-top:2.6mm}
  .pe p{font-size:6.2pt;line-height:1.25}
  .pe p+p{margin-top:.25mm}
  .folio{display:flex;justify-content:space-between;font-weight:700;padding-top:1.2mm;margin-top:1.2mm !important;border-top:.45pt solid var(--fio)}
`;

const logo = `<div class="logo"><span class="logo-n">VIV'AMÉRICA</span><span class="logo-s">Imobiliária</span></div>`;
const pagina = (titulo, Q, a, b, base) => `<!DOCTYPE html>
<html lang="pt-BR"><head><meta charset="UTF-8"><meta name="robots" content="noindex">${base ? `<base href="${base}">` : ''}<title>${titulo}</title><style>${css(Q)}</style></head>
<body><div class="folha">${a}${b}</div></body></html>
`;

// p4 — contracapa (esquerda da frente)
const p4 = (QS) => `
<div class="painel p-esq escuro" data-nome="contracapa">
  <div class="seg cc">
    ${logo}
    <div class="fio"></div>
    <div class="cc-meio" data-elastico="ambos">
      <div class="cc-pq"><h2>Por que comprar <em>no lançamento?</em></h2><p>${PQ}</p></div>
      <p class="cc-cham">No site estão a <em>ficha de cada empreendimento</em>, os <em>filtros</em> por tipo e cidade e o <em>mapa dos lotes</em>.</p>
      <div class="cc-qr" data-qr="site">${QS.svg}</div>
      <p class="cc-qrleg">Aponte a câmera</p>
      <p class="cc-site">lancamentos.imoveisvivamerica.com.br</p>
      <div class="cc-wa"><span>WhatsApp e telefone</span><strong>(19) 98976-9457</strong></div>
    </div>
    <div class="cc-legal">
      <p>Imobiliária Viv'América · CRECI 47394-J</p>
      <p>Responsável: Fabio Correia · CRECI 303686-F</p>
      <p>Av. Higienópolis, 70 – Jardim União · Indaiatuba/SP</p>
      <p class="leg">Edição ${edicao} · Imagens ilustrativas.<br>Preços e condições sujeitos a alteração sem aviso prévio.</p>
    </div>
  </div>
</div>`;

// p1 — capa (direita da frente)
const p1 = `
<div class="painel p-dir escuro capa" data-nome="capa">
  <div class="seg">
    ${logo}
    <div class="capa-foto"></div>
    <p class="ilustr">Imagem ilustrativa: ${esc(capaDe.n)}</p>
    <div class="capa-baixo" data-elastico="antes">
      <p class="kick-c">Edição ${edicao}</p>
      <h1>Lançamentos<em>Indaiatuba</em></h1>
      <p class="capa-sub">Do Minha Casa Minha Vida ao alto padrão: apartamentos, loteamentos e condomínios fechados, cada um com o preço inicial e o mês da tabela da construtora.</p>
      <div class="nums">
        <div><strong>${total}</strong><span>empreendimentos</span></div>
        <div><strong>${construtoras}</strong><span>construtoras</span></div>
        <div><strong>${mil(menorDatado.p)}</strong><span>${LOTES.includes(menorDatado) ? 'lotes a partir de' : 'a partir de'}<br>tabela ${mesDe(menorDatado.tab)}</span></div>
      </div>
    </div>
  </div>
</div>`;

const LEGENDA = '<b>A partir de</b>: menor preço da tabela, no mês indicado. <b>m²</b>: área da unidade desse preço.';
const ordemDe = g => g ? 'por ' + g : 'do menor ao maior preço';

// p2 — apartamentos (esquerda do verso)
const p2 = H => `
<div class="painel p-esq" data-nome="apartamentos">
  <div class="seg">
    <header class="tit"><h2><i></i>Apartamentos</h2><p class="ed"><b>Edição ${edicao}</b><span>${APTOS.length} empreendimentos · ${ordemDe(GRUPOS.aptos && 'faixa de preço')}</span></p></header>
    <div class="cols">${colunas(gruposApto, false, H)}
    </div>
    <footer class="pe">
      <p>${LEGENDA}</p>
      ${notas(APTOS)}
    </footer>
  </div>
</div>`;

// p3 — lotes e condomínios (direita do verso)
const p3 = (H, QM) => `
<div class="painel p-dir" data-nome="lotes">
  <div class="seg">
    <header class="tit"><h2><i></i>Lotes e condomínios</h2><p class="ed"><b>Edição ${edicao}</b><span>${LOTES.length} empreendimentos · ${ordemDe(GRUPOS.lotes && 'tipo')}</span></p></header>
    <div class="cols">${colunas(gruposLote, true, H)}
    </div>
    <div class="mapa">
      <div class="mapa-qr" data-qr="mapa">${QM.svg}</div>
      <div><b>Mapa dos lotes</b><p>Os loteamentos de Indaiatuba no mapa, quadra a quadra, com a metragem e o preço de cada terreno.</p><p class="url">lancamentos.imoveisvivamerica.com.br/<br>mapa-lotes-indaiatuba</p></div>
    </div>
    <footer class="pe">
      <p>${LEGENDA.replace('área da unidade desse preço', 'área do lote desse preço')}</p>
      ${notas(LOTES)}
      <p>Preços e condições sujeitos a alteração sem aviso prévio.</p>
      <p class="folio"><span>Imobiliária Viv'América · CRECI 47394-J</span><span>WhatsApp (19) 98976-9457</span></p>
    </footer>
  </div>
</div>`;

// ─── medição (roda DENTRO do navegador; recebe a configuração da face) ───
async function medir(C) {
  const MM = 96 / 25.4, PT = 96 / 72, TOL = C.tol * MM;
  const mm = v => +(v / MM).toFixed(2);
  const P = [], M = { folgas: {}, menorPt: {}, alturas: {}, faixa: 0, qr: {}, fotos: [], minis: [], itens: 0 };
  await document.fonts.ready;
  const folha = document.querySelector('.folha').getBoundingClientRect();
  if (Math.abs(mm(folha.width) - 214) > 0.1 || Math.abs(mm(folha.height) - 152) > 0.1)
    P.push('folha com ' + mm(folha.width) + ' x ' + mm(folha.height) + ' mm (gabarito: 214 x 152)');

  // foto da capa: carregou, cobre a caixa e tem resolução para a gráfica
  for (const el of document.querySelectorAll('.capa-foto')) {
    const cs = getComputedStyle(el), box = el.getBoundingClientRect();
    const url = (cs.backgroundImage.match(/url\("?(.*?)"?\)/) || [])[1];
    const nat = await new Promise(r => { const i = new Image(); i.onload = () => r([i.naturalWidth, i.naturalHeight]); i.onerror = () => r([0, 0]); i.src = url; });
    if (!nat[0]) { P.push('foto da capa não carregou: ' + url); continue; }
    const bw = parseFloat(cs.backgroundSize), bh = bw * nat[1] / nat[0];
    const bx = parseFloat(cs.backgroundPositionX) || 0, by = parseFloat(cs.backgroundPositionY) || 0;
    const dpi = Math.round(nat[0] / (bw / 96));
    if (bx > 0.5 || by > 0.5 || bw + bx < box.width - 0.5 || bh + by < box.height - 0.5) P.push('a foto da capa não cobre a caixa');
    if (dpi < C.dpiMin) P.push('foto da capa com ' + dpi + ' dpi (mínimo ' + C.dpiMin + ')');
    M.fotos.push({ arquivo: url.split('/').slice(-3).join('/'), dpi, px: nat.join('x') });
  }

  // miniaturas dos cards: carregaram, cobrem a caixa (object-fit cover) e têm resolução para a gráfica
  for (const im of document.querySelectorAll('.mini img')) {
    try { await im.decode(); } catch (e) { /* conferido abaixo */ }
    const arq = decodeURIComponent(im.getAttribute('src')), box = im.getBoundingClientRect(), cx = im.parentElement.getBoundingClientRect();
    if (!im.naturalWidth) { P.push('miniatura não carregou: ' + arq); continue; }
    if (getComputedStyle(im).objectFit !== 'cover') P.push('miniatura sem object-fit cover: ' + arq);
    if (Math.abs(box.width - cx.width) > 0.5 || Math.abs(box.height - cx.height) > 0.5 || box.height < 1) P.push('miniatura não cobre a caixa: ' + arq);
    // recorte (object-view-box: inset em %): a resolução que conta é a do trecho usado, não a da foto inteira
    const ovb = getComputedStyle(im).objectViewBox || 'none';
    let fw = 1, fh = 1;
    if (ovb !== 'none') {
      const v = ((/^inset\(([^)]*)\)$/.exec(ovb) || [])[1] || '').trim().split(/\s+/);
      const [st, sr, sb, sl] = v.length === 1 ? [v[0], v[0], v[0], v[0]] : v.length === 2 ? [v[0], v[1], v[0], v[1]] : v.length === 3 ? [v[0], v[1], v[2], v[1]] : v;
      const fr = (s, nat) => /%$/.test(s || '') ? parseFloat(s) / 100 : /px$/.test(s || '') ? parseFloat(s) / nat : s === '0' ? 0 : NaN;
      const [t, r, b, l] = [fr(st, im.naturalHeight), fr(sr, im.naturalWidth), fr(sb, im.naturalHeight), fr(sl, im.naturalWidth)];
      if ([t, r, b, l].some(x => !(x >= 0))) P.push('recorte da miniatura não lido (' + ovb + '): ' + arq);
      else { fw = 1 - l - r; fh = 1 - t - b; }
    }
    const dpi = Math.round(96 * Math.min(im.naturalWidth * fw / box.width, im.naturalHeight * fh / box.height));
    if (dpi < C.dpiMin) P.push('miniatura com ' + dpi + ' dpi (mínimo ' + C.dpiMin + '): ' + arq);
    M.minis.push({ arquivo: arq, dpi, px: im.naturalWidth + 'x' + im.naturalHeight, w: mm(box.width), h: mm(box.height) });
  }

  // transparência (opacidade, cor com alfa, degradê, sombra, filtro, mistura): o PDF de gráfica não leva
  const alfa = c => { const m = /^rgba\([^,]+,[^,]+,[^,]+,\s*([\d.]+)\)$/.exec(c) || /\/\s*([\d.]+)\)$/.exec(c); return m ? +m[1] : 1; };
  for (const el of document.querySelectorAll('.folha, .folha *')) {
    if (el.closest('svg')) continue;
    for (const ps of [null, '::before', '::after']) {
      const cs = getComputedStyle(el, ps);
      if (ps && (cs.content === 'none' || cs.content === 'normal')) continue;
      const cores = [cs.color, cs.backgroundColor, ...['Top', 'Right', 'Bottom', 'Left'].filter(l => parseFloat(cs['border' + l + 'Width']) > 0).map(l => cs['border' + l + 'Color'])];
      const motivo = +cs.opacity < 1 ? 'opacidade' : cores.some(c => alfa(c) > 0 && alfa(c) < 1) ? 'cor com transparência'
        : /gradient/.test(cs.backgroundImage) ? 'degradê' : cs.boxShadow !== 'none' || cs.textShadow !== 'none' ? 'sombra'
        : cs.filter !== 'none' ? 'filtro' : cs.mixBlendMode !== 'normal' ? 'mistura de cores' : '';
      if (motivo) P.push(`transparência (${motivo}) em ${typeof el.className === 'string' && el.className ? '.' + el.className.split(' ')[0] : el.tagName}${ps || ''}: o PDF de gráfica não leva`);
    }
  }

  const CAIXAS = '.it,.gr,.tit,.pe,.mapa,.cc-legal,.nums';
  for (const painel of document.querySelectorAll('.painel')) {
    const nome = painel.dataset.nome, escuro = painel.classList.contains('escuro');
    const S = painel.querySelector('.seg').getBoundingClientRect();
    let menor = 99;
    // texto: corpo, peso, área de segurança e caixa de cada letra
    const tw = document.createTreeWalker(painel, NodeFilter.SHOW_TEXT);
    for (let n; (n = tw.nextNode());) {
      const t = n.textContent.replace(/\s+/g, ' ').trim();
      if (!t) continue;
      const el = n.parentElement, cs = getComputedStyle(el);
      const pt = +(parseFloat(cs.fontSize) / PT).toFixed(2), peso = parseInt(cs.fontWeight, 10);
      menor = Math.min(menor, pt);
      if (escuro && (pt < C.minEscuro - 0.005 || peso < C.pesoEscuro))
        P.push(`${nome}: "${t.slice(0, 40)}" com ${pt} pt/${peso} sobre o fundo escuro (mínimo ${C.minEscuro} pt semibold)`);
      if (!escuro && pt < C.minMiolo - 0.005) P.push(`${nome}: "${t.slice(0, 40)}" com ${pt} pt (mínimo ${C.minMiolo} pt)`);
      const rg = document.createRange(); rg.selectNodeContents(n);
      const cx = el.closest(CAIXAS), B = cx && cx.getBoundingClientRect();
      for (const r of rg.getClientRects()) {
        if (r.width < 0.5) continue;
        if (r.left < S.left - TOL || r.right > S.right + TOL || r.top < S.top - TOL || r.bottom > S.bottom + TOL)
          P.push(`${nome}: texto fora da área de segurança: "${t.slice(0, 40)}" (esq ${mm(S.left - r.left)} · dir ${mm(r.right - S.right)} · cima ${mm(S.top - r.top)} · baixo ${mm(r.bottom - S.bottom)} mm)`);
        if (B && (r.left < B.left - TOL || r.right > B.right + TOL || r.top < B.top - TOL || r.bottom > B.bottom + TOL))
          P.push(`${nome}: letra fora da caixa .${cx.className.split(' ')[0]}: "${t.slice(0, 40)}"`);
      }
    }
    M.menorPt[nome] = menor;
    // caixa que corta o conteúdo; texto sem quebra mais largo que a linha
    for (const el of painel.querySelectorAll('.seg *')) {
      const cs = getComputedStyle(el), t = (el.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 40);
      if ((cs.overflowX !== 'visible' || cs.overflowY !== 'visible') && (el.scrollWidth > el.clientWidth + 1 || el.scrollHeight > el.clientHeight + 1))
        P.push(`${nome}: caixa .${el.className || el.tagName} corta o conteúdo: "${t}"`);
      if (cs.whiteSpace === 'nowrap' && t) {
        const rg = document.createRange(); rg.selectNodeContents(el);
        if (rg.getBoundingClientRect().width > el.getBoundingClientRect().width + 0.5) P.push(`${nome}: texto sem quebra mais largo que a linha: "${t}"`);
      }
    }
    // cards: texto encostando na miniatura; "a partir de"/mês encostando no preço; miniatura fora do card;
    // altura de cada card (para refazer a divisão das colunas)
    const direita = el => { let d = 0; const rg = document.createRange(); rg.selectNodeContents(el); for (const r of rg.getClientRects()) if (r.width > 0.5) d = Math.max(d, r.right); return d; };
    const esquerda = el => { let e = Infinity; const rg = document.createRange(); rg.selectNodeContents(el); for (const r of rg.getClientRects()) if (r.width > 0.5) e = Math.min(e, r.left); return e; };
    for (const it of painel.querySelectorAll('.it')) {
      const tit = it.querySelector('.nome').textContent, B = it.getBoundingClientRect();
      const mi = it.querySelector('.mini').getBoundingClientRect();
      const esq = Math.min(...[...it.querySelectorAll('.tx > *')].map(esquerda));
      if (esq - mi.right < 0.8 * MM) P.push(`${nome}: "${tit}": texto a ${mm(esq - mi.right)} mm da miniatura (mínimo 0,8)`);
      if (mi.left < B.left - TOL || mi.right > B.right + TOL || mi.top < B.top - TOL || mi.bottom > B.bottom + TOL) P.push(`${nome}: "${tit}": miniatura fora do card`);
      const pr = it.querySelector('.pr'), gap = esquerda(pr) - direita(it.querySelector('.rot'));
      if (gap < 0.8 * MM) P.push(`${nome}: "${tit}": "a partir de" encosta no preço (${mm(gap)} mm)`);
      M.alturas[it.dataset.k] = mm(B.height);
      M.itens++;
    }
    for (const g of painel.querySelectorAll('.gr')) M.faixa = Math.max(M.faixa, mm(g.getBoundingClientRect().height + parseFloat(getComputedStyle(g).marginTop) || 0));
    // folga: de cada coluna até o bloco de baixo; nos painéis escuros, a soma dos espaços elásticos
    for (const cols of painel.querySelectorAll('.cols')) {
      const prox = cols.nextElementSibling, topo = prox.getBoundingClientRect().top;
      [...cols.children].forEach((col, i) => {
        const f = mm(topo - col.getBoundingClientRect().bottom);
        (M.folgas[nome] = M.folgas[nome] || []).push(f);
        if (f < C.folgaMin) P.push(`${nome}: coluna ${i + 1} com ${f} mm de folga até .${prox.className} (mínimo ${C.folgaMin} mm)`);
      });
    }
    const elas = painel.querySelectorAll('[data-elastico]');
    if (elas.length) {
      let f = 0;
      for (const el of elas) {
        const r = el.getBoundingClientRect(), ant = el.previousElementSibling, prox = el.nextElementSibling;
        if (ant) f += r.top - ant.getBoundingClientRect().bottom;
        if (el.dataset.elastico === 'ambos' && prox) f += prox.getBoundingClientRect().top - r.bottom;
      }
      M.folgas[nome] = [mm(f)];
      if (mm(f) < C.folgaMin) P.push(`${nome}: ${mm(f)} mm de folga (mínimo ${C.folgaMin} mm)`);
    }
  }

  // preços: os mesmos da fonte única, todos com área visível
  if (C.precos) {
    const vistos = [...document.querySelectorAll('.pr')].map(p => p.textContent.trim());
    const falta = C.precos.filter(p => !vistos.includes(p)), sobra = vistos.filter(p => !C.precos.includes(p));
    if (falta.length || sobra.length || vistos.length !== C.precos.length)
      P.push('preços na página ≠ fonte única' + (falta.length ? ' · faltam ' + falta.join(', ') : '') + (sobra.length ? ' · sobram ' + sobra.join(', ') : ''));
    for (const p of document.querySelectorAll('.pr')) { const r = p.getBoundingClientRect(); if (r.width < 1 || r.height < 1) P.push('preço sem área visível: ' + p.textContent); }
    if (M.itens !== C.itens) P.push(M.itens + ' fichas na página; a fonte única tem ' + C.itens);
  }

  // QR: módulo mínimo e zona de silêncio
  for (const q of document.querySelectorAll('[data-qr]')) {
    const k = q.dataset.qr, cfg = C.qr[k], r = q.getBoundingClientRect();
    const mod = r.width / cfg.total;
    M.qr[k] = { lado: mm(r.width), modulo: +(mod / MM).toFixed(3), versao: cfg.versao, nivel: cfg.nivel };
    if (Math.abs(r.width - r.height) > 0.5) P.push('QR ' + k + ' não é quadrado');
    if (mod / MM < C.moduloMin) P.push(`QR ${k}: módulo de ${(mod / MM).toFixed(3)} mm (mínimo ${C.moduloMin} mm)`);
    if (cfg.zona === 0) {   // zona de silêncio = o branco em volta, até a borda interna da caixa e até o texto
      const box = q.closest('.mapa'), b = box.getBoundingClientRect(), bw = parseFloat(getComputedStyle(box).borderLeftWidth);
      const viz = q.nextElementSibling.getBoundingClientRect();
      const min = Math.min(r.left - (b.left + bw), r.top - (b.top + bw), (b.bottom - bw) - r.bottom, viz.left - r.right);
      M.qr[k].zona = +(min / mod).toFixed(1);
      if (min < 4 * mod - 0.5) P.push(`QR ${k}: zona de silêncio de ${(min / mod).toFixed(1)} módulos (mínimo 4)`);
    } else M.qr[k].zona = cfg.zona;
  }
  return JSON.stringify({ P, M });
}
const CFG = { tol: 0.2, minMiolo: 6, minEscuro: 7, pesoEscuro: 600, folgaMin: 2, dpiMin: 250, moduloMin: 0.5 };

// ─── navegador: Edge sem interface, convidado, sem sincronização, perfil próprio ───
const dorme = ms => new Promise(r => setTimeout(r, ms));
let edge = null;
async function abreEdge() {
  const exe = [process.env['ProgramFiles(x86)'], process.env.ProgramFiles].filter(Boolean)
    .map(p => path.join(p, 'Microsoft', 'Edge', 'Application', 'msedge.exe')).find(f => fs.existsSync(f));
  if (!exe) throw new Error('Edge não encontrado: sem ele a checagem não roda e o folder não é gravado');
  const perfil = path.join(TMP, 'perfil');
  fs.mkdirSync(perfil);
  const proc = cp.spawn(exe, ['--headless=new', '--guest', '--allow-browser-signin=false', '--disable-sync', '--no-first-run',
    '--disable-extensions', '--mute-audio', '--hide-scrollbars', '--remote-debugging-port=0', '--user-data-dir=' + perfil, 'about:blank'],
    { stdio: 'ignore' });
  edge = { proc };
  let porta = null;
  for (let i = 0; i < 200 && !porta; i++) {
    const f = path.join(perfil, 'DevToolsActivePort');
    if (fs.existsSync(f)) porta = +fs.readFileSync(f, 'utf8').split('\n')[0] || null;
    if (!porta) await dorme(100);
  }
  if (!porta) throw new Error('o Edge não abriu a porta de depuração');
  const lista = await (await fetch(`http://127.0.0.1:${porta}/json/list`)).json();
  const ws = new WebSocket(lista.find(t => t.type === 'page').webSocketDebuggerUrl);
  await new Promise((ok, ko) => { ws.addEventListener('open', ok); ws.addEventListener('error', () => ko(new Error('sem conexão com o Edge'))); });
  let id = 0;
  const pend = new Map(), ouvintes = new Set();
  ws.addEventListener('message', ev => {
    const m = JSON.parse(ev.data);
    if (m.id && pend.has(m.id)) { const p = pend.get(m.id); pend.delete(m.id); m.error ? p.ko(new Error(m.error.message)) : p.ok(m.result); }
    else if (m.method) ouvintes.forEach(f => f(m));
  });
  const call = (method, params = {}) => new Promise((ok, ko) => { const i = ++id; pend.set(i, { ok, ko }); ws.send(JSON.stringify({ id: i, method, params })); });
  const evento = (metodo, ms) => new Promise((ok, ko) => {
    const f = m => { if (m.method === metodo) { clearTimeout(t); ouvintes.delete(f); ok(m); } };
    const t = setTimeout(() => { ouvintes.delete(f); ko(new Error('tempo esgotado esperando ' + metodo)); }, ms);
    ouvintes.add(f);
  });
  Object.assign(edge, { ws, call, evento });
  await call('Page.enable'); await call('Runtime.enable'); await call('DOM.enable'); await call('CSS.enable');
  await call('Emulation.setDeviceMetricsOverride', { width: 809, height: 575, deviceScaleFactor: 1, mobile: false });
  return edge;
}
async function mede(nome, html, cfg, fontesEm) {
  const f = path.join(TMP, nome + '.html');
  fs.writeFileSync(f, html, 'utf8');
  const carregou = edge.evento('Page.loadEventFired', 30000);
  await edge.call('Page.navigate', { url: pathToFileURL(f).href });
  await carregou;
  const r = await edge.call('Runtime.evaluate', { expression: `(${medir.toString()})(${JSON.stringify(cfg)})`, awaitPromise: true, returnByValue: true });
  if (r.exceptionDetails) throw new Error('medição falhou em ' + nome + ': ' + (r.exceptionDetails.exception || {}).description);
  const out = JSON.parse(r.result.value);
  // fonte de verdade: a fonte que o navegador USOU em cada trecho (não a pedida no CSS)
  const doc = await edge.call('DOM.getDocument', { depth: 0 });
  for (const sel of fontesEm) {
    const q = await edge.call('DOM.querySelector', { nodeId: doc.root.nodeId, selector: sel });
    const usadas = q.nodeId ? (await edge.call('CSS.getPlatformFontsForNode', { nodeId: q.nodeId })).fonts.map(x => x.familyName) : [];
    if (!usadas.length || usadas.some(n => !/^Segoe UI/.test(n))) out.P.push(`${nome}: "${sel}" saiu em ${usadas.join(', ') || 'nenhuma fonte'} (esperado Segoe UI)`);
  }
  return out;
}
function fechaEdge() {
  if (!edge) return;
  try { edge.ws && edge.ws.close(); } catch (e) { /* já fechado */ }
  cp.spawnSync('taskkill', ['/PID', String(edge.proc.pid), '/T', '/F'], { stdio: 'ignore' });
  edge = null;
}
function limpa() {
  fechaEdge();
  if (!TMP) return;
  // filhos que sobreviveram ao taskkill: encerra pelo nome da pasta do perfil na linha de comando
  const marca = path.basename(TMP);
  const ps = c => cp.spawnSync('powershell', ['-NoProfile', '-NonInteractive', '-Command',
    `$p = Get-CimInstance Win32_Process -Filter "Name='msedge.exe'" | Where-Object { $_.CommandLine -like '*${marca}*' }; ${c}`], { encoding: 'utf8' });
  ps('$p | ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }');
  for (let i = 0; i < 30 && fs.existsSync(TMP); i++) {
    try { fs.rmSync(TMP, { recursive: true, force: true }); } catch (e) { /* arquivo ainda preso */ }
    if (fs.existsSync(TMP)) Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 300);
  }
  const restam = +(ps('@($p).Count').stdout || '0').trim() || 0;
  console.log(`  Edge encerrado (${restam} processo(s) restante(s)) · pasta temporária apagada: ${fs.existsSync(TMP) ? 'NÃO — ' + TMP : 'sim'}`);
  TMP = null;
}
process.on('SIGINT', () => { limpa(); process.exit(130); });

// ─── execução ───
(async () => {
  let codigo = 0;
  try {
    TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'gera-folder-'));
    const QS = gerarQr(URL_SITE, 'H', 4), QM = gerarQr(URL_MAPA, 'M', 0);
    const Q = { site: +(QS.total * QR_SITE_MODULO).toFixed(2), mapa: QR_MAPA_LADO };
    const base = pathToFileURL(R).href.replace(/\/?$/, '/');
    const frente = b => pagina("Folder Viv'América · frente", Q, p4(QS), p1, b);
    const verso = (H, b) => pagina("Folder Viv'América · verso", Q, p2(H), p3(H, QM), b);
    const cfgQr = { site: QS, mapa: QM };
    const precos = [...APTOS, ...LOTES].map(e => e.p ? brl(e.p) : 'sob consulta');

    await abreEdge();
    const rF = await mede('folder-frente', frente(base), { ...CFG, qr: cfgQr }, ['.logo-n', 'h1', '.cc-pq p', '.cc-legal p']);
    // verso: 1ª medida com as alturas estimadas; a divisão das colunas é refeita com as alturas medidas
    const cfgV = { ...CFG, qr: cfgQr, precos, itens: APTOS.length + LOTES.length };
    let H = EST, rV = await mede('folder-verso', verso(H, base), cfgV, ['.nome', '.pr', '.rot span', '.tit h2', '.pe p']);
    const medido = { it: e => rV.M.alturas[e._k] || EST.it(e), faixa: rV.M.faixa || EST.faixa, corte: EST.corte };
    if (verso(medido, base) !== verso(H, base)) { H = medido; rV = await mede('folder-verso', verso(H, base), cfgV, ['.nome', '.pr', '.rot span', '.tit h2', '.pe p']); }

    const problemas = [...rF.P, ...rV.P];
    const M = { folgas: { ...rF.M.folgas, ...rV.M.folgas }, menorPt: { ...rF.M.menorPt, ...rV.M.menorPt }, qr: { ...rF.M.qr, ...rV.M.qr }, fotos: [...rF.M.fotos, ...rV.M.fotos], minis: rV.M.minis };
    const v = n => String(n).replace('.', ',');
    console.log('Folder — 214 × 152 mm (210 × 148 aberto + 2 mm de sangria), 1 dobra, fechado 105 × 148');
    console.log('  frente = p4 contracapa | p1 capa · verso = p2 ' + APTOS.length + ' apartamentos | p3 ' + LOTES.length + ' lotes e condomínios');
    console.log('  capa: ' + total + ' empreendimentos · ' + construtoras + ' construtoras · a partir de ' + mil(menorDatado.p) + ' (' + menorDatado.n + ', tabela ' + mesDe(menorDatado.tab) + ') · edição ' + edicao);
    console.log('  apartamentos: ' + gruposApto.map(g => (g.titulo || 'sem faixas, do menor ao maior preço') + ' ' + g.itens.length).join(' | '));
    console.log('  lotes: ' + gruposLote.map(g => (g.titulo || 'sem tipos, do menor ao maior preço') + ' ' + g.itens.length).join(' | '));
    console.log('  folga (mm): ' + Object.entries(M.folgas).map(([k, f]) => k + ' ' + f.map(v).join(' e ')).join(' · '));
    console.log('  menor corpo (pt): ' + Object.entries(M.menorPt).map(([k, p]) => k + ' ' + v(p)).join(' · ') + ' — sobre o escuro: mínimo 7 pt semibold');
    for (const [k, q] of Object.entries(M.qr)) console.log(`  QR ${k}: versão ${q.versao}-${q.nivel}, ${v(q.lado)} mm, módulo ${v(q.modulo)} mm, zona de silêncio ${v(q.zona)} módulos`);
    for (const f of M.fotos) console.log(`  foto da capa: ${f.arquivo} (${f.px}) a ${f.dpi} dpi`);
    if (M.minis.length) {
      const dpis = M.minis.map(f => f.dpi), kb = [...MINI.values()].reduce((t, f) => t + f.kb, 0);
      console.log(`  miniaturas: ${M.minis.length} JPEG (${Object.keys(MINI_FOTO).length} exceções em MINI_FOTO; ${(kb / 1024).toFixed(1).replace('.', ',')} MB no total), quadro de ${v(Math.min(...M.minis.map(f => f.w)))} mm × ${v(Math.min(...M.minis.map(f => f.h)))} a ${v(Math.max(...M.minis.map(f => f.h)))} mm, de ${Math.min(...dpis)} a ${Math.max(...dpis)} dpi`);
    }
    avisosMini.forEach(a => console.log('  aviso: ' + a));
    if (problemas.length) {
      console.log('\nCHECAGEM REPROVOU — nada foi gravado (' + problemas.length + ' problema(s)):');
      [...new Set(problemas)].forEach(p => console.log('  · ' + p));
      codigo = 1;
    } else {
      console.log('  checagem no Edge: 0 problema');
      for (const [arq, html] of [['folder-frente.html', frente('')], ['folder-verso.html', verso(H, '')]]) {
        const f = SAIDA + arq;
        const igual = fs.existsSync(f) && fs.readFileSync(f, 'utf8') === html;
        if (!igual) fs.writeFileSync(f, html, 'utf8');
        console.log('  ' + arq + ': ' + (igual ? 'sem mudança' : 'gravado'));
      }
    }
  } catch (e) {
    console.log('ERRO: ' + e.message + ' — nada foi gravado');
    codigo = 1;
  } finally {
    limpa();
  }
  process.exitCode = codigo;
})();
