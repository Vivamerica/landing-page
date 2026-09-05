# -*- coding: utf-8 -*-
# Roda o desenho limpo em serie: pdf-camadas -> render 5000 -> recolore -> overlay-norte (mesmo fit) -> composto de conferencia.
import json, os, sys, glob, subprocess, shutil
sys.stdout.reconfigure(encoding='utf-8')
PY = sys.executable; S = os.path.dirname(os.path.abspath(__file__)); T = os.environ['TEMP'] + '/mapas/'
REPO = 'C:/Users/Usuario/Desktop/landing-page'
itens = json.load(open(sys.argv[1], encoding='utf-8'))
for it in itens:
    n = it['id']; print('=====', n, flush=True)
    pdf = glob.glob(it['pdf'])[0]
    r = subprocess.run([PY, S + '/pdf-camadas.py', pdf, T + n + '-limpo.pdf', it['camadas']] + ([str(it['larg_min'])] if it.get('larg_min') else []), capture_output=True, text=True, encoding='utf-8'); print(r.stdout.strip()[-200:], r.stderr.strip()[-200:], flush=True)
    for f in glob.glob(T + '5000/' + n + '-limpo-p1.png'): os.remove(f)
    subprocess.run(['powershell', '-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', REPO + '/ferramentas/pdf2png.ps1', '-Pdf', (T + n + '-limpo.pdf').replace('/', chr(92)), '-Largura', '5000', '-Saida', (T + '5000').replace('/', chr(92))], capture_output=True)
    if not os.path.exists(T + '5000/' + n + '-limpo-p1.png'):   # o WinRT falha as vezes na 1a tentativa
        subprocess.run(['powershell', '-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', REPO + '/ferramentas/pdf2png.ps1', '-Pdf', (T + n + '-limpo.pdf').replace('/', chr(92)), '-Largura', '5000', '-Saida', (T + '5000').replace('/', chr(92))], capture_output=True)
    if not os.path.exists(T + '5000/' + n + '-limpo-p1.png'): print('  render falhou', flush=True); continue
    r = subprocess.run([PY, S + '/recolore-limpo.py', T + '5000/' + n + '-limpo-p1.png', T + '5000/' + n + '-limpa.png'] + (['--tudo-escuro'] if it.get('tudo_escuro') else []), capture_output=True, text=True, encoding='utf-8'); print(' ', r.stdout.strip()[-120:], flush=True)
    o = json.load(open(T + it['overlay_cfg'], encoding='utf-8'))
    o['png_mascara'] = o['png']; o['png'] = '5000/' + n + '-limpa.png'; o['branco'] = 245; o['cores'] = 16
    o['saida'] = T + n + '-limpo-overlay.png'; o['saida_bounds'] = n + '-limpo-bounds.json'
    json.dump(o, open(T + n + '-limpo-overlay-cfg.json', 'w', encoding='utf-8'), indent=1)
    r = subprocess.run([PY, S + '/overlay-norte.py', T + n + '-limpo-overlay-cfg.json'], capture_output=True, text=True, encoding='utf-8'); print(' ', '\n  '.join(r.stdout.strip().splitlines()[-2:]), r.stderr.strip()[-200:], flush=True)
    r = subprocess.run([PY, S + '/confere-overlay.py', T + n + '-limpo-overlay.png', T + n + '-limpo-bounds.json', T + 'conf-' + n + '-limpo.jpg', '17'], capture_output=True, text=True, encoding='utf-8'); print(' ', r.stdout.strip()[-100:], r.stderr.strip()[-100:], flush=True)
print('FIM')
