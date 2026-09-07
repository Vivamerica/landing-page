# -*- coding: utf-8 -*-
# Mascara do loteamento INTEIRO a partir do render original (plantas sem divisa magenta):
# a mancha nasce do que tem cor (areas verdes, APP, lotes mistos, represa), opcionalmente das ruas cinza e das
# LINHAS PRETAS do desenho (plantas so' de traco, como o Araras); a erosao (se pedida) some com linhas finas de fora
# (curvas de nivel, tracejados, carimbo); o fechamento cobre as quadras brancas; o preenchimento fecha os buracos;
# um retangulo folgado em volta dos lotes conhecidos (quadras.json + margem_pt) limita o que pode entrar; fica so' o
# maior bloco, engordado ate a linha do perimetro. Saida: PNG 'L' do tamanho do render (255 = dentro) para o
# `interior_png` do overlay-norte.py.
# Uso: python mascara-cores.py cfg.json
#   cfg: png, saida, [check], sat_min 60, cinza [185,240] ou null, escuro_max null (ex.: 120 = linhas pretas entram),
#        erode_px 7 (0 = sem erosao, obrigatorio quando as linhas pretas entram), fecha_m 25, abre_m 0,
#        m_por_px 0.238, engorda_px 9, fator 2, [quadras + margem_pt + pw + ph = retangulo limite em pt da folha]
import json, os, sys, time
from PIL import Image, ImageChops, ImageFilter, ImageDraw
sys.stdout.reconfigure(encoding='utf-8')
cfg = json.load(open(sys.argv[1], encoding='utf-8'))
T = os.environ['TEMP'] + '/mapas/'
t0 = time.time()
im = Image.open(T + cfg['png']).convert('RGB'); W, H = im.size
f = cfg.get('fator', 2)
peq = im.resize((W // f, H // f), Image.BOX)
r, g, b = peq.split()
mx = ImageChops.lighter(ImageChops.lighter(r, g), b); mn = ImageChops.darker(ImageChops.darker(r, g), b)
sat = ImageChops.subtract(mx, mn)
m = sat.point(lambda v: 255 if v >= cfg.get('sat_min', 60) else 0)
if cfg.get('sem_azul'):   # represa / curso d'agua (azul puro) ficam de fora: o loteamento termina na margem
    azul = ImageChops.subtract(b, ImageChops.lighter(r, g)).point(lambda v: 255 if v >= 40 else 0)
    m = ImageChops.subtract(m, azul)
if cfg.get('cinza'):
    lo, hi = cfg['cinza']
    m = ImageChops.lighter(m, ImageChops.multiply(sat.point(lambda v: 255 if v < 25 else 0), mx.point(lambda v: 255 if lo <= v <= hi else 0)))
if cfg.get('escuro_max') is not None:
    esc = cfg['escuro_max']; m = ImageChops.lighter(m, mn.point(lambda v: 255 if v <= esc else 0))
mpp = cfg.get('m_por_px', 0.238) * f
if cfg.get('erode_px', 7) > 0:
    e = cfg['erode_px'] // f | 1
    m = m.filter(ImageFilter.MinFilter(e)).filter(ImageFilter.MaxFilter(e))          # some o que e fino (linhas, texto)
k = int(cfg.get('fecha_m', 25) / mpp) | 1
m = m.filter(ImageFilter.MaxFilter(k)).filter(ImageFilter.MinFilter(k))              # fechamento: cobre as quadras brancas
if cfg.get('abre_m'):
    ka = int(cfg['abre_m'] / mpp) | 1
    m = m.filter(ImageFilter.MinFilter(ka)).filter(ImageFilter.MaxFilter(ka))        # abertura: derruba fios estreitos
if cfg.get('quadras') and cfg.get('margem_pt') is not None:                          # retangulo limite (pt da folha -> px)
    Q = json.load(open(T + cfg['quadras']))['quadras']; pts = [p for d in Q.values() for p in d.values()]
    mg = cfg['margem_pt']; kx = W / cfg['pw'] / f
    x0, x1 = min(p[0] for p in pts) - mg, max(p[0] for p in pts) + mg; y0, y1 = min(p[1] for p in pts) - mg, max(p[1] for p in pts) + mg
    ret = Image.new('L', m.size, 0); ImageDraw.Draw(ret).rectangle([x0 * kx, (cfg['ph'] - y1) * kx, x1 * kx, (cfg['ph'] - y0) * kx], fill=255)
    m = ImageChops.multiply(m, ret); print('retangulo limite: x %.0f..%.0f y %.0f..%.0f pt' % (x0, x1, y0, y1))
# preenche buracos: o que nao se alcanca a partir da borda e interior
fora = m.copy(); ImageDraw.Draw(fora).rectangle([0, 0, fora.width - 1, fora.height - 1], outline=0)
for p in [(0, 0), (fora.width - 1, 0), (0, fora.height - 1), (fora.width - 1, fora.height - 1)]:
    if fora.getpixel(p) == 0: ImageDraw.floodfill(fora, p, 128)
m = fora.point(lambda v: 0 if v == 128 else 255)
# maior bloco
trab = m.copy(); melhor = (0, None); nb = 0
for y in range(0, trab.height, 4):
    for x in range(0, trab.width, 4):
        if trab.getpixel((x, y)) != 255: continue
        ImageDraw.floodfill(trab, (x, y), 128); reg = trab.point(lambda v: 255 if v == 128 else 0); ar = reg.histogram()[255]; nb += 1
        if ar > melhor[0]: melhor = (ar, reg)
        trab.paste(64, (0, 0), reg)
m = melhor[1]; bb = m.getbbox(); print('blocos: %d; maior com %.0f x %.0f m de caixa' % (nb, (bb[2] - bb[0]) * mpp, (bb[3] - bb[1]) * mpp))
m = m.filter(ImageFilter.MaxFilter(cfg.get('engorda_px', 9) // f | 1))
m = m.resize((W, H), Image.NEAREST)
m.save(T + cfg['saida']); bb = m.getbbox()
print('mascara %s bbox %s (%.0f x %.0f m) em %.1fs' % (cfg['saida'], bb, (bb[2] - bb[0]) * cfg.get('m_por_px', 0.238), (bb[3] - bb[1]) * cfg.get('m_por_px', 0.238), time.time() - t0))
if cfg.get('check'):
    pv = im.copy(); pv.paste((255, 0, 255), (0, 0), m.point(lambda v: 90 if v else 0)); pv.thumbnail((1600, 1600)); pv.save(T + cfg['check'], 'JPEG', quality=80)
