# -*- coding: utf-8 -*-
# Dossie Alphaville a partir dos documentos entregues a CVM.
#
# Varre todos os PDFs baixados do repositorio de arquivamentos da Alphaville S.A.
# e recolhe as frases que sustentam numero publicavel. Cada achado sai com o
# documento e a data de origem — sem isso nao vai para o artigo.
#
# Os documentos (baixados em 04/10/2026):
#   FRE-v6-2026    Formulario de Referencia versao 6, 03/07/2026
#   FRE-2024/2020  versoes anteriores, para ver o numero se mexendo no tempo
#   ITR-2T26       informacoes trimestrais, 13/08/2026
#   ITR-4T25       fechamento de 2025, 31/03/2026
#   Prospecto-IPO  prospecto da oferta publica, 05/11/2020
#   Release-*      releases de resultados
#   Relatorio-Social-2020  Fundacao Alphaville
import json, os, re, sys
sys.stdout.reconfigure(encoding='utf-8')
from pypdf import PdfReader

DIR = 'C:/Users/Usuario/AppData/Local/Temp/alpha-cvm/'
SAIDA = 'C:/Users/Usuario/Desktop/landing-page/ferramentas/alphaville-cvm-achados.json'

DATAS = {
    'FRE-v6-2026': 'Formulário de Referência v6, 03/07/2026',
    'FRE-2024': 'Formulário de Referência 2024, 03/12/2024',
    'FRE-2020': 'Formulário de Referência 2020, 19/05/2021',
    'FRE-2026-v3': 'Formulário de Referência v3, 30/06/2026',
    'ITR-2T26': 'ITR 2T26, 13/08/2026',
    'ITR-4T25': 'ITR 4T25, 31/03/2026',
    'Prospecto-IPO': 'Prospecto Preliminar da oferta pública, 05/11/2020',
    'Release-2020': 'Release de Resultados 2020, 29/03/2021',
    'Release-4T23': 'Release de Resultados 4T23, 29/03/2024',
    'Relatorio-Social-2020': 'Relatório Social da Fundação Alphaville 2020, 05/11/2021',
}

TEMAS = [
    ('fundacao',      r'[^.]{0,230}(?:1973|Renato Albuquerque|Yojiro Takaoka|Fazenda Tambor)[^.]{0,230}\.'),
    ('escala',        r'[^.]{0,230}(?:j[áa] entregou|empreendimentos em mais de|\d+\s*\(?\w*\)?\s*estados|Distrito Federal)[^.]{0,230}\.'),
    ('produtos',      r'[^.]{0,230}(?:Terras Alpha|Jardim Alpha|Reserva Alpha|lotes a partir de \d+\s*m|lote m[ée]dio)[^.]{0,230}\.'),
    ('entregas',      r'[^.]{0,230}(?:entregou \d|empreendimentos entregues|projetos entregues|Record em entrega)[^.]{0,230}\.'),
    ('cidades_alpha', r'[^.]{0,230}(?:Cidades? Alpha)[^.]{0,230}\.'),
    ('marca',         r'[^.]{0,230}(?:marca .{0,12}Alphaville|reconhecimento de marca|IdeaBR|top of mind)[^.]{0,230}\.'),
    ('associacao',    r'[^.]{0,230}(?:Associa[çc][õo]es de Moradores|associa[çc][ãa]o de moradores)[^.]{0,230}\.'),
    ('sustentavel',   r'[^.]{0,230}(?:[áa]rea verde|APP|reserva legal|Selo Alpha|preserva[çc][ãa]o)[^.]{0,230}\.'),
    ('fundacao_social', r'[^.]{0,230}(?:Funda[çc][ãa]o Alphaville)[^.]{0,230}\.'),
    ('controle',      r'[^.]{0,230}(?:P[áa]tria|Blackstone|Gafisa|controle acion[áa]rio|free float)[^.]{0,230}\.'),
]

achados = {}
for arq in sorted(os.listdir(DIR)):
    if not arq.endswith('.pdf'):
        continue
    nome = arq[:-4]
    fonte = DATAS.get(nome, nome)
    try:
        r = PdfReader(DIR + arq)
        t = re.sub(r'\s+', ' ', '\n'.join((p.extract_text() or '') for p in r.pages))
    except Exception as e:
        print('  %-24s ERRO: %s' % (nome, e))
        continue
    print('%-24s %4d paginas, %7d caracteres' % (nome, len(r.pages), len(t)))
    for tema, pad in TEMAS:
        for m in re.finditer(pad, t, re.I):
            s = ' '.join(m.group(0).split())
            if len(s) < 70:
                continue
            achados.setdefault(tema, [])
            if any(s[:90] == x['frase'][:90] for x in achados[tema]):
                continue
            achados[tema].append({'frase': s[:700], 'fonte': fonte})

json.dump(achados, open(SAIDA, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
print('\n%d temas, %d frases -> %s' % (len(achados), sum(len(v) for v in achados.values()), SAIDA))
for tema, v in achados.items():
    print('   %-18s %d' % (tema, len(v)))
