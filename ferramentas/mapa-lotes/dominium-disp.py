# -*- coding: utf-8 -*-
# Le o relatorio "Lotes disponiveis" (Dominium/Lugano) e devolve JSON: [{q,l,m2,tipo,vista,prazo,entrada,nx}]
import sys, re, json
sys.stdout.reconfigure(encoding='utf-8')
from pypdf import PdfReader
pdf, saida = sys.argv[1], sys.argv[2]
txt = ''.join((p.extract_text() or '') for p in PdfReader(pdf).pages)
def num(s): return float(s.replace('.', '').replace(',', '.'))
# A quadra costuma ser letra (C-018), mas o Park Gran Reserve usa numero e vem
# colado com um ponto depois do tipo (RESIDENCIAL.23-009). Aceita os dois.
rx = re.compile(r'(RESIDENCIAL|COMERCIAL|MISTO)\.?\s*([A-Z]+|\d+)-(\d+)\s*R\$\s*([\d.]+,\d\d)\s*(AV|(\d+)P)?\s*([\d.,]+)\s*M²\s*(?:À\s*(Vista|Prazo))?\s*([\d.]+,\d\d)\s*R\$\s*R\$\s*([\d.]+,\d\d)')

def area(s):
    """O mesmo sistema emite 150.00 M² num relatorio e 224,73 M² noutro."""
    return num(s) if ',' in s else float(s)
out = []
for m in rx.finditer(txt):
    tipo, q, l, vista, forma, nx, m2, modo, entrada, prazo = m.groups()
    d = {'q': q, 'l': int(l), 'm2': area(m2), 'tipo': tipo, 'vista': num(vista)}
    if nx: d.update({'nx': int(nx), 'prazo': num(prazo), 'entrada': num(entrada)})
    elif num(prazo) > 0 and num(entrada) > 0: d.update({'nx': 0, 'prazo': num(prazo), 'entrada': num(entrada)})   # forma ausente: nx preenchido depois
    out.append(d)
from collections import Counter
nxs = Counter(d['nx'] for d in out if d.get('nx'))
if nxs:
    padrao = nxs.most_common(1)[0][0]
    for d in out:
        if d.get('nx') == 0: d['nx'] = padrao; print('  nx ausente em %s-%03d: assumido %dx (o padrao do relatorio)' % (d['q'], d['l'], padrao))
json.dump(out, open(saida, 'w'), indent=0)
# "Total de Lotes: N" no rodape do relatorio e a conferencia de que nada escapou
tot = re.search(r'Total de Lotes:\s*(\d+)', txt)
if tot and int(tot.group(1)) != len(out):
    print('PAROU: o relatorio diz %s lotes e o leitor achou %d' % (tot.group(1), len(out)))
    sys.exit(1)
if not out:
    print('0 lotes — nada disponivel neste relatorio')
    sys.exit(0)
print(len(out), 'lotes;', sum(1 for d in out if 'nx' in d), 'com prazo;', 'm2 min/max %.2f/%.2f' % (min(d['m2'] for d in out), max(d['m2'] for d in out)))
print(' '.join('%s-%03d' % (d['q'], d['l']) for d in out))
