# -*- coding: utf-8 -*-
# Maria Candida: tira do book as fotos aproveitaveis para a landing.
#
# O book e uma pecas de marketing: cada pagina mistura texto grande com uma foto
# que ocupa a parte de baixo. Aqui so a faixa da FOTO e recortada — o texto do
# book nao entra na landing, que tem a nossa voz e os nossos numeros.
#
# As faixas foram medidas pagina a pagina; onde a foto sobe mais, o corte sobe.
import os, sys
from PIL import Image
sys.stdout.reconfigure(encoding='utf-8')

ORIG = os.environ['TEMP'] + '/mc/BOOK-MariaCandida-PDF-p%d.png'
DEST = 'C:/Users/Usuario/Desktop/landing-page/maria-candida-indaiatuba/images/'
os.makedirs(DEST, exist_ok=True)

# pagina, (cima, baixo), (esquerda, direita), nome, largura final — tudo em %
# A pagina 3 saiu da lista: a unica foto dela esta coberta pelo logo.
# O primeiro corte pegou texto do book e as pessoas posadas do material
# promocional; estes sao mais fundos e cortam a lateral onde elas aparecem.
RECORTES = [
    (4,  (0.77, 1.00), (0.00, 1.00), 'clube.jpg',    1600),   # aerea do clube com as 2 piscinas
    (6,  (0.70, 1.00), (0.00, 1.00), 'portaria.jpg', 1600),   # portico de entrada
    (7,  (0.62, 1.00), (0.00, 1.00), 'aerea.jpg',    1600),   # aerea do entorno
    (8,  (0.73, 1.00), (0.00, 0.57), 'rua.jpg',      1500),   # rua pronta (corta o homem a direita)
    (10, (0.73, 1.00), (0.00, 0.58), 'hero.jpg',     1800),   # avenida (corta a moca a direita)
]

for pag, (a, b), (e1, e2), nome, larg in RECORTES:
    src = ORIG % pag
    if not os.path.exists(src):
        print('  pagina %d nao existe' % pag)
        continue
    im = Image.open(src).convert('RGB')
    W, H = im.size
    rec = im.crop((int(W * e1), int(H * a), int(W * e2), int(H * b)))
    if rec.size[0] > larg:
        f = larg / rec.size[0]
        rec = rec.resize((larg, int(rec.size[1] * f)), Image.LANCZOS)
    rec.save(DEST + nome, quality=86, optimize=True, progressive=True)
    print('  p%-2d -> %-14s %s  %.0f KB' % (pag, nome, rec.size, os.path.getsize(DEST + nome) / 1024))

print('\nem %s' % DEST)
