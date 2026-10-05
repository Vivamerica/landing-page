# -*- coding: utf-8 -*-
# Tabela Vista Verde recebida em 04/10/2026 — confere e aplica.
#
# A tabela cobre 5 loteamentos: Smart City, Jd. das Araras, Andorinhas,
# Vila dos Canários e Campo Bonito. Os quatro últimos já estão no mapa;
# Smart City não está.
#
# POR QUE CONFERIR ANTES. Já veio tabela da loteadora com a parcela calculada
# sem os juros que o próprio rodapé prometia (Zarah, 01/10). Então aqui cada
# linha é refeita por fora: o à vista a partir de metragem × preço do m², a
# entrada a 15% e a parcela pela Price. Só o que fecha é publicado.
#
# O rodapé diz "Parcelamento em 96x já contempla 1% de juros", mas o segundo
# bloco (LOTES DISPONIVEIS CAMPO BONITO) NÃO fecha em 96x — fecha em 12x. O
# script testa os dois prazos e diz qual é, em vez de confiar no rodapé.
import io, os, re, sys
sys.stdout.reconfigure(encoding='utf-8')

HTML = 'C:/Users/Usuario/Desktop/landing-page/mapa-lotes-indaiatuba/index.html'

# (bairro, quadra, lote, m2, tipo, pm2, vista, entrada, parcela)
# entrada/parcela None = "SÓ A VISTA" na tabela
T = [
 ('smartcity','32','4',   172.54,'AVENIDA',    1300.00,  224302.00, None, None),
 ('smartcity','11','1',   214.12,'COMERCIAL',  1300.00,  278356.00,  41753.40,  3845.46),
 ('smartcity','33','8',   302.69,'MISTO',      1100.00,  332959.00,  49943.85,  4599.80),
 ('smartcity','38','22',  238.49,'COMERCIAL',  1250.00,  298112.50,  44716.88,  4118.40),
 ('smartcity','44','1',   256.62,'COMERCIAL',  1250.00,  320775.00,  48116.25,  4431.48),
 ('smartcity','47','1',   243.07,'COMERCIAL',  1250.00,  303837.50,  45575.63,  4197.49),
 ('smartcity','54','25',  328.47,'COMERCIAL',  1250.00,  410587.50,  61588.13,  5672.23),
 ('smartcity','56','17',  297.23,'RESIDENCIAL',1133.33,  336860.66,  50529.10,  4653.70),

 ('araras','13','30',     255.19,'COMERCIAL',  1500.00,  382785.00,  57417.75,  5288.14),
 ('araras','15','1',      217.43,'COMERCIAL',  1300.00,  282659.00, None, None),
 ('araras','17','1',     1393.10,'MISTO',      1000.00, 1393100.00, 208965.00, 19245.56),
 ('araras','17','2',     1500.00,'MISTO',      1000.00, 1500000.00, 225000.00, 20722.37),
 ('araras','17','3',     1500.00,'MISTO',      1000.00, 1500000.00, 225000.00, 20722.37),
 ('araras','18','6',     1500.00,'MISTO',      1000.00, 1500000.00, 225000.00, 20722.37),
 ('araras','18','7',     1564.31,'MISTO',      1000.00, 1564310.00, 234646.50, 21610.81),
 ('araras','19','1',     1924.50,'MISTO',      1000.00, 1924500.00, 288675.00, 26586.80),
 ('araras','19','2',     1500.00,'MISTO',      1000.00, 1500000.00, 225000.00, 20722.37),
 ('araras','19','3',     1500.00,'MISTO',      1000.00, 1500000.00, 225000.00, 20722.37),

 ('andorinhas','E','11',  210.65,'MISTO',      1300.00,  273845.00,  41076.75,  3783.15),
 ('andorinhas','E','12',  213.15,'MISTO',      1300.00,  277095.00,  41564.25,  3828.04),

 ('canarios','A','1',     227.95,'RESIDENCIAL',1200.00,  273540.00,  41031.00,  3778.93),
 ('canarios','A','16',    225.73,'RESIDENCIAL',1200.00,  270876.00,  40631.40,  3742.13),
 ('canarios','D','17',    201.20,'RESIDENCIAL',1200.00,  241440.00,  36216.00,  3335.47),

 ('campobonito','A','7C-1',1675.73,'GLEBA',    1300.00, 2178449.00, 326767.35, 30095.09),
 ('campobonito','A','7C-2',1675.73,'GLEBA',    1300.00, 2178449.00, 326767.35, 30095.09),
 ('campobonito','A','7-E2',1578.60,'GLEBA',    1300.00, 2052167.00, 307825.05, 28350.51),
 ('campobonito','27','52', 153.50,'MISTO',     1450.00,  222575.00,  33386.25, 16809.19),
 ('campobonito','27','53', 153.50,'MISTO',     1450.00,  222575.00,  33386.25, 16809.19),
 ('campobonito','27','54', 153.50,'MISTO',     1450.00,  222575.00,  33386.25, 16809.19),
 ('campobonito','28','22', 151.20,'MISTO',     1450.00,  219240.00,  32886.00, 16557.33),
]

JURO, EP = 0.01, 0.15


def price(saldo, n, i=JURO):
    return saldo * i / (1 - (1 + i) ** -n)


print('CONFERENCIA DA TABELA VISTA VERDE — 04/10/2026')
print('%-12s %-5s %-6s %10s %10s %12s %7s  %s'
      % ('bairro', 'q', 'lote', 'a vista', 'entrada', 'parcela', 'prazo', 'veredito'))
erros, prazos = [], {}
for b, q, l, m2, tp, pm2, vista, ent, par in T:
    obs = []
    calc = round(m2 * pm2, 2)
    if abs(calc - vista) > 1.0:
        obs.append('a vista nao bate: %s x %s = %.2f' % (m2, pm2, calc))
    if ent is None:
        print('%-12s %-5s %-6s %10.2f %10s %12s %7s  so a vista' % (b, q, l, vista, '-', '-', '-'))
        continue
    if abs(vista * EP - ent) > 1.0:
        obs.append('entrada nao e 15%%: esperava %.2f' % (vista * EP))
    saldo = vista - ent
    # testa os prazos plausiveis e fica com o que fecha
    n_ok = next((n for n in (96, 60, 48, 36, 24, 12) if abs(price(saldo, n) - par) < 2.0), None)
    if n_ok is None:
        obs.append('parcela nao fecha em prazo nenhum a 1%% (96x daria %.2f)' % price(saldo, 96))
    else:
        prazos.setdefault(b, set()).add(n_ok)
    print('%-12s %-5s %-6s %10.2f %10.2f %12.2f %6sx  %s'
          % (b, q, l, vista, ent, par, n_ok or '??', 'ok' if not obs else ' | '.join(obs)))
    if obs:
        erros.append((b, q, l, obs))

print()
for b, ns in sorted(prazos.items()):
    print('  %-12s prazo(s) que fecham: %s' % (b, ', '.join('%dx' % n for n in sorted(ns))))
print()
print('%d linhas conferidas, %d com divergencia' % (len(T), len(erros)))
if erros:
    for b, q, l, o in erros:
        print('  !! %s %s/%s: %s' % (b, q, l, ' | '.join(o)))
