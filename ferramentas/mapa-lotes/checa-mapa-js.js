// Sintaxe do script inline do mapa (sem executar): extrai o último <script>…</script> e compila com new Function.
const fs = require('fs');
const s = fs.readFileSync('C:/Users/Usuario/Desktop/landing-page/mapa-lotes-indaiatuba/index.html', 'utf8');
const blocos = [...s.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m => m[1]);
const js = blocos[blocos.length - 1];
try { new Function(js); console.log('sintaxe ok:', js.length, 'chars,', (js.match(/\n/g) || []).length, 'linhas'); }
catch (e) { console.log('ERRO DE SINTAXE:', e.message); process.exit(1); }
for (const k of ['enquadrarTudo', 'fitBounds', 'invalidateSize', 'flyTo']) console.log(k, (js.match(new RegExp(k, 'g')) || []).length);
