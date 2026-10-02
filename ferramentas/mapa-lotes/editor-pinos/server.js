// Servidor do editor de pinos do Alphaville. Porta 8768.
//   /              -> editor
//   /dados.json    -> lotes + sugestoes (gerado por gera-dados.py)
//   /pinos.json    -> o que ja foi marcado (volta ao recarregar a pagina)
//   /img/<arq>     -> imagens do mapa (a planta do Alphaville)
//   /leaflet/*     -> Leaflet, servido de onde o mapa ja usa
//   POST /salvar   -> grava pinos.json e uma copia com data e hora
const http = require('http'), fs = require('fs'), path = require('path');
const AQUI = __dirname;
const IMG = 'C:/Users/Usuario/Desktop/landing-page/mapa-lotes-indaiatuba/images';
const LEAFLET = path.join(AQUI, '..', 'ajuste', 'leaflet');
const TIPO = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml' };

function envia(res, arq) {
  fs.readFile(arq, (e, d) => {
    if (e) { res.writeHead(404); return res.end('nao encontrado: ' + arq); }
    res.writeHead(200, { 'Content-Type': TIPO[path.extname(arq).toLowerCase()] || 'application/octet-stream',
      'Cache-Control': 'no-store' });
    res.end(d);
  });
}

http.createServer((req, res) => {
  const u = decodeURIComponent(req.url.split('?')[0]);
  if (req.method === 'POST' && u === '/salvar') {
    let body = '';
    req.on('data', c => body += c);
    req.on('end', () => {
      try {
        const o = JSON.parse(body);
        const n = Object.keys(o).length;
        fs.writeFileSync(path.join(AQUI, 'pinos.json'), JSON.stringify(o, null, 1));
        const sel = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
        fs.writeFileSync(path.join(AQUI, 'historico-' + sel + '.json'), JSON.stringify(o));
        res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end(n + ' pinos gravados em pinos.json');
        console.log(new Date().toLocaleTimeString('pt-BR') + '  ' + n + ' pinos');
      } catch (e) {
        res.writeHead(400); res.end('json invalido: ' + e.message);
      }
    });
    return;
  }
  if (u === '/' || u === '/index.html') return envia(res, path.join(AQUI, 'index.html'));
  if (u === '/dados.json') return envia(res, path.join(AQUI, 'dados.json'));
  if (u === '/pinos.json') return envia(res, path.join(AQUI, 'pinos.json'));
  if (u.startsWith('/img/')) return envia(res, path.join(IMG, u.slice(5)));
  if (u.startsWith('/leaflet/')) return envia(res, path.join(LEAFLET, u.slice(9)));
  res.writeHead(404); res.end('nao encontrado');
}).listen(8768, () => console.log('editor de pinos: http://127.0.0.1:8768'));
