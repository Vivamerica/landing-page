# -*- coding: utf-8 -*-
# Ordem: bomsucesso-c01-corte -> bomsucesso-c01ab -> bomsucesso-c01-pinos, na MESMA pasta (trocam bs-mask*.txt).
# Pinos de C01-A e C01-B: ponto mais interno de cada parte (maior distancia a borda) -> lat/lon pelo ajuste pagina->UTM.
import sys, json, math
sys.stdout.reconfigure(encoding='utf-8')
exec(open('C:/Users/Usuario/Desktop/landing-page/ferramentas/mapa-lotes/utm.py', encoding='utf-8').read())
T = 'C:/Users/Usuario/AppData/Local/Temp/mapas/'
fit = json.load(open(T + 'bomsucesso-fit.json')); ce, cn = fit['E'], fit['N']
S = 5000/4749.04; PH = 3003.99
def px2ll(X, Y):
    x, y = X/S, PH - Y/S
    E = ce[0]*x + ce[1]*y + ce[2]; N = cn[0]*x + cn[1]*y + cn[2]
    return utm2ll(E, N)
def polo(reg):
    dist = {}
    for p in reg:
        x, y = p
        r = 1
        while all((x+dx, y+dy) in reg for dx in range(-r, r+1) for dy in (-r, r)) and all((x+dx, y+dy) in reg for dy in range(-r, r+1) for dx in (-r, r)):
            r += 1
            if r > 60: break
        dist[p] = r
    m = max(dist.values())
    cand = [p for p, v in dist.items() if v == m]
    cx = sum(p[0] for p in cand)/len(cand); cy = sum(p[1] for p in cand)/len(cand)
    melhor = min(cand, key=lambda p: (p[0]-cx)**2 + (p[1]-cy)**2)
    return melhor, m
for nome, arq in (('C01-A', 'bs-mask-A.txt'), ('C01-B', 'bs-mask-B.txt')):
    reg = set(tuple(int(v) for v in l.split()) for l in open(arq))
    p, r = polo(reg)
    lat, lon = px2ll(p[0]+0.5, p[1]+0.5)
    print('%s: px %s (folga %d px = %.1f m) -> ll [%.6f,%.6f]' % (nome, p, r, r*0.33509, lat, lon))
