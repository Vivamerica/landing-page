# -*- coding: utf-8 -*-
# Spazio Italia: tabela de outubro/2026 do Grupo Zarin (gerada em 01/10/2026).
#
# A novidade é a TORRE 4. A tabela de junho trazia 149 unidades em 3 torres;
# esta traz 228 em 4, e as torres ganharam nome: 1 Veneza, 2 Florença, 3 Roma
# e 4 Milão. A Milão entrou com 86 unidades e puxou o piso para baixo:
# o "a partir de" cai de R$ 448.820 para R$ 429.961,17.
#
# Faixa nova: R$ 429.961,17 (59,50 m², Torre 4) a R$ 590.613,78 (63,58 m², Torre 3).
#
# Fluxo conferido somando os componentes de uma unidade: ato de 7% + 42 mensais
# + 2 anuais + 1 semestral + 70% no financiamento dão EXATAMENTE o valor total —
# ou seja, sem juros até a entrega. A política comercial da tabela diz o mesmo:
# correção mensal pelo INCC, e só depois da entrega incide 1% Price + IGPM.
#
# A tabela de outubro não traz mais marcação PNE; a página deixa de listar
# unidades adaptáveis por número até a Zarin reconfirmar quais são.
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
        print('   %dx  %s' % (n, a[:60]))
    for a, b in glob:
        n = s.count(a)
        if n:
            s = s.replace(a, b)
            print('   %dx  %s' % (n, a[:60]))
    io.open(p, 'w', encoding='utf-8', newline='').write(s)
    print('ok', arq)


aplica('spazio-italia-indaiatuba/index.html', [
    ('3 torres em comercialização pela Zarin, com apartamentos a partir de R$ 448.820 (59,5 m², 1 vaga — tabela junho/26)',
     '4 torres em comercialização pela Zarin, com apartamentos a partir de R$ 429.961 (59,5 m², 1 vaga — tabela outubro/26)'),
    ('149 unidades listadas na tabela junho/26, em 3 torres (térreo + 13 pavimentos)',
     '228 unidades listadas na tabela outubro/26, em 4 torres (térreo + 13 pavimentos): Veneza, Florença, Roma e Milão'),
    ('O Spazio Italia saiu do pré-lançamento. A tabela oficial do Grupo Zarin (junho/26, documento de 10/07/2026) lista 149 unidades nas torres 1, 2 e 3, de R$ 448.820 a R$ 581.857 — disponibilidade a confirmar, valores sujeitos a alteração.',
     'A tabela oficial do Grupo Zarin (outubro/26, documento de 01/10/2026) lista 228 unidades nas quatro torres — Veneza, Florença, Roma e Milão —, de R$ 429.961 a R$ 590.614. A Torre 4 (Milão) entrou nesta tabela com 86 unidades e é hoje a de menor preço. Disponibilidade a confirmar, valores sujeitos a alteração.'),
    ('Até R$ 581.857 (63,58 m², 2 vagas, torre 3).', 'Até R$ 590.614 (63,58 m², 2 vagas, Torre 3 — Roma).'),
    ('Pela tabela oficial do Grupo Zarin de junho/26 (documento de 10/07/2026), os apartamentos vão de R$ 448.820 (59,5 m², 1 vaga, torre 3) a R$ 581.857 (63,58 m², 2 vagas, torre 3).',
     'Pela tabela oficial do Grupo Zarin de outubro/26 (documento de 01/10/2026), os apartamentos vão de R$ 429.961 (59,5 m², 1 vaga, Torre 4 — Milão) a R$ 590.614 (63,58 m², 2 vagas, Torre 3 — Roma).'),
    ('— na tabela indicadas como PNE: torre 1, apartamentos 133, 136 e 137; torre 2, apartamentos 132, 136 e 137.',
     '— a tabela de outubro não marca mais essas unidades; confirme conosco quais são.'),
    ('O fluxo de pagamento da tabela vai até jun/2028 (última intermediária); a data de entrega não consta na tabela.',
     'O fluxo da tabela de outubro aponta o financiamento em fevereiro/2029; a data de entrega não consta na tabela.'),
], glob=[
    ('R$ 448.820', 'R$ 429.961'),
    ('R$ 581.857', 'R$ 590.614'),
    ('tabela junho/26', 'tabela outubro/26'),
    ('junho/26 (documento de 10/07/2026)', 'outubro/26 (documento de 01/10/2026)'),
    ('Grupo Zarin, junho/26 (documento de 10/07/2026)', 'Grupo Zarin, outubro/26 (documento de 01/10/2026)'),
    ('10/07/2026', '01/10/2026'),
    ('junho/26', 'outubro/26'),
    ('Atualizado em set/2026', 'Atualizado em out/2026'),
    ('3 torres em comercialização', '4 torres em comercialização'),
    ('3 Torres · T+13', '4 Torres · T+13'),
])

# ── FONTE ÚNICA ─────────────────────────────────────────────────────
aplica('gera-folheto.js', [
    ("{ n:'Spazio Italia', c:'Zarin', p:448820,", "{ n:'Spazio Italia', c:'Zarin', p:429961,"),
])
print('\nagora o ritual.')
