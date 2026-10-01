# -*- coding: utf-8 -*-
# Reserva Botânica: tabela Zarin de 29/09/2026. Restam 2 lotes — o D-13, que era
# o mais barato (339,92 m² por R$ 532.562,75), saiu.
#
#   C-1  410,01 m²  R$ 642.374,83  entrada R$ 73.423,44  36x 18.897,33 · 60x 12.656,01 · 120x 8.162,80
#   B-13 456,70 m²  R$ 715.525,59  entrada R$ 81.784,58  36x 21.049,27 · 60x 14.097,22 · 120x 9.092,34
#
# Entrada continua em ~11,4% e as parcelas seguem Price de 1% a.m. com IPCA —
# conferido: (642.374,83 − 73.423,44) em 120x a 1% dá R$ 8.162,80.
import io, sys
sys.stdout.reconfigure(encoding='utf-8')
R = 'C:/Users/Usuario/Desktop/landing-page/'


def aplica(arq, trocas, glob=()):
    p = R + arq
    s = io.open(p, encoding='utf-8', newline='').read()
    for a, b in trocas:
        n = s.count(a)
        assert n, (arq, 'nao achei', a[:110])
        s = s.replace(a, b)
        print('   %dx  %s' % (n, a[:62]))
    for a, b in glob:
        n = s.count(a)
        if not n:
            continue
        s = s.replace(a, b)
        print('   %dx  %s' % (n, a[:62]))
    io.open(p, 'w', encoding='utf-8', newline='').write(s)
    print('ok', arq)


aplica('reserva-botanica-indaiatuba/index.html', [
    # frase que lista os tres lotes, no FAQ visivel e no schema
    ('Restam 3 lotes na tabela Zarin de 10/07/2026: D-13 com 339,92 m² por R$ 532.562,75; C-1 com 410,01 m² por R$ 642.374,83; e B-13 com 456,70 m² por R$ 715.525,59.',
     'Restam 2 lotes na tabela Zarin de 29/09/2026: C-1 com 410,01 m² por R$ 642.374,83 e B-13 com 456,70 m² por R$ 715.525,59.'),
    ('Na tabela Zarin de 10/07/2026 constavam 3 lotes disponíveis (quadras D-13, C-1 e B-13). Como são as últimas 3 unidades (jul/2026), a disponibilidade pode mudar a qualquer momento',
     'Na tabela Zarin de 29/09/2026 constam 2 lotes disponíveis (quadras C-1 e B-13). Como são as últimas 2 unidades, a disponibilidade pode mudar a qualquer momento'),
    ('Restam 3 lotes na tabela Zarin de 10/07/2026: 339,92 m², 410,01 m² e 456,70 m², a partir de R$ 532.563',
     'Restam 2 lotes na tabela Zarin de 29/09/2026: 410,01 m² e 456,70 m², a partir de R$ 642.375'),
    ('<div class="stat"><strong>3</strong><span>Lotes restantes (jul/2026)</span></div>',
     '<div class="stat"><strong>2</strong><span>Lotes restantes (set/2026)</span></div>'),
    ('<div class="stat"><strong>339,92 m²</strong><span>Menor lote</span></div>',
     '<div class="stat"><strong>410,01 m²</strong><span>Menor lote</span></div>'),
    ('Lotes a partir de R$ 532.562,75 (339,92 m²) até R$ 715.525,59 (456,70 m²)',
     'Lotes a partir de R$ 642.374,83 (410,01 m²) até R$ 715.525,59 (456,70 m²)'),
    ('D-13, C-1 e B-13 ainda estão disponíveis', 'C-1 e B-13 ainda estão disponíveis'),
    ('"inventoryLevel":{"@type":"QuantitativeValue","value":3}',
     '"inventoryLevel":{"@type":"QuantitativeValue","value":2}'),
], glob=[
    # o resto e' varredura: o conjunto "3 unidades / jul 2026 / 339,92 / 532.563" acabou
    ('últimas 3 unidades (jul/2026)', 'últimas 2 unidades (set/2026)'),
    ('Últimas 3 unidades (jul/2026)', 'Últimas 2 unidades (set/2026)'),
    ('Últimas 3 unidades (tabela de 10/07/2026)', 'Últimas 2 unidades (tabela de 29/09/2026)'),
    ('Últimas 3 unidades (tabela Zarin de 10/07/2026)', 'Últimas 2 unidades (tabela Zarin de 29/09/2026)'),
    ('últimas 3 unidades (tabela de 10/07/2026)', 'últimas 2 unidades (tabela de 29/09/2026)'),
    ('Últimas 3 unidades<br>(jul/2026)', 'Últimas 2 unidades<br>(set/2026)'),
    ('Últimas 3 unidades', 'Últimas 2 unidades'),
    ('últimas 3 unidades', 'últimas 2 unidades'),
    ('3 lotes restantes', '2 lotes restantes'),
    ('339,92 a 456,70 m²', '410,01 a 456,70 m²'),
    ('R$ 532.563', 'R$ 642.375'),
    ('10/07/2026', '29/09/2026'),
    ('(jul/2026)', '(set/2026)'),
])

# ── FONTE ÚNICA ─────────────────────────────────────────────────────
aplica('gera-folheto.js', [
    ("{ n:'Reserva Botânica', c:'Zarin', p:532563, m2:340,", "{ n:'Reserva Botânica', c:'Zarin', p:642375, m2:410,"),
    ("s:'3 lotes de 340 a 457 m² · portaria 24h · 3 quadras', t:'Cond. fechado', est:3,",
     "s:'2 lotes de 410 a 457 m² · portaria 24h · 3 quadras', t:'Cond. fechado', est:2,"),
])

aplica('llms.txt', [
    ('últimas 3 unidades na tabela de 10/07/2026: quadra D lote 13 (339,92 m²) R$ 532.563, quadra C lote 1 (410,01 m²) R$ 642.375 e quadra B lote 13 (456,70 m²) R$ 715.526',
     'últimas 2 unidades na tabela de 29/09/2026: quadra C lote 1 (410,01 m²) R$ 642.375 e quadra B lote 13 (456,70 m²) R$ 715.526'),
])
print('\nagora o ritual.')
