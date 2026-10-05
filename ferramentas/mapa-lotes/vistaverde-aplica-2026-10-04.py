# -*- coding: utf-8 -*-
# Vista Verde 04/10/2026: tira o "somente a vista" de quem tem 96x.
#
# O QUE ESTAVA ERRADO. Os cinco loteamentos da Vista Verde entraram juntos no
# mapa (commit 549488b) e levaram soVista:true em bloco. Em 21 desses lotes a
# entrada e a parcela estavam preenchidas e CORRETAS — e mesmo assim a ficha
# escrevia "Condicao: somente a vista" e escondia as 96x, porque o template faz
#     x.soVista ? 'somente a vista' : 'Entrada ... Parcelas ...'
# Na pratica o mapa pedia R$ 1,5 milhao a vista num lote que a loteadora vende
# com R$ 225.000 de entrada e 96x de R$ 20.722,37.
#
# POR QUE E SEGURO MEXER. A tabela de 04/10/2026 traz os 21 com entrada e
# parcela, e o vistaverde-2026-10-04.py refez a Price por fora: todos fecham em
# 96x a 1% a.m. com entrada de 15%. Quem e de fato so a vista (Smart City 32/4
# e Araras 15/1) tem entrada e parcela nulas e NAO e tocado aqui.
#
# FICA DE FORA: Bem-Te-Vi D 1 e 2. A aritmetica dele tambem fecha em 96x, mas o
# loteamento inteiro nao aparece na tabela de hoje — e loteamento ausente pode
# ser "nao incluido nesta tabela", nao "vendido". Sem tabela, nao se mexe.
import io, re, sys
sys.stdout.reconfigure(encoding='utf-8')

HTML = 'C:/Users/Usuario/Desktop/landing-page/mapa-lotes-indaiatuba/index.html'
ALVO = {'araras', 'andorinhas', 'canarios', 'barnabe'}   # bemtevi NAO entra

h = io.open(HTML, encoding='utf-8', newline='').read()
orig = h

REG = re.compile(r'\{[^{}]*?b:' + chr(39) + r'([a-z0-9-]+)' + chr(39) + r'[^{}]*?\}')
tocados, pulados = [], []


def arruma(m):
    s, b = m.group(0), m.group(1)
    if b not in ALVO:
        return s
    if 'soVista:true' not in s.replace(' ', ''):
        return s
    par = re.search(r'parcela:\s*([0-9.]+)', s)
    q = re.search(r'q:' + chr(39) + r'([^' + chr(39) + r']*)' + chr(39), s)
    l = re.search(r'l:' + chr(39) + r'([^' + chr(39) + r']*)' + chr(39), s)
    if not par:                       # so a vista de verdade: nao toca
        pulados.append('%s %s/%s' % (b, q.group(1), l.group(1)))
        return s
    novo = re.sub(r',?\s*soVista\s*:\s*true', '', s)       # tira a marca
    novo = re.sub(r'(parcela:\s*[0-9.]+)', r'\1, nx:96', novo, count=1)  # deixa o prazo explicito
    novo = re.sub(r',\s*,', ',', novo)                      # virgula orfa
    novo = re.sub(r',\s*\}', ' }', novo)                    # virgula antes do fecha
    tocados.append('%s %s/%s' % (b, q.group(1), l.group(1)))
    return novo


h = REG.sub(arruma, h)

print('CORRIGIDOS (passam a mostrar entrada + 96x): %d' % len(tocados))
for t in tocados:
    print('   ', t)
print()
print('INTOCADOS (so a vista de verdade, sem parcela): %d' % len(pulados))
for t in pulados:
    print('   ', t)

if h == orig:
    print('\nnada mudou — arquivo nao reescrito')
    sys.exit(0)

io.open(HTML, 'w', encoding='utf-8', newline='').write(h)
print('\narquivo reescrito (%d -> %d bytes)' % (len(orig), len(h)))

# guarda de sanidade: nenhum lote pode ficar com soVista e parcela ao mesmo tempo
restam = 0
for m in REG.finditer(h):
    s = m.group(0)
    if 'soVista:true' in s.replace(' ', '') and re.search(r'parcela:\s*[0-9.]+', s):
        restam += 1
        print('  AINDA CONTRADITORIO:', ' '.join(s.split())[:130])
print('contraditorios restantes no mapa inteiro: %d (esperado 1 = Bem-Te-Vi)' % restam)
