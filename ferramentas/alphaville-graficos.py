# -*- coding: utf-8 -*-
# Gera os dois gráficos do artigo sobre o Alphaville, em SVG:
#   linha-do-tempo.svg  — 1973 a 2026, com os marcos do Formulário de Referência
#   mapa-estados.svg    — os 23 estados + DF onde a Alphaville atua
#
# SVG, e não imagem: pesa alguns KB, fica nítido em qualquer tela, lê-se em
# modo escuro e o texto dentro dele é texto de verdade — um modelo de linguagem
# que lê a página enxerga as datas, o que uma figura .jpg não permite.
#
# Todo marco vem do FRE (Formulário de Referência v3/v6) e está anotado no
# dicionário abaixo com a fonte.
import io, os, sys
sys.stdout.reconfigure(encoding='utf-8')

DEST = 'C:/Users/Usuario/Desktop/landing-page/blog/o-que-e-alphaville/images/'
os.makedirs(DEST, exist_ok=True)

# ── 1. LINHA DO TEMPO ───────────────────────────────────────────────
# fonte: FRE v3 (30/06/2026), seção 1.1 Histórico do emissor
MARCOS = [
    (1973, 'Primeiro Alphaville, em Barueri', 'Renato Albuquerque e Yojiro Takaoka'),
    (1997, 'Sai de Barueri', 'primeiro projeto fora: Campinas'),
    (1998, 'Chega a Minas', 'Alphaville Lagoa dos Ingleses, BH'),
    (2000, 'Vai para o Norte e o Nordeste', 'Paraná, Goiás, Bahia e Amazonas'),
    (2006, 'Gafisa entra', 'com 60% das ações'),
    (2009, 'Nasce o Terras Alpha', 'linha de lotes menores'),
    (2013, 'Pátria e Blackstone', 'compram 70% da companhia'),
    (2015, '100 projetos lançados', ''),
    (2020, 'Abre capital na B3', 'ticker AVLL3'),
    (2025, 'Recorde de entregas', '8 empreendimentos, 2.047 lotes'),
]

L, A = 1180, 560
M = 70
x0, x1 = M + 36, L - M
ano0, ano1 = 1970, 2028


def px(ano):
    return x0 + (ano - ano0) / (ano1 - ano0) * (x1 - x0)


s = []
s.append('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 %d %d" role="img" '
         'aria-label="Linha do tempo da Alphaville de 1973 a 2025">' % (L, A))
s.append('<title>Alphaville: de 1973 a 2025</title>')
s.append('<desc>Marcos da Alphaville segundo o Formulário de Referência entregue à CVM em 2026: '
         'fundação em 1973 em Barueri, primeiro projeto fora em 1997, entrada da Gafisa em 2006, '
         'compra de 70% por Pátria e Blackstone em 2013, abertura de capital em 2020 e recorde de '
         'entregas em 2025.</desc>')
s.append('''<style>
 .bg{fill:#14110f}
 .eixo{stroke:#3a342c;stroke-width:2}
 .tick{stroke:#5a5247;stroke-width:1}
 .ano{fill:#c9a227;font:700 15px Georgia,serif}
 .tit{fill:#f5f1e8;font:600 13px system-ui,sans-serif}
 .sub{fill:#9a9184;font:400 11.5px system-ui,sans-serif}
 .ponto{fill:#c9a227}
 .pontoG{fill:#f5f1e8}
 .cab{fill:#f5f1e8;font:700 20px Georgia,serif}
 .fonte{fill:#6f6759;font:400 10.5px system-ui,sans-serif}
 @media (prefers-color-scheme: light){
   .bg{fill:#faf8f5} .tit{fill:#14110f} .sub{fill:#6b6255} .pontoG{fill:#14110f}
   .eixo{stroke:#d9d4cb} .tick{stroke:#c9c3b8} .cab{fill:#14110f} .fonte{fill:#8a8272}
 }
</style>''')
s.append('<rect class="bg" width="%d" height="%d"/>' % (L, A))
s.append('<text class="cab" x="%d" y="40">Alphaville, de 1973 a 2025</text>' % M)
eixoY = 300
s.append('<line class="eixo" x1="%.0f" y1="%d" x2="%.0f" y2="%d"/>' % (x0 - 20, eixoY, x1 + 16, eixoY))
for d in range(1970, 2029, 10):
    s.append('<line class="tick" x1="%.1f" y1="%d" x2="%.1f" y2="%d"/>' % (px(d), eixoY - 5, px(d), eixoY + 5))
    s.append('<text class="fonte" x="%.1f" y="%d" text-anchor="middle">%d</text>' % (px(d), eixoY + 22, d))

# alterna acima/abaixo para os rótulos não colidirem
for i, (ano, tit, sub) in enumerate(MARCOS):
    x = px(ano)
    acima = i % 2 == 0
    base = eixoY - 26 if acima else eixoY + 44
    passo = -1 if acima else 1
    nivel = (i // 2) % 3
    y = base + passo * nivel * 64
    s.append('<line class="tick" x1="%.1f" y1="%d" x2="%.1f" y2="%.1f"/>' % (x, eixoY, x, y + (10 if acima else -10)))
    s.append('<circle class="%s" cx="%.1f" cy="%d" r="%d"/>'
             % ('pontoG' if ano in (1973, 2020) else 'ponto', x, eixoY, 6 if ano in (1973, 2020) else 4))
    anc = 'middle'
    if x < 150: anc = 'start'
    if x > L - 150: anc = 'end'
    s.append('<text class="ano" x="%.1f" y="%.1f" text-anchor="%s">%d</text>' % (x, y - 18, anc, ano))
    s.append('<text class="tit" x="%.1f" y="%.1f" text-anchor="%s">%s</text>' % (x, y - 2, anc, tit))
    if sub:
        s.append('<text class="sub" x="%.1f" y="%.1f" text-anchor="%s">%s</text>' % (x, y + 15, anc, sub))

s.append('<text class="fonte" x="%d" y="%d">Fonte: Formulário de Referência da Alphaville S.A. '
         'entregue à CVM, versão de 30/06/2026.</text>' % (M, A - 22))
s.append('</svg>')
io.open(DEST + 'linha-do-tempo.svg', 'w', encoding='utf-8', newline='').write('\n'.join(s))
print('linha-do-tempo.svg  %d marcos' % len(MARCOS))
