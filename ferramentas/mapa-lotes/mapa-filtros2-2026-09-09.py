# -*- coding: utf-8 -*-
# Parte 2: chips de especie, campo de busca, pinos de bairro e plantas respeitando os filtros, estado vazio.
import sys
sys.stdout.reconfigure(encoding='utf-8')
P = 'C:/Users/Usuario/Desktop/landing-page/mapa-lotes-indaiatuba/index.html'
s = open(P, encoding='utf-8', newline='').read(); assert '\r' not in s
def rep(velho, novo, n=1):
    global s
    assert s.count(velho) == n, (s.count(velho), velho[:90])
    s = s.replace(velho, novo)

# a) chips: especie do loteamento (topo) + tipo de lote, e o campo de busca
rep("""const chips = document.getElementById('chips');
Object.entries(TIPOS).forEach(([k, v]) => {
  const c = document.createElement('button'); c.type = 'button'; c.className = 'chip'; c.innerHTML = `<i style="background:${v[2]}"></i>${v[0]}`;
  c.onclick = () => { ativos.has(k) ? ativos.delete(k) : ativos.add(k); c.classList.toggle('off', !ativos.has(k)); desenhar(); montarLista(); };
  chips.appendChild(c);
});""",
"""function montarChips(alvo, defs, conjunto) {
  const cx = document.getElementById(alvo);
  Object.entries(defs).forEach(([k, v]) => {
    const c = document.createElement('button'); c.type = 'button'; c.className = 'chip'; c.setAttribute('aria-pressed', 'true');
    c.innerHTML = `<i style="background:${v[v.length - 1]}"></i>${v[0]}`;
    c.onclick = () => {
      conjunto.has(k) ? conjunto.delete(k) : conjunto.add(k);
      c.classList.toggle('off', !conjunto.has(k)); c.setAttribute('aria-pressed', String(conjunto.has(k)));
      aplicarFiltros();
    };
    cx.appendChild(c);
  });
}
montarChips('chipsLot', LOTEAM, ativosLot);
montarChips('chips', TIPOS, ativos);
const campoBusca = document.getElementById('busca');
let tBusca = null;
campoBusca.addEventListener('input', () => {
  clearTimeout(tBusca);
  tBusca = setTimeout(() => { termo = semAcento(campoBusca.value.trim()); aplicarFiltros(); }, 180);
});
function aplicarFiltros() { desenhar(); atualizarPinosBairro(); montarLista(); atualizarNivel(); }""")

# b) lista: estado vazio quando nada casa com os filtros
rep("""    div.querySelector('button').onclick = () => irParaBairro(b.id);
    lista.appendChild(div);
  });
}""",
"""    div.querySelector('button').onclick = () => irParaBairro(b.id);
    lista.appendChild(div);
  });
  if (!lista.children.length) lista.innerHTML = '<p class="vazio">Nenhum lote com esses filtros. Tente limpar a busca ou ligar mais tipos de lote.</p>';
}""")

# c) pinos de bairro passam a respeitar os filtros (contagem e "desde" recalculados)
rep("""const camadaBairros = L.layerGroup();
const plantas = {};
BAIRROS.forEach(b => {
  const ls = LOTES.filter(x => x.b === b.id);
  const pts = ls.flatMap(x => x.poly ? x.poly : x.ll ? [x.ll] : []);
  const centro = pts.length ? L.latLngBounds(pts).getCenter() : (b.centro ? L.latLng(b.centro) : null);
  if (!centro || !ls.length) return;
  const mk = L.marker(centro, { icon: L.divIcon({ className: 'pino-bairro', html: `<div><b>${b.nome}</b><span>${ls.length} lote${ls.length > 1 ? 's' : ''} · ${desdeTxt(ls)}</span></div>`, iconSize: null, iconAnchor: [0, 0] }) });
  mk.on('click', () => irParaBairro(b.id, true));
  camadaBairros.addLayer(mk);""",
"""const camadaBairros = L.layerGroup();
const plantas = {};
const pinosBairro = {};
const iconeBairro = (b, ls) => L.divIcon({ className: 'pino-bairro', html: `<div><b>${b.nome}</b><span>${ls.length} lote${ls.length > 1 ? 's' : ''} · ${desdeTxt(ls)}</span></div>`, iconSize: null, iconAnchor: [0, 0] });
BAIRROS.forEach(b => {
  const ls = LOTES.filter(x => x.b === b.id);
  const pts = ls.flatMap(x => x.poly ? x.poly : x.ll ? [x.ll] : []);
  const centro = pts.length ? L.latLngBounds(pts).getCenter() : (b.centro ? L.latLng(b.centro) : null);
  if (!centro || !ls.length) return;
  const mk = L.marker(centro, { icon: iconeBairro(b, ls) });
  mk.on('click', () => irParaBairro(b.id, true));
  pinosBairro[b.id] = mk;
  camadaBairros.addLayer(mk);""")

# d) recalcula os pinos de bairro a cada mudanca de filtro
rep("""function atualizarNivel() {
  const perto = mapa.getZoom() >= ZOOM_LOTES;""",
"""// quantos lotes de cada bairro sobrevivem aos filtros — usado pelo pino de bairro e pela planta
function contagemFiltrada() {
  const c = {};
  LOTES.forEach(x => { if (passa(x)) c[x.b] = (c[x.b] || 0) + 1; });
  return c;
}
function atualizarPinosBairro() {
  BAIRROS.forEach(b => {
    const mk = pinosBairro[b.id]; if (!mk) return;
    const ls = LOTES.filter(x => x.b === b.id && passa(x));
    if (!ls.length) { camadaBairros.removeLayer(mk); return; }
    mk.setIcon(iconeBairro(b, ls));
    if (!camadaBairros.hasLayer(mk)) camadaBairros.addLayer(mk);
  });
}
function atualizarNivel() {
  const perto = mapa.getZoom() >= ZOOM_LOTES;""")

# e) planta só aparece se o bairro tem lote passando nos filtros
rep("""  const vista = mapa.getBounds().pad(0.2);   // planta só é baixada/desenhada quando o bairro entra na tela
  Object.values(plantas).forEach(o => liga(o, perto && vista.intersects(o.getBounds())));""",
"""  const vista = mapa.getBounds().pad(0.2);   // planta só é baixada/desenhada quando o bairro entra na tela
  const cont = contagemFiltrada();
  Object.entries(plantas).forEach(([id, o]) => liga(o, perto && !!cont[id] && vista.intersects(o.getBounds())));""")
open(P, 'w', encoding='utf-8', newline='').write(s)
print('parte 2 aplicada (chips, busca, pinos de bairro, plantas, estado vazio)')
