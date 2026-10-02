# -*- coding: utf-8 -*-
# Baixa um recorte do Esri World Imagery para uma bbox e salva em PNG.
# Serve para localizar um empreendimento antes de georreferenciar a planta.
#
# Uso: satelite-recorte.py <sul> <oeste> <norte> <leste> <saida.png> [zoom]
import math, os, sys, urllib.request
from PIL import Image
sys.stdout.reconfigure(encoding='utf-8')

s, w, n, e = (float(x) for x in sys.argv[1:5])
saida = sys.argv[5]
z = int(sys.argv[6]) if len(sys.argv) > 6 else 17
CACHE = os.environ['TEMP'] + '/mapas/tiles/'
os.makedirs(CACHE, exist_ok=True)


def t2(lat, lon):
    x = (lon + 180) / 360 * 2 ** z
    y = (1 - math.log(math.tan(math.radians(lat)) + 1 / math.cos(math.radians(lat))) / math.pi) / 2 * 2 ** z
    return x, y


x0, y0 = t2(n, w)
x1, y1 = t2(s, e)
tx0, ty0, tx1, ty1 = int(x0), int(y0), int(x1), int(y1)
im = Image.new('RGB', ((tx1 - tx0 + 1) * 256, (ty1 - ty0 + 1) * 256))
baixados = 0
for tx in range(tx0, tx1 + 1):
    for ty in range(ty0, ty1 + 1):
        f = CACHE + '%d_%d_%d.jpg' % (z, tx, ty)
        if not os.path.exists(f):
            url = ('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/%d/%d/%d'
                   % (z, ty, tx))
            req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
            with urllib.request.urlopen(req, timeout=30) as r, open(f, 'wb') as o:
                o.write(r.read())
            baixados += 1
        im.paste(Image.open(f), ((tx - tx0) * 256, (ty - ty0) * 256))
# recorta exatamente a bbox pedida
cx0, cy0 = int((x0 - tx0) * 256), int((y0 - ty0) * 256)
cx1, cy1 = int((x1 - tx0) * 256), int((y1 - ty0) * 256)
im.crop((cx0, cy0, cx1, cy1)).save(saida)
print('%s  %dx%d  zoom %d  (%d tiles novos)' % (saida, cx1 - cx0, cy1 - cy0, z, baixados))
print('bbox: sul %.6f oeste %.6f norte %.6f leste %.6f' % (s, w, n, e))
