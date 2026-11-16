# -*- coding: utf-8 -*-
# Itamaracá Residencial: tabela de novembro/2026 do Grupo Zarin (gerada em 12/11/2026).
#
# Preços iguais aos de outubro (de R$ 345.106,85 a R$ 426.310,35; menor ato R$ 6.902,17, menor mensal R$ 1.035,32;
# financiamento em 01/02/2030). Mudou o estoque: 166 -> 162 disponíveis (saíram os aptos 38 e 77 da Torre A e 61 e 81
# da Torre B, todos Canto de 53,84 m²). A tabela de novembro lista só as unidades disponíveis; a de outubro listava as
# 206 (166 disponíveis, 2 reservadas e 38 vendidas). Por isso as contagens de vaga da página (84 com segunda vaga,
# 6 PCD), que são das 206 unidades, continuam atribuídas à tabela de outubro.
# Menor valor continua nos aptos 3 e 5 do térreo da Torre B; maior valor (Canto com 2ª vaga de carro) continua entre
# o 9º e o 12º andar das duas torres; 1º andar em diante, Meio de R$ 360.337,32 a R$ 410.323,31.
#
# Uso: python ferramentas/itamaraca-2026-11-16.py      (depois o ritual: gera-folheto.js em diante)
import io, os, sys
sys.stdout.reconfigure(encoding='utf-8')
R = os.path.dirname(os.path.dirname(os.path.abspath(__file__))) + '/'


def aplica(arq, trocas, sobra=()):
    p = R + arq
    s = s0 = io.open(p, encoding='utf-8', newline='').read()
    assert '\r' not in s
    for a, b, n in trocas:
        k = s.count(a)
        if k == 0 and s.count(b) >= n:   # rodada repetida: troca já feita
            print('   já  %s' % b[:70]); continue
        assert k == n, (arq, 'esperava %d, achei %d' % (n, k), a[:110])
        s = s.replace(a, b)
        print('   %dx  %s' % (k, a[:70]))
    for a, n in sobra:   # o que DEVE continuar no arquivo depois das trocas
        assert s.count(a) == n, (arq, 'sobra', s.count(a), a[:80])
    if s != s0:
        io.open(p, 'w', encoding='utf-8', newline='').write(s)
    print('ok', arq, '' if s != s0 else '(sem mudança)')


aplica('itamaraca-indaiatuba/index.html', [
    ('166 aptos MCMV disponíveis, 48 a 54 m², a partir de R$ 345.107 (tabela de 11/10/2026)',
     '162 aptos MCMV disponíveis, 48 a 54 m², a partir de R$ 345.107 (tabela de 12/11/2026)', 3),
    ('Tabela de outubro/2026: de R$ 345.106,85 a R$ 426.310,35', 'Tabela de novembro/2026: de R$ 345.106,85 a R$ 426.310,35', 1),
    ('Tabela de preços Itamaracá outubro/2026 (Grupo Zarin)', 'Tabela de preços Itamaracá novembro/2026 (Grupo Zarin)', 1),
    ('Tabela de outubro/2026 a partir de R$ 345.107,00', 'Tabela de novembro/2026 a partir de R$ 345.107,00', 1),
    ('A partir de R$ 345.107 · tabela out/2026', 'A partir de R$ 345.107 · tabela nov/2026', 2),
    ('Atualizado em 27/10/2026 · tabela Zarin de out/2026, emitida em 11/10/2026',
     'Atualizado em 16/11/2026 · tabela Zarin de nov/2026, emitida em 12/11/2026', 1),
    ('com 166 unidades disponíveis na tabela Zarin de out/2026, emitida em 11/10/2026',
     'com 162 unidades disponíveis na tabela Zarin de nov/2026, emitida em 12/11/2026', 1),
    ('166 unidades disponíveis (11/10/2026) · tabela Zarin de out/2026', '162 unidades disponíveis (12/11/2026) · tabela Zarin de nov/2026', 1),
    ('<span>A partir de · tabela out/2026</span>', '<span>A partir de · tabela nov/2026</span>', 1),
    ('R$ 345.107 (tabela out/2026)', 'R$ 345.107 (tabela nov/2026)', 1),
    ('Investimento · tabela outubro/2026', 'Investimento · tabela novembro/2026', 1),
    ('Atualizado em out/2026 com a tabela de outubro/2026 do Grupo Zarin.', 'Atualizado em nov/2026 com a tabela de novembro/2026 do Grupo Zarin.', 1),
    ('Itamaracá · Apartamento MCMV · tabela out/2026', 'Itamaracá · Apartamento MCMV · tabela nov/2026', 1),
    ('as duas unidades com esse valor na tabela emitida em 11/10/2026', 'as duas unidades com esse valor na tabela emitida em 12/11/2026', 1),
    ('Fonte: Tabela de Preços Itamaracá — outubro/2026 (Grupo Zarin, emitida em 11/10/2026), com 166 das 206 unidades listadas como disponíveis nessa data (2 reservadas e 38 vendidas).',
     'Fonte: Tabela de Preços Itamaracá — novembro/2026 (Grupo Zarin, emitida em 12/11/2026), que lista as 162 unidades disponíveis nessa data, das 206 do empreendimento (eram 166 na tabela de outubro).', 1),
    ('Pela tabela de outubro/2026 do Grupo Zarin, os apartamentos vão de', 'Pela tabela de novembro/2026 do Grupo Zarin, os apartamentos vão de', 2),
    ('Tabela de outubro/2026: ato de 2% do valor', 'Tabela de novembro/2026: ato de 2% do valor', 2),
    ('R$ 345.107 na tabela de outubro/2026.', 'R$ 345.107 na tabela de novembro/2026.', 1),
    ('Preços conforme a tabela de outubro/2026 do Grupo Zarin, sujeita a alteração sem aviso prévio. Atualizado em out/2026.',
     'Preços conforme a tabela de novembro/2026 do Grupo Zarin, sujeita a alteração sem aviso prévio. Atualizado em nov/2026.', 1),
    # revisão de 16/11: o que a 1ª rodada deixou para trás
    ('"offerCount": 166', '"offerCount": 162', 1),
    ("atualizados pela Imobiliária Viv'América (CRECI 47394-J) em outubro de 2026", "atualizados pela Imobiliária Viv'América (CRECI 47394-J) em novembro de 2026", 1),
    # coluna Vagas da tabela de preços (card "tabela nov/2026"): contagem entre as DISPONÍVEIS de novembro
    # (Meio: 24 carro + 18 moto, PCD só o B3; Canto: 17 carro + 12 moto, PCD A1, A2, B1 e B2)
    ('1 descoberta (43 c/ 2ª vaga carro ou moto; 2 PCD)', '1 descoberta (42 das 99 disponíveis c/ 2ª vaga carro ou moto; 1 PCD)', 1),
    ('1 descoberta (41 c/ 2ª vaga carro ou moto; 4 PCD)', '1 descoberta (29 das 63 disponíveis c/ 2ª vaga carro ou moto; 4 PCD)', 1),
    # o maior valor não está do 9º ao 12º nas DUAS torres: Torre B do 9º ao 12º, Torre A só no 10º e 11º
    ('segunda vaga de carro, entre o 9º e o 12º andar das duas torres)', 'segunda vaga de carro, do 9º ao 12º andar na Torre B e no 10º e 11º andar na Torre A)', 3),
], sobra=[
    ('Na tabela de outubro/2026, 84 unidades trazem uma segunda vaga', 2),   # contagem das 206 unidades (só a de outubro lista todas)
    ('outubro/2026', 2),
    ('out/2026', 1),            # card do Spazio Italia (outro empreendimento)
    ('11/10/2026', 0), ('166', 1), ('outubro de 2026', 0),   # o único 166 é o "(eram 166 na tabela de outubro)" da fonte
])

aplica('llms.txt', [
    ('Tabela de preços de outubro/2026 (emitida em 11/10/2026): 166 das 206 unidades disponíveis, de R$ 345.106,85',
     'Tabela de preços de novembro/2026 (emitida em 12/11/2026): 162 das 206 unidades disponíveis, de R$ 345.106,85', 1),
    ('segunda vaga de carro, entre o 9º e o 12º andar das duas torres)', 'segunda vaga de carro, do 9º ao 12º andar na Torre B e no 10º e 11º andar na Torre A)', 1),
])

# ── BLOG: texto escrito à mão com o estoque de outubro, na mesma página do card regerado (162) ──
aplica('blog/incc-parcela-na-planta/index.html', [
    ('Unidade a partir de R$ 345.106,85 na tabela de outubro/2026 (emitida em 11/10/2026; 166 unidades disponíveis)',
     'Unidade a partir de R$ 345.106,85 na tabela de novembro/2026 (emitida em 12/11/2026; 162 unidades disponíveis)', 1),
])
aplica('blog/mcmv-faixa-3-indaiatuba/index.html', [
    ('<td data-r="Tabela">out/2026</td><td data-r="Tipologia e estoque">48 a 54 m²; 166 unidades disponíveis em 11/10/2026</td>',
     '<td data-r="Tabela">nov/2026</td><td data-r="Tipologia e estoque">48 a 54 m²; 162 unidades disponíveis em 12/11/2026</td>', 1),
])

# ── FONTE ÚNICA ─────────────────────────────────────────────────────
aplica('gera-folheto.js', [
    ("{ n:'Itamaracá Residencial', c:'Zarin', p:345107, m2:48.11, tab:'2026-10',",
     "{ n:'Itamaracá Residencial', c:'Zarin', p:345107, m2:48.11, tab:'2026-11',", 1),
    ("s:'48 a 54 m² · 1 vaga · 166 disponíveis (11/10/2026)', t:'MCMV · FGTS', est:166, estEm:'11/10/2026',",
     "s:'48 a 54 m² · 1 vaga · 162 disponíveis (12/11/2026)', t:'MCMV · FGTS', est:162, estEm:'12/11/2026',", 1),
])
# ── OBSERVATÓRIO: estoque anterior (a guarda do gera-observatorio.js exige nota e est alinhados à fonte única) ──
aplica('gera-observatorio.js', [
    ("fonte: 'tabela Zarin de julho/2026; atual: tabela de outubro/2026 emitida em 11/10/2026 (166 disponíveis)', est: 166, saida: ['a menos na lista', 'a menos na lista'], nota: 'a tabela de julho listava as 206 unidades do projeto como disponíveis; a emitida em 11/10/2026 traz 166 disponíveis, 2 reservadas e 38 vendidas' },",
     "fonte: 'tabela Zarin de julho/2026; atual: tabela de novembro/2026 emitida em 12/11/2026 (162 disponíveis)', est: 162, saida: ['a menos na lista', 'a menos na lista'], nota: 'a tabela de julho listava as 206 unidades do projeto como disponíveis; a emitida em 11/10/2026 trazia 166 disponíveis, 2 reservadas e 38 vendidas, e a de 12/11/2026 lista 162 disponíveis' },", 1),
])
print('\nagora o ritual.')
