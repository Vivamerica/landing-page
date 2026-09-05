# -*- coding: utf-8 -*-
# Insere um bairro (linha BAIRROS) e seu bloco de lotes no mapa. Idempotente: remove qualquer bloco/linha anterior do id.
import sys, re, os
sys.stdout.reconfigure(encoding='utf-8')
bid, linha_bairro_f, lotes_f, comentario = sys.argv[1:5]
P = 'C:/Users/Usuario/Desktop/landing-page/mapa-lotes-indaiatuba/index.html'
s = open(P, encoding='utf-8', newline='').read(); assert '\r' not in s
linha_bairro = '  ' + open(linha_bairro_f, encoding='utf-8').read().strip()
lotes = ['  ' + l.strip() for l in open(lotes_f, encoding='utf-8').read().split('\n') if l.strip()]
lotes = [l if ('nx:' in l or 'soVista' in l) else l.replace(' },', ', soVista:true },') for l in lotes]
bloco = '  // ' + comentario + '\n' + '\n'.join(lotes) + '\n'
# remove tudo que for do id: linha de bairro, comentario do bloco e linhas de lote (qualquer indentacao)
s = re.sub(r"\n *\{ id:'%s'[^\n]*" % bid, '', s)
s = re.sub(r" *// [^\n]*\n(?= *\{ b:'%s')" % bid, '', s)
s = re.sub(r"(?: *\{ b:'%s'[^\n]*\n)+" % bid, '', s)
# insere a linha BAIRROS no fim do array BAIRROS e o bloco de lotes no fim do array LOTES (independe de outros bairros)
ib = s.index('const BAIRROS = ['); fb = s.index('\n];', ib); s = s[:fb] + '\n' + linha_bairro + s[fb:]
il = s.index('const LOTES = ['); fl = s.index('\n];', il); s = s[:fl + 1] + bloco + s[fl + 1:]
open(P, 'w', encoding='utf-8', newline='').write(s)
nl = len(re.findall(r"^ *\{ b:'%s'" % bid, s, re.M)); nb = len(re.findall(r"^ *\{ id:'%s'" % bid, s, re.M)); nc = len(re.findall(r"^ *// [^\n]*\n *\{ b:'%s'" % bid, s, re.M))
print('ok:', bid, len(lotes), 'lotes ->', nl, 'linhas de lote,', nb, 'linha de bairro,', nc, 'comentario no arquivo')
