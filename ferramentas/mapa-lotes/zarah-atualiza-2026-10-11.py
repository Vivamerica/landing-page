# -*- coding: utf-8 -*-
# Parque Zarah: aplica ao mapa a tabela "OUTUBRO 180X" emitida em 11/10/2026.
#
# Junta numa rodada so o que as duas anteriores faziam em separado:
#   - de 01/10 vem a trava de aritmetica (a tabela so entra se a mensal bater com a
#     Tabela Price de 1% a.m. em 180 meses e o ato com 12% do total) e a linha
#     padronizada, com vista, pm2, nx e ep;
#   - de 29/09 vem o tratamento de lote novo, que a rodada de 01/10 nao tinha (ela
#     parava). A linha nova sai ja no formato padronizado: com `vista:`, nunca so
#     com `prazo:`, que faria o lote aparecer como "Preco sob consulta".
#
# Lote que ENTRA ganha pino nesta ordem:
#   1. se ja esteve no mapa, volta para a posicao que tinha (PINO_ANTERIOR), desde
#      que ela esteja livre e bata com a posicao calculada pelos vizinhos de hoje;
#   2. senao, pelos vizinhos numericos da MESMA quadra: ponto entre os dois lados,
#      ou UMA casa alem da ponta da fila, e so em trecho reto e de espacamento
#      regular;
#   3. senao entra SEM pino: aparece na lista e na contagem, nao no desenho.
#      Pino errado e pior que pino nenhum.
#
# Quem fica so e reescrito quando preco, area, tipo, ato ou mensal mudam; a posicao
# ja conferida e sempre preservada.
#
# Uso: python zarah-atualiza-2026-10-11.py <tabela.pdf> [--gravar]
import io, math, re, sys
from pypdf import PdfReader
sys.stdout.reconfigure(encoding='utf-8')

RAIZ = 'C:/Users/Usuario/Desktop/landing-page/'
P = RAIZ + 'mapa-lotes-indaiatuba/index.html'
num = lambda v: float(v.replace('.', '').replace(',', '.'))
B = {1: 'zarah-safira', 2: 'zarah-rubi', 3: 'zarah-perola'}
I, N = 0.01, 180
FATOR = I / (1 - (1 + I) ** -N)          # Tabela Price
OBS = ("Valor de tabela Zarin de out/2026: ato de 12% e saldo em 180 parcelas com juros de 1% a.m. (Price) "
       "e correção mensal pelo IPCA; consulte a condição à vista")
ROTULO_DE = 'tabela Zarin de out/2026 gerada em 01/10 (180x)'
ROTULO_PARA = 'tabela Zarin de out/2026 emitida em 11/10/2026 (180x)'
TOLERANCIA_M = 3.0                        # pino anterior x posicao pelos vizinhos

# Posicao que o lote tinha no mapa antes de sair da tabela.
PINO_ANTERIOR = {
    # Perola Q27 L13: saiu na tabela de 01/10/2026 e voltou na de 11/10/2026.
    ('zarah-perola', '27', '13'): (-23.095788, -47.265760),
}

# ── le a tabela ──────────────────────────────────────────────────────
t = re.sub(r'\s+', ' ', '\n'.join((p.extract_text() or '') for p in PdfReader(sys.argv[1]).pages))
rx = re.compile(r'FASE (\d) ?- ?\w+ QUADRA (\d+) (\d+) ([\d.,]+) m² (RESIDENCIAL|COMERCIAL|MISTO) (.*?)'
                r'Disponível R\$ ([\d.,]+) R\$ ([\d.,]+) R\$ ([\d.,]+)')
novo = {}
for m in rx.finditer(t):
    novo[(B[int(m.group(1))], str(int(m.group(2))), str(int(m.group(3))))] = dict(
        m2=num(m.group(4)), tipo=m.group(5),
        total=num(m.group(7)), ato=num(m.group(8)), mensal=num(m.group(9)))
assert len(novo) == t.count('QUADRA'), ('linhas nao lidas', len(novo), t.count('QUADRA'))

# ── a tabela so entra se a aritmetica fechar ─────────────────────────
ruins = []
for k, d in novo.items():
    esperado = round((d['total'] - d['ato']) * FATOR, 2)
    pct = d['ato'] / d['total'] * 100
    if abs(esperado - d['mensal']) > 0.02 or abs(pct - 12) > 0.05:
        ruins.append((k, d['mensal'], esperado, pct))
if ruins:
    print('PAROU: %d de %d lotes nao fecham com Price 1%% a.m. / ato 12%%.' % (len(ruins), len(novo)))
    for k, pub, esp, pct in ruins[:5]:
        print('   %s Q%s L%s: mensal R$ %.2f, devida R$ %.2f (%.0f%%); ato %.2f%%'
              % (k[0].replace('zarah-', ''), k[1], k[2], pub, esp, pub / esp * 100, pct))
    print('\nNao publicar; pedir a tabela de novo.')
    sys.exit(1)
print('tabela conferida: %d lotes, mensal = Price 1%% a.m. e ato = 12%%, centavo a centavo' % len(novo))

# ── le o mapa ────────────────────────────────────────────────────────
s = io.open(P, encoding='utf-8', newline='').read()
assert '\r' not in s, 'arquivo com CRLF'
linhas, ll = {}, {}
for m in re.finditer(r"^ *\{ b:'(zarah-\w+)', q:'(\d+)', l:'(\d+)'[^\n]*\n", s, re.M):
    k = (m.group(1), m.group(2), m.group(3))
    assert k not in linhas, ('lote repetido no mapa', k)
    linhas[k] = m.group(0)
    g = re.search(r'll:\[([-\d.]+),([-\d.]+)\]', m.group(0))
    if g: ll[k] = (float(g.group(1)), float(g.group(2)))

ordem = lambda k: (k[0], int(k[1]), int(k[2]))
nome = lambda k: '%s Q%s L%s' % (k[0].replace('zarah-', ''), k[1], k[2])
saem = sorted(set(linhas) - set(novo), key=ordem)
entram = sorted(set(novo) - set(linhas), key=ordem)
print('tabela %d | mapa %d | saem %d | entram %d | sem pino hoje %d'
      % (len(novo), len(linhas), len(saem), len(entram), len(linhas) - len(ll)))


# ── linha padronizada ────────────────────────────────────────────────
def fmt(v):
    return ('%.2f' % v).rstrip('0').rstrip('.') if v != int(v) else str(int(v))


def linha(k, pos, indent='  '):
    d = novo[k]
    c = ("{ b:'%s', q:'%s', l:'%s', m2:%.2f, tipo:'%s', pm2:%s, vista:%.2f, entrada:%.2f, "
         "parcela:%.2f, nx:%d, ep:%d" % (k[0], k[1], k[2], d['m2'], d['tipo'],
                                         fmt(round(d['total'] / d['m2'], 2)),
                                         d['total'], d['ato'], d['mensal'], N, 12))
    if pos: c += ', ll:[%.6f,%.6f]' % pos
    c += ', tabela:true, obs:%s }' % repr(OBS).replace('"', "'")
    return indent + c + ',\n'


# ── o que mudou nos que ficam ────────────────────────────────────────
def campo(txt, nm):
    g = re.search(r'\b' + nm + r':([\d.]+)', txt)
    return float(g.group(1)) if g else None


mudaram = {}
for k in sorted(set(novo) & set(linhas), key=ordem):
    d, atual = novo[k], linhas[k]
    dif = [(nm, campo(atual, nm), val) for nm, val in
           (('vista', d['total']), ('entrada', d['ato']), ('parcela', d['mensal']), ('m2', d['m2']))
           if campo(atual, nm) is None or abs(campo(atual, nm) - val) > 0.01]
    tipo = re.search(r"tipo:'(\w+)'", atual).group(1)
    if tipo != d['tipo']: dif.append(('tipo', tipo, d['tipo']))
    if dif: mudaram[k] = dif
if mudaram:
    print('\nMUDARAM (%d lotes) — confira antes de publicar:' % len(mudaram))
    for k in list(mudaram)[:12]:
        print('   %s  %s' % (nome(k), '; '.join('%s %s -> %s' % x for x in mudaram[k])))
    if len(mudaram) > 12: print('   … e mais %d' % (len(mudaram) - 12))
else:
    print('nenhum preco, ato, mensal, area ou tipo mudou nos %d que ficam' % len(set(novo) & set(linhas)))


# ── posicao dos que entram ───────────────────────────────────────────
def metros(a, b):
    lat = math.radians((a[0] + b[0]) / 2)
    return math.hypot((a[0] - b[0]) * 111320, (a[1] - b[1]) * 111320 * math.cos(lat))


def rumo(a, b): return math.degrees(math.atan2(b[1] - a[1], b[0] - a[0]))


def pelos_vizinhos(k):
    """Entre os vizinhos numericos da mesma quadra, ou uma casa alem da ponta da fila."""
    b, q, l = k[0], k[1], int(k[2])
    pts = sorted(((int(kk[2]), v) for kk, v in ll.items() if kk[0] == b and kk[1] == q), key=lambda x: x[0])
    ant = [p for p in pts if p[0] < l]; dep = [p for p in pts if p[0] > l]
    if not ant or not dep:
        fila = pts if not ant else pts[::-1]
        if len(fila) < 3: return None, 'vizinhos de menos na quadra %s' % q
        (n0, p0), (n1, p1), (n2, p2) = fila[0], fila[1], fila[2]
        if abs(l - n0) > 1: return None, 'longe demais da ponta da quadra %s' % q
        d1 = metros(p0, p1) / abs(n1 - n0)
        d2 = metros(p1, p2) / abs(n2 - n1)
        if abs(((rumo(p1, p0) - rumo(p2, p1) + 180) % 360) - 180) > 12:
            return None, 'a ponta da quadra %s dobra' % q
        if not (0.6 * d2 <= d1 <= 1.6 * d2):
            return None, 'espacamento irregular na ponta da quadra %s' % q
        passo = ((p0[0] - p1[0]) / abs(n1 - n0), (p0[1] - p1[1]) / abs(n1 - n0))
        return ((p0[0] + passo[0], p0[1] + passo[1]), 'uma casa alem do %d (%.1f m/lote)' % (n0, d1))
    n0, p0 = ant[-1]; n1, p1 = dep[0]
    d = metros(p0, p1) / (n1 - n0)
    r = rumo(p0, p1)
    refs = [(metros(pts[i - 1][1], pts[i][1]) / (pts[i][0] - pts[i - 1][0]), rumo(pts[i - 1][1], pts[i][1]))
            for i in range(1, len(pts)) if pts[i][0] <= n0 or pts[i - 1][0] >= n1]
    if not refs: return None, 'sem trecho de referencia'
    dref = sorted(x[0] for x in refs)[len(refs) // 2]
    if not [x for x in refs if abs(((x[1] - r + 180) % 360) - 180) < 12]:
        return None, 'o vao dobra esquina (rumo %.0f graus)' % r
    if not (0.6 * dref <= d <= 1.6 * dref):
        return None, 'espacamento irregular (%.1f m/lote contra %.1f)' % (d, dref)
    f = (l - n0) / (n1 - n0)
    return ((p0[0] + f * (p1[0] - p0[0]), p0[1] + f * (p1[1] - p0[1])), 'entre %d e %d (%.1f m/lote)' % (n0, n1, d))


def posicao(k):
    calc, porque = pelos_vizinhos(k)
    velho = PINO_ANTERIOR.get(k)
    if not velho:
        return calc, porque
    ocupado = [kk for kk, v in ll.items() if metros(v, velho) < 1.0]
    if ocupado:
        return None, 'a posicao anterior esta ocupada por %s' % nome(ocupado[0])
    if not calc:
        return None, 'posicao anterior sem como conferir pelos vizinhos (%s)' % porque
    dist = metros(velho, calc)
    if dist > TOLERANCIA_M:
        return None, 'posicao anterior a %.1f m da calculada pelos vizinhos' % dist
    return velho, 'posicao que o lote ja tinha no mapa; pelos vizinhos (%s) cai a %.1f m dela' % (porque, dist)


novas = {}
if entram:
    print('\nENTRAM:')
    for k in entram:
        pos, porque = posicao(k)
        d = novo[k]
        print('   %s  %.2f m² %s  R$ %.2f  -> %s' % (
            nome(k), d['m2'], d['tipo'], d['total'], ('pino: %s' % porque) if pos else ('SEM PINO: ' + porque)))
        novas[k] = linha(k, pos)
print('\nSAEM: %s' % (', '.join(nome(k) for k in saem) or '-'))

if '--gravar' not in sys.argv:
    print('\n(conferencia apenas — rode com --gravar para aplicar)')
    for k in novas: print('linha que entraria:\n' + novas[k].rstrip())
    sys.exit(0)

# ── grava ────────────────────────────────────────────────────────────
for k in saem:
    assert s.count(linhas[k]) == 1, ('linha nao unica', k)
    s = s.replace(linhas[k], '', 1)
    del linhas[k]
for k in mudaram:
    ind = re.match(r' *', linhas[k]).group(0)
    nova = linha(k, ll.get(k), '  ' if len(ind) > 2 else ind)
    s = s.replace(linhas[k], nova, 1)
    linhas[k] = nova
for k in sorted(novas, key=ordem):
    # depois do lote de numero imediatamente anterior na mesma quadra; sem anterior,
    # antes do primeiro da quadra; quadra vazia, no fim do bloco da fase.
    irmaos = sorted((int(kk[2]), kk) for kk in linhas if kk[0] == k[0] and kk[1] == k[1])
    ant = [kk for n, kk in irmaos if n < int(k[2])]
    if ant:
        ancora = linhas[ant[-1]]; s = s.replace(ancora, ancora + novas[k], 1)
    elif irmaos:
        ancora = linhas[irmaos[0][1]]; s = s.replace(ancora, novas[k] + ancora, 1)
    else:
        ancora = linhas[sorted((kk for kk in linhas if kk[0] == k[0]), key=ordem)[-1]]
        s = s.replace(ancora, ancora + novas[k], 1)
    linhas[k] = novas[k]

# rotulo da tabela no comentario que abre cada fase
s = s.replace(ROTULO_DE, ROTULO_PARA)

io.open(P, 'w', encoding='utf-8', newline='').write(s)

# ── confere o que ficou gravado ──────────────────────────────────────
s2 = io.open(P, encoding='utf-8', newline='').read()
gravadas = re.findall(r"^ *\{ b:'zarah-\w+'[^\n]*\n", s2, re.M)
assert len(gravadas) == len(novo), ('contagem final', len(gravadas), len(novo))
assert not [g for g in gravadas if 'vista:' not in g], 'linha sem vista: apareceria como sob consulta'
for g in gravadas:
    k = re.match(r" *\{ b:'(zarah-\w+)', q:'(\d+)', l:'(\d+)'", g).groups()
    d = novo[k]
    assert abs(campo(g, 'vista') - d['total']) < 0.01 and abs(campo(g, 'parcela') - d['mensal']) < 0.01, ('valor', k)
v = [campo(g, 'vista') for g in gravadas]
pr = [campo(g, 'parcela') for g in gravadas]
por_fase = {b: sum(1 for g in gravadas if "b:'%s'" % b in g) for b in B.values()}
print('\ngravado: %d lotes (%s) | piso R$ %.2f | teto R$ %.2f | menor parcela R$ %.2f | sem pino %d'
      % (len(gravadas), ', '.join('%s %d' % (b.replace('zarah-', ''), n) for b, n in por_fase.items()),
         min(v), max(v), min(pr), sum(1 for g in gravadas if 'll:[' not in g)))
print('agora: BAIRROS (tab/sub, a mao) e gera-lista-indexavel.py.')
