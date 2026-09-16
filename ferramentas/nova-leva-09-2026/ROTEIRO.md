# Nova leva set/2026 — roteiro de publicação (retomável)

Pedido do Fabio em 16/09/2026: "Pode continuar a publicação" das landings da pasta
`C:\Users\Usuario\Downloads\nova leva`. Push AUTORIZADO para este lote. Ele volta em 17/09.

## Estado
O andamento fica em `ESTADO.json` (nesta pasta). Cada empreendimento passa por:
`pendente` → `pagina` (index.html escrito e validado) → `commitado` → `publicado`.
**Antes de trabalhar, leia ESTADO.json e `git -C C:/Users/Usuario/Desktop/landing-page log --oneline -8`.
Só faça o que falta.** Atualize ESTADO.json a cada passo concluído.

Trava contra duas sessões ao mesmo tempo: `.trabalhando` nesta pasta, com data/hora ISO dentro.
Se existir e tiver menos de 3 horas, SAIA sem fazer nada. Ao começar, grave; ao terminar, apague.

## Fontes (já extraídas — não reextrair)
- `fichas.json`: uma ficha por empreendimento, com preço, data da tabela, tipologias, lazer,
  entrega, pendências e restrições. É a fonte da verdade da landing.
- Texto integral dos PDFs: `%TEMP%\mapas\nova-leva\*.txt` (páginas separadas por `<<<PAG>>>`).
  Se sumir, reextrair com `%TEMP%\mapas\mc\le-nova-leva.py` (Python do venv, rodar FORA do scratchpad).
- Imagens tiradas de dentro dos books: `imagens-extraidas/<chave>/` + `folha-<chave>.jpg`
  (folha de contato para escolher hero e galeria). O 360 também tem 38 imagens originais em
  `Downloads\nova leva\360 Home Office Mall\MATERIAL 360 HOME OFFICE MALL\` (FACHADA, LAZER, etc.) — preferir essas.

## Os 6 (Vargas Residence NÃO entra: só vieram logos)
| chave | slug | fonte única | observação |
| --- | --- | --- | --- |
| izzi | izzi-residence-indaiatuba | APTOS | GPCI/IBEN/GH; tabela set/2026; 79 unidades na tabela de 448; entrega 06/2028 |
| artemis | artemis-residencial-indaiatuba | APTOS | GPCI/IBEN; Park Meraki; set/2026; 2 torres; entrega T1 abr/2028, T2 set/2028; "em fase de registro de incorporação" |
| parque-das-aguas | parque-das-aguas-indaiatuba | APTOS | 3 tabelas por torre set/2026; incorporadora NÃO identificada no book |
| 360 | 360-home-office-mall-indaiatuba | APTOS com p:null | HINC; Av. 9 de Julho, 55, Park Meraki; SEM tabela → "consulte" |
| alphaville | alphaville-indaiatuba | LOTES | condomínio fechado de lotes, Itaici; set/2026; preço sem as custas de escrituração |
| lagos-helvetia | lagos-de-helvetia-indaiatuba | LOTES | GPCI; condomínio de lotes; tabela 01/07/2026 (antiga — datar na página) |

## FERRAMENTAS PRONTAS (use estas — foram feitas e testadas no Izzi em 16/09)
Todas nesta pasta, rodar com `C:/Users/Usuario/Desktop/vivamerica/venv/Scripts/python.exe` a partir DESTA pasta:
1. `copia_imagens.py <slug> imagens-extraidas/<chave> hero.jpg=pXX_Y.jpg nome.jpg=pXX_Y.jpg ...`
   (olhe antes `imagens-extraidas/folha-<chave>.jpg`; o rótulo "pN #i" da folha corresponde ao arquivo `pNN_k.jpg`
   — liste `ls imagens-extraidas/<chave>/pNN_*` para achar o k). Imprime largura x altura para a galeria.
2. Escrever `configs/<slug>.json` — **copie a estrutura de `configs/izzi-residence-indaiatuba.json`** (é o modelo
   completo: hero, secoes com depois=galeria/lazer/ficha, precos, localizacao, faq, cta, rodape, home, llms).
   Para lotes: "categoria": "condominios", "schema_tipo": "Residence" (ou "Place"), e "llms".secao "condominios".
   Sem preço (360): "preco_min": null e "home".preco null — o gerador omite Offer/Product.
3. `gera_landing.py configs/<slug>.json` → escreve `<slug>/index.html` e já valida os JSON-LD e termos proibidos.
4. `registra_fonte.py APTOS|LOTES "{ n:'...', c:'...', p:123456, img:'<slug>/images/hero.jpg', s:'...', t:'...', slug:'<slug>' }"`
   (para o 360 use p:null). Coloque data "mmm/aaaa" no `s` só se a tabela informar a entrega.
5. Ritual dos geradores (ver abaixo), depois `card_home.py configs/<slug>.json` se o gera-home disser "nao achei: card",
   e rode `node gera-home.js; node gera-relacionados.js; node identidade.js` de novo.
6. `sitemap_llms.py configs/<slug>.json` (sitemap + llms.txt + contadores).
7. Validador NOVO (o antigo do scratchpad foi apagado): `node ferramentas/valida-site.js` na raiz do site
   → precisa dar **0 erros** (avisos são aceitáveis; os de FAQ/img>300KB são antigos).

## Como montar cada landing (padrão já usado no Espaço Conceição, commit 7e2de8d)
1. Copiar a ESTRUTURA de `espaco-conceicao-indaiatuba/index.html` (head com OG/Twitter/canonical,
   6 blocos JSON-LD, GA4, nav-site, hero, seções, ficha-técnica `<section class="ficha-tecnica" id="ficha-tecnica">`,
   preços, localização, `.faq-geo` com o MESMO texto do FAQPage, CTA, rodapé com linha `<p class="nap">`).
   Texto novo e específico: nunca copiar descrição de outro empreendimento.
   Para lotes (alphaville, lagos-helvetia): breadcrumb e rodapé de condomínio → `/condominios-fechados-indaiatuba/`.
2. Imagens: `<slug>/images/`, JPEG ≤1600 px, cada uma ≤ 260 KB (baixar a qualidade até caber), `hero.jpg` obrigatório,
   alt descritivo, width/height, loading="lazy". Legendas dizem "perspectiva ilustrada" quando for render.
3. Registrar em `gera-folheto.js` (APTOS ou LOTES, ordem por preço; `p` inteiro arredondado; SEM `est` se ≥ 60).
4. Ritual, nesta ordem, conferindo que NENHUM termina com stack trace:
   `node gera-folheto.js; node gera-observatorio.js; node gera-home.js; node gera-apartamentos.js;
    node gera-blog-ofertas.js; node gera-blog-indice.js; node gera-relacionados.js; node identidade.js`
   Se `gera-home` disser "nao achei: card <slug>", inserir o card à mão em `index.html`
   (modelo: card do Espaço Conceição) e a entrada no ItemList, corrigindo `numberOfItems`.
5. `sitemap.xml` (priority 0.9, lastmod do dia) e `llms.txt` (linha na seção certa + contadores de empreendimentos).
6. Validar: `node ferramentas/valida-site.js` (rodar na raiz do site) — o valida-setembro.js antigo NÃO existe mais.
   → **0 erros** é obrigatório.
7. Commit por caminho nominal (NUNCA `git add -A`). Push: `git push origin HEAD`. Um push só no fim, se der;
   se o crédito estiver acabando, commitar a cada landing pronta e dar push do que estiver pronto.
8. Depois do push: conferir no ar (HTTP 200, título, imagens) e IndexNow
   (host lancamentos.imoveisvivamerica.com.br, key e8f2b6a4d17c49f0a3b5c9d8e6f1a2b7).

## Regras da casa (inegociáveis)
- NUNCA inventar número. Campo sem fonte fica fora. Todo número com data da tabela.
- NUNCA prometer valorização. Sem superlativo na voz da imobiliária.
- "Vista Verde" não pode aparecer. MCMV Faixa 3 NÃO tem subsídio (só juro menor e FGTS).
- Separar o que é entregue do que é opcional pago.
- "79 unidades constam na tabela", nunca "79 disponíveis" (a tabela avisa que podem já ter sido vendidas).
- Entrega "prevista". Empreendimento "em fase de registro de incorporação" não pode ser dito registrado.
- Izzi, Artemis, Lagos e Parque das Águas trazem "uso interno / divulgação proibida" no material.
  O Fabio já decidiu publicar nesse caso (precedente Espaço Conceição, 09/09). Usar os FATOS, sem copiar
  frases do book, e registrar a pendência no relatório final.
- WhatsApp +55 19 98976-9457; CRECI 47394-J.

## Relatório final (para o Fabio ler em 17/09)
Atualizar `RELATORIO.md` nesta pasta: o que foi publicado (com links), o que ficou pendente e por quê,
e as dúvidas que precisam dele (incorporadora do Parque das Águas, restrições de divulgação, tabela
de julho do Lagos, 360 sem preço, Vargas sem material).
