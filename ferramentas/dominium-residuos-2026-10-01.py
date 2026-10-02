# -*- coding: utf-8 -*-
# Dominium 01/10: o que o de-para por frase nao alcancou.
#
# CUIDADO QUE CUSTOU UMA CONFERENCIA: o Lagos de Helvetia tambem tem 44 lotes.
# Trocar "44 lotes" solto teria estragado quatro paginas dele. Toda troca aqui
# carrega contexto do empreendimento certo.
#
# O Alpnach tambem perdeu lotes de 300 m²: eram 12, agora sao 7 dos 19.
import io, sys
sys.stdout.reconfigure(encoding='utf-8')
R = 'C:/Users/Usuario/Desktop/landing-page/'


def aplica(arq, trocas):
    p = R + arq
    s = io.open(p, encoding='utf-8', newline='').read()
    for a, b in trocas:
        n = s.count(a)
        assert n, (arq, 'nao achei', a[:110])
        s = s.replace(a, b)
        print('   %dx  %s' % (n, a[:70]))
    io.open(p, 'w', encoding='utf-8', newline='').write(s)
    print('ok', arq)


aplica('alpnach-indaiatuba/index.html', [
    ('Últimos 28 lotes (set/2026)', 'Últimos 19 lotes (out/2026)'),
    ('de 04/09/2026, restam 28 lotes disponíveis, 12 deles de 300 m² por R$ 510.000',
     'de 01/10/2026, restam 19 lotes disponíveis, 7 deles de 300 m² por R$ 510.000'),
])

aplica('di-italia-indaiatuba/index.html', [
    ('⚡ 44 lotes disponíveis (set/2026)', '⚡ 45 lotes disponíveis (out/2026)'),
    ('44 lotes disponíveis no Di Itália (04/09/2026)', '45 lotes disponíveis no Di Itália (01/10/2026)'),
    ('44 lotes disponíveis (relatório Dominium de 04/09/2026)',
     '45 lotes disponíveis (relatório Dominium de 01/10/2026)'),
])

# O Observatorio guarda a causa de cada movimento; a do Alpnach cita o estoque.
aplica('gera-observatorio.js', [
    ('reajuste do lote de 300 m² à vista — restam 28 lotes (04/09/2026)',
     'reajuste do lote de 300 m² à vista — restam 19 lotes (01/10/2026)'),
])
print('\nagora o ritual.')
