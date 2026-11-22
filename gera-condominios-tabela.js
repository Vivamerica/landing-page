/* ═══════════════════════════════════════════════════════════════════
   GERA-CONDOMINIOS-TABELA — a tabela "um por linha" do hub de condomínios
   ───────────────────────────────────────────────────────────────────
   Página: /condominios-fechados-indaiatuba/ (escrita à mão; este gerador
   só troca os trechos marcados, como o gera-home.js faz com a grade).

   Por quê (levantamento de 21/11/2026): quando alguém pergunta a uma IA
   "terreno em condomínio fechado em Indaiatuba: quais opções e preços?",
   a resposta vem em tabela, uma linha por condomínio, com tamanho do
   lote, preço e condição. O hub só tinha cards e um guia genérico; o
   ChatGPT respondeu com 7 condomínios de revenda de outras imobiliárias
   e o Google atribuiu o Parque Zarah a um portal. O dado já estava na
   fonte única: faltava entregá-lo em tabela.

   Fonte: SÓ a fonte única (LOTES do gera-folheto.js), lida pelo mesmo
   recorte dos outros geradores e filtrada pela lista "sem
   disponibilidade" (sem-disponibilidade-regras.js: quem está marcado sai
   da tabela e das respostas). Nenhum número é digitado aqui.

   O que escreve (e só isto):
   - <!--GEN:tabela-condominios-->  no começo da section#guia: H2, a
       "Resposta direta" (quantos são, que é venda direta da loteadora e
       não revenda, menor e maior ponto de partida, faixa do m², quem
       consta como entregue, link para os terrenos de revenda do site
       principal; quando o menor preço da tabela é de lote fora do
       perímetro fechado, a frase diz isso e dá o menor preço DENTRO do
       fechamento, ver FORA_DO_FECHAMENTO) e a tabela, agrupada pela área do lote de menor preço
       (até 200 m² · 200 a 350 · 350 a 500 · 500 ou mais). Colunas: nome
       com link e rótulo (o de tipoLote, igual ao do card), loteadora (c),
       a partir de (p), área desse lote (m2), R$/m², previsão de entrega
       (prev/prev2, pelo previsao.js), disponíveis com a data (est +
       estEm) e mês da tabela (tab, tabRec, conf).
   - <!--GEN:tc-lista-->, <!--GEN:tc-menor-->, <!--GEN:tc-entrega-->
       dentro de respostas do FAQ escrito à mão (o mesmo desenho do
       GEN:faq-m2 do gera-home.js): a lista com o preço de cada um, o
       menor preço e a menor área, e quem consta como entregue.
   - o CSS da tabela, entre as marcas "tabela de condomínios" e "fim
       tabela de condomínios", na primeira <style> da página (regravado a
       cada rodada, como o bloco da etiqueta de previsão). A tabela
       "como se paga", escrita à mão no guia, usa as mesmas classes.

   O que NÃO faz: não escreve condição de pagamento, taxa mensal, bairro
   nem lazer (não estão na fonte única: ficam no texto à mão, com a tabela
   da loteadora e a data); não mexe em GEN:h1, contagem, atualizado,
   hubgrid, destaque e faq-m2 (do gera-home.js) nem no JSON-LD (o FAQPage
   é do gera-faq.js / gera-home.js, copiado do FAQ visível).

   Conferências (só avisam, não gravam nada a mais):
   - a contagem daqui tem de bater com a do GEN:contagem que o
     gera-home.js acabou de escrever (se não bater, o tipoLote dos dois
     saiu de sincronia);
   - cada linha da tabela "como se paga" (<tr data-pg="slug"
     data-pg-tab="AAAA-MM">) tem de ser de um empreendimento da tabela e
     citar o mesmo mês de tabela da fonte única: mudou a tabela na fonte
     única, a condição de pagamento tem de ser relida na ficha.

   Ritual: depois do gera-home.js (passo 3) e antes do gera-faq.js
   (passo 10). Idempotente: a segunda rodada não muda nenhum byte.
   Preserva BOM e fim de linha (não cria CR).

   Uso: node gera-condominios-tabela.js [--ensaio] [--mostrar]
     --ensaio   mostra o que mudaria e não grava
     --mostrar  imprime os trechos gerados (para ler antes de gravar)
   ═══════════════════════════════════════════════════════════════════ */

const fs = require('fs');
const R = __dirname + '/';
const ARQ = 'condominios-fechados-indaiatuba/index.html';
const ENSAIO = process.argv.includes('--ensaio');
// terrenos de revenda (condomínio já habitado): site principal, fora deste repositório
const REVENDA = 'https://imoveisvivamerica.com.br/site/venda/indaiatuba/terrenos';

// ─── fonte única ───
function extrair(nome, arquivo = 'gera-folheto.js') {   // o mesmo recorte do gera-relacionados.js
  const src = fs.readFileSync(R + arquivo, 'utf8');
  const ini = src.indexOf('const ' + nome + ' = ');
  if (ini < 0) throw new Error(nome + ' nao achado em ' + arquivo);
  const fim = src.indexOf('\n];', ini) + 2;
  return eval('(' + src.slice(ini + ('const ' + nome + ' = ').length, fim) + ')');
}
const SD = require('./sem-disponibilidade-regras.js').carregar();
const PREV = require('./previsao.js');
const LOTES_F = extrair('LOTES');
PREV.validarLotes(LOTES_F);
const LOTES = SD.aVenda(LOTES_F);

// rótulo do card: IGUAL ao tipoLote do gera-home.js ("Loteamento fechado" no início do s vence o t)
const tipoLote = e => /^Loteamento fechado/i.test(e.s) ? 'Loteamento fechado'
  : e.t === 'Cond. fechado' ? 'Condomínio fechado'
  : /fechado/i.test(e.s) ? 'Loteamento fechado' : 'Loteamento aberto';
const conds = LOTES.filter(e => tipoLote(e) !== 'Loteamento aberto');
if (!conds.length) throw new Error('GERA-CONDOMINIOS-TABELA: nenhum condomínio ou loteamento fechado à venda na fonte única (confira a lista "sem disponibilidade"); nada foi gravado.');
const semDado = conds.filter(e => !e.p || !e.m2 || !e.tab).map(e => e.n);
if (semDado.length) throw new Error('GERA-CONDOMINIOS-TABELA: sem preço, área ou mês da tabela na fonte única: ' + semDado.join(', ') + '; nada foi gravado.');

// ─── utilitários (os mesmos formatos dos outros geradores) ───
const brl = n => 'R$ ' + n.toLocaleString('pt-BR');
const area = n => n.toLocaleString('pt-BR') + ' m²';
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const MES_ABREV = { '01': 'jan', '02': 'fev', '03': 'mar', '04': 'abr', '05': 'mai', '06': 'jun',
  '07': 'jul', '08': 'ago', '09': 'set', '10': 'out', '11': 'nov', '12': 'dez' };
const mesDe = iso => MES_ABREV[iso.slice(5, 7)] + '/' + iso.slice(0, 4);   // 2026-09 -> set/2026
const mmaaaa = iso => iso.slice(5, 7) + '/' + iso.slice(0, 4);             // 2026-09 -> 09/2026
const confTxt = e => e.conf ? ', preços confirmados para ' + mesDe(e.conf) : '';
// tabela sem data impressa (tabRec): "recebida em", nunca "de"
const tabDe = e => (e.tabRec ? 'tabela recebida em ' : 'tabela de ') + mesDe(e.tab) + confTxt(e);
const tabCel = e => (e.tabRec ? 'recebida em ' : '') + mesDe(e.tab) + confTxt(e);
const m2De = e => Math.round(e.p / e.m2);
const lista = a => a.length <= 1 ? a.join('') : a.slice(0, -1).join(', ') + ' e ' + a[a.length - 1];
const porPreco = (a, b) => a.p - b.p;
// o s da fonte única avisa quando o menor preço não é do lote residencial ("residencial a partir de R$ …")
const obsPreco = e => (/residencial a partir de R\$ [\d.]+/i.exec(e.s || '') || [''])[0];
// ─── o que a fonte única não diz: POR QUE o menor preço não é o do lote residencial ───
// Texto à mão, por slug, com a fonte primária lida; só entra quando o s da fonte única traz
// "residencial a partir de R$ …". Sem entrada aqui, o texto repete só o que a fonte única diz.
// Parque Zarah (nome oficial: Parque Imperial): Decreto 15.093, de 12/01/2024, art. 5º e parágrafo
// único (Imprensa Oficial de Indaiatuba nº 2844, de 18/01/2024, págs. 19 a 26, lida em 21/11/2026):
// os lotes de uso misto "encontram-se fora dos perímetros de fechamento" (entre eles, 04 a 38 da
// quadra 27, onde está o lote de menor preço da tabela de nov/2026). Uma página sobre condomínio
// fechado não pode dar esse preço como o menor "em condomínio fechado" sem dizer isso.
const FORA_DO_FECHAMENTO = {
  'parque-zarah-indaiatuba': {
    curto: 'lote de uso misto, fora do perímetro fechado',
    longo: 'lote de uso misto (residência ou comércio), que o Decreto 15.093, de 12/01/2024 (art. 5º), deixa fora dos perímetros de fechamento',
  },
};
const residDe = e => (/residencial a partir de (R\$ [\d.]+)/i.exec(e.s || '') || [])[1] || '';
// frase inteira, para logo depois do menor preço
const ressalva = e => {
  if (!obsPreco(e)) return '';
  const f = FORA_DO_FECHAMENTO[e.slug];
  return f ? ' Esse preço é de ' + f.longo + '; dentro do fechamento, o lote residencial parte de ' + residDe(e) + '.'
    : ' Esse não é o preço do lote residencial (' + esc(obsPreco(e)) + ').';
};
// rótulo curto, para a célula da tabela e para a lista do FAQ
const subPreco = e => {
  if (!obsPreco(e)) return '';
  const f = FORA_DO_FECHAMENTO[e.slug];
  return (f ? f.curto + '; ' : '') + obsPreco(e);
};
const previsao = e => PREV.rotulo(e).replace(/^Previsão: /, '');            // "Entregue" | "12/2026" | "12/2026 e 05/2028"
const disp = e => (typeof e.est === 'number' && e.estEm) ? e.est.toLocaleString('pt-BR') + ' (' + e.estEm + ')' : '';

// ─── grupos pela área do lote de menor preço ───
const FAIXAS = [200, 350, 500, Infinity];   // teto de cada grupo, em m² (o último não tem teto)
const grupos = FAIXAS.map((teto, i) => {
  const piso = i ? FAIXAS[i - 1] : 0;
  const itens = conds.filter(e => e.m2 >= piso && e.m2 < teto).sort(porPreco);
  if (!itens.length) return null;
  const a = itens.map(e => e.m2), mn = Math.min(...a), mx = Math.max(...a);
  const rot = teto === Infinity ? area(piso) + ' ou mais' : mn === mx ? area(mn) : mn.toLocaleString('pt-BR') + ' a ' + area(mx);
  return { itens, rot };
}).filter(Boolean);

const menor = conds.reduce((a, b) => a.p <= b.p ? a : b);
const maior = conds.reduce((a, b) => a.p >= b.p ? a : b);
const m2s = conds.map(m2De), m2Min = Math.min(...m2s), m2Max = Math.max(...m2s);
const noM2 = v => conds.filter(e => m2De(e) === v).map(e => e.n);
const areaMin = Math.min(...conds.map(e => e.m2));
const entregues = conds.filter(e => e.prev === 'entregue').sort(porPreco);
const emObra = conds.filter(e => e.prev !== 'entregue');
const primeira = emObra.slice().sort((a, b) => a.prev.localeCompare(b.prev))[0];
const fimDe = e => e.prev2 && e.prev2 > e.prev ? e.prev2 : e.prev;
const ultima = emObra.slice().sort((a, b) => fimDe(b).localeCompare(fimDe(a)))[0];
// mês de cada PREÇO para a frase "preços de A a B": o da tabela ou, com conf, o mês para o qual o preço
// foi confirmado. Não é "tabelas de A a B": há tabela mais antiga com preço confirmado depois
// (a coluna "Tabela" mostra as duas datas), e chamar de "tabela de out/2026" a que é de jul/2025 seria falso.
const meses = conds.map(e => e.conf || e.tab).sort();
const faixaMes = meses[0] === meses[meses.length - 1] ? 'de ' + mesDe(meses[0]) : 'de ' + mesDe(meses[0]) + ' a ' + mesDe(meses[meses.length - 1]);
const temConf = conds.some(e => e.conf);
// O menor preço DENTRO do fechamento só é afirmado quando a fonte única prova: o menor da tabela é de
// lote fora do fechamento (entrada em FORA_DO_FECHAMENTO), o s dá o preço do residencial e esse preço
// não passa do menor preço de nenhum outro empreendimento. Fora disso, vale a frase com a ressalva.
const soNumero = t => +String(t).replace(/\D/g, '');
const fMenor = FORA_DO_FECHAMENTO[menor.slug];
const residMenor = residDe(menor);
const outrosP = conds.filter(e => e !== menor).map(e => e.p);
const menorDentro = !!(fMenor && residMenor && soNumero(residMenor) >= menor.p && outrosP.every(p => soNumero(residMenor) <= p));
const fraseMenor = menorDentro
  ? `Dentro do fechamento, o menor preço é ${residMenor} (${esc(menor.n)}, lote residencial, ${tabDe(menor)}). A tabela do empreendimento começa mais baixo, em ${brl(menor.p)} (lote de ${area(menor.m2)}), mas esse é ${fMenor.longo}.`
  : `O menor preço da tabela é ${brl(menor.p)} (${esc(menor.n)}, lote de ${area(menor.m2)}, ${tabDe(menor)}).${ressalva(menor)}`;
const N = conds.length;
const nomeN =N === 1 ? '1 condomínio ou loteamento fechado' : N + ' condomínios e loteamentos fechados';

// ─── 1. bloco da tabela ───
const COLS = ['Empreendimento', 'Loteadora', 'A partir de', 'Área desse lote', 'R$/m²', 'Previsão de entrega', 'Disponíveis', 'Tabela'];
const linha = e => `
        <tr>
          <td data-r="${COLS[0]}"><a href="/${e.slug}/">${esc(e.n)}</a><span class="tc-sub">${tipoLote(e)}</span></td>
          <td data-r="${COLS[1]}">${esc(e.c)}</td>
          <td data-r="${COLS[2]}" class="num"><strong>${brl(e.p)}</strong>${subPreco(e) ? '<span class="tc-sub">' + esc(subPreco(e)) + '</span>' : ''}</td>
          <td data-r="${COLS[3]}" class="num">${area(e.m2)}</td>
          <td data-r="${COLS[4]}" class="num">${brl(m2De(e))}</td>
          <td data-r="${COLS[5]}">${previsao(e)}</td>
          ${disp(e) ? `<td data-r="${COLS[6]}">${esc(disp(e))}</td>` : `<td data-r="${COLS[6]}" class="tc-vazio">—</td>`}
          <td data-r="${COLS[7]}">${tabCel(e)}</td>
        </tr>`;
const faixaPreco = g => g.itens.length === 1 ? brl(g.itens[0].p) : 'de ' + brl(g.itens[0].p) + ' a ' + brl(g.itens[g.itens.length - 1].p);
const corpo = g => `
      <tbody>
        <tr class="tc-grupo"><th colspan="${COLS.length}" scope="rowgroup">Lote de menor preço com ${g.rot} · ${g.itens.length === 1 ? '1 empreendimento' : g.itens.length + ' empreendimentos'} · ${faixaPreco(g)}</th></tr>${g.itens.map(linha).join('')}
      </tbody>`;
const entreguesTxt = entregues.length
  ? (entregues.length === 1 ? ' (1 já entregue: ' : ' (' + entregues.length + ' já entregues: ') + lista(entregues.map(e => esc(e.n))) + ')'
  : '';
const BLOCO = `
    <h2 id="tabela-condominios">Terreno em condomínio fechado em Indaiatuba: ${N === 1 ? '1 com lote à venda pela loteadora, com tamanho e preço' : N + ' com lote à venda pela loteadora, com tamanho e preço de cada um'}</h2>
    <p class="tc-lede"><strong>Resposta direta:</strong> a Viv'América representa ${nomeN} com lote à venda direto pela loteadora em Indaiatuba${entreguesTxt}. O preço é o da tabela de cada loteadora, com o mês da tabela em cada linha; não é revenda de terceiros. ${fraseMenor} O maior ponto de partida é ${brl(maior.p)} (${esc(maior.n)}, lote de ${area(maior.m2)}, ${tabDe(maior)}); o m² vai de ${brl(m2Min)} a ${brl(m2Max)}. Terreno de revenda, em condomínio já habitado, não está nesta tabela: os de revenda que temos ficam na lista de <a href="${REVENDA}">terrenos à venda em Indaiatuba, no site principal da Viv'América</a>.</p>
    <div class="tc-rolagem">
    <table class="tc">
      <caption>Levantamento da Imobiliária Viv'América nas tabelas das loteadoras, com preços ${faixaMes}; o mês de cada tabela está na última coluna${temConf ? ' e, onde a tabela é anterior, o mês para o qual o preço foi confirmado' : ''}. "A partir de" é o lote de menor preço da tabela e a área é a desse lote: o empreendimento pode ter lotes menores ou maiores. "Disponíveis" são os lotes da lista da loteadora na data entre parênteses; onde há traço, veja a página do empreendimento ou confirme no atendimento. O rótulo (condomínio fechado ou loteamento fechado) é o da comercialização e não define o regime jurídico, que se confirma na matrícula. Valores sujeitos a alteração sem aviso: preço e disponibilidade são confirmados com a loteadora antes de qualquer proposta.</caption>
      <thead>
        <tr>${COLS.map(c => '<th scope="col">' + c + '</th>').join('')}</tr>
      </thead>${grupos.map(corpo).join('')}
    </table>
    </div>
    `;

// ─── 2. respostas do FAQ (texto dentro do <p> escrito à mão) ───
const itemLista = (e, i) => esc(e.n) + ' (' + (i ? '' : 'a partir de ') + brl(e.p) + (subPreco(e) ? ', ' + esc(subPreco(e)) : '') + ')';
const FAQ_LISTA = `A Viv'América representa ${nomeN} com lote à venda direto pela loteadora em Indaiatuba. Pela área do lote de menor preço de cada um: ${grupos.map(g => 'com ' + g.rot + ', ' + lista(g.itens.map(itemLista))).join('; ')}. Cada valor é o do lote de menor preço na tabela da loteadora (preços ${faixaMes}); o mês de cada tabela, o m², a previsão de entrega e os lotes disponíveis estão na tabela desta página.`;
const FAQ_MENOR = `${fraseMenor} Entre os lotes de menor preço de cada tabela, a menor área é ${area(areaMin)} (${lista(conds.filter(e => e.m2 === areaMin).sort(porPreco).map(e => esc(e.n)))}). O m² mais baixo é ${brl(m2Min)} (${lista(noM2(m2Min).map(esc))}) e o mais alto, ${brl(m2Max)} (${lista(noM2(m2Max).map(esc))}).`;
const FAQ_ENTREGA = (entregues.length
  ? `Dos ${N}, ${entregues.length === 1 ? '1 consta como entregue' : entregues.length + ' constam como entregues'} (${lista(entregues.map(e => esc(e.n)))}).`
  : `Nenhum dos ${N} consta como entregue.`)
  + (emObra.length
    ? ` ${entregues.length ? (emObra.length === 1 ? 'No outro' : 'Nos outros ' + emObra.length) : (emObra.length === 1 ? 'Nele' : 'Neles')}, a previsão de entrega ${emObra.length === 1 || mmaaaa(primeira.prev) === mmaaaa(fimDe(ultima)) ? 'é ' + mmaaaa(primeira.prev) + ' (' + esc(primeira.n) + ')' : 'vai de ' + mmaaaa(primeira.prev) + ' (' + esc(primeira.n) + ') a ' + mmaaaa(fimDe(ultima)) + ' (' + esc(ultima.n) + ')'}; a data de cada um está na coluna "Previsão de entrega" da tabela desta página.`
    : '');

// ─── 3. CSS da tabela (primeira <style> da página; regravado a cada rodada) ───
const CSS_INI = '/* tabela de condomínios */', CSS_FIM = '/* fim tabela de condomínios */';
const CSS = [
  '.tc-lede{color:var(--texto)}',
  '.tc-rolagem{overflow-x:auto;-webkit-overflow-scrolling:touch;margin:1.4rem 0}',
  '.tc{width:100%;min-width:780px;border-collapse:collapse;font-size:.9rem;line-height:1.45}',
  '.tc th,.tc td{border:1px solid #e2e2e2;padding:.6rem .7rem;text-align:left;vertical-align:top;color:var(--texto)}',
  '.tc thead th{background:var(--verde-escuro);color:#fff;font-size:.76rem;font-weight:700;letter-spacing:.04em}',
  '.tc .tc-grupo th{background:#fdf6e3;font-weight:700}',
  '.tc td.num{white-space:nowrap;font-variant-numeric:tabular-nums}',
  '.tc td a{color:var(--texto);font-weight:700;text-decoration:none;border-bottom:1px solid var(--dourado)}',
  '.tc .tc-sub{display:block;font-size:.76rem;font-weight:400;color:var(--texto-claro);white-space:normal}',
  '.tc caption{caption-side:bottom;text-align:left;font-size:.8rem;color:var(--texto-claro);padding:.7rem 0 0;line-height:1.5}',
  '@media (max-width:760px){.tc-rolagem{overflow:visible}.tc{min-width:0}'
    + '.tc thead{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}'
    + '.tc,.tc tbody,.tc tr,.tc td,.tc .tc-grupo th,.tc caption{display:block;width:auto}'
    + '.tc tbody tr{border:1px solid #e2e2e2;border-radius:.5rem;margin-bottom:.8rem;padding:.3rem .9rem .7rem;background:#fff}'
    + '.tc tbody tr.tc-grupo{border:0;border-radius:0;padding:0;margin:1.3rem 0 .6rem}'
    + '.tc .tc-grupo th{border:0;border-left:4px solid var(--verde);padding:.5rem .8rem}'
    + '.tc td{border:0;padding:.4rem 0;white-space:normal}'
    + '.tc td::before{content:attr(data-r);display:block;font-size:.7rem;text-transform:uppercase;letter-spacing:.06em;color:#8a8272;margin-bottom:.1rem}'
    + '.tc td.tc-vazio{display:none}}',
].join('\n    ');
function garanteCss(html) {
  const bloco = CSS_INI + '\n    ' + CSS + '\n    ' + CSS_FIM;
  const ini = html.indexOf(CSS_INI);
  if (ini >= 0) {
    const fim = html.indexOf(CSS_FIM, ini);
    if (fim < 0) throw new Error('GERA-CONDOMINIOS-TABELA: bloco de CSS sem a marca de fim');
    return html.slice(0, ini) + bloco + html.slice(fim + CSS_FIM.length);
  }
  const i = html.indexOf('</style>');
  if (i < 0) throw new Error('GERA-CONDOMINIOS-TABELA: página sem <style> para o CSS da tabela');
  return html.slice(0, i) + '    ' + bloco + '\n  ' + html.slice(i);
}

// ─── gravação ───
function genEm(html, marca, conteudo) {   // igual ao do gera-home.js
  const a = '<!--GEN:' + marca + '-->', b = '<!--/GEN:' + marca + '-->';
  const i = html.indexOf(a), j = html.indexOf(b);
  if (i < 0 || j < 0) return null;
  return html.slice(0, i + a.length) + conteudo + html.slice(j);
}
const arq = R + ARQ;
const antes = fs.readFileSync(arq, 'utf8');
if (antes.indexOf('<!--GEN:tabela-condominios-->') < 0) {
  console.error('GERA-CONDOMINIOS-TABELA: ' + ARQ + ' está sem o marcador <!--GEN:tabela-condominios--> (começo da section#guia). Nada foi gravado.');
  process.exit(1);
}
let s = garanteCss(antes);
const feitos = [], falhas = [], avisos = [];
const g = (marca, conteudo) => { const r = genEm(s, marca, conteudo); if (r === null) falhas.push(marca); else { s = r; feitos.push(marca); } };
g('tabela-condominios', BLOCO);
g('tc-lista', FAQ_LISTA);
g('tc-menor', FAQ_MENOR);
g('tc-entrega', FAQ_ENTREGA);

// conferência 1: a contagem do gera-home.js
const cont = /<!--GEN:contagem-->\s*(\d+)/.exec(s);
if (cont && +cont[1] !== N) avisos.push('a contagem do topo (GEN:contagem, gera-home.js) diz ' + cont[1] + ' e a tabela tem ' + N + ': rode o gera-home.js antes, ou o tipoLote dos dois geradores saiu de sincronia');
// conferência 2: a tabela "como se paga", escrita à mão, contra a fonte única
const pg = [...s.matchAll(/<tr\b[^>]*\bdata-pg="([a-z0-9-]+)"[^>]*\bdata-pg-tab="(\d{4}-\d{2})"/g)].map(m => ({ slug: m[1], tab: m[2] }));
if (pg.length) {
  for (const e of conds) {
    const l = pg.find(x => x.slug === e.slug);
    if (!l) avisos.push('"como se paga": falta a linha de ' + e.n);
    else if (l.tab !== e.tab) avisos.push('"como se paga": a linha de ' + e.n + ' foi escrita pela tabela de ' + mesDe(l.tab) + ' e a fonte única está em ' + mesDe(e.tab) + ': releia a condição na ficha e acerte a linha (e o data-pg-tab)');
  }
  for (const l of pg) if (!conds.some(e => e.slug === l.slug)) avisos.push('"como se paga": a linha de ' + l.slug + ' é de quem não está mais na tabela (saiu da fonte única ou está sem disponibilidade): tire a linha');
} else avisos.push('"como se paga": nenhuma linha com data-pg/data-pg-tab achada no guia (a conferência do mês da tabela não rodou)');

const mudou = s !== antes;
if (mudou && !ENSAIO) fs.writeFileSync(arq, s, 'utf8');
console.log('gera-condominios-tabela: ' + N + ' na tabela (' + grupos.map(x => x.itens.length + ' com ' + x.rot).join(' · ') + ') · menor ' + brl(menor.p) + ' (' + menor.n + ') · m² de ' + brl(m2Min) + ' a ' + brl(m2Max)
  + ' · ' + entregues.length + ' entregue(s) · trechos: ' + feitos.join(', ')
  + ' · ' + (mudou ? (ENSAIO ? 'MUDARIA a página (ensaio, nada gravado)' : 'página regravada') : 'página já estava igual'));
if (falhas.length) console.log('ATENCAO, nao achei o marcador: ' + falhas.join(', '));
avisos.forEach(a => console.log('ATENCAO: ' + a));
if (process.argv.includes('--mostrar')) console.log('\n── tabela-condominios ──' + BLOCO + '\n── tc-lista ──\n' + FAQ_LISTA + '\n── tc-menor ──\n' + FAQ_MENOR + '\n── tc-entrega ──\n' + FAQ_ENTREGA);
