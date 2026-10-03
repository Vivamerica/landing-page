# -*- coding: utf-8 -*-
# O que esta na landing e nao esta no mapa de lotes, e o contrario.
#
# O cruzamento e pelo campo `landing:'/slug/'` que cada bairro do mapa carrega.
# Apartamento nao entra na conta: o mapa e de lotes, entao so os LOTES da fonte
# unica deveriam ter bairro la.
import io, os, re, sys
sys.stdout.reconfigure(encoding='utf-8')

R = 'C:/Users/Usuario/Desktop/landing-page/'
src = io.open(R + 'gera-folheto.js', encoding='utf-8', newline='').read()
mapa = io.open(R + 'mapa-lotes-indaiatuba/index.html', encoding='utf-8', newline='').read()

ASPA = chr(39)
TXT = re.compile(r"%s:" + ASPA + r"([^" + ASPA + r"]*)" + ASPA)


def lista(nome):
    i = src.index('const ' + nome + ' = [')
    j = src.index(chr(10) + '];', i)
    out = []
    for m in re.finditer(r"\{([^{}]*)\}", src[i:j]):
        b, d = m.group(1), {}
        for k in ('n', 'c', 'slug', 't'):
            r = re.search(TXT.pattern % k, b)
            if r:
                d[k] = r.group(1)
        if d.get('slug'):
            out.append(d)
    return out


APT, LOT = lista('APTOS'), lista('LOTES')

# ── bairros do mapa ─────────────────────────────────────────────────
achados = [(m.start(), m.group(1)) for m in re.finditer(r"\{ id:'([^']+)',", mapa)]
bairros = {}
for i, (ini, bid) in enumerate(achados):
    fim = achados[i + 1][0] if i + 1 < len(achados) else ini + 900
    trecho = mapa[ini:fim]
    nome = re.search(r"nome:'([^']*)'", trecho)
    land = re.search(r"landing:'/([^/']*)/?'", trecho)
    n = len(re.findall(r"\{ b:'%s',\s+q:'" % re.escape(bid), mapa))
    bairros[bid] = {'nome': nome.group(1) if nome else bid,
                    'slug': land.group(1) if land else None, 'lotes': n}

slugs_mapa = {b['slug'] for b in bairros.values() if b['slug']}
slugs_lot = {e['slug'] for e in LOT}
slugs_apt = {e['slug'] for e in APT}

print('fonte única: %d loteamentos, %d prédios' % (len(LOT), len(APT)))
print('mapa: %d bairros, %d lotes\n' % (len(bairros), sum(b['lotes'] for b in bairros.values())))

print('═' * 74)
print('TEM LANDING DE LOTEAMENTO, MAS NÃO ESTÁ NO MAPA')
print('═' * 74)
faltam = [e for e in LOT if e['slug'] not in slugs_mapa]
for e in sorted(faltam, key=lambda e: e['n']):
    print('  %-32s %s' % (e['n'], e.get('c') or ''))
if not faltam:
    print('  nenhum — todo loteamento com landing está no mapa')

print('\n' + '═' * 74)
print('ESTÁ NO MAPA, MAS NÃO TEM LANDING')
print('═' * 74)
orfaos = [(bid, b) for bid, b in bairros.items()
          if not b['slug'] or (b['slug'] not in slugs_lot and b['slug'] not in slugs_apt)]
for bid, b in sorted(orfaos, key=lambda x: -x[1]['lotes']):
    print('  %-34s %4d lote(s)   %s' % (b['nome'][:34], b['lotes'],
          'sem link' if not b['slug'] else 'aponta para /%s/ (não existe na fonte única)' % b['slug']))
if not orfaos:
    print('  nenhum')

print('\n' + '═' * 74)
print('CONFERE: landing de loteamento que ESTÁ no mapa')
print('═' * 74)
for e in sorted(LOT, key=lambda e: e['n']):
    if e['slug'] in slugs_mapa:
        b = [x for x in bairros.values() if x['slug'] == e['slug']]
        tot = sum(x['lotes'] for x in b)
        print('  %-32s %4d lote(s) no mapa' % (e['n'], tot))

# apartamento no mapa seria erro
no_mapa_apt = [b for b in bairros.values() if b['slug'] in slugs_apt]
if no_mapa_apt:
    print('\nATENÇÃO: prédio aparecendo no mapa de lotes: %s'
          % ', '.join(b['nome'] for b in no_mapa_apt))
