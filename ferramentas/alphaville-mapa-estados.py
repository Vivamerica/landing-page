# -*- coding: utf-8 -*-
# Mapa dos estados onde a Alphaville atua, em SVG.
#
# POR QUE O MAPA NÃO PINTA 23 ESTADOS
# O Formulário de Referência diz que a companhia "está presente em 23 estados,
# além do Distrito Federal", mas NÃO lista quais. E a frase não se mexe: está
# idêntica no FRE de 2020, no de 2024 e no de 2026 — no mesmo documento em que
# "130 empreendimentos" virou 138, o 23 ficou parado. Enquanto isso, o ITR do
# 2T26 (13/08/2026) diz que o landbank está em 18 estados, e o ITR do 4T25 diz
# que as entregas de 2025 saíram em 6. Três números da própria companhia que
# não batem entre si. Pintar 23 por conta própria seria inventar o mapa.
#
# Então o mapa pinta o que foi verificado praça por praça, em três níveis de
# evidência, cada um com a fonte no hover:
#   A) lote à venda HOJE — catálogo de produtos do site oficial (API do
#      WordPress, 22 produtos ativos), lido em 04/10/2026
#   B) empreendimento NOMEADO em documento entregue à CVM
#   C) empreendimento confirmado em FONTE PÚBLICA fora da CVM
#
# DUAS ARMADILHAS QUE ESTE SCRIPT EVITA
# 1. Sigla solta não é praça. A seção de processos judiciais do FRE cita foro
#    em meio país (Porto Velho/RO, Bayeux/PB, Carapicuíba/SP) e aquilo é
#    tribunal, não empreendimento. Por isso o nível B foi conferido pelo NOME
#    do produto ("Alphaville Paraíba", "Terras Alpha Campo Grande"), e AC e RO
#    ficaram de fora: só apareciam dentro de uma ação trabalhista de 2013.
# 2. "Alphaville" é nome genérico de condomínio. Há condomínios chamados
#    Alphaville que não são da Alphaville S.A. Por isso Belém (PA) ficou de
#    fora: só achei anúncio imobiliário, nada que ligue o condomínio à
#    companhia.
#
# A forma é uma grade (cada estado é um bloco), não o contorno geográfico: sem
# um arquivo de contornos à mão, um Brasil desenhado "de memória" sairia
# errado. A grade é convenção de jornalismo de dados, lê-se bem e não finge
# precisão cartográfica que eu não tenho.
import io, os, sys
sys.stdout.reconfigure(encoding='utf-8')

DEST = 'C:/Users/Usuario/Desktop/landing-page/blog/o-que-e-alphaville/images/'
os.makedirs(DEST, exist_ok=True)
NL = chr(10)

# (sigla, linha, coluna) — posição aproximada no país
GRADE = [
    ('RR', 0, 2), ('AP', 0, 4),
    ('AM', 1, 1), ('PA', 1, 3), ('MA', 1, 4), ('CE', 1, 5), ('RN', 1, 6),
    ('AC', 2, 0), ('RO', 2, 1), ('TO', 2, 3), ('PI', 2, 4), ('PB', 2, 6),
    ('MT', 3, 2), ('GO', 3, 3), ('BA', 3, 4), ('PE', 3, 5), ('AL', 3, 6),
    ('MS', 4, 2), ('DF', 4, 3), ('MG', 4, 4), ('SE', 4, 5),
    ('SP', 5, 3), ('RJ', 5, 4), ('ES', 5, 5),
    ('PR', 6, 3), ('SC', 7, 3), ('RS', 8, 3),
]

# NÍVEL A — lote à venda hoje.
# Fonte: catálogo de produtos do site oficial alphaville.com.br, 04/10/2026.
A_VENDA = {
    'SP': 'Indaiatuba, Campinas, Votorantim, Ribeirão Preto e Dom Pedro (5 produtos)',
    'PR': 'Cascavel 2 e 3, Campo Largo e Ponta Grossa (4 produtos)',
    'CE': 'Eusébio: Ceará 5 e 6 e comercial 7 e 8 (4 produtos)',
    'PI': 'Teresina 2 e 3 e Alphaville Piauí (3 produtos)',
    'BA': 'Guarajuba 4 e Litoral Norte 4, em Camaçari (2 produtos)',
    'MG': 'Uberaba e Betim (2 produtos)',
    'ES': 'Três Praias, em Guarapari',
    'DF': 'Alphaville Planalto Central 2',
}

# NÍVEL B — empreendimento nomeado em documento entregue à CVM.
CVM = {
    'GO': 'Alphaville Flamboyant (Goiânia) e Alphaville Anápolis — FRE 2020',
    'PB': 'Alphaville Paraíba e Alphaville Campina Grande — FRE 2020',
    'PE': 'Terras Alpha Caruaru — FRE 2024 e release de 2020',
    'SE': 'Alphaville Aracaju e Terras Alpha Sergipe 3 — FRE 2024 e 2026',
    'MS': 'Terras Alpha Campo Grande — FRE 2024 e 2026',
    'TO': 'Alphaville Palmas 1 — FRE 2020 e 2024',
    'AM': 'expansão de 2000; o FRE cita o estado sem nomear o projeto',
}

# NÍVEL C — empreendimento confirmado em fonte pública fora da CVM.
PUBLICA = {
    'RS': 'Alphaville Gravataí e Porto Alegre, bairros consolidados; também Pelotas',
    'MT': 'Loteamento Alphaville Cuiabá I e II, bairro registrado nos Correios (CEP 78061)',
    'MA': 'Alphaville Araçagy, em Paço do Lumiar: 426 lotes, pela Alphaville Urbanismo com a PLANC',
    'RJ': 'Alphaville Recreio dos Bandeirantes, cerca de 2.700 lotes, e Alphaville Barra',
    'RN': 'Alphaville Natal, em Pium (Parnamirim), com associação e CEP próprios',
    'AL': 'Maceió: anunciado em out/2019 como o primeiro do estado, mais de 300 lotes',
}

LADO, GAP = 62, 7
L, A = 7 * (LADO + GAP) + 370, 9 * (LADO + GAP) + 200
X0, Y0 = 36, 112

nA, nB, nC = len(A_VENDA), len(CVM), len(PUBLICA)
total = nA + nB + nC          # inclui o DF
estados = total - 1           # só os estados

s = ['<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 %d %d" role="img" '
     'aria-label="Estados do Brasil onde a Alphaville tem empreendimentos">' % (L, A)]
s.append('<title>Onde a Alphaville está</title>')
s.append('<desc>Mapa esquemático do Brasil com três níveis de evidência. Em dourado cheio, os %d '
         'estados e o Distrito Federal com lote Alphaville à venda em 04/10/2026 segundo o catálogo '
         'do site oficial: São Paulo, Paraná, Ceará, Piauí, Bahia, Minas Gerais, Espírito Santo e o '
         'Distrito Federal. Em dourado escuro, os %d estados em que um documento entregue à CVM '
         'nomeia um empreendimento: Goiás, Paraíba, Pernambuco, Sergipe, Mato Grosso do Sul, '
         'Tocantins e Amazonas. Em contorno dourado, os %d estados com empreendimento confirmado em '
         'fonte pública fora da CVM: Rio Grande do Sul, Mato Grosso, Maranhão, Rio de Janeiro, Rio '
         'Grande do Norte e Alagoas. Total verificado: %d estados além do Distrito Federal. O '
         'Formulário de Referência informa presença em 23 estados além do Distrito Federal, sem '
         'listar quais, e repete esse número sem alteração de 2020 a 2026; o ITR do segundo '
         'trimestre de 2026 informa landbank em 18 estados e o ITR do quarto trimestre de 2025 '
         'informa entregas em 6 estados.</desc>' % (nA - 1, nB, nC, estados))
s.append('<style>' + NL +
         ' .bg{fill:#14110f}' + NL +
         ' .uf{fill:#262019;stroke:#332c23;stroke-width:1.5}' + NL +
         ' .uf-a{fill:#c9a227;stroke:#e0bb3d;stroke-width:1.5}' + NL +
         ' .uf-b{fill:#7d6a24;stroke:#9c8530;stroke-width:1.5}' + NL +
         ' .uf-c{fill:#2e2817;stroke:#c9a227;stroke-width:2}' + NL +
         ' .sig{fill:#6f6759;font:600 17px system-ui,sans-serif;text-anchor:middle}' + NL +
         ' .sig-a{fill:#14110f;font:700 18px system-ui,sans-serif;text-anchor:middle}' + NL +
         ' .sig-b{fill:#f6eed6;font:700 17px system-ui,sans-serif;text-anchor:middle}' + NL +
         ' .sig-c{fill:#c9a227;font:700 17px system-ui,sans-serif;text-anchor:middle}' + NL +
         ' .cab{fill:#f5f1e8;font:700 21px Georgia,serif}' + NL +
         ' .leg{fill:#9a9184;font:400 12.5px system-ui,sans-serif}' + NL +
         ' .legf{fill:#c9a227;font:600 12.5px system-ui,sans-serif}' + NL +
         ' .fonte{fill:#6f6759;font:400 10.5px system-ui,sans-serif}' + NL +
         ' @media (prefers-color-scheme: light){' + NL +
         '   .bg{fill:#faf8f5} .uf{fill:#ece8e0;stroke:#dcd7cd} .sig{fill:#8a8272}' + NL +
         '   .uf-b{fill:#8d7522;stroke:#6f5c18} .sig-b{fill:#fdf8e8}' + NL +
         '   .uf-c{fill:#f6eeda;stroke:#b8972a} .sig-c{fill:#6b5518}' + NL +
         '   .cab{fill:#14110f} .leg{fill:#6b6255} .legf{fill:#7d6512} .fonte{fill:#8a8272}' + NL +
         ' }' + NL + '</style>')
s.append('<rect class="bg" width="%d" height="%d"/>' % (L, A))
s.append('<text class="cab" x="%d" y="44">Onde a Alphaville está</text>' % X0)
s.append('<text class="leg" x="%d" y="70">%d estados e o Distrito Federal verificados praça por praça, em três</text>'
         % (X0, estados))
s.append('<text class="leg" x="%d" y="88">níveis de evidência. Cada bloco traz a praça e a fonte ao passar o mouse.</text>' % X0)

for sig, lin, col in GRADE:
    x, y = X0 + col * (LADO + GAP), Y0 + lin * (LADO + GAP)
    if sig in A_VENDA:
        cls, cs, praca = 'uf-a', 'sig-a', A_VENDA[sig]
    elif sig in CVM:
        cls, cs, praca = 'uf-b', 'sig-b', CVM[sig]
    elif sig in PUBLICA:
        cls, cs, praca = 'uf-c', 'sig-c', PUBLICA[sig]
    elif sig == 'SC':
        cls, cs, praca = 'uf', 'sig', 'SC — o próprio site informa nenhum empreendimento no estado'
    else:
        cls, cs, praca = 'uf', 'sig', None
    s.append('<g>')
    if praca:
        s.append('<title>%s — %s</title>' % (sig, praca) if sig != 'SC' else '<title>%s</title>' % praca)
    s.append('<rect class="%s" x="%d" y="%d" width="%d" height="%d" rx="7"/>' % (cls, x, y, LADO, LADO))
    s.append('<text class="%s" x="%d" y="%d">%s</text>' % (cs, x + LADO // 2, y + LADO // 2 + 6, sig))
    s.append('</g>')

# ── legenda à direita ───────────────────────────────────────────────
lx = X0 + 7 * (LADO + GAP) + 24
itens = [
    ('uf-a', 'lote à venda em 04/10/2026', 'catálogo do site oficial'),
    ('uf-b', 'empreendimento nomeado na CVM', 'Formulário de Referência e releases'),
    ('uf-c', 'confirmado em fonte pública', 'fora dos documentos da CVM'),
    ('uf', 'não verificado', 'AC, AP, PA, RO, RR e SC'),
]
yy = Y0 + 6
for cls, t1, t2 in itens:
    s.append('<rect class="%s" x="%d" y="%d" width="18" height="18" rx="4"/>' % (cls, lx, yy))
    s.append('<text class="legf" x="%d" y="%d">%s</text>' % (lx + 26, yy + 14, t1))
    s.append('<text class="leg" x="%d" y="%d">%s</text>' % (lx + 26, yy + 31, t2))
    yy += 50

linhas = [
    'Quatro números, e os três primeiros',
    'são da própria companhia:',
    '',
    '23 estados + DF — "está presente em", no',
    'Formulário de Referência. A frase aparece',
    'igual em 2020, 2024 e 2026, e nunca lista',
    'quais. No mesmo documento, "130',
    'empreendimentos" virou 138 e o 23 não se',
    'mexeu.',
    '',
    '18 estados — onde está o landbank hoje',
    '(ITR do 2T26, 13/08/2026).',
    '',
    '6 estados — onde saíram as entregas de',
    '2025 (ITR do 4T25, 31/03/2026).',
    '',
    '%d estados + DF — o que este mapa' % estados,
    'conseguiu verificar, com a fonte de cada',
    'praça no hover.',
]
for i, t in enumerate(linhas):
    s.append('<text class="%s" x="%d" y="%d">%s</text>'
             % ('legf' if t[:2] in ('23', '18', '6 ') or t.startswith('%d e' % estados) else 'leg',
                lx, yy + 18 + i * 19, t))

s.append('<text class="fonte" x="%d" y="%d">Fontes: Formulário de Referência da Alphaville S.A. '
         '(versões de 2020, 2024 e 2026), ITR do 2T26 e do 4T25 e o catálogo de produtos do site</text>'
         % (X0, A - 42))
s.append('<text class="fonte" x="%d" y="%d">oficial alphaville.com.br, lido em 04/10/2026. Nível de '
         'fonte pública: registro de CEP dos Correios, associação de moradores do próprio</text>' % (X0, A - 26))
s.append('<text class="fonte" x="%d" y="%d">empreendimento e imprensa local datada. '
         'Levantamento da Imobiliária Viv&#39;América.</text>' % (X0, A - 10))
s.append('</svg>')

io.open(DEST + 'mapa-estados.svg', 'w', encoding='utf-8', newline='').write(NL.join(s))
print('mapa-estados.svg')
print('  A  a venda hoje       %d: %s' % (nA, ', '.join(sorted(A_VENDA))))
print('  B  nomeado na CVM     %d: %s' % (nB, ', '.join(sorted(CVM))))
print('  C  fonte publica      %d: %s' % (nC, ', '.join(sorted(PUBLICA))))
print('  -  nao verificado     %d: %s'
      % (len(GRADE) - total, ', '.join(sorted(u for u, _, _ in GRADE
                                              if u not in A_VENDA and u not in CVM and u not in PUBLICA))))
print('  TOTAL verificado      %d estados + DF' % estados)
