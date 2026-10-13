# -*- coding: utf-8 -*-
# Reescreve em dados/ os insumos do passo 9 do LEIA-ME (<id>-bairro.txt e
# <id>-lotes.js) a partir do que ESTA no mapa, para os bairros pedidos.
#
# Por que existe: os *-atualiza.py mexem direto no mapa (sai lote, entra lote, muda
# condicao) e o `tab`/`sub` do bairro sao acertados a mao. Os arquivos de dados/
# ficam com a foto da primeira carga. Como o patch-mapa-bairro.py APAGA o bairro
# inteiro e reinsere o que esta nesses arquivos, rodar o passo 9 com a foto velha
# devolveria ao mapa lote que ja saiu, bounds anteriores ao encaixe a mao e um
# bairro sem `tab` nem `fechado`.
#
# Depois deste script,
#   patch-mapa-bairro.py <id> dados/<id>-bairro.txt dados/<id>-lotes.js "<comentario>"
# repoe exatamente o que o mapa tem hoje (so muda o lugar: fim dos arrays).
#
# Nao toca no mapa, nem em <id>-disp.json (esse sai do dominium-disp.py com o
# relatorio novo), nem nos arquivos de georreferenciamento (fit, quadras, bounds).
#
# Uso: python espelha-insumos-2026-10-12.py <id> [<id> ...] [--gravar]
import io, os, re, sys
sys.stdout.reconfigure(encoding='utf-8')

AQUI = os.path.dirname(os.path.abspath(__file__))
DADOS = os.path.join(AQUI, 'dados')
P = 'C:/Users/Usuario/Desktop/landing-page/mapa-lotes-indaiatuba/index.html'
ids = [a for a in sys.argv[1:] if not a.startswith('--')]
gravar = '--gravar' in sys.argv
assert ids, 'informe ao menos um id de bairro'

s = io.open(P, encoding='utf-8', newline='').read()
assert '\r' not in s, 'arquivo com CRLF'
ib = s.index('const BAIRROS = ['); fb = s.index('\n];', ib)
il = s.index('const LOTES = ['); fl = s.index('\n];', il)
bairros, lotes = s[ib:fb], s[il:fl + 1]


def le(caminho):
    return io.open(caminho, encoding='utf-8', newline='').read() if os.path.exists(caminho) else None


erro = False
for bid in ids:
    achou = re.findall(r"^ *(\{ id:'%s'[^\n]*)$" % re.escape(bid), bairros, re.M)
    if len(achou) != 1 or achou[0].count("{ id:'") != 1:
        print('%-14s PAROU: a linha do bairro em BAIRROS nao esta sozinha na linha (ou nao existe)' % bid)
        erro = True
        continue
    linha_bairro = achou[0].strip() + '\n'
    linhas = ['  ' + l.strip() for l in re.findall(r"^ *(\{ b:'%s'[^\n]*)$" % re.escape(bid), lotes, re.M)]
    if not linhas:
        print('%-14s PAROU: nenhum lote no mapa' % bid)
        erro = True
        continue
    texto_lotes = '\n'.join(linhas) + '\n'
    fb_, fl_ = os.path.join(DADOS, bid + '-bairro.txt'), os.path.join(DADOS, bid + '-lotes.js')
    antes_b, antes_l = le(fb_), le(fl_)
    n_antes = len([l for l in (antes_l or '').replace('\r', '').split('\n') if l.strip()])
    igual = (antes_b or '').replace('\r', '').strip() == linha_bairro.strip() and \
            [l.strip() for l in (antes_l or '').replace('\r', '').split('\n') if l.strip()] == [l.strip() for l in linhas]
    print('%-14s mapa: %4d lotes (%d sem pino) | dados/: %s lotes | %s'
          % (bid, len(linhas), sum(1 for l in linhas if 'll:[' not in l),
             n_antes if antes_l is not None else 'sem arquivo', 'ja igual ao mapa' if igual else 'DIFERENTE do mapa'))
    if gravar and not igual:
        io.open(fb_, 'w', encoding='utf-8', newline='').write(linha_bairro)
        io.open(fl_, 'w', encoding='utf-8', newline='').write(texto_lotes)
        assert le(fb_) == linha_bairro and le(fl_) == texto_lotes
        print('%-14s gravado: %s-bairro.txt e %s-lotes.js' % ('', bid, bid))

if erro:
    sys.exit(1)
if not gravar:
    print('\n(conferencia apenas — rode com --gravar para aplicar)')
