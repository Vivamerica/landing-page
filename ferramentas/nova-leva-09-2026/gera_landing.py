# -*- coding: utf-8 -*-
"""Gera uma landing da nova leva a partir de configs/<slug>.json.

Reaproveita do Espaço Conceição (padrão aprovado em 09/09/2026) o bloco de fontes, estilos, camada de marca,
menu e GA4; o conteúdo vem inteiro do config. Depois de gerar, rodar o ritual (gera-relacionados injeta a
malha no marcador <!--GEN:malha-->, identidade.js confere a marca).

Uso (Python do venv, fora do scratchpad):
    python gera_landing.py configs/izzi-residence-indaiatuba.json
"""
import json, os, re, sys, html
from urllib.parse import quote

sys.stdout.reconfigure(encoding='utf-8')
RAIZ = 'C:/Users/Usuario/Desktop/landing-page/'
BASE = 'https://lancamentos.imoveisvivamerica.com.br/'
WA = 'https://wa.me/5519989769457?text='
MODELO = RAIZ + 'espaco-conceicao-indaiatuba/index.html'

e = html.escape


def wa(msg):
    return WA + quote(msg, safe='')


def bloco_modelo():
    s = open(MODELO, encoding='utf-8', newline='').read()
    ini = s.index('  <link rel="preconnect" href="https://fonts.googleapis.com">')
    fim = s.index('</head>')
    estilo = s[ini:fim]
    svg = re.search(r'<svg viewBox="0 0 24 24" fill="white".*?</svg>', s, re.S).group(0)
    # o CSS e o JS do mapa sob demanda, se existirem no modelo
    js_mapa = ''
    m = re.search(r'<script>\n// o iframe do Google só nasce no clique.*?</script>', s, re.S)
    if m:
        js_mapa = m.group(0)
    return estilo, svg, js_mapa


def jsonld(obj):
    return '  <script type="application/ld+json">\n  ' + json.dumps(obj, ensure_ascii=False, indent=2).replace('\n', '\n  ') + '\n  </script>\n'


def cards(lista, classe='g3'):
    if not lista:
        return ''
    itens = ''.join('      <div class="card"><h3>%s</h3><p>%s</p></div>\n' % (e(c['t']), e(c['p'])) for c in lista)
    return '    <div class="grid %s" style="margin-top:1.8rem;">\n%s    </div>\n' % (classe, itens)


def numeros(lista):
    if not lista:
        return ''
    itens = ''.join('      <div class="card"><span class="n">%s</span><p>%s</p></div>\n' % (e(c['n']), e(c['p'])) for c in lista)
    return '    <div class="grid g4" style="margin-top:2rem;">\n%s    </div>\n' % itens


def tabela(t):
    if not t:
        return ''
    cab = ''.join('<th%s>%s</th>' % (' class="num"' if i in t.get('num', []) else '', e(h)) for i, h in enumerate(t['cab']))
    linhas = ''
    for ln in t['linhas']:
        linhas += '          <tr>' + ''.join('<td%s>%s</td>' % (' class="num"' if i in t.get('num', []) else '', e(c)) for i, c in enumerate(ln)) + '</tr>\n'
    leg = ('        <caption style="text-align:left;padding:.4rem 0;font-size:.8rem;color:#5c5c5c;">%s</caption>\n' % e(t['legenda'])) if t.get('legenda') else ''
    return ('    <div class="tabela-wrap">\n      <table>\n%s        <thead>\n          <tr>%s</tr>\n        </thead>\n'
            '        <tbody>\n%s        </tbody>\n      </table>\n    </div>\n') % (leg, cab, linhas)


def paragrafos(lista, classe='prosa'):
    return ''.join('    <p class="%s">%s</p>\n' % (classe, e(p)) for p in (lista or []))


def bloco_mapa(m, nome):
    """Mapa do Google sob demanda: o iframe só nasce no clique (mesmo padrão do Espaço Conceição)."""
    from urllib.parse import quote
    rota = 'https://www.google.com/maps/dir/?api=1&destination=' + quote(m.get('rota', nome), safe='')
    return ('    <div class="mapa-box" data-src="%s" data-titulo="%s">\n'
            '      <button class="mapa-btn" type="button" aria-label="Carregar o mapa do %s">\n'
            '        <span class="mapa-ic" aria-hidden="true"></span>\n'
            '        <span class="mapa-t">Ver no mapa</span>\n'
            '        <span class="mapa-s">O mapa é carregado do Google apenas quando você clica.</span>\n'
            '      </button>\n    </div>\n'
            '    <p><a class="mapa-rota" href="%s" target="_blank" rel="noopener">Traçar rota até aqui &rarr;</a></p>\n'
            ) % (e(m['embed']), e('Mapa do ' + nome + ', Indaiatuba'), e(nome), e(rota))


def secao(sc, mapa=None, nome=''):
    classe = sc.get('classe', '')
    attrs = (' class="%s"' % classe if classe else '') + (' id="%s"' % sc['id'] if sc.get('id') else '')
    corpo = '    <p class="label">%s</p>\n    <h2>%s</h2>\n' % (e(sc['label']), e(sc['h2']))
    corpo += paragrafos(sc.get('paragrafos'))
    corpo += numeros(sc.get('numeros'))
    corpo += tabela(sc.get('tabela'))
    corpo += cards(sc.get('cards'))
    if sc.get('tabela2'):
        corpo += '    <h3 style="margin-top:2.2rem;">%s</h3>\n' % e(sc['tabela2_titulo'])
        corpo += paragrafos(sc.get('tabela2_paragrafos'))
        corpo += tabela(sc['tabela2'])
    if mapa and sc.get('id') == 'localizacao':
        corpo += bloco_mapa(mapa, nome)
    corpo += paragrafos(sc.get('notas'), 'nota')
    if sc.get('cta'):
        corpo += '    <p style="margin-top:1.4rem;"><a class="btn" href="%s" target="_blank" rel="noopener">%s</a></p>\n' % (wa(sc['cta']['msg']), e(sc['cta']['texto']))
    return '<section%s>\n  <div class="container">\n%s  </div>\n</section>\n\n' % (attrs, corpo)


def main(caminho_cfg):
    c = json.load(open(caminho_cfg, encoding='utf-8'))
    slug = c['slug']
    url = BASE + slug + '/'
    img = url + 'images/hero.jpg'
    estilo, svg, js_mapa = bloco_modelo()
    cat_nome, cat_url = (('Apartamentos na planta', 'apartamentos-na-planta-indaiatuba/') if c['categoria'] == 'apartamentos'
                         else ('Condomínios fechados', 'condominios-fechados-indaiatuba/'))

    # ── schema ──
    s = []
    s.append({"@context": "https://schema.org", "@type": "BreadcrumbList", "itemListElement": [
        {"@type": "ListItem", "position": 1, "name": "Início", "item": BASE},
        {"@type": "ListItem", "position": 2, "name": cat_nome, "item": BASE + cat_url},
        {"@type": "ListItem", "position": 3, "name": c['nome']}]})
    principal = {"@context": "https://schema.org", "@type": c['schema_tipo'], "name": c['nome'] + ' Indaiatuba',
                 "description": c['schema_desc'], "url": url, "image": img}
    if c.get('unidades_total'):
        principal['numberOfAccommodationUnits'] = c['unidades_total']
    if c.get('geo'):
        principal['geo'] = {"@type": "GeoCoordinates", "latitude": c['geo'][0], "longitude": c['geo'][1]}
    if c.get('mapa'):
        from urllib.parse import quote
        principal['hasMap'] = 'https://www.google.com/maps/search/?api=1&query=' + quote(c['mapa'].get('rota', c['nome']), safe='')
    principal['address'] = {"@type": "PostalAddress", "streetAddress": c['endereco_schema'],
                            "addressLocality": "Indaiatuba", "addressRegion": "SP", "addressCountry": "BR"}
    if c.get('preco_min') is not None:
        oferta = {"@type": "AggregateOffer", "availability": "https://schema.org/InStock", "priceCurrency": "BRL",
                  "lowPrice": c['preco_min'], "highPrice": c['preco_max'], "description": c['oferta_desc']}
        if c.get('offer_count'):
            oferta['offerCount'] = c['offer_count']
        oferta['offeredBy'] = {"@type": "RealEstateAgent", "name": "Imobiliária Viv'América",
                               "url": "https://imoveisvivamerica.com.br", "telephone": "+5519989769457"}
        principal['offers'] = oferta
    if c.get('lazer'):
        principal['amenityFeature'] = [{"@type": "LocationFeatureSpecification", "name": x} for x in c['lazer']]
    s.append(principal)
    if c.get('preco_min') is not None:
        s.append({"@context": "https://schema.org", "@type": "Product", "name": c['produto_nome'],
                  "description": c['produto_desc'], "image": img, "url": url,
                  "brand": {"@type": "Brand", "name": c['marca']},
                  "offers": {"@type": "Offer", "url": url, "price": c['preco_min'], "priceCurrency": "BRL",
                             "availability": "https://schema.org/InStock",
                             "seller": {"@type": "RealEstateAgent", "name": "Imobiliária Viv'América", "url": "https://imoveisvivamerica.com.br"}}})
    s.append({"@context": "https://schema.org", "@type": "FAQPage", "mainEntity": [
        {"@type": "Question", "name": q['q'], "acceptedAnswer": {"@type": "Answer", "text": q['a']}} for q in c['faq']]})
    s.append({"@context": "https://schema.org", "@type": "RealEstateAgent", "name": "Imobiliária Viv'América",
              "alternateName": "Viv'América Imóveis", "description": "Imobiliária especializada em lançamentos imobiliários em Indaiatuba/SP.",
              "url": "https://imoveisvivamerica.com.br", "telephone": "+5519989769457",
              "email": "financeiro@imoveisvivamerica.com.br",
              "address": {"@type": "PostalAddress", "addressLocality": "Indaiatuba", "addressRegion": "SP", "addressCountry": "BR"},
              "areaServed": {"@type": "City", "name": "Indaiatuba", "containedInPlace": {"@type": "State", "name": "São Paulo"}},
              "sameAs": [BASE]})
    s.append({"@context": "https://schema.org", "@type": "WebPage", "name": c['title'], "url": url, "inLanguage": "pt-BR",
              "datePublished": c['data'], "dateModified": c['data'],
              "isPartOf": {"@type": "WebSite", "name": "Lançamentos Viv'América", "url": BASE}})

    t, d = e(c['title']), e(c['description'])
    out = ['<!DOCTYPE html>\n<html lang="pt-BR">\n<head>\n  <meta charset="UTF-8">\n<script src="/atrib.js"></script>\n',
           '  <meta name="viewport" content="width=device-width, initial-scale=1.0">\n',
           '  <title>%s</title>\n  <meta name="description" content="%s">\n' % (t, d),
           '  <meta name="keywords" content="%s">\n  <meta name="robots" content="index, follow">\n' % e(c['keywords']),
           '  <meta property="og:title" content="%s">\n  <meta property="og:description" content="%s">\n' % (t, d),
           '  <meta property="og:type" content="website">\n  <meta property="og:image" content="%s">\n' % img,
           '  <meta property="og:url" content="%s">\n  <meta property="og:locale" content="pt_BR">\n' % url,
           '  <meta property="og:site_name" content="Imobiliária Viv\'América">\n  <meta name="twitter:card" content="summary_large_image">\n',
           '  <meta name="twitter:title" content="%s">\n  <meta name="twitter:description" content="%s">\n' % (t, d),
           '  <meta name="twitter:image" content="%s">\n  <link rel="canonical" href="%s">\n' % (img, url),
           '  <link rel="icon" type="image/png" href="/favicon.png">\n\n']
    out += [jsonld(o) + '\n' for o in s]
    out.append(estilo)
    out.append('</head>\n<body>\n\n')
    out.append('<a href="%s"\n   class="wa-float" target="_blank" rel="noopener" aria-label="Falar no WhatsApp">\n  %s\n</a>\n\n' % (wa(c['wa_flutuante']), svg))
    out.append('<header>\n  <div class="brand">%s<small>%s</small></div>\n' % (e(c['marca_topo'][0]), e(c['marca_topo'][1])))
    out.append('  <nav class="nav-site">\n    <a href="/apartamentos-na-planta-indaiatuba/">Apartamentos</a>\n'
               '    <a href="/loteamentos-em-indaiatuba/">Loteamentos</a>\n    <a href="/condominios-fechados-indaiatuba/">Condomínios</a>\n'
               '    <a href="/mapa-lotes-indaiatuba/">Veja no mapa</a>\n    <a href="/blog/">Blog</a>\n  </nav>\n')
    out.append('  <a href="%s"\n     class="btn-header" target="_blank" rel="noopener">Quero a tabela</a>\n</header>\n\n' % wa(c['wa_topo']))
    h = c['hero']
    out.append('<section class="hero">\n  <div class="container">\n    <p class="eyebrow">%s</p>\n' % e(h['eyebrow']))
    out.append('    <h1>%s<span>%s</span></h1>\n    <p class="lead">%s</p>\n' % (e(c['nome']), e(h['sub']), e(h['lead'])))
    out.append('    <p class="preco">%s<small>%s</small></p>\n' % (e(h['preco']), e(h['preco_nota'])))
    out.append('    <a class="btn" href="%s" target="_blank" rel="noopener">%s</a>\n  </div>\n</section>\n\n' % (wa(h['cta_msg']), e(h['cta_texto'])))

    for sc in c['secoes']:
        if not sc.get('skip'):
            out.append(secao(sc, c.get('mapa'), c['nome']))
        if sc.get('depois') == 'galeria' and c.get('galeria'):
            g = c['galeria']
            figs = ''.join('      <figure><img src="images/%s" alt="%s" width="%d" height="%d" loading="lazy"><figcaption>%s</figcaption></figure>\n'
                           % (f['arq'], e(f['alt']), f['w'], f['h'], e(f['leg'])) for f in g['itens'])
            out.append('<section>\n  <div class="container">\n    <p class="label">%s</p>\n    <h2>%s</h2>\n    <p class="prosa">%s</p>\n'
                       '    <div class="galeria">\n%s    </div>\n  </div>\n</section>\n\n' % (e(g['label']), e(g['h2']), e(g['aviso']), figs))
        if sc.get('depois') == 'lazer' and c.get('lazer_bloco'):
            lz = c['lazer_bloco']
            li = ''.join('      <li>%s</li>\n' % e(x) for x in lz['itens'])
            out.append('<section class="dark">\n  <div class="container">\n    <p class="label">Lazer</p>\n    <h2>%s</h2>\n'
                       '    <p style="max-width:60rem;color:rgba(255,255,255,.8);">%s</p>\n    <ul class="lista-lazer">\n%s    </ul>\n'
                       '%s  </div>\n</section>\n\n' % (e(lz['h2']), e(lz['intro']), li,
                                                       ('    <p style="margin-top:1.6rem;color:rgba(255,255,255,.72);font-size:.9rem;">%s</p>\n' % e(lz['nota'])) if lz.get('nota') else ''))
        if sc.get('depois') == 'ficha':
            dl = ''.join('      <div><dt>%s</dt><dd>%s</dd></div>\n' % (e(a), e(b)) for a, b in c['ficha'])
            out.append('<section class="ficha-tecnica" id="ficha-tecnica" aria-labelledby="ficha-h2">\n  <div class="container">\n'
                       '    <p class="label">Ficha técnica</p>\n    <h2 id="ficha-h2">Os números do empreendimento</h2>\n    <dl>\n%s    </dl>\n'
                       '  </div>\n</section>\n\n' % dl)

    faq = ''.join('    <details>\n      <summary>%s</summary>\n      <p>%s</p>\n    </details>\n' % (e(q['q']), e(q['a'])) for q in c['faq'])
    out.append('<section class="faq-geo">\n  <div class="container">\n    <p class="faq-label">Perguntas frequentes</p>\n'
               '    <h2 class="faq-h2">Perguntas frequentes sobre o %s</h2>\n%s  </div>\n</section>\n\n' % (e(c['nome']), faq))
    out.append('<section class="cta-section" id="contato">\n  <h2>%s</h2>\n  <p>%s</p>\n  <a class="btn" href="%s" target="_blank" rel="noopener">Falar no WhatsApp</a>\n</section>\n\n'
               % (e(c['cta']['h2']), e(c['cta']['p']), wa(c['cta']['msg'])))
    out.append('<!--GEN:malha-->\n  <!--/GEN:malha-->\n\n')
    r = c['rodape']
    out.append('<footer>\n  <p class="brand-f">%s</p>\n  <p>\n    %s<br>\n' % (e(r['marca']), e(r['linha'])))
    out.append('    %s · Comercialização: <a href="https://imoveisvivamerica.com.br" target="_blank" rel="noopener">Imobiliária Viv\'América</a> ·\n'
               '    <a href="https://wa.me/5519989769457" target="_blank" rel="noopener">(19) 98976-9457</a><br>\n' % e(r['realizacao']))
    out.append('    <a href="%s">Início</a> ·\n    <a href="/apartamentos-na-planta-indaiatuba/">Apartamentos na planta</a> ·\n'
               '    <a href="/loteamentos-em-indaiatuba/">Loteamentos</a> ·\n    <a href="/condominios-fechados-indaiatuba/">Condomínios fechados</a> ·\n'
               '    <a href="/mapa-lotes-indaiatuba/">Mapa de lotes</a> ·\n    <a href="/blog/">Blog</a>\n  </p>\n' % BASE)
    out.append('  <p style="margin-top:12px;">\n    %s\n  </p>\n' % e(r['legal']))
    out.append('<p class="nap">Imobiliária Viv\'América · CRECI 47394-J · Av. Higienópolis, 70 – Jardim União, Indaiatuba/SP · '
               '<a href="https://wa.me/5519989769457">(19) 98976-9457</a> · <a href="/sobre/">Sobre a imobiliária</a></p>\n</footer>\n\n')
    if c.get('mapa') and js_mapa:
        js = js_mapa.replace("f.title = 'Mapa do Espaço Conceição, Rua Três Marias, 254, Indaiatuba';",
                             "f.title = this.dataset.titulo || 'Mapa';")
        assert 'dataset.titulo' in js, 'script do mapa no modelo mudou'
        out.append(js + '\n\n')
    out.append('</body>\n</html>\n')
    doc = ''.join(out)
    # checagens da casa
    proibidos = ['Vista Verde', 'valoriza', 'o melhor', 'o mais completo', 'imperdível']
    for p in proibidos:
        if p.lower() in doc.lower():
            print('!! ATENÇÃO: termo proibido no texto: %r' % p)
    for bloco in re.findall(r'<script type="application/ld\+json">(.*?)</script>', doc, re.S):
        json.loads(bloco)
    pasta = RAIZ + slug + '/'
    os.makedirs(pasta + 'images', exist_ok=True)
    open(pasta + 'index.html', 'w', encoding='utf-8', newline='').write(doc)
    print('gerado %sindex.html (%d linhas) | title %d | description %d' % (pasta, doc.count('\n'), len(c['title']), len(c['description'])))


if __name__ == '__main__':
    main(sys.argv[1])
