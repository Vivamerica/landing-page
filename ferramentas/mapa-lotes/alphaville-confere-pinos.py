# -*- coding: utf-8 -*-
# Confere os pinos que o Fabio marcou no editor, ANTES de entrarem no mapa.
#
# O que pode ter dado errado e nao aparece a olho:
#   - lote fora do perimetro do loteamento (clique perdido);
#   - dois lotes no mesmo ponto (clique repetido);
#   - lote longe dos irmaos da quadra (ancora trocada);
#   - salto entre lotes de numero consecutivo (a quadra foi interpolada sem
#     marcar a quebra da fila, entao o meio cortou por dentro da quadra).
#
# O ultimo e o mais importante: num loteamento, lotes de numero vizinho sao
# vizinhos de porta. Um salto grande denuncia interpolacao atravessada.
import json, math, os, sys
sys.stdout.reconfigure(encoding='utf-8')

AQUI = os.path.dirname(os.path.abspath(__file__))
PIN = AQUI + '/editor-pinos/pinos.json'
DADOS = AQUI + '/editor-pinos/dados.json'
BOUNDS = ((-23.134029075, -47.208051304), (-23.119010830, -47.194755628))

pinos = json.load(open(PIN))
lotes = {l['id']: l for l in json.load(open(DADOS))['lotes']}
print('%d pinos, %d lotes na tabela' % (len(pinos), len(lotes)))

faltam = sorted(set(lotes) - set(pinos))
sobram = sorted(set(pinos) - set(lotes))
if faltam:
    print('SEM PINO (%d): %s' % (len(faltam), ', '.join(faltam)))
if sobram:
    print('PINO SEM LOTE NA TABELA (%d): %s' % (len(sobram), ', '.join(sobram)))


def metros(a, b):
    dlat = (a[0] - b[0]) * 110574.0
    dlon = (a[1] - b[1]) * 111320.0 * math.cos(math.radians(-23.126))
    return math.hypot(dlat, dlon)


achados = {'fora do perimetro': [], 'dois no mesmo ponto': [],
           'longe dos irmaos da quadra': [], 'salto entre numeros vizinhos': []}

for k, c in pinos.items():
    if not (BOUNDS[0][0] <= c[0] <= BOUNDS[1][0] and BOUNDS[0][1] <= c[1] <= BOUNDS[1][1]):
        achados['fora do perimetro'].append(k)

ids = sorted(pinos)
for i in range(len(ids)):
    for j in range(i + 1, len(ids)):
        if metros(pinos[ids[i]], pinos[ids[j]]) < 3:
            achados['dois no mesmo ponto'].append('%s e %s' % (ids[i], ids[j]))

por_q = {}
for k in pinos:
    por_q.setdefault(k.split('-')[0], []).append(k)

print('\n%-8s %6s %10s %10s %10s' % ('QUADRA', 'LOTES', 'VAO MEDIO', 'MAIOR VAO', 'EXTENSAO'))
print('-' * 50)
for q in sorted(por_q):
    ks = sorted(por_q[q], key=lambda k: int(k.split('-')[1]))
    cs = [pinos[k] for k in ks]
    cen = (sum(c[0] for c in cs) / len(cs), sum(c[1] for c in cs) / len(cs))
    for k in ks:
        d = metros(pinos[k], cen)
        if d > 400:
            achados['longe dos irmaos da quadra'].append('%s a %.0f m do centro da quadra' % (k, d))
    vaos = []
    for a, b in zip(ks, ks[1:]):
        na, nb = int(a.split('-')[1]), int(b.split('-')[1])
        d = metros(pinos[a], pinos[b])
        passo = d / (nb - na)          # metros por numero de lote
        vaos.append((passo, a, b, d, nb - na))
    if vaos:
        passos = sorted(v[0] for v in vaos)
        mediana = passos[len(passos) // 2]
        pior = max(vaos, key=lambda v: v[0])
        ext = max(metros(cs[i], cs[j]) for i in range(len(cs)) for j in range(i + 1, len(cs))) if len(cs) > 1 else 0
        print('%-8s %6d %9.1f m %9.1f m %9.0f m' % (q, len(ks), mediana, pior[0], ext))
        for passo, a, b, d, n in vaos:
            if mediana > 0 and passo > max(3 * mediana, mediana + 25):
                achados['salto entre numeros vizinhos'].append(
                    '%s -> %s: %.0f m para %d lote(s) (%.0f m/lote, mediana da quadra %.0f)'
                    % (a, b, d, n, passo, mediana))

print()
ruim = False
for k, v in achados.items():
    if v:
        ruim = True
        print('%s: %d' % (k.upper(), len(v)))
        for x in v[:10]:
            print('   ' + x)
        if len(v) > 10:
            print('   ... e mais %d' % (len(v) - 10))
    else:
        print('ok — %s: nenhum' % k)
sys.exit(1 if ruim else 0)
