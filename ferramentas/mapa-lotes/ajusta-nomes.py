# -*- coding: utf-8 -*-
# Georreferencia pela POSICAO DOS ROTULOS de vias nomeadas na planta x vias de mesmo nome no OSM (similaridade: escala, rumo, translacao).
# Busca: rumo 0..360 (passo grosso) x escala (fatores) x translacao (ancorada: o rotulo de uma via longa percorre a via OSM);
# custo = soma das distancias rotulo->via. Refino local. Uso: ajusta-nomes.py cfg.json
#   cfg: id, texto (json do pdf-texto), m_por_pt, osm, nomes {"texto na planta (regex)": "nome OSM"}, ancora (nome OSM), pw, ph, escalas [..]
import json, os, re, sys, math, unicodedata
sys.stdout.reconfigure(encoding='utf-8')
exec(open(os.path.dirname(os.path.abspath(__file__)) + '/utm.py', encoding='utf-8').read())
cfg = json.load(open(sys.argv[1], encoding='utf-8'))
T = os.environ['TEMP'] + '/mapas/'
def norm(s): return re.sub(r'\s+', ' ', unicodedata.normalize('NFKD', s).encode('ascii', 'ignore').decode().upper()).strip()
vias = {}
for el in json.load(open(T + cfg['osm'], encoding='utf-8'))['elements']:
    tg = el.get('tags', {}); gg = el.get('geometry')
    if gg and tg.get('highway') and tg.get('name'): vias.setdefault(norm(tg['name']), []).append([ll2utm(p['lat'], p['lon']) for p in gg])
rot = []   # (x_pt, y_pt, nome_osm)
for i in json.load(open(T + cfg['texto'], encoding='utf-8')):
    t = norm(i['t'])
    for rx, nome in cfg['nomes'].items():
        if re.search(rx, t) and norm(nome) in vias: rot.append((i['x'], i['y'], norm(nome), i['t'].strip())); break
print('rotulos casados:', len(rot), sorted({r[2] for r in rot}))
def dist_seg(p, a, b):
    ax, ay = a; bx, by = b; px, py = p; dx, dy = bx - ax, by - ay
    t = 0 if dx == dy == 0 else max(0, min(1, ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy)))
    return math.hypot(px - (ax + t * dx), py - (ay + t * dy))
def dist_via(p, nome): return min(dist_seg(p, a, b) for w in vias[nome] for a, b in zip(w, w[1:]))
# centro dos rotulos (pt) -> coordenadas relativas
cx = sum(r[0] for r in rot) / len(rot); cy = sum(r[1] for r in rot) / len(rot)
def transf(x, y, s, th, E0, N0):
    t = math.radians(th); dx, dy = (x - cx) * s, (y - cy) * s
    return (E0 + dx * math.cos(t) + dy * math.sin(t), N0 - dx * math.sin(t) + dy * math.cos(t))
def custo(s, th, E0, N0, lim=1e9):
    tot = 0
    for x, y, nome, _ in rot:
        tot += min(dist_via(transf(x, y, s, th, E0, N0), nome), 150)   # saturado: um rotulo errado nao domina
        if tot > lim: return tot
    return tot
# pontos-ancora: amostra da via OSM da ancora a cada 'passo_ancora' m
anc = norm(cfg['ancora']); amostra = []
for w in vias[anc]:
    for a, b in zip(w, w[1:]):
        L = math.hypot(b[0] - a[0], b[1] - a[1]); n = max(1, int(L / cfg.get('passo_ancora', 8)))
        amostra += [(a[0] + (b[0] - a[0]) * k / n, a[1] + (b[1] - a[1]) * k / n) for k in range(n)]
ra = [r for r in rot if r[2] == anc][0]; print('ancora:', ra[3], '| pontos na via:', len(amostra))
mpt = cfg['m_por_pt']; melhor = (1e18, None)
for fe in cfg.get('escalas', [1.0]):
    s = mpt * fe
    for th in range(0, 360, cfg.get('passo_rumo', 2)):
        t = math.radians(th); dx, dy = (ra[0] - cx) * s, (ra[1] - cy) * s
        for (E, N) in amostra:   # translacao que poe o rotulo-ancora neste ponto da via
            E0 = E - (dx * math.cos(t) + dy * math.sin(t)); N0 = N - (-dx * math.sin(t) + dy * math.cos(t))
            c = custo(s, th, E0, N0, melhor[0])
            if c < melhor[0]: melhor = (c, (s, th, E0, N0))
c, (s, th, E0, N0) = melhor; print('grosso: custo %.0f m (media %.1f) escala %.4f rumo %d' % (c, c / len(rot), s, th))
# refino: rumo +-3 (0.25), translacao +-30 m (1 m), escala +-2%
for it in range(3):
    for fe in [0.98, 0.99, 1.0, 1.01, 1.02]:
        for dth in [d * 0.25 for d in range(-12, 13)]:
            for dE in range(-30, 31, 3 if it == 0 else 1):
                for dN in range(-30, 31, 3 if it == 0 else 1):
                    cc = custo(s * fe, th + dth, E0 + dE, N0 + dN, melhor[0])
                    if cc < melhor[0]: melhor = (cc, (s * fe, th + dth, E0 + dE, N0 + dN))
    c, (s, th, E0, N0) = melhor
print('fino: custo %.0f m (media %.1f) escala %.4f m/pt rumo %.2f' % (c, c / len(rot), s, th))
for x, y, nome, txt in rot: print('  %-40s %5.1f m' % (txt[:40], dist_via(transf(x, y, s, th, E0, N0), nome)))
t = math.radians(th); a_ = s * math.cos(t); b_ = s * math.sin(t); d_ = -s * math.sin(t); e_ = s * math.cos(t)
c_ = E0 - a_ * cx - b_ * cy; f_ = N0 - d_ * cx - e_ * cy
fit = {'E': [a_, b_, c_], 'N': [d_, e_, f_], 'theta': th, 'escala_m_pt': s, 'custo_medio_m': c / len(rot), 'fonte': 'rotulos de vias nomeadas x OSM (ajusta-nomes)'}
json.dump(fit, open(T + cfg['id'] + '-fit-nomes.json', 'w')); print('fit salvo:', cfg['id'] + '-fit-nomes.json')
