import os
from PIL import Image, ImageDraw, ImageFilter, ImageChops, ImageOps
Image.MAX_IMAGE_PIXELS = None
T = os.environ['TEMP'] + '/mapas/'
POLI = [(8517, 4734), (8235, 4258), (7451, 2913), (6947, 1681), (5266, 224), (3922, 168), (56, 3922), (300, 4700), (8300, 5100)]
m = Image.open(T + 'pf-mascara.png').convert('L').point(lambda v: 255 if v > 127 else 0)
f = 8
p = m.resize((m.width // f, m.height // f), Image.BOX).point(lambda v: 255 if v > 60 else 0)
p = p.filter(ImageFilter.MaxFilter(45)).filter(ImageFilter.MinFilter(45))       # fecha buracos pequenos
poli_p = Image.new('L', p.size, 0)
ImageDraw.Draw(poli_p).polygon([(x / f, y / f) for x, y in POLI], fill=255)
q = ImageChops.lighter(p, ImageChops.invert(poli_p))        # fora do poligono = solido -> o lago fica cercado
bg = ImageOps.expand(ImageChops.invert(q), border=2, fill=255)   # 255 = fundo; borda garante ponto de partida
ImageDraw.floodfill(bg, (0, 0), 128)
alcancado = bg.crop((2, 2, 2 + q.width, 2 + q.height)).point(lambda v: 255 if v == 128 else 0)
cheia = ImageChops.invert(alcancado)                        # solido + buracos internos (lago)
final = ImageChops.multiply(cheia, poli_p).resize(m.size, Image.BILINEAR).point(lambda v: 255 if v > 127 else 0)
final.save(T + 'porteiraferro-mascara.png')
print('area %.0f%% da folha; bbox %s' % (sum(final.resize((300, 190)).getdata()) / (255 * 300 * 190) * 100, final.getbbox()))
Image.blend(Image.open(T + 'pf-render.jpg').convert('RGB').resize((1200, 758)), final.convert('RGB').resize((1200, 758)), 0.45).save(T + 'pf/mascara4.jpg', quality=88)
