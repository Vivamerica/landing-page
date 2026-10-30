/* ═══════════════════════════════════════════════════════════════════
   FOLDER 2 DOBRAS (dobra em rolo, 3 painéis por lado) — arte para gráfica
   ───────────────────────────────────────────────────────────────────
   Por quê: com 25 apartamentos e 13 lotes na fonte única, o painel de
   apartamentos do folder de 1 dobra (gera-folder.js) estourou. Pedido do
   Fabio (29/10/2026): folder de 2 dobras, "uma capa e no meio distribuir
   os empreendimentos". O gera-folder.js continua como está.

   Gabarito da gráfica (modelos Word BROCHURE_TRIFOLD_148X210_Real_Size
   _Front_H / _Back_H: página 12140 × 8620 twips; linhas de dobra em
   3969 e 7994 twips na frente, 4139 e 8164 no verso):
     aberto  210 × 148 mm
     sangria 2 mm por lado  →  arquivo final 214 × 152 mm (as duas faces)
     FRENTE (lado de fora): dobras a 70,0 e 141,0 mm da borda esquerda do
       arquivo → painéis acabados de 68 | 71 | 71 mm. O de 68 (esquerda)
       é a ABA, que dobra para dentro.
     VERSO (lado de dentro): dobras a 73,0 e 144,0 mm → 71 | 71 | 68 mm (a
       aba agora à direita: é o outro lado do mesmo painel).
     área de segurança: 6 mm da borda do arquivo (2 de sangria + 4) e 5 mm
       de cada vinco → 140 mm de altura útil; largura útil de 59 mm nos
       painéis de 68 (aba) e de 61–62 mm nos de 71.

   Como se lê (dobra em rolo): fechado, a CAPA é o painel da direita da
   frente e a CONTRACAPA o do meio. Abrindo a capa: o painel da esquerda do
   verso (atrás da capa) e, à direita dele, a ABA (lado de fora). Abrindo a
   aba: o verso inteiro, esquerda | meio | direita.

   Imposição e distribuição (os mesmos dados e regras do gera-folder.js).
   Pedido do Fabio (29/10/2026, 2ª prova): o verso só com apartamentos em
   sequência — do mais barato ao mais caro, da esquerda para a direita —,
   os lotes começando depois deles e terminando na aba da frente:
     VERSO  = [ESQUERDA 71: apartamentos até R$ 400 mil]
              [MEIO 71: apartamentos de R$ 400 a 800 mil]
              [DIREITA 68: apartamentos acima de R$ 800 mil + loteamentos
               abertos]
     FRENTE = [ABA 68: condomínios fechados + o rodapé do folder]
              [CONTRACAPA 71: "Por que comprar no lançamento?", QR do site,
               QR do mapa de lotes, CRECI da imobiliária e aviso legal (sem
               telefone e sem responsável pessoa física, a pedido do Fabio)]
              [CAPA 71: foto, título, números, edição]
   As faixas são as FAIXAS do gera-folder.js, com o título e a contagem;
   dentro da faixa (e do tipo de lote), do menor para o maior preço.

   Desenho: o card com miniatura do gera-folder.js, agora 1 coluna larga
   por painel. Ajuste fino exigido pela largura (59 mm na aba): a linha de
   baixo do card vira "tabela mmm/aaaa" à esquerda e "a partir de" colado
   ao preço, à direita (empilhados, como no folder de 1 dobra, os 11
   condomínios fechados não cabem no painel de 68 mm). Cada painel tem um
   "respiro" (espaço igual acima e abaixo de cada card) calculado da folga
   medida na 1ª rodada, para a lista não terminar no meio do painel (até
   RESPIRO_MAX). No verso aberto (VISTOS_JUNTOS: esquerda | meio |
   direita) o respiro de cada um fica até RESPIRO_DIF acima do mais
   apertado, para o ritmo dos cards não destoar; o que sobra fica no fim
   da lista. Com 8 apartamentos de R$ 400 a 800 mil, o meio não enche: o
   resto fica em branco no pé do painel. (A esquerda não segue mais a aba:
   desde a 2ª prova a aba é de lotes e, apertada com o rodapé, prendia o
   verso inteiro e deixava 2 a 3 cm em branco na esquerda e no meio.)
   O rodapé ("A partir de", "Pré-lançamento", preços confirmados†) sai uma
   vez só, no fim da aba, a última coluna de empreendimentos (pedido do
   Fabio, 29/10/2026). O mês do † vem do campo conf da fonte única: com as
   tabelas do mês da tiragem lançadas, sai esse mês; a linha só aparece se
   algum card leva †. A capa e a contracapa terminam com um fio dourado
   cada; com a frente aberta os dois ficam lado a lado, e o gerador iguala
   a altura deles (FIOS, medida na 1ª rodada).
   Dobra entre fundo claro e escuro (frente, a 70 mm: aba branca |
   contracapa preta): o preto avança TRANSBORDA (1 mm) sobre a aba, do lado
   do vinco. Fechado, esse vinco é a borda da contracapa; com a tolerância
   da dobradeira (±0,5 mm) ou a curvatura do papel, sem isso aparece um
   filete branco ali. A faixa fica a 4 mm da área de segurança da aba.

   Dados: APTOS/LOTES e o parágrafo "Por que comprar no lançamento?" do
   gera-folheto.js (fonte única); EDICAO do gera-observatorio.js. Cores e
   fontes nas mesmas variáveis do :root do gera-folder.js.

   Saída: SÓ na pasta de saída (--saida=<pasta>; padrão Desktop/folder-
   2dobras, fora do site; nunca dentro do site): frente.html e verso.html
   (de trabalho, com <base> apontando para a raiz do site), frente.pdf e
   verso.pdf (impressos pelo próprio Edge que mediu; caixas regravadas:
   MediaBox = BleedBox de 214 × 152 mm, TrimBox de 210 × 148 mm),
   pedido-grafica.txt (o pedido abaixo, para ir JUNTO com os PDFs),
   frente-p1.png / verso-p1.png (pdf2png.ps1) e prova-guias-*.png (cópia
   com corte, dobra e segurança desenhados por cima). Nada na raiz do site.
   Tudo é montado e conferido na pasta temporária; com a checagem aprovada,
   apaga os arquivos dessa lista que estiverem na pasta de saída (de uma
   rodada anterior) e grava os novos. Reprovada, não toca na pasta e lista
   os arquivos antigos que ficaram lá, com a data, para não irem à gráfica.

   Checagem — o gerador PARA (exit 1) e não grava nada quando falha. As
   mesmas do gera-folder.js, no Edge sem interface (convidado, sem
   sincronização e sem login, perfil próprio apagado no fim, árvore de
   processos encerrada), em mídia de impressão:
     · painéis nas dobras do gabarito e área de segurança no lugar;
     · letra fora da área de segurança ou fora da própria caixa;
     · caixa que corta o conteúdo; texto sem quebra mais largo que a linha;
     · folga abaixo de 2 mm no fim da lista de cada painel do miolo e nos
       espaços elásticos da capa e da contracapa;
     · corpo abaixo de 6 pt no miolo; abaixo de 7 pt ou mais fino que
       semibold sobre o fundo escuro;
     · preço faltando, sobrando ou diferente da fonte única (somando as
       duas faces), card repetido, fora da ordem de preço ou fora da faixa;
       fonte trocada; foto da capa ou miniatura sem carregar, sem cobrir a
       caixa ou abaixo de 250 dpi; foto da capa sem sangrar; texto do card
       em cima da miniatura; mês da tabela encostando em "a partir de";
       "a partir de" encostando no preço; QR com módulo abaixo de 0,5 mm
       ou sem zona de silêncio;
     · transparência de qualquer tipo (no HTML e no PDF: opacidade,
       máscara, cor com alfa, degradê, sombra, filtro, imagem com alfa);
     · dobra entre fundo claro e escuro sem o escuro avançar 1 mm sobre o
       claro (no HTML e nos pixels do PDF renderizado);
     · PDF: 1 página, MediaBox = BleedBox de 214 × 152 mm, TrimBox de
       210 × 148 mm, tabela xref íntegra, fontes embutidas, imagens em
       JPEG; no PNG renderizado, borda do arquivo sem fio de outra cor.
   Os dois QR saem do qrcode/qrgen.js (com zona de silêncio branca de 4
   módulos, porque ficam sobre o preto) e são relidos pelo qrdecode.js a
   cada rodada; os dois levam utm_source=folder.

   Pedido à gráfica (o PDF do navegador sai em RGB e NÃO é PDF/X-1a). Vai
   no pedido-grafica.txt, gravado junto com os PDFs (pedidoGrafica()):
     · converter para CMYK/PDF-X-1a no fluxo dela (ou no Acrobat Pro:
       Preflight → "Converter para PDF/X-1a"); nada é instalado aqui;
     · preto RGB 0,0,0 do miolo (texto de 6 pt para cima e fios) em 100% K,
       nunca preto de 4 cores; prova digital com as separações;
     · fundo da capa e da contracapa em preto calçado C40 K100, nunca nas
       4 cores carregadas;
     · vinco antes de dobrar, nas duas dobras (o preto chapado atravessa a
       dobra de 141 mm);
     · dobra em rolo: a aba de 68 mm dobra para dentro primeiro.
   O texto vazado sobre o preto tem 7 pt ou mais, semibold (a checagem
   garante).
   Uso: node gera-folder-2dobras.js [--saida=<pasta fora do site>]
   ═══════════════════════════════════════════════════════════════════ */

const fs = require('fs');
const os = require('os');
const path = require('path');
const cp = require('child_process');
const { pathToFileURL } = require('url');

const R = __dirname.replace(/\\/g, '/') + '/';   // raiz do site: de onde se lê (nada é gravado aqui)
const SAIDA_PADRAO = path.join(os.homedir(), 'Desktop', 'folder-2dobras');   // durável e fora do site
const argSaida = process.argv.find(a => a.startsWith('--saida='));
const SAIDA = (argSaida ? argSaida.slice('--saida='.length) : SAIDA_PADRAO).replace(/\\/g, '/').replace(/\/?$/, '/');
if ((path.resolve(SAIDA) + path.sep).toLowerCase().startsWith((path.resolve(R) + path.sep).toLowerCase()))
  throw new Error('GERA-FOLDER-2DOBRAS: a pasta de saída (' + SAIDA + ') fica dentro do site — a prova não vai para a raiz do site');

// ─── fonte única (como no gera-folder.js) ───
const folheto = fs.readFileSync(R + 'gera-folheto.js', 'utf8');
function extrair(nome) {
  const ini = folheto.indexOf('const ' + nome + ' = [');
  const fim = folheto.indexOf('\n];', ini);
  if (ini < 0 || fim < 0) throw new Error('nao achei ' + nome + ' em gera-folheto.js');
  return eval(folheto.slice(ini + ('const ' + nome + ' = ').length, fim + 2));
}
const APTOS = extrair('APTOS');
const LOTES = extrair('LOTES');
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
const v = n => String(n).replace('.', ',');

[...APTOS, ...LOTES].forEach(e => {
  if (e.p && !e.tab && !e.prox) throw new Error('GERA-FOLDER-2DOBRAS: ' + e.n + ' tem preço sem o mês da tabela (campo tab) nem pré-lançamento (prox)');
});
[...APTOS, ...LOTES].forEach((e, k) => { e._k = k; });

// ─── gabarito ───
const G = { larg: 214, alt: 152, sangria: 2, segBorda: 6, segVinco: 5 };
// página do PDF: pedindo 214 × 152 mm, o Edge grava 606,96 × 431,04 pt (214,12 × 152,06 mm; a página do modelo
// Word da gráfica é 607 × 431 pt), com a arte de 214 × 152 mm no canto de cima à esquerda e um fio de sobra embaixo
// e à direita. Pedindo esse tamanho exato e depois recortando: caixasPdf() regrava a MediaBox nos 214 × 152 mm da
// arte, com BleedBox igual e TrimBox 2 mm para dentro, e o fio fica fora da página. O fundo preto de html.frente
// só cobre algum arredondamento na sangria da capa.
const PAGINA_PT = [606.96, 431.04];
// o Chrome grava o fundo das caixas encaixado no pixel CSS (1/96 pol = 0,26 mm), arredondando cada borda (no PDF:
// "0 0 265 574 re"): as trocas de cor nas dobras ficam até 0,13 mm fora do gabarito (a 70 mm vira 70,11), muito
// abaixo da tolerância da dobradeira, e os 152 mm de altura (574,49 px) virariam 574 px (151,87 mm), deixando
// 0,13 mm do fundo da página na sangria de baixo (preto embaixo da aba branca). Com 0,01 mm a mais (574,53 px), os
// painéis viram 575 px e cobrem a sangria até a borda; a página (431,04 pt = 574,72 px) continua com 1 só.
// conferePixels() confere a borda de baixo no PDF renderizado.
const ALT_PINTURA = G.alt + 0.01;   // mm
// escuros: painéis de fundo escuro (classe .escuro). Na dobra entre um claro e um escuro, o escuro avança
// TRANSBORDA mm sobre o claro, do lado do vinco (painel() põe a faixa; medir() e conferePixels() conferem).
const FACES = {
  frente: { dobras: [70, 141], nomes: ['aba', 'contracapa', 'capa'], acabado: [68, 71, 71], escuros: ['contracapa', 'capa'] },
  verso: { dobras: [73, 144], nomes: ['esquerda', 'meio', 'direita'], acabado: [71, 71, 68], escuros: [] },
};
const TRANSBORDA = 1;         // mm
function geometria(face) {
  const xs = [0, ...FACES[face].dobras, G.larg];
  return FACES[face].nomes.map((nome, i) => ({
    nome, x0: xs[i], x1: xs[i + 1], larg: xs[i + 1] - xs[i],
    segL: i === 0 ? G.segBorda : G.segVinco, segR: i === 2 ? G.segBorda : G.segVinco,
    acabado: xs[i + 1] - xs[i] - (i === 0 || i === 2 ? G.sangria : 0),
  }));
}
for (const f of Object.keys(FACES)) {
  const a = geometria(f).map(g => g.acabado);
  if (a.join() !== FACES[f].acabado.join() || a.reduce((t, x) => t + x, 0) !== G.larg - 2 * G.sangria)
    throw new Error('GERA-FOLDER-2DOBRAS: painéis da ' + f + ' com ' + a.join(' | ') + ' mm (gabarito: ' + FACES[f].acabado.join(' | ') + ')');
}
// o verso é o espelho da frente: cada dobra do verso fica atrás de uma dobra da frente
if (FACES.verso.dobras.join() !== FACES.frente.dobras.map(d => G.larg - d).reverse().join())
  throw new Error('GERA-FOLDER-2DOBRAS: as dobras do verso não são o espelho das da frente');

// ─── ajustes do desenho (em mm e pt) ───
const CORPO_ROTULO = 6;       // "a partir de" e "tabela mmm/aaaa" (6 pt é o piso do miolo)
const MINI_L = 11.2;          // mm de largura da miniatura; a altura é a do card
const QR_LADO = 27.5;         // mm dos dois QR na contracapa, zona de silêncio inclusa (site: 53 módulos; mapa: 49)
const FOLGA_ALVO = 3;         // mm que sobram no fim de cada lista depois do respiro (a checagem exige 2)
const RESPIRO_MAX = 2;        // mm acrescentados acima e abaixo de cada card, no máximo
// painéis que se veem lado a lado com o folder aberto (o verso inteiro): o respiro passa no máximo RESPIRO_DIF do mais
// apertado. Ao abrir a capa, a esquerda do verso aparece ao lado da aba, mas a aba é de lotes e fica fora do grupo:
// apertada (11 condomínios + o rodapé), ela prendia o verso todo e sobrava branco na esquerda e no meio (2ª prova).
const VISTOS_JUNTOS = [['esquerda', 'meio', 'direita']];
const RESPIRO_DIF = 1;        // mm
const FUNDO = '#161616';      // --fundo: capa e contracapa (na gráfica, preto calçado C40 K100)
const URL_SITE = 'https://lancamentos.imoveisvivamerica.com.br/?utm_source=folder';
const URL_MAPA = 'https://lancamentos.imoveisvivamerica.com.br/mapa-lotes-indaiatuba/?utm_source=folder';
// foto da capa: faixa de borda reta, sem degradê nem transparência, alinhada ao texto à esquerda e sangrando na
// borda direita. Painel de 71 mm: quadro de 68 mm (62 úteis + 6 até a borda do arquivo). Com a foto a 112 mm de
// largura (≈ 14,3 px/mm, 363 dpi), o quadro vai de x = 8 mm (≈ 114 px) a ≈ 1085 px — antes da TV (x ≈ 1290 de
// 1600 px), com a cozinha, a porta e a planta — e de y = 26,6 mm (≈ 380 px, abaixo do pendente) para baixo.
const CAPA = { slug: 'aurora-indaiatuba', arquivo: 'aurora-indaiatuba/images/hero-casa-de-campo-piscina.jpg', largura: 112, x: 8, y: 26.6, altura: 48 };
const capaDe = APTOS.find(e => e.slug === CAPA.slug) || LOTES.find(e => e.slug === CAPA.slug);
if (!capaDe) throw new Error('GERA-FOLDER-2DOBRAS: a foto da capa é de ' + CAPA.slug + ', que não está mais na fonte única — troque a foto (CAPA)');
if (!fs.existsSync(R + CAPA.arquivo)) throw new Error('GERA-FOLDER-2DOBRAS: foto da capa não existe: ' + CAPA.arquivo);

// ─── selos (com data; a mesma regra do site e do gera-folder.js) ───
// escassez desligada no impresso (ESC_MAX = 0): o folder circula por meses e a contagem envelhece.
const ESC_MAX = 0;
const DATA = /\b\d{2}\/\d{4}\b|\b(jan|fev|mar|abr|mai|jun|jul|ago|set|out|nov|dez)\/\d{4}\b/i;
function selos(e, lote) {
  const out = [];
  if (e.est === 0) throw new Error('GERA-FOLDER-2DOBRAS: ' + e.n + ' está com est 0 na fonte única (esgotado) — sai do folder pela fonte única');
  if (typeof e.est === 'number' && e.est <= ESC_MAX && e.estEm)
    out.push(lote ? (e.est === 1 ? 'último lote' : 'últimos ' + e.est + ' lotes') + ' (' + e.estEm + ')'
                  : (e.est === 1 ? 'última unidade' : 'últimas ' + e.est + ' unidades') + ' (' + e.estEm + ')');
  if (e.tarja) {
    if (!DATA.test(e.tarja)) throw new Error('GERA-FOLDER-2DOBRAS: a tarja de ' + e.n + ' não tem mês nem dia: ' + e.tarja);
    const m = /^(.*?)\s+—\s+.*?\s*(\([^()]*\))\s*$/.exec(e.tarja);
    out.push(m && DATA.test(m[2]) ? m[1] + ' ' + m[2] : e.tarja);
  }
  return out;
}

// ─── miniaturas (as mesmas exceções do gera-folder.js) ───
const MINI_FOTO = {
  'itamaraca-indaiatuba': { arq: 'itamaraca-indaiatuba/images/fachada.jpg', recorte: [12.32, 0, 10.27, 15.04] },
  'izzi-residence-indaiatuba': { arq: 'izzi-residence-indaiatuba/images/fachada.jpg', recorte: [7.4, 0, 26.5, 0] },
  'artemis-residencial-indaiatuba': { arq: 'artemis-residencial-indaiatuba/images/fachada.jpg', recorte: [12.2, 0, 9.4, 0] },
  'aurora-indaiatuba': { arq: 'aurora-indaiatuba/images/fotomontagem-card.jpg', recorte: [15.26, 24.55, 7.63, 24.55] },
  'storia-congesa-indaiatuba': { arq: 'storia-congesa-indaiatuba/images/fachada.jpg' },
  'espaco-conceicao-indaiatuba': { arq: 'espaco-conceicao-indaiatuba/images/fachada.jpg', recorte: [17.13, 0, 10.19, 0] },
  'manai-bosque-indaiatuba': { arq: 'manai-bosque-indaiatuba/images/vista-aerea-real.jpg', recorte: [0, 26.4, 20.9, 23.75] },
  'di-italia-indaiatuba': { arq: 'di-italia-indaiatuba/images/mapa.jpg', recorte: [17, 5, 12, 5] },
  'reserva-botanica-indaiatuba': { arq: 'reserva-botanica-indaiatuba/images/portaria-card.jpg', recorte: [0, 34, 0, 0] },
  'alphaville-indaiatuba': { arq: 'alphaville-indaiatuba/images/terreno.jpg', recorte: [30, 35, 5, 10] },
  'vila-fahl-indaiatuba': { arq: 'vila-fahl-indaiatuba/images/hero.jpg', recorte: [0, 0, 13, 0] },   // tarja "PORTARIA" do book nos 12,5% de baixo
};
const ehJpeg = arq => { const b = fs.readFileSync(R + arq); return b.length > 3 && b[0] === 0xFF && b[1] === 0xD8 && b[2] === 0xFF; };
const MINI = new Map(), avisosMini = [];
Object.keys(MINI_FOTO).forEach(s => {
  if (![...APTOS, ...LOTES].some(e => e.slug === s)) avisosMini.push('MINI_FOTO tem ' + s + ', que não está mais na fonte única — pode tirar');
});
[...APTOS, ...LOTES].forEach(e => {
  const x = MINI_FOTO[e.slug] || { arq: e.img };
  if (!x.arq) throw new Error('GERA-FOLDER-2DOBRAS: ' + e.n + ' está sem foto (campo img) na fonte única');
  if (!fs.existsSync(R + x.arq)) throw new Error('GERA-FOLDER-2DOBRAS: a foto da miniatura de ' + e.n + ' não existe: ' + x.arq);
  if (!ehJpeg(x.arq)) throw new Error('GERA-FOLDER-2DOBRAS: a miniatura de ' + e.n + ' não é JPEG (' + x.arq + ') — use a versão .jpg');
  if (x.recorte && (x.recorte.length !== 4 || x.recorte.some(n => typeof n !== 'number' || n < 0) || x.recorte[0] + x.recorte[2] >= 90 || x.recorte[1] + x.recorte[3] >= 90))
    throw new Error('GERA-FOLDER-2DOBRAS: recorte da miniatura de ' + e.n + ' inválido: ' + JSON.stringify(x.recorte));
  const estilo = [x.pos ? 'object-position:' + x.pos : '', x.recorte ? 'object-view-box:inset(' + x.recorte.map(n => n + '%').join(' ') + ')' : ''].filter(Boolean).join(';');
  MINI.set(e, { arq: x.arq, estilo, kb: fs.statSync(R + x.arq).size / 1024 });
});

// ─── card ───
// esquerda (.mini): a miniatura, na altura do card. Direita (.tx): nome; construtora · m² (nos lotes, "lote de") ·
// "pronto"; o selo (.sel), numa linha própria; embaixo (.pz): o mês da tabela à esquerda (.tb; ou
// "pré-lançamento", que o rodapé explica pela própria palavra; † preços confirmados) e, à direita, "a partir de" (.ap)
// colado ao preço (.pr), na mesma linha
// de base.
function linhaCons(e, lote) {
  const out = [esc(e.c)];
  if (e.m2) out.push((lote ? 'lote&nbsp;de&nbsp;' : '') + m2(e.m2).replace(' ', '&nbsp;'));
  if (/Pronto/i.test(e.t || '')) out.push('pronto');
  return out.join(' · ');
}
function ficha(e, lote) {
  const sel = selos(e, lote).map(esc).join(' · ');
  const tab = e.tab ? 'tabela ' + mesDe(e.tab) + (e.conf ? '<sup>†</sup>' : '')
            : e.prox ? 'pré-lançamento' : '';
  const pz = e.p
    ? `<p class="rot"><span class="tb">${tab}</span><span class="ap">a partir de</span></p><p class="pr">${brl(e.p)}</p>`
    : `<p class="rot"><span class="tb">tabela</span></p><p class="pr pr-c">sob consulta</p>`;
  return `
        <div class="it" data-k="${e._k}">
          <div class="mini"><img src="${MINI.get(e).arq}" alt=""${MINI.get(e).estilo ? ` style="${MINI.get(e).estilo}"` : ''}></div>
          <div class="tx"><p class="nome">${esc(e.n)}</p><p class="cons">${linhaCons(e, lote)}</p>${sel ? `<p class="sel"><span>${sel}</span></p>` : ''}<div class="pz">${pz}</div></div>
        </div>`;
}

// ─── grupos e distribuição pelos painéis ───
const FAIXAS = [
  { ate: 400000, titulo: 'Até R$ 400 mil' },
  { ate: 800000, titulo: 'De R$ 400 mil a R$ 800 mil' },
  { ate: Infinity, titulo: 'Acima de R$ 800 mil' },
];
const emOrdem = lista => [...lista.filter(e => e.p).sort(porPreco), ...lista.filter(e => !e.p)];
const faixaDe = p => FAIXAS.findIndex(f => p <= f.ate);
const grFaixa = i => ({ titulo: FAIXAS[i].titulo, itens: APTOS.filter(e => e.p && faixaDe(e.p) === i).sort(porPreco), faixa: i });
const semPrecoApto = APTOS.filter(e => !e.p);

const TIPO_LOTE = { 'Loteamento': 'Loteamentos abertos', 'Cond. fechado': 'Condomínios fechados' };
LOTES.forEach(e => {
  if (!TIPO_LOTE[e.t]) throw new Error('GERA-FOLDER-2DOBRAS: tipo de lote sem grupo no folder: ' + e.t + ' (' + e.n + ')');
  if (e.t === 'Loteamento' && /fechad|condom[ií]nio/i.test(e.s || ''))
    throw new Error('GERA-FOLDER-2DOBRAS: ' + e.n + ' está como Loteamento (aberto) na fonte única, mas a descrição diz "' + e.s + '" — acerte o tipo (t)');
  if (e.t === 'Cond. fechado' && /\baberto\b/i.test(e.s || ''))
    throw new Error('GERA-FOLDER-2DOBRAS: ' + e.n + ' está como Cond. fechado na fonte única, mas a descrição diz "' + e.s + '" — acerte o tipo (t)');
});
const grTipo = t => ({ titulo: TIPO_LOTE[t], itens: emOrdem(LOTES.filter(e => e.t === t)) });

const blocoApto = grupos => ({ titulo: 'Apartamentos', n: APTOS.length, lote: false, grupos: grupos.filter(g => g.itens.length) });
const blocoLote = grupos => ({ titulo: 'Lotes e condomínios', n: LOTES.length, lote: true, grupos: grupos.filter(g => g.itens.length) });
// MIOLO: painel → blocos (título do painel + grupos). rodape: o rodapé do folder, só no último painel de empreendimentos
const MIOLO = {
  esquerda: { face: 'verso', blocos: [blocoApto([grFaixa(0)])] },
  meio: { face: 'verso', blocos: [blocoApto([grFaixa(1)])] },
  direita: { face: 'verso', blocos: [blocoApto([grFaixa(2), { titulo: 'Tabela sob consulta', itens: semPrecoApto }]), blocoLote([grTipo('Loteamento')])] },
  aba: { face: 'frente', blocos: [blocoLote([grTipo('Cond. fechado')])], rodape: true },
};
Object.values(MIOLO).forEach(p => { p.blocos = p.blocos.filter(b => b.grupos.length); p.itens = p.blocos.flatMap(b => b.grupos.flatMap(g => g.itens)); });
// cada empreendimento exatamente uma vez; cada apartamento na sua faixa
{
  const vistos = Object.values(MIOLO).flatMap(p => p.itens.map(e => e._k));
  const todos = [...APTOS, ...LOTES].map(e => e._k);
  if (vistos.length !== todos.length || new Set(vistos).size !== todos.length || todos.some(k => !vistos.includes(k)))
    throw new Error('GERA-FOLDER-2DOBRAS: empreendimento repetido ou fora dos painéis (' + vistos.length + ' cards; a fonte única tem ' + todos.length + ')');
  Object.values(MIOLO).forEach(p => p.blocos.forEach(b => b.grupos.forEach(g => {
    if (g.faixa !== undefined && g.itens.some(e => faixaDe(e.p) !== g.faixa)) throw new Error('GERA-FOLDER-2DOBRAS: apartamento fora da faixa ' + g.titulo);
  })));
}

// ─── rodapé do folder (uma vez só), no formato do Fabio (29/10/2026): uma frase por linha. "Pré-lançamento" e a nota †
// só saem se algum card mostra a palavra ou a marca (as mesmas condições da ficha()); a nota † pendurada na marca.
const juntaE = l => l.length < 2 ? l.join('') : l.slice(0, -1).join(', ') + ' e ' + l[l.length - 1];
function rodape() {
  const todos = [...APTOS, ...LOTES], out = ['<p><b>A partir de</b>: menor preço da tabela, no mês indicado.</p>'];
  if (todos.some(e => e.p && !e.tab && e.prox)) out.push('<p><b>Pré-lançamento</b>: valor sujeito a reajuste no lançamento oficial (sem data divulgada).</p>');
  const conf = todos.filter(e => e.p && e.tab && e.conf);
  if (conf.length) out.push(`<p class="nt"><span class="mk"><sup>†</sup></span>Preços da tabela indicada, confirmados pela construtora para ${juntaE([...new Set(conf.map(e => e.conf))].sort().map(mesDe))}.</p>`);
  return out.join('');
}

// ─── números da capa (calculados; nada fixo) ───
const total = APTOS.length + LOTES.length;
const construtoras = new Set([...APTOS, ...LOTES].map(e => e.c.split(' · ')[0].trim())).size;   // mesma conta do gera-folheto.js
const menorDatado = [...APTOS, ...LOTES].filter(e => e.p && e.tab).sort(porPreco)[0];
const menorGeral = [...APTOS, ...LOTES].filter(e => e.p).sort(porPreco)[0];
if (menorGeral.p < menorDatado.p) throw new Error('GERA-FOLDER-2DOBRAS: o menor preço (' + menorGeral.n + ') é de pré-lançamento, sem mês de tabela — revise os números da capa');

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
const GF = geometria('frente');
const css = () => `
  :root{
    --fundo:${FUNDO};          /* capa e contracapa (gráfica: preto calçado) */
    --ouro:#C9A227; --ouro-claro:#F7D77E; --branco:#fff;
    --tinta:#000;             /* texto e fios do miolo: preto puro, para sair só no K */
    --fio:#D8CDA8;
    --fonte-titulo:'Segoe UI',Arial,sans-serif; --peso-titulo:600;
    --fonte-texto:'Segoe UI',Arial,sans-serif;
    --corpo-rotulo:${CORPO_ROTULO}pt;
    --mini-l:${MINI_L}mm;
    --respiro:0mm;            /* por painel (style do .painel), da folga medida */
  }
  *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
  @page{size:${PAGINA_PT[0]}pt ${PAGINA_PT[1]}pt;margin:0}
  html,body{width:${G.larg}mm;height:${G.alt}mm;background:#fff}
  /* a página do Edge tem 214,12 × 152,06 mm (PAGINA_PT); caixasPdf() recorta a sobra. O preto só cobre arredondamento na sangria da capa */
  html.frente{background:var(--fundo)}
  body{font-family:var(--fonte-texto);color:var(--tinta);-webkit-print-color-adjust:exact;print-color-adjust:exact;font-kerning:normal}
  .folha{width:${G.larg}mm;height:${ALT_PINTURA}mm;display:flex;position:relative;overflow:hidden}
  .painel{height:${ALT_PINTURA}mm;flex-shrink:0;position:relative;overflow:hidden;background:#fff}
  /* segurança: 2 mm de sangria + 4 mm = 6 mm da borda do arquivo; 5 mm do vinco (left/right no style de cada .seg) */
  .seg{position:absolute;top:${G.segBorda}mm;bottom:${G.segBorda}mm;display:flex;flex-direction:column}
  sup{font-size:6pt;line-height:0;vertical-align:.3em;margin-left:.1mm}
  .escuro{background:var(--fundo);color:var(--branco)}
  /* dobra entre fundo claro e escuro: o escuro avança ${TRANSBORDA} mm sobre o painel claro, encostado no vinco (opaco) */
  .transborda{position:absolute;top:0;bottom:0;width:${TRANSBORDA}mm;background:var(--fundo)}
  .transborda.d{right:0}
  .transborda.e{left:0}

  /* ── marca ── */
  .logo{line-height:1;padding-top:.6mm}
  .logo-n{display:block;font-family:var(--fonte-titulo);font-weight:var(--peso-titulo);font-size:13pt;line-height:1.2;letter-spacing:.24em}
  .logo-s{display:block;font-size:7pt;font-weight:600;letter-spacing:.42em;text-transform:uppercase;color:var(--ouro);margin-top:.8mm}

  /* ── CAPA ── */
  .capa-foto{flex-shrink:0;height:${CAPA.altura}mm;margin:4.6mm -${GF[2].segR}mm 0 0;background:url('${CAPA.arquivo}') -${CAPA.x}mm -${CAPA.y}mm/${CAPA.largura}mm auto no-repeat}
  .ilustr{font-size:7pt;font-weight:600;text-align:right;margin-top:1.4mm}
  .capa-baixo{margin-top:auto}
  .kick-c{font-size:7pt;font-weight:700;letter-spacing:.2em;text-transform:uppercase;color:var(--ouro-claro)}
  .capa h1{font-family:var(--fonte-titulo);font-weight:var(--peso-titulo);font-size:26pt;line-height:1.02;letter-spacing:-.3pt;margin-top:2.2mm}
  .capa h1 em{display:block;font-style:normal;color:var(--ouro)}
  .capa-sub{font-size:7.6pt;font-weight:600;line-height:1.45;margin-top:3.2mm}
  .nums{display:grid;grid-template-columns:auto 1fr;column-gap:7mm;row-gap:2.8mm;margin-top:4mm;padding-top:${(3.2 + FIOS.capa).toFixed(2)}mm;border-top:.8pt solid var(--ouro)}
  .nums strong{display:block;font-family:var(--fonte-titulo);font-weight:var(--peso-titulo);font-size:14pt;line-height:1.1;color:var(--ouro-claro);white-space:nowrap}
  .nums span{display:block;font-size:7pt;font-weight:600;line-height:1.3;margin-top:1mm}
  /* 2ª linha: "lotes a partir de" na coluna da esquerda e o preço na da direita, centrados um no outro */
  .nums .n3{align-self:center}
  .nums .n3 span{margin-top:0}

  /* ── CONTRACAPA ── */
  .cc{align-items:center;text-align:center}
  .cc p,.cc-q span{text-wrap:balance}
  .fio{width:16mm;height:.8pt;background:var(--ouro);margin:3.6mm auto 0;flex-shrink:0}
  .cc-meio{margin:auto 0;display:flex;flex-direction:column;align-items:center;width:100%}
  .cc-pq h2{font-family:var(--fonte-titulo);font-weight:var(--peso-titulo);font-size:11pt;line-height:1.2}
  .cc-pq h2 em{display:block;font-style:normal;color:var(--ouro-claro)}
  .cc-pq p{font-size:7.5pt;font-weight:600;line-height:1.45;margin-top:1.4mm}
  .cc-qrleg{font-size:7pt;font-weight:700;letter-spacing:.2em;text-transform:uppercase;color:var(--ouro-claro);margin-top:3.6mm}
  .cc-qrs{display:flex;justify-content:center;gap:4mm;margin-top:2.2mm}
  .cc-q{width:${QR_LADO}mm;display:flex;flex-direction:column;align-items:center}
  .cc-qr{width:${QR_LADO}mm;height:${QR_LADO}mm;border-radius:.8mm;overflow:hidden;background:#fff;flex-shrink:0}
  .cc-qr svg{display:block;width:100%;height:100%}
  .cc-q b{display:block;font-size:7pt;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--ouro-claro);margin-top:1.8mm;white-space:nowrap}
  .cc-q span{display:block;font-size:7pt;font-weight:600;line-height:1.3;margin-top:.5mm}
  .cc-site{font-size:7.4pt;font-weight:600;margin-top:2.4mm}
  .cc-legal{width:100%;border-top:.8pt solid var(--ouro);padding-top:${(2.4 + FIOS.cc).toFixed(2)}mm}
  .cc-legal p{font-size:7pt;font-weight:600;line-height:1.45}
  .cc-legal p.leg{margin-top:1mm}

  /* ── MIOLO: 1 coluna de cards com miniatura por painel ── */
  .bloco{flex-shrink:0}
  .bloco+.bloco{margin-top:4.2mm}
  .tit{padding-top:1.1mm;padding-bottom:1.5mm;border-bottom:1pt solid var(--tinta)}
  .tit h2{font-family:var(--fonte-titulo);font-weight:var(--peso-titulo);font-size:16pt;line-height:1;letter-spacing:-.1pt;display:flex;align-items:center;gap:2mm}
  .tit h2 i{display:block;width:1.3mm;height:5.2mm;background:var(--ouro)}
  .tit .ed{font-size:6.3pt;font-weight:600;line-height:1.2;margin-top:1.4mm}
  .tit .ed b{font-weight:700;letter-spacing:.12em;text-transform:uppercase}
  .lista{margin-top:1.4mm}
  .gr{display:flex;justify-content:space-between;align-items:baseline;gap:1mm;background:var(--ouro-claro);
      padding:.75mm 1.3mm .6mm;font-size:6.4pt;font-weight:700;letter-spacing:.07em;text-transform:uppercase;line-height:1.15}
  .lista>.it+.gr{margin-top:1.9mm}
  .gr-n{letter-spacing:0}
  .it{display:grid;grid-template-columns:var(--mini-l) minmax(0,1fr);column-gap:1.4mm;padding:calc(.36mm + var(--respiro)) 0 calc(.26mm + var(--respiro));border-bottom:.45pt solid var(--fio)}
  .mini{position:relative;min-height:8mm}
  .mini img{position:absolute;left:0;top:0;width:100%;height:100%;object-fit:cover;display:block}
  .tx{display:flex;flex-direction:column;min-width:0}
  .nome{font-size:6.9pt;font-weight:700;line-height:1.05}
  .cons{font-size:6.2pt;line-height:1.06;margin-top:.05mm}
  .sel{font-size:6.2pt;line-height:1.1;margin-top:.25mm}
  .sel span{background:var(--ouro-claro);font-weight:700;padding:0 .7mm}
  .pz{display:flex;align-items:last baseline;gap:1mm;margin-top:auto;padding-top:.3mm}
  .rot{flex:1;min-width:0;display:flex;justify-content:space-between;align-items:baseline;gap:1mm;font-size:var(--corpo-rotulo);line-height:1.05;white-space:nowrap}
  .pr{font-size:8.2pt;font-weight:700;line-height:1;white-space:nowrap;font-variant-numeric:tabular-nums;letter-spacing:-.05pt}
  .pr-c{font-size:7.2pt}
  .pe{margin-top:auto;padding-top:1.4mm;flex-shrink:0;border-top:.45pt solid var(--tinta)}
  .pe p{font-size:6.2pt;line-height:1.25;text-wrap:pretty}
  .pe p+p{margin-top:.25mm}
  .pe .nt{padding-left:1.4mm;text-indent:-1.4mm}   /* nota pendurada na marca: a 2ª linha alinha com o texto */
  .pe .mk{display:inline-block;width:1.4mm;text-indent:0}
  .pe .mk sup{margin-left:0}
`;

const logo = `<div class="logo"><span class="logo-n">VIV'AMÉRICA</span><span class="logo-s">Imobiliária</span></div>`;
const pagina = (titulo, paineis, base, face) => `<!DOCTYPE html>
<html lang="pt-BR" class="${face}"><head><meta charset="UTF-8"><meta name="robots" content="noindex">${base ? `<base href="${base}">` : ''}<title>${titulo}</title><style>${css()}</style></head>
<body><div class="folha">${paineis}</div></body></html>
`;
// painel na posição i da face: largura do gabarito e área de segurança (6 mm da borda do arquivo, 5 mm do vinco);
// painel claro ao lado de um escuro leva a faixa escura de TRANSBORDA mm encostada nesse vinco
function painel(face, i, classe, nome, conteudo, extra = '') {
  const geo = geometria(face), g = geo[i], escuros = FACES[face].escuros;
  if (nome !== g.nome || classe.split(' ').includes('escuro') !== escuros.includes(nome))
    throw new Error('GERA-FOLDER-2DOBRAS: painel ' + nome + ' (' + face + ', posição ' + i + ') não confere com FACES (nome ou fundo escuro)');
  const faixas = escuros.includes(nome) ? '' : [[i - 1, 'e'], [i + 1, 'd']]
    .filter(([j]) => geo[j] && escuros.includes(geo[j].nome)).map(([, lado]) => `<div class="transborda ${lado}"></div>`).join('');
  return `
<div class="painel ${classe}" data-nome="${nome}"${extra} style="width:${g.larg}mm${extra.includes('data-miolo') ? ';--respiro:' + (RESPIRO[nome] || 0) + 'mm' : ''}">
  <div class="seg${classe.includes('cc') ? ' cc' : ''}" style="left:${g.segL}mm;right:${g.segR}mm">${conteudo}
  </div>${faixas}
</div>`;
}
let RESPIRO = {};
// mm a mais no padding de cima do bloco de baixo da contracapa (.cc-legal) ou da capa (.nums): o mais baixo dos dois
// sobe até o fio dourado dele ficar na altura do outro (medido na 1ª rodada; a checagem exige até CFG.difFio)
let FIOS = { cc: 0, capa: 0 };

// contracapa (meio da frente)
const contracapa = QS => painel('frente', 1, 'escuro cc', 'contracapa', `
    ${logo}
    <div class="fio"></div>
    <div class="cc-meio" data-elastico="ambos">
      <div class="cc-pq"><h2>Por que comprar <em>no lançamento?</em></h2><p>${PQ}</p></div>
      <p class="cc-qrleg">Aponte a câmera</p>
      <div class="cc-qrs">
        <div class="cc-q"><div class="cc-qr" data-qr="site">${QS.site.svg}</div><b>Site</b><span>a ficha de cada empreendimento</span></div>
        <div class="cc-q"><div class="cc-qr" data-qr="mapa">${QS.mapa.svg}</div><b>Mapa dos lotes</b><span>quadra a quadra, com metragem e preço</span></div>
      </div>
      <p class="cc-site">lancamentos.imoveisvivamerica.com.br</p>
    </div>
    <div class="cc-legal">
      <p>Imobiliária Viv'América · CRECI 47394-J</p>
      <p>Av. Higienópolis, 70 – Jardim União · Indaiatuba/SP</p>
      <p class="leg">Edição ${edicao} · Imagens ilustrativas.</p>
      <p>Preços e condições sujeitos a alteração sem aviso prévio.</p>
    </div>`);

// capa (direita da frente)
const capa = () => painel('frente', 2, 'escuro capa', 'capa', `
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
        <div class="n3"><span>${LOTES.includes(menorDatado) ? 'lotes a partir de' : 'a partir de'}<br>tabela ${mesDe(menorDatado.tab)}</span></div>
        <div class="n3"><strong>${mil(menorDatado.p)}</strong></div>
      </div>
    </div>`);

// painel do miolo: blocos (título + grupos com a contagem) e, no último, o rodapé do folder
function miolo(nome) {
  const P = MIOLO[nome], face = P.face, i = FACES[face].nomes.indexOf(nome);
  const blocos = P.blocos.map(b => `
    <section class="bloco">
      <header class="tit"><h2><i></i>${b.titulo}</h2><p class="ed"><b>Edição ${edicao}</b> · ${b.n} empreendimentos</p></header>
      <div class="lista">${b.grupos.map(g => `
        <div class="gr"><span>${esc(g.titulo)}</span><span class="gr-n">${g.itens.length}</span></div>${g.itens.map(e => ficha(e, b.lote)).join('')}`).join('')}
      </div>
    </section>`).join('');
  return painel(face, i, '', nome, blocos + (P.rodape ? `
    <footer class="pe">${rodape()}</footer>` : ''), ' data-miolo');
}

const frente = (QS, base) => pagina("Folder 2 dobras Viv'América · frente", miolo('aba') + contracapa(QS) + capa(), base, 'frente');
const verso = base => pagina("Folder 2 dobras Viv'América · verso", miolo('esquerda') + miolo('meio') + miolo('direita'), base, 'verso');

// ─── medição (roda DENTRO do navegador; recebe a configuração da face) ───
async function medir(C) {
  const MM = 96 / 25.4, PT = 96 / 72, TOL = C.tol * MM;
  const mm = v => +(v / MM).toFixed(2);
  const P = [], M = { folgas: {}, menorPt: {}, alturas: {}, qr: {}, fotos: [], minis: [], itens: [], precos: [], cards: {} };
  await document.fonts.ready;
  const folha = document.querySelector('.folha').getBoundingClientRect();
  if (Math.abs(mm(folha.width) - C.larg) > 0.1 || Math.abs(mm(folha.height) - C.alt) > 0.1)
    P.push('folha com ' + mm(folha.width) + ' x ' + mm(folha.height) + ' mm (gabarito: ' + C.larg + ' x ' + C.alt + ')');

  // gabarito: cada painel entre as dobras e a área de segurança no lugar
  const paineis = [...document.querySelectorAll('.painel')];
  if (paineis.length !== C.geo.length) P.push(paineis.length + ' painéis (gabarito: ' + C.geo.length + ')');
  paineis.forEach((p, i) => {
    const g = C.geo[i]; if (!g) return;
    const r = p.getBoundingClientRect(), s = p.querySelector('.seg').getBoundingClientRect();
    const x0 = mm(r.left - folha.left), x1 = mm(r.right - folha.left);
    if (Math.abs(x0 - g.x0) > 0.05 || Math.abs(x1 - g.x1) > 0.05) P.push(`painel ${p.dataset.nome}: de ${x0} a ${x1} mm (gabarito: ${g.x0} a ${g.x1})`);
    const sl = mm(s.left - folha.left), sr = mm(s.right - folha.left), st = mm(s.top - folha.top), sb = mm(s.bottom - folha.top);
    if (Math.abs(sl - (g.x0 + g.segL)) > 0.05 || Math.abs(sr - (g.x1 - g.segR)) > 0.05 || Math.abs(st - C.segBorda) > 0.05 || Math.abs(sb - (C.alt - C.segBorda)) > 0.05)
      P.push(`painel ${p.dataset.nome}: área de segurança ${sl}–${sr} × ${st}–${sb} mm (gabarito: ${g.x0 + g.segL}–${g.x1 - g.segR} × ${C.segBorda}–${C.alt - C.segBorda})`);
  });

  // dobra entre fundo claro e escuro (pela cor que o navegador pintou, não pela configuração): o escuro avança
  // C.transborda mm sobre o claro, encostado no vinco, na altura toda, na mesma cor, por cima de tudo
  const lum = c => { const m = (c.match(/[\d.]+/g) || [0, 0, 0]).map(Number); return 0.2126 * m[0] + 0.7152 * m[1] + 0.0722 * m[2]; };
  M.transborda = [];
  for (let i = 0; i + 1 < paineis.length; i++) {
    const a = paineis[i], b = paineis[i + 1], ca = getComputedStyle(a).backgroundColor, cb = getComputedStyle(b).backgroundColor;
    if (ca === cb) continue;
    const [claro, escuro, cor, lado] = lum(ca) > lum(cb) ? [a, b, cb, 'd'] : [b, a, ca, 'e'];
    const dobra = mm(a.getBoundingClientRect().right - folha.left), oq = `dobra a ${dobra} mm (${a.dataset.nome} | ${b.dataset.nome})`;
    const t = claro.querySelector(':scope > .transborda.' + lado);
    if (!t) { P.push(`${oq}: o fundo escuro de ${escuro.dataset.nome} não avança sobre ${claro.dataset.nome} — filete claro no vinco com a tolerância da dobra`); continue; }
    const r = t.getBoundingClientRect(), S = claro.querySelector('.seg').getBoundingClientRect();
    const x0 = mm(r.left - folha.left), x1 = mm(r.right - folha.left);
    if (Math.abs((lado === 'd' ? x1 : x0) - dobra) > 0.05 || Math.abs(mm(r.width) - C.transborda) > 0.05 || mm(r.top - folha.top) > 0.05 || mm(folha.bottom - r.bottom) > 0.05)
      P.push(`${oq}: faixa escura de ${x0} a ${x1} mm e ${mm(r.height)} mm de altura (esperado ${C.transborda} mm encostados no vinco, na altura toda)`);
    if (getComputedStyle(t).backgroundColor !== cor) P.push(`${oq}: faixa escura em ${getComputedStyle(t).backgroundColor} (o fundo de ${escuro.dataset.nome} é ${cor})`);
    if (lado === 'd' ? r.left < S.right + MM : r.right > S.left - MM) P.push(`${oq}: a faixa escura chega a menos de 1 mm da área de segurança de ${claro.dataset.nome}`);
    const topo = document.elementFromPoint((r.left + r.right) / 2, (r.top + r.bottom) / 2);
    if (topo !== t) P.push(`${oq}: a faixa escura está coberta por ${topo ? '.' + (topo.className || topo.tagName) : 'nada'}`);
    M.transborda.push({ dobra, lado, de: escuro.dataset.nome, sobre: claro.dataset.nome, x0, x1 });
  }
  const nFaixas = document.querySelectorAll('.transborda').length;
  if (nFaixas > M.transborda.length) P.push(`${nFaixas} faixas escuras de dobra, mas só ${M.transborda.length} dobra(s) entre fundo claro e escuro`);

  // fios dourados de baixo da contracapa e da capa (lado a lado com a frente aberta): na mesma altura
  const fioCc = document.querySelector('.cc-legal'), fioCapa = document.querySelector('.nums');
  if (fioCc && fioCapa) {
    M.fios = { cc: mm(fioCc.getBoundingClientRect().top - folha.top), capa: mm(fioCapa.getBoundingClientRect().top - folha.top) };
    if (Math.abs(M.fios.cc - M.fios.capa) > C.difFio) P.push(`fio dourado da contracapa a ${M.fios.cc} mm do topo e o da capa a ${M.fios.capa} mm (diferença máxima ${C.difFio} mm)`);
  }

  // foto da capa: carregou, cobre a caixa, sangra até a borda do arquivo e tem resolução para a gráfica
  for (const el of document.querySelectorAll('.capa-foto')) {
    const cs = getComputedStyle(el), box = el.getBoundingClientRect();
    const url = (cs.backgroundImage.match(/url\("?(.*?)"?\)/) || [])[1];
    const nat = await new Promise(r => { const i = new Image(); i.onload = () => r([i.naturalWidth, i.naturalHeight]); i.onerror = () => r([0, 0]); i.src = url; });
    if (!nat[0]) { P.push('foto da capa não carregou: ' + url); continue; }
    const bw = parseFloat(cs.backgroundSize), bh = bw * nat[1] / nat[0];
    const bx = parseFloat(cs.backgroundPositionX) || 0, by = parseFloat(cs.backgroundPositionY) || 0;
    const dpi = Math.round(nat[0] / (bw / 96));
    if (bx > 0.5 || by > 0.5 || bw + bx < box.width - 0.5 || bh + by < box.height - 0.5) P.push('a foto da capa não cobre a caixa');
    if (Math.abs(box.right - folha.right) > 0.1 * MM) P.push('a foto da capa não sangra até a borda direita do arquivo (' + mm(folha.right - box.right) + ' mm)');
    if (dpi < C.dpiMin) P.push('foto da capa com ' + dpi + ' dpi (mínimo ' + C.dpiMin + ')');
    M.fotos.push({ arquivo: url.split('/').slice(-3).join('/'), dpi, px: nat.join('x'), w: mm(box.width), h: mm(box.height),
      trecho: [Math.round(-bx / bw * nat[0]), Math.round(-by / bh * nat[1]), Math.round((box.width - bx) / bw * nat[0]), Math.round((box.height - by) / bh * nat[1])] });
  }

  // miniaturas dos cards: carregaram, cobrem a caixa (object-fit cover) e têm resolução para a gráfica
  for (const im of document.querySelectorAll('.mini img')) {
    try { await im.decode(); } catch (e) { /* conferido abaixo */ }
    const arq = decodeURIComponent(im.getAttribute('src')), box = im.getBoundingClientRect(), cx = im.parentElement.getBoundingClientRect();
    if (!im.naturalWidth) { P.push('miniatura não carregou: ' + arq); continue; }
    if (getComputedStyle(im).objectFit !== 'cover') P.push('miniatura sem object-fit cover: ' + arq);
    if (Math.abs(box.width - cx.width) > 0.5 || Math.abs(box.height - cx.height) > 0.5 || box.height < 1) P.push('miniatura não cobre a caixa: ' + arq);
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

  const CAIXAS = '.it,.gr,.tit,.pe,.cc-legal,.nums,.cc-q';
  for (const painel of paineis) {
    const nome = painel.dataset.nome, escuro = painel.classList.contains('escuro');
    const seg = painel.querySelector('.seg'), S = seg.getBoundingClientRect();
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
    // cards: texto encostando na miniatura; mês da tabela encostando em "a partir de"; "a partir de" encostando no
    // preço; miniatura fora do card; altura de cada card
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
      const tb = it.querySelector('.rot .tb'), ap = it.querySelector('.rot .ap');
      if (tb && ap && tb.textContent.trim()) { const g2 = esquerda(ap) - direita(tb); if (g2 < 0.8 * MM) P.push(`${nome}: "${tit}": o mês da tabela encosta em "a partir de" (${mm(g2)} mm)`); }
      M.alturas[it.dataset.k] = mm(B.height);
      M.itens.push(+it.dataset.k);
      M.precos.push(pr.textContent.trim());
    }
    // ordem: dentro de cada grupo, do menor para o maior preço (sob consulta no fim)
    for (const l of painel.querySelectorAll('.lista')) {
      let ult = -Infinity;
      for (const el of l.children) {
        if (el.classList.contains('gr')) { ult = -Infinity; continue; }
        if (!el.classList.contains('it')) continue;
        const t = el.querySelector('.pr').textContent.trim(), val = /^R\$/.test(t) ? +t.replace(/\D/g, '') : Infinity;
        if (val < ult) P.push(`${nome}: "${el.querySelector('.nome').textContent}" fora da ordem de preço`);
        ult = val;
      }
    }
    // folga do miolo: do fim do último bloco até o rodapé (ou até o fim da área de segurança)
    if (painel.hasAttribute('data-miolo')) {
      const pe = seg.querySelector(':scope > .pe'), fluxo = [...seg.children].filter(c => c !== pe);
      const lim = pe ? pe.getBoundingClientRect().top : S.bottom;
      const f = mm(lim - fluxo[fluxo.length - 1].getBoundingClientRect().bottom);
      M.folgas[nome] = [f];
      M.cards[nome] = painel.querySelectorAll('.it').length;
      if (f < C.folgaMin) P.push(`${nome}: ${f} mm de folga no fim da lista (mínimo ${C.folgaMin} mm)`);
      if (pe && pe.getBoundingClientRect().bottom > S.bottom + TOL) P.push(`${nome}: o rodapé passa da área de segurança`);
    }
    // painéis escuros: a soma dos espaços elásticos
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
  for (const p of document.querySelectorAll('.pr')) { const r = p.getBoundingClientRect(); if (r.width < 1 || r.height < 1) P.push('preço sem área visível: ' + p.textContent); }

  // QR: módulo mínimo e zona de silêncio (branca, dentro do próprio SVG)
  for (const q of document.querySelectorAll('[data-qr]')) {
    const k = q.dataset.qr, cfg = C.qr[k], r = q.getBoundingClientRect();
    const mod = r.width / cfg.total;
    M.qr[k] = { lado: mm(r.width), modulo: +(mod / MM).toFixed(3), versao: cfg.versao, nivel: cfg.nivel, zona: cfg.zona };
    if (Math.abs(r.width - r.height) > 0.5) P.push('QR ' + k + ' não é quadrado');
    if (mod / MM < C.moduloMin) P.push(`QR ${k}: módulo de ${(mod / MM).toFixed(3)} mm (mínimo ${C.moduloMin} mm)`);
    if (cfg.zona < 4) P.push(`QR ${k}: zona de silêncio de ${cfg.zona} módulos (mínimo 4)`);
    const svg = q.querySelector('svg'), fundo = svg && svg.querySelector('rect');
    if (!fundo || !/^#fff(fff)?$/i.test(fundo.getAttribute('fill') || '')) P.push(`QR ${k}: sem o fundo branco da zona de silêncio`);
    if (svg) { const s = svg.getBoundingClientRect(); if (Math.abs(s.width - r.width) > 0.5 || Math.abs(s.height - r.height) > 0.5) P.push(`QR ${k}: o desenho não ocupa a caixa`); }
  }
  return JSON.stringify({ P, M });
}
const CFG = { tol: 0.2, minMiolo: 6, minEscuro: 7, pesoEscuro: 600, folgaMin: 2, dpiMin: 250, moduloMin: 0.5, difFio: 0.1, larg: G.larg, alt: G.alt, segBorda: G.segBorda, transborda: TRANSBORDA };

// ─── navegador: Edge sem interface, convidado, sem sincronização, perfil próprio (como no gera-folder.js) ───
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
  await call('Emulation.setEmulatedMedia', { media: 'print' });   // mede como vai ser impresso
  return edge;
}
async function abre(arquivo) {
  const carregou = edge.evento('Page.loadEventFired', 30000);
  await edge.call('Page.navigate', { url: pathToFileURL(arquivo).href });
  await carregou;
}
async function mede(nome, html, cfg, fontesEm) {
  const f = path.join(TMP, nome + '.html');
  fs.writeFileSync(f, html, 'utf8');
  await abre(f);
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
  out.arquivo = f;
  return out;
}
// PDF do próprio Edge que mediu (mesmo arquivo, mesma mídia de impressão)
async function imprime(arquivo) {
  await abre(arquivo);
  const r = await edge.call('Page.printToPDF', { printBackground: true, preferCSSPageSize: true, paperWidth: PAGINA_PT[0] / 72, paperHeight: PAGINA_PT[1] / 72,
    marginTop: 0, marginBottom: 0, marginLeft: 0, marginRight: 0, scale: 1, displayHeaderFooter: false });
  return Buffer.from(r.data, 'base64');
}
// caixas do PDF: a MediaBox do Edge (606,96 × 431,04 pt) é recortada nos 214 × 152 mm da arte (no canto de cima à
// esquerda; no PDF, y cresce para cima) e ganha BleedBox (= MediaBox) e TrimBox (o corte, 2 mm para dentro). Troca
// só o texto do dicionário da página e desloca as posições da tabela xref (o PDF do Edge é 1.4, com xref clássica
// de linhas de 20 bytes); conferePdf() relê as caixas e confere cada posição da xref.
const pt = x => x / 25.4 * 72;
function caixasPdf(buf, nome) {
  const s = buf.toString('latin1');
  const sx = /startxref\s+(\d+)\s+%%EOF\s*$/.exec(s), xref = sx ? +sx[1] : -1;
  if (!sx || s.slice(xref, xref + 4) !== 'xref') throw new Error(nome + '.pdf sem tabela xref clássica no fim — as caixas não foram gravadas');
  if (/\/(CropBox|BleedBox|TrimBox|ArtBox)\b/.test(s)) throw new Error(nome + '.pdf do Edge já veio com caixas além da MediaBox — revise caixasPdf()');
  const mbs = [...s.matchAll(/\/MediaBox\s*\[\s*0\s+0\s+([\d.]+)\s+([\d.]+)\s*\]/g)];
  if (mbs.length !== 1 || mbs[0].index > xref) throw new Error(nome + '.pdf com ' + mbs.length + ' MediaBox (esperado 1, na página, antes da xref)');
  const W = +mbs[0][1], H = +mbs[0][2], sg = pt(G.sangria);
  if (W < pt(G.larg) - 0.01 || H < pt(G.alt) - 0.01) throw new Error(nome + '.pdf com página menor que a arte (' + W + ' × ' + H + ' pt)');
  const arte = [0, H - pt(G.alt), pt(G.larg), H], corte = [arte[0] + sg, arte[1] + sg, arte[2] - sg, arte[3] - sg];
  const cx = a => '[' + a.map(n => +n.toFixed(3)).join(' ') + ']';
  const novo = `/MediaBox ${cx(arte)}\n/BleedBox ${cx(arte)}\n/TrimBox ${cx(corte)}`;
  const pos = mbs[0].index, velho = mbs[0][0], delta = novo.length - velho.length;
  // a cauda (xref + trailer) é pequena: refeita como texto; o resto do arquivo vai como está
  let cauda = s.slice(xref), q = 4, nova = 'xref', n = 0;
  for (;;) {
    const m = /^\s*(\d+)\s+(\d+)[ \t]*(?:\r\n|\r|\n)/.exec(cauda.slice(q, q + 64));
    if (!m) break;
    nova += m[0]; q += m[0].length;
    for (let k = 0; k < +m[2]; k++, q += 20, n++) {
      const e = cauda.slice(q, q + 20);
      if (!/^\d{10} \d{5} [nf](?: \r| \n|\r\n)$/.test(e)) throw new Error(nome + '.pdf: linha ' + n + ' da xref fora do padrão: ' + JSON.stringify(e));
      const off = +e.slice(0, 10);
      nova += e[17] === 'n' && off > pos ? String(off + delta).padStart(10, '0') + e.slice(10) : e;
    }
  }
  if (!n || !/^\s*trailer/.test(cauda.slice(q))) throw new Error(nome + '.pdf: xref sem entradas ou sem trailer depois');
  nova += cauda.slice(q).replace(/startxref\s+\d+/, 'startxref\n' + (xref + delta));
  return Buffer.concat([buf.subarray(0, pos), Buffer.from(novo, 'latin1'), buf.subarray(pos + velho.length, xref), Buffer.from(nova, 'latin1')]);
}
// conferência do PDF: 1 página do tamanho do arquivo final, caixas de sangria e corte, xref íntegra, sem
// transparência, fontes embutidas, imagens em JPEG
function conferePdf(buf, nome) {
  const s = buf.toString('latin1'), P = [];
  const pags = (s.match(/\/Type\s*\/Page(?![s\w])/g) || []).length;
  if (pags !== 1) P.push(`${nome}.pdf com ${pags} página(s) (esperado 1)`);
  const mbs = [...s.matchAll(/\/MediaBox\s*\[\s*([-\d.]+)\s+([-\d.]+)\s+([-\d.]+)\s+([-\d.]+)\s*\]/g)];
  const tam = mbs.map(m => [(m[3] - m[1]) / 72 * 25.4, (m[4] - m[2]) / 72 * 25.4]);
  if (!tam.length || tam.some(([w, h]) => Math.abs(w - G.larg) > 0.02 || Math.abs(h - G.alt) > 0.02))
    P.push(`${nome}.pdf com página de ${tam.map(([w, h]) => w.toFixed(2) + ' x ' + h.toFixed(2)).join(', ') || '?'} mm (gabarito: ${G.larg} x ${G.alt})`);
  const caixa = c => { const m = new RegExp('/' + c + '\\s*\\[\\s*([-\\d.]+)\\s+([-\\d.]+)\\s+([-\\d.]+)\\s+([-\\d.]+)\\s*\\]').exec(s); return m ? m.slice(1).map(Number) : null; };
  const mb = caixa('MediaBox'), bb = caixa('BleedBox'), tb = caixa('TrimBox'), sg = pt(G.sangria);
  if (!mb || !bb || bb.some((x, i) => Math.abs(x - mb[i]) > 0.01)) P.push(`${nome}.pdf sem BleedBox igual à MediaBox`);
  if (!mb || !tb || tb.some((x, i) => Math.abs(x - (mb[i] + (i < 2 ? sg : -sg))) > 0.01))
    P.push(`${nome}.pdf sem TrimBox de ${G.larg - 2 * G.sangria} x ${G.alt - 2 * G.sangria} mm (${G.sangria} mm para dentro da MediaBox)`);
  // xref: cada posição aponta para o começo do próprio objeto
  const sx = /startxref\s+(\d+)\s+%%EOF\s*$/.exec(s);
  if (!sx || s.slice(+sx[1], +sx[1] + 4) !== 'xref') P.push(`${nome}.pdf: startxref não aponta para a tabela xref`);
  else {
    let q = +sx[1] + 4, ruins = 0, n = 0;
    for (let m; (m = /^\s*(\d+)\s+(\d+)[ \t]*(?:\r\n|\r|\n)/.exec(s.slice(q, q + 64)));) {
      q += m[0].length;
      for (let k = 0; k < +m[2]; k++, q += 20, n++) {
        const e = s.slice(q, q + 20), num = +m[1] + k;
        if (e[17] === 'n' && !s.startsWith(num + ' ' + +e.slice(11, 16) + ' obj', +e.slice(0, 10))) ruins++;
      }
    }
    if (!n || ruins) P.push(`${nome}.pdf: tabela xref com ${ruins} posição(ões) errada(s) em ${n}`);
  }
  if (/\/SMask\s+\d+\s+\d+\s+R/.test(s) || /\/SMask\s*<</.test(s)) P.push(`${nome}.pdf com máscara de transparência (SMask)`);
  const alfas = [...s.matchAll(/\/(CA|ca)\s+([\d.]+)/g)].filter(m => +m[2] < 1);
  if (alfas.length) P.push(`${nome}.pdf com opacidade abaixo de 1 (${[...new Set(alfas.map(m => '/' + m[1] + ' ' + m[2]))].join(', ')})`);
  if (/\/BM\s*\/(?!Normal\b|Compatible\b)\w+/.test(s)) P.push(`${nome}.pdf com modo de mistura de cores`);
  // imagens: o dicionário de cada XObject de imagem, até o "stream"
  const imgs = [...s.matchAll(/<<((?:(?!stream)[\s\S]){0,600}?\/Subtype\s*\/Image(?:(?!stream)[\s\S]){0,600}?)>>\s*stream/g)].map(m => m[1]);
  const naoJpeg = imgs.filter(d => !/\/DCTDecode/.test(d));
  if (naoJpeg.length) P.push(`${nome}.pdf com ${naoJpeg.length} imagem(ns) fora do JPEG (${naoJpeg.map(d => (/\/Filter\s*\/(\w+)/.exec(d) || [, 'sem filtro'])[1]).join(', ')})`);
  const fontes = [...new Set([...s.matchAll(/\/BaseFont\s*\/([\w+-]+)/g)].map(m => m[1].replace(/^[A-Z]{6}\+/, '')))];
  const embutidas = (s.match(/\/FontFile[23]?\s+\d+\s+\d+\s+R/g) || []).length;
  if (!fontes.length || embutidas < fontes.length) P.push(`${nome}.pdf com fonte não embutida (${fontes.length} fontes, ${embutidas} embutidas)`);
  if (fontes.some(f => !/Segoe/i.test(f))) P.push(`${nome}.pdf com fonte fora da Segoe UI: ${fontes.filter(f => !/Segoe/i.test(f)).join(', ')}`);
  return { P, info: { paginas: pags, pagMm: tam[0], mm: tam[0] ? tam[0].map(x => x.toFixed(2)).join(' x ') : '?', imagens: imgs.length, jpeg: imgs.length - naoJpeg.length, fontes, kb: Math.round(buf.length / 1024) } };
}
// prova em imagem: PNG do PDF (pdf2png.ps1, renderizador do Windows) e uma CÓPIA com corte, dobras e segurança
function pdfParaPng(pdf, pasta) {
  const png = path.join(pasta, path.basename(pdf, '.pdf') + '-p1.png');
  if (fs.existsSync(png)) fs.rmSync(png);
  const r = cp.spawnSync('powershell', ['-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass', '-File', path.win32.normalize(R + 'ferramentas/pdf2png.ps1'),
    '-Pdf', path.win32.normalize(pdf), '-Largura', '2400', '-Saida', path.win32.normalize(pasta)], { encoding: 'utf8' });
  // o pdf2png.ps1 grava o PNG e às vezes sai com 0xC0000005 ao descarregar o WinRT: vale o PNG novo, com assinatura de PNG
  const ok = fs.existsSync(png) && fs.readFileSync(png).subarray(0, 8).toString('hex') === '89504e470d0a1a0a' && /->/.test(r.stdout || '');
  if (!ok) throw new Error('pdf2png.ps1 falhou em ' + pdf + ': ' + ((r.stderr || '') + (r.stdout || '')).trim());
  return png;
}
// pixels do PDF renderizado (o PNG do pdf2png), lidos no próprio Edge; a imagem vai embutida (data:) para o canvas
// não ficar bloqueado. pontos em mm a partir do canto de cima à esquerda do arquivo.
async function pixels(png, pontosMm, pagMm) {
  const b = fs.readFileSync(png), W = b.readUInt32BE(16), H = b.readUInt32BE(20), k = W / pagMm[0];
  const f = path.join(TMP, 'pixels.html');
  fs.writeFileSync(f, `<!DOCTYPE html><html><body><img id="i" src="data:image/png;base64,${b.toString('base64')}"></body></html>`, 'utf8');
  await abre(f);
  const px = pontosMm.map(([x, y]) => [Math.max(0, Math.min(W - 1, Math.floor(x * k))), Math.max(0, Math.min(H - 1, Math.floor(y * k)))]);
  const r = await edge.call('Runtime.evaluate', { expression: `(async () => {
    const i = document.getElementById('i'); await i.decode();
    const c = document.createElement('canvas'); c.width = i.naturalWidth; c.height = i.naturalHeight;
    const g = c.getContext('2d', { willReadFrequently: true }); g.drawImage(i, 0, 0);
    return JSON.stringify(${JSON.stringify(px)}.map(([x, y]) => [...g.getImageData(x, y, 1, 1).data]));
  })()`, awaitPromise: true, returnByValue: true });
  if (r.exceptionDetails) throw new Error('leitura dos pixels de ' + png + ' falhou: ' + (r.exceptionDetails.exception || {}).description);
  return JSON.parse(r.result.value);
}
// no PDF renderizado: (1) cada faixa de transborda é escura, o escuro continua do outro lado do vinco e o claro volta
// depois da faixa; (2) a borda do arquivo (última linha e última coluna) tem a cor da sangria logo ao lado — sem o
// fio da página do Edge (caixasPdf() recortou a MediaBox)
async function conferePixels(face, png, pagMm, transbordas) {
  const P = [], lum = ([r, g, b]) => 0.2126 * r + 0.7152 * g + 0.0722 * b, ys = [8, 40, 76, 112, 144];
  const pts = [];   // [xMm, yMm, tipo, descrição]; tipo 'escuro' | 'claro' | ['par', índice do ponto de comparação]
  for (const t of transbordas) {
    const dobra = t.lado === 'd' ? t.x1 : t.x0, s = t.lado === 'd' ? -1 : 1;   // s: do vinco para dentro do painel claro
    for (const y of ys) pts.push(
      [dobra + s * TRANSBORDA / 2, y, 'escuro', `faixa de ${v(TRANSBORDA)} mm sobre ${t.sobre}`],
      [dobra - s * 0.5, y, 'escuro', `${t.de} junto ao vinco`],
      [dobra + s * (TRANSBORDA + 1), y, 'claro', `${t.sobre} depois da faixa`]);
  }
  for (const x of [30, 105, 180]) { pts.push([x, G.alt - 1, 'ref', '']); pts.push([x, G.alt, ['par', pts.length - 1], `borda de baixo a ${x} mm`]); }
  // à direita, fora da altura da foto da capa (que sangra nessa borda)
  for (const y of [10, 100, 140]) { pts.push([G.larg - 1, y, 'ref', '']); pts.push([G.larg, y, ['par', pts.length - 1], `borda da direita a ${y} mm`]); }
  const cor = await pixels(png, pts.map(p => [p[0], p[1]]), pagMm);
  pts.forEach(([x, y, tipo, oq], i) => {
    const l = lum(cor[i]);
    if (tipo === 'escuro' && l > 60) P.push(`${face}-p1.png: ${oq} clara (luminância ${Math.round(l)} em ${v(x)} × ${v(y)} mm)`);
    if (tipo === 'claro' && l < 230) P.push(`${face}-p1.png: ${oq} escura (luminância ${Math.round(l)} em ${v(x)} × ${v(y)} mm) — a faixa passou de ${v(TRANSBORDA)} mm`);
    if (Array.isArray(tipo) && Math.abs(l - lum(cor[tipo[1]])) > 40) P.push(`${face}-p1.png: ${oq} com fio de outra cor (luminância ${Math.round(l)} × ${Math.round(lum(cor[tipo[1]]))} a 1 mm) — a MediaBox não recortou a sobra da página`);
  });
  return { P, n: pts.filter(p => p[2] !== 'ref').length };
}
// pedido à gráfica: vai em pedido-grafica.txt, junto com os PDFs (o comentário do código não vai)
function pedidoGrafica() {
  const agora = new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo', dateStyle: 'short', timeStyle: 'short' });
  const rgb = [1, 3, 5].map(i => parseInt(FUNDO.slice(i, i + 2), 16)).join(',');
  const dob = f => FACES[f].dobras.map(d => v(d.toFixed(1))).join(' e ');
  return '﻿' + [   // BOM: o Bloco de Notas antigo lê os acentos certos
    `PEDIDO À GRÁFICA — folder 2 dobras da Imobiliária Viv'América (edição ${edicao})`,
    `Gerado em ${agora} por gera-folder-2dobras.js. Vai JUNTO com frente.pdf e verso.pdf, da mesma rodada.`,
    '',
    'ARQUIVOS',
    `- frente.pdf = lado de fora (aba ${FACES.frente.acabado[0]} | contracapa ${FACES.frente.acabado[1]} | capa ${FACES.frente.acabado[2]} mm); verso.pdf = lado de dentro (${FACES.verso.acabado.join(' | ')} mm). 1 página cada.`,
    `- ${G.larg} × ${G.alt} mm com ${G.sangria} mm de sangria por lado (MediaBox = BleedBox); corte ${G.larg - 2 * G.sangria} × ${G.alt - 2 * G.sangria} mm (TrimBox). Fechado: ${FACES.frente.acabado[2]} × ${G.alt - 2 * G.sangria} mm.`,
    `- Dobras: na frente a ${dob('frente')} mm da borda esquerda do arquivo; no verso a ${dob('verso')} mm (o gabarito BROCHURE_TRIFOLD_148X210 de vocês).`,
    '- Fontes embutidas; imagens em JPEG com 250 dpi ou mais; sem transparência.',
    '',
    'COR — os PDFs estão em RGB e NÃO são PDF/X-1a: converter no fluxo de vocês',
    '1. Preto RGB 0,0,0 (todo o texto e os fios das páginas brancas, com letras a partir de 6 pt) em 100% K. Nunca preto de 4 cores.',
    `2. Fundo da capa e da contracapa (RGB ${rgb}) em preto calçado C40 K100. Nunca as 4 cores carregadas.`,
    '3. Mandar prova digital com as separações (C, M, Y e K) antes de imprimir.',
    '',
    'ACABAMENTO',
    `4. Vincar antes de dobrar, nas duas dobras (o preto chapado atravessa a dobra de ${v(FACES.frente.dobras[1].toFixed(1))} mm da frente).`,
    `5. Dobra em rolo: a aba de ${FACES.frente.acabado[0]} mm (painel esquerdo da frente) dobra para dentro primeiro; a capa fecha por cima.`,
    `6. Na dobra de ${v(FACES.frente.dobras[0].toFixed(1))} mm da frente, o preto da contracapa passa ${v(TRANSBORDA)} mm sobre a aba de propósito: assim não aparece filete branco na borda da contracapa.`,
    '',
  ].join('\r\n');
}
// arquivos que o gerador grava na pasta de saída (os de uma rodada anterior são apagados antes de gravar os novos)
const ARQS_SAIDA = ['frente.html', 'verso.html', 'frente.pdf', 'verso.pdf', 'pedido-grafica.txt', 'frente-p1.png', 'verso-p1.png', 'prova-guias-frente.png', 'prova-guias-verso.png'];
const antigos = () => ARQS_SAIDA.filter(a => fs.existsSync(SAIDA + a)).map(a => ({ nome: a, quando: fs.statSync(SAIDA + a).mtime }));
function avisaAntigos() {
  const velhos = antigos();
  if (!velhos.length) return;
  console.log(`\n  ATENÇÃO: ficaram em ${SAIDA} ${velhos.length} arquivo(s) de uma rodada anterior, que NÃO refletem a fonte atual — não envie à gráfica:`);
  velhos.forEach(a => console.log('    ' + a.nome + ' (' + a.quando.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo', dateStyle: 'short', timeStyle: 'medium' }) + ')'));
}
const ROTULOS = {
  frente: ['ABA (dobra para dentro)', 'CONTRACAPA', 'CAPA'],
  verso: ['ESQUERDA (atrás da capa)', 'MEIO', 'DIREITA (atrás da aba)'],
};
const conteudoDe = nome => MIOLO[nome] ? MIOLO[nome].blocos.flatMap(b => b.grupos.map(g => g.titulo.charAt(0).toLowerCase() + g.titulo.slice(1) + ' (' + g.itens.length + ')')).join(' + ')
  : nome === 'contracapa' ? 'por que comprar, 2 QR, CRECI, aviso legal' : 'foto, título, números, edição';
async function provaComGuias(face, png, destino, pagMm) {
  const b = fs.readFileSync(png), W = b.readUInt32BE(16), H = b.readUInt32BE(20);
  const k = W / pagMm[0], S = 190;   // px por mm na página do PDF (214,12 × 152,06)
  if (Math.abs(H / pagMm[1] - k) > 0.01 * k) throw new Error('o PNG de ' + face + ' não tem a proporção do arquivo (' + W + ' x ' + H + ')');
  const L = x => (x * k).toFixed(1);
  const geo = geometria(face);
  const svg = [
    `<rect x="${L(G.sangria)}" y="${L(G.sangria)}" width="${L(G.larg - 2 * G.sangria)}" height="${L(G.alt - 2 * G.sangria)}" fill="none" stroke="#E0001B" stroke-width="3"/>`,
    ...FACES[face].dobras.map(d => `<line x1="${L(d)}" y1="0" x2="${L(d)}" y2="${H}" stroke="#00A0E3" stroke-width="4" stroke-dasharray="26 14"/>`),
    ...geo.map(g => `<rect x="${L(g.x0 + g.segL)}" y="${L(G.segBorda)}" width="${L(g.larg - g.segL - g.segR)}" height="${L(G.alt - 2 * G.segBorda)}" fill="none" stroke="#E6007E" stroke-width="2.5" stroke-dasharray="8 7"/>`),
  ].join('');
  const rot = geo.map((g, i) => `<div style="position:absolute;left:${L(g.x0)}px;width:${L(g.larg)}px;top:14px;text-align:center"><b>${ROTULOS[face][i]} · ${v(g.acabado)} mm</b><br>${esc(conteudoDe(g.nome))}</div>`).join('');
  const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>
    *{margin:0;padding:0;box-sizing:border-box} body{width:${W}px;background:#fff;font:22px/1.35 'Segoe UI',Arial,sans-serif;color:#111}
    .img{position:relative;width:${W}px;height:${H}px} .img img{display:block;width:${W}px;height:${H}px} .img svg{position:absolute;left:0;top:0}
    .leg{position:relative;height:${S}px;border-top:2px solid #111} .chave{position:absolute;left:24px;right:24px;bottom:16px;font-size:21px}
    .chave i{display:inline-block;width:46px;height:0;vertical-align:middle;margin:0 8px 0 26px}
  </style></head><body>
    <div class="img"><img src="${pathToFileURL(png).href}"><svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">${svg}</svg></div>
    <div class="leg">${rot}<p class="chave"><b>${face.toUpperCase()}</b> · arquivo ${G.larg} × ${G.alt} mm
      <i style="border-top:3px solid #E0001B"></i>corte (${G.larg - 2 * G.sangria} × ${G.alt - 2 * G.sangria} mm)
      <i style="border-top:4px dashed #00A0E3"></i>dobra (${FACES[face].dobras.map(d => v(d.toFixed(1))).join(' e ')} mm da borda esquerda do arquivo)
      <i style="border-top:3px dashed #E6007E"></i>segurança (${G.segBorda} mm da borda do arquivo, ${G.segVinco} mm do vinco)</p></div>
  </body></html>`;
  const f = path.join(TMP, 'guias-' + face + '.html');
  fs.writeFileSync(f, html, 'utf8');
  await edge.call('Emulation.setEmulatedMedia', { media: 'screen' });
  await edge.call('Emulation.setDeviceMetricsOverride', { width: W, height: H + S, deviceScaleFactor: 1, mobile: false });
  await abre(f);
  const r = await edge.call('Page.captureScreenshot', { format: 'png', clip: { x: 0, y: 0, width: W, height: H + S, scale: 1 }, captureBeyondViewport: true });
  fs.writeFileSync(destino, Buffer.from(r.data, 'base64'));
  return { W, H: H + S };
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
  let codigo = 0, gravou = false;
  try {
    TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'gera-folder-2dobras-'));
    const QS = { site: gerarQr(URL_SITE, 'H', 4), mapa: gerarQr(URL_MAPA, 'M', 4) };
    const base = pathToFileURL(R).href.replace(/\/?$/, '/');
    const cfgF = { ...CFG, qr: QS, geo: geometria('frente') }, cfgV = { ...CFG, qr: QS, geo: geometria('verso') };
    const fontesF = ['.logo-n', 'h1', '.cc-pq p', '.cc-legal p', '.cc-q b', '.nome', '.pr', '.rot span', '.tit h2', '.pe p'];
    const fontesV = ['.nome', '.pr', '.rot span', '.tit h2', '.gr'];   // o verso não tem rodapé

    await abreEdge();
    // 1ª rodada sem respiro: mede a folga de cada painel do miolo; o respiro reparte o que sobra acima de FOLGA_ALVO
    RESPIRO = {};
    let rF = await mede('frente', frente(QS, base), cfgF, fontesF), rV = await mede('verso', verso(base), cfgV, fontesV);
    const folga1 = { ...rF.M.folgas, ...rV.M.folgas }, cards = { ...rF.M.cards, ...rV.M.cards };
    for (const nome of Object.keys(MIOLO)) {
      const f = (folga1[nome] || [0])[0], n = cards[nome] || 1;
      RESPIRO[nome] = Math.max(0, Math.min(RESPIRO_MAX, Math.floor((f - FOLGA_ALVO) / (2 * n) * 20) / 20));
    }
    // painéis vistos lado a lado: o mesmo ritmo de cards (até RESPIRO_DIF acima do mais apertado do grupo); o que
    // sobra fica no fim da lista. Só diminui respiro, então a folga continua acima de FOLGA_ALVO.
    const respiroLivre = { ...RESPIRO };
    for (let mudou = true; mudou;) {
      mudou = false;
      for (const g of VISTOS_JUNTOS) {
        const teto = Math.min(...g.map(n => RESPIRO[n])) + RESPIRO_DIF;
        for (const n of g) if (RESPIRO[n] > teto + 1e-9) { RESPIRO[n] = +teto.toFixed(2); mudou = true; }
      }
    }
    // fios dourados de baixo da contracapa e da capa na mesma altura: o bloco mais baixo ganha padding em cima
    const fios1 = rF.M.fios;
    if (fios1) { const d = +(fios1.cc - fios1.capa).toFixed(2); FIOS = d > 0 ? { cc: d, capa: 0 } : { cc: 0, capa: -d }; }
    if (Object.values(RESPIRO).some(r => r > 0) || FIOS.cc || FIOS.capa) {
      rF = await mede('frente', frente(QS, base), cfgF, fontesF);
      rV = await mede('verso', verso(base), cfgV, fontesV);
    }

    const problemas = [...rF.P, ...rV.P];
    // preços e cards somando as duas faces: os mesmos da fonte única, cada um uma vez
    const precosFonte = [...APTOS, ...LOTES].map(e => e.p ? brl(e.p) : 'sob consulta').sort();
    const vistos = [...rF.M.precos, ...rV.M.precos].sort();
    if (vistos.join('|') !== precosFonte.join('|')) {
      const falta = precosFonte.filter(p => !vistos.includes(p)), sobra = vistos.filter(p => !precosFonte.includes(p));
      problemas.push('preços nas duas faces ≠ fonte única (' + vistos.length + ' × ' + precosFonte.length + ')' + (falta.length ? ' · faltam ' + falta.join(', ') : '') + (sobra.length ? ' · sobram ' + sobra.join(', ') : ''));
    }
    const ks = [...rF.M.itens, ...rV.M.itens];
    if (ks.length !== APTOS.length + LOTES.length || new Set(ks).size !== ks.length) problemas.push(ks.length + ' cards nas duas faces (' + new Set(ks).size + ' diferentes); a fonte única tem ' + (APTOS.length + LOTES.length));

    const M = { folgas: { ...rF.M.folgas, ...rV.M.folgas }, menorPt: { ...rF.M.menorPt, ...rV.M.menorPt }, qr: rF.M.qr, fotos: rF.M.fotos, minis: [...rF.M.minis, ...rV.M.minis], alturas: { ...rF.M.alturas, ...rV.M.alturas },
      transborda: [...rF.M.transborda.map(t => ({ ...t, face: 'frente' })), ...rV.M.transborda.map(t => ({ ...t, face: 'verso' }))] };
    console.log('Folder 2 dobras — ' + G.larg + ' × ' + G.alt + ' mm (210 × 148 aberto + 2 mm de sangria), dobra em rolo, fechado 71 × 148');
    console.log('  frente = aba 68 | contracapa 71 | capa 71 (dobras a 70,0 e 141,0 mm) · verso = esquerda 71 | meio 71 | direita 68 (dobras a 73,0 e 144,0 mm)');
    console.log('  capa: ' + total + ' empreendimentos · ' + construtoras + ' construtoras · a partir de ' + mil(menorDatado.p) + ' (' + menorDatado.n + ', tabela ' + mesDe(menorDatado.tab) + ') · edição ' + edicao);
    for (const nome of Object.keys(MIOLO)) console.log(`  ${nome} (${MIOLO[nome].face}): ${conteudoDe(nome)}`);
    console.log('  folga (mm): ' + Object.entries(M.folgas).map(([k, f]) => k + ' ' + f.map(v).join(' e ') + (k in folga1 && RESPIRO[k] ? ' (antes do respiro ' + v(folga1[k][0]) + ')' : '')).join(' · '));
    console.log('  respiro por card (mm, acima e abaixo): ' + Object.entries(RESPIRO).map(([k, r]) => k + ' ' + v(r) + (respiroLivre[k] !== r ? ' (sem o ritmo comum: ' + v(respiroLivre[k]) + ')' : '')).join(' · ')
      + ' — vistos juntos: ' + VISTOS_JUNTOS.map(g => g.join(' + ')).join('; ') + ', até ' + v(RESPIRO_DIF) + ' mm de diferença');
    for (const t of M.transborda) console.log(`  dobra a ${v(t.dobra)} mm (${t.face}): o fundo de ${t.de} avança ${v(TRANSBORDA)} mm sobre ${t.sobre} (${v(t.x0)}–${v(t.x1)} mm)`);
    if (rF.M.fios) console.log(`  fios dourados de baixo: contracapa a ${v(rF.M.fios.cc)} mm e capa a ${v(rF.M.fios.capa)} mm do topo` + (fios1 ? ` (antes do ajuste: ${v(fios1.cc)} e ${v(fios1.capa)})` : ''));
    const alts = Object.values(M.alturas);
    console.log('  cards: ' + alts.length + ', de ' + v(Math.min(...alts)) + ' a ' + v(Math.max(...alts)) + ' mm de altura (com o respiro)');
    console.log('  menor corpo (pt): ' + Object.entries(M.menorPt).map(([k, p]) => k + ' ' + v(p)).join(' · ') + ' — sobre o escuro: mínimo 7 pt semibold');
    for (const [k, q] of Object.entries(M.qr)) console.log(`  QR ${k}: versão ${q.versao}-${q.nivel}, ${v(q.lado)} mm, módulo ${v(q.modulo)} mm, zona de silêncio ${v(q.zona)} módulos`);
    for (const f of M.fotos) console.log(`  foto da capa: ${f.arquivo} (${f.px}) a ${f.dpi} dpi, quadro ${v(f.w)} × ${v(f.h)} mm, trecho x ${f.trecho[0]}–${f.trecho[2]} px, y ${f.trecho[1]}–${f.trecho[3]} px`);
    if (M.minis.length) {
      const dpis = M.minis.map(f => f.dpi), kb = [...MINI.values()].reduce((t, f) => t + f.kb, 0);
      console.log(`  miniaturas: ${M.minis.length} JPEG (${Object.keys(MINI_FOTO).length} exceções em MINI_FOTO; ${v((kb / 1024).toFixed(1))} MB no total), quadro de ${v(Math.min(...M.minis.map(f => f.w)))} mm × ${v(Math.min(...M.minis.map(f => f.h)))} a ${v(Math.max(...M.minis.map(f => f.h)))} mm, de ${Math.min(...dpis)} a ${Math.max(...dpis)} dpi`);
    }
    avisosMini.forEach(a => console.log('  aviso: ' + a));
    // para a tiragem (só aviso: a prova pode sair em qualquer mês). Pedido do Fabio (29/10/2026): a tiragem sai no mês
    // seguinte, "já com valores ajustados" — edição do mês corrente e cada card com a tabela ou a confirmação da edição
    const hoje = new Date().toLocaleDateString('sv-SE', { timeZone: 'America/Sao_Paulo' }).slice(0, 7);   // aaaa-mm
    if (EDICAO.iso !== hoje) console.log(`  aviso para a tiragem: a edição é ${edicao} (EDICAO do gera-observatorio.js), mas estamos em ${mesDe(hoje)}`);
    const antigas = [...APTOS, ...LOTES].filter(e => e.p && e.tab && e.tab < EDICAO.iso && e.conf !== EDICAO.iso);
    if (antigas.length) console.log(`  aviso para a tiragem: ${antigas.length} card(s) com tabela anterior à edição e sem confirmação para ${mesDe(EDICAO.iso)}: `
      + antigas.map(e => e.n + ' (tabela ' + mesDe(e.tab) + (e.conf ? ', confirmada para ' + mesDe(e.conf) : '') + ')').join(', '));

    // PDF: só com a checagem do HTML aprovada; caixas regravadas e conferidas; renderizado (pdf2png) e conferido nos
    // pixels. Tudo na pasta temporária: a pasta de saída só é tocada com tudo aprovado.
    const pdfs = {};
    if (!problemas.length) {
      for (const [face, r] of [['frente', rF], ['verso', rV]]) {
        const buf = caixasPdf(await imprime(r.arquivo), face), c = conferePdf(buf, face);
        pdfs[face] = { buf, info: c.info };
        problemas.push(...c.P);
      }
    }
    if (!problemas.length) {
      for (const face of ['frente', 'verso']) {
        const pdf = path.join(TMP, face + '.pdf');
        fs.writeFileSync(pdf, pdfs[face].buf);
        pdfs[face].png = pdfParaPng(pdf, TMP);
        const c = await conferePixels(face, pdfs[face].png, pdfs[face].info.pagMm, M.transborda.filter(t => t.face === face));
        pdfs[face].pixels = c.n;
        problemas.push(...c.P);
      }
    }
    if (problemas.length) {
      console.log('\nCHECAGEM REPROVOU — nada foi gravado (' + problemas.length + ' problema(s)):');
      [...new Set(problemas)].forEach(p => console.log('  · ' + p));
      avisaAntigos();
      codigo = 1;
    } else {
      console.log('  checagem no Edge: 0 problema');
      for (const [face, p] of Object.entries(pdfs)) {
        console.log(`  ${face}.pdf: ${p.info.paginas} página de ${p.info.mm.replace(/\./g, ',')} mm (MediaBox = BleedBox; TrimBox ${G.larg - 2 * G.sangria} × ${G.alt - 2 * G.sangria} mm; xref conferida), ${p.info.imagens} imagens (${p.info.jpeg} JPEG), fontes embutidas: ${p.info.fontes.join(', ')}, sem transparência, ${p.info.kb} KB`);
        console.log(`  ${face}-p1.png: ${p.pixels} pontos conferidos (faixa escura da dobra e borda do arquivo sem fio)`);
      }
      fs.mkdirSync(SAIDA, { recursive: true });
      const velhos = antigos();
      gravou = true;
      velhos.forEach(a => fs.rmSync(SAIDA + a.nome));
      if (velhos.length) console.log(`  apagados ${velhos.length} arquivo(s) da rodada anterior em ${SAIDA}: ${velhos.map(a => a.nome).join(', ')}`);
      for (const [arq, conteudo] of [['frente.html', frente(QS, base)], ['verso.html', verso(base)], ['frente.pdf', pdfs.frente.buf], ['verso.pdf', pdfs.verso.buf], ['pedido-grafica.txt', pedidoGrafica()]]) {
        fs.writeFileSync(SAIDA + arq, conteudo);
        console.log('  gravado: ' + SAIDA + arq);
      }
      for (const face of ['frente', 'verso']) {
        const png = SAIDA + face + '-p1.png';
        fs.copyFileSync(pdfs[face].png, png);
        const g = await provaComGuias(face, png, SAIDA + 'prova-guias-' + face + '.png', pdfs[face].info.pagMm);
        console.log(`  gravado: ${png} e ${SAIDA}prova-guias-${face}.png (${g.W} × ${g.H} px, com corte, dobras e segurança)`);
      }
    }
  } catch (e) {
    console.log('ERRO: ' + e.message + (gravou ? ' (o HTML, o PDF e o pedido já tinham passado na checagem e foram gravados; a prova em imagem, não)' : ' — nada foi gravado'));
    if (!gravou) avisaAntigos();
    codigo = 1;
  } finally {
    limpa();
  }
  process.exitCode = codigo;
})();
