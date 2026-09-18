# -*- coding: utf-8 -*-
# Parque Zarah: aplica a tabela Zarin gerada em 18/09/2026 ao mapa.
# - tira do mapa os lotes que sumiram da tabela (vendidos/retirados);
# - acrescenta os que entraram, com posicao: Perola pela planta (numero + area, quadro girado (H - y, x), afim local com os
#   12 pinos vizinhos ja publicados); Rubi (sem planta em PDF) pelos pinos vizinhos da mesma quadra no mapa;
# - confere que nenhum preco/parcela mudou (se mudar, atualiza).
# Uso: python zarah-atualiza-2026-09-18.py <tabela.pdf> [--gravar]
import json, math, os, re, sys
from pypdf import PdfReader
sys.stdout.reconfigure(encoding='utf-8')
T = os.environ['TEMP'] + '/mapas/'
RAIZ = 'C:/Users/Usuario/Desktop/landing-page/'
P = RAIZ + 'mapa-lotes-indaiatuba/index.html'
num = lambda v: float(v.replace('.', '').replace(',', '.'))
B = {1: 'zarah-safira', 2: 'zarah-rubi', 3: 'zarah-perola'}
OBS = ("Valor de tabela Zarin de set/2026: ato de 12% e saldo em 180 parcelas com juros de 1% a.m. (Price) "
       "e correção mensal pelo IPCA; consulte a condição à vista")

t = re.sub(r'\s+', ' ', '\n'.join((p.extract_text() or '') for p in PdfReader(sys.argv[1]).pages))
rx = re.compile(r'FASE (\d) ?- ?\w+ QUADRA (\d+) (\d+) ([\d.,]+) m² (RESIDENCIAL|COMERCIAL|MISTO) (.*?)Disponível R\$ ([\d.,]+) R\$ ([\d.,]+) R\$ ([\d.,]+)')
novo = {}
for m in rx.finditer(t):
    k = (B[int(m.group(1))], str(int(m.group(2))), str(int(m.group(3))))
    novo[k] = dict(m2=num(m.group(4)), tipo=m.group(5), viela='viela' in m.group(6).lower(),
                   total=num(m.group(7)), ato=num(m.group(8)), mensal=num(m.group(9)))
assert len(novo) == t.count('QUADRA'), ('linhas nao lidas', len(novo), t.count('QUADRA'))

s = open(P, encoding='utf-8', newline='').read()
linhas = {}
for m in re.finditer(r"^ *\{ b:'(zarah-\w+)', q:'(\d+)', l:'(\d+)'[^\n]*\n", s, re.M):
    linhas[(m.group(1), m.group(2), m.group(3))] = m
ll = {}
for k, m in linhas.items():   # alguns lotes do Zarah nao tem pino (so' na lista); ficam fora da referencia
    g = re.search(r"ll:\[([-\d.]+),([-\d.]+)\]", m.group(0))
    if g: ll[k] = (float(g.group(1)), float(g.group(2)))
sairam = sorted(set(linhas) - set(novo), key=lambda k: (k[0], int(k[1]), int(k[2])))
entraram = sorted(set(novo) - set(linhas))
print('tabela', len(novo), '| mapa', len(linhas), '| saem', len(sairam), '| entram', len(entraram))

def afim(pares):
    import itertools
    sx = [[0] * 3 for _ in range(3)]
    for (x, y), _ in pares:
        for i, j in itertools.product(range(3), range(3)): sx[i][j] += (x, y, 1)[i] * (x, y, 1)[j]
    def resolve(k):
        rhs = [0, 0, 0]
        for (x, y), v in pares:
            for i, c in enumerate((x, y, 1)): rhs[i] += c * v[k]
        a = [row[:] + [rhs[i]] for i, row in enumerate(sx)]
        for c in range(3):
            p = max(range(c, 3), key=lambda r: abs(a[r][c])); a[c], a[p] = a[p], a[c]
            for r in range(3):
                if r != c:
                    f = a[r][c] / a[c][c]; a[r] = [a[r][j] - f * a[c][j] for j in range(4)]
        return [a[i][3] / a[i][i] for i in range(3)]
    return resolve(0), resolve(1)

pos = {}
for k in entraram:
    b, q, l = k
    if b == 'zarah-perola':
        it = json.load(open(T + 'zarah-perola-text.json', encoding='utf-8'))
        it = [dict(i, x=2384 - i['y'], y=i['x']) for i in it if i['x'] or i['y']]
        Q = json.load(open(RAIZ + 'ferramentas/mapa-lotes/dados/zarah-perola-quadras.json'))['quadras']
        nums = [(i['x'], i['y']) for i in it if i['t'] in (l, l.zfill(2)) and abs(i['fs'] - 38.5) < 0.5]
        areas = [(num(re.match(r'[\d.,]+', i['t']).group(0)), i['x'], i['y']) for i in it if re.fullmatch(r'\d{3}(?:\.\d{3})?,\d\d(\s*m²)?', i['t'])]
        ref = [tuple(v) for v in Q.get(q, {}).values()]
        cands = []
        for x, y in nums:
            a = min(areas, key=lambda a: math.hypot(a[1] - x, a[2] - y))
            cands.append((abs(a[0] - novo[k]['m2']) > 0.02, min(math.hypot(x - rx_, y - ry) for rx_, ry in ref), x, y, a[0]))
        cands.sort()
        ruim, dq, x, y, area = cands[0]
        assert not ruim, ('area nao confere', k, cands[:3])
        pares = [(tuple(Q[qq][lx]), ll[(b, qq, lx)]) for qq in Q for lx in Q[qq] if (b, qq, lx) in ll]
        viz = sorted(pares, key=lambda p: math.hypot(p[0][0] - x, p[0][1] - y))[:12]
        clat, clon = afim(viz)
        pos[k] = (clat[0] * x + clat[1] * y + clat[2], clon[0] * x + clon[1] * y + clon[2])
        print('  %s Q%s L%s pela planta: area impressa %.2f, %.0f pt da quadra -> %.6f,%.6f' % (b, q, l, area, dq, *pos[k]))
    else:
        n = int(l)
        a, c = ll.get((b, q, str(n - 1))), ll.get((b, q, str(n + 1)))
        if a and c:
            pos[k] = ((a[0] + c[0]) / 2, (a[1] + c[1]) / 2); how = 'entre L%d e L%d' % (n - 1, n + 1)
        else:
            a, c = ll.get((b, q, str(n - 1))), ll.get((b, q, str(n - 2)))
            assert a and c, ('sem vizinhos', k)
            pos[k] = (2 * a[0] - c[0], 2 * a[1] - c[1]); how = 'continuando L%d -> L%d' % (n - 2, n - 1)
        print('  %s Q%s L%s pelos vizinhos (%s) -> %.6f,%.6f' % (b, q, l, how, *pos[k]))

mudou = [k for k in set(linhas) & set(novo)
         if abs(float(re.search(r'vista:([\d.]+)', linhas[k].group(0)).group(1)) - novo[k]['total']) > 0.01
         or abs(float(re.search(r'parcela:([\d.]+)', linhas[k].group(0)).group(1)) - novo[k]['mensal']) > 0.01]
print('preco/parcela mudou em', len(mudou))

if '--gravar' in sys.argv:
    assert not mudou, 'precos mudaram: tratar antes'
    for k in sairam:
        s = s.replace(linhas[k].group(0), '', 1)
    for k in entraram:
        b, q, l = k; d = novo[k]
        obs = OBS + ('; lote com viela sanitária (faixa sem construção para rede de esgoto/drenagem)' if d['viela'] else '')
        nova = ("  { b:'%s', q:'%s', l:'%s', m2:%.2f, tipo:'%s', pm2:%d, vista:%.2f, entrada:%.2f, parcela:%.2f, nx:180, ep:12, "
                "ll:[%.6f,%.6f], tabela:true, obs:'%s' },\n") % (b, q, l, d['m2'], d['tipo'], round(d['total'] / d['m2']),
                                                                 d['total'], d['ato'], d['mensal'], pos[k][0], pos[k][1], obs)
        ult = list(re.finditer(r"^ *\{ b:'%s'[^\n]*\n" % b, s, re.M))[-1]
        s = s[:ult.end()] + nova + s[ult.end():]
    s = s.replace('tabela Zarin de set/2026 (180x)', 'tabela Zarin de set/2026 gerada em 18/09 (180x)')
    open(P, 'w', encoding='utf-8', newline='').write(s)
    cont = {b: len(re.findall(r"^ *\{ b:'%s'" % b, s, re.M)) for b in B.values()}
    print('gravado:', cont, 'total', sum(cont.values()))
    print('saíram:', ', '.join('%s Q%s L%s' % (b.split('-')[1], q, l) for b, q, l in sairam))
