# -*- coding: utf-8 -*-
# Zarah out/2026: os numeros que a landing cita, tirados da tabela nova.
import sys, re
sys.stdout.reconfigure(encoding='utf-8')
from pypdf import PdfReader

PDF = 'C:/Users/Usuario/Downloads/20261001193835_6abee0eb05b64.pdf'
num = lambda v: float(v.replace('.', '').replace(',', '.'))
B = {1: 'Safira', 2: 'Rubi', 3: 'Pérola'}
brl = lambda v: ('R$ %.2f' % v).replace('.', '#').replace(',', '.').replace('#', ',')

t = re.sub(r'\s+', ' ', '\n'.join((p.extract_text() or '') for p in PdfReader(PDF).pages))
rx = re.compile(r'FASE (\d) ?- ?\w+ QUADRA (\d+) (\d+) ([\d.,]+) m² (RESIDENCIAL|COMERCIAL|MISTO) (.*?)'
                r'Disponível R\$ ([\d.,]+) R\$ ([\d.,]+) R\$ ([\d.,]+)')
L = [dict(fase=B[int(m.group(1))], q=int(m.group(2)), l=int(m.group(3)), m2=num(m.group(4)),
          tipo=m.group(5), total=num(m.group(7)), ato=num(m.group(8)), mensal=num(m.group(9)))
     for m in rx.finditer(t)]
print('%d lotes\n' % len(L))

def menor(sel, rot):
    c = [x for x in sel]
    if not c:
        print('  %-42s —' % rot); return
    x = min(c, key=lambda y: y['total'])
    print('  %-42s %s  (%.2f m², %s Q%d L%d, ato %s, 180x de %s)'
          % (rot, brl(x['total']), x['m2'], x['fase'], x['q'], x['l'], brl(x['ato']), brl(x['mensal'])))

print('PISO E TETO')
menor(L, 'a partir de (qualquer)')
x = max(L, key=lambda y: y['total'])
print('  %-42s %s  (%.2f m², %s Q%d L%d)' % ('teto', brl(x['total']), x['m2'], x['fase'], x['q'], x['l']))
print('  %-42s %s' % ('menor parcela mensal', brl(min(x['mensal'] for x in L))))
print('  %-42s %s' % ('menor ato', brl(min(x['ato'] for x in L))))

print('\nPOR TIPO')
for tp in ('MISTO', 'RESIDENCIAL', 'COMERCIAL'):
    menor([x for x in L if x['tipo'] == tp], 'menor ' + tp.lower())

print('\nPOR FASE')
for f in ('Pérola', 'Rubi', 'Safira'):
    sel = [x for x in L if x['fase'] == f]
    if not sel: continue
    print('  %-10s %3d lotes' % (f, len(sel)))
    for tp in ('MISTO', 'RESIDENCIAL'):
        menor([x for x in sel if x['tipo'] == tp], '    menor ' + tp.lower())
    print('    %-38s %.2f a %.2f m²' % ('metragens', min(x['m2'] for x in sel), max(x['m2'] for x in sel)))

print('\nREFERENCIAS QUE A LANDING CITA HOJE')
for q, m2a, m2b, rot in ((27, 149, 151, 'quadra 27, ~150 m²'), (14, 272, 275, 'quadra 14, ~273 m²')):
    sel = [x for x in L if x['q'] == q and m2a <= x['m2'] <= m2b]
    menor(sel, rot)
sel = [x for x in L if x['fase'] == 'Rubi' and x['tipo'] == 'MISTO']
if sel:
    print('  %-42s %.2f m² por %s' % ('menor misto da Rubi', min(sel, key=lambda y: y['total'])['m2'],
                                      brl(min(x['total'] for x in sel))))
    print('  %-42s %.2f m²' % ('menor metragem de misto na Rubi', min(x['m2'] for x in sel)))
