# -*- coding: utf-8 -*-
# Alphaville Indaiatuba: le a "TABELA DE VENDAS SETEMBRO - 2026" e confere a conta.
#
# Colunas do PDF:
#   Quadra | Lote | Metragem | Valor do lote | Custas Escrituracao | Ato 20% |
#   5 Anuais | 60 Mensais | 60 Mensais
#
# Os dois ultimos sao DUAS OPCOES de fluxo para o mesmo saldo, nao duas parcelas:
#   A) ato 20% + 5 anuais + 60 mensais menores
#   B) ato 20% + 60 mensais maiores, sem anuais
# Ambas sem juros, como diz a condicao de venda. O script confere as duas.
import io, re, sys, json, os
sys.stdout.reconfigure(encoding='utf-8')
from pypdf import PdfReader

PDF = 'C:/Users/Usuario/Downloads/ALPHAVILLE INDAIATUBA/Tabela Alpha Indaiatuba set-26.pdf'
num = lambda s: float(s.replace('.', '').replace(',', '.'))
brl = lambda v: ('R$ %s' % format(v, ',.2f')).replace(',', '#').replace('.', ',').replace('#', '.')

txt = '\n'.join((p.extract_text() or '') for p in PdfReader(PDF).pages)
rx = re.compile(r'^([A-Z]) (\d+) ([\d.,]+) R\$ ?([\d.,]+) R\$ ?([\d.,]+) R\$ ?([\d.,]+) '
                r'R\$ ?([\d.,]+) R\$ ?([\d.,]+) R\$ ?([\d.,]+)$', re.M)
L = []
for m in rx.finditer(txt):
    q, l, m2, valor, custas, ato, anual, mensalA, mensalB = m.groups()
    L.append(dict(q=q, l=int(l), m2=num(m2), valor=num(valor), custas=num(custas),
                  ato=num(ato), anual=num(anual), mensalA=num(mensalA), mensalB=num(mensalB)))

print('%d lotes lidos' % len(L))
linhas_tabela = len(re.findall(r'^[A-Z] \d+ [\d.,]+ R\$', txt, re.M))
assert len(L) == linhas_tabela, ('linhas nao lidas', len(L), linhas_tabela)

# ── a aritmetica fecha? ──────────────────────────────────────────────
ruins = {'ato nao e 20%': [], 'opcao A nao fecha': [], 'opcao B nao fecha': []}
custas_pct = set()
for d in L:
    ident = '%s-%02d' % (d['q'], d['l'])
    if abs(d['ato'] / d['valor'] - 0.20) > 0.0005:
        ruins['ato nao e 20%'].append('%s (%.2f%%)' % (ident, d['ato'] / d['valor'] * 100))
    saldo = d['valor'] - d['ato']
    if abs(5 * d['anual'] + 60 * d['mensalA'] - saldo) > 1.0:
        ruins['opcao A nao fecha'].append(
            '%s (5x%s + 60x%s = %s, saldo %s)'
            % (ident, brl(d['anual']), brl(d['mensalA']), brl(5 * d['anual'] + 60 * d['mensalA']), brl(saldo)))
    if abs(60 * d['mensalB'] - saldo) > 1.0:
        ruins['opcao B nao fecha'].append(
            '%s (60x%s = %s, saldo %s)' % (ident, brl(d['mensalB']), brl(60 * d['mensalB']), brl(saldo)))
    custas_pct.add(round(d['custas'] / d['valor'] * 100, 3))

for k, v in ruins.items():
    print('  %s %s: %d %s' % ('ok —' if not v else '!!', k, len(v), v[:3] if v else ''))

print('\ncustas de escrituracao: %s%% do valor do lote' % sorted(custas_pct))

# ── o que a landing precisa ──────────────────────────────────────────
v = [d['valor'] for d in L]
m = [d['m2'] for d in L]
menor = min(L, key=lambda d: d['valor'])
maior = max(L, key=lambda d: d['valor'])
print('\nESTOQUE: %d lotes disponiveis' % len(L))
print('  preco:    %s a %s' % (brl(min(v)), brl(max(v))))
print('  metragem: %.2f a %.2f m²' % (min(m), max(m)))
print('  m² medio do menor: %s/m²' % brl(menor['valor'] / menor['m2']))
print('  mais barato: %s-%02d, %.2f m², %s' % (menor['q'], menor['l'], menor['m2'], brl(menor['valor'])))
print('     ato %s · 5 anuais de %s · 60x de %s   (ou 60x de %s sem anuais)'
      % (brl(menor['ato']), brl(menor['anual']), brl(menor['mensalA']), brl(menor['mensalB'])))
print('  mais caro:   %s-%02d, %.2f m², %s' % (maior['q'], maior['l'], maior['m2'], brl(maior['valor'])))

print('\n  menor mensal da tabela (opcao A): %s' % brl(min(d['mensalA'] for d in L)))
print('  menor ato:                        %s' % brl(min(d['ato'] for d in L)))

por_q = {}
for d in L:
    por_q.setdefault(d['q'], []).append(d)
print('\npor quadra:')
for q in sorted(por_q):
    s = por_q[q]
    print('   %s  %2d lotes  %.2f a %.2f m²  desde %s'
          % (q, len(s), min(x['m2'] for x in s), max(x['m2'] for x in s), brl(min(x['valor'] for x in s))))

# desconto progressivo que o Fabio passou
print('\ndesconto progressivo sobre o lote mais barato (%s):' % brl(menor['valor']))
for rot, pct in (('a vista', 15), ('12x', 9), ('24x', 6), ('36x', 4)):
    print('   %-8s -%2d%%  ->  %s' % (rot, pct, brl(menor['valor'] * (1 - pct / 100))))

json.dump(L, open(os.environ['TEMP'] + '/alphaville.json', 'w'), indent=0)
print('\n(dados em %TEMP%/alphaville.json)')
