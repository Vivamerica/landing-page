import json, os, sys
from PIL import Image, ImageDraw, ImageFont
Image.MAX_IMAGE_PIXELS = None
D = os.environ['TEMP'] + '/mapas/'
k = 6000 / 4008
im = Image.open(D + 'vilafahl/render.png').convert('RGB')
Q = json.load(open(D + 'vilafahl-quadras.json'))['quadras']
L = json.load(open(D + 'vilafahl/vilafahl-tabela.json', encoding='utf-8'))
x0, y0, x1, y1 = [float(v) for v in sys.argv[1:5]]
box = (int(x0*k), int((2835-y1)*k), int(x1*k), int((2835-y0)*k))
c = im.crop(box); dr = ImageDraw.Draw(c); fnt = ImageFont.truetype('arialbd.ttf', 30)
for x in L:
    p = Q.get(x['q'], {}).get(x['l'])
    if not p: continue
    X, Y = p[0]*k - box[0], (2835-p[1])*k - box[1]
    if 0 <= X < c.width and 0 <= Y < c.height:
        dr.ellipse((X-9, Y-9, X+9, Y+9), fill=(255, 0, 255))
        dr.text((X+10, Y-34), '%s%s %.0f' % (x['q'], x['l'], x['m2']), fill=(200, 0, 200), font=fnt)
esc = float(sys.argv[6])
c.resize((int(c.width*esc), int(c.height*esc))).save(D + 'vilafahl/' + sys.argv[5], quality=88)
