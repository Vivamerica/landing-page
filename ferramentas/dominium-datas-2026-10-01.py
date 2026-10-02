# -*- coding: utf-8 -*-
# Dominium 01/10: a DATA do relatorio e a composicao por tipo.
#
# A rodada anterior trocou as frases que continham o numero de lotes, mas essas
# quatro landings citam o relatorio em dezenas de fraseados diferentes ("estoque
# de", "relatorio Dominium de", "atualizado em", "conforme o relatorio de lotes
# disponiveis da"). Ficaram com o estoque de outubro e a data de setembro ao lado.
#
# Aqui a data velha de cada pagina vira 01/10/2026 de uma vez, menos dentro de
# comentario HTML — la mora "(Andorinha/Colibri/Tangara, 04/09/2026)", que e nota
# de manutencao sobre a VIC, nao sobre a Dominium.
#
# A composicao por tipo tambem mudou e sai dos relatorios:
#   Di Italia      45 = 30 residenciais (27 de 150 m² + 3 maiores) + 15 mistos
#                  menor misto agora e D-001 (189,81 m², R$ 284.715); o E-004 de
#                  166,79 m² por R$ 250.185 saiu do estoque
#                  vendidos: 359 dos 404 (eram 360)
#   Monte Carmelo 585 = 373 residenciais + 212 mistos (eram 209 mistos)
import io, re, sys
sys.stdout.reconfigure(encoding='utf-8')
R = 'C:/Users/Usuario/Desktop/landing-page/'


def aplica(arq, trocas, data_velha=None):
    p = R + arq
    s = io.open(p, encoding='utf-8', newline='').read()
    for a, b in trocas:
        n = s.count(a)
        assert n, (arq, 'nao achei', a[:100])
        s = s.replace(a, b)
        print('   %dx  %s' % (n, a[:68]))
    if data_velha:
        # guarda os comentarios HTML, troca a data, devolve os comentarios
        guardados = []

        def esconde(m):
            guardados.append(m.group(0))
            return '\x00%d\x00' % (len(guardados) - 1)

        s = re.sub(r'<!--.*?-->', esconde, s, flags=re.S)
        n = s.count(data_velha)
        s = s.replace(data_velha, '01/10/2026')
        s = re.sub(r'\x00(\d+)\x00', lambda m: guardados[int(m.group(1))], s)
        print('   %dx  data %s -> 01/10/2026 (comentarios preservados)' % (n, data_velha))
    io.open(p, 'w', encoding='utf-8', newline='').write(s)
    print('ok', arq)


# ── DI ITALIA ───────────────────────────────────────────────────────
aplica('di-italia-indaiatuba/index.html', [
    ('(30 residenciais e 16 mistos)', '(30 residenciais e 15 mistos)'),
    ('28 residenciais*', '30 residenciais*'),      # linha da tabela por tipo
    ('>17<', '>15<'),                              # mistos na mesma tabela
    ('166,79 (E-004) a 296,70 m² (E-001)', '189,81 (D-001) a 296,70 m² (E-001)'),
    ('R$ 250.185,00 a R$ 445.050,00', 'R$ 284.715,00 a R$ 445.050,00'),
    ('*os 3 residenciais maiores estão contados entre os 28 residenciais',
     '*os 3 residenciais maiores estão contados entre os 30 residenciais'),
    ('360 dos 404 lotes já vendidos', '359 dos 404 lotes já vendidos'),
    ('17 lotes (04/09/2026)', '15 lotes (01/10/2026)'),
    ('28 residenciais (04/09/2026)', '30 residenciais (01/10/2026)'),
    ('44 disponíveis no relatório Dominium/GRBU', '45 disponíveis no relatório Dominium/GRBU'),
    ('44 LOTES DISPONÍVEIS DE 404', '45 LOTES DISPONÍVEIS DE 404'),
    ('>44<', '>45<'),
    ('Em 14/08/2026 eram 43 lotes; um voltou ao estoque.',
     'Em 04/09/2026 eram 44 lotes; um saiu e dois voltaram ao estoque.'),
], data_velha='04/09/2026')

# ── ALPNACH ─────────────────────────────────────────────────────────
aplica('alpnach-indaiatuba/index.html', [
    ('>28<', '>19<'),
    ('28 disponíveis', '19 disponíveis'),
], data_velha='04/09/2026')

# ── MONTE CARMELO ───────────────────────────────────────────────────
aplica('monte-carmelo-indaiatuba/index.html', [
    ('209 lotes mistos disponíveis', '212 lotes mistos disponíveis'),
    ('>581<', '>585<'),
    ('581 disponíveis', '585 disponíveis'),
], data_velha='30/09/2026')

# ── RAVELLO ─────────────────────────────────────────────────────────
# o "185 disponiveis" ja caiu na rodada por frase; aqui resta o contador e a data
aplica('residencial-ravello-indaiatuba/index.html', [
    ('>185<', '>187<'),
], data_velha='02/09/2026')

print('\nagora o ritual.')
