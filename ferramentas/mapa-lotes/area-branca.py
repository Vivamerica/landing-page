# troca a cor "area" (verde palido) por branco (transparente) nas solidas e refaz os overlays
import os, sys, json, subprocess
from PIL import Image, ImageChops
T = os.environ['TEMP'] + '/mapas/'; PY = sys.executable; S = os.path.dirname(os.path.abspath(__file__))
for n in sys.argv[1:]:
    p = T + '5000/' + n + '-solida.png'; im = Image.open(p).convert('RGB'); r, g, b = im.split()
    m = ImageChops.multiply(ImageChops.multiply(r.point(lambda v: 255 if abs(v - 232) < 3 else 0), g.point(lambda v: 255 if abs(v - 240) < 3 else 0)), b.point(lambda v: 255 if abs(v - 226) < 3 else 0))
    im.paste((255, 255, 255), (0, 0), m); im.save(p)
    rr = subprocess.run([PY, S + '/overlay-norte.py', T + n + '-solido-overlay-cfg.json'], capture_output=True, text=True, encoding='utf-8')
    print(n, 'area->branco;', rr.stdout.strip().splitlines()[-2][:90] if rr.stdout.strip() else rr.stderr[-200:], flush=True)
