# -*- coding: utf-8 -*-
"""hero-leve.py: versões leves (.webp) da imagem de abertura das páginas e das miniaturas de card.

Para cada imagem de abertura e para cada JPG/PNG usado como miniatura de card, grava ao lado do
original dois arquivos: <nome>-1280.webp (largura máxima 1280) e <nome>-640.webp (largura máxima 640).
A imagem que é abertura de alguma página ganha um terceiro, <nome>-m.webp, para a tela estreita: o
recorte central do original, com a altura inteira e largura no máximo igual à altura (um quadrado,
na foto deitada; a foto inteira, na foto em pé), e altura máxima de 1080. No celular a abertura é uma
caixa mais alta que larga, coberta pela imagem a partir do centro: ali quem decide a nitidez é a
altura da imagem, e o recorte mostra a mesma região que o original mostraria, com menos pixels. (Se a
caixa for mais larga que alta, como no celular deitado de até 700 px de largura, o recorte quadrado
mostra uma faixa mais estreita da foto do que o original mostraria.)
O original nunca é apagado nem regravado: ele continua sendo o og:image, a imagem do JSON-LD e a do
material impresso. Nenhuma imagem é ampliada. Variante que já existe e é mais nova que o original
não é refeita.

Uso (Python 3 com Pillow e suporte a WebP):
    python ferramentas/hero-leve.py                    gera os .webp que faltam na raiz do site
    python ferramentas/hero-leve.py --raiz <pasta>     idem, em outra raiz
    python ferramentas/hero-leve.py --simular [raiz]   lista o que geraria e o que trocaria no HTML; não grava nada
    python ferramentas/hero-leve.py --aplicar <raiz>   reescreve o HTML das páginas de <raiz>

O que o --aplicar reescreve (só quando as variantes necessárias existem no disco):
 1. Abertura por CSS (regra de nível 0 com seletor .hero, .hero-bg, .hero-img e parecidos, com
    background: ... url(...)): a url passa a ser a do -1280.webp, com o resto da declaração como
    estava. Quando a regra põe a imagem no centro e com cover (center/cover, center center/cover,
    50% 50%/cover, ou background-position:center com background-size:cover na mesma regra), logo
    depois dela entra
        @media (max-width:700px){ <mesmo seletor>{ <mesma declaração, com o -m.webp> } }
    Com outra posição (center top, center 40%...), sem posição declarada (o padrão do CSS é o canto
    de cima, à esquerda), com valor que não dá para ler com segurança (calc, var, !important) ou
    quando outra regra da página mexe no fundo do mesmo elemento, o recorte central não mostraria a
    mesma região: a página fica sem esse bloco e usa o -1280.webp em todas as larguras. O relato
    lista essas páginas.
    Com o bloco da tela estreita e original mais largo que 1280 px entra também
        @media (min-width:1441px){ <mesmo seletor>{ <mesma declaração, com o arquivo original> } }
    porque numa tela de 1920 px o -1280.webp ficaria esticado 1,5 vez: a tela larga continua
    recebendo a mesma foto que recebia.
 2. No <head>, depois do meta viewport: <link rel="preload" as="image" fetchpriority="high"> da
    abertura. Com o bloco da tela estreita são dois, o -m.webp com media (max-width:700px) e o
    -1280.webp com media (min-width:701px); com o bloco da tela larga são três (o -1280.webp fica
    entre 701 e 1440 px e o original entra de 1441 px em diante); sem bloco é um só, o -1280.webp,
    sem media.
 3. Abertura por <img> (classe hero-img, hero-foto, hero-capa... ou filho direto de um elemento com
    essas classes): src no -1280.webp, srcset com as larguras 640 e 1280, sizes="100vw",
    fetchpriority="high", sem loading="lazy", width e height do arquivo. O preload, neste caso, é um
    link só, com imagesrcset e imagesizes iguais aos da <img>, para o navegador escolher o mesmo
    arquivo nos dois lugares.
 4. Miniaturas: <img> dentro de um link de card que leva a outra página (.card-img-link,
    .outro-card, .alt-card...) ou dentro de um card que mostra a imagem de capa de outra página
    (.featured-card): src no -640.webp, width e height do arquivo, loading="lazy" e decoding="async".
    O card em destaque (.featured-card) usa o -1280.webp: ali a caixa da foto passa de 640 px.
 5. Abertura repetida: quando a página mostra de novo, mais abaixo, a mesma imagem da abertura por
    CSS (galeria, figura), essa <img> passa a apontar para o -1280.webp, que é o arquivo que a
    abertura já baixou na tela larga. Só o src muda; sem isso o navegador baixaria também o original.

O que nunca é tocado: og:image, twitter:image, JSON-LD, as demais <img> de conteúdo (galeria, figura
de artigo), logos, tudo o que está entre <!--GEN:...--> e <!--/GEN:...--> e as páginas geradas por
inteiro (lista GERADAS): nesses lugares quem escolhe a imagem é o gerador. Arquivos que não se chamam
index.html ficam de fora.

A segunda rodada não muda nada. Página que ainda está com o bloco e o preload da tela estreita
apontando para o -640.webp passa para o formato acima na mesma rodada, sem bloco duplicado. BOM e fim
de linha de cada arquivo são preservados.
"""
import argparse
import io
import os
import posixpath
import re
import sys
from html.parser import HTMLParser

sys.stdout.reconfigure(encoding='utf-8')

DOMINIO = 'https://lancamentos.imoveisvivamerica.com.br/'
# (largura máxima, teto de tamanho em bytes) de cada variante
VARIANTES = ((1280, 120 * 1024), (640, 45 * 1024))
M_ALTURA, M_TETO = 1080, 110 * 1024   # -m.webp, só das aberturas: altura máxima e teto de tamanho
Q_MAX, Q_MIN = 82, 60          # qualidade WebP: começa em Q_MAX e não desce de Q_MIN
FRACAO = 0.85                  # a variante também não passa desta fração do peso do original
CORTE = 700                    # até esta largura de tela a abertura por CSS usa o -m.webp
LARGA = 1441                   # desta largura de tela em diante a abertura por CSS usa o original
FORA = re.compile(r'^(ferramentas|qrcode|quermesse|seo|node_modules|\.git|\.claude|folder|treinamento)(/|$)')
# páginas escritas por inteiro por um gerador: as <img> delas saem do gerador
GERADAS = {
    'apartamentos-na-planta-indaiatuba/index.html',
    'alphaville/index.html',
    'blog/index.html',
    'precos-lancamentos-indaiatuba/index.html',
    'mapa-lotes-indaiatuba/index.html',
}
ORIGINAIS = ('.jpg', '.jpeg', '.png')
RE_VARIANTE = re.compile(r'-(640|1280|m)\.webp$', re.I)
RE_FINAL = re.compile(r'(?:-(?:640|1280|m)\.webp|\.(?:jpe?g|png))$', re.I)
# último seletor composto que identifica a abertura (aceita ::before / ::after)
RE_SEL_ABERTURA = re.compile(r'(?:^|[\s>+~])[a-z]*\.hero(?:-(?:bg|img|image|media|foto|capa|banner))?(?:::?(?:before|after))?$', re.I)
CLASSES_IMG_ABERTURA = {'hero-img', 'hero-bg', 'hero-image', 'hero-media', 'hero-foto', 'hero-capa', 'hero-banner'}
SEM_VARIANTE = 'sem as variantes .webp (rode a geração antes): '
SEM_BLOCO = 'abertura sem bloco de tela estreita: '
VAZIOS = {'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'param', 'source', 'track', 'wbr'}


# ─────────────────────────── caminhos ───────────────────────────
def paginas(raiz):
    """index.html do site, em caminho relativo com barra normal."""
    out = []
    for pasta, subs, arquivos in os.walk(raiz):
        rel = os.path.relpath(pasta, raiz).replace('\\', '/')
        rel = '' if rel == '.' else rel
        subs[:] = sorted(s for s in subs if not FORA.match((rel + '/' + s).lstrip('/')))
        if 'index.html' in arquivos:
            out.append((rel + '/index.html').lstrip('/'))
    return sorted(out)


def resolver(pagina, ref):
    """Caminho (relativo à raiz) do arquivo local apontado por ref; None se for externo."""
    r = (ref or '').strip()
    if r.startswith(DOMINIO):
        r = '/' + r[len(DOMINIO):]
    elif re.match(r'^(?:[a-z][a-z0-9+.-]*:|//)', r, re.I):
        return None
    r = r.split('?')[0].split('#')[0]
    if not r:
        return None
    base = '' if r.startswith('/') else posixpath.dirname(pagina)
    alvo = posixpath.normpath(posixpath.join(base, r.lstrip('/')))
    return None if alvo.startswith('..') else alvo


def pagina_do_link(pagina, href):
    """index.html (relativo à raiz) para onde um href interno leva; None se não for página do site."""
    alvo = resolver(pagina, href)
    if alvo is None:
        return None
    if alvo == '.':
        return 'index.html'
    if posixpath.splitext(alvo)[1]:
        return alvo if alvo.endswith('index.html') else None
    return alvo + '/index.html'


def original_de(raiz, rel):
    """Original (jpg/png) de um caminho que pode ser o próprio original ou uma variante."""
    if rel is None:
        return None
    m = RE_VARIANTE.search(rel)
    if not m:
        return rel if rel.lower().endswith(ORIGINAIS) else None
    base = rel[:m.start()]
    for ext in ('.jpg', '.jpeg', '.png', '.JPG', '.JPEG', '.PNG'):
        if os.path.isfile(os.path.join(raiz, base + ext)):
            return base + ext
    return None


def ref_do_original(ref, original):
    """A referência como está escrita na página (original ou variante), apontando para o arquivo original."""
    caminho, resto = re.match(r'([^?#]*)(.*)$', ref, re.S).groups()
    return RE_FINAL.sub(lambda m: posixpath.splitext(original)[1], caminho) + resto


def variante(ref, sufixo):
    """Troca o final de uma URL ou caminho (original ou variante) pelo da variante pedida (640, 1280 ou 'm')."""
    caminho, resto = re.match(r'([^?#]*)(.*)$', ref, re.S).groups()
    return RE_FINAL.sub('-%s.webp' % sufixo, caminho) + resto


def tem_variantes(raiz, original, sufixos=None):
    """As variantes pedidas existem no disco? Sem a lista, vale para as duas larguras."""
    return all(os.path.isfile(os.path.join(raiz, variante(original, s)))
               for s in (sufixos or [w for w, _ in VARIANTES]))


_dim = {}


def dimensoes(raiz, rel):
    chave = os.path.join(raiz, rel)
    if chave not in _dim:
        from PIL import Image
        with Image.open(chave) as im:
            _dim[chave] = im.size
    return _dim[chave]


def kb(raiz, rel):
    return os.path.getsize(os.path.join(raiz, rel)) / 1024.0


# ─────────────────────────── CSS ───────────────────────────
def regras_nivel0(css):
    """(início do seletor, posição da chave que abre, posição da chave que fecha) das regras de nível 0."""
    regras, i, n, prof, ini, abre = [], 0, len(css), 0, 0, -1
    while i < n:
        c = css[i]
        if c == '/' and css.startswith('/*', i):
            j = css.find('*/', i + 2)
            i = n if j < 0 else j + 2
            continue
        if c in '"\'':
            j = i + 1
            while j < n and css[j] != c:
                j += 2 if css[j] == '\\' else 1
            i = j + 1
            continue
        if c == '{':
            if prof == 0:
                abre = i
            prof += 1
        elif c == '}':
            prof -= 1
            if prof == 0:
                regras.append((ini, abre, i))
                ini = i + 1
            elif prof < 0:
                prof, ini = 0, i + 1
        elif c == ';' and prof == 0:
            ini = i + 1
        i += 1
    return regras


RE_DECL = re.compile(r'(?<![\w-])background(?:-image)?\s*:[^;{}]*', re.I)
RE_URL = re.compile(r'url\(\s*([\'"]?)([^\'")]+)\1\s*\)', re.I)
# declarações que decidem qual imagem aparece e como ela é enquadrada
RE_FUNDO = re.compile(r'(?<![\w-])background(?:-image|-position(?:-[xy])?|-size)?\s*:', re.I)
RE_MEDIDA = r'[+-]?(?:\d+\.?\d*|\.\d+)(?:%|[a-z]+)?'
RE_TOK_POSICAO = re.compile(r'(?:left|right|top|bottom|center|%s)$' % RE_MEDIDA, re.I)
RE_TOK_TAMANHO = re.compile(r'(?:cover|contain|auto|%s)$' % RE_MEDIDA, re.I)
RE_TOK_CENTRO = re.compile(r'(?:center|50(?:\.0+)?%)$', re.I)


def partir(txt, sep):
    """Parte txt no separador, fora de parênteses e de aspas. Devolve [(início, trecho)]."""
    partes, ini, prof, i, n = [], 0, 0, 0, len(txt)
    while i < n:
        c = txt[i]
        if c in '"\'':
            j = i + 1
            while j < n and txt[j] != c:
                j += 2 if txt[j] == '\\' else 1
            i = j + 1
            continue
        if c == '(':
            prof += 1
        elif c == ')':
            prof = max(0, prof - 1)
        elif c == sep and prof == 0:
            partes.append((ini, txt[ini:i]))
            ini = i + 1
        i += 1
    partes.append((ini, txt[ini:]))
    return partes


def regras_todas(css, base=0):
    """(seletor, corpo, posição da chave que abre) das regras de estilo de qualquer nível. O que está
    em @media print fica de fora: não muda o que aparece na tela."""
    for ini, abre, fecha in regras_nivel0(css):
        sel = re.sub(r'/\*.*?\*/', '', css[ini:abre], flags=re.S).strip()
        if sel.startswith('@'):
            if re.match(r'@(?:media|supports|layer|container)\b', sel, re.I) and not re.match(r'@media\s+print\s*$', sel, re.I):
                for regra in regras_todas(css[abre + 1:fecha], base + abre + 1):
                    yield regra
        elif sel:
            yield sel, css[abre + 1:fecha], base + abre


def alvo_abertura(seletor):
    """Último seletor composto de um seletor de abertura (.hero, .hero-bg, .hero::before...), sem a tag;
    None se o seletor não for de abertura."""
    m = RE_SEL_ABERTURA.search(' ' + seletor.strip())
    return re.sub(r'^[^.]*', '', m.group(0)).replace('::', ':').lower() if m else None


def fundo_em_outra_regra(css, sel, fora=()):
    """Alguma outra regra declara background para o mesmo elemento de abertura? fora = trechos do css
    (início, fim) que não contam: a própria regra e o bloco da tela estreita que a ferramenta escreve."""
    alvos = {alvo_abertura(s) for s in sel.split(',')} - {None}
    for s, corpo, abre in regras_todas(css):
        if any(a <= abre < b for a, b in fora):
            continue
        if alvos & {alvo_abertura(x) for x in s.split(',')} and RE_FUNDO.search(corpo):
            return True
    return False


def camada_fundo(camada):
    """(posição, tamanho) escritos numa camada do atalho background; None onde não há. ValueError se a
    camada tem função (calc, var...) ou barra que não dá para ler com segurança."""
    resto = re.sub(r'url\(\s*(?:"[^"]*"|\'[^\']*\'|[^)]*)\s*\)', ' ', camada, flags=re.I)
    resto = re.sub(r'\b(?:rgba?|hsla?|hwb|lab|lch|oklab|oklch|color)\([^()]*\)', ' ', resto, flags=re.I)
    if '(' in resto or resto.count('/') > 1:
        raise ValueError(camada)
    antes, _, depois = resto.partition('/')
    pos = [t for t in antes.split() if RE_TOK_POSICAO.match(t)]
    tam = []
    for t in depois.split()[:2]:
        if not RE_TOK_TAMANHO.match(t):
            break
        tam.append(t)
    return ' '.join(pos) or None, ' '.join(tam) or None


def enquadramento(corpo, d):
    """Como a regra enquadra a imagem da declaração d (um achado de RE_DECL no corpo da regra).
    Devolve (modo, posição, tamanho, extras). modo: 'centro' (posição central e tamanho cover), 'fora'
    (outra posição ou outro tamanho, ou nada declarado) ou 'incerto' (não dá para afirmar). posição e
    tamanho: o texto declarado, None se não há. extras: as declarações background-* escritas depois do
    atalho background; o bloco da tela estreita precisa repeti-las, porque o atalho as zera."""
    limpo = re.sub(r'/\*.*?\*/', lambda m: ' ' * len(m.group(0)), corpo, flags=re.S)
    decls = []
    for ini, trecho in partir(limpo, ';'):
        prop, dois, valor = trecho.partition(':')
        if dois:
            decls.append((ini, prop.strip().lower(), valor.strip(), trecho.strip()))
    ate = [i for i, x in enumerate(decls) if x[0] <= d.start()]
    if not ate or decls[ate[-1]][1] not in ('background', 'background-image'):
        return 'incerto', None, None, []
    alvo = ate[-1]
    atalho = decls[alvo][1] == 'background'
    camadas = [c for _, c in partir(decls[alvo][2], ',')]
    k = [i for i, c in enumerate(camadas) if 'url(' in c.lower()][0]
    pos = tam = None
    incerto, extras = False, []
    for i, (_, prop, valor, bruto) in enumerate(decls):
        if atalho and i > alvo and prop.startswith('background-'):
            extras.append(bruto)
        if not RE_FUNDO.match(prop + ':') or (atalho and i < alvo):
            continue                      # o atalho zera o que foi declarado antes dele
        if '!important' in valor.lower().replace(' ', ''):
            incerto = True
        valores = [v for _, v in partir(valor, ',')]
        if prop == 'background':
            if i > alvo or (i < alvo and len(valores) != len(camadas)):
                incerto = True            # outro atalho depois da imagem, ou com outra conta de camadas
                continue
            try:
                pos, tam = camada_fundo(valores[k])
            except ValueError:
                incerto = True
        elif prop == 'background-image':
            incerto = incerto or i > alvo
        elif prop == 'background-position':
            pos = valores[k % len(valores)].strip()
        elif prop == 'background-size':
            tam = valores[k % len(valores)].strip()
        else:                             # background-position-x / background-position-y
            incerto = True
    if incerto or '(' in (pos or '') + (tam or ''):
        return 'incerto', pos, tam, extras
    eixos = (pos or '').split()
    central = 0 < len(eixos) <= 2 and all(RE_TOK_CENTRO.match(t) for t in eixos)
    # o recorte de celular guarda a altura inteira e corta só as laterais: basta a posição
    # HORIZONTAL ser o centro; a vertical ("center 65%", "center top") continua valendo igual
    if not central and len(eixos) == 2 and RE_TOK_CENTRO.match(eixos[0]):
        central = bool(re.match(r'^(?:\d+(?:\.\d+)?%|top|bottom)$', eixos[1], re.I))
    return ('centro' if central and (tam or '').lower() == 'cover' else 'fora'), pos, tam, extras


def abertura_css(raiz, pagina, css, avisos, demais=''):
    """Reescreve as regras de abertura de um bloco <style> (demais = o CSS dos outros blocos <style> da
    página). Devolve (css novo, lista de aberturas)."""
    aberturas, trocas = [], []
    for ini, abre, fecha in regras_nivel0(css):
        sel = re.sub(r'/\*.*?\*/', '', css[ini:abre], flags=re.S).strip()
        if not sel or sel.startswith('@'):
            continue
        if not any(RE_SEL_ABERTURA.search(' ' + s.strip()) for s in sel.split(',')):
            continue
        corpo = css[abre + 1:fecha]
        decls = [d for d in RE_DECL.finditer(corpo) if RE_URL.search(d.group(0))]
        if not decls:
            continue
        d = decls[-1]
        urls = RE_URL.findall(d.group(0))
        if len(urls) != 1:
            avisos.append('%s: regra %s com %d imagens na mesma declaração; deixei como está' % (pagina, sel, len(urls)))
            continue
        ref = urls[0][1]
        original = original_de(raiz, resolver(pagina, ref))
        if not original:
            continue
        # bloco da tela estreita já escrito logo depois da regra (com o -m.webp ou, no formato anterior, com o -640.webp)
        ja = re.compile(r'\s*@media\s*\(max-width:\s*%dpx\)\s*\{\s*%s\s*\{[^{}]*-(?:640|m)\.webp[^{}]*\}\s*\}' % (CORTE, re.escape(sel))).match(css, fecha + 1)
        # bloco da tela larga (com o original), que a ferramenta escreve depois do da tela estreita
        ja_larga = re.compile(r'\s*@media\s*\(min-width:\s*%dpx\)\s*\{\s*%s\s*\{[^{}]*url\([^{}]*\}\s*\}' % (LARGA, re.escape(sel))).match(css, ja.end() if ja else fecha + 1)
        modo, pos, tam, extras = enquadramento(corpo, d)
        if modo == 'centro':
            proprios = [(ini, fecha + 1)] + [(x.start(), x.end()) for x in (ja, ja_larga) if x]
            if fundo_em_outra_regra(css, sel, proprios) or fundo_em_outra_regra(demais, sel):
                modo = 'outra regra'
        central = modo == 'centro'
        if not tem_variantes(raiz, original, [1280, 'm'] if central else [1280]):
            avisos.append(SEM_VARIANTE + original)
            continue
        if not central:
            if modo == 'outra regra':
                motivo = 'outra regra da página declara background para o mesmo elemento'
            elif modo == 'incerto':
                motivo = 'posição ou tamanho que não dá para ler com segurança'
            elif not pos:
                motivo = 'a regra não declara a posição da imagem (o padrão do CSS é 0% 0%)'
            elif not all(RE_TOK_CENTRO.match(t) for t in pos.split()) or len(pos.split()) > 2:
                motivo = 'posição "%s" não é o centro' % pos
            else:
                motivo = 'tamanho %s, e não cover' % ('"%s"' % tam if tam else 'não declarado')
            avisos.append(SEM_BLOCO + '%s (%s): %s' % (pagina, sel, motivo))
        ref1280 = variante(ref, 1280)
        ref_m = variante(ref, 'm') if central else None
        fim_linha = '\r\n' if '\r\n' in css else '\n'
        recuo = re.match(r'[ \t]*', css[css.rfind('\n', 0, abre) + 1:]).group(0)
        # 1) a url da regra
        if ref != ref1280:
            p = abre + 1 + d.start() + d.group(0).index(ref)
            trocas.append((p, p + len(ref), ref1280))
        # 2) os blocos logo depois da regra, só quando a imagem está no centro, com cover: o da tela
        #    estreita (-m.webp) e, se o original é mais largo que 1280, o da tela larga (o original)
        blocos, ref_larga = '', None
        if central:
            decl_m = d.group(0).rstrip().replace(ref, ref_m)
            blocos = fim_linha + recuo + '@media (max-width:%dpx){%s{%s}}' % (CORTE, sel, ';'.join([decl_m] + extras))
            if dimensoes(raiz, original)[0] > 1280:
                ref_larga = ref_do_original(ref, original)
                decl_l = d.group(0).rstrip().replace(ref, ref_larga)
                blocos += fim_linha + recuo + '@media (min-width:%dpx){%s{%s}}' % (LARGA, sel, ';'.join([decl_l] + extras))
        fim_blocos = ja_larga.end() if ja_larga else (ja.end() if ja else fecha + 1)
        if css[fecha + 1:fim_blocos] != blocos:
            trocas.append((fecha + 1, fim_blocos, blocos))
        aberturas.append({'tipo': 'css', 'seletor': sel, 'original': original, 'ref_antes': ref,
                          'ref_m': ref_m, 'ref1280': ref1280, 'ref_larga': ref_larga})
    for a, b, txt in sorted(trocas, reverse=True):
        css = css[:a] + txt + css[b:]
    return css, aberturas


RE_STYLE = re.compile(r'(<style\b[^>]*>)(.*?)(</style>)', re.S | re.I)


def passo_css(raiz, pagina, texto, avisos):
    aberturas = []
    blocos = [(m.start(2), m.group(2)) for m in RE_STYLE.finditer(texto)]

    def troca(m):
        demais = '\n'.join(css for ini, css in blocos if ini != m.start(2))
        css, achadas = abertura_css(raiz, pagina, m.group(2), avisos, demais)
        aberturas.extend(achadas)
        return m.group(1) + css + m.group(3)

    return RE_STYLE.sub(troca, texto), aberturas


# ─────────────────────────── HTML ───────────────────────────
class Leitor(HTMLParser):
    """Lista as <img> com a posição no texto, os elementos em volta e o bloco GEN em que estão."""

    def __init__(self, texto):
        super().__init__(convert_charrefs=False)
        self.inicio_linha = [0] + [i + 1 for i, c in enumerate(texto) if c == '\n']
        self.pilha, self.gen, self.imgs = [], None, []
        self.feed(texto)
        self.close()

    def _pos(self):
        linha, coluna = self.getpos()
        return self.inicio_linha[linha - 1] + coluna

    def handle_starttag(self, tag, attrs):
        if tag == 'img':
            self.imgs.append({'ini': self._pos(), 'bruto': self.get_starttag_text(), 'attrs': dict(attrs),
                              'pilha': list(self.pilha), 'gen': self.gen})
        elif tag not in VAZIOS:
            self.pilha.append((tag, dict(attrs)))

    def handle_startendtag(self, tag, attrs):
        if tag == 'img':
            self.handle_starttag(tag, attrs)

    def handle_endtag(self, tag):
        for i in range(len(self.pilha) - 1, -1, -1):
            if self.pilha[i][0] == tag:
                del self.pilha[i:]
                break

    def handle_comment(self, data):
        m = re.match(r'\s*(/?)GEN:([\w-]+)\s*$', data)
        if m:
            self.gen = None if m.group(1) else m.group(2)


def classes(attrs):
    return (attrs.get('class') or '').split()


def por_attr(tag, nome, valor):
    """Define um atributo na tag: troca o valor se já existe, senão acrescenta antes do fecho."""
    padrao = re.compile(r'(\s%s\s*=\s*)("[^"]*"|\'[^\']*\'|[^\s>]+)' % re.escape(nome), re.I)
    if padrao.search(tag):
        return padrao.sub(lambda m: m.group(1) + '"' + valor + '"', tag, count=1)
    fecho = '/>' if tag.rstrip().endswith('/>') else '>'
    corpo = tag.rstrip()[:-len(fecho)].rstrip()
    return corpo + ' %s="%s"' % (nome, valor) + (' />' if fecho == '/>' else '>')


def tirar_attr(tag, nome):
    return re.sub(r'\s%s\s*=\s*("[^"]*"|\'[^\']*\'|[^\s>]+)' % re.escape(nome), '', tag, count=1, flags=re.I)


def eh_abertura_img(img):
    if any('logo' in c for c in classes(img['attrs'])):
        return False
    if CLASSES_IMG_ABERTURA & set(classes(img['attrs'])):
        return True
    return bool(img['pilha']) and bool(CLASSES_IMG_ABERTURA & set(classes(img['pilha'][-1][1])))


def eh_miniatura(pagina, img, original, capas):
    """Miniatura de card: a <img> está num card que leva a outra página ou mostra a capa de outra página."""
    if any('logo' in c for c in classes(img['attrs'])):
        return False
    pilha = img['pilha']
    if any(tag == 'figure' for tag, _ in pilha):
        return False
    perto = pilha[-3:]
    em_card = any('card' in c for _, a in perto for c in classes(a))
    if not em_card:
        return False
    for tag, a in reversed(pilha):
        if tag == 'a' and a.get('href'):
            destino = pagina_do_link(pagina, a['href'])
            return destino is not None and destino != pagina
    return original in capas and capas[original] != pagina


def passo_img(raiz, pagina, texto, capas, proprias, avisos):
    """Reescreve a <img> de abertura, as miniaturas e as repetições da abertura (proprias = originais da
    abertura por CSS desta página). Devolve (texto, abertura ou None, miniaturas, repetições)."""
    leitor = Leitor(texto)
    trocas, abertura, minis, repetidas = [], None, [], []
    for img in leitor.imgs:
        bruto = img['bruto']
        assert texto[img['ini']:img['ini'] + len(bruto)] == bruto, pagina + ': posição de <img> não confere'
        if img['gen'] or not img['attrs'].get('src'):
            continue
        ref = img['attrs']['src']
        original = original_de(raiz, resolver(pagina, ref))
        if not original:
            continue
        if abertura is None and eh_abertura_img(img):
            if not tem_variantes(raiz, original):
                avisos.append(SEM_VARIANTE + original)
                continue
            ref640, ref1280 = variante(ref, 640), variante(ref, 1280)
            w640 = dimensoes(raiz, variante(original, 640))[0]
            w, h = dimensoes(raiz, variante(original, 1280))
            nova = por_attr(bruto, 'src', ref1280)
            srcset = '%s %dw, %s %dw' % (ref640, w640, ref1280, w) if w > w640 else ''
            if srcset:
                nova = por_attr(por_attr(nova, 'srcset', srcset), 'sizes', '100vw')
            nova = por_attr(por_attr(nova, 'width', str(w)), 'height', str(h))
            nova = por_attr(tirar_attr(nova, 'loading'), 'fetchpriority', 'high')
            abertura = {'tipo': 'img', 'original': original, 'ref_antes': ref, 'ref640': ref640, 'ref1280': ref1280,
                        'srcset': srcset}
            if nova != bruto:
                trocas.append((img['ini'], img['ini'] + len(bruto), nova))
            continue
        if not eh_miniatura(pagina, img, original, capas):
            if original in proprias and not any('logo' in c for c in classes(img['attrs'])):
                nova = por_attr(bruto, 'src', variante(ref, 1280))
                if nova != bruto:
                    trocas.append((img['ini'], img['ini'] + len(bruto), nova))
                    repetidas.append({'original': original, 'ref_antes': ref, 'ref1280': variante(ref, 1280)})
            continue
        if not tem_variantes(raiz, original):
            avisos.append(SEM_VARIANTE + original)
            continue
        # o card em destaque ocupa meia página e a foto cobre a altura do texto ao lado: a caixa passa de 640 px
        larg = 1280 if any('featured-card' in classes(x) for _, x in img['pilha'][-3:]) else 640
        ref640 = variante(ref, larg)
        w, h = dimensoes(raiz, variante(original, larg))
        nova = por_attr(bruto, 'src', ref640)
        nova = por_attr(por_attr(nova, 'width', str(w)), 'height', str(h))
        nova = por_attr(por_attr(nova, 'loading', 'lazy'), 'decoding', 'async')
        if nova != bruto:
            trocas.append((img['ini'], img['ini'] + len(bruto), nova))
            minis.append({'original': original, 'ref_antes': ref, 'ref640': ref640, 'w': w, 'h': h})
    for a, b, txt in sorted(trocas, reverse=True):
        texto = texto[:a] + txt + texto[b:]
    return texto, abertura, minis, repetidas


# os preloads que a ferramenta escreve: os das variantes .webp e o do original na tela larga
RE_PRELOAD = re.compile(r'[ \t]*<link rel="preload" as="image" href="(?:[^"?#]*-(?:640|1280|m)\.webp(?:[?#][^"]*)?"[^>]*'
                        r'|[^"]*"[^>]*\smedia="\(min-width:\s*%dpx\)"[^>]*)>[ \t]*\r?\n' % LARGA)
RE_VIEWPORT = re.compile(r'[ \t]*<meta name="viewport"[^>]*>[ \t]*\r?\n', re.I)


def links_preload(abertura):
    if abertura['tipo'] == 'css' and not abertura['ref_m']:    # sem bloco da tela estreita: um arquivo só
        return ['<link rel="preload" as="image" href="%s" type="image/webp" fetchpriority="high">' % abertura['ref1280']]
    if abertura['tipo'] == 'css' and abertura.get('ref_larga'):   # três faixas: estreita, média e larga
        tipo = 'image/png' if re.search(r'\.png(?:[?#]|$)', abertura['ref_larga'], re.I) else 'image/jpeg'
        return ['<link rel="preload" as="image" href="%s" type="image/webp" media="(max-width:%dpx)" fetchpriority="high">' % (abertura['ref_m'], CORTE),
                '<link rel="preload" as="image" href="%s" type="image/webp" media="(min-width:%dpx) and (max-width:%dpx)" fetchpriority="high">' % (abertura['ref1280'], CORTE + 1, LARGA - 1),
                '<link rel="preload" as="image" href="%s" type="%s" media="(min-width:%dpx)" fetchpriority="high">' % (abertura['ref_larga'], tipo, LARGA)]
    if abertura['tipo'] == 'css':
        return ['<link rel="preload" as="image" href="%s" type="image/webp" media="(max-width:%dpx)" fetchpriority="high">' % (abertura['ref_m'], CORTE),
                '<link rel="preload" as="image" href="%s" type="image/webp" media="(min-width:%dpx)" fetchpriority="high">' % (abertura['ref1280'], CORTE + 1)]
    extra = ' imagesrcset="%s" imagesizes="100vw"' % abertura['srcset'] if abertura['srcset'] else ''
    return ['<link rel="preload" as="image" href="%s"%s type="image/webp" fetchpriority="high">' % (abertura['ref1280'], extra)]


def passo_preload(pagina, texto, abertura, avisos):
    fim_head = texto.lower().find('</head>')
    if fim_head < 0:
        return texto
    head, resto = texto[:fim_head], texto[fim_head:]
    limpo = RE_PRELOAD.sub('', head)
    if abertura:
        m = RE_VIEWPORT.search(limpo) or re.search(r'[ \t]*<meta charset[^>]*>[ \t]*\r?\n', limpo, re.I)
        if not m:
            avisos.append('%s: <head> sem meta viewport nem charset; preload não inserido' % pagina)
        else:
            fim_linha = '\r\n' if m.group(0).endswith('\r\n') else '\n'
            recuo = re.match(r'[ \t]*', m.group(0)).group(0)
            bloco = ''.join(recuo + l + fim_linha for l in links_preload(abertura))
            limpo = limpo[:m.end()] + bloco + limpo[m.end():]
    return limpo + resto


def reescrever(raiz, pagina, texto, capas, avisos):
    """Devolve (texto novo, linhas do relato)."""
    relato = []
    novo, aberturas = passo_css(raiz, pagina, texto, avisos)
    abertura = aberturas[0] if aberturas else None
    proprias = {a['original'] for a in aberturas}
    novo, abertura_img, minis, repetidas = passo_img(raiz, pagina, novo, capas, proprias, avisos)
    abertura = abertura or abertura_img
    novo = passo_preload(pagina, novo, abertura, avisos)
    if novo == texto:
        return texto, relato
    for a in aberturas + ([abertura_img] if abertura_img else []):
        o = a['original']
        if a['tipo'] == 'css' and not a['ref_m']:
            relato.append('abertura (CSS %s): %s -> %s em todas as larguras  [%.0f KB -> %.0f KB]' % (
                a['seletor'], a['ref_antes'], posixpath.basename(a['ref1280']), kb(raiz, o), kb(raiz, variante(o, 1280))))
            continue
        como, estreita = ('CSS %s' % a['seletor'], 'm') if a['tipo'] == 'css' else ('<img>', 640)
        relato.append('abertura (%s): %s -> %s e %s  [%.0f KB -> %.0f KB / %.0f KB]%s' % (
            como, a['ref_antes'], posixpath.basename(a['ref1280']), posixpath.basename(variante(a['ref1280'], estreita)),
            kb(raiz, o), kb(raiz, variante(o, 1280)), kb(raiz, variante(o, estreita)),
            '; de %d px de tela em diante, o original' % LARGA if a.get('ref_larga') else ''))
    if abertura:
        relato.append('preload no <head>: %d link(s)' % len(links_preload(abertura)))
    if minis:
        antes = sum(kb(raiz, m['original']) for m in minis)
        depois = sum(kb(raiz, variante(m['original'], 640)) for m in minis)
        relato.append('miniaturas: %d  [%.0f KB -> %.0f KB]' % (len(minis), antes, depois))
        for m in minis:
            relato.append('    %s -> %s  %dx%d' % (m['ref_antes'], posixpath.basename(m['ref640']), m['w'], m['h']))
    for r in repetidas:
        relato.append('abertura repetida no corpo da página: %s -> %s  [%.0f KB -> o mesmo arquivo da abertura]' % (
            r['ref_antes'], posixpath.basename(r['ref1280']), kb(raiz, r['original'])))
    if not relato:
        relato.append('ajuste de preload ou de bloco já existente')
    return novo, relato


# ─────────────────────────── o que precisa de variante ───────────────────────────
def levantar(raiz):
    """Devolve (capas, usos, lidas): capas = {original: página dona da imagem}; usos = {original: motivos};
    lidas = {página: texto}."""
    capas, usos = {}, {}

    def usa(original, motivo):
        if original and os.path.isfile(os.path.join(raiz, original)):
            usos.setdefault(original, set()).add(motivo)
            return True
        return False

    lidas = {}
    for pagina in paginas(raiz):
        with open(os.path.join(raiz, pagina), encoding='utf-8', newline='') as f:
            lidas[pagina] = f.read()
    # 1) aberturas por CSS
    for pagina, texto in lidas.items():
        for m in RE_STYLE.finditer(texto):
            css = m.group(2)
            for ini, abre, fecha in regras_nivel0(css):
                sel = re.sub(r'/\*.*?\*/', '', css[ini:abre], flags=re.S).strip()
                if not sel or sel.startswith('@') or not any(RE_SEL_ABERTURA.search(' ' + s.strip()) for s in sel.split(',')):
                    continue
                for d in RE_DECL.finditer(css[abre + 1:fecha]):
                    for _, ref in RE_URL.findall(d.group(0)):
                        original = original_de(raiz, resolver(pagina, ref))
                        if usa(original, 'abertura'):
                            capas.setdefault(original, pagina)
    # 2) campo img das listas dos geradores (capa de cada empreendimento nos cards gerados)
    for nome in sorted(os.listdir(raiz)):
        if re.match(r'gera-[\w-]+\.js$', nome):
            with open(os.path.join(raiz, nome), encoding='utf-8') as f:
                fonte = f.read()
            for m in re.finditer(r'\bimg\s*:\s*[\'"]([^\'"]+?\.(?:jpe?g|png))[\'"]', fonte, re.I):
                original = original_de(raiz, resolver('index.html', m.group(1)))
                if usa(original, 'card gerado'):
                    ini, fim = fonte.rfind('{', 0, m.start()), fonte.find('}', m.end())
                    objeto = fonte[max(ini, 0):fim if fim >= 0 else len(fonte)]
                    slug = re.search(r'\bslug\s*:\s*[\'"]([^\'"]+)[\'"]', objeto)
                    capas.setdefault(original, slug.group(1) + '/index.html' if slug else '')
    # 3) <img> de abertura e miniaturas escritas nas páginas (dentro ou fora de blocos gerados)
    for pagina, texto in lidas.items():
        for img in Leitor(texto).imgs:
            original = original_de(raiz, resolver(pagina, img['attrs'].get('src')))
            if not original:
                continue
            if eh_abertura_img(img):
                if usa(original, 'abertura'):
                    capas.setdefault(original, pagina)
            elif eh_miniatura(pagina, img, original, capas):
                usa(original, 'miniatura')
    disputa = {}
    for original in usos:
        disputa.setdefault(variante(original, 1280).lower(), set()).add(original)
    choques = sorted(sorted(v) for v in disputa.values() if len(v) > 1)
    if choques:
        sys.exit('hero-leve: originais diferentes dariam a mesma variante .webp (renomeie um deles): '
                 + '; '.join(' x '.join(c) for c in choques))
    return capas, usos, lidas


# ─────────────────────────── geração dos .webp ───────────────────────────
def abrir_rgb(caminho):
    from PIL import Image, ImageOps
    im = Image.open(caminho)
    im.load()
    im = ImageOps.exif_transpose(im)
    icc = im.info.get('icc_profile')
    if im.mode in ('P', 'LA', 'PA') or (im.mode == 'L' and 'transparency' in im.info):
        im = im.convert('RGBA')
    elif im.mode not in ('RGB', 'RGBA'):
        im = im.convert('RGB')
    if icc:
        try:   # cores em sRGB, para o arquivo não depender de perfil embutido
            from PIL import ImageCms
            im = ImageCms.profileToProfile(im, ImageCms.ImageCmsProfile(io.BytesIO(icc)),
                                           ImageCms.createProfile('sRGB'), outputMode=im.mode)
            icc = None
        except Exception:
            pass
    return im, icc


def codificar(im, icc, q):
    buf = io.BytesIO()
    extra = {'icc_profile': icc} if icc else {}
    im.save(buf, 'WEBP', quality=q, method=6, **extra)
    return buf.getvalue()


def variantes_de(motivos):
    """(sufixo, teto) das variantes de um original: as duas larguras e, se ele é abertura de alguma página, o -m."""
    return VARIANTES + ((('m', M_TETO),) if 'abertura' in motivos else ())


def reduzir(im, sufixo):
    """A imagem no tamanho da variante, sem ampliar. 640 e 1280: largura máxima. 'm': recorte central
    com a altura inteira e largura no máximo igual à altura, reduzido até a altura máxima."""
    from PIL import Image
    W, H = im.size
    if sufixo == 'm':
        lado = min(W, H)
        esq = (W - lado) // 2
        if lado < W:
            im = im.crop((esq, 0, esq + lado, H))
        h = min(H, M_ALTURA)
        w = max(1, round(lado * h / H))
    else:
        w = min(W, sufixo)
        h = max(1, round(H * w / W))
    return im if (w, h) == im.size else im.resize((w, h), Image.LANCZOS)


def gerar_variante(im, icc, sufixo, teto):
    """Devolve (bytes, (w, h), qualidade). Nunca amplia; baixa a qualidade até caber no teto, sem passar de Q_MIN."""
    red = reduzir(im, sufixo)
    w, h = red.size
    dados = codificar(red, icc, Q_MAX)
    if len(dados) <= teto:
        return dados, (w, h), Q_MAX
    melhor, lo, hi = None, Q_MIN, Q_MAX - 1
    while lo <= hi:                      # maior qualidade que cabe no teto
        q = (lo + hi) // 2
        d = codificar(red, icc, q)
        if len(d) <= teto:
            melhor, lo = (d, q), q + 1
        else:
            hi = q - 1
    if melhor:
        return melhor[0], (w, h), melhor[1]
    return codificar(red, icc, Q_MIN), (w, h), Q_MIN


def gerar(raiz, simular=False):
    capas, usos, _ = levantar(raiz)
    feitos = pulados = 0
    antes = depois = 0.0
    acima = []
    for original in sorted(usos):
        origem = os.path.join(raiz, original)
        faltam = []
        for largura, teto in variantes_de(usos[original]):
            destino = os.path.join(raiz, variante(original, largura))
            if os.path.isfile(destino) and os.path.getmtime(destino) >= os.path.getmtime(origem):
                pulados += 1
            else:
                faltam.append((largura, teto, destino))
        if not faltam:
            continue
        if simular:
            print('  geraria %s  (%s)' % (', '.join(posixpath.basename(variante(original, l)) for l, _, _ in faltam), original))
            feitos += len(faltam)
            continue
        im, icc = abrir_rgb(origem)
        partes = []
        for largura, teto, destino in faltam:
            dados, (w, h), q = gerar_variante(im, icc, largura, min(teto, int(FRACAO * os.path.getsize(origem))))
            with open(destino, 'wb') as f:
                f.write(dados)
            feitos += 1
            depois += len(dados) / 1024.0
            partes.append('-%s.webp %dx%d q%d %.0f KB' % (largura, w, h, q, len(dados) / 1024.0))
            if len(dados) > teto:
                acima.append('%s (%.0f KB, teto %.0f KB, qualidade mínima %d)' % (variante(original, largura), len(dados) / 1024.0, teto / 1024.0, Q_MIN))
            if len(dados) >= os.path.getsize(origem):
                acima.append('%s ficou do tamanho do original ou maior (%.0f KB)' % (variante(original, largura), len(dados) / 1024.0))
        antes += kb(raiz, original)
        print('  %s  %dx%d %.0f KB  [%s]  ->  %s' % (original, im.size[0], im.size[1], kb(raiz, original),
                                                     ', '.join(sorted(usos[original])), ' · '.join(partes)))
    verbo = 'a gerar' if simular else 'gerados'
    print('variantes: %d %s, %d já estavam em dia (%d originais em uso)' % (feitos, verbo, pulados, len(usos)))
    if feitos and not simular:
        print('  originais tratados: %.0f KB; variantes gravadas: %.0f KB' % (antes, depois))
    for a in acima:
        print('  fora do alvo: ' + a)
    return feitos


# ─────────────────────────── aplicação no HTML ───────────────────────────
def aplicar(raiz, simular=False):
    capas, _, lidas = levantar(raiz)
    avisos, mudadas = [], 0
    for pagina in sorted(lidas):
        if pagina in GERADAS:
            continue
        texto = lidas[pagina]
        novo, relato = reescrever(raiz, pagina, texto, capas, avisos)
        if novo == texto:
            continue
        mudadas += 1
        print(pagina)
        for linha in relato:
            print('  ' + linha)
        if not simular:
            with open(os.path.join(raiz, pagina), 'w', encoding='utf-8', newline='') as f:
                f.write(novo)
    print('páginas: %d %s, %d sem mudança (%d lidas; %d geradas por inteiro ficam com o gerador)' % (
        mudadas, 'mudariam' if simular else 'reescritas', len(lidas) - mudadas - len(GERADAS & set(lidas)),
        len(lidas), len(GERADAS & set(lidas))))
    faltam = sorted(set(a[len(SEM_VARIANTE):] for a in avisos if a.startswith(SEM_VARIANTE)))
    if faltam:
        print('  aviso: %d imagem(ns) %s%s' % (len(faltam), SEM_VARIANTE, ', '.join(faltam)))
    sem_bloco = sorted(set(a[len(SEM_BLOCO):] for a in avisos if a.startswith(SEM_BLOCO)))
    if sem_bloco:
        print('  %d abertura(s) sem bloco de tela estreita (o -1280.webp vale em todas as larguras, com um preload só):' % len(sem_bloco))
        for a in sem_bloco:
            print('    ' + a)
    for a in sorted(set(a for a in avisos if not a.startswith((SEM_VARIANTE, SEM_BLOCO)))):
        print('  aviso: ' + a)
    aviso_sitemap(raiz)
    return mudadas


def aviso_sitemap(raiz):
    """O gera-sitemap.js decide o lastmod pela impressão digital do texto da página, e essa impressão
    inclui o src de cada <img>. Enquanto ela não tratar a variante leve como a mesma imagem do
    original, a troca de miniatura conta como texto alterado e a página recebe a data do dia. Aqui se
    lê a linha que guarda o src e se confere, com a própria expressão dela, se hero-640.webp e
    hero-1280.webp (os dois finais que o --aplicar escreve em <img>) saem iguais a hero.jpg."""
    arq = os.path.join(raiz, 'gera-sitemap.js')
    if not os.path.isfile(arq):
        return
    with open(arq, encoding='utf-8') as f:
        fonte = f.read()
    m = re.search(r'srcs\.push\(\s*u\s*(?:\.replace\(\s*/((?:\\.|[^/\\\n])+)/([a-z]*)\s*,\s*(?:\'\'|"")\s*\)\s*)?\)', fonte)
    if not m:
        return
    if m.group(1):
        try:
            padrao = re.compile(m.group(1), re.I if 'i' in m.group(2) else 0)
            if all(padrao.sub('', 'a/hero' + fim) == padrao.sub('', 'a/hero.jpg') for fim in ('-640.webp', '-1280.webp')):
                return
        except re.error:
            print('  aviso: não deu para conferir se a função fingerprint do gera-sitemap.js ignora o sufixo -640/-1280')
            print('         e a extensão do src das <img>; confira antes de rodar o gera-sitemap.js.')
            return
    print('  aviso: gera-sitemap.js ainda conta a troca de imagem como mudança de texto (srcs.push na função')
    print('         fingerprint). Antes de rodar o gera-sitemap.js, faça a impressão digital ignorar o sufixo')
    print('         -640/-1280 e a extensão do src; sem isso as páginas com imagem trocada recebem a data de hoje')
    print('         no lastmod, no dateModified e no "Atualizado em".')


def main():
    aqui = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    ap = argparse.ArgumentParser(description='Versões leves (.webp) da imagem de abertura (-1280 e, para a tela estreita, '
                                             'o recorte central -m) e das miniaturas de card (-640).')
    ap.add_argument('--raiz', default=aqui, help='raiz do site para a geração (padrão: a pasta acima de ferramentas/)')
    ap.add_argument('--simular', nargs='?', const='', metavar='RAIZ', help='lista o que seria feito, sem gravar nada')
    ap.add_argument('--aplicar', metavar='RAIZ', help='reescreve o HTML das páginas da raiz indicada')
    a = ap.parse_args()
    if a.aplicar and a.simular is not None:
        ap.error('use --simular ou --aplicar, não os dois')
    if a.simular is not None:
        raiz = os.path.abspath(a.simular or a.raiz)
        print('SIMULAÇÃO em %s (nada é gravado)' % raiz)
        gerar(raiz, simular=True)
        aplicar(raiz, simular=True)
    elif a.aplicar:
        raiz = os.path.abspath(a.aplicar)
        print('HTML em %s' % raiz)
        aplicar(raiz)
    else:
        raiz = os.path.abspath(a.raiz)
        print('variantes .webp em %s' % raiz)
        gerar(raiz)


if __name__ == '__main__':
    main()
