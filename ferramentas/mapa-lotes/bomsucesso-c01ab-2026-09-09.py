# -*- coding: utf-8 -*-
# Ordem: bomsucesso-c01-corte -> bomsucesso-c01ab -> bomsucesso-c01-pinos, na MESMA pasta (trocam bs-mask*.txt).
# Desenha no render da planta do Bom Sucesso a segregacao do lote C01 em C01-A (1.085,85 m2) e C01-B (500,00 m2),
# conforme a divisao enviada pela loteadora (corte de 32,47 m) e a marcacao feita pelo Fabio.
import sys, math, json
from PIL import Image, ImageDraw, ImageFont
sys.stdout.reconfigure(encoding='utf-8')
T = 'C:/Users/Usuario/AppData/Local/Temp/mapas/'
SRC = T + '5000/337-jardim-bom-sucesso_-p1.png'
DST = T + '5000/337-jardim-bom-sucesso_-p1-c01ab.png'
MPP = 0.35279746253529193 / (5000/4749.04)
ANG = 11.5; FRAC = 500.0/1585.85
mask = set(tuple(int(v) for v in l.split()) for l in open('bs-mask.txt'))
a = math.radians(ANG)
us = sorted((y*math.cos(a) - x*math.sin(a), x, y) for x, y in mask)
u0 = us[int(round(len(us)*(1-FRAC)))][0]
A = set((x, y) for u, x, y in us if u <= u0); B = set((x, y) for u, x, y in us if u > u0)
faixa = sorted((x, y) for u, x, y in us if abs(u-u0) <= 0.75)
P, Q = faixa[0], faixa[-1]
print('corte %s -> %s  (%.2f m)  A=%.1f m2  B=%.1f m2' % (P, Q, math.dist(P, Q)*MPP, len(A)*MPP*MPP, len(B)*MPP*MPP))
im = Image.open(SRC).convert('RGB'); d = ImageDraw.Draw(im)
def cabe(cx, cy, w, h, reg):
    for x in range(int(cx-w/2)-1, int(cx+w/2)+2):
        for y in range(int(cy-h/2)-1, int(cy+h/2)+2):
            if (x, y) not in reg: return False
    return True
# fonte com altura de caixa alta ~6 px (mesma da planta)
fnt = None
for sz in range(6, 16):
    f = ImageFont.truetype('C:/Windows/Fonts/ARIALN.TTF', sz); b_ = f.getbbox('1085')
    if b_[3]-b_[1] >= 6: fnt = f; print('fonte ARIALN', sz, 'alt', b_[3]-b_[1]); break
# 1) apaga o rotulo antigo "1.585,85m2" e o circulo "01"
d.rectangle([614, 1969, 656, 1981], fill=(255, 255, 255))
d.rectangle([624, 2011, 639, 2025], fill=(255, 255, 255))
# 2) linha do corte, esticada ate as divisas
ux, uy = (Q[0]-P[0])/math.dist(P, Q), (Q[1]-P[1])/math.dist(P, Q)
d.line([(P[0]-ux*3, P[1]-uy*3), (Q[0]+ux*3, Q[1]+uy*3)], fill=(20, 20, 20), width=2)
# 3) rotulos "01 A"/"01 B" + areas
PRETO = (35, 33, 34); VERDE = (0, 128, 60); ANEL = (60, 15, 35)
def rotulo(cx, cy, letra, area, reg):
    r = 5.2
    d.ellipse([cx-r, cy-r, cx+r, cy+r], outline=ANEL, width=1)
    d.text((cx, cy), '01', font=fnt, fill=VERDE, anchor='mm')
    d.text((cx+r+2.5, cy), letra, font=fnt, fill=PRETO, anchor='lm')
    d.text((cx+2, cy+11), area, font=fnt, fill=PRETO, anchor='mm')
    ok = cabe(cx, cy, 26, 10, reg) and cabe(cx+2, cy+11, 38, 9, reg)
    print('  rotulo %s em (%.0f,%.0f): dentro do lote = %s' % (letra, cx, cy, ok))
rotulo(634, 1970, 'A', '1.085,85m²', A)
rotulo(634, 2036, 'B', '500,00m²', B)
im.save(DST); print('gravado', DST)
c = im.crop((540, 1900, 790, 2120)); c = c.resize((c.width*4, c.height*4), Image.LANCZOS); c.save('bs-c01ab-preview.png')
json.dump({'P': P, 'Q': Q, 'ang': ANG,
           'cA': [sum(p[0] for p in A)/len(A), sum(p[1] for p in A)/len(A)],
           'cB': [sum(p[0] for p in B)/len(B), sum(p[1] for p in B)/len(B)],
           'areaA_m2': len(A)*MPP*MPP, 'areaB_m2': len(B)*MPP*MPP}, open('bs-c01ab.json', 'w'), indent=1)
with open('bs-mask-A.txt', 'w') as f: f.write('\n'.join('%d %d' % p for p in sorted(A)))
with open('bs-mask-B.txt', 'w') as f: f.write('\n'.join('%d %d' % p for p in sorted(B)))
