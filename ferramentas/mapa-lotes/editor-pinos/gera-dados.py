# -*- coding: utf-8 -*-
# Prepara os dados do editor de pinos a partir do PROPRIO MAPA: todo lote que
# esta sem posicao (`ll`) entra na fila para ser marcado.
#
# Assim o editor serve para qualquer empreendimento pendente, nao so o que
# motivou a primeira versao. Nasceu para o Alphaville (131 lotes, ja marcados) e
# agora atende a Reserva Botanica (2 lotes).
#
# Para os bairros que tem overlay georreferenciado, manda tambem a planta e os
# bounds, para o Fabio enxergar onde clicar. Os que nao tem, ele marca sobre o
# satelite mesmo.
#
# As "sugestoes" (ima) so existem para o Alphaville, onde a deteccao de
# marcadores rodou; para os outros a lista vem vazia e o ima fica inerte.
import io, json, math, os, re, sys
sys.stdout.reconfigure(encoding='utf-8')

AQUI = os.path.dirname(os.path.abspath(__file__))
MAPA = 'C:/Users/Usuario/Desktop/landing-page/mapa-lotes-indaiatuba/index.html'
s = io.open(MAPA, encoding='utf-8', newline='').read()

# ── bairros: nome, centro e overlay ─────────────────────────────────
bairros = {}
# Nem sempre ha um bairro por linha: porteiraferro e villeprovence dividem a
# mesma. Por isso o trecho de cada um vai do seu `{ id:` ate o proximo, e nao
# ate o fim da linha — com a ancora ^ o segundo da linha some do editor.
achados = [(m.start(), m.group(1)) for m in re.finditer(r"\{ id:'([^']+)',", s)]
for i, (ini, bid) in enumerate(achados):
    fim = achados[i + 1][0] if i + 1 < len(achados) else ini + 900
    resto = s[ini:fim]
    nome = re.search(r"nome:'([^']*)'", resto)
    cen = re.search(r"centro:\[([-\d.]+),([-\d.]+)\]", resto)
    ov = re.search(r"overlay:\{ url:'([^']*)', bounds:\[\[([-\d.]+),([-\d.]+)\],\[([-\d.]+),([-\d.]+)\]\]", resto)
    bairros[bid] = {
        'id': bid,
        'nome': nome.group(1) if nome else bid,
        'centro': [float(cen.group(1)), float(cen.group(2))] if cen else None,
        'overlay': ({'url': ov.group(1),
                     'bounds': [[float(ov.group(2)), float(ov.group(3))],
                                [float(ov.group(4)), float(ov.group(5))]]} if ov else None),
    }

# ── lotes sem posicao ───────────────────────────────────────────────
pend = {}
for m in re.finditer(r"^ *\{ b:'([^']+)', q:'([^']+)', l:'([^']+)'([^\n]*)\n", s, re.M):
    bid, q, l, resto = m.groups()
    if 'll:[' in resto:
        continue
    f = lambda n: (lambda g: float(g.group(1)) if g else None)(re.search(r'\b' + n + r':([\d.]+)', resto))
    # nem todo lote tem numero puro: o Bom Sucesso usa 01-A, 01-B. Quem nao for
    # numerico entra na lista para marcacao manual, mas fica fora da
    # interpolacao — "seguir sequencia" precisa de numero para distribuir.
    pend.setdefault(bid, []).append({
        'id': '%s-%s' % (q, l), 'q': q, 'l': int(l) if l.isdigit() else None, 'lbl': l,
        'm2': f('m2') or 0, 'vista': f('vista') or f('prazo') or 0,
        'parcela': f('parcela') or 0,
    })

if not pend:
    print('nenhum lote sem posicao — nada a marcar')

sug = []
cam = AQUI + '/sugestoes-alphaville.json'
if os.path.exists(cam):
    sug = json.load(open(cam))

saida = {'bairros': [], 'sugestoes': sug}
for bid, lotes in sorted(pend.items()):
    b = bairros.get(bid, {'id': bid, 'nome': bid, 'centro': None, 'overlay': None})
    b = dict(b)
    b['lotes'] = sorted(lotes, key=lambda d: (d['q'], d['l'] if d['l'] is not None else 999))
    if not b['centro'] and b['overlay']:
        bb = b['overlay']['bounds']
        b['centro'] = [(bb[0][0] + bb[1][0]) / 2, (bb[0][1] + bb[1][1]) / 2]
    # planta ja recortada mas ainda sem georreferenciamento: entra solta no
    # editor, para o Fabio girar e posicionar
    if not b['overlay']:
        png = 'C:/Users/Usuario/Desktop/landing-page/mapa-lotes-indaiatuba/images/%s.png' % bid
        if os.path.exists(png):
            b['plantaLivre'] = '%s.png' % bid
    saida['bairros'].append(b)
    print('%-20s %3d lote(s) sem pino   %s' % (b['nome'], len(lotes),
          'com planta' if b['overlay'] else 'sem planta (marcar sobre o satelite)'))

json.dump(saida, io.open(AQUI + '/dados.json', 'w', encoding='utf-8', newline=''), ensure_ascii=False)
print('\n-> dados.json (%d bairro(s), %d sugestoes)' % (len(saida['bairros']), len(sug)))
