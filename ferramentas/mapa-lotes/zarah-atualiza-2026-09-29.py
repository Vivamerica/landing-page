# -*- coding: utf-8 -*-
# Parque Zarah: aplica ao mapa a tabela "SETEMBRO 180X" recebida em 29/09/2026.
#
# Diferença para a rodada de 18/09: 20 lotes saíram (vendidos) e 4 entraram.
# Nenhum preço mudou — conferido lote a lote antes de gravar.
#
# Posição dos 4 que entram: interpolação entre os vizinhos numéricos da mesma
# quadra. Antes de aceitar, o script confere que o trecho é RETO e de espaçamento
# regular (rumo e metros por lote consistentes com os vizinhos). Se a quadra
# dobra esquina no vão, o lote entra SEM pino — aparece na lista e na contagem,
# mas não no mapa, em vez de aparecer no lugar errado.
#
# Uso: python zarah-atualiza-2026-09-29.py <tabela.pdf> [--gravar]
import io, math, re, sys
from pypdf import PdfReader
sys.stdout.reconfigure(encoding='utf-8')

RAIZ = 'C:/Users/Usuario/Desktop/landing-page/'
P = RAIZ + 'mapa-lotes-indaiatuba/index.html'
num = lambda v: float(v.replace('.', '').replace(',', '.'))
B = {1: 'zarah-safira', 2: 'zarah-rubi', 3: 'zarah-perola'}

# ── lê a tabela ──────────────────────────────────────────────────────
t = re.sub(r'\s+', ' ', '\n'.join((p.extract_text() or '') for p in PdfReader(sys.argv[1]).pages))
rx = re.compile(r'FASE (\d) ?- ?\w+ QUADRA (\d+) (\d+) ([\d.,]+) m² (RESIDENCIAL|COMERCIAL|MISTO) (.*?)'
                r'Disponível R\$ ([\d.,]+) R\$ ([\d.,]+) R\$ ([\d.,]+)')
novo = {}
for m in rx.finditer(t):
    novo[(B[int(m.group(1))], str(int(m.group(2))), str(int(m.group(3))))] = dict(
        m2=num(m.group(4)), tipo=m.group(5), viela='viela' in m.group(6).lower(),
        total=num(m.group(7)), ato=num(m.group(8)), mensal=num(m.group(9)))
assert len(novo) == t.count('QUADRA'), ('linhas nao lidas', len(novo), t.count('QUADRA'))

# ── lê o mapa ────────────────────────────────────────────────────────
s = io.open(P, encoding='utf-8', newline='').read()
linhas, ll = {}, {}
for m in re.finditer(r"^ *\{ b:'(zarah-\w+)', q:'(\d+)', l:'(\d+)'[^\n]*\n", s, re.M):
    k = (m.group(1), m.group(2), m.group(3))
    linhas[k] = m.group(0)
    g = re.search(r"ll:\[([-\d.]+),([-\d.]+)\]", m.group(0))
    if g: ll[k] = (float(g.group(1)), float(g.group(2)))

saem = sorted(set(linhas) - set(novo), key=lambda k: (k[0], int(k[1]), int(k[2])))
entram = sorted(set(novo) - set(linhas), key=lambda k: (k[0], int(k[1]), int(k[2])))
print('tabela %d | mapa %d | saem %d | entram %d' % (len(novo), len(linhas), len(saem), len(entram)))

# ── nenhum preço pode ter mudado sem a gente ver ─────────────────────
mudou = []
for k in set(novo) & set(linhas):
    g = re.search(r'prazo:([\d.]+)', linhas[k])
    if g and abs(float(g.group(1)) - novo[k]['total']) > 0.01:
        mudou.append((k, float(g.group(1)), novo[k]['total']))
if mudou:
    print('\nPAROU: %d lotes com preço diferente do mapa. Confira antes de seguir:' % len(mudou))
    for k, a, b in mudou[:10]: print('   %s Q%s L%s: mapa %.2f -> tabela %.2f' % (k[0], k[1], k[2], a, b))
    sys.exit(1)
print('preços conferidos: nenhum mudou')

# ── posição dos que entram ───────────────────────────────────────────
def rumo(a, b):
    return math.degrees(math.atan2(b[1] - a[1], b[0] - a[0]))

def posicao(k):
    """Interpola entre os vizinhos numéricos, só se o trecho for reto e regular."""
    b, q, l = k[0], k[1], int(k[2])
    pts = sorted(((int(kk[2]), v) for kk, v in ll.items() if kk[0] == b and kk[1] == q), key=lambda x: x[0])
    ant = [p for p in pts if p[0] < l]
    dep = [p for p in pts if p[0] > l]
    if not ant or not dep:
        return None, 'sem vizinho dos dois lados'
    n0, p0 = ant[-1]; n1, p1 = dep[0]
    d = math.dist(p0, p1) * 111000 / (n1 - n0)          # metros por lote no vão
    r = rumo(p0, p1)
    # compara com os trechos vizinhos, que sabemos bons
    refs = []
    for i in range(1, len(pts)):
        a0, q0 = pts[i - 1]; a1, q1 = pts[i]
        if a1 <= n0 or a0 >= n1:
            refs.append((math.dist(q0, q1) * 111000 / (a1 - a0), rumo(q0, q1)))
    if not refs:
        return None, 'sem trecho de referência'
    dref = sorted(x[0] for x in refs)[len(refs) // 2]
    perto = [x for x in refs if abs(((x[1] - r + 180) % 360) - 180) < 12]
    if not perto:
        return None, 'o vão dobra esquina (rumo %.0f° não bate com nenhum vizinho)' % r
    if not (0.6 * dref <= d <= 1.6 * dref):
        return None, 'espaçamento irregular no vão (%.1f m/lote contra %.1f de referência)' % (d, dref)
    f = (l - n0) / (n1 - n0)
    return (p0[0] + f * (p1[0] - p0[0]), p0[1] + f * (p1[1] - p0[1])), 'entre %d e %d (%.1f m/lote, rumo %.0f°)' % (n0, n1, d, r)

OBS = ("Valor de tabela Zarin de set/2026: ato de 12% e saldo em 180 parcelas com juros de 1% a.m. (Price) "
       "e correção mensal pelo IPCA; consulte a condição à vista")

print('\nENTRAM:')
novas_linhas = {}
for k in entram:
    d = novo[k]
    pos, porque = posicao(k)
    print('   %s Q%s L%s  %.2f m² %s  R$ %.2f  -> %s' % (
        k[0].replace('zarah-', ''), k[1], k[2], d['m2'], d['tipo'], d['total'],
        ('pino %s' % porque) if pos else ('SEM PINO: ' + porque)))
    campos = ("{ b:'%s', q:'%s', l:'%s', m2:%.2f, tipo:'%s', prazo:%.2f, entrada:%.2f, parcela:%.2f, "
              "tabela:true, obs:%r" % (k[0], k[1], k[2], d['m2'], d['tipo'], d['total'], d['ato'], d['mensal'], OBS))
    if pos: campos += ', ll:[%.6f,%.6f]' % pos
    novas_linhas[k] = '      ' + campos + ' },\n'

print('\nSAEM: %s' % ', '.join('%s Q%s L%s' % (k[0].replace('zarah-', ''), k[1], k[2]) for k in saem))

if '--gravar' not in sys.argv:
    print('\n(conferência apenas — rode com --gravar para aplicar)')
    sys.exit(0)

# ── grava ────────────────────────────────────────────────────────────
for k in saem:
    assert linhas[k] in s
    s = s.replace(linhas[k], '', 1)
for k in sorted(novas_linhas, key=lambda k: (k[0], int(k[1]), int(k[2]))):
    # entra logo depois do lote de número imediatamente anterior na mesma quadra
    irmaos = sorted((int(kk[2]), kk) for kk in linhas if kk[0] == k[0] and kk[1] == k[1] and kk not in saem)
    ant = [kk for n, kk in irmaos if n < int(k[2])]
    ancora = linhas[ant[-1]] if ant else linhas[irmaos[0][1]]
    assert ancora in s, k
    s = s.replace(ancora, ancora + novas_linhas[k], 1)
io.open(P, 'w', encoding='utf-8', newline='').write(s)
n = len(re.findall(r"^ *\{ b:'zarah-\w+',", s, re.M))
print('\ngravado. lotes do Zarah no mapa agora: %d (esperado %d)' % (n, len(novo)))
assert n == len(novo), 'contagem final nao bate'
