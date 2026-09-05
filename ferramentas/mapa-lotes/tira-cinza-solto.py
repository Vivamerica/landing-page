# -*- coding: utf-8 -*-
# Limpa o desenho solido vindo de planta RASTER (San Marino): apaga pedacos de "rua" (cinza) pequenos e soltos
# (texturas da imagem que viraram cinza) e as linhas que ficaram longe de qualquer preenchimento.
# Uso: tira-cinza-solto.py entrada.png saida.png m_por_px rua_min_m2 [lote_min_m2]
import sys, os
from PIL import Image, ImageChops, ImageFilter, ImageDraw
sys.stdout.reconfigure(encoding='utf-8')
T = os.environ['TEMP'] + '/mapas/'
ent, sai, mpp, rua_min = T + sys.argv[1], T + sys.argv[2], float(sys.argv[3]), float(sys.argv[4])
lote_min = float(sys.argv[5]) if len(sys.argv) > 5 else 0
im = Image.open(ent).convert('RGB'); W, H = im.size
r, g, b = im.split()
def cor_msk(c, tol=3):
    return ImageChops.multiply(ImageChops.multiply(r.point(lambda v: 255 if abs(v - c[0]) <= tol else 0), g.point(lambda v: 255 if abs(v - c[1]) <= tol else 0)), b.point(lambda v: 255 if abs(v - c[2]) <= tol else 0))
rua = cor_msk((214, 214, 214)); lote = cor_msk((218, 236, 205)); linha = cor_msk((55, 65, 81))
def tira_pequenos(msk, min_m2, f=4):
    """apaga componentes conexos da mascara com area < min_m2 (componentes achados em 1/f da escala)"""
    peq = msk.resize((W // f, H // f), Image.BOX).point(lambda v: 255 if v > 100 else 0)
    trab = peq.copy(); apaga = Image.new('L', peq.size, 0); n_ap = n_ok = 0
    lim = min_m2 / (mpp * mpp) / (f * f)
    px = trab.load()
    for y in range(peq.height):
        for x in range(peq.width):
            if px[x, y] != 255: continue
            ImageDraw.floodfill(trab, (x, y), 128); reg = trab.point(lambda v: 255 if v == 128 else 0)
            a = reg.histogram()[255]
            if a < lim: apaga.paste(255, (0, 0), reg); n_ap += 1
            else: n_ok += 1
            trab.paste(64, (0, 0), reg)
    print('  componentes: %d apagados, %d mantidos (min %.0f m2)' % (n_ap, n_ok, min_m2))
    return ImageChops.multiply(msk, apaga.resize((W, H), Image.NEAREST).filter(ImageFilter.MaxFilter(f + 1)))
apaga_rua = tira_pequenos(rua, rua_min)
im.paste((255, 255, 255), (0, 0), apaga_rua)
if lote_min:
    apaga_lote = tira_pequenos(lote, lote_min); im.paste((255, 255, 255), (0, 0), apaga_lote)
# linhas longe de qualquer preenchimento restante -> branco
r, g, b = im.split(); fills = ImageChops.subtract(ImageChops.lighter(ImageChops.lighter(r, g), b).point(lambda v: 255 if v < 250 else 0), linha)
perto = fills.resize((W // 4, H // 4), Image.BOX).point(lambda v: 255 if v > 0 else 0).filter(ImageFilter.MaxFilter(5)).resize((W, H), Image.NEAREST)
im.paste((255, 255, 255), (0, 0), ImageChops.subtract(linha, perto))
im.save(sai); print('salvo', sai)
