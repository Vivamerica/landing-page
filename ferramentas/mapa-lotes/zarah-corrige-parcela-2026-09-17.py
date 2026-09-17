# -*- coding: utf-8 -*-
# Parque Zarah (17/09/2026): a parcela do mapa estava (total - ato) / 180, SEM juros. A tabela Zarin já traz a parcela
# mensal com juros de 1% a.m. (Price) e o "VALOR TOTAL" é o valor de tabela (ato 12% + saldo financiado), não à vista.
# Corrige: parcela = MENSAL da tabela; tira "prazo" (repetia o valor); marca tabela:true (popup mostra "valor de tabela").
# Uso: python zarah-corrige-parcela-2026-09-17.py <zarah-set-tabela.json de zarah-tabela.py>
import json, re, sys
sys.stdout.reconfigure(encoding='utf-8')
P = 'C:/Users/Usuario/Desktop/landing-page/mapa-lotes-indaiatuba/index.html'
tab = {(d['fase'], str(d['q']), str(d['l'])): d for d in json.load(open(sys.argv[1]))}
FASE = {'zarah-safira': 1, 'zarah-rubi': 2, 'zarah-perola': 3}
OBS = ("Valor de tabela Zarin de set/2026: ato de 12% e saldo em 180 parcelas com juros de 1% a.m. (Price) "
       "e correção mensal pelo IPCA; consulte a condição à vista")
s = open(P, encoding='utf-8', newline='').read()
n = 0
def troca(m):
    global n
    ln = m.group(0)
    b = re.search(r"b:'([^']+)'", ln).group(1); q = re.search(r"q:'([^']+)'", ln).group(1); l = re.search(r"l:'([^']+)'", ln).group(1)
    d = tab[(FASE[b], q, l)]
    vista = float(re.search(r"vista:([\d.]+)", ln).group(1)); ent = float(re.search(r"entrada:([\d.]+)", ln).group(1))
    assert abs(vista - d['total']) < 0.01 and abs(ent - d['ato']) < 0.01, (b, q, l, vista, d)
    ln = re.sub(r", prazo:[\d.]+", '', ln)
    ln = re.sub(r"parcela:[\d.]+", 'parcela:%.2f' % d['mensal'], ln)
    ln = re.sub(r"obs:'[^']*'", "tabela:true, obs:'%s'" % OBS, ln)
    n += 1
    return ln
s = re.sub(r"^ *\{ b:'zarah-(?:safira|rubi|perola)'[^\n]*$", troca, s, flags=re.M)
# condições do bairro
s = s.replace("cond:'ato de 12% + 180 parcelas mensais, tabela Zarin de set/2026'",
              "cond:'ato de 12% e saldo em 180 parcelas com juros de 1% a.m. (Price) e IPCA mensal, tabela Zarin de set/2026'")
# popup: valor de tabela x à vista
a = "${temPreco(x) ? brl(x.vista) + ' <small>à vista</small>' : 'Preço sob consulta'}"
b = "${temPreco(x) ? brl(x.vista) + (x.tabela ? ' <small>valor de tabela</small>' : ' <small>à vista</small>') : 'Preço sob consulta'}"
assert a in s
s = s.replace(a, b, 1)
a = "'Preço à vista de ' + (b.tab || 'set/2026')"
b = "(x.tabela ? 'Valor de tabela de ' : 'Preço à vista de ') + (b.tab || 'set/2026')"
assert a in s
s = s.replace(a, b, 1)
assert s.count("tabela Zarin de set/2026'") >= 3 and 'juros de 1% a.m. (Price) e IPCA mensal' in s
open(P, 'w', encoding='utf-8', newline='').write(s)
print(n, 'lotes do Zarah corrigidos')
