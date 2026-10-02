# -*- coding: utf-8 -*-
# Mapa de lotes: botao de contato sempre visivel + medicao correta (01/10/2026).
#
# POR QUE: em setembro o mapa foi a 3a pagina mais visitada (75 sessoes, 161
# page_views, 136 scrolls) e registrou 1 contato. A auditoria do HTML achou duas
# causas, nao uma:
#
#   1. `header .wa{display:none}` dentro de @media(max-width:760px) — no celular
#      o UNICO botao de WhatsApp da pagina desaparece. Quem entra pelo telefone
#      so chega ao WhatsApp se der zoom >= 16, achar um pino, clicar e rolar o
#      popup inteiro ate o fim. Trafego imobiliario e majoritariamente mobile.
#
#   2. o link do header (linha 116) nao dispara gtag. Diferente das landings, o
#      mapa nao tem o listener delegado em a[href*="wa.me"] — so o onclick inline
#      do popup do lote. Ou seja: clique no topo nunca foi contado. O "1 contato"
#      e subcontagem, nao necessariamente a verdade do mes.
#
# O QUE MUDA:
#   - botao flutuante fixo no canto inferior direito (pill com rotulo no desktop,
#     so icone no mobile), escondido enquanto a gaveta de filtros esta aberta;
#   - um unico listener delegado emite whatsapp_click, lendo data-origem e
#     data-lote. O onclick inline do popup sai, para o evento nao contar dobrado.
#
# Assim da para separar no GA4 quem veio do topo, do flutuante e de um lote
# especifico — e a proxima leitura mede o botao, nao a ausencia dele.
import io, sys
sys.stdout.reconfigure(encoding='utf-8')
R = 'C:/Users/Usuario/Desktop/landing-page/'
ARQ = 'mapa-lotes-indaiatuba/index.html'

p = R + ARQ
s = io.open(p, encoding='utf-8', newline='').read()


def troca(a, b, n_esperado=1):
    n = s.count(a)
    assert n == n_esperado, (ARQ, 'esperava %d, achei %d' % (n_esperado, n), a[:120])
    print('   %dx  %s' % (n, a[:70]))
    return s.replace(a, b)


# ── 1. CSS do botao flutuante ───────────────────────────────────────
# Entra logo antes do @media mobile, para que a regra mobile (que so reduz o
# rotulo) venha depois e venca por ordem.
ancora_css = '    @media(max-width:760px){'
css_novo = """    .float-wpp{position:fixed;right:1rem;bottom:1.2rem;z-index:1100;display:flex;align-items:center;gap:.5rem;
               background:#25D366;color:#fff;text-decoration:none;border-radius:999px;padding:.7rem 1.1rem;
               font:700 .82rem 'Josefin Sans',sans-serif;letter-spacing:.03em;
               box-shadow:0 4px 18px rgba(37,211,102,.45);transition:opacity .2s,transform .2s}
    .float-wpp:hover{transform:translateY(-2px)}
    .float-wpp svg{width:22px;height:22px;fill:#fff;flex:0 0 auto}
    body.gaveta .float-wpp{opacity:0;pointer-events:none}
    @media(prefers-reduced-motion:reduce){.float-wpp{transition:none}.float-wpp:hover{transform:none}}
"""
s = troca(ancora_css, css_novo + ancora_css)

# no mobile o rotulo sai e sobra a bolinha, para nao cobrir o mapa
ancora_mobile = '      header .wa{display:none}'
s = troca(ancora_mobile, ancora_mobile + """
      .float-wpp{padding:.85rem;right:.7rem;bottom:1.2rem}
      .float-wpp span{display:none}
      .float-wpp svg{width:26px;height:26px}""")

# ── 2. marca a origem no link do topo ───────────────────────────────
s = troca('<a class="wa" href="https://wa.me/5519989769457?text=Ol%C3%A1!%20Vi%20o%20mapa',
          '<a class="wa" data-origem="topo" href="https://wa.me/5519989769457?text=Ol%C3%A1!%20Vi%20o%20mapa')

# ── 3. popup do lote: sai o onclick inline, entram os data-* ────────
s = troca(
    """<a class="wa" href="${wa}" target="_blank" rel="noopener" onclick="try{gtag('event','whatsapp_click',{lote:'${x.id}'})}catch(e){}">Falar sobre este lote</a>""",
    """<a class="wa" data-origem="lote" data-lote="${x.id}" href="${wa}" target="_blank" rel="noopener">Falar sobre este lote</a>""")

# ── 4. botao flutuante + listener unico ─────────────────────────────
MSG = ('https://wa.me/5519989769457?text=Ol%C3%A1!%20Estou%20vendo%20o%20mapa%20de%20lotes%20'
       'de%20Indaiatuba%20e%20quero%20falar%20com%20um%20corretor.')
SVG = ('<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.46 1.32 4.97'
       'L2 22l5.25-1.38c1.45.79 3.08 1.21 4.79 1.21 5.46 0 9.91-4.45 9.91-9.91S17.5 2 12.04 2m0 18.15c-1.48 0-2.93-.4-4.2-1.15'
       'l-.3-.18-3.12.82.83-3.04-.19-.31a8.26 8.26 0 01-1.26-4.38c0-4.54 3.7-8.24 8.24-8.24 2.2 0 4.27.86 5.82 2.42a8.18 8.18 0 012.41 5.83'
       'c0 4.54-3.7 8.23-8.23 8.23m4.52-6.16c-.25-.12-1.47-.72-1.7-.81-.23-.08-.39-.12-.56.13-.16.25-.64.81-.78.97-.15.17-.29.19-.54.06'
       '-.25-.12-1.05-.39-2-1.23-.74-.66-1.24-1.47-1.38-1.72-.15-.25-.02-.38.11-.5.11-.11.25-.29.37-.44.12-.14.17-.25.25-.41.08-.17.04-.31-.02-.44'
       '-.06-.12-.56-1.35-.77-1.85-.2-.48-.41-.42-.56-.43h-.48c-.16 0-.43.06-.66.31-.23.25-.87.85-.87 2.07 0 1.22.89 2.4 1.01 2.57.13.16 1.75 2.67 4.24 3.74'
       '.59.26 1.05.41 1.41.52.6.19 1.14.17 1.56.1.48-.07 1.47-.6 1.68-1.18.21-.58.21-1.08.14-1.18-.06-.1-.23-.16-.48-.28"/></svg>')

ancora_fim = '</script>\n</body>\n</html>'
bloco = """</script>

<!-- Contato sempre ao alcance: no celular o botao do topo fica oculto, e o
     botao de cada lote exige zoom e um clique no pino. Este nao depende de nada. -->
<a class="float-wpp" data-origem="flutuante" href="%s" target="_blank" rel="noopener"
   aria-label="Falar com um corretor no WhatsApp">%s<span>Falar com um corretor</span></a>

<script>
// Fonte unica do evento de contato: cobre o link do topo, o flutuante e o de
// cada lote. Antes so o popup media, e por isso o numero de setembro saiu baixo.
document.addEventListener('click', function (e) {
  var el = e.target.closest('a[href*="wa.me"]');
  if (!el) return;
  try {
    gtag('event', 'whatsapp_click', {
      event_category: 'conversao',
      event_label: 'mapa-lotes',
      origem: el.dataset.origem || 'outro',
      lote: el.dataset.lote || ''
    });
  } catch (err) {}
});
</script>
</body>
</html>""" % (MSG, SVG)
s = troca(ancora_fim, bloco)

io.open(p, 'w', encoding='utf-8', newline='').write(s)
print('ok', ARQ)
