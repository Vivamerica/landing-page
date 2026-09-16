# -*- coding: utf-8 -*-
"""Insere um empreendimento em gera-folheto.js (lista APTOS ou LOTES), na posição certa pelo preço.

Uso: python registra_fonte.py APTOS "{ n:'Izzi Residence', c:'GPCI', p:371862, img:'izzi-residence-indaiatuba/images/hero.jpg', s:'...', t:'Lançamento', slug:'izzi-residence-indaiatuba' }"
Idempotente: se o slug já estiver na lista, não faz nada. p:null vai para o fim da lista.
"""
import re, sys
sys.stdout.reconfigure(encoding='utf-8')
P = 'C:/Users/Usuario/Desktop/landing-page/gera-folheto.js'
lista, entrada = sys.argv[1], sys.argv[2].strip()
if not entrada.endswith(','):
    entrada += ','
slug = re.search(r"slug:'([^']+)'", entrada).group(1)
m = re.search(r"\bp:(\d+|null)", entrada)
preco = None if m.group(1) == 'null' else int(m.group(1))
s = open(P, encoding='utf-8', newline='').read()
crlf = '\r\n' in s
if crlf:
    s = s.replace('\r\n', '\n')
ini = s.index('const %s = [' % lista)
fim = s.index('\n];', ini)
bloco = s[ini:fim]
if "slug:'%s'" % slug in bloco:
    print('já estava:', slug)
    sys.exit(0)
# itens da lista: cada um começa em "  { n:"
pos = [m.start() for m in re.finditer(r'\n  \{ n:', bloco)]
alvo = None
if preco is not None:
    for i, p0 in enumerate(pos):
        fim_item = pos[i + 1] if i + 1 < len(pos) else len(bloco)
        mp = re.search(r"\bp:(\d+|null)", bloco[p0:fim_item])
        if mp and mp.group(1) != 'null' and int(mp.group(1)) > preco:
            alvo = p0
            break
texto = '\n  ' + entrada.replace('\n', '\n    ')
if alvo is None:
    bloco = bloco + texto
else:
    bloco = bloco[:alvo] + texto + bloco[alvo:]
s = s[:ini] + bloco + s[fim:]
if crlf:
    s = s.replace('\n', '\r\n')
open(P, 'w', encoding='utf-8', newline='').write(s)
print('inserido em %s: %s (p=%s)' % (lista, slug, preco))
