# -*- coding: utf-8 -*-
# Parque Zarah 29/09/2026: propaga o novo "a partir de" (R$ 172.500 -> R$ 210.000)
# para o que NÃO nasce de gerador — home, folheto, tabela de preços, imprensa e llms.
#
# Os dois gráficos da página de imprensa codificam o preço na largura da barra.
# Trocar o número sem mexer na barra faria o gráfico mentir, então a geometria
# entra junto:
#   · gráfico "menor entrada": largura interpolada entre as barras vizinhas
#     (Zarin 172.500 -> h38.6 e Armigh 247.500 -> h57.1) => h47.9, texto em 259.9
#   · gráfico "R$/m²": 210.000 / 150 m² = R$ 1.400/m², que empata com o Jardim
#     Di Italia — a barra fica idêntica à dele (h255.0, texto em 467.0) e a ordem
#     decrescente continua válida, sem precisar reordenar.
# Média do gráfico de m²: (1825+1700+1700+1650+1566+1400+1400+967)/8 = 1.526
import io, sys
sys.stdout.reconfigure(encoding='utf-8')
R = 'C:/Users/Usuario/Desktop/landing-page/'

def aplica(arq, trocas):
    p = R + arq
    s = io.open(p, encoding='utf-8', newline='').read()
    for a, b in trocas:
        n = s.count(a)
        assert n, (arq, 'nao achei', a[:110])
        s = s.replace(a, b)
        print('   %dx  %s' % (n, a[:62].replace('\n', ' ')))
    io.open(p, 'w', encoding='utf-8', newline='').write(s)
    print('ok', arq, '\n')

# ── home ─────────────────────────────────────────────────────────────
aplica('index.html', [
    ('lotes 150-409 m² a partir de R$ 172.500 (lote misto 150 m², tabela set/2026)',
     'lotes 150-409 m² a partir de R$ 210.000 (lote misto 150 m², tabela set/2026)'),
])

# ── folheto ──────────────────────────────────────────────────────────
aplica('folder-verso.html', [
    ('<strong>R$ 172.500</strong><em>R$ 1.150/m² · 150 m²</em>',
     '<strong>R$ 210.000</strong><em>R$ 1.400/m² · 150 m²</em>'),
])

# ── tabela de preços ─────────────────────────────────────────────────
aplica('precos-lancamentos-indaiatuba/index.html', [
    ('<td class="num"><strong>R$ 172.500</strong></td> <td class="num desce">▼ 30,8%</td>'
     if False else '<strong>R$ 172.500</strong>', '<strong>R$ 210.000</strong>'),
    ('▼ 30,8%', '▼ 15,7%'),
    ('variações de -30,8% a +36,0%', 'variações de -15,7% a +36,0%'),
])

# ── imprensa e dados: texto, tabela e a geometria dos dois gráficos ──
aplica('imprensa-e-dados/index.html', [
    # título e tabela
    ('Parque Zarah (Zarin) · lote a partir de 150 m² · R$ 172.500 · R$ 1.150/m²',
     'Parque Zarah (Zarin) · lote a partir de 150 m² · R$ 210.000 · R$ 1.400/m²'),
    ('<td class="num">R$ 172.500</td><td class="num">R$ 1.150</td>',
     '<td class="num">R$ 210.000</td><td class="num">R$ 1.400</td>'),
    ('Zarin R$ 172.500 (Parque Zarah)', 'Zarin R$ 210.000 (Parque Zarah)'),
    ('<td>Zarin</td><td class="num">R$ 172.500</td><td>Parque Zarah</td>',
     '<td>Zarin</td><td class="num">R$ 210.000</td><td>Parque Zarah</td>'),
    # gráfico 1 — menor entrada por incorporadora
    ('<title>Zarin: R$ 172.500 — Parque Zarah (lote)</title>',
     '<title>Zarin: R$ 210.000 — Parque Zarah (lote)</title>'),
    ('<path d="M200,58 h38.6 a4,4 0 0 1 4,4 v12 a4,4 0 0 1 -4,4 h-38.6 z"',
     '<path d="M200,58 h47.9 a4,4 0 0 1 4,4 v12 a4,4 0 0 1 -4,4 h-47.9 z"'),
    ('<text x="250.6" y="68" dy="0.35em" font-size="13" font-weight="600" fill="#161616">R$ 172.500',
     '<text x="259.9" y="68" dy="0.35em" font-size="13" font-weight="600" fill="#161616">R$ 210.000'),
    # gráfico 2 — preço por m²
    ('h208.8 a4,4 0 0 1 4,4 v12 a4,4 0 0 1 -4,4 h-208.8 z', 'h255.0 a4,4 0 0 1 4,4 v12 a4,4 0 0 1 -4,4 h-255.0 z'),
    ('<text x="420.8"', '<text x="467.0"'),
    ('>R$ 1.150/m²<', '>R$ 1.400/m²<'),
    ('Parque Zarah R$ 1.150/m²', 'Parque Zarah R$ 1.400/m²'),
    ('Média R$ 1.495/m²', 'Média R$ 1.526/m²'),
    # variação do mês
    ('variações de −30,8% a +36,0%', 'variações de −15,7% a +36,0%'),
    ('(Parque Zarah, −30,8%', '(Parque Zarah, −15,7%'),
])

# ── llms.txt ─────────────────────────────────────────────────────────
aplica('llms.txt', [
    ('misto externo de 150 m² por R$ 172.500 (quadra 14) e R$ 210.000 (quadra 27)',
     'misto externo a partir de R$ 210.000 (150 m², quadra 27)'),
    ('Menor preço geral: R$ 172.500 (lote misto de 150 m², Pérola)',
     'Menor preço geral: R$ 210.000 (lote misto de 150 m², Pérola)'),
])

# ── observatório: o movimento do mês passa a fechar em 210.000 ───────
aplica('gera-observatorio.js', [
    ("de: 249123,  para: 172500,  causa: 'menor lote agora é misto de 150 m² (fase Pérola); residencial a partir de R$ 212.072', fonte: 'tabela Zarin de setembro/2026 (3 fases)'",
     "de: 249123,  para: 210000,  causa: 'menor lote agora é misto de 150 m² (fase Pérola); os de R$ 172.500 da quadra 14 saíram da tabela; residencial a partir de R$ 217.500', fonte: 'tabela Zarin de 29/09/2026 (3 fases)'"),
])
print('feito. rode o ritual de novo para o Observatório sair com o número certo.')
