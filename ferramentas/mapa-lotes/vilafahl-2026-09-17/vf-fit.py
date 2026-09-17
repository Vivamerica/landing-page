import json, math, os, sys, statistics as st
sys.stdout.reconfigure(encoding='utf-8')
D = os.environ['TEMP'] + '/mapas/vilafahl/'
S = json.load(open(D + 'longos.json'))
def grupo(ang):
    g = []
    for a, b, L, c, w in S:
        t = math.degrees(math.atan2(b[1]-a[1], b[0]-a[0])) % 180
        if abs(t - ang) < 0.5 and c == [0.502, 0.502, 0.502]:
            g.append((a, b))
    return g
out = {}
for nome, ang in (('E', 99.8), ('N', 9.8)):
    g = grupo(ang)
    th = st.mean(math.atan2(b[1]-a[1], b[0]-a[0]) % math.pi for a, b in g)
    nx, ny = -math.sin(th), math.cos(th)   # normal
    offs = sorted(set(round(a[0]*nx + a[1]*ny, 2) for a, b in g))
    print(nome, math.degrees(th), len(g), offs, [round(offs[i+1]-offs[i], 3) for i in range(len(offs)-1)])
    out[nome] = dict(th=th, n=(nx, ny), offs=offs)
json.dump(out, open(D + 'grade.json', 'w'))
th = math.radians((math.degrees(out['E']['th']) - 90 + math.degrees(out['N']['th'])) / 2)
s = 100 / 283.455
eE = (math.cos(th), math.sin(th)); eN = (-math.sin(th), math.cos(th))
pt = (996 / (6000/4008), 2835 - 3414 / (6000/4008))
dot = lambda p, e: p[0]*e[0] + p[1]*e[1]
E0 = 268764.085 - s * dot(pt, eE); N0 = 7444609.444 - s * dot(pt, eN)
res = {}
for nome, e, Z0 in (('E', eE, E0), ('N', eN, N0)):
    nrm = out[nome]['n']
    sinal = round(nrm[0]*e[0] + nrm[1]*e[1])   # +1 ou -1
    vals = [Z0 + s * sinal * o for o in out[nome]['offs']]
    desvio = [v - round(v / 100) * 100 for v in vals]
    print(nome, 'sinal', sinal, [round(v, 1) for v in vals], 'desvio medio', round(st.mean(desvio), 2))
    res[nome] = Z0 - st.mean(desvio)
print('theta', math.degrees(th), 'E0', res['E'], 'N0', res['N'], 'torre pelo fit', res['E'] + s*dot(pt, eE), res['N'] + s*dot(pt, eN))
json.dump(dict(tipo='afim', theta_deg=math.degrees(th), s=s, E0=res['E'], N0=res['N'],
               nota='pt da pagina (y para cima) -> UTM 23S: E=E0+s*(x*cos+y*sin), N=N0+s*(-x*sin+y*cos); grade 100 m da planta + torre 17-01'),
          open(D + 'vilafahl-fit.json', 'w'), indent=1)
