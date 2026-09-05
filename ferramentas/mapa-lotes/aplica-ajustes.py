# -*- coding: utf-8 -*-
# Aplica no mapa os ajustes feitos no editor (ajuste/ajustes.json): gira/redimensiona/move a imagem da planta,
# recalcula os bounds e leva os pinos junto. O mapa usa overlay alinhado ao norte, entao a rotacao e "assada" na imagem.
# Uso: aplica-ajustes.py [--seco]
import json, math, os, re, sys, shutil
from PIL import Image
sys.stdout.reconfigure(encoding='utf-8')
S = os.path.dirname(os.path.abspath(__file__))
R = 'C:/Users/Usuario/Desktop/landing-page/mapa-lotes-indaiatuba/'
SECO = '--seco' in sys.argv
M_LAT = 111320.0
def mlon(lat): return M_LAT * math.cos(math.radians(lat))
def gira(dx, dy, th):
    c, s = math.cos(math.radians(th)), math.sin(math.radians(th))
    return dx * c - dy * s, dx * s + dy * c
aj = json.load(open(S + '/ajuste/ajustes.json', encoding='utf-8'))['plantas']
if not aj: print('nada ajustado'); sys.exit()
html = open(R + 'index.html', encoding='utf-8', newline='').read(); assert '\r' not in html
for bid, a in aj.items():
    m = re.search(r"\{ id:'%s',.*?bounds:\[\[([-\d.]+),([-\d.]+)\],\[([-\d.]+),([-\d.]+)\]\]" % re.escape(bid), html)
    if not m: print('!! %s nao encontrado no mapa' % bid); continue
    la0, lo0, la1, lo1 = [float(m.group(i)) for i in range(1, 5)]
    c0 = ((la0 + la1) / 2, (lo0 + lo1) / 2)
    Wm, Hm = (lo1 - lo0) * mlon(c0[0]), (la1 - la0) * M_LAT
    th, s = a['theta'], a['escala']; c1 = (a['lat'], a['lon'])
    im = Image.open(R + 'images/' + bid + '.png').convert('RGBA')
    if abs(s - 1) > 1e-6:
        im = im.resize((max(1, round(im.width * s)), max(1, round(im.height * s))), Image.LANCZOS)
    if abs(th) > 1e-6:
        im = im.rotate(th, resample=Image.BICUBIC, expand=True)   # PIL gira no sentido anti-horario, igual ao editor
    # tamanho no terreno depois de girar (caixa alinhada ao norte)
    ct, st = abs(math.cos(math.radians(th))), abs(math.sin(math.radians(th)))
    W2 = Wm * s * ct + Hm * s * st; H2 = Wm * s * st + Hm * s * ct
    nb = [[c1[0] - H2 / 2 / M_LAT, c1[1] - W2 / 2 / mlon(c1[0])], [c1[0] + H2 / 2 / M_LAT, c1[1] + W2 / 2 / mlon(c1[0])]]
    novo = 'bounds:[[%.9f,%.9f],[%.9f,%.9f]]' % (nb[0][0], nb[0][1], nb[1][0], nb[1][1])
    d = math.hypot((c1[1] - c0[1]) * mlon(c0[0]), (c1[0] - c0[0]) * M_LAT)
    print('%-14s %s | deslocou %.1f m | girou %.2f graus | tamanho %.2f%% | imagem %dx%d' % (bid, a.get('nome', ''), d, th, s * 100, im.width, im.height))
    if SECO: continue
    im.quantize(colors=16, method=Image.Quantize.FASTOCTREE).save(R + 'images/' + bid + '.png', 'PNG', optimize=True)
    linha = m.group(0); html = html.replace(linha, re.sub(r"bounds:\[\[[^\]]*\],\[[^\]]*\]\]", novo, linha))
    # pinos: mesma transformacao (giro e escala em volta do centro antigo, depois o deslocamento)
    def move(mm):
        ll = re.search(r"ll:\[([-\d.]+),([-\d.]+)\]", mm.group(0))
        if not ll: return mm.group(0)
        lat, lon = float(ll.group(1)), float(ll.group(2))
        dx, dy = (lon - c0[1]) * mlon(c0[0]), (lat - c0[0]) * M_LAT
        x, y = gira(dx * s, dy * s, th)
        return mm.group(0).replace(ll.group(0), 'll:[%.6f,%.6f]' % (c1[0] + y / M_LAT, c1[1] + x / mlon(c1[0])))
    html, n = re.subn(r"^ *\{ b:'%s'.*$" % re.escape(bid), move, html, flags=re.M)
    print('               %d pino(s) reposicionado(s)' % n)
if not SECO:
    open(R + 'index.html', 'w', encoding='utf-8', newline='').write(html)
    print('index.html atualizado')
