/* ═══════════════════════════════════════════════════════════════════
   OBSERVATÓRIO DE PREÇOS — /precos-lancamentos-indaiatuba/
   + DADOS ABERTOS — /imprensa-e-dados/ (página, CSV e JSON da edição)
   ───────────────────────────────────────────────────────────────────
   A página de dados originais do site: tabela completa dos lançamentos
   com preço, R$/m² dos lotes e dos apartamentos (pela menor unidade com
   preço), médias e medianas calculadas e a movimentação de preços do
   mês — informação que nem portal nem construtora publica.

   Fonte única: APTOS/LOTES do gera-folheto.js (mesmos dados do site,
   do folheto e do folder). A movimentação do mês é registrada na
   constante MOVIMENTOS, com origem em tabela oficial de construtora.

   RITUAL MENSAL: quando chegarem as tabelas do mês,
   1. atualizar gera-folheto.js (como sempre: p, m2, tab, est, estEm, prox);
   2. mover MOVIMENTOS/ENTRADAS do mês anterior para o histórico
      (MOVIMENTOS_<MES>_<ANO>) e registrar as mudanças novas (de → para,
      % calculada aqui); o estoque "atual" do mês anterior vira
      ESTOQUE_ANTERIOR (n e data; nota, saida e est quando a saída não
      for venda pura — os campos estão explicados na constante);
   3. trocar EDICAO (mes/ano/iso/lastmod — a home, os hubs de lote e a
      página de apartamentos leem daqui o "tabela de <mês/ano>");
   4. rodar o ritual completo, nesta ordem: gera-folheto →
      gera-observatorio → gera-home → gera-apartamentos →
      gera-alphaville → gera-blog-ofertas → gera-blog-indice → gera-relacionados →
      identidade.js (último) && commit && push && ping IndexNow.
   Este gerador escreve: precos-lancamentos-indaiatuba/index.html,
   imprensa-e-dados/index.html e imprensa-e-dados/dados-lancamentos-
   indaiatuba-<AAAA-MM>.csv/.json (os arquivos das edições anteriores
   ficam no disco e são listados como "edições anteriores").
   ═══════════════════════════════════════════════════════════════════ */

const fs = require('fs');
const R = __dirname + '/';
// menu do site (fonte única: gera-menu.js); as duas páginas já saem com ele
const { MENU_CSS, MENU_HTML } = require('./gera-menu.js');

const EDICAO = { mes: 'Outubro', ano: 2026, iso: '2026-10', lastmod: '2026-10-17' };

// estoque da MEDIÇÃO ANTERIOR (em geral a da edição de setembro/2026; o Jardim Dona Maria Cândida
// foi medido em 08/09/2026 e publicado em 12/10/2026), para o "antes e depois"
// (saída = anterior - atual; o atual e a data dele vêm de est e estEm da fonte única).
// data  = data do relatório/tabela do número anterior (dd/mm/aaaa ou mmm/aaaa) — sai ao
//         lado do número na página e no release, porque o intervalo muda de um para outro.
// nota  = explicação quando o número não é "vendas" pura e simples.
// saida = [singular, plural] quando a saída NÃO é venda (reserva, saldo com lotes que
//         entraram na lista); sem o campo, a página diz "vendida(s)"/"vendido(s)".
// est   = estoque atual para o qual a nota e a saída foram escritas; se a fonte única
//         mudar o est, o gerador para e pede a revisão da linha (não publica nota velha).
// Não use "}" seguido de ";" dentro deste objeto: o gera-home.js recorta até o primeiro.
const ESTOQUE_ANTERIOR = {
  'monte-carmelo-indaiatuba':        { n: 568, data: '02/09/2026', fonte: 'relatório "Lotes disponíveis" da Dominium de 02/09/2026; atual: relatório de 09/10/2026', est: 579, nota: 'o relatório de 30/09/2026 tirou 7 lotes da lista e pôs 20 novos (581); o de 01/10/2026 listava 585; o de 09/10/2026 lista 579 (6 saíram, nenhum entrou) — nenhum preço mudou' },
  'residencial-ravello-indaiatuba':  { n: 185, data: '02/09/2026', fonte: 'relatório de estoque Dominium de 02/09/2026; atual: relatório de 09/10/2026', est: 180, saida: ['a menos na lista', 'a menos na lista'], nota: '10 lotes saíram da lista de disponíveis e 5 entraram entre os dois relatórios' },
  'di-italia-indaiatuba':            { n: 44,  data: '04/09/2026', fonte: 'relatório Dominium de 04/09/2026; atual: relatório de 09/10/2026 (30 residenciais e 15 mistos)', est: 45, nota: '1 lote saiu da lista de disponíveis e 2 voltaram entre os dois relatórios' },
  'alpnach-indaiatuba':              { n: 28,  data: '04/09/2026', fonte: 'relatório Dominium de 04/09/2026; atual: relatório de 09/10/2026', est: 19, saida: ['a menos na lista', 'a menos na lista'], nota: '14 lotes saíram da lista de disponíveis e 5 entraram entre os dois relatórios' },
  'vivere-indaiatuba':               { n: 5,   data: '04/09/2026', fonte: 'confirmação da Masotti de 04/09/2026; atual: conferência de 12/10/2026 (2 unidades, na Torre 7)', est: 2, saida: ['a menos na lista', 'a menos na lista'], nota: 'entre as que saíram há unidades reservadas — reserva não é venda: a unidade volta à lista de disponíveis se a reserva cair' },
  'reserva-botanica-indaiatuba':     { n: 3,   data: '10/07/2026', fonte: 'tabela Zarin de 10/07/2026; atual: tabela de 29/09/2026, conferida em 12/10/2026', est: 2, saida: ['a menos na tabela', 'a menos na tabela'], nota: 'saiu o lote D-13, de 339,92 m², que era o mais barato' },
  'terras-de-san-marino-indaiatuba': { n: 19,  data: '02/09/2026', fonte: 'espelho de vendas de 02/09/2026; atual: espelho de 09/10/2026', est: 13, saida: ['a menos na lista', 'a menos na lista'], nota: '9 lotes saíram da lista de disponíveis e 3 entraram entre os dois espelhos' },
  'gran-vic-canario-indaiatuba':     { n: 3,   data: '02/09/2026', fonte: 'tabela VIC de 02/09/2026; atual: comunicado da VIC de 09/10/2026 (as mesmas 3 unidades da Torre 03)', est: 3 },
  // Gran Vic Andorinha (2 unidades em 02/09/2026) saiu da fonte única em 16/10/2026, sem unidades:
  // a saída está em SAIDAS, abaixo (a linha daqui ficaria órfã e foi removida).
  'itamaraca-indaiatuba':            { n: 206, data: 'jul/2026', fonte: 'tabela Zarin de julho/2026; atual: tabela de outubro/2026 emitida em 11/10/2026 (166 disponíveis)', est: 166, saida: ['a menos na lista', 'a menos na lista'], nota: 'a tabela de julho listava as 206 unidades do projeto como disponíveis; a emitida em 11/10/2026 traz 166 disponíveis, 2 reservadas e 38 vendidas' },
  'maria-candida-indaiatuba':        { n: 180, data: '08/09/2026', fonte: 'lista de disponíveis de 08/09/2026; atual: quadro de disponíveis recebido em 16/10/2026', est: 166, saida: ['a menos na lista', 'a menos na lista'], nota: '12 lotes saíram da lista, 6 estão reservados (voltam se a reserva cair) e 4 voltaram (D-14 a D-17)' },
  // 1ª medição em outubro/2026 (sem série anterior): Ville de Provence (307, tabela de outubro/2026 —
  // documento de 03/10/2026) e Alphaville Indaiatuba (126 disponíveis no quadro de vendas de
  // 07/10/2026, tabela de outubro com os valores de setembro). O Jardim Dona Maria Cândida entrou
  // como 1ª medição em 12/10/2026 (180, lista de 08/09/2026) e ganhou a 2ª no quadro de 16/10/2026.
};

// mudanças de preço do mês, conferidas nas tabelas oficiais das construtoras
const MOVIMENTOS = [
  // outubro/2026
  { n: 'Itamaracá Residencial', c: 'Zarin', de: 339990, para: 345107, causa: 'o piso da tabela de outubro subiu: Apto Meio de 48,11 m² no térreo da Torre B; 168 das 206 unidades disponíveis em 01/10/2026', fonte: 'tabela Zarin de outubro/2026 (gerada em 01/10/2026)' },
  { n: 'Spazio Italia',         c: 'Zarin', de: 448820, para: 429961, causa: 'a Torre 4 (Milão) entrou na tabela com 86 unidades e passou a ter o menor preço — 59,5 m², 1 vaga', fonte: 'tabela Zarin de outubro/26 (documento de 01/10/2026)' },
  { n: 'Parque Zarah',          c: 'Zarin', de: 172500, para: 211050, causa: 'os lotes mistos de 150 m² da quadra 14, de R$ 172.500, saíram da tabela de 29/09/2026; o menor agora é misto de 150 m² da fase Pérola, e a tabela de 01/10/2026 reajustou os 662 lotes em 0,5% — residencial a partir de R$ 218.588', fonte: 'tabelas Zarin de 29/09/2026 e 01/10/2026 (3 fases)' },
  { n: 'Reserva Botânica',      c: 'Zarin', de: 532563, para: 642375, causa: 'saiu o lote D-13 (339,92 m²), que era o mais barato; o menor disponível agora é o C-1, de 410,01 m² — restam 2 lotes na tabela de 29/09/2026', fonte: 'tabela Zarin de 29/09/2026' },
  { n: 'Gran Vic Tangará',      c: 'VIC Engenharia', de: 330000, para: 325000, causa: 'o apto 1001 da Torre 03, que era o mais barato (R$ 330.000), saiu da tabela; o menor preço agora é o do apto 804 da Torre 05 (47,22 m²), preço de uma única unidade — a seguinte custa R$ 333.761; as 74 unidades da tabela são Faixa 3', fonte: 'tabela VIC de 05/10/2026' },
  { n: 'Gran Vic Colibri',      c: 'VIC Engenharia', de: 334479, para: 336686, causa: 'as duas unidades de menor preço são as mesmas da tabela de setembro (térreo das Torres 01 e 02), com valor reajustado; 81 unidades na tabela', fonte: 'tabela VIC de 05/10/2026' },
  { n: 'Viva Parque Aura',      c: 'Pinheiro · RDZ · iBen', de: 300854, para: 306650, causa: 'os Apto Meio do 1º andar da Torre 3 não estão na tabela de 01/10/2026; o menor preço passou a ser o Apto Canto de 47,17 m² no 1º andar da Torre 3; a Torre 4 entrou na tabela', fonte: 'tabela Pinheiro de 01/10/2026' },
  { n: 'Viva Parque Sense',     c: 'Pinheiro · RDZ · iBen', de: 404886, para: 408328, causa: 'a tabela de 03/09/2026 traz o preço de entrada 0,85% acima do da tabela de 01/08/2026; o menor preço continua no 3 dorm c/ suíte de 59,93 m², no 1º andar', fonte: 'tabela Pinheiro de 03/09/2026' },
  { n: 'Manai Bosque',          c: 'Masotti', de: 505941, para: 520855, causa: 'a tabela de lançamento da Torre 1 de outubro/2026 traz o menor preço em R$ 520.855 (2 dormitórios, 2º andar); em 04/09/2026 a Masotti informava R$ 505.941 — piso e teto 2,9% acima', fonte: 'tabela Masotti de lançamento da Torre 1, de 03/10/2026' },
  { n: 'Storia Congesa',        c: 'Congesa', de: 981000, para: 921000, causa: 'o único 2 dormitórios da tabela de outubro é o apto 124 (70,05 m²), a R$ 921.000; os 3 suítes de 114,89 m² foram de R$ 1.683.000 para R$ 1.715.000', fonte: 'tabela Congesa de outubro/2026' },
  // 16/10/2026 (2ª parte da leva de outubro)
  { n: 'Gran Vic Canário',      c: 'VIC Engenharia', de: 352135, para: 354459, causa: 'as mesmas 3 unidades da Torre 03, com valores da VIC de 09/10/2026 (+0,66% sobre a tabela de 05/10/2026)', fonte: 'valores por unidade do comunicado comercial da VIC de 09/10/2026, comparados com a tabela padrão em PDF de 05/10/2026 (documentos de tipos diferentes)' },
  { n: 'Residencial Vila Fahl', c: 'Vila Fahl · iBen', de: 273750, para: 290000, causa: 'a tabela recebida em 16/10/2026 traz o lote residencial a R$ 1.933,33/m² (a recebida em 17/09/2026 trazia R$ 1.825); comercial mantido em R$ 2.000/m²; 59 lotes na tabela', fonte: 'tabelas Vila Fahl (residencial e comercial, 96x) recebidas em 16/10/2026' },
];
// empreendimentos que entraram no site (ou ganharam tabela) nesta edição; ficam
// (tabelaNova: true = já estava no site sem preço e ganhou tabela pública agora; o texto
// não o conta entre os que "entraram no site")
// fora de MOVIMENTOS porque não há "antes" para calcular variação
// (o gera-home conta altas em MOVIMENTOS e trataria de:null como alta)
const ENTRADAS = [
  { n: 'Residencial Parque das Águas', c: 'GPCI', para: 309120, causa: 'novo no site — 2 dormitórios de 46,13 a 50,60 m² e gardens de até 72,30 m², em 3 torres', fonte: 'tabela GPCI de setembro/2026' },
  { n: 'Izzi Residence',              c: 'GPCI', para: 371862, causa: 'novo no site — plantas de 39,90 a 43,97 m² e gardens de 66,43 e 66,47 m², no Centro', fonte: 'tabela GPCI de setembro/2026' },
  { n: 'Artemis Residencial',         c: 'GPCI', para: 555171, causa: 'novo no site — 3 dormitórios com suíte, 63,85 e 64,44 m², no Park Meraki', fonte: 'tabela GPCI de outubro/2026' },
  { n: 'Jardim Dona Maria Cândida',   c: 'Asseplan Narezzi', para: 600000, causa: 'novo no site — loteamento fechado com obras concluídas, lotes de 300 a 471,97 m²; 180 disponíveis na lista de 08/09/2026', fonte: 'tabela válida a partir de 01/07/2025' },
  { n: 'Ville de Provence',           c: 'Urban Square', para: 637200, causa: 'novo no site — loteamento fechado, 307 lotes de 360 a 616,90 m² a R$ 1.770/m²', fonte: 'tabela Urban Square de outubro/2026 (documento de 03/10/2026)' },
  { n: 'Alphaville Indaiatuba',       c: 'Alphaville', para: 908480, causa: 'novo no site — 126 lotes disponíveis em 07/10/2026, de 511,50 a 1.205,76 m², no Itaici', fonte: 'tabela de vendas Alphaville de outubro/2026 (mesmos valores de setembro) e quadro de vendas de 07/10/2026' },
  { n: 'Lagos de Helvetia',           c: 'GPCI', para: 901800, causa: 'novo no site — 36 lotes de 501 a 2.015 m², todos a R$ 1.800/m²', fonte: 'tabela GPCI de 10/10/2026' },
  { n: 'Espaço Conceição',            c: 'Masotti', para: 1030310, causa: 'novo no site — 3 dormitórios com suíte, de 85 a 108 m², em 2 torres; 46 unidades disponíveis em 12/10/2026', fonte: 'disponibilidade da Masotti consultada em 12/10/2026' },
  { n: 'Porteira de Ferro',           c: 'GPCI', para: 1300000, causa: 'novo no site — último lote na tabela de 17/09/2026: quadra E, lote 3, 520 m²', fonte: 'tabela GPCI de 17/09/2026' },
  // 16/10/2026: ganharam tabela pública (estavam no site sem preço)
  { n: 'Congesa Seasons',             c: 'Congesa', tabelaNova: true, para: 1239000, causa: 'tabela liberada pela Congesa em out/2026: 48 unidades nas Torres 1 e 3 a 8, de 3 dormitórios com suíte a Penthouse; o menor preço é um Balcony de 3 dormitórios com suíte da Torre 6', fonte: 'tabela Congesa de outubro/2026' },
  { n: '360 Home Office Mall',        c: 'HINC', para: 546274, causa: 'preço aberto a partir de out/2026 — residencial a partir de 39,73 m², no 12º andar; 84 residenciais e 34 salas office na tabela', fonte: 'tabela HINC de setembro/2026 (gerada em 15/09/2026), com os mesmos valores em outubro/2026' },
  // 17/10/2026: novo no site
  { n: 'Pertenze Residencial',        c: 'Mingardi & Elias', para: 312046, causa: 'novo no site — 2 dormitórios de 48,59 a 54,39 m², em 3 torres no Jardim das Andorinhas; 61 unidades da Torre C na tabela', fonte: 'tabela Mingardi & Elias com vigência a partir de 01/10/2026' },
];
// entrou no site sem tabela pública (não entra em ENTRADAS: não há preço).
// 16/10/2026: o 360 Home Office Mall, que estava aqui, ganhou tabela e foi para ENTRADAS.
const SEM_TABELA = [
];
// saíram da fonte única nesta edição, sem unidades (não entram em MOVIMENTOS: não há "agora").
// A página do empreendimento segue no ar como esgotado (EXTRAS_APTOS do gera-relacionados.js).
// antes/data = estoque e data da medição anterior; em = quando a saída foi apurada.
const SAIDAS = [
  { n: 'Gran Vic Andorinha', c: 'VIC Engenharia', slug: 'gran-vic-andorinha-indaiatuba', de: 372119, antes: 2, data: '02/09/2026', em: 'out/2026',
    causa: 'sem unidades em out/2026: as 2 unidades da Torre 01, aptos 1204 e 1304, saíram da lista, e a VIC não enviou tabela do Andorinha em outubro',
    fonte: 'tabela VIC de 02/09/2026 e informação da Viv\'América de 16/10/2026' },
];

// ─── Histórico das edições anteriores (já publicado então; NÃO entra na contagem
// "mudaram neste mês" nem nas altas do card da home). Quando o Observatório
// ganhar "edições anteriores", é daqui que sai. ───
const MOVIMENTOS_SETEMBRO_2026 = [
  { n: 'Residencial Ravello',  c: 'Dominium', de: 672000,  para: 714000,  causa: 'o menor lote disponível (420 m²) mudou no relatório de estoque', fonte: 'relatório de estoque Dominium de 02/09/2026' },
  { n: 'Reserva Botânica',     c: 'Zarin',    de: 391682,  para: 532563,  causa: 'menor lote passou de 250 para 340 m² — restam 3 lotes (tabela jul/2026)', fonte: 'tabela Zarin de 10/07/2026' },
  { n: 'Hélade — Park Meraki', c: 'PERPLAN',  de: 1300668, para: 1391504, causa: 'reajuste na tabela da construtora', fonte: 'tabela PERPLAN de setembro/2026' },
  { n: 'Parque Zarah',         c: 'Zarin',    de: 249123,  para: 172500,  causa: 'menor lote agora é misto de 150 m² (fase Pérola); residencial a partir de R$ 212.072', fonte: 'tabela Zarin de setembro/2026 (3 fases)' },
  { n: 'Jardim Di Italia',     c: 'Dominium', de: 188000,  para: 210000,  causa: 'reajuste do lote residencial de 150 m² à vista (a prazo: R$ 220.000 com entrada de R$ 44.000 em 60x)', fonte: 'relatório de estoque Dominium de 04/09/2026' },
  { n: 'Alpnach Residence',    c: 'Dominium', de: 480000,  para: 510000,  causa: 'reajuste do lote de 300 m² à vista — restam 28 lotes (04/09/2026)', fonte: 'relatório de estoque Dominium de 04/09/2026' },
  { n: 'Gran Vic Colibri',     c: 'VIC Engenharia', de: 332450, para: 334479, causa: 'reajuste na tabela da construtora — 84 unidades disponíveis', fonte: 'tabela VIC de 02/09/2026' },
  { n: 'Gran Vic Tangará',     c: 'VIC Engenharia', de: 331737, para: 330000, causa: 'a unidade mais barata da tabela (Torre 03, apto 1001) está enquadrada em Faixa 4/SBPE; na Faixa 3 o piso é R$ 334.278', fonte: 'tabela VIC de 02/09/2026' },
];
const ENTRADAS_SETEMBRO_2026 = [
  { n: 'Itamaracá Residencial', c: 'Zarin',   para: 339990, causa: 'primeira tabela publicada — 48,11 e 53,84 m²', fonte: 'tabela Zarin de julho/2026' },
  { n: 'Spazio Italia',         c: 'Zarin',   para: 448820, causa: 'primeira tabela publicada — 59,5 e 63,58 m²', fonte: 'tabela Zarin de 10/07/2026' },
  { n: 'Areté Home',            c: 'PERPLAN', para: 991005, causa: 'primeira tabela publicada — 93 a 117 m²', fonte: 'tabela PERPLAN de agosto/2026' },
  { n: 'Viva Parque Aura',      c: 'Pinheiro · RDZ · iBen', para: 300854, causa: 'primeira tabela publicada — Torre 3, 47 a 85 m²', fonte: 'tabela Pinheiro de 01/08/2026' },
  { n: 'Viva Parque Sense',     c: 'Pinheiro · RDZ · iBen', para: 404886, causa: 'novo no site — 3 dorm c/ suíte de 59,93 m² e garden de 95,99 m²', fonte: 'tabela Pinheiro de 01/08/2026' },
  { n: 'Manai Bosque',          c: 'Masotti', para: 505941, causa: 'início de vendas pela Torre I — 53 unidades', fonte: 'Masotti, 04/09/2026' },
  { n: 'Gran Vic Andorinha',    c: 'VIC Engenharia', para: 372119, causa: 'voltou ao estoque — 2 unidades na Torre 01 (aptos 1204 e 1304)', fonte: 'tabela VIC de 02/09/2026' },
  { n: 'Gran Vic Canário',      c: 'VIC Engenharia', para: 352135, causa: 'voltou ao estoque — 3 unidades na Torre 03 (aptos 1204, 1303 e 1503)', fonte: 'tabela VIC de 02/09/2026' },
];
const MOVIMENTOS_AGOSTO_2026 = [
  { n: 'Terras de San Marino', c: 'Armigh · Best Business', de: 225000, para: 247500, causa: 'reajuste na tabela da loteadora', fonte: 'tabela de 29/07/2026, piso confirmado no espelho de 13/08/2026' },
  { n: 'Gran Vic Tangará',    c: 'VIC Engenharia', de: 302464, para: 331737, causa: 'reajuste na tabela da construtora', fonte: 'tabela VIC de 15/08/2026' },
  { n: 'Jardim Di Italia',    c: 'Dominium',       de: 180000, para: 188000, causa: 'os lotes mais baratos foram vendidos — o preço de entrada subiu', fonte: 'relatório de estoque de 14/08/2026' },
];

// ─── dados: mesma fonte do folheto ───
const fonte = fs.readFileSync(R + 'gera-folheto.js', 'utf8');
function extrair(nome) {
  const ini = fonte.indexOf('const ' + nome + ' = [');
  const fim = fonte.indexOf('\n];', ini);
  if (ini < 0 || fim < 0) throw new Error('nao achei ' + nome);
  return eval(fonte.slice(ini + ('const ' + nome + ' = ').length, fim + 2));
}
const APTOS = extrair('APTOS');
const LOTES = extrair('LOTES');

const brl = n => 'R$ ' + n.toLocaleString('pt-BR');
const fm2 = n => n.toLocaleString('pt-BR', { maximumFractionDigits: 2 });
const pct = (de, para) => { const v = (para - de) / de * 100; return (v > 0 ? '+' : '−') + Math.abs(v).toFixed(1).replace('.', ',') + '%'; };
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const MESES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
const mesLongoDe = iso => MESES[+iso.slice(5, 7) - 1] + '/' + iso.slice(0, 4);          // 2026-10 -> outubro/2026
const mesAbrevDe = iso => MESES[+iso.slice(5, 7) - 1].slice(0, 3) + '/' + iso.slice(0, 4); // 2026-10 -> out/2026
const edLongo = EDICAO.mes.toLowerCase() + '/' + EDICAO.ano;      // outubro/2026
const edAbrev = mesAbrevDe(EDICAO.iso);                           // out/2026
const edExtenso = EDICAO.mes.toLowerCase() + ' de ' + EDICAO.ano; // outubro de 2026
const hojeBR = EDICAO.lastmod.split('-').reverse().join('/');     // 12/10/2026
// edições anteriores já no disco (ficam disponíveis para download); a mais recente é "a edição anterior"
const ANTERIORES = (fs.existsSync(R + 'imprensa-e-dados') ? fs.readdirSync(R + 'imprensa-e-dados') : []).map(f => (f.match(/^dados-lancamentos-indaiatuba-(\d{4}-\d{2})\.csv$/) || [])[1]).filter(m => m && m < EDICAO.iso).sort().reverse();
const edAnterior = ANTERIORES.length ? 'edição de ' + mesLongoDe(ANTERIORES[0]) : 'edição anterior';   // edição de setembro/2026
const tabDe = e => e.tab ? 'pela tabela de ' + mesAbrevDe(e.tab) : (e.p ? 'pela tabela de pré-lançamento da ' + e.c.split(' · ')[0] : 'sem tabela pública');
const URL = 'https://lancamentos.imoveisvivamerica.com.br/precos-lancamentos-indaiatuba/';
const URL_DADOS = 'https://lancamentos.imoveisvivamerica.com.br/imprensa-e-dados/';
const ARQ_BASE = 'dados-lancamentos-indaiatuba-' + EDICAO.iso;    // + .csv / .json

// ─── números calculados ───
const todos = APTOS.concat(LOTES);
const total = todos.length;
const comPrecoTotal = todos.filter(e => e.p).length;
const incDe = e => e.c.split(' · ')[0].trim();
const construtoras = new Set(todos.map(incDe)).size;                              // todas as monitoradas, com ou sem tabela
const construtorasComTabela = new Set(todos.filter(e => e.p).map(incDe)).size;    // só as que têm preço publicado
const aptosComPreco = APTOS.filter(e => e.p).slice().sort((a, b) => a.p - b.p);
const construtorasAptoComTabela = new Set(aptosComPreco.map(incDe)).size;
const aptosSemPreco = APTOS.filter(e => !e.p);
const menorApto = aptosComPreco[0];
const maiorApto = aptosComPreco[aptosComPreco.length - 1];
const media = arr => Math.round(arr.reduce((a, b) => a + b, 0) / arr.length);
const mediana = arr => { const s = arr.slice().sort((a, b) => a - b), m = s.length >> 1; return Math.round(s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2); };
const mediaApto = media(aptosComPreco.map(e => e.p));
const medianaApto = mediana(aptosComPreco.map(e => e.p));
// R$/m² de apartamento: só onde a landing diz qual unidade tem o menor preço (campo m2)
const aptosM2 = aptosComPreco.filter(e => e.m2).map(e => Object.assign({ pm2: Math.round(e.p / e.m2) }, e)).sort((a, b) => a.pm2 - b.pm2);
const aptosSemM2 = aptosComPreco.filter(e => !e.m2);
const pm2Min = aptosM2[0], pm2Max = aptosM2[aptosM2.length - 1];
const pm2Medio = media(aptosM2.map(e => e.pm2));
const pm2Mediana = mediana(aptosM2.map(e => e.pm2));
const grupoDe = e => /^MCMV/.test(e.t) ? 'Minha Casa Minha Vida' : e.t === 'Alto padrão' ? 'Alto padrão' : 'Demais lançamentos';
const GRUPOS = ['Minha Casa Minha Vida', 'Demais lançamentos', 'Alto padrão'].map(g => {
  const its = aptosM2.filter(e => grupoDe(e) === g);
  return its.length ? { g, n: its.length, min: its[0], max: its[its.length - 1], medio: media(its.map(e => e.pm2)) } : null;
}).filter(Boolean);

const menorLote = LOTES.reduce((a, b) => a.p < b.p ? a : b);
const lotesM2 = LOTES.map(l => Object.assign({ pm2: Math.round(l.p / l.m2) }, l)).sort((a, b) => a.pm2 - b.pm2);
const m2Medio = media(lotesM2.map(l => l.p / l.m2));
const m2Min = lotesM2[0].pm2, m2Max = lotesM2[lotesM2.length - 1].pm2;
const loteFechado = e => e.t === 'Cond. fechado' || /fechado/i.test(e.s);
const lotesAbertos = lotesM2.filter(e => !loteFechado(e)), lotesFechados = lotesM2.filter(loteFechado);
// faixa de R$/m² de cada tipo, sempre calculada dos dados: as duas faixas se cruzam,
// então a página publica os números e não uma regra ("aberto é mais barato")
const faixaDe = (arr, um, varios) => !arr.length ? '' : arr.length === 1
  ? `${um}, ${arr[0].n}, sai a ${brl(arr[0].pm2)}/m²`
  : `os ${arr.length} ${varios} ficam entre ${brl(arr[0].pm2)} e ${brl(arr[arr.length - 1].pm2)}/m²`;
const FAIXAS_LOTE = [
  faixaDe(lotesAbertos, 'o único loteamento aberto', 'loteamentos abertos'),
  faixaDe(lotesFechados, 'o único loteamento fechado ou condomínio de lotes', 'loteamentos fechados e condomínios de lotes'),
].filter(Boolean).join('; ');
const FAIXAS_LOTE_FRASE = FAIXAS_LOTE.charAt(0).toUpperCase() + FAIXAS_LOTE.slice(1) + '.';

// tabela de mês anterior com os mesmos preços confirmados para um mês depois (campo conf da fonte única):
// a coluna "Tabela" segue com o mês do documento e ganha a confirmação embaixo
const confDe = e => e.conf ? '<br><span class="nd" style="font-size:.78em">preços confirmados para ' + mesAbrevDe(e.conf) + '</span>' : '';
const linhaApto = e => `
      <tr>
        <td><a href="/${e.slug}/">${e.n}</a></td>
        <td>${e.c}</td>
        <td>${e.t}</td>
        <td class="num">${e.p && e.m2 ? fm2(e.m2) + ' m²' : '<span class="nd">não informada</span>'}</td>
        <td class="num">${e.p ? '<strong>' + brl(e.p) + '</strong>' : '<span class="sc">sob consulta</span>'}</td>
        <td class="num">${e.p && e.m2 ? brl(Math.round(e.p / e.m2)) + '/m²' : '<span class="nd">—</span>'}</td>
        <td class="num">${e.tab ? mesAbrevDe(e.tab) + confDe(e) : (e.p ? '<span class="nd">pré-lançamento</span>' : '<span class="nd">—</span>')}</td>
        <td class="obs">${e.s}</td>
      </tr>`;

const linhaLote = e => `
      <tr>
        <td><a href="/${e.slug}/">${e.n}</a></td>
        <td>${e.c}</td>
        <td>${loteFechado(e) ? (e.t === 'Cond. fechado' && !/^Loteamento fechado/i.test(e.s) ? 'Condomínio fechado' : 'Loteamento fechado') : 'Loteamento aberto'}</td>
        <td class="num">${e.m2.toLocaleString('pt-BR')} m²</td>
        <td class="num"><strong>${brl(e.p)}</strong></td>
        <td class="num">${brl(Math.round(e.p / e.m2))}/m²</td>
        <td class="num">${e.tab ? mesAbrevDe(e.tab) + confDe(e) : '<span class="nd">—</span>'}</td>
      </tr>`;

const comEst = todos.filter(e => typeof e.est === 'number');
const unidadeDe = (e, n) => LOTES.includes(e) ? 'lote' + (n === 1 ? '' : 's') : 'unidade' + (n === 1 ? '' : 's');
const vendidoDe = (e, n) => (LOTES.includes(e) ? 'vendido' : 'vendida') + (n === 1 ? '' : 's');
// o que saiu da lista: venda por padrão; ESTOQUE_ANTERIOR[slug].saida troca o rótulo quando não é venda
const saidaDe = (e, ant, n) => ant.saida ? ant.saida[n === 1 ? 0 : 1] : vendidoDe(e, n);
// data da contagem do estoque atual (campo estEm da fonte única), quando existe
const estEmDe = e => typeof e.estEm === 'string' && e.estEm.trim() ? e.estEm.trim() : '';
// 'dd/mm/aaaa' ou 'mmm/aaaa' -> 'aaaa-mm-dd' ou 'aaaa-mm'; formato desconhecido devolve '' (não chuta)
const dataIsoDe = d => {
  const a = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(d || '');
  if (a) return a[3] + '-' + a[2] + '-' + a[1];
  const b = /^([a-zç]{3})\/(\d{4})$/i.exec(d || '');
  const i = b ? MESES.findIndex(m => m.slice(0, 3) === b[1].toLowerCase()) : -1;
  return i < 0 ? '' : b[2] + '-' + String(i + 1).padStart(2, '0');
};
// ['2026-07', '2026-09-04', ...] -> 'de julho a setembro de 2026'
const periodoDe = isos => {
  const ms = isos.map(x => x.slice(0, 7)).filter(Boolean).sort();
  if (!ms.length) return '';
  const a = ms[0], b = ms[ms.length - 1], nome = x => MESES[+x.slice(5, 7) - 1];
  if (a === b) return 'em ' + nome(a) + ' de ' + a.slice(0, 4);
  return 'de ' + nome(a) + (a.slice(0, 4) === b.slice(0, 4) ? '' : ' de ' + a.slice(0, 4)) + ' a ' + nome(b) + ' de ' + b.slice(0, 4);
};
// a nota e o rótulo de saída foram escritos para um est; se a fonte única mudou, a linha está velha
comEst.forEach(e => {
  const ant = ESTOQUE_ANTERIOR[e.slug];
  if (ant && typeof ant.est === 'number' && ant.est !== e.est) throw new Error('ESTOQUE_ANTERIOR[' + e.slug + ']: nota escrita para est ' + ant.est + ', mas a fonte única traz ' + e.est + ' — revise nota, saida e est dessa linha');
});
const comEstAnterior = comEst.filter(e => ESTOQUE_ANTERIOR[e.slug]).sort((a, b) => a.est - b.est);
const basesEstoque = periodoDe(comEstAnterior.map(e => dataIsoDe(ESTOQUE_ANTERIOR[e.slug].data)));   // "de julho a setembro de 2026"
const linhaEst = e => {
  const ant = ESTOQUE_ANTERIOR[e.slug];
  const vend = ant ? ant.n - e.est : null;
  const nota = ant && ant.nota ? '<br><small style="color:#8a8272;font-size:.78em">' + ant.nota + '</small>' : '';
  const em = estEmDe(e);
  return `
      <tr>
        <td><a href="/${e.slug}/">${e.n}</a>${nota}</td>
        <td>${e.c}</td>
        <td class="num"><strong>${e.est}</strong> ${unidadeDe(e, e.est)}${em ? ' <small style="color:#8a8272">(' + em + ')</small>' : ''}</td>
        <td class="num">${ant ? ant.n + ' <small style="color:#8a8272">(' + ant.data + ')</small>' : '<span style="color:#8a8272">1ª medição</span>'}</td>
        <td class="num">${vend === null ? '—' : vend < 0 ? '<strong class="sobe">+' + (-vend) + ' na lista de disponíveis</strong>' : vend === 0 ? '<span style="color:#8a8272">' + (em && em !== ant.data ? 'sem mudança' : 'sem remedição') + '</span>' : '<strong class="desce">' + vend + ' ' + saidaDe(e, ant, vend) + '</strong>'}</td>
      </tr>`;
};

// quem saiu da fonte única sem unidades (SAIDAS): 0 agora, contra a medição anterior
const linhaEstSaida = m => `
      <tr>
        <td><a href="/${m.slug}/">${m.n}</a><br><small style="color:#8a8272;font-size:.78em">${m.causa}</small></td>
        <td>${m.c}</td>
        <td class="num"><strong>0</strong> unidades <small style="color:#8a8272">(${m.em})</small></td>
        <td class="num">${m.antes} <small style="color:#8a8272">(${m.data})</small></td>
        <td class="num"><strong class="desce">${m.antes} a menos na lista</strong></td>
      </tr>`;

const linhaMov = m => {
  const v = (m.para - m.de) / m.de * 100;
  const cls = v > 0 ? 'sobe' : 'desce';
  const seta = v > 0 ? '▲' : '▼';
  return `
      <tr>
        <td>${m.n}<br><small style="color:#8a8272;font-size:.78em">${m.causa} — ${m.fonte}</small></td>
        <td>${m.c}</td>
        <td class="num">${brl(m.de)}</td>
        <td class="num"><strong>${brl(m.para)}</strong></td>
        <td class="num ${cls}">${seta} ${Math.abs(v).toFixed(1).replace('.', ',')}%</td>
      </tr>`;
};

const linhaEntrada = m => `
      <tr>
        <td>${m.n}<br><small style="color:#8a8272;font-size:.78em">${m.causa} — ${m.fonte}</small></td>
        <td>${m.c}</td>
        <td class="num"><span class="sc">—</span></td>
        <td class="num"><strong>${brl(m.para)}</strong></td>
        <td class="num" style="color:#8a8272;font-weight:700">novo na tabela</td>
      </tr>`;
// saiu da fonte única sem unidades: o "antes" é o último preço publicado; não há "agora"
const linhaSaida = m => `
      <tr>
        <td>${m.n}<br><small style="color:#8a8272;font-size:.78em">${m.causa} — ${m.fonte}</small></td>
        <td>${m.c}</td>
        <td class="num">${brl(m.de)}</td>
        <td class="num"><span class="sc">sem unidades</span></td>
        <td class="num" style="color:#8a8272;font-weight:700">saiu da lista</td>
      </tr>`;
const linhaSemTabela = m => `
      <tr>
        <td>${m.n}<br><small style="color:#8a8272;font-size:.78em">${m.causa}</small></td>
        <td>${m.c}</td>
        <td class="num"><span class="sc">—</span></td>
        <td class="num"><span class="sc">sob consulta</span></td>
        <td class="num" style="color:#8a8272;font-weight:700">novo no site, sem tabela</td>
      </tr>`;

const altas = MOVIMENTOS.filter(m => m.para > m.de), quedas = MOVIMENTOS.filter(m => m.para < m.de);
const lista = arr => arr.length <= 1 ? arr.join('') : arr.slice(0, -1).join(', ') + ' e ' + arr[arr.length - 1];
const mcmvTxt = /MCMV/.test(menorApto.t) ? ', enquadrado no Minha Casa Minha Vida (MCMV)' : '';

// Resposta direta (1º parágrafo da página — o que o leitor e a IA pedem primeiro)
const RESPOSTA = `<strong>Resposta direta:</strong> em ${edExtenso}, o lançamento mais barato de Indaiatuba entre os lotes é o ${menorLote.n} (${menorLote.c}), a partir de ${brl(menorLote.p)} por ${menorLote.m2} m², ${tabDe(menorLote)}; entre os apartamentos, o ${menorApto.n} (${menorApto.c}), a partir de ${brl(menorApto.p)}${mcmvTxt}, ${tabDe(menorApto)}. São ${total} empreendimentos monitorados, ${comPrecoTotal} com preço aberto, segundo as tabelas oficiais de ${construtorasComTabela} construtoras e loteadoras, apuradas até ${hojeBR}.`;

const FRASE_APTOS = `Em ${edExtenso}, dos ${APTOS.length} apartamentos na planta monitorados em Indaiatuba, ${aptosComPreco.length} têm preço aberto: o "a partir de" vai de ${brl(menorApto.p)} (${menorApto.n}, ${menorApto.c}) a ${brl(maiorApto.p)} (${maiorApto.n}, ${maiorApto.c}), com média de ${brl(mediaApto)} e mediana de ${brl(medianaApto)}. Pela menor unidade com preço, o metro quadrado vai de ${brl(pm2Min.pm2)} (${pm2Min.n}, ${fm2(pm2Min.m2)} m² por ${brl(pm2Min.p)}) a ${brl(pm2Max.pm2)} (${pm2Max.n}, ${fm2(pm2Max.m2)} m² por ${brl(pm2Max.p)}), com média de ${brl(pm2Medio)} e mediana de ${brl(pm2Mediana)}, nos ${aptosM2.length} empreendimentos cuja tabela identifica a unidade mais barata — segundo as tabelas oficiais de ${construtorasAptoComTabela} construtoras, apuradas até ${hojeBR}.`;
const FRASE_LOTES = `Nos ${LOTES.length} loteamentos e condomínios de lotes com preço aberto, o m² vai de ${brl(m2Min)} (${lotesM2[0].n}) a ${brl(m2Max)} (${lotesM2[lotesM2.length - 1].n}), com média de ${brl(m2Medio)}/m². ${FAIXAS_LOTE_FRASE}`;

// ─── FAQ (vira FAQPage no JSON-LD, gerado das mesmas respostas) ───
const FAQ = [
  { q: 'Qual é o lançamento mais barato de Indaiatuba em ' + edExtenso + '?',
    a: 'Entre os lotes, o ' + menorLote.n + ' (' + menorLote.c + '), a partir de ' + brl(menorLote.p) + ' em lote de ' + menorLote.m2 + ' m², ' + tabDe(menorLote) + '. Entre os apartamentos, o ' + menorApto.n + ' (' + menorApto.c + '), a partir de ' + brl(menorApto.p) + mcmvTxt + ', ' + tabDe(menorApto) + '.' },
  { q: 'Quanto custa o metro quadrado de apartamento na planta em Indaiatuba?',
    a: 'Pela menor unidade com preço de cada empreendimento, nos ' + aptosM2.length + ' apartamentos na planta cuja tabela identifica essa unidade (edição de ' + edLongo + '), o m² vai de ' + brl(pm2Min.pm2) + ' (' + pm2Min.n + ') a ' + brl(pm2Max.pm2) + ' (' + pm2Max.n + '), com média de ' + brl(pm2Medio) + ' e mediana de ' + brl(pm2Mediana) + '. ' + GRUPOS.map(g => g.g + ': ' + (g.n === 1 ? brl(g.min.pm2) + '/m² (' + g.min.n + ')' : 'de ' + brl(g.min.pm2) + ' a ' + brl(g.max.pm2) + '/m², média ' + brl(g.medio))).join('; ') + '. A conta é o preço "a partir de" dividido pela área privativa dessa unidade — não é a média de todas as unidades do empreendimento.' },
  { q: 'Quanto custa o metro quadrado de lote em Indaiatuba?',
    a: 'Nos ' + LOTES.length + ' loteamentos em lançamento monitorados nesta edição, o m² varia de ' + brl(m2Min) + ' (' + lotesM2[0].n + ') a ' + brl(m2Max) + ' (' + lotesM2[lotesM2.length - 1].n + '), com média de ' + brl(m2Medio) + '/m². ' + FAIXAS_LOTE_FRASE + ' A conta é o preço "a partir de" dividido pela área do lote de menor preço da tabela.' },
  { q: 'De onde vêm os preços desta página?',
    a: 'Das tabelas oficiais que as construtoras e loteadoras enviam à Imobiliária Viv\'América, sempre com a data da tabela registrada. O valor exibido é o "a partir de" — o menor preço entre as unidades disponíveis na data da tabela. A página é atualizada mensalmente e os dados saem em CSV e JSON na página Imprensa e dados.' },
  { q: 'Os preços mudam com frequência?',
    a: 'Sim — e é por isso que esta página existe. Na edição de ' + edLongo + ', ' + MOVIMENTOS.length + ' empreendimentos mudaram de preço de entrada (' + altas.length + ' para cima, ' + quedas.length + ' para baixo, de ' + pct(MOVIMENTOS.reduce((a, m) => (m.para - m.de) / m.de < (a.para - a.de) / a.de ? m : a).de, MOVIMENTOS.reduce((a, m) => (m.para - m.de) / m.de < (a.para - a.de) / a.de ? m : a).para) + ' a ' + pct(MOVIMENTOS.reduce((a, m) => (m.para - m.de) / m.de > (a.para - a.de) / a.de ? m : a).de, MOVIMENTOS.reduce((a, m) => (m.para - m.de) / m.de > (a.para - a.de) / a.de ? m : a).para) + ') e ' + ENTRADAS.length + ' entraram no site ou ganharam tabela' + (SAIDAS.length ? '; ' + SAIDAS.length + (SAIDAS.length === 1 ? ' saiu' : ' saíram') + ' da lista, sem unidades' : '') + '. Tabela de lançamento tem validade curta e reajuste por INCC (Índice Nacional de Custo da Construção) ou IGP-M.' },
];

const jsonFaq = JSON.stringify({
  '@context': 'https://schema.org', '@type': 'FAQPage',
  mainEntity: FAQ.map(f => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
});

const DISTRIBUICAO = [
  { '@type': 'DataDownload', name: 'CSV (UTF-8, separador ponto e vírgula)', encodingFormat: 'text/csv', contentUrl: URL_DADOS + ARQ_BASE + '.csv' },
  { '@type': 'DataDownload', name: 'JSON', encodingFormat: 'application/json', contentUrl: URL_DADOS + ARQ_BASE + '.json' },
];
const jsonDataset = JSON.stringify({
  '@context': 'https://schema.org', '@type': 'Dataset',
  name: 'Preços de lançamentos imobiliários em Indaiatuba/SP — ' + EDICAO.mes + ' de ' + EDICAO.ano,
  description: 'Tabela mensal com o preço "a partir de" dos ' + total + ' lançamentos imobiliários de Indaiatuba/SP: apartamentos, loteamentos e condomínios fechados, com preço por m² dos lotes e dos apartamentos (pela menor unidade com preço) e variações mensais. Fonte: tabelas oficiais das construtoras.',
  url: URL,
  temporalCoverage: EDICAO.iso,
  spatialCoverage: { '@type': 'Place', name: 'Indaiatuba, São Paulo, Brasil' },
  creator: { '@type': 'Organization', name: "Imobiliária Viv'América", url: 'https://lancamentos.imoveisvivamerica.com.br/' },
  license: 'https://creativecommons.org/licenses/by/4.0/deed.pt-br',
  isAccessibleForFree: true,
  dateModified: EDICAO.lastmod,
  distribution: DISTRIBUICAO,
});

const jsonBread = JSON.stringify({
  '@context': 'https://schema.org', '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Lançamentos Indaiatuba', item: 'https://lancamentos.imoveisvivamerica.com.br/' },
    { '@type': 'ListItem', position: 2, name: 'Preços ' + EDICAO.mes + '/' + EDICAO.ano, item: URL },
  ],
});

const TITLE = `Preços de Lançamentos em Indaiatuba — Tabela ${EDICAO.mes}/${EDICAO.ano}`;
const DESC = `Tabela de ${edLongo}, sem cadastro: os ${total} lançamentos de Indaiatuba, m² de lote de ${brl(m2Min)} a ${brl(m2Max)}, m² de apartamento e quem mudou de preço na edição.`;
function guardaMeta(nome, t, d) {
  if (t.length > 60) throw new Error(nome + ': title com ' + t.length + ' chars (max 60): ' + t);
  if (d.length < 120 || d.length > 155) throw new Error(nome + ': description com ' + d.length + ' chars (120-155): ' + d);
}
guardaMeta('observatorio', TITLE, DESC);

// CSS das tabelas: a dos apartamentos tem 8 colunas e precisa caber nos 960 px da .wrap
// sem rolagem dentro da caixa no desktop. Por isso o padding lateral de th/td é .7rem e o
// texto das colunas numéricas (.nd: "não informada", "pré-lançamento") pode quebrar.
// Medido em 1366 px: largura mínima da tabela 931 px, com 1rem ela pedia 1063.
// Ao acrescentar coluna ou alargar célula, medir de novo.

const HTML = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<script src="/atrib.js"></script>
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${esc(TITLE)}</title>
<meta name="description" content="${esc(DESC)}">
<link rel="canonical" href="${URL}">
<meta property="og:title" content="${esc(TITLE)}">
<meta property="og:description" content="${esc(DESC)}">
<meta property="og:url" content="${URL}">
<meta property="og:image" content="https://lancamentos.imoveisvivamerica.com.br/images/hero.jpg">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:image" content="https://lancamentos.imoveisvivamerica.com.br/images/hero.jpg">
<meta name="twitter:title" content="${esc(TITLE)}">
<meta name="twitter:description" content="${esc(DESC)}">
<meta property="og:locale" content="pt_BR">
<link rel="icon" type="image/png" href="/favicon.png">
<script type="application/ld+json">${jsonDataset}</script>
<script type="application/ld+json">${jsonFaq}</script>
<script type="application/ld+json">${jsonBread}</script>
<!-- Google Analytics GA4 -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-40C0379NPR"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-40C0379NPR');
  document.addEventListener('click', function(e){
    var a = e.target.closest && e.target.closest('a[href*="wa.me"]');
    if (a) gtag('event', 'whatsapp_click', { event_category: 'contato', page: 'observatorio' });
  });
</script>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Josefin+Sans:wght@300;400;600;700&family=Poiret+One&display=swap" rel="stylesheet">
<style>
  *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
  h1{font-family:'Poiret One',cursive;font-weight:400;letter-spacing:.08em;text-transform:uppercase;line-height:1.25}
  body{font-family:'Josefin Sans',system-ui,sans-serif;color:#161616;background:#F7F5F0;line-height:1.65}
  a{color:#161616}
  .topo{background:#161616;color:#fff;padding:2.6rem 1.2rem 2.2rem}
  .wrap{max-width:1000px;margin:0 auto;padding:0 1.2rem}
  .topo .wrap{padding:0}
  .marca{font-size:.68rem;letter-spacing:.4em;text-transform:uppercase;color:#C9A227;font-weight:700}
  .marca a{color:#fff;text-decoration:none}
  h1{font-size:clamp(1.6rem,4.5vw,2.4rem);font-weight:800;line-height:1.15;margin:.6rem 0 .5rem;letter-spacing:-.02em}
  h1 em{font-style:normal;color:#C9A227}
  .lede{max-width:70ch;opacity:.92;font-size:1.02rem}
  .lede strong{color:#C9A227}
  .lede a{color:#fff}
  .procedencia{max-width:70ch;opacity:.8;font-size:.86rem;margin-top:.6rem}
  .procedencia a{color:#C9A227}
  .atualizado{display:inline-block;margin-top:1rem;font-size:.78rem;letter-spacing:.12em;text-transform:uppercase;
    background:rgba(201,168,76,.16);border:1px solid rgba(201,168,76,.45);color:#C9A227;
    border-radius:99px;padding:.35rem 1rem;font-weight:700}

  .tiles{display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:1rem;margin:-1.6rem auto 2.4rem;max-width:1000px;padding:0 1.2rem}
  .tile{background:#fff;border:1px solid #e3ddcd;border-radius:12px;padding:1.1rem 1.2rem;box-shadow:0 6px 18px rgba(15,28,41,.06);min-width:0}
  .tile b{display:block;font-size:1.35rem;font-weight:800;color:#161616;font-variant-numeric:tabular-nums}
  .tile span{font-size:.72rem;letter-spacing:.08em;text-transform:uppercase;color:#8a8272;font-weight:700}

  h2{font-size:1.35rem;font-weight:800;margin:2.6rem 0 .4rem;letter-spacing:-.01em}
  h2 small{font-weight:600;font-size:.85rem;color:#8a8272;margin-left:.5rem}
  .sub{color:#6b6559;font-size:.92rem;margin-bottom:1rem;max-width:75ch}
  .frase{background:#fff;border:1px solid #e3ddcd;border-left:4px solid #C9A227;border-radius:0 12px 12px 0;padding:1rem 1.2rem;margin:.8rem 0 1.2rem;max-width:80ch;font-size:.95rem}

  .tabela-wrap{overflow-x:auto;background:#fff;border:1px solid #e3ddcd;border-radius:12px;margin-bottom:1.2rem}
  table{width:100%;border-collapse:collapse;font-size:.92rem;min-width:640px}
  caption{caption-side:top;text-align:left;font-size:.8rem;color:#6b6559;padding:.8rem .7rem .4rem;font-weight:600}
  th{text-align:left;font-size:.7rem;letter-spacing:.1em;text-transform:uppercase;color:#8a8272;
    padding:.8rem .7rem;border-bottom:2px solid #161616;background:#F7F5F0}
  td{padding:.7rem .7rem;border-bottom:1px solid #eee9db;vertical-align:top}
  tr:last-child td{border-bottom:none}
  td a{font-weight:700;text-decoration:none;border-bottom:1px solid #C9A227}
  td.num{white-space:nowrap;font-variant-numeric:tabular-nums}
  td.obs{color:#6b6559;font-size:.84rem;max-width:34ch}
  .sc{color:#a15e2c;font-weight:700}
  .nd{color:#8a8272}
  td.num .nd{white-space:normal}
  .sobe{color:#b23a3a;font-weight:800}
  .desce{color:#2e7d4f;font-weight:800}
  .resumo table{min-width:0}
  .resumo td:first-child{font-weight:600;width:38%}

  .faq{margin-top:1rem}
  .faq details{background:#fff;border:1px solid #e3ddcd;border-radius:10px;margin-bottom:.6rem;padding:1rem 1.2rem}
  .faq summary{font-weight:700;cursor:pointer}
  .faq p{margin-top:.6rem;color:#4a4a42;max-width:75ch}

  .metodo{background:#f2efe6;border-left:4px solid #C9A227;border-radius:0 10px 10px 0;
    padding:1.2rem 1.4rem;margin:2.4rem 0;font-size:.92rem;color:#4a4a42}
  .metodo b{color:#161616}
  .dados{background:#161616;color:#fff;border-radius:12px;padding:1.2rem 1.4rem;margin:1.6rem 0;display:flex;flex-wrap:wrap;gap:.8rem 1.4rem;align-items:center;justify-content:space-between}
  .dados p{margin:0;max-width:60ch;font-size:.95rem}
  .dados a.btn-dados{background:#C9A227;color:#161616;font-weight:800;text-decoration:none;border-radius:8px;padding:.7rem 1.2rem;white-space:nowrap;font-size:.86rem;letter-spacing:.05em;text-transform:uppercase}

  .cta{background:#161616;border-radius:14px;color:#fff;text-align:center;padding:2.2rem 1.4rem;margin:2.6rem 0}
  .cta p{opacity:.85;max-width:52ch;margin:0 auto .5rem}
  .cta strong{font-size:1.25rem;display:block;margin-bottom:.9rem}
  .cta a.btn{display:inline-block;background:#25D366;color:#fff;font-weight:800;text-decoration:none;
    border-radius:10px;padding:.95rem 1.8rem;margin-top:.4rem}
  footer{text-align:center;color:#8a8272;font-size:.8rem;padding:2rem 1rem 3rem}
  footer a{color:#8a8272}
</style>
  ${MENU_CSS}
</head>
<body>
${MENU_HTML}

<div class="topo">
  <div class="wrap">
    <p class="marca"><a href="/">Imobiliária Viv'América</a> · Observatório de Lançamentos</p>
    <h1>Preços de lançamentos em Indaiatuba<br><em>${EDICAO.mes} de ${EDICAO.ano}</em></h1>
    <p class="lede">${RESPOSTA}</p>
    <p class="procedencia">Preço "a partir de" aberto, sem cadastro e sem formulário. Dados das tabelas oficiais das construtoras, atualizados todo mês, com a variação de quem subiu e de quem baixou. Os dados desta edição estão disponíveis em <a href="/imprensa-e-dados/">CSV e JSON, com o release</a>. Responsável: Fabio Correia, CRECI 303686-F.</p>
    <span class="atualizado">Edição de ${edLongo} · atualizada em ${hojeBR}</span>
  </div>
</div>

<div class="tiles">
  <div class="tile"><b>${total}</b><span>Lançamentos monitorados</span></div>
  <div class="tile"><b>${brl(menorLote.p)}</b><span>Menor entrada (lote)</span></div>
  <div class="tile"><b>${brl(menorApto.p)}</b><span>Apto mais barato (MCMV — Minha Casa Minha Vida)</span></div>
  <div class="tile"><b>${brl(m2Medio)}/m²</b><span>Média do m² de lote</span></div>
  <div class="tile"><b>${brl(pm2Medio)}/m²</b><span>Média do m² de apartamento (menor unidade com preço)</span></div>
</div>

<div class="wrap">

  <h2 id="apartamentos">Apartamentos na planta em Indaiatuba — ${edAbrev} <small>${APTOS.length} empreendimentos · ${aptosComPreco.length} com preço</small></h2>
  <p class="frase">${FRASE_APTOS}</p>
  <div class="tabela-wrap resumo">
    <table>
      <caption>Resumo dos apartamentos na planta em Indaiatuba — tabelas oficiais, edição de ${edLongo} (apurada em ${hojeBR}). R$/m² calculado pela menor unidade com preço de cada empreendimento.</caption>
      <thead><tr><th>Indicador</th><th>Valor</th><th>Empreendimento</th></tr></thead>
      <tbody>
        <tr><td>Empreendimentos monitorados</td><td class="num"><strong>${APTOS.length}</strong></td><td>${aptosComPreco.length} com preço aberto${aptosSemPreco.length ? '; ' + aptosSemPreco.length + ' sob consulta (' + lista(aptosSemPreco.map(e => e.n)) + ')' : ''}</td></tr>
        <tr><td>Menor "a partir de"</td><td class="num"><strong>${brl(menorApto.p)}</strong></td><td><a href="/${menorApto.slug}/">${menorApto.n}</a> (${menorApto.c})</td></tr>
        <tr><td>Maior "a partir de"</td><td class="num"><strong>${brl(maiorApto.p)}</strong></td><td><a href="/${maiorApto.slug}/">${maiorApto.n}</a> (${maiorApto.c})</td></tr>
        <tr><td>Média do "a partir de"</td><td class="num"><strong>${brl(mediaApto)}</strong></td><td>${aptosComPreco.length} empreendimentos com preço</td></tr>
        <tr><td>Mediana do "a partir de"</td><td class="num"><strong>${brl(medianaApto)}</strong></td><td>${aptosComPreco.length} empreendimentos com preço</td></tr>
        <tr><td>Menor R$/m² (menor unidade com preço)</td><td class="num"><strong>${brl(pm2Min.pm2)}/m²</strong></td><td><a href="/${pm2Min.slug}/">${pm2Min.n}</a> — ${fm2(pm2Min.m2)} m² por ${brl(pm2Min.p)}</td></tr>
        <tr><td>Maior R$/m² (menor unidade com preço)</td><td class="num"><strong>${brl(pm2Max.pm2)}/m²</strong></td><td><a href="/${pm2Max.slug}/">${pm2Max.n}</a> — ${fm2(pm2Max.m2)} m² por ${brl(pm2Max.p)}</td></tr>
        <tr><td>Média e mediana do R$/m²</td><td class="num"><strong>${brl(pm2Medio)}</strong> · ${brl(pm2Mediana)}</td><td>${aptosM2.length} empreendimentos com a unidade mais barata identificada na tabela${aptosSemM2.length ? '; sem área informada: ' + lista(aptosSemM2.map(e => e.n)) : ''}</td></tr>${GRUPOS.map(g => `
        <tr><td>R$/m² — ${g.g}</td><td class="num"><strong>${g.n === 1 ? brl(g.min.pm2) : brl(g.min.pm2) + ' a ' + brl(g.max.pm2)}</strong>${g.n > 1 ? ' · média ' + brl(g.medio) : ''}</td><td>${g.n} empreendimento${g.n === 1 ? '' : 's'}: ${g.n === 1 ? g.min.n : g.min.n + ' (menor) e ' + g.max.n + ' (maior)'}</td></tr>`).join('')}
      </tbody>
    </table>
  </div>
  <div class="tabela-wrap">
    <table>
      <caption>Os ${APTOS.length} apartamentos na planta em Indaiatuba, do menor ao maior "a partir de" — tabelas oficiais das construtoras, edição de ${edLongo}. "Menor unidade" = área privativa da unidade mais barata da tabela; R$/m² = preço ÷ essa área.</caption>
      <thead><tr><th>Empreendimento</th><th>Construtora</th><th>Faixa</th><th>Menor unidade</th><th>A partir de</th><th>R$/m²</th><th>Tabela</th><th>Características</th></tr></thead>
      <tbody>${aptosComPreco.concat(aptosSemPreco).map(linhaApto).join('')}
      </tbody>
    </table>
  </div>

  <h2 id="lotes">Lotes e condomínios fechados <small>${LOTES.length} loteamentos · com preço por m²</small></h2>
  <p class="frase">${FRASE_LOTES}</p>
  <div class="tabela-wrap">
    <table>
      <caption>Os ${LOTES.length} loteamentos e condomínios de lotes em Indaiatuba, do menor ao maior R$/m² — tabelas oficiais das loteadoras, edição de ${edLongo}. "Lote de menor preço" = área do lote mais barato da tabela, que nem sempre é o menor; R$/m² = preço "a partir de" ÷ essa área.</caption>
      <thead><tr><th>Loteamento</th><th>Loteadora</th><th>Tipo</th><th>Lote de menor preço</th><th>A partir de</th><th>Preço/m²</th><th>Tabela</th></tr></thead>
      <tbody>${lotesM2.map(linhaLote).join('')}
      </tbody>
    </table>
  </div>

  <h2 id="mudou">Preço de entrada: o que mudou <small>entre a ${edAnterior} e a de ${edLongo}</small></h2>
  <p class="sub">Só entram aqui variações confirmadas entre duas tabelas oficiais <b>do mesmo tipo</b>
  (quando a construtora comunica valores novos por unidade fora da tabela padrão, a linha diz) —
  o valor acompanhado é o <b>preço de entrada</b> ("a partir de") — ele muda por reajuste
  de tabela ou porque a unidade de menor preço saiu da tabela (ou outra entrou), e a causa está dita em cada linha.
  Nesta edição: ${MOVIMENTOS.length} mudança${MOVIMENTOS.length === 1 ? '' : 's'} de preço (${altas.length} alta${altas.length === 1 ? '' : 's'}, ${quedas.length} queda${quedas.length === 1 ? '' : 's'}), ${ENTRADAS.length} empreendimento${ENTRADAS.length === 1 ? '' : 's'} com tabela nova no site${SEM_TABELA.length ? ', ' + SEM_TABELA.length + ' sem tabela pública' : ''}${SAIDAS.length ? ' e ' + SAIDAS.length + (SAIDAS.length === 1 ? ' que saiu' : ' que saíram') + ' da lista, sem unidades' : ''}.</p>
  <div class="tabela-wrap">
    <table>
      <caption>Movimentação do preço de entrada — edição de ${edLongo}, apurada em ${hojeBR}.</caption>
      <thead><tr><th>Empreendimento</th><th>Construtora</th><th>Antes</th><th>Agora</th><th>Variação</th></tr></thead>
      <tbody>${MOVIMENTOS.map(linhaMov).join('')}${ENTRADAS.map(linhaEntrada).join('')}${SEM_TABELA.map(linhaSemTabela).join('')}${SAIDAS.map(linhaSaida).join('')}
      </tbody>
    </table>
  </div>

  <h2 id="estoque">Estoque e ritmo de vendas <small>unidades disponíveis nos empreendimentos com relatório oficial de estoque</small></h2>
  <p class="sub">O "antes e depois" de cada empreendimento: quantas unidades havia na medição
  anterior, quantas há agora e quantas saíram da lista. Cada número traz a data do relatório
  ou da tabela, porque o intervalo entre as duas medições não é o mesmo em todos${basesEstoque ? ' (as medições anteriores vão ' + basesEstoque + ')' : ''}.
  A coluna "No período" mostra quantas unidades saíram da lista de disponíveis entre as duas
  medições; sair da lista não é venda confirmada (pode ser reserva). Quando a incorporadora informa
  o motivo, ou quando entram lotes na lista, a linha diz. Onde consta "1ª medição",
  ainda não há série anterior; onde a fonte não foi remedida no mês, o número repete e a coluna
  fica em "sem remedição".</p>
  <div class="tabela-wrap">
    <table>
      <caption>Estoque por empreendimento — o número da medição anterior e o desta edição (${edLongo}), cada um com a data do relatório ou da tabela de origem.</caption>
      <thead><tr><th>Empreendimento</th><th>Construtora</th><th>Estoque atual</th><th>Medição anterior</th><th>No período</th></tr></thead>
      <tbody>${SAIDAS.map(linhaEstSaida).join('')}${comEst.slice().sort((a, b) => a.est - b.est).map(linhaEst).join('')}
      </tbody>
    </table>
  </div>

  <div class="dados">
    <p><b>Dados abertos.</b> Baixe os dados desta edição (CSV/JSON, licença CC BY 4.0), os gráficos e o release para imprensa.</p>
    <a class="btn-dados" href="/imprensa-e-dados/">Baixar os dados e o release</a>
  </div>

  <div class="metodo">
    <b>Metodologia.</b> Os valores vêm das tabelas de preço oficiais que construtoras e
    loteadoras enviam à Imobiliária Viv'América, com a data de cada tabela registrada.
    O preço exibido é o <b>"a partir de"</b> — o menor preço entre as unidades disponíveis na data
    da tabela — e pode variar conforme unidade, andar e condição de pagamento. O <b>R$/m² de apartamento</b>
    é o preço "a partir de" dividido pela área privativa da unidade que tem esse preço, só nos empreendimentos
    cuja tabela identifica qual é; não é a média de todas as unidades. Nos <b>lotes</b>, a conta usa a área
    do lote de menor preço, que nem sempre é o menor lote da tabela.
    "Sob consulta" indica empreendimento cuja tabela a construtora ainda não liberou para publicação.
    Esta página é atualizada <b>uma vez por mês</b>; a data da edição vigente está no topo.
  </div>

  <h2>Perguntas frequentes</h2>
  <div class="faq">
${FAQ.map(f => `    <details><summary>${f.q}</summary><p>${f.a}</p></details>`).join('\n')}
  </div>

  <div class="cta">
    <strong>Quer a tabela completa de algum empreendimento?</strong>
    <p>Unidade por unidade, com condições de pagamento e simulação — é só chamar.</p>
    <a class="btn" href="https://wa.me/5519989769457?text=Ol%C3%A1!%20Vi%20o%20Observat%C3%B3rio%20de%20Pre%C3%A7os%20e%20quero%20a%20tabela%20completa%20de%20um%20empreendimento." target="_blank" rel="noopener">Falar no WhatsApp</a>
  </div>

</div>

<!-- AUTORIA (07/09/2026): quem responde pelo conteúdo -->
<aside class="autoria" aria-label="Quem responde por este conteúdo">
  <img src="/images/fabio-correia.jpg" srcset="/images/fabio-correia-2x.jpg 2x" width="96" height="96" alt="Fabio Correia, CRECI 303686-F, Imobiliária Viv'América" loading="lazy">
  <div>
    <p class="autoria-titulo">Quem responde por este conteúdo</p>
    <p><strong>Fabio Correia</strong> · CRECI 303686-F · <a href="/sobre/">Imobiliária Viv'América</a></p>
    <p>À frente da Imobiliária Viv'América em Indaiatuba desde 2023. Acompanha todo mês as tabelas das incorporadoras e responde pelo conteúdo deste site.</p>
  </div>
</aside>
<style>
  .autoria{display:flex;gap:1.1rem;align-items:flex-start;margin:2rem auto 0;padding:1.1rem 1.25rem;border:1px solid rgba(0,0,0,.1);background:#F7F5F0;border-radius:8px;max-width:860px}
  .autoria img{width:96px;height:96px;border-radius:50%;object-fit:cover;flex:0 0 96px}
  .autoria p{margin:0 0 .35rem;font-size:.95rem;line-height:1.5}
  .autoria .autoria-titulo{font-size:.7rem;letter-spacing:.14em;text-transform:uppercase;opacity:.7}
  @media (max-width:480px){.autoria{flex-direction:column}}
</style>

<footer>
  Imobiliária Viv'América · Indaiatuba/SP · (19) 98976-9457 ·
  <a href="/">todos os lançamentos</a> ·
  <a href="/apartamentos-na-planta-indaiatuba/">apartamentos na planta</a> ·
  <a href="/loteamentos-em-indaiatuba/">loteamentos</a> ·
  <a href="/condominios-fechados-indaiatuba/">condomínios fechados</a> ·
  <a href="/imprensa-e-dados/">imprensa e dados</a>
<p class="nap">Imobiliária Viv'América · CRECI 47394-J · Av. Higienópolis, 70 – Jardim União, Indaiatuba/SP · <a href="https://wa.me/5519989769457">(19) 98976-9457</a> · <a href="/sobre/">Sobre a imobiliária</a> · <a href="https://imoveisvivamerica.com.br/politica-de-privacidade">Política de Privacidade</a></p>
</footer>
</body>
</html>`;

fs.mkdirSync(R + 'precos-lancamentos-indaiatuba', { recursive: true });
fs.writeFileSync(R + 'precos-lancamentos-indaiatuba/index.html', HTML, 'utf8');

/* ═══════════════════════════════════════════════════════════════════
   DADOS ABERTOS — imprensa-e-dados/ (CSV + JSON + página com gráficos)
   ═══════════════════════════════════════════════════════════════════ */
const fonteDe = e => e.p
  ? (e.tab ? 'tabela oficial da incorporadora, ' + mesLongoDe(e.tab) + (e.conf ? ', com os preços confirmados para ' + mesLongoDe(e.conf) : '') : 'tabela de pré-lançamento da incorporadora')
  : 'sob consulta — tabela não liberada pela incorporadora';
const registro = (e, tipo) => ({
  nome: e.n, tipo, incorporadora: e.c,
  preco_a_partir_de: e.p || null,
  m2_menor_unidade: e.p && e.m2 ? e.m2 : null,
  preco_m2: e.p && e.m2 ? Math.round(e.p / e.m2) : null,
  mes_tabela: e.tab || null,
  estoque: typeof e.est === 'number' ? e.est : null,
  data_estoque: typeof e.est === 'number' ? (dataIsoDe(estEmDe(e)) || estEmDe(e) || null) : null,
  spec: e.s,
  url: 'https://lancamentos.imoveisvivamerica.com.br/' + e.slug + '/',
  fonte: fonteDe(e),
});
const REGISTROS = APTOS.map(e => registro(e, 'apartamento')).concat(LOTES.map(e => registro(e, 'lote')));
const COLUNAS = ['nome', 'tipo', 'incorporadora', 'preco_a_partir_de', 'm2_menor_unidade', 'preco_m2', 'mes_tabela', 'estoque', 'data_estoque', 'spec', 'url', 'fonte'];
const campoCsv = v => { if (v === null || v === undefined) return ''; const s = String(v); return /[;"\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; };
const CSV = [COLUNAS.join(';')].concat(REGISTROS.map(r => COLUNAS.map(c => campoCsv(r[c])).join(';'))).join('\n') + '\n';
fs.mkdirSync(R + 'imprensa-e-dados', { recursive: true });
fs.writeFileSync(R + 'imprensa-e-dados/' + ARQ_BASE + '.csv', CSV, 'utf8');
fs.writeFileSync(R + 'imprensa-e-dados/' + ARQ_BASE + '.json', JSON.stringify(REGISTROS, null, 2) + '\n', 'utf8');
const temporal = REGISTROS.map(r => r.mes_tabela).filter(Boolean).sort()[0] + '/' + EDICAO.iso;

// ─── gráficos de barras horizontais (SVG estático, mesma geometria em todos) ───
function grafico({ id, titulo, sub, itens, passo, fmtEixo, rowH = 36, leitura, tabela }) {
  const W = 700, L = 200, LARG = 370, TOP = 14;
  const maxV = Math.max(...itens.map(i => i.valor));
  const maxEixo = passo * (Math.floor(maxV / passo) + 1);
  const H = TOP + rowH * itens.length + 34;
  const x = v => L + LARG * v / maxEixo;
  let ticks = '';
  for (let k = passo; k <= maxEixo; k += passo) ticks += `\n  <line x1="${x(k).toFixed(1)}" y1="${TOP}" x2="${x(k).toFixed(1)}" y2="${TOP + rowH * itens.length}" stroke="#e3ddcd" stroke-width="1"/>\n  <text x="${x(k).toFixed(1)}" y="${H - 12}" text-anchor="middle" font-size="12" fill="#6b6559">${fmtEixo(k)}</text>`;
  const barras = itens.map((it, i) => {
    const y = TOP + rowH * i, yb = y + Math.round((rowH - 20) / 2), w = Math.max(LARG * it.valor / maxEixo, 4);
    return `
  <g>
    <title>${esc(it.title)}</title>
    <rect x="0" y="${y}" width="${W}" height="${rowH}" fill="transparent"/>
    <path d="M${L},${yb} h${(w - 4).toFixed(1)} a4,4 0 0 1 4,4 v12 a4,4 0 0 1 -4,4 h-${(w - 4).toFixed(1)} z" fill="#C9A227"/>
    <text x="${L - 10}" y="${yb + 10}" dy="0.35em" text-anchor="end" font-size="14" fill="#161616">${esc(it.rotulo)}</text>
    <text x="${(L + w + 8).toFixed(1)}" y="${yb + 10}" dy="0.35em" font-size="13" font-weight="600" fill="#161616">${it.texto}</text>
  </g>`;
  }).join('');
  const desc = itens.map(i => i.rotulo + ' ' + i.descValor).join('; ');
  return `
    <figure class="grafico" id="${id}">
      <h3>${titulo}</h3>
      <p class="sub">${sub}</p>
      <div class="grafico-wrap"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" role="img" aria-labelledby="${id}-t ${id}-d" font-family="'Josefin Sans', system-ui, sans-serif">
  <title id="${id}-t">${esc(titulo)}</title>
  <desc id="${id}-d">${esc(desc)}.</desc>
  <rect x="0" y="0" width="${W}" height="${H}" fill="#F7F5F0"/>
  <text x="${L}" y="${H - 12}" text-anchor="middle" font-size="12" fill="#6b6559">0</text>${ticks}
  <line x1="${L}" y1="${TOP}" x2="${L}" y2="${TOP + rowH * itens.length}" stroke="#161616" stroke-width="1"/>${barras}
</svg></div>
      <p class="leitura">${leitura}</p>
      <details class="tabela-twin"><summary>Ver como tabela</summary><div class="tabela-wrap">${tabela}</div></details>
    </figure>`;
}
const fmtMil = v => v >= 1e6 ? 'R$ ' + (v / 1e6).toFixed(1).replace('.', ',') + ' mi' : 'R$ ' + Math.round(v / 1000) + ' mil';

// 1. R$/m² de lote
const lotesDesc = lotesM2.slice().reverse();
const G1 = grafico({
  id: 'grafico-m2-lote',
  titulo: `Preço do m² de lote por loteamento — ${edLongo}`,
  sub: `Preço "a partir de" dividido pela área do lote de menor preço da tabela, em R$/m². Os ${LOTES.length} loteamentos e condomínios fechados do Observatório.`,
  itens: lotesDesc.map(l => ({ rotulo: l.n, valor: l.pm2, texto: brl(l.pm2) + '/m²', descValor: brl(l.pm2) + '/m²', title: `${l.n} (${l.c}) · lote de ${l.m2.toLocaleString('pt-BR')} m² · ${brl(l.p)} · ${brl(l.pm2)}/m²` })),
  passo: 500, fmtEixo: v => brl(v),
  leitura: `Em ${edLongo} o m² de lote em Indaiatuba vai de ${brl(m2Min)} (${lotesM2[0].n}) a ${brl(m2Max)} (${lotesM2[lotesM2.length - 1].n}); a média dos ${LOTES.length} loteamentos é ${brl(m2Medio)}/m². ${FAIXAS_LOTE_FRASE}`,
  tabela: `<table>
<thead><tr><th>Loteamento</th><th>Loteadora</th><th class="num">Lote de menor preço</th><th class="num">A partir de</th><th class="num">R$/m²</th></tr></thead>
<tbody>
${lotesDesc.map(l => `<tr><td><a href="/${l.slug}/">${l.n}</a></td><td>${l.c}</td><td class="num">${l.m2.toLocaleString('pt-BR')} m²</td><td class="num">${brl(l.p)}</td><td class="num">${brl(l.pm2)}</td></tr>`).join('\n')}
<tr><td colspan="4"><strong>Média dos ${LOTES.length} loteamentos</strong></td><td class="num"><strong>${brl(m2Medio)}</strong></td></tr>
</tbody></table>`,
});

// 2. apartamentos por faixa de preço
const FAIXAS = [
  { r: 'até R$ 300 mil', f: e => e.p <= 300000 },
  { r: 'R$ 300 mil a R$ 600 mil', f: e => e.p > 300000 && e.p <= 600000 },
  { r: 'acima de R$ 600 mil', f: e => e.p > 600000 },
].map(x => Object.assign({ its: aptosComPreco.filter(x.f) }, x));
const G2 = grafico({
  id: 'grafico-faixas-apartamentos',
  titulo: `Apartamentos por faixa de preço "a partir de" — ${edLongo}`,
  sub: `Quantos empreendimentos têm o menor preço da tabela em cada faixa. Dos ${APTOS.length} apartamentos monitorados, ${aptosComPreco.length} têm tabela publicada.`,
  itens: FAIXAS.map(x => ({ rotulo: x.r, valor: x.its.length, texto: x.its.length + (x.its.length === 1 ? ' empreendimento' : ' empreendimentos'), descValor: '= ' + x.its.length, title: x.r + ': ' + x.its.map(e => e.n).join(', ') })),
  passo: 2, fmtEixo: v => String(v), rowH: 44,
  leitura: `Dos ${aptosComPreco.length} apartamentos com tabela publicada em ${edLongo}, ${FAIXAS[1].its.length} têm preço de entrada entre R$ 300 mil e R$ 600 mil; ${FAIXAS[0].its.length === 1 ? 'só o ' + FAIXAS[0].its[0].n + ' (' + brl(FAIXAS[0].its[0].p) + ') fica' : FAIXAS[0].its.length + ' ficam'} abaixo de R$ 300 mil, ${FAIXAS[2].its.length} começam acima de R$ 600 mil${aptosSemPreco.length ? ' e ' + lista(aptosSemPreco.map(e => 'o ' + e.n)) + (aptosSemPreco.length === 1 ? ' segue' : ' seguem') + ' sob consulta' : ''}.`,
  tabela: `<table>
<thead><tr><th>Faixa do preço de entrada</th><th class="num">Empreendimentos</th><th>Quais</th></tr></thead>
<tbody>
${FAIXAS.map(x => `<tr><td>${x.r}</td><td class="num">${x.its.length}</td><td>${x.its.map(e => `<a href="/${e.slug}/">${e.n}</a> (${brl(e.p)})`).join(', ')}</td></tr>`).join('\n')}
<tr><td>sem tabela publicada</td><td class="num">${aptosSemPreco.length}</td><td>${aptosSemPreco.map(e => `<a href="/${e.slug}/">${e.n}</a> (sob consulta)`).join(', ')}</td></tr>
</tbody></table>`,
});

// 3. menor entrada por incorporadora
const porInc = {};
todos.filter(e => e.p).forEach(e => { if (!porInc[e.c] || e.p < porInc[e.c].p) porInc[e.c] = e; });
const INCS = Object.values(porInc).sort((a, b) => a.p - b.p);
const tipoDe = e => LOTES.includes(e) ? 'lote' : 'apartamento';
const incMenorApto = INCS.filter(e => tipoDe(e) === 'apartamento')[0];
const G3 = grafico({
  id: 'grafico-menor-preco-incorporadora',
  titulo: `Menor preço de entrada por incorporadora — ${edLongo}`,
  sub: `O menor preço "a partir de" entre todos os empreendimentos de cada incorporadora ou loteadora, apartamentos e lotes juntos. A etiqueta ao lado do valor diz se é lote ou apartamento.`,
  itens: INCS.map(e => ({ rotulo: e.c, valor: e.p, texto: brl(e.p) + '<tspan font-weight="400" fill="#6b6559"> · ' + (tipoDe(e) === 'lote' ? 'lote' : 'apto') + '</tspan>', descValor: brl(e.p) + ' (' + e.n + ')', title: `${e.c}: ${brl(e.p)} — ${e.n} (${tipoDe(e)})` })),
  passo: 500000, fmtEixo: fmtMil,
  leitura: `Entre as ${INCS.length} incorporadoras e loteadoras com tabela publicada em ${edLongo}, o menor preço de entrada é o da ${INCS[0].c} (${brl(INCS[0].p)}, ${tipoDe(INCS[0])} no ${INCS[0].n}); em apartamentos, a ${incMenorApto.c} tem o menor preço de entrada (${brl(incMenorApto.p)}, ${incMenorApto.n}), enquanto ${INCS[INCS.length - 2].c} e ${INCS[INCS.length - 1].c} começam em ${brl(INCS[INCS.length - 2].p)} e ${brl(INCS[INCS.length - 1].p)}.`,
  tabela: `<table>
<thead><tr><th>Incorporadora</th><th class="num">Menor preço de entrada</th><th>Empreendimento</th><th>Tipo</th></tr></thead>
<tbody>
${INCS.map(e => `<tr><td>${e.c}</td><td class="num">${brl(e.p)}</td><td><a href="/${e.slug}/">${e.n}</a></td><td>${tipoDe(e)}</td></tr>`).join('\n')}
</tbody></table>`,
});

// 4. R$/m² de apartamento pela menor unidade com preço
const aptosM2Desc = aptosM2.slice().reverse();
const G4 = grafico({
  id: 'grafico-m2-apartamento',
  titulo: `Preço do m² de apartamento na planta, pela menor unidade com preço — ${edLongo}`,
  sub: `Preço "a partir de" dividido pela área privativa da unidade mais barata da tabela. Só os ${aptosM2.length} empreendimentos cuja tabela identifica essa unidade${aptosSemM2.length ? ' (fora: ' + lista(aptosSemM2.map(e => e.n)) + ', sem área informada)' : ''}.`,
  itens: aptosM2Desc.map(e => ({ rotulo: e.n, valor: e.pm2, texto: brl(e.pm2) + '/m²', descValor: brl(e.pm2) + '/m²', title: `${e.n} (${e.c}) · ${fm2(e.m2)} m² · ${brl(e.p)} · ${brl(e.pm2)}/m² · ${e.t}` })),
  passo: 2000, fmtEixo: v => brl(v),
  leitura: `Pela menor unidade com preço, o m² de apartamento na planta em Indaiatuba vai de ${brl(pm2Min.pm2)} (${pm2Min.n}, ${fm2(pm2Min.m2)} m² por ${brl(pm2Min.p)}) a ${brl(pm2Max.pm2)} (${pm2Max.n}, ${fm2(pm2Max.m2)} m² por ${brl(pm2Max.p)}); média de ${brl(pm2Medio)} e mediana de ${brl(pm2Mediana)} em ${aptosM2.length} empreendimentos. ${GRUPOS.map(g => g.g + ': ' + (g.n === 1 ? brl(g.min.pm2) + '/m²' : brl(g.min.pm2) + ' a ' + brl(g.max.pm2) + '/m², média ' + brl(g.medio))).join('; ')}.`,
  tabela: `<table>
<thead><tr><th>Empreendimento</th><th>Construtora</th><th>Faixa</th><th class="num">Menor unidade</th><th class="num">A partir de</th><th class="num">R$/m²</th></tr></thead>
<tbody>
${aptosM2Desc.map(e => `<tr><td><a href="/${e.slug}/">${e.n}</a></td><td>${e.c}</td><td>${e.t}</td><td class="num">${fm2(e.m2)} m²</td><td class="num">${brl(e.p)}</td><td class="num">${brl(e.pm2)}</td></tr>`).join('\n')}
<tr><td colspan="5"><strong>Média dos ${aptosM2.length} empreendimentos</strong> (mediana ${brl(pm2Mediana)})</td><td class="num"><strong>${brl(pm2Medio)}</strong></td></tr>
</tbody></table>`,
});

// release: contexto e estoque gerados dos mesmos dados. Cada linha de estoque leva as duas
// datas (a da medição anterior e a da atual) e a nota: o intervalo muda de um para outro.
const estoqueItens = comEstAnterior.map(e => {
  const ant = ESTOQUE_ANTERIOR[e.slug], v = ant.n - e.est, em = estEmDe(e);
  const de = ant.n + ' ' + unidadeDe(e, ant.n) + ' (' + ant.data + ')';
  const para = e.est + (em ? ' (' + em + ')' : ' nesta edição');
  const nota = ant.nota ? ' (' + ant.nota + ')' : '';
  const txt = v > 0 ? `de ${de} para ${para} — ${v} ${saidaDe(e, ant, v)}${nota}`
    : v < 0 ? `de ${de} para ${para} — ${ant.nota || (-v) + ' a mais na lista de disponíveis'}`
    : em && em !== ant.data ? `${e.est} ${unidadeDe(e, e.est)} em ${ant.data} e em ${em}, sem mudança${nota}`
    : `${e.est} ${unidadeDe(e, e.est)} (${ant.data}), sem medição nova nesta edição${nota}`;
  return `      <li><strong>${e.n}</strong>: ${txt}.</li>`;
});
SAIDAS.forEach(m => estoqueItens.unshift(`      <li><strong>${m.n}</strong>: de ${m.antes} unidades (${m.data}) para 0 (${m.em}) — ${m.antes} a menos na lista (${m.causa}).</li>`));
const entrouNoSite = ENTRADAS.filter(m => !m.tabelaNova), ganhouTabela = ENTRADAS.filter(m => m.tabelaNova);
const CONTEXTO = `Na edição de ${edLongo}, o Observatório acompanha ${total} lançamentos imobiliários em Indaiatuba/SP (${APTOS.length} apartamentos e ${LOTES.length} loteamentos e condomínios de lotes), ${comPrecoTotal} com preço aberto. O menor preço de entrada entre os lotes é o do ${menorLote.n} (${menorLote.c}), ${brl(menorLote.p)} por um lote de ${menorLote.m2} m²; entre os apartamentos, o do ${menorApto.n} (${menorApto.c}), ${brl(menorApto.p)}${mcmvTxt}. Entre os ${aptosComPreco.length} apartamentos com preço, o "a partir de" vai até ${brl(maiorApto.p)} (${maiorApto.n}), com média de ${brl(mediaApto)} e mediana de ${brl(medianaApto)}; pela menor unidade com preço, o m² vai de ${brl(pm2Min.pm2)} (${pm2Min.n}) a ${brl(pm2Max.pm2)} (${pm2Max.n}), média de ${brl(pm2Medio)}, em ${aptosM2.length} empreendimentos. Das ${MOVIMENTOS.length} variações de preço de entrada confirmadas em documentos oficiais das construtoras, ${altas.length} ${altas.length === 1 ? 'é alta' : 'são altas'} (${lista(altas.map(m => m.n + ', ' + pct(m.de, m.para)))}) e ${quedas.length} ${quedas.length === 1 ? 'é queda' : 'são quedas'} (${lista(quedas.map(m => m.n + ', ' + pct(m.de, m.para)))}). ${entrouNoSite.length} empreendimentos entraram no site nesta edição com tabela (${lista(entrouNoSite.map(m => m.n))})${ganhouTabela.length ? ', e ' + lista(ganhouTabela.map(m => 'o ' + m.n)) + (ganhouTabela.length === 1 ? ', que já estava no site sem preço, ganhou' : ', que já estavam no site sem preço, ganharam') + ' tabela pública' : ''}${SEM_TABELA.length ? ', e ' + lista(SEM_TABELA.map(m => 'o ' + m.n)) + ' entrou sem tabela pública' : ''}.${SAIDAS.length ? ' ' + lista(SAIDAS.map(m => 'O ' + m.n)) + (SAIDAS.length === 1 ? ' saiu' : ' saíram') + ' da lista de disponíveis (' + lista(SAIDAS.map(m => m.causa)) + ').' : ''}`;

const TITLE_D = 'Imprensa e dados — Observatório de Preços de Indaiatuba';
const DESC_D = `Dados abertos do Observatório de Preços de Lançamentos em Indaiatuba: CSV, JSON, quatro gráficos e release da edição ${edLongo}, sob licença CC BY 4.0.`;
guardaMeta('imprensa-e-dados', TITLE_D, DESC_D);
const jsonDatasetD = JSON.stringify({
  '@context': 'https://schema.org', '@type': 'Dataset',
  name: 'Observatório de Preços de Lançamentos em Indaiatuba — edição ' + edLongo,
  alternateName: 'Dados de lançamentos imobiliários em Indaiatuba/SP, ' + edExtenso,
  description: 'Um registro por empreendimento (' + total + ' lançamentos imobiliários de Indaiatuba/SP: ' + APTOS.length + ' apartamentos e ' + LOTES.length + ' loteamentos e condomínios fechados de lotes) com incorporadora, preço "a partir de", área e R$/m² da menor unidade com preço, mês da tabela de origem e estoque com a data da contagem, conforme as tabelas oficiais das incorporadoras. Edição de ' + edLongo + ' do Observatório de Preços de Lançamentos em Indaiatuba, publicado mensalmente pela Imobiliária Viv\'América.',
  url: URL_DADOS,
  isBasedOn: URL,
  license: 'https://creativecommons.org/licenses/by/4.0/deed.pt-br',
  isAccessibleForFree: true,
  inLanguage: 'pt-BR',
  keywords: ['lançamentos imobiliários', 'Indaiatuba', 'preço por m²', 'loteamentos', 'apartamentos na planta', 'dados abertos'],
  temporalCoverage: temporal,
  datePublished: '2026-09-07',
  dateModified: EDICAO.lastmod,
  spatialCoverage: { '@type': 'Place', name: 'Indaiatuba, São Paulo, Brasil' },
  creator: {
    '@type': ['Organization', 'RealEstateAgent'],
    name: "Imobiliária Viv'América",
    legalName: 'Imobiliária Viva América Ltda - ME',
    alternateName: 'Imóveis Viva América',
    url: 'https://lancamentos.imoveisvivamerica.com.br/',
    image: 'https://lancamentos.imoveisvivamerica.com.br/images/hero.jpg',
    telephone: '+5519989769457',
    email: 'financeiro@imoveisvivamerica.com.br',
    taxID: '57.213.317/0001-23',
    identifier: { '@type': 'PropertyValue', propertyID: 'CRECI', value: '47394-J' },
    address: { '@type': 'PostalAddress', streetAddress: 'Av. Higienópolis, 70 - Jardim União', addressLocality: 'Indaiatuba', addressRegion: 'SP', postalCode: '13348-671', addressCountry: 'BR' },
  },
  variableMeasured: [
    { '@type': 'PropertyValue', name: 'nome', description: 'Nome do empreendimento' },
    { '@type': 'PropertyValue', name: 'tipo', description: 'apartamento ou lote' },
    { '@type': 'PropertyValue', name: 'incorporadora', description: 'Incorporadora ou loteadora responsável' },
    { '@type': 'PropertyValue', name: 'preco_a_partir_de', description: 'Menor preço da tabela oficial, em reais (vazio quando a tabela não foi liberada)', unitText: 'BRL' },
    { '@type': 'PropertyValue', name: 'm2_menor_unidade', description: 'Área privativa, em m², da unidade com o menor preço (nos lotes, a área do lote de menor preço); vazio quando a tabela não identifica a unidade', unitText: 'MTK' },
    { '@type': 'PropertyValue', name: 'preco_m2', description: 'preco_a_partir_de dividido por m2_menor_unidade, em reais por m²', unitText: 'BRL' },
    { '@type': 'PropertyValue', name: 'mes_tabela', description: 'Mês da tabela de origem, no formato AAAA-MM; vazio quando a página do empreendimento não informa a data' },
    { '@type': 'PropertyValue', name: 'estoque', description: 'Unidades disponíveis na data de data_estoque; vazio sem relatório oficial de estoque' },
    { '@type': 'PropertyValue', name: 'data_estoque', description: 'Data da contagem do estoque, no formato AAAA-MM-DD, ou AAAA-MM quando a fonte só informa o mês; vazio sem estoque' },
    { '@type': 'PropertyValue', name: 'spec', description: 'Resumo das características informadas na tabela' },
    { '@type': 'PropertyValue', name: 'url', description: 'Página do empreendimento neste site' },
    { '@type': 'PropertyValue', name: 'fonte', description: 'Origem do valor e mês/ano' },
  ],
  distribution: DISTRIBUICAO,
});
const jsonBreadD = JSON.stringify({ '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [{ '@type': 'ListItem', position: 1, name: 'Início', item: 'https://lancamentos.imoveisvivamerica.com.br/' }, { '@type': 'ListItem', position: 2, name: 'Imprensa e dados', item: URL_DADOS }] });

const HTML_D = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
<script src="/atrib.js"></script>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${esc(TITLE_D)}</title>
  <meta name="description" content="${esc(DESC_D)}">
  <meta name="keywords" content="observatório de preços indaiatuba, dados abertos lançamentos indaiatuba, preço do m² de lote indaiatuba, preço do m² de apartamento indaiatuba, imprensa imobiliária indaiatuba, cc by 4.0, imobiliária viv'américa">
  <meta name="robots" content="index, follow">
  <meta property="og:title" content="${esc(TITLE_D)}">
  <meta property="og:description" content="${esc(DESC_D)}">
  <meta property="og:type" content="website">
  <meta property="og:image" content="https://lancamentos.imoveisvivamerica.com.br/images/hero.jpg">
  <meta property="og:url" content="${URL_DADOS}">
  <meta property="og:locale" content="pt_BR">
  <meta property="og:site_name" content="Imobiliária Viv'América">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:image" content="https://lancamentos.imoveisvivamerica.com.br/images/hero.jpg">
  <meta name="twitter:title" content="${esc(TITLE_D)}">
  <meta name="twitter:description" content="${esc(DESC_D)}">
  <link rel="canonical" href="${URL_DADOS}">
  <script type="application/ld+json">
  ${jsonBreadD}
  </script>
  <script type="application/ld+json">
  ${jsonDatasetD}
  </script>
  <link rel="icon" type="image/png" href="/favicon.png">

  <link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Josefin+Sans:wght@300;400;600;700&family=Poiret+One&display=swap" rel="stylesheet">
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    :root {
      --verde: #C9A227;
      --verde-escuro: #161616;
      --dourado: #C9A227;
      --cinza-bg: #f5f5f5;
      --creme: #F7F5F0;
      --texto: #161616;
      --texto-claro: #555;
      --radius: 12px;
    }
    body { font-family: 'Josefin Sans', system-ui, sans-serif; color: var(--texto); background: #fff; line-height: 1.7; }
    header {
      background: var(--verde-escuro); padding: 0 5%;
      display: flex; align-items: center; justify-content: space-between;
      height: 70px; position: sticky; top: 0; z-index: 100;
    }
    .logo-text { color: #fff; font-size: clamp(1rem, 2.5vw, 1.25rem); font-weight: 700; text-decoration: none; }
    nav a { color: rgba(255,255,255,0.85); text-decoration: none; margin-left: 1.5rem; font-size: 0.9rem; }
    nav a:hover { color: var(--dourado); }
    .hero {
      background: linear-gradient(135deg, var(--verde-escuro) 0%, #2d4a5e 100%);
      color: #fff; text-align: center;
      padding: clamp(50px, 8vw, 90px) 5% clamp(40px, 6vw, 70px);
    }
    .breadcrumb { font-size: 0.8rem; opacity: 0.7; margin-bottom: 1rem; }
    .breadcrumb a { color: #fff; text-decoration: none; }
    .hero h1 { font-size: clamp(1.7rem, 4vw, 2.6rem); font-weight: 800; max-width: 750px; margin: 0 auto 1rem; line-height: 1.2; }
    .hero p { font-size: clamp(0.95rem, 2vw, 1.1rem); max-width: 580px; margin: 0 auto; opacity: 0.9; }
    .container { max-width: 900px; margin: 0 auto; padding: 0 5%; }
    .content-section { padding: clamp(40px, 6vw, 70px) 0; }
    h2 { font-size: clamp(1.3rem, 2.8vw, 1.8rem); font-weight: 800; color: var(--verde-escuro); margin: 2rem 0 1rem; }
    h3 { font-size: clamp(1.05rem, 2vw, 1.25rem); font-weight: 700; color: var(--verde); margin: 1.5rem 0 0.5rem; }
    p { margin-bottom: 1rem; color: var(--texto-claro); font-size: 1rem; }
    strong { color: var(--texto); }
    a { color: var(--verde-escuro); }
    ul, ol { margin: 0.5rem 0 1rem 1.5rem; color: var(--texto-claro); }
    li { margin-bottom: 0.4rem; }
    .highlight-box {
      background: #fdf6e3; border-left: 4px solid var(--verde);
      padding: 1.2rem 1.5rem; border-radius: 0 var(--radius) var(--radius) 0; margin: 1.5rem 0;
    }
    .highlight-box p { margin: 0; color: var(--texto); }
    .vantagem-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 1.2rem; margin: 1.5rem 0; }
    .vantagem-card { background: var(--cinza-bg); border-radius: var(--radius); padding: 1.4rem; min-width: 0; }
    .vantagem-card h4 { font-size: 0.78rem; font-weight: 700; color: var(--verde); letter-spacing: .1em; text-transform: uppercase; margin-bottom: 0.4rem; }
    .vantagem-card p { font-size: 0.95rem; margin: 0; color: var(--texto); overflow-wrap: anywhere; }
    .vantagem-card a { color: var(--verde-escuro); font-weight: 600; }
    .btn-card { display: block; background: var(--verde-escuro); color: #fff; text-align: center; padding: 0.6rem; border-radius: 8px; font-weight: 700; font-size: 0.88rem; text-decoration: none; }
    .btn-card:hover { background: #0d1c28; }
    .cta-section { background: linear-gradient(135deg, var(--verde-escuro), #2d4a5e); color: #fff; text-align: center; padding: clamp(50px, 8vw, 80px) 5%; }
    .cta-section h2 { font-size: clamp(1.3rem, 3vw, 1.9rem); font-weight: 800; margin-bottom: 1rem; color: #fff; }
    .cta-section p { font-size: 1rem; opacity: 0.9; margin-bottom: 2rem; max-width: 500px; margin-left: auto; margin-right: auto; color: #fff; }
    .btn-wpp { display: inline-flex; align-items: center; gap: 0.6rem; background: #25d366; color: #fff; font-weight: 700; padding: 1rem 2.4rem; border-radius: 50px; text-decoration: none; font-size: 1rem; transition: transform 0.2s; }
    .btn-wpp:hover { transform: translateY(-2px); }
    footer { background: var(--verde-escuro); color: rgba(255,255,255,0.75); text-align: center; padding: 2.5rem 5%; font-size: 0.85rem; }
    footer a { color: rgba(255,255,255,0.85); text-decoration: none; margin: 0 0.6rem; }
    footer a:hover { color: var(--dourado); }
    .footer-links { margin-bottom: 1rem; }
    @media (max-width: 600px) { nav { display: none; } }

    /* ─── específicos desta página ─── */
    .dl-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 1.2rem; margin: 1.2rem 0 1.6rem; }
    .dl-card { background: var(--cinza-bg); border-radius: var(--radius); padding: 1.3rem 1.4rem; display: flex; flex-direction: column; gap: .4rem; min-width: 0; }
    .dl-card h4 { font-size: 0.78rem; font-weight: 700; color: var(--verde); letter-spacing: .1em; text-transform: uppercase; }
    .dl-card p { font-size: .92rem; margin: 0 0 .6rem; color: var(--texto); flex: 1; }
    .dl-card small { font-size: .78rem; color: var(--texto-claro); }
    .anteriores { font-size: .9rem; }
    .atrib { background: var(--verde-escuro); color: var(--creme); border-radius: var(--radius); padding: 1.2rem 1.4rem; margin: 1rem 0 1.4rem; }
    .atrib pre { white-space: pre-wrap; word-break: break-word; font-family: inherit; font-size: .98rem; line-height: 1.6; margin: 0 0 .9rem; color: var(--creme); }
    .btn-copiar { background: var(--dourado); color: var(--verde-escuro); border: 0; font: inherit; font-weight: 600; font-size: .78rem; letter-spacing: .08em; text-transform: uppercase; padding: .6rem 1.1rem; border-radius: 4px; cursor: pointer; }
    .btn-copiar:hover { background: #E0C05A; }
    .tabela-wrap { overflow-x: auto; }
    table { width: 100%; border-collapse: collapse; background: #fff; font-size: .9rem; }
    th, td { text-align: left; padding: .5rem .7rem; border-bottom: 1px solid #eee9db; vertical-align: top; }
    th { font-size: .72rem; letter-spacing: .08em; text-transform: uppercase; color: #8a8272; border-bottom: 2px solid var(--verde-escuro); }
    th.num, td.num { text-align: right; white-space: nowrap; font-variant-numeric: tabular-nums; }
    td code { font-family: ui-monospace, Consolas, monospace; font-size: .85em; background: var(--creme); padding: .1rem .35rem; border-radius: 3px; }
    .dic { margin: .6rem 0 1.4rem; }
    figure.grafico { background: var(--creme); border: 1px solid #e3ddcd; border-radius: var(--radius); padding: 1.3rem 1.4rem 1.1rem; margin: 1.4rem 0; }
    figure.grafico h3 { margin: 0 0 .15rem; color: var(--texto); font-size: 1.08rem; }
    figure.grafico .sub { font-size: .85rem; color: var(--texto-claro); margin: 0 0 .8rem; }
    .grafico-wrap { overflow-x: auto; }
    .grafico-wrap svg { display: block; width: 100%; min-width: 560px; height: auto; }
    figure.grafico p.leitura { margin: .9rem 0 0; color: var(--texto); font-size: .95rem; }
    details.tabela-twin { margin-top: .8rem; }
    details.tabela-twin summary { cursor: pointer; font-size: .82rem; font-weight: 600; color: var(--texto-claro); letter-spacing: .05em; text-transform: uppercase; }
    details.tabela-twin table { margin-top: .6rem; font-size: .86rem; }
    details.tabela-twin th, details.tabela-twin td { padding-left: .5rem; padding-right: .5rem; }
    details.tabela-twin th.num { white-space: normal; }
    .tiles { display: grid; grid-template-columns: repeat(auto-fit, minmax(210px, 1fr)); gap: 1rem; margin: 1.2rem 0 1.4rem; }
    .tile { background: #fff; border: 1px solid #e3ddcd; border-radius: var(--radius); padding: 1.1rem 1.2rem; box-shadow: 0 6px 18px rgba(15,28,41,.06); min-width: 0; }
    .tile b { display: block; font-size: 1.45rem; font-weight: 700; color: var(--texto); line-height: 1.2; }
    .tile span { display: block; font-size: .82rem; color: var(--texto); margin-top: .2rem; }
    .tile small { display: block; font-size: .74rem; color: #8a8272; margin-top: .35rem; }
  </style>
  <!-- Google Analytics GA4 -->
  <script async src="https://www.googletagmanager.com/gtag/js?id=G-40C0379NPR"></script>
  <script>
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', 'G-40C0379NPR');
    // Rastrear cliques no WhatsApp como conversão
    document.addEventListener('click', function(e) {
      var el = e.target.closest('a[href*="wa.me"]');
      if (el) { gtag('event', 'whatsapp_click', { event_category: 'conversao', event_label: document.title }); }
    });
  </script>
  ${MENU_CSS}
</head>
<body>
${MENU_HTML}


<section class="hero">
  <div class="breadcrumb">
    <a href="/">Início</a> › Imprensa e dados
  </div>
  <h1>Imprensa e dados</h1>
  <p>Os números do Observatório de Preços de Lançamentos em Indaiatuba, abertos para jornalistas, pesquisadores e quem quiser conferir: planilha, JSON, gráficos e release da edição de ${edLongo}.</p>
</section>

<div class="container">
  <div class="content-section">

    <h2>O que é o Observatório</h2>
    <p>O <a href="/precos-lancamentos-indaiatuba/">Observatório de Preços de Lançamentos em Indaiatuba</a> é uma tabela <strong>mensal</strong>, aberta e sem cadastro, com o preço "a partir de" dos lançamentos imobiliários que a Imobiliária Viv'América representa na cidade — apartamentos, loteamentos e condomínios fechados de lotes. A edição de ${edLongo} acompanha <strong>${total} empreendimentos</strong> de ${construtoras} incorporadoras e loteadoras; ${comPrecoTotal} têm preço aberto, nas tabelas de ${construtorasComTabela} delas.</p>
    <p>Os valores vêm das <strong>tabelas oficiais das incorporadoras</strong>, sempre com o mês da tabela registrado ao lado do preço. Cada edição mostra também o que mudou entre as duas últimas tabelas de cada empreendimento, o R$/m² de lote e de apartamento (pela menor unidade com preço) e o estoque nos empreendimentos que têm relatório oficial de unidades.</p>
    <div class="highlight-box">
      <p><strong>O que o Observatório não faz:</strong> não projeta preço, não promete valorização nem retorno e não avalia imóveis. Publica o preço da tabela, a metragem e o mês; a comparação é de quem lê.</p>
    </div>

    <h2>Licença</h2>
    <p>Os dados e os gráficos desta página estão sob a licença <a href="https://creativecommons.org/licenses/by/4.0/deed.pt-br" rel="license">Creative Commons Atribuição 4.0 Internacional (CC BY 4.0)</a>. Você pode copiar, publicar, adaptar e redistribuir, inclusive para uso comercial, desde que cite a fonte. Texto de atribuição pronto para copiar:</p>
    <div class="atrib">
      <pre id="atrib-texto">Fonte: Observatório de Preços de Lançamentos em Indaiatuba — Imobiliária Viv'América (CRECI 47394-J), edição ${edLongo}, ${URL}</pre>
      <button type="button" class="btn-copiar" data-copiar="atrib-texto">Copiar atribuição</button>
    </div>
    <p>Em texto corrido basta o crédito "Observatório de Preços de Lançamentos em Indaiatuba / Imobiliária Viv'América" com link para o Observatório. As fotos e perspectivas dos empreendimentos pertencem às incorporadoras e não estão cobertas por esta licença.</p>

    <h2>Baixar os dados</h2>
    <p>Um registro por empreendimento (${REGISTROS.length} linhas), com incorporadora, preço "a partir de", área e R$/m² da menor unidade com preço, mês da tabela de origem, estoque com a data da contagem e o link da página de cada um. Edição ${edLongo}, com dados apurados até ${hojeBR}.</p>
    <div class="dl-grid">
      <div class="dl-card">
        <h4>CSV</h4>
        <p>UTF-8, separador ponto e vírgula (;), sem BOM. Compatível com Excel, Google Planilhas e LibreOffice.</p>
        <a class="btn-card" href="${ARQ_BASE}.csv" download>Baixar CSV</a>
      </div>
      <div class="dl-card">
        <h4>JSON</h4>
        <p>Lista de objetos com as mesmas colunas do CSV; o preço vem como número (<code>null</code> quando a incorporadora ainda não liberou a tabela).</p>
        <a class="btn-card" href="${ARQ_BASE}.json" download>Baixar JSON</a>
      </div>
    </div>${ANTERIORES.length ? `
    <p class="anteriores"><strong>Edições anteriores:</strong> ${ANTERIORES.map(m => `${mesLongoDe(m)} (<a href="dados-lancamentos-indaiatuba-${m}.csv" download>CSV</a>, <a href="dados-lancamentos-indaiatuba-${m}.json" download>JSON</a>)`).join(' · ')}. As edições anteriores têm menos colunas (sem área, R$/m², estoque e data do estoque).</p>` : ''}
    <h3>Dicionário de dados</h3>
    <div class="tabela-wrap">
      <table class="dic">
        <thead><tr><th>Coluna</th><th>Conteúdo</th></tr></thead>
        <tbody>
          <tr><td><code>nome</code></td><td>Nome do empreendimento.</td></tr>
          <tr><td><code>tipo</code></td><td><code>apartamento</code> ou <code>lote</code> (loteamento aberto, loteamento fechado ou condomínio de lotes).</td></tr>
          <tr><td><code>incorporadora</code></td><td>Incorporadora ou loteadora responsável; parcerias separadas por " · ".</td></tr>
          <tr><td><code>preco_a_partir_de</code></td><td>Menor preço da tabela oficial, em reais, sem separador de milhar. Vazio (CSV) ou <code>null</code> (JSON) quando a tabela ainda não foi liberada.</td></tr>
          <tr><td><code>m2_menor_unidade</code></td><td>Área privativa, em m², da unidade com o menor preço (nos lotes, a área do lote de menor preço da tabela, que nem sempre é o menor lote). Vazio quando a tabela não identifica qual unidade tem o menor preço.</td></tr>
          <tr><td><code>preco_m2</code></td><td><code>preco_a_partir_de</code> dividido por <code>m2_menor_unidade</code>, arredondado, em reais por m². Não é a média de todas as unidades.</td></tr>
          <tr><td><code>mes_tabela</code></td><td>Mês da tabela de origem, no formato <code>AAAA-MM</code>, conforme a página do empreendimento. Vazio quando a página não informa a data da tabela.</td></tr>
          <tr><td><code>estoque</code></td><td>Unidades disponíveis na data de <code>data_estoque</code> (relatório de estoque, espelho ou tabela com disponibilidade). Vazio quando não há relatório oficial.</td></tr>
          <tr><td><code>data_estoque</code></td><td>Data da contagem do estoque, conforme o relatório ou a tabela de origem: <code>AAAA-MM-DD</code>, ou <code>AAAA-MM</code> quando a fonte só informa o mês. Vazio quando não há estoque informado.</td></tr>
          <tr><td><code>spec</code></td><td>Resumo das características informadas: metragem, dormitórios, estoque conferido (com mês), previsão de entrega informada pela incorporadora.</td></tr>
          <tr><td><code>url</code></td><td>Página do empreendimento neste site.</td></tr>
          <tr><td><code>fonte</code></td><td>Origem do valor e mês/ano, por exemplo "tabela oficial da incorporadora, ${edLongo}".</td></tr>
        </tbody>
      </table>
    </div>

    <h2>Gráficos da edição ${edLongo}</h2>
    <p>Quatro leituras dos mesmos dados, em SVG. Podem ser copiadas e reproduzidas com a atribuição acima; cada gráfico tem a tabela correspondente logo abaixo.</p>
${G1}
${G4}
${G2}
${G3}

    <h2>Release — edição ${edLongo}</h2>
    <div class="tiles">
      <div class="tile"><b>${total}</b><span>lançamentos monitorados</span><small>${APTOS.length} apartamentos e ${LOTES.length} loteamentos · ${comPrecoTotal} com preço · ${edLongo}</small></div>
      <div class="tile"><b>${brl(m2Min)} a ${brl(m2Max)}</b><span>preço do m² de lote</span><small>média de ${brl(m2Medio)}/m² nos ${LOTES.length} loteamentos · ${edLongo}</small></div>
      <div class="tile"><b>${brl(pm2Min.pm2)} a ${brl(pm2Max.pm2)}</b><span>preço do m² de apartamento</span><small>pela menor unidade com preço · média ${brl(pm2Medio)}/m² em ${aptosM2.length} empreendimentos</small></div>
      <div class="tile"><b>${MOVIMENTOS.length} + ${ENTRADAS.length}</b><span>mudaram o preço de entrada + entraram no site ou ganharam tabela</span><small>variações de ${pct(MOVIMENTOS.reduce((a, m) => (m.para - m.de) / m.de < (a.para - a.de) / a.de ? m : a).de, MOVIMENTOS.reduce((a, m) => (m.para - m.de) / m.de < (a.para - a.de) / a.de ? m : a).para)} a ${pct(MOVIMENTOS.reduce((a, m) => (m.para - m.de) / m.de > (a.para - a.de) / a.de ? m : a).de, MOVIMENTOS.reduce((a, m) => (m.para - m.de) / m.de > (a.para - a.de) / a.de ? m : a).para)} · ${edLongo}</small></div>
    </div>
    <p><strong>Contexto.</strong> ${CONTEXTO}</p>${estoqueItens.length ? `
    <p><strong>Estoque.</strong> Nos ${estoqueItens.length} empreendimentos que já tinham uma medição de estoque anterior, o número anterior e o atual, cada um com a data do relatório ou da tabela. O intervalo entre as duas medições não é o mesmo em todos${basesEstoque ? ' (as medições anteriores vão ' + basesEstoque + ')' : ''}, por isso as datas vão em cada linha. O Observatório mostra quantas unidades saíram da lista de disponíveis entre as duas medições; sair da lista não é venda confirmada (pode ser reserva). Quando a incorporadora informa o motivo, ou quando entram lotes na lista, a linha diz.</p>
    <ul>
${estoqueItens.join('\n')}
    </ul>` : ''}
    <p>Todos os números acima estão na edição de ${edLongo} do <a href="/precos-lancamentos-indaiatuba/">Observatório de Preços</a>, apurada até ${hojeBR}, e no CSV desta página. Preços são os "a partir de" das tabelas oficiais e podem mudar sem aviso; o Observatório não faz projeção nem promete valorização.</p>

    <h2>Contato para imprensa</h2>
    <div class="vantagem-grid">
      <div class="vantagem-card">
        <h4>E-mail</h4>
        <p><a href="mailto:financeiro@imoveisvivamerica.com.br">financeiro@imoveisvivamerica.com.br</a></p>
      </div>
      <div class="vantagem-card">
        <h4>WhatsApp</h4>
        <p><a href="https://wa.me/5519989769457?text=Ol%C3%A1!%20Vim%20pela%20p%C3%A1gina%20Imprensa%20e%20dados%20do%20Observat%C3%B3rio%20de%20Pre%C3%A7os%20de%20Indaiatuba.%20Pode%20me%20ajudar%3F">(19) 98976-9457</a></p>
      </div>
      <div class="vantagem-card">
        <h4>Responsável pelo conteúdo</h4>
        <p>Fabio Correia — CRECI 303686-F</p>
      </div>
      <div class="vantagem-card">
        <h4>Endereço</h4>
        <p>Imobiliária Viv'América · CRECI 47394-J<br>Av. Higienópolis, 70 – Jardim União<br>Indaiatuba/SP</p>
      </div>
    </div>
    <p>Atendimento de segunda a sexta, das 8h30 às 18h, e sábado, das 9h às 12h. Para entrevista, tabela completa de um empreendimento ou correção de dado, escreva no e-mail com o nome do veículo e o prazo. O histórico de cada tabela fica à disposição sob pedido.</p>

  </div>
</div>

<div class="cta-section">
  <h2>Precisa de um dado que não está aqui?</h2>
  <p>Fale com quem responde pelo Observatório: Fabio Correia, CRECI 303686-F, pelo WhatsApp (19) 98976-9457.</p>
  <a href="https://wa.me/5519989769457?text=Ol%C3%A1!%20Vim%20pela%20p%C3%A1gina%20Imprensa%20e%20dados%20do%20Observat%C3%B3rio%20de%20Pre%C3%A7os%20de%20Indaiatuba.%20Pode%20me%20ajudar%3F" class="btn-wpp">
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
    Falar no WhatsApp
  </a>
</div>

  <footer>
  <div class="footer-links">
    <a href="/">Início</a>
    <a href="/apartamentos-na-planta-indaiatuba/">Apartamentos na planta</a>
    <a href="/loteamentos-em-indaiatuba/">Loteamentos em Indaiatuba</a>
    <a href="/condominios-fechados-indaiatuba/">Condomínios Fechados</a>
    <a href="/precos-lancamentos-indaiatuba/">Observatório de Preços</a>
    <a href="/blog/">Blog</a>
  </div>
  <p>© 2026 Imobiliária Viv'América · CRECI 47394-J · Lançamentos imobiliários em Indaiatuba SP</p>
<p class="nap">Imobiliária Viv'América · CRECI 47394-J · Av. Higienópolis, 70 – Jardim União, Indaiatuba/SP · <a href="https://wa.me/5519989769457">(19) 98976-9457</a> · <a href="/sobre/">Sobre a imobiliária</a> · <a href="https://imoveisvivamerica.com.br/politica-de-privacidade">Política de Privacidade</a></p>
</footer>

<script>
  document.querySelectorAll('[data-copiar]').forEach(function (b) {
    b.addEventListener('click', function () {
      var alvo = document.getElementById(b.getAttribute('data-copiar'));
      if (!alvo || !navigator.clipboard) return;
      var original = b.textContent;
      navigator.clipboard.writeText(alvo.textContent.trim()).then(function () {
        b.textContent = 'Copiado!';
        setTimeout(function () { b.textContent = original; }, 1800);
      });
    });
  });
</script>

</body>
</html>
`;
fs.writeFileSync(R + 'imprensa-e-dados/index.html', HTML_D, 'utf8');

console.log('Observatório gerado — edição ' + EDICAO.mes + '/' + EDICAO.ano + ' (' + EDICAO.lastmod + ')');
console.log('  empreendimentos: ' + total + ' (' + APTOS.length + ' aptos + ' + LOTES.length + ' lotes) · ' + comPrecoTotal + ' com preço');
console.log('  m² de lote: min ' + brl(m2Min) + ' · médio ' + brl(m2Medio) + ' · max ' + brl(m2Max));
console.log('  apartamentos: ' + aptosComPreco.length + ' com preço · média ' + brl(mediaApto) + ' · mediana ' + brl(medianaApto));
console.log('  m² de apto (menor unidade): ' + aptosM2.length + ' com área · min ' + brl(pm2Min.pm2) + ' (' + pm2Min.n + ') · médio ' + brl(pm2Medio) + ' · mediana ' + brl(pm2Mediana) + ' · max ' + brl(pm2Max.pm2) + ' (' + pm2Max.n + ')');
if (aptosSemM2.length) console.log('  sem m2 (área da menor unidade não identificada na landing): ' + aptosSemM2.map(e => e.n).join(', '));
console.log('  movimentações do mês: ' + MOVIMENTOS.length + ' (' + altas.length + ' altas, ' + quedas.length + ' quedas) · entradas: ' + ENTRADAS.length + ' · sem tabela: ' + SEM_TABELA.length + ' · saídas: ' + SAIDAS.length);
console.log('  dados abertos: imprensa-e-dados/' + ARQ_BASE + '.csv/.json (' + REGISTROS.length + ' registros) · edições anteriores: ' + (ANTERIORES.join(', ') || 'nenhuma'));
console.log('  bytes: observatório ' + HTML.length + ' · imprensa ' + HTML_D.length);
