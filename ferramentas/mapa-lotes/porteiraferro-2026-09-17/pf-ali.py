# alinha o render ao mosaico Esri por semelhanca (2 pares) e compoe para conferencia
import sys, os, math, json
from PIL import Image
Image.MAX_IMAGE_PIXELS = None
S = os.environ['TEMP'] + '/mapas/'
pares = json.load(open(S + 'pf/pares.json'))   # [[rx,ry,sx,sy], ...]
(r1x, r1y, s1x, s1y), (r2x, r2y, s2x, s2y) = pares[0], pares[1]
dr = complex(r2x - r1x, r2y - r1y); ds = complex(s2x - s1x, s2y - s1y)
k = ds / dr   # escala + rotacao
print('escala %.5f sat-px/render-px  (%.3f m/px no render)  rotacao %.2f graus' % (abs(k), abs(k) * 0.5497, math.degrees(math.atan2(k.imag, k.real))))
ren = Image.open(S + 'pf/p8_0_Im0.jpg').convert('RGBA')
sat = Image.open(S + 'esri-pf.jpg').convert('RGBA')
# afim PIL: saida(x,y) -> fonte; inverso de z -> k*(z - r1) + s1
inv = 1 / k
a, b = inv.real, -inv.imag
c0 = complex(r1x, r1y) - inv * complex(s1x, s1y)
m = (a, b, c0.real, -b, a, c0.imag)
out = ren.transform(sat.size, Image.AFFINE, m, Image.BICUBIC)
comp = Image.blend(sat, out, 0.65)
comp.convert('RGB').save(S + 'pf/conf.jpg', quality=88)
out.save(S + 'pf/ren-alinhado.png')
print('conf.jpg', comp.size)
