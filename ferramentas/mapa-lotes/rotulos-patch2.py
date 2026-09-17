# -*- coding: utf-8 -*-
# Mapa de lotes: bolinhas coladas viram um grupo (soma dos lotes, nomes no hover, clique aproxima)
P = 'C:/Users/Usuario/Desktop/landing-page/mapa-lotes-indaiatuba/index.html'
s = open(P, encoding='utf-8', newline='').read()
assert 'arrumarRotulos' in s and '_grupo' not in s

a = s.index('function arrumarRotulos() {')
b = s.index("mapa.on('zoomend', arrumarRotulos);")
novo = r"""function arrumarRotulos() {
  if (mapa.getZoom() >= ZOOM_LOTES) return;
  const itens = [];
  BAIRROS.forEach(b => {
    const mk = pinosBairro[b.id];
    if (!mk || !camadaBairros.hasLayer(mk)) return;
    const ls = LOTES.filter(x => x.b === b.id && passa(x));
    if (ls.length) itens.push({ b, mk, ls, p: mapa.latLngToContainerPoint(mk.getLatLng()) });
  });
  itens.sort((a, c) => c.ls.length - a.ls.length);
  const caixas = [], minis = [];
  const bate = (a, c) => a.x0 < c.x1 && c.x0 < a.x1 && a.y0 < c.y1 && c.y0 < a.y1;
  const R = 17;   // raio da bolinha + folga
  itens.forEach(it => {
    const [w, h] = medir(htmlBairro(it.b, it.ls));
    const cx = { x0: it.p.x - w / 2 - 4, x1: it.p.x + w / 2 + 4, y0: it.p.y - h - 10, y1: it.p.y + 4 };
    const el = it.mk.getElement();
    it.mk.setOpacity(1);
    if (el) el.style.pointerEvents = '';
    if (!caixas.some(c => bate(c, cx)) && !minis.some(m => bate(m.caixa, cx))) {
      caixas.push(cx);
      it.mk._grupo = null;
      it.mk.setIcon(iconeBairro(it.b, it.ls));
      it.mk.setZIndexOffset(1000);
      it.mk.unbindTooltip();
      return;
    }
    // bolinha: entra no grupo mais próximo que ela tocaria; senão vira uma bolinha nova
    const caixaMini = { x0: it.p.x - R, x1: it.p.x + R, y0: it.p.y - R, y1: it.p.y + R };
    const alvo = minis.filter(m => bate(m.caixa, caixaMini))
      .sort((m, n) => Math.hypot(m.p.x - it.p.x, m.p.y - it.p.y) - Math.hypot(n.p.x - it.p.x, n.p.y - it.p.y))[0];
    if (alvo) {
      alvo.membros.push(it);
      it.mk.setOpacity(0);
      it.mk.unbindTooltip();
      if (el) el.style.pointerEvents = 'none';
    } else {
      minis.push({ p: it.p, caixa: caixaMini, membros: [it] });
    }
  });
  minis.forEach(m => {
    const cabeca = m.membros[0].mk;
    const total = m.membros.reduce((t, it) => t + it.ls.length, 0);
    const n = m.membros.length;
    cabeca._grupo = n > 1 ? m.membros.map(it => it.b.id) : null;
    cabeca.setIcon(L.divIcon({ className: 'pino-bairro-mini' + (n > 1 ? ' grupo' : ''), html: `<div>${total}</div>`, iconSize: null, iconAnchor: [0, 0] }));
    cabeca.setZIndexOffset(500);
    const dica = n > 1
      ? `${n} loteamentos · ${total} lotes<br>${m.membros.map(it => it.b.nome).join('<br>')}<br><i>clique para aproximar</i>`
      : `${m.membros[0].b.nome} · ${total} lote${total > 1 ? 's' : ''}`;
    if (!cabeca.getTooltip()) cabeca.bindTooltip(dica, { direction: 'top', offset: [0, -14], className: 'rotulo' });
    else cabeca.setTooltipContent(dica);
  });
}
"""
s = s[:a] + novo + s[b:]

velho = "  mk.on('click', () => irParaBairro(b.id, true));"
novo_click = """  mk.on('click', () => {
    if (mk._grupo) {   // grupo de bairros colados: aproxima até eles se separarem
      const bx = L.latLngBounds(mk._grupo.map(id => pinosBairro[id].getLatLng())).pad(0.6);
      const z = Math.min(Math.max(mapa.getBoundsZoom(bx), mapa.getZoom() + 1), ZOOM_LOTES);
      mapa.setView(bx.getCenter(), z);
    } else irParaBairro(b.id, true);
  });"""
assert velho in s
s = s.replace(velho, novo_click, 1)

css_ancora = "    .pino-bairro-mini:hover div,"
css = "    .pino-bairro-mini.grupo div{width:32px;height:32px;margin:-16px 0 0 -16px;box-shadow:0 0 0 3px rgba(201,162,39,.45),0 2px 6px rgba(0,0,0,.35)}\n"
assert css_ancora in s
s = s.replace(css_ancora, css + css_ancora, 1)
open(P, 'w', encoding='utf-8', newline='').write(s)
print('ok')
