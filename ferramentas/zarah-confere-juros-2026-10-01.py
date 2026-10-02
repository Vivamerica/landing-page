# -*- coding: utf-8 -*-
# Zarah: a tabela de 01/10/2026 19:38 corrigiu os juros? (conferencia lote a lote)
#
# CONTEXTO: a tabela de outubro entregue as 14:12 trazia a mensal pela METADE da
# anterior enquanto o valor total subia, e os componentes somavam EXATO ao total —
# ou seja, sem juros — apesar da nota de rodape dizer que todas as parcelas ja
# estao calculadas com juros de 1% a.m. na Tabela Price. O mapa ficou sem subir
# por causa disso. O Fabio pediu a tabela de novo e mandou esta.
#
# TESTE: para cada lote, a mensal publicada tem de ser igual a parcela Price de
# (total - ato) em 180 meses a 1% a.m. Se a divergencia for zero em todos, a
# tabela esta corrigida. Comparo as duas lado a lado para mostrar o que mudou.
import sys, re, io
sys.stdout.reconfigure(encoding='utf-8')
from pypdf import PdfReader

NOVA = 'C:/Users/Usuario/Downloads/20261001193835_6abee0eb05b64.pdf'
VELHA = 'C:/Users/Usuario/Downloads/PARQUE_ZARAH_TABELA_PARQUE_ZARAH_OUTUBRO_180X.pdf'

I, N = 0.01, 180
# fator da Tabela Price: PMT = PV * i / (1 - (1+i)^-n)
FATOR = I / (1 - (1 + I) ** -N)


def num(s):
    return float(s.replace('.', '').replace(',', '.'))


def lotes(caminho):
    txt = '\n'.join(p.extract_text() for p in PdfReader(caminho).pages)
    txt = re.sub(r'\s+', ' ', txt)
    # FASE n - NOME QUADRA qq ll area m2 TIPO ... Disponivel R$ total R$ ato R$ mensal
    rx = re.compile(
        r'FASE (\d) - (\w+) QUADRA (\d+) (\d+) ([\d.,]+) m² (\w+).*?'
        r'Dispon[ií]vel R\$ ([\d.,]+) R\$ ([\d.,]+) R\$ ([\d.,]+)')
    out = {}
    for m in rx.finditer(txt):
        fase, nome, q, l, area, tipo, total, ato, mensal = m.groups()
        out['Q%s-L%s' % (q, l)] = {
            'fase': fase, 'nucleo': nome, 'q': q, 'l': l, 'm2': num(area), 'tipo': tipo,
            'total': num(total), 'ato': num(ato), 'mensal': num(mensal)}
    return out


nova, velha = lotes(NOVA), lotes(VELHA)
print('lotes lidos — nova: %d   anterior: %d' % (len(nova), len(velha)))

# ── a mensal publicada confere com a Tabela Price de 1% a.m.? ───────
def confere(tab, rotulo):
    ruins, pct_ato = [], set()
    for k, x in tab.items():
        saldo = x['total'] - x['ato']
        esperado = round(saldo * FATOR, 2)
        if abs(esperado - x['mensal']) > 0.02:
            ruins.append((k, x['mensal'], esperado))
        pct_ato.add(round(x['ato'] / x['total'] * 100, 2))
    print('\n%s' % rotulo)
    print('  ato: %s%% do total' % sorted(pct_ato))
    if ruins:
        print('  SEM JUROS / divergente em %d de %d lotes. Exemplos:' % (len(ruins), len(tab)))
        for k, pub, esp in ruins[:4]:
            print('    %-10s publicado R$ %10.2f   Price 1%% a.m. R$ %10.2f   (%.0f%% do devido)'
                  % (k, pub, esp, pub / esp * 100))
        # sem juros seria o saldo dividido em 180
        k, pub, esp = ruins[0]
        x = tab[k]
        print('    %s sem juros nenhum daria R$ %.2f (saldo / 180)' % (k, (x['total'] - x['ato']) / N))
    else:
        print('  OK: os %d lotes batem com a Tabela Price de 1%% a.m., centavo a centavo.' % len(tab))
    return not ruins


ok_velha = confere(velha, 'TABELA DAS 14:12 (a que travou a publicacao)')
ok_nova = confere(nova, 'TABELA DAS 19:38 (a que o Fabio acabou de mandar)')

# ── o que mudou de uma para a outra ─────────────────────────────────
print('\n── comparacao lote a lote ──')
iguais_total = sum(1 for k in nova if k in velha and abs(nova[k]['total'] - velha[k]['total']) < .01)
print('  mesmo VALOR TOTAL em %d de %d lotes em comum' % (iguais_total, len(set(nova) & set(velha))))
amostra = [k for k in ('Q03-L31', 'Q29-L10', 'Q03-L23') if k in nova and k in velha]
for k in amostra:
    a, b = velha[k], nova[k]
    print('  %-9s total R$ %10.2f -> R$ %10.2f | ato R$ %9.2f -> R$ %9.2f | mensal R$ %8.2f -> R$ %8.2f'
          % (k, a['total'], b['total'], a['ato'], b['ato'], a['mensal'], b['mensal']))

so_nova = sorted(set(nova) - set(velha))
so_velha = sorted(set(velha) - set(nova))
print('  so na nova: %d %s' % (len(so_nova), so_nova[:8]))
print('  sairam:     %d %s' % (len(so_velha), so_velha[:8]))

print('\nVEREDITO:', 'tabela CORRIGIDA' if (ok_nova and not ok_velha) else
      ('as duas ja estavam certas' if ok_nova else 'AINDA divergente'))
