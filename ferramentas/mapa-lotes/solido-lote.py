# -*- coding: utf-8 -*-
# Desenho solido em serie: (opcional) limpo-lote para gerar o render so-linhas -> preenche-solido -> overlay-norte (mesmo fit)
# -> composto de conferencia. Lista JSON: [{id, circulos?, tira_blobs?, limpo?: item do limpo-lote}]
import json, os, sys, glob, subprocess, math
sys.stdout.reconfigure(encoding='utf-8')
PY = sys.executable; S = os.path.dirname(os.path.abspath(__file__)); T = os.environ['TEMP'] + '/mapas/'
REPO = 'C:/Users/Usuario/Desktop/landing-page'
from PIL import Image
for it in json.load(open(sys.argv[1], encoding='utf-8')):
    n = it['id']; print('=====', n, flush=True)
    if it.get('limpo'):
        json.dump([it['limpo']], open(T + n + '-limpo-item.json', 'w', encoding='utf-8'))
        r = subprocess.run([PY, S + '/limpo-lote.py', T + n + '-limpo-item.json'], capture_output=True, text=True, encoding='utf-8'); print('  limpo:', r.stdout.strip().splitlines()[-2:] if r.stdout.strip() else r.stderr[-200:], flush=True)
    fit = json.load(open(T + n + '-fit.json')); mpt = math.hypot(fit['E'][0], fit['N'][0])
    o = json.load(open(T + n + '-limpo-overlay-cfg.json', encoding='utf-8')); W = Image.open(T + '5000/' + n + '-limpo-p1.png').width; mpp = mpt * o['pw'] / W
    cfg = {"png": "5000/" + n + "-limpo-p1.png", "saida": "5000/" + n + "-solida.png", "saida_ruas": n + "-ruas.png", "m_por_px": mpp, "escuro_max": it.get('escuro_max', 175), "engorda_linha": it.get('engorda_linha', 3), "lote_max_m2": it.get('lote_max_m2', 2500), "area_max_m2": 60000, "passo_semente": 6}
    if it.get('circulos'): cfg['circulos'] = it['circulos']
    if it.get('tira_blobs'): cfg['tira_blobs'] = it['tira_blobs']
    json.dump(cfg, open(T + n + '-solido-cfg.json', 'w', encoding='utf-8'), indent=1)
    r = subprocess.run([PY, S + '/preenche-solido.py', T + n + '-solido-cfg.json'], capture_output=True, text=True, encoding='utf-8'); print('  ' + ' | '.join(r.stdout.strip().splitlines()[-3:]), r.stderr.strip()[-300:], flush=True)
    o['png'] = '5000/' + n + '-solida.png'; o['branco'] = 250; o['cores'] = 16; o['saida'] = T + n + '-solido-overlay.png'; o['saida_bounds'] = n + '-solido-bounds.json'
    json.dump(o, open(T + n + '-solido-overlay-cfg.json', 'w', encoding='utf-8'), indent=1)
    r = subprocess.run([PY, S + '/overlay-norte.py', T + n + '-solido-overlay-cfg.json'], capture_output=True, text=True, encoding='utf-8'); print('  ' + ' | '.join(r.stdout.strip().splitlines()[-2:]), r.stderr.strip()[-200:], flush=True)
    r = subprocess.run([PY, S + '/confere-overlay.py', T + n + '-solido-overlay.png', T + n + '-solido-bounds.json', T + 'conf-' + n + '-solido.jpg', '17'], capture_output=True, text=True, encoding='utf-8'); print('  ' + r.stdout.strip()[-80:], flush=True)
print('FIM')
