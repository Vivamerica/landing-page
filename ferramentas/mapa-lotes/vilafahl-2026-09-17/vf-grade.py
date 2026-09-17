import sys, math, os, json
from pypdf import PdfReader
from pypdf.generic import ContentStream
sys.stdout.reconfigure(encoding='utf-8')
p = PdfReader('C:/Users/Usuario/Downloads/Vila Fahl/PDF MAPA Vila Fahl.pdf').pages[0]
cs = ContentStream(p.get_contents(), p.pdf)
def mul(a, b):
    return [a[0]*b[0]+a[1]*b[2], a[0]*b[1]+a[1]*b[3], a[2]*b[0]+a[3]*b[2], a[2]*b[1]+a[3]*b[3], a[4]*b[0]+a[5]*b[2]+b[4], a[4]*b[1]+a[5]*b[3]+b[5]]
ctm = [1,0,0,1,0,0]; pilha = []; cur = None; start = None; segs = []; col = None; lw = None
def T(x, y): return (x*ctm[0]+y*ctm[2]+ctm[4], x*ctm[1]+y*ctm[3]+ctm[5])
path = []
n = 0
for ops, op in cs.operations:
    n += 1
    if op == b'q': pilha.append(ctm[:])
    elif op == b'Q': ctm = pilha.pop() if pilha else ctm
    elif op == b'cm': ctm = mul([float(v) for v in ops], ctm)
    elif op in (b'RG', b'G', b'K'): col = tuple(round(float(v), 3) for v in ops)
    elif op == b'w': lw = float(ops[0])
    elif op == b'm': cur = T(float(ops[0]), float(ops[1])); start = cur
    elif op == b'l':
        nx = T(float(ops[0]), float(ops[1]))
        if cur: path.append((cur, nx))
        cur = nx
    elif op in (b'S', b's'):
        for a, b in path:
            L = math.hypot(b[0]-a[0], b[1]-a[1])
            if L > 800: segs.append((a, b, L, col, lw))
        path = []
    elif op in (b'n', b'f', b'F', b'f*', b'B', b'B*', b'b', b'b*'):
        path = []
print('ops', n, 'longos', len(segs))
from collections import Counter
print(Counter((round(math.degrees(math.atan2(b[1]-a[1], b[0]-a[0])) % 180, 1), c, w) for a, b, L, c, w in segs).most_common(20))
json.dump(segs, open(os.environ['TEMP'] + '/mapas/vilafahl/longos.json', 'w'))
