# -*- coding: utf-8 -*-
# Desenho SOLIDO (padrao escolhido pelo Fabio): a partir do render "so linhas" (camadas/atributos filtrados), preenche
# cada regiao fechada: lote -> verde claro, rua/calcada -> cinza, areas maiores -> verde palido; divisas por cima em ardosia.
# Fora do perimetro fica branco (vira transparente no overlay-norte). Uso: preenche-solido.py cfg.json
#   cfg: png (render so linhas), saida, m_por_px, escuro_max (limiar de linha), lote_max_m2, area_max_m2, passo_semente
import json, os, sys, time
from PIL import Image, ImageChops, ImageFilter, ImageDraw
sys.stdout.reconfigure(encoding='utf-8')
cfg = json.load(open(sys.argv[1], encoding='utf-8'))
T = os.environ['TEMP'] + '/mapas/'
t0 = time.time()
im = Image.open(T + cfg['png']).convert('RGB'); W, H = im.size
r, g, b = im.split(); mx = ImageChops.lighter(ImageChops.lighter(r, g), b); mn = ImageChops.darker(ImageChops.darker(r, g), b)
# linha = pixel escuro OU colorido (vermelho das divisas, magenta do limite): tudo que nao e branco/cinza-claro
sat = ImageChops.subtract(mx, mn, 1, 0)
if cfg.get('modo') == 'cores':   # planta renderizada (ex.: San Marino): lotes verdes, ruas cinza, divisas BRANCAS
    linha = ImageChops.multiply(mn.point(lambda v: 255 if v >= cfg.get('branco_min', 205) else 0), sat.point(lambda v: 255 if v < 40 else 0))
    rua_cor = ImageChops.multiply(sat.point(lambda v: 255 if v < 28 else 0), mx.point(lambda v: 255 if 70 <= v < cfg.get('branco_min', 205) else 0))
    lote_cor = ImageChops.subtract(g, r, 1, 0).point(lambda v: 255 if v >= 12 else 0)
else:
    rua_cor = lote_cor = None
    linha = ImageChops.lighter(mx.point(lambda v: 255 if v < cfg.get('escuro_max', 175) else 0), sat.point(lambda v: 255 if v >= 60 else 0))
if cfg.get('circulos'):   # apaga circulos de numeracao pela posicao dos textos (png em escala de pagina: pw/ph do cfg)
    it = json.load(open(T + cfg['circulos']['texto'], encoding='utf-8')); k = W / cfg['circulos']['pw']; PH = cfg['circulos']['ph']; d = ImageDraw.Draw(linha); nc = 0
    for i in it:
        if i['t'].strip().isdigit() and any(abs(i['fs'] - f) < 0.5 for f in cfg['circulos']['fs']):
            X, Y = int((i['x'] + cfg['circulos'].get('dx', 0)) * k), int((PH - i['y'] - cfg['circulos'].get('dy', 0)) * k); rr = cfg['circulos']['raio']
            d.ellipse([X - rr, Y - rr, X + rr, Y + rr], fill=0); nc += 1
    print('circulos apagados:', nc)
if cfg.get('tira_blobs'):   # apaga componentes pequenos e compactos (circulos/pontos que sobraram); divisas sao longas
    lim = cfg['tira_blobs']; tmp = linha.copy(); nb = 0
    for y in range(0, H, 3):
        for x in range(0, W, 3):
            if tmp.getpixel((x, y)) != 255: continue
            jan = tmp.crop((max(0, x - lim), max(0, y - lim), min(W, x + lim), min(H, y + lim))); sx, sy = x - max(0, x - lim), y - max(0, y - lim)
            ImageDraw.floodfill(jan, (sx, sy), 128); reg = jan.point(lambda v: 255 if v == 128 else 0); bb = reg.getbbox()
            toca = bb[0] == 0 or bb[1] == 0 or bb[2] == jan.width or bb[3] == jan.height
            if not toca and (bb[2] - bb[0]) < lim and (bb[3] - bb[1]) < lim:
                linha.paste(0, (max(0, x - lim), max(0, y - lim)), reg); nb += 1
            tmp.paste(64, (max(0, x - lim), max(0, y - lim)), reg)   # visitado
    print('blobs apagados:', nb)
linha = linha.filter(ImageFilter.MaxFilter(cfg.get('engorda_linha', 3)))
mpp = cfg['m_por_px']; lote_max = cfg.get('lote_max_m2', 2500) / (mpp * mpp); area_max = cfg.get('area_max_m2', 60000) / (mpp * mpp)
COR = {'lote': tuple(cfg.get('cor_lote', [218, 236, 205])), 'rua': tuple(cfg.get('cor_rua', [214, 214, 214])), 'area': tuple(cfg.get('cor_area', [255, 255, 255])), 'linha': tuple(cfg.get('cor_linha', [55, 65, 81]))}
out = Image.new('RGB', im.size, (255, 255, 255))
trab = linha.copy()   # 255 = linha ou ja visitado; 0 = livre
passo = cfg.get('passo_semente', 6); JAN = cfg.get('janela', 700)
n = {'lote': 0, 'rua': 0, 'area': 0, 'fora': 0}
def classifica(area_px, bb, toca_borda, reg=None, off=(0, 0)):
    if rua_cor is not None and reg is not None:   # modo cores: decide pela cor dominante da regiao
        cx, cy = off[0] + (bb[0] + bb[2]) // 2, off[1] + (bb[1] + bb[3]) // 2
        amostra = reg.crop(bb); n_ = max(1, amostra.histogram()[255])
        rr = ImageChops.multiply(amostra, rua_cor.crop((bb[0] + off[0], bb[1] + off[1], bb[2] + off[0], bb[3] + off[1]))).histogram()[255] / n_
        vv = ImageChops.multiply(amostra, lote_cor.crop((bb[0] + off[0], bb[1] + off[1], bb[2] + off[0], bb[3] + off[1]))).histogram()[255] / n_
        if rr > 0.5: return 'rua'
        if area_px <= lote_max and rr < 0.3: return 'lote'
        return 'fora'
    fino = min(bb[2] - bb[0], bb[3] - bb[1]) < cfg.get('rua_fina_m', 4.5) / mpp   # celula estreita (pedaco de rua entre eixo e guia) nao e lote
    if fino: return 'rua'
    if toca_borda: return 'rua'   # rede viaria costuma sair da gleba; vira cinza so na faixa perto das linhas (recorte pelo perimetro no overlay)
    fr = area_px / max(1, (bb[2] - bb[0]) * (bb[3] - bb[1]))
    if area_px <= lote_max: return 'lote'
    if area_px <= area_max and fr >= cfg.get('compacto_min', 0.42): return 'area'
    if fr < cfg.get('rua_max_fr', 0.42): return 'rua'
    return 'area'
for y in range(passo, H - passo, passo):
    for x in range(passo, W - passo, passo):
        if trab.getpixel((x, y)) != 0: continue
        # 1a tentativa: janela local (lotes sao pequenos)
        x0, y0 = max(0, x - JAN), max(0, y - JAN); x1, y1 = min(W, x + JAN), min(H, y + JAN)
        jan = trab.crop((x0, y0, x1, y1)); ImageDraw.floodfill(jan, (x - x0, y - y0), 128)
        reg = jan.point(lambda v: 255 if v == 128 else 0); bb = reg.getbbox()
        toca_jan = bb[0] == 0 or bb[1] == 0 or bb[2] == jan.width or bb[3] == jan.height
        toca_borda = (x0 == 0 and bb[0] == 0) or (y0 == 0 and bb[1] == 0) or (x1 == W and bb[2] == jan.width) or (y1 == H and bb[3] == jan.height)
        if toca_jan and not (x0 == 0 and y0 == 0 and x1 == W and y1 == H):
            # regiao grande (rua/area): refaz na imagem inteira
            ImageDraw.floodfill(trab, (x, y), 128); reg = trab.point(lambda v: 255 if v == 128 else 0); bb = reg.getbbox(); off = (0, 0)
            toca_borda = bb[0] == 0 or bb[1] == 0 or bb[2] == W or bb[3] == H
            area_px = reg.histogram()[255]; tipo = classifica(area_px, bb, toca_borda, reg, (0, 0))
            if tipo != 'fora': out.paste(COR[tipo], (0, 0), reg)
            trab.paste(255, (0, 0), reg)
        else:
            area_px = reg.histogram()[255]; tipo = classifica(area_px, bb, toca_borda, reg, (x0, y0))
            if tipo != 'fora': out.paste(COR[tipo], (x0, y0), reg)
            trab.paste(255, (x0, y0), reg)
        n[tipo] += 1
print('regioes:', n, 'em %.1fs' % (time.time() - t0))
if rua_cor is not None:   # modo cores: pinta pelo proprio pixel o que ficou branco (ruas ligadas ao exterior, lotes de cor fraca)
    rr0, gg0, bb0 = out.split(); branco = ImageChops.multiply(ImageChops.multiply(rr0.point(lambda v: 255 if v == 255 else 0), gg0.point(lambda v: 255 if v == 255 else 0)), bb0.point(lambda v: 255 if v == 255 else 0))
    out.paste(COR['rua'], (0, 0), ImageChops.multiply(branco, rua_cor.filter(ImageFilter.MaxFilter(3))))
# rua so numa faixa perto das linhas/lotes (a regiao "rua" pode englobar areas abertas do loteamento sem divisa)
fx = int(cfg.get('rua_faixa_m', 9) / mpp) | 1
rr_, gg_, bb_ = out.split()
rua_msk = ImageChops.multiply(ImageChops.multiply(rr_.point(lambda v: 255 if abs(v - COR['rua'][0]) < 3 else 0), gg_.point(lambda v: 255 if abs(v - COR['rua'][1]) < 3 else 0)), bb_.point(lambda v: 255 if abs(v - COR['rua'][2]) < 3 else 0))
longe = ImageChops.subtract(rua_msk, linha.filter(ImageFilter.MaxFilter(fx)))
out.paste((255, 255, 255), (0, 0), longe)
if cfg.get('saida_ruas'):   # mascara das ruas (para casar com o OSM)
    rr_, gg_, bb_ = out.split(); ruas = ImageChops.multiply(ImageChops.multiply(rr_.point(lambda v: 255 if abs(v - COR['rua'][0]) < 3 else 0), gg_.point(lambda v: 255 if abs(v - COR['rua'][1]) < 3 else 0)), bb_.point(lambda v: 255 if abs(v - COR['rua'][2]) < 3 else 0))
    ruas.save(T + cfg['saida_ruas']); print('mascara de ruas:', cfg['saida_ruas'])
# linhas por cima (so onde ha preenchimento por perto, para nao riscar o exterior)
perto = out.point(lambda v: 255 if v < 250 else 0).convert('L').filter(ImageFilter.MaxFilter(9))
out.paste(COR['linha'], (0, 0), ImageChops.multiply(linha, perto))
out.save(T + cfg['saida']); print('solido:', cfg['saida'], 'em %.1fs' % (time.time() - t0))
