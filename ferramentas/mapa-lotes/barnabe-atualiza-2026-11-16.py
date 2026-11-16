# -*- coding: utf-8 -*-
# Parque Barnabé (Smart City): tabela de nov/2026 da loteadora ("Tabela de preço Smart Indaiá 100x - novembro",
# gerada em 12/11/2026). Troca os 8 lotes de out/2026 pelos 16 da tabela nova e acerta tab/sub/cond do bairro.
#
# A tabela nova tem 16 lotes (11 comerciais e 5 mistos, de 213,99 a 327,33 m²). Nenhum deles é um dos 8 de outubro,
# que saem do mapa (sair da tabela não quer dizer venda). Condição: ato de 20% (01/11/2026) e saldo em 100 mensais
# (a 1ª em 01/12/2026), reajustadas mensalmente pelo IGP-M; à vista com 5% de desconto, ou ato + 11 parcelas fixas
# sem juros. Lotes de 150 m² só à vista, em 12x ou financiamento (nenhum na tabela).
# Mensal NÃO publicada (parcela:null; o balão diz "Condições de pagamento no atendimento" e a obs traz ato e prazo):
# a política da tabela diz que as parcelas "já estão calculadas com juros a 1% na Tabela Price", mas a coluna
# MENSAL de todos os 16 lotes é o saldo / 100, conta sem juros (a de out/2026 tinha 1% a.m.). As duas coisas não
# podem estar certas ao mesmo tempo; o valor fica guardado em LOTES e volta ao mapa quando a loteadora confirmar.
#
# Pino de cada lote: o número do lote na planta da Prefeitura (332-parque-barnabe.pdf, a mesma do georreferenciamento
# de 05/09), levado ao mapa pela mesma cadeia dos pinos atuais: fit da planta (dados/barnabe-fit.json) e encaixe do
# Fabio de 07/09 (dados/ajustes-fabio-2026-09-07.json, homografia do retângulo bounds0 para os 4 cantos). A cadeia foi
# validada nos 8 pinos de outubro: cada um caiu a 0,0-0,1 m do número do seu lote, com a área da tabela ao lado.
# Cada lote novo foi achado pela área da tabela escrita dentro dele (13 das 16 áreas aparecem uma só vez na planta) e
# conferido por leitura independente: quadra pelo rótulo dentro do mesmo quarteirão, numeração contínua e área. A
# conferência derrubou a 1ª posição do Q28 L1 (era o lote 01 da quadra 30, de mesma área e desenho); o pino usa o
# lote 01 dentro do quarteirão da quadra 28.
#
# Uso: python barnabe-atualiza-2026-11-16.py [--gravar]     (depois: espelha-insumos-2026-10-12.py barnabe --gravar)
import io, os, re, sys
sys.stdout.reconfigure(encoding='utf-8')
AQUI = os.path.dirname(os.path.abspath(__file__))
P = os.path.join(os.path.dirname(os.path.dirname(AQUI)), 'mapa-lotes-indaiatuba', 'index.html')

# quadra, lote, m², tipo, R$/m², valor de tabela, ato (20%), mensal (100x), (lat, lon)
LOTES = [
    ('28', '1', 224.42, 'COMERCIAL', 1193.85, 267923.71, 53584.74, 2143.39, (-23.089250, -47.277080)),
    ('36', '4', 315.92, 'COMERCIAL', 1193.56, 377070.27, 75414.05, 3016.56, (-23.090393, -47.274359)),
    ('37', '1', 257.58, 'COMERCIAL', 1193.56, 307437.83, 61487.57, 2459.50, (-23.090960, -47.275085)),
    ('38', '23', 213.99, 'COMERCIAL', 1193.85, 255471.86, 51094.37, 2043.77, (-23.091742, -47.274045)),
    ('39', '4', 327.33, 'COMERCIAL', 1193.85, 390782.77, 78156.55, 3126.26, (-23.091599, -47.275778)),
    ('53', '1', 243.01, 'COMERCIAL', 1193.85, 290117.38, 58023.48, 2320.94, (-23.091288, -47.277573)),
    ('3', '58', 224.54, 'MISTO', 1193.85, 268066.98, 53613.40, 2144.54, (-23.085190, -47.278823)),
    ('4', '1', 253.92, 'MISTO', 1211.29, 307571.42, 61514.28, 2460.57, (-23.085408, -47.278306)),
    ('10', '9', 222.60, 'COMERCIAL', 1193.85, 265750.91, 53150.18, 2126.01, (-23.086717, -47.277528)),
    ('40', '4', 233.50, 'MISTO', 1193.85, 278763.87, 55752.77, 2230.11, (-23.087031, -47.282728)),
    ('40', '5', 281.99, 'MISTO', 1193.56, 336572.69, 67314.54, 2692.58, (-23.086825, -47.282705)),
    ('43', '41', 230.77, 'COMERCIAL', 1193.85, 275503.76, 55100.75, 2204.03, (-23.088971, -47.281935)),
    ('45', '29', 268.02, 'COMERCIAL', 1193.56, 319898.63, 63979.73, 2559.19, (-23.089248, -47.280860)),
    ('50', '1', 254.08, 'COMERCIAL', 1193.56, 303260.36, 60652.07, 2426.08, (-23.089693, -47.278260)),
    ('50', '11', 235.10, 'COMERCIAL', 1193.85, 280674.03, 56134.81, 2245.39, (-23.089128, -47.277826)),
    ('51', '21', 235.10, 'MISTO', 1193.56, 280606.55, 56121.31, 2244.85, (-23.089587, -47.277536)),
]
COMENT = ('  // Parque Barnabé (Smart City) — planta original do loteamento georreferenciada (OpenStreetMap/satélite); '
          'pinos pela planta. Tabela da loteadora de nov/2026, gerada em 12/11/2026 (ato 20% + 100 mensais)')
TAB = 'nov/2026'
SUB = 'loteamento Smart City · 16 lotes comerciais e mistos (tabela de nov/2026) · a prazo em 100x'
COND = ('ato de 20% e saldo em 100 mensais reajustadas pelo IGP-M, tabela da loteadora de nov/2026, gerada em '
        '12/11/2026; à vista com 5% de desconto, ou ato + 11 parcelas fixas sem juros')
PUBLICA_MENSAL = False   # True quando a loteadora confirmar o valor da mensal (ver o cabeçalho)
OBS = ('Tabela da loteadora de nov/2026: ato de 20% e saldo em 100 mensais reajustadas pelo IGP-M (valor da mensal '
       'no atendimento); à vista com 5% de desconto, ou ato + 11 parcelas fixas sem juros')

# conferências dos dados (a tabela: ato = 20% e mensal = saldo / 100; R$/m² = valor / área)
for q, l, m2, tipo, pm2, v, e, p, ll in LOTES:
    assert abs(e - 0.2 * v) < 0.02 and abs(p - (v - e) / 100) < 0.02 and abs(pm2 - v / m2) < 0.01, (q, l)
assert len({(q, l) for q, l, *_ in LOTES}) == len(LOTES) == 16

s = io.open(P, encoding='utf-8', newline='').read()
assert '\r' not in s
ini = s.index('  // Parque Barnabé (Smart City)')
fim = s.index('\n  // ', ini + 5) + 1
bloco = s[ini:fim]
velhos = re.findall(r"^  \{ b:'barnabe'.*$", bloco, re.M)
assert len(bloco.strip().split('\n')) == len(velhos) + 1, 'bloco do Barnabé com linha inesperada'
assert s.count("b:'barnabe'") == len(velhos), 'lote do Barnabé fora do bloco'
def linha(q, l, m2, tipo, pm2, v, e, p, ll):
    if PUBLICA_MENSAL:
        return ("  { b:'barnabe', q:'%s', l:'%s', m2:%.2f, tipo:'%s', pm2:%.2f, vista:%.2f, entrada:%.2f, parcela:%.2f, "
                "nx:100, ep:20, ll:[%.6f,%.6f], tabela:true },\n" % (q, l, m2, tipo, pm2, v, e, p, ll[0], ll[1]))
    return ("  { b:'barnabe', q:'%s', l:'%s', m2:%.2f, tipo:'%s', pm2:%.2f, vista:%.2f, entrada:%.2f, parcela:null, "
            "nx:100, ep:20, ll:[%.6f,%.6f], tabela:true, obs:'%s' },\n" % (q, l, m2, tipo, pm2, v, e, ll[0], ll[1], OBS))
assert sum(1 for x in LOTES if x[3] == 'COMERCIAL') == 11 and sum(1 for x in LOTES if x[3] == 'MISTO') == 5
novo = COMENT + '\n' + ''.join(linha(*x) for x in LOTES)
s = s[:ini] + novo + s[fim:]
m = re.search(r"^  \{ id:'barnabe',.*$", s, re.M)
lin = m.group(0)
nova = re.sub(r"tab:'[^']*'", "tab:'%s'" % TAB, lin, count=1)
nova = re.sub(r"sub:'[^']*'", "sub:'%s'" % SUB, nova, count=1)
if 'cond:' in nova:   # rodada repetida
    nova = re.sub(r"cond:'[^']*'", "cond:'%s'" % COND, nova, count=1)
else:
    nova = nova.replace(', overlay:', ", cond:'%s', overlay:" % COND, 1)
assert nova.count('cond:') == 1
s = s.replace(lin, nova, 1)
print('saem %d lotes de out/2026: %s' % (len(velhos), ', '.join(
    re.search(r"q:'(\w+)', l:'(\w+)'", x).expand(r'Q\1 L\2') for x in velhos)))
print('entram %d lotes de nov/2026' % len(LOTES))
print(nova[:300])
if '--gravar' in sys.argv:
    io.open(P, 'w', encoding='utf-8', newline='').write(s)
    print('gravado')
else:
    print('(só conferência; --gravar para gravar)')
