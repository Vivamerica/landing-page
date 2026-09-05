# Pipeline do mapa de lotes (mapa-lotes-indaiatuba)

Scripts em Python (venv em C:\Users\Usuario\Desktop\vivamerica\venv, so PIL + pypdf) que transformam a planta (PDF) e o relatorio
de lotes disponiveis em pinos georreferenciados + planta sobreposta ao mapa. Arquivos temporarios em %TEMP%\mapas.

Ordem, por empreendimento (exemplos em dados/):
1. render da planta a 5000 px: ferramentas/pdf2png.ps1 -Pdf planta.pdf -Largura 5000 -Saida %TEMP%\mapas\5000
2. pdf-texto.py planta.pdf 1 <id>-text.json        -> textos com posicao (numeros de lote, letras de quadra, rotulos da grade)
3. georreferenciamento (pagina -> UTM 23S, SIRGAS2000):
   a) planta com grade UTM (Esquadro/Dominium): fit-utm.py <id>-text.json <id>-fit.json
   b) sem grade, norte para cima e escala conhecida: ajusta-translacao.py <id>-trans-cfg.json (casa as ruas com o OSM;
      precisa de osm-render.py para baixar as vias) — usado no Di Italia
   c) contorno no OSM (Terras de San Marino): ajuste por area/eixos principais (ver historico)
4. quadras: quadras-lotes.py <id>-cfg2.json (adjacencia de lotes; robusto) ou quadras-raster.py <id>-cfg.json (faixa cinza da rua)
   -> <id>-quadras.json {letra: {numero: [x, y] em pt}}; conferir contagem por quadra com a tabela da planta
5. disponiveis: dominium-disp.py relatorio.pdf <id>-disp.json (Dominium/Lugano) | zarah-tabela.py (Zarin 180x)
6. lotes-js.py <id> <id>-disp.json <id>-quadras.json <id>-fit.json <id>-lotes.js  (linhas LOTES do mapa)
7. overlay: overlay-norte.py <id>-overlay-cfg.json -> images/<id>.png (norte p/ cima, recortado ao perimetro magenta, branco transparente) + bounds
8. confere-overlay.py images/<id>.png <id>-bounds.json conf.jpg 17  (planta sobre o satelite Esri, sem precisar do site)
9. patch-mapa-bairro.py <id> <id>-bairro.txt <id>-lotes.js "comentario"  (idempotente) e node checa-mapa-js.js
Regras: nunca citar a fonte "Vista Verde"; precos a vista do relatorio; lotes sem "nx" recebem soVista:true.

## Desenho solido (padrao escolhido pelo Fabio em 05/09/2026: lotes verdes, ruas cinza, divisas escuras, sem texto)
Em vez da planta original, o overlay e um desenho gerado a partir das linhas do CAD. Serie completa: solido-lote.py lista.json
(exemplos em dados/solido-lista*.json). Por empreendimento:
1. pdf-camadas.py planta.pdf limpo.pdf "camadas" [larg_min]  -> PDF so com as divisas. "camadas" = nomes das camadas OCG
   separados por ";" (Ravello, Monte Carmelo, Zarah, bairros) OU, em PDF achatado, "drop:COR|LARG;..." (descarta essas
   combinacoes de cor|largura de traco; "*" = qualquer largura; "FILL" = descarta preenchimentos) — Alpnach, Di Italia,
   Andorinhas. larg_min engrossa hairlines (Di Italia: divisas com largura 1 no CAD -> larg_min 10).
   Inventario de cor|largura: ver o script inline usado no Di Italia (pypdf ContentStream, conta segmentos por combinacao).
2. render 5000 px (pdf2png.ps1) -> preenche-solido.py <id>-solido-cfg.json: acha cada regiao fechada e pinta lote (<= 2500 m2)
   de verde, rua (celula estreita ou ligada a borda) de cinza so numa faixa de 9 m das linhas, o resto branco (transparente);
   linhas por cima. Opcoes: circulos (apaga circulos de numeracao pela posicao do texto), tira_blobs, modo "cores" p/ planta
   raster (San Marino: divisas brancas, ruas cinza, lotes verdes) + tira-cinza-solto.py p/ limpar texturas.
3. overlay-norte.py com recorte_lotes_m (18): fica so a vizinhanca dos lotes verdes, nas componentes que contem lotes de
   <id>-quadras.json (some a moldura, rosa dos ventos, tabelas). overlays-finais.py roda isso p/ todos e faz o composto Esri.
Georreferenciamento dos bairros (05/09): Araras e Barnabe tem grade UTM ("E 265.400,0000 m") -> fit-utm.py; a planta do
Araras esta em outro datum (deslocamento de -48 E / -44 N m achado pelos rotulos das vias nomeadas x OSM); Campo Bonito
sem grade -> ajusta-nomes.py (rotulos de vias nomeadas x OSM: escala, rumo e translacao; 8 rotulos a < 1,1 m);
Barnabe -> ajusta-rotacao.py com ruas_png (a grade impressa nao bate com o OSM/satelite). Quando o fit muda,
reprojeta-ll.py <id> fit-antigo fit-novo mantem os pinos no mesmo ponto da planta; atualiza-bounds.py ids troca os bounds.
Conferir SEM publicar (creditos da Netlify): node serve-local.js e abrir http://127.0.0.1:8766/mapa-lotes-indaiatuba/.
