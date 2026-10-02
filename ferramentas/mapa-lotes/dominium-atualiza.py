# -*- coding: utf-8 -*-
# Aplica ao mapa um relatorio "Lotes disponiveis" da Dominium, para QUALQUER
# empreendimento dela. Generaliza o montecarmelo-atualiza.py, que fazia o mesmo
# preso a um bairro so — a leva de 01/10/2026 trouxe sete de uma vez.
#
# Faz, pelos motivos de sempre:
#  · tira do mapa quem sumiu do relatorio (vendido);
#  · acrescenta quem entrou, posicionado por interpolacao entre os vizinhos
#    numericos da MESMA quadra — e so quando o vao e reto e de espacamento
#    regular. Se a quadra dobra esquina ali, o lote entra SEM pino: aparece na
#    lista e na contagem, mas nao no desenho. Pino errado e pior que pino nenhum.
#  · reescreve a linha inteira de quem mudou de preco, condicao ou metragem,
#    preservando a posicao ja conferida.
#
# Por que reescrever a linha em vez de trocar campo a campo: um lote pode passar
# de parcelado para so a vista (e o contrario). Trocando campo a campo sobrariam
# `prazo`/`nx` de uma condicao que nao existe mais.
#
# Uso: python dominium-atualiza.py <bairro> <relatorio.pdf> [--gravar]
import io, json, math, os, re, subprocess, sys
sys.stdout.reconfigure(encoding='utf-8')

AQUI = os.path.dirname(os.path.abspath(__file__))
P = 'C:/Users/Usuario/Desktop/landing-page/mapa-lotes-indaiatuba/index.html'
BAIRRO, PDF = sys.argv[1], sys.argv[2]
TMP = os.environ['TEMP'] + '/dominium-%s.json' % BAIRRO

# ── le o relatorio com o parser que ja existe ────────────────────────
subprocess.run([sys.executable, os.path.join(AQUI, 'dominium-disp.py'), PDF, TMP],
               check=True, stdout=subprocess.DEVNULL)
novo = {(d['q'], str(d['l'])): d for d in json.load(open(TMP))}
print('%s | relatorio: %d lotes' % (BAIRRO, len(novo)))

# ── condicao impossivel no relatorio ─────────────────────────────────
# Em 01/10/2026 o Di Italia F-027 veio com entrada de R$ 440.000,00 num lote de
# R$ 210.000,00 a vista — um zero a mais: todos os lotes iguais trazem R$ 44.000.
# A parcela sairia NEGATIVA. O valor a vista desse lote confere com os irmaos,
# entao o lote fica, mas so a vista: publicamos o que e verificavel e deixamos
# de fora a condicao que o proprio relatorio contradiz. Corrigir para 44.000
# seria inventar numero.
suspeitos = []
for k, d in novo.items():
    if not d.get('nx'):
        continue
    if d['entrada'] >= d['prazo'] or (d['prazo'] - d['entrada']) / d['nx'] <= 0:
        suspeitos.append((k, dict(d)))
        for c in ('nx', 'prazo', 'entrada'):
            d.pop(c, None)
if suspeitos:
    print('\n!! CONDICAO IMPOSSIVEL NO RELATORIO — %d lote(s) entram SO A VISTA:' % len(suspeitos))
    for k, d in suspeitos:
        print('   %s-%s: a vista R$ %.2f, mas entrada R$ %.2f para um a prazo de R$ %.2f (%dx)'
              % (k[0], k[1], d['vista'], d['entrada'], d['prazo'], d['nx']))
    print('   -> confirmar a condicao com a Dominium antes de anunciar parcelamento nesses lotes.')

# ── le o mapa ────────────────────────────────────────────────────────
s = io.open(P, encoding='utf-8', newline='').read()
linhas, ll = {}, {}
for m in re.finditer(r"^ *\{ b:'%s', q:'([^']+)', l:'(\d+)'[^\n]*\n" % re.escape(BAIRRO), s, re.M):
    k = (m.group(1), m.group(2))
    linhas[k] = m.group(0)
    g = re.search(r'll:\[([-\d.]+),([-\d.]+)\]', m.group(0))
    if g: ll[k] = (float(g.group(1)), float(g.group(2)))
assert linhas, 'nao achei nenhum lote de %s no mapa' % BAIRRO

saem = sorted(set(linhas) - set(novo), key=lambda k: (k[0], int(k[1])))
entram = sorted(set(novo) - set(linhas), key=lambda k: (k[0], int(k[1])))
print('mapa: %d | saem %d | entram %d | sem pino hoje %d'
      % (len(linhas), len(saem), len(entram), len(linhas) - len(ll)))


def campo(linha, nome):
    g = re.search(r'\b' + nome + r':([\d.]+)', linha)
    return float(g.group(1)) if g else None


# ── o que mudou nos que ficam ────────────────────────────────────────
mudaram = {}
for k in sorted(set(novo) & set(linhas), key=lambda k: (k[0], int(k[1]))):
    d, linha = novo[k], linhas[k]
    dif = []
    for nome in ('vista', 'prazo', 'entrada', 'nx', 'm2'):
        val, atual = d.get(nome), campo(linha, nome)
        if val is None and atual is None: continue
        if val is None and atual is not None: dif.append((nome, atual, None)); continue
        if val is not None and atual is None: dif.append((nome, None, val)); continue
        if abs(atual - val) > 0.01: dif.append((nome, atual, val))
    if dif: mudaram[k] = dif
if mudaram:
    print('\nMUDARAM (%d lotes):' % len(mudaram))
    for k in list(mudaram)[:12]:
        print('   %s-%s  %s' % (k[0], k[1], '; '.join(
            '%s %s -> %s' % (n, '—' if a is None else '%.2f' % a, '—' if b is None else '%.2f' % b)
            for n, a, b in mudaram[k])))
    if len(mudaram) > 12: print('   … e mais %d' % (len(mudaram) - 12))
else:
    print('nenhum preco, condicao ou metragem mudou nos que ficam')


# ── posicao dos que entram ───────────────────────────────────────────
def rumo(a, b): return math.degrees(math.atan2(b[1] - a[1], b[0] - a[0]))


def posicao(k):
    q, l = k[0], int(k[1])
    pts = sorted(((int(kk[1]), v) for kk, v in ll.items() if kk[0] == q), key=lambda x: x[0])
    ant = [p for p in pts if p[0] < l]; dep = [p for p in pts if p[0] > l]
    if not ant or not dep:
        # ponta da quadra: estende UMA casa, e so se os dois primeiros trechos
        # concordarem em rumo e espacamento (fila reta e regular).
        fila = pts if not ant else pts[::-1]
        if len(fila) < 3: return None, 'vizinhos de menos na quadra %s' % q
        (n0, p0), (n1, p1), (n2, p2) = fila[0], fila[1], fila[2]
        if abs(l - n0) > 1: return None, 'longe demais da ponta da quadra %s' % q
        d1 = math.dist(p0, p1) * 111000 / abs(n1 - n0)
        d2 = math.dist(p1, p2) * 111000 / abs(n2 - n1)
        if abs(((rumo(p1, p0) - rumo(p2, p1) + 180) % 360) - 180) > 12:
            return None, 'a ponta da quadra %s dobra' % q
        if not (0.6 * d2 <= d1 <= 1.6 * d2):
            return None, 'espacamento irregular na ponta da quadra %s' % q
        passo = ((p0[0] - p1[0]) / abs(n1 - n0), (p0[1] - p1[1]) / abs(n1 - n0))
        return ((p0[0] + passo[0] * abs(l - n0), p0[1] + passo[1] * abs(l - n0)),
                'estendido a partir de %d (%.1f m/lote)' % (n0, d1))
    n0, p0 = ant[-1]; n1, p1 = dep[0]
    d = math.dist(p0, p1) * 111000 / (n1 - n0)
    r = rumo(p0, p1)
    refs = [(math.dist(pts[i - 1][1], pts[i][1]) * 111000 / (pts[i][0] - pts[i - 1][0]),
             rumo(pts[i - 1][1], pts[i][1]))
            for i in range(1, len(pts)) if pts[i][0] <= n0 or pts[i - 1][0] >= n1]
    if not refs: return None, 'sem trecho de referencia'
    dref = sorted(x[0] for x in refs)[len(refs) // 2]
    if not [x for x in refs if abs(((x[1] - r + 180) % 360) - 180) < 12]:
        return None, 'o vao dobra esquina (rumo %.0f graus)' % r
    if not (0.6 * dref <= d <= 1.6 * dref):
        return None, 'espacamento irregular (%.1f m/lote contra %.1f)' % (d, dref)
    f = (l - n0) / (n1 - n0)
    return ((p0[0] + f * (p1[0] - p0[0]), p0[1] + f * (p1[1] - p0[1])),
            'entre %d e %d (%.1f m/lote)' % (n0, n1, d))


def monta(k, d, pos, indent='  '):
    t = ("{ b:'%s', q:'%s', l:'%s', m2:%.2f, tipo:'%s', pm2:%d, vista:%.2f"
         % (BAIRRO, k[0], k[1], d['m2'], d['tipo'], round(d['vista'] / d['m2']), d['vista']))
    if d.get('nx'):
        parcela = (d['prazo'] - d['entrada']) / d['nx']
        t += (', prazo:%.2f, entrada:%.2f, parcela:%.2f, nx:%d, ep:%d'
              % (d['prazo'], d['entrada'], parcela, d['nx'], round(d['entrada'] / d['prazo'] * 100)))
    if pos: t += ', ll:[%.6f,%.6f]' % pos
    if not d.get('nx'): t += ', soVista:true'
    return indent + t + ' },\n'


novas = {}
if entram:
    print('\nENTRAM:')
    for k in entram:
        pos, porque = posicao(k)
        print('   %s-%s  %.0f m2 %s  R$ %.0f  -> %s' % (
            k[0], k[1], novo[k]['m2'], novo[k]['tipo'], novo[k]['vista'],
            ('pino %s' % porque) if pos else ('SEM PINO: ' + porque)))
        novas[k] = monta(k, novo[k], pos)
if saem:
    print('\nSAEM: %s' % ', '.join('%s-%s' % k for k in saem))

if '--gravar' not in sys.argv:
    print('\n(conferencia apenas — rode com --gravar para aplicar)')
    sys.exit(0)

# ── grava ────────────────────────────────────────────────────────────
for k in saem:
    s = s.replace(linhas[k], '', 1)
for k in mudaram:
    ind = re.match(r' *', linhas[k]).group(0)
    nova = monta(k, novo[k], ll.get(k), ind)
    s = s.replace(linhas[k], nova, 1)
    linhas[k] = nova
for k in sorted(novas, key=lambda k: (k[0], int(k[1]))):
    irmaos = sorted((int(kk[1]), kk) for kk in linhas if kk[0] == k[0] and kk not in saem)
    ant = [kk for n, kk in irmaos if n < int(k[1])]
    if ant: ancora = linhas[ant[-1]]
    elif irmaos: ancora = linhas[irmaos[0][1]]
    else: ancora = linhas[sorted(linhas, key=lambda kk: (kk[0], int(kk[1])))[-1]]
    assert ancora in s, k
    s = s.replace(ancora, ancora + novas[k], 1)

io.open(P, 'w', encoding='utf-8', newline='').write(s)

# ── confere o que ficou gravado ──────────────────────────────────────
gr = re.findall(r"^ *\{ b:'%s'[^\n]*\n" % re.escape(BAIRRO), io.open(P, encoding='utf-8', newline='').read(), re.M)
assert len(gr) == len(novo), ('contagem final', len(gr), len(novo))
for g in gr:   # nenhum lote pode ficar sem preco nem com condicao pela metade
    assert 'vista:' in g, ('linha sem vista', g)
    assert ('soVista:true' in g) != ('nx:' in g), ('condicao incoerente', g)
v = [float(re.search(r'vista:([\d.]+)', g).group(1)) for g in gr]
print('\ngravado: %d lotes | piso R$ %.2f | teto R$ %.2f' % (len(gr), min(v), max(v)))
