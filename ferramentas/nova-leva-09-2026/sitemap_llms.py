# -*- coding: utf-8 -*-
"""Acrescenta a landing ao sitemap.xml e ao llms.txt e recalcula os contadores do llms.txt pela fonte única.

Uso: python sitemap_llms.py configs/<slug>.json
Lê do config: "llms": {"secao": "apartamentos" | "condominios" | "loteamentos", "linha": "texto sem o link"}
Idempotente.
"""
import json, re, sys, subprocess, datetime
sys.stdout.reconfigure(encoding='utf-8')
R = 'C:/Users/Usuario/Desktop/landing-page/'
BASE = 'https://lancamentos.imoveisvivamerica.com.br/'
HOJE = datetime.date.today().isoformat()
c = json.load(open(sys.argv[1], encoding='utf-8'))
slug, nome = c['slug'], c['nome']


def ler(p):
    s = open(p, encoding='utf-8', newline='').read()
    return s.replace('\r\n', '\n'), '\r\n' in s


def gravar(p, s, crlf):
    open(p, 'w', encoding='utf-8', newline='').write(s.replace('\n', '\r\n') if crlf else s)


# sitemap
s, crlf = ler(R + 'sitemap.xml')
if BASE + slug + '/' not in s:
    i = s.rindex('</urlset>')
    s = s[:i] + ('  <url>\n    <loc>%s%s/</loc>\n    <lastmod>%s</lastmod>\n    <changefreq>weekly</changefreq>\n'
                 '    <priority>0.9</priority>\n  </url>\n' % (BASE, slug, HOJE)) + s[i:]
    gravar(R + 'sitemap.xml', s, crlf)
    print('sitemap: +', slug)
else:
    print('sitemap: já tinha', slug)

# llms.txt
t, crlf = ler(R + 'llms.txt')
if BASE + slug + '/' not in t:
    titulo = {'apartamentos': '## Apartamentos', 'condominios': '## Condomínios fechados de lotes',
              'loteamentos': '## Loteamentos abertos'}[c['llms']['secao']]
    i = t.index(titulo)
    fim = t.index('\n## ', i + 1)
    bloco = t[i:fim].rstrip('\n')
    bloco += '\n- [%s](%s%s/): %s' % (nome, BASE, slug, c['llms']['linha'])
    t = t[:i] + bloco + '\n' + t[fim:]
    print('llms.txt: +', slug)
else:
    print('llms.txt: já tinha', slug)

# contadores pela fonte única
src = open(R + 'gera-folheto.js', encoding='utf-8').read()
def conta(nomelista):
    ini = src.index('const %s = [' % nomelista)
    fim = src.index('\n];', ini)
    bloco = src[ini:fim]
    return len(re.findall(r"slug:'", bloco)), len(re.findall(r"\bp:\d", bloco))
na, pa = conta('APTOS')
nl, pl = conta('LOTES')
tot = na + nl
t = re.sub(r'Portfólio nesta atualização \([^)]*\): \d+ empreendimentos — \d+ apartamentos e \d+ loteamentos',
           'Portfólio nesta atualização (%s): %d empreendimentos — %d apartamentos e %d loteamentos' % (
               datetime.date.today().strftime('%d/%m/%Y'), tot, na, nl), t)
t = re.sub(r'(## Apartamentos \([^)]*\)) — \d+ empreendimentos', r'\1 — %d empreendimentos' % na, t)
t = re.sub(r'os \d+ empreendimentos monitorados \(\d+ com preço', 'os %d empreendimentos monitorados (%d com preço' % (tot, pa + pl), t)
gravar(R + 'llms.txt', t, crlf)
print('contadores: %d empreendimentos (%d aptos, %d lotes), %d com preço' % (tot, na, nl, pa + pl))
