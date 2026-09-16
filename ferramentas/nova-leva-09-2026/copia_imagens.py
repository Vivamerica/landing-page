# -*- coding: utf-8 -*-
"""Copia imagens escolhidas para <slug>/images, com no máximo 1600 px e 260 KB cada.

Uso: python copia_imagens.py <slug> <pasta_origem> destino1.jpg=origem1.jpg destino2.jpg=origem2.jpg ...
Imprime largura x altura de cada arquivo final (vai no config da galeria).
"""
import os, sys
from PIL import Image
sys.stdout.reconfigure(encoding='utf-8')
RAIZ = 'C:/Users/Usuario/Desktop/landing-page/'
slug, origem = sys.argv[1], sys.argv[2].rstrip('/\\') + '/'
dest = RAIZ + slug + '/images/'
os.makedirs(dest, exist_ok=True)
for par in sys.argv[3:]:
    nome, arq = par.split('=', 1)
    im = Image.open(origem + arq).convert('RGB')
    if max(im.size) > 1600:
        im.thumbnail((1600, 1600), Image.LANCZOS)
    for q in (82, 78, 74, 70, 66, 62, 58):
        im.save(dest + nome, 'JPEG', quality=q, optimize=True, progressive=True)
        if os.path.getsize(dest + nome) <= 260 * 1024:
            break
    print('%-26s %4dx%-4d %3d KB (q%d)' % (nome, im.size[0], im.size[1], os.path.getsize(dest + nome) // 1024, q))
