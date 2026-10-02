# -*- coding: utf-8 -*-
# Parque Zarah: landing + fonte unica com a tabela de outubro/2026 (gerada 01/10 as 19:38).
#
# A de 14:12 vinha sem juros nas mensais; esta e a regerada e conferida — a mensal
# bate com a Tabela Price de 1% a.m. nos 662 lotes. Numeros tirados da propria
# tabela por ferramentas/zarah-numeros-2026-10-01.py:
#
#   estoque          669 -> 662 lotes
#   piso (misto)     R$ 210.000,00 -> R$ 211.050,00   (150 m², Pérola Q27 L14)
#     ato              R$ 25.200,00 -> R$ 25.326,00
#     mensal           R$ 2.217,91  -> R$ 2.229,00
#   piso residencial R$ 217.500,00 -> R$ 218.587,50   (150 m², Pérola Q17 L22)
#   teto             R$ 573.118,00 -> R$ 575.983,59   (409,37 m², Rubi Q38 L31)
#   misto da Rubi    R$ 284.039,00 -> R$ 285.458,69   (246,99 m², Q39 L7)
#   quadra 14        R$ 314.468,00 -> R$ 316.039,84   (273,45 m², Pérola Q14 L36)
#
# O reajuste foi de +0,50% parelho em 661 dos 662 lotes.
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
        print('   %dx  %s' % (n, a[:66]))
    for a, b in glob:
        n = s.count(a)
        if n:
            s = s.replace(a, b)
            print('   %dx  %s' % (n, a[:66]))
    io.open(p, 'w', encoding='utf-8', newline='').write(s)
    print('ok', arq)


# ── LANDING ─────────────────────────────────────────────────────────
# As trocas longas vem primeiro: carregam o numero curto dentro delas e
# precisam casar antes que o glob troque o numero solto.
aplica('parque-zarah-indaiatuba/index.html', [
    ('669 lotes disponíveis na tabela de setembro/2026',
     '662 lotes disponíveis na tabela de outubro/2026'),
    ('Tabela de setembro/2026 (gerada em 29/09/2026): lotes a partir de R$ 210.000 (lote misto de 150 m², fase Pérola) e residenciais a partir de R$ 217.500',
     'Tabela de outubro/2026 (gerada em 01/10/2026): lotes a partir de R$ 211.050 (lote misto de 150 m², fase Pérola) e residenciais a partir de R$ 218.588'),
    ('A tabela de setembro/2026 (gerada em 29/09/2026) começa em R$ 210.000, num lote misto de 150 m² da fase Pérola (ato de R$ 25.200 + 180 parcelas de R$ 2.217,91)',
     'A tabela de outubro/2026 (gerada em 01/10/2026) começa em R$ 211.050, num lote misto de 150 m² da fase Pérola (ato de R$ 25.326 + 180 parcelas de R$ 2.229,00)'),
    ('na Rubi os mistos começam em 247 m², por R$ 284.039',
     'na Rubi os mistos começam em 247 m², por R$ 285.459'),
    ('R$ 210.000 (150 m², quadra 27) a R$ 314.468 (273 m², quadra 14)',
     'R$ 211.050 (150 m², quadra 27) a R$ 316.040 (273 m², quadra 14)'),
], glob=[
    # datas e rotulo de tabela
    ('gerada em 29/09/2026', 'gerada em 01/10/2026'),
    ('29/09/2026', '01/10/2026'),
    ('18/09/2026', '01/10/2026'),
    ('tabela de setembro/2026', 'tabela de outubro/2026'),
    ('setembro/2026', 'outubro/2026'),
    ('tabela de set/2026', 'tabela de out/2026'),
    ('set/2026', 'out/2026'),
    ('Atualizado em set/2026', 'Atualizado em out/2026'),
    # valores soltos
    ('669 lotes', '662 lotes'),
    ('669', '662'),
    ('R$ 210.000', 'R$ 211.050'),
    ('R$ 217.500', 'R$ 218.588'),
    ('R$ 573.118', 'R$ 575.984'),
    ('R$ 284.039', 'R$ 285.459'),
    ('R$ 314.468', 'R$ 316.040'),
    ('R$ 25.200', 'R$ 25.326'),
    ('R$ 2.217,91', 'R$ 2.229,00'),
    # schema.org usa ponto decimal e sem separador de milhar
    ('"price":"210000', '"price":"211050'),
    ('"lowPrice":"210000', '"lowPrice":"211050'),
    ('"highPrice":"573118', '"highPrice":"575984'),
])

# ── FONTE UNICA ─────────────────────────────────────────────────────
aplica('gera-folheto.js', [
    ("{ n:'Parque Zarah', c:'Zarin', p:210000,", "{ n:'Parque Zarah', c:'Zarin', p:211050,"),
])
print('\nagora o ritual dos geradores.')
