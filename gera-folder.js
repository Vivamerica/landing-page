/* ═══════════════════════════════════════════════════════════════════
   FOLDER 1 DOBRA — arte fechada para gráfica
   ───────────────────────────────────────────────────────────────────
   Formato do gabarito:
     aberto  210 × 148 mm (A5 deitado)
     sangria 2 mm por lado  →  arquivo final 214 × 152 mm
     dobrado 105 × 148 mm (A6)
   Imposição:
     FRENTE = página 4 (contracapa) | página 1 (capa)
     VERSO  = página 2 (apartamentos) | página 3 (lotes)

   Mantém o MESMO desenho de card do folheto A4 aprovado — foto no topo,
   selo de tipo, construtora, nome, specs e preço — apenas reduzido para
   o painel A6. Dados e estilos vêm do gera-folheto.js: fonte única.
   ═══════════════════════════════════════════════════════════════════ */

const fs = require('fs');
const R = __dirname + '/';

const fonte = fs.readFileSync(R + 'gera-folheto.js', 'utf8');
function extrair(nome) {
  const ini = fonte.indexOf('const ' + nome + ' = [');
  const fim = fonte.indexOf('\n];', ini);
  if (ini < 0 || fim < 0) throw new Error('nao achei ' + nome + ' em gera-folheto.js');
  return eval(fonte.slice(ini + ('const ' + nome + ' = ').length, fim + 2));
}
const APTOS = extrair('APTOS');
const LOTES = extrair('LOTES');

const brl = n => n.toLocaleString('pt-BR');
const qr = fs.readFileSync(R + 'qrcode/qr-vivamerica-branco.svg', 'utf8')
  .replace(/width="\d+" height="\d+"/, 'width="100%" height="100%"');
const HERO = 'aurora-indaiatuba/images/hero-casa-de-campo-piscina.jpg';

// mesma regra de cor de selo do folheto A4
const tipoClasse = t =>
  /MCMV/i.test(t)          ? 'b-mcmv' :
  /Alto Padrão/i.test(t)   ? 'b-alto' :
  /Pré|Breve/i.test(t)     ? 'b-pre'  :
  /Cond/i.test(t)          ? 'b-cond' : 'b-lote';

const CSS = `
  *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
  @page{size:214mm 152mm;margin:0}
  html,body{width:214mm;height:152mm}
  body{font-family:'Segoe UI',system-ui,Arial,sans-serif;color:#1a2b3c;
    -webkit-print-color-adjust:exact;print-color-adjust:exact}

  .folha{width:214mm;height:152mm;display:flex;position:relative;overflow:hidden}
  .painel{width:107mm;height:152mm;position:relative;overflow:hidden}
  /* 2mm de sangria + 5mm de respiro = 7mm da borda física */
  .seg{position:absolute;top:7mm;bottom:7mm;left:7mm;right:7mm;display:flex;flex-direction:column}
  .painel.esq .seg{right:6mm}
  .painel.dir .seg{left:6mm}
  .navy{background:#0f1c29;color:#fff}
  .creme{background:#fbfaf6}

  /* ── capa (p1) ── */
  .capa-hero{position:absolute;inset:0;background:url('${HERO}') center/cover}
  .capa-hero::after{content:'';position:absolute;inset:0;
    background:linear-gradient(180deg,rgba(15,28,41,.62) 0%,rgba(15,28,41,.28) 38%,rgba(15,28,41,.94) 78%,#0f1c29 100%)}
  .capa-cont{z-index:2;display:flex;flex-direction:column}
  .marca{font-size:6.4pt;letter-spacing:.4em;text-transform:uppercase;color:#c9a84c;font-weight:700}
  .marca b{display:block;font-size:12.5pt;letter-spacing:1.2pt;color:#fff;font-weight:800;margin-top:1.2mm}
  .capa-tit{margin-top:auto}
  .capa-tit h1{font-size:26pt;line-height:.97;font-weight:800;letter-spacing:-.6pt}
  .capa-tit h1 em{font-style:normal;color:#c9a84c;display:block}
  .capa-sub{font-size:7.6pt;line-height:1.55;opacity:.9;margin-top:3.4mm}
  .capa-nums{display:grid;grid-template-columns:repeat(3,1fr);gap:2.5mm;
    border-top:.7pt solid rgba(201,168,76,.35);margin-top:5mm;padding-top:3.6mm}
  .capa-nums strong{display:block;font-size:13pt;color:#c9a84c;font-weight:800;line-height:1}
  .capa-nums span{display:block;font-size:5.2pt;letter-spacing:.09em;text-transform:uppercase;opacity:.7;margin-top:1mm}

  /* ── contracapa (p4) ── */
  .cc{flex:1;display:flex;flex-direction:column;align-items:center;text-align:center}
  .cc-marca{font-size:6.2pt;letter-spacing:.4em;text-transform:uppercase;color:#c9a84c;font-weight:700}
  .cc-marca b{display:block;font-size:15pt;letter-spacing:1.4pt;color:#fff;font-weight:800;margin-top:1.4mm}
  .cc-fio{width:14mm;height:.7pt;background:rgba(201,168,76,.5);margin:4.5mm 0}
  .cc-cham{font-size:9.2pt;line-height:1.5;font-weight:600;max-width:78mm}
  .cc-cham em{font-style:normal;color:#c9a84c}
  .cc-qr{width:33mm;height:33mm;background:#fff;padding:2mm;border-radius:2mm;margin:5mm 0 2.6mm}
  .cc-qr svg{display:block;width:100%;height:100%}
  .cc-qrleg{font-size:5.4pt;letter-spacing:.16em;text-transform:uppercase;color:#c9a84c;font-weight:700}
  .cc-site{font-size:7.2pt;opacity:.82;margin-top:1.6mm;word-break:break-all}
  .cc-pe{margin-top:auto;width:100%;border-top:.7pt solid rgba(255,255,255,.14);padding-top:4mm}
  .cc-tel{font-size:14pt;font-weight:800;color:#c9a84c;letter-spacing:-.3pt}
  .cc-end{font-size:6.6pt;line-height:1.65;opacity:.72;margin-top:1.6mm}

  /* ── miolo: MESMO card do A4, reduzido ── */
  .hd{display:flex;justify-content:space-between;align-items:baseline;
      border-bottom:1.1pt solid #0f1c29;padding-bottom:1.8mm;margin-bottom:2.6mm}
  .hd h2{font-size:11pt;font-weight:800;letter-spacing:-.3pt;line-height:1}
  .hd h2 span{color:#c9a84c}
  .hd .cnt{font-size:5.2pt;color:#7a7365;font-weight:700;letter-spacing:.05em;text-transform:uppercase}

  .grid{display:grid;grid-template-columns:1fr 1fr;gap:1.9mm;flex:1;min-height:0}
  .card{border:.6pt solid #e3ddcd;border-radius:1.7mm;overflow:hidden;
        display:flex;flex-direction:column;background:#fff}
  .card-img{background-size:cover;background-position:center;background-color:#e8e4d8;
            position:relative;flex-shrink:0}
  .badge{position:absolute;top:.8mm;left:.8mm;font-size:3.2pt;font-weight:800;letter-spacing:.06em;
         text-transform:uppercase;padding:.6mm 1.2mm;border-radius:4mm;color:#fff;line-height:1.15}
  .b-mcmv{background:#1565c0}.b-alto{background:#0c0c0c;color:#c8a44a}.b-pre{background:#a15e2c}
  .b-lote{background:#d4520a}.b-cond{background:#1a6b4a}

  .card-b{padding:1.1mm 1.5mm 1.2mm;display:flex;flex-direction:column;flex:1}
  .constr{font-size:3.5pt;font-weight:800;letter-spacing:.11em;text-transform:uppercase;color:#a8935c}
  .card-b h3{font-size:5.9pt;font-weight:800;line-height:1.08;margin-top:.35mm;letter-spacing:-.1pt}
  .specs{font-size:4pt;color:#6b6559;line-height:1.25;margin-top:.5mm;flex:1;overflow:hidden;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical}
  .preco{border-top:.6pt dashed #e3ddcd;padding-top:.7mm;margin-top:auto}
  .preco span{display:block;font-size:3.4pt;color:#8a8272;text-transform:uppercase;letter-spacing:.08em}
  .preco strong{display:block;font-size:7.4pt;font-weight:800;color:#1a2b3c;line-height:1.05;margin-top:.2mm}
  .preco em{display:block;font-style:normal;font-size:3.6pt;color:#8a8272;margin-top:.3mm}
  .preco-consulte strong{color:#a15e2c;font-size:6.4pt}

  /* apartamentos: 12 cards, foto mais baixa. lotes: 8 cards, foto maior */
  .g-aptos{grid-template-rows:repeat(${Math.ceil(APTOS.length/2)},1fr)} .g-aptos .card-img{height:${APTOS.length>12?5:6}mm}
  .g-lotes{grid-template-rows:repeat(4,1fr)} .g-lotes .card-img{height:11mm}

  .pe{margin-top:2.4mm;border-top:.6pt solid #e3ddcd;padding-top:1.8mm;
      font-size:4.4pt;color:#8d8676;line-height:1.45}
  .pe b{color:#0f1c29}
`;

function card(e, isLote) {
  const preco = e.p
    ? `<div class="preco"><span>a partir de</span><strong>R$ ${brl(e.p)}</strong>${isLote ? `<em>R$ ${brl(Math.round(e.p / e.m2))}/m² · ${e.m2} m²</em>` : ''}</div>`
    : `<div class="preco preco-consulte"><span>tabela</span><strong>Sob consulta</strong></div>`;
  return `
    <article class="card">
      <div class="card-img" style="background-image:url('${e.img}')">
        <span class="badge ${tipoClasse(e.t)}">${e.t}</span>
      </div>
      <div class="card-b">
        <p class="constr">${e.c}</p>
        <h3>${e.n}</h3>
        ${isLote ? `<p class="specs">${e.s}</p>` : ''}
        ${preco}
      </div>
    </article>`;
}

const p1 = `
<div class="painel dir navy">
  <div class="capa-hero"></div>
  <div class="capa-cont seg">
    <div class="marca">Imobiliária<b>VIV'AMÉRICA</b></div>
    <div class="capa-tit">
      <h1>Lançamentos<em>Indaiatuba</em></h1>
      <p class="capa-sub">Os ${APTOS.length + LOTES.length} empreendimentos que estão saindo do papel na cidade — apartamentos, loteamentos e condomínios fechados, reunidos em um só lugar.</p>
      <div class="capa-nums">
        <div><strong>${APTOS.length + LOTES.length}</strong><span>Empreendimentos</span></div>
        <div><strong>6</strong><span>Construtoras</span></div>
        <div><strong>145<small style="font-size:.62em"> mil</small></strong><span>A partir de R$</span></div>
      </div>
    </div>
  </div>
</div>`;

const p4 = `
<div class="painel esq navy">
  <div class="seg">
    <div class="cc">
      <div class="cc-marca">Imobiliária<b>VIV'AMÉRICA</b></div>
      <div class="cc-fio"></div>
      <p class="cc-cham">Escolha pelo <em>bairro</em>, pela <em>planta</em> ou pelo <em>valor da parcela</em> — e fale com quem conhece Indaiatuba.</p>
      <div class="cc-qr">${qr}</div>
      <div class="cc-qrleg">Aponte a câmera</div>
      <div class="cc-site">lancamentos.imoveisvivamerica.com.br</div>
      <div class="cc-pe">
        <div class="cc-tel">(19) 98976-9457</div>
        <div class="cc-end">Atendimento também por WhatsApp<br>Indaiatuba · São Paulo</div>
      </div>
    </div>
  </div>
</div>`;

const p2 = `
<div class="painel esq creme">
  <div class="seg">
    <div class="hd"><h2>🏢 <span>Apartamentos</span></h2><span class="cnt">${APTOS.length} · menor ao maior</span></div>
    <div class="grid g-aptos">${APTOS.map(e => card(e, false)).join('')}</div>
    <div class="pe"><b>MCMV Faixa 3:</b> parte dos empreendimentos aceita FGTS como entrada e subsídio do governo.</div>
  </div>
</div>`;

const p3 = `
<div class="painel dir creme">
  <div class="seg">
    <div class="hd"><h2>🏞️ <span>Lotes e Condomínios</span></h2><span class="cnt">${LOTES.length} · menor ao maior</span></div>
    <div class="grid g-lotes">${LOTES.map(e => card(e, true)).join('')}</div>
    <div class="pe">Imagens ilustrativas. Preços e disponibilidade sujeitos a alteração sem aviso prévio. <b>Edição agosto/2026.</b></div>
  </div>
</div>`;

const pagina = (a, b) => `<!DOCTYPE html>
<html lang="pt-BR"><head><meta charset="UTF-8"><style>${CSS}</style></head>
<body><div class="folha">${a}${b}</div></body></html>`;

fs.writeFileSync(R + 'folder-frente.html', pagina(p4, p1), 'utf8');
fs.writeFileSync(R + 'folder-verso.html', pagina(p2, p3), 'utf8');

console.log('Folder gerado — 214 × 152 mm (210 × 148 aberto + 2 mm de sangria)');
console.log('  frente = p4 contracapa | p1 capa');
console.log('  verso  = p2 ' + APTOS.length + ' apartamentos | p3 ' + LOTES.length + ' lotes');
console.log('  cards de 44 mm em grade 2 colunas, mesmo desenho do folheto A4');
