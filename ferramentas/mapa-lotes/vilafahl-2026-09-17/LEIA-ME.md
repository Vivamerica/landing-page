# Vila Fahl no mapa (17/09/2026)

Fonte: `Downloads\Vila Fahl` (planta "PDF MAPA Vila Fahl.pdf" + tabelas residencial e comercial da Fase 1, 96x, sem data impressa).

1. `vf-tab.py`: lê as duas tabelas (67 lotes: 48 residenciais a R$ 1.825/m² e 19 comerciais a R$ 2.000/m²; sinal 10%; coluna "desconto" = à vista -5%).
2. `vf-grade.py` + `vf-fit.py` + `vf-fit2.py`: georreferenciamento pela GRADE UTM de 100 m desenhada em vetor na planta
   (22 linhas cinza, 283,46 pt = 100 m = 1:1000, girada 9,81°); os rótulos E=/N= da grade são desenho, não texto.
   A translação vem da grade + torre 17-01 (E=268764,085 N=7444609,444), resíduo ~1 m. Conferido no satélite Esri e no OSM.
3. `quadras-lotes.py dados/vilafahl-cfg2.json`: posições. As letras D, F, J, L vieram sem posição no PDF (corrigidas à mão);
   a ferramenta errou A1/A2 (pegou os da quadra C) e a faixa comercial R (lotes 1-22 com números em círculo amarelo) — corrigidos.
   Conferência visual com `vf-pinos.py` (área impressa ao lado de cada pino = área da tabela).
4. `overlay-norte.py dados/vilafahl-overlay-cfg.json` (perímetro magenta tracejado, dilata_mag 13) e `vf-gera.py` → linhas do mapa;
   `patch-mapa-bairro.py vilafahl ...`.
