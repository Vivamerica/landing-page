# -*- coding: utf-8 -*-
# Monta blog/o-que-e-alphaville/index.html a partir da casca de um artigo
# existente (head, estilos, header, rodape, rastreio de clique) trocando:
#   - os metadados e os blocos JSON-LD
#   - o hero e a trilha
#   - o miolo do <article>
#   - o FAQ visivel e o FAQPage
#
# Reaproveitar a casca e o mesmo caminho do gera_landing.py das landings: o
# artigo nasce com o CSS, o menu e o rodape ja aprovados, e o que se escreve e
# so o conteudo.
import io, os, re, sys
sys.stdout.reconfigure(encoding='utf-8')
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from gera_artigo_alphaville_dados import TITULO, H1, DESC, MIOLO, FAQ, SLUG, HOJE

R = 'C:/Users/Usuario/Desktop/landing-page/'
MODELO = R + 'blog/indaiatuba-ou-campinas/index.html'
DEST = R + 'blog/' + SLUG + '/'
BASE = 'https://lancamentos.imoveisvivamerica.com.br/'
URL = BASE + 'blog/' + SLUG + '/'
IMG = URL + 'images/linha-do-tempo.svg'

s = io.open(MODELO, encoding='utf-8', newline='').read()

# ── metadados ───────────────────────────────────────────────────────
s = re.sub(r'<title>.*?</title>', '<title>%s</title>' % TITULO, s, count=1)
for campo in ('name="description"', 'property="og:description"', 'name="twitter:description"'):
    s = re.sub(r'(<meta %s content=")[^"]*(")' % re.escape(campo), r'\g<1>%s\g<2>' % DESC, s, count=1)
for campo in ('property="og:title"', 'name="twitter:title"'):
    s = re.sub(r'(<meta %s content=")[^"]*(")' % re.escape(campo), r'\g<1>%s\g<2>' % TITULO, s, count=1)
s = re.sub(r'(<meta name="keywords" content=")[^"]*(")',
           r'\g<1>o que e alphaville, alphaville significado, historia alphaville, alphaville urbanismo, '
           r'terras alpha, jardim alpha, alphaville indaiatuba, enclaves fortificados, loteamento fechado\g<2>', s, count=1)
s = re.sub(r'(<meta property="og:url" content=")[^"]*(")', r'\g<1>%s\g<2>' % URL, s, count=1)
s = re.sub(r'(<link rel="canonical" href=")[^"]*(")', r'\g<1>%s\g<2>' % URL, s, count=1)
for campo in ('property="og:image"', 'name="twitter:image"'):
    s = re.sub(r'(<meta %s content=")[^"]*(")' % re.escape(campo), r'\g<1>%s\g<2>' % IMG, s, count=1)

# ── JSON-LD: BlogPosting ────────────────────────────────────────────
s = re.sub(r'("headline":\s*")[^"]*(")', r'\g<1>%s\g<2>' % TITULO, s, count=1)
s = re.sub(r'("description":\s*")[^"]*(")', r'\g<1>%s\g<2>' % DESC, s, count=1)
s = re.sub(r'("image":\s*")[^"]*(")', r'\g<1>%s\g<2>' % IMG, s, count=1)
s = re.sub(r'("datePublished":\s*")[^"]*(")', r'\g<1>%s\g<2>' % HOJE, s, count=1)
s = re.sub(r'("dateModified":\s*")[^"]*(")', r'\g<1>%s\g<2>' % HOJE, s, count=1)
s = re.sub(r'("mainEntityOfPage":\s*")[^"]*(")', r'\g<1>%s\g<2>' % URL, s, count=1)

# ── JSON-LD: o bloco Dataset do modelo vira citacao das fontes ─────
DATASET = '''{
    "@context": "https://schema.org",
    "@type": "Article",
    "name": "Alphaville: história, escala e linhas de produto segundo os documentos da CVM",
    "description": "Levantamento sobre a Alphaville S.A. a partir de documentos entregues à Comissão de Valores Mobiliários: fundação em 1973, 138 empreendimentos entregues em mais de 70 cidades e 23 estados, e as três linhas de produto por metragem de lote.",
    "url": "%s",
    "author": {"@type":"Organization","name":"Imobiliária Viv'América","url":"%s"},
    "isAccessibleForFree": true,
    "citation": [
      "Alphaville S.A. — Formulário de Referência, versão 3, entregue à CVM em 30/06/2026",
      "Alphaville S.A. — Formulário de Referência 2024, entregue à CVM em 03/12/2024",
      "Alphaville S.A. — Formulário de Referência 2020, entregue à CVM em 19/05/2021",
      "Alphaville S.A. — Prospecto Preliminar da Oferta Pública, 05/11/2020",
      "Alphaville S.A. — ITR 2T26 (13/08/2026) e ITR 4T25 (31/03/2026)",
      "CALDEIRA, Teresa Pires do Rio. Cidade de Muros: crime, segregação e cidadania em São Paulo",
      "Lei nº 6.766/1979 (parcelamento do solo urbano)",
      "Lei nº 13.465/2017, art. 1.358-A do Código Civil (condomínio de lotes)"
    ]
  }''' % (URL, BASE)
s = re.sub(r'\{\s*"@context": "https://schema\.org",\s*"@type": "Dataset".*?\n  \}',
           DATASET, s, count=1, flags=re.S)

# ── FAQPage ─────────────────────────────────────────────────────────


def _j(t):
    return '"' + t.replace('\\', '\\\\').replace('"', '\\"') + '"'


faq_json = ',\n      '.join(
    '{"@type":"Question","name":%s,"acceptedAnswer":{"@type":"Answer","text":%s}}' % (_j(q), _j(a))
    for q, a in FAQ)
# o bloco do modelo fecha com "]" indentado; troca do "mainEntity": [ ate la
i = s.index('"@type": "FAQPage"')
j = s.index('"mainEntity": [', i) + len('"mainEntity": [')
k = s.index(chr(10) + '    ]', j)
s = s[:j] + chr(10) + '      ' + faq_json + s[k:]

# ── trilha (BreadcrumbList) ─────────────────────────────────────────
s = re.sub(r'(\{"@type":"ListItem","position":3,"name":")[^"]*(","item":")[^"]*(")',
           r'\g<1>Lotes e condomínios\g<2>%sloteamentos-em-indaiatuba/\g<3>' % BASE, s, count=1)
s = re.sub(r'(\{"@type":"ListItem","position":4,"name":")[^"]*(")', r'\g<1>%s\g<2>' % H1, s, count=1)

# ── hero, trilha visível e miolo ────────────────────────────────────
s = re.sub(r'<span class="tag">[^<]*</span>', '<span class="tag">Mercado · Marca</span>', s, count=1)
s = re.sub(r'<h1>.*?</h1>', '<h1>%s</h1>' % H1, s, count=1, flags=re.S)
s = re.sub(r'<p class="meta">.*?</p>',
           '<p class="meta">Publicado em 04/10/2026 · levantado em documentos entregues à CVM · '
           'Imobiliária Viv\'América</p>', s, count=1, flags=re.S)
s = re.sub(r'<p class="breadcrumb">.*?</p>',
           '<p class="breadcrumb"><a href="/">Início</a> › <a href="/blog/">Blog</a> › '
           '<a href="/loteamentos-em-indaiatuba/">Lotes e condomínios</a> › O que é Alphaville</p>',
           s, count=1, flags=re.S)

ini = s.index('<article>') + len('<article>')
fim = s.index('</article>')
s = s[:ini] + '\n' + MIOLO.strip() + '\n' + s[fim:]

# ── FAQ visível ─────────────────────────────────────────────────────
blocos = '\n'.join(
    '      <details><summary>%s</summary><p>%s</p></details>' % (q, a) for q, a in FAQ)
s = re.sub(r'(<section class="faq-geo">.*?<h2 class="faq-h2">)[^<]*(</h2>).*?(</section>)',
           lambda m: m.group(1) + 'Perguntas frequentes sobre Alphaville' + m.group(2)
                     + '\n' + blocos + '\n    ' + m.group(3),
           s, count=1, flags=re.S)

# estilo dos blocos novos (gráfico, tabela, citação) — entra antes do </style>
EXTRA = '''
    /* artigo "O que é Alphaville" */
    article blockquote{border-left:3px solid var(--ouro,#c9a227);margin:1.6rem 0;padding:.2rem 0 .2rem 1.1rem;
      font-style:italic;color:#3b352c;}
    article blockquote cite{display:block;margin-top:.6rem;font-style:normal;font-size:.8rem;color:#8a8272;}
    figure.grafico{margin:2rem 0;}
    figure.grafico img{width:100%;height:auto;border:1px solid var(--linha,#e6e1d6);border-radius:.5rem;}
    figure.grafico figcaption{font-size:.8rem;color:#8a8272;margin-top:.5rem;}

    /* O mapa de estados tem texto miúdo dentro do desenho. Encolhido para a
       largura de um celular ele fica ilegível, então abaixo de 620px a FIGURA
       rola de lado com o desenho num tamanho que ainda se lê — a página, não. */
    @media(max-width:620px){
      figure.grafico{overflow-x:auto;-webkit-overflow-scrolling:touch;}
      figure.grafico img{width:620px;max-width:none;}
      figure.grafico figcaption{position:sticky;left:0;}
    }

    /* Tabela: contêiner que rola, para a tabela nunca empurrar a página. */
    .tabela-rolagem{overflow-x:auto;-webkit-overflow-scrolling:touch;margin:1.4rem 0;}
    table.tabela{width:100%;border-collapse:collapse;margin:0;font-size:.93rem;}
    table.tabela th{background:#14110f;color:#f5f1e8;text-align:left;padding:.6rem .8rem;font-weight:600;}
    table.tabela td{border-bottom:1px solid var(--linha,#e6e1d6);padding:.6rem .8rem;}
    /* No celular, empilhar lê melhor que rolar de lado: cada linha vira um
       cartão e o cabeçalho da coluna reaparece como rótulo de cada campo. */
    @media(max-width:560px){
      .tabela-rolagem{overflow:visible;}
      table.tabela thead{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap;}
      /* o CSS compartilhado do blog põe min-width:640px nas tabelas, para elas
         rolarem dentro do contêiner. Empilhado isso tem de sair, senão a tabela
         segue com 640px e é ela que empurra a página de lado. */
      table.tabela,table.tabela tbody,table.tabela tr,table.tabela td{display:block;width:auto;min-width:0;}
      table.tabela tr{border:1px solid var(--linha,#e6e1d6);border-radius:.5rem;margin-bottom:.8rem;padding:.3rem .9rem .7rem;}
      table.tabela td{border:0;padding:.45rem 0;}
      table.tabela td::before{content:attr(data-r);display:block;font-size:.72rem;text-transform:uppercase;
        letter-spacing:.06em;color:#8a8272;margin-bottom:.12rem;}
    }
    p.fonte-tabela{font-size:.8rem;color:#8a8272;margin-top:.4rem;}

    /* Linha do tempo vertical, em fundo claro. Vertical porque numa tela de
       celular a horizontal obriga a encolher a fonte até sumir; na vertical a
       rolagem natural da página já é o eixo do tempo. */
    .lt{margin:2.2rem 0;padding:1.5rem 1.1rem 1.2rem;background:#fbf8f1;
      border:1px solid var(--linha,#e6e1d6);border-radius:.7rem;}
    .lt-tit{margin:0 0 1.3rem;font:700 1.25rem Georgia,serif;color:#14110f;}
    .lt-lista{list-style:none;margin:0;padding:0 0 0 1.9rem;position:relative;}
    .lt-lista::before{content:'';position:absolute;left:.42rem;top:.6rem;bottom:.6rem;width:2px;
      background:linear-gradient(#e3d19a,#c9a227);}
    .lt-item{position:relative;padding:0 0 1.5rem;}
    .lt-item:last-child{padding-bottom:0;}
    .lt-item::before{content:'';position:absolute;left:-1.62rem;top:.5rem;width:.6rem;height:.6rem;
      border-radius:50%;background:#c9a227;box-shadow:0 0 0 3px #fbf8f1;}
    .lt-marco::before{width:.85rem;height:.85rem;left:-1.75rem;top:.4rem;background:#14110f;}
    .lt-ano{margin:0 0 .1rem;font:700 1.35rem Georgia,serif;color:#a8841a;}
    .lt-txt b{display:block;font-size:1.06rem;line-height:1.35;color:#14110f;}
    .lt-txt span{display:block;margin-top:.15rem;font-size:.95rem;color:#6b6255;}
    .lt-fonte{margin:1.3rem 0 0;font-size:.8rem;color:#8a8272;}
    @media(min-width:720px){
      .lt{padding:1.9rem 1.9rem 1.5rem;}
      .lt-ano{font-size:1.5rem;}
      .lt-txt b{font-size:1.12rem;}
      .lt-txt span{font-size:1rem;}
    }
    /* A revelação só existe depois que o JS marca .lt-anima. Sem JS, ou para
       quem pediu menos movimento, a linha do tempo nasce inteira visível —
       conteúdo nenhum pode depender de script para ser lido. */
    @media(prefers-reduced-motion:no-preference){
      .lt-anima .lt-item{opacity:0;transform:translateY(14px);
        transition:opacity .5s ease,transform .5s ease;}
      .lt-anima .lt-item.vis{opacity:1;transform:none;}
    }

    ul.numeros li{margin-bottom:.4rem;}
    p.cta-inline{margin:1.6rem 0;}
    p.cta-inline a{display:inline-block;background:var(--ouro,#c9a227);color:#14110f;font-weight:700;
      padding:.7rem 1.2rem;border-radius:999px;text-decoration:none;}
'''

# Revelação da linha do tempo conforme a rolagem. Entra como <script> no fim do
# corpo e é defensivo: se não houver IntersectionObserver, não marca nada e tudo
# fica visível. O que já está na tela ao carregar aparece de imediato.
SCRIPT_LT = '''<script>
(function(){
  var lt = document.querySelector('.lt');
  if (!lt || !('IntersectionObserver' in window)) return;
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  lt.classList.add('lt-anima');
  var itens = lt.querySelectorAll('.lt-item');
  var obs = new IntersectionObserver(function(ent){
    ent.forEach(function(e){ if (e.isIntersecting){ e.target.classList.add('vis'); obs.unobserve(e.target); } });
  }, { rootMargin: '0px 0px -12% 0px', threshold: 0.1 });
  [].forEach.call(itens, function(li){ obs.observe(li); });
  // Rede de segurança: conteúdo nenhum pode ficar invisível porque um observer
  // não disparou. Passados 2,5s, o que ainda estiver escondido aparece.
  setTimeout(function(){ [].forEach.call(itens, function(li){ li.classList.add('vis'); }); }, 2500);
})();
</script>
'''
s = s.replace('  </style>', EXTRA + '  </style>', 1)
s = s.replace('</body>', SCRIPT_LT + '</body>', 1)

os.makedirs(DEST, exist_ok=True)
io.open(DEST + 'index.html', 'w', encoding='utf-8', newline='').write(s)
print('gerado %sindex.html (%d linhas)' % (DEST, s.count('\n')))
print('  title %d · description %d · %d perguntas' % (len(TITULO), len(DESC), len(FAQ)))
