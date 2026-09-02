/* ═══════════════════════════════════════════════════════════════════
   GERA-BLOG-OFERTAS — o blog vende, e o preço vem da fonte única
   ───────────────────────────────────────────────────────────────────
   Injeta em cada artigo do blog:

   - <!--GEN:aside-->   coluna lateral fixa (desktop) com cards de
                        empreendimentos escolhidos pelo TEMA do artigo
   - <!--GEN:oferta-->  card dentro do texto, antes do 2º <h2>

   Os preços saem de APTOS/LOTES de gera-folheto.js — mudou a tabela,
   roda o gerador e todo o blog acompanha. Nunca editar card à mão.

   A escolha é por tema, não aleatória: artigo de MCMV mostra MCMV,
   artigo de lote mostra lote. Card irrelevante é ruído e não converte.

   Também normaliza o menu dos artigos (Apartamentos · Loteamentos ·
   Condomínios · Blog + botão "Lançamentos de Imóveis" → home) e, no card
   de ofertas de apartamento, o link "Ver todos os apartamentos na planta".

   Ritual: node gera-folheto.js && node gera-observatorio.js &&
           node gera-home.js && node gera-blog-ofertas.js
   Ordem completa: gera-folheto → gera-observatorio → gera-home →
   gera-apartamentos → gera-blog-ofertas → gera-blog-indice →
   gera-relacionados → identidade.js (último).
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

// ─── quem entra em cada tema ───
const comPreco = a => a.filter(e => e.p).sort((x, y) => x.p - y.p);
const porSlug = s => APTOS.concat(LOTES).find(e => e.slug === s);
const mcmv    = () => comPreco(APTOS).filter(e => /MCMV/i.test(e.t || ''));
const altoP   = () => comPreco(APTOS).filter(e => /Alto padr/i.test(e.t || ''));
const lotes   = () => comPreco(LOTES);

// tema → lista de empreendimentos. O 1º vai no card DENTRO do texto;
// os demais vão na coluna lateral — por isso a lista tem 4, para o
// destaque do texto não se repetir na lateral.
const TEMAS = [
  { re: /minha-casa|mcmv|fgts|quem-tem-direito|como-comprar-apartamento|casa-propria-motorista/, nome: 'MCMV',
    url: '/?f=mcmv', chamada: 'Apartamentos Minha Casa Minha Vida disponíveis em Indaiatuba',
    pega: () => mcmv().slice(0, 4) },
  { re: /apartamento-ou-lote/, nome: 'apto+lote',
    url: '/', chamada: 'Apartamentos e lotes disponíveis em Indaiatuba',
    pega: () => [mcmv()[0], lotes()[0], lotes()[1], mcmv()[1]] },
  { re: /melhores-bairros|morar-em-indaiatuba$|morar-em-indaiatuba-e-bom/, nome: 'panorama',
    url: '/', chamada: 'Veja o que está disponível em Indaiatuba agora',
    pega: () => [mcmv()[0], lotes()[0], altoP()[0], mcmv()[1]] },
  { re: /quanto-custa|desvantagens|indaiatuba-ou-/, nome: 'entrada',
    url: '/?p=a', chamada: 'Imóveis até R$ 300 mil disponíveis em Indaiatuba',
    pega: () => [mcmv()[0], mcmv()[1], lotes()[0], lotes()[1]] },
  { re: /morar-em-indaiatuba-e-seguro|trabalhar-em-sao-paulo/, nome: 'cond. fechado',
    url: '/?f=fechado', chamada: 'Condomínios fechados disponíveis em Indaiatuba',
    pega: () => [porSlug('terras-de-san-marino-indaiatuba') || lotes()[2], lotes()[0], mcmv()[0], altoP()[0]] },
];
const paraTema = slug => {
  const t = TEMAS.find(t => t.re.test(slug)) || TEMAS[2];
  return { nome: t.nome, url: t.url, chamada: t.chamada, itens: t.pega().filter(Boolean) };
};

// ─── HTML dos cards ───
const wa = (nome) => 'https://wa.me/5519989769457?text=' +
  encodeURIComponent('Olá! Vi o ' + nome + ' no blog da Viv\'América e quero saber mais.');

function cardLateral(e) {
  const preco = e.p ? 'A partir de <b>' + brl(e.p) + '</b>' : 'Tabela sob consulta';
  const selo = (typeof e.est === 'number' && e.est <= 60)
    ? '<span class="bo-selo bo-urg">Últimas ' + e.est + '</span>'
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
  return `
      <div class="bo-inline">
        <img loading="lazy" decoding="async" src="/${e.img}" alt="${e.n} — Indaiatuba">
        <div class="bo-inline-txt">
          <span class="bo-eyebrow">Disponível agora em Indaiatuba</span>
          <h4>${e.n}</h4>
          <p class="bo-spec">${e.s} · ${e.c}</p>
          <p class="bo-preco">${preco}</p>
          <div class="bo-acoes">
            <a class="bo-btn-primario" href="/${e.slug}/" data-emp="${e.slug}">Ver o empreendimento</a>
            <a class="bo-btn-wpp" href="${wa(e.n)}" target="_blank" rel="noopener">WhatsApp</a>
          </div>${e.m2 ? '' : `
          <a class="bo-todos" href="/apartamentos-na-planta-indaiatuba/" data-emp="apartamentos-na-planta">Ver todos os apartamentos na planta →</a>`}
        </div>
      </div>`;
}

// ─── CSS + rastreamento (injetados uma vez por arquivo) ───
const CSS = `
  <style id="bo-estilo">
    /* Ofertas no blog — geradas por gera-blog-ofertas.js */
    .blog-layout{max-width:1200px;margin:2rem auto 3rem;padding:0 5%;display:grid;
      grid-template-columns:minmax(0,780px) 310px;gap:3rem;justify-content:center;align-items:start;}
    .blog-layout > article{max-width:none;margin:0;padding:0;}
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
    @media(max-width:1100px){
      .blog-layout{grid-template-columns:1fr;max-width:780px;gap:1.5rem;}
      .bo-aside{position:static;flex-direction:row;overflow-x:auto;padding-bottom:.5rem;
        scroll-snap-type:x mandatory;-webkit-overflow-scrolling:touch;}
      .bo-aside .bo-card{min-width:230px;scroll-snap-align:start;}
      .bo-aside-titulo{display:none;}
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

// ─── aplicação ───
const arquivos = fs.readdirSync(BLOG)
  .filter(d => fs.existsSync(BLOG + d + '/index.html'))
  .map(d => ({ slug: d, caminho: BLOG + d + '/index.html' }));

let feitos = 0, pulados = [];

arquivos.forEach(({ slug, caminho }) => {
  let h = fs.readFileSync(caminho, 'utf8');
  const { nome, url, chamada, itens } = paraTema(slug);
  if (!itens.length) { pulados.push(slug + ' (sem empreendimento)'); return; }

  // 1. CSS e rastreio — SUBSTITUÍDOS a cada rodada, para que ajuste de
  //    estilo feito aqui chegue aos 19 artigos sem edição manual
  h = h.includes('id="bo-estilo"')
    ? h.replace(/\n?\s*<style id="bo-estilo">[\s\S]*?<\/style>/, CSS)
    : h.replace('</head>', CSS + '\n</head>');
  h = h.includes('id="bo-rastreio"')
    ? h.replace(/\n?\s*<script id="bo-rastreio">[\s\S]*?<\/script>/, RASTREIO)
    : h.replace('</body>', RASTREIO + '\n</body>');

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
  //     coluna lateral, então o convite vem logo depois do resumo e cai na
  //     home com o filtro do tema já ativo (a home lê /?f= /?t= /?p= /?s=)
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

  gen('aside',
    '\n        <p class="bo-aside-titulo">Lançamentos em Indaiatuba</p>' +
    (itens.length > 1 ? itens.slice(1) : itens).map(cardLateral).join('') +
    '\n        <a class="bo-card" href="/precos-lancamentos-indaiatuba/" data-emp="observatorio">' +
    '\n          <div class="bo-corpo"><span class="bo-selo">Observatório</span>' +
    '\n          <h4>Tabela de preços de Indaiatuba</h4>' +
    '\n          <p class="bo-spec">Todos os lançamentos com preço aberto, sem cadastro.</p>' +
    '\n          <span class="bo-btn">Ver a tabela →</span></div></a>\n      ');

  gen('oferta', cardTexto(itens[0]) + '\n    ');

  gen('cta-topo',
    '\n      <div class="cta-topo">' +
    '\n        <p>' + chamada + '</p>' +
    '\n        <a href="' + url + '" data-emp="cta-topo">Ver imóveis disponíveis</a>' +
    '\n      </div>\n    ');

  fs.writeFileSync(caminho, h, 'utf8');
  feitos++;
});

console.log('gera-blog-ofertas: ' + feitos + '/' + arquivos.length + ' artigos com oferta');
if (pulados.length) console.log('  pulados: ' + pulados.join(', '));
