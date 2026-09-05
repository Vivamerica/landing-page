# -*- coding: utf-8 -*-
# Extrai do index.html os dados que o editor precisa: cada planta (id, nome, imagem, bounds, tamanho em px) e os pinos dela.
import json, os, re, sys
from PIL import Image
sys.stdout.reconfigure(encoding='utf-8')
R = 'C:/Users/Usuario/Desktop/landing-page/mapa-lotes-indaiatuba/'
S = os.path.dirname(os.path.abspath(__file__))
s = open(R + 'index.html', encoding='utf-8').read()
plantas = []
for m in re.finditer(r"\{ id:'([^']+)',\s*nome:'([^']*)'[^\n]*?overlay:\{ url:'images/([^']+)', bounds:\[\[([-\d.]+),([-\d.]+)\],\[([-\d.]+),([-\d.]+)\]\] \}", s):
    bid, nome, arq, la0, lo0, la1, lo1 = m.group(1), m.group(2), m.group(3), *[float(m.group(i)) for i in range(4, 8)]
    w, h = Image.open(R + 'images/' + arq).size
    pinos = [[float(a), float(b)] for a, b in re.findall(r"^ *\{ b:'%s'.*?ll:\[([-\d.]+),([-\d.]+)\]" % bid, s, re.M)]
    plantas.append({'id': bid, 'nome': nome, 'arq': arq, 'bounds': [[la0, lo0], [la1, lo1]], 'w': w, 'h': h, 'pinos': pinos})
    print('%-14s %-34s %5dx%-5d  %3d pinos' % (bid, nome, w, h, len(pinos)))
json.dump({'plantas': plantas}, open(S + '/plantas.json', 'w'), indent=1)
print('->', S + '/plantas.json', len(plantas), 'plantas')
