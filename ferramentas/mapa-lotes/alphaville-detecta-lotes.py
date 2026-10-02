# -*- coding: utf-8 -*-
# Alphaville: os lotes da planta dao para ser detectados pela cor?
#
# Se derem, cada lote vira um poligono com centroide, e o centroide vira pino —
# porque o georreferenciamento ja esta resolvido (residuo de 5,9 m).
# O que falta e ASSOCIAR cada mancha ao seu numero de quadra+lote.
#
# Este script so mede a viabilidade: quantas manchas saem, de que tamanho, e se
# o numero bate com a ordem de grandeza dos lotes do empreendimento.
import os, sys
from collections import deque
from PIL import Image
sys.stdout.reconfigure(encoding='utf-8')

ORIG = 'C:/Users/Usuario/Downloads/ALPHAVILLE INDAIATUBA/mapa.jpg'
SAIDA = os.environ['TEMP'] + '/alpha/'
os.makedirs(SAIDA, exist_ok=True)

im = Image.open(ORIG).convert('RGB')
W0, H0 = im.size
# As divisas entre lotes sao linhas de 1-2 px na planta cheia: reduzir a imagem
# apaga a divisa e cola a quadra inteira numa mancha so. A largura entra por
# parametro justamente para medir ate onde da para reduzir.
LARG = int(sys.argv[1]) if len(sys.argv) > 1 else 1600
ESC = LARG / W0
if ESC < 1:
    im = im.resize((int(W0 * ESC), int(H0 * ESC)), Image.LANCZOS)
W, H = im.size
px = im.load()
print('planta reduzida para %dx%d (fator %.4f)' % (W, H, ESC))

# ── amostra de cor: o que e "miolo de lote" na planta? ──────────────
# os lotes aparecem num bege/rosa claro; mata e grama sao verdes; ruas, brancas
amostras = {}
for y in range(0, H, 3):
    for x in range(0, W, 3):
        r, g, b = px[x, y]
        amostras[(r // 16, g // 16, b // 16)] = amostras.get((r // 16, g // 16, b // 16), 0) + 1
top = sorted(amostras.items(), key=lambda kv: -kv[1])[:8]
print('cores mais comuns (r,g,b em passos de 16):')
for (r, g, b), n in top:
    print('   (%3d,%3d,%3d)  %6d px' % (r * 16, g * 16, b * 16, n))


def eh_lote(r, g, b):
    """bege/rosa dos lotes: vermelho alto, verde medio, azul mais baixo."""
    return r > 190 and 150 < g < 215 and b < 200 and r > g > b and (r - b) > 25


marcado = bytearray(W * H)
manchas = []
for y0 in range(H):
    for x0 in range(W):
        i0 = y0 * W + x0
        if marcado[i0]:
            continue
        r, g, b = px[x0, y0]
        if not eh_lote(r, g, b):
            marcado[i0] = 1
            continue
        fila = deque([(x0, y0)])
        marcado[i0] = 1
        pts = []
        while fila:
            x, y = fila.popleft()
            pts.append((x, y))
            for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                nx, ny = x + dx, y + dy
                if 0 <= nx < W and 0 <= ny < H:
                    j = ny * W + nx
                    if not marcado[j]:
                        rr, gg, bb = px[nx, ny]
                        if eh_lote(rr, gg, bb):
                            marcado[j] = 1
                            fila.append((nx, ny))
                        else:
                            marcado[j] = 1
        if len(pts) >= 20:
            cx = sum(p[0] for p in pts) / len(pts)
            cy = sum(p[1] for p in pts) / len(pts)
            manchas.append((len(pts), cx, cy))

manchas.sort(key=lambda m: -m[0])
print('\n%d manchas com 20 px ou mais' % len(manchas))
if manchas:
    tam = sorted(m[0] for m in manchas)
    print('tamanho: menor %d, mediana %d, maior %d px' % (tam[0], tam[len(tam) // 2], tam[-1]))
    # um lote de 540 m2 na escala de 0,338 m/px (na imagem cheia) e, aqui reduzido:
    area_lote_px = 540 / (0.33841 ** 2) * (ESC ** 2)
    print('um lote de 540 m² deveria ter ~%d px nesta reducao' % area_lote_px)
    plausiveis = [m for m in manchas if 0.3 * area_lote_px <= m[0] <= 3 * area_lote_px]
    print('manchas no tamanho de um lote: %d' % len(plausiveis))

# marca as manchas encontradas, para olhar
vis = im.copy()
vp = vis.load()
for n, cx, cy in manchas[:4000]:
    for dx in range(-2, 3):
        for dy in range(-2, 3):
            x, y = int(cx) + dx, int(cy) + dy
            if 0 <= x < W and 0 <= y < H:
                vp[x, y] = (255, 0, 0)
vis.save(SAIDA + 'lotes-detectados.png')
print('\nmapa das manchas: %slotes-detectados.png' % SAIDA)
