# -*- coding: utf-8 -*-
# Parque Zarah: leva a landing, o llms.txt e a FONTE ÚNICA para a tabela
# "SETEMBRO 180X" recebida em 29/09/2026. 669 lotes (Safira 49, Rubi 226, Pérola 394).
#
# A mudança que mais pesa: os lotes mistos de R$ 172.500 da quadra 14 saíram.
# O "a partir de" do Zarah passa de R$ 172.500 (ato 20.700 + 180x 1.821,86)
# para R$ 210.000 (ato 25.200 + 180x 2.217,91), num misto de 150 m² da quadra 27.
# Esse número mora em gera-folheto.js, então o ritual espalha pelo site inteiro.
#
# Nada de troca global do preço: ele aparece acompanhado de ato e parcela em
# vários pontos, e trocar só o total deixaria a conta errada.
import io, sys
sys.stdout.reconfigure(encoding='utf-8')
R = 'C:/Users/Usuario/Desktop/landing-page/'

def aplica(arq, trocas, global_=()):
    p = R + arq
    s = io.open(p, encoding='utf-8', newline='').read()
    for a, b in trocas:
        n = s.count(a)
        assert n, (arq, 'nao achei', a[:110])
        s = s.replace(a, b)
        if n > 1: print('   (%dx) %s' % (n, a[:50]))
    for a, b in global_:
        n = s.count(a)
        assert n, (arq, 'nao achei (global)', a[:60])
        s = s.replace(a, b)
        print('   %d x "%s"' % (n, a[:44]))
    io.open(p, 'w', encoding='utf-8', newline='').write(s)
    print('ok', arq)

aplica('parque-zarah-indaiatuba/index.html', [
    # ── contagens das fases (tabela) ──────────────────────────────
    ('<td>51<small>de 420 do projeto</small></td>', '<td>49<small>de 420 do projeto</small></td>'),
    ('<td>234<small>de 493 do projeto</small></td>', '<td>226<small>de 493 do projeto</small></td>'),
    ('<td>400<small>de 657 do projeto</small></td>', '<td>394<small>de 657 do projeto</small></td>'),
    ('<td>R$ 172.500<small>150 m² · menor preço da tabela</small></td>',
     '<td>R$ 210.000<small>150 m² · menor preço da tabela</small></td>'),
    ('<td>R$ 284.039<small>247 m² · os de 150 m² saíram da tabela</small></td>',
     '<td>R$ 284.039<small>247 m² · o maior chega a R$ 432.692</small></td>'),
    # ── fichas das fases ──────────────────────────────────────────
    ('<dd>51 — 50 residenciais e 1 misto</dd>', '<dd>49 — 48 residenciais e 1 misto</dd>'),
    ('<dd>234 — 197 residenciais e 37 mistos</dd>', '<dd>226 — 192 residenciais e 34 mistos</dd>'),
    ('<dd>400 — 372 residenciais e 28 mistos</dd>', '<dd>394 — 372 residenciais e 22 mistos</dd>'),
    ('<dd>de 247 a 250 m², de R$ 284.039 a 375.000 · os de 150 m² das quadras 42 e 43 saíram da tabela de 18/09</dd>',
     '<dd>de 247 a 333 m², de R$ 284.039 a 432.692</dd>'),
    ('<dd>150 m² de R$ 172.500 (quadra 14) a R$ 210.000 (quadra 27)</dd>',
     '<dd>de 150 a 273 m², de R$ 210.000 (150 m², quadra 27) a R$ 314.468 (273 m², quadra 14)</dd>'),
    # ── "a partir de", com ato e parcela do lote certo ────────────
    ('<dd>R$ 172.500 — lote misto de 150 m² (tabela set/2026) · residencial a partir de R$ 217.500</dd>',
     '<dd>R$ 210.000 — lote misto de 150 m² (tabela de 29/09/2026) · residencial a partir de R$ 217.500</dd>'),
    ('<div class="fase-preco">R$ 172.500<small>lote misto de 150 m² · menor preço da tabela set/2026</small></div>',
     '<div class="fase-preco">R$ 210.000<small>lote misto de 150 m² · menor preço da tabela set/2026</small></div>'),
    ('<div class="preco-valor">R$ 172.500<small>lote misto de 150 m² · Pérola (Fase 3) · ato R$ 20.700 + 180x de R$ 1.821,86</small>',
     '<div class="preco-valor">R$ 210.000<small>lote misto de 150 m² · Pérola (Fase 3) · ato R$ 25.200 + 180x de R$ 2.217,91</small>'),
    ('a partir de R$ 172.500 (lote misto) e R$ 217.500 (residencial)',
     'a partir de R$ 210.000 (lote misto) e R$ 217.500 (residencial)'),
    ('lotes a partir de R$ 172.500 (lote misto de 150 m², fase Pérola)',
     'lotes a partir de R$ 210.000 (lote misto de 150 m², fase Pérola)'),
    # FAQ: aparece duas vezes (visível e no schema) — o replace pega as duas
    ('começa em R$ 172.500, num lote misto de 150 m² da fase Pérola (ato de R$ 20.700 + 180 parcelas de R$ 1.821,86)',
     'começa em R$ 210.000, num lote misto de 150 m² da fase Pérola (ato de R$ 25.200 + 180 parcelas de R$ 2.217,91)'),
    # o misto de 150 m² da Rubi já não existe: os que restam começam em 247 m²
    ('150 m² a partir de R$ 172.500 na Pérola e de R$ 180.000 na Rubi',
     '150 m² a partir de R$ 210.000 na Pérola; na Rubi os mistos começam em 247 m², por R$ 284.039'),
], global_=[
    ('685 lotes', '669 lotes'),
    ('<strong>685</strong>', '<strong>669</strong>'),
    ('gerada em 18/09/2026', 'gerada em 29/09/2026'),
])

aplica('llms.txt', [
    ('gerada em 29/09/2026; 685 lotes disponíveis' if False else 'gerada em 18/09/2026; 685 lotes disponíveis',
     'gerada em 29/09/2026; 669 lotes disponíveis'),
    ('Fase 1 SAFIRA: 51 lotes disponíveis', 'Fase 1 SAFIRA: 49 lotes disponíveis'),
    ('Fase 2 RUBI: 234 lotes', 'Fase 2 RUBI: 226 lotes'),
    ('Fase 3 PÉROLA: 400 lotes', 'Fase 3 PÉROLA: 394 lotes'),
])

# ── FONTE ÚNICA ─────────────────────────────────────────────────────
aplica('gera-folheto.js', [
    ("{ n:'Parque Zarah', c:'Zarin', p:172500, m2:150,", "{ n:'Parque Zarah', c:'Zarin', p:210000, m2:150,"),
])

print('\nfeito. agora o ritual: gera-folheto -> gera-observatorio -> gera-home ->')
print('gera-apartamentos -> gera-blog-ofertas -> gera-blog-indice -> gera-relacionados -> identidade')
