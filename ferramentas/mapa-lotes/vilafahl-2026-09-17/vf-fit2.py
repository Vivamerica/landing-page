import json, math, os, sys
sys.stdout.reconfigure(encoding='utf-8')
exec(open('C:/Users/Usuario/Desktop/landing-page/ferramentas/mapa-lotes/utm.py', encoding='utf-8').read())
D = os.environ['TEMP'] + '/mapas/'
f = json.load(open(D + 'vilafahl/vilafahl-fit.json'))
t = math.radians(f['theta_deg']); s = f['s']
fit = {'E': [s*math.cos(t), s*math.sin(t), f['E0']], 'N': [-s*math.sin(t), s*math.cos(t), f['N0']],
       'fonte': 'grade UTM de 100 m desenhada na planta (22 linhas vetoriais, 283,46 pt = 100 m = 1:1000, girada 9,81 graus) + torre 17-01 E=268764,085 N=7444609,444 (residuo ~1 m); coords = pt da pagina, y para cima'}
json.dump(fit, open(D + 'vilafahl-fit.json', 'w'), indent=1)
print(ll2utm(-23.088206, -47.251356))
for p in ((665.3, 554.4), (1500, 1500), (2500, 2000)):
    E = fit['E'][0]*p[0] + fit['E'][1]*p[1] + fit['E'][2]; N = fit['N'][0]*p[0] + fit['N'][1]*p[1] + fit['N'][2]
    print(p, round(E, 1), round(N, 1), utm2ll(E, N))
