# -*- coding: utf-8 -*-
# Porteira de Ferro: acha rotacao/escala do render (implantacao sobre foto aerea) contra o mosaico Esri,
# ancorado na rotatoria. Score = correlacao das bordas (sem numpy: PIL + ImageStat).
import os, math, json, sys
from PIL import Image, ImageChops, ImageFilter, ImageStat, ImageOps
Image.MAX_IMAGE_PIXELS = None
sys.stdout.reconfigure(encoding='utf-8')
S = os.environ['TEMP'] + '/mapas/'
K = 4                                  # trabalha em 1/4 da resolucao do mosaico (~2,2 m/px)
ANC_R = (8557, 4893)                   # rotatoria no render (px)
ANC_S = (1062, 1313)                   # rotatoria no mosaico (px)

sat = Image.open(S + 'esri-pf.jpg').convert('L')
W, H = sat.size
satp = sat.resize((W // K, H // K), Image.LANCZOS)
ren_full = Image.open(S + 'pf/p8_0_Im0.jpg').convert('L')
RK = 4
ren = ren_full.resize((ren_full.width // RK, ren_full.height // RK), Image.LANCZOS)

def bordas(im):
    return im.filter(ImageFilter.GaussianBlur(1)).filter(ImageFilter.FIND_EDGES).filter(ImageFilter.GaussianBlur(1.5))

satb = bordas(satp)
# mascara: so' a regiao onde o render cai (evita pontuar area vazia)
def transforma(theta, s):
    """render -> espaco do mosaico reduzido; devolve imagem e mascara"""
    k = s * complex(math.cos(theta), math.sin(theta)) * RK / K     # render_reduzido -> sat_reduzido
    inv = 1 / k
    a, b = inv.real, -inv.imag
    ax, ay = ANC_R[0] / RK, ANC_R[1] / RK
    sx, sy = ANC_S[0] / K, ANC_S[1] / K
    c = complex(ax, ay) - inv * complex(sx, sy)
    m = (a, b, c.real, -b, a, c.imag)
    out = ren.transform(satp.size, Image.AFFINE, m, Image.BILINEAR)
    msk = Image.new('L', ren.size, 255).transform(satp.size, Image.AFFINE, m, Image.NEAREST)
    return out, msk

def score(theta, s):
    out, msk = transforma(theta, s)
    ob = bordas(out)
    prod = ImageChops.multiply(ob, satb)
    st = ImageStat.Stat(prod, msk)
    n = ImageStat.Stat(msk).sum[0] / 255
    if n < 3000: return -1
    a = ImageStat.Stat(ob, msk).stddev[0] or 1
    b = ImageStat.Stat(satb, msk).stddev[0] or 1
    return st.mean[0] / (a * b)

melhor = None
th0 = math.radians(88.79); s0 = 0.14524
passo_t, passo_s = 0.25, 0.006
for it in range(3):
    cands = []
    for i in range(-6, 7):
        for j in range(-6, 7):
            t = th0 + math.radians(i * passo_t); s = s0 * (1 + j * passo_s)
            cands.append((score(t, s), t, s))
    cands.sort(reverse=True)
    melhor = cands[0]
    th0, s0 = melhor[1], melhor[2]
    print('rodada %d: score %.4f  rot %.3f graus  escala %.5f (%.4f m/px)' % (it + 1, melhor[0], math.degrees(th0), s0, s0 * 0.5497))
    passo_t /= 3; passo_s /= 3
json.dump({'theta_deg': math.degrees(th0), 'escala': s0, 'anc_render': ANC_R, 'anc_sat': ANC_S, 'score': melhor[0]},
          open(S + 'pf/busca.json', 'w'), indent=1)

# ---- ajuste fino da ancora (translacao) com a rotacao/escala achadas ----
def transforma2(theta, s, dx, dy):
    k = s * complex(math.cos(theta), math.sin(theta)) * RK / K
    inv = 1 / k
    a, b = inv.real, -inv.imag
    c = complex(ANC_R[0] / RK, ANC_R[1] / RK) - inv * complex((ANC_S[0] + dx) / K, (ANC_S[1] + dy) / K)
    m = (a, b, c.real, -b, a, c.imag)
    return (ren.transform(satp.size, Image.AFFINE, m, Image.BILINEAR),
            Image.new('L', ren.size, 255).transform(satp.size, Image.AFFINE, m, Image.NEAREST))

def score2(theta, s, dx, dy):
    out, msk = transforma2(theta, s, dx, dy)
    ob = bordas(out)
    st = ImageStat.Stat(ImageChops.multiply(ob, satb), msk)
    a = ImageStat.Stat(ob, msk).stddev[0] or 1
    b = ImageStat.Stat(satb, msk).stddev[0] or 1
    return st.mean[0] / (a * b)

dx = dy = 0; passo = 16
for it in range(5):
    cands = [(score2(th0, s0, dx + i * passo, dy + j * passo), dx + i * passo, dy + j * passo)
             for i in range(-3, 4) for j in range(-3, 4)]
    cands.sort(reverse=True)
    _, dx, dy = cands[0]
    print('transl rodada %d: score %.4f dx %d dy %d' % (it + 1, cands[0][0], dx, dy))
    passo = max(1, passo // 2)
# nova busca de rotacao/escala com a ancora corrigida
ANC_S = (ANC_S[0] + dx, ANC_S[1] + dy)
passo_t, passo_s = 0.2, 0.004
for it in range(3):
    cands = [(score(th0 + math.radians(i * passo_t), s0 * (1 + j * passo_s)), th0 + math.radians(i * passo_t), s0 * (1 + j * passo_s))
             for i in range(-5, 6) for j in range(-5, 6)]
    cands.sort(reverse=True)
    _, th0, s0 = cands[0]
    passo_t /= 3; passo_s /= 3
print('FINAL rot %.3f escala %.5f (%.4f m/px) ancora sat %s score %.4f' % (math.degrees(th0), s0, s0 * 0.5497, ANC_S, cands[0][0]))
json.dump({'theta_deg': math.degrees(th0), 'escala': s0, 'anc_render': ANC_R, 'anc_sat': ANC_S, 'score': cands[0][0]},
          open(S + 'pf/busca.json', 'w'), indent=1)
