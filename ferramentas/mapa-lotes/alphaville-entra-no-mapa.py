# -*- coding: utf-8 -*-
# Alphaville Indaiatuba entra no mapa de lotes: bairro, overlay e os 131 lotes
# disponiveis da tabela de setembro/2026.
#
# GEORREFERENCIAMENTO: solucao de alphaville-georref2.py, ajustada por minimos
# quadrados aos tres pontos que o Fabio mediu no Google Maps (rotatoria da
# portaria, piscina do clube, quina da quadra L). Residuo maximo de 5,9 m — menos
# de meio lote.
#
# OS LOTES ENTRAM SEM PINO, de proposito. A planta nao veio em KMZ nem em vetor,
# entao nao ha como dar a cada lote a sua coordenada sem traçar os 131 a mao, e
# pino errado e pior que pino nenhum (a mesma regra do Zarah e do Monte Carmelo).
# O overlay mostra a planta inteira COM os numeros de lote, e cada lote aparece
# na lista, na busca, no filtro e na contagem, com quadra, lote, metragem e preco.
#
# CONDICAO: a tabela traz duas opcoes para o mesmo saldo, as duas sem juros —
# (A) ato 20% + 5 anuais + 60 mensais menores, (B) ato 20% + 60 mensais maiores.
# Publicamos a B, que e a condicao completa sem parcela-balao escondida, e a obs
# diz que existe a A.
import io, json, os, re, sys
sys.stdout.reconfigure(encoding='utf-8')

P = 'C:/Users/Usuario/Desktop/landing-page/mapa-lotes-indaiatuba/index.html'
DADOS = os.environ['TEMP'] + '/alphaville.json'
BOUNDS = '[[-23.134029075,-47.208051304],[-23.119010830,-47.194755628]]'

OBS = ('Valor de tabela Alphaville de set/2026: ato de 20% (parcelável em até 3x) e saldo em 60 mensais, '
       'sem juros, corrigido pelo IPCA. Há ainda a opção com 5 parcelas anuais e mensal menor. '
       'Custas de escrituração de 4,76% à parte. Desconto por prazo: 15% à vista, 9% em 12x, 6% em 24x, 4% em 36x')

BAIRRO = ("  { id:'alphaville', fechado:true, nome:'Alphaville Indaiatuba', "
          "sub:'condomínio fechado · 131 lotes disponíveis (tabela set/2026) · a prazo em 60x', "
          "landing:'/alphaville-indaiatuba/', "
          "cond:'ato de 20% e saldo em 60 mensais sem juros, corrigido pelo IPCA, tabela Alphaville de set/2026', "
          "tab:'set/2026', "
          "overlay:{ url:'images/alphaville.png', bounds:" + BOUNDS + " } },\n")

L = json.load(open(DADOS))
assert len(L) == 131, len(L)

s = io.open(P, encoding='utf-8', newline='').read()
assert "id:'alphaville'" not in s, 'o Alphaville ja esta no mapa'

# ── bairro: entra antes do Alpnach, para ficar junto dos fechados ───
anc_b = "  { id:'alpnach',"
assert s.count(anc_b) == 1
s = s.replace(anc_b, BAIRRO + anc_b, 1)
print('bairro inserido')

# ── lotes: entram logo antes da primeira linha do alpnach ───────────
m = re.search(r"^ *\{ b:'alpnach',", s, re.M)
assert m, 'nao achei onde comecam os lotes'
linhas = ['  // Alphaville Indaiatuba — tabela de vendas de setembro/2026 (131 lotes disponíveis).\n'
          '  // Sem pino individual: a planta não veio georreferenciada por lote; o overlay mostra\n'
          '  // a numeração e cada lote aparece na lista, na busca e no filtro.\n']
for d in sorted(L, key=lambda d: (d['q'], d['l'])):
    saldo = d['valor'] - d['ato']
    parcela = saldo / 60
    assert abs(parcela - d['mensalB']) < 0.05, (d['q'], d['l'], parcela, d['mensalB'])
    linhas.append(
        "  { b:'alphaville', q:'%s', l:'%d', m2:%.2f, tipo:'RESIDENCIAL', pm2:%d, vista:%.2f, "
        "entrada:%.2f, parcela:%.2f, nx:60, ep:20, tabela:true, obs:'%s' },\n"
        % (d['q'], d['l'], d['m2'], round(d['valor'] / d['m2']), d['valor'], d['ato'], d['mensalB'], OBS))
s = s[:m.start()] + ''.join(linhas) + s[m.start():]

io.open(P, 'w', encoding='utf-8', newline='').write(s)

s2 = io.open(P, encoding='utf-8', newline='').read()
n = len(re.findall(r"^ *\{ b:'alphaville',", s2, re.M))
assert n == 131, n
v = [float(x) for x in re.findall(r"b:'alphaville',[^\n]*?vista:([\d.]+)", s2)]
print('gravado: %d lotes | piso R$ %.2f | teto R$ %.2f' % (n, min(v), max(v)))
print('overlay: images/alphaville.png  bounds %s' % BOUNDS)
