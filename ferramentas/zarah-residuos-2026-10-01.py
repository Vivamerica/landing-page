# -*- coding: utf-8 -*-
# Zarah out/2026: os residuos que o de-para da landing nao alcancou.
#
# Depois do push, a home de producao ainda mostrava "R$ 210.000" para o Zarah.
# Nao era cache: o texto esta escrito a mao no index.html, fora dos geradores —
# gera-home.js so sincroniza preco e estoque dos CARDS, nao as descricoes do
# JSON-LD nem o texto dos hubs.
#
# Armadilha desta rodada: o Jardim Di Italia custa R$ 210.000 de verdade
# (relatorio Dominium de 04/09/2026). Trocar "R$ 210.000" no index.html em massa
# teria estragado o Di Italia. Por isso cada troca aqui carrega o contexto do
# Zarah junto, e nenhuma e um numero solto.
import io, sys
sys.stdout.reconfigure(encoding='utf-8')
R = 'C:/Users/Usuario/Desktop/landing-page/'


def aplica(arq, trocas):
    p = R + arq
    s = io.open(p, encoding='utf-8', newline='').read()
    for a, b in trocas:
        n = s.count(a)
        assert n, (arq, 'nao achei', a[:120])
        s = s.replace(a, b)
        print('   %dx  %s' % (n, a[:72]))
    io.open(p, 'w', encoding='utf-8', newline='').write(s)
    print('ok', arq)


# ── HOME: descricao do Zarah no JSON-LD (escrita a mao) ─────────────
aplica('index.html', [
    ('Parque Zarah — condomínio fechado Zarin em 3 fases, lotes 150-409 m² a partir de R$ 210.000 '
     '(lote misto 150 m², tabela set/2026); residencial a partir de R$ 217.500 (150 m², Pérola)',
     'Parque Zarah — condomínio fechado Zarin em 3 fases, lotes 150-409 m² a partir de R$ 211.050 '
     '(lote misto 150 m², tabela out/2026); residencial a partir de R$ 218.588 (150 m², Pérola)'),
])

# ── HUB DE PRECOS ───────────────────────────────────────────────────
# "os de R$ 172.500 da quadra 14 sairam" e fato historico e continua valendo:
# e o que explica a subida do piso. So o "a partir de" precisa mudar.
aplica('precos-lancamentos-indaiatuba/index.html', [
    ('residencial a partir de R$ 217.500', 'residencial a partir de R$ 218.588'),
])

# ── MAPA: rotulo da condicao de pagamento de cada nucleo ────────────
# O replace da rodada anterior pegou as 3 notas ("... gerada em 18/09 (180x)")
# e deixou os 3 cond:, que terminam diferente.
aplica('mapa-lotes-indaiatuba/index.html', [
    ("tabela Zarin de set/2026'", "tabela Zarin de out/2026'"),
])
print('\nagora o ritual de novo (a home mudou).')
