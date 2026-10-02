# -*- coding: utf-8 -*-
# Os numeros que as landings citam, tirados dos relatorios Dominium de 01/10/2026.
import sys, json, os, glob
sys.stdout.reconfigure(encoding='utf-8')
S = os.environ['TEMP'] + '/dominium-%s.json'
brl = lambda v: ('R$ %s' % format(v, ',.2f')).replace(',', '#').replace('.', ',').replace('#', '.')

for b in ('alpnach', 'diitalia', 'montecarmelo', 'ravello', 'vistareal', 'veneza', 'granreserve'):
    p = S % b
    if not os.path.exists(p):
        continue
    L = json.load(open(p))
    tipos = {}
    for d in L:
        tipos[d['tipo']] = tipos.get(d['tipo'], 0) + 1
    v = [d['vista'] for d in L]
    m = [d['m2'] for d in L]
    com_prazo = [d for d in L if d.get('nx')]
    print('\n%s — %d lotes' % (b.upper(), len(L)))
    print('   por tipo: %s' % ', '.join('%d %s' % (n, t.lower()) for t, n in sorted(tipos.items(), key=lambda x: -x[1])))
    print('   preco:    %s a %s' % (brl(min(v)), brl(max(v))))
    print('   metragem: %.2f a %.2f m²' % (min(m), max(m)))
    menor = min(L, key=lambda d: d['vista'])
    print('   o mais barato: %s-%s, %.2f m², %s' % (menor['q'], menor['l'], menor['m2'], brl(menor['vista'])))
    if com_prazo:
        nxs = sorted({d['nx'] for d in com_prazo})
        print('   a prazo:  %d lotes, %s' % (len(com_prazo), '/'.join('%dx' % n for n in nxs)))
        mp = min(com_prazo, key=lambda d: (d['prazo'] - d['entrada']) / d['nx'])
        print('             menor parcela %s (%s-%s: entrada %s + %dx)'
              % (brl((mp['prazo'] - mp['entrada']) / mp['nx']), mp['q'], mp['l'], brl(mp['entrada']), mp['nx']))
    else:
        print('   a prazo:  nenhum — todos so a vista')
