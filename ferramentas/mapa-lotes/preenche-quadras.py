# -*- coding: utf-8 -*-
# Desenho CLEAN (modelo do Perola aprovado pelo Fabio em 05/09/2026): quadras verdes com divisas finas escuras,
# TODO o resto do loteamento cinza (rua), fundo branco (transparente no mapa).
#
# Metodo (inverso do anterior, que tentava adivinhar o que era rua e deixava rua verde / buraco branco):
#   1. mascara de linhas do render "so linhas" (camadas do CAD), engrossada para fechar falhas;
#   2. flood fill -> celulas fechadas; LOTE = celula pequena com forma de lote (nao alongada);
#      BLOCO = celula grande compacta (area verde, institucional, clube) - tambem fica verde;
#   3. QUADRA = fechamento de (LOTE + BLOCO) a 'quadra_m': junta os lotes do mesmo quarteirao (sem atravessar a rua);
#   4. PERIMETRO = fechamento a 'perimetro_m' + preenchimento de buracos: a mancha do loteamento inteiro;
#   5. RUA = PERIMETRO - QUADRA  ->  nao existe rua verde nem buraco branco por construcao;
#   6. divisas = borda das celulas de lote (contorno continuo, sem os riscos soltos do CAD).
# Uso: preenche-quadras.py cfg.json
#   cfg: png, saida, m_por_px, [modo:'cores'], [escuro_max], [tira_blobs], [lote_max_m2 2500], [fecha_m 0.6],
#        [quadra_m 9], [perimetro_m 45], [larg_linha_m 0.5], [cor_lote/cor_rua/cor_linha], [saida_ruas], [debug]
import json, os, sys, time
from PIL import Image, ImageChops, ImageFilter, ImageDraw
sys.stdout.reconfigure(encoding='utf-8')
cfg = json.load(open(sys.argv[1], encoding='utf-8'))
T = os.environ['TEMP'] + '/mapas/'
t0 = time.time()
im = Image.open(T + cfg['png']).convert('RGB'); W, H = im.size
mpp = cfg['m_por_px']
def m2px(m): return max(1, int(round(m / mpp)))
def odd(n): return max(3, int(n) | 1)
r, g, b = im.split(); mx = ImageChops.lighter(ImageChops.lighter(r, g), b); mn = ImageChops.darker(ImageChops.darker(r, g), b)
sat = ImageChops.subtract(mx, mn, 1, 0)
if cfg.get('modo') == 'cores':   # planta raster (San Marino): divisas brancas
    linha = ImageChops.multiply(mn.point(lambda v: 255 if v >= cfg.get('branco_min', 205) else 0), sat.point(lambda v: 255 if v < 40 else 0))
else:
    escuro = mx.point(lambda v: 255 if v < cfg.get('escuro_max', 175) else 0)
    # so_escuro: ignora as linhas COLORIDAS (eixos vermelhos tracejados do Alpnach cortavam os lotes)
    linha = escuro if cfg.get('so_escuro') else ImageChops.lighter(escuro, sat.point(lambda v: 255 if v >= 60 else 0))
eng = odd(m2px(cfg.get('fecha_m', 0.6)))
linha = linha.filter(ImageFilter.MaxFilter(eng))
if cfg.get('tira_blobs'):   # borroes (numeros, setas) so DEPOIS de engrossar: o flood fill e 4-conexo
    lim = cfg['tira_blobs']; tmp = linha.copy(); nb = 0
    for y in range(0, H, 3):
        for x in range(0, W, 3):
            if tmp.getpixel((x, y)) != 255: continue
            jan = tmp.crop((max(0, x - lim), max(0, y - lim), min(W, x + lim), min(H, y + lim))); sx, sy = x - max(0, x - lim), y - max(0, y - lim)
            ImageDraw.floodfill(jan, (sx, sy), 128); reg = jan.point(lambda v: 255 if v == 128 else 0); bb = reg.getbbox()
            toca = bb[0] == 0 or bb[1] == 0 or bb[2] == jan.width or bb[3] == jan.height
            if not toca and (bb[2] - bb[0]) < lim and (bb[3] - bb[1]) < lim: linha.paste(0, (max(0, x - lim), max(0, y - lim)), reg); nb += 1
            tmp.paste(64, (max(0, x - lim), max(0, y - lim)), reg)
    print('blobs apagados:', nb, flush=True)
if cfg.get('debug'): linha.save(T + cfg['debug'])
lote_max = cfg.get('lote_max_m2', 2500) / (mpp * mpp)
bloco_max = cfg.get('bloco_max_m2', 90000) / (mpp * mpp)
minusculo = cfg.get('minusculo_m2', 15) / (mpp * mpp)
passo = cfg.get('passo_semente', 6); JAN = cfg.get('janela', 700)
def borda_interna(m):
    mp = Image.new('L', (m.width + 4, m.height + 4), 0); mp.paste(m, (2, 2))
    return ImageChops.subtract(mp, mp.filter(ImageFilter.MinFilter(3))).crop((2, 2, 2 + m.width, 2 + m.height))
LARGS = [4, 6, 8, 10, 12, 15, 18, 22, 26, 32, 40, 50, 60]
def largura_max(msk):
    """maior largura inscrita (m), por erosoes em 1/4 da escala"""
    f = 4; p0 = msk.resize((max(1, msk.width // f), max(1, msk.height // f)), Image.BOX).point(lambda v: 255 if v > 100 else 0)
    peq = Image.new('L', (p0.width + 40, p0.height + 40), 0); peq.paste(p0, (20, 20)); wmax = 0
    for wm in LARGS:
        kk = odd(m2px(wm) / f)
        if kk < 3: wmax = wm; continue
        if peq.filter(ImageFilter.MinFilter(kk)).getbbox(): wmax = wm
        else: break
    return wmax
# ---- celulas fechadas
regs = []; trab = linha.copy()
for y in range(passo, H - passo, passo):
    for x in range(passo, W - passo, passo):
        if trab.getpixel((x, y)) != 0: continue
        x0, y0 = max(0, x - JAN), max(0, y - JAN); x1, y1 = min(W, x + JAN), min(H, y + JAN)
        jan = trab.crop((x0, y0, x1, y1)); ImageDraw.floodfill(jan, (x - x0, y - y0), 128)
        reg = jan.point(lambda v: 255 if v == 128 else 0); bb = reg.getbbox()
        toca_jan = bb[0] == 0 or bb[1] == 0 or bb[2] == jan.width or bb[3] == jan.height
        if toca_jan and not (x0 == 0 and y0 == 0 and x1 == W and y1 == H):
            ImageDraw.floodfill(trab, (x, y), 128); reg = trab.point(lambda v: 255 if v == 128 else 0); bb = reg.getbbox(); x0 = y0 = 0
            borda = bb[0] == 0 or bb[1] == 0 or bb[2] == W or bb[3] == H
        else:
            borda = (x0 == 0 and bb[0] == 0) or (y0 == 0 and bb[1] == 0) or (x1 == W and bb[2] == jan.width) or (y1 == H and bb[3] == jan.height)
        regs.append({'x': x0 + bb[0], 'y': y0 + bb[1], 'msk': reg.crop(bb), 'area': reg.histogram()[255], 'borda': borda})
        trab.paste(255, (x0, y0), reg)
print('celulas fechadas: %d em %.0fs' % (len(regs), time.time() - t0), flush=True)
# ---- classificacao
PTS = None
if cfg.get('pontos_lote'):   # posicoes conhecidas de lote (em pixels do render): mandam mais que a forma da celula
    PTS = Image.new('L', (W, H), 0); dp = ImageDraw.Draw(PTS)
    for x_, y_ in cfg['pontos_lote']:
        if 0 <= x_ < W and 0 <= y_ < H: dp.ellipse([x_ - 2, y_ - 2, x_ + 2, y_ + 2], fill=255)
    print('pontos de lote conhecidos:', len(cfg['pontos_lote']), flush=True)
n = {'lote': 0, 'bloco': 0, 'fora': 0, 'lote_por_ponto': 0}
def tem_ponto(r_):
    if PTS is None: return False
    box = (r_['x'], r_['y'], r_['x'] + r_['msk'].width, r_['y'] + r_['msk'].height)
    return bool(ImageChops.multiply(r_['msk'], PTS.crop(box)).getbbox())
for r_ in regs:
    a_m2 = r_['area'] * mpp * mpp; r_['cls'] = 'fora'
    if r_['borda'] or r_['area'] < minusculo: n['fora'] += 1; continue
    if a_m2 <= cfg.get('lote_ponto_max_m2', 20000) and tem_ponto(r_):   # a planta diz que ali ha lote
        r_['cls'] = 'lote'; n['lote'] += 1; n['lote_por_ponto'] += 1; continue
    if min(r_['msk'].width, r_['msk'].height) < m2px(cfg.get('lote_larg_min_m', 4)): n['fora'] += 1; continue
    wm = largura_max(r_['msk'])
    if wm < cfg.get('lote_larg_min_m', 4): n['fora'] += 1; continue
    comp = a_m2 / wm   # comprimento equivalente
    alongada = wm < cfg.get('rua_larg_max_m', 20) and comp >= max(cfg.get('rua_comp_min_m', 55), 4.5 * wm)   # corredor de rua fechado por guias (rua e estreita)
    if r_['area'] <= lote_max and not alongada: r_['cls'] = 'lote'; n['lote'] += 1
    elif r_['area'] <= bloco_max and not alongada and wm >= cfg.get('bloco_larg_min_m', 15): r_['cls'] = 'bloco'; n['bloco'] += 1
    else: n['fora'] += 1
print('classes:', n, 'em %.0fs' % (time.time() - t0), flush=True)
gr = sorted((r_ for r_ in regs if r_['cls'] == 'fora' and not r_['borda']), key=lambda r_: -r_['area'])[:6]
print('  maiores celulas fora: ' + ' | '.join('%.0f m2 %dx%d larg %d m' % (r_['area'] * mpp * mpp, r_['msk'].width, r_['msk'].height, largura_max(r_['msk'])) for r_ in gr), flush=True)
kq = odd(m2px(cfg.get('furo_max_m', 9)))
def tapa_furos(m):
    """fecha buracos menores que 'furo_max_m' dentro da celula (circulos de numeracao, textos): sem furo, sem contorno redondo"""
    pad = kq + 2; mp = Image.new('L', (m.width + 2 * pad, m.height + 2 * pad), 0); mp.paste(m, (pad, pad))
    ext = mp.copy(); ImageDraw.floodfill(ext, (0, 0), 128); furos = ext.point(lambda v: 255 if v == 0 else 0)
    if not furos.getbbox(): return m
    grandes = furos.filter(ImageFilter.MinFilter(kq)).filter(ImageFilter.MaxFilter(kq))
    return ImageChops.lighter(mp, ImageChops.subtract(furos, grandes)).crop((pad, pad, pad + m.width, pad + m.height))
VERDE = Image.new('L', (W, H), 0)
for r_ in regs:
    if r_['cls'] in ('lote', 'bloco'):
        r_['msk'] = tapa_furos(r_['msk']); VERDE.paste(255, (r_['x'], r_['y']), r_['msk'])
f8 = 8
def fecha(msk, m, f=f8):
    """fechamento morfologico (dilata + erode) em 1/f da escala"""
    kk = odd(2 * m2px(m) / f)
    peq = msk.resize((W // f, H // f), Image.BOX).point(lambda v: 255 if v > 0 else 0)
    return peq.filter(ImageFilter.MaxFilter(kk)).filter(ImageFilter.MinFilter(kk)).resize((W, H), Image.NEAREST)
def preenche(msk):
    """preenche buracos internos da mascara (flood pelo exterior)"""
    mp = Image.new('L', (msk.width + 4, msk.height + 4), 0); mp.paste(msk, (2, 2))
    ext = mp.copy(); ImageDraw.floodfill(ext, (0, 0), 128)
    return ImageChops.lighter(mp, ext.point(lambda v: 255 if v == 0 else 0)).crop((2, 2, 2 + msk.width, 2 + msk.height))
VIZ = VERDE.filter(ImageFilter.MaxFilter(odd(m2px(cfg.get('vizinho_m', 1.5)))))   # alcance para dizer que uma celula encosta na quadra
n_calc = 0
for r_ in regs:
    if r_['cls'] != 'fora' or r_['borda']: continue
    if r_['area'] * mpp * mpp > cfg.get('calcada_max_m2', 1200): continue
    if largura_max(r_['msk']) > cfg.get('calcada_larg_max_m', 7): continue   # rua e mais larga que isso
    box = (r_['x'], r_['y'], r_['x'] + r_['msk'].width, r_['y'] + r_['msk'].height)
    if ImageChops.multiply(borda_interna(r_['msk']), VIZ.crop(box)).getbbox():
        r_['cls'] = 'calcada'; VERDE.paste(255, (r_['x'], r_['y']), r_['msk']); n_calc += 1
print('calcadas/canteiros incorporados a quadra:', n_calc, flush=True)
QUADRA = ImageChops.lighter(VERDE.filter(ImageFilter.MaxFilter(odd(2 * eng + 1))).filter(ImageFilter.MinFilter(odd(2 * eng + 1))), VERDE)   # fecha so a espessura das divisas
mp = Image.new('L', (W + 4, H + 4), 0); mp.paste(QUADRA, (2, 2)); ext = mp.copy(); ImageDraw.floodfill(ext, (0, 0), 128)
furos = ext.point(lambda v: 255 if v == 0 else 0)
QUADRA = ImageChops.lighter(QUADRA, ImageChops.subtract(furos, furos.filter(ImageFilter.MinFilter(kq)).filter(ImageFilter.MaxFilter(kq))).crop((2, 2, 2 + W, 2 + H)))
peq = VERDE.resize((W // f8, H // f8), Image.BOX).point(lambda v: 255 if v > 0 else 0)
kk = odd(2 * m2px(cfg.get('perimetro_m', 35)) / f8)
PERIM = preenche(peq.filter(ImageFilter.MaxFilter(kk)).filter(ImageFilter.MinFilter(kk))).resize((W, H), Image.NEAREST)
ks = odd(m2px(cfg.get('suaviza_m', 1.5)))   # tira os degraus do fechamento feito em escala reduzida
PERIM = PERIM.filter(ImageFilter.MaxFilter(ks)).filter(ImageFilter.MinFilter(ks)).filter(ImageFilter.MinFilter(ks)).filter(ImageFilter.MaxFilter(ks))
PERIM = ImageChops.lighter(PERIM, QUADRA)
RUA = ImageChops.subtract(PERIM, QUADRA)
print('verde %.1f%% | quadra %.1f%% | rua %.1f%% em %.0fs' % (100 * VERDE.histogram()[255] / (W * H), 100 * QUADRA.histogram()[255] / (W * H), 100 * RUA.histogram()[255] / (W * H), time.time() - t0), flush=True)
# ---- pintura
COR = {'lote': tuple(cfg.get('cor_lote', [109, 179, 100])), 'rua': tuple(cfg.get('cor_rua', [166, 166, 166])), 'linha': tuple(cfg.get('cor_linha', [45, 62, 45]))}
out = Image.new('RGB', (W, H), (255, 255, 255))
out.paste(COR['rua'], (0, 0), PERIM)          # tudo dentro do perimetro comeca cinza (rua)
out.paste(COR['lote'], (0, 0), QUADRA)        # quadras por cima, verdes e solidas
cont = Image.new('L', (W, H), 0)
for r_ in regs:   # divisas: borda das celulas de lote (continua, sem risco solto)
    if r_['cls'] == 'lote':
        m = r_['msk']; box = (r_['x'], r_['y'], r_['x'] + m.width, r_['y'] + m.height)
        cont.paste(ImageChops.lighter(cont.crop(box), borda_interna(m)), (r_['x'], r_['y']))
cont = ImageChops.lighter(cont, borda_interna(QUADRA))   # contorno da quadra
wl = m2px(cfg.get('larg_linha_m', 0.5))
if wl >= 3: cont = cont.filter(ImageFilter.MaxFilter(odd(wl)))
out.paste(COR['linha'], (0, 0), cont)
bordao = borda_interna(PERIM)
if wl >= 3: bordao = bordao.filter(ImageFilter.MaxFilter(odd(wl)))
out.paste(tuple(cfg.get('cor_borda', [120, 120, 120])), (0, 0), ImageChops.subtract(bordao, cont))
out.save(T + cfg['saida']); print('clean:', cfg['saida'], 'em %.0fs' % (time.time() - t0))
if cfg.get('saida_ruas'): RUA.save(T + cfg['saida_ruas'])
