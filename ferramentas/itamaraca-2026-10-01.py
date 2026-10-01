# -*- coding: utf-8 -*-
# Itamaracá Residencial: tabela de outubro/2026 do Grupo Zarin (gerada em 01/10/2026).
#
# Mudou o que importa: a de julho listava as 206 unidades como disponíveis;
# a de outubro traz 168. Trinta e oito foram vendidas em menos de três meses —
# e agora a página pode falar em estoque de verdade, não no total do projeto.
#
# Preços subiram (reajuste INCC):
#   Meio 48,11 m²  — 99 unidades, de R$ 345.106,85 a R$ 410.323,31 (era R$ 339.990 o menor)
#   Canto 53,84 m² — 69 unidades, de R$ 370.843,09 a R$ 426.310,35 (era R$ 419.989,50 o maior)
# Estrutura intacta: ato de 2%, 60 mensais e 80% no financiamento da Caixa.
# Menor ato R$ 6.902,17 e menor mensal R$ 1.035,32.
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


aplica('itamaraca-indaiatuba/index.html', [
    ('Itamaracá Residencial (Zarin): 206 aptos MCMV de 48 a 54 m² na Rua Tupinambás, Indaiatuba. A partir de R$ 339.990 (tabela jul/2026), ato 2% + 60 mensais.',
     'Itamaracá Residencial (Zarin): 168 aptos MCMV disponíveis de 48 a 54 m² na Rua Tupinambás, Indaiatuba. A partir de R$ 345.107 (tabela out/2026), ato 2% + 60 mensais.'),
    ('Tabela julho/2026: a partir de R$ 339.990, com ato de 2% e 60 mensais antes do financiamento pela Caixa.',
     'Tabela de outubro/2026: 168 unidades disponíveis a partir de R$ 345.107, com ato de 2% e 60 mensais antes do financiamento pela Caixa.'),
    ('Fonte: Tabela de Preços Itamaracá — julho/2026 (Grupo Zarin, gerada em 17/07/2026), com as 206 unidades listadas como disponíveis nessa data.',
     'Fonte: Tabela de Preços Itamaracá — outubro/2026 (Grupo Zarin, gerada em 01/10/2026), com 168 das 206 unidades listadas como disponíveis nessa data.'),
    ('Pela tabela de julho/2026 do Grupo Zarin, os apartamentos vão de R$ 339.990,00 (Apto Meio 48,11 m², térreo da Torre B) a R$ 419.989,50 (Apto Canto 53,84 m², últimos andares da Torre B).',
     'Pela tabela de outubro/2026 do Grupo Zarin, os apartamentos vão de R$ 345.106,85 (Apto Meio 48,11 m², térreo da Torre B) a R$ 426.310,35 (Apto Canto 53,84 m², últimos andares da Torre A).'),
    ('Tabela julho/2026: ato de 2% do valor (a partir de R$ 6.799,80), 60 parcelas mensais (a partir de R$ 1.019,97)',
     'Tabela de outubro/2026: ato de 2% do valor (a partir de R$ 6.902,17), 60 parcelas mensais (a partir de R$ 1.035,32)'),
    ('Menor valor: Apto Meio 48,11 m² no térreo da Torre B', 'Menor valor: Apto Meio 48,11 m² no térreo da Torre B'),
    ('R$ 339.990,00</td><td>R$ 404.239,50</td>', 'R$ 345.106,85</td><td>R$ 410.323,31</td>'),
], glob=[
    ('A partir de R$ 339.990 · tabela jul/2026', 'A partir de R$ 345.107 · tabela out/2026'),
    ('R$ 339.990 (tabela jul/2026)', 'R$ 345.107 (tabela out/2026)'),
    ('a partir de R$ 339.990', 'a partir de R$ 345.107'),
    ('A partir de R$ 339.990', 'A partir de R$ 345.107'),
    ('MCMV Zarin a partir de R$ 345.107', 'MCMV Zarin a partir de R$ 345.107'),
    ('Atualizado em set/2026 com a tabela de julho/2026 do Grupo Zarin.',
     'Atualizado em out/2026 com a tabela de outubro/2026 do Grupo Zarin.'),
    ('tabela jul/2026', 'tabela out/2026'),
    ('tabela de julho/2026', 'tabela de outubro/2026'),
    ('17/07/2026', '01/10/2026'),
])

# ── FONTE ÚNICA ─────────────────────────────────────────────────────
aplica('gera-folheto.js', [
    ("{ n:'Itamaracá Residencial', c:'Zarin', p:339990,", "{ n:'Itamaracá Residencial', c:'Zarin', p:345107,"),
    ("s:'48 a 54 m² · 1 vaga · tabela de julho/2026', t:'MCMV · FGTS',",
     "s:'48 a 54 m² · 1 vaga · 168 disponíveis (out/2026)', t:'MCMV · FGTS', est:168,"),
])
print('\nagora o ritual.')
