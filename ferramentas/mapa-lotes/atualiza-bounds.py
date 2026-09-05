# -*- coding: utf-8 -*-
# Troca os bounds do overlay de cada bairro na linha BAIRROS do index.html pelos de <id>-solido-bounds.json.
import json, os, re, sys
sys.stdout.reconfigure(encoding='utf-8')
T = os.environ['TEMP'] + '/mapas/'
P = 'C:/Users/Usuario/Desktop/landing-page/mapa-lotes-indaiatuba/index.html'
s = open(P, encoding='utf-8', newline='').read(); assert '\r' not in s
for bid in sys.argv[1].split(','):
    b = json.load(open(T + bid + '-solido-bounds.json'))['bounds']
    novo = 'bounds:[[%.9f,%.9f],[%.9f,%.9f]]' % (b[0][0], b[0][1], b[1][0], b[1][1])
    m = re.search(r"^ *\{ id:'%s'.*$" % bid, s, re.M); assert m, bid
    linha = m.group(0); nova = re.sub(r"bounds:\[\[[^\]]*\],\[[^\]]*\]\]", novo, linha); assert nova != linha or novo in linha, bid
    s = s.replace(linha, nova); print(bid, '->', novo)
open(P, 'w', encoding='utf-8', newline='').write(s); print('index.html atualizado')
