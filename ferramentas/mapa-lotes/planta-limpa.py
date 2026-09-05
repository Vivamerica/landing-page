# -*- coding: utf-8 -*-
# "Planta limpa": a partir do render da planta + textos posicionados, gera uma versao padronizada, sem escritas nem cores:
# so o traçado (divisas de lotes, guias das ruas, rotatorias) em cinza escuro com halo claro, fundo branco (vira transparente
# no overlay-norte.py). Uso: planta-limpa.py cfg.json  (cfg: texto, png, pw, ph, rotate, modo ('escuro' | 'escuro_ou_azul'),
#   escuro_max, min_max, fator_fs, saida (png), espessura (px), halo (px), apaga_extra: lista de [x0,y0,x1,y1] em pt p/ apagar)
import json, os, sys, math, time
from PIL import Image, ImageChops, ImageFilter, ImageDraw
sys.stdout.reconfigure(encoding='utf-8')
cfg = json.load(open(sys.argv[1], encoding='utf-8'))
T = os.environ['TEMP'] + '/mapas/'
it = json.load(open(T + cfg['texto'], encoding='utf-8'))
im = Image.open(T + cfg['png']).convert('RGB'); W, H = im.size; PW, PH = cfg['pw'], cfg['ph']; k = W / PW
t0 = time.time()
r, g, b = im.split()
mn = ImageChops.darker(ImageChops.darker(r, g), b); mx = ImageChops.lighter(ImageChops.lighter(r, g), b)
def band(ch, lo, hi): return ch.point(lambda v: 255 if lo <= v <= hi else 0)
if cfg.get('modo', 'escuro') == 'escuro_ou_azul':
    linhas = mn.point(lambda v: 255 if v < cfg.get('min_max', 130) else 0)
else:
    cinzento = ImageChops.subtract(mx, mn, 1, 0).point(lambda v: 255 if v < cfg.get('sat_max', 60) else 0)
    linhas = ImageChops.multiply(cinzento, band(mx, 0, cfg.get('escuro_max', 170)))
    if cfg.get('inclui_azul'):
        azul = ImageChops.multiply(ImageChops.subtract(b, r, 1, 0).point(lambda v: 255 if v >= 60 else 0), band(r, 0, 120))
        linhas = ImageChops.lighter(linhas, azul)
print('linhas em %.1fs' % (time.time() - t0))
def px(x, y): return (int(round(x * k)), int(round((PH - y) * k)))
d = ImageDraw.Draw(linhas)
# apaga todos os textos (retangulo orientado pela direcao do texto) + margem
fator = cfg.get('fator_fs', 0.24); rot = cfg.get('rotate', 0); mg = cfg.get('margem_texto_pt', 2.0); nap = 0
for i in it:
    t = i['t']
    if not t.strip(): continue
    a, b_ = (i.get('tmab') or [1, 0])[:2]
    if rot == 270: a, b_ = -b_, a
    elif rot == 90: a, b_ = b_, -a
    elif rot == 180: a, b_ = -a, -b_
    nrm = math.hypot(a, b_) or 1; dx, dy = a / nrm, b_ / nrm; pxp, pyp = -dy, dx
    h = i['fs'] * fator; w = cfg.get('largura_glifo', 0.62) * h * max(1, len(t))
    o = (i['x'] - dx * mg - pxp * mg * 0.6, i['y'] - dy * mg - pyp * mg * 0.6); ww, hh = w + 2 * mg, h + 1.2 * mg
    pts = [o, (o[0] + dx * ww, o[1] + dy * ww), (o[0] + dx * ww + pxp * hh, o[1] + dy * ww + pyp * hh), (o[0] + pxp * hh, o[1] + pyp * hh)]
    d.polygon([px(*q) for q in pts], fill=0); nap += 1
for circ in cfg.get('circulos', []):   # circulos dos numeros de lote / letras de quadra (desenho, nao texto)
    rr = circ['raio']
    for i in it:
        if abs(i['fs'] - circ['fs']) < 0.5 and i['t'].strip():
            X, Y = px(i['x'] + circ.get('dx', 0), i['y'] + circ.get('dy', 0)); d.ellipse([X - rr, Y - rr, X + rr, Y + rr], fill=0)
for x0, y0, x1, y1 in cfg.get('apaga_extra', []):
    d.rectangle([px(x0, y1), px(x1, y0)], fill=0)
print('textos apagados:', nap)
# limpeza: some pontinhos (abertura 3) e engrossa o traço
e = cfg.get('espessura', 3)
linhas = linhas.filter(ImageFilter.MinFilter(3)).filter(ImageFilter.MaxFilter(3)) if cfg.get('abre', True) else linhas
traco = linhas.filter(ImageFilter.MaxFilter(e)) if e > 1 else linhas
halo = traco.filter(ImageFilter.MaxFilter(cfg.get('halo', 7)))
cor_t = tuple(cfg.get('cor_traco', [70, 70, 70])); cor_h = tuple(cfg.get('cor_halo', [214, 214, 214]))
out = Image.new('RGB', im.size, (255, 255, 255))
out.paste(Image.new('RGB', im.size, cor_h), (0, 0), halo)
out.paste(Image.new('RGB', im.size, cor_t), (0, 0), traco)
out.save(T + cfg['saida']); print('planta limpa:', cfg['saida'], 'em %.1fs' % (time.time() - t0))
