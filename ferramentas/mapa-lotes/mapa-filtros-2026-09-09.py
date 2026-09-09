# -*- coding: utf-8 -*-
# Mapa de lotes (09/09/2026, pedido do Fabio):
#  1) "Avenida" deixa de ser tipo proprio e vira COMERCIAL; "Misto (comercial)" passa a ser so "Misto".
#  2) novo filtro no topo: Loteamento aberto / Loteamento fechado.
#  3) campo de busca livre abaixo dos filtros.
import sys
sys.stdout.reconfigure(encoding='utf-8')
P = 'C:/Users/Usuario/Desktop/landing-page/mapa-lotes-indaiatuba/index.html'
s = open(P, encoding='utf-8', newline='').read(); assert '\r' not in s
def rep(velho, novo, n=1):
    global s
    assert s.count(velho) == n, (s.count(velho), velho[:90])
    s = s.replace(velho, novo)

# 1) tipos
rep("const TIPOS = { RESIDENCIAL:['Residencial','var(--res)','#2e7d5b'], MISTO:['Misto (comercial)','var(--mis)','#b8641b'], COMERCIAL:['Comercial','var(--com)','#1f5fa8'], AVENIDA:['Avenida','var(--ave)','#7a3fb5'], GLEBA:['Gleba','var(--gle)','#8a6d1f'] };",
    "const TIPOS = { RESIDENCIAL:['Residencial','var(--res)','#2e7d5b'], MISTO:['Misto','var(--mis)','#b8641b'], COMERCIAL:['Comercial','var(--com)','#1f5fa8'], GLEBA:['Gleba','var(--gle)','#8a6d1f'] };\n"
    "// 09/09/2026: lote de avenida passou a contar como COMERCIAL e \"misto (comercial)\" virou so \"misto\" (pedido do Fabio).\n"
    "const LOTEAM = { ABERTO:['Loteamento aberto','#2f7d8f'], FECHADO:['Loteamento fechado','#7a3fb5'] };\n"
    "const especieDe = b => (b && b.fechado) ? 'FECHADO' : 'ABERTO';")
rep("tipo:'AVENIDA'", "tipo:'COMERCIAL'")

# 2) marca os condominios fechados
for id_ in ('sanmarino', 'alpnach', 'ravello', 'zarah-safira', 'zarah-rubi', 'zarah-perola'):
    rep("{ id:'%s', nome:" % id_, "{ id:'%s', fechado:true, nome:" % id_)

# 3) painel: dois grupos de chips + busca
rep("""    <div class="filtros">
      <p>Tipo de lote</p>
      <div class="chips" id="chips"></div>
      <button class="btn-filtrar" id="btnFiltrar" type="button">Filtrar e ver no mapa</button>
    </div>""",
    """    <div class="filtros">
      <p>Tipo de loteamento</p>
      <div class="chips" id="chipsLot"></div>
      <p class="sep">Tipo de lote</p>
      <div class="chips" id="chips"></div>
      <div class="busca">
        <label class="oculto" for="busca">Buscar bairro, quadra ou lote</label>
        <input type="search" id="busca" placeholder="Buscar bairro, quadra ou lote" autocomplete="off">
      </div>
      <button class="btn-filtrar" id="btnFiltrar" type="button">Filtrar e ver no mapa</button>
    </div>""")

# 4) estilo do separador e da busca
rep("    .chips{display:flex;flex-wrap:wrap;gap:.35rem}",
    "    .chips{display:flex;flex-wrap:wrap;gap:.35rem}\n"
    "    .filtros p.sep{margin-top:.55rem}\n"
    "    .busca{margin-top:.55rem}\n"
    "    .busca input{width:100%;border:1px solid var(--borda);border-radius:999px;padding:.4rem .75rem;font:inherit;font-size:.78rem;background:#fff}\n"
    "    .busca input:focus{outline:2px solid var(--ouro);outline-offset:1px}\n"
    "    .oculto{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}\n"
    "    .vazio{padding:1.1rem .9rem;color:var(--cinza);font-size:.8rem}")

# 5) motor do filtro
rep("const ativos = new Set(Object.keys(TIPOS));",
    "const ativos = new Set(Object.keys(TIPOS));\n"
    "const ativosLot = new Set(Object.keys(LOTEAM));\n"
    "let termo = '';\n"
    "const semAcento = t => String(t).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();\n"
    "// um lote entra no mapa e na lista quando passa nos tres filtros: especie do loteamento, tipo de lote e busca livre\n"
    "function passa(x) {\n"
    "  if (!ativos.has(x.tipo)) return false;\n"
    "  const b = bairroDe(x.b);\n"
    "  if (!ativosLot.has(especieDe(b))) return false;\n"
    "  if (!termo) return true;\n"
    "  const alvo = semAcento(`${b ? b.nome : ''} ${b && b.sub ? b.sub : ''} quadra ${x.q} q${x.q} lote ${x.l} l${x.l} ${TIPOS[x.tipo][0]} ${m2Txt(x)}`);\n"
    "  return termo.split(/\s+/).every(t => alvo.includes(t));\n"
    "}")

# 6) usa passa() onde antes so olhava o tipo
rep("    if (!ativos.has(x.tipo)) return;\n    const cor = TIPOS[x.tipo][2];",
    "    if (!passa(x)) return;\n    const cor = TIPOS[x.tipo][2];")
rep("    const ls = LOTES.filter(x => x.b === b.id && ativos.has(x.tipo));",
    "    const ls = LOTES.filter(x => x.b === b.id && passa(x));")
rep("  const pts = LOTES.filter(x => x.b === id && ativos.has(x.tipo)).flatMap(",
    "  const pts = LOTES.filter(x => x.b === id && passa(x)).flatMap(")
open(P, 'w', encoding='utf-8', newline='').write(s)
print('parte 1 aplicada (tipos, especie, painel, motor)')
