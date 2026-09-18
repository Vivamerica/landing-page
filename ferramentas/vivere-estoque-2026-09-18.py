# -*- coding: utf-8 -*-
# Vívere Residencial: estoque informado pelo Fabio em 18/09/2026 — Torre 7, disponíveis 0001, 0013 e 0033;
# reservados 0003, 0105 e 0114. Tira os cards do 0105 e do 0114, anota os reservados e acerta contagem, faixa e FAQ.
import re, sys
sys.stdout.reconfigure(encoding='utf-8')
R = 'C:/Users/Usuario/Desktop/landing-page/'
P = R + 'vivere-indaiatuba/index.html'
s = open(P, encoding='utf-8', newline='').read()

def troca(a, b, n=1):
    global s
    assert s.count(a) >= (1 if n == 'todos' else n), ('nao achei', a[:80], s.count(a))
    s = s.replace(a, b) if n == 'todos' else s.replace(a, b, n)

RES = 'Reservados: 0003, 0105 e 0114.'
# cards das unidades reservadas (0114 e 0105) saem da grade
for apto in ('0114', '0105'):
    m = re.search(r'\n      <article class="unid">(?:(?!</article>).)*?Apto %s · Torre 7(?:(?!</article>).)*?</article>' % apto, s, re.S)
    assert m, apto
    s = s[:m.start()] + s[m.end():]

troca('Últimas 5 unidades (set/26) · R$ 352 mil', 'Últimas 3 unidades (set/26) · R$ 352 mil', 'todos')
troca('últimas 5 unidades (set/2026), todas na Torre 7, a partir de R$ 352.552. 2 dorms, 46 a 50 m²',
      'últimas 3 unidades (18/09/2026), todas na Torre 7, a partir de R$ 352.552. 2 dorms, 48 a 50 m²', 'todos')
troca('Últimas 5 unidades (set/2026) de 2 dormitórios, de 46,77 a 50,52 m², com 1 vaga, todas na Torre 7: aptos 0001, 0013, 0033, 0105 e 0114 (relatório de estoque Masotti de 04/09/2026).',
      'Últimas 3 unidades (18/09/2026) de 2 dormitórios, com 1 vaga, todas na Torre 7: aptos 0001, 0013 e 0033; os aptos 0003, 0105 e 0114 estão reservados.')
troca('2 dormitórios, 46,77 a 50,52 m², 1 vaga', '2 dormitórios, 48,36 a 50,52 m² nas unidades com planta publicada, 1 vaga')
troca('Últimas 5 unidades (set/2026), todas na Torre 7 — aptos 0001, 0013, 0033, 0105 e 0114 (relatório de estoque Masotti de 04/09/2026).',
      'Últimas 3 unidades (18/09/2026), todas na Torre 7 — aptos 0001, 0013 e 0033; 0003, 0105 e 0114 reservados.')
troca('Segundo o relatório de estoque da Masotti de 04/09/2026, restam 5 unidades (set/2026), todas na Torre 7: apto 0001 (térreo, garden), 0013 (1º andar), 0033 (3º andar), 0105 (10º andar) e 0114 (11º andar). Todas de 2 dormitórios com 1 vaga.',
      'Na atualização de 18/09/2026 restam 3 unidades disponíveis, todas na Torre 7: apto 0001 (térreo, garden), 0013 (1º andar) e 0033 (3º andar). Os aptos 0003, 0105 e 0114 estão reservados e voltam à venda se a reserva cair. Todas de 2 dormitórios com 1 vaga.', 'todos')
troca('<span class="hero-alerta">Últimas 5 unidades à venda (set/2026)</span>', '<span class="hero-alerta">Últimas 3 unidades à venda (18/09/2026)</span>')
troca('Sobraram 5 apartamentos de 2 dormitórios', 'Sobraram 3 apartamentos de 2 dormitórios')
troca('Ver as 5 unidades ↓', 'Ver as 3 unidades ↓')
troca('Disponibilidade em 04/09/2026 · relatório de estoque Masotti', 'Disponibilidade em 18/09/2026')
troca('As 5 últimas unidades, <em>', 'As 3 últimas unidades, <em>')
troca('0013 (1º andar), 0033 (3º andar), 0105 (10º andar) e 0', 'X')   # marca para a linha da lista (reescrita abaixo)
s = re.sub(r'X[^<]*</p>', '0013 (1º andar) e 0033 (3º andar). ' + RES + '</p>', s, count=1)
troca('<strong>5</strong>\n        <p>unidades e o Vívere fecha.', '<strong>3</strong>\n        <p>unidades e o Vívere fecha.')
troca('disponibilidade conforme relatório de estoque Masotti de 04/09/2026 — atualizado em 04/09/2026.',
      'disponibilidade atualizada em 18/09/2026 (0003, 0105 e 0114 reservados).')
troca('últimas 5 unidades (set/2026), todas na Torre 7</dd>', 'últimas 3 unidades (18/09/2026), todas na Torre 7</dd>')
troca('<dd>46,77 a 50,52 m² (unidades disponíveis)', '<dd>48,36 a 50,52 m² (unidades disponíveis com planta; 0013 sob consulta)')
troca('<span class="cta-urgency">5 unidades (set/2026) · quando acabar, acabou</span>', '<span class="cta-urgency">3 unidades (18/09/2026) · quando acabar, acabou</span>')
troca('disponibilidade conforme relatório de estoque Masotti de 04/09/2026. Incorporação', 'disponibilidade atualizada em 18/09/2026. Incorporação')
# FAQ de preco (schema e visivel): tira o 0105 e o 0114
antes = s
s = s.replace('os preços vão de R$ 352.552,41 (apto 0001, térreo garden de 50,52 m²) a R$ 361.216,00 (apto 0105, 10º andar da Torre 7); o apto 0033 (3º andar) custa R$ 352.557,27. Os aptos 0013 (1º andar) e 0114 (11º andar) entraram no estoque em 04/09/2026 e têm preço sob consulta.',
              'o apto 0001 (térreo garden de 50,52 m²) custa R$ 352.552,41 e o apto 0033 (3º andar, 48,36 m²) R$ 352.557,27; o apto 0013 (1º andar) tem preço sob consulta.')
assert s != antes, 'FAQ preco schema'
m = re.search(r'o térreo \(apto 0001, 50,52 m²\) e o 3º andar \(apto 0033\) ficam em R\$ 352 mil; o 10º andar da Torre 7 \(apto 0105\), com vista, em R\$ 361\.216\. Os aptos 0013 \(1º\) e 0114 \(11º\) entraram no estoque em 04/09/2026 e têm preço[^.<]*\.', s)
assert m, 'FAQ preco visivel'
s = s[:m.start()] + 'o térreo (apto 0001, 50,52 m²) e o 3º andar (apto 0033) ficam em R$ 352 mil. O apto 0013 (1º andar) tem preço sob consulta.' + s[m.end():]
open(P, 'w', encoding='utf-8', newline='').write(s)
print('restos:', {k: s.count(k) for k in ('0105', '0114', '5 unidades', '361.216', '04/09/2026')})

L = R + 'llms.txt'
t = open(L, encoding='utf-8', newline='').read()
a = 'últimas 5 unidades (set/2026)](https://lancamentos.imoveisvivamerica.com.br/vivere-indaiatuba/): condomínio entregue em 2026 no Jardim Veneza, Indaiatuba. As 5 unidades restantes ficam na Torre 7: apartamentos de 2 dormitórios, 46,77 a 50,52 m², de R$ 352.552 a R$ 361.216, com preço de cada unidade publicado.'
b = 'últimas 3 unidades (18/09/2026)](https://lancamentos.imoveisvivamerica.com.br/vivere-indaiatuba/): condomínio entregue em 2026 no Jardim Veneza, Indaiatuba. As 3 unidades disponíveis ficam na Torre 7 (aptos 0001, 0013 e 0033; 0003, 0105 e 0114 reservados): apartamentos de 2 dormitórios, R$ 352.552 (0001, 50,52 m²) e R$ 352.557 (0033, 48,36 m²); o 0013 com preço sob consulta.'
assert a in t
open(L, 'w', encoding='utf-8', newline='').write(t.replace(a, b, 1))
F = R + 'gera-folheto.js'
g = open(F, encoding='utf-8', newline='').read()
a = "pronto para morar · últimas 5 unidades', t:'MCMV · Pronto', est:5,"
assert a in g
open(F, 'w', encoding='utf-8', newline='').write(g.replace(a, "pronto para morar · últimas 3 unidades', t:'MCMV · Pronto', est:3,", 1))
print('ok')
