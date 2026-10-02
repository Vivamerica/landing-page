# -*- coding: utf-8 -*-
# Aplica ao mapa o que foi marcado no editor de pinos.
#
# O pinos.json traz dois tipos de chave:
#   "<bairro>|<quadra>-<lote>"  -> [lat, lng] do pino
#   "planta|<bairro>"           -> {centro, larg, rot, opac} da planta solta
#
# Para a planta, o editor guarda a imagem SEM girar mais o angulo; aqui o PNG e
# rotacionado de verdade e viram bounds alinhados ao norte, que e o unico
# formato que o imageOverlay do Leaflet entende.
#
# Uso: aplica-editor.py [--gravar]
import io, json, math, os, re, sys
from PIL import Image
sys.stdout.reconfigure(encoding='utf-8')

AQUI = os.path.dirname(os.path.abspath(__file__))
P = 'C:/Users/Usuario/Desktop/landing-page/mapa-lotes-indaiatuba/index.html'
IMG = 'C:/Users/Usuario/Desktop/landing-page/mapa-lotes-indaiatuba/images/'
PIN = AQUI + '/editor-pinos/pinos.json'
GRAVAR = '--gravar' in sys.argv

if not os.path.exists(PIN):
    print('nao ha pinos.json — nada salvo no editor ainda')
    sys.exit(0)
dados = json.load(io.open(PIN, encoding='utf-8'))
s = io.open(P, encoding='utf-8', newline='').read()

pinos = {k: v for k, v in dados.items() if not k.startswith('planta|')}
plantas = {k.split('|', 1)[1]: v for k, v in dados.items() if k.startswith('planta|')}
print('%d pino(s) e %d planta(s) no arquivo' % (len(pinos), len(plantas)))

# ── plantas ─────────────────────────────────────────────────────────
MLAT = 110574.0
for bid, cfg in plantas.items():
    png = IMG + bid + '.png'
    if not os.path.exists(png):
        print('  %s: sem PNG, pulando' % bid)
        continue
    im = Image.open(png).convert('RGBA')
    larg_m = cfg['larg']
    alt_m = larg_m * im.size[1] / im.size[0]
    rot = cfg['rot']
    # gira a imagem; o canvas cresce para caber os cantos
    r = im.rotate(-rot, resample=Image.BICUBIC, expand=True)
    fator = r.size[0] / im.size[0]
    larg_rot = larg_m * fator
    alt_rot = alt_m * (r.size[1] / im.size[1])
    lat, lon = cfg['centro']
    mlon = 111320.0 * math.cos(math.radians(lat))
    dlat, dlon = alt_rot / 2 / MLAT, larg_rot / 2 / mlon
    bounds = [[lat - dlat, lon - dlon], [lat + dlat, lon + dlon]]
    print('  %s: giro %+.1f°, %.0f x %.0f m -> %.0f x %.0f m depois de girar'
          % (bid, rot, larg_m, alt_m, larg_rot, alt_rot))
    print('     bounds [[%.9f,%.9f],[%.9f,%.9f]]' % (bounds[0][0], bounds[0][1], bounds[1][0], bounds[1][1]))
    if not GRAVAR:
        continue
    r.quantize(colors=255, method=Image.FASTOCTREE).save(IMG + bid + '.png', optimize=True)
    novo = ("overlay:{ url:'images/%s.png', bounds:[[%.9f,%.9f],[%.9f,%.9f]] }"
            % (bid, bounds[0][0], bounds[0][1], bounds[1][0], bounds[1][1]))
    m = re.search(r"\{ id:'%s',[^\n]*?\}," % re.escape(bid), s)
    assert m, bid
    linha = m.group(0)
    if 'overlay:{' in linha:
        nova = re.sub(r"overlay:\{[^}]*\}", novo, linha)
    else:
        nova = linha[:-2] + ', ' + novo + ' },'
    s = s.replace(linha, nova, 1)
    print('     overlay gravado')

# ── pinos ───────────────────────────────────────────────────────────
postos, ja, nao = 0, 0, []
for k, c in pinos.items():
    bid, lote = k.split('|', 1)
    q, l = lote.rsplit('-', 1)
    pad = re.compile(r"^( *\{ b:'%s', q:'%s', l:'0*%s'[^\n]*)\n" % (re.escape(bid), re.escape(q), re.escape(l)), re.M)
    m = pad.search(s)
    if not m:
        nao.append(k)
        continue
    linha = m.group(1)
    if 'll:[' in linha:
        ja += 1
        continue
    # o `ll` entra antes do primeiro campo de rodape da linha; lote so a vista
    # nao tem `tabela:true` nem `nx:`, so `soVista:true` — e ha linha que nao
    # tem nenhum dos tres, e aí o `ll` entra antes do fecha-chaves
    nova = None
    for alvo in (', tabela:true', ', soVista:true', ', nx:', ', obs:'):
        if alvo in linha:
            nova = linha.replace(alvo, ', ll:[%.6f,%.6f]%s' % (c[0], c[1], alvo), 1)
            break
    if nova is None and linha.rstrip().endswith('},'):
        corte = linha.rstrip()[:-3].rstrip()
        nova = corte + ', ll:[%.6f,%.6f] },' % (c[0], c[1])
    if not nova or nova == linha:
        nao.append(k + ' (nao achei onde encaixar)')
        continue
    s = s.replace(linha, nova, 1)
    postos += 1

print('\npinos: %d a gravar, %d ja tinham posicao' % (postos, ja))
if nao:
    print('NAO ENCONTRADOS (%d): %s' % (len(nao), ', '.join(nao[:8])))

if not GRAVAR:
    print('\n(conferencia apenas — rode com --gravar para aplicar)')
    sys.exit(0)

io.open(P, 'w', encoding='utf-8', newline='').write(s)
s2 = io.open(P, encoding='utf-8', newline='').read()
semp = len([l for l in re.findall(r"^ *\{ b:'[^']+', q:'[^\n]*\n", s2, re.M) if 'll:[' not in l])
print('gravado. lotes sem pino no mapa agora: %d' % semp)
