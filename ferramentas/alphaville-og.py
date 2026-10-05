# -*- coding: utf-8 -*-
# Gera o og:image do artigo do Alphaville em PNG, 1200x630.
#
# POR QUE PNG E NAO O SVG. O og:image e a imagem que aparece quando alguem
# cola o link no WhatsApp, no Facebook ou no LinkedIn. Nenhum deles renderiza
# SVG: o link sai sem imagem nenhuma. Como o blog e compartilhado por WhatsApp,
# isso vinha custando a previa em todo compartilhamento.
#
# COMO RASTERIZA SEM INSTALAR NADA. O Edge ja esta na maquina. Em modo headless
# ele abre um HTML local de 1200x630 e salva o PNG. Nada e baixado nem instalado
# — e o mesmo motor que ja desenha a pagina.
#
# O cartao nao e o grafico cru: tem a marca, o titulo e a procedencia, que e o
# que a pessoa le na previa antes de decidir abrir. A linha do tempo entra
# embaixo, como ilustracao.
import io, os, subprocess, sys
sys.stdout.reconfigure(encoding='utf-8')

DIR = 'C:/Users/Usuario/Desktop/landing-page/blog/o-que-e-alphaville/images/'
HTML = DIR + '_og.html'
PNG = DIR + 'og.png'
EDGE = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'

# O cartao NAO leva a linha do tempo. Ela foi tentada primeiro e nao funciona
# aqui: reduzida a 1200x630 e depois a miniatura do WhatsApp, a legenda do
# grafico vira borrao. Previa de link se le de relance, entao o que entra sao
# tres numeros grandes — todos do Formulario de Referencia, e nenhum deles e o
# "23 estados", justamente o numero que o artigo mostra estar congelado.
PAGINA = '''<!doctype html>
<html lang="pt-BR"><head><meta charset="utf-8">
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  html,body{width:1200px;height:630px;overflow:hidden}
  body{background:#faf8f5;font-family:system-ui,"Segoe UI",sans-serif;
       display:flex;flex-direction:column;position:relative}
  .barra{height:12px;background:linear-gradient(90deg,#c9a227,#e0bb3d 55%,#a8841a)}
  .topo{padding:52px 64px 0;flex:1}
  .marca{font-size:18px;letter-spacing:.17em;text-transform:uppercase;color:#a8841a;font-weight:700}
  h1{font:700 68px/1.06 Georgia,"Times New Roman",serif;color:#14110f;margin:20px 0 0;max-width:17ch}
  .sub{margin-top:20px;font-size:24px;line-height:1.45;color:#5f564a;max-width:42ch}
  .fatos{display:flex;gap:56px;padding:0 64px 46px}
  .fato b{display:block;font:700 54px/1 Georgia,serif;color:#a8841a}
  .fato span{display:block;margin-top:8px;font-size:19px;color:#6b6255}
  .rodape{position:absolute;right:64px;top:58px;text-align:right}
  .rodape b{display:block;font:700 17px Georgia,serif;color:#14110f;letter-spacing:.04em}
  .rodape span{font-size:15px;color:#8a8272}
  /* longe da ultima legenda, senao "Fonte:" parece rodape do "+70 cidades" */
  .selo{position:absolute;right:64px;bottom:16px;font-size:15px;color:#8a8272;text-align:right}
</style></head>
<body>
  <div class="barra"></div>
  <div class="topo">
    <p class="marca">Imobiliária Viv&#39;América &middot; Blog</p>
    <h1>O que é Alphaville, afinal?</h1>
    <p class="sub">A história da marca levantada nos documentos que a companhia
    entrega à CVM &mdash; onde mentir é crime.</p>
  </div>
  <div class="fatos">
    <div class="fato"><b>1973</b><span>primeiro Alphaville, em Barueri</span></div>
    <div class="fato"><b>138</b><span>empreendimentos entregues</span></div>
    <div class="fato"><b>+70</b><span>cidades do país</span></div>
  </div>
  <div class="rodape"><b>CRECI 303686-F</b><span>Indaiatuba &middot; SP</span></div>
  <div class="selo">Fonte: Formulário de Referência, 30/06/2026</div>
</body></html>'''

io.open(HTML, 'w', encoding='utf-8', newline='').write(PAGINA)

if os.path.exists(PNG):
    os.remove(PNG)
subprocess.run([EDGE, '--headless=new', '--disable-gpu', '--hide-scrollbars',
                '--force-device-scale-factor=1', '--window-size=1200,630',
                '--screenshot=' + PNG, 'file:///' + HTML],
               check=True, capture_output=True, timeout=120)

if not os.path.exists(PNG):
    sys.exit('PNG nao foi gerado')
os.remove(HTML)          # o HTML e andaime, nao vai para o site
kb = os.path.getsize(PNG) / 1024
print('og.png gerado — %.0f KB' % kb)
try:
    from PIL import Image
    im = Image.open(PNG)
    print('  %dx%d, modo %s' % (im.width, im.height, im.mode))
    if (im.width, im.height) != (1200, 630):
        print('  ATENCAO: esperava 1200x630')
except ImportError:
    pass
