# -*- coding: utf-8 -*-
# Inventário dos empreendimentos Alphaville, para o Fabio trabalhar.
#
# DUAS ABAS, porque são duas coisas diferentes:
#   "No catálogo hoje"  os 22 produtos que estão no site oficial em 04/10/2026,
#                       lidos pela API do WordPress deles e pela ficha de cada
#                       card (metragem e unidades). Esses existem e têm número.
#   "Histórico (CVM)"   praças que aparecem nomeadas em documento entregue à
#                       CVM ou confirmadas em fonte pública, mas que NÃO estão
#                       no catálogo. Servem de pauta e de mercado de revenda,
#                       não de estoque para vender na planta.
#
# O status é a coluna que decide o que fazer com cada um: "lançamento",
# "breve lançamento" e "em construção" têm venda primária; "entregue" e
# "100% vendido" só têm revenda.
import io, os, sys
sys.stdout.reconfigure(encoding='utf-8')
from openpyxl import Workbook
from openpyxl.styles import Font, PatternFill, Alignment
from openpyxl.utils import get_column_letter

DEST = 'C:/Users/Usuario/Desktop/landing-page/ferramentas/alphaville-inventario.xlsx'

# ── catálogo oficial, lido em 04/10/2026 ────────────────────────────
# (uf, cidade, nome, linha, tipo, status, lote, unidades, slug)
CAT = [
 ('SP','Indaiatuba','Alphaville Indaiatuba','Alphaville','Residencial','lançamento','a partir de 510 m²','294','alphaville-indaiatuba'),
 ('SP','Votorantim','Parque Alphaville Alvorada','Terras Alpha','Residencial/Comercial','breve lançamento','mínimo 200 m²','626','parque-alphaville-alvorada'),
 ('SP','Ribeirão Preto','Terras Alpha Ribeirão Preto','Terras Alpha','Residencial','em construção','a partir de 300 m²','457','terras-alpha-ribeirao-preto'),
 ('SP','Campinas','Parque Alphaville Campinas','Alphaville','Lotes Comerciais','em construção','250,00 a 3.948,49 m²','','lotes-comerciais-parque-alphaville-campinas'),
 ('SP','Campinas','Casas Alphaville Dom Pedro 0','Alphaville','Casas','entregue','5 modelos, 288 a 362 m²','42 casas','casas-alphaville-dom-pedro-0'),
 ('CE','Eusébio','Terras Alphaville Ceará 6','Terras Alpha','Residencial','em construção','a partir de 275 m²','571','terras-alphaville-ceara-6'),
 ('CE','Eusébio','Alphaville Ceará 5','Alphaville','Residencial','em construção','a partir de 450 m²','506','alphaville-ceara5'),
 ('CE','Fortaleza','Comercial Ceará 7 e 8','Alphaville','Lotes Comerciais','em construção','530,00 a 7.000,37 m²','','lotes-comerciais-ceara-7-e-8'),
 ('CE','Eusébio','Terras Alphaville Ceará 5','Terras Alpha','Residencial','100% vendido','a partir de 275 m²','663','terras-alphaville-ceara-5'),
 ('PI','Teresina','Terras Alphaville Teresina 3','Terras Alpha','Residencial','em construção','a partir de 220 m²','501','terras-alphaville-teresina-3'),
 ('PI','Teresina','Terras Alphaville Teresina 2','Terras Alpha','Residencial','em construção','a partir de 247 m²','484','terras-alphaville-teresina-2'),
 ('PI','Teresina','Alphaville Piauí','Alphaville','Residencial','100% vendido','a partir de 420 m²','486','alphavillepiaui'),
 ('PR','Cascavel','Terras Alpha Cascavel 3','Terras Alpha','Residencial','lançamento','a partir de 275 m²','564','terras-alpha-cascavel-3'),
 ('PR','Cascavel','Terras Alpha Cascavel 2','Terras Alpha','Residencial','100% vendido','a partir de 302 m²','512','terras-alpha-cascavel-2'),
 ('PR','Campo Largo','Alphaville Paraná','Alphaville','Residencial','100% vendido','a partir de 700 m²','487','alphaville-parana'),
 ('PR','Ponta Grossa','Jardim Alpha Ponta Grossa','Jardim Alpha','Residencial','entregue','a partir de 200 m²','449','jardim-alpha-ponta-grossa'),
 ('BA','Camaçari','Alphaville Guarajuba 4','Alphaville','Residencial','em construção','a partir de 420 m²','458','alphaville-guarajuba-4'),
 ('BA','Camaçari','Alphaville Litoral Norte 4','Alphaville','Residencial','em construção','a partir de 360 m²','205','alphaville-litoral-norte-4'),
 ('MG','Uberaba','Terras Alpha Uberaba','Terras Alpha','Residencial','entregue','a partir de 288 m²','465','terras-alpha-uberaba'),
 ('MG','Betim','Terras Alpha Betim','Terras Alpha','Residencial','100% vendido','a partir de 360 m²','396','terras-alpha-betim'),
 ('ES','Guarapari','Três Praias Vista','Alphaville','Casas','100% vendido','Casas Vista Mar','15 lotes','tres-praias-vista'),
 ('DF','Brasília','Alphaville Planalto Central 2','Alphaville','Residencial','entregue','a partir de 450 m²','426','alphaville-planalto-central-2'),
]

# ── fora do catálogo: praça + onde ela aparece ──────────────────────
# (uf, praca, nome do empreendimento, fonte)
HIST = [
 ('SP','São José dos Campos','Terras Alpha São José dos Campos','Release de resultados 2020 e 4T23'),
 ('SP','Votorantim','Terras Alpha Nova Esplanada','Release de resultados 2020'),
 ('SP','Campinas','Reserva Alpha Galleria','FRE 2024 e Proposta AGO 2022'),
 ('SP','Bauru','Alphaville Bauru','FRE 2020 e Prospecto do IPO'),
 ('SP','Barueri','Alphaville Residencial 1 (o primeiro, 1973)','FRE 2020, seção histórico'),
 ('MG','Nova Lima','Alphaville Lagoa dos Ingleses','FRE 2020, 2024 e 2026'),
 ('MG','Uberlândia','Alphaville Uberlândia e Terras Alpha Uberlândia','FRE 2020 e release 2020'),
 ('MG','Montes Claros','Terras Alpha Montes Claros','FRE 2024 e 2026'),
 ('GO','Goiânia','Alphaville Flamboyant','FRE 2020, 2024, 2026 e Prospecto'),
 ('GO','Anápolis','Alphaville Anápolis','FRE 2020 e Prospecto do IPO'),
 ('PB','—','Alphaville Paraíba','FRE 2020 (processo ambiental do stand)'),
 ('PB','Campina Grande','Alphaville Campina Grande','FRE 2020 e Prospecto do IPO'),
 ('PE','Caruaru','Terras Alpha Caruaru','FRE 2024 e release de 2020'),
 ('SE','Aracaju','Alphaville Aracaju e Terras Alpha Sergipe 3','FRE 2024 e 2026'),
 ('MS','Campo Grande','Terras Alpha Campo Grande','FRE 2024 e 2026'),
 ('TO','Palmas','Alphaville Palmas 1','FRE 2020 e 2024'),
 ('AM','—','expansão de 2000; o FRE cita o estado, sem nomear','FRE 2020, seção histórico'),
 ('RS','Gravataí e Porto Alegre','Alphaville Gravataí / Porto Alegre; também Pelotas','bairro consolidado; anúncios e CEP'),
 ('MT','Cuiabá','Loteamento Alphaville Cuiabá I e II','CEP dos Correios, faixa 78061'),
 ('MA','Paço do Lumiar','Alphaville Araçagy, 426 lotes','Alphaville Urbanismo com a PLANC'),
 ('RJ','Rio de Janeiro','Alphaville Recreio (~2.700 lotes) e Alphaville Barra','portais de lançamento'),
 ('RN','Parnamirim','Alphaville Natal, em Pium','associação e CEP próprios (59160-400)'),
 ('AL','Maceió','anunciado em out/2019, +300 lotes','imprensa local datada'),
]

VENDE = {'lançamento', 'breve lançamento', 'em construção'}

wb = Workbook()
AZ = PatternFill('solid', fgColor='14110F')
OURO = PatternFill('solid', fgColor='C9A227')
CLARO = PatternFill('solid', fgColor='FBF6E6')


def folha(ws, cabec, linhas, larguras, pinta=None):
    ws.append(cabec)
    for c in range(1, len(cabec) + 1):
        cel = ws.cell(1, c)
        cel.font = Font(bold=True, color='F5F1E8', size=11)
        cel.fill = AZ
        cel.alignment = Alignment(vertical='center')
    for ln in linhas:
        ws.append(list(ln))
    for i, w in enumerate(larguras, start=1):
        ws.column_dimensions[get_column_letter(i)].width = w
    if pinta:
        for r in range(2, len(linhas) + 2):
            if pinta(linhas[r - 2]):
                for c in range(1, len(cabec) + 1):
                    ws.cell(r, c).fill = CLARO
    ws.freeze_panes = 'A2'
    ws.auto_filter.ref = ws.dimensions


ws = wb.active
ws.title = 'No catalogo hoje'
folha(ws,
      ['UF', 'Cidade', 'Empreendimento', 'Linha', 'Tipo', 'Status', 'Lote', 'Unidades',
       'Vende na planta?', 'Pagina oficial'],
      [(uf, cid, nome, lin, tip, st, lote, un,
        'SIM' if st in VENDE else 'nao - so revenda',
        'https://alphaville.com.br/produto/%s/' % slug)
       for uf, cid, nome, lin, tip, st, lote, un, slug in CAT],
      [6, 16, 32, 13, 20, 17, 23, 10, 18, 58],
      pinta=lambda l: l[8] == 'SIM')

ws2 = wb.create_sheet('Historico (fora do catalogo)')
folha(ws2, ['UF', 'Cidade', 'Empreendimento', 'Onde aparece'], HIST, [6, 24, 48, 44])

ws3 = wb.create_sheet('Leia-me')
for ln in [
    ['Inventario Alphaville - levantado em 04/10/2026'], [],
    ['Aba "No catalogo hoje"'],
    ['  22 produtos do site oficial alphaville.com.br, lidos pela API do WordPress deles'],
    ['  (/wp-json/wp/v2/produto) e pela ficha de cada card. Metragem e unidades sao os'],
    ['  numeros que ELES publicam. Preco nao sai por ali: tem de vir da tabela.'], [],
    ['  Linhas em creme = tem venda primaria (lancamento, breve lancamento, em construcao).'],
    ['  As demais estao entregues ou 100%% vendidas: so mercado de revenda.'], [],
    ['Aba "Historico (fora do catalogo)"'],
    ['  Pracas que aparecem em documento entregue a CVM ou em fonte publica, mas que nao'],
    ['  estao no catalogo. Nao ha estoque para vender na planta. Servem de pauta e de'],
    ['  mercado de revenda.'], [],
    ['CUIDADO 1: sigla de estado solta no Formulario de Referencia costuma ser foro de'],
    ['  processo, nao empreendimento. Tudo aqui foi conferido pelo NOME do produto.'],
    ['CUIDADO 2: "Alphaville" virou nome generico de condominio. Ha empreendimento com'],
    ['  esse nome que nao e da Alphaville S.A. Belem ficou de fora por isso.'], [],
    ['Fontes: catalogo do site oficial (04/10/2026); Formulario de Referencia da Alphaville'],
    ['S.A. versoes 2020, 2024 e 2026; ITR 2T26 e 4T25; releases de 2020 e 4T23; Prospecto'],
    ['do IPO (05/11/2020); CEP dos Correios; associacoes de moradores; imprensa local.'],
]:
    ws3.append(ln)
ws3.column_dimensions['A'].width = 100
ws3.cell(1, 1).font = Font(bold=True, size=13)

wb.save(DEST)
vende = sum(1 for x in CAT if x[5] in VENDE)
print('gerado %s' % DEST)
print('  catalogo:  %d produtos, %d com venda primaria, %d so revenda'
      % (len(CAT), vende, len(CAT) - vende))
print('  historico: %d pracas fora do catalogo' % len(HIST))
ufs = sorted({x[0] for x in CAT})
print('  UFs no catalogo: %s' % ', '.join('%s(%d)' % (u, sum(1 for x in CAT if x[0] == u)) for u in ufs))
