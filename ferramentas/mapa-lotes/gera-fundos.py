# -*- coding: utf-8 -*-
# Prepara os arquivos do editor de celular: para cada planta, um recorte do satelite Esri cobrindo a area (com folga)
# e a propria planta reduzida. Tudo vira base64 dentro de um unico JSON, porque a pagina publicada nao pode
# buscar imagem de fora. Saida: ajuste/dados-celular.json
import base64, io, json, math, os, subprocess, sys
from PIL import Image
sys.stdout.reconfigure(encoding='utf-8')
S = os.path.dirname(os.path.abspath(__file__))
R = 'C:/Users/Usuario/Desktop/landing-page/mapa-lotes-indaiatuba/'
T = os.environ['TEMP'] + '/mapas/'
CACHE = T + 'tiles/'; os.makedirs(CACHE, exist_ok=True)
Z = 18
LADO_FUNDO = int(sys.argv[1]) if len(sys.argv) > 1 else 1500     # px no lado maior do satelite
LADO_PLANTA = int(sys.argv[2]) if len(sys.argv) > 2 else 1400
QUALIDADE = int(sys.argv[3]) if len(sys.argv) > 3 else 62
def t2(lat, lon, z=Z):
    x = (lon + 180) / 360 * 2 ** z
    y = (1 - math.log(math.tan(math.radians(lat)) + 1 / math.cos(math.radians(lat))) / math.pi) / 2 * 2 ** z
    return x, y
def px2ll(x, y, z=Z):
    lon = x / 2 ** z * 360 - 180
    lat = math.degrees(math.atan(math.sinh(math.pi * (1 - 2 * y / 2 ** z))))
    return lat, lon
dados = {'plantas': []}
for pl in json.load(open(S + '/ajuste/plantas.json', encoding='utf-8'))['plantas']:
    (la0, lo0), (la1, lo1) = pl['bounds']
    mg_la, mg_lo = (la1 - la0) * 0.62, (lo1 - lo0) * 0.62
    s_, w_, n_, e_ = la0 - mg_la, lo0 - mg_lo, la1 + mg_la, lo1 + mg_lo
    x0, y0 = t2(n_, w_); x1, y1 = t2(s_, e_)
    tx0, ty0, tx1, ty1 = int(x0), int(y0), int(x1), int(y1)
    im = Image.new('RGB', ((tx1 - tx0 + 1) * 256, (ty1 - ty0 + 1) * 256))
    faltou = 0
    for tx in range(tx0, tx1 + 1):
        for ty in range(ty0, ty1 + 1):
            f = CACHE + '%d_%d_%d.jpg' % (Z, tx, ty)
            if not os.path.exists(f):
                subprocess.run(['curl', '-s', '-m', '30', 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/%d/%d/%d' % (Z, ty, tx), '-o', f])
            try: im.paste(Image.open(f).convert('RGB'), ((tx - tx0) * 256, (ty - ty0) * 256))
            except Exception: faltou += 1
    im = im.crop((int((x0 - tx0) * 256), int((y0 - ty0) * 256), int((x1 - tx0) * 256), int((y1 - ty0) * 256)))
    # os bounds reais do recorte (o crop e feito em pixels inteiros)
    bx0 = tx0 + int((x0 - tx0) * 256) / 256; by0 = ty0 + int((y0 - ty0) * 256) / 256
    bx1 = tx0 + int((x1 - tx0) * 256) / 256; by1 = ty0 + int((y1 - ty0) * 256) / 256
    nn, ww = px2ll(bx0, by0); ss, ee = px2ll(bx1, by1)
    im.thumbnail((LADO_FUNDO, LADO_FUNDO), Image.LANCZOS)
    b = io.BytesIO(); im.save(b, 'JPEG', quality=QUALIDADE, optimize=True, progressive=True)
    fundo = base64.b64encode(b.getvalue()).decode()
    pi = Image.open(R + 'images/' + pl['arq']).convert('RGBA'); pw, ph = pi.size
    pi.thumbnail((LADO_PLANTA, LADO_PLANTA), Image.LANCZOS)
    b2 = io.BytesIO(); pi.quantize(colors=16, method=Image.Quantize.FASTOCTREE).save(b2, 'PNG', optimize=True)
    dados['plantas'].append({'id': pl['id'], 'nome': pl['nome'], 'bounds': pl['bounds'], 'w': pi.width, 'h': pi.height,
                             'pinos': pl['pinos'], 'fundo': 'data:image/jpeg;base64,' + fundo,
                             'fundoBounds': [[ss, ww], [nn, ee]],
                             'planta': 'data:image/png;base64,' + base64.b64encode(b2.getvalue()).decode()})
    print('%-14s satelite %4dx%-4d %5d KB | planta %4dx%-4d %5d KB%s' % (pl['id'], im.width, im.height, len(fundo) * 3 // 4 // 1024, pi.width, pi.height, b2.tell() // 1024, '  (%d tiles faltando)' % faltou if faltou else ''))
json.dump(dados, open(S + '/ajuste/dados-celular.json', 'w'))
print('total: %.1f MB em %s' % (os.path.getsize(S + '/ajuste/dados-celular.json') / 1e6, 'ajuste/dados-celular.json'))
