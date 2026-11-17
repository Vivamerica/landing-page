# -*- coding: utf-8 -*-
# Parcela dos lotes vendidos direto pela loteadora: uma regra por bairro.
#
# O relatorio "Lotes disponiveis" da Dominium traz, por lote, o valor a prazo, a
# entrada e o numero de parcelas, mas NAO a parcela. Quem grava a linha do mapa
# precisa calcular. Bairro sem regra aqui continua como sempre foi: saldo
# dividido direto, (prazo - entrada) / nx.
#
# Todas as regras abaixo saem das planilhas de calculo da Dominium: Tabela Price,
# parcela no fim do mes, sobre o saldo (valor a prazo menos a entrada), a
# parcela arredondada a centavos. A planilha recusa (validacao das celulas)
# parcelas acima do maximo e entrada abaixo do minimo.
#
# Residencial Monte Carmelo ("Parcelamento Monte Carmelo", vigente desde 01/09/2025):
#   residencial  valor a prazo R$ 160.000 por 150 m2 (area x 1.066,67)  1%   a.m.  ate 96 parcelas
#   misto        valor a prazo R$ 195.000 por 150 m2 (area x 1.300)     1,2% a.m.  ate 48 parcelas
#   entrada minima de 10% do valor a prazo.
#   Conferida com tres simulacoes da calculadora (150 m2, R$ 160.000, 96x): entrada
#   R$ 16.000 -> R$ 2.340,41; R$ 25.000 -> R$ 2.194,13; R$ 90.000 -> R$ 1.137,70; e com
#   as 12 parcelas impressas na tabela de precos oficial (testes no fim do arquivo).
#   A tabela de precos acrescenta o que nao muda a parcela inicial: correcao pelo
#   IPCA (anual ate o 36o mes, mensal a partir do 37o), entrada do residencial
#   divisivel em ate 3 vezes, vencimentos so nos dias 08 e 22, e a opcao do lote
#   residencial de 150 m2 por R$ 150.000 em 10x fixas sem juros. Essa opcao NAO
#   esta modelada aqui: o relatorio de lotes nao a traz, e a tabela nao diz se ha
#   entrada nela. Lote do Monte Carmelo com 10x ou menos cai na Price comum.
# Jardim Residencial Alpnach ("Parcelamento Jd. Residencial Alpnach", vigente desde 02/09/2026):
#   valor a prazo = area x 1.800; 1% a.m.; ate 48 parcelas; entrada minima 20%.
# Jardim Residencial Di Italia ("Parcelamento Jd. Residencial Di Italia", vigente desde 02/09/2026):
#   valor a prazo = area x 1.466,67 (R$ 220.000 no lote de 150 m2); 1% a.m.; ate 60 parcelas;
#   entrada minima 20%.
# Residencial Ravello ("Parcelamento Jd. Residencial Ravello", vigente desde 30/01/2025):
#   ate 12 parcelas: m2 a R$ 1.750 e SEM juros (saldo dividido direto);
#   de 13 a 48 parcelas: m2 a R$ 1.800 e 1% a.m.; entrada minima 20%.
# Park Vista Real (planilha "lotes promocionais", vigente desde 20/07/2023) e
# Park Gran Reserve (vigente desde 08/08/2023): o valor do lote vem lote a lote
# (nao ha preco por m2 para conferir); ate 36 parcelas; entrada minima 20%;
# juros de 1% a.m. no Vista Real e 1,2% a.m. no Gran Reserve; parcelas
# corrigidas anualmente pelo IGPM ate a 36a.
#
# NORMALIZACAO (regra desde 16/10/2026). O relatorio da Dominium vem, mes a mes,
# com erro de digitacao no valor a prazo (o Ravello C-5 com o m2 a R$ 1.700 no
# lugar de R$ 1.800) e com entrada que nao foi recalculada quando o preco do lote
# mudou (19,7%, 20,1%, 22,3% em vez de 20%). A condicao publicada e a da
# planilha, montada com o que o relatorio traz de certo (area, tipo, numero de
# parcelas) — normaliza():
#   valor a prazo = area x preco do m2 da faixa, onde a planilha tem conta por m2
#                   (Monte Carmelo, Alpnach, Di Italia, Ravello); nos outros, o do relatorio;
#   entrada       = exatamente a % minima do valor a prazo, em centavos (meio para cima),
#                   nos bairros com `entrada_exata`; nos outros, a do relatorio, com o
#                   minimo como piso;
#   parcela       = Price da faixa sobre o saldo.
# O que o relatorio trazia diferente sai como lista de divergencias, para conferir
# com a loteadora; o lote continua parcelado. Duas excecoes:
#   · parcelas acima do maximo do tipo: a planilha nao calcula e outro prazo seria
#     inventado — o lote fica so a vista e vai para a lista;
#   · MUITOS lotes fora da conta ao mesmo tempo (tabela_nova()): quem ficou velha
#     foi a regra; os atualizadores nao gravam nada e avisam.
#
# O teste roda com:
#   python regras_parcela.py
#
# Quem usa: dominium-atualiza.py, montecarmelo-atualiza.py, lotes-js.py,
# refaz-parcelas.py e confere-coerencia.py. Mudou a taxa ou o preco do m2, mude
# AQUI, rode o refaz-parcelas.py (normaliza a condicao gravada no mapa) e o
# confere-coerencia.py (aponta o que ficou fora da regra).
from collections import Counter
from decimal import Decimal, ROUND_HALF_UP, localcontext

CENT = Decimal('0.01')

# Cada tipo de lote: juros ao mes, preco do m2 a prazo (None = valor lote a
# lote, sem conta por area) e maximo de parcelas. `curto` e a faixa de poucas
# parcelas com outra condicao (Ravello: ate 12x, sem juros e com outro m2).
# `entrada_exata`: a entrada publicada e exatamente a % minima (normalizada);
# sem ela, vale a do relatorio, com o minimo como piso.
PRICE = {
    'montecarmelo': {
        'fonte': 'planilha de calculo "Parcelamento Monte Carmelo" da Dominium, vigente desde 01/09/2025',
        'entrada_min': Decimal('0.10'),
        'entrada_exata': True,
        'correcao': 'IPCA, anual ate o 36o mes e mensal a partir do 37o',
        'tipos': {
            'RESIDENCIAL': {'juros': Decimal('0.01'), 'prazo_m2': Decimal(160000) / Decimal(150), 'max_nx': 96},
            'MISTO': {'juros': Decimal('0.012'), 'prazo_m2': Decimal(1300), 'max_nx': 48},
        },
    },
    'alpnach': {
        'fonte': 'planilha de calculo "Parcelamento Jd. Residencial Alpnach" da Dominium, vigente desde 02/09/2026',
        'entrada_min': Decimal('0.20'),
        'entrada_exata': True,
        'tipos': {
            'RESIDENCIAL': {'juros': Decimal('0.01'), 'prazo_m2': Decimal(1800), 'max_nx': 48},
        },
    },
    'diitalia': {
        'fonte': 'planilha de calculo "Parcelamento Jd. Residencial Di Italia" da Dominium, vigente desde 02/09/2026',
        'entrada_min': Decimal('0.20'),
        'entrada_exata': True,
        'tipos': {
            'RESIDENCIAL': {'juros': Decimal('0.01'), 'prazo_m2': Decimal(220000) / Decimal(150), 'max_nx': 60},
        },
    },
    'ravello': {
        'fonte': 'planilha de calculo "Parcelamento Jd. Residencial Ravello" da Dominium, vigente desde 30/01/2025',
        'entrada_min': Decimal('0.20'),
        'entrada_exata': True,
        'tipos': {
            'RESIDENCIAL': {'juros': Decimal('0.01'), 'prazo_m2': Decimal(1800), 'max_nx': 48,
                            'curto': {'ate_nx': 12, 'juros': Decimal(0), 'prazo_m2': Decimal(1750)}},
        },
    },
    'vistareal': {
        'fonte': 'planilha de calculo "Park Vista Real - lotes promocionais" da Dominium, vigente desde 20/07/2023',
        'entrada_min': Decimal('0.20'),
        'entrada_exata': True,
        'correcao': 'IGPM, anual ate a 36a parcela',
        'tipos': {
            'RESIDENCIAL': {'juros': Decimal('0.01'), 'prazo_m2': None, 'max_nx': 36},
        },
    },
    'granreserve': {
        'fonte': 'planilha de calculo "Park Gran Reserve" da Dominium, vigente desde 08/08/2023',
        'entrada_min': Decimal('0.20'),
        # ainda nao: o relatorio de 10/2026 traz no unico lote parcelado (34-24) a
        # "entrada minima R$ 130.000,00", 20,19% do valor a prazo, e a pagina do
        # mapa cita esse valor. Ligar so depois de confirmar que vale 20% exatos
        # tambem aqui (e entao rodar refaz-parcelas.py granreserve --gravar).
        'entrada_exata': False,
        'correcao': 'IGPM, anual ate a 36a parcela',
        'tipos': {
            'RESIDENCIAL': {'juros': Decimal('0.012'), 'prazo_m2': None, 'max_nx': 36},
        },
    },
}

# tabela_nova(): normalizar corrige o lote isolado; em mais lotes do que isso, para.
PRAZO_ISOLADO, PRAZO_CONFIRMA = 2, 3
# diferenca de valor a prazo que conta como "outro preco do m2" (abaixo disso e arredondamento)
PRAZO_FOLGA = Decimal('1.00')


class SemRegra(ValueError):
    """Lote de um tipo que a regra do bairro nao cobre (ex.: COMERCIAL num bairro
    que so tem taxa para RESIDENCIAL e MISTO). Nao se adivinha taxa: para."""


def tem_regra(bairro):
    return bairro in PRICE


def regra_tipo(bairro, tipo):
    r = PRICE[bairro]['tipos'].get(tipo)
    if r is None:
        raise SemRegra('%s: tipo %s sem taxa na regra (%s)' % (bairro, tipo, ', '.join(sorted(PRICE[bairro]['tipos']))))
    return r


def condicao(bairro, tipo, nx=None):
    """Juros, preco do m2 a prazo e maximo de parcelas que valem para esse lote.
    Com `nx` dentro da faixa curta do tipo (Ravello ate 12x), vale a faixa curta."""
    r = regra_tipo(bairro, tipo)
    c = {'juros': r['juros'], 'prazo_m2': r['prazo_m2'], 'max_nx': r['max_nx'], 'faixa': 'ate %dx' % r['max_nx']}
    curto = r.get('curto')
    if curto and nx and int(nx) <= curto['ate_nx']:
        c.update(juros=curto['juros'], prazo_m2=curto['prazo_m2'], faixa='ate %dx' % curto['ate_nx'])
    return c


def taxa(bairro, tipo, nx=None):
    """Juro mensal da regra (float), ou None quando o bairro nao tem regra.
    Sem `nx`, a taxa da faixa principal do tipo."""
    if not tem_regra(bairro):
        return None
    return float(condicao(bairro, tipo, nx)['juros'])


def pmt(juros, n, saldo):
    """PMT(juros, n, -saldo, 0, 0) do Excel, arredondado a centavos (meio para cima)."""
    juros, saldo = Decimal(str(juros)), Decimal(str(saldo))
    with localcontext() as ctx:
        ctx.prec = 40
        if juros == 0:
            p = saldo / n
        else:
            p = saldo * juros / (1 - (1 + juros) ** -int(n))
        return p.quantize(CENT, rounding=ROUND_HALF_UP)


def parcela(bairro, tipo, prazo, entrada, nx):
    """Parcela a gravar na linha do mapa (float).

    Bairro com regra: Tabela Price com a taxa do tipo (e da faixa), arredondada a
    centavos; taxa zero e o saldo dividido direto, tambem em centavos.
    Bairro sem regra: saldo dividido direto, como sempre foi (o '%.2f' de quem
    grava faz o arredondamento, igual ao de antes)."""
    if not tem_regra(bairro):
        return (prazo - entrada) / nx
    return float(pmt(condicao(bairro, tipo, nx)['juros'], int(nx), Decimal(str(prazo)) - Decimal(str(entrada))))


def _d(v):
    return Decimal(str(v))


def _brl(v):
    return 'R$ ' + format(float(v), ',.2f').replace(',', '_').replace('.', ',').replace('_', '.')


def prazo_da_planilha(bairro, tipo, m2, prazo, nx):
    """Valor a prazo pela planilha (Decimal em centavos): area x m2 da faixa do lote;
    no bairro de valor lote a lote, o valor que veio (do relatorio ou do mapa)."""
    c = condicao(bairro, tipo, nx)
    if c['prazo_m2'] is None:
        return _d(prazo).quantize(CENT, rounding=ROUND_HALF_UP)
    return (_d(m2) * c['prazo_m2']).quantize(CENT, rounding=ROUND_HALF_UP)


def entrada_da_planilha(bairro, prazo, entrada=None):
    """Entrada pela planilha (Decimal em centavos) para o valor a prazo `prazo`:
    a % minima exata nos bairros com `entrada_exata`; nos outros, a que veio,
    com o minimo como piso."""
    minimo = (_d(prazo) * PRICE[bairro]['entrada_min']).quantize(CENT, rounding=ROUND_HALF_UP)
    if PRICE[bairro]['entrada_exata'] or entrada is None:
        return minimo
    return max(minimo, _d(entrada).quantize(CENT, rounding=ROUND_HALF_UP))


def normaliza(bairro, tipo, m2, prazo, entrada, nx):
    """Condicao a publicar de um lote parcelado de bairro com regra, a partir do que
    veio (relatorio ou linha do mapa). Devolve (cond, divergencias):
      cond          {'prazo', 'entrada', 'parcela' (Decimal), 'nx', 'ep' (int)}, ou None
                    quando nao ha condicao a prazo que a planilha calcule (parcelas
                    acima do maximo do tipo, ou valor a prazo zero/ausente): o lote
                    fica so a vista;
      divergencias  [(campo, veio, planilha, texto)] do que veio diferente da planilha:
                    'prazo' e 'entrada' (Decimal; `planilha` e o valor publicado) e
                    'nx' (int; `planilha` e o maximo).
    Tipo sem taxa na regra levanta SemRegra: taxa nao se adivinha."""
    c = condicao(bairro, tipo, nx)
    nx = int(nx)
    if nx > c['max_nx']:
        return None, [('nx', nx, c['max_nx'], '%dx passa do maximo de %dx do tipo %s: a planilha nao calcula, '
                       'o lote fica so a vista' % (nx, c['max_nx'], tipo))]
    if not prazo or prazo <= 0 or (c['prazo_m2'] is not None and not m2):
        return None, [('prazo', prazo, None, 'valor a prazo %s e area %s: sem base para a condicao a prazo, '
                       'o lote fica so a vista' % (prazo, m2))]
    div = []
    p = prazo_da_planilha(bairro, tipo, m2, prazo, nx)
    if abs(_d(prazo) - p) >= CENT:
        div.append(('prazo', _d(prazo), p, 'valor a prazo %s, a planilha da %s (%s m2 x %s, %s)'
                    % (_brl(prazo), _brl(p), _brl(m2)[3:], _brl(c['prazo_m2']), c['faixa'])))
    e = entrada_da_planilha(bairro, p, entrada)
    if entrada is None or abs(_d(entrada) - e) >= CENT:
        pct = PRICE[bairro]['entrada_min'] * 100
        veio = _d(entrada) if entrada is not None else None
        div.append(('entrada', veio, e, 'entrada %s (%s do valor a prazo que veio), %d%% de %s sao %s'
                    % (_brl(entrada) if entrada is not None else 'ausente',
                       ('%.3f%%' % (float(entrada) / float(prazo) * 100)).replace('.', ',') if entrada is not None else '—',
                       pct, _brl(p), _brl(e))))
    cond = {'prazo': p, 'entrada': e, 'nx': nx, 'parcela': pmt(c['juros'], nx, p - e),
            'ep': int(round(float(e) / float(p) * 100))}
    return cond, div


def fora_da_regra(bairro, tipo, m2, prazo, entrada, nx):
    """O que foge da planilha do bairro numa condicao (do relatorio ou do mapa),
    como lista de (campo, texto):
      'tipo'    tipo de lote sem taxa na regra;
      'prazo'   valor a prazo diferente de area x preco do m2 da faixa do lote;
      'entrada' entrada diferente da % minima exata (ou abaixo do minimo, nos
                bairros sem `entrada_exata`);
      'nx'      parcelas acima do maximo do tipo.
    Vazio = a condicao ja e a normalizada. A parcela nao entra aqui: quem grava ou
    confere compara a parcela com parcela()."""
    if not tem_regra(bairro):
        return []
    try:
        _, div = normaliza(bairro, tipo, m2, prazo, entrada, nx)
    except SemRegra as e:
        return [('tipo', str(e))]
    return [(campo, texto) for campo, _, _, texto in div]


def confere(bairro, tipo, m2, prazo, entrada, nx):
    """Os textos de fora_da_regra(), para quem so lista (confere-coerencia.py)."""
    return [t for _, t in fora_da_regra(bairro, tipo, m2, prazo, entrada, nx)]


def tabela_nova(bairro, lotes):
    """Cara de tabela nova num lote de condicoes (o relatorio inteiro de um bairro).
    `lotes`: [(ident, tipo, m2, prazo, entrada, nx)], so os parcelados, como vieram.
    Normalizar corrige o erro de lote isolado; quando MUITOS lotes do mesmo tipo
    fogem da planilha do mesmo jeito, quem ficou velha foi a regra, e normalizar
    publicaria o preco antigo. Devolve os motivos (vazio: pode normalizar):
      · valor a prazo fora de area x m2 (mais que PRAZO_FOLGA) em mais de
        PRAZO_ISOLADO lotes do tipo, ou sem PRAZO_CONFIRMA lotes do tipo dentro
        da conta para confirmar a regra;
      · a maioria dos lotes do tipo (e pelo menos 3) com a MESMA entrada
        percentual, diferente da minima (abaixo dela, nos bairros sem
        `entrada_exata`): cara de minimo novo.
    Tipo sem taxa nao entra aqui (quem chama para antes, com SemRegra)."""
    if not tem_regra(bairro):
        return []
    regra = PRICE[bairro]
    minimo = regra['entrada_min'] * 100
    por_tipo = {}
    for ident, tipo, m2, prazo, entrada, nx in lotes:
        if tipo not in regra['tipos']:
            continue
        t = por_tipo.setdefault(tipo, {'fora': [], 'dentro': 0, 'pct': Counter(), 'n': 0})
        t['n'] += 1
        c = condicao(bairro, tipo, nx)
        if c['prazo_m2'] is not None:
            if abs(_d(prazo) - prazo_da_planilha(bairro, tipo, m2, prazo, nx)) > PRAZO_FOLGA:
                t['fora'].append(ident)
            else:
                t['dentro'] += 1
        if entrada is not None and prazo:
            t['pct'][(_d(entrada) / _d(prazo) * 100).quantize(CENT, rounding=ROUND_HALF_UP)] += 1
    motivos = []
    for tipo, t in sorted(por_tipo.items()):
        if t['fora'] and (len(t['fora']) > PRAZO_ISOLADO or t['dentro'] < PRAZO_CONFIRMA):
            motivos.append('%s %s: valor a prazo fora de area x m2 em %d lote(s) (%s), %d dentro da conta — '
                           'preco do m2 novo?' % (bairro, tipo, len(t['fora']), ', '.join(t['fora'][:8])
                                                   + (' …' if len(t['fora']) > 8 else ''), t['dentro']))
        if t['pct']:
            pct, n = t['pct'].most_common(1)[0]
            difere = pct < minimo if not regra['entrada_exata'] else abs(pct - minimo) >= CENT
            if difere and n >= 3 and 2 * n > t['n']:
                motivos.append('%s %s: %d de %d lotes com entrada de %s%% do valor a prazo, e a planilha diz %d%% — '
                               'minimo novo?' % (bairro, tipo, n, t['n'], str(pct).replace('.', ','), minimo))
    return motivos


if __name__ == '__main__':
    import sys
    sys.stdout.reconfigure(encoding='utf-8')
    casos = [
        # (bairro, tipo, prazo, entrada, nx, parcela esperada)
        # Monte Carmelo — calculadora da Dominium
        ('montecarmelo', 'RESIDENCIAL', 160000, 16000, 96, 2340.41),
        ('montecarmelo', 'RESIDENCIAL', 160000, 25000, 96, 2194.13),
        ('montecarmelo', 'RESIDENCIAL', 160000, 90000, 96, 1137.70),
        # exemplo que vem preenchido na propria planilha (entrada 32.000, 60x)
        ('montecarmelo', 'RESIDENCIAL', 160000, 32000, 60, 2847.29),
        # Monte Carmelo — as 12 parcelas impressas na tabela de precos oficial
        ('montecarmelo', 'RESIDENCIAL', 160000, 16000, 12, 12794.23),
        ('montecarmelo', 'RESIDENCIAL', 160000, 16000, 24, 6778.58),
        ('montecarmelo', 'RESIDENCIAL', 160000, 16000, 36, 4782.86),
        ('montecarmelo', 'RESIDENCIAL', 160000, 16000, 48, 3792.07),
        ('montecarmelo', 'RESIDENCIAL', 160000, 16000, 60, 3203.20),
        ('montecarmelo', 'RESIDENCIAL', 160000, 16000, 72, 2815.23),
        ('montecarmelo', 'RESIDENCIAL', 160000, 16000, 84, 2541.99),
        ('montecarmelo', 'RESIDENCIAL', 160000, 16000, 96, 2340.41),
        ('montecarmelo', 'MISTO', 195000, 19500, 12, 15790.69),
        ('montecarmelo', 'MISTO', 195000, 19500, 24, 8459.46),
        ('montecarmelo', 'MISTO', 195000, 19500, 36, 6032.33),
        ('montecarmelo', 'MISTO', 195000, 19500, 48, 4831.09),
        # exemplos preenchidos nas planilhas de cada bairro (celula da parcela)
        ('alpnach', 'RESIDENCIAL', 300 * 1800, 120000, 48, 11060.21),        # 11.060,2108...
        ('diitalia', 'RESIDENCIAL', 220000, 44000, 60, 3915.02),             # 3.915,0227...
        ('ravello', 'RESIDENCIAL', 795762, 159152.40, 48, 16764.37),         # 442,09 m2 x 1.800; 16.764,3724...
        ('vistareal', 'RESIDENCIAL', 390000, 200000, 36, 6310.72),           # 6.310,7188...
        ('granreserve', 'RESIDENCIAL', 375137.50, 76000, 36, 10282.02),      # 10.282,0222...
        # Ravello ate 12x: m2 a 1.750 e sem juros — a formula da planilha e (lote - entrada) / parcelas
        ('ravello', 'RESIDENCIAL', 442.09 * 1750, 154731.50, 12, 51577.17),  # 618.926,00 / 12 = 51.577,1666...
        ('ravello', 'RESIDENCIAL', 442.09 * 1800, 159152.40, 13, 52466.07),  # 13x ja e Price a 1% (52.466,0653...)
        # bairro sem regra: saldo dividido direto, como antes
        ('bairro-sem-regra', 'RESIDENCIAL', 100000, 20000, 48, 80000 / 48),
    ]
    falhas = 0
    for b, t, pr, en, n, esp in casos:
        got = parcela(b, t, pr, en, n)
        ok = ('%.2f' % got) == ('%.2f' % esp)
        falhas += not ok
        print('%s  %-16s %-11s R$ %10.2f - R$ %10.2f em %2dx -> R$ %9.2f (esperado %.2f)'
              % ('ok ' if ok else 'ERRO', b, t, pr, en, n, got, esp))
    try:
        parcela('montecarmelo', 'COMERCIAL', 160000, 16000, 96)
        print('ERRO tipo sem taxa nao parou'); falhas += 1
    except SemRegra as e:
        print('ok   tipo sem taxa para: %s' % e)
    # taxa por faixa
    for args, esp in [(('ravello', 'RESIDENCIAL', 12), 0.0), (('ravello', 'RESIDENCIAL', 48), 0.01),
                      (('ravello', 'RESIDENCIAL'), 0.01), (('granreserve', 'RESIDENCIAL', 36), 0.012),
                      (('montecarmelo', 'MISTO', 48), 0.012), (('bairro-sem-regra', 'RESIDENCIAL', 48), None)]:
        got = taxa(*args)
        ok = got == esp
        falhas += not ok
        print('%s  taxa %s -> %s (esperado %s)' % ('ok ' if ok else 'ERRO', args, got, esp))

    # ── normalizacao: (bairro, tipo, m2, prazo, entrada, nx) como vieram do relatorio
    #    -> (prazo, entrada, parcela, nx) publicados e campos que divergiam; None = so a vista
    for nome, args, esp, esp_div in [
        # Ravello C-5: relatorio de 10/2026 com o m2 a prazo a 1.700 (digitacao) — volta ao parcelado
        ('ravello C-5', ('ravello', 'RESIDENCIAL', 475.83, 808911, 161782.20, 48),
         ('856494.00', '171298.80', '18043.82', 48), ['prazo', 'entrada']),
        # Ravello A-24: entrada de R$ 220.000 (19,68%) -> 20% exatos
        ('ravello A-24', ('ravello', 'RESIDENCIAL', 621.13, 1118034, 220000, 48),
         ('1118034.00', '223606.80', '23553.70', 48), ['entrada']),
        # Ravello com entrada de 20,1% (C-3) tambem vai a 20% exatos
        ('ravello C-3', ('ravello', 'RESIDENCIAL', 496.28, 893304, 180000, 48),
         ('893304.00', '178660.80', '18819.30', 48), ['entrada']),
        # Ravello ja certo: nada diverge
        ('ravello 420 m2', ('ravello', 'RESIDENCIAL', 420, 756000, 151200, 48),
         ('756000.00', '151200.00', '15926.70', 48), []),
        # Ravello ate 12x: m2 a 1.750, sem juros
        ('ravello 12x', ('ravello', 'RESIDENCIAL', 442.09, 773657.50, 154731.50, 12),
         ('773657.50', '154731.50', '51577.17', 12), []),
        # Park Vista Real: entrada redonda abaixo de 20% (o preco mudou e a entrada ficou)
        ('vistareal B-24', ('vistareal', 'RESIDENCIAL', 307.98, 401000, 80000, 36),
         ('401000.00', '80200.00', '10655.15', 36), ['entrada']),
        ('vistareal D-13', ('vistareal', 'RESIDENCIAL', 327.57, 426000, 85000, 36),
         ('426000.00', '85200.00', '11319.44', 36), ['entrada']),
        ('vistareal G-18', ('vistareal', 'RESIDENCIAL', 327.03, 426000, 85000, 36),
         ('426000.00', '85200.00', '11319.44', 36), ['entrada']),
        ('vistareal G-28', ('vistareal', 'RESIDENCIAL', 352.70, 459000, 91000, 36),
         ('459000.00', '91800.00', '12196.29', 36), ['entrada']),
        ('vistareal I-44', ('vistareal', 'RESIDENCIAL', 367.72, 478000, 95000, 36),
         ('478000.00', '95600.00', '12701.15', 36), ['entrada']),
        # Park Vista Real com entrada ACIMA de 20% (22,31%): tambem vai a 20% exatos
        ('vistareal B-17', ('vistareal', 'RESIDENCIAL', 327.50, 425750, 95000, 36),
         ('425750.00', '85150.00', '11312.79', 36), ['entrada']),
        # Park Vista Real: valor lote a lote, sem conta por m2 (o a prazo que veio fica)
        ('vistareal sem m2', ('vistareal', 'RESIDENCIAL', 300, 999999, 199999.80, 36),
         ('999999.00', '199999.80', None, 36), []),
        # Gran Reserve, sem entrada exata: a do relatorio fica (acima do minimo)...
        ('granreserve 34-24', ('granreserve', 'RESIDENCIAL', 551.87, 643848.30, 130000, 36),
         ('643848.30', '130000.00', '17662.11', 36), []),
        # ... e abaixo do minimo sobe ao minimo
        ('granreserve abaixo', ('granreserve', 'RESIDENCIAL', 551.87, 643848.30, 120000, 36),
         ('643848.30', '128769.66', '17704.40', 36), ['entrada']),
        # Monte Carmelo e Di Italia pela conta: nada muda
        ('montecarmelo res', ('montecarmelo', 'RESIDENCIAL', 150, 160000, 16000, 96),
         ('160000.00', '16000.00', '2340.41', 96), []),
        ('montecarmelo misto', ('montecarmelo', 'MISTO', 150, 195000, 19500, 48),
         ('195000.00', '19500.00', '4831.09', 48), []),
        ('diitalia 237,52', ('diitalia', 'RESIDENCIAL', 237.52, 348362.67, 69672.53, 60),
         ('348362.67', '69672.53', None, 60), []),                                   # 20% arredondado ao centavo
        # Monte Carmelo: entrada de 11% tambem vai ao minimo exato
        ('montecarmelo 11%', ('montecarmelo', 'RESIDENCIAL', 150, 160000, 17600, 96),
         ('160000.00', '16000.00', '2340.41', 96), ['entrada']),
        # parcelas acima do maximo: nao se normaliza, fica so a vista
        ('alpnach 49x', ('alpnach', 'RESIDENCIAL', 300, 540000, 108000, 49), None, ['nx']),
        # sem valor a prazo (relatorio com zero): nao ha base, fica so a vista
        ('vistareal prazo zero', ('vistareal', 'RESIDENCIAL', 300, 0, 0, 36), None, ['prazo']),
        ('montecarmelo misto 60x', ('montecarmelo', 'MISTO', 150, 195000, 19500, 60), None, ['nx']),
    ]:
        cond, div = normaliza(*args)
        campos = [d[0] for d in div]
        if esp is None:
            ok = cond is None and campos == esp_div
            got = 'so a vista'
        else:
            got = (str(cond['prazo']), str(cond['entrada']), str(cond['parcela']), cond['nx'])
            ok = (cond is not None and got[0] == esp[0] and got[1] == esp[1] and got[3] == esp[3]
                  and (esp[2] is None or got[2] == esp[2]) and campos == esp_div
                  and cond['parcela'] == pmt(condicao(args[0], args[1], args[5])['juros'], args[5],
                                             cond['prazo'] - cond['entrada']))
        falhas += not ok
        print('%s  normaliza %-22s -> %s, diverge %s (esperado %s, %s)'
              % ('ok ' if ok else 'ERRO', nome, got, campos, esp or 'so a vista', esp_div))
        for d in div:
            print('       %s' % d[3])
    try:
        normaliza('montecarmelo', 'COMERCIAL', 150, 195000, 19500, 48)
        print('ERRO normaliza com tipo sem taxa nao parou'); falhas += 1
    except SemRegra:
        print('ok   normaliza com tipo sem taxa para')

    # ── o que foge da regra numa linha do mapa: (bairro, tipo, m2, prazo, entrada, nx) -> campos
    for args, esp in [
        (('montecarmelo', 'RESIDENCIAL', 150, 160000, 16000, 96), []),
        (('montecarmelo', 'MISTO', 150, 195000, 19500, 48), []),
        (('montecarmelo', 'RESIDENCIAL', 150, 160000, 16000, 97), ['nx']),
        (('montecarmelo', 'MISTO', 150, 195000, 19500, 60), ['nx']),
        (('montecarmelo', 'RESIDENCIAL', 150, 160000, 8000, 96), ['entrada']),
        (('montecarmelo', 'RESIDENCIAL', 150, 160000, 15900, 96), ['entrada']),
        (('montecarmelo', 'RESIDENCIAL', 150, 165000, 16500, 96), ['prazo', 'entrada']),
        (('montecarmelo', 'COMERCIAL', 150, 195000, 19500, 48), ['tipo']),
        (('alpnach', 'RESIDENCIAL', 300, 540000, 108000, 48), []),
        (('alpnach', 'RESIDENCIAL', 300, 540000, 108000, 49), ['nx']),
        (('alpnach', 'RESIDENCIAL', 300, 510000, 102000, 48), ['prazo', 'entrada']),  # m2 a 1.700
        (('alpnach', 'RESIDENCIAL', 300, 540000, 106000, 48), ['entrada']),           # 19,63%: sem tolerancia
        (('diitalia', 'RESIDENCIAL', 150, 220000, 44000, 60), []),
        (('diitalia', 'RESIDENCIAL', 237.52, 348362.67, 69672.53, 60), []),
        (('diitalia', 'RESIDENCIAL', 150, 220000, 44000, 61), ['nx']),
        (('ravello', 'RESIDENCIAL', 442.09, 795762, 159152.40, 48), []),
        (('ravello', 'RESIDENCIAL', 442.09, 773657.50, 154731.50, 12), []),
        (('ravello', 'RESIDENCIAL', 442.09, 795762, 159152.40, 12), ['prazo', 'entrada']),   # 12x com o m2 do 48x
        (('ravello', 'RESIDENCIAL', 621.13, 1118034, 220000, 48), ['entrada']),               # 19,68%
        (('ravello', 'RESIDENCIAL', 621.13, 1118034, 223606.80, 48), []),
        (('vistareal', 'RESIDENCIAL', 300, 390000, 78000, 36), []),
        (('vistareal', 'RESIDENCIAL', 307.98, 401000, 80000, 36), ['entrada']),               # 19,95%
        (('vistareal', 'RESIDENCIAL', 307.98, 401000, 80200, 36), []),
        (('vistareal', 'RESIDENCIAL', 300, 390000, 78000, 37), ['nx']),
        (('granreserve', 'RESIDENCIAL', 551.87, 643848.30, 130000, 36), []),
        (('granreserve', 'RESIDENCIAL', 551.87, 643848.30, 130000, 48), ['nx']),
        (('bairro-sem-regra', 'RESIDENCIAL', 420, 756000, 1000, 480), []),
    ]:
        got = [c for c, _ in fora_da_regra(*args)]
        ok = got == esp
        falhas += not ok
        print('%s  fora da regra %s -> %s (esperado %s)' % ('ok ' if ok else 'ERRO', args, got, esp))

    # ── cara de tabela nova: (bairro, lotes) -> ha motivo para parar?
    R = lambda ident, m2, prazo, ent, nx=48: (ident, 'RESIDENCIAL', m2, prazo, ent, nx)
    ravello_ok = [R('A-%d' % i, 420, 756000, 151200) for i in range(1, 6)]
    vistareal_rel = [R(*x, nx=36) for x in [
        ('A-1', 300.65, 390845, 80000), ('A-4', 330.29, 430000, 86000), ('A-7', 408.44, 530972, 110000),
        ('B-17', 327.50, 425750, 95000), ('B-24', 307.98, 401000, 80000), ('D-13', 327.57, 426000, 85000),
        ('G-18', 327.03, 426000, 85000), ('H-6', 300, 390000, 78000), ('H-7', 300, 390000, 78000)]]
    for nome, b, lotes, para in [
        ('ravello: C-5 isolado com o m2 errado', 'ravello', ravello_ok + [R('C-5', 475.83, 808911, 161782.20)], False),
        ('ravello: 3 lotes com o m2 a 1.700', 'ravello',
         ravello_ok + [R('C-%d' % i, 420, 714000, 142800) for i in range(3)], True),
        ('ravello: 1 lote fora e so 2 confirmando', 'ravello',
         ravello_ok[:2] + [R('C-5', 475.83, 808911, 161782.20)], True),
        ('ravello: entradas de 19,7% a 20,2% soltas', 'ravello',
         ravello_ok + [R('A-24', 621.13, 1118034, 220000), R('C-3', 496.28, 893304, 180000)], False),
        ('ravello: maioria com entrada de 25%', 'ravello',
         ravello_ok[:2] + [R('B-%d' % i, 420, 756000, 189000) for i in range(4)], True),
        ('vistareal: entradas redondas soltas', 'vistareal', vistareal_rel, False),
        ('granreserve: um lote a 20,19%', 'granreserve', [R('34-24', 551.87, 643848.30, 130000, 36)], False),
        ('granreserve: maioria abaixo de 20%', 'granreserve',
         [R('1-%d' % i, 500, 600000, 90000, 36) for i in range(3)], True),
    ]:
        motivos = tabela_nova(b, lotes)
        ok = bool(motivos) == para
        falhas += not ok
        print('%s  tabela nova? %-42s -> %s' % ('ok ' if ok else 'ERRO', nome, '; '.join(motivos) or 'nao'))
    print('falhas: %d' % falhas)
    sys.exit(1 if falhas else 0)
