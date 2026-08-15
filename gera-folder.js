/* ═══════════════════════════════════════════════════════════════════
   FOLDER 1 DOBRA — arte fechada para gráfica
   ───────────────────────────────────────────────────────────────────
   Formato do gabarito:
     aberto  210 × 148 mm (A5 deitado)
     sangria 2 mm por lado  →  arquivo final 214 × 152 mm
     dobrado 105 × 148 mm (A6)
   Imposição pedida:
     FRENTE = página 4 (esquerda) | página 1 (direita)
     VERSO  = página 2 (esquerda) | página 3 (direita)
   Ao dobrar ao meio, a página 1 fica sendo a capa.

   Os dados vêm do gera-folheto.js — fonte única, para o impresso nunca
   divergir do site.
   ═══════════════════════════════════════════════════════════════════ */

const fs = require('fs');
const R = __dirname + '/';

// ─── dados: extraídos do gerador do folheto A4 ───
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

// hero da capa: usa a imagem do Aurora, a mesma do folheto A4
const HERO = 'aurora-indaiatuba/images/hero-casa-de-campo-piscina.jpg';

const CSS = `
  *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
  @page{size:214mm 152mm;margin:0}
  html,body{width:214mm;height:152mm}
  body{font-family:'Segoe UI',system-ui,Arial,sans-serif;color:#1a2b3c;
    -webkit-print-color-adjust:exact;print-color-adjust:exact}

  /* folha inteira COM sangria; o corte cai 2mm para dentro */
  .folha{width:214mm;height:152mm;display:flex;position:relative;overflow:hidden}
  .painel{width:107mm;height:152mm;position:relative;overflow:hidden}

  /* área segura: 2mm de sangria + 5mm de respiro = 7mm da borda física */
  .seg{position:absolute;top:7mm;bottom:7mm;left:7mm;right:7mm;display:flex;flex-direction:column}
  .painel.esq .seg{right:6mm}   /* lado da dobra respira um pouco menos */
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

  /* ── miolo (p2 e p3) ── */
  .hd{border-bottom:1.1pt solid #0f1c29;padding-bottom:2.2mm;margin-bottom:3.2mm}
  .hd h2{font-size:12.5pt;font-weight:800;letter-spacing:-.3pt;line-height:1}
  .hd h2 span{color:#c9a84c}
  .hd p{font-size:5.9pt;color:#7a7365;font-weight:600;letter-spacing:.05em;margin-top:1.3mm;text-transform:uppercase}

  .lista{display:flex;flex-direction:column;flex:1}
  .it{display:flex;align-items:baseline;gap:2mm;padding:1.55mm 0;border-bottom:.5pt dotted #ddd6c4}
  .it:last-child{border-bottom:none}
  .it .txt{flex:1;min-width:0}
  .it .n{font-size:7.5pt;font-weight:700;line-height:1.12;letter-spacing:-.15pt}
  .it .c{font-size:5.5pt;color:#8d8676;text-transform:uppercase;letter-spacing:.07em;margin-top:.5mm}
  .it .p{font-size:7.6pt;font-weight:800;color:#0f1c29;white-space:nowrap;text-align:right;line-height:1.1}
  .it .p small{display:block;font-size:4.9pt;font-weight:600;color:#a09781;text-transform:uppercase;
    letter-spacing:.07em;margin-bottom:.3mm}
  .it .p .sc{font-size:6.4pt;color:#8d8676;font-weight:700}

  .nota{margin-top:auto;border-top:.7pt solid #e3ddcd;padding-top:2.4mm;
    font-size:5.4pt;color:#8d8676;line-height:1.5}
  .nota b{color:#0f1c29}

  .faixa{background:#0f1c29;color:#fff;border-radius:1.8mm;padding:2.8mm 3mm;margin-bottom:3mm}
  .faixa strong{display:block;font-size:7.4pt;font-weight:800;color:#c9a84c;letter-spacing:.04em}
  .faixa span{display:block;font-size:5.8pt;line-height:1.5;opacity:.88;margin-top:1mm}
`;

const item = e => `
  <div class="it">
    <div class="txt">
      <div class="n">${e.n}</div>
      <div class="c">${e.c}</div>
    </div>
    <div class="p">${e.p ? `<small>a partir de</small>R$ ${brl(e.p)}` : `<span class="sc">sob consulta</span>`}</div>
  </div>`;

// ─── página 1 — capa ───
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

// ─── página 4 — contracapa ───
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

// ─── página 2 — apartamentos ───
const p2 = `
<div class="painel esq creme">
  <div class="seg">
    <div class="hd">
      <h2>🏢 <span>Apartamentos</span></h2>
      <p>${APTOS.length} empreendimentos · do menor ao maior investimento</p>
    </div>
    <div class="lista">${APTOS.map(item).join('')}</div>
    <div class="nota"><b>MCMV Faixa 3:</b> parte dos empreendimentos aceita FGTS como entrada e subsídio do governo. Consulte a renda familiar e simule a parcela com um consultor.</div>
  </div>
</div>`;

// ─── página 3 — lotes ───
const p3 = `
<div class="painel dir creme">
  <div class="seg">
    <div class="hd">
      <h2>🏞️ <span>Lotes e Condomínios</span></h2>
      <p>${LOTES.length} loteamentos · do menor ao maior investimento</p>
    </div>
    <div class="faixa">
      <strong>Construa no seu tempo</strong>
      <span>Lotes a partir de 150 m², com parcelamento direto e sem juros durante a obra em parte dos empreendimentos.</span>
    </div>
    <div class="lista">${LOTES.map(item).join('')}</div>
    <div class="nota">Imagens ilustrativas. Preços e disponibilidade sujeitos a alteração sem aviso prévio. <b>Edição agosto/2026.</b></div>
  </div>
</div>`;

const pagina = (a, b) => `<!DOCTYPE html>
<html lang="pt-BR"><head><meta charset="UTF-8"><style>${CSS}</style></head>
<body><div class="folha">${a}${b}</div></body></html>`;

fs.writeFileSync(R + 'folder-frente.html', pagina(p4, p1), 'utf8');
fs.writeFileSync(R + 'folder-verso.html',  pagina(p2, p3), 'utf8');

console.log('Folder gerado — 214 × 152 mm (210 × 148 aberto + 2 mm de sangria)');
console.log('  folder-frente.html  =  p4 (contracapa)  |  p1 (capa)');
console.log('  folder-verso.html   =  p2 (' + APTOS.length + ' aptos)  |  p3 (' + LOTES.length + ' lotes)');
console.log('  total de empreendimentos: ' + (APTOS.length + LOTES.length));
