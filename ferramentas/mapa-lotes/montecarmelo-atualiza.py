# -*- coding: utf-8 -*-
# Monte Carmelo: aplica ao mapa o relatório "Lotes disponíveis" da Dominium.
#
# Faz o mesmo que o script do Zarah, e pelos mesmos motivos:
#  · tira do mapa quem sumiu do relatório (vendido);
#  · acrescenta quem entrou, posicionado por interpolação entre os vizinhos
#    numéricos da MESMA quadra — e só quando o vão é reto e de espaçamento
#    regular. Se a quadra dobra esquina ali, o lote entra SEM pino: aparece na
#    lista e na contagem, mas não no desenho. Pino errado é pior que pino nenhum.
#  · confere preço, entrada, prazo e nº de parcelas lote a lote; se algo mudou,
#    atualiza e diz o que mudou.
#
# Uso: python montecarmelo-atualiza.py <relatorio.pdf> [--gravar]
import io, json, math, os, re, subprocess, sys
sys.stdout.reconfigure(encoding='utf-8')

AQUI = os.path.dirname(os.path.abspath(__file__))
P = 'C:/Users/Usuario/Desktop/landing-page/mapa-lotes-indaiatuba/index.html'
TMP = os.environ['TEMP'] + '/mc-atualiza.json'

# ── lê o relatório com o parser que já existe ────────────────────────
subprocess.run([sys.executable, os.path.join(AQUI, 'dominium-disp.py'), sys.argv[1], TMP],
               check=True, stdout=subprocess.DEVNULL)
novo = {}
for d in json.load(open(TMP)):
    novo[(d['q'], str(d['l']))] = d
print('relatório: %d lotes' % len(novo))

# ── lê o mapa ────────────────────────────────────────────────────────
s = io.open(P, encoding='utf-8', newline='').read()
linhas, ll = {}, {}
for m in re.finditer(r"^ *\{ b:'montecarmelo', q:'([^']+)', l:'(\d+)'[^\n]*\n", s, re.M):
    k = (m.group(1), m.group(2))
    linhas[k] = m.group(0)
    g = re.search(r"ll:\[([-\d.]+),([-\d.]+)\]", m.group(0))
    if g: ll[k] = (float(g.group(1)), float(g.group(2)))

saem = sorted(set(linhas) - set(novo), key=lambda k: (k[0], int(k[1])))
entram = sorted(set(novo) - set(linhas), key=lambda k: (k[0], int(k[1])))
print('mapa: %d | saem %d | entram %d' % (len(linhas), len(saem), len(entram)))

# ── preços que mudaram ───────────────────────────────────────────────
def campo(linha, nome):
    g = re.search(nome + r':([\d.]+)', linha)
    return float(g.group(1)) if g else None

mudaram = []
for k in sorted(set(novo) & set(linhas), key=lambda k: (k[0], int(k[1]))):
    d, linha = novo[k], linhas[k]
    for nome, val in (('vista', d.get('vista')), ('prazo', d.get('prazo')),
                      ('entrada', d.get('entrada')), ('nx', d.get('nx')), ('m2', d.get('m2'))):
        if val is None: continue
        atual = campo(linha, nome)
        if atual is not None and abs(atual - val) > 0.01:
            mudaram.append((k, nome, atual, val))
if mudaram:
    print('\nMUDARAM (%d campos):' % len(mudaram))
    for k, nome, a, b in mudaram[:20]:
        print('   %s-%s  %s: %.2f -> %.2f' % (k[0], k[1], nome, a, b))
    if len(mudaram) > 20: print('   … e mais %d' % (len(mudaram) - 20))
else:
    print('nenhum preço, entrada, prazo ou metragem mudou')

# ── posição dos que entram ───────────────────────────────────────────
def rumo(a, b): return math.degrees(math.atan2(b[1] - a[1], b[0] - a[0]))

def posicao(k):
    q, l = k[0], int(k[1])
    pts = sorted(((int(kk[1]), v) for kk, v in ll.items() if kk[0] == q), key=lambda x: x[0])
    ant = [p for p in pts if p[0] < l]; dep = [p for p in pts if p[0] > l]
    if not ant or not dep:
        # ponta da quadra: estende UMA casa, e só se os dois primeiros trechos
        # concordarem em rumo e espaçamento (fila reta e regular).
        fila = pts if not ant else pts[::-1]
        if len(fila) < 3: return None, 'vizinhos de menos na quadra %s' % q
        (n0, p0), (n1, p1), (n2, p2) = fila[0], fila[1], fila[2]
        if abs(l - n0) > 1: return None, 'longe demais da ponta da quadra %s' % q
        d1 = math.dist(p0, p1) * 111000 / abs(n1 - n0)
        d2 = math.dist(p1, p2) * 111000 / abs(n2 - n1)
        r1, r2 = rumo(p1, p0), rumo(p2, p1)
        if abs(((r1 - r2 + 180) % 360) - 180) > 12: return None, 'a ponta da quadra %s dobra' % q
        if not (0.6 * d2 <= d1 <= 1.6 * d2): return None, 'espaçamento irregular na ponta da quadra %s' % q
        passo = ((p0[0] - p1[0]) / abs(n1 - n0), (p0[1] - p1[1]) / abs(n1 - n0))
        return (p0[0] + passo[0] * abs(l - n0), p0[1] + passo[1] * abs(l - n0)),                'estendido a partir de %d (%.1f m/lote)' % (n0, d1)
    n0, p0 = ant[-1]; n1, p1 = dep[0]
    d = math.dist(p0, p1) * 111000 / (n1 - n0)
    r = rumo(p0, p1)
    refs = []
    for i in range(1, len(pts)):
        a0, q0 = pts[i - 1]; a1, q1 = pts[i]
        if a1 <= n0 or a0 >= n1: refs.append((math.dist(q0, q1) * 111000 / (a1 - a0), rumo(q0, q1)))
    if not refs: return None, 'sem trecho de referência'
    dref = sorted(x[0] for x in refs)[len(refs) // 2]
    if not [x for x in refs if abs(((x[1] - r + 180) % 360) - 180) < 12]:
        return None, 'o vão dobra esquina (rumo %.0f°)' % r
    if not (0.6 * dref <= d <= 1.6 * dref):
        return None, 'espaçamento irregular (%.1f m/lote contra %.1f)' % (d, dref)
    f = (l - n0) / (n1 - n0)
    return (p0[0] + f * (p1[0] - p0[0]), p0[1] + f * (p1[1] - p0[1])), 'entre %d e %d (%.1f m/lote)' % (n0, n1, d)

def monta(k, d, pos):
    pm2 = d['vista'] / d['m2']
    parcela = (d['prazo'] - d['entrada']) / d['nx']
    ep = round(d['entrada'] / d['prazo'] * 100)
    t = ("{ b:'montecarmelo', q:'%s', l:'%s', m2:%.2f, tipo:'%s', pm2:%d, vista:%.2f, prazo:%.2f, "
         "entrada:%.2f, parcela:%.2f, nx:%d, ep:%d" % (k[0], k[1], d['m2'], d['tipo'], round(pm2),
                                                       d['vista'], d['prazo'], d['entrada'], parcela, d['nx'], ep))
    if pos: t += ', ll:[%.6f,%.6f]' % pos
    return '      ' + t + ' },\n'

novas = {}
if entram:
    print('\nENTRAM:')
    for k in entram:
        pos, porque = posicao(k)
        print('   %s-%s  %.0f m² %s  R$ %.0f  -> %s' % (k[0], k[1], novo[k]['m2'], novo[k]['tipo'],
              novo[k]['vista'], ('pino %s' % porque) if pos else ('SEM PINO: ' + porque)))
        novas[k] = monta(k, novo[k], pos)
if saem:
    print('\nSAEM: %s' % ', '.join('%s-%s' % k for k in saem))

if '--gravar' not in sys.argv:
    print('\n(conferência apenas — rode com --gravar para aplicar)')
    sys.exit(0)

# ── grava ────────────────────────────────────────────────────────────
for k in saem:
    s = s.replace(linhas[k], '', 1)
for k, nome, a, b in mudaram:
    antes = linhas[k]
    depois = re.sub(nome + r':[\d.]+', '%s:%s' % (nome, ('%d' % b) if nome == 'nx' else ('%.2f' % b)), antes, count=1)
    # a parcela é derivada: refaz junto
    d = novo[k]
    depois = re.sub(r'parcela:[\d.]+', 'parcela:%.2f' % ((d['prazo'] - d['entrada']) / d['nx']), depois, count=1)
    s = s.replace(antes, depois, 1); linhas[k] = depois
for k in sorted(novas, key=lambda k: (k[0], int(k[1]))):
    irmaos = sorted((int(kk[1]), kk) for kk in linhas if kk[0] == k[0] and kk not in saem)
    ant = [kk for n, kk in irmaos if n < int(k[1])]
    if ant: ancora = linhas[ant[-1]]
    elif irmaos: ancora = linhas[irmaos[0][1]]
    else:   # quadra nova: entra depois do último lote do Monte Carmelo
        ancora = linhas[sorted(linhas, key=lambda kk: (kk[0], int(kk[1])))[-1]]
    assert ancora in s, k
    s = s.replace(ancora, ancora + novas[k], 1)

io.open(P, 'w', encoding='utf-8', newline='').write(s)
n = len(re.findall(r"^ *\{ b:'montecarmelo',", s, re.M))
print('\ngravado. Monte Carmelo no mapa agora: %d (esperado %d)' % (n, len(novo)))
assert n == len(novo), 'contagem final nao bate'
