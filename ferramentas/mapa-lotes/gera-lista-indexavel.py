# -*- coding: utf-8 -*-
# Bloco indexável do mapa de lotes: resumo acima do mapa + lista dos loteamentos,
# FAQ e JSON-LD abaixo dele, gerados a partir dos próprios BAIRROS/LOTES do arquivo.
#
# O mapa é um app Leaflet: sem este bloco, a página tem menos de 200 palavras
# visíveis ao rastreador e nenhum link de saída. Tudo aqui sai do dado que já
# está no HTML (nome, tipo, quadra, metragem, preço, data da tabela) — nenhum
# número é digitado à mão.
#
# Marcadores no HTML (o conteúdo entre eles é reescrito; o resto não se toca):
#   <!--GEN:mapa-resumo--> ... <!--/GEN:mapa-resumo-->   logo após o </main>, antes da lista (desde 15/10/2026;
#                                                          antes ficava acima do mapa e tomava espaço da tela)
#   <!--GEN:mapa-lista-->  ... <!--/GEN:mapa-lista-->    logo após o </main>
#
# Idempotente. A data "gerada em" (data-gerado, "Lista gerada em", legenda e a
# primeira resposta do FAQ) só muda quando o conteúdo da lista muda.
# O dateModified do JSON-LD é outro campo: quem manda nele é o gera-sitemap.js,
# que o alinha ao lastmod da página. Este script o grava com a data do dia só
# quando reescreve o bloco; sem mudança de conteúdo, o bloco fica como está,
# com o dateModified que o gera-sitemap.js deixou.
#
# Data da tabela de cada loteamento: campo `tab` do bairro em BAIRROS. O popup e a
# gaveta do mapa leem o mesmo campo; sem ele, cada um cai num padrão diferente
# (aqui, o comentário que abre os lotes; lá, um mês fixo). Por isso o script avisa
# quando um bairro visível está sem `tab` e os dois padrões não batem.
#
# Ritual do mapa: depois de qualquer troca em BAIRROS/LOTES (patch-mapa-bairro.py,
# dominium-atualiza.py...) rode:  python gera-lista-indexavel.py
# e depois confere-coerencia.py e checa-mapa-js.js, como sempre.
import datetime
import io
import json
import re
import sys
import urllib.parse

sys.stdout.reconfigure(encoding='utf-8')

R = 'C:/Users/Usuario/Desktop/landing-page/'
P = R + 'mapa-lotes-indaiatuba/index.html'
URL = 'https://lancamentos.imoveisvivamerica.com.br/mapa-lotes-indaiatuba/'
OG = 'https://lancamentos.imoveisvivamerica.com.br/mapa-lotes-indaiatuba/images/og.png'
WA = 'https://wa.me/5519989769457?text='
# Entidade única do site: a imobiliária e o autor entram no JSON-LD pelo @id, com
# os mesmos campos e a mesma ordem do REF_IMOB e do PESSOA do identidade.js (que não
# normaliza os nós desta página). Se mudarem lá, mudam aqui.
ID_IMOB = 'https://imoveisvivamerica.com.br/#imobiliaria'
ID_PESSOA = 'https://lancamentos.imoveisvivamerica.com.br/sobre/#fabio-correia'
REF_IMOB = {'@type': 'RealEstateAgent', '@id': ID_IMOB, 'name': "Imobiliária Viv'América"}
PESSOA = {'@type': 'Person', '@id': ID_PESSOA, 'name': 'Fabio Correia', 'jobTitle': 'Corretor de imóveis',
          'identifier': {'@type': 'PropertyValue', 'propertyID': 'CRECI', 'value': '303686-F'},
          'url': ID_PESSOA, 'image': 'https://lancamentos.imoveisvivamerica.com.br/images/fabio-correia.jpg',
          'worksFor': REF_IMOB}
FEMININO = {'Reserva Botânica'}          # o site diz "da Reserva Botânica"
MESES = {'janeiro': 'jan', 'fevereiro': 'fev', 'março': 'mar', 'marco': 'mar', 'abril': 'abr', 'maio': 'mai', 'junho': 'jun',
         'julho': 'jul', 'agosto': 'ago', 'setembro': 'set', 'outubro': 'out', 'novembro': 'nov', 'dezembro': 'dez'}

s = io.open(P, encoding='utf-8', newline='').read()
assert '\r' not in s, 'arquivo com CRLF'

# ── fonte única: nome oficial de quem tem ficha ──────────────────────
src = io.open(R + 'gera-folheto.js', encoding='utf-8', newline='').read()
i = src.index('const LOTES = ['); j = src.index('\n];', i)
NOME_OFICIAL = {}
for m in re.finditer(r"\{([^{}]*)\}", src[i:j]):
    n = re.search(r"\bn:'([^']*)'", m.group(1)); sl = re.search(r"\bslug:'([^']*)'", m.group(1))
    if n and sl:
        NOME_OFICIAL['/' + sl.group(1) + '/'] = n.group(1)

# ── BAIRROS ───────────────────────────────────────────────────────────
ib = s.index('const BAIRROS = ['); fb = s.index('\n];', ib)
bl = s[ib:fb]
bairros = []
for m in re.finditer(r"\{ id:'([^']+)'", bl):
    ini = m.start()
    nxt = re.search(r"\{ id:'", bl[ini + 5:])
    fim = ini + 5 + nxt.start() if nxt else len(bl)
    t = bl[ini:fim]
    d = {'id': m.group(1)}
    for k in ('nome', 'sub', 'landing', 'tab', 'cidade'):
        r = re.search(r"\b%s:'([^']*)'" % k, t)
        if r:
            d[k] = r.group(1)
    d['fechado'] = bool(re.search(r"\bfechado:true", t))
    d['oculto'] = bool(re.search(r"\boculto:true", t))
    d['casas'] = bool(re.search(r"\bcasas:true", t))
    bairros.append(d)
BID = {b['id']: b for b in bairros}

# ── LOTES ─────────────────────────────────────────────────────────────
LINHA = re.compile(r"^ *\{ b:'([^']+)',\s+q:'([^']+)',\s*l:'([^']+)'([^\n]*)\n", re.M)
num = lambda linha, nome: (lambda g: float(g.group(1)) if g else None)(re.search(r'\b' + nome + r':(-?[\d.]+)', linha))
lotes = {}
for m in LINHA.finditer(s):
    b, q, l, resto = m.groups()
    lotes.setdefault(b, []).append({'q': q, 'l': l, 'vista': num(resto, 'vista'), 'm2': num(resto, 'm2'), 'pm2': num(resto, 'pm2')})


# data da tabela: campo `tab` do bairro; senão, a primeira data do comentário que abre o bloco de lotes
def data_comentario(bid):
    m = re.search(r"((?: *//[^\n]*\n)+)(?= *\{ b:'%s')" % re.escape(bid), s)
    if not m:
        return None
    txt = m.group(1)
    r = re.search(r"\b(\d{2}/\d{2}/\d{4})\b|\b(jan|fev|mar|abr|mai|jun|jul|ago|set|out|nov|dez)/(\d{4})\b|\b([a-zç]+)/(\d{4})\b", txt)
    if not r:
        return None
    if r.group(1):
        return r.group(1)
    if r.group(2):
        return r.group(2) + '/' + r.group(3)
    mes = MESES.get(r.group(4))
    return (mes + '/' + r.group(5)) if mes else None


def brl0(v):
    return 'R$ ' + ('%d' % round(v)).replace(',', '.') if v < 1000 else 'R$ ' + '{:,.0f}'.format(round(v)).replace(',', '.')


def num_pt(v):
    return '{:,}'.format(int(v)).replace(',', '.')


def m2_txt(v):
    return ('%d' % v if float(v).is_integer() else ('%.2f' % v).replace('.', ',')) + ' m²'


def pm2_de(x):
    if x['vista'] is None:
        return None
    if x['pm2'] is not None:
        return x['pm2']
    return x['vista'] / x['m2'] if x['m2'] else None


def artigo(nome):
    return 'da' if nome in FEMININO else 'do'


def wa_tabela(nome, casas=False):
    if casas:
        msg = 'Olá! Quero a tabela de preços %s %s com as casas disponíveis.' % (artigo(nome), nome)
    else:
        msg = 'Olá! Quero a tabela de lotes %s %s com quadra, metragem e valor.' % (artigo(nome), nome)
    return WA + urllib.parse.quote(msg, safe='')


def esc(t):
    return t.replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;').replace('"', '&quot;')


# ── agrupa por ficha (as fases do Zarah viram uma linha) ─────────────
grupos = {}
for b in bairros:
    if b['oculto'] or b['casas']:
        continue
    chave = b.get('landing') or b['id']
    g = grupos.setdefault(chave, {'chave': chave, 'bairros': [], 'landing': b.get('landing'), 'fechado': b['fechado']})
    g['bairros'].append(b)

linhas = []
todos = []                      # (pm2, lote, bairro) de todo lote com preço
for g in grupos.values():
    bs = g['bairros']
    ls = [x for b in bs for x in lotes.get(b['id'], [])]
    com = [x for x in ls if x['vista'] is not None]
    pm2s = [(pm2_de(x), x, b) for b in bs for x in lotes.get(b['id'], []) if pm2_de(x)]
    todos += pm2s
    nome = NOME_OFICIAL.get(g['landing'] or '', None) or (bs[0]['nome'].split(' — ')[0] if len(bs) > 1 else bs[0]['nome'])
    fases = [b['nome'].split(' — ')[1] for b in bs if ' — ' in b['nome']] if len(bs) > 1 else []
    datas = []
    for b in bs:
        d = b.get('tab') or data_comentario(b['id'])
        if d and d not in datas:
            datas.append(d)
    linhas.append({
        'nome': nome, 'fases': fases, 'landing': g['landing'], 'fechado': g['fechado'], 'ids': [b['id'] for b in bs],
        'n': len(ls), 'n_preco': len(com),
        'min_pm2': min(p for p, _, _ in pm2s) if pm2s else None,
        'min_vista': min(x['vista'] for x in com) if com else None,
        'data': ' e '.join(datas) if datas else None,
    })
linhas.sort(key=lambda r: (r['min_pm2'] is None, r['min_pm2'] or 0, r['nome']))

# ── guarda: bairro visível sem `tab` ──────────────────────────────────
# O popup e a gaveta do mapa mostram `b.tab || '<mês fixo>'`; a lista usa a data
# do comentário dos lotes. Quando as duas não caem no mesmo mês, o mesmo preço
# sai com duas datas na mesma página.
ABREV = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez']


def mes_de(d):
    """'04/09/2026' -> 'set/2026'; 'out/2026' fica como está."""
    r = re.match(r'\d{2}/(\d{2})/(\d{4})$', d)
    return (ABREV[int(r.group(1)) - 1] + '/' + r.group(2)) if r else d


avisos = []
padrao_mapa = re.search(r"b\.tab \|\| '([^']+)'", s)
padrao_mapa = padrao_mapa.group(1) if padrao_mapa else None
for b in bairros:
    if b['oculto'] or b.get('tab'):
        continue
    d = data_comentario(b['id'])
    if d and (padrao_mapa is None or mes_de(d) == padrao_mapa):
        continue
    avisos.append("bairro '%s' sem `tab`: a lista mostra %s e o mapa, %s. Preencha o `tab` em BAIRROS."
                  % (b['id'], d or 'nenhuma data', ('"tabela de %s"' % padrao_mapa) if padrao_mapa else 'nenhuma data'))

# ── guarda: "N lotes disponíveis" no rótulo do bairro x lotes no arquivo ──
# O `sub` é escrito à mão e aparece no pino e no popup; quando o estoque muda e o
# rótulo fica para trás, o mapa passa a dizer dois números para o mesmo bairro.
for b in bairros:
    if b['oculto']:
        continue
    r = re.search(r'\b(\d[\d.]*) lotes? disponíve', b.get('sub') or '')
    if r and int(r.group(1).replace('.', '')) != len(lotes.get(b['id'], [])):
        avisos.append("bairro '%s': o `sub` diz %s lote(s) disponível(is) e o arquivo tem %d. Acerte o `sub` (número e data)."
                      % (b['id'], r.group(1), len(lotes.get(b['id'], []))))

n_grupos = len(linhas)
n_lotes = sum(r['n'] for r in linhas)
n_preco = sum(r['n_preco'] for r in linhas)
assert todos, 'nenhum lote com preço'
mais_barato = min(todos, key=lambda t: t[0])
mais_caro = max(todos, key=lambda t: t[0])


def link_nome(r, texto=None):
    t = esc(texto or r['nome'])
    return '<a href="%s">%s</a>' % (r['landing'], t) if r['landing'] else t


def tipo_de(b):
    """Como o próprio bairro se descreve no `sub` ('loteamento fechado · ...', 'condomínio fechado · ...').
    Loteamento fechado e condomínio fechado não são a mesma coisa: vale o que o dado diz.
    Sem essa informação no `sub`, vale a espécie do mapa (LOTEAM: loteamento fechado ou aberto)."""
    sub = (b.get('sub') or '').strip().lower()
    for t in ('loteamento fechado', 'condomínio fechado', 'loteamento aberto'):
        if sub.startswith(t):
            return t
    return 'loteamento fechado' if b['fechado'] else 'loteamento aberto'


def frase_lote(t, com_link):
    """'do <nome>, loteamento aberto: R$ 967/m² (lote de 150 m² por R$ 145.000 à vista, tabela de ...)'."""
    pm2, x, b = t
    r = next(r for r in linhas if b['id'] in r['ids'])
    tipo = tipo_de(b)
    nome = link_nome(r) if com_link else esc(r['nome'])
    return r, '%s %s, %s: %s/m² (lote de %s por %s à vista, tabela de %s)' % (
        artigo(r['nome']), nome, tipo, brl0(pm2), m2_txt(x['m2']) if x['m2'] else 'metragem na tabela', brl0(x['vista']), r['data'] or 'data na ficha')


r_barato, txt_barato = frase_lote(mais_barato, True)
r_caro, txt_caro = frase_lote(mais_caro, True)
_, faq_barato = frase_lote(mais_barato, False)
_, faq_caro = frase_lote(mais_caro, False)
casas_vis = [b for b in bairros if b['casas'] and not b['oculto']]


# ── data de geração: só avança quando o conteúdo muda ─────────────────
HOJE = datetime.date.today()
MARCA_DATA = '@@DATA@@'            # ISO; o dd/mm/aaaa sai de @@DATABR@@
MARCA_DATABR = '@@DATABR@@'

# ── bloco 1: resumo acima do mapa ─────────────────────────────────────
resumo = '''
<section class="intro" id="intro" aria-label="Resumo do mapa de lotes">
  <p class="intro-txt"><strong>Resposta direta:</strong> %s lotes à venda com preço à vista em %s loteamentos e condomínios de Indaiatuba, pelas tabelas das loteadoras (data em cada um). O menor preço por m² no mapa é o %s.</p>
</section>
''' % (num_pt(n_preco), n_grupos, txt_barato)

# ── bloco 2: lista, FAQ e JSON-LD abaixo do mapa ──────────────────────
th = ['Loteamento', 'Tipo', 'Lotes no mapa', 'R$/m² a partir de', 'Lote a partir de (à vista)', 'Tabela', 'Pedir a tabela']
trs = []
itens = []
for k, r in enumerate(linhas, 1):
    nome_cel = link_nome(r)
    if r['fases']:
        nome_cel += '<br><small>fases %s</small>' % esc(', '.join(r['fases']))
    trs.append('        <tr><td>%s</td><td>%s</td><td>%s</td><td>%s</td><td>%s</td><td>%s</td><td><a class="wa-lin" data-origem="lista" href="%s" target="_blank" rel="noopener">WhatsApp</a></td></tr>' % (
        nome_cel, 'Fechado' if r['fechado'] else 'Aberto', num_pt(r['n']),
        brl0(r['min_pm2']) if r['min_pm2'] else 'sob consulta',
        brl0(r['min_vista']) if r['min_vista'] else 'sob consulta',
        esc(r['data']) if r['data'] else '—', wa_tabela(r['nome'])))
    itens.append({'@type': 'ListItem', 'position': k, 'name': r['nome'],
                  'url': ('https://lancamentos.imoveisvivamerica.com.br' + r['landing']) if r['landing'] else (URL + '#' + r['ids'][0])})

faq = [
    ('Quantos lotes e loteamentos estão no mapa de lotes de Indaiatuba?',
     'Em %s o mapa mostra %s lotes com preço à vista em %s loteamentos e condomínios de Indaiatuba (o Parque Zarah entra com as fases Safira, Rubi e Pérola). Cada lote traz quadra, número, metragem, tipo (residencial, misto, comercial ou gleba) e o preço da tabela da loteadora.' % (MARCA_DATABR, num_pt(n_preco), n_grupos)),
    ('Qual é o lote mais barato por m² no mapa?',
     'O %s. Na outra ponta está o %s.' % (faq_barato, faq_caro)),
    ('Os preços do mapa são à vista ou a prazo?',
     'À vista, como estão nas tabelas e relatórios das loteadoras, com a data de cada tabela na lista acima. Quando a tabela informa entrada e número de parcelas, o pino do lote mostra a simulação. Os valores podem mudar sem aviso e o parcelamento é confirmado no atendimento.'),
    ('O pino mostra a posição exata do lote?',
     'Não: a posição do pino é aproximada. A quadra e o número do lote são os da tabela da loteadora e, na maioria dos loteamentos, a planta sobreposta ao mapa ajuda a localizar. A situação de cada lote é confirmada no atendimento.'),
    ('Como peço a tabela completa de um loteamento?',
     'Pelo WhatsApp (19) 98976-9457. O botão de cada loteamento na lista acima já envia o pedido com o nome do empreendimento, e a tabela chega com quadra, metragem e valor.'),
]
faq_html = '\n'.join('    <div class="faq-item"><h3>%s</h3><p>%s</p></div>' % (esc(q), esc(a)) for q, a in faq)

titulo = re.search(r'<title>([^<]*)</title>', s).group(1)
descr = re.search(r'<meta name="description" content="([^"]*)"', s).group(1)
des = lambda t: t.replace('&#x27;', "'").replace('&#39;', "'").replace('&quot;', '"').replace('&amp;', '&')
ld_pagina = {
    '@context': 'https://schema.org', '@type': 'WebPage', '@id': URL, 'url': URL,
    'name': des(titulo), 'description': des(descr), 'inLanguage': 'pt-BR', 'image': OG,
    'dateModified': MARCA_DATA,
    'author': PESSOA,
    'publisher': REF_IMOB,
}
ld_lista = {'@context': 'https://schema.org', '@type': 'ItemList', 'name': 'Loteamentos no mapa de lotes de Indaiatuba, do menor ao maior preço por m²',
            'numberOfItems': n_grupos, 'itemListOrder': 'https://schema.org/ItemListOrderAscending', 'itemListElement': itens}
ld_faq = {'@context': 'https://schema.org', '@type': 'FAQPage',
          'mainEntity': [{'@type': 'Question', 'name': q, 'acceptedAnswer': {'@type': 'Answer', 'text': a}} for q, a in faq]}
ld = lambda o: json.dumps(o, ensure_ascii=False, separators=(',', ':'))

nota_casas = ''
if casas_vis:
    b = casas_vis[0]
    nota_casas = '\n    <p class="nota">O mapa também mostra %s%s, que são casas e não lotes; por isso ficam fora da tabela.%s</p>' % (
        esc(b['nome']), (' (%s)' % esc(b['cidade'])) if b.get('cidade') else '',
        (' <a href="%s">Ficha das casas</a>.' % b['landing']) if b.get('landing') else '')

lista = '''
<section class="guia" id="lista-loteamentos" data-gerado="%s">
  <div class="guia-in">
    <p class="proc">Lista gerada em %s a partir das tabelas e relatórios das loteadoras (data na coluna Tabela) · Fabio Correia, CRECI 303686-F · Imobiliária Viv'América, CRECI 47394-J</p>
    <h2>Os loteamentos no mapa, do menor ao maior R$/m²</h2>
    <p>A coluna R$/m² traz o menor preço por m² de cada loteamento; a coluna seguinte, o lote de menor valor. Nem sempre é o mesmo lote. Os preços são à vista, pela tabela indicada em cada linha; o parcelamento aparece no pino de cada lote quando a tabela informa. Clique no nome para abrir a ficha; o botão pede a tabela completa pelo WhatsApp.</p>
    <div class="tabela-wrap">
      <table>
        <caption>%s loteamentos e condomínios, %s lotes com preço no mapa · tabelas das loteadoras, data por linha · lista gerada em %s</caption>
        <thead><tr>%s</tr></thead>
        <tbody>
%s
        </tbody>
      </table>
    </div>%s
    <h2>Perguntas frequentes sobre o mapa de lotes</h2>
%s
    <p class="links">Veja também: <a href="/loteamentos-em-indaiatuba/">Loteamentos em Indaiatuba, com preços</a> · <a href="/condominios-fechados-indaiatuba/">Condomínios fechados de lotes</a> · <a href="/precos-lancamentos-indaiatuba/">Observatório de Preços</a> · <a href="/loteamentos-e-bairros-de-indaiatuba/">Lista oficial A–Z dos loteamentos e bairros</a> · <a href="/imprensa-e-dados/">Dados abertos do Observatório (CSV e JSON)</a> · <a href="/">Todos os lançamentos de Indaiatuba</a></p>
    <p><a class="voltar" href="#mapa">Voltar ao mapa</a></p>
    <p class="nap">Imobiliária Viv'América · CRECI 47394-J · Av. Higienópolis, 70 – Jardim União, Indaiatuba/SP · <a href="https://wa.me/5519989769457">(19) 98976-9457</a> · <a href="/sobre/">Sobre a imobiliária</a> · <a href="https://imoveisvivamerica.com.br/politica-de-privacidade">Política de Privacidade</a></p>
  </div>
  <script type="application/ld+json">%s</script>
  <script type="application/ld+json">%s</script>
  <script type="application/ld+json">%s</script>
</section>
''' % (MARCA_DATA, MARCA_DATABR, n_grupos, num_pt(n_preco), MARCA_DATABR, ''.join('<th>%s</th>' % h for h in th), '\n'.join(trs), nota_casas, faq_html,
       ld(ld_pagina), ld(ld_lista), ld(ld_faq))


def entre(a, b):
    i = s.index(a); j = s.index(b, i)
    return i + len(a), j


RE_DATEMOD = re.compile(r'("dateModified"\s*:\s*")[^"]*(")')


def data_br_de(iso):
    return '%s/%s/%s' % (iso[8:10], iso[5:7], iso[0:4])


def lista_em(iso):
    """A lista de agora, carimbada com a data `iso` (AAAA-MM-DD)."""
    return lista.replace(MARCA_DATA, iso).replace(MARCA_DATABR, data_br_de(iso))


def com_marca(bloco):
    """Bloco com o dateModified trocado pelo marcador, para comparar: esse campo é
    reescrito pelo gera-sitemap.js (lastmod da página) e não conta como mudança da lista."""
    return RE_DATEMOD.sub(lambda m: m.group(1) + MARCA_DATA + m.group(2), bloco)


ia, ja = entre('<!--GEN:mapa-resumo-->', '<!--/GEN:mapa-resumo-->')
il, jl = entre('<!--GEN:mapa-lista-->', '<!--/GEN:mapa-lista-->')
gerado = re.search(r'data-gerado="(\d{4}-\d{2}-\d{2})"', s[il:jl])
iso_antigo = gerado.group(1) if gerado else None
# Compara o bloco do arquivo com a lista de agora carimbada na data ANTIGA. Trocar
# a data por marcador dentro do bloco antigo trocaria junto uma data de tabela igual
# à data de geração (tabela carregada e publicada no mesmo dia), e a lista pareceria mudada.
mudou = (not iso_antigo) or (com_marca(s[il:jl]) != com_marca(lista_em(iso_antigo))) or (s[ia:ja] != resumo)
if mudou:
    data_iso = HOJE.isoformat()
    novo = s[:ia] + resumo + s[ja:il] + lista_em(data_iso) + s[jl:]
else:
    data_iso = iso_antigo           # nada mudou: o arquivo fica intacto, com o dateModified que está lá
    novo = s
if novo != s:
    io.open(P, 'w', encoding='utf-8', newline='').write(novo)
for aviso in avisos:
    print('AVISO: ' + aviso)
print('gera-lista-indexavel: %d loteamentos, %d lotes (%d com preço), mais barato %s/m² (%s), mais caro %s/m² (%s) · data %s · %s'
      % (n_grupos, n_lotes, n_preco, brl0(mais_barato[0]), r_barato['nome'], brl0(mais_caro[0]), r_caro['nome'], data_br_de(data_iso),
         'gravado' if novo != s else 'sem mudança'))
