# -*- coding: utf-8 -*-
# Ville de Provence: aplica ao mapa a "Tabela Ville de Provence 1770" — escrito para
# a tabela de outubro/2026 (documento de 03/10/2026). A tabela nao traz data
# impressa: o mes e a data do documento ficam nas constantes abaixo e sao trocados
# a cada rodada.
#
# Faz, pelos motivos de sempre:
#   - a tabela so entra se a aritmetica fechar em todas as linhas: valor = area x o
#     valor do m2 do cabecalho; sinal = o percentual do cabecalho; 12x = saldo / 12;
#     24 a 96x = Tabela Price com os juros da nota da tabela;
#   - tira do mapa quem sumiu da tabela;
#   - reescreve a linha de quem mudou de preco, area ou condicao, preservando a
#     posicao ja conferida;
#   - atualiza o mes da tabela no texto (obs) de cada lote.
#
# Lote que ENTRA ganha pino nesta ordem:
#   1. a posicao que ele tinha na leitura de setembro, guardada em
#      villeprovence-reinsere.py — so se a moldura nao mudou desde entao (todo lote
#      que esta la e no mapa de hoje continua no mesmo ponto), se o ponto esta livre
#      e se a distancia ao vizinho de numero seguinte ou anterior e a de um lote;
#   2. senao, pelos vizinhos numericos da MESMA quadra: ponto entre os dois lados,
#      ou UMA casa alem da ponta da fila, e so em trecho reto e de espacamento
#      regular;
#   3. senao entra SEM pino: aparece na lista e na contagem, nao no desenho.
#
# A tabela nao traz coluna de uso: o lote novo herda o tipo dos lotes da mesma
# quadra que ja estao no mapa (ou o que tinha na leitura de setembro).
#
# A parcela gravada e a de 96x, que e a que o mapa mostra (nx:96).
#
# Uso: python villeprovence-atualiza-2026-10-03.py <tabela.pdf> [--gravar]
import io, math, os, re, sys
from decimal import Decimal, ROUND_HALF_UP
from pypdf import PdfReader
sys.stdout.reconfigure(encoding='utf-8')

AQUI = os.path.dirname(os.path.abspath(__file__))
P = 'C:/Users/Usuario/Desktop/landing-page/mapa-lotes-indaiatuba/index.html'
BAIRRO = 'villeprovence'
MES = 'out/2026'                          # mes da tabela, como o mapa mostra
DOCUMENTO = '03/10/2026'                  # data do documento recebido
NX = 96
PRAZOS = (24, 36, 48, 60, 72, 84, 96)     # com juros; 12x e sem juros
OBS = ("Valor de tabela Urban Square de %s (R$ %%s/m²): sinal de %%d%%%% e saldo em até 12x sem juros, "
       "ou de 24 a 96x com juros de %%s%%%% a.m. e IPCA" % MES)
D = lambda v: Decimal(v.replace('.', '').replace(',', '.'))
c2 = lambda v: v.quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)
milhar = lambda v: '{:,.0f}'.format(v).replace(',', '.')

# ── le a tabela ──────────────────────────────────────────────────────
t = re.sub(r'\s+', ' ', '\n'.join((p.extract_text() or '') for p in PdfReader(sys.argv[1]).pages))
cab = re.search(r'Valor Metro Quadrado \(m²\) R\$ ([\d.]+,\d\d) Ato \((\d+)%\)', t)
assert cab, 'cabecalho com o valor do m2 e o percentual do ato nao encontrado'
PM2, PCT = D(cab.group(1)), Decimal(cab.group(2))
jr = re.search(r'juros nominais de (\d+,\d+)%', t)
assert jr, 'nota com os juros nao encontrada'
JUROS_PCT = jr.group(1)
JUROS = D(JUROS_PCT) / 100

VAL = r' R\$ ([\d.]+,\d\d)'
rx = re.compile(r'(?<![\w,.])([A-Z]\d?) (\d+) ([\d.]+,\d\d) m²' + VAL * 10)
novo = {}
for m in rx.finditer(t):
    g = m.groups()
    k = (g[0], str(int(g[1])))
    assert k not in novo, ('lote repetido na tabela', k)
    novo[k] = dict(m2=D(g[2]), vgv=D(g[3]), sinal=D(g[4]), x12=D(g[5]),
                   **{'x%d' % n: D(g[6 + i]) for i, n in enumerate(PRAZOS)})
n_areas = len(re.findall(r'\d,\d\d m² R\$', t))
assert len(novo) == n_areas, ('linhas nao lidas', len(novo), n_areas)
assert novo, 'nenhum lote lido'
print('tabela de %s (documento de %s): %d lotes em %d quadras | R$ %s/m², ato %s%%, juros %s%% a.m.'
      % (MES, DOCUMENTO, len(novo), len({k[0] for k in novo}), PM2, PCT, JUROS_PCT))

# ── a tabela so entra se a aritmetica fechar ─────────────────────────
def price(saldo, n):
    return c2(saldo * JUROS / (1 - (1 + JUROS) ** -n))


ruins = []
for k, d in novo.items():
    saldo = d['vgv'] - d['sinal']
    contas = [('valor', d['vgv'], c2(d['m2'] * PM2)), ('sinal', d['sinal'], c2(d['vgv'] * PCT / 100)),
              ('12x', d['x12'], c2(saldo / 12))]
    contas += [('%dx' % n, d['x%d' % n], price(saldo, n)) for n in PRAZOS]
    ruins += [(k, nm, lido, devido) for nm, lido, devido in contas if abs(lido - devido) > Decimal('0.01')]
if ruins:
    print('PAROU: %d valor(es) nao fecham com o cabecalho / Price de %s%% a.m.:' % (len(ruins), JUROS_PCT))
    for k, nm, lido, devido in ruins[:8]:
        print('   %s-%s %s: impresso %s, devido %s' % (k[0], k[1], nm, lido, devido))
    print('\nNao publicar; confirmar a tabela com a loteadora.')
    sys.exit(1)
print('aritmetica conferida: %d lotes x 10 valores, centavo a centavo' % len(novo))

# ── le o mapa e a leitura de setembro ────────────────────────────────
RX_LOTE = r"\{ b:'%s', q:'([^']+)', l:'(\d+)'([^{}\n]*)\}" % BAIRRO


def pino_de(txt):
    g = re.search(r'll:\[([-\d.]+),([-\d.]+)\]', txt)
    return (float(g.group(1)), float(g.group(2))) if g else None


s = io.open(P, encoding='utf-8', newline='').read()
assert '\r' not in s, 'arquivo com CRLF'
linhas, ll, tipo_quadra = {}, {}, {}
for m in re.finditer(r"^ *\{ b:'%s', q:'([^']+)', l:'(\d+)'[^\n]*\n" % BAIRRO, s, re.M):
    k = (m.group(1), m.group(2))
    assert k not in linhas, ('lote repetido no mapa', k)
    linhas[k] = m.group(0)
    if pino_de(m.group(0)): ll[k] = pino_de(m.group(0))
    tipo_quadra.setdefault(k[0], set()).add(re.search(r"tipo:'(\w+)'", m.group(0)).group(1))
assert linhas, 'nao achei nenhum lote de %s no mapa' % BAIRRO

foto_txt = io.open(os.path.join(AQUI, 'villeprovence-reinsere.py'), encoding='utf-8', newline='').read()
foto_ll, foto_tipo = {}, {}
for m in re.finditer(RX_LOTE, foto_txt):
    k = (m.group(1), m.group(2))
    if pino_de(m.group(3)): foto_ll[k] = pino_de(m.group(3))
    foto_tipo[k] = re.search(r"tipo:'(\w+)'", m.group(3)).group(1)

ordem = lambda k: (k[0], int(k[1]))
saem = sorted(set(linhas) - set(novo), key=ordem)
entram = sorted(set(novo) - set(linhas), key=ordem)
print('mapa: %d | saem %d | entram %d | sem pino hoje %d'
      % (len(linhas), len(saem), len(entram), len(linhas) - len(ll)))


def campo(linha, nome):
    g = re.search(r'\b' + nome + r':([\d.]+)', linha)
    return Decimal(g.group(1)) if g else None


def monta(k, tipo, pos, indent='  '):
    d = novo[k]
    obs = OBS % (milhar(PM2), PCT, JUROS_PCT)
    c = ("{ b:'%s', q:'%s', l:'%s', m2:%.2f, tipo:'%s', pm2:%d, vista:%.2f, entrada:%.2f, parcela:%.2f, "
         "nx:%d, ep:%d" % (BAIRRO, k[0], k[1], d['m2'], tipo, round(d['vgv'] / d['m2']),
                           d['vgv'], d['sinal'], d['x%d' % NX], NX, round(d['sinal'] / d['vgv'] * 100)))
    if pos: c += ', ll:[%.6f,%.6f]' % pos
    return indent + c + ", tabela:true, obs:'%s' },\n" % obs


# ── o que mudou nos que ficam ────────────────────────────────────────
mudaram = {}
for k in sorted(set(novo) & set(linhas), key=ordem):
    d = novo[k]
    dif = [(nm, campo(linhas[k], nm), val) for nm, val in
           (('m2', d['m2']), ('vista', d['vgv']), ('entrada', d['sinal']), ('parcela', d['x%d' % NX]),
            ('nx', Decimal(NX)))
           if campo(linhas[k], nm) is None or abs(campo(linhas[k], nm) - val) > Decimal('0.01')]
    if dif: mudaram[k] = dif
if mudaram:
    print('\nMUDARAM (%d lotes):' % len(mudaram))
    for k in list(mudaram)[:12]:
        print('   %s-%s  %s' % (k[0], k[1], '; '.join('%s %s -> %s' % x for x in mudaram[k])))
    if len(mudaram) > 12: print('   … e mais %d' % (len(mudaram) - 12))
else:
    print('nenhum preco, condicao ou metragem mudou nos %d que ficam' % len(set(novo) & set(linhas)))


# ── posicao dos que entram ───────────────────────────────────────────
def metros(a, b):
    lat = math.radians((a[0] + b[0]) / 2)
    return math.hypot((a[0] - b[0]) * 111320, (a[1] - b[1]) * 111320 * math.cos(lat))


def rumo(a, b): return math.degrees(math.atan2(b[1] - a[1], b[0] - a[0]))


comuns = [k for k in foto_ll if k in ll]
moveu = [k for k in comuns if metros(foto_ll[k], ll[k]) > 0.2]
print('leitura de setembro: %d lotes com pino | em comum com o mapa %d | fora do lugar %d'
      % (len(foto_ll), len(comuns), len(moveu)))


def pela_leitura_anterior(k):
    velho = foto_ll.get(k)
    if not velho: return None, 'nao estava na leitura de setembro'
    if moveu or len(comuns) < 20: return None, 'a moldura mudou desde a leitura de setembro'
    perto = [kk for kk, v in ll.items() if metros(v, velho) < 3.0]
    if perto: return None, 'o ponto anterior esta ocupado por %s-%s' % perto[0]
    q, l = k[0], int(k[1])
    for a, b in ((l + 1, l + 2), (l - 1, l - 2)):          # vizinho de numero seguinte, depois o anterior
        pa, pb = ll.get((q, str(a))), ll.get((q, str(b)))
        if pa and pb:
            d, ref = metros(velho, pa), metros(pa, pb)
            if 0.6 * ref <= d <= 1.6 * ref:
                return velho, 'posicao da leitura de setembro; a %.1f m do %s-%d (lotes vizinhos a %.1f m)' % (d, q, a, ref)
            return None, 'ponto anterior a %.1f m do %s-%d, fora do passo da quadra (%.1f m)' % (d, q, a, ref)
    return None, 'ponto anterior sem vizinho de numero seguido para conferir'


def pelos_vizinhos(k):
    q, l = k[0], int(k[1])
    pts = sorted(((int(kk[1]), v) for kk, v in ll.items() if kk[0] == q), key=lambda x: x[0])
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


novas = {}
if entram:
    print('\nENTRAM:')
    for k in entram:
        tipos = tipo_quadra.get(k[0], set())
        tipo = next(iter(tipos)) if len(tipos) == 1 else foto_tipo.get(k)
        if not tipo:
            print('PAROU: nao ha como saber o tipo do lote %s-%s.' % k)
            sys.exit(1)
        pos, porque = pela_leitura_anterior(k)
        if not pos:
            pos, porque2 = pelos_vizinhos(k)
            porque = porque2 if pos else '%s; %s' % (porque, porque2)
        d = novo[k]
        print('   %s-%s  %s m² %s  R$ %s  -> %s' % (k[0], k[1], d['m2'], tipo, d['vgv'],
                                                    ('pino: ' + porque) if pos else ('SEM PINO: ' + porque)))
        novas[k] = monta(k, tipo, pos)
print('\nSAEM: %s' % (', '.join('%s-%s' % k for k in saem) or '-'))

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
    nova = monta(k, re.search(r"tipo:'(\w+)'", linhas[k]).group(1), ll.get(k), '  ')
    s = s.replace(linhas[k], nova, 1)
    linhas[k] = nova
for k in sorted(novas, key=ordem):
    # depois do lote de numero imediatamente anterior na mesma quadra; sem anterior,
    # antes do primeiro da quadra; quadra vazia, no fim do bloco.
    irmaos = sorted((int(kk[1]), kk) for kk in linhas if kk[0] == k[0])
    ant = [kk for n, kk in irmaos if n < int(k[1])]
    if ant:
        ancora = linhas[ant[-1]]; s = s.replace(ancora, ancora + novas[k], 1)
    elif irmaos:
        ancora = linhas[irmaos[0][1]]; s = s.replace(ancora, novas[k] + ancora, 1)
    else:
        ancora = linhas[sorted(linhas, key=ordem)[-1]]; s = s.replace(ancora, ancora + novas[k], 1)
    linhas[k] = novas[k]

# mes da tabela no texto de cada lote que ficou (a linha nova ja nasce com ele)
obs_nova = "obs:'%s'" % (OBS % (milhar(PM2), PCT, JUROS_PCT))
trocadas = 0
for k in sorted(linhas, key=ordem):
    nova = re.sub(r"obs:'[^']*'", lambda m: obs_nova, linhas[k])
    if nova != linhas[k]:
        assert s.count(linhas[k]) == 1, ('linha nao unica', k)
        s = s.replace(linhas[k], nova, 1); linhas[k] = nova; trocadas += 1

# rotulo da tabela no comentario que abre o bloco
s, n = re.subn(r'(// Ville de Provence \(Urban Square\) — tabela )[^;\n]*(;)',
               lambda m: '%s%s de %s (documento de %s)%s' % (m.group(1), milhar(PM2).replace('.', ''), MES, DOCUMENTO, m.group(2)), s)
assert n == 1, ('comentario do bloco', n)

io.open(P, 'w', encoding='utf-8', newline='').write(s)

# ── confere o que ficou gravado ──────────────────────────────────────
gr = re.findall(r"^ *\{ b:'%s'[^\n]*\n" % BAIRRO, io.open(P, encoding='utf-8', newline='').read(), re.M)
assert len(gr) == len(novo), ('contagem final', len(gr), len(novo))
for g in gr:
    k = re.match(r" *\{ b:'%s', q:'([^']+)', l:'(\d+)'" % BAIRRO, g).groups()
    d = novo[k]
    assert campo(g, 'vista') == d['vgv'] and campo(g, 'entrada') == d['sinal'], ('valor', k)
    assert campo(g, 'parcela') == d['x%d' % NX] and obs_nova in g, ('condicao', k)
v = [campo(g, 'vista') for g in gr]
print('\ngravado: %d lotes | piso R$ %s | teto R$ %s | sem pino %d | texto do mes trocado em %d linhas'
      % (len(gr), min(v), max(v), sum(1 for g in gr if 'll:[' not in g), trocadas))
print('agora: BAIRROS (tab/sub/cond, a mao) e gera-lista-indexavel.py.')
