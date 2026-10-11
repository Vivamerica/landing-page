/* ═══════════════════════════════════════════════════════════════════
   GERA-BLOG-OFERTAS — o blog vende, e o preço vem da fonte única
   ───────────────────────────────────────────────────────────────────
   Injeta em cada artigo do blog:

   - <!--GEN:aside-->    coluna lateral fixa (desktop) com cards de
                         empreendimentos escolhidos pelo TEMA do artigo
   - <!--GEN:oferta-->   card dentro do texto, antes do 2º <h2>: um
                         empreendimento (MCMV, FGTS, lotes, Alphaville) ou a
                         tabela "por faixa de preço" (comparativos e "morar")
   - <!--GEN:cta-topo--> logo depois do bloco "Resposta direta"/resumo:
                         botão de WhatsApp com a mensagem que NOMEIA a
                         intenção do artigo (o funil do CRM lê a 1ª frase)
                         + link para a lista do tema
   - <!--GEN:barra-->    barra fixa no rodapé do celular (≤ 680 px) com o
                         mesmo convite
   - <script id="ga4">   tag GA4 com guarda: não carrega em localhost,
                         127.0.0.1 nem *.netlify.app; o whatsapp_click manda
                         event_label (texto do botão), cta_pos
                         (hero | meio | flutuante | rodape | barra) e origem
                         (slug do artigo)

   Os preços saem de APTOS/LOTES de gera-folheto.js — mudou a tabela,
   roda o gerador e todo o blog acompanha. Nunca editar card à mão.

   A escolha é por tema, não aleatória: artigo de MCMV mostra MCMV,
   artigo de bairro mostra loteamento, comparativo mostra a tabela por
   faixa. Card irrelevante é ruído e não converte.

   Mensagens de WhatsApp seguem os moldes da casa (nome oficial da fonte
   única; "Olá! Quero a tabela de preços do X…" / "…tabela de lotes do X…").

   Também normaliza o menu dos artigos (Apartamentos · Loteamentos ·
   Condomínios · Blog + botão "Lançamentos de Imóveis" → home).

   Ritual: node gera-folheto.js && node gera-observatorio.js &&
           node gera-home.js && node gera-blog-ofertas.js
   Ordem completa: gera-folheto → gera-observatorio → gera-home →
   gera-apartamentos → gera-alphaville → gera-blog-ofertas →
   gera-blog-indice → gera-relacionados → identidade.js (último).
   ═══════════════════════════════════════════════════════════════════ */

const fs = require('fs');
const R = __dirname + '/';
const BLOG = R + 'blog/';

// ─── fonte única ───
function extrair(arquivo, nome) {
  const src = fs.readFileSync(R + arquivo, 'utf8');
  const ini = src.indexOf('const ' + nome + ' = ');
  if (ini < 0) throw new Error(nome + ' nao achado em ' + arquivo);
  const fim = src.indexOf('\n];', ini) + 2;
  return eval('(' + src.slice(ini + ('const ' + nome + ' = ').length, fim) + ')');
}
const APTOS = extrair('gera-folheto.js', 'APTOS');
const LOTES = extrair('gera-folheto.js', 'LOTES');
const brl = n => 'R$ ' + n.toLocaleString('pt-BR');

// mês da edição do Observatório: gera-observatorio.js é o dono de EDICAO
// (lido como texto, sem require, para não rodar o observatório daqui)
const EDICAO = (() => {
  const src = fs.readFileSync(R + 'gera-observatorio.js', 'utf8');
  const ini = src.indexOf('const EDICAO = ');
  const fim = src.indexOf('};', ini) + 1;
  return eval('(' + src.slice(ini + 'const EDICAO = '.length, fim) + ')');
})();
const edicao = EDICAO.mes.toLowerCase() + '/' + EDICAO.ano;   // setembro/2026

// ─── quem entra em cada tema ───
const comPreco = a => a.filter(e => e.p).sort((x, y) => x.p - y.p);
const porSlug = s => APTOS.concat(LOTES).find(e => e.slug === s);
const mcmv    = () => comPreco(APTOS).filter(e => /MCMV/i.test(e.t || ''));
const altoP   = () => comPreco(APTOS).filter(e => /Alto padr/i.test(e.t || ''));
const lotes   = () => comPreco(LOTES);
// condomínios fechados do mais caro para o mais barato: é o público do
// artigo de marca (Alphaville), que não tem nada a ver com MCMV
const fechados = () => comPreco(LOTES).filter(e => /fechado/i.test(e.t || '')).reverse();

// ─── WhatsApp: moldes da casa ───
const WA = 'https://wa.me/5519989769457?text=';
const waUrl = msg => WA + encodeURIComponent(msg);
// "Reserva Botânica" é o único nome feminino da base
const de = n => (/^Reserva Bot/.test(n) ? 'da ' : 'do ') + n;
// lote ou apartamento se decide pela lista de origem (APTOS também traz m2 desde out/2026)
const ehLote = e => LOTES.some(l => l.slug === e.slug);
const msgTabela = e => ehLote(e)
  ? 'Olá! Quero a tabela de lotes ' + de(e.n) + ' com quadra, metragem e valor.'
  : 'Olá! Quero a tabela de preços ' + de(e.n) + ' com as unidades disponíveis.';

// mensagem do CTA do artigo: nomeia a INTENÇÃO de quem leu aquele tema
const MSG = {
  mcmv:       'Olá! Quero ver os apartamentos Minha Casa Minha Vida de Indaiatuba com preço.',
  fgts:       'Olá! Quero usar meu FGTS num apartamento em Indaiatuba.',
  lotes:      'Olá! Quero ver lotes à venda em Indaiatuba.',
  faixa:      'Olá! Quero conhecer os lançamentos de Indaiatuba por faixa de preço.',
  dinheiro:   'Olá! Quero simular a compra de um apartamento em Indaiatuba com preço e condições.',
  alphaville: 'Olá! Tenho interesse no Alphaville Indaiatuba. Pode me enviar mais informações?',
};

// tetos de valor do imóvel usados para escolher a oferta do artigo do Classe Média:
// R$ 400.000 na Faixa 3 do MCMV e R$ 600.000 no programa Classe Média do FGTS
const TETO_FAIXA_3 = 400000, TETO_CLASSE_MEDIA = 600000;

// tema → lista de empreendimentos. Com card "emp", o 1º vai no card DENTRO
// do texto e os demais na coluna lateral — por isso a lista tem 4, para o
// destaque do texto não se repetir na lateral. Com card "faixa", o texto
// recebe a tabela por faixa de preço e os 4 vão para a lateral.
// A ORDEM importa: o 1º regex que casar com o slug vence.
const TEMAS = [
  // Artigo de marca de alto padrão: sem ele, o artigo do Alphaville caía no
  // tema genérico e abria com o apartamento MCMV mais barato da base.
  { re: /alphaville/, nome: 'Alphaville', card: 'emp', msg: MSG.alphaville,
    url: '/alphaville/', chamada: 'Todos os empreendimentos Alphaville', curta: 'Lotes do Alphaville Indaiatuba',
    botao: 'Ver os empreendimentos',
    pega: () => [porSlug('alphaville-indaiatuba'),
                 ...fechados().filter(e => e.slug !== 'alphaville-indaiatuba').slice(0, 3)] },
  // o hospital fica no Parque dos Pássaros: o Tangará abre
  { re: /hospital-parque-dos-passaros/, nome: 'MCMV · Parque dos Pássaros', card: 'emp', msg: MSG.mcmv,
    url: '/?f=mcmv', chamada: 'Apartamentos Minha Casa Minha Vida no Parque dos Pássaros, com preço',
    curta: 'Apartamentos MCMV com preço',
    pega: () => [porSlug('gran-vic-tangara-indaiatuba'),
                 ...mcmv().filter(e => e.slug !== 'gran-vic-tangara-indaiatuba').slice(0, 3)] },
  // MCMV vem ANTES de FGTS: "como-comprar-apartamento-sem-fgts" é artigo de
  // quem NÃO tem FGTS — a mensagem de FGTS estaria errada ali
  { re: /minha-casa|mcmv|quem-tem-direito|como-comprar-apartamento|casa-propria-motorista/, nome: 'MCMV', card: 'emp', msg: MSG.mcmv,
    url: '/?f=mcmv', chamada: 'Apartamentos Minha Casa Minha Vida disponíveis em Indaiatuba', curta: 'Apartamentos MCMV com preço',
    pega: () => mcmv().slice(0, 4) },
  // Programa Classe Média do FGTS: vem ANTES de /fgts/, que também casa com o slug
  // "fgts-classe-media-…" e levaria o artigo para o filtro MCMV, com a mensagem de
  // quem tem FGTS para usar. A oferta são os apartamentos que só entram por esse
  // programa: preço acima do teto da Faixa 3 do MCMV e até o teto do Classe Média
  // (os mesmos valores citados no artigo).
  { re: /fgts-classe-media/, nome: 'classe-media', card: 'emp', msg: MSG.dinheiro,
    url: '/precos-lancamentos-indaiatuba/', chamada: 'Apartamentos de Indaiatuba até R$ 600 mil, com preço aberto', curta: 'Apartamentos até R$ 600 mil',
    botao: 'Ver a tabela de preços',
    pega: () => {
      const ate = comPreco(APTOS).filter(e => e.p <= TETO_CLASSE_MEDIA);
      const so = ate.filter(e => e.p > TETO_FAIXA_3);
      return (so.length ? so : ate).slice(0, 4);   // sem nenhum acima da Faixa 3, vale qualquer um até o teto
    } },
  { re: /fgts/, nome: 'FGTS', card: 'emp', msg: MSG.fgts,
    url: '/?f=mcmv', chamada: 'Apartamentos em Indaiatuba que aceitam FGTS, com preço aberto', curta: 'Apartamentos que aceitam FGTS',
    pega: () => mcmv().slice(0, 4) },
  // artigos de dinheiro (pauta out/2026): a pessoa ja' esta' fazendo conta — o card
  // e' o apartamento mais barato com preco aberto e a lateral completa a lista
  { re: /renda-necessaria|itbi-escritura|incc-parcela|comprar-na-planta|depois-das-chaves|patrimonio-de-afetacao/, nome: 'dinheiro', card: 'emp', msg: MSG.dinheiro,
    url: '/precos-lancamentos-indaiatuba/', chamada: 'Lançamentos de Indaiatuba com preço aberto e condições de pagamento', curta: 'Lançamentos com preço aberto',
    botao: 'Ver a tabela de preços',
    pega: () => mcmv().slice(0, 4) },
  { re: /quanto-custa-construir|condominio-de-lotes/, nome: 'dinheiro-lotes', card: 'emp', msg: MSG.lotes,
    url: '/loteamentos-em-indaiatuba/', chamada: 'Lotes à venda em Indaiatuba: loteamentos e condomínios com preço aberto',
    curta: 'Lotes à venda em Indaiatuba', botao: 'Ver os loteamentos',
    pega: () => lotes().slice(0, 4) },
  { re: /melhores-bairros/, nome: 'lotes', card: 'emp', msg: MSG.lotes,
    url: '/loteamentos-em-indaiatuba/', chamada: 'Lotes à venda em Indaiatuba: loteamentos e condomínios com preço aberto',
    curta: 'Lotes à venda em Indaiatuba', botao: 'Ver os loteamentos',
    pega: () => lotes().slice(0, 4) },
  // comparativos e cluster "morar": a pessoa ainda escolhe tipo e faixa —
  // o card é a tabela por faixa de preço, não um empreendimento
  { re: /apartamento-ou-lote|morar-em-indaiatuba|quanto-custa|desvantagens|indaiatuba-ou-|trabalhar-em-sao-paulo/, nome: 'faixa', card: 'faixa', msg: MSG.faixa,
    url: '/precos-lancamentos-indaiatuba/', chamada: 'Lançamentos de Indaiatuba por faixa de preço, com tabela aberta',
    curta: 'Lançamentos por faixa de preço', botao: 'Ver a tabela de preços',
    pega: () => [mcmv()[0], lotes()[0], altoP()[0], fechados().slice(-1)[0]] },
];
// Fallback pelo NOME, nunca por índice: enquanto era TEMAS[2], bastou inserir um
// tema novo no começo da lista para o artigo do hospital trocar de oferta sozinho.
const paraTema = slug => {
  const t = TEMAS.find(t => t.re.test(slug)) || TEMAS.find(t => t.nome === 'faixa');
  return { nome: t.nome, url: t.url, chamada: t.chamada, curta: t.curta, msg: t.msg, card: t.card,
           botao: t.botao || 'Ver imóveis disponíveis',
           itens: t.pega().filter(Boolean) };
};

// ─── HTML dos cards ───
function cardLateral(e) {
  const preco = e.p ? 'A partir de <b>' + brl(e.p) + '</b>' : 'Tabela sob consulta';
  // selo de escassez só com a data da contagem (estEm da fonte única); sem data, selo de tipo
  const selo = (typeof e.est === 'number' && e.est <= 60 && e.estEm)
    ? '<span class="bo-selo bo-urg">Últimas ' + e.est + ' (' + e.estEm + ')</span>'
    : '<span class="bo-selo">' + e.t + '</span>';
  return `
        <a class="bo-card" href="/${e.slug}/" data-emp="${e.slug}">
          <img loading="lazy" decoding="async" src="/${e.img}" alt="${e.n} — Indaiatuba">
          <div class="bo-corpo">
            ${selo}
            <h4>${e.n}</h4>
            <p class="bo-spec">${e.s}</p>
            <p class="bo-preco">${preco}</p>
            <span class="bo-btn">Ver detalhes →</span>
          </div>
        </a>`;
}

function cardTexto(e) {
  const preco = e.p ? 'A partir de <b>' + brl(e.p) + '</b>' : 'Tabela sob consulta';
  const todos = ehLote(e)
    ? '<a class="bo-todos" href="/loteamentos-em-indaiatuba/" data-emp="loteamentos">Ver todos os loteamentos →</a>'
    : '<a class="bo-todos" href="/apartamentos-na-planta-indaiatuba/" data-emp="apartamentos-na-planta">Ver todos os apartamentos na planta →</a>';
  // quem ainda está em pré-lançamento (campo prox da fonte única) não é "disponível agora";
  // só prox não basta: há produto com prox que já está em lançamento
  const rotulo = /pré-lançamento|breve lançamento/i.test(e.prox || '') ? 'Pré-lançamento em Indaiatuba'
    : e.t === 'Lançamento' ? 'Em lançamento em Indaiatuba' : 'Disponível agora em Indaiatuba';
  return `
      <div class="bo-inline">
        <img loading="lazy" decoding="async" src="/${e.img}" alt="${e.n} — Indaiatuba">
        <div class="bo-inline-txt">
          <span class="bo-eyebrow">${rotulo}</span>
          <h4>${e.n}</h4>
          <p class="bo-spec">${e.s} · ${e.c}</p>
          <p class="bo-preco">${preco}</p>
          <div class="bo-acoes">
            <a class="bo-btn-primario" href="/${e.slug}/" data-emp="${e.slug}">Ver o empreendimento</a>
            <a class="bo-btn-wpp" href="${waUrl(msgTabela(e))}" data-cta="meio" target="_blank" rel="noopener">${ehLote(e) ? 'Pedir a tabela de lotes' : 'Pedir a tabela de preços'}</a>
          </div>
          ${todos}
        </div>
      </div>`;
}

// tabela por faixa de preço: menor "a partir de" de apartamento e de lote em
// cada faixa, direto da fonte única
function cardFaixa() {
  const ap = comPreco(APTOS), lo = comPreco(LOTES);
  const FAIXAS = [
    ['Até R$ 300 mil',          0,       300000],
    ['R$ 300 mil a R$ 500 mil', 300000,  500000],
    ['R$ 500 mil a R$ 1 milhão', 500000, 1000000],
    ['Acima de R$ 1 milhão',    1000000, Infinity],
  ];
  const cel = (lista, a, b) => {
    const dentro = lista.filter(e => e.p > a && e.p <= b);
    if (!dentro.length) return '<td>—</td>';
    const e = dentro[0];
    const mais = dentro.length > 1 ? ' <small>e mais ' + (dentro.length - 1) + '</small>' : '';
    return `<td><a href="/${e.slug}/" data-emp="${e.slug}">${e.n}</a> · ${brl(e.p)}${mais}</td>`;
  };
  const linhas = FAIXAS.map(([rot, a, b]) =>
    `          <tr><th scope="row">${rot}</th>${cel(ap, a, b)}${cel(lo, a, b)}</tr>`).join('\n');
  return `
      <div class="bo-faixa">
        <span class="bo-eyebrow">Lançamentos em Indaiatuba por faixa de preço</span>
        <div class="tab-wrap" style="overflow-x:auto;-webkit-overflow-scrolling:touch;max-width:100%"><table class="bo-tab">
          <caption>Menor preço "a partir de" em cada faixa, entre os lançamentos que representamos · tabelas das incorporadoras reunidas no Observatório de Preços, edição de ${edicao}</caption>
          <thead><tr><th>Faixa</th><th>Apartamento</th><th>Lote</th></tr></thead>
          <tbody>
${linhas}
          </tbody>
        </table></div>
        <div class="bo-acoes">
          <a class="bo-btn-primario" href="/precos-lancamentos-indaiatuba/" data-emp="observatorio-faixa">Ver a tabela completa</a>
          <a class="bo-btn-wpp" href="${waUrl(MSG.faixa)}" data-cta="meio" target="_blank" rel="noopener">Pedir por faixa no WhatsApp</a>
        </div>
      </div>`;
}

// ─── CSS + rastreamento (injetados uma vez por arquivo) ───
const CSS = `
  <style id="bo-estilo">
    /* Ofertas no blog — geradas por gera-blog-ofertas.js */
    .blog-layout{max-width:1200px;margin:2rem auto 3rem;padding:0 5%;display:grid;
      grid-template-columns:minmax(0,780px) 310px;gap:3rem;justify-content:center;align-items:start;}
    .blog-layout > article{max-width:none;margin:0;padding:0;min-width:0;}
    /* min-width:0 — item flex herda min-content do filho mais largo (a tabela
       com min-width:640px) e no celular empurrava o artigo para fora da tela;
       com 0, o .tab-wrap volta a rolar por dentro (02/09/2026). */
    .bo-aside{position:sticky;top:90px;display:flex;flex-direction:column;gap:1rem;}
    .bo-aside-titulo{font-size:.72rem;text-transform:uppercase;letter-spacing:1.5px;
      color:#C9A227;font-weight:800;margin-bottom:.2rem;}
    .bo-card{display:block;border:1px solid #e6e6e6;border-radius:4px;overflow:hidden;
      background:#fff;text-decoration:none;color:inherit;transition:border-color .15s,box-shadow .15s;}
    .bo-card:hover{border-color:#C9A227;box-shadow:0 6px 18px rgba(0,0,0,.08);}
    .bo-card img{width:100%;height:130px;object-fit:cover;display:block;}
    .bo-corpo{padding:.8rem .9rem 1rem;}
    .bo-selo{display:inline-block;background:#161616;color:#C9A227;font-size:.66rem;font-weight:800;
      text-transform:uppercase;letter-spacing:.5px;padding:.2rem .55rem;border-radius:4px;}
    .bo-selo.bo-urg{background:#C62828;color:#fff;}
    .bo-corpo h4{font-size:1rem;color:#161616;font-weight:800;margin:.5rem 0 .25rem;line-height:1.25;}
    .bo-spec{font-size:.8rem;color:#666;margin:0 0 .4rem;line-height:1.45;}
    .bo-preco{font-size:.9rem;color:#161616;margin:0 0 .6rem;}
    .bo-preco b{color:#8f7418;font-size:1.02rem;}
    .bo-btn{font-size:.82rem;font-weight:800;color:#1565C0;}
    /* card dentro do texto */
    .bo-inline{display:flex;gap:1.1rem;background:#FBF8F0;border:1px solid #E4D9BC;
      border-radius:4px;padding:1rem;margin:2rem 0;align-items:center;}
    .bo-inline img{width:150px;height:115px;object-fit:cover;border-radius:10px;flex-shrink:0;}
    .bo-inline-txt{min-width:0;}
    .bo-eyebrow{font-size:.68rem;text-transform:uppercase;letter-spacing:1.2px;color:#8f7418;font-weight:800;}
    .bo-inline-txt h4{font-size:1.15rem;color:#161616;font-weight:800;margin:.25rem 0 .3rem;}
    .bo-acoes{display:flex;gap:.6rem;flex-wrap:wrap;margin-top:.7rem;}
    /* 44px de altura minima: area de toque confortavel no celular */
    .bo-btn-primario,.bo-btn-wpp{font-size:.84rem;font-weight:800;text-decoration:none;
      padding:.7rem 1.2rem;border-radius:4px;display:inline-flex;align-items:center;
      min-height:44px;}
    .bo-btn-primario{background:#161616;color:#fff;}
    .bo-btn-wpp{background:#25D366;color:#fff;}
    .bo-btn-primario:hover,.bo-btn-wpp:hover{opacity:.9;}
    .bo-todos{display:inline-block;margin-top:.6rem;font-size:.8rem;font-weight:800;color:#8f7418;text-decoration:none;}
    .bo-todos:hover{color:#161616;}
    /* tabela por faixa de preço (comparativos e cluster "morar") */
    .bo-faixa{background:#FBF8F0;border:1px solid #E4D9BC;border-radius:4px;padding:1rem;margin:2rem 0;min-width:0;}
    .bo-tab{width:100%;min-width:460px;border-collapse:collapse;font-size:.86rem;margin:.6rem 0 0;}
    .bo-tab caption{caption-side:bottom;text-align:left;font-size:.74rem;color:#666;padding:.55rem 0 0;line-height:1.4;}
    .bo-tab th,.bo-tab td{border-bottom:1px solid #E4D9BC;padding:.5rem .6rem;text-align:left;vertical-align:top;line-height:1.4;}
    .bo-tab thead th{background:#161616;color:#fff;font-weight:700;}
    .bo-tab tbody th{font-weight:700;color:#161616;white-space:nowrap;}
    .bo-tab a{color:#1565C0;font-weight:700;text-decoration:none;}
    .bo-tab small{color:#777;font-size:.78rem;}
    /* CTA do topo: WhatsApp com a intenção do artigo + link da lista */
    .cta-topo-acoes{display:flex;gap:.6rem;flex-wrap:wrap;align-items:center;}
    .cta-topo a.cta-wpp{background:#25D366;color:#fff;}
    .cta-topo a.cta-wpp:hover{background:#1ebe5a;}
    /* barra fixa do celular: só aparece em telas estreitas */
    .bo-barra{display:none;}
    @media(max-width:1100px){
      .blog-layout{grid-template-columns:1fr;max-width:780px;gap:1.5rem;}
      .bo-aside{position:static;flex-direction:row;overflow-x:auto;padding-bottom:.5rem;min-width:0;max-width:100%;
        scroll-snap-type:x mandatory;-webkit-overflow-scrolling:touch;}
      .bo-aside .bo-card{min-width:230px;scroll-snap-align:start;}
      .bo-aside-titulo{display:none;}
    }
    @media(max-width:680px){
      .bo-barra{display:flex;position:fixed;left:0;right:0;bottom:0;z-index:95;align-items:center;gap:.7rem;
        background:#161616;color:#fff;padding:.55rem 4% calc(.55rem + env(safe-area-inset-bottom));
        box-shadow:0 -4px 14px rgba(0,0,0,.25);}
      .bo-barra span{flex:1 1 0;min-width:0;font-size:.8rem;line-height:1.3;font-weight:300;}
      .bo-barra-wpp{flex:0 0 auto;background:#25D366;color:#fff;font-weight:800;font-size:.84rem;text-decoration:none;
        padding:.6rem .95rem;border-radius:4px;min-height:44px;display:inline-flex;align-items:center;white-space:nowrap;}
      footer{padding-bottom:5.5rem;}
    }
    @media(max-width:560px){
      .bo-inline{flex-direction:column;align-items:flex-start;}
      .bo-inline img{width:100%;height:150px;}
    }
  </style>`;

const RASTREIO = `
  <script id="bo-rastreio">
    // mede se a oferta no blog vale a pena
    document.addEventListener('click', function (e) {
      var a = e.target.closest('[data-emp]');
      if (a && typeof gtag === 'function') {
        gtag('event', 'blog_card_click', {
          event_category: 'blog_oferta',
          event_label: a.getAttribute('data-emp'),
          artigo: document.title
        });
      }
    });
  </script>`;

// GA4 com guarda de ambiente. Substitui o par <script async src=…gtag/js…> +
// <script>gtag(...)</script> que os artigos traziam escrito à mão; nas rodadas
// seguintes substitui a si mesmo (id="ga4"). O whatsapp_click manda o texto do
// botão, a posição do CTA e o slug do artigo — sem isso o GA4 não diz qual
// botão converteu.
const GA4 = String.raw`  <script id="ga4">
    // GA4 só em produção: localhost, 127.0.0.1 e previews *.netlify.app ficam fora da medição
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    (function () {
      if (/localhost|127\.0\.0\.1|netlify\.app$/.test(location.hostname)) return;
      var s = document.createElement('script');
      s.async = true; s.src = 'https://www.googletagmanager.com/gtag/js?id=G-40C0379NPR';
      document.head.appendChild(s);
      gtag('js', new Date()); gtag('config', 'G-40C0379NPR');
    })();
    document.addEventListener('click', function (e) {
      var el = e.target.closest('a[href*="wa.me"]');
      if (!el) return;
      var pos = el.getAttribute('data-cta') ||
        (el.closest('.cta-topo') ? 'hero' : el.closest('.bo-barra') ? 'barra' :
         el.closest('footer, .cta') ? 'rodape' : 'meio');
      gtag('event', 'whatsapp_click', {
        event_category: 'conversao',
        event_label: (el.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 100),
        cta_pos: pos,
        origem: location.pathname.replace(/^\/blog\//, '').replace(/\/$/, '') || 'blog'
      });
    });
  </script>`;
const reGA4Velho = /[ \t]*(?:<!-- Google[^\n]*-->\n)?[ \t]*<script async src="https:\/\/www\.googletagmanager\.com\/gtag\/js\?id=G-40C0379NPR"><\/script>\n[ \t]*<script>[\s\S]*?<\/script>/;
const reGA4Novo  = /[ \t]*<script id="ga4">[\s\S]*?<\/script>/;

// ─── aplicação ───
const arquivos = fs.readdirSync(BLOG)
  .filter(d => fs.existsSync(BLOG + d + '/index.html'))
  .map(d => ({ slug: d, caminho: BLOG + d + '/index.html' }));

let feitos = 0, pulados = [], semGa4 = [];

arquivos.forEach(({ slug, caminho }) => {
  let h = fs.readFileSync(caminho, 'utf8');
  const { nome, url, chamada, curta, msg, card, botao, itens } = paraTema(slug);
  if (!itens.length) { pulados.push(slug + ' (sem empreendimento)'); return; }

  // 1. CSS e rastreio — SUBSTITUÍDOS a cada rodada, para que ajuste de
  //    estilo feito aqui chegue aos artigos sem edição manual
  h = h.includes('id="bo-estilo"')
    ? h.replace(/\n?\s*<style id="bo-estilo">[\s\S]*?<\/style>/, CSS)
    : h.replace('</head>', CSS + '\n</head>');
  h = h.includes('id="bo-rastreio"')
    ? h.replace(/\n?\s*<script id="bo-rastreio">[\s\S]*?<\/script>/, RASTREIO)
    : h.replace('</body>', RASTREIO + '\n</body>');

  // 1.5 GA4 com guarda — idem, substituído a cada rodada
  if (reGA4Novo.test(h)) {
    h = h.replace(reGA4Novo, GA4);
  } else {
    const m = h.match(reGA4Velho);
    if (m && m[0].includes("gtag('config'")) h = h.replace(reGA4Velho, GA4);
    else semGa4.push(slug);
  }

  // 2. envolver <article> num grid com a coluna lateral (idempotente)
  if (!h.includes('class="blog-layout"')) {
    const ia = h.indexOf('<article>');
    const ifim = h.indexOf('</article>');
    if (ia < 0 || ifim < 0) { pulados.push(slug + ' (sem <article>)'); return; }
    const corpo = h.slice(ia, ifim + '</article>'.length);
    const bloco =
      '<div class="blog-layout">\n' + corpo +
      '\n      <aside class="bo-aside">\n<!--GEN:aside--><!--/GEN:aside-->\n      </aside>\n    </div>';
    h = h.slice(0, ia) + bloco + h.slice(ifim + '</article>'.length);
  }

  // 3. marcador do card no texto — antes do 2º <h2> do artigo
  if (!h.includes('<!--GEN:oferta-->')) {
    const ia = h.indexOf('<article>');
    const ifim = h.indexOf('</article>');
    let art = h.slice(ia, ifim);
    const h2s = [...art.matchAll(/<h2[\s>]/g)];
    const alvo = h2s[1] || h2s[0];
    if (alvo) {
      art = art.slice(0, alvo.index) + '<!--GEN:oferta--><!--/GEN:oferta-->\n    ' + art.slice(alvo.index);
      h = h.slice(0, ia) + art + h.slice(ifim);
    }
  }

  // 3.5 CTA de conversão no topo do texto — quem está no celular não vê a
  //     coluna lateral, então o convite vem logo depois do resumo
  //     ("Resposta direta") com o WhatsApp da intenção do artigo
  if (!h.includes('<!--GEN:cta-topo-->')) {
    const iResumo = h.indexOf('class="resumo"');
    if (iResumo > -1) {
      const fimResumo = h.indexOf('</p>', iResumo) + 4;
      h = h.slice(0, fimResumo) + '\n\n    <!--GEN:cta-topo--><!--/GEN:cta-topo-->' + h.slice(fimResumo);
    } else {
      const ia2 = h.indexOf('<article>');
      const primeiroH2 = h.indexOf('<h2', ia2);
      if (primeiroH2 > -1) h = h.slice(0, primeiroH2) + '<!--GEN:cta-topo--><!--/GEN:cta-topo-->\n    ' + h.slice(primeiroH2);
    }
  }

  // 3.7 barra fixa do celular — marcador antes do </body>
  if (!h.includes('<!--GEN:barra-->')) {
    h = h.replace('</body>', '  <!--GEN:barra--><!--/GEN:barra-->\n</body>');
  }

  // menu (padrão do site desde 02/09/2026): Apartamentos · Loteamentos ·
  // Condomínios · Blog, e o botão de destaque "Lançamentos de Imóveis"
  // aponta para a HOME — ela é a única dona do termo; o hub
  // /lancamentos-indaiatuba/ virou 301. Idempotente.
  h = h.replace(/<a href="\/lancamentos-indaiatuba\/">Lançamentos<\/a>/g,
                '<a class="nav-cta" href="/">Lançamentos de Imóveis</a>');
  h = h.replace(/<a class="nav-cta" href="\/lancamentos-indaiatuba\/">/g, '<a class="nav-cta" href="/">');
  h = h.replace(/<nav>([\s\S]*?)<\/nav>/, (bloco, dentro) => {
    if (dentro.includes('/apartamentos-na-planta-indaiatuba/')) return bloco;
    const novo = dentro.replace(/(\s*)(<a href="\/loteamentos-em-indaiatuba\/">)/,
      '$1<a href="/apartamentos-na-planta-indaiatuba/">Apartamentos</a>$1$2');
    return '<nav>' + novo + '</nav>';
  });

  // 4. preencher os marcadores (sempre — é daqui que vem o preço atualizado)
  const gen = (marca, conteudo) => {
    const a = '<!--GEN:' + marca + '-->', b = '<!--/GEN:' + marca + '-->';
    const i = h.indexOf(a), j = h.indexOf(b);
    if (i < 0 || j < 0) return false;
    h = h.slice(0, i + a.length) + conteudo + h.slice(j);
    return true;
  };

  const lateral = card === 'faixa' ? itens : (itens.length > 1 ? itens.slice(1) : itens);
  gen('aside',
    '\n        <p class="bo-aside-titulo">Lançamentos em Indaiatuba</p>' +
    lateral.map(cardLateral).join('') +
    '\n        <a class="bo-card" href="/precos-lancamentos-indaiatuba/" data-emp="observatorio">' +
    '\n          <div class="bo-corpo"><span class="bo-selo">Observatório</span>' +
    '\n          <h4>Tabela de preços de Indaiatuba</h4>' +
    '\n          <p class="bo-spec">Todos os lançamentos com preço aberto, sem cadastro.</p>' +
    '\n          <span class="bo-btn">Ver a tabela →</span></div></a>\n      ');

  gen('oferta', (card === 'faixa' ? cardFaixa() : cardTexto(itens[0])) + '\n    ');

  gen('cta-topo',
    '\n      <div class="cta-topo">' +
    '\n        <p>' + chamada + '</p>' +
    '\n        <div class="cta-topo-acoes">' +
    '\n          <a class="cta-wpp" href="' + waUrl(msg) + '" data-cta="hero" target="_blank" rel="noopener">Falar no WhatsApp</a>' +
    '\n          <a href="' + url + '" data-emp="cta-topo">' + botao + '</a>' +
    '\n        </div>' +
    '\n      </div>\n    ');

  gen('barra',
    '\n  <div class="bo-barra" role="complementary" aria-label="Contato rápido">' +
    '\n    <span>' + curta + '</span>' +
    '\n    <a class="bo-barra-wpp" href="' + waUrl(msg) + '" data-cta="barra" target="_blank" rel="noopener">Falar no WhatsApp</a>' +
    '\n  </div>\n  ');

  fs.writeFileSync(caminho, h, 'utf8');
  feitos++;
});

console.log('gera-blog-ofertas: ' + feitos + '/' + arquivos.length + ' artigos com oferta');
if (pulados.length) console.log('  pulados: ' + pulados.join(', '));
if (semGa4.length) console.log('  SEM tag GA4 reconhecida (nem antiga nem nova): ' + semGa4.join(', '));
