# -*- coding: utf-8 -*-
# Ajuste afim pagina -> UTM a partir dos rotulos da grade (E: 2xx.xxx ; N: 7.4xx.xxx). Minimos quadrados por componente.
import json, os, re, sys
sys.stdout.reconfigure(encoding='utf-8')
T = os.environ['TEMP'] + '/mapas/'
it = json.load(open(T + sys.argv[1], encoding='utf-8')); saida = sys.argv[2]
def val(t): return float(t.replace('.', '').replace(',', '.'))
E = [(i['x'], i['y'], val(i['t'])) for i in it if re.fullmatch(r'2[5-8]\d\.\d{3}(,\d+)?', i['t'])]
N = [(i['x'], i['y'], val(i['t'])) for i in it if re.fullmatch(r'7\.4\d\d\.\d{3}(,\d+)?', i['t'])]
for i in it:   # formato "E(X)=268650" / "N(Y)=7443850"
    m = re.fullmatch(r'([EN])\s*\(?[XY]?\)?\s*=\s*([\d.]+)', i['t'])
    if m: (E if m.group(1) == 'E' else N).append((i['x'], i['y'], val(m.group(2))))
    m = re.fullmatch(r'([EN])\s+([\d.]+)(,\d+)?\s*m?', i['t'].strip())   # formato "E 265.400,0000 m" (Araras/Barnabe/Canarios)
    if m: (E if m.group(1) == 'E' else N).append((i['x'], i['y'], val(m.group(2))))
print('rotulos E:', len(E), 'N:', len(N))
def lsq(pts):
    A = [[x, y, 1.0] for x, y, v in pts]; b = [v for x, y, v in pts]; n = 3
    ATA = [[sum(A[i][a]*A[i][c] for i in range(len(A))) for c in range(n)] for a in range(n)]
    ATb = [sum(A[i][a]*b[i] for i in range(len(A))) for a in range(n)]
    M = [ATA[i] + [ATb[i]] for i in range(n)]
    for i in range(n):
        p = max(range(i, n), key=lambda r: abs(M[r][i])); M[i], M[p] = M[p], M[i]
        for r in range(n):
            if r != i:
                f = M[r][i] / M[i][i]; M[r] = [M[r][c] - f*M[i][c] for c in range(n+1)]
    return [M[i][n] / M[i][i] for i in range(n)]
ce = lsq(E); cn = lsq(N)
rE = [abs(ce[0]*x + ce[1]*y + ce[2] - v) for x, y, v in E]; rN = [abs(cn[0]*x + cn[1]*y + cn[2] - v) for x, y, v in N]
print('E = %.5f x + %.5f y + %.1f   residuo max %.2f m' % (ce[0], ce[1], ce[2], max(rE)))
print('N = %.5f x + %.5f y + %.1f   residuo max %.2f m' % (cn[0], cn[1], cn[2], max(rN)))
import math
print('escala %.4f / %.4f m/pt; eixo y da pagina: rumo %.2f graus' % (math.hypot(ce[0], cn[0]), math.hypot(ce[1], cn[1]), math.degrees(math.atan2(ce[1], cn[1]))))
if max(rE) > 8 or max(rN) > 8:
    print('  piores E:', sorted([(round(r, 1), round(x), round(y), v) for r, (x, y, v) in zip(rE, E)], reverse=True)[:4])
    print('  piores N:', sorted([(round(r, 1), round(x), round(y), v) for r, (x, y, v) in zip(rN, N)], reverse=True)[:4])
json.dump({'E': ce, 'N': cn}, open(T + saida, 'w'))
