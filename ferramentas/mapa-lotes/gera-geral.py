# -*- coding: utf-8 -*-
# Fundo geral: um recorte do satelite cobrindo TODOS os loteamentos com folga (Indaiatuba em volta), em resolucao baixa,
# para dar contexto quando o mapa esta afastado. O recorte nitido de cada loteamento continua por cima.
# Acrescenta 'geral' e 'geralBounds' ao ajuste/dados-celular.json.
import base64, io, json, math, os, subprocess, sys
from PIL import Image
sys.stdout.reconfigure(encoding='utf-8')
S = os.path.dirname(os.path.abspath(__file__))
CACHE = os.environ['TEMP'] + '/mapas/tiles/'
Z = int(sys.argv[1]) if len(sys.argv) > 1 else 16
LADO = int(sys.argv[2]) if len(sys.argv) > 2 else 2600
QUAL = int(sys.argv[3]) if len(sys.argv) > 3 else 58
MARGEM_KM = float(sys.argv[4]) if len(sys.argv) > 4 else 2.5
def t2(lat, lon, z=Z):
    x = (lon + 180) / 360 * 2 ** z
    y = (1 - math.log(math.tan(math.radians(lat)) + 1 / math.cos(math.radians(lat))) / math.pi) / 2 * 2 ** z
    return x, y
def px2ll(x, y, z=Z):
    return math.degrees(math.atan(math.sinh(math.pi * (1 - 2 * y / 2 ** z)))), x / 2 ** z * 360 - 180
d = json.load(open(S + '/ajuste/dados-celular.json', encoding='utf-8'))
las = [b for p in d['plantas'] for b in (p['bounds'][0][0], p['bounds'][1][0])]
los = [b for p in d['plantas'] for b in (p['bounds'][0][1], p['bounds'][1][1])]
mla = MARGEM_KM * 1000 / 111320; mlo = MARGEM_KM * 1000 / (111320 * math.cos(math.radians(sum(las) / len(las))))
s_, w_, n_, e_ = min(las) - mla, min(los) - mlo, max(las) + mla, max(los) + mlo
x0, y0 = t2(n_, w_); x1, y1 = t2(s_, e_)
tx0, ty0, tx1, ty1 = int(x0), int(y0), int(x1), int(y1)
nt = (tx1 - tx0 + 1) * (ty1 - ty0 + 1)
print('zoom %d, %d tiles, area %.1f x %.1f km' % (Z, nt, (e_ - w_) * 111320 * math.cos(math.radians(s_)) / 1000, (n_ - s_) * 111.32))
im = Image.new('RGB', ((tx1 - tx0 + 1) * 256, (ty1 - ty0 + 1) * 256)); faltou = 0
for i, tx in enumerate(range(tx0, tx1 + 1)):
    for ty in range(ty0, ty1 + 1):
        f = CACHE + '%d_%d_%d.jpg' % (Z, tx, ty)
        if not os.path.exists(f):
            subprocess.run(['curl', '-s', '-m', '30', 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/%d/%d/%d' % (Z, ty, tx), '-o', f])
        try: im.paste(Image.open(f).convert('RGB'), ((tx - tx0) * 256, (ty - ty0) * 256))
        except Exception: faltou += 1
    if i % 5 == 0: print('  coluna %d de %d' % (i + 1, tx1 - tx0 + 1), flush=True)
im = im.crop((int((x0 - tx0) * 256), int((y0 - ty0) * 256), int((x1 - tx0) * 256), int((y1 - ty0) * 256)))
bx0 = tx0 + int((x0 - tx0) * 256) / 256; by0 = ty0 + int((y0 - ty0) * 256) / 256
bx1 = tx0 + int((x1 - tx0) * 256) / 256; by1 = ty0 + int((y1 - ty0) * 256) / 256
nn, ww = px2ll(bx0, by0); ss, ee = px2ll(bx1, by1)
im.thumbnail((LADO, LADO), Image.LANCZOS)
b = io.BytesIO(); im.save(b, 'JPEG', quality=QUAL, optimize=True, progressive=True)
d['geral'] = 'data:image/jpeg;base64,' + base64.b64encode(b.getvalue()).decode()
d['geralBounds'] = [[ss, ww], [nn, ee]]
json.dump(d, open(S + '/ajuste/dados-celular.json', 'w'))
print('fundo geral %dx%d, %d KB%s | total do arquivo: %.1f MB' % (im.width, im.height, b.tell() // 1024, '  (%d tiles faltando)' % faltou if faltou else '', os.path.getsize(S + '/ajuste/dados-celular.json') / 1e6))
