# -*- coding: utf-8 -*-
# Mapa de lotes: rótulos de bairro sem sobreposição (quem não cabe vira bolinha com o número de lotes)
P = 'C:/Users/Usuario/Desktop/landing-page/mapa-lotes-indaiatuba/index.html'
s = open(P, encoding='utf-8', newline='').read()
assert 'arrumarRotulos' not in s

css_ancora = "    .pp .lnk{display:block;margin-top:.45rem;font-size:.78rem;color:var(--com)}\n"
css_novo = ("    .pino-bairro-mini div{width:26px;height:26px;margin:-13px 0 0 -13px;border-radius:50%;background:var(--ouro);color:var(--preto);"
            "border:2px solid var(--preto);display:flex;align-items:center;justify-content:center;font:700 .66rem 'Josefin Sans',sans-serif;"
            "box-shadow:0 2px 6px rgba(0,0,0,.35);cursor:pointer}\n"
            "    .pino-bairro-mini:hover div,.pino-bairro-mini:focus-visible div{transform:scale(1.15)}\n")
assert css_ancora in s
s = s.replace(css_ancora, css_novo + css_ancora, 1)

velho = "const iconeBairro = (b, ls) => L.divIcon({ className: 'pino-bairro', html: `<div><b>${b.nome}</b><span>${ls.length} lote${ls.length > 1 ? 's' : ''} · ${desdeTxt(ls)}</span></div>`, iconSize: null, iconAnchor: [0, 0] });"
novo = ("const htmlBairro = (b, ls) => `<div><b>${b.nome}</b><span>${ls.length} lote${ls.length > 1 ? 's' : ''} · ${desdeTxt(ls)}</span></div>`;\n"
        "const iconeBairro = (b, ls) => L.divIcon({ className: 'pino-bairro', html: htmlBairro(b, ls), iconSize: null, iconAnchor: [0, 0] });\n"
        "const iconeMini = (b, ls) => L.divIcon({ className: 'pino-bairro-mini', html: `<div>${ls.length}</div>`, iconSize: null, iconAnchor: [0, 0] });")
assert velho in s
s = s.replace(velho, novo, 1)

velho2 = "mapa.on('zoomend moveend', atualizarNivel); atualizarNivel();"
novo2 = r"""mapa.on('zoomend moveend', atualizarNivel); atualizarNivel();

// ─── RÓTULOS SEM SOBREPOSIÇÃO: de longe, o bairro cujo rótulo bateria em outro vira uma bolinha com o número de
// lotes (nome no hover, zoom no clique). Os maiores (mais lotes) ganham o rótulo primeiro. Refeito a cada zoom e filtro.
const medidas = {};
const medidor = document.createElement('div');
medidor.className = 'pino-bairro';
medidor.style.cssText = 'position:absolute;left:-9999px;top:0;visibility:hidden;pointer-events:none';
document.body.appendChild(medidor);
function medir(html) {
  if (!medidas[html]) {
    medidor.innerHTML = html;
    const d = medidor.firstElementChild;
    medidas[html] = [d.offsetWidth, d.offsetHeight];
  }
  return medidas[html];
}
function arrumarRotulos() {
  if (mapa.getZoom() >= ZOOM_LOTES) return;
  const itens = [];
  BAIRROS.forEach(b => {
    const mk = pinosBairro[b.id];
    if (!mk || !camadaBairros.hasLayer(mk)) return;
    const ls = LOTES.filter(x => x.b === b.id && passa(x));
    if (ls.length) itens.push({ b, mk, ls, p: mapa.latLngToContainerPoint(mk.getLatLng()) });
  });
  itens.sort((a, c) => c.ls.length - a.ls.length);
  const caixas = [];
  const bate = (a, c) => a.x0 < c.x1 && c.x0 < a.x1 && a.y0 < c.y1 && c.y0 < a.y1;
  itens.forEach(it => {
    const [w, h] = medir(htmlBairro(it.b, it.ls));
    const cx = { x0: it.p.x - w / 2 - 4, x1: it.p.x + w / 2 + 4, y0: it.p.y - h - 10, y1: it.p.y + 4 };
    const nome = it.b.nome + ' · ' + it.ls.length + ' lote' + (it.ls.length > 1 ? 's' : '');
    if (!caixas.some(c => bate(c, cx))) {
      caixas.push(cx);
      it.mk.setIcon(iconeBairro(it.b, it.ls));
      it.mk.setZIndexOffset(1000);
      it.mk.unbindTooltip();
    } else {
      it.mk.setIcon(iconeMini(it.b, it.ls));
      it.mk.setZIndexOffset(0);
      if (!it.mk.getTooltip()) it.mk.bindTooltip(nome, { direction: 'top', offset: [0, -14], className: 'rotulo' });
      else it.mk.setTooltipContent(nome);
    }
  });
}
mapa.on('zoomend', arrumarRotulos);
window.addEventListener('resize', arrumarRotulos);
if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { Object.keys(medidas).forEach(k => delete medidas[k]); arrumarRotulos(); });
window.__rotulosProntos = true;
arrumarRotulos();"""
assert velho2 in s
s = s.replace(velho2, novo2, 1)

# filtros mudam o texto dos rótulos: rearrumar depois de atualizarPinosBairro
velho3 = """    mk.setIcon(iconeBairro(b, ls));
    if (!camadaBairros.hasLayer(mk)) camadaBairros.addLayer(mk);
  });
}"""
novo3 = """    mk.setIcon(iconeBairro(b, ls));
    if (!camadaBairros.hasLayer(mk)) camadaBairros.addLayer(mk);
  });
  if (window.__rotulosProntos) arrumarRotulos();
}"""
assert velho3 in s
s = s.replace(velho3, novo3, 1)
open(P, 'w', encoding='utf-8', newline='').write(s)
print('ok')
