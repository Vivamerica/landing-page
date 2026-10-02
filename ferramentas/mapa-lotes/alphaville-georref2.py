# -*- coding: utf-8 -*-
# Alphaville: georreferenciamento da planta por SIMILARIDADE (rotacao + escala +
# translacao) ajustada aos tres pontos de controle, por minimos quadrados.
#
# Com dois pontos a solucao e exata mas sem controle: nao da para saber se um
# pixel foi lido torto. Com tres sobra um grau de liberdade, e o residuo diz o
# tamanho do erro — que e o numero honesto para decidir se o overlay pode subir.
#
# Pontos medidos pelo Fabio no Google Maps em 02/10/2026, com print de cada um:
#   P1 arvore no centro da rotatoria da portaria
#   P2 centro da piscina azul escura (raias) do clube
#   P3 quina da quadra L, junto a faixa da linha de transmissao
import math, sys
sys.stdout.reconfigure(encoding='utf-8')

PONTOS = [
    ('portaria (rotatoria)', (1496.0, 2718.0), (-23.129416838097054, -47.1979990725584)),
    ('clube (piscina)',      (819.0,   852.0), (-23.12980752907095,  -47.204644786853756)),
    ('quina quadra L',       (3155.0,  297.0), (-23.122523745929524, -47.20418960094312)),
]
IMG = (4252, 2953)

LAT0 = -23.126
MLAT = 110574.0
MLON = 111320.0 * math.cos(math.radians(LAT0))
lat_ref, lon_ref = PONTOS[1][2]          # origem local no clube


def para_m(lat, lon):
    return ((lon - lon_ref) * MLON, (lat - lat_ref) * MLAT)


def para_geo(xm, ym):
    return (lat_ref + ym / MLAT, lon_ref + xm / MLON)


# ── minimos quadrados para X = a*x - b*y + tx ; Y = b*x + a*y + ty ──
# (x,y) em pixel com y JA invertido para crescer para cima
P = [(p[1][0], -p[1][1]) for p in PONTOS]
Q = [para_m(*p[2]) for p in PONTOS]
n = len(P)
mx = sum(p[0] for p in P) / n; my = sum(p[1] for p in P) / n
MX = sum(q[0] for q in Q) / n; MY = sum(q[1] for q in Q) / n
Sxx = sum((P[i][0] - mx) * (Q[i][0] - MX) + (P[i][1] - my) * (Q[i][1] - MY) for i in range(n))
Sxy = sum((P[i][0] - mx) * (Q[i][1] - MY) - (P[i][1] - my) * (Q[i][0] - MX) for i in range(n))
Spp = sum((P[i][0] - mx) ** 2 + (P[i][1] - my) ** 2 for i in range(n))
a, b = Sxx / Spp, Sxy / Spp
tx, ty = MX - (a * mx - b * my), MY - (b * mx + a * my)

ESC = math.hypot(a, b)
ROT = math.degrees(math.atan2(b, a))
print('rotacao: %+.3f graus (anti-horario)' % ROT)
print('escala:  %.5f m/px  (1 px = %.1f cm)' % (ESC, ESC * 100))


def planta_para_m(x, y):
    xx, yy = x, -y
    return (a * xx - b * yy + tx, b * xx + a * yy + ty)


print('\nresiduo em cada ponto de controle:')
pior = 0
for nome, px, geo in PONTOS:
    calc = planta_para_m(*px)
    real = para_m(*geo)
    d = math.hypot(calc[0] - real[0], calc[1] - real[1])
    pior = max(pior, d)
    print('   %-22s %5.1f m' % (nome, d))
print('   pior caso: %.1f m  (um lote de 540 m2 tem ~15 m de frente)' % pior)

# ── bounds do retangulo alinhado ao norte que cobre a planta rodada ──
cantos = [(0, 0), (IMG[0], 0), (IMG[0], IMG[1]), (0, IMG[1])]
pts = [planta_para_m(x, y) for x, y in cantos]
xs = [p[0] for p in pts]; ys = [p[1] for p in pts]
sul, oeste = para_geo(min(xs), min(ys))
norte, leste = para_geo(max(xs), max(ys))
print('\nbounds para o overlay (planta inteira, ja rodada):')
print('  [[%.9f,%.9f],[%.9f,%.9f]]' % (sul, oeste, norte, leste))
print('  %.0f m (L-O) x %.0f m (N-S)' % (max(xs) - min(xs), max(ys) - min(ys)))
print('\nangulo para rodar a imagem: %+.3f graus (PIL rotate usa este sinal)' % ROT)
