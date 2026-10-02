# -*- coding: utf-8 -*-
# Reserva Botanica entra no mapa de lotes: bairro e os 2 lotes que restam.
#
# Dados da tabela Zarin de 29/09/2026, ja publicados na landing:
#   C-1   410,01 m²  R$ 642.374,83
#   B-13  456,70 m²  R$ 715.525,59
# Entrada de ~11,4% e saldo em 36x, 60x ou 120x pela Tabela Price a 1% a.m.
# Publicamos o prazo de 120x, que e o que a landing usa como referencia.
#
# SEM OVERLAY POR ENQUANTO: a planta que o Fabio mandou e de projeto e a obra no
# satelite so executou a parte de baixo, entao nao ha feicao suficiente para
# alinhar sem pontos de controle. O bairro entra com centro proprio (a
# coordenada do Google Maps que ele passou) e os 2 lotes sem pino, para ele
# marcar no editor — com so dois, e mais rapido marcar que georreferenciar.
import io, math, os, re, sys
sys.stdout.reconfigure(encoding='utf-8')

P = 'C:/Users/Usuario/Desktop/landing-page/mapa-lotes-indaiatuba/index.html'
CENTRO = (-23.0521707, -47.2250614)          # Google Maps, passado pelo Fabio em 02/10/2026
I, N = 0.01, 120
FATOR = I / (1 - (1 + I) ** -N)

OBS = ('Valor de tabela Zarin de 29/09/2026: entrada de cerca de 11,4% e saldo em 36x, 60x ou 120x '
       'pela Tabela Price, com juros de 1% a.m.; a parcela abaixo e a de 120x. '
       'Liberacao para construcao prevista para novembro de 2026')

LOTES = [
    ('C', '1', 410.01, 642374.83),
    ('B', '13', 456.70, 715525.59),
]

BAIRRO = ("  { id:'reserva-botanica', fechado:true, centro:[%.7f,%.7f], nome:'Reserva Botânica', "
          "sub:'loteamento fechado · últimas 2 unidades (tabela Zarin de 29/09/2026) · liberação para construção em nov/2026', "
          "landing:'/reserva-botanica-indaiatuba/', "
          "cond:'entrada de cerca de 11,4%% e saldo em até 120 parcelas pela Tabela Price a 1%% a.m., tabela Zarin de 29/09/2026', "
          "tab:'29/09/2026' },\n" % CENTRO)

s = io.open(P, encoding='utf-8', newline='').read()
assert "id:'reserva-botanica'" not in s, 'ja esta no mapa'

anc = "  { id:'alphaville',"
assert s.count(anc) == 1
s = s.replace(anc, BAIRRO + anc, 1)
print('bairro inserido')

m = re.search(r"^ *\{ b:'alphaville',", s, re.M)
assert m
linhas = ['  // Reserva Botânica — últimas 2 unidades da tabela Zarin de 29/09/2026.\n'
          '  // Sem pino ainda: a planta é de projeto e a obra no satélite só executou a parte\n'
          '  // de baixo, então falta ponto de controle para georreferenciar o desenho.\n']
for q, l, m2, vista in LOTES:
    entrada = round(vista * 0.114, 2)
    parcela = (vista - entrada) * FATOR
    linhas.append(
        "  { b:'reserva-botanica', q:'%s', l:'%s', m2:%.2f, tipo:'RESIDENCIAL', pm2:%d, vista:%.2f, "
        "entrada:%.2f, parcela:%.2f, nx:%d, ep:11, tabela:true, obs:'%s' },\n"
        % (q, l, m2, round(vista / m2), vista, entrada, parcela, N, OBS))
s = s[:m.start()] + ''.join(linhas) + s[m.start():]

io.open(P, 'w', encoding='utf-8', newline='').write(s)
s2 = io.open(P, encoding='utf-8', newline='').read()
n = len(re.findall(r"^ *\{ b:'reserva-botanica',", s2, re.M))
assert n == 2, n
print('gravado: %d lotes' % n)
for q, l, m2, vista in LOTES:
    entrada = round(vista * 0.114, 2)
    print('   %s-%s  %.2f m²  R$ %.2f  entrada R$ %.2f  120x de R$ %.2f'
          % (q, l, m2, vista, entrada, (vista - entrada) * FATOR))
