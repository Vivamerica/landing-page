# -*- coding: utf-8 -*-
# 1) tira do ajustes.json as 4 entradas que sao re-gravacao do estado ja aplicado (cantos identicos aos arquivados);
# 2) desloca os bounds do Araras "cheio v3" (georreferencia do render) pela translacao ja aplicada no site (t),
#    para o arquivo novo cair no mesmo quadro da imagem que o Fabio viu no editor (bounds0 = bounds aplicados).
import json, os, glob, shutil, math
S = os.path.dirname(os.path.abspath(__file__)) + '/ajuste/'
T = os.environ['TEMP'] + '/mapas/'
aj = json.load(open(S + 'ajustes.json', encoding='utf-8'))
shutil.copyfile(S + 'ajustes.json', S + 'ajustes-antes-limpeza-2026-09-07b.json')
apl = {}
for f in sorted(glob.glob(S + 'ajustes-aplicado-*.json')): apl.update(json.load(open(f, encoding='utf-8'))['plantas'])
for k in list(aj['plantas']):
    v = aj['plantas'][k]; prev = apl.get(k)
    if prev and all(abs(prev['cantos'][q][i] - v['cantos'][q][i]) < 1e-8 for q in ('tl', 'tr', 'br', 'bl') for i in (0, 1)):
        del aj['plantas'][k]; print('descartado (igual ao ja aplicado):', k)
json.dump(aj, open(S + 'ajustes.json', 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
print('ficam:', list(aj['plantas']))
# translacao aplicada antes no Araras
p = apl['araras']; c = [sum(p['cantos'][q][0] for q in ('tl', 'tr', 'br', 'bl')) / 4, sum(p['cantos'][q][1] for q in ('tl', 'tr', 'br', 'bl')) / 4]
dlat, dlon = c[0] - p['lat0'], c[1] - p['lon0']
assert abs(p['giro']) < 1e-3 and abs(p['largura'] - 1) < 1e-3, 'a aplicacao anterior nao era so translacao'
b = json.load(open(T + 'araras-cheio-bounds.json'))
b['bounds'] = [[b['bounds'][0][0] + dlat, b['bounds'][0][1] + dlon], [b['bounds'][1][0] + dlat, b['bounds'][1][1] + dlon]]
json.dump(b, open(T + 'araras-cheio-bounds.json', 'w'))
print('bounds do cheio v3 deslocados por t = %.1f m N, %.1f m E -> %s' % (dlat * 111320, dlon * 111320 * math.cos(math.radians(c[0])), b['bounds']))
