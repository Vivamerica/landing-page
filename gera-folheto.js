const fs = require('fs');
const OUT = 'C:/Users/Usuario/Desktop/landing-page/folheto-lancamentos.html';

const APTOS = [
  { n:'Uni Residencial', c:'Masotti', p:279990, img:'uni-residencial-indaiatuba/images/hero.jpg',
    s:'2 dorm c/ suíte · sacada · vaga coberta', t:'MCMV · FGTS', slug:'uni-residencial-indaiatuba' },
  { n:'Gran Vic Tangará', c:'VIC Engenharia', p:330000, img:'gran-vic-tangara-indaiatuba/images/hero.jpg',
    s:'2 dorm · 47,22 m² · 78 unidades (set/2026) · entrega nov/2028', t:'MCMV · FGTS', slug:'gran-vic-tangara-indaiatuba' },
  { n:'Gran Vic Colibri', c:'VIC Engenharia', p:334479, img:'gran-vic-colibri-indaiatuba/images/hero.jpg',
    s:'2 dorm c/ suíte · 51,42 m² · 84 unidades (set/2026) · entrega dez/2028', t:'MCMV · FGTS', slug:'gran-vic-colibri-indaiatuba' },
  { n:'Itamaracá Residencial', c:'Zarin', p:339990, img:'itamaraca-indaiatuba/images/hero.jpg',
    s:'48 a 54 m² · 1 vaga · tabela de julho/2026', t:'MCMV · FGTS', slug:'itamaraca-indaiatuba' },
  { n:'Gran Vic Canário', c:'VIC Engenharia', p:352135, img:'gran-vic-canario-indaiatuba/images/hero.jpg',
    s:'2 dorm · 47,22 m² · últimas 3 unidades (set/2026) · entrega mai/2028', t:'MCMV · FGTS', est:3, slug:'gran-vic-canario-indaiatuba' },
  { n:'Vívere Residencial', c:'Masotti', p:352552, img:'vivere-indaiatuba/images/hero.jpg',
    s:'2 dorm · 46 a 50 m² · pronto para morar · últimas 5 unidades', t:'MCMV · Pronto', est:5, slug:'vivere-indaiatuba' },
  { n:'Gran Vic Andorinha', c:'VIC Engenharia', p:372119, img:'gran-vic-andorinha-indaiatuba/images/hero.jpg',
    s:'2 dorm c/ suíte · 51,42 m² · últimas 2 unidades (set/2026) · entrega fev/2028', t:'MCMV · FGTS', est:2, slug:'gran-vic-andorinha-indaiatuba' },
  { n:'Spazio Italia', c:'Zarin', p:448820, img:'spazio-italia-indaiatuba/images/hero.jpg',
    s:'59,5 a 63,58 m² · suíte · 1–2 vagas · 25+ itens de lazer', t:'Lançamento', slug:'spazio-italia-indaiatuba' },
  { n:'Aurora — Park Meraki', c:'Masotti', p:758850, img:'aurora-indaiatuba/images/hero-casa-de-campo-piscina.jpg',
    s:'101 a 152 m² · 4 torres · 32 áreas de lazer', t:'Alto padrão', slug:'aurora-indaiatuba' },
  { n:'Storia Congesa', c:'Congesa', p:981000, img:'storia-congesa-indaiatuba/images/hero.jpg',
    s:'70 a 114 m² · 2-3 vagas + hobby box · entrega dez/2026', t:'Alto padrão', slug:'storia-congesa-indaiatuba' },
  { n:'Areté Home', c:'PERPLAN', p:991005, img:'arete-home-indaiatuba/images/hero.jpg',
    s:'93 a 117 m² · 2 e 3 suítes · torre única · 19 andares', t:'Lançamento', slug:'arete-home-indaiatuba' },
  { n:'Hélade — Park Meraki', c:'PERPLAN', p:1391504, img:'helade-indaiatuba/images/hero.jpg',
    s:'3 suítes · 120,18 m² · 2 ou 3 vagas · entrega mar/2027', t:'Alto padrão', slug:'helade-indaiatuba' },
  { n:'Viva Parque Aura', c:'Pinheiro · RDZ · iBen', p:300854, img:'viva-parque-aura-indaiatuba/images/hero.jpg',
    s:'47 a 85 m² · Torre 3 (tabela ago/2026) · 7.000 m² parque · +30 itens lazer', t:'Lançamento', slug:'viva-parque-aura-indaiatuba' },
  { n:'Viva Parque Sense', c:'Pinheiro · RDZ · iBen', p:404886, img:'viva-parque-sense-indaiatuba/images/hero.jpg',
    s:'3 dorm c/ suíte · 59,93 m² · garden 95,99 m² · 8 torres · tabela ago/2026', t:'Lançamento', slug:'viva-parque-sense-indaiatuba' },
  { n:'Manai Bosque', c:'Masotti', p:505941, img:'manai-bosque-indaiatuba/images/hero-3-torres.jpg',
    s:'65 a 91 m² · Torre I: 53 unidades (set/2026) · piscina raia 25m · 36 áreas lazer', t:'Lançamento', slug:'manai-bosque-indaiatuba' },
  { n:'Congesa Seasons', c:'Congesa', p:null, img:'seasons-indaiatuba/images/hero.jpg',
    s:'3 suítes · Penthouse · Maison c/ jardim', t:'Pré-lançamento', slug:'seasons-indaiatuba' },
];


const LOTES = [
  { n:'Residencial Monte Carmelo', c:'Dominium', p:145000, m2:150, img:'monte-carmelo-indaiatuba/images/hero.jpg',
    s:'Loteamento aberto · entrada de R$ 16.000 · 96x', t:'Loteamento', est:568, slug:'monte-carmelo-indaiatuba' },
  { n:'Parque Zarah', c:'Zarin', p:172500, m2:150, img:'parque-zarah-indaiatuba/images/hero.jpg',
    s:'3 fases · residencial a partir de R$ 212 mil · Safira dez/2026 · Rubi e Pérola dez/2028', t:'Cond. fechado', slug:'parque-zarah-indaiatuba' },
  { n:'Jardim Di Italia', c:'Dominium', p:210000, m2:150, img:'di-italia-indaiatuba/images/hero.jpg',
    s:'Loteamento aberto · infraestrutura concluída · entrada R$ 44.000 · 60x', t:'Loteamento', est:44, slug:'di-italia-indaiatuba' },
  { n:'Terras de San Marino', c:'Armigh · Best Business', p:247500, m2:150, img:'images/hero.jpg',
    s:'546 lotes · 19 disponíveis (espelho 02/09/2026) · 16.164 m² de lazer resort', t:'Cond. fechado', est:19, slug:'terras-de-san-marino-indaiatuba' },
  { n:'Residencial Vila Fahl', c:'Vila Fahl · iBen', p:273750, m2:150, img:'vila-fahl-indaiatuba/images/hero.jpg',
    s:'Residencial e comercial · obra 71,91% (jul/2026) · até 96x · 15 itens de lazer', t:'Loteamento', slug:'vila-fahl-indaiatuba' },
  { n:'Alpnach Residence', c:'Dominium', p:510000, m2:300, img:'alpnach-indaiatuba/images/hero.jpg',
    s:'322 lotes · 28 disponíveis (04/09/2026) · piscina coberta · mini mercado 24h', t:'Cond. fechado', est:28, slug:'alpnach-indaiatuba' },
  { n:'Reserva Botânica', c:'Zarin', p:532563, m2:340, img:'reserva-botanica-indaiatuba/images/hero.jpg',
    s:'3 lotes de 340 a 457 m² · portaria 24h · 3 quadras', t:'Cond. fechado', est:3, slug:'reserva-botanica-indaiatuba' },
  { n:'Residencial Ravello', c:'Dominium', p:714000, m2:420, img:'residencial-ravello-indaiatuba/images/hero.jpg',
    s:'710 lotes · 27 itens: SPA, Wine Bar, Fire Pit', t:'Cond. fechado', est:185, slug:'residencial-ravello-indaiatuba' },
];


// mês da edição: o gera-observatorio.js é o dono de EDICAO (lido como texto,
// sem require, para não rodar o observatório daqui)
const EDICAO = (() => {
  const src = fs.readFileSync(__dirname + '/gera-observatorio.js', 'utf8');
  const ini = src.indexOf('const EDICAO = ');
  const fim = src.indexOf('};', ini) + 1;
  return eval('(' + src.slice(ini + 'const EDICAO = '.length, fim) + ')');
})();
const edicao = EDICAO.mes.toLowerCase() + '/' + EDICAO.ano;   // setembro/2026

const brl = n => n.toLocaleString('pt-BR');
const tipoClasse = t => t.startsWith('MCMV') ? 'b-mcmv' : t === 'Alto padrão' ? 'b-alto'
                    : t === 'Pré-lançamento' ? 'b-pre' : t === 'Lançamento' ? 'b-lanc'
                    : t === 'Loteamento' ? 'b-lote' : 'b-cond';

function card(e, isLote) {
  const preco = e.p
    ? `<div class="preco"><span>a partir de</span><strong>R$ ${brl(e.p)}</strong>${isLote ? `<em>R$ ${brl(Math.round(e.p/e.m2))}/m² · ${e.m2} m²</em>` : ''}</div>`
    : `<div class="preco preco-consulte"><span>tabela</span><strong>Sob consulta</strong><em>peça em primeira mão</em></div>`;
  return `
    <article class="card">
      <div class="card-img" style="background-image:url('${e.img}')">
        <span class="badge ${tipoClasse(e.t)}">${e.t}</span>
      </div>
      <div class="card-b">
        <p class="constr">${e.c}</p>
        <h3>${e.n}</h3>
        <p class="specs">${e.s}</p>
        ${preco}
      </div>
    </article>`;
}

const cardContato = `
    <article class="card card-cta">
      <div class="cta-in">
        <p class="cta-lbl">Fale agora</p>
        <p class="cta-tel">(19) 98976-9457</p>
        <img class="cta-qr" src="qrcode/qr-vivamerica-L-2048.png" alt="QR">
        <p class="cta-site">lancamentos.imoveisvivamerica.com.br</p>
      </div>
    </article>`;

const comPreco = APTOS.filter(e => e.p);
const semPreco = APTOS.filter(e => !e.p);
const ordenados = [...comPreco, ...semPreco];   // preço crescente; sem preço no fim
const POR_PAG = 8;                               // 2 colunas x 4 linhas de 59mm
const DEST_SLOTS = 2;                            // o bloco "Por que comprar" ocupa 2 vagas
const paginasApto = [];
for (let i = 0; i < ordenados.length; i += POR_PAG) paginasApto.push(ordenados.slice(i, i + POR_PAG));
const construtoras = new Set([...APTOS, ...LOTES].map(e => e.c.split(' · ')[0].trim())).size;
const menorGeral = Math.min(...[...APTOS, ...LOTES].filter(e => e.p).map(e => e.p));
const maiorApto = Math.max(...comPreco.map(e => e.p));
const mil = n => n >= 1e6 ? (n / 1e6).toFixed(1).replace('.', ',') + ' mi' : Math.round(n / 1000) + ' mil';

const DEST = `<div class="dest">
      <h4>Por que comprar <span>no lançamento?</span></h4>
      <p>Quem entra antes paga o menor preço da história do empreendimento e escolhe
         as melhores unidades — andar, posição solar, vista. Nos pré-lançamentos acima,
         a tabela ainda nem foi publicada.</p>
      <ul>
        <li>Menor preço por m² de todo o ciclo</li>
        <li>Escolha de andar e posição</li>
        <li>Condições de pagamento alongadas</li>
        <li>Saldo corrigido só pelo INCC (Índice Nacional de Custo da Construção)</li>
        <li>Uso do FGTS nos enquadrados no MCMV</li>
        <li>Financiamento pela Caixa</li>
      </ul>
    </div>`;

const HTML = `<!DOCTYPE html>
<html lang="pt-BR"><head><meta charset="UTF-8">
<title>Lançamentos Indaiatuba · Viv'América</title>
<style>
@page { size: A4 portrait; margin: 0; }
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
body{font-family:'Segoe UI',system-ui,Arial,sans-serif;color:#1a2b3c;-webkit-print-color-adjust:exact;print-color-adjust:exact}

.pg{width:210mm;height:297mm;padding:9mm;page-break-after:always;position:relative;overflow:hidden;background:#fff;display:flex;flex-direction:column}
.pg:last-child{page-break-after:auto}

/* ─── CAPA ─── */
.capa{padding:0;background:#0f1c29}
.capa-hero{height:150mm;position:relative;background-size:cover;background-position:center}
.capa-hero::after{content:'';position:absolute;inset:0;
  background:linear-gradient(180deg,rgba(15,28,41,.55) 0%,rgba(15,28,41,.15) 35%,rgba(15,28,41,.97) 100%)}
.capa-top{position:absolute;top:13mm;left:13mm;right:13mm;z-index:2}
.capa-marca{font-size:8pt;letter-spacing:.42em;text-transform:uppercase;color:#c9a84c;font-weight:600}
.capa-tit{position:absolute;bottom:9mm;left:13mm;right:13mm;z-index:2}
.capa-tit h1{font-size:41pt;line-height:.98;color:#fff;font-weight:800;letter-spacing:-.5pt}
.capa-tit h1 em{font-style:normal;color:#c9a84c;display:block}
.capa-body{padding:11mm 13mm 0;color:#fff;flex:1;display:flex;flex-direction:column}
.capa-sub{font-size:11.5pt;line-height:1.6;opacity:.9;max-width:145mm;margin-bottom:9mm}
.capa-nums{display:grid;grid-template-columns:repeat(4,1fr);gap:4mm;padding:6mm 0;
  border-top:1px solid rgba(201,168,76,.4);border-bottom:1px solid rgba(201,168,76,.4);margin-bottom:auto}
.capa-nums div strong{display:block;font-size:20pt;color:#c9a84c;font-weight:800;line-height:1}
.capa-nums div span{display:block;font-size:6.6pt;letter-spacing:.11em;text-transform:uppercase;opacity:.72;margin-top:1.6mm}
.capa-pe{display:flex;justify-content:space-between;align-items:flex-end;gap:8mm;padding:7mm 0 12mm}
.capa-pe .m{font-size:15pt;font-weight:800;letter-spacing:1.5pt;flex-shrink:0}
.capa-pe .m small{display:block;font-size:6.4pt;letter-spacing:.32em;opacity:.65;font-weight:400;margin-top:1mm}
.capa-pe .ct{font-size:8.6pt;line-height:1.7;opacity:.88;text-align:right;margin-left:auto}
.capa-pe .ct b{color:#c9a84c;font-size:13pt;display:block;margin-bottom:1mm;letter-spacing:-.2pt}
.capa-qrbox{flex-shrink:0;text-align:center}
.capa-qrbox img{width:24mm;height:24mm;background:#fff;padding:1.5mm;border-radius:2mm;display:block}
.capa-qrbox span{display:block;font-size:5.6pt;letter-spacing:.13em;text-transform:uppercase;
                 color:#c9a84c;margin-top:1.6mm;font-weight:700}

/* ─── CABEÇALHO DAS PÁGINAS ─── */
.hd{display:flex;justify-content:space-between;align-items:baseline;
    padding-bottom:2.6mm;border-bottom:2.2pt solid #1a2b3c;margin-bottom:4.5mm}
.hd h2{font-size:16pt;font-weight:800;letter-spacing:-.3pt}
.hd h2 span{color:#c9a84c}
.hd .cnt{font-size:7.4pt;color:#7a7365;font-weight:600;letter-spacing:.05em}

/* ─── GRID 2×4 ─── */
.grid{display:grid;grid-template-columns:1fr 1fr;grid-auto-rows:59mm;gap:4.2mm;flex:1;align-content:start}

.card{border:.7pt solid #e3ddcd;border-radius:2.6mm;overflow:hidden;display:flex;flex-direction:column;background:#fff}
.card-img{height:26mm;background-size:cover;background-position:center;background-color:#e8e4d8;position:relative;flex-shrink:0}
.badge{position:absolute;top:2mm;left:2mm;font-size:5.9pt;font-weight:800;letter-spacing:.07em;
       text-transform:uppercase;padding:1.1mm 2.2mm;border-radius:6mm;color:#fff}
.b-mcmv{background:#1565c0}.b-alto{background:#0c0c0c;color:#c8a44a}.b-pre{background:#a15e2c}
.b-lote{background:#d4520a}.b-cond{background:#1a6b4a}.b-lanc{background:#0e6b7a}

.card-b{padding:2.6mm 3mm 2.8mm;display:flex;flex-direction:column;flex:1}
.constr{font-size:5.9pt;font-weight:800;letter-spacing:.13em;text-transform:uppercase;color:#a8935c;margin-bottom:.7mm}
.card-b h3{font-size:9.6pt;font-weight:800;line-height:1.15;margin-bottom:1.1mm;letter-spacing:-.15pt}
.specs{font-size:6.8pt;color:#6b6559;line-height:1.4;flex:1}
.preco{border-top:.7pt dashed #e3ddcd;padding-top:1.6mm;margin-top:1.6mm}
.preco span{display:block;font-size:5.9pt;color:#8a8272;text-transform:uppercase;letter-spacing:.09em}
.preco strong{display:block;font-size:12.4pt;font-weight:800;color:#1a2b3c;line-height:1.05;margin-top:.3mm}
.preco em{display:block;font-style:normal;font-size:6.3pt;color:#8a8272;margin-top:.5mm}
.preco-consulte strong{color:#a15e2c;font-size:10.6pt}

/* ─── CARD DE CONTATO ─── */
.card-cta{background:#1a2b3c;border-color:#1a2b3c;align-items:center;justify-content:center;text-align:center}
.cta-in{padding:3mm}
.cta-lbl{font-size:6.2pt;letter-spacing:.2em;text-transform:uppercase;color:#c9a84c;font-weight:700;margin-bottom:1.2mm}
.cta-tel{font-size:12.6pt;font-weight:800;color:#fff;margin-bottom:2.4mm;letter-spacing:-.2pt}
.cta-qr{width:21mm;height:21mm;background:#fff;padding:1.1mm;border-radius:1.4mm;display:block;margin:0 auto 1.8mm}
.cta-site{font-size:5.9pt;color:rgba(255,255,255,.72);line-height:1.3}

/* ─── RODAPÉ ─── */
.pe{display:flex;justify-content:space-between;align-items:center;
    padding-top:2.6mm;margin-top:3.4mm;border-top:.7pt solid #e3ddcd;font-size:6.4pt;color:#8a8272}
.pe b{color:#1a2b3c}

/* ─── BLOCO DESTAQUE (página 3) ─── */
.dest{grid-column:span 2;background:#f7f4ec;border:.7pt solid #e3ddcd;border-radius:2.6mm;
      padding:5mm 6mm;display:flex;flex-direction:column;justify-content:center}
.dest h4{font-size:12pt;font-weight:800;margin-bottom:2.2mm}
.dest h4 span{color:#c9a84c}
.dest p{font-size:7.6pt;color:#5a5346;line-height:1.62;margin-bottom:2.6mm}
.dest ul{list-style:none;display:grid;grid-template-columns:1fr 1fr;gap:1.4mm 5mm}
.dest li{font-size:7.2pt;color:#5a5346;padding-left:4mm;position:relative;line-height:1.4}
.dest li::before{content:'✓';position:absolute;left:0;color:#1a6b4a;font-weight:800}
</style></head><body>

<!-- ═══ CAPA ═══ -->
<section class="pg capa">
  <div class="capa-hero" style="background-image:url('aurora-indaiatuba/images/hero-casa-de-campo-piscina.jpg')">
    <div class="capa-top"><p class="capa-marca">Imobiliária Viv'América</p></div>
    <div class="capa-tit"><h1>Lançamentos<em>Indaiatuba</em></h1></div>
  </div>
  <div class="capa-body">
    <p class="capa-sub">Todo o portfólio de apartamentos e lotes em condomínio da cidade,
       do Minha Casa Minha Vida ao alto padrão — com as condições de quem compra no lançamento.</p>
    <div class="capa-nums">
      <div><strong>${APTOS.length + LOTES.length}</strong><span>Empreendimentos</span></div>
      <div><strong>${construtoras}</strong><span>Construtoras</span></div>
      <div><strong>${mil(menorGeral)}</strong><span>Menor investimento</span></div>
      <div><strong>${mil(maiorApto)}</strong><span>Alto padrão</span></div>
    </div>
    <div class="capa-pe">
      <div class="m">VIV'AMÉRICA<small>Imobiliária</small></div>
      <div class="ct"><b>(19) 98976-9457</b>lancamentos.imoveisvivamerica.com.br<br>Indaiatuba · SP</div>
      <div class="capa-qrbox">
        <img src="qrcode/qr-vivamerica-L-2048.png" alt="QR do site">
        <span>ver online</span>
      </div>
    </div>
  </div>
</section>

${paginasApto.map((pg, i) => {
  const ultima = i === paginasApto.length - 1;
  const livres = POR_PAG - pg.length;
  const extra = !ultima ? '' : livres >= 1 + DEST_SLOTS ? cardContato + DEST : livres >= 1 ? cardContato : '';
  return `<!-- ═══ APARTAMENTOS ${i + 1} ═══ -->
<section class="pg">
  <div class="hd"><h2>🏢 <span>Apartamentos</span></h2><span class="cnt">do menor ao maior investimento · ${i + 1} de ${paginasApto.length}</span></div>
  <div class="grid">${pg.map(e => card(e, false)).join('')}${extra}</div>
  <div class="pe"><span>Viv'América · Lançamentos Indaiatuba</span><span>Edição <b>${edicao}</b></span></div>
</section>

`;
}).join('')}<!-- ═══ LOTES ═══ -->
<section class="pg">
  <div class="hd"><h2>🏞️ <span>Lotes e Condomínios Fechados</span></h2><span class="cnt">do menor ao maior investimento</span></div>
  <div class="grid">${LOTES.map(e => card(e, true)).join('')}${LOTES.length < 8 ? cardContato : ''}</div>
  <div class="pe">
    <span>Imagens ilustrativas. Preços e condições sujeitos a alteração sem aviso prévio.</span>
    <span>Edição <b>${edicao}</b></span>
  </div>
</section>

</body></html>`;

fs.writeFileSync(OUT, HTML, 'utf8');
console.log('Folheto gerado.');
console.log(`  Pagina 1: capa`);
paginasApto.forEach((pg, i) => console.log(`  Pagina ${i + 2}: ${pg.length} apartamentos${i === paginasApto.length - 1 ? ' (+ contato/destaque se couber)' : ''}`));
console.log(`  Pagina ${paginasApto.length + 2}: ${LOTES.length} lotes` + (LOTES.length < 8 ? ' + contato' : ''));
console.log(`  Total de empreendimentos: ${APTOS.length + LOTES.length}`);
