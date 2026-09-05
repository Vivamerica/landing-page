# -*- coding: utf-8 -*-
# Reprojeta os pinos (ll) de um bairro do index.html quando o ajuste (fit) da planta muda: mantem a posicao do pino NA PLANTA
# (ll -> UTM -> pagina pelo fit antigo -> UTM pelo fit novo -> ll). Edita o index.html no lugar; so mexe em ll:[...].
# Uso: reprojeta-ll.py <id> <fit-antigo.json> <fit-novo.json>   (caminhos relativos a %TEMP%/mapas ou absolutos)
import json, os, re, sys
sys.stdout.reconfigure(encoding='utf-8')
exec(open(os.path.dirname(os.path.abspath(__file__)) + '/utm.py', encoding='utf-8').read())
T = os.environ['TEMP'] + '/mapas/'
bid, fa, fn = sys.argv[1:4]
def carrega(f): return json.load(open(f if os.path.isabs(f) else T + f))
A, B = carrega(fa), carrega(fn)
def utm2page(fit, E, N):
    a, b, c = fit['E']; d, e, f = fit['N']; det = a * e - b * d
    return ((e * (E - c) - b * (N - f)) / det, (-d * (E - c) + a * (N - f)) / det)
def page2utm(fit, x, y): return (fit['E'][0] * x + fit['E'][1] * y + fit['E'][2], fit['N'][0] * x + fit['N'][1] * y + fit['N'][2])
P = 'C:/Users/Usuario/Desktop/landing-page/mapa-lotes-indaiatuba/index.html'
s = open(P, encoding='utf-8', newline='').read(); assert '\r' not in s
n = 0; maxd = 0
def troca(m):
    global n, maxd
    ln = m.group(0); ll = re.search(r"ll:\[([-\d.]+),([-\d.]+)\]", ln)
    if not ll: return ln
    lat, lon = float(ll.group(1)), float(ll.group(2)); E, N = ll2utm(lat, lon); x, y = utm2page(A, E, N); E2, N2 = page2utm(B, x, y)
    lat2, lon2 = utm2ll(E2, N2); d = ((E2 - E) ** 2 + (N2 - N) ** 2) ** 0.5; maxd = max(maxd, d); n += 1
    return ln.replace(ll.group(0), 'll:[%.6f,%.6f]' % (lat2, lon2))
s2 = re.sub(r"^ *\{ b:'%s'.*$" % bid, troca, s, flags=re.M)
open(P, 'w', encoding='utf-8', newline='').write(s2)
print('%s: %d pinos reprojetados; maior deslocamento %.0f m' % (bid, n, maxd))
