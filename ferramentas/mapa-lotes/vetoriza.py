#!/usr/bin/env python3
"""
vetoriza.py — converte o PNG "clean-overlay" de um loteamento (norte para cima)
em SVG vetorial: mancha do loteamento + um <path> por lote.

Uso:
    python vetoriza.py <entrada.png> <saida.svg> [tolerancia_px]

Somente biblioteca padrao + Pillow (sem numpy/scipy).

Metodo
------
1. Mascaras 'L' (255 = alvo, 0 = resto) construidas com operacoes do Pillow
   (LUT por canal + ImageChops.darker = AND), portanto em C:
     - mancha : alpha > 0
     - lote   : |R-109|<=8 e |G-179|<=8 e |B-100|<=8 e alpha > 0
   Cada mascara ganha 1 px de borda zero (ImageOps.expand) para o rastreador
   de contorno nunca sair da imagem.
2. Rotulagem por varredura em linha: a linha e lida com crop().tobytes() e
   bytes.find(b'\\xff') (C); o primeiro pixel 255 de uma linha e sempre o
   pixel superior-esquerdo de uma componente nova. O contorno externo e
   rastreado ANTES do preenchimento (predicado "pixel == 255"); em seguida
   ImageDraw.floodfill (4-conexo, thresh=0) marca a componente com 1.
   O rastreio so consulta pixels 4-adjacentes a pixels ja sabidamente da
   componente, logo nunca "vaza" para uma componente vizinha ainda nao
   preenchida. O floodfill do Pillow guarda apenas a frente de onda (dois
   sets), entao a memoria fica limitada mesmo na mancha inteira.
3. Contorno externo por seguimento de arestas de pixel (crack following,
   regra 4-conexa): poligono fechado com vertices inteiros nos cantos dos
   pixels, exatamente envolvendo a componente (buracos internos ignorados).
   A area (shoelace) do poligono e a contagem de pixels da componente
   (para componentes sem buraco) e serve para o descarte de < 40 px.
4. Douglas-Peucker iterativo (pilha), anel fechado ancorado no vertice 0 e
   no vertice mais distante dele. Tolerancia padrao 1.5 px.
5. SVG: viewBox="0 0 W H", preserveAspectRatio="none", sem fundo,
   coordenadas inteiras, cada path fechado com Z.
"""

import sys
import time
from PIL import Image, ImageChops, ImageDraw, ImageOps

COR_LOTE = (109, 179, 100)
TOL_COR = 8
MIN_PX_LOTE = 40

# Direcoes: 0=E, 1=S, 2=W, 3=N (y cresce para baixo; percurso horario com o
# interior a direita). Para o vertice (x, y) e a direcao d, o pixel
# "a frente-direita" e (x+AR[d][0], y+AR[d][1]) e o "a frente-esquerda"
# e (x+AL[d][0], y+AL[d][1]).
DIRS = ((1, 0), (0, 1), (-1, 0), (0, -1))
AR = ((0, 0), (-1, 0), (-1, -1), (0, -1))
AL = ((0, -1), (0, 0), (-1, 0), (-1, -1))


def mascara_faixa(banda, alvo, tol):
    lut = [255 if abs(i - alvo) <= tol else 0 for i in range(256)]
    return banda.point(lut)


def construir_mascaras(im):
    r, g, b, a = im.split()
    alfa = a.point(lambda v: 255 if v > 0 else 0)
    verde = ImageChops.darker(mascara_faixa(r, COR_LOTE[0], TOL_COR),
                              mascara_faixa(g, COR_LOTE[1], TOL_COR))
    verde = ImageChops.darker(verde, mascara_faixa(b, COR_LOTE[2], TOL_COR))
    verde = ImageChops.darker(verde, alfa)
    # borda de 1 px para o rastreador nunca consultar fora da imagem
    return ImageOps.expand(alfa, border=1, fill=0), ImageOps.expand(verde, border=1, fill=0)


def rastrear_contorno(pix, sx, sy):
    """Contorno externo (crack following, 4-conexo) da componente cujo pixel
    superior-esquerdo e (sx, sy). pix = PixelAccess da mascara 'L' com borda;
    interior = valor 255. Devolve a lista de cantos (x, y) em ordem horaria."""
    x, y = sx, sy
    d = 0
    verts = [(sx, sy)]
    primeiro = True
    while True:
        arx, ary = AR[d]
        fr = pix[x + arx, y + ary] == 255
        if fr:
            alx, aly = AL[d]
            if pix[x + alx, y + aly] == 255:
                nd = (d - 1) & 3          # vira a esquerda
            else:
                nd = d                    # segue reto
        else:
            nd = (d + 1) & 3              # vira a direita (inclui o caso diagonal: regra 4-conexa)
        if nd == 0 and x == sx and y == sy and not primeiro:
            break
        if nd != d:
            verts.append((x, y))
            d = nd
        dx, dy = DIRS[d]
        x += dx
        y += dy
        primeiro = False
    return verts


def area2_shoelace(verts):
    s = 0
    n = len(verts)
    for i in range(n):
        x1, y1 = verts[i]
        x2, y2 = verts[(i + 1) % n]
        s += x1 * y2 - x2 * y1
    return abs(s)


def douglas_peucker(pts, eps):
    """Simplificacao iterativa (pilha) de uma polilinha aberta; mantem extremos."""
    n = len(pts)
    if n < 3:
        return list(pts)
    manter = [False] * n
    manter[0] = manter[-1] = True
    eps2 = eps * eps
    pilha = [(0, n - 1)]
    while pilha:
        i, j = pilha.pop()
        if j <= i + 1:
            continue
        ax, ay = pts[i]
        bx, by = pts[j]
        dx, dy = bx - ax, by - ay
        l2 = dx * dx + dy * dy
        melhor = -1
        melhor_d = -1.0
        if l2 == 0:
            for k in range(i + 1, j):
                px, py = pts[k]
                dd = (px - ax) ** 2 + (py - ay) ** 2
                if dd > melhor_d:
                    melhor_d = dd
                    melhor = k
        else:
            for k in range(i + 1, j):
                px, py = pts[k]
                c = dx * (py - ay) - dy * (px - ax)
                dd = c * c / l2
                if dd > melhor_d:
                    melhor_d = dd
                    melhor = k
        if melhor_d > eps2:
            manter[melhor] = True
            pilha.append((i, melhor))
            pilha.append((melhor, j))
    return [p for p, m in zip(pts, manter) if m]


def simplificar_anel(verts, eps):
    n = len(verts)
    if n < 4:
        return list(verts)
    x0, y0 = verts[0]
    longe = 0
    dmax = -1
    for k in range(1, n):
        x, y = verts[k]
        dd = (x - x0) ** 2 + (y - y0) ** 2
        if dd > dmax:
            dmax = dd
            longe = k
    a = douglas_peucker(verts[:longe + 1], eps)
    b = douglas_peucker(verts[longe:] + [verts[0]], eps)
    return a + b[1:-1]


def componentes(mask, eps, min_px):
    """Gera (verts_simplificados, area_px) para cada componente 4-conexa
    de pixels 255 da mascara (com borda). Componentes com area < min_px
    sao descartadas (devolvidas na contagem de descartadas)."""
    w2, h2 = mask.size
    pix = mask.load()
    saida = []
    descartadas = 0
    for y in range(h2):
        linha = mask.crop((0, y, w2, y + 1)).tobytes()
        x = linha.find(b'\xff')
        while x != -1:
            verts = rastrear_contorno(pix, x, y)
            ImageDraw.floodfill(mask, (x, y), 1)
            area = area2_shoelace(verts) // 2
            if area >= min_px:
                simp = simplificar_anel(verts, eps)
                if len(simp) >= 3:
                    saida.append((simp, area))
                else:
                    descartadas += 1
            else:
                descartadas += 1
            linha = mask.crop((0, y, w2, y + 1)).tobytes()
            x = linha.find(b'\xff', x + 1)
    return saida, descartadas


def path_d(verts):
    # coordenadas da imagem com borda -> imagem original (-1)
    partes = ['M%d %d' % (verts[0][0] - 1, verts[0][1] - 1)]
    partes.append('L' + ' '.join('%d %d' % (x - 1, y - 1) for x, y in verts[1:]))
    partes.append('Z')
    return ' '.join(partes)


def main(argv):
    if len(argv) < 3:
        print(__doc__)
        return 2
    entrada, saida = argv[1], argv[2]
    eps = float(argv[3]) if len(argv) > 3 else 1.5

    t0 = time.time()
    im = Image.open(entrada).convert('RGBA')
    w, h = im.size
    m_alfa, m_verde = construir_mascaras(im)
    del im
    t1 = time.time()

    manchas, _ = componentes(m_alfa, eps, 1)
    del m_alfa
    t2 = time.time()

    lotes, lotes_descartados = componentes(m_verde, eps, MIN_PX_LOTE)
    del m_verde
    t3 = time.time()

    linhas = []
    linhas.append('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 %d %d" '
                  'preserveAspectRatio="none">' % (w, h))
    linhas.append('<g id="mancha">')
    for verts, _ in manchas:
        linhas.append('<path fill="#a6a6a6" stroke="#787878" stroke-width="1.2" '
                      'vector-effect="non-scaling-stroke" d="%s"/>' % path_d(verts))
    linhas.append('</g>')
    linhas.append('<g id="lotes">')
    for verts, _ in lotes:
        linhas.append('<path fill="#6db364" stroke="#2d3e2d" stroke-width="1.2" '
                      'stroke-linejoin="round" vector-effect="non-scaling-stroke" d="%s"/>'
                      % path_d(verts))
    linhas.append('</g>')
    linhas.append('</svg>')
    svg = '\n'.join(linhas) + '\n'
    with open(saida, 'w', encoding='utf-8') as f:
        f.write(svg)
    t4 = time.time()

    n_lotes = len(lotes)
    media_v = (sum(len(v) for v, _ in lotes) / n_lotes) if n_lotes else 0.0
    tam_kb = len(svg.encode('utf-8')) / 1024.0
    print('entrada: %s (%dx%d)  tolerancia DP: %.2f px' % (entrada, w, h, eps))
    print('manchas: %d' % len(manchas))
    print('lotes: %d  (descartados < %d px ou degenerados: %d)'
          % (n_lotes, MIN_PX_LOTE, lotes_descartados))
    print('media de vertices por lote: %.1f' % media_v)
    print('tamanho do SVG: %.1f KB  -> %s' % (tam_kb, saida))
    print('tempos: mascaras %.1fs | mancha %.1fs | lotes %.1fs | svg %.1fs | total %.1fs'
          % (t1 - t0, t2 - t1, t3 - t2, t4 - t3, t4 - t0))
    return 0


if __name__ == '__main__':
    sys.exit(main(sys.argv))
