# -*- coding: utf-8 -*-
# Despeja o texto de um PDF na tela. Uso: le-pdf.py <arquivo> [pag_ini] [pag_fim]
import sys
sys.stdout.reconfigure(encoding='utf-8')
from pypdf import PdfReader

arq = sys.argv[1]
r = PdfReader(arq)
ini = int(sys.argv[2]) if len(sys.argv) > 2 else 1
fim = int(sys.argv[3]) if len(sys.argv) > 3 else len(r.pages)
print('== %d paginas ==' % len(r.pages))
for i in range(ini - 1, min(fim, len(r.pages))):
    print('\n----- pagina %d -----' % (i + 1))
    print(r.pages[i].extract_text())
