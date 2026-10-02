# -*- coding: utf-8 -*-
# Alphaville: resolve rotacao, escala e posicao da planta a partir dos pontos de
# controle que o Fabio mediu no Google Maps em 02/10/2026.
#
# P1 arvore da rotatoria da portaria
# P2 centro da piscina azul escura do clube
# P3 quina de quadra  (usado para CONFERIR, nao para ajustar)
#
# Com P1 e P2 saem rotacao e escala; P3 diz se fecha. Se o erro em P3 for grande,
# algum pixel foi lido errado e nada disso serve — por isso ele existe.
import math, sys
sys.stdout.reconfigure(encoding='utf-8')

# (x, y) em pixel na mapa.jpg  <->  (lat, lon) no mundo
P1 = ((1496.0, 2718.0), (-23.129416838097054, -47.1979990725584))
P2 = ((819.0, 852.0), (-23.12980752907095, -47.204644786853756))
P3 = (None, (-23.122523745929524, -47.20418960094312))

LAT0 = -23.126
MLAT = 110574.0                                   # metros por grau de latitude
MLON = 111320.0 * math.cos(math.radians(LAT0))    # metros por grau de longitude aqui


def para_m(c):
    """(lat, lon) -> (leste_m, norte_m) a partir de P2."""
    lat, lon = c
    lat0, lon0 = P2[1]
    return ((lon - lon0) * MLON, (lat - lat0) * MLAT)


def para_geo(x_m, y_m):
    lat0, lon0 = P2[1]
    return (lat0 + y_m / MLAT, lon0 + x_m / MLON)


# ── rotacao e escala por P1-P2 ───────────────────────────────────────
dpx = (P1[0][0] - P2[0][0], -(P1[0][1] - P2[0][1]))   # y da imagem cresce p/ baixo
dm = para_m(P1[1])
ang_px = math.atan2(dpx[1], dpx[0])
ang_m = math.atan2(dm[1], dm[0])
ROT = ang_m - ang_px                                   # radianos, anti-horario
ESC = math.hypot(*dm) / math.hypot(*dpx)               # metros por pixel

print('P1-P2: %.1f px na planta  =  %.1f m no mundo' % (math.hypot(*dpx), math.hypot(*dm)))
print('rotacao: %+.2f graus (anti-horario)' % math.degrees(ROT))
print('escala:  %.5f m/px   (1 px = %.1f cm)' % (ESC, ESC * 100))


def planta_para_mundo(x, y):
    """pixel da planta -> (leste_m, norte_m) a partir de P2."""
    dx, dy = x - P2[0][0], -(y - P2[0][1])
    c, s = math.cos(ROT), math.sin(ROT)
    return ((dx * c - dy * s) * ESC, (dx * s + dy * c) * ESC)


def mundo_para_planta(lat, lon):
    x_m, y_m = para_m((lat, lon))
    c, s = math.cos(-ROT), math.sin(-ROT)
    dx, dy = (x_m * c - y_m * s) / ESC, (x_m * s + y_m * c) / ESC
    return (P2[0][0] + dx, P2[0][1] - dy)


# ── confere com P3 ───────────────────────────────────────────────────
px3 = mundo_para_planta(*P3[1])
print('\nP3 deveria cair em  x=%.0f  y=%.0f  da planta' % px3)
print('   (imagem tem 4252x2953, entao %s)'
      % ('esta dentro' if 0 <= px3[0] <= 4252 and 0 <= px3[1] <= 2953 else 'ESTA FORA — algo errado'))

# ── bounds do retangulo que contem a planta depois de rodada ────────
# a imagem rodada e o retangulo alinhado ao norte que cobre os 4 cantos
cantos = [(0, 0), (4252, 0), (4252, 2953), (0, 2953)]
pts = [planta_para_mundo(x, y) for x, y in cantos]
xs, ys = [p[0] for p in pts], [p[1] for p in pts]
sul, oeste = para_geo(min(xs), min(ys))[0], para_geo(min(xs), min(ys))[1]
norte, leste = para_geo(max(xs), max(ys))[0], para_geo(max(xs), max(ys))[1]
print('\nbounds da planta inteira rodada:')
print('  sul   %.9f   oeste %.9f' % (sul, oeste))
print('  norte %.9f   leste %.9f' % (norte, leste))
print('  tamanho: %.0f m (L-O) x %.0f m (N-S)' % (max(xs) - min(xs), max(ys) - min(ys)))
