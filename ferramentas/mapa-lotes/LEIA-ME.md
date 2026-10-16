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
10. gera-lista-indexavel.py (idempotente): reescreve o bloco indexável da página — resumo e tabela dos
    loteamentos por R$/m², FAQ e JSON-LD (WebPage/ItemList/FAQPage) — a partir de BAIRROS/LOTES. Roda depois de QUALQUER
    mudança de dado (passos 9, dominium-atualiza.py, *-atualiza.py); a data "gerada em" só avança quando o conteúdo muda.
    Antes de rodar, quando a tabela ou o relatório de um bairro muda, acertar À MÃO em BAIRROS o `tab` (data da tabela:
    é o que o popup, a gaveta e a lista mostram; sem ele o mapa cai num mês fixo) e o `sub` (lotes disponíveis e data).
    Os scripts *-atualiza.py só mexem nas linhas dos lotes. O gerador avisa ("AVISO:") quando um bairro visível está
    sem `tab` e a data do mapa não bate com a da lista, e quando o "N lotes disponíveis" do `sub` não bate com os lotes
    do arquivo; ele não corrige sozinho.
    O dateModified do JSON-LD é do gera-sitemap.js (lastmod da página): o gerador só o grava quando reescreve o bloco;
    rodado sem mudança de dado, deixa o arquivo como está. O autor e a imobiliária entram no JSON-LD pelo @id da
    entidade única, com os mesmos campos do identidade.js.
    O og:image (images/og.png, 1200x630) é um print do mapa com faixa de título e a data da lista: refazer com
    gera-og.py quando os números do resumo ou a data "gerada em" mudarem.
    Topo da página (15/10/2026): o menu é o do site inteiro (bloco GEN:menu do gera-menu.js, nunca à mão); o título
    (<h1>) e o botão de WhatsApp ficam na faixa fina .mapa-titulo logo abaixo dele, na mesma ordem de texto. A altura
    do mapa é calc(100dvh - var(--menu-h) - var(--mapa-titulo-h)); quem mexer na faixa ajusta --mapa-titulo-h no
    :root e no @media de 760 px. O gera-menu.js recusa cabeçalho com <h1> dentro: não volte o título para um <header>.
    O gera-og.py esconde "header" no recorte (pega o menu), mas não a faixa .mapa-titulo: acrescente .mapa-titulo ao
    seletor antes de refazer o og:image.
Atualizacao mensal de bairro que JA esta no mapa (tabela ou relatorio novo). Todos rodam primeiro sem --gravar,
mostram quem sai, quem entra e quem muda, e so entram se a aritmetica da tabela fechar:
    Dominium/Lugano      dominium-atualiza.py <bairro> <relatorio.pdf> [--gravar]
    Parque Zarah         zarah-atualiza-2026-10-11.py <tabela.pdf> [--gravar]  (aceita lote que volta: repoe o pino que ele ja teve)
    Terras de San Marino sanmarino-atualiza-2026-10-09.py <espelho.pdf> [--gravar]  (lote novo entra SEM pino)
    Ville de Provence    villeprovence-atualiza-2026-10-03.py <tabela.pdf> [--gravar]  (mes e data do documento nas constantes)
Lote novo sem posicao segura entra SEM pino (so na lista e na contagem): pino errado e pior que pino nenhum.
Parcela de relatorio Dominium (o relatorio nao traz a parcela): sai de regras_parcela.py, uma regra por bairro. Monte
Carmelo = Tabela Price, 1% a.m. no residencial e 1,2% a.m. no misto (planilha de calculo da Dominium; teste com
`python regras_parcela.py`, que reproduz a calculadora: 160.000 a prazo, entrada 16.000, 96x de 2.340,41). Bairro sem
regra continua com o saldo dividido direto. Usam a regra: dominium-atualiza.py (que tambem refaz a parcela gravada
fora da regra), lotes-js.py e confere-coerencia.py; montecarmelo-atualiza.py virou atalho do dominium-atualiza.py.
Mudou taxa ou preco do m2 a prazo: mude em regras_parcela.py e rode confere-coerencia.py [mapa.html] (falha com os
lotes fora da regra). O dominium-atualiza.py nao grava lote fora da regra: mais parcelas que o maximo do tipo ou
entrada abaixo do minimo (a planilha recusa as duas) deixam o lote so a vista; valor a prazo fora de area x m2 faz
o --gravar parar (exit 1, mapa intocado). Arquivo .py novo nesta pasta so sobe com `git add -f` (o .gitignore barra
.py); o regras_parcela.py tem excecao nominal no .gitignore.
Depois de qualquer *-atualiza.py: espelha-insumos-2026-10-12.py <id> [<id> ...] --gravar (iguala dados/<id>-bairro.txt
e dados/<id>-lotes.js ao mapa; sem isso o passo 9 devolveria lote que ja saiu), acertar `tab`/`sub`/`cond` em BAIRROS
e rodar o passo 10. O editor de pinos le editor-pinos/dados.json: regerar com editor-pinos/gera-dados.py.
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
