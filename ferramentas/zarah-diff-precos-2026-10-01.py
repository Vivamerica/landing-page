# -*- coding: utf-8 -*-
# Zarah: alem dos juros, QUANTO mudou de preco entre as duas tabelas de 01/10.
# Importa o leitor da conferencia para nao repetir o regex.
import sys, re
sys.stdout.reconfigure(encoding='utf-8')
from pypdf import PdfReader

NOVA = 'C:/Users/Usuario/Downloads/20261001193835_6abee0eb05b64.pdf'
VELHA = 'C:/Users/Usuario/Downloads/PARQUE_ZARAH_TABELA_PARQUE_ZARAH_OUTUBRO_180X.pdf'
num = lambda s: float(s.replace('.', '').replace(',', '.'))
RX = re.compile(r'FASE (\d) - (\w+) QUADRA (\d+) (\d+) ([\d.,]+) m² (\w+).*?'
                r'Dispon[ií]vel R\$ ([\d.,]+) R\$ ([\d.,]+) R\$ ([\d.,]+)')


def lotes(c):
    t = re.sub(r'\s+', ' ', '\n'.join(p.extract_text() for p in PdfReader(c).pages))
    return {'Q%s-L%s' % (m.group(3), m.group(4)):
            {'nucleo': m.group(2), 'm2': num(m.group(5)), 'total': num(m.group(7)),
             'ato': num(m.group(8)), 'mensal': num(m.group(9))}
            for m in RX.finditer(t)}


a, b = lotes(VELHA), lotes(NOVA)
comum = sorted(set(a) & set(b))

subiu = [(k, a[k]['total'], b[k]['total']) for k in comum if b[k]['total'] - a[k]['total'] > .01]
caiu = [(k, a[k]['total'], b[k]['total']) for k in comum if a[k]['total'] - b[k]['total'] > .01]
igual = [k for k in comum if abs(a[k]['total'] - b[k]['total']) <= .01]

print('%d lotes em comum: %d subiram, %d cairam, %d iguais' % (len(comum), len(subiu), len(caiu), len(igual)))

if subiu:
    p = sorted((n / v - 1) * 100 for _, v, n in subiu)
    print('\nSUBIRAM  — variacao de %+.2f%% a %+.2f%% (mediana %+.2f%%)' % (p[0], p[-1], p[len(p) // 2]))
    for k, v, n in sorted(subiu, key=lambda x: x[2] / x[1])[-3:]:
        print('   %-9s R$ %10.2f -> R$ %10.2f  (%+.2f%%)' % (k, v, n, (n / v - 1) * 100))
if caiu:
    p = sorted((n / v - 1) * 100 for _, v, n in caiu)
    print('\nCAIRAM   — variacao de %+.2f%% a %+.2f%% (mediana %+.2f%%)' % (p[0], p[-1], p[len(p) // 2]))
    for k, v, n in sorted(caiu, key=lambda x: x[2] / x[1])[:3]:
        print('   %-9s R$ %10.2f -> R$ %10.2f  (%+.2f%%)' % (k, v, n, (n / v - 1) * 100))

# piso do empreendimento (o numero que vai para a fonte unica e para a home)
pa, pb = min(x['total'] for x in a.values()), min(x['total'] for x in b.values())
print('\npiso (a partir de):  R$ %.2f  ->  R$ %.2f' % (pa, pb))
print('teto:                R$ %.2f  ->  R$ %.2f'
      % (max(x['total'] for x in a.values()), max(x['total'] for x in b.values())))
print('estoque:             %d  ->  %d lotes' % (len(a), len(b)))

# menor parcela, que e o que a landing anuncia
print('\nmenor mensal:        R$ %.2f  ->  R$ %.2f'
      % (min(x['mensal'] for x in a.values()), min(x['mensal'] for x in b.values())))
print('menor ato:           R$ %.2f  ->  R$ %.2f'
      % (min(x['ato'] for x in a.values()), min(x['ato'] for x in b.values())))

por_nucleo = {}
for k in b:
    por_nucleo.setdefault(b[k]['nucleo'], []).append(b[k]['total'])
print('\npor nucleo (tabela nova):')
for n, v in sorted(por_nucleo.items()):
    print('   %-10s %3d lotes   desde R$ %10.2f' % (n, len(v), min(v)))
