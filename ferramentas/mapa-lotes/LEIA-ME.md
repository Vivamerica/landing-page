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
   Planta colorida SEM divisa magenta (Zarin, Dominium) e que deve aparecer INTEIRA (areas verdes, APP, lotes mistos):
   mascara-cores.py <id>-mascara-cfg.json (mancha das areas coloridas: erosao tira curvas de nivel/tracejados/carimbo,
   fechamento 25 m, preenche buracos, maior bloco) e no overlay-cfg `sem_perimetro` + `interior_png`. Receita do Safira (07/09):
   dados/zarah-safira-mascara-cfg.json + dados/zarah-safira-cheio-overlay-cfg.json (0,4 m/px, 32 cores, 366 KB).
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

## Desenho "clean" (padrao do Perola, 05/09/2026 a noite) e o editor de encaixe
O desenho agora nasce das QUADRAS, nao de adivinhar rua: `preenche-quadras.py` acha as celulas fechadas do render
so-linhas, marca como LOTE as que tem forma de lote OU que contem uma posicao conhecida de lote (`pontos_lote`, vindas
de `<id>-quadras.json`), junta os lotes vizinhos na quadra (calcadas e canteiros entram), fecha o perimetro do
loteamento e pinta de CINZA tudo o que sobra dentro dele. Assim nao existe rua verde nem buraco branco.
`clean-lote.py id1,id2` roda tudo (opcoes proprias de cada planta em `opcoes-planta.json`) e reaproveita o
enquadramento ja publicado (`bounds_fixos` no overlay-norte), para nao invalidar ajustes feitos a mao.
Casos especiais: Araras (guia tracejada -> `fecha_m` 1,4), Alpnach (eixos vermelhos cortam os lotes -> `so_escuro`),
Andorinhas e San Marino (planta com texto/curva de nivel ou so raster) ficam com o desenho anterior recolorido.

**Editor de encaixe** (o Fabio move/gira/estica a planta sobre o satelite e eu aplico depois):
- escritorio: `node ajuste-server.js` e abrir http://127.0.0.1:8767/ (editor em `editor/escritorio.html`,
  dados por `editor/gera-plantas.py`); grava em `<scratchpad>/ajuste/ajustes.json` a cada mudanca.
- celular: `gera-fundos.py` (recorte nitido de cada loteamento) + `gera-geral.py` (satelite da cidade inteira,
  fundo de contexto) geram `dados-celular.json`; `editor/celular-modelo.html` + esses dados viram a pagina publicada
  como Artifact (capacidade `db`), que salva sozinho na nuvem. Ler com a acao read_db, colecao `ajustes`.
- aplicar: `aplica-ajustes.py` gira/estica a imagem, recalcula os bounds e leva os pinos junto.

## Encaixe a mao (07/09/2026)
Editor do escritorio `editor/escritorio.html` (servido por `ajuste-server.js`, porta 8767): os 4 cantos ficam soltos (homografia,
matrix3d), bolinhas azuis no meio dos lados esticam so aquele lado, Shift+canto estica sem deformar. Salva `ajustes.json` versao 3
(`cantos`). `aplica-ajustes.py` reamostra a planta por perspectiva (PIL PERSPECTIVE), recalcula bounds e leva os pinos; `--seco` e
`--teste DIR`. `troca-planta.py <id>` troca a imagem por `<id>-cheio-overlay.png` mantendo o ajuste salvo. Os encaixes do Fabio de
07/09 estao em `dados/ajustes-fabio-2026-09-07.json` (12 plantas) e ja foram aplicados.
