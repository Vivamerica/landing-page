import re, sys, os, json
from collections import Counter, defaultdict
sys.stdout.reconfigure(encoding='utf-8')
D = os.environ['TEMP'] + '/mapas/vilafahl/'
f = lambda v: float(v.replace('.', '').replace(',', '.'))
L = []
for arq, tipo in (('tabela residenciais.txt', 'RESIDENCIAL'), ('TABELA LOTES COMERCIAL VILA FAHL - 96 meses - 1825.txt', 'COMERCIAL')):
    t = open(D + arq, encoding='utf-8').read()
    for m in re.finditer(r'FASE (\d+) ([\d.,]+) ([A-Z]+) (\d+) ([\d.,]+)\s*R\$\s+([\d.,]+)R\$\s+([\d.,]+)R\$\s+([\d.,]+)R\$\s+([\d.,]+)R\$\s+([\d.,]+)R\$((?:\s+[\d.,]+R\$)*)', t):
        vals = re.findall(r'[\d.,]+', m.group(11))
        L.append(dict(tipo=tipo, fase=m.group(1), m2=f(m.group(2)), q=m.group(3), l=m.group(4), pm2=f(m.group(5)), vista=f(m.group(6)),
                      desc=f(m.group(7)), sinal=f(m.group(8)), financ=f(m.group(9)), p12=f(m.group(10)), outras=[f(v) for v in vals]))
    print(arq, 'linhas FASE no texto:', len(re.findall(r'FASE \d', t)))
print(len(L), Counter(x['tipo'] for x in L), Counter(x['fase'] for x in L))
print(Counter((x['tipo'], x['pm2']) for x in L))
print(Counter(len(x['outras']) for x in L))
q = defaultdict(list)
for x in L: q[(x['tipo'], x['q'])].append(int(x['l']))
for k in sorted(q): print(k, len(q[k]), sorted(q[k]))
dup = Counter((x['q'], x['l']) for x in L); print('dup', [k for k, v in dup.items() if v > 1])
x = L[0]; print(x)
print('sinal/vista', sorted(set(round(x['sinal']/x['vista'],4) for x in L)), 'desc', sorted(set(round(x['desc']/x['vista'],4) for x in L)))
print('m2', min(x['m2'] for x in L), max(x['m2'] for x in L), 'vista', min(x['vista'] for x in L), max(x['vista'] for x in L))
json.dump(L, open(D + 'vilafahl-tabela.json', 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
