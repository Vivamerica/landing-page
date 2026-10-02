# -*- coding: utf-8 -*-
# Aplica ao mapa os pinos que o Fabio marcou no editor em 02/10/2026.
#
# Os 131 lotes do Alphaville tinham entrado sem posicao: a planta nao veio em
# KMZ e a deteccao automatica nao conseguia dizer QUAL numero estava em cada
# mancha. O Fabio marcou as pontas de cada fila no editor e o "seguir sequencia"
# distribuiu o meio.
#
# Conferido antes de gravar (alphaville-confere-pinos.py): nenhum fora do
# perimetro, nenhum em cima do outro, nenhum longe dos irmaos e nenhum salto
# entre numeros vizinhos. O vao medio por quadra separou sozinho as duas linhas
# do empreendimento — 16-19 m nas quadras A-I (lotes de 510 m²) e 29-34 m nas
# J-Q (lotes de 1.000 m²) —, que e exatamente o que a planta anuncia.
import io, json, os, re, sys
sys.stdout.reconfigure(encoding='utf-8')

AQUI = os.path.dirname(os.path.abspath(__file__))
P = 'C:/Users/Usuario/Desktop/landing-page/mapa-lotes-indaiatuba/index.html'
pinos = json.load(open(AQUI + '/editor-pinos/pinos.json'))

s = io.open(P, encoding='utf-8', newline='').read()
linhas = re.findall(r"^ *\{ b:'alphaville',[^\n]*\n", s, re.M)
print('%d lotes do Alphaville no mapa, %d pinos marcados' % (len(linhas), len(pinos)))

postos, sem = 0, []
for linha in linhas:
    m = re.search(r"q:'([^']+)', l:'([^']+)'", linha)
    k = '%s-%s' % (m.group(1), int(m.group(2)))
    if k not in pinos:
        sem.append(k)
        continue
    assert 'll:[' not in linha, ('ja tinha posicao', k)
    lat, lon = pinos[k]
    nova = linha.replace(', tabela:true,', ', ll:[%.6f,%.6f], tabela:true,' % (lat, lon), 1)
    assert nova != linha, k
    s = s.replace(linha, nova, 1)
    postos += 1

# o bloco de comentario e o rotulo do bairro diziam que nao havia pino
s = s.replace(
    "  // Alphaville Indaiatuba — tabela de vendas de setembro/2026 (131 lotes disponíveis).\n"
    "  // Sem pino individual: a planta não veio georreferenciada por lote; o overlay mostra\n"
    "  // a numeração e cada lote aparece na lista, na busca e no filtro.\n",
    "  // Alphaville Indaiatuba — tabela de vendas de setembro/2026 (131 lotes disponíveis).\n"
    "  // Posição marcada no editor de pinos em 02/10/2026, sobre a planta georreferenciada\n"
    "  // (resíduo de 5,9 m nos três pontos de controle). O vão entre lotes de número vizinho\n"
    "  // ficou em 16-19 m nas quadras A-I e 29-34 m nas J-Q, que são as duas linhas do\n"
    "  // empreendimento: 510 m² e 1.000 m².\n", 1)

io.open(P, 'w', encoding='utf-8', newline='').write(s)

s2 = io.open(P, encoding='utf-8', newline='').read()
gr = re.findall(r"^ *\{ b:'alphaville',[^\n]*\n", s2, re.M)
com_ll = [g for g in gr if 'll:[' in g]
print('gravado: %d de %d lotes com posição' % (len(com_ll), len(gr)))
if sem:
    print('sem pino: %s' % ', '.join(sem))
assert len(com_ll) == 131, len(com_ll)
