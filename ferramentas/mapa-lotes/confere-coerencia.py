# -*- coding: utf-8 -*-
# Varre TODOS os lotes do mapa atras de numero que nao pode existir.
#
# Nasceu de dois casos reais: a parcela do Zarah que saiu a 46% da devida porque
# a tabela veio sem juros, e o Di Italia F-027, que a Dominium mandou com entrada
# de R$ 440.000,00 num lote de R$ 210.000,00 — a parcela sairia negativa.
# Nenhum dos dois era visivel no site; so a conta denuncia.
#
# Uso: python confere-coerencia.py
import io, re, sys
sys.stdout.reconfigure(encoding='utf-8')

P = 'C:/Users/Usuario/Desktop/landing-page/mapa-lotes-indaiatuba/index.html'
s = io.open(P, encoding='utf-8', newline='').read()

LINHA = re.compile(r"^ *\{ b:'([^']+)',\s+q:'([^']+)',\s*l:'([^']+)'([^\n]*)\n", re.M)

# Loteamento marcado com `oculto:true` saiu do mapa (vendeu), mas o dado continua
# no arquivo para poder voltar. Nao adianta cobrar coerencia de quem ninguem ve —
# so que o verificador DIZ quantos pulou, em vez de calar: cap silencioso vira
# "esta tudo certo" quando na verdade nem foi olhado.
OCULTOS = set(re.findall(r"id:'([^']+)'\s*,\s*oculto:true", s))
# Bairro marcado com `casas:true` vende casa, nao lote. O popup monta o titulo
# com `modelo` e a metragem com `casa` (area construida); sem um dos dois o
# texto sai pela metade e o mapa nao quebra — ninguem ve. A busca para no
# proximo `{ id:` porque ha linha com dois bairros.
CASAS = set(re.findall(r"\{ id:'([^']+)',(?:(?!\{ id:')[^\n])*?\bcasas:true", s))
num = lambda linha, nome: (lambda g: float(g.group(1)) if g else None)(
    re.search(r'\b' + nome + r':(-?[\d.]+)', linha))

achados = {
    'parcela zero ou negativa': [],
    'entrada maior que o total': [],
    'soVista e parcelado ao mesmo tempo': [],
    'taxa fora do padrao do empreendimento': [],
    'pm2 nao bate com vista/m2': [],
    'sem preco e sem observacao': [],
    'casa sem modelo ou sem area construida': [],
}
taxas = {}


def taxa_implicita(saldo, parcela, n):
    """Juro mensal que faz `saldo` em `n` parcelas dar `parcela` (Price).
    Zero quando a parcela e o saldo dividido direto. Bissecao: a parcela
    cresce com a taxa, entao a busca e monotona."""
    if parcela * n <= saldo:
        return 0.0
    lo, hi = 0.0, 1.0
    for _ in range(200):
        mid = (lo + hi) / 2
        den = 1 - (1 + mid) ** -n
        # com taxa minuscula o denominador vira 0 em ponto flutuante; ali o
        # Price ja e, no limite, o saldo dividido direto
        p = saldo / n if den <= 1e-12 else saldo * mid / den
        if p < parcela:
            lo = mid
        else:
            hi = mid
    return (lo + hi) / 2


total = 0
pulados = 0
for m in LINHA.finditer(s):
    b, q, l, resto = m.groups()
    if b in OCULTOS:
        pulados += 1
        continue
    ident = '%s %s-%s' % (b, q, l)
    total += 1
    vista, prazo = num(resto, 'vista'), num(resto, 'prazo')
    entrada, parcela, nx = num(resto, 'entrada'), num(resto, 'parcela'), num(resto, 'nx')
    m2, pm2 = num(resto, 'm2'), num(resto, 'pm2')
    base = prazo if prazo is not None else vista

    if parcela is not None and parcela <= 0:
        achados['parcela zero ou negativa'].append('%s (R$ %.2f)' % (ident, parcela))
    if entrada is not None and base is not None and entrada >= base:
        achados['entrada maior que o total'].append(
            '%s (entrada R$ %.2f de R$ %.2f)' % (ident, entrada, base))
    # O que torna o lote contraditorio e ter PARCELA, nao ter nx: o nx e
    # opcional no template (`x.nx || 96`). Enquanto esta regra exigia nx, os 22
    # lotes da Vista Verde passaram invisiveis por meses — todos com parcela
    # correta e escondida atras de um "somente a vista". Mesma familia do bug
    # do espaco no Araras: o verificador que nao verifica e pior que nenhum.
    if 'soVista:true' in resto and (nx or parcela):
        achados['soVista e parcelado ao mesmo tempo'].append(ident)
    # Cada loteamento tem a sua taxa, entao nao adianta cravar uma. O que vale
    # cobrar e COERENCIA DENTRO DO MESMO EMPREENDIMENTO: derivamos a taxa que a
    # parcela publicada implica e, depois, comparamos cada lote com a mediana
    # dos irmaos. Foi assim que o Zarah apareceria (taxa 0% contra 1% dos outros).
    if None not in (entrada, parcela, nx, base) and nx > 0 and parcela > 0:
        taxas.setdefault(b, []).append((ident, taxa_implicita(base - entrada, parcela, int(nx))))
    if None not in (vista, m2, pm2) and abs(vista / m2 - pm2) > max(2, pm2 * 0.02):
        achados['pm2 nao bate com vista/m2'].append(
            '%s (%.0f contra %.0f)' % (ident, vista / m2, pm2))
    if vista is None and 'obs:' not in resto:
        achados['sem preco e sem observacao'].append(ident)
    if b in CASAS and (not re.search(r"\bmodelo:'[^']+'", resto) or num(resto, 'casa') is None):
        achados['casa sem modelo ou sem area construida'].append(ident)

# ── a taxa de cada lote contra a mediana dos irmaos ──────────────────
print('%d lotes conferidos' % total)
if pulados:
    print('%d lote(s) PULADOS por estarem em loteamento oculto: %s'
          % (pulados, ', '.join(sorted(OCULTOS))))
if CASAS:
    print('bairro(s) em modo casa: %s' % ', '.join(sorted(CASAS)))
print()
print('taxa mensal implicita por empreendimento:')
for b in sorted(taxas):
    v = sorted(t for _, t in taxas[b])
    mediana = v[len(v) // 2]
    print('   %-14s %5.3f%% a.m.  (%d lotes parcelados)' % (b, mediana * 100, len(v)))
    for ident, t in taxas[b]:
        if abs(t - mediana) > 0.0005:      # 0,05 ponto percentual ao mes
            achados['taxa fora do padrao do empreendimento'].append(
                '%s (%.3f%% a.m. contra %.3f%% dos irmaos)' % (ident, t * 100, mediana * 100))
print()
problema = False
for k, v in achados.items():
    if v:
        problema = True
        print('  %s: %d' % (k.upper(), len(v)))
        for x in v[:8]:
            print('     %s' % x)
        if len(v) > 8:
            print('     ... e mais %d' % (len(v) - 8))
    else:
        print('  ok — %s: nenhum' % k)
sys.exit(1 if problema else 0)
