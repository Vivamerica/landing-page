# -*- coding: utf-8 -*-
# Alphaville: prepara a planta para virar overlay do mapa.
#
# A planta recebida (mapa.jpg) esta na orientacao de PROJETO: a linha ferrea, que
# no mundo corre NW-SE, aparece horizontal no topo. O overlay do Leaflet e um
# retangulo alinhado ao norte e nao gira, entao a imagem tem de ser rotacionada
# antes — se nao, o desenho entra torto por mais que os bounds estejam certos.
#
# O angulo veio da sobreposicao que o Fabio montou sobre o satelite: o limite
# norte do loteamento desce da esquerda para a direita, ~16,6 graus abaixo da
# horizontal. Rotacionar a planta nesse angulo no sentido horario poe o norte
# para cima.
#
# Uso: alphaville-prepara-planta.py [angulo]
import os, sys
from PIL import Image
sys.stdout.reconfigure(encoding='utf-8')

ORIG = 'C:/Users/Usuario/Downloads/ALPHAVILLE INDAIATUBA/mapa.jpg'
SAIDA = os.environ['TEMP'] + '/alpha/'
os.makedirs(SAIDA, exist_ok=True)
ANG = float(sys.argv[1]) if len(sys.argv) > 1 else 16.6

im = Image.open(ORIG)
print('original: %s %s' % (im.size, im.mode))
if im.mode != 'RGB':
    im = im.convert('RGB')          # o arquivo vem em CMYK

# ── recorte do perimetro do loteamento, com folga ────────────────────
# medido sobre a imagem: o desenho ocupa da portaria (embaixo) a linha ferrea
# (topo) e do clube (esquerda) a linha de transmissao (direita)
L, T, Rr, B = 350, 150, 3400, 2900
im = im.crop((L, T, min(Rr, im.size[0]), min(B, im.size[1])))
print('recorte:  %s' % (im.size,))

# ── rotacao: horario = angulo negativo no PIL ───────────────────────
rot = im.rotate(-ANG, resample=Image.BICUBIC, expand=True, fillcolor=(255, 255, 255))
print('rodada %.1f graus (horario): %s' % (ANG, rot.size))

rot.save(SAIDA + 'planta-rodada.png')
# versao reduzida so para conferir a olho
rot.copy().resize((rot.size[0] // 3, rot.size[1] // 3)).save(SAIDA + 'planta-preview.png')
print('salvo em %splanta-rodada.png (e -preview.png)' % SAIDA)
