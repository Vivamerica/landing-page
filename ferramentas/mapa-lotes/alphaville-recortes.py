# -*- coding: utf-8 -*-
# Recorta e amplia regioes da planta do Alphaville para achar, em pixel, os tres
# pontos de controle que o Fabio mediu no Google Maps:
#   1. a arvore da rotatoria da portaria
#   2. o centro da piscina azul escura do clube
#   3. a quina de uma quadra
# Uso: alphaville-recortes.py <x> <y> <lado> <saida.png>
import os, sys
from PIL import Image
sys.stdout.reconfigure(encoding='utf-8')

ORIG = 'C:/Users/Usuario/Downloads/ALPHAVILLE INDAIATUBA/mapa.jpg'
SAIDA = os.environ['TEMP'] + '/alpha/'
os.makedirs(SAIDA, exist_ok=True)

im = Image.open(ORIG).convert('RGB')
W, H = im.size
x, y, lado, nome = int(sys.argv[1]), int(sys.argv[2]), int(sys.argv[3]), sys.argv[4]
cx0, cy0 = max(0, x - lado // 2), max(0, y - lado // 2)
cx1, cy1 = min(W, cx0 + lado), min(H, cy0 + lado)
rec = im.crop((cx0, cy0, cx1, cy1))
# amplia para dar para apontar o pixel
f = max(1, 700 // max(1, rec.size[0]))
rec = rec.resize((rec.size[0] * f, rec.size[1] * f), Image.NEAREST)
rec.save(SAIDA + nome)
print('%s  recorte (%d,%d)-(%d,%d) ampliado %dx -> %s' % (nome, cx0, cy0, cx1, cy1, f, rec.size))
print('   para converter: x_orig = %d + x_recorte/%d ; y_orig = %d + y_recorte/%d' % (cx0, f, cy0, f))
