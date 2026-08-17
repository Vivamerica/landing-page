/* ═══════════════════════════════════════════════════════════════════
   MAPAS NAS LANDINGS — bloco com clique para carregar + geo no JSON-LD
   ───────────────────────────────────────────────────────────────────
   Duas coisas por landing:

   1. "geo" com latitude/longitude no JSON-LD principal, mais "hasMap".
      É o que diz ao Google exatamente onde o empreendimento fica.
      Não pesa nada e vale para busca local.

   2. Um bloco de localização com botão "Ver no mapa". O iframe do
      Google só é criado no clique — antes disso nenhuma requisição sai
      daqui. Isso preserva o Core Web Vitals das 15 páginas e evita
      mandar o IP do visitante para o Google sem ele pedir (LGPD).

   Fonte dos pontos: coordenadas enviadas pelo Fabio em 16/08/2026.
   Quem tem ficha no Google Maps usa o embed oficial (mostra o cartão
   do lugar); quem não tem — caso de vários lançamentos novos — usa
   maps.google.com/maps?q=lat,lng&output=embed, que planta o alfinete
   na coordenada exata sem precisar de chave de API.
   ═══════════════════════════════════════════════════════════════════ */

const fs = require('fs');
const R = __dirname + '/';

const PONTOS = [
  { d:'terras-de-san-marino-indaiatuba', n:'Terras de San Marino', lat:-23.100866, lng:-47.257173,
    pb:'!1m18!1m12!1m3!1d2150.2340830243647!2d-47.25717274618027!3d-23.100866115779226!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x94c8b300612dde4f%3A0x1a77b74e247dad4e!2sSan%20Marino%20Residencial!5e1!3m2!1spt-BR!2sbr!4v1786994527584!5m2!1spt-BR!2sbr' },
  { d:'alpnach-indaiatuba', n:'Alpnach Residence', lat:-23.079509, lng:-47.236477,
    pb:'!1m18!1m12!1m3!1d4038.484122933078!2d-47.23647669391786!3d-23.079509309186133!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x94c8b30073da0b93%3A0xe334141b78dd581!2sAlpnach%20Residence!5e1!3m2!1spt-BR!2sbr!4v1786994561032!5m2!1spt-BR!2sbr' },
  { d:'residencial-ravello-indaiatuba', n:'Residencial Ravello', lat:-23.080299, lng:-47.239149,
    pb:'!1m18!1m12!1m3!1d4038.4603985381063!2d-47.23914949999999!3d-23.0802992!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x94c8b3003eeb180b%3A0x717b0927faae1148!2sResidencial%20Ravello!5e1!3m2!1spt-BR!2sbr!4v1786994600075!5m2!1spt-BR!2sbr' },
  { d:'di-italia-indaiatuba', n:'Jardim Residencial Di Itália', lat:-23.102081, lng:-47.261345,
    pb:'!1m14!1m8!1m3!1d3238.6439849238936!2d-47.26134468668533!3d-23.10208140934984!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x94c8b31bd3e02783%3A0x510a91b3520dcb45!2sJardim%20Residencial%20Di%20It%C3%A1lia!5e1!3m2!1spt-BR!2sbr!4v1786995296628!5m2!1spt-BR!2sbr' },
  { d:'parque-zarah-indaiatuba', n:'Parque Zarah Residencial', lat:-23.102323, lng:-47.268795,
    pb:'!1m18!1m12!1m3!1d4037.7986181680035!2d-47.26879477500915!3d-23.10232252844955!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x94c8b36dfbe35607%3A0x713e18c8702dff6d!2sParque%20Zarah%20Residencial!5e1!3m2!1spt-BR!2sbr!4v1786995319593!5m2!1spt-BR!2sbr' },
  { d:'gran-vic-andorinha-indaiatuba', n:'Gran Vic Andorinha', lat:-23.108448, lng:-47.258748,
    pb:'!1m18!1m12!1m3!1d520.8564809580787!2d-47.25874778005839!3d-23.108447924440043!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x94c8b3004d575583%3A0x4cf3f90e8416f259!2sParque%20dos%20P%C3%A1ssaros%20-%20GranVic%20Andorinha!5e1!3m2!1spt-BR!2sbr!4v1786994639014!5m2!1spt-BR!2sbr' },
  { d:'manai-bosque-indaiatuba', n:'Manai Bosque', lat:-23.100029, lng:-47.200842,
    pb:'!1m18!1m12!1m3!1d918.4225664225557!2d-47.20084209953485!3d-23.10002916931408!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x94cf4b005436ff97%3A0x300b001c2819c435!2sManai%20bosque!5e1!3m2!1spt-BR!2sbr!4v1786995620752!5m2!1spt-BR!2sbr' },
  { d:'spazio-italia-indaiatuba', n:'Spazio Itália Residencial Clube', lat:-23.099839, lng:-47.198514,
    pb:'!1m18!1m12!1m3!1d1075.1252657913078!2d-47.198514179236106!3d-23.09983857320325!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x94cf4b4bb95a6afb%3A0x4a9ecdfdded61670!2sSpazio%20It%C3%A1lia%20Residencial%20Clube!5e1!3m2!1spt-BR!2sbr!4v1786995659699!5m2!1spt-BR!2sbr' },
  { d:'monte-carmelo-indaiatuba', n:'Residencial Monte Carmelo', lat:-23.095657, lng:-47.283368,
    pb:'!1m18!1m12!1m3!1d1594.088231809436!2d-47.283367914751786!3d-23.095656670329138!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x8147da5af16b7d77%3A0x9df58e171ef5b335!2sResidencial%20Monte%20Carmelo!5e1!3m2!1spt-BR!2sbr!4v1786995690332!5m2!1spt-BR!2sbr' },

  // sem ficha no Google Maps: alfinete pela coordenada
  { d:'gran-vic-colibri-indaiatuba', n:'Gran Vic Colibri', lat:-23.107750, lng:-47.260898, pb:null },
  { d:'gran-vic-canario-indaiatuba', n:'Gran Vic Canário',  lat:-23.107197, lng:-47.261823, pb:null },
  { d:'gran-vic-tangara-indaiatuba', n:'Gran Vic Tangará',  lat:-23.106869, lng:-47.263009, pb:null },
  { d:'helade-indaiatuba',           n:'Hélade — Park Meraki', lat:-23.083487, lng:-47.192866, pb:null },
  { d:'arete-home-indaiatuba',       n:'Areté Home',        lat:-23.083609, lng:-47.193628, pb:null },
  { d:'aurora-indaiatuba',           n:'Aurora — Park Meraki', lat:-23.081421, lng:-47.188091, pb:null },
];

const CSS = `
<style>
/* ─── localização com mapa sob demanda ─── */
.mapa-sec{padding:3.4rem 0;background:#f7f5ef}
.mapa-wrap{max-width:1100px;margin:0 auto;padding:0 1.2rem}
.mapa-wrap h2{font-size:1.75rem;font-weight:800;color:#0f1c29;margin:0 0 .35rem;letter-spacing:-.01em}
.mapa-end{font-size:.95rem;color:#6b6559;margin:0 0 1.4rem}
.mapa-box{position:relative;width:100%;aspect-ratio:16/9;max-height:460px;border-radius:14px;
  overflow:hidden;background:#e8e4d8;border:1px solid #ddd6c4;cursor:pointer}
.mapa-box iframe{width:100%;height:100%;border:0;display:block}
.mapa-btn{position:absolute;inset:0;width:100%;height:100%;border:0;cursor:pointer;
  display:flex;flex-direction:column;align-items:center;justify-content:center;gap:.5rem;
  background:
    repeating-linear-gradient(45deg,#efece2 0 14px,#eae6da 14px 28px);
  font-family:inherit;transition:background .2s}
.mapa-btn:hover{background:repeating-linear-gradient(45deg,#e9e5d8 0 14px,#e3ded0 14px 28px)}
.mapa-ic{font-size:2.1rem;line-height:1}
.mapa-t{font-size:1.05rem;font-weight:800;color:#0f1c29;
  background:#c9a84c;padding:.7rem 1.6rem;border-radius:8px}
.mapa-s{font-size:.78rem;color:#7a7365;max-width:30ch;text-align:center;line-height:1.45}
.mapa-rota{display:inline-block;margin-top:1rem;font-size:.92rem;font-weight:700;
  color:#0f1c29;text-decoration:none;border-bottom:2px solid #c9a84c;padding-bottom:2px}
.mapa-rota:hover{color:#c9a84c}
@media(max-width:640px){.mapa-wrap h2{font-size:1.4rem}.mapa-box{aspect-ratio:4/3}}
</style>`;

const JS = `
<script>
// o iframe do Google só nasce no clique: nada sai daqui antes disso
(function(){
  var cx = document.querySelectorAll('.mapa-box');
  for (var i = 0; i < cx.length; i++) {
    cx[i].addEventListener('click', function(){
      if (this.dataset.pronto) return;
      this.dataset.pronto = '1';
      var f = document.createElement('iframe');
      f.src = this.dataset.src;
      f.title = 'Mapa de localização';
      f.loading = 'lazy';
      f.referrerPolicy = 'strict-origin-when-cross-origin';
      f.allowFullscreen = true;
      this.innerHTML = '';
      this.appendChild(f);
    }, { once: true });
  }
})();
<\/script>`;

const bloco = p => {
  const src = p.pb
    ? 'https://www.google.com/maps/embed?pb=' + p.pb
    : 'https://maps.google.com/maps?q=' + p.lat + ',' + p.lng + '&z=17&hl=pt-BR&output=embed';
  return `
<section class="mapa-sec" id="localizacao">
  <div class="mapa-wrap">
    <h2>Onde fica o ${p.n}</h2>
    <p class="mapa-end">Indaiatuba · São Paulo</p>
    <div class="mapa-box" data-src="${src}">
      <button class="mapa-btn" type="button" aria-label="Carregar o mapa de localização">
        <span class="mapa-ic" aria-hidden="true">📍</span>
        <span class="mapa-t">Ver no mapa</span>
        <span class="mapa-s">O mapa é carregado do Google apenas quando você clica.</span>
      </button>
    </div>
    <a class="mapa-rota" href="https://www.google.com/maps/dir/?api=1&amp;destination=${p.lat},${p.lng}"
       target="_blank" rel="noopener">Traçar rota até aqui &rarr;</a>
  </div>
</section>
`;
};

let okGeo = 0, okMapa = 0, pulou = [];

PONTOS.forEach(p => {
  const arq = R + p.d + '/index.html';
  if (!fs.existsSync(arq)) { pulou.push(p.d + ' (não existe)'); return; }
  let s = fs.readFileSync(arq, 'utf8');
  const antes = s;

  // ── 1. geo + hasMap no primeiro JSON-LD ──
  if (!s.includes('"GeoCoordinates"')) {
    const alvo = '    "address": {';
    const i = s.indexOf(alvo);
    if (i >= 0) {
      const geo =
        '    "geo": {\n' +
        '      "@type": "GeoCoordinates",\n' +
        '      "latitude": ' + p.lat + ',\n' +
        '      "longitude": ' + p.lng + '\n' +
        '    },\n' +
        '    "hasMap": "https://www.google.com/maps/search/?api=1&query=' + p.lat + ',' + p.lng + '",\n';
      s = s.slice(0, i) + geo + s.slice(i);
      okGeo++;
    } else pulou.push(p.d + ' (sem address no JSON-LD)');
  }

  // ── 2. bloco do mapa antes do footer ──
  if (!s.includes('class="mapa-sec"')) {
    const i = s.indexOf('<footer');
    if (i >= 0) {
      s = s.slice(0, i) + CSS + bloco(p) + JS + '\n' + s.slice(i);
      okMapa++;
    } else pulou.push(p.d + ' (sem <footer>)');
  }

  if (s !== antes) fs.writeFileSync(arq, s, 'utf8');
});

console.log('geo no JSON-LD : ' + okGeo + '/' + PONTOS.length);
console.log('bloco do mapa  : ' + okMapa + '/' + PONTOS.length);
console.log('com ficha no Maps: ' + PONTOS.filter(p => p.pb).length + ' · por coordenada: ' + PONTOS.filter(p => !p.pb).length);
if (pulou.length) console.log('\nPULOU:\n  ' + pulou.join('\n  '));
