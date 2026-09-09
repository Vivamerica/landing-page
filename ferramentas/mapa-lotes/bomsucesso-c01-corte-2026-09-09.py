# -*- coding: utf-8 -*-
# Ordem: bomsucesso-c01-corte -> bomsucesso-c01ab -> bomsucesso-c01-pinos, na MESMA pasta (trocam bs-mask*.txt).
# Corte do lote C01 (Bom Sucesso) em C01-A (1.085,85 m2, lado de cima na folha) e C01-B (500,00 m2, lado de baixo).
# Acha o angulo da reta cujo cordao dentro do lote mede 32,47 m (cota da loteadora) separando 500 m2 embaixo.
import sys, math, json
from collections import deque
from PIL import Image
sys.stdout.reconfigure(encoding='utf-8')
T = 'C:/Users/Usuario/AppData/Local/Temp/mapas/'
im = Image.open(T + '5000/337-jardim-bom-sucesso_-p1.png').convert('RGB'); W, H = im.size; px = im.load()
MPP = 0.35279746253529193 / (5000/4749.04)
def escuro(c): return max(c) <= 150
seed = (605, 1995); vis = set([seed]); q = deque([seed])
while q:
    x, y = q.popleft()
    for dx, dy in ((1,0),(-1,0),(0,1),(0,-1)):
        n = (x+dx, y+dy)
        if n in vis or not (0 <= n[0] < W and 0 <= n[1] < H) or escuro(px[n]): continue
        vis.add(n); q.append(n)
x0 = min(p[0] for p in vis); x1 = max(p[0] for p in vis); y0 = min(p[1] for p in vis); y1 = max(p[1] for p in vis)
# fecha buracos (texto/circulos/curvas de nivel dentro do lote): tudo que nao escapa pela borda do bbox folgado
bb = (x0-2, y0-2, x1+2, y1+2)
fora = set(); q = deque()
for x in range(bb[0], bb[2]+1):
    for y in (bb[1], bb[3]):
        if (x, y) not in vis: fora.add((x, y)); q.append((x, y))
for y in range(bb[1], bb[3]+1):
    for x in (bb[0], bb[2]):
        if (x, y) not in vis: fora.add((x, y)); q.append((x, y))
while q:
    x, y = q.popleft()
    for dx, dy in ((1,0),(-1,0),(0,1),(0,-1)):
        n = (x+dx, y+dy)
        if n in fora or n in vis or not (bb[0] <= n[0] <= bb[2] and bb[1] <= n[1] <= bb[3]): continue
        fora.add(n); q.append(n)
mask = set()
for x in range(bb[0], bb[2]+1):
    for y in range(bb[1], bb[3]+1):
        if (x, y) not in fora: mask.add((x, y))
A = len(mask) * MPP * MPP
print('lote fechado: %d px = %.1f m2 (cota da planta 1.585,85)' % (len(mask), A))
FRAC = 500.0 / 1585.85
pts = list(mask)
def avalia(ang):
    a = math.radians(ang)
    # u cresce para "baixo" na folha (=leste no terreno); reta do corte tem inclinacao ang
    us = sorted((y * math.cos(a) - x * math.sin(a), x, y) for x, y in pts)
    k = int(round(len(us) * (1 - FRAC)))
    u0 = us[k][0]
    faixa = [(x, y) for u, x, y in us if abs(u - u0) <= 0.75]
    if len(faixa) < 5: return None
    # comprimento do cordao = extensao ao longo da direcao da reta
    vs = [x * math.cos(a) + y * math.sin(a) for x, y in faixa]
    return u0, (max(vs) - min(vs)) * MPP, len(faixa)
print('ang   corda(m)  (alvo 32,47)')
melhor = None
for i in range(-70, 71):
    ang = i * 0.5
    r = avalia(ang)
    if not r: continue
    u0, corda, n = r
    d = abs(corda - 32.47)
    if melhor is None or d < melhor[0]: melhor = (d, ang, u0, corda)
    if i % 8 == 0: print('%6.1f %8.2f' % (ang, corda))
d, ang, u0, corda = melhor
print('\nMELHOR: ang=%.1f  corda=%.2f m  u0=%.2f' % (ang, corda, u0))
a = math.radians(ang)
baixo = [(x, y) for x, y in pts if y*math.cos(a) - x*math.sin(a) > u0]
cima  = [(x, y) for x, y in pts if y*math.cos(a) - x*math.sin(a) <= u0]
print('area cima (A) = %.1f m2 | area baixo (B) = %.1f m2' % (len(cima)*MPP*MPP, len(baixo)*MPP*MPP))
def cent(s): return (sum(p[0] for p in s)/len(s), sum(p[1] for p in s)/len(s))
cA, cB = cent(cima), cent(baixo)
print('centroide A (render px) %.1f %.1f | B %.1f %.1f' % (cA[0], cA[1], cB[0], cB[1]))
json.dump({'ang': ang, 'u0': u0, 'corda': corda, 'cA': cA, 'cB': cB, 'bb': bb,
           'areaA': len(cima)*MPP*MPP, 'areaB': len(baixo)*MPP*MPP,
           'mask': sorted('%d,%d' % p for p in mask)[:0]}, open('bs-corte.json', 'w'), indent=1)
# guarda a mascara para o desenho
with open('bs-mask.txt', 'w') as f:
    f.write('\n'.join('%d %d' % p for p in sorted(mask)))
