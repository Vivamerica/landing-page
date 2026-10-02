# -*- coding: utf-8 -*-
# Alphaville: detecta os MARCADORES de lote da planta (o circulo claro com o
# numero dentro), em vez de tentar separar os poligonos dos lotes.
#
# Por que mudar de alvo: as divisas entre lotes sao linhas de 1-2 px e o flood
# fill cola quadras inteiras numa mancha so (testado: 905 manchas, mediana de
# 46 px onde um lote teria 4.700). Ja o marcador e um disco claro, isolado,
# cercado de bege — isso separa bem.
#
# Cada marcador detectado e a posicao de UM lote. A numeracao vem depois, pela
# ordem ao longo da fila (os lotes de uma quadra sao sequenciais).
#
# Uso: alphaville-marcadores.py [x0 y0 x1 y1]   (recorte opcional, para testar)
import os, sys, json
from collections import deque
from PIL import Image
sys.stdout.reconfigure(encoding='utf-8')

ORIG = 'C:/Users/Usuario/Downloads/ALPHAVILLE INDAIATUBA/mapa.jpg'
SAIDA = os.environ['TEMP'] + '/alpha/'
os.makedirs(SAIDA, exist_ok=True)

im = Image.open(ORIG).convert('RGB')
if len(sys.argv) > 4:
    X0, Y0, X1, Y1 = (int(v) for v in sys.argv[1:5])
    im = im.crop((X0, Y0, X1, Y1))
else:
    X0 = Y0 = 0
W, H = im.size
px = im.load()
print('area: %dx%d a partir de (%d,%d)' % (W, H, X0, Y0))


def escuro(r, g, b):
    """tinta do numero: cinza bem escuro, sem cor dominante"""
    return r < 110 and g < 110 and b < 110 and max(r, g, b) - min(r, g, b) < 45


def bege(r, g, b):
    return r > 185 and 145 < g < 215 and b < 200 and r > g > b


# ── agrupa os pixels de tinta em digitos ────────────────────────────
marc = bytearray(W * H)
digitos = []
for y0 in range(H):
    base = y0 * W
    for x0 in range(W):
        i0 = base + x0
        if marc[i0]:
            continue
        marc[i0] = 1
        r, g, b = px[x0, y0]
        if not escuro(r, g, b):
            continue
        fila = deque([(x0, y0)])
        pts = []
        while fila:
            x, y = fila.popleft()
            pts.append((x, y))
            for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1), (1, 1), (-1, -1), (1, -1), (-1, 1)):
                nx, ny = x + dx, y + dy
                if 0 <= nx < W and 0 <= ny < H and not marc[ny * W + nx]:
                    marc[ny * W + nx] = 1
                    rr, gg, bb = px[nx, ny]
                    if escuro(rr, gg, bb):
                        fila.append((nx, ny))
        n = len(pts)
        if 12 <= n <= 400:                      # um digito; fora disso e rua, arvore ou texto grande
            xs = [p[0] for p in pts]; ys = [p[1] for p in pts]
            larg, alt = max(xs) - min(xs) + 1, max(ys) - min(ys) + 1
            if 3 <= larg <= 30 and 6 <= alt <= 32 and alt >= larg * 0.7:
                digitos.append((sum(xs) / n, sum(ys) / n, larg, alt, n))
print('%d digitos candidatos' % len(digitos))

# ── junta digitos vizinhos no mesmo marcador ────────────────────────
digitos.sort(key=lambda d: (d[1], d[0]))
usado = [False] * len(digitos)
marcadores = []
for i, d in enumerate(digitos):
    if usado[i]:
        continue
    grupo = [d]
    usado[i] = True
    for j in range(i + 1, len(digitos)):
        if usado[j]:
            continue
        e = digitos[j]
        if abs(e[1] - d[1]) <= 9 and 0 < (e[0] - d[0]) <= 26:
            grupo.append(e)
            usado[j] = True
    cx = sum(g[0] for g in grupo) / len(grupo)
    cy = sum(g[1] for g in grupo) / len(grupo)
    # so vale se estiver cercado de bege (dentro de um lote)
    viz = 0
    for dx, dy in ((-34, 0), (34, 0), (0, -34), (0, 34), (-24, -24), (24, 24), (-24, 24), (24, -24)):
        x, y = int(cx + dx), int(cy + dy)
        if 0 <= x < W and 0 <= y < H and bege(*px[x, y]):
            viz += 1
    if viz >= 3:
        marcadores.append({'x': cx + X0, 'y': cy + Y0, 'digitos': len(grupo), 'bege': viz})

print('%d marcadores de lote' % len(marcadores))
json.dump(marcadores, open(SAIDA + 'marcadores.json', 'w'), indent=0)

vis = im.copy(); vp = vis.load()
for m in marcadores:
    for dx in range(-4, 5):
        for dy in range(-4, 5):
            x, y = int(m['x'] - X0) + dx, int(m['y'] - Y0) + dy
            if 0 <= x < W and 0 <= y < H and (dx * dx + dy * dy) <= 16:
                vp[x, y] = (255, 0, 0)
vis.save(SAIDA + 'marcadores.png')
print('imagem: %smarcadores.png' % SAIDA)
