# -*- coding: utf-8 -*-
# Alphaville: gera o PNG do overlay do mapa a partir da planta.
#
# Rotaciona pela solucao de alphaville-georref2.py (+73,798 graus, residuo maximo
# de 5,9 m nos tres pontos de controle) e deixa TRANSPARENTE o canto que a
# rotacao cria — sem isso o overlay entra como um retangulo branco por cima do
# satelite.
#
# O fundo de satelite que veio dentro da propria planta fica: e a mesma area, e
# recortar o perimetro a mao daria pior resultado que deixar a imagem casar com
# o satelite por baixo.
import os, sys
from PIL import Image
sys.stdout.reconfigure(encoding='utf-8')

ORIG = 'C:/Users/Usuario/Downloads/ALPHAVILLE INDAIATUBA/mapa.jpg'
DEST = 'C:/Users/Usuario/Desktop/landing-page/mapa-lotes-indaiatuba/images/alphaville.png'
ANG = 73.798
MARCA = (254, 0, 254)          # cor que nao existe na planta, para virar alpha

im = Image.open(ORIG).convert('RGB')
print('original: %s' % (im.size,))

rot = im.rotate(ANG, resample=Image.BICUBIC, expand=True, fillcolor=MARCA)
print('rodada %+.3f graus: %s' % (ANG, rot.size))

# tudo que for a cor-marca vira transparente
rgba = rot.convert('RGBA')
px = rgba.load()
W, H = rgba.size
tr = 0
for y in range(H):
    for x in range(W):
        r, g, b, _ = px[x, y]
        if r > 240 and g < 40 and b > 240:
            px[x, y] = (0, 0, 0, 0)
            tr += 1
print('transparente: %d px (%.0f%%)' % (tr, 100 * tr / (W * H)))

# reduz para o overlay nao pesar no celular, e quantiza como os outros
alvo = 2600
if rgba.size[0] > alvo:
    f = alvo / rgba.size[0]
    rgba = rgba.resize((int(rgba.size[0] * f), int(rgba.size[1] * f)), Image.LANCZOS)
    print('reduzida para %s' % (rgba.size,))

q = rgba.quantize(colors=255, method=Image.FASTOCTREE)
q.save(DEST, optimize=True)
print('gravado: %s  (%.0f KB)' % (DEST, os.path.getsize(DEST) / 1024))
