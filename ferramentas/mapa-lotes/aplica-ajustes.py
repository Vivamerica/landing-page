# -*- coding: utf-8 -*-
# Aplica no mapa os encaixes feitos no editor (ajuste/ajustes.json): a planta e' deformada para os 4 cantos que o
# Fabio deixou (homografia = mover, girar, esticar, entortar), reamostrada norte para cima, os bounds recalculados e
# os pinos levados pela mesma transformacao. Aceita a versao 3 (cantos), a 2 (centro + u/v) e a 1 (theta/escala).
# Uso: aplica-ajustes.py            aplica no site (images/<id>.png + index.html), zera o editor e arquiva o ajustes.json
#      aplica-ajustes.py --seco     so relatorio
#      aplica-ajustes.py --teste D  grava imagem, bounds e uma copia do index.html na pasta D, sem tocar no site
import json, math, os, re, sys, shutil, time
from PIL import Image
sys.stdout.reconfigure(encoding='utf-8')
S = os.path.dirname(os.path.abspath(__file__))
R = 'C:/Users/Usuario/Desktop/landing-page/mapa-lotes-indaiatuba/'
SECO = '--seco' in sys.argv
TESTE = sys.argv[sys.argv.index('--teste') + 1] if '--teste' in sys.argv else None
SO = [a for a in sys.argv[1:] if not a.startswith('--') and a != TESTE]   # ids especificos (opcional)
M_LAT = 111320.0
def mlon(lat): return M_LAT * math.cos(math.radians(lat))
def metros(a, b): return ((b[1] - a[1]) * mlon(a[0]), (b[0] - a[0]) * M_LAT)
def llde(c, dx, dy): return (c[0] + dy / M_LAT, c[1] + dx / mlon(c[0]))
def gira(u, th):
    c, s = math.cos(math.radians(th)), math.sin(math.radians(th)); return (u[0] * c - u[1] * s, u[0] * s + u[1] * c)
def homografia(src, dst):
    M = []
    for (x, y), (X, Y) in zip(src, dst):
        M.append([x, y, 1, 0, 0, 0, -X * x, -X * y, X]); M.append([0, 0, 0, x, y, 1, -Y * x, -Y * y, Y])
    n = 8
    for i in range(n):
        p = max(range(i, n), key=lambda r: abs(M[r][i])); M[i], M[p] = M[p], M[i]
        piv = M[i][i]
        if abs(piv) < 1e-14: raise ValueError('cantos degenerados')
        for r in range(n):
            if r == i: continue
            f = M[r][i] / piv
            if f: M[r] = [M[r][c] - f * M[i][c] for c in range(n + 1)]
    return [M[i][n] / M[i][i] for i in range(n)]
def aplica(h, x, y):
    w = h[6] * x + h[7] * y + 1; return ((h[0] * x + h[1] * y + h[2]) / w, (h[3] * x + h[4] * y + h[5]) / w)
def cantos_uv(c, u, v):
    tl = llde(c, -(u[0] + v[0]) / 2, -(u[1] + v[1]) / 2); tr = llde(c, (u[0] - v[0]) / 2, (u[1] - v[1]) / 2); bl = llde(c, (v[0] - u[0]) / 2, (v[1] - u[1]) / 2)
    return {'tl': tl, 'tr': tr, 'bl': bl, 'br': (tr[0] + bl[0] - tl[0], tr[1] + bl[1] - tl[1])}
CANTOS = ['tl', 'tr', 'br', 'bl']
aj = json.load(open(S + '/ajuste/ajustes.json', encoding='utf-8'))['plantas']
if SO: aj = {k: v for k, v in aj.items() if k in SO}
# entrada com os MESMOS cantos de um ajuste ja' aplicado e' re-gravacao de estado velho (aba do editor sem F5), nao ajuste novo
import glob
_apl = {}
for _f in sorted(glob.glob(S + '/ajuste/ajustes-aplicado-*.json')): _apl.update(json.load(open(_f, encoding='utf-8'))['plantas'])
for _k in list(aj):
    _p, _v = _apl.get(_k), aj[_k]
    if _p and _v.get('cantos') and all(abs(_p['cantos'][q][i] - _v['cantos'][q][i]) < 1e-8 for q in CANTOS for i in (0, 1)):
        print('!! %s: cantos iguais a um ajuste ja' aplicado — e' re-gravacao antiga, pulei' % _k); del aj[_k]
if not aj: print('nada ajustado'); sys.exit()
html = open(R + 'index.html', encoding='utf-8', newline='').read(); assert '\r' not in html
saida_img = (TESTE.rstrip('/\\') + '/') if TESTE else R + 'images/'
if TESTE: os.makedirs(saida_img, exist_ok=True)
aplicados = {}
for bid, a in aj.items():
    m = re.search(r"\{ id:'%s',.*?bounds:\[\[([-\d.]+),([-\d.]+)\],\[([-\d.]+),([-\d.]+)\]\]" % re.escape(bid), html)
    if not m: print('!! %s nao encontrado no mapa' % bid); continue
    la0, lo0, la1, lo1 = [float(m.group(i)) for i in range(1, 5)]
    c0 = ((la0 + la1) / 2, (lo0 + lo1) / 2); Wm, Hm = (lo1 - lo0) * mlon(c0[0]), (la1 - la0) * M_LAT
    # o editor partiu do mesmo retangulo que esta' no index.html? (senao o ajuste e' relativo a outra imagem)
    if 'lat0' in a and (abs(a['lat0'] - c0[0]) > 2e-7 or abs(a['lon0'] - c0[1]) > 2e-7):
        print('!! %s: o ajuste foi feito sobre outra imagem (centro %.6f,%.6f x %.6f,%.6f) — pulei' % (bid, a['lat0'], a['lon0'], c0[0], c0[1])); continue
    if a.get('bounds0') and any(abs(a['bounds0'][i][j] - [[la0, lo0], [la1, lo1]][i][j]) > 2e-7 for i in range(2) for j in range(2)):
        print('!! %s: bounds0 do ajuste != bounds do index.html (imagem trocada/aplicada depois do ajuste) — pulei' % bid); continue
    if a.get('cantos'): C = {k: tuple(a['cantos'][k]) for k in CANTOS}
    elif a.get('u') and a.get('v'): C = cantos_uv((a['lat'], a['lon']), a['u'], a['v'])
    else:
        e, t = a.get('escala', 1), -a.get('theta', 0); C = cantos_uv((a['lat'], a['lon']), gira((Wm * e, 0), -t), gira((0, -Hm * e), -t))
    im = Image.open(R + 'images/' + bid + '.png').convert('RGBA'); w, h = im.size
    res = Wm / w   # m/px da imagem atual
    lats = [C[k][0] for k in CANTOS]; lons = [C[k][1] for k in CANTOS]
    nla0, nla1, nlo0, nlo1 = min(lats), max(lats), min(lons), max(lons)
    cn = ((nla0 + nla1) / 2, (nlo0 + nlo1) / 2)
    OW = max(1, round((nlo1 - nlo0) * mlon(cn[0]) / res)); OH = max(1, round((nla1 - nla0) * M_LAT / res))
    def out_px(ll): return ((ll[1] - nlo0) / (nlo1 - nlo0) * OW, (nla1 - ll[0]) / (nla1 - nla0) * OH)
    alvo = [out_px(C[k]) for k in CANTOS]; fonte = [(0, 0), (w, 0), (w, h), (0, h)]
    coef = homografia(alvo, fonte)   # pixel de saida -> pixel da fonte (o que o PIL pede)
    # medidas para o relatorio
    u = metros(C['tl'], C['tr']); v = metros(C['tl'], C['bl']); brp = (C['tr'][0] + C['bl'][0] - C['tl'][0], C['tr'][1] + C['bl'][1] - C['tl'][1])
    d = math.hypot(*metros(c0, cn)); giro = -math.degrees(math.atan2(u[1], u[0])); defm = math.hypot(*metros(brp, C['br']))
    print('%-14s desloca %5.1f m | giro %6.2f° | largura %6.2f%% | altura %6.2f%% | deformação %4.1f m | %dx%d -> %dx%d px' % (bid, d, giro, math.hypot(*u) / Wm * 100, math.hypot(*v) / Hm * 100, defm, w, h, OW, OH))
    if SECO: continue
    t0 = time.time()
    novo = im.transform((OW, OH), Image.PERSPECTIVE, coef, resample=Image.BICUBIC, fillcolor=(0, 0, 0, 0))
    ncores = len(im.getcolors(4096) or []) or 32
    q = novo.quantize(colors=max(16, min(64, ncores)), method=Image.Quantize.FASTOCTREE)
    q.save(saida_img + bid + '.png', 'PNG', optimize=True)
    nb = [[nla0, nlo0], [nla1, nlo1]]
    linha = m.group(0); html = html.replace(linha, re.sub(r"bounds:\[\[[^\]]*\],\[[^\]]*\]\]", 'bounds:[[%.9f,%.9f],[%.9f,%.9f]]' % (nla0, nlo0, nla1, nlo1), linha))
    # pinos: lat/lon -> posicao normalizada na imagem antiga -> homografia (quadrado unitario -> metros a partir do tl novo)
    Hp = homografia([(0, 0), (1, 0), (1, 1), (0, 1)], [(0, 0), metros(C['tl'], C['tr']), metros(C['tl'], C['br']), metros(C['tl'], C['bl'])])
    def move(mm):
        ll = re.search(r"ll:\[([-\d.]+),([-\d.]+)\]", mm.group(0))
        if not ll: return mm.group(0)
        lat, lon = float(ll.group(1)), float(ll.group(2))
        sx, ty = (lon - lo0) / (lo1 - lo0), (la1 - lat) / (la1 - la0)
        X, Y = aplica(Hp, sx, ty); nl = llde(C['tl'], X, Y)
        return mm.group(0).replace(ll.group(0), 'll:[%.6f,%.6f]' % nl)
    if '--sem-pinos' in sys.argv: n = 0   # so' a imagem: os pinos ja' estao no lugar (retroca de imagem com o mesmo encaixe)
    else: html, n = re.subn(r"^ *\{ b:'%s'.*$" % re.escape(bid), move, html, flags=re.M)
    aplicados[bid] = {'bounds': nb, 'size': [OW, OH]}
    print('               imagem %d KB, %d pino(s) reposicionado(s), %.1fs' % (os.path.getsize(saida_img + bid + '.png') // 1024, n, time.time() - t0))
if SECO or not aplicados: sys.exit()
if TESTE:
    open(saida_img + 'index.html', 'w', encoding='utf-8', newline='').write(html)
    json.dump(aplicados, open(saida_img + 'bounds.json', 'w'), indent=1)
    for bid, x in aplicados.items(): json.dump(x, open(saida_img + bid + '-bounds.json', 'w'))   # p/ confere-overlay.py
    print('teste gravado em', saida_img); sys.exit()
open(R + 'index.html', 'w', encoding='utf-8', newline='').write(html)
# editor: plantas.json passa a partir do estado aplicado; ajustes.json e' arquivado e zerado (senao aplicaria duas vezes)
pj = S + '/ajuste/plantas.json'
if os.path.exists(pj):
    d = json.load(open(pj, encoding='utf-8'))
    for pl in d['plantas']:
        if pl['id'] in aplicados: pl['bounds'] = aplicados[pl['id']]['bounds']; pl['w'], pl['h'] = aplicados[pl['id']]['size']
    json.dump(d, open(pj, 'w', encoding='utf-8'), ensure_ascii=False)
carimbo = time.strftime('%Y-%m-%d-%H-%M-%S')
shutil.copyfile(S + '/ajuste/ajustes.json', S + '/ajuste/ajustes-aplicado-%s.json' % carimbo)
todos = json.load(open(S + '/ajuste/ajustes.json', encoding='utf-8'))
todos['plantas'] = {k: v for k, v in todos['plantas'].items() if k not in aplicados}
json.dump(todos, open(S + '/ajuste/ajustes.json', 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
for bid, x in aplicados.items():
    json.dump(x, open('C:/Users/Usuario/Desktop/landing-page/ferramentas/mapa-lotes/dados/%s-bounds.json' % bid, 'w'))
print('index.html atualizado; %d planta(s) aplicada(s); editor zerado (ajustes arquivados em ajustes-aplicado-%s.json). Dê F5 no editor.' % (len(aplicados), carimbo))
