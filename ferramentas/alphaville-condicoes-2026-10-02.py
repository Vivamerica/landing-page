# -*- coding: utf-8 -*-
# Alphaville Indaiatuba: as condicoes de venda que o Fabio passou em 02/10/2026.
#
# A landing ja estava com a tabela certa (set/2026, 131 lotes, R$ 888.939,47 a
# R$ 1.609.895,78 — conferido lote a lote: ato exatamente 20% e as duas opcoes de
# fluxo fechando centavo a centavo). O que faltava era a POLITICA comercial, que
# so veio agora:
#
#   * analise de renda
#   * entrada de 20% parcelada em ate 3x
#   * fluxo SEM JUROS (a tabela ja provava; agora da para afirmar)
#   * correcao do IPCA, mensal, m-2
#   * anual de ate 4x o valor da parcela, vencendo no maximo 11 meses apos a compra
#   * desconto progressivo pelo prazo: a vista 15%, 12x 9%, 24x 6%, 36x 4%
#   * ENTREGA PREVISTA: julho/2029
#
# Duas frases da landing estavam dizendo que NAO tinhamos essas informacoes.
# Agora temos, e e isso que muda aqui.
#
# FICA ABERTO: a condicao diz que as custas de documentacao sao 5,5% no
# financiado e 4,5% a vista. A tabela traz 4,76% uniforme nos 131 lotes, e nao
# fecha com nenhum dos dois (nem sobre o valor cheio, nem sobre o valor com
# desconto a vista). Mantido o 4,76%, que e o que o cliente ve na tabela, ate a
# Alphaville esclarecer.
import io, sys
sys.stdout.reconfigure(encoding='utf-8')
R = 'C:/Users/Usuario/Desktop/landing-page/'
ARQ = 'alphaville-indaiatuba/index.html'

p = R + ARQ
s = io.open(p, encoding='utf-8', newline='').read()


def troca(a, b, n=1):
    global s
    c = s.count(a)
    assert c == n, (ARQ, 'esperava %d, achei %d' % (n, c), a[:110])
    s = s.replace(a, b)
    print('   %dx  %s' % (c, a[:72]))


# ── a frase que dizia que nao sabiamos o desconto ───────────────────
troca('A tabela não informa desconto à vista nem taxa de condomínio; peça essas condições no atendimento.',
      'Há desconto progressivo por prazo de pagamento: 15% à vista, 9% em 12x, 6% em 24x e 4% em 36x. '
      'A taxa mensal da associação não consta do material; peça no atendimento.')

# ── entrega ─────────────────────────────────────────────────────────
troca('<dt>Entrega da infraestrutura</dt><dd>Não informada no material; confirme no atendimento</dd>',
      '<dt>Entrega da infraestrutura</dt><dd>Prevista para julho de 2029, conforme as condições de venda</dd>')

# ── a condicao de pagamento, nos dois lugares (texto e FAQ) ─────────
VELHO = ('O ato é de 20% do valor. Os 80% restantes podem ser pagos em 5 parcelas anuais de 4% '
         'mais 60 mensais de 1%, ou em 60 mensais de 1,333%. A primeira parcela vence em 30 dias '
         'e as parcelas s')
NOVO = ('O ato é de 20% do valor e pode ser parcelado em até 3 vezes. Os 80% restantes podem ser pagos '
        'em 5 parcelas anuais de 4% mais 60 mensais de 1%, ou em 60 mensais de 1,333% — nas duas opções, '
        'sem juros: a soma das parcelas dá exatamente o saldo. A primeira parcela vence em 30 dias '
        'e as parcelas s')
troca(VELHO, NOVO, n=2)

# ── card novo com a politica comercial, ao lado dos outros ──────────
ANCORA = '      <div class="card"><h3>Entorno</h3>'
CARDS = (
    '      <div class="card"><h3>Desconto por prazo</h3><p>Quanto menor o prazo, maior o desconto sobre o '
    'valor de tabela: <b>15% à vista</b>, 9% em 12x, 6% em 24x e 4% em 36x. No lote mais barato, os 15% '
    'levam R$ 888.939,47 para R$ 755.598,55.</p></div>\n'
    '      <div class="card"><h3>Correção e parcela anual</h3><p>As parcelas são corrigidas mensalmente pelo '
    'IPCA, com defasagem de dois meses (m−2). Cabe ainda uma parcela anual de até 4 vezes o valor da mensal, '
    'com vencimento em no máximo 11 meses após a compra.</p></div>\n'
    '      <div class="card"><h3>Entrada e análise</h3><p>A entrada de 20% pode ser dividida em até 3 vezes; '
    'acima de 24 parcelas, há correção a partir do terceiro mês. A compra passa por análise de renda.</p></div>\n')
troca(ANCORA, CARDS + ANCORA)

io.open(p, 'w', encoding='utf-8', newline='').write(s)
print('ok', ARQ)
print('\nFICA ABERTO: custas 4,76% na tabela x 5,5%/4,5% na condicao de venda.')
