# -*- coding: utf-8 -*-
# Georreferencia uma planta de ESCALA CONHECIDA por ROTACAO + TRANSLACAO: casa a mascara das ruas da planta
# (anel em volta da uniao dos lotes, de <id>-blocos.png; ruas = dilatacao dos blocos menos os blocos) com as vias do OSM
# rasterizadas em UTM; blocos em cima de via OSM penalizam. Busca grossa (res 2 m) em rumo x deslocamento; refino (res 1 m).
# cfg: id, png, pw, ph (quadro EXIBIDO), m_por_pt (1:1000 -> 0.35278), blocos, osm (json com geometria), centro [lat, lon],
#      busca_m, theta (lista) | theta_faixa [ini, fim, passo] | theta_passo, anel_m, penal, largura_via_m, osm_tipos
import json, os, sys, math, time
from PIL import Image, ImageChops, ImageFilter, ImageDraw
sys.stdout.reconfigure(encoding='utf-8')
exec(open(os.path.dirname(os.path.abspath(__file__)) + '/utm.py', encoding='utf-8').read())
cfg = json.load(open(sys.argv[1], encoding='utf-8'))
T = os.environ['TEMP'] + '/mapas/'
t0 = time.time()
bl = Image.open(T + cfg['blocos']).convert('L'); W, H = bl.size
PW, PH = cfg['pw'], cfg['ph']; k = W / PW; mpt = cfg['m_por_pt'] * cfg.get('fator_escala', 1.0); mpp = mpt / k     # m por pixel do render
R = int(cfg.get('anel_m', 6) / mpp)
if cfg.get('ruas_png'):   # mascara direta das ruas (do preenche-solido): mais fiel que o anel em volta dos lotes
    anel = Image.open(T + cfg['ruas_png']).convert('L').point(lambda v: 255 if v > 128 else 0)
    bl = ImageChops.invert(anel).point(lambda v: 255 if v > 128 else 0)   # "blocos" = tudo que nao e rua (penaliza via OSM em cima)
    f8 = 8; peq = anel.resize((W // f8, H // f8), Image.BOX).point(lambda v: 255 if v > 30 else 0)   # dilatacao grande feita em 1/8 (rapido)
    perto = peq.filter(ImageFilter.MaxFilter(int(60 / mpp / f8) | 1)).resize((W, H), Image.NEAREST)
    bl = ImageChops.multiply(bl, perto)   # so perto das ruas (dentro do loteamento)
else:
    anel = ImageChops.subtract(bl.filter(ImageFilter.MaxFilter(2 * R + 1)), bl)
x0, y0, x1, y1 = cfg.get('recorte_px') or bl.getbbox()
mg_px = int(cfg.get('margem_recorte_m', 25) / mpp); x0, y0, x1, y1 = max(0, x0 - mg_px), max(0, y0 - mg_px), min(W, x1 + mg_px), min(H, y1 + mg_px)
cx_px, cy_px = (x0 + x1) / 2, (y0 + y1) / 2
def mascaras(res):
    mw, mh = int((x1 - x0) * mpp / res), int((y1 - y0) * mpp / res)
    a = anel.crop((x0, y0, x1, y1)).resize((mw, mh), Image.BOX).point(lambda v: 255 if v > 60 else 0)
    b = bl.crop((x0, y0, x1, y1)).resize((mw, mh), Image.BOX).point(lambda v: 255 if v > 140 else 0)
    return a, b
# raster OSM em UTM em volta do chute (na resolucao pedida)
Ec, Nc = ll2utm(*cfg['centro']); mg = cfg.get('busca_m', 400)
tipos = set(cfg.get('osm_tipos', ['residential', 'living_street', 'primary', 'secondary', 'tertiary', 'unclassified', 'primary_link', 'secondary_link', 'tertiary_link']))
vias = []
for el in json.load(open(T + cfg['osm'], encoding='utf-8'))['elements']:
    tg = el.get('tags', {}); gg = el.get('geometry')
    if gg and tg.get('highway') in tipos: vias.append([ll2utm(p['lat'], p['lon']) for p in gg])
def raster_osm(res, meia):
    oE0, oN1 = Ec - meia, Nc + meia; n = int(2 * meia / res)
    osm = Image.new('L', (n, n), 0); dr = ImageDraw.Draw(osm)
    for pts in vias: dr.line([((E - oE0) / res, (oN1 - N) / res) for E, N in pts], fill=255, width=max(1, int(cfg.get('largura_via_m', 8) / res)))
    return osm, oE0, oN1
def busca(res, thetas, faixa, passo, centro=(0, 0)):
    a0, b0 = mascaras(res); meia = max(a0.size) * res * 0.75 + faixa + max(abs(centro[0]), abs(centro[1]))
    osm, oE0, oN1 = raster_osm(res, meia); ow, oh = osm.size
    melhor = (-10**9, 0, 0, 0); por_theta = {}
    for th in thetas:
        a = a0.rotate(th, expand=True, resample=Image.NEAREST); b = b0.rotate(th, expand=True, resample=Image.NEAREST)
        mt = (-10**9, 0, 0)
        for dE in range(int(centro[0] - faixa), int(centro[0] + faixa) + 1, passo):
            for dN in range(int(centro[1] - faixa), int(centro[1] + faixa) + 1, passo):
                ox = int(round((Ec + dE - oE0) / res - a.width / 2)); oy = int(round((oN1 - (Nc + dN)) / res - a.height / 2))
                if ox < 0 or oy < 0 or ox + a.width > ow or oy + a.height > oh: continue
                rec = osm.crop((ox, oy, ox + a.width, oy + a.height))
                s = ImageChops.multiply(a, rec).histogram()[255] - cfg.get('penal', 3) * ImageChops.multiply(b, rec).histogram()[255]
                if s > mt[0]: mt = (s, dE, dN)
        por_theta[th] = mt
        if mt[0] > melhor[0]: melhor = (mt[0], th, mt[1], mt[2])
    return melhor, por_theta
def frange(a, b, s):
    x = a
    while x <= b + 1e-9: yield round(x, 3); x += s
if 'theta' in cfg: thetas = list(cfg['theta'])
elif 'theta_faixa' in cfg: thetas = list(frange(*cfg['theta_faixa']))
else: thetas = list(range(0, 360, cfg.get('theta_passo', 3)))
a2, b2 = mascaras(2.0); print('mascara a 2 m/px', a2.size, 'anel %.1f%% blocos %.1f%%' % (100 * a2.histogram()[255] / (a2.width * a2.height), 100 * b2.histogram()[255] / (b2.width * b2.height)), '| rumos:', len(thetas), '| vias OSM:', len(vias))
melhor, por_theta = busca(2.0, thetas, mg, cfg.get('passo_grosso', 10))
s, th, dE, dN = melhor; print('grosso (2 m): theta=%.1f dE=%d dN=%d score=%d (%.1fs)' % (th, dE, dN, s, time.time() - t0))
# ambiguidade: melhor rumo "longe" (>= 15 graus) e melhor deslocamento longe no mesmo rumo
longe = max(((v[0], t) for t, v in por_theta.items() if abs(((t - th + 180) % 360) - 180) >= 15), default=(-10**9, None))
print('  melhor rumo longe: theta=%s score=%d -> razao %.2f' % (longe[1], longe[0], longe[0] / max(1, s)))
top = sorted(((v[0], t, v[1], v[2]) for t, v in por_theta.items()), reverse=True)[:6]; print('  top rumos:', [(round(x[1], 1), x[0], x[2], x[3]) for x in top])
# refino a 1 m/px: theta +-3 (passo 0.5), deslocamento +-12 m (passo 1)
fino, _ = busca(1.0, [th + d * 0.5 for d in range(-6, 7)], 12, 1, centro=(dE, dN))
s, th, dE, dN = fino; print('fino (1 m): theta=%.1f dE=%d dN=%d score=%d (%.1fs)' % (th, dE, dN, s, time.time() - t0))
# afim pagina(pt, y p/ cima) -> UTM: E = Ec' + s(x' cos t + y' sin t); N = Nc' + s(-x' sin t + y' cos t)
t = math.radians(th); xc_pt, yc_pt = cx_px / k, PH - cy_px / k
a_ = mpt * math.cos(t); b_ = mpt * math.sin(t); d_ = -mpt * math.sin(t); e_ = mpt * math.cos(t)
c_ = Ec + dE - a_ * xc_pt - b_ * yc_pt; f_ = Nc + dN - d_ * xc_pt - e_ * yc_pt
fit = {'E': [a_, b_, c_], 'N': [d_, e_, f_], 'theta': th, 'dE': dE, 'dN': dN, 'score': s}
json.dump(fit, open(T + cfg['id'] + '-fit.json', 'w')); print('fit salvo:', {kk: (round(v, 6) if isinstance(v, float) else v) for kk, v in fit.items() if kk in ('theta', 'dE', 'dN', 'score')})
# conferencia a 1 m/px
a1, b1 = mascaras(1.0); meia = max(a1.size) * 0.75 + 150; osm, oE0, oN1 = raster_osm(1.0, meia)
a = a1.rotate(th, expand=True, resample=Image.NEAREST); b = b1.rotate(th, expand=True, resample=Image.NEAREST)
ox = int(round((Ec + dE - oE0) - a.width / 2)); oy = int(round((oN1 - (Nc + dN)) - a.height / 2))
chk = Image.merge('RGB', (osm, osm, osm)).point(lambda v: v // 2)
chk.paste(Image.new('RGB', a.size, (255, 0, 0)), (ox, oy), a); chk.paste(Image.new('RGB', b.size, (0, 110, 255)), (ox, oy), b)
chk.save(T + cfg['id'] + '-rotacao.png'); print('check:', cfg['id'] + '-rotacao.png', 'em %.1fs' % (time.time() - t0))
