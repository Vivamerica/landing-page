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
cxa = [1e9, -1e9]; cya = [1e9, -1e9]; MAXBB = 0; SINU = None; SUAVE = None; pontos = []
descartar = None   # modo "drop:cor|largura;..." -> mantem tudo (sem texto) menos essas combinacoes (largura '*' = qualquer)
if sys.argv[3].startswith('drop:'):
    descartar = set(x.strip() for x in sys.argv[3][5:].split(';')); por_atrib = set(); manter = set()
    for x in list(descartar):
        if x.startswith('maxbb:'): MAXBB = float(x[6:]); descartar.discard(x)
        if x.startswith('sinuoso:'): SINU = [float(v) for v in x[8:].split(',')]; descartar.discard(x)
        if x.startswith('suave:'): SUAVE = [float(v) for v in x[6:].split(',')]; descartar.discard(x)
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
pilha = []; saida = []; n_ops = 0; n_drop = 0; vistos = {}; caminho = []
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
        if op in CONSTROI and (SINU or SUAVE):   # guarda os vertices para medir o formato do caminho
            vs = [float(v) for v in operandos if hasattr(v, 'real')]
            if op == b're' and len(vs) >= 4: pontos += [(vs[0], vs[1]), (vs[0] + vs[2], vs[1] + vs[3])]
            else: pontos += [(vs[i], vs[i + 1]) for i in range(0, len(vs) - 1, 2)]
        if op in CONSTROI and MAXBB:   # acumula a caixa do caminho corrente
            xs = [float(v) for v in operandos[0::2] if hasattr(v, 'real')]; ys = [float(v) for v in operandos[1::2] if hasattr(v, 'real')]
            if op == b're' and len(operandos) >= 4:
                xs = [float(operandos[0]), float(operandos[0]) + float(operandos[2])]; ys = [float(operandos[1]), float(operandos[1]) + float(operandos[3])]
            for v in xs: cxa[0] = min(cxa[0], v); cxa[1] = max(cxa[1], v)
            for v in ys: cya[0] = min(cya[0], v); cya[1] = max(cya[1], v)
        if descartar is not None:   # caminho inteiro decidido no operador de pintura; token FILL descarta preenchimentos (rg/g/k nao sao rastreados)
            if op in CONSTROI: caminho.append((operandos, op)); continue
            if op in PINTA:
                if op in (b'W', b'W*', b'n'): saida.extend(caminho); caminho = []; pontos = []; saida.append((operandos, op)); continue   # recorte (clip): sempre fica
                combo = (cor + '|' + str(larg)) in descartar or (cor + '|*') in descartar
                if MAXBB and max(cxa[1] - cxa[0], cya[1] - cya[0]) > MAXBB: combo = True   # caminho gigante (curva de nivel)
                if SINU and len(pontos) >= SINU[0]:   # aberto, com muitos vertices, sinuoso e longo = curva de nivel
                    import math as _m
                    comp = sum(_m.dist(pontos[i], pontos[i + 1]) for i in range(len(pontos) - 1))
                    xs = [q[0] for q in pontos]; ys = [q[1] for q in pontos]
                    diag = _m.hypot(max(xs) - min(xs), max(ys) - min(ys)) or 1
                    fechado = _m.dist(pontos[0], pontos[-1]) < diag * 0.05
                    if not fechado and comp / diag > SINU[1] and comp > SINU[2]: combo = True
                if SUAVE and op in (b'S', b's') and len(pontos) >= SUAVE[0]:   # curva de nivel: so curvas suaves, sem canto
                    import math as _m
                    xs = [q[0] for q in pontos]; ys = [q[1] for q in pontos]
                    diag = _m.hypot(max(xs) - min(xs), max(ys) - min(ys))
                    angs = []
                    for i in range(len(pontos) - 2):
                        a, b_, c_ = pontos[i], pontos[i + 1], pontos[i + 2]
                        v1 = (b_[0] - a[0], b_[1] - a[1]); v2 = (c_[0] - b_[0], c_[1] - b_[1]); n1 = _m.hypot(*v1); n2 = _m.hypot(*v2)
                        if n1 > 1e-6 and n2 > 1e-6: angs.append(_m.degrees(_m.acos(max(-1, min(1, (v1[0] * v2[0] + v1[1] * v2[1]) / (n1 * n2))))))
                    if angs and diag > SUAVE[2] and sum(1 for a in angs if a < 35) / len(angs) > SUAVE[1]: combo = True
                pontos = []
                cxa = [1e9, -1e9]; cya = [1e9, -1e9]
                fill = op in (b'f', b'F', b'f*'); ambos = op in (b'B', b'B*', b'b', b'b*')
                if combo or (fill and 'FILL' in descartar): n_drop += 1 + len(caminho); caminho = []; continue
                if ambos and 'FILL' in descartar: op = b's' if op in (b'b', b'b*') else b'S'
                saida.extend(caminho); caminho = []; saida.append((operandos, op)); continue
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
