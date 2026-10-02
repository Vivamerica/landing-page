# -*- coding: utf-8 -*-
# Recorta a implantacao da Reserva Botanica do book, para virar overlay do mapa.
#
# A pagina do book tem moldura verde escura com folhagem e o titulo
# "IMPLANTACAO GERAL"; o desenho fica num cartao claro no meio. O recorte acha o
# cartao pela cor (tudo que e claro) e corta nele, com uma folga pequena.
#
# Depois tira o fundo creme do cartao, deixando so o desenho: no mapa, o que
# estiver fora do loteamento tem de deixar o satelite aparecer.
import os, sys
from PIL import Image
sys.stdout.reconfigure(encoding='utf-8')

ORIG = os.environ['TEMP'] + '/rb/Book Reserva Botânica..-p12.png'
DEST = 'C:/Users/Usuario/Desktop/landing-page/mapa-lotes-indaiatuba/images/reserva-botanica.png'

im = Image.open(ORIG).convert('RGB')
W, H = im.size
print('pagina: %dx%d' % (W, H))
px = im.load()


def claro(r, g, b):
    return r > 215 and g > 215 and b > 200


# ── acha o cartao claro ─────────────────────────────────────────────
passo = 4
x0, y0, x1, y1 = W, H, 0, 0
for y in range(0, H, passo):
    for x in range(0, W, passo):
        if claro(*px[x, y]):
            if x < x0: x0 = x
            if x > x1: x1 = x
            if y < y0: y0 = y
            if y > y1: y1 = y
print('cartao claro: (%d,%d)-(%d,%d)' % (x0, y0, x1, y1))

m = 6
rec = im.crop((max(0, x0 - m), max(0, y0 - m), min(W, x1 + m), min(H, y1 + m)))
print('recorte: %s' % (rec.size,))

# ── fundo creme vira transparente ───────────────────────────────────
rgba = rec.convert('RGBA')
p2 = rgba.load()
w2, h2 = rgba.size
tr = 0
for y in range(h2):
    for x in range(w2):
        r, g, b, _ = p2[x, y]
        # o creme do cartao e claro e quase sem saturacao; o desenho tem cor
        if r > 238 and g > 232 and b > 218 and max(r, g, b) - min(r, g, b) < 26:
            p2[x, y] = (0, 0, 0, 0)
            tr += 1
print('transparente: %d px (%.0f%%)' % (tr, 100 * tr / (w2 * h2)))

# ── corta no cartao de verdade ──────────────────────────────────────
# O titulo "IMPLANTACAO GERAL" tambem e claro e entrou no primeiro recorte. Mas
# so DENTRO do cartao existe fundo creme, que acabou de virar transparente —
# entao a area com transparencia e exatamente o desenho, e o titulo fica fora.
linhas = [y for y in range(h2) if sum(1 for x in range(0, w2, 3) if p2[x, y][3] == 0) > w2 / 3 * 0.22]
colunas = [x for x in range(w2) if sum(1 for y in range(0, h2, 3) if p2[x, y][3] == 0) > h2 / 3 * 0.10]
if linhas and colunas:
    cx0, cx1, cy0, cy1 = colunas[0], colunas[-1], linhas[0], linhas[-1]
    print('cartao do desenho: (%d,%d)-(%d,%d)' % (cx0, cy0, cx1, cy1))
    rgba = rgba.crop((max(0, cx0 - 4), max(0, cy0 - 4), min(w2, cx1 + 5), min(h2, cy1 + 5)))
    print('recorte final: %s' % (rgba.size,))

alvo = 2200
if rgba.size[0] > alvo:
    f = alvo / rgba.size[0]
    rgba = rgba.resize((int(rgba.size[0] * f), int(rgba.size[1] * f)), Image.LANCZOS)
    print('reduzida: %s' % (rgba.size,))

rgba.quantize(colors=255, method=Image.FASTOCTREE).save(DEST, optimize=True)
print('gravado: %s (%.0f KB)' % (DEST, os.path.getsize(DEST) / 1024))
