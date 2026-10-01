# -*- coding: utf-8 -*-
# Relação dos lançamentos a partir da FONTE ÚNICA, com a data da tabela ou do
# relatório de estoque que cada landing cita hoje. Serve para saber o que está
# velho e cobrar a tabela nova.
#
# Uso: python ferramentas/relacao-lancamentos.py
import io, json, os, re, sys
sys.stdout.reconfigure(encoding='utf-8')

R = 'C:/Users/Usuario/Desktop/landing-page/'
src = io.open(R + 'gera-folheto.js', encoding='utf-8', newline='').read()

ASPA = chr(39)
TXT = re.compile(r"%s:" + ASPA + r"([^" + ASPA + r"]*)" + ASPA)
NUM = re.compile(r"%s:([0-9.]+)")


def lista(nome):
    i = src.index('const ' + nome + ' = [')
    j = src.index(chr(10) + '];', i)
    out = []
    for m in re.finditer(r"\{([^{}]*)\}", src[i:j]):
        b, d = m.group(1), {}
        for k in ('n', 'c', 'slug', 't', 's'):
            r = re.search(TXT.pattern % k, b)
            if r:
                d[k] = r.group(1)
        for k in ('p', 'm2', 'est'):
            r = re.search(NUM.pattern % k, b)
            if r:
                d[k] = float(r.group(1))
        if d.get('slug'):
            out.append(d)
    return out


APT, LOT = lista('APTOS'), lista('LOTES')

# a data mais recente que a página cita junto de "tabela", "estoque" ou "relatório"
PERTO = re.compile(r"(?:tabela|estoque|relat[óo]rio|disponibilidade)[^.<]{0,60}?([0-9]{2}/[0-9]{2}/[0-9]{4})", re.I)
QUALQUER = re.compile(r"([0-9]{2}/[0-9]{2}/[0-9]{4})")
MES = re.compile(r"(?:tabela|estoque|relat[óo]rio)[^.<]{0,40}?((?:jan|fev|mar|abr|mai|jun|jul|ago|set|out|nov|dez)/20[0-9]{2})", re.I)


def chave(d):
    return tuple(int(x) for x in d.split('/')[::-1])


def data_da_tabela(slug):
    p = R + slug + '/index.html'
    if not os.path.isfile(p):
        return None, 'sem landing'
    t = io.open(p, encoding='utf-8', newline='').read()
    # comentarios de CSS e de HTML guardam datas de manutencao: fora
    t = re.sub(r"<script[\s\S]*?</script>", ' ', t)
    t = re.sub(r"<style[\s\S]*?</style>", ' ', t)
    t = re.sub(r"<!--[\s\S]*?-->", ' ', t)
    datas = PERTO.findall(t)
    if datas:
        return max(set(datas), key=chave), 'dia'
    datas = QUALQUER.findall(t)
    if datas:
        return max(set(datas), key=chave), 'dia (aproximado)'
    meses = MES.findall(t)
    if meses:
        return meses[0], 'mês'
    return None, 'não achei'


saida = []
for grupo, itens in (('Apartamento', APT), ('Lote', LOT)):
    for e in itens:
        d, origem = data_da_tabela(e['slug'])
        saida.append(dict(grupo=grupo, n=e.get('n', ''), c=e.get('c', ''), slug=e['slug'],
                          t=e.get('t', ''), p=e.get('p'), est=e.get('est'), data=d, origem=origem))

json.dump(saida, io.open(os.environ['TEMP'] + '/relacao.json', 'w', encoding='utf-8'), ensure_ascii=False)

MESES = dict(jan=1, fev=2, mar=3, abr=4, mai=5, jun=6, jul=7, ago=8, set=9, out=10, nov=11, dez=12)


def ordem(x):
    d = x['data']
    if not d:
        return (0, 0, 0)
    if len(d) == 10:
        return chave(d)
    m, ano = d.split('/')          # "set/2026": conta como dia 1 do mes
    return (int(ano), MESES[m.lower()], 1)
saida.sort(key=ordem)
print('%-32s %-18s %-12s %-10s %s' % ('EMPREENDIMENTO', 'CONSTRUTORA', 'TABELA', 'ESTOQUE', 'TIPO'))
print('-' * 92)
for x in saida:
    print('%-32s %-18s %-12s %-10s %s' % (x['n'][:32], (x['c'] or '')[:18], x['data'] or '—',
                                          ('%d' % x['est']) if x['est'] else '—', x['t']))
print()
print('%d lançamentos na fonte única (%d apartamentos, %d lotes)' % (len(saida), len(APT), len(LOT)))
