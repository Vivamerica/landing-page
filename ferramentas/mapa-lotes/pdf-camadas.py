# -*- coding: utf-8 -*-
# Gera um PDF so com as camadas (OCG) escolhidas e sem texto: base do "desenho limpo".
# Uso: pdf-camadas.py entrada.pdf saida.pdf "camada1;camada2;..."  [--listar]
# Filtra operador a operador (pypdf ContentStream): mantem estado grafico (q/Q/cm/cores/espessura) sempre; descarta
# construcao/pintura de caminhos, imagens e XObjects quando a camada MAIS INTERNA nao esta na lista; descarta todo texto.
# Mesma geometria de pagina -> o ajuste (fit) da planta original continua valendo.
import sys
sys.stdout.reconfigure(encoding='utf-8')
from pypdf import PdfReader, PdfWriter
from pypdf.generic import ContentStream, NameObject, FloatObject
LARG_MIN = float(sys.argv[4]) if len(sys.argv) > 4 and not sys.argv[4].startswith('--') else 0
ent, sai, manter = sys.argv[1], sys.argv[2], set(x.strip() for x in sys.argv[3].split(';'))
# modo por ATRIBUTO (plantas sem camadas): "attr:RG:0.0,0.0,0.0|5.0;G:0.38|4.0" -> mantem so caminhos tracados com essa cor|largura
por_atrib = None
if sys.argv[3].startswith('attr:'): por_atrib = set(x.strip() for x in sys.argv[3][5:].split(';')); manter = set()
descartar = None   # modo "drop:cor|largura;..." -> mantem tudo (sem texto) menos essas combinacoes (largura '*' = qualquer)
if sys.argv[3].startswith('drop:'): descartar = set(x.strip() for x in sys.argv[3][5:].split(';')); por_atrib = set(); manter = set()
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
cor = 'G:0.0'; larg = 1.0
def fmt(ops, op): return op.decode() + ':' + ','.join(str(round(float(x), 2)) for x in ops if isinstance(x, (int, float)) or hasattr(x, 'real'))
for operandos, op in cs.operations:
    n_ops += 1
    if por_atrib is not None or descartar is not None:
        if op in (b'RG', b'K', b'G', b'CS', b'SC', b'SCN'): cor = fmt(operandos, op)
        elif op == b'w':
            larg = round(float(operandos[0]), 3)
            if LARG_MIN and larg < LARG_MIN: operandos = [FloatObject(LARG_MIN)]   # engrossa traco fino (plantas em hairline)
        if op in TEXTO: n_drop += 1; continue
        if op == b'Do': saida.append((operandos, op)); continue   # XObjects (blocos do CAD) sempre ficam no modo atributo
        if descartar is not None:
            if (op in PINTA or op in CONSTROI) and ((cor + '|' + str(larg)) in descartar or (cor + '|*') in descartar): n_drop += 1; continue
            saida.append((operandos, op)); continue
        if (op in PINTA or op in CONSTROI) and (cor + '|' + str(larg)) not in por_atrib: n_drop += 1; continue
        saida.append((operandos, op)); continue
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
