# -*- coding: utf-8 -*-
# Parque Zarah (17/09/2026): 28 lotes da tabela de set/2026 que o zarah-tabela.py não leu (sem "- -" no complemento ou com
# "Viela sanitária") e por isso ficaram fora do mapa. Posição: número do lote + rótulo de área na planta; lat/lon por um
# ajuste afim LOCAL (12 vizinhos) entre a posição na planta e o pino já publicado dos lotes da mesma fase, para herdar o
# encaixe feito à mão pelo Fabio. Uso: python zarah-faltantes-2026-09-17.py [--gravar]
import json, math, os, re, sys
sys.stdout.reconfigure(encoding='utf-8')
from pypdf import PdfReader
T = os.environ['TEMP'] + '/mapas/'
RAIZ = 'C:/Users/Usuario/Desktop/landing-page/'
P = RAIZ + 'mapa-lotes-indaiatuba/index.html'
W = 'C:/Users/Usuario/Desktop/20260821 backup whatsapp/Media/WhatsApp Business Documents/'
FASES = {1: dict(b='zarah-safira', texto='zarah-safira-text.json', fs_num=57.7, H=3370),
         3: dict(b='zarah-perola', texto='zarah-perola-text.json', fs_num=38.5, H=2384)}
num = lambda v: float(v.replace('.', '').replace(',', '.'))

txt = re.sub(r'\s+', ' ', '\n'.join(p.extract_text() or '' for p in PdfReader(W + 'PARQUE_ZARAH_TABELA_PARQUE_ZARAH_SETEMBRO_180X.pdf').pages))
rx = re.compile(r'FASE (\d) ?- ?\w+ QUADRA (\d+) (\d+) ([\d.,]+) m² (RESIDENCIAL|COMERCIAL|MISTO) (.*?)Disponível R\$ ([\d.,]+) R\$ ([\d.,]+) R\$ ([\d.,]+)')
s = open(P, encoding='utf-8', newline='').read()
no_mapa = set(re.findall(r"b:'(zarah-\w+)', q:'(\d+)', l:'(\d+)'", s))
faltam = []
for m in rx.finditer(txt):
    fase, q, l = int(m.group(1)), str(int(m.group(2))), str(int(m.group(3)))
    b = {1: 'zarah-safira', 2: 'zarah-rubi', 3: 'zarah-perola'}[fase]
    if (b, q, l) not in no_mapa:
        faltam.append(dict(fase=fase, b=b, q=q, l=l, m2=num(m.group(4)), tipo=m.group(5), viela='viela' in m.group(6).lower(),
                           total=num(m.group(7)), ato=num(m.group(8)), mensal=num(m.group(9))))
print(len(faltam), 'faltando no mapa')

def afim(pares):   # mínimos quadrados: (x,y) -> (lat,lon)
    import itertools
    n = len(pares); sx = [[0] * 3 for _ in range(3)]
    for (x, y), _ in pares:
        v = (x, y, 1)
        for i, j in itertools.product(range(3), range(3)): sx[i][j] += v[i] * v[j]
    def resolve(k):
        bb = [sum(v * ll[k] for v, (xy, ll) in zip([None] * n, pares)) for _ in range(0)]
        rhs = [0, 0, 0]
        for (x, y), ll in pares:
            for i, v in enumerate((x, y, 1)): rhs[i] += v * ll[k]
        a = [row[:] + [rhs[i]] for i, row in enumerate(sx)]
        for c in range(3):
            p = max(range(c, 3), key=lambda r: abs(a[r][c])); a[c], a[p] = a[p], a[c]
            for r in range(3):
                if r != c:
                    f = a[r][c] / a[c][c]
                    a[r] = [a[r][j] - f * a[c][j] for j in range(4)]
        return [a[i][3] / a[i][i] for i in range(3)]
    return resolve(0), resolve(1)

novas = []
for fase, cfg in FASES.items():
    it = json.load(open(T + cfg['texto'], encoding='utf-8'))
    # a pagina da planta tem /Rotate: o texto vem no quadro sem giro; os -quadras.json usam (H - y, x)
    it = [dict(i, x=cfg['H'] - i['y'], y=i['x']) if (i['x'] or i['y']) else i for i in it]
    Q = json.load(open(RAIZ + 'ferramentas/mapa-lotes/dados/%s-quadras.json' % cfg['b']))['quadras']
    lls = {(q, l): (float(a), float(o)) for q, l, a, o in re.findall(r"b:'%s', q:'(\d+)', l:'(\d+)'.*?ll:\[([-\d.]+),([-\d.]+)\]" % cfg['b'], s)}
    pares = [(tuple(Q[q][l]), lls[(q, l)]) for q in Q for l in Q[q] if (q, l) in lls]
    nums = [(int(i['t']), i['x'], i['y']) for i in it if re.fullmatch(r'\d{1,3}', i['t']) and abs(i['fs'] - cfg['fs_num']) < 0.5 and (i['x'] or i['y'])]
    areas = [(num(re.match(r'[\d.,]+', i['t']).group(0)), i['x'], i['y']) for i in it if re.fullmatch(r'\d{3}(?:\.\d{3})?,\d\d(\s*m²)?', i['t']) and (i['x'] or i['y'])]
    for f in [f for f in faltam if f['fase'] == fase]:
        ref = [tuple(v) for v in Q.get(f['q'], {}).values()] + [(g['x'], g['y']) for g in novas if g['b'] == f['b'] and g['q'] == f['q']]
        cands = []
        for n, x, y in nums:
            if n != int(f['l']): continue
            a = min(areas, key=lambda a: math.hypot(a[1] - x, a[2] - y))
            da = math.hypot(a[1] - x, a[2] - y)
            dq = min((math.hypot(x - rx_, y - ry) for rx_, ry in ref), default=0)
            cands.append((abs(a[0] - f['m2']) > 0.02, dq, da, x, y, a[0]))
        cands.sort()
        if '-v' in sys.argv: print('   alternativas', f['q'], f['l'], [(c[0], round(c[1]), round(c[3]), round(c[4]), c[5]) for c in cands[:4]])
        if not cands: print('SEM candidato', f); continue
        ruim, dq, da, x, y, area = cands[0]
        # conferido na planta: Safira Q10 L29 é o lote da faixa ao lado do L26 (a planta imprime 150,46 m²; a tabela diz 150,00)
        if (f['b'], f['q'], f['l']) == ('zarah-safira', '10', '29'):
            x, y, area, ruim = 1874.9, 1056.0, 150.46, False
        viz = sorted(pares, key=lambda p: math.hypot(p[0][0] - x, p[0][1] - y))[:12]
        clat, clon = afim(viz)
        lat, lon = clat[0] * x + clat[1] * y + clat[2], clon[0] * x + clon[1] * y + clon[2]
        dviz = math.hypot(viz[0][0][0] - x, viz[0][0][1] - y)
        print('%s Q%s L%s %.2f m² -> planta (%.0f,%.0f) área impressa %.2f %s | dist. à quadra %.0f pt | vizinho %.0f pt | %.6f,%.6f'
              % (f['b'], f['q'], f['l'], f['m2'], x, y, area, 'DIVERGE' if ruim else 'ok', dq, dviz, lat, lon))
        f.update(x=x, y=y, lat=lat, lon=lon, ok=not ruim)
        novas.append(f)

OBS = ("Valor de tabela Zarin de set/2026: ato de 12% e saldo em 180 parcelas com juros de 1% a.m. (Price) "
       "e correção mensal pelo IPCA; consulte a condição à vista")
if '--gravar' in sys.argv:
    assert all(f['ok'] for f in novas) and len(novas) == len(faltam)
    for b in ('zarah-safira', 'zarah-perola'):
        linhas = ''
        for f in sorted([f for f in novas if f['b'] == b], key=lambda f: (int(f['q']), int(f['l']))):
            obs = OBS + ('; lote com viela sanitária (faixa sem construção para rede de esgoto/drenagem)' if f['viela'] else '')
            linhas += ("  { b:'%s', q:'%s', l:'%s', m2:%.2f, tipo:'%s', pm2:%d, vista:%.2f, entrada:%.2f, parcela:%.2f, nx:180, ep:12, "
                       "ll:[%.6f,%.6f], tabela:true, obs:'%s' },\n") % (b, f['q'], f['l'], f['m2'], f['tipo'], round(f['total'] / f['m2']),
                                                                         f['total'], f['ato'], f['mensal'], f['lat'], f['lon'], obs)
        ult = list(re.finditer(r"^ *\{ b:'%s'[^\n]*\n" % b, s, re.M))[-1]
        s = s[:ult.end()] + linhas + s[ult.end():]
    open(P, 'w', encoding='utf-8', newline='').write(s)
    print('gravado')
