# -*- coding: utf-8 -*-
# Landings dos loteamentos Dominium com os relatorios de 01/10/2026.
#
# So estoque mudou; nenhum preco. Movimento do mes:
#   Alpnach        28 -> 19 lotes  (13 vendidos, 4 voltaram)   piso R$ 510.000 (igual)
#   Di Italia      44 -> 45        (1 saiu, 2 voltaram)        piso R$ 210.000 (igual)
#   Monte Carmelo 581 -> 585       (4 voltaram)                piso R$ 145.000 (igual)
#   Ravello       185 -> 187       (4 sairam, 6 voltaram)      piso R$ 714.000 (igual)
#
# Composicao recalculada dos relatorios: Di Italia agora e 30 residenciais e 15
# mistos (era 28 e 16); no Ravello seguem 9 lotes so a vista, agora de 187.
#
# As trocas rodam em TODAS as paginas porque os cards de empreendimento
# relacionado repetem esses numeros fora da landing dona — a pagina do Monte
# Carmelo, por exemplo, carrega um card do Di Italia. Foi assim que o card da
# Reserva Botanica ficou dois meses com a tabela de julho dentro do Spazio.
import io, os, sys, glob
sys.stdout.reconfigure(encoding='utf-8')
R = 'C:/Users/Usuario/Desktop/landing-page/'

# Mais especifico primeiro: as frases longas carregam os numeros curtos dentro.
TROCAS = [
    # ── Alpnach: 28 -> 19 ───────────────────────────────────────────
    ('Restam 28 lotes disponíveis no relatório de estoque de 04/09/2026',
     'Restam 19 lotes disponíveis no relatório de estoque de 01/10/2026'),
    ('28 lotes disponíveis no relatório de estoque de 04/09/2026',
     '19 lotes disponíveis no relatório de estoque de 01/10/2026'),
    ('o relatório de 04/09/2026 mostra 28 lotes',
     'o relatório de 01/10/2026 mostra 19 lotes'),
    ('de 04/09/2026. Restam 28 lotes, de 300 a 450,16 m²',
     'de 01/10/2026. Restam 19 lotes, de 300 a 450,16 m²'),
    ('28 lotes disponíveis (04/09/2026)', '19 lotes disponíveis (01/10/2026)'),

    # ── Di Italia: 44 -> 45 ─────────────────────────────────────────
    ('44 lotes disponíveis (04/09/2026), entre 28 residenciais e 16 mistos',
     '45 lotes disponíveis (01/10/2026), entre 30 residenciais e 15 mistos'),
    ('44 lotes disponíveis em 04/09/2026 (28 residenciais',
     '45 lotes disponíveis em 01/10/2026 (30 residenciais'),
    ('44 lotes disponíveis (04/09/2026)', '45 lotes disponíveis (01/10/2026)'),
    ('44 lotes (04/09/2026)', '45 lotes (01/10/2026)'),
    ('44 lotes (set/2026)', '45 lotes (out/2026)'),

    # ── Monte Carmelo: 581 -> 585 ───────────────────────────────────
    ('581 lotes disponíveis (set/2026)', '585 lotes disponíveis (out/2026)'),
    ('581 lotes disponíveis', '585 lotes disponíveis'),
    ('581 lotes', '585 lotes'),

    # ── Ravello: 185 -> 187 ─────────────────────────────────────────
    ('Em 02/09/2026 o Residencial Ravello tinha 185 lotes disponíveis',
     'Em 01/10/2026 o Residencial Ravello tinha 187 lotes disponíveis'),
    ('9 dos 185 lotes só são vendidos à vista (02/09/2026)',
     '9 dos 187 lotes só são vendidos à vista (01/10/2026)'),
    ('185 lotes disponíveis (estoque de 02/09/2026)', '187 lotes disponíveis (estoque de 01/10/2026)'),
    ('185 lotes disponíveis em 02/09/2026', '187 lotes disponíveis em 01/10/2026'),
    ('185 lotes disponíveis (02/09/2026)', '187 lotes disponíveis (01/10/2026)'),
    ('185 lotes disponíveis (set/2026)', '187 lotes disponíveis (out/2026)'),
    ('710 lotes · 185 disponíveis', '710 lotes · 187 disponíveis'),
    ('185 lotes disponíveis', '187 lotes disponíveis'),
]

total = {}
for arq in glob.glob(R + '**/index.html', recursive=True) + [R + 'folheto-lancamentos.html']:
    if not os.path.exists(arq) or '_publicar' in arq or 'node_modules' in arq:
        continue
    s0 = io.open(arq, encoding='utf-8', newline='').read()
    s = s0
    for a, b in TROCAS:
        if a in s:
            total[a] = total.get(a, 0) + s.count(a)
            s = s.replace(a, b)
    if s != s0:
        io.open(arq, 'w', encoding='utf-8', newline='').write(s)
        print('   %s' % os.path.relpath(arq, R).replace('\\', '/'))

print('\ntrocas aplicadas:')
for a, n in sorted(total.items(), key=lambda x: -x[1]):
    print('   %2dx  %s' % (n, a[:76]))
nao = [a for a, _ in TROCAS if a not in total]
if nao:
    print('\nnao encontradas (podem estar cobertas por uma troca mais longa):')
    for a in nao:
        print('   %s' % a[:76])
