# -*- coding: utf-8 -*-
# Vila Fahl: tabela (residencial 1.825/m2 + comercial 2.000/m2, 96x) + posicoes conferidas + fit da grade -> linhas do mapa
import json, os, sys, shutil
sys.stdout.reconfigure(encoding='utf-8')
exec(open('C:/Users/Usuario/Desktop/landing-page/ferramentas/mapa-lotes/utm.py', encoding='utf-8').read())
T = os.environ['TEMP'] + '/mapas/'
fit = json.load(open(T + 'vilafahl-fit.json')); ce, cn = fit['E'], fit['N']
Q = json.load(open(T + 'vilafahl-quadras.json'))['quadras']
L = json.load(open(T + 'vilafahl/vilafahl-tabela.json', encoding='utf-8'))
b = json.load(open(T + 'vilafahl-cheio-bounds.json'))['bounds']
linhas = []
for x in sorted(L, key=lambda x: (x['q'], int(x['l']))):
    px, py = Q[x['q']][x['l']]
    lat, lon = utm2ll(ce[0]*px + ce[1]*py + ce[2], cn[0]*px + cn[1]*py + cn[2])
    p96 = x['outras'][-1]
    assert abs(x['sinal'] / x['vista'] - 0.10) < 0.001
    linhas.append("{ b:'vilafahl', q:'%s', l:'%s', m2:%.2f, tipo:'%s', pm2:%d, vista:%.2f, entrada:%.2f, parcela:%.2f, nx:96, ep:10, ll:[%.6f,%.6f] },"
                  % (x['q'], x['l'], x['m2'], x['tipo'], round(x['pm2']), x['vista'], x['sinal'], p96, lat, lon))
open(T + 'vilafahl-lotes.js', 'w', encoding='utf-8', newline='').write('\n'.join(linhas) + '\n')
n = len(linhas); nr = sum(1 for x in L if x['tipo'] == 'RESIDENCIAL'); nc = n - nr
bairro = ("{ id:'vilafahl', nome:'Residencial Vila Fahl', sub:'loteamento · %d lotes da Fase 1 (%d residenciais e %d comerciais) · a prazo em até 96x', "
          "landing:'/vila-fahl-indaiatuba/', cond:'sinal de 10%% e saldo em até 96 parcelas, tabela da Fase 1 recebida em 17/09/2026; à vista com 5%% de desconto', "
          "overlay:{ url:'images/vilafahl.png', bounds:[[%.9f,%.9f],[%.9f,%.9f]] } },") % (n, nr, nc, b[0][0], b[0][1], b[1][0], b[1][1])
open(T + 'vilafahl-bairro.txt', 'w', encoding='utf-8', newline='').write(bairro + '\n')
shutil.copy(T + 'vilafahl-cheio-overlay.png', 'C:/Users/Usuario/Desktop/landing-page/mapa-lotes-indaiatuba/images/vilafahl.png')
print(n, 'lotes', nr, nc); print(bairro); print(linhas[0]); print(linhas[-1])
