# -*- coding: utf-8 -*-
# Gera o overlay (norte para cima, recortado ao perimetro magenta, branco transparente) e os bounds lat/lon,
# a partir do render da planta + ajuste afim pagina->UTM. Generico via JSON de configuracao.
import json, os, sys, math, time
from PIL import Image, ImageChops, ImageFilter, ImageDraw
sys.stdout.reconfigure(encoding='utf-8')
exec(open(os.path.dirname(os.path.abspath(__file__)) + '/utm.py', encoding='utf-8').read())
cfg = json.load(open(sys.argv[1], encoding='utf-8'))
T = os.environ['TEMP'] + '/mapas/'
fit = json.load(open(T + cfg['fit'])); ce, cn = fit['E'], fit['N']
PW, PH = cfg['pw'], cfg['ph']
im = Image.open(T + cfg['png']).convert('RGB'); W, H = im.size; k = W / PW
im_m = Image.open(T + cfg['png_mascara']).convert('RGB') if cfg.get('png_mascara') else im   # imagem usada p/ achar o perimetro (magenta)
t0 = time.time()
def page2utm(x, y): return (ce[0]*x + ce[1]*y + ce[2], cn[0]*x + cn[1]*y + cn[2])
def utm2page(E, N):
    a, b, c = ce; d, e, f = cn; det = a*e - b*d
    return ((e*(E-c) - b*(N-f))/det, (-d*(E-c) + a*(N-f))/det)
def page2px(x, y): return (x*k, (PH - y)*k)
def px2page(X, Y): return (X/k, PH - Y/k)
# --- exterior do perimetro magenta ---
r, g, b = im_m.split()
def band(ch, lo, hi): return ch.point(lambda v: 255 if lo <= v <= hi else 0)
mag = ImageChops.multiply(ImageChops.multiply(ImageChops.subtract(r, g, 1, 0).point(lambda v: 255 if v >= 45 else 0), ImageChops.subtract(b, g, 1, 0).point(lambda v: 255 if v >= 45 else 0)), band(r, 140, 255)).filter(ImageFilter.MaxFilter(cfg.get('dilata_mag', 9)))
ext = mag.copy()
for sx, sy in cfg.get('sementes_ext', [[0, 0]]): 
    if ext.getpixel((sx, sy)) == 0: ImageDraw.floodfill(ext, (sx, sy), 128)
interior = ext.point(lambda v: 255 if v != 128 else 0)   # 255 = dentro (ou na linha)
# conferencia: pontos de controle devem estar dentro; se vazou (ou sem perimetro), usa o retangulo dos lotes + margem
vazou = False
for x, y in cfg.get('pontos_dentro', []):
    X, Y = page2px(x, y); ok = interior.getpixel((int(X), int(Y))) == 255; vazou = vazou or not ok
    print('ponto', x, y, 'dentro' if ok else 'FORA (vazou!)')
if vazou or cfg.get('sem_perimetro'):
    if cfg.get('recorte_conteudo'):   # desenho clean: interior = tudo que nao e branco (o proprio desenho ja e a mancha do loteamento)
        mn_ = ImageChops.darker(ImageChops.darker(im.split()[0], im.split()[1]), im.split()[2])
        interior = mn_.point(lambda v: 255 if v < 250 else 0).filter(ImageFilter.MaxFilter(3))
        print('recorte pelo conteudo do desenho clean')
    elif cfg.get('interior_png'):   # mascara pronta (ex.: mascara-cores.py = loteamento inteiro pelas areas coloridas), do tamanho do render
        interior = Image.open(T + cfg['interior_png']).convert('L').point(lambda v: 255 if v > 127 else 0)
        assert interior.size == im.size, 'mascara %s != render %s' % (interior.size, im.size)
        print('recorte pela mascara', cfg['interior_png'])
    elif cfg.get('recorte_lotes_m'):   # desenho solido: interior = vizinhanca (em metros) dos LOTES verdes, so a componente conexa do 1o ponto de controle
        rr, gg, bb_ = im.split(); mpt = math.hypot(ce[0], cn[0]); mpp = mpt / k; d = int(cfg['recorte_lotes_m'] / mpp)
        def cor(c, tol=4): return ImageChops.multiply(ImageChops.multiply(rr.point(lambda v: 255 if abs(v - c[0]) <= tol else 0), gg.point(lambda v: 255 if abs(v - c[1]) <= tol else 0)), bb_.point(lambda v: 255 if abs(v - c[2]) <= tol else 0))
        f4 = 4; peq = cor(tuple(cfg.get('cor_lote', [109, 179, 100]))).resize((W // f4, H // f4), Image.BOX).point(lambda v: 255 if v > 0 else 0).filter(ImageFilter.MaxFilter((d // f4) | 1))
        pts = []   # componentes que contem algum LOTE conhecido (quadras.json) ou os pontos de controle; sem nada: a maior componente
        if cfg.get('quadras') and os.path.exists(T + cfg['quadras']):
            Q = json.load(open(T + cfg['quadras']))['quadras']; pts = [page2px(*p) for d in Q.values() for p in d.values()]
        elif cfg.get('pontos_dentro'): pts = [page2px(*p) for p in cfg['pontos_dentro']]
        if pts:
            n_comp = 0
            for X, Y in pts:
                sx, sy = int(X) // f4, int(Y) // f4
                if 0 <= sx < peq.width and 0 <= sy < peq.height and peq.getpixel((sx, sy)) == 255: ImageDraw.floodfill(peq, (sx, sy), 128); n_comp += 1
            peq = peq.point(lambda v: 255 if v == 128 else 0); print('  componentes com lotes conhecidos:', n_comp, 'de', len(pts), 'pontos')
            if cfg.get('so_maior_bloco'):   # descarta pedacos soltos longe do corpo principal
                trab = peq.copy(); melhor = (0, None); nb = 0
                for y in range(0, peq.height, 3):
                    for x in range(0, peq.width, 3):
                        if trab.getpixel((x, y)) != 255: continue
                        ImageDraw.floodfill(trab, (x, y), 128); reg = trab.point(lambda v: 255 if v == 128 else 0); ar = reg.histogram()[255]; nb += 1
                        if ar > melhor[0]: melhor = (ar, reg)
                        trab.paste(64, (0, 0), reg)
                if melhor[1] is not None: peq = melhor[1]; print('  fica so o bloco principal (de %d pedacos)' % nb)
        else:
            trab = peq.copy(); melhor = (0, None)
            for y in range(0, peq.height, 4):
                for x in range(0, peq.width, 4):
                    if trab.getpixel((x, y)) != 255: continue
                    ImageDraw.floodfill(trab, (x, y), 128); reg = trab.point(lambda v: 255 if v == 128 else 0); ar = reg.histogram()[255]
                    if ar > melhor[0]: melhor = (ar, reg)
                    trab.paste(64, (0, 0), reg)
            peq = melhor[1]
        interior = peq.resize((W, H), Image.NEAREST)
        print('recorte pela vizinhanca dos lotes (%.0f m = %d px), componente do ponto de controle' % (cfg['recorte_lotes_m'], d))
    elif cfg.get('recorte_auto'):   # interior = tudo que nao e branco no render (desenho solido ja recortado)
        mn_ = ImageChops.darker(ImageChops.darker(*im.split()[:2]), im.split()[2]); interior = mn_.point(lambda v: 255 if v < 250 else 0).filter(ImageFilter.MaxFilter(5))
        print('recorte automatico pelo conteudo do render')
    else:
        Q = json.load(open(T + cfg['quadras']))['quadras']; pts = [p for d in Q.values() for p in d.values()]
        mg = cfg.get('margem_pt', 60)
        x0, x1 = min(p[0] for p in pts) - mg, max(p[0] for p in pts) + mg; y0, y1 = min(p[1] for p in pts) - mg, max(p[1] for p in pts) + mg
        interior = Image.new('L', im.size, 0); ImageDraw.Draw(interior).rectangle([page2px(x0, y1), page2px(x1, y0)], fill=255)
        print('usando retangulo dos lotes: x %.0f..%.0f y %.0f..%.0f pt' % (x0, x1, y0, y1))
# fica so a regiao conexa que contem o 1o ponto de controle (descarta marcas magenta soltas)
if cfg.get('pontos_dentro') and not (vazou or cfg.get('sem_perimetro')):
    X, Y = page2px(*cfg['pontos_dentro'][0]); reg = interior.copy(); ImageDraw.floodfill(reg, (int(X), int(Y)), 200)
    interior = reg.point(lambda v: 255 if v == 200 else 0).filter(ImageFilter.MaxFilter(cfg.get('dilata_mag', 9)))
bb = interior.getbbox(); print('bbox interior px', bb, 'em %.1fs' % (time.time() - t0))
# --- grade de saida em lat/lon ---
cantos = [px2page(bb[0], bb[1]), px2page(bb[2], bb[1]), px2page(bb[0], bb[3]), px2page(bb[2], bb[3])]
lls = [utm2ll(*page2utm(*c)) for c in cantos]
lat0, lat1 = min(l[0] for l in lls), max(l[0] for l in lls); lon0, lon1 = min(l[1] for l in lls), max(l[1] for l in lls)
if cfg.get('bounds_fixos'):   # mantem exatamente o enquadramento ja publicado (o ajuste feito pelo Fabio continua valendo)
    (lat0, lon0), (lat1, lon1) = cfg['bounds_fixos']; print('bounds fixos: mesmo enquadramento de antes')
mlat = 111320.0; mlon = 111320.0 * math.cos(math.radians((lat0 + lat1)/2))
res = cfg.get('res_m', 0.35)
OW = int(round((lon1 - lon0) * mlon / res)); OH = int(round((lat1 - lat0) * mlat / res))
print('saida %dx%d px (%.2f m/px), %.0f x %.0f m' % (OW, OH, res, (lon1-lon0)*mlon, (lat1-lat0)*mlat))
def out2src(u, v):
    lat = lat1 - v * (lat1 - lat0) / OH; lon = lon0 + u * (lon1 - lon0) / OW
    return page2px(*utm2page(*ll2utm(lat, lon)))
# ajuste afim (minimos quadrados) saida -> fonte, com grade 5x5 de pontos
pts = [(u, v) for u in [0, OW/4, OW/2, 3*OW/4, OW] for v in [0, OH/4, OH/2, 3*OH/4, OH]]
def lsq(vals):
    # resolve [u v 1] * [p q r]^T = val
    import itertools
    A = [[u, v, 1.0] for u, v in pts]; n = 3
    ATA = [[sum(A[i][a]*A[i][b] for i in range(len(A))) for b in range(n)] for a in range(n)]
    ATb = [sum(A[i][a]*vals[i] for i in range(len(A))) for a in range(n)]
    # gauss
    M = [ATA[i] + [ATb[i]] for i in range(n)]
    for i in range(n):
        p = max(range(i, n), key=lambda r: abs(M[r][i])); M[i], M[p] = M[p], M[i]
        for r in range(n):
            if r != i:
                f = M[r][i] / M[i][i]; M[r] = [M[r][c] - f*M[i][c] for c in range(n+1)]
    return [M[i][n] / M[i][i] for i in range(n)]
src = [out2src(u, v) for u, v in pts]
A = lsq([s[0] for s in src]); B = lsq([s[1] for s in src])
err = max(math.hypot(A[0]*u + A[1]*v + A[2] - s[0], B[0]*u + B[1]*v + B[2] - s[1]) for (u, v), s in zip(pts, src))
print('afim saida->fonte: erro max %.2f px' % err)
coef = (A[0], A[1], A[2], B[0], B[1], B[2])
sai = im.transform((OW, OH), Image.AFFINE, coef, resample=Image.BILINEAR, fillcolor=(255, 255, 255))
msk = interior.transform((OW, OH), Image.AFFINE, coef, resample=Image.NEAREST, fillcolor=0)
# alpha: fora do perimetro = 0; quase branco = 0
minc = ImageChops.darker(ImageChops.darker(*sai.split()[:2]), sai.split()[2])
alpha = ImageChops.multiply(msk, minc.point(lambda v: 0 if v > cfg.get('branco', 228) else 255))
sai.putalpha(alpha)
q = sai.quantize(colors=cfg.get('cores', 48), method=Image.Quantize.FASTOCTREE)
out = cfg['saida']; q.save(out, 'PNG', optimize=True)
print('overlay', out, os.path.getsize(out) // 1024, 'KB', 'em %.1fs' % (time.time() - t0))
json.dump({'bounds': [[lat0, lon0], [lat1, lon1]], 'size': [OW, OH]}, open(T + cfg['saida_bounds'], 'w'))
print('bounds [[%.9f,%.9f],[%.9f,%.9f]]' % (lat0, lon0, lat1, lon1))
# preview reduzido sobre fundo cinza
pv = Image.new('RGB', (OW, OH), (120, 140, 120)); pv.paste(sai, (0, 0), sai); pv.thumbnail((1400, 1400)); pv.save(T + cfg['saida_bounds'].replace('.json', '-preview.jpg'), 'JPEG', quality=80)
