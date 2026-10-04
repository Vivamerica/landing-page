# -*- coding: utf-8 -*-
# Pente fino no Formulario de Referencia da Alphaville S.A. (versao 3, 30/06/2026),
# documento entregue a CVM — fonte primaria, auditada e datada.
#
# Por que aqui e nao no site institucional: a pagina de histórico do RI nao tem
# data de atualizacao e fala em "mais de 47 anos" para uma empresa de 1973, que
# hoje tem 53. Numero tirado de la entra velho no nosso blog. O FRE, nao.
#
# O script varre o documento atras das afirmacoes que servem ao artigo e imprime
# a FRASE INTEIRA de cada uma, para a citacao sair com contexto e nao recortada.
import re, sys
sys.stdout.reconfigure(encoding='utf-8')
from pypdf import PdfReader

PDF = 'C:/Users/Usuario/AppData/Local/Temp/alpha-cvm/FRE-2026-v3.pdf'
r = PdfReader(PDF)
paginas = [(i + 1, (p.extract_text() or '')) for i, p in enumerate(r.pages)]
texto = '\n'.join(t for _, t in paginas)
print('%d paginas, %d caracteres\n' % (len(paginas), len(texto)))

# o PDF quebra linha no meio das frases; junta para a busca por sentenca
limpo = re.sub(r'\s+', ' ', texto)

BUSCAS = [
    ('HISTORIA E FUNDACAO',      r'[^.]{0,200}(?:1973|fundad|Takaoka|Albuquerque)[^.]{0,200}\.'),
    ('PRESENCA GEOGRAFICA',      r'[^.]{0,200}(?:\d+\s*estados|Distrito Federal|munic[íi]pios|cidades)[^.]{0,200}\.'),
    ('EMPREENDIMENTOS',          r'[^.]{0,200}(?:empreendimentos lan[çc]ados|empreendimentos entregues|j[áa] lan[çc]ou|projetos lan[çc]ados)[^.]{0,200}\.'),
    ('AREA URBANIZADA',          r'[^.]{0,200}(?:milh[õo]es de m|hectares|m² de [áa]rea|[áa]rea urbanizada)[^.]{0,200}\.'),
    ('CLIENTES E MORADORES',     r'[^.]{0,200}(?:moradores|fam[íi]lias|clientes ativos|base de clientes)[^.]{0,200}\.'),
    ('LINHAS DE PRODUTO',        r'[^.]{0,200}(?:Terras Alpha|Jardim Alpha|Parque Alpha|linhas de produto)[^.]{0,200}\.'),
    ('BANCO DE TERRENOS / VGV',  r'[^.]{0,200}(?:banco de terrenos|landbank|VGV)[^.]{0,200}\.'),
    ('CONTROLE ACIONARIO',       r'[^.]{0,200}(?:controle|controlador|P[áa]tria|Blackstone|free float)[^.]{0,200}\.'),
    ('MARCA',                    r'[^.]{0,200}(?:marca Alphaville|reconhecimento de marca|IdeaBR)[^.]{0,200}\.'),
]

vistos = set()
for titulo, padrao in BUSCAS:
    achados = []
    for m in re.finditer(padrao, limpo, re.I):
        s = m.group(0).strip()
        if len(s) < 60:
            continue
        chave = s[:80]
        if chave in vistos:
            continue
        vistos.add(chave)
        achados.append(s)
    print('═' * 78)
    print(titulo)
    print('═' * 78)
    if not achados:
        print('  (nada)\n')
        continue
    for s in achados[:6]:
        print('  • %s\n' % s[:620])
