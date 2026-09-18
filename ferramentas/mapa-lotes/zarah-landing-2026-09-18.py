# -*- coding: utf-8 -*-
# Parque Zarah: leva a pagina, o llms.txt, a home e a fonte unica para a tabela Zarin gerada em 18/09/2026
# (685 lotes: Safira 51, Rubi 234, Perola 400). Cada troca confere que o trecho antigo existe.
import sys
sys.stdout.reconfigure(encoding='utf-8')
R = 'C:/Users/Usuario/Desktop/landing-page/'

def aplica(arq, trocas, global_=()):
    p = R + arq
    s = open(p, encoding='utf-8', newline='').read()
    for a, b in trocas:
        assert a in s, (arq, 'nao achei', a[:90])
        s = s.replace(a, b, 1)
    for a, b in global_:
        n = s.count(a)
        s = s.replace(a, b)
        print('  %s: %d x "%s"' % (arq, n, a[:40]))
    open(p, 'w', encoding='utf-8', newline='').write(s)
    print('ok', arq)

aplica('parque-zarah-indaiatuba/index.html', [
    ('e R$ 212.072 (residencial)', 'e R$ 217.500 (residencial)'),
    ('residenciais a partir de R$ 212.072', 'residenciais a partir de R$ 217.500'),
    ('<td>57<small>de 420 do projeto</small></td>', '<td>51<small>de 420 do projeto</small></td>'),
    ('R$ 369.739<small>315 m² · só 2 lotes</small>', 'R$ 369.739<small>315 m² · só 1 lote</small>'),
    ('<td>268<small>de 493 do projeto</small></td><td>R$ 212.072<small>151 m² · padrão 150 m² por R$ 225.000</small></td><td>R$ 180.000<small>150 m² · 250 m² desde R$ 287.500</small></td>',
     '<td>234<small>de 493 do projeto</small></td><td>R$ 224.574<small>160 m² · padrão 150 m² por R$ 225.000</small></td><td>R$ 284.039<small>247 m² · os de 150 m² saíram da tabela</small></td>'),
    ('<td>409<small>de 657 do projeto</small></td>', '<td>400<small>de 657 do projeto</small></td>'),
    ('<dd>57 — 55 residenciais e 2 mistos</dd>', '<dd>51 — 50 residenciais e 1 misto</dd>'),
    ('<dd>2 lotes, de 271 e 315 m², a partir de R$ 369.739</dd>', '<dd>1 lote, de 315 m², por R$ 369.739</dd>'),
    ('<dd>268 — 222 residenciais e 46 mistos</dd>', '<dd>234 — 197 residenciais e 37 mistos</dd>'),
    ('<dd>R$ 212.072 (151 m², quadra 39)</dd>', '<dd>R$ 224.574 (160 m², quadra 31)</dd>'),
    ('<dd>150 m² de R$ 180.000 a 195.000 (quadras 42 e 43) · 250 m² de R$ 287.500 a 375.000</dd>',
     '<dd>de 247 a 250 m², de R$ 284.039 a 375.000 · os de 150 m² das quadras 42 e 43 saíram da tabela de 18/09</dd>'),
    ('<dd>409 — 373 residenciais e 36 mistos</dd>', '<dd>400 — 372 residenciais e 28 mistos</dd>'),
    ('R$ 217.500 nos 18 lotes com viela sanitária', 'R$ 217.500 nos 17 lotes com viela sanitária'),
    ('Residencial a partir de R$ 212.072 (151 m², Rubi)', 'Residencial a partir de R$ 217.500 (150 m² com viela sanitária, Pérola)'),
    ('residencial a partir de R$ 212.072', 'residencial a partir de R$ 217.500'),
    ('o residencial mais barato da tabela é um lote de 151 m² da Rubi por R$ 212.072',
     'o residencial mais barato da tabela é um lote de 150 m² com viela sanitária da Pérola por R$ 217.500'),
    ('o residencial mais barato é um lote de 151 m² da Rubi por R$ 212.072',
     'o residencial mais barato é um lote de 150 m² com viela sanitária da Pérola por R$ 217.500'),
], global_=[('734 lotes', '685 lotes'), ('<strong>734</strong>', '<strong>685</strong>'),
            ('gerada em 02/09/2026', 'gerada em 18/09/2026')])

aplica('llms.txt', [
    ('gerada em 02/09/2026; 734 lotes disponíveis em set/2026', 'gerada em 18/09/2026; 685 lotes disponíveis'),
    ('Fase 1 SAFIRA: 57 lotes disponíveis (set/2026)', 'Fase 1 SAFIRA: 51 lotes disponíveis'),
    ('Fase 2 RUBI: 268 lotes, residencial de 150 m² por R$ 225.000, misto externo (frente para via) de 150 m² por R$ 180.000 a 195.000 e de 250 m² por R$ 375.000',
     'Fase 2 RUBI: 234 lotes, residencial de 150 m² por R$ 225.000 (160 m² por R$ 224.574), misto externo (frente para via) de 247 a 250 m² de R$ 284.039 a 375.000'),
    ('Fase 3 PÉROLA: 409 lotes', 'Fase 3 PÉROLA: 400 lotes'),
    ('menor residencial: R$ 212.072 (151,48 m², Rubi)', 'menor residencial: R$ 217.500 (150 m² com viela sanitária, Pérola)'),
])
aplica('index.html', [('residencial a partir de R$ 212.072 (151,48 m², Rubi)', 'residencial a partir de R$ 217.500 (150 m², Pérola)')])
aplica('gera-folheto.js', [("residencial a partir de R$ 212 mil", "residencial a partir de R$ 217,5 mil")])
