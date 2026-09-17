# Porteira de Ferro no mapa (17/09/2026)

Não veio planta em PDF vetorial: só a IMPLANTAÇÃO da página 8 do book, que é um desenho sobre FOTO AÉREA.
Por isso o georreferenciamento foi feito casando a foto do book com o mosaico Esri, e não por grade/UTM.

1. `pdf-texto`/imagens: a implantação é `p8_0_Im0.jpg` (8965x5664) extraída com pypdf (`pf-imgs.py` no scratchpad).
2. `esri-mosaic.py pf -23.0685 -47.1965 -23.0595 -47.1855 18` → mosaico de referência.
3. `pf-ali.py` alinha por 2 pares (rotatória da entrada e lago) e compõe para conferência; `pf-busca.py` tenta refinar
   rotação/escala por correlação de bordas — NÃO melhorou (a base do book é foto antiga e levemente distorcida),
   ficou o ajuste dos 2 pares: escala 0,1452 px-satélite/px-render (≈ 0,08 m/px), rotação 88,79°.
4. `pf-fit.py` grava `dados/porteiraferro-fit.json` (página→UTM) e a máscara; `pf-mask.py` fecha os buracos
   (o lago só fecha porque o polígono do perímetro entra como "sólido" antes do preenchimento).
5. `overlay-norte.py dados/porteiraferro-overlay-cfg.json` → `images/porteiraferro.png` + bounds; conferido com
   `confere-overlay.py` e no mapa local (a planta cai entre a Alameda Porteira de Ferro e a Av. Eng. Paulo de Tarso Sousa Martins).
6. Pino do lote E-3: posição do rótulo "520,00 m²" na implantação (render 4770,1110) → `-23.063208,-47.187920`.

O encaixe é bom, mas não tem a precisão dos que vêm de grade UTM. Se o Fabio quiser ajustar, é pelo editor 8767.
