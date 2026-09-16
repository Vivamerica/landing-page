# -*- coding: utf-8 -*-
"""Insere o card de um empreendimento na home (index.html) e a entrada no ItemList, corrigindo numberOfItems.

Uso: python card_home.py configs/<slug>.json
Lê do config o bloco "home": {tipo, preco (int ou null), dorms, mcmv, status, constr, badge, meta, desc, alt, itemlist}
Idempotente: se o card já existir, não faz nada.
O card entra antes do primeiro card de preço maior (ou no fim da grade de cards, se preco for null).
"""
import json, re, sys
from urllib.parse import quote
sys.stdout.reconfigure(encoding='utf-8')
P = 'C:/Users/Usuario/Desktop/landing-page/index.html'
BASE = 'https://lancamentos.imoveisvivamerica.com.br/'
c = json.load(open(sys.argv[1], encoding='utf-8'))
slug, h = c['slug'], c['home']
s = open(P, encoding='utf-8', newline='').read()
crlf = '\r\n' in s
if crlf:
    s = s.replace('\r\n', '\n')
if 'href="/%s/" class="card-img-link"' % slug in s:
    print('card já existe:', slug)
    sys.exit(0)

svg = re.search(r'<svg viewBox="0 0 24 24" fill="currentColor" width="17" height="17">.*?</svg>', s, re.S).group(0)
preco = h.get('preco')
faixa = '' if preco is None else ('a' if preco <= 300000 else 'b' if preco <= 600000 else 'c')
preco_txt = ('A partir de <strong>R$ %s</strong>' % format(preco, ',').replace(',', '.')) if preco else '<strong>Consulte valores</strong>'
msg = 'Olá! Tenho interesse no %s%s. Pode me passar as condições?' % (
    c['nome'], (' (a partir de R$ %s)' % format(preco, ',').replace(',', '.')) if preco else '')
wa = 'https://wa.me/5519989769457?text=' + quote(msg, safe='')
if h['tipo'] == 'lote':   # card de lote: data-lote/data-pm2 no lugar de dorms/mcmv (padrão dos cards de condomínio)
    linha2 = 'data-lote="%s" data-status="%s" data-constr="%s" data-pm2="%s"' % (h.get('lote', 'fechado'), h.get('status', ''), h['constr'], h.get('pm2', ''))
else:
    linha2 = 'data-dorms="%s" data-mcmv="%s" data-status="%s" data-constr="%s"' % (h.get('dorms', ''), h.get('mcmv', '0'), h.get('status', ''), h['constr'])
estilo_badge = h.get('badge_estilo', 'background:#14140F;color:#D9CFC0;')
card = '''      <article class="listing-card" data-tipo="%s" data-preco="%s" data-faixa="%s"
               LINHA2>
        <a href="/%s/" class="card-img-link">
          <img src="%s/images/hero.jpg" alt="%s" loading="lazy" width="400" height="200">
        </a>
        <div class="card-body">
          <span class="card-badge" style="background:#14140F;color:#D9CFC0;">%s</span>
          <p class="card-constr">%s</p>
          <h3><a href="/%s/">%s</a></h3>
          <p class="card-meta">%s</p>
          <p class="card-desc">%s</p>
          <div class="card-price">%s</div>
          <div class="card-actions">
            <a href="/%s/" class="btn-card">Ver detalhes</a>
            <a href="%s" class="btn-card-wa" target="_blank" rel="noopener" aria-label="Falar no WhatsApp sobre o %s">
              %s
              Simular parcela
            </a>
          </div>
        </div>
      </article>

''' % (h['tipo'], preco or '', faixa,
       slug, slug, h['alt'], h['badge'], h['constr'], slug, c['nome'], h['meta'], h['desc'], preco_txt,
       slug, wa, c['nome'], svg)
card = card.replace('LINHA2', linha2).replace('style="background:#14140F;color:#D9CFC0;"', 'style="%s"' % estilo_badge)

# só entre os cards do mesmo tipo (apartamento x lote ficam em grades diferentes)
cards = [(m.start(), m.group(2)) for m in re.finditer(r'      <article class="listing-card" data-tipo="([a-z]+)" data-preco="(\d*)"', s)
         if m.group(1) == h['tipo']]
alvo = None
if preco is not None:
    for pos, p in cards:
        if p and int(p) > preco:
            alvo = pos
            break
if alvo is None:
    ultimo = cards[-1][0]
    alvo = s.index('      </article>\n', ultimo) + len('      </article>\n\n')
s = s[:alvo] + card + s[alvo:]

# ItemList: acrescenta no fim e corrige numberOfItems
itens = [int(x) for x in re.findall(r'\{"@type":"ListItem","position":(\d+),', s)]
n = max(itens) + 1
ult = '{"@type":"ListItem","position":%d,' % (n - 1)
i = s.index(ult)
fim_linha = s.index('\n', i)
linha = s[i:fim_linha]
if not linha.rstrip().endswith(','):
    s = s[:fim_linha] + ',' + s[fim_linha:]
    fim_linha += 1
nova = '\n      {"@type":"ListItem","position":%d,"name":%s,"url":"%s%s/"}' % (n, json.dumps(h['itemlist'], ensure_ascii=False), BASE, slug)
s = s[:fim_linha] + nova + s[fim_linha:]
s = re.sub(r'"numberOfItems": \d+,', '"numberOfItems": %d,' % n, s, count=1)
if crlf:
    s = s.replace('\n', '\r\n')
open(P, 'w', encoding='utf-8', newline='').write(s)
print('card e ItemList inseridos: %s (posição %d)' % (slug, n))
