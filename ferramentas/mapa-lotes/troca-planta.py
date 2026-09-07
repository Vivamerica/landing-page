# -*- coding: utf-8 -*-
# Troca a planta <id> pelo overlay inteiro (<id>-cheio-overlay.png / <id>-cheio-bounds.json do TEMP/mapas):
# imagem no site, bounds no index.html e nos dados, plantas.json do editor, e o ajuste salvo pelo Fabio convertido
# para a geometria nova (a mesma transformacao do terreno — deslocamento, giro, escala, deformacao — aplicada aos
# cantos do retangulo novo). Uso: troca-planta.py <id>
import json, math, os, re, shutil, sys
sys.stdout.reconfigure(encoding='utf-8')
ID = sys.argv[1]
T = os.environ['TEMP'] + '/mapas/'
R = 'C:/Users/Usuario/Desktop/landing-page/'
D = R + 'ferramentas/mapa-lotes/dados/'
A = os.path.dirname(os.path.abspath(__file__)) + '/ajuste/'
M_LAT = 111320.0
def mlon(lat): return M_LAT * math.cos(math.radians(lat))
def metros(a, b): return ((b[1] - a[1]) * mlon(a[0]), (b[0] - a[0]) * M_LAT)
def llde(c, dx, dy): return [c[0] + dy / M_LAT, c[1] + dx / mlon(c[0])]
def homografia(src, dst):
    M = []
    for (x, y), (X, Y) in zip(src, dst):
        M.append([x, y, 1, 0, 0, 0, -X * x, -X * y, X]); M.append([0, 0, 0, x, y, 1, -Y * x, -Y * y, Y])
    n = 8
    for i in range(n):
        p = max(range(i, n), key=lambda r: abs(M[r][i])); M[i], M[p] = M[p], M[i]
        for r in range(n):
            if r == i: continue
            f = M[r][i] / M[i][i]
            if f: M[r] = [M[r][c] - f * M[i][c] for c in range(n + 1)]
    return [M[i][n] / M[i][i] for i in range(n)]
def aplica(h, x, y):
    w = h[6] * x + h[7] * y + 1; return ((h[0] * x + h[1] * y + h[2]) / w, (h[3] * x + h[4] * y + h[5]) / w)
CANTOS = ['tl', 'tr', 'br', 'bl']
def retangulo(b): (la0, lo0), (la1, lo1) = b; return {'tl': [la1, lo0], 'tr': [la1, lo1], 'br': [la0, lo1], 'bl': [la0, lo0]}
nb = json.load(open(T + ID + '-cheio-bounds.json')); (la0, lo0), (la1, lo1) = nb['bounds']; W, H = nb['size']
fmt = lambda b: '[[%.9f,%.9f],[%.9f,%.9f]]' % (b[0][0], b[0][1], b[1][0], b[1][1])
# 1) imagem
shutil.copyfile(T + ID + '-cheio-overlay.png', R + 'mapa-lotes-indaiatuba/images/' + ID + '.png')
# 2) index.html (so' os bounds; os pinos nao mudam — a georreferencia e' a mesma)
p = R + 'mapa-lotes-indaiatuba/index.html'; s = open(p, encoding='utf-8', newline='').read(); assert '\r' not in s
pat = re.compile(r"(id:'%s'.*?overlay:\{ url:'images/%s\.png', bounds:)\[\[[^\]]+\],\[[^\]]+\]\]" % (ID, ID))
assert len(pat.findall(s)) == 1
velho = [[float(x) for x in par.split(',')] for par in re.findall(r'\[([-\d.]+,[-\d.]+)\]', pat.search(s).group(0)[-60:])[-2:]]
s2 = pat.sub(lambda m: m.group(1) + fmt(nb['bounds']), s); assert s2 != s
open(p, 'w', encoding='utf-8', newline='').write(s2)
# 3) dados
json.dump(nb, open(D + ID + '-bounds.json', 'w'))
for f in [ID + '-cheio-overlay-cfg.json', ID + '-mascara-cfg.json']:
    if os.path.exists(T + f): shutil.copyfile(T + f, D + f)
# 4) editor: plantas.json
pj = json.load(open(A + 'plantas.json', encoding='utf-8'))
e = [x for x in pj['plantas'] if x['id'] == ID][0]; bounds_velho = e['bounds']; e['bounds'] = nb['bounds']; e['w'], e['h'] = W, H
json.dump(pj, open(A + 'plantas.json', 'w', encoding='utf-8'), ensure_ascii=False)
# 5) ajuste do Fabio: a transformacao que leva o retangulo velho aos cantos dele, aplicada aos cantos do retangulo novo
aj = json.load(open(A + 'ajustes.json', encoding='utf-8'))
old = aj['plantas'].get(ID)
if old:
    b0 = old.get('bounds0', bounds_velho); (ola0, olo0), (ola1, olo1) = b0
    if old.get('cantos'): C = {k: old['cantos'][k] for k in CANTOS}
    else:
        c, u, v = [old['lat'], old['lon']], old['u'], old['v']
        tl = llde(c, -(u[0] + v[0]) / 2, -(u[1] + v[1]) / 2); tr = llde(c, (u[0] - v[0]) / 2, (u[1] - v[1]) / 2); bl = llde(c, (v[0] - u[0]) / 2, (v[1] - u[1]) / 2)
        C = {'tl': tl, 'tr': tr, 'bl': bl, 'br': [tr[0] + bl[0] - tl[0], tr[1] + bl[1] - tl[1]]}
    Hh = homografia([(0, 0), (1, 0), (1, 1), (0, 1)], [(0, 0), metros(C['tl'], C['tr']), metros(C['tl'], C['br']), metros(C['tl'], C['bl'])])
    novo = {}
    for k, G in retangulo(nb['bounds']).items():
        sx, ty = (G[1] - olo0) / (olo1 - olo0), (ola1 - G[0]) / (ola1 - ola0)   # posicao do canto novo no retangulo VELHO
        X, Y = aplica(Hh, sx, ty); novo[k] = [round(x, 9) for x in llde(C['tl'], X, Y)]
    cn = [(la0 + la1) / 2, (lo0 + lo1) / 2]; ce = [sum(novo[k][0] for k in CANTOS) / 4, sum(novo[k][1] for k in CANTOS) / 4]
    u = metros(novo['tl'], novo['tr']); v = metros(novo['tl'], novo['bl']); Wm = (lo1 - lo0) * mlon(cn[0]); Hm = (la1 - la0) * M_LAT
    ent = dict(old); ent.update({'cantos': novo, 'lat': round(ce[0], 9), 'lon': round(ce[1], 9), 'u': [round(x, 4) for x in u], 'v': [round(x, 4) for x in v],
                                 'Wm': round(Wm, 4), 'Hm': round(Hm, 4), 'lat0': cn[0], 'lon0': cn[1], 'bounds0': nb['bounds']})
    aj['plantas'][ID] = ent
    json.dump(aj, open(A + 'ajustes.json', 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    shutil.copyfile(A + 'ajustes.json', A + 'ajustes-troca-%s.json' % ID)
    d = math.hypot(*metros(cn, ce)); print('ajuste do Fabio convertido: desloca %.1f m, giro %.2f°, largura %.2f%%' % (d, -math.degrees(math.atan2(u[1], u[0])), math.hypot(*u) / Wm * 100))
print('%s: %dx%d px, bounds %s (antes %s)' % (ID, W, H, fmt(nb['bounds']), fmt(velho) if len(velho) == 2 else bounds_velho))
