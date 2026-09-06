# -*- coding: utf-8 -*-
# Desenho clean em serie: preenche-quadras -> overlay (recorte pelo proprio desenho) -> composto Esri -> revisao 1:1.
import json, os, sys, subprocess, time
from PIL import Image, ImageChops
sys.stdout.reconfigure(encoding='utf-8')
PY = sys.executable; S = os.path.dirname(os.path.abspath(__file__)); T = os.environ['TEMP'] + '/mapas/'
os.makedirs(T + 'rev3', exist_ok=True)
for n in sys.argv[1].split(','):
    t0 = time.time(); print('=====', n, flush=True)
    c1 = json.load(open(T + n + '-solido-cfg.json', encoding='utf-8'))
    c2 = {k: c1[k] for k in ('png', 'm_por_px', 'modo', 'branco_min', 'escuro_max', 'tira_blobs', 'lote_max_m2') if k in c1}
    c2.update({'saida': '5000/' + n + '-clean.png', 'saida_ruas': n + '-ruas3.png'})
    if os.path.exists(T + n + '-quadras.json'):   # converte as posicoes de lote (pt da pagina) para pixels do render
        o0 = json.load(open(T + n + '-final-overlay-cfg.json', encoding='utf-8'))
        from PIL import Image as _I
        k = _I.open(T + c2['png']).width / o0['pw']
        Q = json.load(open(T + n + '-quadras.json'))['quadras']
        c2['pontos_lote'] = [[round(x * k), round((o0['ph'] - y) * k)] for d in Q.values() for x, y in d.values()]
    op = json.load(open(S + '/opcoes-planta.json', encoding='utf-8'))   # o que cada planta precisa de diferente
    if n in op: c2.update(op[n]); print('  opcoes proprias:', op[n], flush=True)
    if len(sys.argv) > 2 and sys.argv[2].startswith('{'): c2.update(json.loads(sys.argv[2]))
    json.dump(c2, open(T + n + '-clean-cfg.json', 'w', encoding='utf-8'), indent=1)
    r = subprocess.run([PY, S + '/preenche-quadras.py', T + n + '-clean-cfg.json'], capture_output=True, text=True, encoding='utf-8')
    print('  ' + ' | '.join(r.stdout.strip().splitlines()), r.stderr.strip()[-600:], flush=True)
    if r.returncode != 0: continue
    o = json.load(open(T + n + '-final-overlay-cfg.json', encoding='utf-8'))
    import re as _re
    _html = open('C:/Users/Usuario/Desktop/landing-page/mapa-lotes-indaiatuba/index.html', encoding='utf-8').read()
    _m = _re.search(r"\{ id:'%s',.*?bounds:\[\[([-\d.]+),([-\d.]+)\],\[([-\d.]+),([-\d.]+)\]\]" % n, _html)
    if _m and '--livre' not in sys.argv: o['bounds_fixos'] = [[float(_m.group(1)), float(_m.group(2))], [float(_m.group(3)), float(_m.group(4))]]
    o['png'] = '5000/' + n + '-clean.png'; o['res_m'] = c2.pop('res_m', 0.4); o['so_maior_bloco'] = True; o.pop('recorte_conteudo', None)
    if os.path.exists(T + n + '-quadras.json'):   # recorta pelas quadras com lote conhecido: fora a moldura e as tabelas da prancha
        o['recorte_lotes_m'] = 45; o['quadras'] = n + '-quadras.json'; o['sem_perimetro'] = True
    else: o['recorte_conteudo'] = True
    o['saida'] = T + n + '-clean-overlay.png'; o['saida_bounds'] = n + '-clean-bounds.json'; o['branco'] = 250; o['cores'] = 16
    json.dump(o, open(T + n + '-clean-overlay-cfg.json', 'w', encoding='utf-8'), indent=1)
    r = subprocess.run([PY, S + '/overlay-norte.py', T + n + '-clean-overlay-cfg.json'], capture_output=True, text=True, encoding='utf-8')
    print('  ' + ' | '.join(l for l in r.stdout.strip().splitlines() if l.startswith(('recorte', 'overlay', 'bounds'))), r.stderr.strip()[-300:], flush=True)
    subprocess.run([PY, S + '/confere-overlay.py', T + n + '-clean-overlay.png', T + n + '-clean-bounds.json', T + 'conf-' + n + '-clean.jpg', '17'], capture_output=True, text=True, encoding='utf-8')
    im = Image.open(T + n + '-clean-overlay.png').convert('RGBA'); W, H = im.size
    fundo = Image.new('RGBA', im.size, (255, 255, 255, 255)); fundo.alpha_composite(im); rgb = fundo.convert('RGB')
    rr, gg, bb = rgb.split(); verde = ImageChops.subtract(gg, rr, 1, 0).point(lambda v: 255 if v > 8 else 0); bx = verde.getbbox() or (0, 0, W, H)
    cx, cy = (bx[0] + bx[2]) // 2, (bx[1] + bx[3]) // 2
    rgb.crop((max(0, cx - 350), max(0, cy - 225), min(W, cx + 350), min(H, cy + 225))).save(T + 'rev3/' + n + '-zoom.png')
    t = rgb.copy(); t.thumbnail((1300, 1300)); t.save(T + 'rev3/' + n + '-full.jpg', quality=82)
    print('  ok em %.0fs' % (time.time() - t0), flush=True)
print('FIM')
