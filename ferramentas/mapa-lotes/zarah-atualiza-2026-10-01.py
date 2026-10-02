# -*- coding: utf-8 -*-
# Parque Zarah: aplica a tabela "OUTUBRO 180X" REGERADA em 01/10/2026 as 19:38.
#
# POR QUE ESTA RODADA EXISTE
# A tabela de outubro entregue as 14:12 trazia a mensal pela metade enquanto o
# valor total subia: os componentes somavam exato ao total, ou seja, SEM juros,
# apesar da nota dizer que tudo ja vem com 1% a.m. na Tabela Price. A publicacao
# ficou parada. O Fabio pediu a tabela de novo; esta e a corrigida, conferida
# lote a lote: a mensal bate com Price de 1% a.m. nos 662 lotes, centavo a centavo.
#
# O QUE MUDA ALEM DOS JUROS
#   - 583 dos 662 lotes subiram exatamente +0,50% (reajuste); 79 ficaram iguais;
#   - o ato passou de 12,12% para 12,00% do total;
#   - Q30 L14 saiu (vendido): 663 -> 662;
#   - piso R$ 210.000,00 -> R$ 211.050,00.
#
# TRES CORRECOES DE ESTRUTURA QUE VAO JUNTO
#   1. 4 lotes inseridos pela rodada anterior ficaram com `prazo:` em vez de
#      `vista:`. Como `temPreco = x => x.vista != null`, eles apareciam no mapa
#      como "Preco sob consulta" — com preco conhecido na tabela.
#   2. um deles (safira Q13 L10) estava com parcela de R$ 1.304,92, que e 46% da
#      parcela Price devida — o mesmo erro da tabela das 14:12.
#   3. faltavam `pm2`, `nx` e `ep` nessas 4 linhas.
#   Por isso esta rodada REESCREVE todas as linhas do Zarah a partir da tabela,
#   preservando a posicao (ll) ja conferida de cada lote, em vez de remendar.
#
# Uso: python zarah-atualiza-2026-10-01.py <tabela.pdf> [--gravar]
import io, re, sys
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
    print('\nE a mesma falha da tabela das 14:12. Nao publicar; pedir a tabela de novo.')
    sys.exit(1)
print('tabela conferida: %d lotes, mensal = Price 1%% a.m. e ato = 12%%, centavo a centavo' % len(novo))

# ── le o mapa ────────────────────────────────────────────────────────
s = io.open(P, encoding='utf-8', newline='').read()
linhas, ll, antigo = {}, {}, {}
for m in re.finditer(r"^ *\{ b:'(zarah-\w+)', q:'(\d+)', l:'(\d+)'[^\n]*\n", s, re.M):
    k = (m.group(1), m.group(2), m.group(3))
    linhas[k] = m.group(0)
    g = re.search(r'll:\[([-\d.]+),([-\d.]+)\]', m.group(0))
    if g: ll[k] = (float(g.group(1)), float(g.group(2)))
    g = re.search(r'(?:vista|prazo):([\d.]+)', m.group(0))
    if g: antigo[k] = float(g.group(1))

saem = sorted(set(linhas) - set(novo), key=lambda k: (k[0], int(k[1]), int(k[2])))
entram = sorted(set(novo) - set(linhas), key=lambda k: (k[0], int(k[1]), int(k[2])))
print('tabela %d | mapa %d | saem %d | entram %d | sem pino hoje %d'
      % (len(novo), len(linhas), len(saem), len(entram), len(linhas) - len(ll)))
if entram:
    print('PAROU: ha lote novo nesta tabela; use o script de 29/09, que sabe posicionar pino.')
    sys.exit(1)

# ── o que muda de preco ──────────────────────────────────────────────
sobe = [(k, antigo[k], novo[k]['total']) for k in set(novo) & set(antigo)
        if novo[k]['total'] - antigo[k] > 0.01]
desce = [(k, antigo[k], novo[k]['total']) for k in set(novo) & set(antigo)
         if antigo[k] - novo[k]['total'] > 0.01]
print('precos: %d sobem, %d descem, %d iguais' % (len(sobe), len(desce), len(novo) - len(sobe) - len(desce)))
if sobe:
    p = sorted((n / v - 1) * 100 for _, v, n in sobe)
    print('   alta de %+.2f%% a %+.2f%%' % (p[0], p[-1]))
if desce:
    print('   QUEDA — confira antes de publicar:')
    for k, v, n in desce[:5]:
        print('      %s Q%s L%s: %.2f -> %.2f' % (k[0].replace('zarah-', ''), k[1], k[2], v, n))
print('SAEM: %s' % (', '.join('%s Q%s L%s' % (k[0].replace('zarah-', ''), k[1], k[2]) for k in saem) or '-'))

# ── tipo nao pode trocar sem a gente ver ─────────────────────────────
trocou = [(k, re.search(r"tipo:'(\w+)'", linhas[k]).group(1), novo[k]['tipo'])
          for k in set(novo) & set(linhas)
          if re.search(r"tipo:'(\w+)'", linhas[k]).group(1) != novo[k]['tipo']]
if trocou:
    print('\nATENCAO: %d lotes mudaram de tipo na tabela:' % len(trocou))
    for k, a, b in trocou[:8]:
        print('   %s Q%s L%s: %s -> %s' % (k[0].replace('zarah-', ''), k[1], k[2], a, b))

# ── monta a linha padronizada ────────────────────────────────────────
def fmt(v):
    return ('%.2f' % v).rstrip('0').rstrip('.') if v != int(v) else str(int(v))

def linha(k, indent):
    d = novo[k]
    c = ("{ b:'%s', q:'%s', l:'%s', m2:%.2f, tipo:'%s', pm2:%s, vista:%.2f, entrada:%.2f, "
         "parcela:%.2f, nx:%d, ep:%d" % (k[0], k[1], k[2], d['m2'], d['tipo'],
                                         fmt(round(d['total'] / d['m2'], 2)),
                                         d['total'], d['ato'], d['mensal'], N, 12))
    if k in ll: c += ', ll:[%.6f,%.6f]' % ll[k]
    c += ', tabela:true, obs:%s }' % repr(OBS).replace('"', "'")
    return indent + c + ',\n'

if '--gravar' not in sys.argv:
    print('\n(conferencia apenas — rode com --gravar para aplicar)')
    print('exemplo da linha que seria gravada:\n' + linha(sorted(novo)[0], '  ').rstrip())
    sys.exit(0)

# ── grava ────────────────────────────────────────────────────────────
for k in saem:
    s = s.replace(linhas[k], '', 1)
for k in sorted(set(novo) & set(linhas)):
    ind = re.match(r' *', linhas[k]).group(0)
    s = s.replace(linhas[k], linha(k, '  ' if len(ind) > 2 else ind), 1)

# rotulo da tabela nas notas de cada nucleo
s = s.replace('tabela Zarin de set/2026 gerada em 18/09 (180x)',
              'tabela Zarin de out/2026 gerada em 01/10 (180x)')

io.open(P, 'w', encoding='utf-8', newline='').write(s)

# ── confere o que ficou gravado ──────────────────────────────────────
s2 = io.open(P, encoding='utf-8', newline='').read()
gravadas = re.findall(r"^ *\{ b:'zarah-\w+'[^\n]*\n", s2, re.M)
assert len(gravadas) == len(novo), ('contagem final', len(gravadas), len(novo))
sem_vista = [g for g in gravadas if 'vista:' not in g]
assert not sem_vista, ('linha sem vista: apareceria como sob consulta', sem_vista[:1])
v = [float(re.search(r'vista:([\d.]+)', g).group(1)) for g in gravadas]
pr = [float(re.search(r'parcela:([\d.]+)', g).group(1)) for g in gravadas]
print('\ngravado: %d lotes | piso R$ %.2f | teto R$ %.2f | menor parcela R$ %.2f'
      % (len(gravadas), min(v), max(v), min(pr)))
print('todas as linhas tem vista, pm2, nx e ep.')
print('\nagora: fonte unica (p:%d) e a landing.' % round(min(v)))
