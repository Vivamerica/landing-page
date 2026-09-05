# -*- coding: utf-8 -*-
# Gera um PDF so com as camadas (OCG) escolhidas e sem texto: base do "desenho limpo".
# Uso: pdf-camadas.py entrada.pdf saida.pdf "camada1;camada2;..."  [--listar]
# Filtra operador a operador (pypdf ContentStream): mantem estado grafico (q/Q/cm/cores/espessura) sempre; descarta
# construcao/pintura de caminhos, imagens e XObjects quando a camada MAIS INTERNA nao esta na lista; descarta todo texto.
# Mesma geometria de pagina -> o ajuste (fit) da planta original continua valendo.
import sys
sys.stdout.reconfigure(encoding='utf-8')
from pypdf import PdfReader, PdfWriter
from pypdf.generic import ContentStream, NameObject
ent, sai, manter = sys.argv[1], sys.argv[2], set(x.strip() for x in sys.argv[3].split(';'))
r = PdfReader(ent); pg = r.pages[0]
props = pg['/Resources'].get('/Properties', {})
nome = {}
for k in props:
    try: nome[str(k)] = str(props[k].get_object().get('/Name'))
    except Exception: pass
cs = ContentStream(pg.get_contents(), r)
PINTA = {b'S', b's', b'f', b'F', b'f*', b'B', b'B*', b'b', b'b*', b'n', b'W', b'W*', b'sh', b'Do', b'BI', b'ID', b'EI'}
CONSTROI = {b'm', b'l', b'c', b'v', b'y', b'h', b're'}
TEXTO = {b'Tj', b'TJ', b"'", b'"'}
pilha = []; saida = []; n_ops = 0; n_drop = 0; vistos = {}
for operandos, op in cs.operations:
    n_ops += 1
    if op == b'BDC':
        tag = str(operandos[0]) if operandos else ''
        camada = nome.get(tag) if str(operandos[0]) == '/OC' and len(operandos) > 1 and False else None
        # forma usual: /OC /ocNN BDC  -> operandos = ['/OC', '/ocNN']
        if len(operandos) >= 2 and str(operandos[0]) == '/OC': camada = nome.get(str(operandos[1]), str(operandos[1]))
        pilha.append(camada); vistos[camada] = vistos.get(camada, 0) + 1
        saida.append((operandos, op)); continue
    if op == b'BMC': pilha.append(None); saida.append((operandos, op)); continue
    if op == b'EMC':
        if pilha: pilha.pop()
        saida.append((operandos, op)); continue
    interna = next((c for c in reversed(pilha) if c is not None), None)
    mantem = interna is None or interna in manter
    if op in TEXTO: n_drop += 1; continue
    if not mantem and (op in PINTA or op in CONSTROI): n_drop += 1; continue
    saida.append((operandos, op))
cs.operations = saida
w = PdfWriter(); w.add_page(pg); p2 = w.pages[0]
p2[NameObject('/Contents')] = w._add_object(cs)
w.write(sai)
print('operadores', n_ops, 'descartados', n_drop, '-> ', sai)
if '--listar' in sys.argv: print('camadas vistas:', sorted((k or '(sem)', v) for k, v in vistos.items()))
