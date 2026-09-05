// Servidor do editor de plantas (base de teste). Porta 8767.
//   /            -> editor
//   /plantas.json, /leaflet/*  -> arquivos do editor
//   /img/<arq>   -> imagens do mapa (landing-page/mapa-lotes-indaiatuba/images)
//   /mapa/       -> o mapa de verdade, para conferir
//   POST /salvar -> grava ajustes.json (e uma cópia com data/hora)
const http = require('http'), fs = require('fs'), path = require('path');
const AJ = path.join(__dirname, 'ajuste');
const IMG = 'C:/Users/Usuario/Desktop/landing-page/mapa-lotes-indaiatuba/images';
const MAPA = 'C:/Users/Usuario/Desktop/landing-page';
const TIPO = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.webp': 'image/webp', '.ico': 'image/x-icon', '.xml': 'application/xml', '.txt': 'text/plain; charset=utf-8', '.pdf': 'application/pdf' };
function envia(res, arq) {
  fs.readFile(arq, (e, dados) => {
    if (e) { res.writeHead(404); return res.end('nao encontrado: ' + arq); }
    res.writeHead(200, { 'Content-Type': TIPO[path.extname(arq).toLowerCase()] || 'application/octet-stream', 'Cache-Control': 'no-store' });
    res.end(dados);
  });
}
http.createServer((req, res) => {
  const u = decodeURIComponent(req.url.split('?')[0]);
  if (req.method === 'POST' && u === '/salvar') {
    let corpo = '';
    req.on('data', c => { corpo += c; if (corpo.length > 8e6) req.destroy(); });
    req.on('end', () => {
      try {
        const j = JSON.parse(corpo);
        const carimbo = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
        fs.writeFileSync(path.join(AJ, 'ajustes.json'), JSON.stringify(j, null, 1), 'utf8');
        fs.writeFileSync(path.join(AJ, 'ajustes-' + carimbo + '.json'), JSON.stringify(j, null, 1), 'utf8');
        console.log('salvo', carimbo, Object.keys(j.plantas || {}).length, 'plantas');
        res.writeHead(200, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ ok: true, quando: carimbo }));
      } catch (e) { res.writeHead(400); res.end(String(e)); }
    });
    return;
  }
  if (u === '/' || u === '/index.html') return envia(res, path.join(AJ, 'index.html'));
  if (u.startsWith('/img/')) return envia(res, path.join(IMG, path.basename(u)));
  if (u.startsWith('/mapa/')) {
    let p = path.join(MAPA, u.slice(6) || '');
    if (u.endsWith('/')) p = path.join(p, 'index.html');
    return envia(res, p);
  }
  envia(res, path.join(AJ, path.basename(u)));
}).listen(8767, '127.0.0.1', () => console.log('editor de plantas: http://127.0.0.1:8767/'));
