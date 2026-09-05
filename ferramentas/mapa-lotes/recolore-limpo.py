# -*- coding: utf-8 -*-
# Recolore o render "so camadas" para a paleta do mapa: linhas escuras -> ardosia, magenta (limite) -> verde da marca,
# cinza claro (leito/guia) -> cinza claro uniforme; branco fica branco (vira transparente no overlay).
import sys, os
from PIL import Image, ImageChops
sys.stdout.reconfigure(encoding='utf-8')
ent, sai = sys.argv[1], sys.argv[2]
im = Image.open(ent).convert('RGB'); r, g, b = im.split()
mn = ImageChops.darker(ImageChops.darker(r, g), b); mx = ImageChops.lighter(ImageChops.lighter(r, g), b)
sat = ImageChops.subtract(mx, mn, 1, 0)
escuro = mx.point(lambda v: 255 if v < 150 else 0)                                   # linhas pretas/cinza escuro
claro = ImageChops.multiply(mx.point(lambda v: 255 if 150 <= v < 245 else 0), sat.point(lambda v: 255 if v < 30 else 0))   # cinza do leito
mag = ImageChops.multiply(ImageChops.multiply(r.point(lambda v: 255 if v > 150 else 0), b.point(lambda v: 255 if v > 150 else 0)), g.point(lambda v: 255 if v < 140 else 0))
azul = ImageChops.multiply(b.point(lambda v: 255 if v > 150 else 0), r.point(lambda v: 255 if v < 120 else 0))
out = Image.new('RGB', im.size, (255, 255, 255))
out.paste((55, 65, 81) if '--tudo-escuro' in sys.argv else (214, 214, 214), (0, 0), claro)   # --tudo-escuro: plantas com divisas em cinza claro
out.paste((55, 65, 81), (0, 0), escuro)
out.paste((37, 99, 235), (0, 0), azul)
out.paste((46, 125, 91), (0, 0), mag)
out.save(sai); print('recolorido ->', sai)
