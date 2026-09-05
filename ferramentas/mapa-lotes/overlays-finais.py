# -*- coding: utf-8 -*-
# Recorta todos os overlays solidos pela vizinhanca dos lotes (uniforme) e gera os compostos de conferencia.
import json, os, sys, subprocess, time
sys.stdout.reconfigure(encoding='utf-8')
T = os.environ['TEMP'] + '/mapas/'; S = os.path.dirname(os.path.abspath(__file__)); PY = sys.executable
CFG = {'sanmarino': 'sanmarino-solido-overlay-cfg-C.json', 'araras': 'araras-solido-overlay-cfg-utm2.json', 'barnabe': 'barnabe-solido-overlay-cfg-utm.json'}
ids = sys.argv[1].split(',')
for n in ids:
    t0 = time.time(); cfg = CFG.get(n, n + '-solido-overlay-cfg.json'); o = json.load(open(T + cfg, encoding='utf-8'))
    o['recorte_lotes_m'] = 18; o['sem_perimetro'] = True; o.pop('recorte_auto', None); o.pop('recorte_preenchido', None)
    if os.path.exists(T + n + '-quadras.json'): o['quadras'] = n + '-quadras.json'
    o['saida'] = T + n + '-solido-overlay.png'; o['saida_bounds'] = n + '-solido-bounds.json'
    json.dump(o, open(T + n + '-final-overlay-cfg.json', 'w'), indent=1)
    r = subprocess.run([PY, S + '/overlay-norte.py', T + n + '-final-overlay-cfg.json'], capture_output=True, text=True, encoding='utf-8')
    print('=====', n, '|', ' | '.join(l for l in r.stdout.strip().splitlines() if l.startswith(('recorte', 'overlay', 'bounds'))), r.stderr.strip()[-200:], flush=True)
    r = subprocess.run([PY, S + '/confere-overlay.py', T + n + '-solido-overlay.png', T + n + '-solido-bounds.json', T + 'conf-' + n + '-solido.jpg', '17'], capture_output=True, text=True, encoding='utf-8')
    print('  ' + r.stdout.strip()[-70:], '%.0fs' % (time.time() - t0), flush=True)
print('FIM')
