# -*- coding: utf-8 -*-
# Porteira de Ferro: fit render(px) -> UTM a partir do encaixe no mosaico Esri (2 pares) e mascara final do loteamento.
import json, math, os, sys
from PIL import Image, ImageDraw, ImageFilter, ImageChops
Image.MAX_IMAGE_PIXELS = None
sys.stdout.reconfigure(encoding='utf-8')
exec(open('C:/Users/Usuario/Desktop/landing-page/ferramentas/mapa-lotes/utm.py', encoding='utf-8').read())
T = os.environ['TEMP'] + '/mapas/'
PW, PH = 8965, 5664
bb = json.load(open(T + 'esri-pf.json'))
(s_, w_, n_, e_), (SW, SH) = bb['bbox'], bb['size']
pares = json.load(open(T + 'pf/pares.json'))
(r1x, r1y, s1x, s1y), (r2x, r2y, s2x, s2y) = pares[0], pares[1]
k = complex(s2x - s1x, s2y - s1y) / complex(r2x - r1x, r2y - r1y)
print('escala %.5f sat-px/render-px  rot %.2f graus' % (abs(k), math.degrees(math.atan2(k.imag, k.real))))

def render2ll(px, py):
    z = complex(s1x, s1y) + k * (complex(px, py) - complex(r1x, r1y))
    lat = n_ - (z.imag / SH) * (n_ - s_)          # mosaico: bbox exata (Mercator ~ linear nesta escala)
    lon = w_ + (z.real / SW) * (e_ - w_)
    return lat, lon

def afim(pares_xy):
    import itertools
    sx = [[0] * 3 for _ in range(3)]
    for (x, y), _ in pares_xy:
        v = (x, y, 1)
        for i, j in itertools.product(range(3), range(3)): sx[i][j] += v[i] * v[j]
    def resolve(kk):
        rhs = [0, 0, 0]
        for (x, y), ll in pares_xy:
            for i, v in enumerate((x, y, 1)): rhs[i] += v * ll[kk]
        a = [row[:] + [rhs[i]] for i, row in enumerate(sx)]
        for c in range(3):
            p = max(range(c, 3), key=lambda r: abs(a[r][c])); a[c], a[p] = a[p], a[c]
            for r in range(3):
                if r != c:
                    f = a[r][c] / a[c][c]
                    a[r] = [a[r][j] - f * a[c][j] for j in range(4)]
        return [a[i][3] / a[i][i] for i in range(3)]
    return resolve(0), resolve(1)

amostra = []
for px in (0, PW / 2, PW):
    for py in (0, PH / 2, PH):
        lat, lon = render2ll(px, py)
        E, N = ll2utm(lat, lon)
        amostra.append(((px, PH - py), (E, N)))      # pagina com y para CIMA, como o overlay-norte espera
cE, cN = afim(amostra)
erro = max(abs(cE[0]*x + cE[1]*y + cE[2] - EN[0]) + abs(cN[0]*x + cN[1]*y + cN[2] - EN[1]) for (x, y), EN in amostra)
print('fit afim: erro maximo %.2f m' % erro)
json.dump({'E': cE, 'N': cN, 'fonte': 'implantacao da pagina 8 do book (desenho sobre foto aerea) encaixada no mosaico Esri '
           'por 2 pontos: rotatoria da entrada e lago; 1 px do render = %.3f m' % (abs(k) * 0.5497)},
          open(T + 'porteiraferro-fit.json', 'w'), indent=1)

# ---- mascara final: mancha do desenho, buracos fechados, limitada pelo poligono do loteamento ----
POLI = [(8517, 4734), (8235, 4258), (7451, 2913), (6947, 1681), (5266, 224), (3922, 168), (56, 3922), (300, 4700), (8300, 5100)]
m = Image.open(T + 'pf-mascara.png').convert('L').point(lambda v: 255 if v > 127 else 0)
fora = m.copy()
ImageDraw.floodfill(fora, (0, 0), 128)
cheia = fora.point(lambda v: 0 if v == 128 else 255)          # buracos (lago) viram parte de dentro
poli = Image.new('L', m.size, 0)
ImageDraw.Draw(poli).polygon(POLI, fill=255)
final = ImageChops.multiply(cheia, poli).filter(ImageFilter.MinFilter(3))
final.save(T + 'porteiraferro-mascara.png')
print('mascara final', final.getbbox())
