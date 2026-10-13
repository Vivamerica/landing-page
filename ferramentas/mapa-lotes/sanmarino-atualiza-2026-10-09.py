# -*- coding: utf-8 -*-
# Terras de San Marino: aplica ao mapa a "Tabela e Espelho de Vendas (Lotes
# Disponiveis)" — escrito para o espelho de 09/10/2026 e serve para os proximos,
# enquanto o formato da folha for o mesmo.
#
# Faz, pelos motivos de sempre:
#   - a tabela so entra se a aritmetica fechar em todas as linhas: a vista e a
#     prazo = area x o valor do m2 impresso no cabecalho; entrada = o percentual do
#     cabecalho sobre o valor a prazo; saldo = a prazo - entrada; 12x = saldo / 12;
#     24 a 60x = Tabela Price a 1% a.m.;
#   - tira do mapa quem sumiu do espelho;
#   - reescreve a linha de quem mudou de preco, area ou condicao, preservando a
#     posicao ja conferida;
#   - quem ENTRA entra SEM pino. Este loteamento nao tem posicao por lote guardada
#     (nao existe sanmarino-quadras.json), e extrapolar pela fila da quadra seria
#     chutar: o lote aparece na lista e na contagem, e a posicao se marca depois no
#     editor de pinos, sobre a planta.
#
# O espelho nao traz coluna de uso. O lote novo herda o tipo dos lotes da mesma
# quadra que ja estao no mapa; quadra sem lote no mapa faz o script parar.
#
# A parcela gravada e a de 60x, que e a que o mapa mostra (nx:60).
#
# Uso: python sanmarino-atualiza-2026-10-09.py <espelho.pdf> [--gravar]
import io, re, sys
from decimal import Decimal, ROUND_HALF_UP
from pypdf import PdfReader
sys.stdout.reconfigure(encoding='utf-8')

P = 'C:/Users/Usuario/Desktop/landing-page/mapa-lotes-indaiatuba/index.html'
BAIRRO = 'sanmarino'
NX = 60
PRAZOS = (24, 36, 48, 60)                 # com juros; 12x e sem juros
JUROS = Decimal('0.01')
D = lambda v: Decimal(v.replace('.', '').replace(',', '.'))
c2 = lambda v: v.quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)

# ── le o espelho ─────────────────────────────────────────────────────
txt = '\n'.join((p.extract_text() or '') for p in PdfReader(sys.argv[1]).pages)
cab = re.search(r'([\d.]+,\d\d)\s*R\$\s*([\d.]+,\d\d)\s*R\$\s*(\d+)%', txt)
assert cab, 'cabecalho com o valor do m2 a vista, a prazo e o percentual de entrada nao encontrado'
PM2_VISTA, PM2_PRAZO, PCT = D(cab.group(1)), D(cab.group(2)), Decimal(cab.group(3))
dt = re.search(r'\b(\d{2})/(\d{2})/(\d{2,4})\s+\d{2}:\d{2}', txt)
assert dt, 'data do espelho nao encontrada'
DATA = '%s/%s/%s' % (dt.group(1), dt.group(2), dt.group(3) if len(dt.group(3)) == 4 else '20' + dt.group(3))

VAL = r'\s*R\$\s*([\d.]+,\d\d)'
rx = re.compile(r'^([A-Z]\d?)\s+(\d+)\s+([\d.]+,\d\d)' + VAL * 9 + r'\s*$', re.M)
novo = {}
for m in rx.finditer(txt):
    g = m.groups()
    k = (g[0], str(int(g[1])))
    assert k not in novo, ('lote repetido no espelho', k)
    novo[k] = dict(m2=D(g[2]), vista=D(g[3]), prazo=D(g[4]), entrada=D(g[5]), saldo=D(g[6]),
                   x12=D(g[7]), x24=D(g[8]), x36=D(g[9]), x48=D(g[10]), x60=D(g[11]))
candidatas = [l for l in txt.split('\n') if l.count('R$') >= 9]
assert len(novo) == len(candidatas), ('linhas nao lidas', len(novo), len(candidatas))
assert novo, 'nenhum lote lido'
print('espelho de %s: %d lotes | m2 a vista R$ %s, a prazo R$ %s, entrada %s%%'
      % (DATA, len(novo), PM2_VISTA, PM2_PRAZO, PCT))

# ── a tabela so entra se a aritmetica fechar ─────────────────────────
def price(saldo, n):
    f = JUROS / (1 - (1 + JUROS) ** -n)
    return c2(saldo * f)


ruins = []
for k, d in novo.items():
    contas = [('a vista', d['vista'], c2(d['m2'] * PM2_VISTA)), ('a prazo', d['prazo'], c2(d['m2'] * PM2_PRAZO)),
              ('entrada', d['entrada'], c2(d['prazo'] * PCT / 100)), ('saldo', d['saldo'], d['prazo'] - d['entrada']),
              ('12x', d['x12'], c2(d['saldo'] / 12))]
    contas += [('%dx' % n, d['x%d' % n], price(d['saldo'], n)) for n in PRAZOS]
    ruins += [(k, nm, lido, devido) for nm, lido, devido in contas if abs(lido - devido) > Decimal('0.01')]
if ruins:
    print('PAROU: %d valor(es) nao fecham com o cabecalho / Price de 1%% a.m.:' % len(ruins))
    for k, nm, lido, devido in ruins[:8]:
        print('   %s-%s %s: impresso %s, devido %s' % (k[0], k[1], nm, lido, devido))
    print('\nNao publicar; confirmar a tabela com a loteadora.')
    sys.exit(1)
print('aritmetica conferida: %d lotes x 9 valores, centavo a centavo' % len(novo))

# ── le o mapa ────────────────────────────────────────────────────────
s = io.open(P, encoding='utf-8', newline='').read()
assert '\r' not in s, 'arquivo com CRLF'
linhas, tipo_quadra = {}, {}
for m in re.finditer(r"^ *\{ b:'%s', q:'([^']+)', l:'(\d+)'[^\n]*\n" % BAIRRO, s, re.M):
    k = (m.group(1), m.group(2))
    assert k not in linhas, ('lote repetido no mapa', k)
    linhas[k] = m.group(0)
    tipo_quadra.setdefault(k[0], set()).add(re.search(r"tipo:'(\w+)'", m.group(0)).group(1))
assert linhas, 'nao achei nenhum lote de %s no mapa' % BAIRRO

ordem = lambda k: (k[0], int(k[1]))
saem = sorted(set(linhas) - set(novo), key=ordem)
entram = sorted(set(novo) - set(linhas), key=ordem)
print('mapa: %d | saem %d | entram %d | sem pino hoje %d'
      % (len(linhas), len(saem), len(entram), sum(1 for l in linhas.values() if 'll:[' not in l)))


def campo(linha, nome):
    g = re.search(r'\b' + nome + r':([\d.]+)', linha)
    return Decimal(g.group(1)) if g else None


def monta(k, tipo, pino, indent='  '):
    d = novo[k]
    t = ("{ b:'%s', q:'%s', l:'%s', m2:%.2f, tipo:'%s', pm2:%d, vista:%.2f, prazo:%.2f, entrada:%.2f, "
         "parcela:%.2f, nx:%d, ep:%d" % (BAIRRO, k[0], k[1], d['m2'], tipo, round(d['vista'] / d['m2']),
                                         d['vista'], d['prazo'], d['entrada'], d['x%d' % NX], NX,
                                         round(d['entrada'] / d['prazo'] * 100)))
    if pino: t += ', ' + pino
    return indent + t + ' },\n'


# ── o que mudou nos que ficam ────────────────────────────────────────
mudaram = {}
for k in sorted(set(novo) & set(linhas), key=ordem):
    d = novo[k]
    dif = [(nm, campo(linhas[k], nm), val) for nm, val in
           (('m2', d['m2']), ('vista', d['vista']), ('prazo', d['prazo']), ('entrada', d['entrada']),
            ('parcela', d['x%d' % NX]), ('nx', Decimal(NX)))
           if campo(linhas[k], nm) is None or abs(campo(linhas[k], nm) - val) > Decimal('0.01')]
    if dif: mudaram[k] = dif
if mudaram:
    print('\nMUDARAM (%d lotes):' % len(mudaram))
    for k in mudaram:
        print('   %s-%s  %s' % (k[0], k[1], '; '.join('%s %s -> %s' % x for x in mudaram[k])))
else:
    print('nenhum preco, condicao ou metragem mudou nos %d que ficam' % len(set(novo) & set(linhas)))

# ── quem entra: sem pino, com o tipo da quadra ───────────────────────
novas = {}
if entram:
    print('\nENTRAM (sem pino — posicao a marcar no editor de pinos):')
    for k in entram:
        tipos = tipo_quadra.get(k[0], set())
        if len(tipos) != 1:
            print('PAROU: nao ha como saber o tipo do lote %s-%s (quadra %s no mapa: %s).'
                  % (k[0], k[1], k[0], ', '.join(sorted(tipos)) or 'sem lote'))
            sys.exit(1)
        tipo = next(iter(tipos))
        d = novo[k]
        print('   %s-%s  %s m² %s  R$ %s a vista | R$ %s a prazo, entrada R$ %s, %dx de R$ %s'
              % (k[0], k[1], d['m2'], tipo, d['vista'], d['prazo'], d['entrada'], NX, d['x%d' % NX]))
        novas[k] = monta(k, tipo, None)
print('\nSAEM: %s' % (', '.join('%s-%s' % k for k in saem) or '-'))

if '--gravar' not in sys.argv:
    print('\n(conferencia apenas — rode com --gravar para aplicar)')
    sys.exit(0)

# ── grava ────────────────────────────────────────────────────────────
for k in saem:
    assert s.count(linhas[k]) == 1, ('linha nao unica', k)
    s = s.replace(linhas[k], '', 1)
    del linhas[k]
for k in mudaram:
    pino = re.search(r'll:\[[-\d.,]+\]', linhas[k])
    nova = monta(k, re.search(r"tipo:'(\w+)'", linhas[k]).group(1), pino.group(0) if pino else None,
                 re.match(r' *', linhas[k]).group(0))
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

# data do espelho no comentario que abre o bloco
s, n = re.subn(r'(// Terras de San Marino — espelho de vendas de )\d{2}/\d{2}/\d{4}', lambda m: m.group(1) + DATA, s)
assert n == 1, ('comentario do bloco', n)

io.open(P, 'w', encoding='utf-8', newline='').write(s)

# ── confere o que ficou gravado ──────────────────────────────────────
gr = re.findall(r"^ *\{ b:'%s'[^\n]*\n" % BAIRRO, io.open(P, encoding='utf-8', newline='').read(), re.M)
assert len(gr) == len(novo), ('contagem final', len(gr), len(novo))
for g in gr:
    k = re.match(r" *\{ b:'%s', q:'([^']+)', l:'(\d+)'" % BAIRRO, g).groups()
    d = novo[k]
    assert campo(g, 'vista') == d['vista'] and campo(g, 'prazo') == d['prazo'], ('valor', k)
    assert campo(g, 'entrada') == d['entrada'] and campo(g, 'parcela') == d['x%d' % NX], ('condicao', k)
v = [campo(g, 'vista') for g in gr]
print('\ngravado: %d lotes | piso R$ %s | teto R$ %s | sem pino %d'
      % (len(gr), min(v), max(v), sum(1 for g in gr if 'll:[' not in g)))
print('agora: BAIRROS (tab/sub, a mao) e gera-lista-indexavel.py.')
